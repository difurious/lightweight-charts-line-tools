import { MarketDepthPaneView } from '../views/pane/market-depth-pane-view';

import { ChartModel } from './chart-model';
import { LineTool, LineToolPoint } from './line-tool';
import { LineToolType, MarketDepthToolOptions } from './line-tool-options';

export class LineToolMarketDepth extends LineTool<'MarketDepth'> {
	protected override readonly _toolType: LineToolType = 'MarketDepth';

	public constructor(model: ChartModel, options: MarketDepthToolOptions, points: LineToolPoint[] = []) {
		super(model, options, points);
		this._setPaneViews([new MarketDepthPaneView(this, model)]);
	}

	public pointsCount(): number {
		return 1;
	}
}
