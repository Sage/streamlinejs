/// !doc
/// 
/// # streamline/lib/globals
/// 
/// The `streamline.lib.globals` is a container for the global `context` object which is maintained across
/// asynchronous calls.
/// 
/// This context is very handy to store information that all calls should be able to access
/// but that you don't want to pass explicitly via function parameters. The most obvious example is
/// the `locale` that each request may set differently and that your low level libraries should
/// be able to retrieve to format messages.
/// 
/// * `globals.context = ctx`
/// * `ctx = globals.context`  
///   sets and gets the context
// This declaration is not stricly necessary. But better be explicit
exports.context = undefined;

// Note: this module may also look like overkill but it makes it easy to share the context in
// programs that mix modules compiled in callback and fibers modes.