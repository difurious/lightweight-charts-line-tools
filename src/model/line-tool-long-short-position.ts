/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/tslint/config */
import { ChartModel } from './chart-model';
import { LineTool, LineToolPoint } from './line-tool';
import { LongShortPositionToolOptions, LineToolType } from './line-tool-options';
import { LongShortPositionPaneView } from '../views/pane/long-short-position-pane-view';
import { UTCTimestamp } from './time-data';
import { Point } from './point';
import { ensureNotNull } from '../helpers/assertions';

export class LineToolLongShortPosition extends LineTool<'LongShortPosition'> {
    public onFinalized: ((orderID: string) => void) | null = null; // Callback property to help fire getSelectedAndFireAfterEdit
	protected override readonly _toolType: LineToolType = 'LongShortPosition';

	private _isLong: boolean | null = null; // Track long/short state
    private _previewIsLong: boolean | null = null;
    private _clickCount: number = 0;

	public constructor(model: ChartModel, options: LongShortPositionToolOptions, points: LineToolPoint[] = []) {
        super(model, options, points);
        this._setPaneViews([new LongShortPositionPaneView(this, model)]);

        // when position tools already exist, i need to change clickCount, this will help addPoint
        // so it does not think the per existing position tool is a preview
        // If the tool is being restored from saved data, it will have 3 points
        if (this._points.length === 3) {
            this._clickCount = 2; // Set clickCount to finalized state
        }
    }
    public pointsCount(): number {
        return 3; // Entry, Stop Loss, PT
    }

    // Helper to determine if the current state is long
    public isCurrentLong(): boolean {
        return this._points.length === 3 && this._points[0].price > this._points[1].price;
    }

    // Getter for _clickCount
    public getClickCount(): number {
        return this._clickCount;
    }

    // Setter for _clickCount
    public setClickCount(count: number): void {
        this._clickCount = count;
    }

    public override addPoint(point: LineToolPoint): void {
        // Sanitize price:
        const priceScale = ensureNotNull(this.priceScale());
        const firstValue = ensureNotNull(priceScale.firstValue());
        point.price = Number(priceScale.formatPrice(point.price, firstValue));

        if (this._points.length === 0 && this._clickCount === 1) { // First click (Entry)
            super.addPoint(point); // Add to permanent points
            this._points.push(point); // Initialize temp Stop Loss with Entry point
            // eslint-disable-next-line unicorn/no-array-push-push
            this._points.push(this.calculateThirdPoint(point, true)); // Calculate temporary PT
        } else if (!this._finished && this._clickCount === 1) { // Mouse move before second click
            this._points[1] = point; // Update temporary Stop Loss
            this._points[2] = this.calculateThirdPoint(point, true); // Update temporary PT
        } else if (this._clickCount === 2 && !this._finished) { // 2nd click which is the stop so now call tryFinish (finalizes tool)
            this._points[1] = point; // Update temporary Stop Loss
            this._points[2] = this.calculateThirdPoint(point, true); // Update temporary PT
            this.tryFinish();

            // Invoke the callback if the tool is finalized:
            if (this.finished() && this.onFinalized !== null) {
                this.onFinalized(this.id());
            }

            // Set both editing and creating to false after finalizing:
            this.setEditing(false);
            this.setCreating(false);
        } else { // tool already created
            super.addPoint(point);
        }
    }

    public updatePreviewPoints(point: LineToolPoint): void {
        if (!this._finished) {
            // Sanitize Stop Loss price:
            const priceScale = ensureNotNull(this.priceScale());
            const firstValue = ensureNotNull(priceScale.firstValue());
            point.price = Number(priceScale.formatPrice(point.price, firstValue));

            this._points[1] = point; // Update temporary Stop Loss

            // Determine if the preview is for a long or short position
            this._previewIsLong = this._points[0].price > point.price;

            this._points[2] = this.calculateThirdPoint(point, true); // Update temporary PT
        }
    }

    // GOTCHA , I was doing this.setIsLong and that was interferring with the timing of checkFlip causing it to return false when it should be true
    // commenting them out seems to have fixed it.
    public override setPoint(index: number, point: LineToolPoint): void {
        // Round the incoming point.price using priceScale.formatPrice
        const priceScale = ensureNotNull(this.priceScale());
        const firstValue = ensureNotNull(priceScale.firstValue());
        point.price = Number(priceScale.formatPrice(point.price, firstValue));

        // Update the point in the _points array
        super.setPoint(index, point);

        // 5. Handle updates to the PT point during drags of ANY anchor
        if (index === 0 || index === 1 || index === 2) {
            if (this._points.length === 3) {
                // === ALWAYS RECALCULATE PT ===
                const ptPoint = this.calculateThirdPoint(this._points[2]);
                this._points[2] = ptPoint;
            }
        }
    }

