import { ensureDefined, ensureNotNull } from '../helpers/assertions';
import { drawScaled } from '../helpers/canvas-helpers';
import { DeepPartial } from '../helpers/strict-type-checks';

import { Coordinate } from '../model/coordinate';
import { HitTestResult, HitTestType } from '../model/hit-test-result';
import { pointInBox, pointInPolygon } from '../model/interesection';
import { BoxHorizontalAlignment, BoxVerticalAlignment, TextAlignment, TextOptions } from '../model/line-tool-options';
import { Box, Point, Rect } from '../model/point';

import { drawRoundRect } from './draw-rect';
import { IPaneRenderer } from './ipane-renderer';

interface LinesInfo {
	lines: string[];
	linesMaxWidth: number;
}

interface FontInfo {
	fontSize: number;
	fontStyle: string;
}

interface BoxSize {
	width: number;
	height: number;
}

interface InternalData {
	boxLeft: number;
	boxTop: number;
	boxWidth: number;
	boxHeight: number;
	textStart: number;
	textTop: number;
	textAlign: TextAlignment;
}

export interface TextRendererData {
	text: DeepPartial<TextOptions>;
	points?: Point[];
}

export class TextRenderer implements IPaneRenderer {
	protected _internalData: InternalData | null = null;
	protected _polygonPoints: Point[] | null = null;
	protected _linesInfo: LinesInfo | null = null;
	protected _fontInfo: FontInfo | null = null;
	protected _boxSize: BoxSize | null = null;
	protected _data: TextRendererData | null = null;

	protected _hitTest: HitTestResult<void>;

	public constructor(data?: TextRendererData, hitTest?: HitTestResult<void>) {
		this._hitTest = hitTest || new HitTestResult(HitTestType.MovePoint);
		if (data !== undefined) { this.setData(data); }
	}

	public setData(data: TextRendererData): void {
		// eslint-disable-next-line complexity
		function checkUnchanged(before: TextRendererData | null, after: TextRendererData | null): boolean {
			if (null === before || null === after) { return null === before === (null === after);}
			if (before.points === undefined !== (after.points === undefined)) { return false; }

			if (before.points !== undefined && after.points !== undefined) {
				if (before.points.length !== after.points.length) { return false; }

				for (let i = 0; i < before.points.length; ++i) {
					if (before.points[i].x !== after.points[i].x || before.points[i].y !== after.points[i].y) { return false; }
				}
			}

			return before.text?.forceCalculateMaxLineWidth === after.text?.forceCalculateMaxLineWidth
                && before.text?.forceTextAlign === after.text?.forceTextAlign
                && before.text?.wordWrapWidth === after.text?.wordWrapWidth
                && before.text?.padding === after.text?.padding
                && before.text?.value === after.text?.value
                && before.text?.alignment === after.text?.alignment
                && before.text?.font?.bold === after.text?.font?.bold
                && before.text?.font?.size === after.text?.font?.size
                && before.text?.font?.family === after.text?.font?.family
                && before.text?.font?.italic === after.text?.font?.italic
                && before.text?.box?.angle === after.text?.box?.angle
                && before.text?.box?.scale === after.text?.box?.scale
                && before.text?.box?.offset?.x === after.text?.box?.offset?.x
                && before.text?.box?.offset?.y === after.text?.box?.offset?.y
                && before.text?.box?.maxHeight === after.text?.box?.maxHeight
                && before.text?.box?.padding?.x === after.text?.box?.padding?.x
                && before.text?.box?.padding?.y === after.text?.box?.padding?.y
                && before.text?.box?.alignment?.vertical === after.text?.box?.alignment?.vertical
                && before.text?.box?.alignment?.horizontal === after.text?.box?.alignment?.horizontal
                && before.text?.box?.background?.inflation?.x === after.text?.box?.background?.inflation?.x
                && before.text?.box?.background?.inflation?.y === after.text?.box?.background?.inflation?.y
                && before.text?.box?.border?.highlight === after.text?.box?.border?.highlight
                && before.text?.box?.border?.radius === after.text?.box?.border?.radius
                && before.text?.box?.shadow?.offset === after.text?.box?.shadow?.offset
                && before.text?.box?.shadow?.color === after.text?.box?.shadow?.color
                && before.text?.box?.shadow?.blur === after.text?.box?.shadow?.blur;
		}

		if (checkUnchanged(this._data, data)) {
			this._data = data;
		} else {
			this._data = data;
			this._polygonPoints = null;
			this._internalData = null;
			this._linesInfo = null;
			this._fontInfo = null;
			this._boxSize = null;
		}
	}

