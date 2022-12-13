import { LineToolPoint as LineToolPoint } from '../model/line-tool';
import { LineToolPartialOptionsMap, LineToolType } from '../model/line-tool-options';
/**
 * Represents the interface for interacting with line tools.
 */
export interface ILineToolApi<TLineToolType extends LineToolType> {
	/**
	 * Applies new options to the existing line tool
	 * Note that you can only pass options you want to change.
	 *
	 * @param options - Any subset of options.
	 */
	applyOptions(options: LineToolPartialOptionsMap[TLineToolType]): void;

	/**
	 * Returns currently applied options
	 *
	 * @returns Full set of currently applied options, including defaults
	 */
	options(): Readonly<LineToolPartialOptionsMap[TLineToolType]>;

	/**
	 * Sets or replaces series data.
	 *
	 * @param points - Points of the line tool. Old points get replaced by new ones
	 */
	setPoints(points: LineToolPoint[]): void;

	/**
	 * Return current series type.
	 *
	 * @returns Type of the lineTool.
	 */
	toolType(): LineToolType;
}
