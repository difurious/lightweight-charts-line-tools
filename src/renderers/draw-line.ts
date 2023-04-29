import { Coordinate } from '../model/coordinate';
import { intersectLineAndBox, intersectLineSegmentAndBox, intersectRayAndBox } from '../model/interesection';
import { Box, equalPoints, lineSegment, lineThroughPoints, Point, Segment } from '../model/point';

/**
 * Represents the width of a line.
 */
export type LineWidth = 1 | 2 | 3 | 4;

/**
 * Represents the possible line types.
 */
export const enum LineType {
	/**
	 * A line.
	 */
	Simple,
	/**
	 * A stepped line.
	 */
	WithSteps,
}

/**
 * Represents the possible line caps.
 */
export const enum LineEnd {
	/**
	 * No cap.
	 */
	Normal,
	/**
	 * Arrow cap.
	 */
	Arrow,
	/**
	 * Circle cap.
	 */
	Circle,
}

/**
 * A point on a line.
 */
export interface LinePoint {
	/**
	 * The point's x coordinate.
	 */
	x: Coordinate;
	/**
	 * The point's y coordinate.
	 */
	y: Coordinate;
}

/**
 * Represents the possible line styles.
 */
export const enum LineStyle {
	/**
	 * A solid line.
	 */
	Solid = 0,
	/**
	 * A dotted line.
	 */
	Dotted = 1,
	/**
	 * A dashed line.
	 */
	Dashed = 2,
	/**
	 * A dashed line with bigger dashes.
	 */
	LargeDashed = 3,
	/**
	 * A dottled line with more space between dots.
	 */
	SparseDotted = 4,
	/**
	 * A dashed line with less space between dots.
	 */
	SmallDashed = 5,
}

export function computeDashPattern(ctx: CanvasRenderingContext2D): number[] {
	return [
		[ctx.lineWidth, ctx.lineWidth],
		[2 * ctx.lineWidth, 2 * ctx.lineWidth],
		[6 * ctx.lineWidth, 6 * ctx.lineWidth],
		[ctx.lineWidth, 4 * ctx.lineWidth],
		[2 * ctx.lineWidth, ctx.lineWidth],
	][ctx.lineStyle - 1] || [];
}

export function computeEndLineSize(lineWidth: number): number {
	let endLineMultiplier = 1;
	switch (lineWidth) {
		case 1:
			endLineMultiplier = 3.5;
			break;
		case 2:
			endLineMultiplier = 2;
			break;
		case 3:
			endLineMultiplier = 1.5;
			break;
		case 4:
			endLineMultiplier = 1.25;
			break;
		case 0:
		default:
			break;
	}
	return endLineMultiplier;
}

export function setLineStyle(ctx: CanvasRenderingContext2D, style: LineStyle): void {
	ctx.lineStyle = style;
	const dashPattern = computeDashPattern(ctx);
	setLineDash(ctx, dashPattern);
}

export function setLineDash(ctx: CanvasRenderingContext2D, dashPattern: number[]): void {
	if (ctx.setLineDash) {
		ctx.setLineDash(dashPattern);
	} else if (ctx.mozDash !== undefined) {
		ctx.mozDash = dashPattern;
	} else if (ctx.webkitLineDash !== undefined) {
		ctx.webkitLineDash = dashPattern;
	}
}

export function drawHorizontalLine(ctx: CanvasRenderingContext2D, y: number, left: number, right: number): void {
	ctx.beginPath();
	const correction = (ctx.lineWidth % 2) ? 0.5 : 0;
	ctx.moveTo(left, y + correction);
	ctx.lineTo(right, y + correction);
	ctx.stroke();
}

export function drawVerticalLine(ctx: CanvasRenderingContext2D, x: number, top: number, bottom: number): void {
	ctx.beginPath();
	const correction = (ctx.lineWidth % 2) ? 0.5 : 0;
	ctx.moveTo(x + correction, top);
	ctx.lineTo(x + correction, bottom);
	ctx.stroke();
}

export function drawSolidLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
}

