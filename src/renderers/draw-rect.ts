import { Point } from '../model/point';

import { LineStyle } from '..';
import { setLineStyle } from './draw-line';

export function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number | number[], borderStyle?: number): void {
	let a; let b; let c; let d;

	if (Array.isArray(radius)) {
		if (2 === radius.length) {
			const e = Math.max(0, radius[0]);
			const t = Math.max(0, radius[1]);
			a = e;
			b = e;
			c = t;
			d = t;
		} else {
			if (4 !== radius.length) { throw new Error('Wrong border radius - it should be like css border radius'); }
			a = Math.max(0, radius[0]);
			b = Math.max(0, radius[1]);
			c = Math.max(0, radius[2]);
			d = Math.max(0, radius[3]);
		}
	} else {
		const e = Math.max(0, radius);
		a = e;
		b = e;
		c = e;
		d = e;
	}

	ctx.beginPath();

	setLineStyle(ctx, borderStyle || LineStyle.Solid);

	ctx.moveTo(x + a, y);
	ctx.lineTo(x + width - b, y);
	if (b !== 0) { ctx.arcTo(x + width, y, x + width, y + b, b); }
	ctx.lineTo(x + width, y + height - c);
	if (c !== 0) { ctx.arcTo(x + width, y + height, x + width - c, y + height, c); }
	ctx.lineTo(x + d, y + height);
	if (d !== 0) { ctx.arcTo(x, y + height, x, y + height - d, d); }
	ctx.lineTo(x, y + a);
	if (a !== 0) { ctx.arcTo(x, y, x + a, y, a); }
	ctx.stroke();
}

// eslint-disable-next-line max-params
export function fillRectWithBorder(
	ctx: CanvasRenderingContext2D,
	point0: Point,
	point1: Point,
	backgroundColor: string | undefined,
	borderColor: string | undefined,
	borderWidth: number = 0,
	borderStyle: LineStyle,
	borderAlign: 'outer' | 'center' | 'inner',
	extendLeft: boolean,
	extendRight: boolean,
	containerWidth: number
): void {
	const x1 = extendLeft ? 0 : point0.x;
	const x2 = extendRight ? containerWidth : point1.x;

	if (backgroundColor !== undefined) {
		ctx.fillStyle = backgroundColor;
		ctx.fillRect(x1, point0.y, x2 - x1, point1.y - point0.y);
	}

	if (borderColor !== undefined && borderWidth > 0) {
		ctx.beginPath();
		setLineStyle(ctx, borderStyle || LineStyle.Solid);

		let topLeft = new Point(0, 0);
		let topRight = new Point(0, 0);
		let bottomRight = new Point(0, 0);
		let bottomLeft = new Point(0, 0);

		switch (borderAlign) {
			case 'outer':
				{
					const halfBordeWidth = 0.5 * borderWidth;
					bottomRight = new Point(0, halfBordeWidth);
					bottomLeft = new Point(0, halfBordeWidth);
					topLeft = new Point(halfBordeWidth, -borderWidth);
					topRight = new Point(halfBordeWidth, -borderWidth);
					break;
				}
			case 'center':
				{
					const e = borderWidth % 2 ? 0.5 : 0;
					const t = borderWidth % 2 ? 0.5 : 1;
					const halfBordeWidth = 0.5 * borderWidth;

					bottomRight = new Point(halfBordeWidth - e, -e);
					bottomLeft = new Point(t + halfBordeWidth, -e);
					topLeft = new Point(-e, e + halfBordeWidth);
					topRight = new Point(t, e + halfBordeWidth);
					break;
				}
			case 'inner':
				{
					const halfBordeWidth = 0.5 * borderWidth;
					bottomRight = new Point(0, -halfBordeWidth);
					bottomLeft = new Point(1, -halfBordeWidth);
					topLeft = new Point(-halfBordeWidth, borderWidth);
					topRight = new Point(1 - halfBordeWidth, borderWidth);
					break;
				}
		}

		ctx.lineWidth = borderWidth;
		ctx.strokeStyle = borderColor;

		ctx.moveTo(x1 - bottomRight.x, point0.y - bottomRight.y);
		ctx.lineTo(x2 + bottomLeft.x, point0.y - bottomLeft.y);
		ctx.moveTo(point1.x + topRight.x, point0.y + topRight.y);
		ctx.lineTo(point1.x + topRight.x, point1.y - topRight.y);
		ctx.moveTo(x1 - bottomRight.x, point1.y + bottomRight.y);
		ctx.lineTo(x2 + bottomLeft.x, point1.y + bottomLeft.y);
		ctx.moveTo(point0.x - topLeft.x, point0.y + topLeft.y);
		ctx.lineTo(point0.x - topLeft.x, point1.y - topLeft.y);
		ctx.stroke();
	}
}
