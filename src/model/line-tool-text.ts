import { TextPaneView } from '../views/pane/text-pane-view';

import { ChartModel } from './chart-model';
import { LineTool, LineToolPoint } from './line-tool';
import { LineToolType, TextToolOptions } from './line-tool-options';

export class LineToolText extends LineTool<'Text'> {
	protected override readonly _toolType: LineToolType = 'Text';

	public constructor(model: ChartModel, options: TextToolOptions, points: LineToolPoint[] = []) {
		super(model, options, points);
		this._setPaneViews([new TextPaneView(this, model)]);
	}

	public pointsCount(): number {
		return 1;
	}
}
