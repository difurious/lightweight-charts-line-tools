import { ensureNotNull } from '../helpers/assertions';
import { DeepPartial } from '../helpers/strict-type-checks';

import { Coordinate } from '../model/coordinate';
import { HitTestResult, HitTestType } from '../model/hit-test-result';
import { distanceToSegment, pointInBox } from '../model/interesection';
import { RectangleOptions } from '../model/line-tool-options';
import { Box, equalPoints, Point, Segment } from '../model/point';

import { LineStyle } from '..';
import { fillRectWithBorder } from './draw-rect';
import { IPaneRenderer } from './ipane-renderer';
import { AnchorPoint } from './line-anchor-renderer';

export type RectangleRendererData = DeepPartial<RectangleOptions> & { points: AnchorPoint[]; hitTestBackground?: boolean };

export class RectangleRenderer implements IPaneRenderer {
	protected _backHitTest: HitTestResult<void>;
	protected _hitTest: HitTestResult<void>;
	protected _data: RectangleRendererData | null;

	public constructor(hitTest?: HitTestResult<void>, backHitTest?: HitTestResult<void>) {
		this._backHitTest = backHitTest || new HitTestResult(HitTestType.MovePointBackground);
		this._hitTest = hitTest || new HitTestResult(HitTestType.MovePoint);
		this._data = null;
	}

	public setData(data: RectangleRendererData): void {
		this._data = data;
	}

	public hitTest(x: Coordinate, y: Coordinate, ctx: CanvasRenderingContext2D): HitTestResult<void> | null {
		if (null === this._data || this._data.points.length < 2) { return null; }
		const pixelRatio = ctx.canvas.ownerDocument && ctx.canvas.ownerDocument.defaultView && ctx.canvas.ownerDocument.defaultView.devicePixelRatio || 1;
		const physicalWidth = ctx.canvas.width;
		const scaledPoint = new Point(x, y);
		const [topLeft, bottomRight] = this._getPointsInPhysicalSpace(pixelRatio);
		const topRight = new Point(bottomRight.x, topLeft.y);
		const bottomLeft = new Point(topLeft.x, bottomRight.y);

		const topLineHitResult = this._extendAndHitTestLineSegment(scaledPoint, topLeft, topRight, physicalWidth);
		if (topLineHitResult !== null) { return topLineHitResult; }

		const bottomLineHitResult = this._extendAndHitTestLineSegment(scaledPoint, bottomLeft, bottomRight, physicalWidth);
		if (bottomLineHitResult !== null) { return bottomLineHitResult; }

		// disable the left and right sides of the hitest.  Just rely on the horizontal lines for hit test
		// const rightSegmentDistance = distanceToSegment(topRight, bottomRight, scaledPoint);
		// if (rightSegmentDistance.distance <= 3) { return this._hitTest; }

		// const leftSegmentDistance = distanceToSegment(topLeft, bottomLeft, scaledPoint);
		// if (leftSegmentDistance.distance <= 3) { return this._hitTest; }

		const backgroundHitResult = this._hitTestBackground(scaledPoint, topLeft, bottomRight, physicalWidth);
		if (this._data.hitTestBackground && backgroundHitResult !== null) { return backgroundHitResult; }

		return null;
	}

	public draw(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean, hitTestData?: unknown): void {
		const borderWidth = this._data?.border?.width || 0;
		const borderColor = this._data?.border?.color;
		const background = this._data?.background?.color;

		if (null === this._data || this._data.points.length < 2 || (borderWidth <= 0 && !background)) { return; }

		ctx.save();
		const scaledBorderWidth = borderWidth ? Math.max(1, Math.floor(borderWidth * pixelRatio)) : 0;
		const borderStyle = this._data.border?.style || LineStyle.Solid;
		const [point0, point1] = this._getPointsInPhysicalSpace(pixelRatio);
		const { left, right } = this._data.extend || {};

		const physicalWidth = ctx.canvas.width;
		fillRectWithBorder(ctx, point0, point1, background, borderColor, scaledBorderWidth, borderStyle, 'center', !!left, !!right, physicalWidth);
		ctx.restore();
	}

	protected _getPointsInPhysicalSpace(pixelRatio: number): Segment {
		const data = ensureNotNull(this._data);
		const [point0, point1] = data.points;
		const minX = Math.min(point0.x, point1.x);
		const maxX = Math.max(point0.x, point1.x);
		const minY = Math.min(point0.y, point1.y);
		const maxY = Math.max(point0.y, point1.y);
		const scaledMinX = Math.round(minX * pixelRatio);
		const scaledMax = Math.round(maxX * pixelRatio);
		const scaledMinY = Math.round(minY * pixelRatio);
		const scaledMaxY = Math.round(maxY * pixelRatio);
		return [new Point(scaledMinX, scaledMinY), new Point(scaledMax, scaledMaxY)];
	}

	protected _extendAndClipLineSegment(end0: Point, end1: Point, physicalWidth: number): Segment | null {
		const data = ensureNotNull(this._data);
		if (equalPoints(end0, end1)) { return null; }

		const minX = Math.min(end0.x, end1.x);
		const maxX = Math.max(end0.x, end1.x);
		const x1 = data.extend?.left ? 0 : Math.max(minX, 0);
		const x2 = data.extend?.right ? physicalWidth : Math.min(maxX, physicalWidth);
		return x1 > x2 || x2 <= 0 || x1 >= physicalWidth ? null : [new Point(x1, end0.y), new Point(x2, end1.y)];
	}

	protected _extendAndHitTestLineSegment(point: Point, end0: Point, end1: Point, physicalWidth: number): HitTestResult<void> | null {
		const line = this._extendAndClipLineSegment(end0, end1, physicalWidth);
		if (line !== null && distanceToSegment(line[0], line[1], point).distance <= 3) { return this._hitTest; }
		return null;
	}

	protected _hitTestBackground(point: Point, end0: Point, end1: Point, physicalWidth: number): HitTestResult<void> | null {
		const line = this._extendAndClipLineSegment(end0, end1, physicalWidth);
		return line !== null && pointInBox(point, new Box(line[0], line[1])) ? this._backHitTest : null;
	}
}
