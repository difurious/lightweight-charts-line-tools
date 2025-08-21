/* eslint-disable complexity */
import { ChartModel } from '../../model/chart-model';
import { LineTool, LineToolOptionsInternal } from '../../model/line-tool';
import { LineToolType } from '../../model/line-tool-options';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { TriangleRenderer } from '../../renderers/triangle-renderer';

import { LineToolPaneView } from './line-tool-pane-view';

export class TrianglePaneView extends LineToolPaneView {
	protected _triangleRenderer: TriangleRenderer = new TriangleRenderer();

	public constructor(source: LineTool<LineToolType>, model: ChartModel) {
		super(source, model);
		this._renderer = null;
	}

	protected override _updateImpl(): void {
		const options = this._source.options() as LineToolOptionsInternal<'Triangle'>;

		if (!options.visible) {
			return;
		}

		const points = this._source.points();
		let isOutsideView = false;

		if (this._points.length === 3) {
			const priceScale = this._source.priceScale();
			const timeScale = this._model.timeScale();

			if (!priceScale || priceScale.isEmpty() || timeScale.isEmpty()) {
				return;
			}

			const visibleTimestampRange = timeScale.timestampRangeFromVisibleLogicalRange();

			if (visibleTimestampRange === null) { return; }

			const point0Data = points[0];
			const point1Data = points[1];
			const point2Data = points[2];

			if (!point0Data || !point1Data || !point2Data) {
				return;
			}

			const ownerSource = this._source.ownerSource();
			const firstValue = ownerSource?.firstValue();
			if (!firstValue) { return; }

			const point0ScreenY = priceScale.priceToCoordinate(point0Data.price, firstValue.value);
			const point1ScreenY = priceScale.priceToCoordinate(point1Data.price, firstValue.value);
			const point2ScreenY = priceScale.priceToCoordinate(point2Data.price, firstValue.value);

			const y0 = point0ScreenY;
			const y1 = point1ScreenY;
			const y2 = point2ScreenY;

			const pane = this._model.paneForSource(this._source);
			const paneHeight = pane?.height() ?? 0;
			// const paneWidth = pane?.width() ?? 0;

			// Consolidated vertical top and bottom off-screen check
			const isOffScreenTopVertical = (y0 < 0 && y1 < 0 && y2 < 0);
			const isOffScreenBottomVertical = (y0 > paneHeight && y1 > paneHeight && y2 > paneHeight);
			const isOffScreenVertical = isOffScreenTopVertical || isOffScreenBottomVertical;

			// Consolidated horizontal right and left off-screen check
			const isOffScreenRightHorizontal = Math.min(points[0].timestamp, points[1].timestamp, points[2].timestamp) > Number(visibleTimestampRange.to);
			const isOffScreenLeftHorizontal = Math.max(points[0].timestamp, points[1].timestamp, points[2].timestamp) < Number(visibleTimestampRange.from);
			const isOffScreenHorizontal = isOffScreenRightHorizontal || isOffScreenLeftHorizontal;

			isOutsideView = isOffScreenVertical || isOffScreenHorizontal;
		}

		// GOTCHA if using isOutsideView and it is culling the redraw, sometimes a partial triangle artifact will be on screen.
		// It has to do with the redraw?  maybe because this one uses the compositeRenderer?  If not using isOutsideView at all it draws fine
		if (!isOutsideView && options.visible) {
			// console.log('draw triangle');
			super._updateImpl();
			this._renderer = null;

			this._triangleRenderer.setData({ ...options.triangle, points: this._points, hitTestBackground: false });
			const compositeRenderer = new CompositeRenderer();
			compositeRenderer.append(this._triangleRenderer);
			this.addAnchors(compositeRenderer);
			this._renderer = compositeRenderer;
		}
	}
}
