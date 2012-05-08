var fibersTransform = require('streamline/lib/fibers/transform').transform;

(function(exports) {
exports.version = "generators 0.1.0";

exports.transform = function(source, options) {
	options = options || {};
	options.generators = true;
	return fibersTransform(source, options);
}
})(typeof exports !== 'undefined' ? exports : (window.Streamline = window.Streamline || {}));
