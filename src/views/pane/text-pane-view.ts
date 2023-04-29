import { deepCopy } from '../../helpers/deep-copy';

import { ChartModel } from '../../model/chart-model';
import { LineTool, LineToolOptionsInternal } from '../../model/line-tool';
import { BoxHorizontalAlignment, BoxVerticalAlignment, LineToolType, TextAlignment, TextOptions } from '../../model/line-tool-options';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { TextRenderer } from '../../renderers/text-renderer';

import { LineToolPaneView } from './line-tool-pane-view';

export class TextPaneView extends LineToolPaneView {
	protected _labelRenderer: TextRenderer = new TextRenderer();

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

		const options = this._source.options() as LineToolOptionsInternal<'Text'>;
		const data = deepCopy(options.text) as TextOptions;
		data.box.alignment = { vertical: BoxVerticalAlignment.Top, horizontal: BoxHorizontalAlignment.Center };
		data.alignment = TextAlignment.Center;
		const point = this._points[0].clone();

		const compositeRenderer = new CompositeRenderer();
		this._labelRenderer.setData({ text: data, points: [point] });

		compositeRenderer.append(this._labelRenderer);
		this.addAnchors(compositeRenderer);
		this._renderer = compositeRenderer;
	}
}