	public hitTest(x: Coordinate, y: Coordinate): HitTestResult<void> | null {
		if (this._data === null || this._data.points === undefined || this._data.points.length === 0) {
			return null;
		} else if (pointInPolygon(new Point(x, y), this._getPolygonPoints())) {
			return this._hitTest;
		} else {
			return null;
		}
	}

	public doesIntersectWithBox(box: Box): boolean {
		if (this._data === null || this._data.points === undefined || this._data.points.length === 0) {
			return false;
		} else {
			return pointInBox(this._data.points[0], box);
		}
	}

	public measure(): BoxSize {
		if (this._data === null) { return { width: 0, height: 0 }; }
		return this._getBoxSize();
	}

	public rect(): Rect {
		if (this._data === null) { return { x: 0, y: 0, width: 0, height: 0 }; }
		const internalData = this._getInternalData();
		return { x: internalData.boxLeft, y: internalData.boxTop, width: internalData.boxWidth, height: internalData.boxHeight };
	}

	public isOutOfScreen(width: number, height: number): boolean {
		if (null === this._data || void 0 === this._data.points || 0 === this._data.points.length) { return true; }

		const internalData = this._getInternalData();
		if (internalData.boxLeft + internalData.boxWidth < 0 || internalData.boxLeft > width) {
			const screenBox = new Box(new Point(0, 0), new Point(width, height));
			return this._getPolygonPoints().every((point: Point) => !pointInBox(point, screenBox));
		}

		return false;
	}

	public setPoints(points: Point[], hitTest: HitTestResult<void>): void {
		ensureNotNull(this._data).points = points;
		this._hitTest = hitTest || new HitTestResult(HitTestType.MovePoint);
	}

	public fontStyle(): string {
		return this._data === null ? '' : this._getFontInfo().fontStyle;
	}

	public wordWrap(test: string, wrapWidth?: number, font?: string): string[] {
		return textWrap(test, font || this.fontStyle(), wrapWidth);
	}

