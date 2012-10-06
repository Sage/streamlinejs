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
	forEach_(_: async, fn: (_: async, elt: _element, i: number) => any) : void;	
	map_(_: async, fn: (_: async, elt: _element, i: number) => void) : any[];	
	filter_(_: async, fn: (_: async, _element: any, i: number) => bool) : _element[];	
	every_(_: async, fn: (_: async, val: _element, elt: any, i: number) => bool) : bool;	
	some_(_: async, fn: (_: async, val: _element, elt: any, i: number) => bool) : bool;	
	reduce_(_: async, fn: (_: async, val: _element, elt: any, i: number) => any, start: any) : any;	
	reduceRight_(_: async, fn: (_: async, val: _element, elt: any, i: number) => any, start: any) : any;	
	sort_(_: async, compare: (_: async, v1: _element, v2: _element) => number, beg: number, end: number) : _element[];	
}

// TODO: apply_

declare function array_(a: any[]) : Array_;

declare module "streamline/lib/util/flows" {
	export function funnel(max: number) : (_: async, body: (_: async) => any) => any;
	export function collect(_: async, futs: future[]) : any[];  
	export function nextTick(_: async) : void; 
}