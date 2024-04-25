/* eslint-disable complexity */
/* eslint-disable no-trailing-spaces */
/* eslint-disable @typescript-eslint/tslint/config */
import { ensureDefined, ensureNotNull } from '../helpers/assertions';
import { setLineStyle, LineStyle } from './draw-line';
import { drawScaled } from '../helpers/canvas-helpers';
import { DeepPartial } from '../helpers/strict-type-checks';
import { PriceScale } from '../model/price-scale';

import { Coordinate } from '../model/coordinate';
import { HitTestResult, HitTestType } from '../model/hit-test-result';
import { pointInBox, pointInPolygon } from '../model/interesection';
import { BoxHorizontalAlignment, BoxVerticalAlignment, TextAlignment, TextOptions, MarketDepthOptions, MarketDepthSingleAggregatesData } from '../model/line-tool-options';
// import { MarketDepthOptionDefaults } from '../api/options/line-tools-options-defaults';
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

export interface MarketDepthRendererData {
	text: DeepPartial<TextOptions>;
	points?: Point[];
	marketDepth: DeepPartial<MarketDepthOptions>;
	priceScale: PriceScale;
}

export class MarketDepthRenderer implements IPaneRenderer {
	protected _internalData: InternalData | null = null;
	protected _polygonPoints: Point[] | null = null;
	protected _linesInfo: LinesInfo | null = null;
	protected _fontInfo: FontInfo | null = null;
	protected _boxSize: BoxSize | null = null;
	protected _data: MarketDepthRendererData | null = null;

	protected _hitTest: HitTestResult<void>;

	public constructor(data?: MarketDepthRendererData, hitTest?: HitTestResult<void>) {
		this._hitTest = hitTest || new HitTestResult(HitTestType.MovePoint);
		if (data !== undefined) { this.setData(data); }
	}

