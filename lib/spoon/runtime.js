// Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
"use strict";
(function(exports) {
	exports.future = require("streamline/lib/util/future").future;
})(typeof exports !== 'undefined' ? exports : (Streamline.runtime = Streamline.runtime || {}));
require("streamline/lib/spoon/builtins");