    // eslint-disable-next-line complexity
	public draw(ctx: CanvasRenderingContext2D, pixelRatio: number): void {
		if (this._data === null || this._data.points === undefined || this._data.points.length === 0) { return; }
		const cssWidth = ctx.canvas.width;
		const cssHeight = ctx.canvas.height;
		if (this.isOutOfScreen(cssWidth, cssHeight)) { return; }

		const textData = this._data.text;
		const internalData = this._getInternalData();
		const pivot = this._getRotationPoint().scaled(pixelRatio);
		const angleDegrees = textData.box?.angle || 0;
		const angle = -angleDegrees * Math.PI / 180;

		ctx.save();
		ctx.translate(pivot.x, pivot.y);
		ctx.rotate(angle);
		ctx.translate(-pivot.x, -pivot.y);

		const fontSize = this._getFontInfo().fontSize;
		ctx.textAlign = internalData.textAlign;
		ctx.textBaseline = 'middle';
		ctx.font = this.fontStyle();

		const scaledTop = Math.round(internalData.boxTop * pixelRatio);
		const scaledLeft = Math.round(internalData.boxLeft * pixelRatio);
		const scaledRight = scaledLeft + Math.round(internalData.boxWidth * pixelRatio);
		const scaledBottom = scaledTop + Math.round(internalData.boxHeight * pixelRatio);

		if (textData.box?.background?.color || textData.box?.border?.color || textData.box?.border?.highlight && textData.wordWrapWidth) {
			const borderWidth = Math.round((textData.box?.border?.width || Math.max(fontSize / 12, 1)) * pixelRatio);
			const halfBorderWidth = borderWidth / 2;
			let ctxUpdated = false;

			if (textData.box?.shadow) {
				const { color, blur, offset } = textData.box?.shadow;
				ctx.save();
				ctx.shadowColor = color as string;
				ctx.shadowBlur = blur as number;
				ctx.shadowOffsetX = offset?.x || 0;
				ctx.shadowOffsetY = offset?.y || 0;
				ctxUpdated = true;
			}

			if (textData.box.border?.width) {
				if (textData.box.border?.color) {
					ctx.strokeStyle = textData.box.border.color;
				}
				ctx.lineWidth = borderWidth;

				const radius = textData.box?.border?.radius ?? 0 * pixelRatio + borderWidth;
				const textBoxBorderStyle = textData.box?.border?.style;
				drawRoundRect(ctx, scaledLeft - halfBorderWidth, scaledTop - halfBorderWidth, scaledRight - scaledLeft + borderWidth, scaledBottom - scaledTop + borderWidth, radius, textBoxBorderStyle);

				if (textData.box.background?.color) {
					ctx.fillStyle = textData.box.background.color;
					ctx.fill();
				}

				if (ctxUpdated) { ctx.restore(); ctxUpdated = false; }
			} else {
				if (textData.box.background?.color) {
					ctx.fillStyle = textData.box.background.color;
					ctx.fillRect(scaledLeft, scaledTop, scaledRight - scaledLeft, scaledBottom - scaledTop);
				}
				if (ctxUpdated) { ctx.restore(); ctxUpdated = false; }
			}
		}

		ctx.fillStyle = textData.font?.color as string;
		const { lines } = this._getLinesInfo();
		const extraSpace = 0.05 * fontSize;
		const linePadding = getScaledPadding(this._data);
		const x = (scaledLeft + Math.round(internalData.textStart * pixelRatio)) / pixelRatio;
		let y = (scaledTop + Math.round((internalData.textTop + extraSpace) * pixelRatio)) / pixelRatio;

		for (const line of lines) {
			// eslint-disable-next-line @typescript-eslint/no-loop-func
			drawScaled(ctx, pixelRatio, () => ctx.fillText(line, x, y));
			y += fontSize + linePadding;
		}
		ctx.restore();
	}