export function drawDashedLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
	ctx.save();
	ctx.beginPath();

	const dashPattern = computeDashPattern(ctx);
	setLineDash(ctx, dashPattern);

	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
	ctx.restore();
}

export function drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
	if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) { return; }
	if (ctx.lineStyle !== LineStyle.Solid) {
		drawDashedLine(ctx, x1, y1, x2, y2);
	} else {
		drawSolidLine(ctx, x1, y1, x2, y2);
	}
}

export function strokeInPixel(ctx: CanvasRenderingContext2D, drawFunction: () => void): void {
	ctx.save();
	if (ctx.lineWidth % 2) {
		ctx.translate(0.5, 0.5);
	}
	drawFunction();
	ctx.restore();
}

export function extendAndClipLineSegment(point0: Point, point1: Point, width: number, height: number, extendLeft: boolean, extendRight: boolean): Segment | null {
	if (equalPoints(point0, point1)) {
		return null;
	}

	const topLeft = new Point(0, 0);
	const bottomRight = new Point(width, height);

	if (extendLeft) {
		if (extendRight) {
			const points = intersectLineAndBox(lineThroughPoints(point0, point1), new Box(topLeft, bottomRight));
			return Array.isArray(points) ? points : null;
		} else {
			const point = intersectRayAndBox(point1, point0, new Box(topLeft, bottomRight));
			return point === null || equalPoints(point1, point) ? null : lineSegment(point1, point);
		}
	}

	if (extendRight) {
		const point = intersectRayAndBox(point0, point1, new Box(topLeft, bottomRight));
		return point === null || equalPoints(point0, point) ? null : lineSegment(point0, point);
	} else {
		const points = intersectLineSegmentAndBox(lineSegment(point0, point1), new Box(topLeft, bottomRight));
		return Array.isArray(points) ? points : null;
	}
}

export function drawCircleEnd(point: Point, ctx: CanvasRenderingContext2D, width: number, pixelRatio: number): void {
	const circleEndMultiplier = computeEndLineSize(width);
	ctx.save();
	ctx.fillStyle = '#000000';
	ctx.beginPath();
	ctx.arc(point.x * pixelRatio, point.y * pixelRatio, width * circleEndMultiplier * pixelRatio, 0, 2 * Math.PI, false);
	ctx.fill();
	ctx.restore();
}

export function drawArrowEnd(point0: Point, point1: Point, ctx: CanvasRenderingContext2D, width: number, pixelRatio: number): void {
	if (point1.subtract(point0).length() < 1) {return;}
	const arrowPoints = getArrowPoints(point0, point1, width);
	for (let e = 0; e < arrowPoints.length; ++e) {
		const first = arrowPoints[e][0];
		const second = arrowPoints[e][1];
		drawLine(ctx, first.x * pixelRatio, first.y * pixelRatio, second.x * pixelRatio, second.y * pixelRatio);
	}
}

export function getArrowPoints(point0: Point, point1: Point, width: number): [[Point, Point], [Point, Point], [Point, Point], [Point, Point]] | [] {
	const r = 0.5 * width;
	const n = Math.sqrt(2);
	const o = point1.subtract(point0);
	const a = o.normalized();
	const arrowheadMultiplier = computeEndLineSize(width);
	const l = 5 * width * arrowheadMultiplier;
	const c = 1 * r;

	if (l * n * 0.2 <= c) { return []; }

	const h = a.scaled(l);
	const d = point1.subtract(h);
	const u = a.transposed();
	const p = 1 * l;
	const z = u.scaled(p);
	const m = d.add(z);
	const g = d.subtract(z);
	const f = m.subtract(point1).normalized().scaled(c);
	const v = g.subtract(point1).normalized().scaled(c);
	const S = point1.add(f);
	const y = point1.add(v);
	const b = r * (n - 1);
	const w = u.scaled(b);
	const C = Math.min(l - 1 * r / n, r * n * 1);
	const P = a.scaled(C);
	const T = point1.subtract(w);
	const x = point1.add(w);
	const I = point1.subtract(P);
	return [[m, S], [g, y], [T, I.subtract(w)], [x, I.add(w)]];
}
