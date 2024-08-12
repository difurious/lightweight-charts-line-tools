/* eslint-disable @typescript-eslint/tslint/config */
/* eslint-disable @typescript-eslint/naming-convention */
import { DeepPartial, OmitRecursively } from '../helpers/strict-type-checks';

import { LineEnd as LineEnd, LineStyle, LineWidth } from '../renderers/draw-line';

export interface IPoint {
	x: number;
	y: number;
}

export const enum BoxVerticalAlignment {
	Top = 'top',
	Middle = 'middle',
	Bottom = 'bottom',
}

export const enum BoxHorizontalAlignment {
	Left = 'left',
	Center = 'center',
	Right = 'right',
}

export const enum TextAlignment {
	Start = 'start',
	Center = 'center',
	End = 'end',
	Left = 'left',
	Right = 'right',
}

export const enum LineJoin {
	Bevel = 'bevel',
	Round = 'round',
	Miter = 'miter',
}

export const enum LineCap {
	Butt = 'butt',
	Round = 'round',
	Square = 'square',
}

export interface ExtendOptions {
	/**
	 * Extend line right.
	 *
	 * @defaultValue `false`
	 */
	right: boolean;

	/**
	 * Extend line left.
	 *
	 * @defaultValue `false`
	 */
	left: boolean;
}

export interface EndOptions {
	/**
	 * Line cap right.
	 *
	 * @defaultValue {@link LineEnd.Normal}
	 */
	left: LineEnd;

	/**
	 * Line cap left.
	 *
	 * @defaultValue {@link LineEnd.Normal}
	 */
	right: LineEnd;
}

export interface BoxAlignmentOptions {
	/**
	 * Text vertical alignment.
	 *
	 * @defaultValue {@link BoxVerticalAlignment.Top}
	 */
	vertical: BoxVerticalAlignment;

	/**
	 * Text horizontal alignment.
	 *
	 * @defaultValue {@link BoxHorizontalAlignment.Left}
	 */
	horizontal: BoxHorizontalAlignment;
}

export interface ShadowOptions {
	blur: number;
	color: string;
	offset: IPoint;
}

export interface TextBoxOptions {
	/**
	 * Box alignment.
	 */
	alignment: BoxAlignmentOptions;

	/**
	 * Box angle.
	*/
	angle: number;

	/**
	 * Box scale.
	 */
	scale: number;

	/**
	 * Box offset.
	 */
	offset?: IPoint;

	/**
	 * Box padding.
	 */
	padding?: IPoint;

	/**
	 * Box max height.
	 */
	maxHeight?: number;

	/**
	 * Box shadow.
	 */
	shadow?: ShadowOptions;

	/**
	 * Box border.
	 */
	border?: BorderOptions;

	/**
	 * Box background.
	 */
	background?: BackroundOptions;
}

export interface TextFontOptions {
	/**
	 * Font color.
	 *
	 * @defaultValue `'#B2B5BE'`
	 */
	color: string;

	/**
	 * Font size.
	 *
	 * @defaultValue `12`
	 */
	size: number;

	/**
	 * If font should be bold.
	 *
	 * @defaultValue `false`
	 */
	bold: boolean;

	/**
	 * If font should be italic.
	 *
	 * @defaultValue `false`
	 */
	italic: boolean;

	/**
	 * Font family.
	 *
	 * @defaultValue `-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, SegoeUI, Ubuntu, sans-serif`
	 */
	family: string;
}

export interface BackroundOptions {
	/**
	 * Background color.
	 */
	color: string;

	/**
	 * Background inflate.
	 */
	inflation: IPoint;
}

export interface BorderOptions {
	/**
	 * Border color.
	 */
	color: string;

	/**
	 * Border width.
	 */
	width: number;

	/**
	 * Border radius.
	 */
	radius: number;

	/**
	 * If border should be highlighted.
	 */
	highlight: boolean;

	/**
	 * Border style.
	 *
	 * @defaultValue {@link LineStyle.Solid}
	 */
	style: LineStyle;
}

export interface TextOptions {
	/**
	 * Text value.
	 *
	 * @defaultValue `""`
	 */
	value: string;

	/**
	 * Text alignment.
	 *
	 * @defaultValue {@link BoxHorizontalAlignment.Left}
	 */
	alignment: TextAlignment;

	/**
	 * Text font.
	 */
	font: TextFontOptions;

	/**
	 * Text box.
	 */
	box: TextBoxOptions;

