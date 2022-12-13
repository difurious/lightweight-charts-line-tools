import { HorizontalLinePaneView } from '../views/pane/horizontal-line-pane-view';
import { ITimeAxisView } from '../views/time-axis/itime-axis-view';

import { ChartModel } from './chart-model';
import { LineTool, LineToolPoint } from './line-tool';
import { HorizontalLineToolOptions, LineToolType } from './line-tool-options';

export class LineToolHorizontalLine extends LineTool<'HorizontalLine'> {
	protected override readonly _toolType: LineToolType = 'HorizontalLine';

	public constructor(model: ChartModel, options: HorizontalLineToolOptions, points: LineToolPoint[] = []) {
		super(model, options, points);
		this._setPaneViews([new HorizontalLinePaneView(this, model)]);
	}

	public pointsCount(): number {
		return 1;
	}

	public override timeAxisViews(): ITimeAxisView[] {
		return [];
	}

	public override timeAxisPoints(): LineToolPoint[] {
		return [];
	}

	public override priceAxisLabelColor(): string | null {
		return this.options().line.color;
	}
}
