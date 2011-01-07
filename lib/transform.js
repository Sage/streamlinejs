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
(function(exports){
	var parse = Narcissus.parser.parse;
	var pp = Narcissus.decompiler.pp;
	var definitions = Narcissus.definitions;
	
	eval(definitions.consts);
	
	function _tokenString(tt){
		var t = definitions.tokens[tt];
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
	
	// cosmetic stuff: template logic generates nested blocks. Merge them.
	function _mergeBlocks(node){
		if (node.type == BLOCK || node.type == SCRIPT) {
			var children = [];
			node.children.forEach(function(child){
				if (child.type == BLOCK) {
					children = children.concat(child.children);
				}
				else 
					children.push(child);
			})
			node.children = children;
		}
	}
	
	// generic helper to traverse parse tree
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
								child[i] = fn(child[i], prop, i);
							
						}
					}
					else {
						if (doAll || (child && child.type)) 
							result[prop] = fn(child, prop, null);
						
					}
				}
			}
		}
		return result;
	}
	
	function _clone(node){
		var lastId = 0;
		var clones = {}; // target property creates cycles
		function cloneOne(child, prop){
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
	
	function Template(f, isExpression){
		var _root = parse(f.toString()).children[0].body;
		if (_root.children.length != 1) 
			throw new Error("bad template (probably a missing block)");
		_root = _root.children[0];
		
		this.generate = function(restructuring, bindings){
			bindings = bindings || {};
			var tail;
			function gen(node, prop, i){
				if (!node || !node.type) {
					return typeof node == "string" && bindings[node] ? bindings[node] : node;
				}
				var len;
				if (node.children && (len = node.children.length) > 0 && node.children[len - 1].expression &&
				node.children[len - 1].expression.value == "tail") {
					tail = node;
					node.children.splice(len - 1, 1);
					if (restructuring) 
						node._restructured = true;
					return node;
				}
				var ident = node.type == SEMICOLON ? node.expression : node;
				if (ident && ident.type == IDENTIFIER && bindings[ident.value]) {
					var result = bindings[ident.value];
					if (ident.initializer) 
						result.initializer = gen(ident.initializer);
					return result;
				}
				else {
					// propagate _async flag computed during analyze phase
					_propagate(node, function(child){
						child = gen(child);
						if (child && child._async) 
							node._async = true;
						if (child && child._head && node.type != LIST) 
							node = _combineExpression(node, child);
						return child;
					}, true);
					_mergeBlocks(node);
					if (restructuring) {
						node._restructured = true;
						node._frozen = node.type == RETURN;
					}
					return node;
				}
			}
			var result = gen(_clone(_root));
			if (isExpression) 
				result = result.expression;
			result._tail = tail || bindings.tail;
			//console.log("GENERATED: " + pp(result));
			if (restructuring) {
				result._restructured = true;
				result._frozen = result.type == RETURN;
			}
			return result;
		}
	}
	
	/*
	 * First pass: add following properties to every node:
	 * 	_async: does the node contain at least one async call?
	 *  _scriptId: id of the ancestor script
	 *  _ids: map to obtain the last id allocated for a given script id.
	 */
	function _analyze(node){
		var lastScriptId = 0;
		var ids = {};
		function _analyzeOne(node, scriptId){
			//console.log("ANALYZING: " + _tokenString(node.type));
			if (node.type == SCRIPT) {
				scriptId = ++lastScriptId;
				ids[scriptId] = 0;
			}
			node._scriptId = scriptId;
			node._ids = ids;
			_propagate(node, function(child, prop, i){
				_analyzeOne(child, scriptId);
				if (child._async) 
					node._async = true;
				return child;
			});
			if (node.type == IDENTIFIER && _endsWithUnderscore(node.value)) 
				node._async = true;
			if (node.type == FUNCTION) {
				var async = _endsWithUnderscore(node.name);
				if (node._async && !async) 
					throw new Error("Async function name does not end with underscore: " + node.name)
				node._async = false;
				if (async) {
					node.name = node.name.substring(0, node.name.length - 1);
					node.params.push("_");
					node.body._async = true; // force restructuring even if body is empty or not async
				}
			}
		}
		_analyzeOne(node, 0);
	}
	
	function _genId(node){
		return "__" + ++node._ids[node._scriptId];
	}
	
	/*
	 * Second pass: convert nodes to canonical form
	 */
	function _canonicalize(node){
		//console.log("CANON: " + _tokenString(node.type));
		_propagate(node, _canonicalize);
		if (!node._async) 
			return node;
		
		var handler = _handlers[_tokenString(node.type)];
		return handler && handler.canonicalize ? handler.canonicalize(node) : node;
	}
	
	function _blockify(node){
		if (!node || node.type == BLOCK) 
			return node;
		var block = _node(BLOCK, [node]);
		block._async = node._async;
		return block;
	}
	
	// Conventions for transformed code:
	// 	_ is the callback parameter passed to the function. 
	//	Transformed code calls it to exit the function (return, throw, etc.)
	// 
	//	__ is the continuation callback. Upon function entry it it set to _
	//  but some statements change it. For example conditionals and loops
	
	function _returns(node){
		return node != null && (node.type == RETURN || node._returns);
	}
	
	/*
	 * Third pass: restructure the tree (the hard part)
	 */
	function _restructure(node){
		// set _restructured flag when we encounter an async node and 
		// propagate it down to the node's subtree (stopping at function boundaries)
		var restructured = node._async || node._restructured;
		_propagate(node, function(child, prop, i){
			child._restructured = restructured && child.type != FUNCTION;
			child = _restructure(child);
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
			return child;
		});
		//console.log("RESTRUCTURING: " + "tail: " + (node._tail != null) + " head: " + (node._head != null) + " " + _tokenString(node.type));
		//node._restructured = true;
		if (!node._async) 
			return node;
		
		var handler = _handlers[_tokenString(node.type)];
		node = handler && handler.restructure ? handler.restructure(node) : node;
		return node;
	}
	
	function _endsWithUnderscore(str){
		return typeof str == "string" && str.length > 0 && str[str.length - 1] == '_';
	}
	
	var _branchingTemplate = new Template(function _t(){
		return (function(__){
			statement;
		})(function(){
			tail;
		})
	});
	
	function _restructureBranching(node){
		return _branchingTemplate.generate(true, {
			statement: _blockify(node)
		})
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
	 * Fourth pass: fix the flow
	 */
	function _finish(node){
		if (node._finished) 
			return node;
		node._finished = true;
		//console.log("FINISHING: " + _tokenString(node.type) + " " + node._restructured);
		_propagate(node, _finish);
		if (!node._restructured || node._frozen) 
			return node;
		
		var handler = _handlers[_tokenString(node.type)];
		node = handler && handler.finish ? handler.finish(node) : node;
		//console.log("FINISHED: " + _tokenString(node.type) + " " + node._returns);
		return node;
	}
	
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
			this.canonicalize = function(node){
				node.body = _blockify(node.body);
				return node;
			}
			
			var _whileTemplate = new Template(function _t(){
				{
					return (function(__break){
						return (function __loop(){
							var __ = __loop;
							if (condition) {
								body;
							}
							else {
								return __break();
							}
						})();
					})(function(){
						tail;
					})
				}
			})
			this.restructure = function(node){
				return _whileTemplate.generate(true, {
					condition: node.condition,
					body: node.body
				});
			}
			this.finish = function(node){
				// cannot set _returns
				return node;
			}
		}(),
		
		DO: new function(){
			var _doTemplate = new Template(function _t(){
				{
					var firstTime = true;
					while (firstTime || condition) {
						firstTime = false;
						body;
					}
				}
			});
			
			this.canonicalize = function(node){
				node.body = _blockify(node.body);
				return _doTemplate.generate(false, {
					firstTime: _identifier(_genId(node)),
					condition: node.condition,
					body: node.body
				})
			}
		}(),
		
		FOR: new function(){
			var _setupTemplate = new Template(function _t(){
				{
					setup;
					loop;
				}
			})
			
			this.canonicalize = function(node){
				if (node.update._async) 
					throw new Error("asynchronous call not supported in 3rd clause of for statement")
				node.update = _blockify(node.update);
				node.body = _blockify(node.body);
				var setup = node.setup;
				if (setup) {
					delete node.setup;
					node = _setupTemplate.generate(false, {
						setup: setup,
						loop: node
					});
				}
				return node;
			}
			
			var _forTemplate = new Template(function _t(){
				{
					var beenHere = false;
					return (function(__break){
						return (function __loop(){
							var __ = __loop;
							if (beenHere) {
								update;
							}
							else {
								beenHere = true;
							}
							if (condition) {
								body;
							}
							else {
								return __break();
							}
						})();
					})(function(){
						tail;
					})
				}
			})
			
			this.restructure = function(node){
				var beenHere = _identifier(_genId(node));
				return _forTemplate.generate(true, {
					beenHere: beenHere,
					update: node.update,
					condition: node.condition,
					body: node.body
				});
			}
			
			this.finish = function(node){
				// cannot set _returns
				return node;
			}
		}(),
		
		FOR_IN: new function(){
			var _forInTemplate = new Template(function _t(){
				{
					var array = [];
					for (var obj in object) {
						array.push(obj);
					}
					var i = 0;
					while (i < array.length) {
						var iter = array[i++];
						body;
					}
				}
			});
			
			this.canonicalize = function(node){
				node.body = _blockify(node.body);
				return _forInTemplate.generate(false, {
					array: _identifier(_genId(node)),
					obj: _identifier(_genId(node)),
					i: _identifier(_genId(node)),
					object: node.object,
					iter: _identifier(node.iterator.name),
					body: node.body
				})
			}
			
		}(),
		
		TRY: new function(){
			var _tryTemplate = new Template(function _t(){
				try {
					tryBlock;
				} 
				catch (__err) {
					return _(__err);
				}
			});
			
			var _catchTemplate = new Template(function _t(){
				return (function(_){
					result;
				})(function(catchVarName, __result){
					if (catchVarName) {
						catchBlock;
					}
					else 
						return _(null, __result);
				});
			})
			
			var _finallyTemplate = new Template(function _t(){
				return (function(_){
					function __(){
						return _(null, null, true);
					}
					result;
				})(function(__err, __result, __cont){
					return (function(__){
						finallyBlock;
					})(function(){
						if (__cont) 
							return __();
						else 
							return _(__err, __result);
					})
				});
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
						catchBlock: catchClause.block
					});
					result = _restructureBranching(result);
				}
				if (node.finallyBlock) {
					result = _finallyTemplate.generate(true, {
						result: result,
						finallyBlock: node.finallyBlock
					})
					result = _restructureBranching(result);
				}
				return result;
			}
			
			this.finish = function(node){
				node._returns = _returns(node.tryBlock) && node.catchClauses[0] && _returns(node.catchClauses[0].block);
				return node;
			}
		}(),
		
		CALL: new function(){
			var _callHeadTemplate = new Template(function _t(){
				__cb(_, cb)
			}, true);
			
			var _callTailTemplate = new Template(function _t(){
				(function(arg){
					tail;
				})
			}, true);
			
			this.restructure = function(node){
				var ident = node.children[0];
				if (ident.type == DOT) 
					ident = ident.children[1];
				var args = node.children[1];
				
				switch (ident.type) {
					case IDENTIFIER:
						if (!_endsWithUnderscore(ident.value)) {
							return node;
						}
						ident.value = ident.value.substring(0, ident.value.length - 1);
						break;
					case FUNCTION:
						break;
					default:
						return node;
				}
				var id = _genId(node);
				var result = _identifier(id);
				
				var cb = _callTailTemplate.generate(true, {
					arg: _identifier(id)
				});
				cb.parenthesized = false;
				
				args.children.push(_callHeadTemplate.generate(true, {
					cb: cb
				}));
				
				var head = _return(node);
				head._frozen = true;
				if (node._tail) {
					node._tail.children.push(head);
					head = node._head;
				}
				result._tail = cb._tail;
				result._head = head;
				result._from = cb; // remember where param comes from so we can delete it if result vanishes
				return result;
			}
		}(),
		
		BLOCK: new function(){
			this.canonicalize = function(node){
				_mergeBlocks(node);
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
				}
				result._restructured = true;
				return result;
			}
			
			var _finishTemplate = new Template(function _t(){
				return __();
			});
			
			this.finish = function(node){
				node._returns = _returns(node.children[node.children.length - 1]);
				if (node.type == SCRIPT && !node._returns) 
					node.children.push(_finishTemplate.generate(true));
				
				return node;
			}
		}(),
		
		SCRIPT: new function(){
			var _functionVarTemplate = new Template(function _t(){
				var __ = _;
			});
			
			this.canonicalize = function(node){
				return _handlers.BLOCK.canonicalize(node);
			}
			
			this.restructure = function(node){
				node = _handlers.BLOCK.restructure(node);
				node.children.splice(0, 0, _functionVarTemplate.generate(true));
				return node;
			}
			
			this.finish = function(node){
				return _handlers.BLOCK.finish(node);
			}
		}(),
		
		GENERIC_STATEMENT: new function(){
			this.restructure = function(node){
				if (node.type == SEMICOLON && node.expression._from) {
					// statement vanishes - remove callback param
					node.expression._from.params.splice(0, 1);
				}
				else {
					if (node._tail == null) 
						throw new Error("TAIL MISSING: " + _tokenString(node.type) + ": " + pp(node))
					node._tail.children.push(node);
				}
				if (!node._head) 
					throw new Error("HEAD MISSING: " + _tokenString(node.type) + ": " + pp(node))
				var head = node._head;
				head._tail = node._tail;
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
				node = _template.generate(true, {
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
				node = _template.generate(true, {
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
				(function _(){
					var __val = op1;
					if (!__val == isAnd) {
						return __val;
					}
					return op2;
				})();
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
				(function _(){
					if (cond) {
						return trueExp;
					}
					else {
						return falseExp;
					}
				})();
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
		}(),
	}
	
	_handlers.DEFAULT = _handlers.CASE;
	_handlers.VAR = _handlers.GENERIC_STATEMENT;
	_handlers.CONST = _handlers.GENERIC_STATEMENT;
	_handlers.SEMICOLON = _handlers.GENERIC_STATEMENT;
	_handlers.AND = _handlers.AND_OR;
	_handlers.OR = _handlers.AND_OR;
	
	function __cb(_, fn){
		return function(err, result){
			if (err) 
				return _(err);
			try {
				return fn(result);
			} 
			catch (ex) {
				return _(ex)
			}
		}
	}
	
	exports.transform = function(source, options){
		options = options || {};
		//console.log("source=" + source);
		var node = parse(source);
		var tokenizer = node.tokenizer;
		//console.log("tree=" + node)
		_analyze(node);
		node = _canonicalize(node);
		//console.log("PREPARED=" + pp(node))
		node = _restructure(node);
		//console.log("RESTRUCTURED=" + pp(node))
		_finish(node);
		//console.log("FINISHED=" + pp(node))
		var result = pp(node);
		if (!options.noHelpers) 
			result += __cb;
		//console.log("result=" + result);
		return result;
	}
	
	exports.callbackWrapper = __cb;
	
})(typeof exports !== 'undefined' ? exports : (window.Streamline = window.Streamline || {}));
