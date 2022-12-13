import { FibRetracementPaneView } from '../views/pane/fib-retracement-pane-view';

import { ChartModel } from './chart-model';
import { LineTool, LineToolPoint } from './line-tool';
import { FibRetracementToolOptions, LineToolType } from './line-tool-options';

export class LineToolFibRetracement extends LineTool<'FibRetracement'> {
	protected override readonly _toolType: LineToolType = 'FibRetracement';

	public constructor(model: ChartModel, options: FibRetracementToolOptions, points: LineToolPoint[] = []) {
		super(model, options, points);
		this._setPaneViews([new FibRetracementPaneView(this, model)]);
	}

	public pointsCount(): number {
		return 2;
	}
}
