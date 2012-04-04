/// !doc
/// 
/// # Main API
///  
/// `var streamline = require('streamline');`
/// 
/// * `streamline.run()`  
///   runs `_node` command line analyzer / dispatcher
exports.run = require("./lib/compiler/command").run;
/// * `streamline.register(options)`  
///   Registers `require` handlers for streamline.  
///   `options` is a set of default options passed to the transformation.
exports.register = require("./lib/compiler/register").register;
