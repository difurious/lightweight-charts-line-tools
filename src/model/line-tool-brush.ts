import { ensureNotNull } from '../helpers/assertions';

import { BrushPaneView } from '../views/pane/brush-pane-view';

import { ChartModel } from './chart-model';
import { LineTool, LineToolPoint } from './line-tool';
import { BrushToolOptions, LineToolType } from './line-tool-options';

export class LineToolBrush extends LineTool<'Brush'> {
	protected override readonly _toolType: LineToolType = 'Brush';

	public constructor(model: ChartModel, options: BrushToolOptions, points: LineToolPoint[] = []) {
		super(model, options, points);
		this._setPaneViews([new BrushPaneView(this, model)]);
	}

	public pointsCount(): number {
		return -1;
	}

	public smooth(): number {
		return 5;
	}

	public getBrushOptions(): BrushToolOptions {
		return this.options();
	}

	public override addPoint(point: LineToolPoint): void {
		if (this._finished) { return; }
		this._lastPoint = null;
		if (this._points.length > 0) {
			const endPoint = this._points[this._points.length - 1];
			const endScreenPoint = ensureNotNull(this.pointToScreenPoint(endPoint));
			if (ensureNotNull(this.pointToScreenPoint(point)).subtract(endScreenPoint).length() < 2) { return; }
		}
		return super.addPoint(point);
	}

	public override hasMagnet(): boolean {
		return false;
	}

	public override lineDrawnWithPressedButton(): boolean {
		return true;
	}
}
