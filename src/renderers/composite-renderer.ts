import { Coordinate } from '../model/coordinate';
import { HitTestResult } from '../model/hit-test-result';

import { IPaneRenderer } from './ipane-renderer';

export class CompositeRenderer implements IPaneRenderer {
	private _renderers: IPaneRenderer[] = [];
	private _globalAlpha: number = 1;

	public setGlobalAlpha(value: number): void {
		this._globalAlpha = value;
	}

	public append(renderer: IPaneRenderer): void {
		this._renderers.push(renderer);
	}

	public insert(renderer: IPaneRenderer, index: number): void {
		this._renderers.splice(index, 0, renderer);
	}

	public clear(): void {
		this._renderers.length = 0;
	}

	public isEmpty(): boolean {
		return this._renderers.length === 0;
	}

	public setRenderers(renderers: IPaneRenderer[]): void {
		this._renderers = renderers;
	}

	public draw(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean, hitTestData?: unknown): void {
		this._renderers.forEach((r: IPaneRenderer) => {
			ctx.save();
			ctx.globalAlpha = this._globalAlpha;
			r.draw(ctx, pixelRatio, isHovered, hitTestData);
			ctx.restore();
		});
	}

	public hitTest(x: Coordinate, y: Coordinate, ctx: CanvasRenderingContext2D): HitTestResult<unknown> | null {
		let result = null;
		for (let i = this._renderers.length - 1; i >= 0; i--) {
			const renderer = this._renderers[i];
			if (renderer.hitTest) {
				result = renderer.hitTest(x, y, ctx) || null;
			}
			if (result) { break; }
		}
		return result;
	}
}
