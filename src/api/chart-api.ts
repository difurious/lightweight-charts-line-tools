/* eslint-disable @typescript-eslint/tslint/config */
import { ChartWidget, LineToolsAfterEditEventParamsImpl, LineToolsAfterEditEventParamsImplSupplier, LineToolsDoubleClickEventParamsImpl, LineToolsDoubleClickEventParamsImplSupplier, MouseEventParamsImpl, MouseEventParamsImplSupplier } from '../gui/chart-widget';

import { ensureDefined } from '../helpers/assertions';
import { Delegate } from '../helpers/delegate';
import { warn } from '../helpers/logger';
import { clone, DeepPartial, isBoolean, merge } from '../helpers/strict-type-checks';

import { BarPrice, BarPrices } from '../model/bar';
import { ChartOptions, ChartOptionsInternal } from '../model/chart-model';
import { ColorType } from '../model/layout-options';
import { LineTool, LineToolExport, LineToolPoint } from '../model/line-tool';
import { LineToolOptionsMap, LineToolPartialOptionsMap, LineToolType } from '../model/line-tool-options';
import { Pane } from '../model/pane';
import { Series } from '../model/series';
import {
	AreaSeriesOptions,
	AreaSeriesPartialOptions,
	BarSeriesOptions,
	BarSeriesPartialOptions,
	BaselineSeriesOptions,
	BaselineSeriesPartialOptions,
	CandlestickSeriesOptions,
	CandlestickSeriesPartialOptions,
	fillUpDownCandlesticksColors,
	HistogramSeriesOptions,
	HistogramSeriesPartialOptions,
	LineSeriesOptions,
	LineSeriesPartialOptions,
	precisionByMinMove,
	PriceFormat,
	PriceFormatBuiltIn,
	SeriesType,
} from '../model/series-options';

import { CandlestickSeriesApi } from './candlestick-series-api';
import { DataUpdatesConsumer, SeriesDataItemTypeMap } from './data-consumer';
import { DataLayer, DataUpdateResponse, SeriesChanges } from './data-layer';
import { IChartApi, LineToolsAfterEditEventHandler, LineToolsAfterEditEventParams, LineToolsDoubleClickEventHandler, LineToolsDoubleClickEventParams, MouseEventHandler, MouseEventParams } from './ichart-api';
import { IPriceScaleApi } from './iprice-scale-api';
import { ISeriesApi } from './iseries-api';
import { ITimeScaleApi } from './itime-scale-api';
import { LineToolApi } from './line-tool-api';
import { chartOptionsDefaults } from './options/chart-options-defaults';
import { LineToolsOptionDefaults } from './options/line-tools-options-defaults';
import {
	areaStyleDefaults,
	barStyleDefaults,
	baselineStyleDefaults,
	candlestickStyleDefaults,
	histogramStyleDefaults,
	lineStyleDefaults,
	seriesOptionsDefaults,
} from './options/series-options-defaults';
import { PriceScaleApi } from './price-scale-api';
import { migrateOptions, SeriesApi } from './series-api';
import { TimeScaleApi } from './time-scale-api';

function patchPriceFormat(priceFormat?: DeepPartial<PriceFormat>): void {
	if (priceFormat === undefined || priceFormat.type === 'custom') {
		return;
	}
	const priceFormatBuiltIn = priceFormat as DeepPartial<PriceFormatBuiltIn>;
	if (priceFormatBuiltIn.minMove !== undefined && priceFormatBuiltIn.precision === undefined) {
		priceFormatBuiltIn.precision = precisionByMinMove(priceFormatBuiltIn.minMove);
	}
}

function migrateHandleScaleScrollOptions(options: DeepPartial<ChartOptions>): void {
	if (isBoolean(options.handleScale)) {
		const handleScale = options.handleScale;
		options.handleScale = {
			axisDoubleClickReset: handleScale,
			axisPressedMouseMove: {
				time: handleScale,
				price: handleScale,
			},
			mouseWheel: handleScale,
			pinch: handleScale,
		};
	} else if (options.handleScale !== undefined && isBoolean(options.handleScale.axisPressedMouseMove)) {
		const axisPressedMouseMove = options.handleScale.axisPressedMouseMove;
		options.handleScale.axisPressedMouseMove = {
			time: axisPressedMouseMove,
			price: axisPressedMouseMove,
		};
	}

	const handleScroll = options.handleScroll;
	if (isBoolean(handleScroll)) {
		options.handleScroll = {
			horzTouchDrag: handleScroll,
			vertTouchDrag: handleScroll,
			mouseWheel: handleScroll,
			pressedMouseMove: handleScroll,
		};
	}
}

