import { IPriceFormatter } from '../formatters/iprice-formatter';

import { Delegate } from '../helpers/delegate';
import { IDestroyable } from '../helpers/idestroyable';
import { DeepPartial, merge } from '../helpers/strict-type-checks';

import { IPaneView } from '../views/pane/ipane-view';
import { IUpdatablePaneView } from '../views/pane/iupdatable-pane-view';
import { LineToolPriceAxisBackgroundView } from '../views/price-axis/line-tool-price-axis-background-view';
import { LineToolPriceAxisLabelView } from '../views/price-axis/line-tool-price-axis-label-view';
import { PriceAxisView } from '../views/price-axis/price-axis-view';
import { ITimeAxisView } from '../views/time-axis/itime-axis-view';
import { LineToolTimeAxisBackgroundView } from '../views/time-axis/line-tool-time-axis-background-view';
import { LineToolTimeAxisLabelView } from '../views/time-axis/line-tool-time-axis-label-view';

import { AutoscaleInfoImpl } from './autoscale-info-impl';
import { ChartModel } from './chart-model';
import { FirstValue, IPriceDataSource } from './iprice-data-source';
import { LineToolOptionsCommon, LineToolOptionsMap, LineToolPartialOptionsMap, LineToolType } from './line-tool-options';
import { Pane, PaneCursorType } from './pane';
import { Point } from './point';
import { PriceDataSource } from './price-data-source';
import { PriceScale } from './price-scale';
import { TimePointIndex, UTCTimestamp } from './time-data';
import { TimeScale } from './time-scale';

export interface LineToolPoint {
	price: number;
	timestamp: number;
}

export interface State<T extends LineToolType = LineToolType> {
	id: string;
	type: LineToolType;
	options: LineToolOptionsInternal<T>;
}

export interface LineToolHitTestData {
	pointIndex: number;
	cursorType: PaneCursorType;
}

export interface LineToolExport<T extends LineToolType> {
	id: string;
	toolType: LineToolType;
	options: LineToolOptionsInternal<T>;
	points: LineToolPoint[];
}

export type LineToolOptionsInternal<T extends LineToolType> = LineToolOptionsMap[T];
export type LineToolPartialOptionsInternal<T extends LineToolType> = LineToolPartialOptionsMap[T];

// export abstract class LineTool<T extends LineToolType = LineToolType> extends DataSource implements IDestroyable {
export abstract class LineTool<T extends LineToolType = LineToolType> extends PriceDataSource implements IDestroyable {
	protected _pointChanged: Delegate = new Delegate();
	protected _pointAdded: Delegate = new Delegate();
	protected _priceAxisViews: PriceAxisView[] = [];
	protected _timeAxisViews: ITimeAxisView[] = [];
	protected _paneViews: IUpdatablePaneView[] = [];

	protected readonly _options: LineToolOptionsInternal<T>;
	protected readonly _toolType!: LineToolType;

	protected _hovered: boolean = false;
	protected _selected: boolean = false;
	protected _finished: boolean = false;
	protected _editing: boolean = false;
	protected _creating: boolean = false;

	protected _ownerSource: IPriceDataSource | null = null;
	protected _lastPoint: LineToolPoint | null = null;
	protected _points: LineToolPoint[] = [];
	// protected _model: ChartModel;

	private _formatter!: IPriceFormatter;

	public constructor(model: ChartModel, options: LineToolOptionsInternal<T>, points: LineToolPoint[] = []) {
		super(model);
		// this._model = model;
		this._points = points;
		this._options = options;

		for (let i = 0; i < this.pointsCount(); i++) {
			this._priceAxisViews.push(new LineToolPriceAxisLabelView(this, i));
			this._timeAxisViews.push(new LineToolTimeAxisLabelView(model, this, i));
		}

		if (this.pointsCount() > 1) {
			this._priceAxisViews.push(new LineToolPriceAxisBackgroundView(this));
			this._timeAxisViews.push(new LineToolTimeAxisBackgroundView(this));
		}

		// TODO: iosif change to use the ownerSourceId
		// this._ownerSource = model.serieses().find((series: IPriceDataSource) => series.id() === this._options.ownerSourceId) || null;
		this._ownerSource = model.serieses()[0];
		this._finished = this._points.length >= (this.pointsCount() === -1 ? 2 : this.pointsCount());
		// if no point is provided, we consider that linetool is being created and the call to tryFinish will set it to false afterwards.
		// if points are provided, just get the inverse of _finished value.
		this._creating = this._points.length === 0 ? true : !this.finished();
	}

	public abstract pointsCount(): number;

	public finished(): boolean {
		return this._finished;
	}

	public tryFinish(): void {
		if (this._points.length >= Math.max(1, this.pointsCount())) {
			this._finished = true;
			this._selected = true;
			this._creating = false;
			this._lastPoint = null;
			this.model().updateSource(this);
		}
	}

	public points(): LineToolPoint[] {
		const points = [...this._points, ...(this._lastPoint ? [this._lastPoint] : [])];
		return this.pointsCount() === -1 ? points : points.slice(0, this.pointsCount());
	}

	public addPoint(point: LineToolPoint): void {
		this._points.push(point);
	}

	public getPoint(index: number): LineToolPoint | null {
		return this.points()[index] || null;
	}

