/**
 * Represents the position of a series marker relative to a bar.
 */
export type SeriesMarkerPosition = 'aboveBar' | 'belowBar' | 'inBar' | 'price';

/**
 * Represents the shape of a series marker.
 */
export type SeriesMarkerShape = 'circle' | 'square' | 'arrowUp' | 'arrowDown' | 'triangle';

/**
 * Represents the anchor of a series marker.
 */
export type SeriesMarkerAnchor = 'top' | 'bottom' | 'left' | 'right' | 'center';

/**
 * Represents the stroke of a series marker.
 */
export interface SeriesMarkerStroke {
	color: string;
	width?: number;
}

/**
 * Represents a series marker.
 */
export interface SeriesMarker<TimeType> {
	/**
	 * The time of the marker.
	 */
	time: TimeType;
	/**
	 * The position of the marker.
	 */
	position: SeriesMarkerPosition;
	/**
	 * The shape of the marker.
	 */
	shape: SeriesMarkerShape;
	/**
	 * The color of the marker.
	 */
	color: string;
	/**
	 * The ID of the marker.
	 */
	id?: string;
	/**
	 * The optional text of the marker.
	 */
	text?: string;
	/**
	 * The optional size of the marker.
	 *
	 * @defaultValue `1`
	 */
	size?: number;
	/**
	 * The price position of the marker.
	 */
	price?: number;
	/**
	 * The anchor of the marker.
	 */
	anchor?: SeriesMarkerAnchor;
	/**
	 * The stroke of the marker.
	 */
	stroke?: SeriesMarkerStroke;
	/**
	 * The rotation of the marker.
	 */
	rotation?: number;
}

export interface InternalSeriesMarker<TimeType> extends SeriesMarker<TimeType> {
	internalId: number;
}
