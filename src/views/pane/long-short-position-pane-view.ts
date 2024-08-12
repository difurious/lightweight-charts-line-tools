/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/tslint/config */
import { deepCopy } from '../../helpers/deep-copy';
import { Coordinate } from '../../model/coordinate';
import { ChartModel } from '../../model/chart-model';
import { UTCTimestamp } from '../../model/time-data';
import { LineTool, LineToolOptionsInternal } from '../../model/line-tool';
import { BoxHorizontalAlignment, BoxVerticalAlignment, LineToolType, TextOptions } from '../../model/line-tool-options';
import { PaneCursorType } from '../../model/pane';
import { CompositeRenderer } from '../../renderers/composite-renderer';
import { RectangleRenderer } from '../../renderers/rectangle-renderer';
import { AnchorPoint } from '../../renderers/line-anchor-renderer';
import { TextRenderer } from '../../renderers/text-renderer';
import { LineToolPaneView } from './line-tool-pane-view';
import { Point } from '../../model/point';
import { LineToolLongShortPosition } from '../../model/line-tool-long-short-position';
import { ensureNotNull } from '../../helpers/assertions';
import { clone } from '../../helpers/strict-type-checks';

export class LongShortPositionPaneView extends LineToolPaneView {
    // Renderers for the Entry-Stop Loss and PT rectangles
    protected _entryStopLossRenderer: RectangleRenderer = new RectangleRenderer();
    protected _ptRenderer: RectangleRenderer = new RectangleRenderer();

    // Renderers for text labels (not currently used)
    protected _labelRenderer: TextRenderer = new TextRenderer();

    // Renderers for Entry-Stop Loss and PT text labels
    protected _entryStopLossLabelRenderer: TextRenderer = new TextRenderer();
    protected _ptLabelRenderer: TextRenderer = new TextRenderer();

    public constructor(source: LineTool<LineToolType>, model: ChartModel) {
        super(source, model);
        this._renderer = null;
        // Set the callback in the constructor to handle the
        // 'lineToolFinished' event after the LongShortPosition tool is finalized.
        (source as LineToolLongShortPosition).onFinalized = (orderID: string) => {
            this.triggerAfterEdit('lineToolFinished', orderID);
        };
    }

    // used to execute callback so position tool can fire a lineToolFinished when the position tool is initially created
    public triggerAfterEdit(stage: string, orderID: string): void {
        const modifiedLineTool = this._source;

        const selectedLineTool = clone(modifiedLineTool.exportLineToolToLineToolExport());
        this._model.fireLineToolsAfterEdit(selectedLineTool, stage);
    }

