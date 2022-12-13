import { LineToolType } from './line-tool-options';
import { LineToolTrendLine } from './line-tool-trend-line';

export class LineToolRay extends LineToolTrendLine {
	protected override readonly _toolType: LineToolType = 'Ray';
}
