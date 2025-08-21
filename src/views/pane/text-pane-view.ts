/* eslint-disable complexity */
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
		const options = this._source.options() as LineToolOptionsInternal<'Text'>;

		if (!options.visible) {
			return;
		}

		this._renderer = null;

		const priceScale = this._source.priceScale();
		const timeScale = this._model.timeScale();
		if (!priceScale || priceScale.isEmpty() || timeScale.isEmpty()) { return; }

		super._updateImpl();
		if (this._points.length < 1) { return; }

		const visibleTimestampRange = timeScale.timestampRangeFromVisibleLogicalRange();
		if (visibleTimestampRange === null) { return; }
		const points = this._source.points();

		const point0Data = points[0];

		if (!point0Data) {
			return;
		}

		const ownerSource = this._source.ownerSource();
		const firstValue = ownerSource?.firstValue();
		if (!firstValue) { return; }

		const point0ScreenY = priceScale.priceToCoordinate(point0Data.price, firstValue.value);

		const y0 = point0ScreenY;

		const pane = this._model.paneForSource(this._source);
		const paneHeight = pane?.height() ?? 0;
		// const paneWidth = pane?.width() ?? 0;

        // Consolidated vertical top and bottom off-screen check
		const isOffScreenTopVertical = (y0 < 0);
		const isOffScreenBottomVertical = (y0 > paneHeight);
		const isOffScreenVertical = isOffScreenTopVertical || isOffScreenBottomVertical;

        // Consolidated horizontal right and left off-screen check
		const isOffScreenRightHorizontal = Math.min(points[0].timestamp) > Number(visibleTimestampRange.to);
		const isOffScreenLeftHorizontal = Math.max(points[0].timestamp) < Number(visibleTimestampRange.from);
		const isOffScreenHorizontal = isOffScreenRightHorizontal || isOffScreenLeftHorizontal;

		const isOutsideView = isOffScreenVertical || isOffScreenHorizontal;

		if (!isOutsideView) {
			// console.log('draw text');
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
}
