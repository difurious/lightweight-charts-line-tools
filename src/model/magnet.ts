import { ensure } from '../helpers/assertions';

import { Coordinate } from './coordinate';
import { CrosshairMode, CrosshairOptions } from './crosshair';
import { IPriceDataSource } from './iprice-data-source';
import { Pane } from './pane';
import { PlotRowValueIndex } from './plot-data';
import { Series } from './series';
import { TimePointIndex } from './time-data';

export class Magnet {
	private _enabled: boolean = true;
	private readonly _options: CrosshairOptions;

	public constructor(options: CrosshairOptions) {
		this._options = options;
	}

	public enable(): void {
		this._enabled = true;
	}

	public disable(): void {
		this._enabled = false;
	}

	public align(price: number, index: TimePointIndex, pane: Pane): number {
		let res = price;
		if (this._options.mode === CrosshairMode.Normal) {
			return res;
		}
		if (!this._enabled) { return price; }

		const defaultPriceScale = pane.defaultPriceScale();
		const firstValue = defaultPriceScale.firstValue();

		if (firstValue === null) {
			return res;
		}

		const y = defaultPriceScale.priceToCoordinate(price, firstValue);

		// get all serieses from the pane
		const serieses: readonly Series[] = pane.dataSources().filter(
			((ds: IPriceDataSource) => (ds instanceof Series)) as (ds: IPriceDataSource) => ds is Series);

		const candidates = serieses.reduce(
			(acc: Coordinate[], series: Series) => {
				if (pane.isOverlay(series) || !series.visible()) {
					return acc;
				}
				const ps = series.priceScale();
				const bars = series.bars();
				if (ps.isEmpty() || !bars.contains(index)) {
					return acc;
				}

				const bar = bars.valueAt(index);
				if (bar === null) {
					return acc;
				}

				// convert bar to pixels
				const firstPrice = ensure(series.firstValue());
				return acc.concat(
					[ps.priceToCoordinate(bar.value[PlotRowValueIndex.Close], firstPrice.value)],
					[ps.priceToCoordinate(bar.value[PlotRowValueIndex.Low], firstPrice.value)],
					[ps.priceToCoordinate(bar.value[PlotRowValueIndex.High], firstPrice.value)],
					[ps.priceToCoordinate(bar.value[PlotRowValueIndex.Open], firstPrice.value)]
				);
			},
			[] as Coordinate[]);

		if (candidates.length === 0) {
			return res;
		}

		candidates.sort((y1: Coordinate, y2: Coordinate) => Math.abs(y1 - y) - Math.abs(y2 - y));

		const nearest = candidates[0];
		// res = defaultPriceScale.coordinateToPrice(nearest, firstValue);
		if (Math.abs(nearest - y) < this._options.magnetThreshold) {
			res = defaultPriceScale.coordinateToPrice(nearest, firstValue);
		}

		return res;
	}
}
