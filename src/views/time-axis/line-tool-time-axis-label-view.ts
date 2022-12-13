import { generateContrastColors } from '../../helpers/color';

import { ChartModel } from '../../model/chart-model';
import { LineTool } from '../../model/line-tool';
import { UTCTimestamp } from '../../model/time-data';
import { TimeAxisViewRenderer } from '../../renderers/time-axis-view-renderer';


import { ITimeAxisView } from './itime-axis-view';

export interface TimeAxisLabelRendererData {
	width: number;
	text: string;
	tickVisible: boolean;
	coordinate: number;
	color: string;
	background: string;
	visible: boolean;
}

export class LineToolTimeAxisLabelView implements ITimeAxisView {
	protected _source: LineTool;
	protected _pointIndex: number;
	protected _renderer: TimeAxisViewRenderer = new TimeAxisViewRenderer();
	protected _invalidated: boolean = true;
	protected _model: ChartModel;

	protected _rendererData: TimeAxisLabelRendererData = {
		background: '',
		coordinate: 0,
		color: '',
		text: '',
		width: 0,
		visible: false,
		tickVisible: false,
	};

	public constructor(model: ChartModel, lineTool: LineTool, pointIndex: number) {
		this._model = model;
		this._source = lineTool;
		this._pointIndex = pointIndex;
		this._renderer.setData(this._rendererData);
	}

	public update(): void {
		this._invalidated = true;
	}

	public renderer(): TimeAxisViewRenderer {
		if (this._invalidated) { this._updateImpl(); }
		this._invalidated = false;
		return this._renderer;
	}

	protected _updateImpl(): void {
		this._rendererData.visible = false;
		if (this._model.timeScale().isEmpty()) { return; }

		const background = this._getBackgroundColor();
		if (background === null) { return; }

		const timestamp = this._getTime();
		if (timestamp === null) { return; }

		const colors = generateContrastColors(background);
		this._rendererData.background = colors.background;
		this._rendererData.color = colors.foreground;

		this._rendererData.coordinate = this._model.timeScale().timeToCoordinate({ timestamp });
		this._rendererData.text = this._model.timeScale().formatDateTime({ timestamp });
		this._rendererData.width = this._model.timeScale().width();
		this._rendererData.visible = true;
		this._invalidated = false;
	}
	
	protected _getBackgroundColor(): string | null {
		return this._source.timeAxisLabelColor();
	}

	protected _getTime(): UTCTimestamp | null {
		const points = this._source.timeAxisPoints();
		return points.length <= this._pointIndex ? null : points[this._pointIndex].timestamp as UTCTimestamp;
	}
}
