import { deepCopy } from '../../helpers/deep-copy';

import { ChartModel } from '../../model/chart-model';
import { LineTool, LineToolOptionsInternal } from '../../model/line-tool';
import { LineToolType } from '../../model/line-tool-options';
// import { Point } from '../../model/point';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { SegmentRenderer } from '../../renderers/segment-renderer';
import { TextRenderer } from '../../renderers/text-renderer';

import { LineToolPaneView } from './line-tool-pane-view';

export class CalloutPaneView extends LineToolPaneView {
	protected _lineRenderer: SegmentRenderer = new SegmentRenderer();
	protected _labelRenderer: TextRenderer = new TextRenderer();

	public constructor(source: LineTool<LineToolType>, model: ChartModel) {
		super(source, model);
		this._renderer = null;
	}

	// eslint-disable-next-line complexity
	protected override _updateImpl(): void {
		this._renderer = null;
		this._invalidated = false;

		const priceScale = this._source.priceScale();
		const timeScale = this._model.timeScale();

		if (!priceScale || priceScale.isEmpty() || timeScale.isEmpty()) { return; }
		const strictRange = timeScale.visibleTimeRange();
		if (strictRange === null) { return; }
		const points = this._source.points();
		if (points.length < 2) { return; }

		const options = this._source.options() as LineToolOptionsInternal<'Callout'>;
		const isOutsideView = Math.max(points[0].timestamp, points[1].timestamp) < strictRange.from.timestamp;

		if (!isOutsideView || options.line.extend.left || options.line.extend.right) {
			super._updateImpl();

			if (this._points.length < 2) { return; }
			const compositeRenderer = new CompositeRenderer();
			this._lineRenderer.setData({ line: options.line, points: this._points });

			compositeRenderer.append(this._lineRenderer);
			if (options.text.value) {
				// make the 2nd click, point1 the text box
				const point1 = this._points[1];

				// Remove the angle calculation
				const angle = 0; // Set the angle to 0

				// Set pivot to point0
				const pivot = point1.clone();

				const labelOptions = deepCopy(options.text);
				labelOptions.box = { ...labelOptions.box, angle };

				this._labelRenderer.setData({ text: labelOptions, points: [pivot] });
				compositeRenderer.append(this._labelRenderer);
			}

			this.addAnchors(compositeRenderer);
			this._renderer = compositeRenderer;
		}
	}
}