function migratePriceScaleOptions(options: DeepPartial<ChartOptions>): void {
	/* eslint-disable deprecation/deprecation */
	if (options.priceScale) {
		warn('"priceScale" option has been deprecated, use "leftPriceScale", "rightPriceScale" and "overlayPriceScales" instead');

		options.leftPriceScale = options.leftPriceScale || {};
		options.rightPriceScale = options.rightPriceScale || {};

		const position = options.priceScale.position;
		delete options.priceScale.position;

		options.leftPriceScale = merge(options.leftPriceScale, options.priceScale);
		options.rightPriceScale = merge(options.rightPriceScale, options.priceScale);

		if (position === 'left') {
			options.leftPriceScale.visible = true;
			options.rightPriceScale.visible = false;
		}
		if (position === 'right') {
			options.leftPriceScale.visible = false;
			options.rightPriceScale.visible = true;
		}
		if (position === 'none') {
			options.leftPriceScale.visible = false;
			options.rightPriceScale.visible = false;
		}
		// copy defaults for overlays
		options.overlayPriceScales = options.overlayPriceScales || {};
		if (options.priceScale.invertScale !== undefined) {
			options.overlayPriceScales.invertScale = options.priceScale.invertScale;
		}
		// do not migrate mode for backward compatibility
		if (options.priceScale.scaleMargins !== undefined) {
			options.overlayPriceScales.scaleMargins = options.priceScale.scaleMargins;
		}
	}
	/* eslint-enable deprecation/deprecation */
}

export function migrateLayoutOptions(options: DeepPartial<ChartOptions>): void {
	/* eslint-disable deprecation/deprecation */
	if (!options.layout) {
		return;
	}
	if (options.layout.backgroundColor && !options.layout.background) {
		options.layout.background = { type: ColorType.Solid, color: options.layout.backgroundColor };
	}
	/* eslint-enable deprecation/deprecation */
}

function toInternalOptions(options: DeepPartial<ChartOptions>): DeepPartial<ChartOptionsInternal> {
	migrateHandleScaleScrollOptions(options);
	migratePriceScaleOptions(options);
	migrateLayoutOptions(options);

	return options as DeepPartial<ChartOptionsInternal>;
}

export type IPriceScaleApiProvider = Pick<IChartApi, 'priceScale'>;

export class ChartApi implements IChartApi, DataUpdatesConsumer<SeriesType> {
	private _chartWidget: ChartWidget;
	private _dataLayer: DataLayer = new DataLayer();
	private readonly _seriesMap: Map<SeriesApi<SeriesType>, Series> = new Map();
	private readonly _seriesMapReversed: Map<Series, SeriesApi<SeriesType>> = new Map();

	private readonly _clickedDelegate: Delegate<MouseEventParams> = new Delegate();
	private readonly _crosshairMovedDelegate: Delegate<MouseEventParams> = new Delegate();
	private readonly _lineToolsDoubleClickDelegate: Delegate<LineToolsDoubleClickEventParams> = new Delegate();
	private readonly _lineToolsAfterEditDelegate: Delegate<LineToolsAfterEditEventParams> = new Delegate();

	private readonly _timeScaleApi: TimeScaleApi;

	public constructor(container: HTMLElement, options?: DeepPartial<ChartOptions>) {
		const internalOptions = (options === undefined) ?
			clone(chartOptionsDefaults) :
			merge(clone(chartOptionsDefaults), toInternalOptions(options)) as ChartOptionsInternal;

		this._chartWidget = new ChartWidget(container, internalOptions);

		this._chartWidget.clicked().subscribe(
			(paramSupplier: MouseEventParamsImplSupplier) => {
				if (this._clickedDelegate.hasListeners()) {
					this._clickedDelegate.fire(this._convertMouseParams(paramSupplier()));
				}
			},
			this
		);
		this._chartWidget.crosshairMoved().subscribe(
			(paramSupplier: MouseEventParamsImplSupplier) => {
				if (this._crosshairMovedDelegate.hasListeners()) {
					this._crosshairMovedDelegate.fire(this._convertMouseParams(paramSupplier()));
				}
			},
			this
		);

		this._chartWidget.lineToolsDoubleClick().subscribe(
			(paramSupplier: LineToolsDoubleClickEventParamsImplSupplier) => {
				if (this._lineToolsDoubleClickDelegate.hasListeners()) {
					this._lineToolsDoubleClickDelegate.fire(this._convertLineToolsDoubleClickParams(paramSupplier()));
				}
			},
			this
		);

		this._chartWidget.lineToolsAfterEdit().subscribe(
			(paramSupplier: LineToolsAfterEditEventParamsImplSupplier) => {
				if (this._lineToolsAfterEditDelegate.hasListeners()) {
					this._lineToolsAfterEditDelegate.fire(this._convertLineToolsAfterEditParams(paramSupplier()));
				}
			},
			this
		);

		const model = this._chartWidget.model();
		this._timeScaleApi = new TimeScaleApi(model, this._chartWidget.timeAxisWidget());
	}

