import { VerticalLinePaneView } from '../views/pane/vertical-line-pane-view';
import { PriceAxisView } from '../views/price-axis/price-axis-view';

import { ChartModel } from './chart-model';
import { LineTool, LineToolPoint } from './line-tool';
import { LineToolType, VerticalLineToolOptions } from './line-tool-options';

export class LineToolVerticalLine extends LineTool<'VerticalLine'> {
	protected override readonly _toolType: LineToolType = 'VerticalLine';

	public constructor(model: ChartModel, options: VerticalLineToolOptions, points: LineToolPoint[] = []) {
		super(model, options, points);
		this._setPaneViews([new VerticalLinePaneView(this, model)]);
	}

	public pointsCount(): number {
		return 1;
	}

	public override priceAxisViews(): PriceAxisView[] {
		return [];
	}

	public override priceAxisPoints(): LineToolPoint[] {
		return [];
	}

	public override timeAxisLabelColor(): string | null {
		return this.options().line.color;
	}
}
