import { Coordinate } from './coordinate';

// /**
 // * Represents a point on the chart.
 // */
// export interface Point {
	// /**
	 // * The x coordinate.
	 // */
	// readonly x: Coordinate;
	// /**
	 // * The y coordinate.
	 // */
	// readonly y: Coordinate;
// }


export interface IPoint {
	x: Coordinate;
	y: Coordinate;
}

export class Point {
	public x!: Coordinate;
	public y!: Coordinate;

	public constructor(x: number, y: number)
	public constructor(x: Coordinate, y: Coordinate) {
		(this.x as Coordinate) = x;
		(this.y as Coordinate) = y;
	}

	public add(point: Point): Point {
		return new Point(this.x + point.x, this.y + point.y);
	}

	public addScaled(point: Point, scale: number): Point {
		return new Point(this.x + scale * point.x, this.y + scale * point.y);
	}

	public subtract(point: Point): Point {
		return new Point(this.x - point.x, this.y - point.y);
	}

	public dotProduct(point: Point): number {
		return this.x * point.x + this.y * point.y;
	}

	public crossProduct(point: Point): number {
		return this.x * point.y - this.y * point.x;
	}

	public signedAngle(point: Point): number {
		return Math.atan2(this.crossProduct(point), this.dotProduct(point));
	}

	public angle(point: Point): number {
		return Math.acos(this.dotProduct(point) / (this.length() * point.length()));
	}

	public length(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	public scaled(scale: number): Point {
		return new Point(this.x * scale, this.y * scale);
	}

	public normalized(): Point {
		return this.scaled(1 / this.length());
	}

	public transposed(): Point {
		return new Point(-this.y, this.x);
	}

	public clone(): Point {
		return new Point(this.x, this.y);
	}
}

export class Box {
	public min: Point;
	public max: Point;

	public constructor(a: Point, b: Point) {
		this.min = new Point(Math.min(a.x, b.x), Math.min(a.y, b.y));
		this.max = new Point(Math.max(a.x, b.x), Math.max(a.y, b.y));
	}
}

export class HalfPlane {
	public edge: Line;
	public isPositive: boolean;

	public constructor(edge: Line, isPositive: boolean) {
		this.edge = edge;
		this.isPositive = isPositive;
	}
}

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface Line {
	a: number;
	b: number;
	c: number;
}

export type Segment = [Point, Point];

export function equalPoints(a: Point, b: Point): boolean {
	return a.x === b.x && a.y === b.y;
}

export function line(a: number, b: number, c: number): Line {
	return { a, b, c };
}

export function lineThroughPoints(a: Point, b: Point): Line {
	if (equalPoints(a, b)) {throw new Error('Points should be distinct');}
	return line(a.y - b.y, b.x - a.x, a.x * b.y - b.x * a.y);
}

export function lineSegment(a: Point, b: Point): Segment {
	if (equalPoints(a, b)) { throw new Error('Points of a segment should be distinct'); }
	return [a, b];
}

export function halfPlaneThroughPoint(edge: Line, point: Point): HalfPlane {
	return new HalfPlane(edge, edge.a * point.x + edge.b * point.y + edge.c > 0);
}

export function pointInHalfPlane(point: Point, halfPlane: HalfPlane): boolean {
	const edge = halfPlane.edge;
	return edge.a * point.x + edge.b * point.y + edge.c > 0 === halfPlane.isPositive;
}

export function equalBoxes(a: Box, b: Box): boolean {
	return equalPoints(a.min, b.min) && equalPoints(a.max, b.max);
}
