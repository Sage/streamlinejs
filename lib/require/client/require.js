/// !doc
/// 
/// # streamline/lib/require/client/require
///  
/// Client-side require script
/// 
(function(exports, global) {
	var _modules = {};
	var _sources = {};
	var _known = [];

	var _evaluate = eval("(function() {})") != null ? (function(str) {
		return eval(str);
	}) : function(str) {
			return new Function("return " + str)();
		};

	function _combine(path, rel) {
		var cut = path.lastIndexOf('/');
		if (cut < 0) throw new Error("too many parent dirs" + rel);
		path = path.substring(0, cut);
		while (rel.indexOf('./.') == 0) // get rid of leading ./. and ./..
		rel = rel.substring(2);
		if (rel.indexOf('../') == 0) return _combine(path, rel.substring(1));
		if (rel.indexOf('./') != 0) return rel;
		return path + rel.substring(1);
	}


	// deprecated. remove later


	function _print(str) {
		console.log(str);
	};

	function _load(key, arg, callback) {
		var url;
		if (key === "sources") {
			if (_sources[arg]) return callback();
			url = "/require?module=" + encodeURIComponent(arg) + "&known=" + _known.join(",");
		} else {
			url = "/require?localize=" + arg  + "&known=" + _known.join(",");
		}
		//console.log("require: loading " + arg)
		$.ajax({
			type: "GET",
			url: url,
			dataType: "text",
			data: null,
			success: function(data, statusText, xhr) {
				var contentType = xhr.getResponseHeader("Content-Type");
				var boundary = /.*boundary="([^"]*)".*/.exec(contentType);
				if (!boundary || !boundary[1]) return callback(new Error("no boundary"));
				var parts = data.split("\n--" + boundary[1]);
				if (!parts || parts.length < 1 || parts[parts.length - 1].indexOf("--") != 0) return callback(new Error("end marker missing"));
				for (var i = 1; i < parts.length - 1; i++) {
					var part = parts[i];
					var sep = part.indexOf('\n\n');
					if (sep < 0) return callback(new Error("empty line missing"));
					var headers = {};
					var lines = part.substring(0, sep).split('\n');
					for (var j = 0; j < lines.length; j++) {
						var line = lines[j];
						var pair = line.split(': ');
						headers[pair[0]] = pair[1];
					}
					var body = part.substring(sep + 2);
					var id = headers["Content-ID"];
					if (id == "ERROR") return callback(new Error(body));
					var location = headers["Content-Location"];
					if (!location) return callback(new Error("content location missing"));
					//console.log("require: got source " + location + ": " + body.length + " bytes");
					if (key === "sources") _sources[location] = body;
					else _modules[location].__resources = JSON.parse(body);
				}
				if (key === "sources") _known.push(arg);
				return callback();
			},
			error: function(xhr, message, ex) {
				return callback(new Error(message));
			}
		});
	}

	function _sandbox(path, isMain) {
		if (_modules[path]) return _modules[path].exports;

		try {
			//console.log("require: creating sandbox " + path);
			// for now assume that directories resolve to main or index
			var source = _sources[path];
			if (source == null && (source = _sources[path + "/main"])) path = path + "/main";
			if (source == null && (source = _sources[path + "/index"])) path = path + "/index";
			if (source == null) throw new Error("source missing: " + path + " keys=" + Object.keys(_sources));

			// do not add newline (to get correct line numbers)
			source = "(function(require, exports, module, system, print, __filename) {" + source + "})";
			source = source + '\n//@ sourceURL=' + path + '\n';
			var factory = _evaluate(source);
			//delete _sources[path]; -- we need it for circular references
			// prepare parameters for source wrapper
			
			var module = _modules[path] = {
				/// * `id = module.id`  
				///   the `id` of the current module.
				id: path,
				exports: {},
				toString: function() {
					return this.id;
				}
			};
			/// * `module = require(id)`  
			///   _requires_ a module synchronously.  
			///   `id` _must_ be a string literal.
			var require = function(id) {
					return _sandbox(_combine(path, id));
				};
			/// * `module = require.async(id, _)`  
			///   _requires_ a module asynchronously.  
			///   `id` may be a variable or an expression.
			require.async = function(id, callback) {
				var p = _combine(path, id);
				if (_modules[p]) {
					setTimeout(function() {
						callback(null, _modules[p].exports);
					}, 0)
				} else {
					_load("sources", p, function(err) {
						if (err) return callback(err);
						try {
							_sandbox(p);
							return callback(null, _modules[p].exports);
						} catch (ex) {
							return callback(ex);
						}
					});
				}
			}

			/// * `require.localize(locale, _)`  
			///   updates localized resources on all modules
			require.localize = function(locale, cb) {
				_load("resources", locale, cb);
			}

			/// * `main = require.main`  
			///   return the main module
			require.main = isMain ? module : null;
			factory.call({}, require, module.exports, module, null, _print, path);
			return module.exports;
		} catch (ex) {
			throw new Error("module initialization failed: " + path + ": " + (ex.message || ex));
		}
	}

	// setup require.main and export it.
	var _require = function(id) {
			console.error("require not allowed in this context. Use require.main");
		}

		/// * `require.main(id)`  
		///   loads main module from HTML page.
		_require.main = function(path) {
			_load("sources", path, function() {
				_sandbox(path, true);
			});
		}

	exports.require = _require;
	(global.__streamline = global.__streamline || {}).ffOffset = 12;
})(this, this);