    protected override _updateImpl(): void {
        this._renderer = null;
        this._invalidated = false;

        const priceScale = this._source.priceScale();
        const timeScale = this._model.timeScale();

        if (!priceScale || priceScale.isEmpty() || timeScale.isEmpty()) { return; }
        const strictRange = timeScale.visibleTimeRange();
        if (strictRange === null) { return; }

        // Ensure _points is updated even if the tool is not finalized
        super._updateImpl();

        if (this._points.length === 0) { return; } // No points to work with

        const options = this._source.options() as LineToolOptionsInternal<'LongShortPosition'>;
        const compositeRenderer = new CompositeRenderer();

        // Prepare points for rectangle renderers
        const entryStopLossPoints = [this._points[0], this._points[1]];
        const ptPoints = [this._points[0], this._points[2]];

        // Entry to Stop Loss Rectangle
        this._entryStopLossRenderer.setData({
            points: entryStopLossPoints,
            background: options.entryStopLossRectangle.background,
            border: options.entryStopLossRectangle.border,
            extend: options.entryStopLossRectangle.extend,
            hitTestBackground: false,
        });

            // Entry to PT Rectangle
        this._ptRenderer.setData({
            points: ptPoints,
            background: options.entryPtRectangle.background,
            border: options.entryPtRectangle.border,
            extend: options.entryPtRectangle.extend,
            hitTestBackground: false,
        });

        compositeRenderer.append(this._entryStopLossRenderer);
        compositeRenderer.append(this._ptRenderer);

        // Get the text data
        const entryStopLossText = this._getText(options.entryStopLossText, entryStopLossPoints, false);

        // Entry to Stop Loss Text
        if (options.entryStopLossText.value || entryStopLossText.text.value !== '') {
            this._entryStopLossLabelRenderer.setData({
                text: entryStopLossText.text,
                points: [entryStopLossText.point],
            });
            compositeRenderer.append(this._entryStopLossLabelRenderer);
        }

        // Get the text data
        const entryPtText = this._getText(options.entryPtText, ptPoints, true);

        // Entry to PT Text
        if (options.entryPtText.value || entryPtText.text.value !== '') {
            this._ptLabelRenderer.setData({
                text: entryPtText.text,
                points: [entryPtText.point],
            });
            compositeRenderer.append(this._ptLabelRenderer);
        }

        // PT Constraint and Anchor Update Logic
        if (this._source.points().length >= 3) {
            const minPriceMove = Number(this._source.minMove());
            let ptPrice = this._source.points()[2].price;
            const entryPrice = this._source.points()[0].price;

            // Adjust PT price based on long/short direction
            if ((this._source as LineToolLongShortPosition).isCurrentLong()) {
                ptPrice = Math.max(ptPrice, entryPrice + minPriceMove); // Ensure PT above Entry for longs
            } else {
                ptPrice = Math.min(ptPrice, entryPrice - minPriceMove); // Ensure PT below Entry for shorts
            }

            // Update the PT point in the source
            this._source.setPoint(2, { price: ptPrice, timestamp: this._source.points()[2].timestamp });

            const firstValue = ensureNotNull(this._source.ownerSource()).firstValue();
            if (firstValue !== null) {
                // Update the PT anchor point's coordinates
                const ptX = timeScale.timeToCoordinate({ timestamp: this._source.points()[2].timestamp as UTCTimestamp });
                const ptY = priceScale.priceToCoordinate(ptPrice, ensureNotNull(firstValue.value));

                this._points[2].x = ptX;
                this._points[2].y = ptY;
            }
        }

        this._addAnchors(compositeRenderer);
        this._renderer = compositeRenderer;
    }

    protected _addAnchors(renderer: CompositeRenderer): void {
        // Only create anchors for Entry, Stop Loss, and PT (point 1 of PT rectangle)
        renderer.append(this.createLineAnchor({
            points: [this._points[0], this._points[1], this._points[2]], // PT anchor is now at index 2
            pointsCursorType: [
                PaneCursorType.DiagonalNwSeResize,
                PaneCursorType.DiagonalNeSwResize,
                PaneCursorType.VerticalResize,
            ],
        }, 0));
    }

