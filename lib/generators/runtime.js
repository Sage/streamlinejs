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
	};
	else options = options || {};
	options.promise = options.callbackDefault ? function(fn, args, i) {
		return fut.future.call(this, fn, args, i)(options.callbackDefault());
	} : fut.promise;
	return unstar(fn, options, entering);
}

module.exports.then = module.exports.star(fut.then, 2);
