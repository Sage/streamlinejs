type StreamlineOptions = {
	filename: string;
	outputDir: string;
	sourceRoot: string;
};

type TransformResult = {
	code: string,
	ast?: any,
	map?: any, 
};