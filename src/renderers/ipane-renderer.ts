import { HitTestResult } from '../model/hit-test-result';
import { Coordinate } from '../model/coordinate';

export interface IPaneRenderer {
	draw(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean, hitTestData?: unknown): void;
	drawBackground?(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean, hitTestData?: unknown): void;
	hitTest?(x: Coordinate, y: Coordinate): HitTestResult<unknown> | null;
}