	public setPoint(index: number, point: LineToolPoint): void {
		this._points[index].price = point.price;
		this._points[index].timestamp = point.timestamp;
	}

	public setPoints(points: LineToolPoint[]): void {
		this._points = points;
	}

	public setLastPoint(point: LineToolPoint | null): void {
		this._lastPoint = point;
	}

	public pointToScreenPoint(linePoint: LineToolPoint): Point | null {
		const baseValue = this.ownerSource()?.firstValue()?.value || 0;
		const priceScale = this.priceScale();
		const timeScale = this.timeScale();

		if (!priceScale || priceScale.isEmpty() || timeScale.isEmpty()) {
			return null;
		}

		const x = timeScale.timeToCoordinate({ timestamp: linePoint.timestamp as UTCTimestamp });
		const y = priceScale.priceToCoordinate(linePoint.price, baseValue);

		return new Point(x, y);
	}

	public screenPointToPoint(point: Point): LineToolPoint | null {
		const baseValue = this.ownerSource()?.firstValue()?.value || 0;
		const priceScale = this.priceScale();
		const timeScale = this.timeScale();

		if (!priceScale) {
			return null;
		}

		const price = priceScale.coordinateToPrice(point.y, baseValue);
		const timestamp = timeScale.coordinateToTime(point.x).timestamp;

		return { price, timestamp };
	}

	public state(): State<T> {
		return { id: this.id(), type: this._toolType, options: this._options };
	}

	public override priceScale(): PriceScale | null {
		// TODO: iosif update to use the onwer source price scale
		return this.model().panes()[0].rightPriceScale();
		// return this._ownerSource ? this._ownerSource.priceScale() : null;
	}

	public timeScale(): TimeScale {
		return this.model().timeScale();
	}

	public ownerSource(): IPriceDataSource | null {
		return this._ownerSource;
	}

	public options(): LineToolOptionsInternal<T> {
		return this._options;
	}

	public override visible(): boolean {
		return this._options.visible;
	}

	public applyOptions(options: LineToolPartialOptionsInternal<T> | DeepPartial<LineToolOptionsCommon>): void {
		merge(this._options, options);
		this.model().updateSource(this);

		this._paneViews.forEach((paneView: IUpdatablePaneView) => {
			paneView.update('options');
		});
	}

	public paneViews(pane?: Pane): readonly IPaneView[] {
		return this._paneViews;
	}

	public updateAllViews(): void {
		if (!this.options().visible) { return; }
		this._updateAllPaneViews();

		for (let i = 0; i < this._priceAxisViews.length; i++) {
			this._priceAxisViews[i].update();
		}

		for (let i = 0; i < this._timeAxisViews.length; i++) {
			this._timeAxisViews[i].update();
		}
	}

	public hovered(): boolean {
		return this._hovered;
	}

	public setHovered(hovered: boolean): boolean {
		const changed = hovered !== this._hovered;
		this._hovered = hovered;
		return changed;
	}

	public selected(): boolean {
		return this._selected;
	}

	public setSelected(selected: boolean): boolean {
		const changed = selected !== this._selected;
		this._selected = selected;

		if (changed) { this.updateAllViews(); }
		return changed;
	}

	public editing(): boolean {
		return this._editing;
	}

	public setEditing(editing: boolean): boolean {
		const changed = editing !== this._editing;
		this._editing = editing;
		return changed;
	}

	public creating(): boolean {
		return this._creating;
	}

	public setCreating(creating: boolean): boolean {
		const changed = creating !== this._creating;
		this._creating = creating;
		return changed;
	}

	// public model(): ChartModel {
		// return this._model;
	// }

	public toolType(): LineToolType {
		return this._toolType;
	}

	public destroy(): void {}

	public timeAxisPoints(): LineToolPoint[] {
		return this.points();
	}

	public priceAxisPoints(): LineToolPoint[] {
		return this.points();
	}

	public timeAxisLabelColor(): string | null {
		return this.selected() ? '#2962FF' : null;
	}

	public priceAxisLabelColor(): string | null {
		return this.selected() ? '#2962FF' : null;
	}

	public override timeAxisViews(): readonly ITimeAxisView[] {
		return this._timeAxisViews;
	}

	public override priceAxisViews(): readonly PriceAxisView[] {
		return this._priceAxisViews;
	}

	public lineDrawnWithPressedButton(): boolean {
		return false;
	}

	public hasMagnet(): boolean {
		return true;
	}

	// implementation of IPriceDataSource
	public minMove(): number {
		return 0;
		// return this._options.priceFormat.minMove;
	}

	public autoscaleInfo(startTimePoint: TimePointIndex, endTimePoint: TimePointIndex): AutoscaleInfoImpl | null {
		return null;
	}

	public firstValue(): FirstValue | null {
		return null;
	}

	public formatter(): IPriceFormatter {
		return this._formatter;
	}

	public priceLineColor(lastBarColor: string): string {
		return lastBarColor;
	}

	public exportLineToolToLineToolExport(): LineToolExport<T> {
		return { id: this.id(), toolType: this._toolType, options: this.options(), points: this.points() };
	}

	protected _setPaneViews(paneViews: IUpdatablePaneView[]): void {
		this._paneViews = paneViews;
	}

	protected _updateAllPaneViews(): void {
		this._paneViews.forEach((paneView: IUpdatablePaneView) => paneView.update());
	}
}
