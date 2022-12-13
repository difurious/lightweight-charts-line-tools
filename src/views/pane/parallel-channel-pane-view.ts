import { deepCopy } from '../../helpers/deep-copy';

import { ChartModel } from '../../model/chart-model';
import { LineTool, LineToolOptionsInternal } from '../../model/line-tool';
import { LineToolType } from '../../model/line-tool-options';
import { PaneCursorType } from '../../model/pane';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { AnchorPoint } from '../../renderers/line-anchor-renderer';
import { ParallelChannelRenderer } from '../../renderers/parallel-channel-renderer';

import { LineToolPaneView } from './line-tool-pane-view';

const pointsCursorType = [PaneCursorType.Default, PaneCursorType.Default, PaneCursorType.Default, PaneCursorType.Default, PaneCursorType.VerticalResize, PaneCursorType.VerticalResize];
export class ParallelChannelPaneView extends LineToolPaneView {
	protected _channelRenderer: ParallelChannelRenderer = new ParallelChannelRenderer();

	public constructor(source: LineTool<LineToolType>, model: ChartModel) {
		super(source, model);
		this._renderer = null;
	}

	protected override _updateImpl(): void {
		super._updateImpl();
		this._renderer = null;

		const priceScale = this._source.priceScale();
		if (!priceScale || priceScale.isEmpty()) { return; }
		if (this._source.points().length === 0) { return; }
		if (this._points.length <= 1) { return; }

		const end0 = this._points[0];
		const end1 = this._points[1];
		let end2: AnchorPoint | null = null;
		let end3: AnchorPoint | null = null;

		if (this._points.length === 3) {
			const height = this._points[2].y - this._points[0].y;
			end2 = new AnchorPoint(end0.x, end0.y + height, 2);
			end3 = new AnchorPoint(end1.x, end1.y + height, 3);
		}

		const points = end2 && end3 ? [end0, end1, end2, end3] : [end0, end1];
		const options = this._source.options() as LineToolOptionsInternal<'ParallelChannel'>;
		this._channelRenderer.setData({ ...deepCopy(options), points, hitTestBackground: false });

		const compositeRenderer = new CompositeRenderer();
		compositeRenderer.append(this._channelRenderer);

		const anchorPoints: AnchorPoint[] = [];

		if (this._points[0]) { anchorPoints.push(new AnchorPoint(end0.x, end0.y, 0)); }
		if (this._points[1]) { anchorPoints.push(new AnchorPoint(end1.x, end1.y, 1)); }

		if (end2 && end3) {
			anchorPoints.push(new AnchorPoint(end2.x, end2.y, 2), new AnchorPoint(end3.x, end3.y, 3));

			const middle0 = end2.add(end3).scaled(0.5) as AnchorPoint;
			middle0.data = 4;
			middle0.square = true;
			anchorPoints.push(middle0);

			const middle1 = anchorPoints[0].add(anchorPoints[1]).scaled(0.5) as AnchorPoint;
			middle1.square = true;
			middle1.data = 5;
			anchorPoints.push(middle1);
		}

		const anchorData = { points: anchorPoints, pointsCursorType };
		compositeRenderer.append(this.createLineAnchor(anchorData, 0));
		this._renderer = compositeRenderer;
	}
}