	/**
	 * Text padding.
	 */
	padding: number;

	/**
	 * Text word wrap width.
	 */
	wordWrapWidth: number;

	/**
	 * Should force text align.
	 */
	forceTextAlign: boolean;

	/**
	 * Should force calcualte max line width.
	 */
	forceCalculateMaxLineWidth: boolean;
}

export interface RectangleOptions {
	/**
	 * Rectangle background.
	 */
	background: Omit<BackroundOptions, 'inflation'>;

	/**
	 * Rectangle border.
	*/
	border: Omit<BorderOptions, 'radius' | 'highlight'>;

	/**
	 * Rectangle extend sides.
	 */
	extend: ExtendOptions;
}

export interface LongShortPositionOptions {
    /**
     * Rectangle config for the Entry to Stop Loss area.
     */
    entryStopLossRectangle: RectangleOptions;

    /**
     * Text config for the Entry to Stop Loss area.
     */
    entryStopLossText: TextOptions;

    /**
     * Rectangle config for the Entry to Profit Target area.
     */
    entryPtRectangle: RectangleOptions;

    /**
     * Text config for the Entry to Profit Target area.
     */
    entryPtText: TextOptions;

	/**
     * Info about stop and pt will be displayed as text automatically
     */
	showAutoText: boolean;
}

export interface CircleOptions {
	/**
	 * Circle background.
	 */
	background: Omit<BackroundOptions, 'inflation'>;

	/**
	 * Circle border.
	*/
	border: Omit<BorderOptions, 'radius' | 'highlight'>;

	/**
	 * Circle extend sides.
	 */
	extend: ExtendOptions;
}

export interface PriceRangeOptions {
	/**
	 * PriceRange background.
	 */
	background: Omit<BackroundOptions, 'inflation'>;

	/**
	 * PriceRange border.
	*/
	border: Omit<BorderOptions, 'radius' | 'highlight'>;

	/**
	 * PriceRange extend sides.
	 */
	extend: ExtendOptions;
	/**
	 * PriceRange show the center horizontal line.
	 */
	showCenterHorizontalLine: boolean;
	/**
	 * PriceRange show the vertical line.
	 */
	showCenterVerticalLine: boolean;
	/**
	 * PriceRange center horizontal line width.
	 */
	centerHorizontalLineWidth: number;
	/**
	 * PriceRange center horizontal lineStyle.
	 */
	centerHorizontalLineStyle: LineStyle;
}

export interface MarketDepthSingleAggregatesData {
	EarliestTime: string;
	LatestTime: string;
	Side: string;
	Price: string;
	TotalSize: string;
	BiggestSize: string;
	SmallestSize: string;
	NumParticipants: number;
	TotalOrderCount: number;
}

export interface MarketDepthAggregatesData {
    Bids: {
        EarliestTime: string;
        LatestTime: string;
        Side: string;
        Price: string;
        TotalSize: string;
        BiggestSize: string;
        SmallestSize: string;
        NumParticipants: number;
        TotalOrderCount: number;
    }[];
    Asks: {
        EarliestTime: string;
        LatestTime: string;
        Side: string;
        Price: string;
        TotalSize: string;
        BiggestSize: string;
        SmallestSize: string;
        NumParticipants: number;
        TotalOrderCount: number;
    }[];
}

export interface MarketDepthOptions {
	/**
	 * MarketDepth line width.
	 */
	lineWidth: number;
	/**
	 * MarketDepth lineStyle.
	 */
	lineStyle: LineStyle;
	/**
	 * MarketDepth lineOffset pixels from the number before the line starts.
	 */
	lineOffset: number;
	/**
	 * MarketDepth lineLength max length the the line will be in pixels.
	 */
	lineLength: number;
	/**
	 * MarketDepth lineBidColor is the color of the line created for bid marketDepth data.
	 */
	lineBidColor: string;
	/**
	 * MarketDepth lineAskColor is the color of the line created for ask marketDepth data.
	 */
	lineAskColor: string;
	/**
	 * MarketDepth totalBidAskCalcMethod will calulate the highest totalSize in marketDepthData based off of bid and ask independently
	 * or the highest totalSize taking into account both bid and ask combined. This number proportionately scales the lineLength.
	 * "independent" will look at ask and find the highest totalSize just in ask entries and the calulation will use that for the ask entries.  likewise for bids
	 * "combined" will look at ask and bid as if it was one thing and find the highest totalSize and both bid and ask will use that for the calculation for the line length
	 * "independent" or "combined" (default)
	 */
	totalBidAskCalcMethod: string;
	/**
	 * MarketDepth timestampStartOffset is from timestamp, how far over until starting to draw.  Example
	 * If a candle series is used, this number will be how far to the right from the timestamp in pixels the number will start drawing.
	 * Then lineOffset applies to offset how far from he number the line start drawing, then the line draws a max of lineLength
	 */
	timestampStartOffset: number;
	/**
	 * MarketDepth MarketDepthAggregatesData will be the array of data used to loop and create the marketDepth levels.
	 * see MarketDepthAggregatesData interface to see how the data should be formatted.  TotalSize is prety much the only data used.
	 */
	marketDepthData: MarketDepthAggregatesData;
}

