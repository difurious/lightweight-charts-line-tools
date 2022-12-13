import { ChartModel } from '../../model/chart-model';
import { LineTool, LineToolOptionsInternal } from '../../model/line-tool';
import { LineToolType } from '../../model/line-tool-options';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { TriangleRenderer } from '../../renderers/triangle-renderer';

import { LineToolPaneView } from './line-tool-pane-view';

export class TrianglePaneView extends LineToolPaneView {
	protected _triangleRenderer: TriangleRenderer = new TriangleRenderer();

	public constructor(source: LineTool<LineToolType>, model: ChartModel) {
		super(source, model);
		this._renderer = null;
	}

	protected override _updateImpl(): void {
		const options = this._source.options() as LineToolOptionsInternal<'Triangle'>;
		super._updateImpl();
		this._renderer = null;

		this._triangleRenderer.setData({ ...options.triangle, points: this._points, hitTestBackground: false });
		const compositeRenderer = new CompositeRenderer();
		compositeRenderer.append(this._triangleRenderer);
		this.addAnchors(compositeRenderer);
		this._renderer = compositeRenderer;
	}
}
