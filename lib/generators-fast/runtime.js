module.exports = require("galaxy");
var globals = module.exports.globals = require('../globals');
module.exports.globals.runtime = 'generators-fast';
require("../generators-fast/builtins");
var fut = require("../util/future");

var unstar = module.exports.unstar;

module.exports.unstar = function(fn, options, entering) {
	if (typeof options === "number") options = {
		callbackIndex: options
	};
	options.future = fut.promise;
	return unstar(fn, options, entering);
}

module.exports.then = module.exports.star(fut.then, 2);

module.exports.promise = function(fn, args, idx) {
	return fut.promise.call(this, module.exports.unstar(fn, idx), args, idx);
}
