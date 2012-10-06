// type for _ parameters
interface async {
	(e: Error,
	r ? : any);
};

interface future {
	(_: async);
}
// wrapper to keep typescript happy with futures
declare function future_(f: any) : future;

// fake call to trigger streamline source transform
declare function streamline() : void;

interface Array_ {
	reduce_(_: async, fn: (_: async, val: any, elt: any) => any, start: any) : any;	
}

declare function array_(a: any[]) : Array_;

declare module "streamline/lib/util/flows" {
	export function funnel(max: number) : (_: async, body: (_: async) => any) => any;
	export function collect(_: async, futs: future[]) : any[];  
	export function nextTick(_: async) : void; 
}