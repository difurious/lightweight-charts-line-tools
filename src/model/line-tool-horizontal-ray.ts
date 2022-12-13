import { LineToolHorizontalLine } from './line-tool-horizontal-line';
import { LineToolType } from './line-tool-options';

export class LineToolHorizontalRay extends LineToolHorizontalLine {
	protected override readonly _toolType: LineToolType = 'HorizontalRay';
}