	public setCrossHairXY(x: number, y: number, visible: boolean): void {
		this._chartWidget.paneWidgets()[0].setCrossHair(x, y, visible);
	}

	public clearCrossHair(): void {
		this._chartWidget.paneWidgets()[0].clearCrossHair();
	}

	public remove(): void {
		this._chartWidget.clicked().unsubscribeAll(this);
		this._chartWidget.crosshairMoved().unsubscribeAll(this);
		this._chartWidget.lineToolsDoubleClick().unsubscribeAll(this);
		this._chartWidget.lineToolsAfterEdit().unsubscribeAll(this);

		this._timeScaleApi.destroy();
		this._chartWidget.destroy();

		this._seriesMap.clear();
		this._seriesMapReversed.clear();

		this._clickedDelegate.destroy();
		this._crosshairMovedDelegate.destroy();
		this._lineToolsDoubleClickDelegate.destroy();
		this._lineToolsAfterEditDelegate.destroy();
		this._dataLayer.destroy();
	}

	public resize(width: number, height: number, forceRepaint?: boolean): void {
		this._chartWidget.resize(width, height, forceRepaint);
	}

	public addAreaSeries(options: AreaSeriesPartialOptions = {}): ISeriesApi<'Area'> {
		options = migrateOptions(options);
		patchPriceFormat(options.priceFormat);

		const strictOptions = merge(clone(seriesOptionsDefaults), areaStyleDefaults, options) as AreaSeriesOptions;
		const series = this._chartWidget.model().createSeries('Area', strictOptions);

		const res = new SeriesApi<'Area'>(series, this, this);
		this._seriesMap.set(res, series);
		this._seriesMapReversed.set(series, res);

		return res;
	}

	public addBaselineSeries(options: BaselineSeriesPartialOptions = {}): ISeriesApi<'Baseline'> {
		options = migrateOptions(options);
		patchPriceFormat(options.priceFormat);

		// to avoid assigning fields to defaults we have to clone them
		const strictOptions = merge(clone(seriesOptionsDefaults), clone(baselineStyleDefaults), options) as BaselineSeriesOptions;
		const series = this._chartWidget.model().createSeries('Baseline', strictOptions);

		const res = new SeriesApi<'Baseline'>(series, this, this);
		this._seriesMap.set(res, series);
		this._seriesMapReversed.set(series, res);

		return res;
	}

	public addBarSeries(options: BarSeriesPartialOptions = {}): ISeriesApi<'Bar'> {
		options = migrateOptions(options);
		patchPriceFormat(options.priceFormat);

		const strictOptions = merge(clone(seriesOptionsDefaults), barStyleDefaults, options) as BarSeriesOptions;
		const series = this._chartWidget.model().createSeries('Bar', strictOptions);

		const res = new SeriesApi<'Bar'>(series, this, this);
		this._seriesMap.set(res, series);
		this._seriesMapReversed.set(series, res);

		return res;
	}

	public addCandlestickSeries(options: CandlestickSeriesPartialOptions = {}): ISeriesApi<'Candlestick'> {
		options = migrateOptions(options);
		fillUpDownCandlesticksColors(options);
		patchPriceFormat(options.priceFormat);

		const strictOptions = merge(clone(seriesOptionsDefaults), candlestickStyleDefaults, options) as CandlestickSeriesOptions;
		const series = this._chartWidget.model().createSeries('Candlestick', strictOptions);

		const res = new CandlestickSeriesApi(series, this, this);
		this._seriesMap.set(res, series);
		this._seriesMapReversed.set(series, res);

		return res;
	}

