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
    var Narcissus = require('narcissus');
}
(function(exports){
	var parse = Narcissus.parser.parse;
	var pp = Narcissus.decompiler.pp;
	var definitions = Narcissus.definitions;
	
	eval(definitions.consts);
	
	function _tag(node){
		if (!node || !node.type) 
			return "*NOT_A_NODE*";
		var t = definitions.tokens[node.type];
		return /^\W/.test(t) ? definitions.opTypeNames[t] : t.toUpperCase();
	}
	
	/*
	 * Utility functions
	 */
	function _node(type, children){
		return {
			type: type,
			children: children
		};
	}
	
	function _identifier(name){
		return {
			type: IDENTIFIER,
			name: name,
			value: name,
		};
	}
	
	function _return(val){
		return {
			type: RETURN,
			value: val
		};
	}
	
	// cosmetic stuff: template logic generates nested blocks. Flatten them.
	function _flatten(node){
		if (node.type == BLOCK || node.type == SCRIPT) {
			do {
				var found = false;
				var children = [];
				node.children.forEach(function(child){
					if (child.type == BLOCK) {
						children = children.concat(child.children);
						found = true;
					}
					else 
						children.push(child);
				})
				node.children = children;
			}
			while (found);
		}
		return node;
	}
	
	// generic helper to traverse parse tree
	// if doAll is true, fn is called on every property, otherwise only on sub-nodes
	// if clone object is passed, values returned by fn are assigned to clone properties
	function _propagate(node, fn, doAll, clone){
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
					}
					else {
						if (doAll || (child && child.type)) 
							result[prop] = fn(child);
						
					}
				}
			}
		}
		return result;
	}
	
	// clones the tree rooted at node.
	function _clone(node){
		var lastId = 0;
		var clones = {}; // target property creates cycles
		function cloneOne(child){
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
	function Template(fn, isExpression){
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
		this.generate = function(restructuring, bindings){
			bindings = bindings || {};
			// tail will hold the tail block if we find one.
			var tail;
			
			function gen(node){
				if (!node || !node.type) {
					// not a parse node - replace if it is a name that matches a binding
					return typeof node == "string" && typeof bindings[node] != "undefined" ? bindings[node] : node;
				}
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
				}
				else {
					// recurse through sub nodes
					_propagate(node, function(child){
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
					node._sequence = bindings.sequence;
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
	function Sequence() {
		var last = 0;
		this.next = function() {
			return ++last;
		}
	}

	function _genId(node){
		return "__" + node._sequence.next();
	}
	
	/*
	 * compat stuff
	 */
	function _compat(node){
		function _endsWithUnderscore(str){
			return typeof str == "string" && str.length > 0 && str[str.length - 1] == '_';
		}
		function _removeUnderscore(str){
			return str.substring(0, str.length - 1);
		}
		
		if (node.type == CALL) {
			var ident = node.children[0];
			if (ident.type == DOT) 
				ident = ident.children[1];
			if (_endsWithUnderscore(ident.value)) {
				console.log("Old style streamline.js call: " + ident.value);
				node.children[1].children.push(_identifier('_'));
				ident.value = _removeUnderscore(ident.value);
			}
		}
		else 
			if (node.type == FUNCTION) {
				if (_endsWithUnderscore(node.name)) {
					console.log("Old style streamline.js function definition: " + node.name);
					node.params.push('_');
					node.name = _removeUnderscore(node.name);
				}
			}
	}
	
	/*
	 * First pass: analyze the parse tree to mark the async branches and 
	 * set up the info that we need to generate the __N variables
	 * 
	 * Calls to async functions and all their parents up to enclosing SCRIPT are marked
	 * with _async = true.
	 * 
	 * Every node receives a sequence to generate names of extra variables.
	 * This sequence is the same for all the nodes of a given SCRIPT but different SCRIPTs
	 * (different functions) get different sequences.
	 */
	function _analyze(node){
		function _analyzeOne(node, sequence){
			_compat(node);
			//console.log("ANALYZING: " + _tag(node));
			if (node.type == SCRIPT) {
				sequence = new Sequence();
			}
			node._sequence = sequence;
			
			_propagate(node, function(child){
				_analyzeOne(child, sequence);
				if (child._async && child.type != FUNCTION) 
					node._async = true;
				return child;
			});
			if (node.type == IDENTIFIER && node.value == '_') 
				node._async = true;
			if (node.type == FUNCTION) {
				var async = node.params.filter(function(param){
					return param == '_';
				}).length != 0;
				if (node._async && !async) 
					throw new Error("Function contains async calls but does not have _ parameter: " + node.name + " at line " + node.lineno);
				if (!node._async && async) 
					node.body._async = true; // force script restructuring if empty body
				node._async = async;
			}
		}
		_analyzeOne(node, new Sequence());
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
	function _canonicalize(node){
		//console.log("CANON: " + _tag(node));
		_propagate(node, _canonicalize);
		if (!node._async) 
			return node;
		
		// dispatch to handler
		var handler = _handlers[_tag(node)];
		return handler && handler.canonicalize ? handler.canonicalize(node) : node;
	}
	
	/*
	 * Utility to convert isolated statements into blocks during canonicalization
	 */
	function _blockify(node){
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
	function _restructure(node, options){
		// set _restructured flag when we encounter an async node and 
		// propagate it down to the node's subtree (stopping at function boundaries)
		node._restructured |= node._async;
		_propagate(node, function(child){
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
	function _combineTails(node, child){
		if (child._tail) {
			if (node._tail) {
				if (child._head) 
					node._tail.children.push(child._head);
				node._tail = child._tail;
			}
			else {
				node._head = child._head;
				node._tail = child._tail;
			}
		}	
	}
	
	function _combineExpression(node, exp){
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
	 * Also, we need to add a return __(); at the end of all the blocks that end a flow 
	 * without returning.
	 * 
	 * The finish pass takes care of these details.
	 */
	function _finish(node){
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
	function _returns(node){
		return node != null && (node.type == RETURN || node._returns);
	}
	
	
	/*
	 * Fifth pass: simplification 
	 * 
	 * Removes generated code that turns out to be a no-op, for example when and if/else statement
	 * is not followed by any other statement. 
	 */
	function _match(prop, v1, v2, result){
		var ignored = ["parenthesized", "lineno", "start", "end", "tokenizer", "hasReturnWithValue"];
		if (prop.indexOf("_") == 0 || ignored.indexOf(prop) >= 0) 
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
			if (v1.type == IDENTIFIER && v1.value== '$') {
			console.log("matched ident " + v1.value + "=" + v2.value)
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
	
	// use strings for these templates to avoid differences between browsers
	var _optim1 = new Template("function _t(){ (function() { return __(); }); }", true).root;
	var _optim2 = new Template("function _t(){ (function(__0, $param) { return _(null, $arg); }); }", true).root;
	var _optim3 = new Template("function _t(){ __cb(_, this, _) }", true).root;
	var _optim4 = new Template("function _t(){ return (function(__) { $body; }).call(this, __); }", false).root;

	function _checkUsed(val, used) {
		if (typeof val === "string" && val.substring(0, 2) === "__")
			used[val] = true;
	}
	function _simplify(node, used){
		if (node._simplified) 
			return node;
		node._simplified = true;
		_propagate(node, function(child){
			return _simplify(child, used)
		});
		_checkUsed(node.value, used);
		if (_match("", _optim1, node))
			return _identifier("__");
		var result = {};
		if (_match("", _optim2, node, result) && result.$arg && result.$arg == result.$param) 
			return _identifier("_");
		if (_match("", _optim3, node))
			return _identifier("_");
		if (_match("", _optim4, node, result)) {
			result.$body.type = BLOCK;
			return result.$body;
		}
		_flatten(node);
		return node;
	}

	/*
	 * Utilities for handlers
	 */
	var _branchingTemplate = new Template(function _t(){
		return (function(__){
			statement;
		}).call(this, function(){
			tail;
		})
	});
	
	function _restructureBranching(node){
		return _branchingTemplate.generate(true, {
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
	 *  __: the continuation callback where execution should continue if the flow is not disrupted.
	 */
	var _handlers = {
		IF: new function(){
			this.canonicalize = function(node){
				node.thenPart = _blockify(node.thenPart);
				node.elsePart = _blockify(node.elsePart);
				return node;
			}
			this.restructure = function(node){
				node = _combineExpression(node, node.condition);
				return _restructureBranching(node);
			}
			this.finish = function(node){
				node._returns = _returns(node.thenPart) && _returns(node.elsePart);
				return node;
			}
		}(),
		
		SWITCH: new function(){
			var _switchTemplate = new Template(function _t(){
				{
					var __break = __;
					statement;
				}
			})
			this.restructure = function(node){
				return _restructureBranching(_switchTemplate.generate(true, {
					statement: node
				}));
			}
			this.finish = function(node){
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
		
		CASE: new function(){
			this.finish = function(node){
				node._returns = _returns(node.statements);
				return node;
			}
		}(),
		
		WHILE: new function(){
			// See FOR handler for an explanation of this strange for/while construct 
			// in this canonicalization rule
			var _whileTemplate = new Template(function _t(){
				{
					for (;;) {
						while (condition) {
							body;
						}
					}
				}
			})
			
			this.canonicalize = function(node){
				node.body = _blockify(node.body);
				return _whileTemplate.generate(false, {
					condition: node.condition,
					body: node.body,
					sequence: node._sequence
				});
			}
			
			// All loop forms are canonicalized in a form that uses while as a placeholder
			// for a statement that does not really exist in the language.
			// This rule defines how this placeholder statement is restructured, not how
			// the whole while is restructured. To get the full picture, combine this
			// restructuring with the restructuring of the FOR statement.
			var _whileIfTemplate = new Template(function _t(){
				{
					if (condition) {
						body;
					}
					else {
						return __break();
					}
				}
			})
			
			this.restructure = function(node){
				return _whileIfTemplate.generate(true, {
					condition: node.condition,
					body: node.body
				});
			}
		}(),
		
		DO: new function(){
			// See FOR handler for an explanation of this strange for/while construct 
			// in this canonicalization rule
			var _doTemplate = new Template(function _t(){
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
			
			this.canonicalize = function(node){
				node.body = _blockify(node.body);
				return _doTemplate.generate(false, {
					firstTime: _identifier(_genId(node)),
					condition: node.condition,
					body: node.body,
					sequence: node._sequence
				})
			}
		}(),
		
		FOR: new function(){
			// We use a strange canonicalization rule which temporarily breaks code semantics
			// because we need to dissociate the restructuring of the update and condition clauses
			// The while inside is actually a placeholder for a statement that does not exist in Javascript.
			// This is the statement that we transform as described in WHILE.restructure rule
			var _forCanonTemplate = new Template(function _t(){
				{
					setup;
					for (;; update) {
						while (condition) {
							body;
						}
					}
				}
			})
			
			this.canonicalize = function(node){
				node.body = _blockify(node.body);
				return _forCanonTemplate.generate(false, {
					setup: node.setup,
					update: node.update,
					condition: node.condition,
					body: node.body,
					sequence: node._sequence
				})
			}
			
			var _forTemplateNoUpdate = new Template(function _t(){
				{
					return (function(__break){
						var __loop = __nt(_, this, function(){
							var __ = __loop;
							body;
						});
						return __loop();
					}).call(this, function(){
						tail;
					})
				}
			})
			
			var _forTemplateUpdateSync = new Template(function _t(){
				{
					var beenHere = false;
					return (function(__break){
						var __loop = __nt(_, this, function(){
							var __ = __loop;
							if (beenHere) {
								update;
							}
							else {
								beenHere = true;
							}
							body;
						});
						return __loop();
					}).call(this, function(){
						tail;
					})
				}
			})
			
			var _forTemplateUpdateAsync = new Template(function _t(){
				{
					var beenHere = false;
					return (function(__break){
						var __loop = __nt(_, this, function(){
							var __ = __loop;
							return (function(__){
								if (beenHere) {
									update;
								}
								else {
									beenHere = true;
								}
							})(function(){
								body;
							})
						});
						return __loop();
					}).call(this, function(){
						tail;
					})
				}
			})
			
			this.restructure = function(node){
				var beenHere = _identifier(_genId(node));
				var template = node.update ? node.update._async ? _forTemplateUpdateAsync : _forTemplateUpdateSync : _forTemplateNoUpdate;
				return template.generate(true, {
					beenHere: beenHere,
					update: node.update,
					body: node.body
				});
			}
			
			this.finish = function(node){
				// cannot set _returns
				return node;
			}
		}(),
		
		FOR_IN: new function(){
			// See FOR handler for an explanation of this strange for/while construct 
			// in this canonicalization rule
			var _forInTemplate = new Template(function _t(){
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
			
			this.canonicalize = function(node){
				node.body = _blockify(node.body);
				return _forInTemplate.generate(false, {
					array: _identifier(_genId(node)),
					i: _identifier(_genId(node)),
					object: node.object,
					iter: _identifier(node.iterator.name),
					body: node.body,
					sequence: node._sequence
				})
			}
			
		}(),
		
		TRY: new function(){
			var _tryTemplate = new Template(function _t(){
				try {
					tryBlock;
				} 
				catch (e) {
					return __propagate(_, this, e);
				}
			});
			
			var _catchTemplate = new Template(function _t(){
				{
					return (function(__){
						return (function(_){
							result;
						}).call(this, function(catchVarName, __result){
							if (catchVarName) {
								catchBlock;
							}
							else 
								return _(null, __result);
						});
					}).call(this, function(){
						try {
							tail;
						} 
						catch (e) {
							return __propagate(_, this, e);
						}
					})
				}
			})
			
			var _finallyTemplate = new Template(function _t(){
				return (function(__){
					return (function(_){
						function __(){
							return _(null, null, true);
						}
						result;
					}).call(this, function(__err, __result, __cont){
						return (function(__){
							finallyBlock;
						}).call(this, function(){
							if (__cont) 
								return __();
							else 
								return _(__err, __result);
						})
					});
				}).call(this, function(){
					try {
						tail;
					} 
					catch (e) {
						return __propagate(_, this, e);
					}
				})
			});
			
			this.restructure = function(node){
				var result = _tryTemplate.generate(true, {
					tryBlock: node.tryBlock
				});
				
				var catchClause = node.catchClauses[0];
				if (catchClause) {
					result = _catchTemplate.generate(true, {
						result: result,
						catchVarName: catchClause.varName,
						catchBlock: catchClause.block,
						beenHere: _identifier(_genId(node))
					});
				}
				if (node.finallyBlock) {
					result = _finallyTemplate.generate(true, {
						result: result,
						finallyBlock: node.finallyBlock
					})
				}
				return result;
			}
			
			this.finish = function(node){
				node._returns = _returns(node.tryBlock) && node.catchClauses[0] && _returns(node.catchClauses[0].block);
				return node;
			}
		}(),
		
		IDENTIFIER: new function(){
			var _cbTemplate = new Template(function _t(){
				__cb(_, this, function(__0, param){
					tail;
				})
			}, true);
			
			this.restructure = function(node){
				if (node.value != '_') 
					return node;
				
				var id = _genId(node);
				
				var result = _cbTemplate.generate(true, {
					param: id
				});
				result._magic = _identifier(id);
				result._magic._tail = result._tail;
				result._tail = null;
				//result._head = result;
				return result;
			}
		}(),
		
		
		CALL: new function(){
			this.restructure = function(node){
				var args = node.children[1];
				var magicArg = args.children.filter(function(arg){
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
				result._from = magicArg.children[1].children[2];
				
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
		
		BLOCK: new function(){
			this.canonicalize = function(node){
				_flatten(node);
				return node;
			}
			
			this.restructure = function(node){
				var result = _node(node.type, []);
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
			
			var _finishTemplate = new Template(function _t(){
				return __();
			});
			
			this.finish = function(node){
				node._returns = _returns(node.children[node.children.length - 1]);
				if (node.type == SCRIPT && !node._returns) {
					node.children.push(_finishTemplate.generate(true));	
					node._returns = true;				
				}
				return node;
			}
		}(),
		
		SCRIPT: new function(){
			var _functionExtraTryCatchTemplate = new Template(function _t(){
				{
					var __ = (_ = __wrapIn(_ || __throw));
					try {
						body;
					} 
					catch (e) {
						return __propagate(_, this, e);
					}
				}
			});
			
			var _functionTemplate = new Template(function _t(){
				{
					var __ = (_ = _ || __throw);
					body;
				}
			});
			
			this.canonicalize = function(node){
				return _handlers.BLOCK.canonicalize(node);
			}
			
			this.restructure = function(node, options){
				node = _handlers.BLOCK.restructure(node);
				node.type = BLOCK;
				//node.children.splice(0, 0, _functionVarTemplate.generate(true));
				node = (options.extraTryCatch ? _functionExtraTryCatchTemplate : _functionTemplate).generate(true, {
					body: node
				});
				node.type = SCRIPT;
				return node;
			}
			
			this.finish = function(node){
				return _handlers.BLOCK.finish(node);
			}
		}(),
		
		GENERIC_STATEMENT: new function(){
			this.restructure = function(node){
				var init;
				if (node.type == SEMICOLON && node.expression._from) {
					// statement vanishes - remove callback param
					node.expression._from.params.splice(0, 2);
				}
				else if (node.type == VAR && node.children.length == 1 
				&& (init = node.children[0].initializer) && init._from) {
					// var vanishes -- fix callback param
					init._from.params[1] = node.children[0].name;
				}
				else {
					if (node._tail == null) 
						throw new Error("TAIL MISSING: " + _tag(node) + ": " + pp(node))
					node._tail.children.push(node);
				}
				if (!node._head) 
					throw new Error("HEAD MISSING: " + _tag(node) + ": " + pp(node))
				var head = node._head;
				head._tail = node._tail;
				node._head = null;
				return head;
			}
			this.finish = function(node){
				return node;
			}
		}(),
		
		RETURN: new function(){
			var _template = new Template(function _t(){
				return _(null, value);
			});
			
			this.restructure = function(node){
				return _handlers.GENERIC_STATEMENT.restructure(node);
			}
			this.finish = function(node){
				node = _template.generate(false, {
					value: node.value || _node(NULL)
				});
				node._returns = true;
				return node;
			}
		}(),
		
		THROW: new function(){
			var _template = new Template(function _t(){
				return _(exception);
			});
			
			this.restructure = function(node){
				return _handlers.GENERIC_STATEMENT.restructure(node);
			}
			this.finish = function(node){
				node = _template.generate(false, {
					exception: node.exception
				});
				node._returns = true;
				return node;
			}
		}(),
		
		BREAK: new function(){
			var _template = new Template(function _t(){
				return __break();
			});
			this.finish = function(node){
				if (!node.target._async) 
					return node;
				if (node.label) 
					throw new Error("labelled break not supported yet");
				return _template.generate(true);
			}
		}(),
		
		CONTINUE: new function(){
			var _template = new Template(function _t(){
				return __loop();
			});
			this.finish = function(node){
				if (!node.target._async) 
					return node;
				if (node.label) 
					throw new Error("labelled continue not supported yet");
				return _template.generate(true);
			}
		}(),
		
		AND_OR: new function(){
			var _template = new Template(function _t(){
				(function(_){
					var __val = op1;
					if (!__val == isAnd) {
						return __val;
					}
					return op2;
				}).call(this, _)
			}, true);
			this.canonicalize = function(node){
				var op1 = node.children[0];
				var op2 = node.children[1];
				if (!op2._async) 
					return node;
				var call = _template.generate(false, {
					op1: op1,
					op2: op2,
					isAnd: _node(node.type == AND ? TRUE : FALSE)
				});
				_analyze(_node(SCRIPT, [call]))
				return call;
			}
			
		}(),
		HOOK: new function(){
			var _template = new Template(function _t(){
				(function(_){
					if (cond) {
						return trueExp;
					}
					else {
						return falseExp;
					}
				}).call(this);
			}, true);
			this.canonicalize = function(node){
				var cond = node.children[0];
				var trueExp = node.children[1];
				var falseExp = node.children[2];
				if (!trueExp._async && !falseExp._async) 
					return node;
				var call = _template.generate(false, {
					cond: cond,
					trueExp: trueExp,
					falseExp: falseExp
				});
				_analyze(_node(SCRIPT, [call]))
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

	function __cbExtraTryCatch(_, self, fn){
		var ctx = __global.__context;
		return function(err, result){
			__global.__context = ctx;
			if (err) 
				return _.call(self, err);
			try {
				return fn.call(self, null, result);
			} 
			catch (ex) {
				return __propagate(_, self, ex);
			}
		}
	}
	
	function __cb(_, self, fn){
		var ctx = __global.__context;
		return function(err, result){
			__global.__context = ctx;
			if (err) 
				return _.call(self, err);
			return fn.call(self, null, result);
		}
	}
	
	function __cbStr(options) {
		return (options && options.extraTryCatch) ? __cbExtraTryCatch.toString().replace("ExtraTryCatch", "") : __cb.toString();
	}
	
	 // don't go through process.nextTick/setTimeout at every iteration
	function __nt(_, self, fn){
		var i = 0;
		var cb = __cb(_, self, fn);
		var safeCb = function(){
			try {
				cb();
			} 
			catch (ex) {
				__propagate(cb, self, ex);
			}
		};
		if (typeof process != "undefined" && typeof process.nextTick == "function") 
			return function(){
				if (++i % 20 == 0) 
					process.nextTick(safeCb);
				else 
					cb();
			};
		else 
			return function(){
				if (++i % 20 == 0) 
					setTimeout(safeCb);
				else 
					cb();
			};
	}
	
	function __propagate(_, self, err){
		try {
			_.call(self, err);
		}
		catch (ex) {
			__uncaught(ex);
		}
	}
	
	function __throw(err) {
		if (err) throw err;
	}
	
	function __forIn(object){
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
			}
			catch (ex) {
				__uncaught(ex);
			}
		}
	}
	
	function __wrapOut(cb) {
		return function(err, result) {
			try {
				cb(err, result);
			}
			catch (ex) {
				if (err)
					__uncaught(ex);
				else
					cb(ex);
			}
		}
	}
	
	function __uncaught(ex) {
		console.error("UNCAUGHT EXCEPTION: " + ex.message + "\n" + ex.stack);
	}

	exports.transform = function(source, options){
		options = options || {};
		options.extraTryCatch |= source.indexOf("pragma streamline.extraTryCatch") >= 0;
		//console.log("source=" + source);
		var node = parse(source);
		var tokenizer = node.tokenizer;
		//console.log("tree=" + node)
		_analyze(node);
		node = _canonicalize(node);
		//console.log("PREPARED=" + pp(node))
		node = _restructure(node, options);
		//console.log("RESTRUCTURED=" + pp(node))
		_finish(node);
		//console.log("FINISHED=" + pp(node))
		var used = {};
		node = _simplify(node, used);
		
		var result = pp(node);
		// add helpers at beginning so that __global is initialized before any other code
		if (!options.noHelpers) 
			result = exports.helpersSource(options, used) + result;
		//console.log("result=" + result);
		return result;
	}
	
	function _trim(fn) { return fn.toString().replace(/\s+/g, " "); }
	
	exports.helpersSource = function(options, used){
		used.__propagate = used.__propagate || used.__nt;
		used.__uncaught = used.__propagate || used.__wrapIn || used.__wrapOut;
		return "\n" + __global +
		((!used || used.__cb) ? "\n" + _trim(__cbStr(options)) : "") +
		((!used || used.__nt) ? "\n" + _trim(__nt) : "") +
		((!used || used.__propagate) ? "\n" + _trim(__propagate) : "") +
		((!used || used.__throw) ? "\n" + _trim(__throw) : "") +
		((!used || used.__forIn) ? "\n" + _trim(__forIn) : "") +
		((!used || used.__wrapIn) ? "\n" + _trim(__wrapIn) : "") +
		((!used || used.__wrapOut) ? "\n" + _trim(__wrapOut) : "") +
		((!used || used.__uncaught) ? "\n" + _trim(__uncaught) : "") +
		"\n";
	}
	
	exports.version = "0.1.1f";
	
})(typeof exports !== 'undefined' ? exports : (window.Streamline = window.Streamline || {}));
