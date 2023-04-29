import { deepCopy } from '../../helpers/deep-copy';

import { ChartModel } from '../../model/chart-model';
import { LineTool, LineToolOptionsInternal } from '../../model/line-tool';
import { BoxHorizontalAlignment, LineToolType } from '../../model/line-tool-options';
import { Point } from '../../model/point';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { SegmentRenderer } from '../../renderers/segment-renderer';
import { TextRenderer } from '../../renderers/text-renderer';

import { LineToolPaneView } from './line-tool-pane-view';

export class TrendLinePaneView extends LineToolPaneView {
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

		const options = this._source.options() as LineToolOptionsInternal<'TrendLine'>;
		const isOutsideView = Math.max(points[0].timestamp, points[1].timestamp) < strictRange.from.timestamp;

		if (!isOutsideView || options.line.extend.left || options.line.extend.right) {
			super._updateImpl();

			if (this._points.length < 2) { return; }
			const compositeRenderer = new CompositeRenderer();
			this._lineRenderer.setData({ line: options.line, points: this._points });

			compositeRenderer.append(this._lineRenderer);
			if (options.text.value) {
				const point0 = this._points[0];
				const point1 = this._points[1];
				const start = point0.x < point1.x ? point0 : point1;
				const end = start === point0 ? point1 : point0;

				const angle = Math.atan((end.y - start.y) / (end.x - start.x)) / Math.PI * -180;
				const align = options.text.box.alignment.horizontal;
				const pivot = align === BoxHorizontalAlignment.Left
					? start.clone() : align === BoxHorizontalAlignment.Right
					? end.clone() : new Point((point0.x + point1.x) / 2, (point0.y + point1.y) / 2);

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
