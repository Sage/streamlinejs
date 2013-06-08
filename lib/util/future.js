/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
(function(exports) {
	var globals = require("streamline/lib/globals");

	// unfortunately callee is gone. So we need to pass a function
	exports.future = function(fn, args, i) {
		var err, result, done, q = [];
		args = Array.prototype.slice.call(args);

		function notify(e, r) {
			err = e, result = r, done = true;
			q && q.forEach(function(f) {
				if (f.timeout) {
					clearTimeout(f.timeout);
					delete f.timeout;
				}
				var ignore = f.ignore;
				f.ignore = true;
				if (!ignore) f(e, r);
			});
			q = null;
		};
		args[i] = notify;
		future.prev = globals.future;
		globals.future = future;
		try {
			fn.apply(this, args);
		} finally {
			globals.future = future.prev;
		}

		function future(cb, timeout) {
			if (!cb) return future;
			if (future.cancelled) return cb(new Error("future cancelled"));
			if (done) return cb(err, result);

			if (typeof timeout === 'number') {
				timeout = { timeout: timeout };
			}
			var ncb = cb;
			if (timeout != null) {
				// wrap cb so that each one gets its own timeout var
				ncb = function(e, r) {
					cb(e, r);
				}
				ncb.timeout = setTimeout(function() {
					if (ncb.timeout) {
						clearTimeout(ncb.timeout);
						delete ncb.timeout;
						var nfy = cb, v;
						if (timeout.probe) {
							ncb.ignore = true;
						} else {
							future.cancelled = true;
							nfy = notify;
						}
						if ("return" in timeout) {
							v = timeout.return;
							nfy(null, typeof v === 'function' ? v() : v);
						} else {
							v = timeout.throw || "timeout";
							nfy(typeof v === 'function' ? v() : typeof v === 'string' ? new Error(v) : v);
						}
					}
				}, timeout.timeout);
			}
			q.push(ncb);
		}
		return future;
	}
})(typeof exports !== 'undefined' ? exports : (Streamline.future = Streamline.future || {}));

