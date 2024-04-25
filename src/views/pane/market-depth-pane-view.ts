import { deepCopy } from '../../helpers/deep-copy';

import { ChartModel } from '../../model/chart-model';
import { LineTool, LineToolOptionsInternal } from '../../model/line-tool';
import { BoxHorizontalAlignment, BoxVerticalAlignment, LineToolType, MarketDepthOptions, TextAlignment, TextOptions } from '../../model/line-tool-options';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { MarketDepthRenderer } from '../../renderers/market-depth-renderer';

import { LineToolPaneView } from './line-tool-pane-view';

export class MarketDepthPaneView extends LineToolPaneView {
	protected _labelRenderer: MarketDepthRenderer = new MarketDepthRenderer();

	public constructor(source: LineTool<LineToolType>, model: ChartModel) {
		super(source, model);
		this._renderer = null;
	}

	protected override _updateImpl(height: number, width: number): void {
		this._renderer = null;

		const priceScale = this._source.priceScale();
		const timeScale = this._model.timeScale();
		if (!priceScale || priceScale.isEmpty() || timeScale.isEmpty()) { return; }

		super._updateImpl();
		if (this._points.length < 1) { return; }

		const options = this._source.options() as LineToolOptionsInternal<'MarketDepth'>;
		const data = deepCopy(options.text) as TextOptions;
		const marketDepthOptions = deepCopy(options.marketDepth) as MarketDepthOptions;
		// const data = options.text;
		data.box.alignment = { vertical: BoxVerticalAlignment.Top, horizontal: BoxHorizontalAlignment.Center };
		data.alignment = TextAlignment.Center;
		const point = this._points[0].clone();

		const compositeRenderer = new CompositeRenderer();
		this._labelRenderer.setData({ text: data, points: [point], marketDepth: marketDepthOptions, priceScale });

		compositeRenderer.append(this._labelRenderer);
		this.addAnchors(compositeRenderer);
		this._renderer = compositeRenderer;
	}
}
