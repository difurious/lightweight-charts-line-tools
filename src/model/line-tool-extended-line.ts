import { LineToolType } from './line-tool-options';
import { LineToolTrendLine } from './line-tool-trend-line';

export class LineToolExtendedLine extends LineToolTrendLine {
	protected override readonly _toolType: LineToolType = 'ExtendedLine';
}
