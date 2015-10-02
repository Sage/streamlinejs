"use strict";
(function(exports) {
	exports.future = function(fn, args, i) {
		return require('streamline-runtime/lib/future')("", 0, null, fn, i).apply(this, args);
	};
})(typeof exports !== 'undefined' ? exports : (Streamline.future = Streamline.future || {}));

