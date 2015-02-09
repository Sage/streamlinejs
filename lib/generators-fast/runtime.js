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
	else options = options || {};
	options.future = fut.promise;
	return unstar(fn, options, entering);
}

module.exports.then = module.exports.star(fut.then, 2);

module.exports.promise = function(fn, args, idx) {
	return fut.promise.call(this, module.exports.unstar(fn, idx), args, idx);
}

module.exports.unstarBound = function(that, name, idx, entering) {
	if (typeof that === 'function' && name === 'call') {
		return module.exports.unstar(that.call.bind(that), idx, entering);
	} else {
		var F = module.exports.unstar(that[name], idx, entering);
		return F.bind(that);
	}
}
