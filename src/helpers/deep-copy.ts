export function deepCopy<T>(value: T): T {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let copy: any;
	if (
		typeof value != 'object' ||
		value === null ||
		typeof (value as Record<string, unknown>).nodeType == 'number'
	) {
		copy = value;
	} else if (value instanceof Date) {
		copy = new Date(value.valueOf());
	} else if (Array.isArray(value)) {
		copy = [];

		for (let i = 0; i < value.length; i++) {
			if (Object.prototype.hasOwnProperty.call(value, i)) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				copy[i] = deepCopy(value[i]);
			}
		}
	} else {
		copy = {};

		Object.keys(value).forEach((key: string) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			copy[key] = deepCopy((value as Record<string, unknown>)[key]);
		});
	}

	return copy as T;
}
