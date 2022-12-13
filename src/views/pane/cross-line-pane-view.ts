import { deepCopy } from '../../helpers/deep-copy';

import { ChartModel } from '../../model/chart-model';
import { HitTestResult, HitTestType } from '../../model/hit-test-result';
import { LineTool, LineToolOptionsInternal } from '../../model/line-tool';
import { LineToolType } from '../../model/line-tool-options';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { AnchorPoint } from '../../renderers/line-anchor-renderer';
import { SegmentRenderer } from '../../renderers/segment-renderer';

import { LineEnd } from '../..';
import { LineToolPaneView } from './line-tool-pane-view';

export class CrossLinePaneView extends LineToolPaneView {
	protected _verticalLineRenderer: SegmentRenderer = new SegmentRenderer();
	protected _horizontalLineRenderer: SegmentRenderer = new SegmentRenderer();

	public constructor(source: LineTool<LineToolType>, model: ChartModel) {
		super(source, model);
		this._renderer = null;
		this._verticalLineRenderer.setHitTest(new HitTestResult(HitTestType.MovePoint));
		this._horizontalLineRenderer.setHitTest(new HitTestResult(HitTestType.MovePoint));
	}

	protected override _updateImpl(height: number, width: number): void {
		this._renderer = null;

		const priceScale = this._source.priceScale();
		const timeScale = this._model.timeScale();
		if (!priceScale || priceScale.isEmpty() || timeScale.isEmpty()) { return; }

		const points = this._source.points();
		if (points.length < 1) { return; }

		super._updateImpl();
		const options = this._source.options() as LineToolOptionsInternal<'CrossLine'>;
		if (this._points.length < 1) { return; }

		const point = this._points[0];
		const startVertical = new AnchorPoint(point.x, height, 0);
		const endVertical = new AnchorPoint(point.x, 0, 1);

		const startHorizontal = new AnchorPoint(0, point.y, 0);
		const endHorizontal = new AnchorPoint(width, point.y, 1);

		const extend = { left: false, right: false };
		const ends = { left: LineEnd.Normal, right: LineEnd.Normal };

		const compositeRenderer = new CompositeRenderer();
		this._verticalLineRenderer.setData({ line: { ...deepCopy(options.line), end: ends, extend }, points: [startVertical, endVertical] });
		this._horizontalLineRenderer.setData({ line: { ...deepCopy(options.line), end: ends, extend }, points: [startHorizontal, endHorizontal] });

		compositeRenderer.append(this._verticalLineRenderer);
		compositeRenderer.append(this._horizontalLineRenderer);

		this.addAnchors(compositeRenderer);
		this._renderer = compositeRenderer;
	}
}
