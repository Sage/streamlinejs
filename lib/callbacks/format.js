/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the Narcissus JavaScript engine.
 *
 * The Initial Developer of the Original Code is
 * Brendan Eich <brendan@mozilla.org>.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Shu-Yu Guo <shu@rfrn.org>
 *   Bruno Jouhier
 *   Gregor Richards
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

if (typeof exports !== 'undefined') {
	var Narcissus = require('../../deps/narcissus');
	var sourceMap = require('source-map');
}
(function(exports){
	eval(Narcissus.definitions.consts);
	var tokens = Narcissus.definitions.tokens;

	Object.defineProperty(sourceMap.SourceNode.prototype, 'length', {
		get: function() {
			var len = 0;
			this.walk(function(str) { len += str.length; });
			return len;
		}
	});
	sourceMap.SourceNode.prototype.stripPrefix = function(offset) {
		var _len;
		while (this.children.length > 0 && offset > 0 && (_len = this.children[0].length) <= offset) {
			this.children.shift();
			offset -= _len;
		}
		if (this.children.length == 0 || offset == 0) return this;
		if (typeof this.children[0] == 'string') {
			this.children[0] = this.children[0].substring(offset);
		} else {
			this.children[0].stripPrefix(offset);
		}
		return this;
	};
	sourceMap.SourceNode.prototype.stripSuffix = function(offset) {
		var _len, chlen;
		while ((chlen = this.children.length) > 0 && offset > 0 && (_len = this.children[chlen - 1].length) <= offset) {
			this.children.pop();
			offset -= _len;
		}
		if (chlen == 0 || offset == 0) return this;
		if (typeof this.children[chlen-1] == 'string') {
			this.children[chlen-1] = this.children[0].slice(0, -offset);
		} else {
			this.children[chlen-1].stripSuffix(offset);
		}
		return this;
	};
	sourceMap.SourceNode.prototype.map = function(f) {
		this.children = this.children.map(function(chunk) {
			if (chunk instanceof sourceMap.SourceNode) {
				return chunk.map(f);
			} else {
				return f(chunk);
			}
		});
		return this;
	};
	sourceMap.SourceNode.prototype.lastChar = function() {
		for (var i = this.children.length; i--; ) {
			var ret;
			if (typeof this.children[i] == 'string') {
				ret = this.children[i].slice(-1);
			} else {
				ret = this.children[i].lastChar();
			}
			if (ret) return ret;
		}
		return '';
	}
	
	exports.format = function(node, linesOpt) {
		var result = '';
	
		var ppOut = _pp(node);
		if (linesOpt == "sourcemap") {
			return ppOut.source;
		}
		ppOut.source = ppOut.source.toString();
		if (linesOpt == "ignore")
			return ppOut.source;
		
		var lineMap = ppOut.lineMap;
		
		var lines = ppOut.source.split("\n");
		
		if (linesOpt == "preserve") {
			var outputLineNo = 1, bol = true;
			for (var i = 0; i < lines.length; i++) {
				var sourceNodes = (lineMap[i] || []).filter(function(n) { return n._isSourceNode });
				if (sourceNodes.length > 0) {
					var sourceLineNo = sourceNodes[0].lineno;
					while (outputLineNo < sourceLineNo) {
						result += "\n";
						outputLineNo += 1;
						bol = true;
					}
				}
				result += bol ? lines[i] : lines[i].replace(/^\s+/, ' ');
				bol = false;
			}
		}
		else if (linesOpt == "mark"){
			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];
				var sourceNodes = (lineMap[i] || []).filter(function(n) { return n._isSourceNode });
				var linePrefix = '            ';
				if (sourceNodes.length > 0) {
					var sourceLineNo = '' + sourceNodes[0].lineno;
					linePrefix = '/* ';
					for (var j = sourceLineNo.length; j < 5; j++) linePrefix += ' ';
					linePrefix += sourceLineNo + ' */ ';
				}
				result += linePrefix + line + "\n";
			}
		}
		else
			throw new Error("bad --lines option: " + linesOpt)
		
		return result;
	}
	
	/** Narcissus.decompiler.pp with line number tracking **/
	function _pp(node) {
		
		var curLineNo = 0;
		var lineNodeMap = {};
		
		var src = pp(node);
		
		return {
			source: src,
			lineMap: lineNodeMap
		};
		
		function countNewline(s) {
			curLineNo += 1;
			return s;
		}
		
		function indent(n, s) {
			var dent = new Array(n+1).join(' ');
			s.map(function(str) {
				return str.replace(/\n/g, "\n" + dent);
			});
			s.prepend(dent);
			return s;
		}
	
		function isBlock(n) {
			return n && (n.type === BLOCK);
		}
	
		function isNonEmptyBlock(n) {
			return isBlock(n) && n.children.length > 0;
		}
	
		function nodeStr(n) {
			return '"' +
				n.value.replace(/\\/g, "\\\\")
				       .replace(/"/g, "\\\"")
				       .replace(/\n/g, "\\n")
				       .replace(/\r/g, "\\r") +
				       '"';
		}
	
		function pp(n, d, inLetHead) {
			var topScript = false;
	
			if (!n)
				return "";
			if (!(n instanceof Object))
				return ""+n;
			if (!d) {
				topScript = true;
				d = 1;
			}
			
			if (!lineNodeMap[curLineNo])
				lineNodeMap[curLineNo] = [];
			
			lineNodeMap[curLineNo].push(n);

			var lineno, column, source = n.tokenizer && n.tokenizer.filename;
			source = source || void 0;
			if (source && n.start && n.end && n.lineno) {
				var fragment = n.tokenizer.source.substring(n.start, n.end);
				if (fragment.indexOf("\n") == -1) {
					lineno = n.lineno;
					column = n.start - n.tokenizer.source.lastIndexOf("\n", n.start) - 1;
				} else {
					source = void 0;
				}
			} else {
				source = void 0;
			}
	
			var p = new sourceMap.SourceNode(lineno, column, source);
	
			if (n.parenthesized)
				p.add("(");
	
			switch (n.type) {
			case FUNCTION:
			case GETTER:
			case SETTER:
				if (n.type === FUNCTION)
					p.add("function");
				else if (n.type === GETTER)
					p.add("get");
				else
					p.add("set");
	
				p.add((n.name ? " " + n.name : "") + "(");
				for (var i = 0, j = n.params.length; i < j; i++) {
					p.add([(i > 0 ? ", " : ""), pp(n.params[i], d)]);
				}
				p.add([") ", pp(n.body, d)]);
				break;
	
			case SCRIPT:
			case BLOCK:
				var nc = n.children;
				if (topScript) {
					// No indentation.
					for (var i = 0, j = nc.length; i < j; i++) {
						if (i > 0) 
							p.add(countNewline("\n"));
						p.add(pp(nc[i], d));
						if (p.lastChar() != ";")
							p.add(";");
					}
	
					break;
				}
	
				p.add("{");
				if (n.id !== undefined)
					p.add(" /* " + n.id + " */");
				p.add(countNewline("\n"));
				for (var i = 0, j = nc.length; i < j; i++) {
					if (i > 0)
						p.add(countNewline("\n"));
					p.add(indent(2, pp(nc[i], d)));
					if (p.lastChar() != ";")
						p.add(';');
				}
				p.add(countNewline("\n}"));
				break;
	
			case LET_BLOCK:
				p.add(["let (", pp(n.variables, d, true), ") "]);
				if (n.expression)
					p.add(pp(n.expression, d));
				else
					p.add(pp(n.block, d));
				break;
	
			case IF:
				p.add(["if (", pp(n.condition, d), ") "]);
	
				var tp = n.thenPart, ep = n.elsePart;
				var b = isBlock(tp) || isBlock(ep);
				if (!b)
					p.add(countNewline("{\n"));
				p.add((b ? pp(tp, d) : indent(2, pp(tp, d))))
				if (ep && ";}".indexOf(p.lastChar()) < 0)
					p.add(";");
				p.add(countNewline("\n"));
	
				if (ep) {
					if (!b)
						p.add(countNewline("} else {\n"));
					else
						p.add(" else ");
	
					p.add([(b ? pp(ep, d) : indent(2, pp(ep, d))), countNewline("\n")]);
				}
				if (!b)
					p.add("}");
				break;
	
			case SWITCH:
				p.add(["switch (", pp(n.discriminant, d), countNewline(") {\n")]);
				for (var i = 0, j = n.cases.length; i < j; i++) {
					var ca = n.cases[i];
					if (ca.type === CASE)
						p.add(["case ", pp(ca.caseLabel, d), countNewline(":\n")]);
					else
						p.add(countNewline("  default:\n"));
					p.add([pp(ca.statements, d).stripPrefix(2).stripSuffix(2), countNewline("\n")]);
					curLineNo -= 2; // stripped out 2 newlines
				}
				p.add("}");
				break;
	
			case FOR:
				p.add(["for (", pp(n.setup, d), "; ", pp(n.condition, d), "; ", pp(n.update, d), ") "]);
	
				var pb = pp(n.body, d);
				if (!isBlock(n.body)) {
					p.add([countNewline("{\n"), indent(2, pb), countNewline(";\n}")]);
				} else if (n.body)
					p.add(pb);
				break;
	
			case WHILE:
				p.add(["while (", pp(n.condition, d), ") "]);
	
				var pb = pp(n.body, d);
				if (!isBlock(n.body)) {
					p.add([countNewline("{\n"), indent(2, pb), countNewline(";\n}")]);
				} else
					p.add(pb);
				break;
	
			case FOR_IN:
				var u = n.varDecl;
				p.add([n.isEach ? "for each (" : "for (", u ? pp(u, d) : pp(n.iterator, d), " in ", pp(n.object, d), ") "]);
	
				var pb = pp(n.body, d);
				if (!isBlock(n.body)) {
					p.add([countNewline("{\n"), indent(2, pb), countNewline(";\n}")]);
				} else if (n.body)
					p.add(pb);
				break;
	
			case DO:
				p.add(["do ", pp(n.body, d), " while (", pp(n.condition, d), ");"]);
				break;
	
			case BREAK:
				p.add(["break", n.label ? " " + n.label : "", ";"]);
				break;
	
			case CONTINUE:
				p.add(["continue", n.label ? " " + n.label : "", ";"]);
				break;
	
			case TRY:
				p.add(["try ", pp(n.tryBlock, d)]);
				for (var i = 0, j = n.catchClauses.length; i < j; i++) {
					var t = n.catchClauses[i];
					p.add([" catch (", pp(t.varName, d), t.guard ? " if " + pp(t.guard, d) : "", ") ", pp(t.block, d)]);
				}
				if (n.finallyBlock) {
					p.add([" finally ", pp(n.finallyBlock, d)]);
				}
				break;
	
			case THROW:
				p.add(["throw ", pp(n.exception, d)]);
				break;
	
			case RETURN:
				p.add("return");
				if (n.value) {
					p.add([" ", pp(n.value, d)]);
				}
				break;
	
			case YIELD:
				p.add("yield");
				if (n.value.type) {
					p.add([" ", pp(n.value, d)]);
				}
				break;
	
			case GENERATOR:
				p.add([pp(n.expression, d), " ", pp(n.tail, d)]);
				break;
	
			case WITH:
				p.add(["with (", pp(n.object, d), ") ", pp(n.body, d)]);
				break;
	
			case LET:
			case VAR:
			case CONST:
				var nc = n.children;
				if (!inLetHead) {
					p.add([tokens[n.type], " "]);
				}
				for (var i = 0, j = nc.length; i < j; i++) {
					if (i > 0)
						p.add(", ");
					var u = nc[i];
					p.add(pp(u.name, d));
					if (u.initializer) {
						p.add([" = ", pp(u.initializer, d)]);
					}
				}
				break;
	
			case DEBUGGER:
				p.add(countNewline("debugger\n"));
				break;
	
			case SEMICOLON:
				if (n.expression) {
					p.add([pp(n.expression, d), ";"]);
				}
				break;
	
			case LABEL:
				p.add([n.label, countNewline(":\n"), pp(n.statement, d)]);
				break;
	
			case COMMA:
			case LIST:
				var nc = n.children;
				for (var i = 0, j = nc.length; i < j; i++) {
					if (i > 0)
						p.add(", ");
					p.add(pp(nc[i], d));
				}
				break;
	
			case ASSIGN:
				var nc = n.children;
				var t = n.assignOp;
				p.add([pp(nc[0], d), " ", t ? tokens[t] : "", "=", " ", pp(nc[1], d)]);
				break;
	
			case HOOK:
				var nc = n.children;
				p.add(["(", pp(nc[0], d), " ? ", pp(nc[1], d), " : ", pp(nc[2], d), ")"]);
				break;
	
			case OR:
			case AND:
				var nc = n.children;
				p.add(["(", pp(nc[0], d), " ", tokens[n.type], " ", pp(nc[1], d), ")"]);
				break;
	
			case BITWISE_OR:
			case BITWISE_XOR:
			case BITWISE_AND:
			case EQ:
			case NE:
			case STRICT_EQ:
			case STRICT_NE:
			case LT:
			case LE:
			case GE:
			case GT:
			case IN:
			case INSTANCEOF:
			case LSH:
			case RSH:
			case URSH:
			case PLUS:
			case MINUS:
			case MUL:
			case DIV:
			case MOD:
				var nc = n.children;
				p.add(["(", pp(nc[0], d), " ", tokens[n.type], " ", pp(nc[1], d), ")"]);
				break;
	
			case DELETE:
			case VOID:
			case TYPEOF:
				p.add([tokens[n.type], " ", pp(n.children[0], d)]);
				break;
	
			case NOT:
			case BITWISE_NOT:
				p.add([tokens[n.type], pp(n.children[0], d)]);
				break;
	
			case UNARY_PLUS:
				p.add(["+", pp(n.children[0], d)]);
				break;
	
			case UNARY_MINUS:
				p.add(["-", pp(n.children[0], d)]);
				break;
	
			case INCREMENT:
			case DECREMENT:
				if (n.postfix) {
					p.add([pp(n.children[0], d), tokens[n.type]]);
				} else {
					p.add([tokens[n.type], pp(n.children[0], d)]);
				}
				break;
	
			case DOT:
				var nc = n.children;
				p.add([pp(nc[0], d), ".", pp(nc[1], d)]);
				break;
	
			case INDEX:
				var nc = n.children;
				p.add([pp(nc[0], d), "[", pp(nc[1], d), "]"]);
				break;
	
			case CALL:
				var nc = n.children;
				p.add([pp(nc[0], d), "(", pp(nc[1], d), ")"]);
				break;
	
			case NEW:
			case NEW_WITH_ARGS:
				var nc = n.children;
				p.add("new ");
				p.add(pp(nc[0], d));
				if (nc[1]) {
					p.add(["(", pp(nc[1], d), ")"]);
				}
				break;
	
			case ARRAY_INIT:
				p.add("[");
				var nc = n.children;
				for (var i = 0, j = nc.length; i < j; i++) {
					if(nc[i])
						p.add(pp(nc[i], d));
					p.add(",");
				}
				p.add("]");
				break;
	
			case ARRAY_COMP:
				p.add(["[", pp(n.expression, d), " ", pp(n.tail, d), "]"]);
				break;
	
			case COMP_TAIL:
				var nc = n.children;
				for (var i = 0, j = nc.length; i < j; i++) {
					if (i > 0)
						p.add(" ");
					p.add(pp(nc[i], d));
				}
				if (n.guard) {
					p.add([" if (", pp(n.guard, d), ")"]);
				}
				break;
	
			case OBJECT_INIT:
				var nc = n.children;
				if (nc[0] && nc[0].type === PROPERTY_INIT)
					p.add(countNewline("{\n"));
				else
					p.add("{");
				for (var i = 0, j = nc.length; i < j; i++) {
					if (i > 0) {
						p.add(countNewline(",\n"));
					}
	
					var t = nc[i];
					if (t.type === PROPERTY_INIT) {
						var tc = t.children;
						var l;
						// see if the left needs to be a string
						if (typeof tc[0].value === "string" && !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(tc[0].value)) {
							l = nodeStr(tc[0]);
						} else {
							l = pp(tc[0], d);
						}
						p.add([indent(2, l), ": ", indent(2, pp(tc[1], d)).stripPrefix(2)]);
					} else {
						p.add(indent(2, pp(t, d)));
					}
				}
				p.add(countNewline("\n}"));
				break;
	
			case NULL:
				p.add("null");
				break;
	
			case THIS:
				p.add("this");
				break;
	
			case TRUE:
				p.add("true");
				break;
	
			case FALSE:
				p.add("false");
				break;
	
			case IDENTIFIER:
			case NUMBER:
			case REGEXP:
				if (n.value.isOctal) p.add("0" + n.value.toString(8));
				else p.add(""+n.value);
				break;
	
			case STRING:
				p.add(nodeStr(n));
				break;
	
			case GROUP:
				p.add(["(", pp(n.children[0], d), ")"]);
				break;
	
			default:
				throw "PANIC: unknown operation " + tokens[n.type] + " " + n.toSource();
			}
	
			if (n.parenthesized)
				p.add(")");
	
			return p;
		}
	}
})(typeof exports !== 'undefined' ? exports : (window.Streamline = window.Streamline || {}));
