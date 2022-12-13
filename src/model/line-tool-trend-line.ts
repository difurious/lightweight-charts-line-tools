import { TrendLinePaneView } from '../views/pane/trend-line-pane-view';

import { ChartModel } from './chart-model';
import { LineTool, LineToolPoint } from './line-tool';
import { LineToolType, TrendLineToolOptions } from './line-tool-options';

export class LineToolTrendLine extends LineTool<'TrendLine'> {
	protected override readonly _toolType: LineToolType = 'TrendLine';

	public constructor(model: ChartModel, options: TrendLineToolOptions, points: LineToolPoint[] = []) {
		super(model, options, points);
		this._setPaneViews([new TrendLinePaneView(this, model)]);
	}

	public pointsCount(): number {
		return 2;
	}
}