	public addHistogramSeries(options: HistogramSeriesPartialOptions = {}): ISeriesApi<'Histogram'> {
		options = migrateOptions(options);
		patchPriceFormat(options.priceFormat);

		const strictOptions = merge(clone(seriesOptionsDefaults), histogramStyleDefaults, options) as HistogramSeriesOptions;
		const series = this._chartWidget.model().createSeries('Histogram', strictOptions);

		const res = new SeriesApi<'Histogram'>(series, this, this);
		this._seriesMap.set(res, series);
		this._seriesMapReversed.set(series, res);

		return res;
	}

	public addLineSeries(options: LineSeriesPartialOptions = {}): ISeriesApi<'Line'> {
		options = migrateOptions(options);
		patchPriceFormat(options.priceFormat);

		const strictOptions = merge(clone(seriesOptionsDefaults), lineStyleDefaults, options) as LineSeriesOptions;
		const series = this._chartWidget.model().createSeries('Line', strictOptions);

		const res = new SeriesApi<'Line'>(series, this, this);
		this._seriesMap.set(res, series);
		this._seriesMapReversed.set(series, res);

		return res;
	}

	public removeSeries(seriesApi: SeriesApi<SeriesType>): void {
		const series = ensureDefined(this._seriesMap.get(seriesApi));

		const update = this._dataLayer.removeSeries(series);
		const model = this._chartWidget.model();
		model.removeSeries(series);

		this._sendUpdateToChart(update);

		this._seriesMap.delete(seriesApi);
		this._seriesMapReversed.delete(series);
	}

	public addLineTool<T extends LineToolType>(name: T, points: LineToolPoint[], options?: LineToolPartialOptionsMap[T]): LineToolApi<T> {
		const strictOptions = merge(clone(LineToolsOptionDefaults[name]), options || {}) as LineToolOptionsMap[T];
		const tool = this._chartWidget.model().createLineTool(name, strictOptions, points);
		return new LineToolApi<T>(tool);
	}

	public setActiveLineTool<T extends LineToolType>(name: T, options?: LineToolPartialOptionsMap[T]): void {
		this._chartWidget.model().lineToolCreator().setActiveLineTool(name, options);
	}

	public removeLineToolsById(ids: string[]): void {
		if (Array.isArray(ids)) {
			const pane = this._getPane();
			if (pane === null) { return; }
			ids.forEach((id: string) => {
				const lineToolToRemove = pane.getLineTool(id);
				if (lineToolToRemove === null) {
					return;
				}
				pane.removeDataSource(lineToolToRemove);
			});
			pane.recalculate();
		}
		return;
	}

	public getSelectedLineTools(): string {
		let lineToolsOptions: LineToolExport<LineToolType>[] = [];
		const pane = this._getPane();
		if (pane === null) { return JSON.stringify(lineToolsOptions); }
		const selectedLineTools = pane.getSelectedLineTools();
		if (selectedLineTools.length > 0) {
			lineToolsOptions = selectedLineTools.map((l: LineTool<LineToolType>) => l.exportLineToolToLineToolExport());
		}
		return JSON.stringify(lineToolsOptions);
	}

	public removeSelectedLineTools(): void {
		const pane = this._getPane();
		if (pane === null) { return; }
		const selectedLineTools = pane.getSelectedLineTools();
		if (selectedLineTools.length > 0) {
			selectedLineTools.forEach((line: LineTool<LineToolType>) => { pane.removeDataSource(line); });
			pane.recalculate();
		}
	}

	public removeAllLineTools(): void {
		const pane = this._getPane();
		if (pane === null) { return; }
		const selectedLineTools = pane.getAllLineTools();
		if (selectedLineTools.length > 0) {
			selectedLineTools.forEach((line: LineTool<LineToolType>) => { pane.removeDataSource(line); });
			pane.recalculate();
		}
	}

	public exportLineTools(): string {
		let lineToolsOptions: LineToolExport<LineToolType>[] = [];
		const pane = this._getPane();
		if (pane === null) {
			return JSON.stringify(lineToolsOptions);
		}
		const lineTools = pane.getAllLineTools();
		if (lineTools.length > 0) {
			lineToolsOptions = lineTools.map((l: LineTool<LineToolType>) => l.exportLineToolToLineToolExport());
		}
		return JSON.stringify(lineToolsOptions);
	}

	public importLineTools(json: string): boolean {
		if (json === 'undefined' || !json) {
			return false;
		}
		const lineTools = JSON.parse(json) as LineToolExport<LineToolType>[];

		lineTools.forEach((line: LineToolExport<LineToolType>) => {
			const lineToolApi = this.addLineTool<LineToolType>(line.toolType, line.points, line.options);
			lineToolApi.lineTool.setId(line.id);
		});

		const pane = this._getPane();
		if (pane !== null) {
			pane.recalculate();
		}
		return true;
	}