export interface TriangleOptions {
	/**
	 * Triangle background.
	 */
	background: Omit<BackroundOptions, 'inflation'>;

	/**
	 * Triangle border.
	*/
	border: Omit<BorderOptions, 'radius' | 'highlight'>;
}

export interface LineOptions {
	/**
	 * Line color.
	 *
	 * @defaultValue `'#B2B5BE'`
	 */
	color: string;

	/**
	 * Line width.
	 *
	 * @defaultValue `1`
	 */
	width: LineWidth;

	/**
	 * Line style.
	 *
	 * @defaultValue {@link LineStyle.Solid}
	 */
	style: LineStyle;

	/**
	 * Line join.
	 *
	 * @defaultValue {@link LineJoin.Miter}
	 */
	join: LineJoin;

	/**
	 * Line join.
	 *
	 * @defaultValue {@link LineCap.Round}
	 */
	cap: LineCap;

	/**
	 * Line ends.
	 */
	end: EndOptions;

	/**
	 * Line extend.
	 */
	extend: ExtendOptions;
}

/**
 * Represents fib retracement level.
 */
export interface FibRetracementLevel {
	/**
	 * Level coefficient.
	 */
	coeff: number;

	/**
	 * Level color.
	 */
	color: string;

    /**
     * Opacity of the background.
     */
	opacity: number;

    /**
     * enable or disable the ability to calulate distance from current coeff from x coeff.
     */
	distanceFromCoeffEnabled: boolean;

    /**
     * distance from current coeff from stated coeff in this option.
     */
	distanceFromCoeff: number;
}

export interface LineToolOptionsCommon {
	/**
	 * Visibility of the line.
	 *
	 * @defaultValue `true`
	 */
	visible: boolean;

	/**
	 * Can the line be edited.
	 *
	 * @defaultValue `true`
	 */
	editable: boolean;

	/**
	 * The owner source id.
	 */
	ownerSourceId?: string;
}

/**
 * Represents style options for a trend line.
 */
export interface LineToolTrendLineOptions {
	/**
	 * Text config.
	 */
	text: TextOptions;
	/**
	 * Line config.
	 */
	line: Omit<LineOptions, 'join' | 'cap'>;
}

/**
 * Represents style options for a callout.
 */
export interface LineToolCalloutOptions {
	/**
	 * Text config.
	 */
	text: TextOptions;
	/**
	 * Line config.
	 */
	line: Omit<LineOptions, 'join' | 'cap'>;
}

/**
 * Represents style options for a horizotnal line.
 */
export interface LineToolHorizontalLineOptions {
	/**
	 * Text config.
	 */
	text: TextOptions;
	/**
	 * Line config.
	 */
	line: Omit<LineOptions, 'cap' | 'join'>;
}

/**
 * Represents style options for a vertical line.
 */
export interface LineToolVerticalLineOptions {
	/**
	 * Text config.
	 */
	text: TextOptions;
	/**
	 * Line config.
	 */
	line: Omit<LineOptions, 'cap' | 'extend' | 'join' | 'end'>;
}

/**
 * Represents style options for a cross line.
 */
export interface LineToolCrossLineOptions {
	/**
	 * Line config.
	 */
	line: Omit<LineOptions, 'cap' | 'extend' | 'join' | 'end'>;
}

/**
 * Represents style options for a parallel channel.
 */
export interface LineToolParallelChannelOptions {
	/**
	 * Channel line config.
	 */
	channelLine: Omit<LineOptions, 'cap' | 'extend' | 'join' | 'end'>;

	/**
	 * Middle line config.
	 */
	middleLine: Omit<LineOptions, 'cap' | 'extend' | 'join' | 'end'>;

	/**
	 * If the middle line should be visible.
	 */
	showMiddleLine: boolean;

