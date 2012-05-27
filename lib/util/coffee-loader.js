// Helper file to require CoffeeScript relative to the either the caller's
// working directory or the calling module's directory.

var Module = require("module");

exports.load = function(fromDir) {
	if (!fromDir) fromDir = process.cwd();

	var paths = Module._nodeModulePaths(fromDir);
	var cspath = Module._findPath('coffee-script', paths);

	if (cspath) return require(cspath);
	else throw new Error("Failed to find CoffeeScript from " +  fromDir);
};
