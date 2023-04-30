import { Coordinate } from '../../model/coordinate';
import { CustomPriceLine } from '../../model/custom-price-line';
import { Series } from '../../model/series';
import { UTCTimestamp } from '../../model/time-data';

import { SeriesHorizontalLinePaneView } from './series-horizontal-line-pane-view';

export class CustomPriceLinePaneView extends SeriesHorizontalLinePaneView {
	private readonly _priceLine: CustomPriceLine;

	public constructor(series: Series, priceLine: CustomPriceLine) {
		super(series);
		this._priceLine = priceLine;
	}

	public xCoord(): Coordinate | null {
		const lineOptions = this._priceLine.options();
		return this._xCoord(lineOptions.rayStart as UTCTimestamp);
	}

	protected _updateImpl(height: number, width: number): void {
		const data = this._lineRendererData;
		data.visible = false;

		const lineOptions = this._priceLine.options();

		if (!this._series.visible() || !lineOptions.lineVisible) {
			return;
		}

		const y = this._priceLine.yCoord();
		if (y === null) {
			return;
		}

		const rayStartCord = this.xCoord();
		if (rayStartCord === null) {
			return;
		}

		data.visible = true;
		data.y = y;
		data.color = lineOptions.color;
		data.width = width;
		data.height = height;
		data.lineWidth = lineOptions.lineWidth;
		data.lineStyle = lineOptions.lineStyle;
		data.ray = lineOptions.ray;
		data.rayStart = rayStartCord;
	}

	private _xCoord(time: UTCTimestamp): Coordinate | null {
		const series = this._series;
		const timeScale = series.model().timeScale();
		const timeIndex = timeScale.timeToIndex({ timestamp: time }, true);

		if (timeScale.isEmpty() || timeIndex === null) {
			return null;
		}

		return timeScale.indexToCoordinate(timeIndex);
	}
}
