import { ensureNotNull } from '../helpers/assertions';
import { DeepPartial } from '../helpers/strict-type-checks';

import { Coordinate } from '../model/coordinate';
import { HitTestResult, HitTestType } from '../model/hit-test-result';
import { distanceToSegment } from '../model/interesection';
import { LineOptions } from '../model/line-tool-options';
import { Point } from '../model/point';

import { LineStyle } from '..';
import { drawArrowEnd, drawCircleEnd, drawHorizontalLine, drawLine, drawVerticalLine, extendAndClipLineSegment, LineEnd, setLineStyle } from './draw-line';
import { IPaneRenderer } from './ipane-renderer';
import { AnchorPoint } from './line-anchor-renderer';
import { interactionTolerance } from './optimal-bar-width';

export interface SegmentRendererData {
	line: DeepPartial<Omit<LineOptions, 'join' | 'cap'>>;
	points: AnchorPoint[];
}

export class SegmentRenderer implements IPaneRenderer {
	protected _hitTest: HitTestResult<void>;
	protected _data: SegmentRendererData | null;

	private _cssHeight: number = 1000;
	private _cssWidth: number = 1000;
	
	public constructor() {
		this._data = null;
		this._hitTest = new HitTestResult(HitTestType.MovePoint);
	}

	public setData(data: SegmentRendererData): void {
		this._data = data;
	}

	public setHitTest(hitTest: HitTestResult<void>): void {
		this._hitTest = hitTest;
	}

	public draw(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean, hitTestData?: unknown): void {
		if (!this._data || this._data.points.length < 2) { return; }

		this._cssWidth = ctx.canvas.width;
		this._cssHeight = ctx.canvas.height;
		
		const lineWidth = this._data.line.width || 1;
		const lineColor = this._data.line.color || 'white';
		const lineStyle = this._data.line.style || LineStyle.Solid;

		ctx.lineCap = 'butt';
		ctx.strokeStyle = lineColor;
		ctx.lineWidth = Math.max(1, Math.floor(lineWidth * pixelRatio));

		setLineStyle(ctx, lineStyle);
		const point0 = this._data.points[0];
		const point1 = this._data.points[1];

		this._drawEnds(ctx, [point0, point1], lineWidth, pixelRatio);
		const line = this._extendAndClipLineSegment(point0, point1);

		if (line !== null && lineWidth > 0) {
			if (line[0].x === line[1].x) {
				drawVerticalLine(ctx, Math.round(line[0].x * pixelRatio), line[0].y * pixelRatio, line[1].y * pixelRatio);
			} else if (line[0].y === line[1].y) {
				drawHorizontalLine(ctx, Math.round(line[0].y * pixelRatio), line[0].x * pixelRatio, line[1].x * pixelRatio);
			} else {
				drawLine(ctx, line[0].x * pixelRatio, line[0].y * pixelRatio, line[1].x * pixelRatio, line[1].y * pixelRatio);
			}
		}
	}

	public hitTest(x: Coordinate, y: Coordinate): HitTestResult<void> | null {
		if (this._data === null || this._data.points.length < 2) { return null; }

		const tolerance = interactionTolerance.line;
		const line = this._extendAndClipLineSegment(this._data.points[0], this._data.points[1]);
		if (null !== line && distanceToSegment(line[0], line[1], new Point(x,y)).distance <= tolerance) { return this._hitTest; }
		return null;
	}

	private _extendAndClipLineSegment(end0: Point, end1: Point): Point[] | null {
		const data = ensureNotNull(this._data);
		const cssWidth = this._cssWidth;
		const cssHeight = this._cssHeight;
		return extendAndClipLineSegment(end0, end1, cssWidth, cssHeight, !!data.line.extend?.left, !!data.line.extend?.right);
	}

	private _drawEnds(ctx: CanvasRenderingContext2D, points: Point[], width: number, pixelRatio: number): void {
		const data = ensureNotNull(this._data);
		switch (data.line.end?.left) {
			case LineEnd.Arrow:
				drawArrowEnd(points[1], points[0], ctx, width, pixelRatio);
				break;
			case LineEnd.Circle:
				drawCircleEnd(points[0], ctx, width, pixelRatio);
		}
		switch (data.line.end?.right) {
			case LineEnd.Arrow:
				drawArrowEnd(points[0], points[1], ctx, width, pixelRatio);
				break;
			case LineEnd.Circle:
				drawCircleEnd(points[1], ctx, width, pixelRatio);
		}
	}
}