	/**
	 * Channel extension
	 */
	extend: ExtendOptions;

	/**
	 * Channel background
	 */
	background?: Omit<BackroundOptions, 'inflation'>;
}

/**
 * Represents style options for a rectangle.
 */
export interface LineToolRectangleOptions {
	/**
	 * Text config.
	 */
	text: TextOptions;
	/**
	 * Rectangle config.
	 */
	rectangle: RectangleOptions;
}

/**
 * Represents style options for a circle.
 */
export interface LineToolCircleOptions {
	/**
	 * Text config.
	 */
	text: TextOptions;
	/**
	 * Circle config.
	 */
	circle: CircleOptions;
}

/**
 * Represents style options for a price range.
 */
export interface LineToolPriceRangeOptions {
	/**
	 * Text config.
	 */
	text: TextOptions;
	/**
	 * PriceRange config.
	 */
	priceRange: PriceRangeOptions;
}

/**
 * Represents style options for market depth.
 */
export interface LineToolMarketDepthOptions {
	/**
	 * Text config.
	 */
	text: TextOptions;
	/**
	 * MarketDepth config.
	 */
	marketDepth: MarketDepthOptions;
}

/**
 * Represents style options for a triangle.
 */
export interface LineToolTriangleOptions {
	/**
	 * Triangle config.
	 */
	triangle: TriangleOptions;
}

/**
 * Represents style options for a text.
 */
export interface LineToolTextOptions {
	/**
	 * Text config.
	 */
	text: OmitRecursively<TextOptions, 'alignment'>;
}

/**
 * Represents style options for a brush.
 */
export interface LineToolBrushOptions {
	/**
	 * Line config.
	 */
	line: Omit<LineOptions, 'cap' | 'extend'>;

	/**
	 * Brush background.
	 */
	background?: Omit<BackroundOptions, 'inflation'>;
}

/**
 * Represents style options for a highlighter.
 */
export interface LineToolHighlighterOptions {
	/**
	 * Line config.
	 */
	line: Pick<LineOptions, 'color'>;
}

/**
 * Represents style options for a path.
 */
export interface LineToolPathOptions {
	/**
	 * Line config.
	 */
	line: Omit<LineOptions, 'cap' | 'extend' | 'join'>;
}

/**
 * Represents style options for a fib retracement.
 */
export interface LineToolFibRetracementOptions {
	/**
	 * Line config.
	 */
	line: Omit<LineOptions, 'extend' | 'join' | 'color' | 'cap' | 'end'>;

	/**
	 * Lines extend.
	 */
	extend: ExtendOptions;

	/**
	 * Fib Levels.
	 */
	levels: FibRetracementLevel[];
}

/**
 * Represents the intersection of a series type `T`'s options and common line tool options.
 *
 * @see {@link LineToolOptionsCommon} for common options.
 */
export type LineToolOptions<T> = T & LineToolOptionsCommon;
/**
 * Represents a {@link LineToolOptions} where every property is optional.
 */
export type LineToolPartialOptions<T> = DeepPartial<T & LineToolOptionsCommon>;

export type PathToolOptions = LineToolOptions<LineToolPathOptions>;
export type PathToolPartialOptions = LineToolPartialOptions<LineToolPathOptions>;

export type BrushToolOptions = LineToolOptions<LineToolBrushOptions>;
export type BrushToolPartialOptions = LineToolPartialOptions<LineToolBrushOptions>;

export type HighlighterToolOptions = LineToolOptions<LineToolHighlighterOptions>;
export type HighlighterToolPartialOptions = LineToolPartialOptions<LineToolHighlighterOptions>;

export type TextToolOptions = LineToolOptions<LineToolTextOptions>;
export type TextToolPartialOptions = LineToolPartialOptions<LineToolTextOptions>;

export type TrendLineToolOptions = LineToolOptions<LineToolTrendLineOptions>;
export type TrendLineToolPartialOptions = LineToolPartialOptions<LineToolTrendLineOptions>;

export type CalloutToolOptions = LineToolOptions<LineToolCalloutOptions>;
export type CalloutToolPartialOptions = LineToolPartialOptions<LineToolCalloutOptions>;

export type CrossLineToolOptions = LineToolOptions<LineToolCrossLineOptions>;
export type CrossLineToolPartialOptions = LineToolPartialOptions<LineToolCrossLineOptions>;

