import { ensure, ensureNotNull } from '../helpers/assertions';

import { ParallelChannelPaneView } from '../views/pane/parallel-channel-pane-view';
import { LineToolPriceAxisLabelView } from '../views/price-axis/line-tool-price-axis-label-view';

import { ChartModel } from './chart-model';
import { Coordinate } from './coordinate';
import { LineTool, LineToolPoint } from './line-tool';
import { LineToolType, ParallelChannelToolOptions } from './line-tool-options';
import { Point } from './point';

export class LineToolParallelChannel extends LineTool<'ParallelChannel'> {
	protected override readonly _toolType: LineToolType = 'ParallelChannel';

	public constructor(model: ChartModel, options: ParallelChannelToolOptions, points: LineToolPoint[] = []) {
		super(model, options, points);
		this._priceAxisViews.push(new LineToolPriceAxisLabelView(this, 3));
		this._setPaneViews([new ParallelChannelPaneView(this, model)]);
	}

	public pointsCount(): number {
		return 3;
	}

	public override addPoint(point: LineToolPoint): void {
		if (this._points.length === 2) {
			super.addPoint(this._correctLastPoint(point));
		} else {
			super.addPoint(point);
		}
	}

	public override points(): LineToolPoint[] {
		const points = super.points();
		if (points.length === 3 && !this.finished()) {
			return [points[0], points[1], this._correctLastPoint(points[2])];
		} else {
			return points;
		}
	}

	public override setPoint(index: number, point: LineToolPoint): void {
		if (this._points[0].timestamp === this._points[1].timestamp && index >= 4) { return; }
		const screenPoint0 = ensureNotNull(this.pointToScreenPoint(this._points[0]));
		const screenPoint1 = ensureNotNull(this.pointToScreenPoint(this._points[1]));
		const screenPoint = ensureNotNull(this.pointToScreenPoint(point));
		const movingCoordOffset = this._findPixelsHeight() || 0;
		const priceScale = ensureNotNull(this.priceScale());
		const ownerSource = this.ownerSource();

		const firstValue = ensure(ownerSource === null ? undefined : ownerSource.firstValue());
		if (index === 0) {
			super.setPoint(index, point);
			this._points[2].price = priceScale.coordinateToPrice(screenPoint.y + movingCoordOffset as Coordinate, firstValue.value);
		} else if (index === 1) {
			super.setPoint(index, point);
		} else if (index === 2) {
			super.setPoint(index, point);
			this._points[0].timestamp = point.timestamp;
			this._points[0].price = priceScale.coordinateToPrice(screenPoint.y - movingCoordOffset as Coordinate, firstValue.value);
		} else if (index === 3) {
			this._points[1].timestamp = point.timestamp;
			this._points[1].price = priceScale.coordinateToPrice(screenPoint.y - movingCoordOffset as Coordinate, firstValue.value);
		} else if (index === 4) {
			const heading = screenPoint1.subtract(screenPoint0);
			const scale = (screenPoint.x - screenPoint0.x) / heading.x;
			const displace = screenPoint.y - screenPoint0.addScaled(heading, scale).y;
			this._points[2].price = priceScale.coordinateToPrice(screenPoint0.y + displace as Coordinate, firstValue.value);
		} else if (index === 5) {
			const heading = screenPoint1.subtract(screenPoint0);
			const scale = (screenPoint.x - screenPoint0.x) / heading.x;
			const displace = screenPoint.y - screenPoint0.addScaled(heading, scale).y;
			this._points[0].price = priceScale.coordinateToPrice(screenPoint0.y + displace as Coordinate, firstValue.value);
			this._points[1].price = priceScale.coordinateToPrice(screenPoint1.y + displace as Coordinate, firstValue.value);
		}
	}

	public override getPoint(index: number): LineToolPoint | null {
		if (index < 3) { return super.getPoint(index); }

		const end0 = this.pointToScreenPoint(this._points[0]);
		const end1 = this.pointToScreenPoint(this._points[1]);
		const end2 = this.pointToScreenPoint(this._points[2]);
		if (!end0 || !end1 || !end2) { return null; }

		switch (index) {
			case 3: {
				const height = end2.y - end0.y;
				const end3 = end1.add(new Point(0, height));
				return this.screenPointToPoint(end3);
			}
			case 4: {
				const height = end2.y - end0.y;
				const end3 = end1.add(new Point(0, height));
				const middle0 = end2.add(end3).scaled(0.5);
				return this.screenPointToPoint(middle0);
			}
			case 5: {
				const middle1 = end0.add(end1).scaled(0.5);
				return this.screenPointToPoint(middle1);
			}
		}
		return null;
	}

	public override priceAxisPoints(): LineToolPoint[] {
		return this._axisPoints();
	}

	public override timeAxisPoints(): LineToolPoint[] {
		return this._axisPoints().slice(0, 2);
	}

	protected _findPixelsHeight(): number | null {
		const end2 = this.pointToScreenPoint(this._points[2]);
		const end0 = this.pointToScreenPoint(this._points[0]);
		return end2 && end0 ? end2.y - end0.y : null;
	}

	protected _axisPoints(): LineToolPoint[] {
		const points = this.points();
		const screenPoint0 = this._points[0] ? this.pointToScreenPoint(this._points[0]) : null;
		const screenPoint1 = this._points[1] ? this.pointToScreenPoint(this._points[1]) : null;
		const screenPoint2 = this._points[2] ? this.pointToScreenPoint(this._points[2]) : null;

		if (screenPoint0 && screenPoint1 && screenPoint2) {
			const height = screenPoint1.y - screenPoint0.y;
			const screenPoint3 = screenPoint2.add(new Point(0, height));
			points.push(ensureNotNull(this.screenPointToPoint(screenPoint3)));
		}

		return points;
	}

	protected _correctLastPoint(point2: LineToolPoint): LineToolPoint {
		if (this._points.length < 2 || this._points[1].timestamp === this._points[0].timestamp) { return point2; }
		const screenPoint2 = ensureNotNull(this.pointToScreenPoint(point2));
		const screenPoint1 = ensureNotNull(this.pointToScreenPoint(this._points[1]));
		const screenPoint0 = ensureNotNull(this.pointToScreenPoint(this._points[0]));
		const heading = screenPoint1.subtract(screenPoint0);
		const scale = (screenPoint2.x - screenPoint0.x) / heading.x;
		const height = screenPoint0.addScaled(heading, scale);
		const displaceY = screenPoint2.y - height.y;
		const correctedPoint = screenPoint0.add(new Point(0, displaceY));
		return ensureNotNull(this.screenPointToPoint(correctedPoint));
	}
}
