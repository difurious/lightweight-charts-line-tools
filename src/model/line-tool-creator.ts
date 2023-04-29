import { LineToolsOptionDefaults } from '../api/options/line-tools-options-defaults';

import { IInputEventListener, InputEventType, TouchMouseEvent } from '../gui/mouse-event-handler';
import { PaneWidget } from '../gui/pane-widget';

import { clone, merge } from '../helpers/strict-type-checks';

import { ChartModel } from './chart-model';
import { IDataSource } from './idata-source';
import { LineTool } from './line-tool';
import { LineToolOptions, LineToolPartialOptions, LineToolPartialOptionsMap, LineToolType } from './line-tool-options';
import { LineTools } from './line-tools';

export class LineToolCreator implements IInputEventListener {
	protected _lastLineTool: LineTool<LineToolType> | null = null;
	protected _activeOptions: LineToolPartialOptions<unknown> | null = null;
	protected _activeType: LineToolType | null = null;
	protected _model: ChartModel;

	public constructor(model: ChartModel) {
		this._model = model;
	}

	public setActiveLineTool<T extends LineToolType>(lineToolType: T, options?: LineToolPartialOptionsMap[T]): void {
		this._activeOptions = options || {};
		this._activeType = lineToolType;

		this._model.dataSources().forEach((source: IDataSource) => {
			if (source instanceof LineTool) {
				source.setSelected(false);
				source.setHovered(false);
				source.setEditing(false);
				source.setCreating(false);
			}
		});
		this._model.lightUpdate();
	}

	public hasActiveToolLine(): boolean {
		return this._activeType !== null;
	}

	public onInputEvent(paneWidget: PaneWidget, ctx: CanvasRenderingContext2D, eventType: InputEventType, event: TouchMouseEvent): void {
		if (!this._activeType || !this._activeOptions) { return; }
		event.consumed = true;
		if (eventType !== InputEventType.MouseDown) { return; }

		const priceScaleId = paneWidget.state().dataSources()[0].priceScale()?.id() || paneWidget.state().model().defaultVisiblePriceScaleId();
		const strictOptions = merge(clone(LineToolsOptionDefaults[this._activeType]), this._activeOptions || {}) as LineToolOptions<unknown>;

		this._lastLineTool = new LineTools[this._activeType](this._model, strictOptions, []);
		paneWidget.state().addDataSource(this._lastLineTool, priceScaleId);

		this._activeType = null;
		this._activeOptions = null;
	}
}
