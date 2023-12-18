import { applyAlpha } from '../../helpers/color';
import { defaultFontFamily } from '../../helpers/make-font';

import { ChartModel } from '../../model/chart-model';
import { LineTool, LineToolOptionsInternal } from '../../model/line-tool';
import { BoxHorizontalAlignment, BoxVerticalAlignment, FibRetracementLevel, LineToolType, TextAlignment } from '../../model/line-tool-options';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { RectangleRenderer } from '../../renderers/fib-retracement-renderer';
import { AnchorPoint } from '../../renderers/line-anchor-renderer';
import { SegmentRenderer } from '../../renderers/segment-renderer';
import { TextRenderer } from '../../renderers/text-renderer';

import { LineToolPaneView } from './line-tool-pane-view';

export class FibRetracementPaneView extends LineToolPaneView {
	protected _rectangleRenderers: RectangleRenderer[] = [];
	protected _labelRenderers: TextRenderer[] = [];
	protected _lineRenderers: SegmentRenderer[] = [];

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

		const options = this._source.options() as LineToolOptionsInternal<'FibRetracement'>;
		const isOutsideView = Math.max(points[0].timestamp, points[1].timestamp) < strictRange.from.timestamp;

		if (!isOutsideView || options.extend.left || options.extend.right) {
			super._updateImpl();

			if (this._points.length < 2) { return; }
			const compositeRenderer = new CompositeRenderer();
			const minX = Math.min(this._points[0].x, this._points[1].x);
			const maxX = Math.max(this._points[0].x, this._points[1].x);
			const levelCoordinates = this._levelsData(this._source.points()[0].price, this._source.points()[1].price, options.levels);

			let distanceTextToDisplay = '';

			const findIndexByKeyValue = (levels: FibRetracementLevel[], keyToFind: keyof FibRetracementLevel, valueToFind: number): number => {
				for (let i = 0; i < levels.length; i++) {
					if (levels[i][keyToFind] === valueToFind) {
						return i; // Found the key and value, return the index
					}
				}
				return -1; // Key and value not found in the array
			};

			for (let i = 0, j = -1; i < levelCoordinates.length; i++, j++) {
				if (options.levels[i].distanceFromCoeffEnabled) {
					const compareToIndex = findIndexByKeyValue(options.levels, 'coeff', options.levels[i].distanceFromCoeff);

					if (compareToIndex >= 0) {
						const compareToPrice = Number(levelCoordinates[compareToIndex].price);
						const currentPrice = Number(levelCoordinates[i].price);
						const priceDiference = Math.abs(currentPrice - compareToPrice);

						if (priceDiference > 0) {
							distanceTextToDisplay = '>>>>' + priceDiference + ' from ' + options.levels[compareToIndex].coeff + ' line';
						}
					}
				}

				if (!this._lineRenderers[i]) {
					this._lineRenderers.push(new SegmentRenderer());
					this._labelRenderers.push(new TextRenderer());
				}

				const linePoints = [
					new AnchorPoint(minX, levelCoordinates[i].coordinate, 0),
					new AnchorPoint(maxX, levelCoordinates[i].coordinate, 0),
				];

				this._lineRenderers[i].setData({
					line: { ...options.line, extend: options.extend, color: options.levels[i].color },
					points: linePoints,
				});
				this._labelRenderers[i].setData({
					text: {
						alignment: TextAlignment.Right,
						value: `${options.levels[i].coeff}(${levelCoordinates[i].price})${distanceTextToDisplay}`,
						font: { color: options.levels[i].color, size: 11, family: defaultFontFamily },
						box: { alignment: { horizontal: BoxHorizontalAlignment.Right, vertical: BoxVerticalAlignment.Middle } },
					},
					points: linePoints,
				});

				distanceTextToDisplay = '';

				compositeRenderer.append(this._labelRenderers[i]);
				compositeRenderer.append(this._lineRenderers[i]);

				if (j < 0) { continue; }

				if (!this._rectangleRenderers[j]) { this._rectangleRenderers.push(new RectangleRenderer()); }
				this._rectangleRenderers[j].setData({
					...options.line,
					extend: options.extend,
					background: { color: applyAlpha(options.levels[i].color, options.levels[i].opacity) },
					points: [new AnchorPoint(minX, levelCoordinates[i - 1].coordinate, 0), new AnchorPoint(maxX, levelCoordinates[i].coordinate, 0)],
				});
				compositeRenderer.append(this._rectangleRenderers[j]);
			}

			this.addAnchors(compositeRenderer);
			this._renderer = compositeRenderer;
		}
	}

	protected _levelsData(min: number, max: number, levels: FibRetracementLevel[]): { coordinate: number; price: string }[] {
		const baseValue = this._source.ownerSource()?.firstValue()?.value || 0;
		const priceScale = this._source.priceScale();
		const gap = max - min;
		if (!priceScale || !baseValue) { return []; }

		return levels.map((level: FibRetracementLevel) => {
			const price = max - level.coeff * gap;
			const coordinate = priceScale.priceToCoordinate(price, baseValue);
			return { coordinate, price: priceScale.formatPrice(price, baseValue) };
		});
	}
}