	public applyLineToolOptions(newLineTool: LineToolExport<LineToolType>): boolean {
		const pane = this._getPane();
		if (pane === null) {
			return false;
		}

		const lineTool = pane.getLineTool(newLineTool.id);
		if (lineTool === null) {
			return false;
		}

		if (lineTool.selected()) {
			lineTool.setSelected(false);
		}

		lineTool.setPoints(newLineTool.points);
		const lineToolApi = new LineToolApi(lineTool);
		lineToolApi.applyOptions(newLineTool.options);

		return true;
	}

	public createOrUpdateLineTool<T extends LineToolType>(
        lineToolType: T,
        points: LineToolPoint[],
        options: LineToolPartialOptionsMap[T],
        id: string
    ): void {
		const pane = this._getPane();
		if (pane === null) { return; }

		// get the current pane's tool by id.
        const existingLineTool = pane.getLineTool(id);
		// id exists, so update that line tool id
        if (existingLineTool !== null) {
            // Update existing line tool, assuming applyOptions will recalulate the pane by iteslf
            const lineToolApi = new LineToolApi(existingLineTool);
            lineToolApi.setPoints(points);
            lineToolApi.applyOptions(options);
        } else {
            // Create new line tool
            const lineToolApi = this.addLineTool(lineToolType, points, options);
            lineToolApi.lineTool.setId(id);
        }
		// Recalculate i dont think is needed, seems like it recalculates on it own
        // pane.recalculate();
    }

	/**
	 * Retrieves a LineTool by its ID.
	 *
     * @param id - The ID of the line tool to retrieve.
     * @returns A JSON string representation of the LineTool, or an empty array as a string if no line tool is found.
     */
    public getLineToolByID(id: string): string {
        const pane = this._getPane();
        if (pane === null) {
            return JSON.stringify([]); // Return empty array if no pane is active
        }

        const lineTool = pane.getLineTool(id);
        if (lineTool === null) {
            return JSON.stringify([]); // Return empty array if line tool not found
        }

        return JSON.stringify([lineTool.exportLineToolToLineToolExport()]);
    }

	/**
	* Retrieves multiple LineTools whose IDs match a given regular expression.
	*
	* @param regex - The regular expression to match against LineTool IDs.
	* @returns A JSON string representing an array of matching LineTools
	* (in the `LineToolExport` format), or an empty array as a
	* string if no matching line tools are found.
	*/
	public getLineToolsByIdRegex(regex: RegExp): string {
		// Validate input
		if (!(regex instanceof RegExp)) {
			return JSON.stringify([]); // Return an empty array for invalid input
		}

		// Get the active pane from the chart
		const pane = this._getPane();

		// Handle the case where there's no active pane
		if (pane === null) {
			return JSON.stringify([]); // Return an empty JSON array
		}

		// Get all LineTools from the active pane
		const allLineTools = pane.getAllLineTools();
		const exportedTools = []; // Array to store exported tools

		// Manually loop through line tools
		for (const tool of allLineTools) {
			// GOTCHA without resetting the index to 0, it will have eratic behavior matching results.
			// if you do not have the g (global) flag it would work fine, but the user should not have to know to use the g flag or not
			// I will just handle it here and they can use the g flag.
			regex.lastIndex = 0;
			if (regex.test(tool.id())) {
				exportedTools.push(tool.exportLineToolToLineToolExport());
			}
		}

		// Convert the array of exported tools to a JSON string and return it
		return JSON.stringify(exportedTools);
	}

	/**
	 * Removes LineTools whose IDs match a given regular expression.
	 *
	 * @param regex - The regular expression to match against LineTool IDs.
	 */
	public removeLineToolsByIdRegex(regex: RegExp): void {
		if (!(regex instanceof RegExp)) {
			return; // Do nothing if invalid input
		}

		const pane = this._getPane();
		if (pane === null) {
			return; // No active pane
		}

		const allLineTools = pane.getAllLineTools();

		// Manually loop through line tools
		for (const tool of allLineTools) {
			// GOTCHA without resetting the index to 0, it will have eratic behavior matching results.
			// if you do not have the g (global) flag it would work fine, but the user should not have to know to use the g flag or not
			// I will just handle it here and they can use the g flag.
			regex.lastIndex = 0;
			if (regex.test(tool.id())) { // Check for a match
				pane.removeDataSource(tool); // Remove if it matches
			}
		}

		// Recalculate the pane after removal
		pane.recalculate();
	}