    // eslint-disable-next-line complexity
	private _getInternalData(): InternalData {
		if (this._internalData !== null) { return this._internalData; }
		const data = ensureNotNull(this._data);

		const paddingX = getScaledBoxPaddingX(data);
		const paddingY = getScaledBoxPaddingY(data);
		const inflationPaddingX = getScaledBackgroundInflationX(data) + paddingX;
		const inflationPaddingY = getScaledBackgroundInflationY(data) + paddingY;

		const anchor = ensureDefined(data.points)[0];
		const boxSize = this._getBoxSize();
		const boxWidth = boxSize.width;
		const boxHeight = boxSize.height;
		let anchorY = anchor.y as number;
		let anchorX = anchor.x as number;

		switch (data.text?.box?.alignment?.vertical) {
			case BoxVerticalAlignment.Top:
				anchorY -= boxHeight + (data.text?.box?.offset?.y || 0);
				break;
			case BoxVerticalAlignment.Middle:
				anchorY -= boxHeight / 2;
				break;
			case BoxVerticalAlignment.Bottom:
				anchorY += (data.text?.box?.offset?.y || 0);
		}

		const textY = anchorY + (inflationPaddingY) + getScaledFontSize(data) / 2;
		let textAlign = TextAlignment.Start;
		let textX = 0;

		switch (data.text?.box?.alignment?.horizontal) {
			case BoxHorizontalAlignment.Left:
				anchorX += (data.text?.box?.offset?.x || 0);
				break;
			case BoxHorizontalAlignment.Center:
				anchorX -= boxWidth / 2;
				break;
			case BoxHorizontalAlignment.Right:
				anchorX -= boxWidth + (data.text?.box?.offset?.x || 0);
		}
		switch (ensureDefined(data.text?.alignment)) {
			case TextAlignment.Start:
			case TextAlignment.Left: {
				textAlign = TextAlignment.Start;
				textX = anchorX + inflationPaddingX;

				if (isRtl()) {
					if (data.text?.forceTextAlign) {
						textAlign = TextAlignment.Left;
					} else {
						textX = anchorX + boxWidth - inflationPaddingX;
						textAlign = TextAlignment.Right;
					}
				}
				break;
			}
			case TextAlignment.Center:
				textAlign = TextAlignment.Center;
				textX = anchorX + boxWidth / 2;
				break;
			case TextAlignment.Right:
			case TextAlignment.End:
				textAlign = TextAlignment.End;
				textX = anchorX + boxWidth - inflationPaddingX;
				if (isRtl() && data.text?.forceTextAlign) {
					textAlign = TextAlignment.Right;
				}
				break;
		}

		this._internalData = {
			boxLeft: anchorX,
			boxTop: anchorY,
			boxWidth: boxWidth,
			boxHeight: boxHeight,
			textAlign: textAlign,
			textTop: textY - anchorY,
			textStart: textX - anchorX,
		};

		return this._internalData;
	}

	private _getLinesMaxWidth(lines: string[]): number {
		if (!cacheCanvas) { createCacheCanvas(); }
		cacheCanvas.textBaseline = 'alphabetic';
		cacheCanvas.font = this.fontStyle();

		if (this._data !== null && this._data.text?.wordWrapWidth && !this._data.text?.forceCalculateMaxLineWidth) {
			return this._data.text?.wordWrapWidth * getFontAwareScale(this._data);
		}

		let maxWidth = 0;
		for (const line of lines) {
			maxWidth = Math.max(maxWidth, cacheCanvas.measureText(line).width);
		}
		return maxWidth;
	}

	private _getLinesInfo(): LinesInfo {
		if (null === this._linesInfo) {
			const data = ensureNotNull(this._data);
			let lines = this.wordWrap(data.text?.value || '', data.text?.wordWrapWidth);

			if (data.text?.box?.maxHeight !== undefined) {
				const maxHeight = ensureDefined(data.text?.box?.maxHeight);
				const scaledFontSize = getScaledFontSize(data);
				const scaledPadding = getScaledPadding(data);
				const maxLines = Math.floor((maxHeight + scaledPadding) / (scaledFontSize + scaledPadding));
				if (lines.length > maxLines) { lines = lines.slice(0, maxLines); }
			}

			this._linesInfo = { linesMaxWidth: this._getLinesMaxWidth(lines), lines };
		}
		return this._linesInfo;
	}

	private _getFontInfo(): FontInfo {
		if (this._fontInfo === null) {
			const data = ensureNotNull(this._data);
			const fontSize = getScaledFontSize(data);
			const fontStyle = (data.text?.font?.bold ? 'bold ' : '') + (data.text?.font?.italic ? 'italic ' : '') + fontSize + 'px ' + data.text?.font?.family;
			this._fontInfo = { fontStyle: fontStyle, fontSize: fontSize };
		}
		return this._fontInfo;
	}

	private _getBoxSize(): BoxSize {
		if (null === this._boxSize) {
			const linesInfo = this._getLinesInfo();
			const data = ensureNotNull(this._data);
			this._boxSize = {
				width: getBoxWidth(data, linesInfo.linesMaxWidth),
				height: getBoxHeight(data, linesInfo.lines.length),
			};
		}
		return this._boxSize;
	}

