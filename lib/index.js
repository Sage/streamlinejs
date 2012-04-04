/// !doc
/// 
/// # streamline
///  
/// Streamline main API
///  
/// * `command.run()`  
///   runs `node-streamline` command line analyzer / dispatcher
exports.run = require("./compiler/command").run;
/// * `register.register(options)`  
///   Registers `require` handlers for streamline.  
///   `options` is a set of default options passed to the `transform` function.
exports.register = require("./compiler/register").register;
