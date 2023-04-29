import { deepCopy } from '../../helpers/deep-copy';

import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { LineTool, LineToolOptionsInternal } from '../../model/line-tool';
import { BoxHorizontalAlignment, BoxVerticalAlignment, LineToolType } from '../../model/line-tool-options';
import { PaneCursorType } from '../../model/pane';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { AnchorPoint } from '../../renderers/line-anchor-renderer';
import { RectangleRenderer } from '../../renderers/rectangle-renderer';
import { TextRenderer } from '../../renderers/text-renderer';

import { LineToolPaneView } from './line-tool-pane-view';

export class RectanglePaneView extends LineToolPaneView {
	protected _rectangleRenderer: RectangleRenderer = new RectangleRenderer();
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

		const options = this._source.options() as LineToolOptionsInternal<'Rectangle'>;
		const isOutsideView = Math.max(points[0].timestamp, points[1].timestamp) < strictRange.from.timestamp;

		if (!isOutsideView || options.rectangle.extend.left || options.rectangle.extend.right) {
			super._updateImpl();
			if (this._points.length < 2) { return; }
			const compositeRenderer = new CompositeRenderer();
			this._rectangleRenderer.setData({ ...deepCopy(options.rectangle), points: this._points, hitTestBackground: false });

			compositeRenderer.append(this._rectangleRenderer);
			const point0 = this._points[0];
			const point1 = this._points[1];

			if (options.text.value) {
				const minX = Math.min(point0.x, point1.x);
				const maxX = Math.max(point0.x, point1.x);
				const minY = Math.min(point0.y, point1.y);
				const maxY = Math.max(point0.y, point1.y);

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
		const bottomLeft = new AnchorPoint(topLeft.x, bottomRight.y, 2);
		const topRight = new AnchorPoint(bottomRight.x, topLeft.y, 3);
		const middleLeft = new AnchorPoint(topLeft.x, 0.5 * (topLeft.y + bottomRight.y), 4, true);
		const middleRight = new AnchorPoint(bottomRight.x, 0.5 * (topLeft.y + bottomRight.y), 5, true);
		const topCenter = new AnchorPoint(0.5 * (topLeft.x + bottomRight.x), topLeft.y, 6, true);
		const bottomCenter = new AnchorPoint(0.5 * (topLeft.x + bottomRight.x), bottomRight.y, 7, true);

		const xDiff = topLeft.x - bottomRight.x;
		const yDiff = topLeft.y - bottomRight.y;
		const sign = Math.sign(xDiff * yDiff);

		const pointsCursorType = [
			sign < 0 ? PaneCursorType.DiagonalNeSwResize : PaneCursorType.DiagonalNwSeResize,
			sign < 0 ? PaneCursorType.DiagonalNeSwResize : PaneCursorType.DiagonalNwSeResize,
			sign > 0 ? PaneCursorType.DiagonalNeSwResize : PaneCursorType.DiagonalNwSeResize,
			sign > 0 ? PaneCursorType.DiagonalNeSwResize : PaneCursorType.DiagonalNwSeResize,
			PaneCursorType.HorizontalResize,
			PaneCursorType.HorizontalResize,
			PaneCursorType.VerticalResize,
			PaneCursorType.VerticalResize,
		];

		const anchorData = {
			points: [topLeft, bottomRight, bottomLeft, topRight, middleLeft, middleRight, topCenter, bottomCenter],
			pointsCursorType,
		};
		renderer.append(this.createLineAnchor(anchorData, 0));
	}
}
