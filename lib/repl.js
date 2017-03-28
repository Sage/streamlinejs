"use strict";
var vm = require('vm');
var babel = require('babel-core');
var util = require('./util');

exports.run = function(prog, options) {
	function evaluate(cmd, context, filename, callback) {
		// HACK: prevent empty commands (just newlines) from throwing errors
		// during transformation. the command itself is wrapped in parens.
		if (cmd === '(\n)' || /^\s*$/.test(cmd)) {
			callback(null);		// explicitly returning undefined, like node
			return;
		}

		try {
			//cmd = cmd.substring(1, cmd.length - 1);
			if (prog === "_coffee") {
				cmd = require('coffee-script').compile(cmd, {
					filename: filename,
					bare: true
				}).replace(/\n/g, '').replace(/;$/, '');
			}
			var isStatement = /^\s*(var|function|if|switch|for|while|do|try)\b/.test(cmd);
			cmd = isStatement ? cmd : ("return (" + cmd + ')');
			var decl = /^\s*(var|function)\s*(\w+)([\s\S]*)$/.exec(cmd);
			var vars = "";
			if (decl) {
				vars += "var " + decl[2] + ";";
				if (decl[1] === "function") cmd = decl[2] + "=function " + decl[2] + decl[3];
				else cmd = decl[2] + decl[3];
			}
			var babelOptions = util.babelOptions(options);
			var source = vars + babel.transform("(function(_) {" + cmd + "})(__callback);", babelOptions).code;
			
			context.__filename = filename;
			// cannot assign context.__ directly in callback - need to investigate why
			context.__private = context.__private || {};
			context.__ = context.__private.__;
			context.__callback = function(err, result) {
				if (!err) context.__private.__ = result;
				callback(err, result);
			};
			context.require = require;
			vm.runInContext(source, context, filename);
			
		} catch (ex) {
			callback(ex);
		}
	}

	require('repl').start({
		prompt: prog + "> ",
		eval: evaluate,
	});
};