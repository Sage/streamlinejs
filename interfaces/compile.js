type StreamlineOptions = {
	runtime: string;
	cache: boolean;
	quiet: boolean;
	filename?: string;
	outDir?: string;
	sourceRoot?: string;
	sourceMaps?: boolean;
	sourceMapTarget?: string;
	babel?: any;
	args?: string[];
};

type StreamlineApiOptions = any;

type BabelOptions = {
	plugins: any[];
	presets: string[];
	sourceMaps: boolean;
	filename?: string;
	sourceFileName?: string;
};

type TransformResult = {
	code: string,
	ast?: any,
	map?: any, 
};

declare module "module" {
	declare var prototype: any;
	declare function _nodeModulePaths(path: string) : string[];
	declare function _resolveFilename(name: string) : string;
	declare function _findPath(name: string, paths: string[]) : string;
};