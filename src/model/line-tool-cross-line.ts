import { CrossLinePaneView } from '../views/pane/cross-line-pane-view';

import { ChartModel } from './chart-model';
import { LineTool, LineToolPoint } from './line-tool';
import { CrossLineToolOptions, LineToolType } from './line-tool-options';

export class LineToolCrossLine extends LineTool<'CrossLine'> {
	protected override readonly _toolType: LineToolType = 'CrossLine';

	public constructor(model: ChartModel, options: CrossLineToolOptions, points: LineToolPoint[] = []) {
		super(model, options, points);
		this._setPaneViews([new CrossLinePaneView(this, model)]);
	}

	public pointsCount(): number {
		return 1;
	}

	public override timeAxisLabelColor(): string | null {
		return this.options().line.color;
	}

	public override priceAxisLabelColor(): string | null {
		return this.options().line.color;
	}
}
