import { CalloutPaneView } from '../views/pane/callout-pane-view';

import { ChartModel } from './chart-model';
import { LineTool, LineToolPoint } from './line-tool';
import { CalloutToolOptions, LineToolType } from './line-tool-options';

export class LineToolCallout extends LineTool<'Callout'> {
	protected override readonly _toolType: LineToolType = 'Callout';

	public constructor(model: ChartModel, options: CalloutToolOptions, points: LineToolPoint[] = []) {
		super(model, options, points);
		this._setPaneViews([new CalloutPaneView(this, model)]);
	}

	public pointsCount(): number {
		return 2;
	}
}
