import { TrianglePaneView } from '../views/pane/triangle-pane-view';

import { ChartModel } from './chart-model';
import { LineTool, LineToolPoint } from './line-tool';
import { LineToolType, TriangleToolOptions } from './line-tool-options';

export class LineToolTriangle extends LineTool<'Triangle'> {
	protected override readonly _toolType: LineToolType = 'Triangle';

	public constructor(model: ChartModel, options: TriangleToolOptions, points: LineToolPoint[] = []) {
		super(model, options, points);
		this._setPaneViews([new TrianglePaneView(this, model)]);
	}

	public pointsCount(): number {
		return 3;
	}
}
