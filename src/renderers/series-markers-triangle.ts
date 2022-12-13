import { Coordinate } from '../model/coordinate';

import { hitTestSquare } from './series-markers-square';

export function drawTriangle(ctx: CanvasRenderingContext2D, centerX: Coordinate, centerY: Coordinate, size: number): void {
	const halfArrowSize = size / 2;

	ctx.beginPath();
	ctx.moveTo(centerX, centerY - halfArrowSize);
	ctx.lineTo(centerX + halfArrowSize, centerY + halfArrowSize);
	ctx.lineTo(centerX - halfArrowSize, centerY + halfArrowSize);

	ctx.closePath();
	ctx.fill();
	ctx.stroke();
}

export function hitTestTriangle(centerX: Coordinate, centerY: Coordinate, size: number, x: Coordinate, y: Coordinate): boolean {
	return hitTestSquare(centerX, centerY, size, x, y);
}
