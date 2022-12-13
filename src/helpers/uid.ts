const source = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function guid(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (e: string) => {
		const t = 16 * Math.random() | 0;
		return ('x' === e ? t : 3 & t | 8).toString(16);
	});
}

export function randomHash(): string {
	return randomHashN(12);
}

export function randomHashN(count: number): string {
	let hash = '';
	for (let i = 0; i < count; ++i) {
		const index = Math.floor(Math.random() * source.length);
		hash += source[index];
	}
	return hash;
}
