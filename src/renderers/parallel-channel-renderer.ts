import { ensureNotNull } from '../helpers/assertions';
import { DeepPartial } from '../helpers/strict-type-checks';

import { Coordinate } from '../model/coordinate';
import { HitTestResult, HitTestType } from '../model/hit-test-result';
import { distanceToLine, distanceToSegment, intersectPolygonAndHalfPlane } from '../model/interesection';
import { LineToolParallelChannelOptions } from '../model/line-tool-options';
import { equalPoints, halfPlaneThroughPoint, lineThroughPoints, Point, Segment } from '../model/point';

import { LineStyle } from '..';
import { drawLine, extendAndClipLineSegment, setLineStyle } from './draw-line';
import { AnchorPoint } from './line-anchor-renderer';
import { ScaledRenderer } from './scaled-renderer';

export type ParallelChannelRendererData = DeepPartial<LineToolParallelChannelOptions> & { points: AnchorPoint[]; hitTestBackground?: boolean };

export class ParallelChannelRenderer extends ScaledRenderer {
	protected _backHitTest: HitTestResult<void>;
	protected _hitTest: HitTestResult<void>;
	protected _data: ParallelChannelRendererData | null;
	
	private _cssHeight: number = 1000;
	private _cssWidth: number = 1000;

	public constructor(hitTest?: HitTestResult<void>, backHitTest?: HitTestResult<void>) {
		super();
		this._backHitTest = backHitTest || new HitTestResult(HitTestType.MovePointBackground);
		this._hitTest = hitTest || new HitTestResult(HitTestType.MovePoint);
		this._data = null;
	}

	public setData(data: ParallelChannelRendererData): void {
		this._data = data;
	}

	public hitTest(x: Coordinate, y: Coordinate): HitTestResult<void> | null {
		if (this._data === null || this._data.points.length < 2) { return null; }
		const [end0, end1] = this._data.points;
		const point = new Point(x, y);
		const firsLineHitResult = this._extendAndHitTestLineSegment(point, end0, end1);
		if (firsLineHitResult !== null) { return firsLineHitResult; }
		if (this._data.points.length === 4) {
			const [,, end2, end3] = this._data.points;
			const secondLineHitResult = this._extendAndHitTestLineSegment(point, end2, end3);
			if (null !== secondLineHitResult) { return secondLineHitResult; }
			if (this._data.showMiddleLine) {
				const end4 = end0.add(end2).scaled(0.5);
				const end5 = end1.add(end3).scaled(0.5);
				const middleLineHitResult = this._extendAndHitTestLineSegment(point, end4, end5);
				if (null !== middleLineHitResult) { return middleLineHitResult; }
			}
		}
		return this._data.hitTestBackground ? this._hitTestBackground(point) : null;
	}

	protected _drawImpl(ctx: CanvasRenderingContext2D): void {
		if (null === this._data || this._data.points.length < 2) { return; }
		setLineStyle(ctx, this._data.channelLine?.style || LineStyle.Solid);
		ctx.strokeStyle = this._data.channelLine?.color || 'transparent';
		ctx.lineWidth = this._data.channelLine?.width || 0;
		ctx.lineCap = 'butt';
		this._cssWidth = ctx.canvas.width;
		this._cssHeight = ctx.canvas.height;

		const [end0, end1] = this._data.points;
		this._extendAndDrawLineSegment(ctx, end0, end1);

		if (this._data.points.length === 4) {
			const [,, end2, end3] = this._data.points;
			this._extendAndDrawLineSegment(ctx, end2, end3);
			this._drawBackground(ctx, this._data.points,);

			if (this._data.showMiddleLine) {
				setLineStyle(ctx, this._data.middleLine?.style || LineStyle.Solid);
				ctx.strokeStyle = this._data.middleLine?.color || 'transparent';
				ctx.lineWidth = this._data.middleLine?.width || 0;
				const end4 = end0.add(end2).scaled(0.5);
				const end5 = end1.add(end3).scaled(0.5);
				this._extendAndDrawLineSegment(ctx, end4, end5);
			}
		}
	}

