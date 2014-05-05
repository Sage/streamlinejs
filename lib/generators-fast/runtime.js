module.exports = require("galaxy");
require('streamline/lib/globals').runtime = 'generators-fast';
require("streamline/lib/generators-fast/builtins");
var fut = require("streamline/lib/util/future");

var unstar = module.exports.unstar;

module.exports.unstar = function(fn, options, entering) {
	if (typeof options === "number") options = {
		callbackIndex: options
	};
	options.future = fut.promise;
	return unstar(fn, options, entering);
}
