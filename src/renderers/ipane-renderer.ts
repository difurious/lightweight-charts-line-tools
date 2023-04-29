import { Coordinate } from '../model/coordinate';
import { HitTestResult } from '../model/hit-test-result';

export interface IPaneRenderer {
	draw(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean, hitTestData?: unknown): void;
	drawBackground?(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean, hitTestData?: unknown): void;
	hitTest?(x: Coordinate, y: Coordinate, ctx: CanvasRenderingContext2D): HitTestResult<unknown> | null;
}
