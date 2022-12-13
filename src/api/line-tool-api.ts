import { clone } from '../helpers/strict-type-checks';

import { LineTool, LineToolPoint } from '../model/line-tool';
import { LineToolOptionsMap, LineToolPartialOptionsMap, LineToolType } from '../model/line-tool-options';

import { ILineToolApi } from './iline-tool-api';

export class LineToolApi<TLineToolType extends LineToolType> implements ILineToolApi<TLineToolType> {
	protected _lineTool: LineTool<TLineToolType>;

	public constructor(lineTool: LineTool<TLineToolType>) {
		this._lineTool = lineTool;
	}

	public setPoints(points: LineToolPoint[]): void {
		throw new Error('Method not implemented.');
	}

	public applyOptions(options: LineToolPartialOptionsMap[TLineToolType]): void {
		this._lineTool.applyOptions(options);
	}

	public options(): Readonly<LineToolOptionsMap[TLineToolType]> {
		return clone(this._lineTool.options());
	}

	public toolType(): LineToolType {
		return this._lineTool.toolType();
	}
}
