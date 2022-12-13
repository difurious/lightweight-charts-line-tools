import { ChartModel } from '../../model/chart-model';
import { LineTool, LineToolPoint } from '../../model/line-tool';
import { PriceAxisBackgroundRenderer, PriceAxisBackgroundRendererData } from '../../renderers/price-axis-background-renderer';

import { PriceAxisView } from './price-axis-view';

export class LineToolPriceAxisBackgroundView extends PriceAxisView {
	protected _renderer: PriceAxisBackgroundRenderer = new PriceAxisBackgroundRenderer();
	protected _source: LineTool;
	protected _model: ChartModel;

	protected _rendererData: PriceAxisBackgroundRendererData = {
		color: 'rgba(41, 98, 255, 0.25)',
		visible: false,
		coordinate: 0,
		height: 0,
	};

	public constructor(lineTool: LineTool) {
		super();
		this._source = lineTool;
		this._model = lineTool.model();
		this._renderer.setData(this._rendererData);
	}

	protected _updateRendererData(): void {
		this._rendererData.visible = false;
		const priceScale = this._source.priceScale();

		if (!priceScale || priceScale.isEmpty()) { return; }
		if (!this._source.selected()) { return; }

		const x = this._source.priceAxisPoints().map((point: LineToolPoint) => {
			return priceScale.priceToCoordinate(point.price, point.price);
		});

		const max = Math.max(...x);
		const min = Math.min(...x);

		this._rendererData.coordinate = min;
		this._rendererData.height = max - min;
		this._rendererData.visible = true;
	}
}
