import { ChartModel } from '../../model/chart-model';
import { LineTool, LineToolPoint } from '../../model/line-tool';
import { UTCTimestamp } from '../../model/time-data';
import { TimeAxisBackgroundRenderer as TimeAxisBackgroundRenderer, TimeAxisBackgroundRendererData } from '../../renderers/time-axis-background-renderer';
import { ITimeAxisViewRenderer } from '../../renderers/itime-axis-view-renderer';

import { ITimeAxisView } from './itime-axis-view';

export class LineToolTimeAxisBackgroundView implements ITimeAxisView {
	protected _renderer: TimeAxisBackgroundRenderer = new TimeAxisBackgroundRenderer();
	protected _invalidated: boolean = true;
	protected _source: LineTool;
	protected _model: ChartModel;

	protected _rendererData: TimeAxisBackgroundRendererData = {
		color: 'rgba(41, 98, 255, 0.25)',
		visible: false,
		coordinate: 0,
		width: 0,
	};

	public constructor(lineTool: LineTool) {
		this._source = lineTool;
		this._model = lineTool.model();
		this._renderer.setData(this._rendererData);
	}

	public update(): void {
		this._invalidated = true;
	}

	public renderer(): ITimeAxisViewRenderer {
		if (this._invalidated) { this._updateImpl(); }
		this._invalidated = false;
		return this._renderer;
	}

	protected _updateImpl(): void {
		this._rendererData.visible = false;

		if (this._model.timeScale().isEmpty()) { return; }
		if (!this._source.selected()) { return; }

		const y = this._source.timeAxisPoints().map((point: LineToolPoint) => {
			return this._model.timeScale().timeToCoordinate({ timestamp: point.timestamp as UTCTimestamp });
		});

		const max = Math.max(...y);
		const min = Math.min(...y);

		this._rendererData.coordinate = min;
		this._rendererData.width = max - min;
		this._rendererData.visible = true;
		this._invalidated = false;
	}
}
