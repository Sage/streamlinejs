var fibersTransform = require('streamline/lib/fibers/transform').transform;

(function(exports) {
exports.version = "0.4.3 (generators)";

exports.transform = function(source, options) {
	options = options || {};
	options.generators = true;
	return fibersTransform(source, options);
}
})(typeof exports !== 'undefined' ? exports : (window.Streamline = window.Streamline || {}));
