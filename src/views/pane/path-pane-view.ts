import { deepCopy } from '../../helpers/deep-copy';

import { ChartModel } from '../../model/chart-model';
import { LineTool } from '../../model/line-tool';
import { LineToolPathOptions, LineToolType } from '../../model/line-tool-options';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { PolygonRenderer } from '../../renderers/polygon-renderer';

import { LineToolPaneView } from './line-tool-pane-view';

export class PathPaneView extends LineToolPaneView {
	protected _polygonRenderer: PolygonRenderer = new PolygonRenderer();

	public constructor(source: LineTool<LineToolType>, model: ChartModel) {
		super(source, model);
		this._renderer = null;
	}

	protected override _updateImpl(): void {
		super._updateImpl();
		this._renderer = null;

		const options = this._source.options() as LineToolPathOptions;
		this._polygonRenderer.setData({ line: deepCopy(options.line), points: this._points });

		const compositeRenderer = new CompositeRenderer();
		compositeRenderer.append(this._polygonRenderer);

		this._renderer = compositeRenderer;
		this.addAnchors(compositeRenderer);
	}
}
