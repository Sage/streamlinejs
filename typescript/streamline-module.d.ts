// type for _ parameters
interface async {
	(e: Error,
	r ? : any);
};

// wrapper to keep typescript happy with futures
declare function future(f: any) : (_: async) => any;

// fake call to trigger streamline source transform
declare function streamline() : void;
