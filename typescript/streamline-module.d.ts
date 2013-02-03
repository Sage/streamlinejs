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

interface Array {
	forEach_(_: async, fn: (_: async, elt: _element, i: number) => any) : void;	
	forEach_(_: async, par: number, fn: (_: async, elt: _element, i: number) => any) : void;	
	map_(_: async, fn: (_: async, elt: _element, i: number) => void) : any[];	
	filter_(_: async, fn: (_: async, _element: any, i: number) => bool) : _element[];	
	every_(_: async, fn: (_: async, val: _element, elt: any, i: number) => bool) : bool;	
	some_(_: async, fn: (_: async, val: _element, elt: any, i: number) => bool) : bool;	
	reduce_(_: async, fn: (_: async, val: _element, elt: any, i: number) => any, start: any) : any;	
	reduceRight_(_: async, fn: (_: async, val: _element, elt: any, i: number) => any, start: any) : any;	
	sort_(_: async, compare: (_: async, v1: _element, v2: _element) => number, beg: number, end: number) : _element[];	
}

// TODO: apply_

declare module "streamline/lib/util/flows" {
	export function funnel(max: number) : (_: async, body: (_: async) => any) => any;
	export function collect(_: async, futs: future[]) : any[];  
	export function nextTick(_: async) : void; 
}

declare module "streamline/lib/streams/server/streams" {
	interface Wrapper {
		emitter: any;
		closed: bool;
		unwrap() : any;
	}
	export interface ReadableStream extends Wrapper {
		// new - see later
		setEncoding(enc: string) : any; // this
		read(_: async, len?: number) : any;
		readAll(_: async) : any;
		unread(chunk: any) : any; // this
	}
	export interface WritableStream extends Wrapper {
		// new - see later
		write(_: async, data: string, enc: string) : any; // this
		write(_: async, data: any) : any; // this
		end() : any; // this
	}
	export interface HttpServerRequest extends ReadableStream {
		method: string;
		url: string;
		headers: any;
		trailers: any;
		httpVersion: string;
		connection: any;
		socket: any;
	}
	export interface HttpServerResponse extends WritableStream {
		writeContinue() : HttpServerResponse;
		writeHead(status: number, head: any) : HttpServerResponse; 
		setHeader(name: string, value: string) : HttpServerResponse;
		getHeader(head: string) : string;
		removeHeader(name: string) : HttpServerResponse;
		addTrailers(trailers: any) : HttpServerResponse;
		statusCode: number;
	}
	export interface HttpServer extends Wrapper {
		listen(_: async, port: number, host?: string);
		listen(_: async, path: string);
	}
	export function createHttpServer(listener: (req: HttpServerRequest, resp: HttpServerResponse, _: async) => void, options?: any) : HttpServer;

	export interface HttpClientRequest extends WritableStream {
		response(_: async) : HttpClientResponse;
		abort() : void;
	}
	export interface HttpClientResponse extends ReadableStream {
		statusCode: number;
		httpVersion: string;
		headers: any;
		trailers: any;
		checkStatus(status: number) : HttpClientResponse;
	}
	export function httpRequest(options?: any) : HttpClientRequest;
}
