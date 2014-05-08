module.exports = require('galaxy');
var globals = module.exports.globals = require('../globals');
module.exports.globals.runtime = 'generators';
require("../generators/builtins");
var fut = require("../util/future");
module.exports.streamlinify = fut.streamlinify;

var unstar = module.exports.unstar;

module.exports.unstar = function(fn, options, entering) {
	if (typeof options === "number") options = {
		callbackIndex: options,
		promise: fut.promise,
	};
	options.future = fut.promise;
	return unstar(fn, options, entering);
}

module.exports.then = module.exports.star(fut.then, 2);