	private _getPolygonPoints(): Point[] {
		if (null !== this._polygonPoints) {return this._polygonPoints;}
		if (null === this._data) {return [];}

		const { boxLeft, boxTop, boxWidth, boxHeight } = this._getInternalData();
		const pivot = this._getRotationPoint();
		const angleDegrees = this._data.text?.box?.angle || 0;
		const angle = -angleDegrees * Math.PI / 180;
		this._polygonPoints = [
			rotatePoint(new Point(boxLeft, boxTop), pivot, angle),
			rotatePoint(new Point(boxLeft + boxWidth, boxTop), pivot, angle),
			rotatePoint(new Point(boxLeft + boxWidth, boxTop + boxHeight), pivot, angle),
			rotatePoint(new Point(boxLeft, boxTop + boxHeight), pivot, angle),
		];

		return this._polygonPoints;
	}

	private _getRotationPoint(): Point {
		const { boxLeft, boxTop, boxWidth, boxHeight } = this._getInternalData();
		const { horizontal, vertical } = ensureDefined(this._data?.text?.box?.alignment);
		let x = 0;
		let y = 0;

		switch (horizontal) {
			case BoxHorizontalAlignment.Center:
				x = boxLeft + boxWidth / 2;
				break;
			case BoxHorizontalAlignment.Left:
				x = boxLeft;
				break;
			case BoxHorizontalAlignment.Right:
				x = boxLeft + boxWidth;
		}
		switch (vertical) {
			case BoxVerticalAlignment.Middle:
				y = boxTop + boxHeight / 2;
				break;
			case BoxVerticalAlignment.Bottom:
				y = boxTop;
				break;
			case BoxVerticalAlignment.Top:
				y = boxTop + boxHeight;
		}
		return new Point(x, y);
	}
}

// eslint-disable-next-line complexity
function textWrap(text: string, font: string, lineWrapWidth: number | string | undefined): string[] {
	if (!cacheCanvas) {createCacheCanvas();}
	lineWrapWidth = Object.prototype.toString.call(lineWrapWidth) === '[object String]' ? parseInt(lineWrapWidth as string) : lineWrapWidth as number;
	text += '';
	const lines = !Number.isInteger(lineWrapWidth) || !isFinite(lineWrapWidth) || lineWrapWidth <= 0
        ? text.split(/\r\n|\r|\n|$/)
        : text.split(/[^\S\r\n]*(?:\r\n|\r|\n|$)/);

	if (!lines[lines.length - 1]) { lines.pop(); }
	if (!Number.isInteger(lineWrapWidth) || !isFinite(lineWrapWidth) || lineWrapWidth <= 0) { return lines; }

	cacheCanvas.font = font;
	const wrappedLines = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const lineWidth = cacheCanvas.measureText(line).width;
		if (lineWidth <= lineWrapWidth) {
			wrappedLines.push(line);
			continue;
		}

		const splitedLine = line.split(/([-)\]},.!?:;])|(\s+)/);
		for (; splitedLine.length;) {
			let space = Math.floor(lineWrapWidth / lineWidth * (splitedLine.length + 2) / 3);

			if (space <= 0 || cacheCanvas.measureText(splitedLine.slice(0, 3 * space - 1).join('')).width <= lineWrapWidth) {
				for (; cacheCanvas.measureText(splitedLine.slice(0, 3 * (space + 1) - 1).join('')).width <= lineWrapWidth;) {space++;}
			} else {
				// eslint-disable-next-line no-empty
				for (; space > 0 && cacheCanvas.measureText(splitedLine.slice(0, 3 * --space - 1).join('')).width > lineWrapWidth;) {}
			}

			if (space > 0) {
				wrappedLines.push(splitedLine.slice(0, 3 * space - 1).join(''));
				splitedLine.splice(0, 3 * space);
			} else {
				const paragraph = splitedLine[0] + (splitedLine[1] || '');
				let subspace = Math.floor(lineWrapWidth / cacheCanvas.measureText(paragraph).width * paragraph.length);

				if (cacheCanvas.measureText(paragraph.substring(0, subspace)).width <= lineWrapWidth) {
					for (; cacheCanvas.measureText(paragraph.substring(0, subspace + 1)).width <= lineWrapWidth;) {subspace++;}
				} else {
					// eslint-disable-next-line no-empty
					for (; subspace > 1 && cacheCanvas.measureText(paragraph.substring(0, --subspace)).width > lineWrapWidth;) {}
				}

				subspace = Math.max(1, subspace);
				wrappedLines.push(paragraph.substring(0, subspace));
				splitedLine[0] = paragraph.substring(subspace);
				splitedLine[1] = '';
			}

			if (cacheCanvas.measureText(splitedLine.join('')).width <= lineWrapWidth) {
				wrappedLines.push(splitedLine.join(''));
				break;
			}
		}
	}
	return wrappedLines;
}

