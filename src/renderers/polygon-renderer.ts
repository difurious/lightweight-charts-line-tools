// import { CanvasRenderParams } from '../model/canvas-render-params';
import { Coordinate } from '../model/coordinate';
import { HitTestResult, HitTestType } from '../model/hit-test-result';
import { distanceToSegment, pointInCircle, pointInPolygon } from '../model/interesection';
import { BackroundOptions, LineCap, LineJoin, LineOptions } from '../model/line-tool-options';
import { Point } from '../model/point';

import { LineEnd, LineStyle } from '..';
import { drawArrowEnd, setLineStyle } from './draw-line';
import { AnchorPoint } from './line-anchor-renderer';
import { interactionTolerance } from './optimal-bar-width';
import { ScaledRenderer } from './scaled-renderer';

export interface PolygonRendererData {
	points: AnchorPoint[];
	line: Partial<Omit<LineOptions, 'extend'>>;
	background?: Omit<BackroundOptions, 'inflation'>;
}

export class PolygonRenderer extends ScaledRenderer {
	protected _data: PolygonRendererData | null;
	protected _backHitTest: HitTestResult<void>;
	protected _hitTest: HitTestResult<void>;

	public constructor(hitTest?: HitTestResult<void>) {
		super();
		this._backHitTest = new HitTestResult(HitTestType.MovePointBackground);
		this._hitTest = hitTest || new HitTestResult(HitTestType.MovePoint);
		this._data = null;
	}

	public setData(data: PolygonRendererData): void {
		this._data = data;
	}

	public hitTest(x: Coordinate, y: Coordinate): HitTestResult<void> | null {
		if (this._data === null) { return null; }
		const lineWidth = this._data.line.width || 1;

		const point = new Point(x, y);
		const distance = Math.max(interactionTolerance.line, Math.ceil(lineWidth / 2));
		const pointsCount = this._data.points.length;

		if (pointsCount === 1) {
			return pointInCircle(point, this._data.points[0], distance) ? this._hitTest : null;
		}

		for (let n = 1; n < pointsCount; n++) {
			if (distanceToSegment(this._data.points[n - 1], this._data.points[n], point).distance <= distance) {
				return this._hitTest;
			}
		}

		if (this._data.background && pointsCount > 0) {
			if (distanceToSegment(this._data.points[0], this._data.points[pointsCount - 1], point).distance <= distance) {
				return this._hitTest;
			}
		}

		return this._data.background && pointInPolygon(point, this._data.points) ? this._backHitTest : null;
	}

	// eslint-disable-next-line complexity
	protected _drawImpl(ctx: CanvasRenderingContext2D, isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null || !this._data.points || !this._data.points.length) { return; }

		const pointsCount = this._data.points.length;
		const lineStyle = this._data.line.style || LineStyle.Solid;
		const lineJoin = this._data.line.join || LineJoin.Round;
		const lineCap = this._data.line.cap || LineCap.Butt;
		const lineColor = this._data.line.color || 'white';
		const lineWidth = this._data.line.width || 1;

		if (pointsCount === 1) { return this._drawPoint(ctx, this._data.points[0], pointsCount / 2, lineColor); }

		ctx.beginPath();
		ctx.lineCap = lineCap;
		ctx.lineJoin = lineJoin;
		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = lineColor;
		setLineStyle(ctx, lineStyle);

		ctx.moveTo(this._data.points[0].x, this._data.points[0].y);
		for (const e of this._data.points) {
			ctx.lineTo(e.x, e.y);
		}

		if (this._data.background) {
			ctx.fillStyle = this._data.background.color;
			ctx.fill();
		}

		if (lineWidth > 0) { ctx.stroke(); }

		if (pointsCount > 1) {
			if (lineCap !== 'butt') { ctx.lineCap = 'butt'; }

			if (this._data.line.end?.left === LineEnd.Arrow) {
				const points = this._correctArrowPoints(this._data.points[1], this._data.points[0], lineWidth, lineCap);
				drawArrowEnd(points[0], points[1], ctx, lineWidth, 1);
			}
			if (this._data.line.end?.right === LineEnd.Arrow) {
				const points = this._correctArrowPoints(this._data.points[pointsCount - 2], this._data.points[pointsCount - 1], lineWidth, lineCap);
				drawArrowEnd(points[0], points[1], ctx, lineWidth, 1);
			}
		}
	}

	protected _drawPoint(ctx: CanvasRenderingContext2D, point: Point, lineWidth: number, color: string): void {
		if (lineWidth !== 0) { return; }
		ctx.beginPath();
		ctx.fillStyle = color;
		ctx.arc(point.x, point.y, lineWidth, 0, 2 * Math.PI, true);
		ctx.fill();
		ctx.closePath();
	}

	protected _correctArrowPoints(point0: Point, point1: Point, lineWidth: number, lineCap: LineCap): Point[] {
		const heading = point1.subtract(point0);
		const distance = heading.length();
		if ('butt' === lineCap || distance < 1) { return [point0, point1]; }

		const correctedDistance = distance + lineWidth / 2;
		return [point0, heading.scaled(correctedDistance / distance).add(point0)];
	}
}
