import { DeepPartial } from '../helpers/strict-type-checks';

import { BarPrice, BarPrices } from '../model/bar';
import { ChartOptions } from '../model/chart-model';
import { LineToolExport, LineToolPoint } from '../model/line-tool';
import { LineToolPartialOptionsMap, LineToolType } from '../model/line-tool-options';
import { Point } from '../model/point';
import { SeriesMarker } from '../model/series-markers';
import {
	AreaSeriesPartialOptions,
	BarSeriesPartialOptions,
	BaselineSeriesPartialOptions,
	CandlestickSeriesPartialOptions,
	HistogramSeriesPartialOptions,
	LineSeriesPartialOptions,
	SeriesType,
} from '../model/series-options';
import { BusinessDay, UTCTimestamp } from '../model/time-data';

import { Time } from './data-consumer';
import { ILineToolApi } from './iline-tool-api';
import { IPriceScaleApi } from './iprice-scale-api';
import { ISeriesApi } from './iseries-api';
import { ITimeScaleApi } from './itime-scale-api';

/**
 * Represents a mouse event.
 */
export interface MouseEventParams {
	/**
	 * Time of the data at the location of the mouse event.
	 *
	 * The value will be `undefined` if the location of the event in the chart is outside the range of available data.
	 */
	time?: UTCTimestamp | BusinessDay;
	/**
	 * Location of the event in the chart.
	 *
	 * The value will be `undefined` if the event is fired outside the chart, for example a mouse leave event.
	 */
	point?: Point;
	/**
	 * Prices of all series at the location of the event in the chart.
	 *
	 * Keys of the map are {@link ISeriesApi} instances. Values are prices.
	 * Each price is a number for line, area, and histogram series or a OHLC object for candlestick and bar series.
	 */
	seriesPrices: Map<ISeriesApi<SeriesType>, BarPrice | BarPrices>;
	/**
	 * The {@link ISeriesApi} for the series at the point of the mouse event.
	 */
	hoveredSeries?: ISeriesApi<SeriesType>;
	/**
	 * The ID of the marker at the point of the mouse event.
	 */
	hoveredMarkerId?: SeriesMarker<Time>['id'];
}

/**
 * A custom function use to handle mouse events.
 */
export type MouseEventHandler = (param: MouseEventParams) => void;

export interface LineToolsDoubleClickEventParams {
	selectedLineTool: LineToolExport<LineToolType>;
}

export interface LineToolsAfterEditEventParams {
	selectedLineTool: LineToolExport<LineToolType>;
	stage: string;
}

export type LineToolsDoubleClickEventHandler = (param: LineToolsDoubleClickEventParams) => void;

export type LineToolsAfterEditEventHandler = (param: LineToolsAfterEditEventParams) => void;

/**
 * The main interface of a single chart.
 */
export interface IChartApi {
	/**
	 * Removes the chart object including all DOM elements. This is an irreversible operation, you cannot do anything with the chart after removing it.
	 */
	remove(): void;

	/**
	 * Sets fixed size of the chart. By default chart takes up 100% of its container.
	 *
	 * @param width - Target width of the chart.
	 * @param height - Target height of the chart.
	 * @param forceRepaint - True to initiate resize immediately. One could need this to get screenshot immediately after resize.
	 */
	resize(width: number, height: number, forceRepaint?: boolean): void;

	/**
	 * Creates an area series with specified parameters.
	 *
	 * @param areaOptions - Customization parameters of the series being created.
	 * @returns An interface of the created series.
	 * @example
	 * ```js
	 * const series = chart.addAreaSeries();
	 * ```
	 */
	addAreaSeries(areaOptions?: AreaSeriesPartialOptions): ISeriesApi<'Area'>;

