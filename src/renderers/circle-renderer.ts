/* eslint-disable no-multi-spaces */
/* eslint-disable no-trailing-spaces */
/* eslint-disable @typescript-eslint/tslint/config */
// import { ensureNotNull } from '../helpers/assertions';
import { DeepPartial } from '../helpers/strict-type-checks';

import { Coordinate } from '../model/coordinate';
import { HitTestResult, HitTestType } from '../model/hit-test-result';
// import { distanceToSegment, pointInBox } from '../model/interesection';
import { CircleOptions } from '../model/line-tool-options';
import { Point } from '../model/point';

import { LineStyle } from '..';
// import { calculateDistance } from './draw-rect';
import { IPaneRenderer } from './ipane-renderer';
import { AnchorPoint } from './line-anchor-renderer';
import { setLineStyle } from './draw-line';

export type CircleRendererData = DeepPartial<CircleOptions> & { points: AnchorPoint[]; hitTestBackground?: boolean };

// GOTCHA - BUG  since there are 2 points to make the circle, if point1 to is to the left of the center point (point0) and then
// you pan the screen so point1 and point0 are off screen, it will hide the circle eventhough you see the circle further to the right.
// If point1 is to the right of point0 and then you pan, things will will act normal
// this glitch might be what causes drawing a rectangle off screen when no data is to the left and you start drawing in that blank area,
// and the rectangle does not show initially.

export class CircleRenderer implements IPaneRenderer {
    protected _backHitTest: HitTestResult<void>;
    protected _hitTest: HitTestResult<void>;
    protected _data: CircleRendererData | null;

    public constructor(hitTest?: HitTestResult<void>, backHitTest?: HitTestResult<void>) {
        this._backHitTest = backHitTest || new HitTestResult(HitTestType.MovePointBackground);
        this._hitTest = hitTest || new HitTestResult(HitTestType.MovePoint);
        this._data = null;
    }

    public setData(data: CircleRendererData): void {
        this._data = data;
    }

    public hitTest(x: Coordinate, y: Coordinate, ctx: CanvasRenderingContext2D): HitTestResult<void> | null {
        if (null === this._data || this._data.points.length < 2) {
            return null;
        }

        const scaledPoint = new Point(x, y);
        const [point0, point1] = this._data.points;
    
        // Calculate the distance from the point to the center (point0)
        const distanceToCenter = Math.sqrt(Math.pow(point0.x - scaledPoint.x, 2) + Math.pow(point0.y - scaledPoint.y, 2));
    
        // Calculate the distance between point0 and point1
        const distance = calculateDistance(point0, point1);

        // figure out the border width to use to get a thickness for dragging object
        const scaledBorderWidth = this._calculateScaledBorderWidth(1);

        // make the selectable area a little larger for ease of use
        const hitTestThreshold = 12;      

        // If the mouse is at the border of the circle, allow dragging
        // if the mouse is at the center and 2x away from if going outwards, then pass
        if ((distanceToCenter >= distance + scaledBorderWidth - hitTestThreshold &&
            distanceToCenter <= distance + scaledBorderWidth) ||
            (distanceToCenter <= hitTestThreshold * 2)) {
            return this._hitTest;
        }
    
        return null;
    }
    
    public draw(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean, hitTestData?: unknown): void {
        if (this._shouldSkipDrawing() || this._data === null || this._data.points.length < 2) {
            return;
        }
    
        ctx.save();
    
        const scaledBorderWidth = this._calculateScaledBorderWidth(pixelRatio);
    
        const [point0, point1] = this._data.points;
        // const extend = this._data.extend || {};
        // const left = extend.left || false; // Provide a default value
        // const right = extend.right || false; // Provide a default value
    
        const [centerX, centerY] = this._calculateCirclePositionAndDimensions(point0);
    
        const background = this._data.background;
        const borderColor = this._data.border?.color;
    
        this._drawBackground(ctx, centerX, centerY, this._calculateCircleRadius(point0, point1), background?.color);
        this._drawBorder(ctx, centerX, centerY, this._calculateCircleRadius(point0, point1), scaledBorderWidth, borderColor, borderColor !== undefined);
    
        ctx.restore();
    }
    
    private _shouldSkipDrawing(): boolean {
        return this._data === null || this._data.points.length < 2 || (this._data?.border?.width || 0) <= 0 && !this._data?.background?.color;
    }
    
    private _calculateScaledBorderWidth(pixelRatio: number): number {
        const borderWidth = this._data?.border?.width || 0;
        return borderWidth ? Math.max(1, Math.floor(borderWidth * pixelRatio)) : 0;
    }
    
    private _calculateCirclePositionAndDimensions(point0: Point): [number, number] {
        const centerX = point0.x;
        const centerY = point0.y;
    
        return [centerX, centerY];
    }
    
    private _calculateCircleRadius(point0: Point, point1: Point): number {
        return calculateDistance(point0, point1);
    }
    
    private _drawBackground(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, backgroundColor: string | undefined): void {
        if (backgroundColor !== undefined) {
            ctx.fillStyle = backgroundColor;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
    
    private _drawBorder(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, scaledBorderWidth: number, borderColor: string | undefined, shouldDrawBorder: boolean): void {
        if (shouldDrawBorder && borderColor !== undefined && scaledBorderWidth > 0) {
            ctx.beginPath();
            setLineStyle(ctx, this._data?.border?.style || LineStyle.Solid);
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.lineWidth = scaledBorderWidth;
            ctx.strokeStyle = borderColor;
            ctx.stroke();
        }
    }
}

// Calculate the Euclidean distance between two points
export function calculateDistance(pointA: Point, pointB: Point): number {
	const deltaX = pointB.x - pointA.x;
	const deltaY = pointB.y - pointA.y;
	return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}
