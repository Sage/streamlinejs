var fibers = require('../fibers/transform');

exports.version = "generators 0.1.0";

exports.transform = function(source, options) {
	options = options || {};
	options.generators = true;
	return fibers.transform(source, options);
}