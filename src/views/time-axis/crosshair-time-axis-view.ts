import { ensureNotNull } from '../../helpers/assertions';
import { generateContrastColors } from '../../helpers/color';

import { ChartModel } from '../../model/chart-model';
import { Crosshair, TimeAndCoordinateProvider } from '../../model/crosshair';
import { TimeAxisViewRenderer, TimeAxisViewRendererData } from '../../renderers/time-axis-view-renderer';

import { ITimeAxisView } from './itime-axis-view';

export class CrosshairTimeAxisView implements ITimeAxisView {
	private _invalidated: boolean = true;
	private readonly _crosshair: Crosshair;
	private readonly _model: ChartModel;
	private readonly _valueProvider: TimeAndCoordinateProvider;
	private readonly _renderer: TimeAxisViewRenderer = new TimeAxisViewRenderer();
	private readonly _rendererData: TimeAxisViewRendererData = {
		visible: false,
		background: '#4c525e',
		color: 'white',
		text: '',
		width: 0,
		coordinate: NaN,
	};

	public constructor(crosshair: Crosshair, model: ChartModel, valueProvider: TimeAndCoordinateProvider) {
		this._crosshair = crosshair;
		this._model = model;
		this._valueProvider = valueProvider;
	}

	public update(): void {
		this._invalidated = true;
	}

	public renderer(): TimeAxisViewRenderer {
		if (this._invalidated) {
			this._updateImpl();
			this._invalidated = false;
		}

		this._renderer.setData(this._rendererData);

		return this._renderer;
	}

	private _updateImpl(): void {
		const data = this._rendererData;
		data.visible = false;

		const options = this._crosshair.options().vertLine;

		if (!options.labelVisible) {
			return;
		}

		const timeScale = this._model.timeScale();
		if (timeScale.isEmpty()) {
			return;
		}

		const currentTime = timeScale.floatIndexToTime(this._crosshair.appliedIndex());
		data.width = timeScale.width();

		// Useless. Not removed just to keep constructor arguments untouched.
		const value = this._valueProvider();
		data.coordinate = value.coordinate;
		/*if (!value.time) {
			return;
		}*/

		data.coordinate = timeScale.timeToCoordinate(ensureNotNull(currentTime));
		data.text = timeScale.formatDateTime(ensureNotNull(currentTime));
		data.visible = true;

		const colors = generateContrastColors(options.labelBackgroundColor);
		data.background = colors.background;
		data.color = colors.foreground;
	}
}
