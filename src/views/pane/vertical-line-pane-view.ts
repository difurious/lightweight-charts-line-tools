import { deepCopy } from '../../helpers/deep-copy';

import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { HitTestResult, HitTestType } from '../../model/hit-test-result';
import { LineTool, LineToolOptionsInternal } from '../../model/line-tool';
import { BoxHorizontalAlignment, LineToolType } from '../../model/line-tool-options';
import { Point } from '../../model/point';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { AnchorPoint } from '../../renderers/line-anchor-renderer';
import { SegmentRenderer } from '../../renderers/segment-renderer';
import { TextRenderer } from '../../renderers/text-renderer';

import { LineEnd } from '../..';
import { LineToolPaneView } from './line-tool-pane-view';

export class VerticalLinePaneView extends LineToolPaneView {
	protected _lineRenderer: SegmentRenderer = new SegmentRenderer();
	protected _labelRenderer: TextRenderer = new TextRenderer();

	public constructor(source: LineTool<LineToolType>, model: ChartModel) {
		super(source, model);
		this._renderer = null;
		this._lineRenderer.setHitTest(new HitTestResult(HitTestType.MovePoint));
	}

	protected override _updateImpl(height: number, width: number): void {
		this._renderer = null;

		const priceScale = this._source.priceScale();
		const timeScale = this._model.timeScale();
		if (!priceScale || priceScale.isEmpty() || timeScale.isEmpty()) { return; }

		const points = this._source.points();
		if (points.length < 1) { return; }

		const startTime = timeScale.coordinateToTime(0 as Coordinate);
		const endTime = timeScale.coordinateToTime(width as Coordinate);
		const options = this._source.options() as LineToolOptionsInternal<'VerticalLine'>;

		const isOutsideView = (points[0].timestamp > endTime.timestamp) || (points[0].timestamp < startTime.timestamp);

		if (!isOutsideView) {
			super._updateImpl();
			if (this._points.length < 1) { return; }

			const point = this._points[0];
			const start = new AnchorPoint(point.x, height, 0);
			const end = new AnchorPoint(point.x, 0, 1);

			point.y = height / 2 as Coordinate;
			point.square = true;

			const ends = { left: LineEnd.Normal, right: LineEnd.Normal };
			const extend = { left: false, right: false };

			const compositeRenderer = new CompositeRenderer();
			this._lineRenderer.setData({ line: { ...deepCopy(options.line), end: ends, extend }, points: [start, end] });

			compositeRenderer.append(this._lineRenderer);
			if (options.text.value) {
				const angle = Math.atan((end.y - start.y) / (end.x - start.x)) / Math.PI * -180;
				const align = options.text.box.alignment.horizontal;
				const pivot = align === BoxHorizontalAlignment.Left
					? start.clone() : align === BoxHorizontalAlignment.Right
					? end.clone() : new Point((start.x + end.x) / 2, (start.y + end.y) / 2);

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
