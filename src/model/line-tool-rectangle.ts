import { RectanglePaneView } from '../views/pane/rectangle-pane-view';

import { ChartModel } from './chart-model';
import { LineTool, LineToolPoint } from './line-tool';
import { LineToolType, RectangleToolOptions } from './line-tool-options';
import { UTCTimestamp } from './time-data';

export class LineToolRectangle extends LineTool<'Rectangle'> {
	protected override readonly _toolType: LineToolType = 'Rectangle';

	public constructor(model: ChartModel, options: RectangleToolOptions, points: LineToolPoint[] = []) {
		super(model, options, points);
		this._setPaneViews([new RectanglePaneView(this, model)]);
	}

	public pointsCount(): number {
		return 2;
	}

	public override setPoint(index: number, point: LineToolPoint): void {
		if (index < 2) { super.setPoint(index, point); }

		switch (index) {
			case 2:
				this._points[1].price = point.price;
				this._points[0].timestamp = point.timestamp;
				break;
			case 3:
				this._points[0].price = point.price;
				this._points[1].timestamp = point.timestamp;
				break;
			case 4:
				this._points[0].timestamp = point.timestamp;
				break;
			case 5:
				this._points[1].timestamp = point.timestamp;
				break;
			case 6:
				this._points[0].price = point.price;
				break;
			case 7:
				this._points[1].price = point.price;
		}
	}

	public override getPoint(index: number): LineToolPoint | null {
		return index < 2 ? super.getPoint(index) : this._getAnchorPointForIndex(index);
	}

	protected _getAnchorPointForIndex(index: number): LineToolPoint {
		const start = this.points()[0];
		const end = this.points()[1];

		return [
			{ price: start.price, timestamp: start.timestamp },
			{ price: end.price, timestamp: end.timestamp },
			{ price: end.price, timestamp: start.timestamp },
			{ price: start.price, timestamp: end.timestamp },
			{ price: (end.price + start.price) / 2, timestamp: start.timestamp },
			{ price: (end.price + start.price) / 2, timestamp: end.timestamp },
			{ price: start.price, timestamp: (end.timestamp + start.timestamp) / 2 as UTCTimestamp },
			{ price: end.price, timestamp: (end.timestamp + start.timestamp) / 2 as UTCTimestamp },
		][index];
	}
}
