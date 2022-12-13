export class HitTestResult<T> {
	private _data: T | null;
	private _type: HitTestType;

	public constructor(type: HitTestType, data?: T) {
		this._type = type;
		this._data = data || null;
	}

	public type(): HitTestType {
		return this._type;
	}

	public data(): T | null {
		return this._data;
	}
}

export enum HitTestType {
    Regular = 1,
    MovePoint = 2,
	MovePointBackground = 3,
    ChangePoint = 4,
    Custom = 5
}