	/**
	 * Creates a baseline series with specified parameters.
	 *
	 * @param baselineOptions - Customization parameters of the series being created.
	 * @returns An interface of the created series.
	 * @example
	 * ```js
	 * const series = chart.addBaselineSeries();
	 * ```
	 */
	addBaselineSeries(baselineOptions?: BaselineSeriesPartialOptions): ISeriesApi<'Baseline'>;

	/**
	 * Creates a bar series with specified parameters.
	 *
	 * @param barOptions - Customization parameters of the series being created.
	 * @returns An interface of the created series.
	 * @example
	 * ```js
	 * const series = chart.addBarSeries();
	 * ```
	 */
	addBarSeries(barOptions?: BarSeriesPartialOptions): ISeriesApi<'Bar'>;

	/**
	 * Creates a candlestick series with specified parameters.
	 *
	 * @param candlestickOptions - Customization parameters of the series being created.
	 * @returns An interface of the created series.
	 * @example
	 * ```js
	 * const series = chart.addCandlestickSeries();
	 * ```
	 */
	addCandlestickSeries(candlestickOptions?: CandlestickSeriesPartialOptions): ISeriesApi<'Candlestick'>;

	/**
	 * Creates a histogram series with specified parameters.
	 *
	 * @param histogramOptions - Customization parameters of the series being created.
	 * @returns An interface of the created series.
	 * @example
	 * ```js
	 * const series = chart.addHistogramSeries();
	 * ```
	 */
	addHistogramSeries(histogramOptions?: HistogramSeriesPartialOptions): ISeriesApi<'Histogram'>;

	/**
	 * Creates a line series with specified parameters.
	 *
	 * @param lineOptions - Customization parameters of the series being created.
	 * @returns An interface of the created series.
	 * @example
	 * ```js
	 * const series = chart.addLineSeries();
	 * ```
	 */
	addLineSeries(lineOptions?: LineSeriesPartialOptions): ISeriesApi<'Line'>;

	/**
	 * Creates a line tool with specified parameters.
	 */
	addLineTool<T extends LineToolType>(name: T, points: LineToolPoint[], options: LineToolPartialOptionsMap[T]): ILineToolApi<T>;

	/**
	 * Sets the active line tool with specified parameters.
	 */
	setActiveLineTool<T extends LineToolType>(name: T, options: LineToolPartialOptionsMap[T]): void;

	/**
     * Remove a LineTool by its ID.
     */
	removeLineToolsById(ids: string[]): void;

	/**
     * Get the currently selected LineTool(s), return JSON string of them.
     */
	getSelectedLineTools(): void;

	/**
     * Remove the currently selected LineTool only.
     */
	removeSelectedLineTools(): void;

    /**
     * Remove All LineTools that have been drawn.
     */
	removeAllLineTools(): void;

    /**
     * Export all LineTools that have been drawn to a JSON string.  This export can be used with importLineTools(JSONstring) if you want to import them in the future
     */
	exportLineTools(): void;

    /**
     * Import a JSON string to recreate all LineTools that have previously been exported using exportLineTools().
     */
	importLineTools(json: string): boolean;

    /**
     * Apply new provided options to lineTool specified in the id field.
     */
	applyLineToolOptions(newLineTool: LineToolExport<LineToolType>): boolean;

	/**
		 * Creates or updates a line tool with the specified ID.
		 *
		 * @param lineToolType - The type of line tool to create or update.
		 * @param points - The points of the line tool.
		 * @param options - The options for the line tool.
		 * @param id - The ID of the line tool.
	*/
	createOrUpdateLineTool<T extends LineToolType>(
		lineToolType: T,
		points: LineToolPoint[],
		options: LineToolPartialOptionsMap[T],
		id: string
	): void;

	/**
	 * Removes a series of any type. This is an irreversible operation, you cannot do anything with the series after removing it.
	 *
	 * @example
	 * ```js
	 * chart.removeSeries(series);
	 * ```
	 */
	removeSeries(seriesApi: ISeriesApi<SeriesType>): void;

