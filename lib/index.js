/// !doc
/// 
/// # streamline
///  
/// Streamline main API
///  
/// * `compile.compile(_, paths, options)`  
///   Compiles streamline source files in `paths`.  
///   See streamline/lib/compiler/compile doc.  
exports.compile = require("./compiler/compile").compile
/// * `command.run()`  
///   runs `node-streamline` command line analyzer / dispatcher
exports.run = require("./compiler/command").run;
/// * `register.register(options)`  
///   Registers `require` handlers for streamline.  
///   `options` is a set of default options passed to the `transform` function.
exports.register = require("./compiler/register").register;
