/* eslint-disable no-trailing-spaces */
/* eslint-disable @typescript-eslint/tslint/config */
import { deepCopy } from '../../helpers/deep-copy';

import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { LineTool, LineToolOptionsInternal } from '../../model/line-tool';
import { BoxHorizontalAlignment, BoxVerticalAlignment, LineToolType } from '../../model/line-tool-options';
import { PaneCursorType } from '../../model/pane';
import { calculateDistance, CircleRenderer } from '../../renderers/circle-renderer';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { AnchorPoint } from '../../renderers/line-anchor-renderer';
import { TextRenderer } from '../../renderers/text-renderer';

import { LineToolPaneView } from './line-tool-pane-view';

export class CirclePaneView extends LineToolPaneView {
	protected _circleRenderer: CircleRenderer = new CircleRenderer();
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

		const options = this._source.options() as LineToolOptionsInternal<'Circle'>;
		const isOutsideView = Math.max(points[0].timestamp, points[1].timestamp) < strictRange.from.timestamp;

		if (!isOutsideView || options.circle.extend.left || options.circle.extend.right) {
			super._updateImpl();
			if (this._points.length < 2) { return; }
			const compositeRenderer = new CompositeRenderer();
			this._circleRenderer.setData({ ...deepCopy(options.circle), points: this._points, hitTestBackground: false });

			compositeRenderer.append(this._circleRenderer);
			const point0 = this._points[0];
			const point1 = this._points[1];

			if (options.text.value) {
				// make sure the text area takes into account the full circle

				const radius = calculateDistance(point0, point1);
				const minX = point0.x - radius;
				const maxX = point0.x + radius;
				const minY = point0.y - radius;
				const maxY = point0.y + radius;

				// const minX = Math.min(point0.x, point1.x);
				// const maxX = Math.max(point0.x, point1.x);
				// const minY = Math.min(point0.y, point1.y);
				// const maxY = Math.max(point0.y, point1.y);

				const pivot = point0.clone();
				const textHalfSize = options.text.font.size / 3;
				let hoirzontalPadding = 0;

				switch (options.text.box.alignment.vertical) {
					case BoxVerticalAlignment.Middle:
						pivot.y = (minY + maxY) / 2 as Coordinate;
						hoirzontalPadding = textHalfSize;
						break;
					case BoxVerticalAlignment.Top:
						pivot.y = minY as Coordinate;
						break;
					case BoxVerticalAlignment.Bottom:
						pivot.y = maxY as Coordinate;
				}

				switch (options.text.box.alignment.horizontal) {
					case BoxHorizontalAlignment.Center:
						pivot.x = (minX + maxX) / 2 as Coordinate;
						break;
					case BoxHorizontalAlignment.Left:
						pivot.x = minX as Coordinate;
						break;
					case BoxHorizontalAlignment.Right:
						pivot.x = maxX as Coordinate;
				}

				const labelOptions = deepCopy(options.text);
				labelOptions.box = { ...labelOptions.box, padding: { y: textHalfSize, x: hoirzontalPadding } };

				if (options.text.box.alignment.vertical === BoxVerticalAlignment.Middle) {
					// if (options.text.forceCalculateMaxLineWidth) {
					//	labelOptions.wordWrapWidth = maxX - minX - 2 * hoirzontalPadding;
					// }
					labelOptions.box.maxHeight = maxY - minY;
				}

				this._labelRenderer.setData({ text: labelOptions, points: [pivot] });
				compositeRenderer.append(this._labelRenderer);
			}

			this._addAnchors(point0, point1, compositeRenderer);
			this._renderer = compositeRenderer;
		}
	}

    protected _addAnchors(topLeft: AnchorPoint, bottomRight: AnchorPoint, renderer: CompositeRenderer): void {
        // Create anchors for both point0 and point1
        const point0Anchor = new AnchorPoint(topLeft.x, topLeft.y, 0, false);
        const point1Anchor = new AnchorPoint(bottomRight.x, bottomRight.y, 1, false);
    
        const anchorData = {
            points: [point0Anchor, point1Anchor],
            pointsCursorType: [PaneCursorType.Default, PaneCursorType.DiagonalNwSeResize],
        };
    
        renderer.append(this.createLineAnchor(anchorData, 0));
    }
}
