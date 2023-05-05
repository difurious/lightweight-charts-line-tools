import { LineWidth } from '../renderers/draw-line';

import { LineEnd, LineStyle } from '..';
import { LineToolBrush } from './line-tool-brush';
import { BrushToolOptions, LineCap, LineJoin, LineToolType } from './line-tool-options';

export class LineToolHighlighter extends LineToolBrush {
	protected override readonly _toolType: LineToolType = 'Highlighter';

	public override getBrushOptions(): BrushToolOptions & { line: { cap: LineCap } } {
		const options = this.options();
		return {
			visible: options.visible,
			editable: options.editable,
			line: {
				width: 20 as LineWidth,
				cap: LineCap.Round,
				join: LineJoin.Round,
				style: LineStyle.Solid,
				color: options.line.color,
				end: { left: LineEnd.Normal, right: LineEnd.Normal },
			},
		};
	}
}