export type VerticalLineToolOptions = LineToolOptions<LineToolVerticalLineOptions>;
export type VerticalLineToolPartialOptions = LineToolPartialOptions<LineToolVerticalLineOptions>;

export type HorizontalLineToolOptions = LineToolOptions<LineToolHorizontalLineOptions>;
export type HorizontalLineToolPartialOptions = LineToolPartialOptions<LineToolHorizontalLineOptions>;

export type RectangleToolOptions = LineToolOptions<LineToolRectangleOptions>;
export type RectangleToolPartialOptions = LineToolPartialOptions<LineToolRectangleOptions>;

export type LongShortPositionToolOptions = LineToolOptions<LongShortPositionOptions>;
export type LongShortPositionToolPartialOptions = LineToolPartialOptions<LongShortPositionOptions>;

export type CircleToolOptions = LineToolOptions<LineToolCircleOptions>;
export type CircleToolPartialOptions = LineToolPartialOptions<LineToolCircleOptions>;

export type PriceRangeToolOptions = LineToolOptions<LineToolPriceRangeOptions>;
export type PriceRangeToolPartialOptions = LineToolPartialOptions<LineToolPriceRangeOptions>;

export type MarketDepthToolOptions = LineToolOptions<LineToolMarketDepthOptions>;
export type MarketDepthToolPartialOptions = LineToolPartialOptions<LineToolMarketDepthOptions>;

export type TriangleToolOptions = LineToolOptions<LineToolTriangleOptions>;
export type TriangleToolPartialOptions = LineToolPartialOptions<LineToolTriangleOptions>;

export type ParallelChannelToolOptions = LineToolOptions<LineToolParallelChannelOptions>;
export type ParallelChannelToolPartialOptions = LineToolPartialOptions<LineToolParallelChannelOptions>;

export type FibRetracementToolOptions = LineToolOptions<LineToolFibRetracementOptions>;
export type FibRetracementToolPartialOptions = LineToolPartialOptions<LineToolFibRetracementOptions>;

/**
 * Represents the type of options for each line tool type.
 */
export interface LineToolOptionsMap {
	FibRetracement: FibRetracementToolOptions;
	ParallelChannel: ParallelChannelToolOptions;
	HorizontalLine: HorizontalLineToolOptions;
	VerticalLine: VerticalLineToolOptions;
	Highlighter: HighlighterToolOptions;
	CrossLine: CrossLineToolOptions;
	TrendLine: TrendLineToolOptions;
	Callout: CalloutToolOptions;
	Rectangle: RectangleToolOptions;
	LongShortPosition: LongShortPositionToolOptions;
	Circle: CircleToolOptions;
	PriceRange: PriceRangeToolOptions;
	Triangle: TriangleToolOptions;
	Brush: BrushToolOptions;
	Path: PathToolOptions;
	Text: TextToolOptions;

	Ray: TrendLineToolOptions;
	Arrow: TrendLineToolOptions;
	ExtendedLine: TrendLineToolOptions;
	HorizontalRay: HorizontalLineToolOptions;

	MarketDepth: MarketDepthToolOptions;
}

/**
 * Represents the type of partial options for each line tool type.
 */
export interface LineToolPartialOptionsMap {
	FibRetracement: FibRetracementToolPartialOptions;
	ParallelChannel: ParallelChannelToolPartialOptions;
	HorizontalLine: HorizontalLineToolPartialOptions;
	VerticalLine: VerticalLineToolPartialOptions;
	Highlighter: HighlighterToolPartialOptions;
	CrossLine: CrossLineToolPartialOptions;
	TrendLine: TrendLineToolPartialOptions;
	Callout: CalloutToolPartialOptions;
	Rectangle: RectangleToolPartialOptions;
	LongShortPosition: LongShortPositionToolPartialOptions;
	Circle: CircleToolPartialOptions;
	PriceRange: PriceRangeToolPartialOptions;
	Triangle: TriangleToolPartialOptions;
	Brush: BrushToolPartialOptions;
	Path: PathToolPartialOptions;
	Text: TextToolPartialOptions;

	Ray: TrendLineToolPartialOptions;
	Arrow: TrendLineToolPartialOptions;
	ExtendedLine: TrendLineToolPartialOptions;
	HorizontalRay: HorizontalLineToolPartialOptions;

	MarketDepth: MarketDepthToolPartialOptions;
}

/**
 * Represents a type of line tool.
 *
 * @see {@link LineToolOptionsMap}
 */
export type LineToolType = keyof LineToolOptionsMap;
