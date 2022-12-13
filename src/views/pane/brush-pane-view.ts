
import { ChartModel } from '../../model/chart-model';
import { LineTool } from '../../model/line-tool';
import { LineToolBrush } from '../../model/line-tool-brush';
import { LineToolType } from '../../model/line-tool-options';
import { Point } from '../../model/point';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { AnchorPoint } from '../../renderers/line-anchor-renderer';
import { PolygonRenderer } from '../../renderers/polygon-renderer';

import { LineToolPaneView } from './line-tool-pane-view';

export class BrushPaneView extends LineToolPaneView {
	protected _polygonRenderer: PolygonRenderer = new PolygonRenderer();

	public constructor(source: LineTool<LineToolType>, model: ChartModel) {
		super(source, model);
		this._renderer = null;
	}

	protected override _updateImpl(): void {
		super._updateImpl();
		this._renderer = null;
		if (this._points.length === 0) { return; }

		const options = (this._source as LineToolBrush).getBrushOptions();
		const smooth = Math.max(1, (this._source as LineToolBrush).smooth());

		const computedPoints: Point[] = [this._points[0]];
		for (let i = 1; i < this._points.length; i++) {
			const heading = this._points[i].subtract(this._points[i - 1]);
			const distance = heading.length();
			const iterations = Math.min(5, Math.floor(distance / smooth));
			const segment = heading.normalized().scaled(distance / iterations);
			for (let j = 0; j < iterations - 1; j++) {
				computedPoints.push(this._points[i - 1].add(segment.scaled(j)));
			}
			computedPoints.push(this._points[i]);
		}

		const points = this._smoothArray(computedPoints, smooth) as AnchorPoint[];
		this._polygonRenderer.setData({ line: options.line, background: options.background, points: points });

		const compositeRenderer = new CompositeRenderer();
		compositeRenderer.append(this._polygonRenderer);
		this._renderer = compositeRenderer;
	}

	protected _smoothArray(points: Point[], interval: number): Point[] {
		const computedPoints = new Array(points.length) as Point[];
		if (points.length === 1) { return points; }

		for (let j = 0; j < points.length; j++) {
			let current = new Point(0, 0);
			for (let i = 0; i < interval; i++) {
				const t = Math.max(j - i, 0);
				const r = Math.min(j + i, points.length - 1);
				current = current.add(points[t]);
				current = current.add(points[r]);
			}
			computedPoints[j] = current.scaled(0.5 / interval);
		}

		computedPoints.push(points[points.length - 1]);
		return computedPoints;
	}
}
