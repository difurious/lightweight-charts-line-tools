import { ensureNotNull } from '../helpers/assertions';

import { PathPaneView } from '../views/pane/path-pane-view';

import { ChartModel } from './chart-model';
import { LineTool, LineToolPoint } from './line-tool';
import { BrushToolOptions, LineToolType } from './line-tool-options';

export class LineToolPath extends LineTool<'Path'> {
	protected override readonly _toolType: LineToolType = 'Path';

	public constructor(model: ChartModel, options: BrushToolOptions, points: LineToolPoint[] = []) {
		super(model, options, points);
		this._setPaneViews([new PathPaneView(this, model)]);
	}

	public pointsCount(): number {
		return -1;
	}

	public override tryFinish(): void {
		if (this._points.length > 1) {
			const point0 = this._points[this._points.length - 1];
			const point1 = this._points[this._points.length - 2];
			const screenPoint0 = ensureNotNull(this.pointToScreenPoint(point0));
			const screenPoint1 = ensureNotNull(this.pointToScreenPoint(point1));
			if (screenPoint0.subtract(screenPoint1).length() < 10) {
				this._points.pop();
				this._finished = true;
				this._selected = true;
				this._lastPoint = null;
			}
		}
	}
}
