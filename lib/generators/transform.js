var fibersTransform = require('streamline/lib/fibers/transform').transform;

(function(exports) {
exports.version = "0.4.6 (generators)";

exports.transform = function(source, options) {
	options = options || {};
	options.generators = true;
	return fibersTransform(source, options);
}
	// hack to fix #123
	exports.transform.version = exports.version;
})(typeof exports !== 'undefined' ? exports : (window.Streamline = window.Streamline || {}));