    private _getText(textOptions: TextOptions, points: AnchorPoint[], isPtRectangle: boolean = false): { text: TextOptions; point: Point } {
        const point0 = points[0];
        const point1 = points[1];
        const minX = Math.min(point0.x, point1.x);
        const maxX = Math.max(point0.x, point1.x);
        const minY = Math.min(point0.y, point1.y);
        const maxY = Math.max(point0.y, point1.y);
        const pivot = point0.clone();
        const textHalfSize = textOptions.font.size / 3;
        let horizontalPadding = 0;

        switch (textOptions.box.alignment.vertical) {
            case BoxVerticalAlignment.Middle:
                pivot.y = (minY + maxY) / 2 as Coordinate;
                horizontalPadding = textHalfSize;
                break;
            case BoxVerticalAlignment.Top:
                pivot.y = minY as Coordinate;
                break;
            case BoxVerticalAlignment.Bottom:
                pivot.y = maxY as Coordinate;
        }

        switch (textOptions.box.alignment.horizontal) {
            case BoxHorizontalAlignment.Center:
                pivot.x = (minX + maxX) / 2 as Coordinate;
                break;
            case BoxHorizontalAlignment.Left:
                pivot.x = minX as Coordinate;
                break;
            case BoxHorizontalAlignment.Right:
                pivot.x = maxX as Coordinate;
        }

        const labelOptions = deepCopy(textOptions);
        labelOptions.box = { ...labelOptions.box, padding: { y: textHalfSize, x: horizontalPadding } };

        if (textOptions.box.alignment.vertical === BoxVerticalAlignment.Middle) {
            labelOptions.box.maxHeight = maxY - minY;
        }

        // Get the main options
        const options = this._source.options() as LineToolOptionsInternal<'LongShortPosition'>;

        // LongShortPosition: Automatic Text and Styling
        // If showAutoText is enabled, override user-provided text
        // with automatically calculated text and apply specific styling.
        if (options.showAutoText) {
            // Calculate point distances
            const priceScale = ensureNotNull(this._source.priceScale());
            const firstValue = ensureNotNull(priceScale.firstValue()); // Assuming you have a firstValue

            let pointDistance = 0;

            if (!isPtRectangle) {
                // Entry-Stop Loss rectangle:
                // Calculate distance between Entry and Stop Loss prices
                // Round prices to the nearest minPriceMove
                const price1 = Number(priceScale.formatPrice(this._source.points()[0].price, firstValue));
                const price2 = Number(priceScale.formatPrice(this._source.points()[1].price, firstValue));
                pointDistance = Math.abs(price1 - price2);

                // Format the text to display Entry, Stop Loss, and the distance
                labelOptions.value =
                    'Entry: ' + priceScale.formatPrice(this._source.points()[0].price, firstValue) + '\n' +
                    'Stop: ' + priceScale.formatPrice(this._source.points()[1].price, firstValue) + '\n' +
                    `(${pointDistance.toFixed(2)} pts)`;
            } else {
                // PT rectangle:
                // Calculate distance between Entry and PT prices
                const price1 = Number(priceScale.formatPrice(this._source.points()[2].price, firstValue));
                const price2 = Number(priceScale.formatPrice(this._source.points()[0].price, firstValue));
                pointDistance = Math.abs(price1 - price2);

                // Format text to display PT and the distance
                labelOptions.value =
                    'PT: ' + priceScale.formatPrice(this._source.points()[2].price, firstValue) + '\n' +
                    `(${pointDistance.toFixed(2)} pts)`;
            }
            // Apply font style for automatic text
            labelOptions.font = {
                family: 'Arial', // Or your desired font family
                size: 14,
                color: 'rgba(255, 255, 255, 1)', // White
                bold: false,
                italic: false,
            };

            // Determine text box alignment based on long/short direction
            // if long
            if ((this._source as LineToolLongShortPosition).isCurrentLong()) {
                if (!isPtRectangle) {
                    labelOptions.box.alignment = {
                        vertical: BoxVerticalAlignment.Bottom,
                        horizontal: BoxHorizontalAlignment.Center,
                    };
                } else {
                    labelOptions.box.alignment = {
                        vertical: BoxVerticalAlignment.Top,
                        horizontal: BoxHorizontalAlignment.Center,
                    };
                }
            } else {
                // short
                if (!isPtRectangle) {
                    labelOptions.box.alignment = {
                        vertical: BoxVerticalAlignment.Top,
                        horizontal: BoxHorizontalAlignment.Center,
                    };
                } else {
                    labelOptions.box.alignment = {
                        vertical: BoxVerticalAlignment.Bottom,
                        horizontal: BoxHorizontalAlignment.Center,
                    };
                }
            }

            // ***RECALCULATE PIVOT BASED ON NEW ALIGNMENT***
            switch (labelOptions.box.alignment.horizontal) {
                case BoxHorizontalAlignment.Center:
                    pivot.x = (minX + maxX) / 2 as Coordinate;
                    break;
                case BoxHorizontalAlignment.Left:
                    pivot.x = minX as Coordinate;
                    break;
                case BoxHorizontalAlignment.Right:
                    pivot.x = maxX as Coordinate;
            }
            switch (labelOptions.box.alignment.vertical) {
                case BoxVerticalAlignment.Middle:
                    pivot.y = (minY + maxY) / 2 as Coordinate;
                    break;
                case BoxVerticalAlignment.Top:
                    pivot.y = minY as Coordinate;
                    break;
                case BoxVerticalAlignment.Bottom:
                    pivot.y = maxY as Coordinate;
            }
        }

        return {
            text: labelOptions,
            point: pivot,
        };
    }
}
