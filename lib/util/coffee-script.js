// Helper file to require CoffeeScript relative to the calling working dir.

var Module = require("module");
var paths = Module._nodeModulePaths(process.cwd());
var cspath = Module._findPath('coffee-script', paths);

if (cspath) module.exports = require(cspath);
else throw new Error("Failed to find CoffeeScript from " +  process.cwd());
