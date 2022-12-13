import { ITimeAxisViewRenderer } from '../../renderers/itime-axis-view-renderer';

export interface ITimeAxisView {
	renderer(): ITimeAxisViewRenderer;
	update(): void;
}
