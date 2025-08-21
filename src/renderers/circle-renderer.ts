/* eslint-disable no-multi-spaces */
/* eslint-disable no-trailing-spaces */
/* eslint-disable @typescript-eslint/tslint/config */
// import { ensureNotNull } from '../helpers/assertions';
import { DeepPartial } from '../helpers/strict-type-checks';

import { Coordinate } from '../model/coordinate';
import { HitTestResult, HitTestType } from '../model/hit-test-result';

import { CircleOptions } from '../model/line-tool-options';
import { Point } from '../model/point';

import { LineStyle } from '..';

import { IPaneRenderer } from './ipane-renderer';
import { AnchorPoint } from './line-anchor-renderer';
import { setLineStyle } from './draw-line';

export type CircleRendererData = DeepPartial<CircleOptions> & { points: AnchorPoint[]; hitTestBackground?: boolean };

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
    
        const [centerX, centerY] = this._calculateCirclePositionAndDimensions(point0);

        const radius = this._calculateCircleRadius(point0, point1);    
        
        if (!this._isCircleVisible(ctx, centerX, centerY, radius)) {
            // console.log('dont draw circle');
            return;
        }

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

    private _isCircleVisible(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number): boolean {
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
    
        // Check if any part of the circle's bounding box is within the canvas
        const circleLeft = centerX - radius;
        const circleRight = centerX + radius;
        const circleTop = centerY - radius;
        const circleBottom = centerY + radius;
    
        return (
            circleRight >= 0 &&                      // Circle's right edge is at or beyond the left canvas edge
            circleLeft <= canvasWidth &&            // Circle's left edge is at or before the right canvas edge
            circleBottom >= 0 &&                     // Circle's bottom edge is at or beyond the top canvas edge
            circleTop <= canvasHeight                 // Circle's top edge is at or before the bottom canvas edge
        );
    }
}

// Calculate the Euclidean distance between two points
export function calculateDistance(pointA: Point, pointB: Point): number {
	const deltaX = pointB.x - pointA.x;
	const deltaY = pointB.y - pointA.y;
	return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}
