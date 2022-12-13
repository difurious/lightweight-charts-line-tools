import { ensureNotNull } from '../helpers/assertions';
import { merge } from '../helpers/strict-type-checks';

import { Coordinate } from '../model/coordinate';
import { HitTestResult, HitTestType } from '../model/hit-test-result';
import { LineToolHitTestData } from '../model/line-tool';
import { PaneCursorType } from '../model/pane';
import { Point } from '../model/point';

import { drawRoundRect } from './draw-rect';
import { IPaneRenderer } from './ipane-renderer';
import { interactionTolerance } from './optimal-bar-width';

export class AnchorPoint extends Point {
	public data: number;
	public square: boolean;

	public constructor(x: number, y: number, data?: number, square?: boolean)
	public constructor(x: Coordinate, y: Coordinate, data: number, square: boolean) {
		super(x, y);
		this.data = data;
		this.square = square;
	}

	public override clone(): AnchorPoint {
		return new AnchorPoint(this.x, this.y, this.data, this.square);
	}
}

export interface LineAnchorRendererData {
	points: AnchorPoint[];
	backgroundColors: string[];
	pointsCursorType?: PaneCursorType[];
	editedPointIndex: number | null;
	currentPoint: Point;

	color: string;
	radius: number;
	strokeWidth: number;
	hoveredStrokeWidth: number;
	selected: boolean;
	visible: boolean;
	hitTestType: HitTestType;
}

type DrawCallback = (ctx: CanvasRenderingContext2D, point: Point, radius: number, lineWidth: number) => void;

export class LineAnchorRenderer implements IPaneRenderer {
	protected _data: LineAnchorRendererData | null;

	public constructor(data?: LineAnchorRendererData) {
		this._data = data !== undefined ? data : null;
	}

	public setData(data: LineAnchorRendererData): void {
		this._data = data;
	}

	public updateData(data: Partial<LineAnchorRendererData>): void {
		this._data = merge(this._data as unknown as Record<string, unknown>, data) as LineAnchorRendererData;
	}

	public draw(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean, hitTestData?: unknown): void {
		if (this._data === null || !this._data.visible) {
			return;
		}

		const squarePoints: AnchorPoint[] = [];
		const squareColors: string[] = [];
		const circlePoints: AnchorPoint[] = [];
		const circleColors: string[] = [];

		for (let e = 0; e < this._data.points.length; ++e) {
			const point = this._data.points[e];
			const color = this._data.backgroundColors[e];
			if (point.square) {
				squarePoints.push(point);
				squareColors.push(color);
			} else {
				circlePoints.push(point);
				circleColors.push(color);
			}
		}

		ctx.strokeStyle = this._data.color;

		if (squarePoints.length) {
			this._drawPoints(ctx, pixelRatio, squarePoints, squareColors, drawRectBody, drawRectShadow);
		}

		if (circlePoints.length) {
			this._drawPoints(ctx, pixelRatio, circlePoints, circleColors, drawCircleBody, drawCircleShadow);
		}
	}

	public hitTest(x: Coordinate, y: Coordinate): HitTestResult<LineToolHitTestData> | null {
		if (null === this._data) { return null; }
		const position = new Point(x, y);

		for (let r = 0; r < this._data.points.length; ++r) {
			const point = this._data.points[r];
			if (point.subtract(position).length() <= this._data.radius + interactionTolerance.anchor) {
				const cursorType = this._data.pointsCursorType !== undefined ? this._data.pointsCursorType[r] : PaneCursorType.Default;
				const pointIndex = point.data;

				return new HitTestResult(this._data.hitTestType, { pointIndex, cursorType });
			}
		}
		return null;
	}

	protected _drawPoints(ctx: CanvasRenderingContext2D, pixelRatio: number, points: AnchorPoint[], colors: string[], drawBody: DrawCallback, drawShadow: DrawCallback): void {
		const data = ensureNotNull(this._data);
		const currentPoint = data.currentPoint;

		let lineWidth = Math.max(1, Math.floor((data.strokeWidth || 2) * pixelRatio));
		if (data.selected) { lineWidth += Math.max(1, Math.floor(pixelRatio / 2)); }

		const pixelRatioInt = Math.max(1, Math.floor(pixelRatio));
		let radius = Math.round(data.radius * pixelRatio * 2);
		if (pixelRatio % 2 !== pixelRatioInt % 2) { radius += 1; }
		const shift = pixelRatioInt % 2 / 2;

		for (let d = 0; d < points.length; ++d) {
			const point = points[d];
			ctx.fillStyle = colors[d];

			if (!(Number.isInteger(point.data) && data.editedPointIndex === point.data)) {
				const x = Math.round(point.x * pixelRatio) + shift;
				const y = Math.round(point.y * pixelRatio) + shift;

				drawBody(ctx, new AnchorPoint(x, y, point.data, point.square), radius / 2, lineWidth);
				if (point.subtract(currentPoint).length() <= data.radius + interactionTolerance.anchor) {
					const hoveredLineWidth = Math.max(1, Math.floor(data.hoveredStrokeWidth * pixelRatio));
					drawShadow(ctx, new AnchorPoint(x, y, point.data, point.square), radius / 2, hoveredLineWidth);
				}
			}
		}
	}
}

function drawRect(ctx: CanvasRenderingContext2D, point: Point, radius: number, lineWidth: number): void {
	ctx.lineWidth = lineWidth;
	const n = radius + lineWidth / 2;
	drawRoundRect(ctx, point.x - n, point.y - n, 2 * n, 2 * n, (radius + lineWidth) / 2);
	ctx.closePath();
}

function drawRectShadow(ctx: CanvasRenderingContext2D, point: Point, radius: number, lineWidth: number): void {
	ctx.globalAlpha = 0.2;
	drawRect(ctx, point, radius, lineWidth);
	ctx.stroke();
	ctx.globalAlpha = 1;
}

function drawRectBody(ctx: CanvasRenderingContext2D, point: Point, radius: number, lineWidth: number): void {
	drawRect(ctx, point, radius - lineWidth, lineWidth);
	ctx.fill();
	ctx.stroke();
}

function drawCircleShadow(ctx: CanvasRenderingContext2D, point: Point, radius: number, lineWidth: number): void {
	ctx.lineWidth = lineWidth;
	ctx.globalAlpha = 0.2;
	ctx.beginPath();
	ctx.arc(point.x, point.y, radius + lineWidth / 2, 0, 2 * Math.PI, true);
	ctx.closePath();
	ctx.stroke();
	ctx.globalAlpha = 1;
}

function drawCircleBody(ctx: CanvasRenderingContext2D, point: Point, radius: number, lineWidth: number): void {
	ctx.lineWidth = lineWidth;
	ctx.beginPath();
	ctx.arc(point.x, point.y, radius - lineWidth / 2, 0, 2 * Math.PI, true);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
}
