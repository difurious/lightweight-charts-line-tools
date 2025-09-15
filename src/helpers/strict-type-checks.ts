/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

type OmitDistributive<T, K extends PropertyKey> = T extends any ? (T extends object ? Id<OmitRecursively<T, K>> : T) : never;
type Id<T> = {} & { [P in keyof T]: T[P] };
export type OmitRecursively<T extends any, K extends PropertyKey> = Omit<
    { [P in keyof T]: OmitDistributive<T[P], K> },
    K
>;

/**
 * Represents a type `T` where every property is optional.
 */
export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends (infer U)[]
		? DeepPartial<U>[]
		: T[P] extends readonly (infer X)[]
			? readonly DeepPartial<X>[]
			: DeepPartial<T[P]>
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// GOTCHA merge suffers from a bug that if you pass an array shorter than the original length array, it will update
// the array, but also keep in the old data that was originally a longer length array.  so if original array was a length of 3
// then you updated option with something with an array length of 1, it will update that first entry in the array, but also keep
// the other 2 entries in the array as like "stale" data, and not trim the other 2 old entries in the array.

// Assume OmitDistributive and Id types are defined elsewhere and work as expected.
// They are advanced TypeScript utility types for deep object manipulation and are assumed to be correct.
// type OmitDistributive<T, K extends PropertyKey> = T extends any ? (T extends object ? Id<OmitRecursively<T, K>> : T) : never;
// type Id<T> = {} & { [P in keyof T]: T[P] };
// export type OmitRecursively<T extends any, K extends PropertyKey> = Omit<
//     { [P in keyof T]: OmitDistributive<T[P], K> },
//     K
// >;

/**
 * Deeply merges properties from source objects into a destination object.
 * Handles primitives, nested objects, and arrays.
 *
 * @param dst - The destination object to merge into.
 * @param sources - One or more source objects to merge from.
 * @returns The modified destination object.
 */

// eslint-disable-next-line complexity
export function merge(dst: Record<string, any>, ...sources: Record<string, any>[]): Record<string, any> {
    // Iterate over each source object provided.
	for (const src of sources) {
        // Iterate over all properties of the current source object.
        // Using 'for...in' loop to ensure all enumerable properties (including inherited ones, though unlikely for config) are considered.
        // eslint-disable-next-line no-restricted-syntax
		for (const key in src) {
            // Skip if the property is undefined in the source.
			if (src[key] === undefined) {
				continue;
			}

			const srcValue = src[key];
			const dstValue = dst[key];

            // --- Array Handling Enhancement ---
            // Check if both source and destination values for the current key are arrays.
			if (Array.isArray(srcValue) && Array.isArray(dstValue)) {
                // If the source array is shorter than the destination array,
                // we need to trim the destination array to match the source array's length.
                // This ensures that elements that should have been removed are indeed removed,
                // preventing stale data (like the extra FibBracketOrders).
				if (srcValue.length < dstValue.length) {
					dstValue.length = srcValue.length;
				}

                // Iterate over the elements of the source array.
                // We will overwrite existing destination elements by index.
				for (let i = 0; i < srcValue.length; i++) {
					const srcElement = srcValue[i];
					const dstElement = dstValue[i];

                    // If the source element is a primitive, or if the destination element doesn't exist (undefined),
                    // then directly assign the source element. This handles primitives, new elements, and null/undefined.
					if (typeof srcElement !== 'object' || srcElement === null || dstElement === undefined) {
						dstValue[i] = srcElement;
					} else if (typeof dstElement === 'object' && dstElement !== null) {
                        // If both source and destination elements are objects (including arrays),
                        // recursively merge them.
                        // Note: This recursive call will apply the same array handling logic if srcElement and dstElement are both arrays.
                        // This could be an issue if we expect a different behavior for nested arrays within an array (e.g., an array of arrays).
                        // For configuration options like `fibBracketOrders`, this recursive merge on elements is usually fine as elements are typically objects.
						merge(dstValue[i], srcValue[i]);
					} else {
                        // If destination element is not an object (e.g., primitive) but source element is, overwrite.
                        // This case ensures that if an array element was previously primitive and now becomes an object, it's handled.
						dstValue[i] = srcValue[i];
					}
				}
			}
            // --- End Array Handling Enhancement ---

            // If the source value is not an object (i.e., primitive), or if the destination value is undefined,
            // then simply assign the source value to the destination. This handles direct assignments.
			else if (typeof srcValue !== 'object' || srcValue === null || dstValue === undefined) {
				dst[key] = srcValue;
            // eslint-disable-next-line @typescript-eslint/brace-style
			}
            // If both source and destination values are objects (and not null), then recursively merge them.
            // This is the standard behavior for merging nested configuration objects.
			else {
				merge(dstValue, srcValue);
			}
		}
	}
    // eslint-disable-next-line @typescript-eslint/tslint/config
    return dst;
}

export function isNumber(value: unknown): value is number {
	return (typeof value === 'number') && (isFinite(value));
}

export function isInteger(value: unknown): boolean {
	return (typeof value === 'number') && ((value % 1) === 0);
}

export function isString(value: unknown): value is string {
	return typeof value === 'string';
}

export function isBoolean(value: unknown): value is boolean {
	return typeof value === 'boolean';
}

export function clone<T>(object: T): T {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const o = object as any;
	if (!o || 'object' !== typeof o) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return o;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let c: any;

	if (Array.isArray(o)) {
		c = [];
	} else {
		c = {};
	}

	let p;
	let v;
	// eslint-disable-next-line no-restricted-syntax
	for (p in o) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,no-prototype-builtins
		if (o.hasOwnProperty(p)) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			v = o[p];
			if (v && 'object' === typeof v) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				c[p] = clone(v);
			} else {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				c[p] = v;
			}
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return c;
}

export function notNull<T>(t: T | null): t is T {
	return t !== null;
}

export function undefinedIfNull<T>(t: T | null): T | undefined {
	return (t === null) ? undefined : t;
}
