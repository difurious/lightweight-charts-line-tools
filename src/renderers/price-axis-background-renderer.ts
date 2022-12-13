import { drawScaled } from '../helpers/canvas-helpers';

import { /*IPriceAxisViewRenderer, PriceAxisViewRendererCommonData,*/ PriceAxisViewRendererOptions } from './iprice-axis-view-renderer';

export interface PriceAxisBackgroundRendererData {
	coordinate: number;
	color: string;
	height: number;
	visible: boolean;
}

export class PriceAxisBackgroundRenderer {
	private _data: PriceAxisBackgroundRendererData | null;
	//private _commonData: PriceAxisViewRendererCommonData | null;

	public constructor() {
		this._data = null;
		//this._commonData = null;
	}

	public setData(data: PriceAxisBackgroundRendererData/*, commonData: PriceAxisViewRendererCommonData*/): void {
		this._data = data;
		//this._commonData = commonData;
	}

	public drawBackground(ctx: CanvasRenderingContext2D, rendererOptions: PriceAxisViewRendererOptions, pixelRatio: number): void {
		if (this._data === null || this._data.visible === false) {
			return;
		}

		const { coordinate: y, height, color } = this._data;
		const width = ctx.canvas.clientWidth;

		drawScaled(ctx, pixelRatio, () => {
			ctx.fillStyle = color;
			ctx.fillRect(0, y, width, height);
		});		
		
		// if (this._commonData === null) {
			// return;
		// }
	}
}
