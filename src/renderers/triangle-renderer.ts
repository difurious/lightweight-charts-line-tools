import { DeepPartial } from '../helpers/strict-type-checks';

import { Coordinate } from '../model/coordinate';
import { HitTestResult, HitTestType } from '../model/hit-test-result';
import { distanceToSegment, pointInTriangle } from '../model/interesection';
import { TriangleOptions } from '../model/line-tool-options';
import { Point } from '../model/point';

import { setLineStyle } from './draw-line';
import { AnchorPoint } from './line-anchor-renderer';
import { interactionTolerance } from './optimal-bar-width';
import { ScaledRenderer } from './scaled-renderer';

export type TriangleRendererData = DeepPartial<TriangleOptions> & { points: AnchorPoint[]; hitTestBackground?: boolean };

export class TriangleRenderer extends ScaledRenderer {
	protected _data: TriangleRendererData | null = null;

	public setData(data: TriangleRendererData): void {
		this._data = data;
	}

	public hitTest(x: Coordinate, y: Coordinate): HitTestResult<void> | null {
		if (null === this._data || this._data.points.length < 2) { return null; }
		const [end0, end1] = this._data.points;
		const point = new Point(x, y);

		if (distanceToSegment(end0, end1, point).distance <= interactionTolerance.line) {
			return new HitTestResult(HitTestType.MovePoint);
		}

		if (this._data.points.length !== 3) { return null; }
		const end3 = this._data.points[2];

		if (distanceToSegment(end1, end3, point).distance <= interactionTolerance.line) {
			return new HitTestResult(HitTestType.MovePoint);
		} else if (distanceToSegment(end3, end0, point).distance <= interactionTolerance.line) {
			return new HitTestResult(HitTestType.MovePoint);
		}

		if (this._data.hitTestBackground && pointInTriangle(point, end0, end1, end3)) {
			return new HitTestResult(HitTestType.MovePointBackground);
		}

		return null;
	}

	protected _drawImpl(ctx: CanvasRenderingContext2D): void {
		if (this._data === null || this._data.points.length < 2) { return; }
		const [point0, point1] = this._data.points;
		const point2 = 2 === this._data.points.length ? point1 : this._data.points[2];

		ctx.lineCap = 'butt';
		ctx.lineWidth = this._data.border?.width || 0;
		ctx.strokeStyle = this._data.border?.color || 'transparent';
		if (this._data.border?.style !== undefined) { setLineStyle(ctx, this._data.border.style); }

		ctx.beginPath();
		ctx.fillStyle = this._data.background?.color || 'transparent';
		ctx.moveTo(point0.x, point0.y);
		ctx.lineTo(point1.x, point1.y);
		ctx.lineTo(point2.x, point2.y);
		ctx.lineTo(point0.x, point0.y);
		ctx.fill();
		ctx.stroke();
	}
}
