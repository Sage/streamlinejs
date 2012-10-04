// Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
"use strict";

exports.transform = transform;
exports.version = "0.4.5 (spoon)";
// hack to fix #123
exports.transform.version = exports.version;

var THIS = ["name", "this"],
	ARGUMENTS = ["name", "arguments"],
	__$CALLBACK = ["name", "__$callback"],
	__$RT = ["name", "__$rt"];

function deeper(node, fn) {
	Object.keys(node).forEach(function(key) {
		var n = node[key];
		if (n && typeof n === 'object') fn(n);
	});
}

function transform(source, options) {
	var spoon = require("spoon"),
		esprima = require("esprima"),
		uglify = require("uglify-js");

	var async = true;

	function isMarker(node) {
		return node.type === 'Identifier' && node.name === '_';
	}

	function isCoffeeClosure(node) {
		return node.type === 'FunctionExpression' //
		&& node.id === null //
		&& node.params.length === 0
	}

	function preProcess(node) {
		if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
			var oldAsync = async;
			async = node.params.some(isMarker);
			deeper(node, preProcess);
			async = oldAsync;
			return;
		} else if (node.type === 'CallExpression') {
			if (node.arguments.some(isMarker)) {
				if (!async) throw new Error("async call in invalid context");
			} else if (node.arguments.length === 0) {
				// take care of CoffeeScript wrappers:
				// 		(function() { ... })() 
				if (isCoffeeClosure(node.callee)) {
					node.callee.params = [{
						type: 'Identifier',
						name: '_'
					}];
					node.arguments = [{
						type: 'Identifier',
						name: '_'
					}];
					return preProcess(node);
				}
			} else if (node.arguments.length === 1) {
				// take care of (function() { ... }).call(this);
				if (node.callee.type === 'MemberExpression' //
				&& isCoffeeClosure(node.callee.object) //
				&& node.callee.property.name === 'call' //
				&& node.arguments[0].type === 'ThisExpression') {
					node.callee.object.params = [{
						type: 'Identifier',
						name: '_'
					}];
					node.arguments.push({
						type: 'Identifier',
						name: '_'
					});
				}
			} else if (node.arguments.length === 2) {
				// take care of (function() { ... }).apply(this, arguments);
				if (node.callee.type === 'MemberExpression' //
				&& isCoffeeClosure(node.callee.object) //
				&& node.callee.property.name === 'apply' //
				&& node.arguments[0].type === 'ThisExpression' //
				&& node.arguments[1].name === 'arguments') {
					throw new Error("NIY"); // needs more work
					node.callee.object.params = [{
						type: 'Identifier',
						name: '_'
					}];
					node.arguments.push({
						type: 'Identifier',
						name: '_'
					});
				}
			}
		}
		deeper(node, preProcess);
	}

	var anonId = 0;

	function postProcess(node) {
		if ((node[0] === 'defun' || node[0] === 'function') && (!node[1] || node[1].substring(0, 3) !== '__$')) {
			var marker = node[2].indexOf('__$callback');
			if (marker >= 0) {
				if (!node[1]) node[1] = "__$anon" + ++anonId;
				var name = node[1];
				node[3].unshift(["if", ["unary-prefix", "!", __$CALLBACK], //
				["block", [
					["return", ["call", ["dot", ["dot", __$RT, "future"], "call"],
						[THIS, ["name", name], ARGUMENTS, ["num", marker]]
					]]
				]]]);
			}
		}
		deeper(node, postProcess);
	}

	var ast = esprima.parse(source);
	preProcess(ast);

	var cfg = spoon.construct(ast);
	//console.log("CFG=" + cfg);
	cfg.asyncify([], {
		marker: '_'
	});

	var out = spoon.render(cfg);

	postProcess(out);

	var code = uglify.uglify.gen_code(out, {
		beautify: true
	});
	return "var __$rt = require('streamline/lib/spoon/runtime');\n" //
	+ "(function(__$callback) {\n" + code + "\n})(function(__$e) { if (__$e) console.log(__$e); });";
}