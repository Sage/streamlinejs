// Note: do not set strict mode here because repl defines new variables

var vm = require('vm');


exports.eval = function(cmd, context, filename, callback) {
	try {
		var transform = require('streamline/lib/callbacks/transform').transform;
		var cmd = cmd.substring(1, cmd.length - 1);
		var isStatement = /^\s*(var|function|if|switch|for|while|do|try)\b/.test(cmd);
		cmd = isStatement ? (cmd  + ";__A=undefined;") : ("return __A=(" + cmd + ')');
		var decl = /^\s*(var|function)\s*(\w+)([\s\S]*)$/.exec(cmd);
		var vars = "";
		if (decl) {
			vars += "var " + decl[2] + ";";
			if (decl[1] === "function") cmd = decl[2] + "=function " + decl[2] + decl[3];
			else cmd = decl[2] + decl[3];
		}
		var source = vars + transform("(function(_) {" + cmd + "})(__callback);");
		//console.log(source);
		context.__filename = '<REPL>';
		// cannot assign context.__ directly in callback
		context.__data = context.__data || {};
		context.__ = context.__data.__;
		context.__callback = function(err, result) {
			if (!err) context.__data.__ = result;
			callback(err, result);
		};
		vm.runInContext(source, context);
	} catch (ex) {
		callback(ex);
	}
}