	/**
	 * Subscribe to the chart click event.
	 *
	 * @param handler - Handler to be called on mouse click.
	 * @example
	 * ```js
	 * function myClickHandler(param) {
	 *     if (!param.point) {
	 *         return;
	 *     }
	 *
	 *     console.log(`Click at ${param.point.x}, ${param.point.y}. The time is ${param.time}.`);
	 * }
	 *
	 * chart.subscribeClick(myClickHandler);
	 * ```
	 */
	subscribeClick(handler: MouseEventHandler): void;

	/**
	 * Unsubscribe a handler that was previously subscribed using {@link subscribeClick}.
	 *
	 * @param handler - Previously subscribed handler
	 * @example
	 * ```js
	 * chart.unsubscribeClick(myClickHandler);
	 * ```
	 */
	unsubscribeClick(handler: MouseEventHandler): void;

	/**
	 * Subscribe to the crosshair move event.
	 *
	 * @param handler - Handler to be called on crosshair move.
	 * @example
	 * ```js
	 * function myCrosshairMoveHandler(param) {
	 *     if (!param.point) {
	 *         return;
	 *     }
	 *
	 *     console.log(`Crosshair moved to ${param.point.x}, ${param.point.y}. The time is ${param.time}.`);
	 * }
	 *
	 * chart.subscribeClick(myCrosshairMoveHandler);
	 * ```
	 */
	subscribeCrosshairMove(handler: MouseEventHandler): void;

	setCrossHairXY(x: number, y: number, visible: boolean): void;

	clearCrossHair(): void;

	/**
	 * Unsubscribe a handler that was previously subscribed using {@link subscribeCrosshairMove}.
	 *
	 * @param handler - Previously subscribed handler
	 * @example
	 * ```js
	 * chart.unsubscribeCrosshairMove(myCrosshairMoveHandler);
	 * ```
	 */
	unsubscribeCrosshairMove(handler: MouseEventHandler): void;

	/**
	 * Adds a subscription to receive notifications on linetools being double clicked
	 *
	 * @param handler - handler (function) to be called on double click
	 */
	subscribeLineToolsDoubleClick(handler: LineToolsDoubleClickEventHandler): void;

	/**
	 * Removes linetools being double clicked subscription
	 *
	 * @param handler - previously subscribed handler
	 */
	unsubscribeLineToolsDoubleClick(handler: LineToolsDoubleClickEventHandler): void;

	/**
	 * Adds a subscription to receive notifications on linetools after finishing editing a line tool
	 *
	 * @param handler - handler (function) to be called after line tool was finished editing
	 */
	subscribeLineToolsAfterEdit(handler: LineToolsAfterEditEventHandler): void;

	/**
	 * Removes linetools notifications on linetools after finishing editing a line tool
	 *
	 * @param handler - previously subscribed handler
	 */
	unsubscribeLineToolsAfterEdit(handler: LineToolsAfterEditEventHandler): void;

	/**
	 * Returns API to manipulate a price scale.
	 *
	 * @param priceScaleId - ID of the price scale.
	 * @returns Price scale API.
	 */
	priceScale(priceScaleId?: string): IPriceScaleApi;

	/**
	 * Returns API to manipulate the time scale
	 *
	 * @returns Target API
	 */
	timeScale(): ITimeScaleApi;

	/**
	 * Applies new options to the chart
	 *
	 * @param options - Any subset of options.
	 */
	applyOptions(options: DeepPartial<ChartOptions>): void;

	/**
	 * Returns currently applied options
	 *
	 * @returns Full set of currently applied options, including defaults
	 */
	options(): Readonly<ChartOptions>;

	/**
	 * Make a screenshot of the chart with all the elements excluding crosshair.
	 *
	 * @returns A canvas with the chart drawn on. Any `Canvas` methods like `toDataURL()` or `toBlob()` can be used to serialize the result.
	 */
	takeScreenshot(): HTMLCanvasElement;
}
