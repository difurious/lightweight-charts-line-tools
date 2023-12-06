/* eslint-disable @typescript-eslint/naming-convention */
import { LineTool } from './line-tool';
import { LineToolArrow } from './line-tool-arrow';
import { LineToolBrush } from './line-tool-brush';
import { LineToolCallout } from './line-tool-callout';
import { LineToolCircle } from './line-tool-circle';
import { LineToolCrossLine } from './line-tool-cross-line';
import { LineToolExtendedLine } from './line-tool-extended-line';
import { LineToolFibRetracement } from './line-tool-fib-retracement';
import { LineToolHighlighter } from './line-tool-highlighter';
import { LineToolHorizontalLine } from './line-tool-horizontal-line';
import { LineToolHorizontalRay } from './line-tool-horizontal-ray';
import { LineToolType } from './line-tool-options';
import { LineToolParallelChannel } from './line-tool-parallel-channel';
import { LineToolPath } from './line-tool-path';
import { LineToolPriceRange } from './line-tool-price-range';
import { LineToolRay } from './line-tool-ray';
import { LineToolRectangle } from './line-tool-rectangle';
import { LineToolText } from './line-tool-text';
import { LineToolTrendLine } from './line-tool-trend-line';
import { LineToolTriangle } from './line-tool-triangle';
import { LineToolVerticalLine } from './line-tool-vertical-line';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LineTools: Record<LineToolType, new(...args: any) => LineTool<LineToolType>> = {
	FibRetracement: LineToolFibRetracement,
	ParallelChannel: LineToolParallelChannel,
	HorizontalLine: LineToolHorizontalLine,
	VerticalLine: LineToolVerticalLine,
	Highlighter: LineToolHighlighter,
	CrossLine: LineToolCrossLine,
	TrendLine: LineToolTrendLine,
	Callout: LineToolCallout,
	Rectangle: LineToolRectangle,
	Circle: LineToolCircle,
	PriceRange: LineToolPriceRange,
	Triangle: LineToolTriangle,
	Brush: LineToolBrush,
	Path: LineToolPath,
	Text: LineToolText,

	Ray: LineToolRay,
	Arrow: LineToolArrow,
	ExtendedLine: LineToolExtendedLine,
	HorizontalRay: LineToolHorizontalRay,
};
