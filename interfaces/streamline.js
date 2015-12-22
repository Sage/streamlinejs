type _<T> = (err : ?Error, result : T) => void;
type future<R> = (_: _<R>) => void;

declare module "streamline-flow" {
	declare type Arr<T> = {
		forEach_: (_: _<void>, fn: (_: _<void>, item: T, i: number) => void) => void;
	};
	declare function await<R>(fn: (_: _<R>) => void) : R;
	declare function future_0_0<R>(fn: (_: _<R>) => void) : () => future<R>;
	declare function future_0_1<R, T1>(fn: (_: _<R>, v1: T1) => void) : (v1: T1) => future<R>;
	declare function future_0_2<R, T1, T2>(fn: (_: _<R>, v1: T1, v2: T2) => void) : (v1: T1, v2: T2) => future<R>;
	declare function future_0_3<R, T1, T2, T3>(fn: (_: _<R>, v1: T1, v2: T2, v3: T3) => void) : (v1: T1, v2: T2, v3: T3) => future<R>;
	declare function future_0_4<R, T1, T2, T3, T4>(fn: (_: _<R>, v1: T1, v2: T2, v3: T3, v4: T4) => void) : (v1: T1, v2: T2, v3: T3, v4: T4) => future<R>;
	declare function future_1_1<R, T1>(fn: (v1: T1, _ : _<R>) => void) : (v1: T1) => future<R>;
	declare function future_2_2<R, T1, T2>(fn: (v1: T1, v2: T2, _ : _<R>) => void) : (v1: T1, v2: T2) => future<R>;
	declare function future_3_3<R, T1, T2, T3>(fn: (v1: T1, v2: T2, v3: T3, _ : _<R>) => void) : (v1: T1, v2: T2, v3: T3) => future<R>;

	declare function array<T>(arr: Array<T>) : Arr<T>;
}
