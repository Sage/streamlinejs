/// !doc
/// 
/// # Main API
///  
/// `var streamline = require('streamline');`
/// 
/// * `streamline.register(options)`  
///   Registers `require` handlers for streamline.  
///   `options` is a set of default options passed to the transformation.
exports.register = require("./register").register;

/// * `streamline.run()`  
///   runs `_node` command line analyzer / dispatcher
exports.run = require("./command").run;

/// * `{ code, map } = streamline.transform(source, options)`  
///   Transforms a source script.  
///   `options` is a set of options passed to the transformation engine.
exports.transform = require('./transformSync').transform;

/// * `{ code, map } = streamline.transformFileSync(path, options)`  
///   Transforms a source file synchronously.  
///   `options` is a set of options passed to the transformation engine.
exports.transformFileSync = require('./transformSync').transformFileSync;

// following ones are lazy loaded because streamline must be loaded to compile them (chichen and egg problem)

/// * `{ code, map } = streamline.transformFile(_, path, options)`  
///   Transforms a source file.  
///   `options` is a set of options passed to the transformation engine.
Object.defineProperty(exports, 'transformFile', {
	get: function() {
		return require('./transform').transformFile;
	}
});
/// * `streamline.compile(_, paths, options)`  
///   Compiles streamline source files in `paths`.  
///   `paths` may be a list of files or a list of directories which will be traversed recursively.  
///   `options`  is a set of options for the `transform` operation.
Object.defineProperty(exports, 'compile', {
	get: function() {
		return require('./compile').compile;
	}
});