    public override getPoint(index: number): LineToolPoint | null {
        if (index < this.pointsCount()) {
            return super.getPoint(index);
        } else if (index === 3) { // PT right anchor
            return this.calculateThirdPoint(this.points()[2]);
        }

        return null;
    }

    // Has the direction of the tool (long/short) changed during a drag?
    public isFlipped(): boolean {
		return this._isLong !== null && this._isLong !== this.isCurrentLong();
	}

    // Detect if a flip between long/short has occurred during dragging
    public checkFlip(pointIndex: number, appliedPoint: Point, isLong: boolean | null): boolean {
        if (this._points.length < 2 || (pointIndex !== 0 && pointIndex !== 1)) {
            return false;
        }

        const priceScale = ensureNotNull(this.priceScale());
        const ownerSource = ensureNotNull(this.ownerSource());
        const firstValue = ensureNotNull(ownerSource.firstValue());
        const newPrice = priceScale.coordinateToPrice(appliedPoint.y, firstValue.value);

        if (newPrice === null) {
            return false;
        }

        const roundedNewPrice = Number(priceScale.formatPrice(newPrice, firstValue.value));

        let flipDetected = false;

        if (pointIndex === 0) { // Entry is being dragged
            if (isLong && roundedNewPrice < this._points[1].price) {
                flipDetected = true;
            } else if (!isLong && roundedNewPrice > this._points[1].price) {
                flipDetected = true;
            }
        } else if (pointIndex === 1) { // Stop Loss is being dragged
            if (isLong && roundedNewPrice > this._points[0].price) {
                flipDetected = true;
            } else if (!isLong && roundedNewPrice < this._points[0].price) {
                flipDetected = true;
            }
        }

        return flipDetected;
    }

    // Update the PT anchor point to reflect changes to Entry or Stop Loss.
	public updatePT(): void {
		if (this._points.length === 3) {
			const thirdPoint = this.calculateThirdPoint(this._points[2]);
			super.setPoint(2, thirdPoint);
		}
	}

    // Set the long/short direction of the tool.
    public setIsLong(isLong: boolean): void {
        this._isLong = isLong;
    }

    // Public getter for _isLong
    public getIsLong(): boolean | null {
        return this._isLong;
    }

    // Calculate the PT point, taking into account long/short direction and constraints.
    public calculateThirdPoint(ptPoint: LineToolPoint, initialCreation: boolean = false): LineToolPoint {
        // Only calculate PT if both Entry and Stop Loss are defined
        if (this._points.length < 2) {
            return { price: 0, timestamp: 0 }; // Return a dummy point
        }

        // Get the price interval (minMove) using the minMove() method from LineTool
        const minPriceMove = Number(this.minMove());

        const priceScale = ensureNotNull(this.priceScale());
        const firstValue = ensureNotNull(priceScale.firstValue());

        // Round using priceScale.formatPrice
        const entryPrice = Number(priceScale.formatPrice(this._points[0].price, firstValue));
        const stopLossPrice = Number(priceScale.formatPrice(this._points[1].price, firstValue));
        const currentDistance = Math.abs(entryPrice - stopLossPrice);

        let ptPrice = Number(priceScale.formatPrice(ptPoint.price, firstValue));

        // upon 1st click you are in a "preview" mode, so 3x the PT
        if (initialCreation) {
            // Calculate PT price for initial creation based on _isLong
            ptPrice = this._previewIsLong
                ? entryPrice + (currentDistance * 3)
                : entryPrice - (currentDistance * 3);
        } else {
            // not preview mode, so already created, check for ifSlipped or not
            const isFlipped = (this._paneViews[0] as LongShortPositionPaneView).isFlipped;
            if (isFlipped) {
                // Recalculate PT price ONLY during a flipped drag
                ptPrice = this.isCurrentLong()
                    ? entryPrice + (currentDistance * 3)
                    : entryPrice - (currentDistance * 3);
            }
            // Apply PT point constraint
            if (this.isCurrentLong()) {
                // For longs, PT must be at least minPriceMove ABOVE the Entry
                ptPrice = Math.max(ptPrice, entryPrice + minPriceMove);
            } else {
                // For shorts, PT must be at least minPriceMove BELOW the Entry
                ptPrice = Math.min(ptPrice, entryPrice - minPriceMove);
            }
        }

        return { price: ptPrice, timestamp: this._points[1].timestamp };
    }

	protected _getAnchorPointForIndex(index: number): LineToolPoint {
        const start = this.points()[0];
        const end = this.points()[1];
        const pt = this.points()[2];

        // Define the anchor points, including the hidden PT right anchor
        return [
			{ price: start.price, timestamp: start.timestamp as UTCTimestamp }, // Entry
			{ price: end.price, timestamp: end.timestamp as UTCTimestamp }, // Stop Loss
			{ price: pt.price, timestamp: pt.timestamp as UTCTimestamp }, // PT left
			{ price: end.price, timestamp: pt.timestamp as UTCTimestamp }, // PT right (hidden)
        ][index];
    }
}