let cacheCanvas: CanvasRenderingContext2D;
function createCacheCanvas(): void {
	const canvas = document.createElement('canvas');
	canvas.width = 0;
	canvas.height = 0;
	cacheCanvas = ensureNotNull(canvas.getContext('2d'));
}

function rotatePoint(point: Point, pivot: Point, angle: number): Point {
	if (0 === angle) { return point.clone(); }
	const x = (point.x - pivot.x) * Math.cos(angle) - (point.y - pivot.y) * Math.sin(angle) + pivot.x;
	const y = (point.x - pivot.x) * Math.sin(angle) + (point.y - pivot.y) * Math.cos(angle) + pivot.y;
	return new Point(x, y);
}

function getBoxWidth(data: TextRendererData, maxLineWidth: number): number {
	return maxLineWidth + 2 * getScaledBackgroundInflationX(data) + 2 * getScaledBoxPaddingX(data);
}

function getBoxHeight(data: TextRendererData, linesCount: number): number {
	return getScaledFontSize(data) * linesCount + getScaledPadding(data) * (linesCount - 1) + 2 * getScaledBackgroundInflationY(data) + 2 * getScaledBoxPaddingY(data);
}

function getScaledBoxPaddingY(data: TextRendererData): number {
	return data.text?.box?.padding?.y !== undefined ? data.text?.box?.padding?.y * getFontAwareScale(data) : getScaledFontSize(data) / 3;
}

function getScaledBoxPaddingX(data: TextRendererData): number {
	return data.text?.box?.padding?.x ? data.text?.box?.padding?.x * getFontAwareScale(data) : getScaledFontSize(data) / 3;
}

function getScaledBackgroundInflationY(data: TextRendererData): number {
	return (data.text?.box?.background?.inflation?.y || 0) * getFontAwareScale(data);
}

function getScaledBackgroundInflationX(data: TextRendererData): number {
	return (data.text?.box?.background?.inflation?.x || 0) * getFontAwareScale(data);
}

function getScaledPadding(data: TextRendererData): number {
	return (data.text?.padding || 0) * getFontAwareScale(data);
}

function getScaledFontSize(data: TextRendererData): number {
	return Math.ceil(getFontSize(data) * getFontAwareScale(data));
}

function getFontSize(data: TextRendererData): number {
	return data.text?.font?.size || 30;
}

function getFontAwareScale(data: TextRendererData): number {
	const scale = Math.min(1, Math.max(0.2, data.text?.box?.scale || 1));
	if (scale === 1) {return scale;}
	const fontSize = getFontSize(data);
	return Math.ceil(scale * fontSize) / fontSize;
}

function isRtl(): boolean {
	return 'rtl' === window.document.dir;
}