	public applyNewData<TSeriesType extends SeriesType>(series: Series<TSeriesType>, data: SeriesDataItemTypeMap[TSeriesType][]): void {
		this._sendUpdateToChart(this._dataLayer.setSeriesData(series, data));
	}

	public updateData<TSeriesType extends SeriesType>(series: Series<TSeriesType>, data: SeriesDataItemTypeMap[TSeriesType]): void {
		this._sendUpdateToChart(this._dataLayer.updateSeriesData(series, data));
	}

	public subscribeClick(handler: MouseEventHandler): void {
		this._clickedDelegate.subscribe(handler);
	}

	public unsubscribeClick(handler: MouseEventHandler): void {
		this._clickedDelegate.unsubscribe(handler);
	}

	public subscribeCrosshairMove(handler: MouseEventHandler): void {
		this._crosshairMovedDelegate.subscribe(handler);
	}

	public unsubscribeCrosshairMove(handler: MouseEventHandler): void {
		this._crosshairMovedDelegate.unsubscribe(handler);
	}

	public subscribeLineToolsDoubleClick(handler: LineToolsDoubleClickEventHandler): void {
		this._lineToolsDoubleClickDelegate.subscribe(handler);
	}

	public unsubscribeLineToolsDoubleClick(handler: LineToolsDoubleClickEventHandler): void {
		this._lineToolsDoubleClickDelegate.unsubscribe(handler);
	}

	public subscribeLineToolsAfterEdit(handler: LineToolsAfterEditEventHandler): void {
		this._lineToolsAfterEditDelegate.subscribe(handler);
	}

	public unsubscribeLineToolsAfterEdit(handler: LineToolsAfterEditEventHandler): void {
		this._lineToolsAfterEditDelegate.unsubscribe(handler);
	}

	public priceScale(priceScaleId?: string): IPriceScaleApi {
		if (priceScaleId === undefined) {
			warn('Using ChartApi.priceScale() method without arguments has been deprecated, pass valid price scale id instead');
			priceScaleId = this._chartWidget.model().defaultVisiblePriceScaleId();
		}

		return new PriceScaleApi(this._chartWidget, priceScaleId);
	}

	public timeScale(): ITimeScaleApi {
		return this._timeScaleApi;
	}

	public applyOptions(options: DeepPartial<ChartOptions>): void {
		this._chartWidget.applyOptions(toInternalOptions(options));
	}

	public options(): Readonly<ChartOptions> {
		return this._chartWidget.options() as Readonly<ChartOptions>;
	}

	public takeScreenshot(): HTMLCanvasElement {
		return this._chartWidget.takeScreenshot();
	}

	private _sendUpdateToChart(update: DataUpdateResponse): void {
		const model = this._chartWidget.model();

		model.updateTimeScale(update.timeScale.baseIndex, update.timeScale.points, update.timeScale.firstChangedPointIndex);
		update.series.forEach((value: SeriesChanges, series: Series) => series.setData(value.data, value.info));

		model.recalculateAllPanes();
	}

	private _mapSeriesToApi(series: Series): ISeriesApi<SeriesType> {
		return ensureDefined(this._seriesMapReversed.get(series));
	}

	private _getPane(): Pane | null {
		return this._chartWidget.model().getActivePane();
	}

	private _convertMouseParams(param: MouseEventParamsImpl): MouseEventParams {
		const seriesPrices = new Map<ISeriesApi<SeriesType>, BarPrice | BarPrices>();
		param.seriesPrices.forEach((price: BarPrice | BarPrices, series: Series) => {
			seriesPrices.set(this._mapSeriesToApi(series), price);
		});

		const hoveredSeries = param.hoveredSeries === undefined ? undefined : this._mapSeriesToApi(param.hoveredSeries);

		return {
			time: param.time && (param.time.businessDay || param.time.timestamp),
			point: param.point,
			hoveredSeries,
			hoveredMarkerId: param.hoveredObject,
			seriesPrices,
		};
	}

	private _convertLineToolsDoubleClickParams(param: LineToolsDoubleClickEventParamsImpl): LineToolsDoubleClickEventParams {
		return {
			selectedLineTool: param.selectedLineTool,
		};
	}

	private _convertLineToolsAfterEditParams(param: LineToolsAfterEditEventParamsImpl): LineToolsAfterEditEventParams {
		return {
			selectedLineTool: param.selectedLineTool,
			stage: param.stage,
		};
	}
}