	protected _extendAndDrawLineSegment(ctx: CanvasRenderingContext2D, end0: Point, end1: Point): void {
		const line = this._extendAndClipLineSegment(end0, end1);
		if (line !== null) { drawLine(ctx, line[0].x, line[0].y, line[1].x, line[1].y); }
	}

	protected _extendAndHitTestLineSegment(point: Point, end0: Point, end1: Point): HitTestResult<void> | null {
		const line = this._extendAndClipLineSegment(end0, end1);
		if (line !== null && distanceToSegment(line[0], line[1], point).distance <= 3) { return this._hitTest; }
		return null;
	}

	protected _extendAndClipLineSegment(end0: Point, end1: Point): Segment | null {
		const data = ensureNotNull(this._data);
		const cssWidth = this._cssWidth;
		const cssHeight = this._cssHeight;
		return extendAndClipLineSegment(end0, end1, cssWidth, cssHeight, !!data.extend?.left, !!data.extend?.right);
	}

	protected _drawBackground(ctx: CanvasRenderingContext2D, points: Point[]): void {
		const data = ensureNotNull(this._data);
		const [end0, end1, end2, end3] = points;
		const cssWidth = ctx.canvas.width;
		const cssHeight = ctx.canvas.height;

		if (equalPoints(end0, end1) || equalPoints(end2, end3)) { return; }
		if (cssWidth <= 0 || cssHeight <= 0) { return; }
		if (distanceToLine(end0, end1, end2).distance < 1e-6 || distanceToLine(end0, end1, end3).distance < 1e-6) { return; }

		let computedPoints: Point[] | null = [new Point(0, 0), new Point(cssWidth, 0), new Point(cssWidth, cssHeight), new Point(0, cssHeight)];
		computedPoints = this._computePoints(computedPoints, end0, end1, end3);
		if (!data.extend?.right) { computedPoints = this._computePoints(computedPoints, end1, end3, end2); }
		computedPoints = this._computePoints(computedPoints, end3, end2, end0);
		if (!data.extend?.left) { computedPoints = this._computePoints(computedPoints, end2, end0, end1);}

		if (computedPoints !== null) {
			ctx.beginPath();
			ctx.moveTo(computedPoints[0].x, computedPoints[0].y);

			for (let e = 1; e < computedPoints.length; e++) {
				ctx.lineTo(computedPoints[e].x, computedPoints[e].y);
			}

			ctx.fillStyle = this._data?.background?.color || 'transparent';
			if (this._data?.background?.color) { ctx.fill(); }
		}
	}

	protected _hitTestBackground(point: Point): HitTestResult<void> | null {
		const data = ensureNotNull(this._data);
		if (data.points.length !== 4) { return null; }
		const [end0, end1, end2] = data.points;
		const l = (end1.y - end0.y) / (end1.x - end0.x);
		const pointLine1Y = end2.y + l * (point.x - end2.x);
		const pointLine0Y = end0.y + l * (point.x - end0.x);
		const bottom = Math.max(pointLine0Y, pointLine1Y);
		const top = Math.min(pointLine0Y, pointLine1Y);
		const maxX = Math.max(end0.x, end1.x);
		const minX = Math.min(end0.x, end1.x);

		if (!data.extend?.left && point.x < minX || !data.extend?.right && point.x > maxX) { return null; }
		return point.y >= top && point.y <= bottom ? this._backHitTest : null;
	}

	protected _computePoints(points: Point[] | null, end0: Point, end1: Point, end2: Point): Point[] | null {
		return points !== null ? intersectPolygonAndHalfPlane(points, halfPlaneThroughPoint(lineThroughPoints(end0, end1), end2)) : null;
	}
}
