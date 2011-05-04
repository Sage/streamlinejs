/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
if (typeof exports !== 'undefined') {
	var Narcissus = require('../deps/narcissus');
	var format = require('./format').format;
} else {
	var format = Streamline.format;
}
(function(exports) {
	//"use strict";
	var parse = Narcissus.parser.parse;
	var pp = Narcissus.decompiler.pp;
	var definitions = Narcissus.definitions;

	eval(definitions.consts.replace(/const /g, "var "));

	function _tag(node) {
		if (!node || !node.type)
			return "*NOT_A_NODE*";
		var t = definitions.tokens[node.type];
		return /^\W/.test(t) ? definitions.opTypeNames[t] : t.toUpperCase();
	}

	/*
 	* Utility functions
 	*/
	function _node(type, children) {
		return {
			type: type,
			children: children
		};
	}

	function _identifier(name) {
		return {
			type: IDENTIFIER,
			name: name,
			value: name,
		};
	}

	function _return(node) {
		return {
			type: RETURN,
			_scope: node._scope,
			value: node
		};
	}

	// cosmetic stuff: template logic generates nested blocks. Flatten them.
	function _flatten(node) {
		if (node.type == BLOCK || node.type == SCRIPT) {
			do {
				var found = false;
				var children = [];
				node.children.forEach( function(child) {
					if (child._isFunctionReference || (child.type == SEMICOLON && (child.expression == null || child.expression._isFunction)))
						return; // eliminate empty statement and dummy function node;
					if (child.type == BLOCK || child.type == SCRIPT) {
						children = children.concat(child.children);
						found = true;
					} else
						children.push(child);
				})
				node.children = children;
			} while (found);
		}
		return node;
	}

	// generic helper to traverse parse tree
	// if doAll is true, fn is called on every property, otherwise only on sub-nodes
	// if clone object is passed, values returned by fn are assigned to clone properties
	function _propagate(node, fn, doAll, clone) {
		var result = clone ? clone : node;
		for (var prop in node) {
			// funDecls and expDecls are aliases to children
			// target property creates loop (see Node.prototype.toString)
			if (node.hasOwnProperty(prop) && prop.indexOf("Decls") < 0 && (doAll || prop != 'target')) {
				var child = node[prop];
				if (child != null) {
					if (typeof child.forEach == "function") {
						if (clone)
							result[prop] = (child = [].concat(child));
						for (var i = 0; i < child.length; i++) {
							if (doAll || (child[i] && child[i].type))
								child[i] = fn(child[i]);

						}
					} else {
						if (doAll || (child && child.type))
							result[prop] = fn(child);

					}
				}
			}
		}
		return result;
	}

	// clones the tree rooted at node.
	function _clone(node) {
		var lastId = 0;
		var clones = {}; // target property creates cycles
		function cloneOne(child) {
			if (!child || !child.type)
				return child;
			var cloneId = child._cloneId;
			if (!cloneId)
				cloneId = (child._cloneId = ++lastId);
			var clone = clones[cloneId];
			if (clone)
				return clone;
			clones[cloneId] = (clone = {
					_cloneId: cloneId
				});
			return _propagate(child, cloneOne, true, clone);
		}

		return _propagate(node, cloneOne, true, {});
	}

	/*
 	* Utility class to generate parse trees from code templates
 	*/
	function Template(fn, isExpression) {
		// parser the function and set the root
		var _root = parse(fn.toString()).children[0].body;
		if (_root.children.length == 1)
			_root = _root.children[0];
		else
			_root = _node(BLOCK, _root.children);

		// if template is an expression rather than a full statement, go one more step down
		if (isExpression)
			_root = _root.expression;

		// generates a parse tree from a template by substituting bindings.
		// restructuring arg is set to true during restructuring pass to that we propage flags to result.
		this.generate = function(scope, restructuring, bindings) {
			bindings = bindings || {};
			// tail will hold the tail block if we find one.
			var tail;

			function gen(node) {
				if (!node || !node.type) {
					if (node == "_")
						return scope.options.callback;
					// not a parse node - replace if it is a name that matches a binding
					return typeof node == "string" && typeof bindings[node] != "undefined" ? bindings[node] : node;
				}
				node._scope = scope;
				// if node is a block that ends with tail; remove the tail placeholder and
				// record block as tail (only happens during restructure pass).
				var len;
				if (node.children && (len = node.children.length) > 0 && node.children[len - 1].expression &&
				node.children[len - 1].expression.value == "tail") {
					tail = node;
					node.children.splice(len - 1, 1);
					node._restructured = true;
					return node;
				}
				// if node is ident; statement (SEMICOLON) or ident expression, try to match with binding
				var ident = node.type == SEMICOLON ? node.expression : node;
				if (ident && ident.type == IDENTIFIER && bindings[ident.value]) {
					var result = bindings[ident.value];
					// transfer initializer if there is one
					if (ident.initializer)
						result.initializer = gen(ident.initializer);
					return result;
				} else {
					// recurse through sub nodes
					_propagate(node, function(child) {
						child = gen(child);
						// propagate async flag like analyze phase
						if (child && child._async)
							node._async = true;

						// restructure child if it holds _head
						// takes care of async condition in test or loop
						if (restructuring && child && child._head)
							node = _combineExpression(node, child);
						return child;
					}, true);
					// flatten when bindings to blocks are inserted in blocks
					_flatten(node);
					if (restructuring) {
						node._restructured = true;
						// mark return statements as done so that we don't transform them again in the finish pass.
						node._done = node.type == RETURN;
					}
					return node;
				}
			}

			// generate
			var result = gen(_clone(_root));
			// set the tail if we found one somewhere in the template
			result._tail = tail || bindings.tail;
			if (result._tail && result._tail.type == BLOCK)
				result._tail.type = SCRIPT; // to force proper finish
			//console.log("GENERATED: " + pp(result));
			return result;
		}
		this.root = _root; // for simplify pass
	}

	/*
 	* Utility to generate names of intermediate variables
 	*/
	function Scope(options) {
		var last = 0;
		this.next = function() {
			return ++last;
		}
		this.identifiers = {};
		this.functions = [];
		this.options = options;
	}

	function _genId(node) {
		return "__" + node._scope.next();
	}

	/*
 	* Mark source nodes so we can map line numbers
 	*/
	function _markSource(node) {
		function _markOne(node) {
			node._isSourceNode = true;
			_propagate(node, function(child) {
				_markOne(child);
				return child;
			});
		}

		_markOne(node);
	}

	/*
 	* First pass: analyze the parse tree to mark the async branches and
 	* set up the info that we need to generate the __N variables
 	*
 	* Calls to async functions and all their parents up to enclosing SCRIPT are marked
 	* with _async = true.
 	*
 	* Every node receives a scope to generate names of extra variables.
 	* This scope is the same for all the nodes of a given SCRIPT but different SCRIPTs
 	* (different functions) get different scopes.
 	*/
	function _analyze(node, options) {
		function _analyzeOne(node, scope) {
			//console.log("ANALYZING: " + _tag(node));
			if (node.type == SCRIPT)
				scope = new Scope(options);
			node._scope = scope;
			var vars = [];
			_propagate(node, function(child) {
				_analyzeVars(scope, vars, child);
				_analyzeOne(child, scope);
				if (child._async && child.type != FUNCTION)
					node._async = true;
				return child;
			});
			_closeVars(scope, vars);
			var handler = _handlers[_tag(node)];
			handler && handler.check && handler.check(node);

			if (node.type == SCRIPT)
				scope.async = node._async;
			if (node.type == IDENTIFIER && node.value == options.callback)
				node._async = true;
			if (node.type == THIS)
				scope.hasThis = true;
			if (node.type == FUNCTION) {
				node.body._scope.cbIndex = node.params.reduce( function(index, param, i) {
					if (param != options.callback)
						return index;
					if (index < 0)
						return i;
					else
						throw new Error("duplicate _ parameter");
				}, -1);
				// assign names to anonymous functions (for futures)
				if (!node.name)
					node.name = _genId(node);
				node.body._scope.name = node.name;
				var async = node.body._scope.cbIndex >= 0;
				if (node._async && !async)
					throw new Error(node.filename + ": Function contains async calls but does not have _ parameter: " + node.name + " at line " + node.lineno);
				if (!node._async && async)
					node.body._async = true; // force script restructuring if empty body
				node._async = async;
			}
		}

		_analyzeOne(node, new Scope(options));
	}

	/*
 	* Analyze variables
 	*
 	* Variables that end up in "closed" state
 	* are correctly scoped and won't be moved.
 	* Otherwise, they end up in "out" state and need to be moved
 	* to beginning of script (only if script is async).
 	*/
	function _analyzeVars(scope, vars, node) {
		if (node._skipVar)
			return;
		var idents = scope.identifiers;
		switch (node.type) {
			case DOT:
				node.children[1]._skipVar = true;
				break;
			case IDENTIFIER:
				var mark = idents[node.value];
				if (mark !== "open") {
					idents[node.value] = (!mark || mark == "ident") ? "ident" : "out";
				}
				break;
			case VAR:
				node.children.forEach( function(ch) {
					idents[ch.value] = idents[ch.value] ? "out" : "open";
					vars.push(ch.value);
				});
				break;
			case FOR_IN:
				// hack to get var declaration processed first
				if (node.varDecl) {
					_analyzeVars(scope, vars, node.varDecl);
					node.varDecl._skipVar = true;
				}
				break;
			case FUNCTION:
				if (node.name) {
					idents[node.name] = idents[node.name] ? "out" : "open";
					vars.push(node.name);
					scope.functions.push(node)
				}
				break;
		}
	}

	function _closeVars(scope, vars) {
		var idents = scope.identifiers;
		vars.forEach( function(name) {
			if (idents[name] === "open")
				idents[name] = "closed";
		})
	}

	/*
 	* Second pass: convert nodes to canonical form
 	*
 	* The idea here is to reduce the number of cases that we have to handle in the next
 	* phase. For example all loop variants are converted to a FOR tree (the most general).
 	*
 	*  This phase also transforms lazy operators (&&, || and ?) into calls to anonymous functions
 	*  so that the next phase does have to deal with them (would be hard to restructure otherwise).
 	*/
	function _canonicalize(node) {
		_propagate(node, _canonicalize);
		if (node._scope.async) {
			if (node.type == VAR)
				node = _fixScopeVar(node);
			else if (node.type == FUNCTION)
				node = _fixScopeFunction(node);
			else if (node.type == SCRIPT)
				node = _fixScopeScript(node);
		}
		if (!node._async)
			return node;

		// dispatch to handler
		var handler = _handlers[_tag(node)];
		return handler && handler.canonicalize ? handler.canonicalize(node) : node;
	}

	var _rootTemplate = new Template( function _t() {
		(function(_) {
			script
		}).call(this);
	});
	function _canonicalizeRoot(node, options) {
		if (node._async) {
			node = _rootTemplate.generate(node._scope, false, {
				script: node
			});
			node._async = false;
		}
		return _canonicalize(node);
	}

	var _assignTemplate = new Template( function _t() {
		lhs = rhs;
	});
	function _fixScopeVar(node) {
		var idents = node._scope.identifiers;
		var hasOut = node.children.some( function(ident) {
			return idents[ident.value] === "out";
		});
		if (!hasOut)
			return node;
		var block = _node(BLOCK, []);
		node.children.forEach( function(ident) {
			if (idents[ident.value] == "out") {
				if (ident.initializer) {
					var n = _assignTemplate.generate(node._scope, false, {
						lhs: _identifier(ident.value),
						rhs: ident.initializer
					})
					block.children.push(n);
					block._async |= n._async;
				}
			} else {
				var n = _node(VAR, [ident]);
				n._async = ident._async;
				block.children.push(n);
				block._async |= n._async;
			}
		});
		return block.children.length == 1 ? block.children[0] : block;
	}

	function _fixScopeFunction(node) {
		var idents = node._scope.identifiers;
		if (!node.name || idents[node.name] !== "out")
			return node;
		node = _identifier(node.name);
		node._isFunctionReference = true;
		return node;
	}

	function _fixScopeScript(node) {
		var idents = node._scope.identifiers;
		node._scope.functions.forEach( function(fn) {
			if (idents[fn.name] == "out") {
				node.children.splice(0, 0, fn);
				delete idents[fn.name];
			}
		});
		var vars = [];
		for (var name in idents) {
			if (idents[name] == "out")
				vars.push(_identifier(name));
		}
		if (vars.length > 0)
			node.children.splice(0, 0, _node(VAR, vars));
		return node;
	}

	/*
 	* Utility to convert isolated statements into blocks during canonicalization
 	*/
	function _blockify(node) {
		if (!node || node.type == BLOCK)
			return node;
		var block = _node(BLOCK, [node]);
		block._async = node._async;
		return block;
	}

	/*
 	* Third pass: restructure the tree (the hard part)
 	*
 	* This is where we apply the patterns that transform sync flow into async flows with callbacks
 	*/
	function _restructure(node, options) {
		// set _restructured flag when we encounter an async node and
		// propagate it down to the node's subtree (stopping at function boundaries)
		node._restructured |= node._async;
		_propagate(node, function(child) {
			// set _restructured before recursing so that moved children get the flag
			child._restructured = node._restructured && child.type != FUNCTION;
			// recurse
			child = _restructure(child, options);
			// set _restructured again in case child was replaced
			child._restructured = node._restructured && child.type != FUNCTION;
			// if child has a tail, combine node into it and use it
			_combineTails(node, child);
			return child;
		});
		//console.log("RESTRUCTURING: " + "tail: " + (node._tail != null) + " head: " + (node._head != null) + " " + _tag(node));
		if (!node._async)
			return node;

		// dispatch to handler
		var handler = _handlers[_tag(node)];
		node = handler && handler.restructure ? handler.restructure(node, options) : node;
		return node;
	}

	/*
 	* Utilities for restructure phase
 	*/
	function _combineTails(node, child) {
		if (child._tail) {
			if (node._tail) {
				if (child._head)
					node._tail.children.push(child._head);
				node._tail = child._tail;
			} else {
				node._head = child._head;
				node._tail = child._tail;
			}
		}
	}

	function _combineExpression(node, exp) {
		if (exp && exp._tail) {
			exp._tail.children.push(node);
			exp._head._tail = node._tail;
			node = exp._head;
		}
		return node;
	}

	/*
 	* Fourth pass: fix loose ends in the converted flow.
 	*
 	* At this stage, the flow has been restructured for async but the statements
 	* like return, throw, break and continue have not all been processed (only
 	* return and throw with an async child have been converted, and they are marked as _done).
 	* Also, we need to add a return __then(); at the end of all the blocks that end a flow
 	* without returning.
 	*
 	* The finish pass takes care of these details.
 	*/
	function _finish(node) {
		if (node._finished)
			return node;
		node._finished = true;
		//console.log("FINISHING: " + _tag(node) + " " + node._restructured);
		_propagate(node, _finish);
		if (!node._restructured || node._done)
			return node;

		var handler = _handlers[_tag(node)];
		node = handler && handler.finish ? handler.finish(node) : node;
		//console.log("FINISHED: " + _tag(node) + " " + node._returns);
		return node;
	}

	/*
 	* Utility for finish pass
 	*/
	function _returns(node) {
		return node != null && (node.type == RETURN || node._returns);
	}

	/*
	* Fifth pass: simplification
	*
	* Removes generated code that turns out to be a no-op, for example when and if/else statement
	* is not followed by any other statement.
	*/
	// use strings for these templates to avoid differences between browsers
	var _optim1 = new Template("function _t(){ (function() { return __then(); }); }", true).root;
	var _optim2 = new Template("function _t(){ (function(__0, $param) { return _(null, $arg); }); }", true).root;
	var _optim3a = new Template("function _t(){ __cb(_, _.bind(this)) }", true).root;
	var _optim3b = new Template("function _t(){ __cb(_, _) }", true).root;
	var _optim4a = new Template("function _t(){ return (function(__then) { $body; }).call(this, __then.bind(this)); }", false).root;
	var _optim4b = new Template("function _t(){ return (function(__then) { $body; })(__then); }", false).root;

	function _checkUsed(val, used) {
		if (typeof val === "string" && val.substring(0, 2) === "__")
			used[val] = true;
	}

	function _simplify(node, options, used) {
		if (node._simplified)
			return node;
		node._simplified = true;
		_propagate(node, function(child) {
			return _simplify(child, options, used)
		});
		_checkUsed(node.value, used);

		function _match(prop, v1, v2, result) {
			var ignored = ["parenthesized", "lineno", "start", "end", "tokenizer", "hasReturnWithValue"];
			if (prop.indexOf(options.callback) == 0 || ignored.indexOf(prop) >= 0)
				return true;
			if (v1 == v2)
				return true;
			if (v1 == null || v2 == null) {
				// ignore difference between null and empty array
				if (prop == "children" && v1 && v1.length === 0)
					return true;
				return false;
			}
			if (typeof v1.forEach == "function") {
				if (v1.length != v2.length)
					return false;
				for (var i = 0; i < v1.length; i++) {
					if (!_match(prop, v1[i], v2[i], result))
						return false;
				}
				return true;
			}
			if (typeof v1 == "string" && v1[0] == "$" && typeof v2 == "string") {
				result[v1] = v2;
				return true;
			}
			if (v1.type) {
				var exp;
				if (v1.type == SCRIPT && v1.children[0] &&
				(exp = v1.children[0].expression) &&
				typeof exp.value == "string" &&
				exp.value[0] == '$') {
					result[exp.value] = v2;
					return true;
				}
				if (v1.type != v2.type)
					return false;
				if (v1.type == IDENTIFIER && v1.value == '$') {
					result[v1.value] = v2.value;
					return true;
				}

				for (var prop in v1) {
					if (v1.hasOwnProperty(prop) && prop.indexOf("Decls") < 0 && prop != "target") {
						if (!_match(prop, v1[prop], v2[prop], result))
							return false;
					}
				}
				return true;
			}
			return false;
		}

		if (_match("", _optim1, node))
			return _identifier("__then");
		var result = {};
		if (_match("", _optim2, node, result) && result.$arg && result.$arg == result.$param)
			return _identifier(options.callback);
		if (_match("", _optim3a, node) || _match("", _optim3b, node))
			return _identifier(options.callback);
		if (_match("", _optim4a, node, result) || _match("", _optim4b, node, result)) {
			result.$body.type = BLOCK;
			return result.$body;
		}
		if (node._scope && !node._scope.hasThis && node.type == CALL && node.children[0].type == DOT &&
		node.children[1].children[0] && node.children[1].children[0].type == THIS) {
			if (node.children[0].children[1].value == "bind") {
				return node.children[0].children[0];
			} else if (node.children[0].children[1].value == "call") {
				node.children[0] = node.children[0].children[0];
				node.children[1].children.splice(0, 1);
			}
		}

		_flatten(node);
		return node;
	}

	/*
 	* Utilities for handlers
 	*/
	var _branchingTemplate = new Template( function _t() {
		return function(__then) {
			statement;
		}.call(this, function() {
			tail;
		}.bind(this));
	});
	function _restructureBranching(node) {
		return _branchingTemplate.generate(node._scope, true, {
			statement: _blockify(node)
		})
	}

	/*
 	* Node handlers.
 	*
 	* This is where the specifics of each node type are handled.
 	*
 	*
 	* The restructure patterns assume that two variables are always set in the
 	* generated flow:
 	*
 	*  _: the main callback that exits the function (what return and throw should call).
 	*  __then: the continuation callback where execution should continue if the flow is not disrupted.
 	*/
	var _handlers = {
		IF: new
		function() {
			this.check = function(node) {
				node._breaks = node.thenPart._breaks && node.elsePart && node.elsePart._breaks;
			}
			this.canonicalize = function(node) {
				node.thenPart = _blockify(node.thenPart);
				node.elsePart = _blockify(node.elsePart);
				return node;
			}
			this.restructure = function(node) {
				node = _combineExpression(node, node.condition);
				return _restructureBranching(node);
			}
			this.finish = function(node) {
				node._returns = _returns(node.thenPart) && _returns(node.elsePart);
				return node;
			}
		}(),

		SWITCH: new
		function() {
			var _switchTemplate = new Template( function _t() {
				{
				var __break = __then;
				statement;
				}
			})
			this.check = function(node) {
				if (!node._async)
					return;
				for (var i = 0; i < node.cases.length - 1; i++) {
					var stmts = node.cases[i].statements;
					if (stmts.children.length > 0 && !stmts._breaks)
						throw new Error(node.filename + ": unsupported construct: switch case with some path not terminated by break, return or throw");
				}
			}
			this.restructure = function(node) {
				return _restructureBranching(_switchTemplate.generate(node._scope, true, {
					statement: node
				}));
			}
			this.finish = function(node) {
				node._returns = node.cases.length > 0;
				var hasDefault = false;
				for (var i = 0; i < node.cases.length; i++) {
					node._returns &= _returns(node.cases[i]);
					hasDefault |= node.cases[i].type == DEFAULT;
				}
				node._returns &= hasDefault;
				return node;
			}
		}(),

		CASE: new
		function() {
			this.finish = function(node) {
				node._returns = _returns(node.statements);
				return node;
			}
		}(),

		WHILE: new
		function() {
			// See FOR handler for an explanation of this strange for/while construct
			// in this canonicalization rule
			var _whileTemplate = new Template( function _t() {
				{
				for (;;) {
					while (condition) {
						body;
					}
				}
				}
			})
			this.canonicalize = function(node) {
				node.body = _blockify(node.body);
				return _whileTemplate.generate(node._scope, false, {
					condition: node.condition,
					body: node.body
				});
			}
			// All loop forms are canonicalized in a form that uses while as a placeholder
			// for a statement that does not really exist in the language.
			// This rule defines how this placeholder statement is restructured, not how
			// the whole while is restructured. To get the full picture, combine this
			// restructuring with the restructuring of the FOR statement.
			var _whileIfTemplate = new Template( function _t() {
				{
				if (condition) {
					body;
				} else {
					return __break();
				}
				}
			})
			this.restructure = function(node) {
				return _whileIfTemplate.generate(node._scope, true, {
					condition: node.condition,
					body: node.body
				});
			}
		}(),

		DO: new
		function() {
			// See FOR handler for an explanation of this strange for/while construct
			// in this canonicalization rule
			var _doTemplate = new Template( function _t() {
				{
				var firstTime = true;
				for (;;) {
					while (firstTime || condition) {
						firstTime = false;
						body;
					}
				}
				}
			});
			this.canonicalize = function(node) {
				node.body = _blockify(node.body);
				return _doTemplate.generate(node._scope, false, {
					firstTime: _identifier(_genId(node)),
					condition: node.condition,
					body: node.body
				})
			}
		}(),

		FOR: new
		function() {
			// We use a strange canonicalization rule which temporarily breaks code semantics
			// because we need to dissociate the restructuring of the update and condition clauses
			// The while inside is actually a placeholder for a statement that does not exist in Javascript.
			// This is the statement that we transform as described in WHILE.restructure rule
			var _forCanonTemplate = new Template( function _t() {
				{
				setup;
				for (;; update) {
					while (condition) {
						body;
					}
				}
				}
			})
			this.canonicalize = function(node) {
				node.body = _blockify(node.body);
				return _forCanonTemplate.generate(node._scope, false, {
					setup: node.setup,
					update: node.update,
					condition: node.condition,
					body: node.body
				})
			}
			var _forTemplateNoUpdate = new Template( function _t() {
				{
				return function(__break) {
					var __loop = __nt(_, function() {
						var __then = __loop;
						body;
					}.bind(this));
					return __loop();
				}.call(this, function() {
					tail;
				}.bind(this));
				}
			})
			var _forTemplateUpdateSync = new Template( function _t() {
				{
				var beenHere = false;
				return function(__break) {
					var __loop = __nt(_, function() {
						var __then = __loop;
						if (beenHere) {
							update;
						} else {
							beenHere = true;
						}
						body;
					}.bind(this));
					return __loop();
				}.call(this, function() {
					tail;
				}.bind(this));
				}
			})
			var _forTemplateUpdateAsync = new Template( function _t() {
				{
				var beenHere = false;
				return function(__break) {
					var __loop = __nt(_, function() {
						var __then = __loop;
						return function(__then) {
							if (beenHere) {
								update;
							} else {
								beenHere = true;
							}
						}.call(this, function() {
							body;
						}.bind(this));
					}.bind(this));
					return __loop();
				}.call(this, function() {
					tail;
				}.bind(this));
				}
			})
			this.restructure = function(node) {
				var beenHere = _identifier(_genId(node));
				var template = node.update ? node.update._async ? _forTemplateUpdateAsync : _forTemplateUpdateSync : _forTemplateNoUpdate;
				return template.generate(node._scope, true, {
					beenHere: beenHere,
					update: node.update,
					body: node.body
				});
			}
			this.finish = function(node) {
				// cannot set _returns
				return node;
			}
		}(),

		FOR_IN: new
		function() {
			// See FOR handler for an explanation of this strange for/while construct
			// in this canonicalization rule
			var _forInTemplate = new Template( function _t() {
				{
				var array = __forIn(object);
				var i = 0;
				for (;;) {
					while (i < array.length) {
						var iter = array[i++];
						body;
					}
				}
				}
			});
			this.canonicalize = function(node) {
				node.body = _blockify(node.body);
				return _forInTemplate.generate(node._scope, false, {
					array: _identifier(_genId(node)),
					i: _identifier(_genId(node)),
					object: node.object,
					iter: _identifier(node.iterator.name),
					body: node.body
				})
			}
		}(),

		TRY: new
		function() {
			var _tryTemplate = new Template( function _t() {
				try {
					tryBlock;
				} catch (e) {
					return __propagate(_, e);
				}
			});
			var _catchTemplate = new Template( function _t() {
				{
				return function(__then) {
					return function(_) {
						result;
					}.call(this, function(catchVarName, __result) {
						try {
							if (catchVarName) {
								catchBlock;
							} else
								return _(null, __result);
						} catch (e) {
							return __propagate(_, e);
						}
					}.bind(this));
				}.call(this, function() {
					try {
						tail;
					} catch (e) {
						return __propagate(_, e);
					}
				}.bind(this));
				}
			})
			var _finallyTemplate = new Template( function _t() {
				return function(__then) {
					return function(_) {
						var __then = function() {
							return _(null, null, true);
						}.bind(this);
						result;
					}.call(this, function(__err, __result, __cont) {
						return function(__then) {
							try {
								finallyBlock;
							} catch (e) {
								return __propagate(_, e);
							}
						}.call(this, function() {
							try {
								if (__cont)
									return __then();
								else
									return _(__err, __result);
							} catch (e) {
								return __propagate(_, e);
							}
						}.bind(this));
					}.bind(this));
				}.call(this, function() {
					try {
						tail;
					} catch (e) {
						return __propagate(_, e);
					}
				}.bind(this));
			});
			this.check = function(node) {
				node._breaks = node.tryBlock._breaks && node.catchClauses[0] && node.catchClauses[0].block._breaks;
			}
			this.restructure = function(node) {
				var result = _tryTemplate.generate(node._scope, true, {
					tryBlock: node.tryBlock
				});

				var catchClause = node.catchClauses[0];
				if (catchClause) {
					result = _catchTemplate.generate(node._scope, true, {
						result: result,
						catchVarName: catchClause.varName,
						catchBlock: catchClause.block,
						beenHere: _identifier(_genId(node))
					});
				}
				if (node.finallyBlock) {
					result = _finallyTemplate.generate(node._scope, true, {
						result: result,
						finallyBlock: node.finallyBlock
					})
				}
				return result;
			}
			this.finish = function(node) {
				node._returns = _returns(node.tryBlock) && node.catchClauses[0] && _returns(node.catchClauses[0].block);
				return node;
			}
		}(),

		IDENTIFIER: new
		function() {
			var _cbTemplate = new Template( function _t() {
				__cb(_, function(__0, param) {
					tail;
				}.bind(this))
			}, true);
			this.restructure = function(node) {
				if (node.value != node._scope.options.callback)
					return node;

				var id = _genId(node);

				var result = _cbTemplate.generate(node._scope, true, {
					param: id
				});
				result._magic = _identifier(id);
				result._magic._tail = result._tail;
				result._tail = null;
				//result._head = result;
				return result;
			}
		}(),

		CALL: new
		function() {
			this.restructure = function(node) {
				var args = node.children[1];
				var magicArg = args.children.filter( function(arg) {
					return arg._magic
				})[0];
				if (!magicArg)
					return node;

				var child0 = node.children[0];
				if (child0.type == IDENTIFIER && child0.value.indexOf("__wrap") == 0) {
					node._magic = magicArg._magic;
					return node;
				}

				var result = magicArg._magic;

				// store function(param) node into result._from so that we can remove param if it is unused
				if (magicArg.children[1].children[1])
					result._from = magicArg.children[1].children[1].children[0].children[0];

				var head = _return(node);
				head._done = true;
				if (node._head) {
					node._tail.children.push(head);
					head = node._head;

				}
				result._head = head;
				return result;
			}
		}(),

		BLOCK: new
		function() {
			this.check = function(node) {
				node.children.forEach( function(child) {
					node._breaks |= child._breaks;
				});
			}
			this.canonicalize = function(node) {
				_flatten(node);
				return node;
			}
			this.restructure = function(node) {
				var result = _node(node.type, []);
				result._scope = node._scope;
				var tail = result;
				for (var i = 0; i < node.children.length; i++) {
					var child = node.children[i];
					tail.children.push(child);
					if (child._tail) {
						tail = child._tail;
					}
					result._async |= child._async;
				}
				return _flatten(result);
			}
			var _finishTemplate = new Template( function _t() {
				return __then();
			});
			this.finish = function(node) {
				node._returns = _returns(node.children[node.children.length - 1]);
				if (node.type == SCRIPT && !node._returns) {
					node.children.push(_finishTemplate.generate(node._scope, true));
					node._returns = true;
				}
				return node;
			}
		}(),

		SCRIPT: new
		function() {
			var _functionPedanticTemplate = new Template( function _t() {
				{
				if (!_) {
					return __future.call(this, fn, arguments, index);
				}
				var __then = (_ = __wrapIn(_));
				try {
					body;
				} catch (e) {
					return __propagate(_, e);
				}
				}
			});
			var _functionTemplate = new Template( function _t() {
				{
				if (!_) {
					return __future.call(this, fn, arguments, index);
				}
				var __then = _;
				body;
				}
			});
			var _topLevelTemplate = new Template( function _t() {
				{
				var __then = (_ = _ || __trap);
				body;
				}
			});
			this.canonicalize = function(node) {
				return _handlers.BLOCK.canonicalize(node);
			}
			this.restructure = function(node, options) {
				node = _handlers.BLOCK.restructure(node);
				node.type = BLOCK;
				//node.children.splice(0, 0, _functionVarTemplate.generate(node._scope, true));
				var template = node._scope.cbIndex == null ? _topLevelTemplate : (options.tryCatch === "pedantic" ? _functionPedanticTemplate : _functionTemplate);
				node = template.generate(node._scope, true, {
					fn: node._scope.name ? _identifier(node._scope.name) : _node(NULL),
					index: node._scope.cbIndex,
					body: node
				});
				node.type = SCRIPT;
				return node;
			}
			this.finish = function(node) {
				return _handlers.BLOCK.finish(node);
			}
		}(),

		GENERIC_STATEMENT: new
		function() {
			this.restructure = function(node) {
				var init;
				if (node.type == SEMICOLON && node.expression._from) {
					// statement vanishes - remove callback param
					node.expression._from.params.splice(0, 2);
				} else if (node.type == VAR && node.children.length == 1 &&
				(init = node.children[0].initializer) &&
				init._from) {
					// var vanishes -- fix callback param
					init._from.params[1] = node.children[0].name;
				} else {
					if (node._tail == null)
						throw new Error(node.filename + ": invalid use of '_' parameter on line " + node.lineno);
					node._tail.children.push(node);
				}
				if (!node._head)
					throw new Error(node.filename + ": invalid use of '_' parameter on line " + node.lineno + " (case 2)");
				var head = node._head;
				head._tail = node._tail;
				node._head = null;
				return head;
			}
			this.finish = function(node) {
				return node;
			}
		}(),

		RETURN: new
		function() {
			var _template = new Template( function _t() {
				return _(null, value);
			});
			var _undefinedTemplate = new Template( function _t() {
				return _(null);
			});
			this.check = function(node) {
				node._breaks = true;
			}
			this.restructure = function(node) {
				return _handlers.GENERIC_STATEMENT.restructure(node);
			}
			this.finish = function(node) {
				node = (node.value ? _template : _undefinedTemplate).generate(node._scope, false, {
					value: node.value
				});
				node._returns = true;
				return node;
			}
		}(),

		THROW: new
		function() {
			var _template = new Template( function _t() {
				return _(exception);
			});
			this.check = function(node) {
				node._breaks = true;
			}
			this.restructure = function(node) {
				return _handlers.GENERIC_STATEMENT.restructure(node);
			}
			this.finish = function(node) {
				node = _template.generate(node._scope, false, {
					exception: node.exception
				});
				node._returns = true;
				return node;
			}
		}(),

		BREAK: new
		function() {
			var _template = new Template( function _t() {
				return __break();
			});
			this.check = function(node) {
				node._breaks = true;
			}
			this.finish = function(node) {
				if (!node.target._async)
					return node;
				if (node.label)
					throw new Error(node.filename + ": labelled break not supported yet");
				return _template.generate(node._scope, true);
			}
		}(),

		CONTINUE: new
		function() {
			var _template = new Template( function _t() {
				return __loop();
			});
			this.finish = function(node) {
				if (!node.target._async)
					return node;
				if (node.label)
					throw new Error(node.filename + ": labelled continue not supported yet");
				return _template.generate(node._scope, true);
			}
		}(),

		AND_OR: new
		function() {
			var _template = new Template( function _t() {
				return function(_) {
					var __val = op1;
					if (!__val == isAnd) {
						return __val;
					}
					return op2;
				}.call(this, _)
			}, false);
			this.canonicalize = function(node) {
				var op1 = node.children[0];
				var op2 = node.children[1];
				if (!op2._async)
					return node;
				var call = _template.generate(node._scope, false, {
					op1: op1,
					op2: op2,
					isAnd: _node(node.type == AND ? TRUE : FALSE)
				}).value;
				if (!node._scope.hasThis) {
					// remove .call(this)
					call.children[0] = call.children[0].children[0];
					call.children[1].children.splice(0, 1);
				}
				_analyze(_node(SCRIPT, [call]), node._scope.options);
				return call;
			}
		}(),

		HOOK: new
		function() {
			var _template = new Template( function _t() {
				return function(_) {
					if (cond) {
						return trueExp;
					} else {
						return falseExp;
					}
				}.call(this, _);
			}, false);
			this.canonicalize = function(node) {
				var cond = node.children[0];
				var trueExp = node.children[1];
				var falseExp = node.children[2];
				if (!trueExp._async && !falseExp._async)
					return node;
				var call = _template.generate(node._scope, false, {
					cond: cond,
					trueExp: trueExp,
					falseExp: falseExp
				}).value;
				if (!node._scope.hasThis) {
					// remove .call(this)
					call.children[0] = call.children[0].children[0];
					call.children[1].children.splice(0, 1);
				}
				_analyze(_node(SCRIPT, [call]), node._scope.options)
				return call;
			}
		}()

	}

	_handlers.DEFAULT = _handlers.CASE;
	_handlers.VAR = _handlers.GENERIC_STATEMENT;
	_handlers.CONST = _handlers.GENERIC_STATEMENT;
	_handlers.SEMICOLON = _handlers.GENERIC_STATEMENT;
	_handlers.AND = _handlers.AND_OR;
	_handlers.OR = _handlers.AND_OR;

	var __global = "var __global = typeof global !== 'undefined' ? global : window;";

	function __cbSafe(_, fn) {
		var ctx = __global.__context;
		return function(err, result) {
			__global.__context = ctx;
			if (err)
				return _(err);
			try {
				return fn(null, result);
			} catch (ex) {
				return __propagate(_, ex);
			}
		}
	}

	function __cb(_, fn) {
		var ctx = __global.__context;
		return function(err, result) {
			__global.__context = ctx;
			if (err)
				return _(err);
			return fn(null, result);
		}
	}

	function __cbStr(options) {
		return (options && options.tryCatch !== "fast") ? __cbSafe.toString().replace("Safe", "") : __cb.toString();
	}

	// unfortunately callee is gone. So we need to pass a function
	function __future(fn, args, i) {
		var done, err, result;
		var cb = function(e, r) {
			done = true; err = e, result = r;
		};
		args = Array.prototype.slice.call(args);
		args[i] = function(e, r) {
			cb(e, r);
		};
		fn.apply(this, args);
		return function(_) {
			if (done)
				_.call(this, err, result);
			else
				cb = _.bind(this);
		}.bind(this);
	}

	// don't go through process.nextTick/setTimeout at every iteration
	function __nt(_, fn) {
		var i = 0;
		var cb = __cb(_, fn);
		var safeCb = function() {
			try {
				cb();
			} catch (ex) {
				__propagate(cb, ex);
			}
		};
		if (typeof process != "undefined" && typeof process.nextTick == "function")
			return function() {
				if (++i % 20 == 0)
					process.nextTick(safeCb);
				else
					cb();
			};
		else
			return function() {
				if (++i % 20 == 0)
					setTimeout(safeCb);
				else
					cb();
			};
	}

	function __propagate(_, err) {
		try {
			_(err);
		} catch (ex) {
			__trap(ex);
		}
	}

	function __trap(err) {
		if (err) {
			if (__global.__context && __global.__context.errorHandler)
				__global.__context.errorHandler(err);
			else
				console.error("UNCAUGHT EXCEPTION: " + err.message + "\n" + err.stack);
		}
	}

	function __forIn(object) {
		var array = [];
		for (var obj in object) {
			array.push(obj);
		}
		return array;
	}

	function __wrapIn(cb) {
		return function(err, result) {
			try {
				cb(err, result);
			} catch (ex) {
				__trap(ex);
			}
		}
	}

	function __wrapOut(cb) {
		return function(err, result) {
			try {
				cb(err, result);
			} catch (ex) {
				if (err)
					__trap(ex);
				else
					cb(ex);
			}
		}
	}

	function _extend(obj, other) {
	    for (var i in other) {
	        obj[i] = other[i];
	    }
	    return obj;
	}

	function _cl(obj) {
	    return _extend({}, obj);
	}

	exports.transform = function(source, options) {
		try {
		    options = options ? _cl(options) : {}; // clone to isolate options set at file level
			var sourceOptions = /streamline\.options\s*=\s*(\{.*\})/.exec(source);
			if (sourceOptions) {
				_extend(options, JSON.parse(sourceOptions[1]));
			} else if (source.indexOf("pragma streamline.extraTryCatch") >= 0) {
				options.tryCatch = "pedantic";
			}
			options.callback = options.callback || "_";
			options.tryCatch = options.tryCatch || "safe";
			options.lines = options.lines || "mark";
			//console.log("source=" + source);
			var node = parse(source + "\n"); // final newline avoids infinite loop if unterminated string literal at the end
			var strict = node.children[0] && node.children[0].expression && node.children[0].expression.value == "use strict";
			strict && node.children.splice(0, 1);
			_markSource(node);
			var tokenizer = node.tokenizer;
			//console.log("tree=" + node)
			_analyze(node, options);
			node = _canonicalizeRoot(node, options);
			//console.log("PREPARED=" + pp(node))
			node = _restructure(node, options);
			//console.log("RESTRUCTURED=" + pp(node))
			_finish(node);
			//console.log("FINISHED=" + pp(node))
			var used = {};
			node = _simplify(node, options, used);

			var result = format(node, options.lines);

			// add helpers at beginning so that __global is initialized before any other code
			if (!options.noHelpers)
				result = exports.helpersSource(options, used, strict) + result;
			//console.log("result=" + result);
			return result;
		} catch (err) {
			var message = "error streamlining " + (options.sourceName || 'source') + ": " + err.message;
			if (err.source && err.cursor) {
				var line = 1;
				for (var i = 0; i < err.cursor; i++) {
					if (err.source[i] === "\n")
						line += 1;
				}
				message += " on line " + line;
			}
			throw new Error(message);
		}
	}
	function _trim(fn) {
		return fn.toString().replace(/\s+/g, " ");
	}

	exports.helpersSource = function(options, used, strict) {
		var sep = options.lines == "preserve" ? " " : "\n";
		strict = strict ? '"use strict";' + sep : "";
		used.__propagate = used.__propagate || used.__nt || options.tryCatch !== "fast";
		used.__trap = used.__trap || used.__propagate || used.__wrapIn || used.__wrapOut;
		return sep + strict + __global +
		((!used || used.__cb) ? sep + _trim(__cbStr(options)) : "") +
		((!used || used.__future) ? sep + _trim(__future) : "") +
		((!used || used.__nt) ? sep + _trim(__nt) : "") +
		((!used || used.__propagate) ? sep + _trim(__propagate) : "") +
		((!used || used.__trap) ? sep + _trim(__trap) : "") +
		((!used || used.__forIn) ? sep + _trim(__forIn) : "") +
		((!used || used.__wrapIn) ? sep + _trim(__wrapIn) : "") +
		((!used || used.__wrapOut) ? sep + _trim(__wrapOut) : "") +
		sep;
	}
	exports.version = "0.1.16";

	exports.banner = function() {
		return "/*** Generated by streamline " + exports.version + " - DO NOT EDIT ***/\n";
	}
})(typeof exports !== 'undefined' ? exports : (window.Streamline = window.Streamline || {}));