	public setData(data: MarketDepthRendererData): void {
		// force data to not be cached
		this._data = data;
		this._polygonPoints = null;
		this._internalData = null;
		this._linesInfo = null;
		this._fontInfo = null;
		this._boxSize = null;
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

	public rect(text?: string): Rect {
		if (this._data === null) { return { x: 0, y: 0, width: 0, height: 0 }; }
		const internalData = this._getInternalData(text);
		return { x: internalData.boxLeft, y: internalData.boxTop, width: internalData.boxWidth, height: internalData.boxHeight };
	}

	public isOutOfScreen(width: number, height: number, text?: string): boolean {
		if (null === this._data || void 0 === this._data.points || 0 === this._data.points.length) { return true; }

		const internalData = this._getInternalData(text);
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

	public draw(ctx: CanvasRenderingContext2D, pixelRatio: number): void {
		if (this._data === null || this._data.points === undefined || this._data.points.length === 0) {
			return;
		}

		// Function to draw text for a single market depth level
		const drawText = (passthroughText: string, passthroughPrice: string) => {
			if (this._data === null || this._data.text === null) {
				return;
			}
			const priceScale = ensureNotNull(this._data.priceScale);
			const firstValue = ensureNotNull(priceScale.firstValue());

			let xPos = 0;
			if (this._data.points !== undefined && this._data.points.length > 0 && options.timestampStartOffset !== undefined) {
				xPos = Number(ensureNotNull(this._data.points[0]).x * pixelRatio) + options.timestampStartOffset;
			}
			const yPos = Number(priceScale.priceToCoordinate(Number(passthroughPrice), Number(firstValue)));

			const textData = this._data.text;
			const internalData = this._getInternalData(passthroughText, xPos, yPos);
			const pivot = this._getRotationPoint(passthroughText, xPos, yPos).scaled(pixelRatio);
			const angleDegrees = textData.box?.angle || 0;
			const angle = -angleDegrees * Math.PI / 180;

			const boxWidth = internalData.boxWidth;
			const boxHeight = internalData.boxHeight;
			const textX = xPos; 
			const textY = yPos - boxHeight / 2;

			ctx.save();
			ctx.translate(pivot.x, pivot.y);
			ctx.rotate(angle);
			ctx.translate(-pivot.x, -pivot.y);
		
			const fontSize = this._getFontInfo().fontSize;
			ctx.textAlign = internalData.textAlign;
			ctx.textBaseline = 'middle';
			ctx.font = this.fontStyle();

			// Draw the text box background and border (if applicable):
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
		
				let adjustedTextX = 0;
				let adjustedTextY = 0;
				if (textData.box.border?.width) {
					if (textData.box.border?.color) {
						ctx.strokeStyle = textData.box.border.color;
					}
					ctx.lineWidth = borderWidth;
		
					const radius = textData.box?.border?.radius ?? 0 * pixelRatio + borderWidth;
					const textBoxBorderStyle = textData.box?.border?.style;
		
					// Adjust text box coordinates based on border and alignment:
					adjustedTextX = textX - halfBorderWidth - boxWidth / 2;
					adjustedTextY = textY - halfBorderWidth;
		
					// Draw the text box at the adjusted position:
					drawRoundRect(ctx, adjustedTextX, adjustedTextY, boxWidth * pixelRatio + borderWidth, boxHeight * pixelRatio + borderWidth, radius, textBoxBorderStyle);
		
					if (textData.box.background?.color) {
						ctx.fillStyle = textData.box.background.color;
						ctx.fill();
					}
		
					if (ctxUpdated) {
						ctx.restore();
						ctxUpdated = false;
					}
				} else {
					if (textData.box.background?.color) {
						ctx.fillStyle = textData.box.background.color;
						ctx.fillRect(adjustedTextX, adjustedTextY, boxWidth * pixelRatio, boxHeight * pixelRatio);
					}
					if (ctxUpdated) {
						ctx.restore();
						ctxUpdated = false;
					}
				}
			}

			ctx.fillStyle = textData.font?.color as string;
			const { lines } = this._getLinesInfo(passthroughText);
			
			const lineWidth = (options.lineWidth ?? 1);
			
			for (const line of lines) {
				drawScaled(ctx, pixelRatio, () => ctx.fillText(line, xPos, (yPos + (lineWidth * pixelRatio))));
			}

			ctx.restore();
		};
		
		const options = ensureNotNull(this._data).marketDepth;
		const marketDepthData = ensureNotNull(options.marketDepthData);

		// highest for the bid and ask
		let highestBidTotalSize = 0;
		let highestAskTotalSize = 0;
		let highestBidOrAskTotalSize = 0;

		// function to calulate the highest bid and ask for the data provided
		const calculateHighestTotalSize = (allOptions: DeepPartial<MarketDepthOptions>) => {
			if (marketDepthData === undefined) {
				return; // Handle undefined data
			}
		
			// calculate bid and ask largest TotalSize
			if (allOptions.marketDepthData !== undefined && allOptions.marketDepthData.Bids !== undefined && allOptions.marketDepthData.Asks !== undefined) {
				// Calculate highest bid TotalSize:
				highestBidTotalSize = Math.max(...allOptions.marketDepthData.Bids.map(bid => Number(bid.TotalSize)));
		
				// Calculate highest ask TotalSize:
				highestAskTotalSize = Math.max(...allOptions.marketDepthData.Asks.map(ask => Number(ask.TotalSize)));

				// Is the Bid or Ask larger then set highestBidOrAskTotalSize
				// will only be used if totalBidAskCalcMethod = combined
				if (highestBidTotalSize >= highestAskTotalSize) {
					highestBidOrAskTotalSize = highestBidTotalSize;
				} else {
					highestBidOrAskTotalSize = highestAskTotalSize;
				}
			}
		};

		// set and calulate the highest for bid and ask of the data to be used in drawing a proportionate scaled line
		calculateHighestTotalSize(options);

		if (marketDepthData !== undefined && marketDepthData.Bids !== undefined) {
			marketDepthData.Bids.forEach((levelData, index) => {
				drawText(levelData.TotalSize ?? '', levelData.Price ?? '');
				// combined or independent
				if (options.totalBidAskCalcMethod === 'combined') {
					this._drawLine(ctx, pixelRatio, levelData as MarketDepthSingleAggregatesData, options as MarketDepthOptions, 'bid' as string, highestBidOrAskTotalSize, index);
				} else {
					this._drawLine(ctx, pixelRatio, levelData as MarketDepthSingleAggregatesData, options as MarketDepthOptions, 'bid' as string, highestBidTotalSize, index);
				}
			});
		}
		
		if (marketDepthData !== undefined && marketDepthData.Asks !== undefined) {
			marketDepthData.Asks.forEach((levelData, index) => {
				drawText(levelData.TotalSize ?? '', levelData.Price ?? '');
				// combined or independent
				if (options.totalBidAskCalcMethod === 'combined') {
					this._drawLine(ctx, pixelRatio, levelData as MarketDepthSingleAggregatesData, options as MarketDepthOptions, 'ask' as string, highestBidOrAskTotalSize, index);
				} else {
					this._drawLine(ctx, pixelRatio, levelData as MarketDepthSingleAggregatesData, options as MarketDepthOptions, 'ask' as string, highestAskTotalSize, index);
				}
			});
		}

		ctx.restore();
	}
	
	// eslint-disable-next-line max-params
	private _drawLine(ctx: CanvasRenderingContext2D, pixelRatio: number, levelData: MarketDepthSingleAggregatesData, options: MarketDepthOptions, bidOrAsk: string, highestTotalSize: number, index: number): void {
		if (this._data === null || this._data.points === undefined || this._data.points.length === 0) {
			return;
		}

		// GOTCHA
		// for some reason i need to make a deep copy of levelData because I cannot access its keys because they will return as undefined.
		// I could print levelData and it states it is an object and it has all the data but when I try levelData.Price, that would be undefined
		// after the deep copy, everything works as expected.
		// line does not show with this example below
		// const levelDataDeepCopy = JSON.parse(JSON.stringify(levelData)) as MarketDepthSingleAggregatesData;
		// line does not show with this example below
		// const levelDataDeepCopy = levelData;
		
		// Create a deep copy of levelData:
		// line shows
		const levelDataDeepCopy = JSON.parse(JSON.stringify(levelData));

		// Access the price scale from the renderer data:
		const priceScale = ensureNotNull(this._data.priceScale);
		const firstValue = ensureNotNull(priceScale.firstValue());
	
		// Determine box width:
		const boxWidth = this._internalData?.boxWidth;
		// Calculate line start:
		const xPos = (ensureNotNull(this._data.points[0]).x * pixelRatio) + options.timestampStartOffset;
		// Convert levelData.Price to Y coordinate:
		const yPos = priceScale.priceToCoordinate(Number(levelDataDeepCopy.Price), Number(firstValue));

		const lineStartX = xPos + (options.lineOffset ?? 0) * pixelRatio;
	
		// 3. Draw the horizontal line:
		let lineColor = 'yellow';
		if (bidOrAsk === 'bid') {
			lineColor = options.lineBidColor;
		} else if (bidOrAsk === 'ask') {
			lineColor = options.lineAskColor;
		}
		
		// Set the line color, width and style
		ctx.strokeStyle = lineColor;
		ctx.lineWidth = (options.lineWidth ?? 1) * pixelRatio;
		setLineStyle(ctx, (options.lineStyle ?? LineStyle.Solid));
	
		ctx.beginPath();
		// ensure the start of the line is at the end of the box
		if (boxWidth !== undefined) {
			ctx.moveTo(lineStartX, yPos);
		}
		// line length proportionate to its current TotalSize and the highestTotalSize to calulated with a max length of lineLength
		const lineLength = (Number(levelDataDeepCopy.TotalSize) / highestTotalSize) * (options.lineLength ?? 100) * pixelRatio;
		ctx.lineTo(lineStartX + lineLength, yPos);
		ctx.stroke();
	}

	private _getInternalData(text?: string, x?: number, y?: number): InternalData {
		const data = ensureNotNull(this._data);

		const paddingX = getScaledBoxPaddingX(data);
		const paddingY = getScaledBoxPaddingY(data);
		const inflationPaddingX = getScaledBackgroundInflationX(data) + paddingX;
		const inflationPaddingY = getScaledBackgroundInflationY(data) + paddingY;

		// Use provided x and y if available, otherwise fall back to data.points[0]
		const anchor = (x !== undefined && y !== undefined) ? new Point(x, y) : ensureDefined(this._data?.points)[0];

		// Use textToUse for all text-related calculations:
		const textToUse = text || ''; // Use passthroughText or an empty string if not provided

		const boxSize = this._getBoxSize(textToUse);
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

	private _getLinesInfo(text?: string): LinesInfo {
		const data = ensureNotNull(this._data);
		// Use the provided text or fall back to data.text.value
		const textToUse = text || '';
		let lines = this.wordWrap(textToUse, data.text?.wordWrapWidth);

		if (data.text?.box?.maxHeight !== undefined) {
			const maxHeight = ensureDefined(data.text?.box?.maxHeight);
			const scaledFontSize = getScaledFontSize(data);
			const scaledPadding = getScaledPadding(data);
			const maxLines = Math.floor((maxHeight + scaledPadding) / (scaledFontSize + scaledPadding));
			if (lines.length > maxLines) { lines = lines.slice(0, maxLines); }
		}

		this._linesInfo = { linesMaxWidth: this._getLinesMaxWidth(lines), lines };

		return this._linesInfo;
	}

	private _getFontInfo(): FontInfo {
		const data = ensureNotNull(this._data);
		const fontSize = getScaledFontSize(data);
		const fontStyle = (data.text?.font?.bold ? 'bold ' : '') + (data.text?.font?.italic ? 'italic ' : '') + fontSize + 'px ' + data.text?.font?.family;
		this._fontInfo = { fontStyle: fontStyle, fontSize: fontSize };

		return this._fontInfo;
	}

	private _getBoxSize(text?: string): BoxSize {
		const linesInfo = this._getLinesInfo(text);
		const data = ensureNotNull(this._data);
		this._boxSize = {
			width: getBoxWidth(data, linesInfo.linesMaxWidth),
			height: getBoxHeight(data, linesInfo.lines.length),
		};

		return this._boxSize;
	}

	private _getPolygonPoints(text?: string): Point[] {
		if (null === this._data) {return [];}

		const { boxLeft, boxTop, boxWidth, boxHeight } = this._getInternalData(text);
		const pivot = this._getRotationPoint(text);
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

	private _getRotationPoint(text?: string, xPos?: number, yPos?: number): Point {
		const { boxLeft, boxTop, boxWidth, boxHeight } = this._getInternalData(text, xPos, yPos);
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

function getBoxWidth(data: MarketDepthRendererData, maxLineWidth: number): number {
	return maxLineWidth + 2 * getScaledBackgroundInflationX(data) + 2 * getScaledBoxPaddingX(data);
}

function getBoxHeight(data: MarketDepthRendererData, linesCount: number): number {
	return getScaledFontSize(data) * linesCount + getScaledPadding(data) * (linesCount - 1) + 2 * getScaledBackgroundInflationY(data) + 2 * getScaledBoxPaddingY(data);
}

function getScaledBoxPaddingY(data: MarketDepthRendererData): number {
	return data.text?.box?.padding?.y !== undefined ? data.text?.box?.padding?.y * getFontAwareScale(data) : getScaledFontSize(data) / 3;
}

function getScaledBoxPaddingX(data: MarketDepthRendererData): number {
	return data.text?.box?.padding?.x ? data.text?.box?.padding?.x * getFontAwareScale(data) : getScaledFontSize(data) / 3;
}

function getScaledBackgroundInflationY(data: MarketDepthRendererData): number {
	return (data.text?.box?.background?.inflation?.y || 0) * getFontAwareScale(data);
}

function getScaledBackgroundInflationX(data: MarketDepthRendererData): number {
	return (data.text?.box?.background?.inflation?.x || 0) * getFontAwareScale(data);
}

function getScaledPadding(data: MarketDepthRendererData): number {
	return (data.text?.padding || 0) * getFontAwareScale(data);
}

function getScaledFontSize(data: MarketDepthRendererData): number {
	return Math.ceil(getFontSize(data) * getFontAwareScale(data));
}

function getFontSize(data: MarketDepthRendererData): number {
	return data.text?.font?.size || 30;
}

function getFontAwareScale(data: MarketDepthRendererData): number {
	const scale = Math.min(1, Math.max(0.2, data.text?.box?.scale || 1));
	if (scale === 1) {return scale;}
	const fontSize = getFontSize(data);
	return Math.ceil(scale * fontSize) / fontSize;
}

function isRtl(): boolean {
	return 'rtl' === window.document.dir;
}
