/* eslint-disable @typescript-eslint/tslint/config */
import { RectangleRenderer, RectangleRendererData } from './rectangle-renderer';
import { IPaneRenderer } from './ipane-renderer';
import { TextRenderer, TextRendererData } from './text-renderer';
import { HitTestResult } from '../model/hit-test-result';
import { Coordinate } from '../model/coordinate';

export interface LongShortPositionRendererData {
    entryStopLossData: RectangleRendererData;
    entryStopLossTextData: TextRendererData;
    ptData: RectangleRendererData;
    ptTextData: TextRendererData;
}

export class LongShortPositionRenderer implements IPaneRenderer {
    private _entryStopLossRenderer: RectangleRenderer = new RectangleRenderer();
    private _ptRenderer: RectangleRenderer = new RectangleRenderer();
    private _textRenderer: TextRenderer = new TextRenderer();
    private _data: LongShortPositionRendererData | null = null;

    public setData(data: LongShortPositionRendererData | null): void {
        this._data = data;
    }

    public draw(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean, hitTestData?: unknown): void {
        if (this._data === null) {
            return;
        }

        const { entryStopLossData, entryStopLossTextData, ptData, ptTextData } = this._data;

        this._entryStopLossRenderer.setData(entryStopLossData);
        this._ptRenderer.setData(ptData);

        this._entryStopLossRenderer.draw(ctx, pixelRatio, isHovered, hitTestData);
        this._ptRenderer.draw(ctx, pixelRatio, isHovered, hitTestData);

		// Entry-Stop Loss Text
		if (entryStopLossTextData) {
			this._textRenderer.setData(entryStopLossTextData);
			this._textRenderer.draw(ctx, pixelRatio);
		}

		// Entry-PT Text
		if (ptTextData) {
			this._textRenderer.setData(ptTextData);
			this._textRenderer.draw(ctx, pixelRatio);
		}
    }

    public hitTest(x: Coordinate, y: Coordinate, ctx: CanvasRenderingContext2D): HitTestResult<unknown> | null {
        if (this._data === null) {
            return null;
        }

        // Prioritize hit-testing the PT rectangle, then the Entry-Stop Loss rectangle
        let hitTestResult = this._ptRenderer.hitTest(x, y, ctx);
        if (hitTestResult === null) {
            hitTestResult = this._entryStopLossRenderer.hitTest(x, y, ctx);
        }

        return hitTestResult;
    }
}
