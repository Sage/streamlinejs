if (!Object.create || !Object.defineProperty || !Object.defineProperties) alert("Example will fail because your browser does not support ECMAScript 5. Try with another browser!");
var __filename = "" + window.location;

window.Streamline = { globals: {} };

function require(str) {
	if (str == "streamline/lib/util/flows") return Streamline.flows;
	else if (str == "streamline/lib/globals") return Streamline.globals;
	else if (str == "streamline/lib/version") return Streamline.version;
	else if (str == "streamline/lib/callbacks/runtime") return Streamline.runtime;
	else if (str == "streamline/lib/callbacks/transform") return Streamline;
	else if (str == "streamline/lib/callbacks/builtins") return Streamline.builtins;
	else if (str == "streamline/lib/util/future") return Streamline.future;
	else if (str == "streamline/lib/util/source-map") return Streamline.sourceMap.exports;
	else alert("cannot require " + str)
}
/* vim: set sw=4 ts=4 et tw=78: */
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
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Tom Austin <taustin@ucsc.edu>
 *   Brendan Eich <brendan@mozilla.org>
 *   Shu-Yu Guo <shu@rfrn.org>
 *   Dave Herman <dherman@mozilla.com>
 *   Dimitris Vardoulakis <dimvar@ccs.neu.edu>
 *   Patrick Walton <pcwalton@mozilla.com>
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

/*
 * Narcissus - JS implemented in JS.
 *
 * Well-known constants and lookup tables.  Many consts are generated from the
 * tokens table via eval to minimize redundancy, so consumers must be compiled
 * separately to take advantage of the simple switch-case constant propagation
 * done by SpiderMonkey.
 */

(function() {

    var narcissus = {
        options: {
            version: 185,
        },
        hostGlobal: this
    };
    Narcissus = narcissus;
})();

Narcissus.definitions = (function() {

    var tokens = [
        // End of source.
        "END",

        // Operators and punctuators.  Some pair-wise order matters, e.g. (+, -)
        // and (UNARY_PLUS, UNARY_MINUS).
        "\n", ";",
        ",",
        "=",
        "?", ":", "CONDITIONAL",
        "||",
        "&&",
        "|",
        "^",
        "&",
        "==", "!=", "===", "!==",
        "<", "<=", ">=", ">",
        "<<", ">>", ">>>",
        "+", "-",
        "*", "/", "%",
        "!", "~", "UNARY_PLUS", "UNARY_MINUS",
        "++", "--",
        ".",
        "[", "]",
        "{", "}",
        "(", ")",

        // Nonterminal tree node type codes.
        "SCRIPT", "BLOCK", "LABEL", "FOR_IN", "CALL", "NEW_WITH_ARGS", "INDEX",
        "ARRAY_INIT", "OBJECT_INIT", "PROPERTY_INIT", "GETTER", "SETTER",
        "GROUP", "LIST", "LET_BLOCK", "ARRAY_COMP", "GENERATOR", "COMP_TAIL",

        // Terminals.
        "IDENTIFIER", "NUMBER", "STRING", "REGEXP",

        // Keywords.
        "break",
        "case", "catch", "const", "continue",
        "debugger", "default", "delete", "do",
        "else",
        "false", "finally", "for", "function",
        "if", "in", "instanceof",
        "let",
        "new", "null",
        "return",
        "switch",
        "this", "throw", "true", "try", "typeof",
        "var", "void",
        "yield",
        "while", "with",
    ];

    var statementStartTokens = [
        "break",
        "const", "continue",
        "debugger", "do",
        "for",
        "if",
        "return",
        "switch",
        "throw", "try",
        "var",
        "yield",
        "while", "with",
    ];

    // Operator and punctuator mapping from token to tree node type name.
    // NB: because the lexer doesn't backtrack, all token prefixes must themselves
    // be valid tokens (e.g. !== is acceptable because its prefixes are the valid
    // tokens != and !).
    var opTypeNames = {
        '\n':   "NEWLINE",
        ';':    "SEMICOLON",
        ',':    "COMMA",
        '?':    "HOOK",
        ':':    "COLON",
        '||':   "OR",
        '&&':   "AND",
        '|':    "BITWISE_OR",
        '^':    "BITWISE_XOR",
        '&':    "BITWISE_AND",
        '===':  "STRICT_EQ",
        '==':   "EQ",
        '=':    "ASSIGN",
        '!==':  "STRICT_NE",
        '!=':   "NE",
        '<<':   "LSH",
        '<=':   "LE",
        '<':    "LT",
        '>>>':  "URSH",
        '>>':   "RSH",
        '>=':   "GE",
        '>':    "GT",
        '++':   "INCREMENT",
        '--':   "DECREMENT",
        '+':    "PLUS",
        '-':    "MINUS",
        '*':    "MUL",
        '/':    "DIV",
        '%':    "MOD",
        '!':    "NOT",
        '~':    "BITWISE_NOT",
        '.':    "DOT",
        '[':    "LEFT_BRACKET",
        ']':    "RIGHT_BRACKET",
        '{':    "LEFT_CURLY",
        '}':    "RIGHT_CURLY",
        '(':    "LEFT_PAREN",
        ')':    "RIGHT_PAREN"
    };

    // Hash of keyword identifier to tokens index.  NB: we must null __proto__ to
    // avoid toString, etc. namespace pollution.
    var keywords = {__proto__: null};

    // Define const END, etc., based on the token names.  Also map name to index.
    var tokenIds = {};

    // Building up a string to be eval'd in different contexts.
    var consts = "var ";
    for (var i = 0, j = tokens.length; i < j; i++) {
        if (i > 0)
            consts += ", ";
        var t = tokens[i];
        var name;
        if (/^[a-z]/.test(t)) {
            name = t.toUpperCase();
            keywords[t] = i;
        } else {
            name = (/^\W/.test(t) ? opTypeNames[t] : t);
        }
        consts += name + " = " + i;
        tokenIds[name] = i;
        tokens[t] = i;
    }
    consts += ";";

    var isStatementStartCode = {__proto__: null};
    for (i = 0, j = statementStartTokens.length; i < j; i++)
        isStatementStartCode[keywords[statementStartTokens[i]]] = true;

    // Map assignment operators to their indexes in the tokens array.
    var assignOps = ['|', '^', '&', '<<', '>>', '>>>', '+', '-', '*', '/', '%'];

    for (i = 0, j = assignOps.length; i < j; i++) {
        t = assignOps[i];
        assignOps[t] = tokens[t];
    }

    function defineGetter(obj, prop, fn, dontDelete, dontEnum) {
        Object.defineProperty(obj, prop,
                              { get: fn, configurable: !dontDelete, enumerable: !dontEnum });
    }

    function defineProperty(obj, prop, val, dontDelete, readOnly, dontEnum) {
        Object.defineProperty(obj, prop,
                              { value: val, writable: !readOnly, configurable: !dontDelete,
                                enumerable: !dontEnum });
    }

    // Returns true if fn is a native function.  (Note: SpiderMonkey specific.)
    function isNativeCode(fn) {
        // Relies on the toString method to identify native code.
        return ((typeof fn) === "function") && fn.toString().match(/\[native code\]/);
    }

    function getPropertyDescriptor(obj, name) {
        while (obj) {
            if (({}).hasOwnProperty.call(obj, name))
                return Object.getOwnPropertyDescriptor(obj, name);
            obj = Object.getPrototypeOf(obj);
        }
    }

    function getOwnProperties(obj) {
        var map = {};
        for (var name in Object.getOwnPropertyNames(obj))
            map[name] = Object.getOwnPropertyDescriptor(obj, name);
        return map;
    }

    function makePassthruHandler(obj) {
        // Handler copied from
        // http://wiki.ecmascript.org/doku.php?id=harmony:proxies&s=proxy%20object#examplea_no-op_forwarding_proxy
        return {
            getOwnPropertyDescriptor: function(name) {
                var desc = Object.getOwnPropertyDescriptor(obj, name);

                // a trapping proxy's properties must always be configurable
                desc.configurable = true;
                return desc;
            },
            getPropertyDescriptor: function(name) {
                var desc = getPropertyDescriptor(obj, name);

                // a trapping proxy's properties must always be configurable
                desc.configurable = true;
                return desc;
            },
            getOwnPropertyNames: function() {
                return Object.getOwnPropertyNames(obj);
            },
            defineProperty: function(name, desc) {
                Object.defineProperty(obj, name, desc);
            },
            "delete": function(name) { return delete obj[name]; },
            fix: function() {
                if (Object.isFrozen(obj)) {
                    return getOwnProperties(obj);
                }

                // As long as obj is not frozen, the proxy won't allow itself to be fixed.
                return undefined; // will cause a TypeError to be thrown
            },

            has: function(name) { return name in obj; },
            hasOwn: function(name) { return ({}).hasOwnProperty.call(obj, name); },
            get: function(receiver, name) { return obj[name]; },

            // bad behavior when set fails in non-strict mode
            set: function(receiver, name, val) { obj[name] = val; return true; },
            enumerate: function() {
                var result = [];
                for (name in obj) { result.push(name); };
                return result;
            },
            keys: function() { return Object.keys(obj); }
        };
    }

    // default function used when looking for a property in the global object
    function noPropFound() { return undefined; }

    var hasOwnProperty = ({}).hasOwnProperty;

    function StringMap() {
        this.table = Object.create(null, {});
        this.size = 0;
    }

    StringMap.prototype = {
        has: function(x) { return hasOwnProperty.call(this.table, x); },
        set: function(x, v) {
            if (!hasOwnProperty.call(this.table, x))
                this.size++;
            this.table[x] = v;
        },
        get: function(x) { return this.table[x]; },
        getDef: function(x, thunk) {
            if (!hasOwnProperty.call(this.table, x)) {
                this.size++;
                this.table[x] = thunk();
            }
            return this.table[x];
        },
        forEach: function(f) {
            var table = this.table;
            for (var key in table)
                f.call(this, key, table[key]);
        },
        toString: function() { return "[object StringMap]" }
    };

    // non-destructive stack
    function Stack(elts) {
        this.elts = elts || null;
    }

    Stack.prototype = {
        push: function(x) {
            return new Stack({ top: x, rest: this.elts });
        },
        top: function() {
            if (!this.elts)
                throw new Error("empty stack");
            return this.elts.top;
        },
        isEmpty: function() {
            return this.top === null;
        },
        find: function(test) {
            for (var elts = this.elts; elts; elts = elts.rest) {
                if (test(elts.top))
                    return elts.top;
            }
            return null;
        },
        has: function(x) {
            return Boolean(this.find(function(elt) { return elt === x }));
        },
        forEach: function(f) {
            for (var elts = this.elts; elts; elts = elts.rest) {
                f(elts.top);
            }
        }
    };

    return {
        tokens: tokens,
        opTypeNames: opTypeNames,
        keywords: keywords,
        isStatementStartCode: isStatementStartCode,
        tokenIds: tokenIds,
        consts: consts,
        assignOps: assignOps,
        defineGetter: defineGetter,
        defineProperty: defineProperty,
        isNativeCode: isNativeCode,
        makePassthruHandler: makePassthruHandler,
        noPropFound: noPropFound,
        StringMap: StringMap,
        Stack: Stack
    };
}());
/* vim: set sw=4 ts=4 et tw=78: */
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
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Tom Austin <taustin@ucsc.edu>
 *   Brendan Eich <brendan@mozilla.org>
 *   Shu-Yu Guo <shu@rfrn.org>
 *   Dave Herman <dherman@mozilla.com>
 *   Dimitris Vardoulakis <dimvar@ccs.neu.edu>
 *   Patrick Walton <pcwalton@mozilla.com>
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

/*
 * Narcissus - JS implemented in JS.
 *
 * Lexical scanner.
 */

Narcissus.lexer = (function() {

    var definitions = Narcissus.definitions;

    // Set constants in the local scope.
    eval(definitions.consts);

    // Build up a trie of operator tokens.
    var opTokens = {};
    for (var op in definitions.opTypeNames) {
        if (op === '\n' || op === '.')
            continue;

        var node = opTokens;
        for (var i = 0; i < op.length; i++) {
            var ch = op[i];
            if (!(ch in node))
                node[ch] = {};
            node = node[ch];
            node.op = op;
        }
    }

    /*
     * Tokenizer :: (source, filename, line number) -> Tokenizer
     */
    function Tokenizer(s, f, l) {
        this.cursor = 0;
        this.source = String(s);
        this.tokens = [];
        this.tokenIndex = 0;
        this.lookahead = 0;
        this.scanNewlines = false;
        this.unexpectedEOF = false;
        this.filename = f || "";
        this.lineno = l || 1;
    }

    Tokenizer.prototype = {
        get done() {
            // We need to set scanOperand to true here because the first thing
            // might be a regexp.
            return this.peek(true) === END;
        },

        get token() {
            return this.tokens[this.tokenIndex];
        },

        match: function (tt, scanOperand) {
            return this.get(scanOperand) === tt || this.unget();
        },

        mustMatch: function (tt) {
            if (!this.match(tt)) {
                throw this.newSyntaxError("Missing " +
                                          definitions.tokens[tt].toLowerCase());
            }
            return this.token;
        },

        forceIdentifier: function() {
        	if (!this.match(IDENTIFIER)) {
        		// keywords are valid property names in ES 5
        		if (this.get() >= definitions.keywords[0] || this.unget) {
        			this.token.type = IDENTIFIER;
        		}
        		else {
        			throw this.newSyntaxError("Missing identifier");
        		}
        	}
        	return this.token;
        },

        peek: function (scanOperand) {
            var tt, next;
            if (this.lookahead) {
                next = this.tokens[(this.tokenIndex + this.lookahead) & 3];
                tt = (this.scanNewlines && next.lineno !== this.lineno)
                     ? NEWLINE
                     : next.type;
            } else {
                tt = this.get(scanOperand);
                this.unget();
            }
            return tt;
        },

        peekOnSameLine: function (scanOperand) {
            this.scanNewlines = true;
            var tt = this.peek(scanOperand);
            this.scanNewlines = false;
            return tt;
        },

        // Eat comments and whitespace.
        skip: function () {
            var input = this.source;
            for (;;) {
                var ch = input[this.cursor++];
                var next = input[this.cursor];
                if (ch === '\n' && !this.scanNewlines) {
                    this.lineno++;
                } else if (ch === '/' && next === '*') {
                    this.cursor++;
                    for (;;) {
                        ch = input[this.cursor++];
                        if (ch === undefined)
                            throw this.newSyntaxError("Unterminated comment");

                        if (ch === '*') {
                            next = input[this.cursor];
                            if (next === '/') {
                                this.cursor++;
                                break;
                            }
                        } else if (ch === '\n') {
                            this.lineno++;
                        }
                    }
                } else if (ch === '/' && next === '/') {
                    this.cursor++;
                    for (;;) {
                        ch = input[this.cursor++];
                        if (ch === undefined)
                            return;

                        if (ch === '\n') {
                            this.lineno++;
                            break;
                        }
                    }
                } else if (ch !== ' ' && ch !== '\t') {
                    this.cursor--;
                    return;
                }
            }
        },

        // Lex the exponential part of a number, if present. Return true iff an
        // exponential part was found.
        lexExponent: function() {
            var input = this.source;
            var next = input[this.cursor];
            if (next === 'e' || next === 'E') {
                this.cursor++;
                ch = input[this.cursor++];
                if (ch === '+' || ch === '-')
                    ch = input[this.cursor++];

                if (ch < '0' || ch > '9')
                    throw this.newSyntaxError("Missing exponent");

                do {
                    ch = input[this.cursor++];
                } while (ch >= '0' && ch <= '9');
                this.cursor--;

                return true;
            }

            return false;
        },

        lexZeroNumber: function (ch) {
            var token = this.token, input = this.source;
            token.type = NUMBER;

            ch = input[this.cursor++];
            if (ch === '.') {
                do {
                    ch = input[this.cursor++];
                } while (ch >= '0' && ch <= '9');
                this.cursor--;

                this.lexExponent();
                token.value = parseFloat(input.substring(token.start, this.cursor));
            } else if (ch === 'x' || ch === 'X') {
                do {
                    ch = input[this.cursor++];
                } while ((ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') ||
                         (ch >= 'A' && ch <= 'F'));
                this.cursor--;

                token.value = parseInt(input.substring(token.start, this.cursor));
            } else if (ch >= '0' && ch <= '7') {
                do {
                    ch = input[this.cursor++];
                } while (ch >= '0' && ch <= '7');
                this.cursor--;

                token.value = parseInt(input.substring(token.start, this.cursor), 8);
                token.value.isOctal = true; // mark it to decomp as octal so that strict mode catches it
            } else {
                this.cursor--;
                this.lexExponent();     // 0E1, &c.
                token.value = 0;
            }
        },

        lexNumber: function (ch) {
            var token = this.token, input = this.source;
            token.type = NUMBER;

            var floating = false;
            do {
                ch = input[this.cursor++];
                if (ch === '.' && !floating) {
                    floating = true;
                    ch = input[this.cursor++];
                }
            } while (ch >= '0' && ch <= '9');

            this.cursor--;

            var exponent = this.lexExponent();
            floating = floating || exponent;

            var str = input.substring(token.start, this.cursor);
            token.value = floating ? parseFloat(str) : parseInt(str);
        },

        lexDot: function (ch) {
            var token = this.token, input = this.source;
            var next = input[this.cursor];
            if (next >= '0' && next <= '9') {
                do {
                    ch = input[this.cursor++];
                } while (ch >= '0' && ch <= '9');
                this.cursor--;

                this.lexExponent();

                token.type = NUMBER;
                token.value = parseFloat(input.substring(token.start, this.cursor));
            } else {
                token.type = DOT;
                token.assignOp = null;
                token.value = '.';
            }
        },

        lexString: function (ch) {
            var token = this.token, input = this.source;
            token.type = STRING;

            var hasEscapes = false;
            var delim = ch;
            while ((ch = input[this.cursor++]) !== delim) {
                if (this.cursor == input.length)
                    throw this.newSyntaxError("Unterminated string literal");
                if (ch === '\\') {
                    hasEscapes = true;
                    if (input[this.cursor] === '\n') this.lineno++; // fix for escaped newline
                    if (++this.cursor == input.length)
                        throw this.newSyntaxError("Unterminated string literal");
                }
            }

            token.value = hasEscapes
                          ? eval(input.substring(token.start, this.cursor))
                          : input.substring(token.start + 1, this.cursor - 1);
        },

        lexRegExp: function (ch) {
            var token = this.token, input = this.source;
            token.type = REGEXP;

            do {
                ch = input[this.cursor++];
                if (ch === '\\') {
                    this.cursor++;
                } else if (ch === '[') {
                    do {
                        if (ch === undefined)
                            throw this.newSyntaxError("Unterminated character class");

                        if (ch === '\\')
                            this.cursor++;

                        ch = input[this.cursor++];
                    } while (ch !== ']');
                } else if (ch === undefined) {
                    throw this.newSyntaxError("Unterminated regex");
                }
            } while (ch !== '/');

            do {
                ch = input[this.cursor++];
            } while (ch >= 'a' && ch <= 'z');

            this.cursor--;

            token.value = eval(input.substring(token.start, this.cursor));
        },

        lexOp: function (ch) {
            var token = this.token, input = this.source;

            // A bit ugly, but it seems wasteful to write a trie lookup routine
            // for only 3 characters...
            var node = opTokens[ch];
            var next = input[this.cursor];
            if (next in node) {
                node = node[next];
                this.cursor++;
                next = input[this.cursor];
                if (next in node) {
                    node = node[next];
                    this.cursor++;
                    next = input[this.cursor];
                }
            }

            var op = node.op;
            if (definitions.assignOps[op] && input[this.cursor] === '=') {
                this.cursor++;
                token.type = ASSIGN;
                token.assignOp = definitions.tokenIds[definitions.opTypeNames[op]];
                op += '=';
            } else {
                token.type = definitions.tokenIds[definitions.opTypeNames[op]];
                token.assignOp = null;
            }

            token.value = op;
        },

        // FIXME: Unicode escape sequences
        // FIXME: Unicode identifiers
        lexIdent: function (ch) {
            var token = this.token, input = this.source;

            do {
                ch = input[this.cursor++];
            } while ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') ||
                     (ch >= '0' && ch <= '9') || ch === '$' || ch === '_');

            this.cursor--;  // Put the non-word character back.

            var id = input.substring(token.start, this.cursor);
            token.type = definitions.keywords[id] || IDENTIFIER;
            token.value = id;
        },

        /*
         * Tokenizer.get :: void -> token type
         *
         * Consume input *only* if there is no lookahead.
         * Dispatch to the appropriate lexing function depending on the input.
         */
        get: function (scanOperand) {
            var token;
            while (this.lookahead) {
                --this.lookahead;
                this.tokenIndex = (this.tokenIndex + 1) & 3;
                token = this.tokens[this.tokenIndex];
                if (token.type !== NEWLINE || this.scanNewlines)
                    return token.type;
            }

            this.skip();

            this.tokenIndex = (this.tokenIndex + 1) & 3;
            token = this.tokens[this.tokenIndex];
            if (!token)
                this.tokens[this.tokenIndex] = token = {};

            var input = this.source;
            if (this.cursor === input.length)
                return token.type = END;

            token.start = this.cursor;
            token.lineno = this.lineno;

            var ch = input[this.cursor++];
            if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '$' || ch === '_') {
                this.lexIdent(ch);
            } else if (scanOperand && ch === '/') {
                this.lexRegExp(ch);
            } else if (ch in opTokens) {
                this.lexOp(ch);
            } else if (ch === '.') {
                this.lexDot(ch);
            } else if (ch >= '1' && ch <= '9') {
                this.lexNumber(ch);
            } else if (ch === '0') {
                this.lexZeroNumber(ch);
            } else if (ch === '"' || ch === "'") {
                this.lexString(ch);
            } else if (this.scanNewlines && ch === '\n') {
                token.type = NEWLINE;
                token.value = '\n';
                this.lineno++;
            } else {
                throw this.newSyntaxError("Illegal token");
            }

            token.end = this.cursor;
            return token.type;
        },

        /*
         * Tokenizer.unget :: void -> undefined
         *
         * Match depends on unget returning undefined.
         */
        unget: function () {
            if (++this.lookahead === 4) throw "PANIC: too much lookahead!";
            this.tokenIndex = (this.tokenIndex - 1) & 3;
        },

        newSyntaxError: function (m) {
            var e = new SyntaxError(this.filename + ":" + this.lineno + ":" + m);
            e.source = this.source;
            e.cursor = this.lookahead
                       ? this.tokens[(this.tokenIndex + this.lookahead) & 3].start
                       : this.cursor;
            return e;
        },
    };

    return { Tokenizer: Tokenizer };

}());
/* -*- Mode: JS; tab-width: 4; indent-tabs-mode: nil; -*-
 * vim: set sw=4 ts=4 et tw=78:
 * ***** BEGIN LICENSE BLOCK *****
 *
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
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Tom Austin <taustin@ucsc.edu>
 *   Brendan Eich <brendan@mozilla.org>
 *   Shu-Yu Guo <shu@rfrn.org>
 *   Dave Herman <dherman@mozilla.com>
 *   Dimitris Vardoulakis <dimvar@ccs.neu.edu>
 *   Patrick Walton <pcwalton@mozilla.com>
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

/*
 * Narcissus - JS implemented in JS.
 *
 * Parser.
 */

Narcissus.parser = (function() {

    var lexer = Narcissus.lexer;
    var definitions = Narcissus.definitions;

    const StringMap = definitions.StringMap;
    const Stack = definitions.Stack;

    // Set constants in the local scope.
    eval(definitions.consts);

    /*
     * pushDestructuringVarDecls :: (node, hoisting node) -> void
     *
     * Recursively add all destructured declarations to varDecls.
     */
    function pushDestructuringVarDecls(n, s) {
        for (var i in n) {
            var sub = n[i];
            if (sub.type === IDENTIFIER) {
                s.varDecls.push(sub);
            } else {
                pushDestructuringVarDecls(sub, s);
            }
        }
    }

    // NESTING_TOP: top-level
    // NESTING_SHALLOW: nested within static forms such as { ... } or labeled statement
    // NESTING_DEEP: nested within dynamic forms such as if, loops, etc.
    const NESTING_TOP = 0, NESTING_SHALLOW = 1, NESTING_DEEP = 2;

    function StaticContext(parentScript, parentBlock, inFunction, inForLoopInit, nesting) {
        this.parentScript = parentScript;
        this.parentBlock = parentBlock;
        this.inFunction = inFunction;
        this.inForLoopInit = inForLoopInit;
        this.nesting = nesting;
        this.allLabels = new Stack();
        this.currentLabels = new Stack();
        this.labeledTargets = new Stack();
        this.defaultTarget = null;
        Narcissus.options.ecma3OnlyMode && (this.ecma3OnlyMode = true);
        Narcissus.options.parenFreeMode && (this.parenFreeMode = true);
    }

    StaticContext.prototype = {
        ecma3OnlyMode: false,
        parenFreeMode: false,
        // non-destructive update via prototype extension
        update: function(ext) {
            var desc = {};
            for (var key in ext) {
                desc[key] = {
                    value: ext[key],
                    writable: true,
                    enumerable: true,
                    configurable: true
                }
            }
            return Object.create(this, desc);
        },
        pushLabel: function(label) {
            return this.update({ currentLabels: this.currentLabels.push(label),
                                 allLabels: this.allLabels.push(label) });
        },
        pushTarget: function(target) {
            var isDefaultTarget = target.isLoop || target.type === SWITCH;
            if (isDefaultTarget) target.target = this.defaultTarget;

            if (this.currentLabels.isEmpty()) {
                return isDefaultTarget
                     ? this.update({ defaultTarget: target })
                     : this;
            }

            target.labels = new StringMap();
            this.currentLabels.forEach(function(label) {
                target.labels.set(label, true);
            });
            return this.update({ currentLabels: new Stack(),
                                 labeledTargets: this.labeledTargets.push(target),
                                 defaultTarget: isDefaultTarget
                                                ? target
                                                : this.defaultTarget });
        },
        nest: function(atLeast) {
            var nesting = Math.max(this.nesting, atLeast);
            return (nesting !== this.nesting)
                 ? this.update({ nesting: nesting })
                 : this;
        }
    };

    /*
     * Script :: (tokenizer, boolean) -> node
     *
     * Parses the toplevel and function bodies.
     */
    function Script(t, inFunction) {
        var n = new Node(t, scriptInit());
        var x = new StaticContext(n, n, inFunction, false, NESTING_TOP);
        Statements(t, x, n);
        return n;
    }

    // We extend Array slightly with a top-of-stack method.
    definitions.defineProperty(Array.prototype, "top",
                               function() {
                                   return this.length && this[this.length-1];
                               }, false, false, true);

    /*
     * Node :: (tokenizer, optional init object) -> node
     */
    function Node(t, init) {
        var token = t.token;
        if (token) {
            // If init.type exists it will override token.type.
            this.type = token.type;
            this.value = token.value;
            this.lineno = token.lineno;

            // Start and end are file positions for error handling.
            this.start = token.start;
            this.end = token.end;
        } else {
            this.lineno = t.lineno;
        }

        // Node uses a tokenizer for debugging (getSource, filename getter).
        this.tokenizer = t;
        this.children = [];

        for (var prop in init)
            this[prop] = init[prop];
    }

    var Np = Node.prototype = {};
    Np.constructor = Node;
    Np.toSource = Object.prototype.toSource;

    // Always use push to add operands to an expression, to update start and end.
    Np.push = function (kid) {
        // kid can be null e.g. [1, , 2].
        if (kid !== null) {
            if (kid.start < this.start)
                this.start = kid.start;
            if (this.end < kid.end)
                this.end = kid.end;
        }
        return this.children.push(kid);
    }

    Node.indentLevel = 0;

    function tokenString(tt) {
        var t = definitions.tokens[tt];
        return /^\W/.test(t) ? definitions.opTypeNames[t] : t.toUpperCase();
    }

    Np.toString = function () {
        var a = [];
        for (var i in this) {
            if (this.hasOwnProperty(i) && i !== 'type' && i !== 'target')
                a.push({id: i, value: this[i]});
        }
        a.sort(function (a,b) { return (a.id < b.id) ? -1 : 1; });
        const INDENTATION = "    ";
        var n = ++Node.indentLevel;
        var s = "{\n" + INDENTATION.repeat(n) + "type: " + tokenString(this.type);
        for (i = 0; i < a.length; i++)
            s += ", " + a[i].id + ": " + a[i].value;
            //s += ",\n" + INDENTATION.repeat(n) + a[i].id + ": " + a[i].value;
        n = --Node.indentLevel;
        s += "\n" + INDENTATION.repeat(n) + "}";
        return s;
    }

    Np.getSource = function () {
        return this.tokenizer.source.slice(this.start, this.end);
    };

    /*
     * Helper init objects for common nodes.
     */

    const LOOP_INIT = { isLoop: true };

    function blockInit() {
        return { type: BLOCK, varDecls: [] };
    }

    function scriptInit() {
        return { type: SCRIPT,
                 funDecls: [],
                 varDecls: [],
                 modDecls: [],
                 impDecls: [],
                 expDecls: [],
                 loadDeps: [],
                 hasEmptyReturn: false,
                 hasReturnWithValue: false,
                 isGenerator: false };
    }

    definitions.defineGetter(Np, "filename",
                             function() {
                                 return this.tokenizer.filename;
                             });

    definitions.defineGetter(Np, "length",
                             function() {
                                 throw new Error("Node.prototype.length is gone; " +
                                                 "use n.children.length instead");
                             });

    definitions.defineProperty(String.prototype, "repeat",
                               function(n) {
                                   var s = "", t = this + s;
                                   while (--n >= 0)
                                       s += t;
                                   return s;
                               }, false, false, true);

    function MaybeLeftParen(t, x) {
        if (x.parenFreeMode)
            return t.match(LEFT_PAREN) ? LEFT_PAREN : END;
        return t.mustMatch(LEFT_PAREN).type;
    }

    function MaybeRightParen(t, p) {
        if (p === LEFT_PAREN)
            t.mustMatch(RIGHT_PAREN);
    }

    /*
     * Statements :: (tokenizer, compiler context, node) -> void
     *
     * Parses a sequence of Statements.
     */
    function Statements(t, x, n) {
        try {
            while (!t.done && t.peek(true) !== RIGHT_CURLY)
                n.push(Statement(t, x));
        } catch (e) {
            if (t.done)
                t.unexpectedEOF = true;
            throw e;
        }
    }

    function Block(t, x) {
        t.mustMatch(LEFT_CURLY);
        var n = new Node(t, blockInit());
        Statements(t, x.update({ parentBlock: n }).pushTarget(n), n);
        t.mustMatch(RIGHT_CURLY);
        n.end = t.token.end;
        return n;
    }

    const DECLARED_FORM = 0, EXPRESSED_FORM = 1, STATEMENT_FORM = 2;

    /*
     * Statement :: (tokenizer, compiler context) -> node
     *
     * Parses a Statement.
     */
    function Statement(t, x) {
        var i, label, n, n2, p, c, ss, tt = t.get(true), tt2, x2, x3;

        // Cases for statements ending in a right curly return early, avoiding the
        // common semicolon insertion magic after this switch.
        switch (tt) {
          case FUNCTION:
            // DECLARED_FORM extends funDecls of x, STATEMENT_FORM doesn't.
            return FunctionDefinition(t, x, true,
                                      (x.nesting !== NESTING_TOP)
                                      ? STATEMENT_FORM
                                      : DECLARED_FORM);

          case LEFT_CURLY:
            n = new Node(t, blockInit());
            Statements(t, x.update({ parentBlock: n }).pushTarget(n).nest(NESTING_SHALLOW), n);
            t.mustMatch(RIGHT_CURLY);
            n.end = t.token.end;
            return n;

          case IF:
            n = new Node(t);
            n.condition = HeadExpression(t, x);
            x2 = x.pushTarget(n).nest(NESTING_DEEP);
            n.thenPart = Statement(t, x2);
            n.elsePart = t.match(ELSE) ? Statement(t, x2) : null;
            return n;

          case SWITCH:
            // This allows CASEs after a DEFAULT, which is in the standard.
            n = new Node(t, { cases: [], defaultIndex: -1 });
            n.discriminant = HeadExpression(t, x);
            x2 = x.pushTarget(n).nest(NESTING_DEEP);
            t.mustMatch(LEFT_CURLY);
            while ((tt = t.get()) !== RIGHT_CURLY) {
                switch (tt) {
                  case DEFAULT:
                    if (n.defaultIndex >= 0)
                        throw t.newSyntaxError("More than one switch default");
                    // FALL THROUGH
                  case CASE:
                    n2 = new Node(t);
                    if (tt === DEFAULT)
                        n.defaultIndex = n.cases.length;
                    else
                        n2.caseLabel = Expression(t, x2, COLON);
                    break;

                  default:
                    throw t.newSyntaxError("Invalid switch case");
                }
                t.mustMatch(COLON);
                n2.statements = new Node(t, blockInit());
                while ((tt=t.peek(true)) !== CASE && tt !== DEFAULT &&
                        tt !== RIGHT_CURLY)
                    n2.statements.push(Statement(t, x2));
                n.cases.push(n2);
            }
            n.end = t.token.end;
            return n;

          case FOR:
            n = new Node(t, LOOP_INIT);
            if (t.match(IDENTIFIER)) {
                if (t.token.value === "each")
                    n.isEach = true;
                else
                    t.unget();
            }
            if (!x.parenFreeMode)
                t.mustMatch(LEFT_PAREN);
            x2 = x.pushTarget(n).nest(NESTING_DEEP);
            x3 = x.update({ inForLoopInit: true });
            if ((tt = t.peek()) !== SEMICOLON) {
                if (tt === VAR || tt === CONST) {
                    t.get();
                    n2 = Variables(t, x3);
                } else if (tt === LET) {
                    t.get();
                    if (t.peek() === LEFT_PAREN) {
                        n2 = LetBlock(t, x3, false);
                    } else {
                        // Let in for head, we need to add an implicit block
                        // around the rest of the for.
                        x3.parentBlock = n;
                        n.varDecls = [];
                        n2 = Variables(t, x3);
                    }
                } else {
                    n2 = Expression(t, x3);
                }
            }
            if (n2 && t.match(IN)) {
                n.type = FOR_IN;
                n.object = Expression(t, x3);
                if (n2.type === VAR || n2.type === LET) {
                    c = n2.children;

                    // Destructuring turns one decl into multiples, so either
                    // there must be only one destructuring or only one
                    // decl.
                    if (c.length !== 1 && n2.destructurings.length !== 1) {
                        throw new SyntaxError("Invalid for..in left-hand side",
                                              t.filename, n2.lineno);
                    }
                    if (n2.destructurings.length > 0) {
                        n.iterator = n2.destructurings[0];
                    } else {
                        n.iterator = c[0];
                    }
                    n.varDecl = n2;
                } else {
                    if (n2.type === ARRAY_INIT || n2.type === OBJECT_INIT) {
                        n2.destructuredNames = checkDestructuring(t, x3, n2);
                    }
                    n.iterator = n2;
                }
            } else {
                n.setup = n2;
                t.mustMatch(SEMICOLON);
                if (n.isEach)
                    throw t.newSyntaxError("Invalid for each..in loop");
                n.condition = (t.peek() === SEMICOLON)
                              ? null
                              : Expression(t, x3);
                t.mustMatch(SEMICOLON);
                tt2 = t.peek();
                n.update = (x.parenFreeMode
                            ? tt2 === LEFT_CURLY || definitions.isStatementStartCode[tt2]
                            : tt2 === RIGHT_PAREN)
                           ? null
                           : Expression(t, x3);
            }
            if (!x.parenFreeMode)
                t.mustMatch(RIGHT_PAREN);
            n.body = Statement(t, x2);
            n.end = t.token.end;
            return n;

          case WHILE:
            n = new Node(t, { isLoop: true });
            n.condition = HeadExpression(t, x);
            n.body = Statement(t, x.pushTarget(n).nest(NESTING_DEEP));
            n.end = t.token.end;
            return n;

          case DO:
            n = new Node(t, { isLoop: true });
            n.body = Statement(t, x.pushTarget(n).nest(NESTING_DEEP));
            t.mustMatch(WHILE);
            n.condition = HeadExpression(t, x);
            if (!x.ecmaStrictMode) {
                // <script language="JavaScript"> (without version hints) may need
                // automatic semicolon insertion without a newline after do-while.
                // See http://bugzilla.mozilla.org/show_bug.cgi?id=238945.
                t.match(SEMICOLON);
                n.end = t.token.end;
                return n;
            }
            break;

          case BREAK:
          case CONTINUE:
            n = new Node(t);

            // handle the |foo: break foo;| corner case
            x2 = x.pushTarget(n);

            if (t.peekOnSameLine() === IDENTIFIER) {
                t.get();
                n.label = t.token.value;
            }

            n.target = n.label
                     ? x2.labeledTargets.find(function(target) { return target.labels.has(n.label) })
                     : x2.defaultTarget;

            if (!n.target)
                throw t.newSyntaxError("Invalid " + ((tt === BREAK) ? "break" : "continue"));
            //if (!n.target.isLoop && tt === CONTINUE)
            //    throw t.newSyntaxError("Invalid continue");
            if (tt === CONTINUE) {
                for (var ttt = n.target; ttt && !ttt.isLoop; ttt = ttt.target)
                    ;
                if (!ttt) throw t.newSyntaxError("Invalid continue");
            }

            break;

          case TRY:
            n = new Node(t, { catchClauses: [] });
            n.tryBlock = Block(t, x);
            while (t.match(CATCH)) {
                n2 = new Node(t);
                p = MaybeLeftParen(t, x);
                switch (t.get()) {
                  case LEFT_BRACKET:
                  case LEFT_CURLY:
                    // Destructured catch identifiers.
                    t.unget();
                    n2.varName = DestructuringExpression(t, x, true);
                    break;
                  case IDENTIFIER:
                    n2.varName = t.token.value;
                    break;
                  default:
                    throw t.newSyntaxError("missing identifier in catch");
                    break;
                }
                if (t.match(IF)) {
                    if (x.ecma3OnlyMode)
                        throw t.newSyntaxError("Illegal catch guard");
                    if (n.catchClauses.length && !n.catchClauses.top().guard)
                        throw t.newSyntaxError("Guarded catch after unguarded");
                    n2.guard = Expression(t, x);
                }
                MaybeRightParen(t, p);
                n2.block = Block(t, x);
                n.catchClauses.push(n2);
            }
            if (t.match(FINALLY))
                n.finallyBlock = Block(t, x);
            if (!n.catchClauses.length && !n.finallyBlock)
                throw t.newSyntaxError("Invalid try statement");
            n.end = t.token.end;
            return n;

          case CATCH:
          case FINALLY:
            throw t.newSyntaxError(definitions.tokens[tt] + " without preceding try");

          case THROW:
            n = new Node(t);
            n.exception = Expression(t, x);
            break;

          case RETURN:
            n = ReturnOrYield(t, x);
            break;

          case WITH:
            n = new Node(t);
            n.object = HeadExpression(t, x);
            n.body = Statement(t, x.pushTarget(n).nest(NESTING_DEEP));
            n.end = t.token.end;
            return n;

          case VAR:
          case CONST:
            n = Variables(t, x);
            n.eligibleForASI = true;
            break;

          case LET:
            if (t.peek() === LEFT_PAREN)
                n = LetBlock(t, x, true);
            else
                n = Variables(t, x);
            n.eligibleForASI = true;
            break;

          case DEBUGGER:
            n = new Node(t);
            break;

          case NEWLINE:
          case SEMICOLON:
            n = new Node(t, { type: SEMICOLON });
            n.expression = null;
            return n;

          default:
            if (tt === IDENTIFIER) {
                tt = t.peek();
                // Labeled statement.
                if (tt === COLON) {
                    label = t.token.value;
                    if (x.allLabels.has(label))
                        throw t.newSyntaxError("Duplicate label");
                    t.get();
                    n = new Node(t, { type: LABEL, label: label });
                    n.statement = Statement(t, x.pushLabel(label).nest(NESTING_SHALLOW));
                    n.target = (n.statement.type === LABEL) ? n.statement.target : n.statement;
                    n.end = t.token.end;
                    return n;
                }
            }

            // Expression statement.
            // We unget the current token to parse the expression as a whole.
            n = new Node(t, { type: SEMICOLON });
            t.unget();
            n.expression = Expression(t, x);
            n.end = n.expression.end;
            break;
        }

        MagicalSemicolon(t);
        n.end = t.token.end;
        return n;
    }

    function MagicalSemicolon(t) {
        var tt;
        if (t.lineno === t.token.lineno) {
            tt = t.peekOnSameLine();
            if (tt !== END && tt !== NEWLINE && tt !== SEMICOLON && tt !== RIGHT_CURLY)
                throw t.newSyntaxError("missing ; before statement");
        }
        t.match(SEMICOLON);
    }

    function ReturnOrYield(t, x) {
        var n, b, tt = t.token.type, tt2;

        var parentScript = x.parentScript;

        if (tt === RETURN) {
            // Disabled test because node accepts return at top level in modules
            if (false && !x.inFunction)
                throw t.newSyntaxError("Return not in function");
        } else /* if (tt === YIELD) */ {
            if (!x.inFunction)
                throw t.newSyntaxError("Yield not in function");
            parentScript.isGenerator = true;
        }
        n = new Node(t, { value: undefined });

        tt2 = t.peek(true);
        if (tt2 !== END && tt2 !== NEWLINE &&
            tt2 !== SEMICOLON && tt2 !== RIGHT_CURLY
            && (tt !== YIELD ||
                (tt2 !== tt && tt2 !== RIGHT_BRACKET && tt2 !== RIGHT_PAREN &&
                 tt2 !== COLON && tt2 !== COMMA))) {
            if (tt === RETURN) {
                n.value = Expression(t, x);
                parentScript.hasReturnWithValue = true;
            } else {
                n.value = AssignExpression(t, x);
            }
        } else if (tt === RETURN) {
            parentScript.hasEmptyReturn = true;
        }

        // Disallow return v; in generator.
        if (parentScript.hasReturnWithValue && parentScript.isGenerator)
            throw t.newSyntaxError("Generator returns a value");

        return n;
    }

    /*
     * FunctionDefinition :: (tokenizer, compiler context, boolean,
     *                        DECLARED_FORM or EXPRESSED_FORM or STATEMENT_FORM)
     *                    -> node
     */
    function FunctionDefinition(t, x, requireName, functionForm) {
        var tt;
        var f = new Node(t, { params: [] });
        if (f.type !== FUNCTION)
            f.type = (f.value === "get") ? GETTER : SETTER;
        if (t.match(IDENTIFIER))
            f.name = t.token.value;
        else if (requireName)
            throw t.newSyntaxError("missing function identifier");

        var x2 = new StaticContext(null, null, true, false, NESTING_TOP);

        t.mustMatch(LEFT_PAREN);
        if (!t.match(RIGHT_PAREN)) {
            do {
                switch (t.get()) {
                  case LEFT_BRACKET:
                  case LEFT_CURLY:
                    // Destructured formal parameters.
                    t.unget();
                    f.params.push(DestructuringExpression(t, x2));
                    break;
                  case IDENTIFIER:
                    f.params.push(t.token.value);
                    break;
                  default:
                    throw t.newSyntaxError("missing formal parameter");
                    break;
                }
            } while (t.match(COMMA));
            t.mustMatch(RIGHT_PAREN);
        }

        // Do we have an expression closure or a normal body?
        tt = t.get();
        if (tt !== LEFT_CURLY)
            t.unget();

        if (tt !== LEFT_CURLY) {
            f.body = AssignExpression(t, x2);
            if (f.body.isGenerator)
                throw t.newSyntaxError("Generator returns a value");
        } else {
            f.body = Script(t, true);
        }

        if (tt === LEFT_CURLY)
            t.mustMatch(RIGHT_CURLY);

        f.end = t.token.end;
        f.functionForm = functionForm;
        if (functionForm === DECLARED_FORM)
            x.parentScript.funDecls.push(f);
        return f;
    }

    /*
     * Variables :: (tokenizer, compiler context) -> node
     *
     * Parses a comma-separated list of var declarations (and maybe
     * initializations).
     */
    function Variables(t, x, letBlock) {
        var n, n2, ss, i, s, tt;

        tt = t.token.type;
        switch (tt) {
          case VAR:
          case CONST:
            s = x.parentScript;
            break;
          case LET:
            s = x.parentBlock;
            break;
          case LEFT_PAREN:
            tt = LET;
            s = letBlock;
            break;
        }

        n = new Node(t, { type: tt, destructurings: [] });

        do {
            tt = t.get();
            if (tt === LEFT_BRACKET || tt === LEFT_CURLY) {
                // Need to unget to parse the full destructured expression.
                t.unget();

                var dexp = DestructuringExpression(t, x, true);

                n2 = new Node(t, { type: IDENTIFIER,
                                   name: dexp,
                                   readOnly: n.type === CONST });
                n.push(n2);
                pushDestructuringVarDecls(n2.name.destructuredNames, s);
                n.destructurings.push({ exp: dexp, decl: n2 });

                if (x.inForLoopInit && t.peek() === IN) {
                    continue;
                }

                t.mustMatch(ASSIGN);
                if (t.token.assignOp)
                    throw t.newSyntaxError("Invalid variable initialization");

                n2.initializer = AssignExpression(t, x);

                continue;
            }

            if (tt !== IDENTIFIER)
                throw t.newSyntaxError("missing variable name");

            n2 = new Node(t, { type: IDENTIFIER,
                               name: t.token.value,
                               readOnly: n.type === CONST });
            n.push(n2);
            s.varDecls.push(n2);

            if (t.match(ASSIGN)) {
                if (t.token.assignOp)
                    throw t.newSyntaxError("Invalid variable initialization");

                n2.initializer = AssignExpression(t, x);
            }
        } while (t.match(COMMA));

        n.end = t.token.end;
        return n;
    }

    /*
     * LetBlock :: (tokenizer, compiler context, boolean) -> node
     *
     * Does not handle let inside of for loop init.
     */
    function LetBlock(t, x, isStatement) {
        var n, n2;

        // t.token.type must be LET
        n = new Node(t, { type: LET_BLOCK, varDecls: [] });
        t.mustMatch(LEFT_PAREN);
        n.variables = Variables(t, x, n);
        t.mustMatch(RIGHT_PAREN);

        if (isStatement && t.peek() !== LEFT_CURLY) {
            /*
             * If this is really an expression in let statement guise, then we
             * need to wrap the LET_BLOCK node in a SEMICOLON node so that we pop
             * the return value of the expression.
             */
            n2 = new Node(t, { type: SEMICOLON,
                               expression: n });
            isStatement = false;
        }

        if (isStatement)
            n.block = Block(t, x);
        else
            n.expression = AssignExpression(t, x);

        return n;
    }

    function checkDestructuring(t, x, n, simpleNamesOnly) {
        if (n.type === ARRAY_COMP)
            throw t.newSyntaxError("Invalid array comprehension left-hand side");
        if (n.type !== ARRAY_INIT && n.type !== OBJECT_INIT)
            return;

        var lhss = {};
        var nn, n2, idx, sub, cc, c = n.children;
        for (var i = 0, j = c.length; i < j; i++) {
            if (!(nn = c[i]))
                continue;
            if (nn.type === PROPERTY_INIT) {
                cc = nn.children;
                sub = cc[1];
                idx = cc[0].value;
            } else if (n.type === OBJECT_INIT) {
                // Do we have destructuring shorthand {foo, bar}?
                sub = nn;
                idx = nn.value;
            } else {
                sub = nn;
                idx = i;
            }

            if (sub.type === ARRAY_INIT || sub.type === OBJECT_INIT) {
                lhss[idx] = checkDestructuring(t, x, sub, simpleNamesOnly);
            } else {
                if (simpleNamesOnly && sub.type !== IDENTIFIER) {
                    // In declarations, lhs must be simple names
                    throw t.newSyntaxError("missing name in pattern");
                }

                lhss[idx] = sub;
            }
        }

        return lhss;
    }

    function DestructuringExpression(t, x, simpleNamesOnly) {
        var n = PrimaryExpression(t, x);
        // Keep the list of lefthand sides for varDecls
        n.destructuredNames = checkDestructuring(t, x, n, simpleNamesOnly);
        return n;
    }

    function GeneratorExpression(t, x, e) {
        return new Node(t, { type: GENERATOR,
                             expression: e,
                             tail: ComprehensionTail(t, x) });
    }

    function ComprehensionTail(t, x) {
        var body, n, n2, n3, p;

        // t.token.type must be FOR
        body = new Node(t, { type: COMP_TAIL });

        do {
            // Comprehension tails are always for..in loops.
            n = new Node(t, { type: FOR_IN, isLoop: true });
            if (t.match(IDENTIFIER)) {
                // But sometimes they're for each..in.
                if (t.token.value === "each")
                    n.isEach = true;
                else
                    t.unget();
            }
            p = MaybeLeftParen(t, x);
            switch(t.get()) {
              case LEFT_BRACKET:
              case LEFT_CURLY:
                t.unget();
                // Destructured left side of for in comprehension tails.
                n.iterator = DestructuringExpression(t, x);
                break;

              case IDENTIFIER:
                n.iterator = n3 = new Node(t, { type: IDENTIFIER });
                n3.name = n3.value;
                n.varDecl = n2 = new Node(t, { type: VAR });
                n2.push(n3);
                x.parentScript.varDecls.push(n3);
                // Don't add to varDecls since the semantics of comprehensions is
                // such that the variables are in their own function when
                // desugared.
                break;

              default:
                throw t.newSyntaxError("missing identifier");
            }
            t.mustMatch(IN);
            n.object = Expression(t, x);
            MaybeRightParen(t, p);
            body.push(n);
        } while (t.match(FOR));

        // Optional guard.
        if (t.match(IF))
            body.guard = HeadExpression(t, x);

        return body;
    }

    function HeadExpression(t, x) {
        var p = MaybeLeftParen(t, x);
        var n = ParenExpression(t, x);
        MaybeRightParen(t, p);
        if (p === END && !n.parenthesized) {
            var tt = t.peek();
            if (tt !== LEFT_CURLY && !definitions.isStatementStartCode[tt])
                throw t.newSyntaxError("Unparenthesized head followed by unbraced body");
        }
        return n;
    }

    function ParenExpression(t, x) {
        // Always accept the 'in' operator in a parenthesized expression,
        // where it's unambiguous, even if we might be parsing the init of a
        // for statement.
        var n = Expression(t, x.update({ inForLoopInit: x.inForLoopInit &&
                                                        (t.token.type === LEFT_PAREN) }));

        if (t.match(FOR)) {
            if (n.type === YIELD && !n.parenthesized)
                throw t.newSyntaxError("Yield expression must be parenthesized");
            if (n.type === COMMA && !n.parenthesized)
                throw t.newSyntaxError("Generator expression must be parenthesized");
            n = GeneratorExpression(t, x, n);
        }

        return n;
    }

    /*
     * Expression :: (tokenizer, compiler context) -> node
     *
     * Top-down expression parser matched against SpiderMonkey.
     */
    function Expression(t, x) {
        var n, n2;

        n = AssignExpression(t, x);
        if (t.match(COMMA)) {
            n2 = new Node(t, { type: COMMA });
            n2.push(n);
            n = n2;
            do {
                n2 = n.children[n.children.length-1];
                if (n2.type === YIELD && !n2.parenthesized)
                    throw t.newSyntaxError("Yield expression must be parenthesized");
                n.push(AssignExpression(t, x));
            } while (t.match(COMMA));
        }

        return n;
    }

    function AssignExpression(t, x) {
        var n, lhs;

        // Have to treat yield like an operand because it could be the leftmost
        // operand of the expression.
        if (t.match(YIELD, true))
            return ReturnOrYield(t, x);

        n = new Node(t, { type: ASSIGN });
        lhs = ConditionalExpression(t, x);

        if (!t.match(ASSIGN)) {
            return lhs;
        }

        switch (lhs.type) {
          case OBJECT_INIT:
          case ARRAY_INIT:
            lhs.destructuredNames = checkDestructuring(t, x, lhs);
            // FALL THROUGH
          case IDENTIFIER: case DOT: case INDEX: case CALL:
            break;
          default:
            throw t.newSyntaxError("Bad left-hand side of assignment");
            break;
        }

        n.assignOp = t.token.assignOp;
        n.push(lhs);
        n.push(AssignExpression(t, x));

        return n;
    }

    function ConditionalExpression(t, x) {
        var n, n2;

        n = OrExpression(t, x);
        if (t.match(HOOK)) {
            n2 = n;
            n = new Node(t, { type: HOOK });
            n.push(n2);
            /*
             * Always accept the 'in' operator in the middle clause of a ternary,
             * where it's unambiguous, even if we might be parsing the init of a
             * for statement.
             */
            n.push(AssignExpression(t, x.update({ inForLoopInit: false })));
            if (!t.match(COLON))
                throw t.newSyntaxError("missing : after ?");
            n.push(AssignExpression(t, x));
        }

        return n;
    }

    function OrExpression(t, x) {
        var n, n2;

        n = AndExpression(t, x);
        while (t.match(OR)) {
            n2 = new Node(t);
            n2.push(n);
            n2.push(AndExpression(t, x));
            n = n2;
        }

        return n;
    }

    function AndExpression(t, x) {
        var n, n2;

        n = BitwiseOrExpression(t, x);
        while (t.match(AND)) {
            n2 = new Node(t);
            n2.push(n);
            n2.push(BitwiseOrExpression(t, x));
            n = n2;
        }

        return n;
    }

    function BitwiseOrExpression(t, x) {
        var n, n2;

        n = BitwiseXorExpression(t, x);
        while (t.match(BITWISE_OR)) {
            n2 = new Node(t);
            n2.push(n);
            n2.push(BitwiseXorExpression(t, x));
            n = n2;
        }

        return n;
    }

    function BitwiseXorExpression(t, x) {
        var n, n2;

        n = BitwiseAndExpression(t, x);
        while (t.match(BITWISE_XOR)) {
            n2 = new Node(t);
            n2.push(n);
            n2.push(BitwiseAndExpression(t, x));
            n = n2;
        }

        return n;
    }

    function BitwiseAndExpression(t, x) {
        var n, n2;

        n = EqualityExpression(t, x);
        while (t.match(BITWISE_AND)) {
            n2 = new Node(t);
            n2.push(n);
            n2.push(EqualityExpression(t, x));
            n = n2;
        }

        return n;
    }

    function EqualityExpression(t, x) {
        var n, n2;

        n = RelationalExpression(t, x);
        while (t.match(EQ) || t.match(NE) ||
               t.match(STRICT_EQ) || t.match(STRICT_NE)) {
            n2 = new Node(t);
            n2.push(n);
            n2.push(RelationalExpression(t, x));
            n = n2;
        }

        return n;
    }

    function RelationalExpression(t, x) {
        var n, n2;

        /*
         * Uses of the in operator in shiftExprs are always unambiguous,
         * so unset the flag that prohibits recognizing it.
         */
        var x2 = x.update({ inForLoopInit: false });
        n = ShiftExpression(t, x2);
        while ((t.match(LT) || t.match(LE) || t.match(GE) || t.match(GT) ||
               (!x.inForLoopInit && t.match(IN)) ||
               t.match(INSTANCEOF))) {
            n2 = new Node(t);
            n2.push(n);
            n2.push(ShiftExpression(t, x2));
            n = n2;
        }

        return n;
    }

    function ShiftExpression(t, x) {
        var n, n2;

        n = AddExpression(t, x);
        while (t.match(LSH) || t.match(RSH) || t.match(URSH)) {
            n2 = new Node(t);
            n2.push(n);
            n2.push(AddExpression(t, x));
            n = n2;
        }

        return n;
    }

    function AddExpression(t, x) {
        var n, n2;

        n = MultiplyExpression(t, x);
        while (t.match(PLUS) || t.match(MINUS)) {
            n2 = new Node(t);
            n2.push(n);
            n2.push(MultiplyExpression(t, x));
            n = n2;
        }

        return n;
    }

    function MultiplyExpression(t, x) {
        var n, n2;

        n = UnaryExpression(t, x);
        while (t.match(MUL) || t.match(DIV) || t.match(MOD)) {
            n2 = new Node(t);
            n2.push(n);
            n2.push(UnaryExpression(t, x));
            n = n2;
        }

        return n;
    }

    function UnaryExpression(t, x) {
        var n, n2, tt;

        switch (tt = t.get(true)) {
          case DELETE: case VOID: case TYPEOF:
          case NOT: case BITWISE_NOT: case PLUS: case MINUS:
            if (tt === PLUS)
                n = new Node(t, { type: UNARY_PLUS });
            else if (tt === MINUS)
                n = new Node(t, { type: UNARY_MINUS });
            else
                n = new Node(t);
            n.push(UnaryExpression(t, x));
            break;

          case INCREMENT:
          case DECREMENT:
            // Prefix increment/decrement.
            n = new Node(t);
            n.push(MemberExpression(t, x, true));
            break;

          default:
            t.unget();
            n = MemberExpression(t, x, true);

            // Don't look across a newline boundary for a postfix {in,de}crement.
            if (t.tokens[(t.tokenIndex + t.lookahead - 1) & 3].lineno ===
                t.lineno) {
                if (t.match(INCREMENT) || t.match(DECREMENT)) {
                    n2 = new Node(t, { postfix: true });
                    n2.push(n);
                    n = n2;
                }
            }
            break;
        }

        return n;
    }

    function MemberExpression(t, x, allowCallSyntax) {
        var n, n2, name, tt;

        if (t.match(NEW)) {
            n = new Node(t);
            n.push(MemberExpression(t, x, false));
            if (t.match(LEFT_PAREN)) {
                n.type = NEW_WITH_ARGS;
                n.push(ArgumentList(t, x));
            }
        } else {
            n = PrimaryExpression(t, x);
        }

        while ((tt = t.get()) !== END) {
            switch (tt) {
              case DOT:
                n2 = new Node(t);
                n2.push(n);
                t.forceIdentifier();
                n2.push(new Node(t));
                break;

              case LEFT_BRACKET:
                n2 = new Node(t, { type: INDEX });
                n2.push(n);
                n2.push(Expression(t, x));
                t.mustMatch(RIGHT_BRACKET);
                n2.end = t.token.end;
                break;

              case LEFT_PAREN:
                if (allowCallSyntax) {
                    n2 = new Node(t, { type: CALL });
                    n2.push(n);
                    n2.push(ArgumentList(t, x));
                    break;
                }

                // FALL THROUGH
              default:
                t.unget();
                return n;
            }

            n = n2;
        }

        return n;
    }

    function ArgumentList(t, x) {
        var n, n2;

        n = new Node(t, { type: LIST });
        if (t.match(RIGHT_PAREN, true)) {
            n.end = t.token.end;
            return n;
        }
        do {
            n2 = AssignExpression(t, x);
            if (n2.type === YIELD && !n2.parenthesized && t.peek() === COMMA)
                throw t.newSyntaxError("Yield expression must be parenthesized");
            if (t.match(FOR)) {
                n2 = GeneratorExpression(t, x, n2);
                if (n.children.length > 1 || t.peek(true) === COMMA)
                    throw t.newSyntaxError("Generator expression must be parenthesized");
            }
            n.push(n2);
        } while (t.match(COMMA));
        t.mustMatch(RIGHT_PAREN);
        n.end = t.token.end;

        return n;
    }

    function PrimaryExpression(t, x) {
        var n, n2, tt = t.get(true);

        switch (tt) {
          case FUNCTION:
            n = FunctionDefinition(t, x, false, EXPRESSED_FORM);
            break;

          case LEFT_BRACKET:
            n = new Node(t, { type: ARRAY_INIT });
            while ((tt = t.peek(true)) !== RIGHT_BRACKET) {
                if (tt === COMMA) {
                    t.get();
                    n.push(null);
                    continue;
                }
                n.push(AssignExpression(t, x));
                if (tt !== COMMA && !t.match(COMMA))
                    break;
            }

            // If we matched exactly one element and got a FOR, we have an
            // array comprehension.
            if (n.children.length === 1 && t.match(FOR)) {
                n2 = new Node(t, { type: ARRAY_COMP,
                                   expression: n.children[0],
                                   tail: ComprehensionTail(t, x) });
                n = n2;
            }
            t.mustMatch(RIGHT_BRACKET);
            n.end = t.token.end;
            break;

          case LEFT_CURLY:
            var id, fd;
            n = new Node(t, { type: OBJECT_INIT });

          object_init:
            if (!t.match(RIGHT_CURLY)) {
                do {
                    tt = t.get();
                    if ((t.token.value === "get" || t.token.value === "set") &&
                        t.peek() === IDENTIFIER) {
                        if (x.ecma3OnlyMode)
                            throw t.newSyntaxError("Illegal property accessor");
                        n.push(FunctionDefinition(t, x, true, EXPRESSED_FORM));
                    } else {
                        switch (tt) {
                          case IDENTIFIER: case NUMBER: case STRING:
                            id = new Node(t, { type: IDENTIFIER });
                            break;
                          case RIGHT_CURLY:
                            if (x.ecma3OnlyMode)
                                throw t.newSyntaxError("Illegal trailing ,");
                            break object_init;
                          default:
                            if (t.token.value in definitions.keywords) {
                                id = new Node(t, { type: IDENTIFIER });
                                break;
                            }
                            throw t.newSyntaxError("Invalid property name");
                        }
                        if (t.match(COLON)) {
                            n2 = new Node(t, { type: PROPERTY_INIT });
                            n2.push(id);
                            n2.push(AssignExpression(t, x));
                            n.push(n2);
                        } else {
                            // Support, e.g., |var {x, y} = o| as destructuring shorthand
                            // for |var {x: x, y: y} = o|, per proposed JS2/ES4 for JS1.8.
                            if (t.peek() !== COMMA && t.peek() !== RIGHT_CURLY)
                                throw t.newSyntaxError("missing : after property");
                            n.push(id);
                        }
                    }
                } while (t.match(COMMA));
                t.mustMatch(RIGHT_CURLY);
            }
            n.end = t.token.end;
            break;

          case LEFT_PAREN:
            var start = t.token.start;
            n = ParenExpression(t, x);
            t.mustMatch(RIGHT_PAREN);
            n.start = start;
            n.end = t.token.end;
            n.parenthesized = true;
            break;

          case LET:
            n = LetBlock(t, x, false);
            break;

          case NULL: case THIS: case TRUE: case FALSE:
          case IDENTIFIER: case NUMBER: case STRING: case REGEXP:
            n = new Node(t);
            break;

          default:
            throw t.newSyntaxError("missing operand");
            break;
        }

        return n;
    }

    /*
     * parse :: (source, filename, line number) -> node
     */
    function parse(s, f, l) {
        var t = new lexer.Tokenizer(s, f, l);
        var n = Script(t, false);
        if (!t.done)
            throw t.newSyntaxError("Syntax error");

        return n;
    }

    /*
     * parseStdin :: (source, {line number}) -> node
     */
    function parseStdin(s, ln) {
        for (;;) {
            try {
                var t = new lexer.Tokenizer(s, "stdin", ln.value);
                var n = Script(t, false);
                ln.value = t.lineno;
                return n;
            } catch (e) {
                if (!t.unexpectedEOF)
                    throw e;
                var more = readline();
                if (!more)
                    throw e;
                s += "\n" + more;
            }
        }
    }

    return {
        parse: parse,
        parseStdin: parseStdin,
        Node: Node,
        DECLARED_FORM: DECLARED_FORM,
        EXPRESSED_FORM: EXPRESSED_FORM,
        STATEMENT_FORM: STATEMENT_FORM,
        Tokenizer: lexer.Tokenizer,
        FunctionDefinition: FunctionDefinition
    };

}());
/* vim: set sw=4 ts=4 et tw=78: */
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

/*
 * Narcissus - JS implemented in JS.
 *
 * Decompiler and pretty-printer.
 */

Narcissus.decompiler = (function() {

    const parser = Narcissus.parser;
    const definitions = Narcissus.definitions;
    const tokens = definitions.tokens;

    // Set constants in the local scope.
    eval(definitions.consts);

    function indent(n, s) {
        var ss = "", d = true;

        for (var i = 0, j = s.length; i < j; i++) {
            if (d)
                for (var k = 0; k < n; k++)
                    ss += " ";
            ss += s[i];
            d = s[i] === '\n';
        }

        return ss;
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
            return n;
        if (!d) {
            topScript = true;
            d = 1;
        }

        var p = "";

        if (n.parenthesized)
            p += "(";

        switch (n.type) {
          case FUNCTION:
          case GETTER:
          case SETTER:
            if (n.type === FUNCTION)
                p += "function";
            else if (n.type === GETTER)
                p += "get";
            else
                p += "set";

            p += (n.name ? " " + n.name : "") + "(";
            for (var i = 0, j = n.params.length; i < j; i++)
                p += (i > 0 ? ", " : "") + pp(n.params[i], d);
            p += ") " + pp(n.body, d);
            break;

          case SCRIPT:
          case BLOCK:
            var nc = n.children;
            if (topScript) {
                // No indentation.
                for (var i = 0, j = nc.length; i < j; i++) {
                    if (i > 0)
                        p += "\n";
                    p += pp(nc[i], d);
                    var eoc = p[p.length - 1];
                    if (eoc != ";")
                        p += ";";
                }

                break;
            }

            p += "{";
            if (n.id !== undefined)
                p += " /* " + n.id + " */";
            p += "\n";
            for (var i = 0, j = nc.length; i < j; i++) {
                if (i > 0)
                    p += "\n";
                p += indent(4, pp(nc[i], d));
                var eoc = p[p.length - 1];
                if (eoc != ";")
                    p += ";";
            }
            p += "\n}";
            break;

          case LET_BLOCK:
            p += "let (" + pp(n.variables, d, true) + ") ";
            if (n.expression)
                p += pp(n.expression, d);
            else
                p += pp(n.block, d);
            break;

          case IF:
            p += "if (" + pp(n.condition, d) + ") ";

            var tp = n.thenPart, ep = n.elsePart;
            var b = isBlock(tp) || isBlock(ep);
            if (!b)
                p += "{\n";
            p += (b ? pp(tp, d) : indent(4, pp(tp, d))) + "\n";

            if (ep) {
                if (!b)
                    p += "} else {\n";
                else
                    p += " else ";

                p += (b ? pp(ep, d) : indent(4, pp(ep, d))) + "\n";
            }
            if (!b)
                p += "}";
            break;

          case SWITCH:
            p += "switch (" + pp(n.discriminant, d) + ") {\n";
            for (var i = 0, j = n.cases.length; i < j; i++) {
                var ca = n.cases[i];
                if (ca.type === CASE)
                    p += "  case " + pp(ca.caseLabel, d) + ":\n";
                else
                    p += "  default:\n";
                ps = pp(ca.statements, d);
                p += ps.slice(2, ps.length - 2) + "\n";
            }
            p += "}";
            break;

          case FOR:
            p += "for (" + pp(n.setup, d) + "; "
                         + pp(n.condition, d) + "; "
                         + pp(n.update, d) + ") ";

            var pb = pp(n.body, d);
            if (!isBlock(n.body))
                p += "{\n" + indent(4, pb) + ";\n}";
            else if (n.body)
                p += pb;
            break;

          case WHILE:
            p += "while (" + pp(n.condition, d) + ") ";

            var pb = pp(n.body, d);
            if (!isBlock(n.body))
                p += "{\n" + indent(4, pb) + ";\n}";
            else
                p += pb;
            break;

          case FOR_IN:
            var u = n.varDecl;
            p += n.isEach ? "for each (" : "for (";
            p += (u ? pp(u, d) : pp(n.iterator, d)) + " in " +
                 pp(n.object, d) + ") ";

            var pb = pp(n.body, d);
            if (!isBlock(n.body))
                p += "{\n" + indent(4, pb) + ";\n}";
            else if (n.body)
                p += pb;
            break;

          case DO:
            p += "do " + pp(n.body, d);
            p += " while (" + pp(n.condition, d) + ");";
            break;

          case BREAK:
            p += "break" + (n.label ? " " + n.label : "") + ";";
            break;

          case CONTINUE:
            p += "continue" + (n.label ? " " + n.label : "") + ";";
            break;

          case TRY:
            p += "try ";
            p += pp(n.tryBlock, d);
            for (var i = 0, j = n.catchClauses.length; i < j; i++) {
                var t = n.catchClauses[i];
                p += " catch (" + pp(t.varName, d) +
                                (t.guard ? " if " + pp(t.guard, d) : "") +
                                ") ";
                p += pp(t.block, d);
            }
            if (n.finallyBlock) {
                p += " finally ";
                p += pp(n.finallyBlock, d);
            }
            break;

          case THROW:
            p += "throw " + pp(n.exception, d);
            break;

          case RETURN:
            p += "return";
            if (n.value)
              p += " " + pp(n.value, d);
            break;

          case YIELD:
            p += "yield";
            if (n.value.type)
              p += " " + pp(n.value, d);
            break;

          case GENERATOR:
            p += pp(n.expression, d) + " " + pp(n.tail, d);
            break;

          case WITH:
            p += "with (" + pp(n.object, d) + ") ";
            p += pp(n.body, d);
            break;

          case LET:
          case VAR:
          case CONST:
            var nc = n.children;
            if (!inLetHead) {
                p += tokens[n.type] + " ";
            }
            for (var i = 0, j = nc.length; i < j; i++) {
                if (i > 0)
                    p += ", ";
                var u = nc[i];
                p += pp(u.name, d);
                if (u.initializer)
                    p += " = " + pp(u.initializer, d);
            }
            break;

          case DEBUGGER:
            p += "debugger\n";
            break;

          case SEMICOLON:
            if (n.expression) {
                p += pp(n.expression, d) + ";";
            }
            break;

          case LABEL:
            p += n.label + ":\n" + pp(n.statement, d);
            break;

          case COMMA:
          case LIST:
            var nc = n.children;
            for (var i = 0, j = nc.length; i < j; i++) {
                if (i > 0)
                    p += ", ";
                p += pp(nc[i], d);
            }
            break;

          case ASSIGN:
            var nc = n.children;
            var t = n.assignOp;
            p += pp(nc[0], d) + " " + (t ? tokens[t] : "") + "="
                              + " " + pp(nc[1], d);
            break;

          case HOOK:
            var nc = n.children;
            p += "(" + pp(nc[0], d) + " ? "
                     + pp(nc[1], d) + " : "
                     + pp(nc[2], d);
            p += ")";
            break;

          case OR:
          case AND:
            var nc = n.children;
            p += "(" + pp(nc[0], d) + " " + tokens[n.type] + " "
                     + pp(nc[1], d);
            p += ")";
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
            p += "(" + pp(nc[0], d) + " " + tokens[n.type] + " "
                     + pp(nc[1], d) + ")";
            break;

          case DELETE:
          case VOID:
          case TYPEOF:
            p += tokens[n.type] + " "  + pp(n.children[0], d);
            break;

          case NOT:
          case BITWISE_NOT:
            p += tokens[n.type] + pp(n.children[0], d);
            break;

          case UNARY_PLUS:
            p += "+" + pp(n.children[0], d);
            break;

          case UNARY_MINUS:
            p += "-" + pp(n.children[0], d);
            break;

          case INCREMENT:
          case DECREMENT:
            if (n.postfix) {
                p += pp(n.children[0], d) + tokens[n.type];
            } else {
                p += tokens[n.type] + pp(n.children[0], d);
            }
            break;

          case DOT:
            var nc = n.children;
            p += pp(nc[0], d) + "." + pp(nc[1], d);
            break;

          case INDEX:
            var nc = n.children;
            p += pp(nc[0], d) + "[" + pp(nc[1], d) + "]";
            break;

          case CALL:
            var nc = n.children;
            p += pp(nc[0], d) + "(" + pp(nc[1], d) + ")";
            break;

          case NEW:
          case NEW_WITH_ARGS:
            var nc = n.children;
            p += "new " + pp(nc[0], d);
            if (nc[1])
                p += "(" + pp(nc[1], d) + ")";
            break;

          case ARRAY_INIT:
            p += "[";
            var nc = n.children;
            for (var i = 0, j = nc.length; i < j; i++) {
                if(nc[i])
                    p += pp(nc[i], d);
                p += ","
            }
            p += "]";
            break;

          case ARRAY_COMP:
            p += "[" + pp (n.expression, d) + " ";
            p += pp(n.tail, d);
            p += "]";
            break;

          case COMP_TAIL:
            var nc = n.children;
            for (var i = 0, j = nc.length; i < j; i++) {
                if (i > 0)
                    p += " ";
                p += pp(nc[i], d);
            }
            if (n.guard)
                p += " if (" + pp(n.guard, d) + ")";
            break;

          case OBJECT_INIT:
            var nc = n.children;
            if (nc[0] && nc[0].type === PROPERTY_INIT)
                p += "{\n";
            else
                p += "{";
            for (var i = 0, j = nc.length; i < j; i++) {
                if (i > 0) {
                    p += ",\n";
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
                    p += indent(4, l) + ": " +
                         indent(4, pp(tc[1], d)).substring(4);
                } else {
                    p += indent(4, pp(t, d));
                }
            }
            p += "\n}";
            break;

          case NULL:
            p += "null";
            break;

          case THIS:
            p += "this";
            break;

          case TRUE:
            p += "true";
            break;

          case FALSE:
            p += "false";
            break;

          case IDENTIFIER:
          case NUMBER:
          case REGEXP:
            if (n.value.isOctal) p += "0" + n.value.toString(8);
            else p += n.value;
            break;

          case STRING:
            p += nodeStr(n);
            break;

          case GROUP:
            p += "(" + pp(n.children[0], d) + ")";
            break;

          default:
            throw "PANIC: unknown operation " + tokens[n.type] + " " + n.toSource();
        }

        if (n.parenthesized)
            p += ")";

        return p;
    }

    return {
        pp: pp
    };

}());
"use strict";
(function(exports) {
	exports.version = "0.10.9";
})(typeof exports !== 'undefined' ? exports : (Streamline.version = Streamline.version || {}));
"use strict";
(function() {
var sourceMap;
if (typeof exports !== 'undefined') {
	var req = require; // fool streamline-require so that we don't load source-map client-side
	try { sourceMap = req('source-map'); } catch (ex) {}
}
if (!sourceMap) {
	// Mock it for client-side
	sourceMap = {
		SourceNode: function(lineno, column, source, content) {
			this.children = content ? [content] : [];
		}
	};
	sourceMap.SourceNode.prototype.add = function(elt) {
		if (Array.isArray(elt)) this.children = this.children.concat(elt);
		else this.children.push(elt);
		return this;
	};
	sourceMap.SourceNode.prototype.prepend = function(elt) {
		if (Array.isArray(elt)) this.children = elt.concat(this.children.concat);
		else this.children.unshift(elt);
		return this;
	};
	sourceMap.SourceNode.prototype.toString = function() {
	    var str = "";
	    this.walk(function (chunk) {
	      str += chunk;
	    });
	    return str;
	};
	sourceMap.SourceNode.prototype.walk = function(f) {
		this.children.forEach(function(n) {
			if (n instanceof sourceMap.SourceNode) n.walk(f);
			else f(n);
		});
		return this;
	};
}
(function(module) {
function SourceNode() {
	sourceMap.SourceNode.apply(this, arguments);
}

SourceNode.prototype = Object.create(sourceMap.SourceNode.prototype, {
	constructor: {
		value: SourceNode,
		enumerable: false,
		writable: true,
		configurable: true
	},
	length: {
		get: function() {
			var len = 0;
			this.walk(function(str) { len += str.length; });
			return len;
		}
	}
});
SourceNode.prototype.stripPrefix = function(offset) {
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
SourceNode.prototype.stripSuffix = function(offset) {
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
SourceNode.prototype.map = function(f) {
	this.children = this.children.map(function(chunk) {
		if (chunk instanceof sourceMap.SourceNode) {
			return chunk.map(f);
		} else {
			return f(chunk);
		}
	});
	return this;
};
SourceNode.prototype.lastChar = function() {
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
};
module.exports = Object.create(sourceMap, { SourceNode: { value: SourceNode } });

})(typeof exports !== 'undefined' ? module : (Streamline.sourceMap = Streamline.sourceMap || {}));
})();/* ***** BEGIN LICENSE BLOCK *****
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
	var Narcissus = require('streamline/deps/narcissus');
}
var sourceMap = require('streamline/lib/util/source-map');
(function(exports){
	eval(Narcissus.definitions.consts);
	var tokens = Narcissus.definitions.tokens;
	
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
			result += "\n";
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
			s.prepend(new sourceMap.SourceNode(null, null, null, dent));
			return s;
		}
	
		function isBlock(n) {
			return n && (n.type === BLOCK);
		}
	
		function isNonEmptyBlock(n) {
			return isBlock(n) && n.children.length > 0;
		}

		var lines;
		function sourceNodeFromNode(n, content) {
			var lineno, column, source = n.tokenizer && n.tokenizer.filename;
			source = source || void 0;
			var start = n.start, end = n.end;
			var sourceString = n.tokenizer && n.tokenizer.source;
			if (!source || !start || !end || !sourceString) {
				// no chance
				return new sourceMap.SourceNode(void 0, void 0, void 0, content);
			}
			if (source && !lines) {
				// generate a map of all newlines
				lines = [];
				// -1 is considered a newline for the first line of the file
				lines[-1] = 0
				var lineno = 1;
				for (var index = sourceString.indexOf('\n'); index >= 0; index = sourceString.indexOf('\n', index+1)) {
					lines[index] = lineno;
					lineno++;
				}
			}
			// for some reason, some nodes have a slightly wrong `start` position. so fix it
			while (start < end && " \n\t;{}".indexOf(sourceString[start]) >= 0) start++;
			if (start < end) {
				var fragment = sourceString.substring(start, end);
				var newline = sourceString.lastIndexOf("\n", start)
				lineno = lines[newline] + 1; // lines index from 1
				column = start - (newline + 1);
			} else {
				source = void 0;
			}

			return new sourceMap.SourceNode(lineno, column, source, content);
		}
	
		function nodeStr(n) {
			return sourceNodeFromNode(n, '"' +
				n.value.replace(/\\/g, "\\\\")
				       .replace(/"/g, "\\\"")
				       .replace(/\n/g, "\\n")
				       .replace(/\r/g, "\\r") +
				       '"');
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

			var p = sourceNodeFromNode(n);
	
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
	
				if (n.name) {
					p.add([' ', sourceNodeFromNode(n, n.name)]);
				}
				p.add("(");
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
							p.add(l);
					} else {
							l = pp(tc[0], d);
							p.add(indent(2, l));
						}
						p.add([": ", indent(2, pp(tc[1], d)).stripPrefix(2)]);
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

/// 
/// # Transformation engine (callback mode)
/// 
/// `var transform = require('streamline/lib/callbacks/transform')`
/// 
if (typeof exports !== 'undefined') {
	var Narcissus = require('../../deps/narcissus');
	var format = require('./format').format;
} else {
	var format = Streamline.format;
}(function(exports) {
	//"use strict";
	/// * `version = transform.version`  
	///   current version of the transformation algorithm.
	exports.version = require("streamline/lib/version").version + " (callbacks)";

	var parse = Narcissus.parser.parse;
	var pp = Narcissus.decompiler.pp;
	var definitions = Narcissus.definitions;

	eval(definitions.consts.replace(/const /g, "var "));

	function _assert(cond) {
		if (!cond) throw new Error("Assertion failed!")
	}

	function _tag(node) {
		if (!node || !node.type) return "*NOT_A_NODE*";
		var t = definitions.tokens[node.type];
		return /^\W/.test(t) ? definitions.opTypeNames[t] : t.toUpperCase();
	}

	/*
	 * Utility functions
	 */

	function originalLine(options, line, col) {
		if (!options.prevMap) return line;
		// Work around a bug in CoffeeScript's source maps; column number 0 is faulty.
		if (col == null) col = 1000;
		var r = options.prevMap.originalPositionFor({ line: line, column: col }).line
		return r == null ? line : r;
	}

	function originalCol(options, line, col) {
		if (!options.prevMap) return col;
		return options.prevMap.originalPositionFor({ line: line, column: col }).column || 0;
	}

	function _node(ref, type, children) {
		return {
			_scope: ref && ref._scope,
			_async: ref && ref._async,
			type: type,
			children: children
		};
	}

	function _identifier(name, initializer) {
		return {
			_scope: initializer && initializer._scope,
			type: IDENTIFIER,
			name: name,
			value: name,
			initializer: initializer
		};
	}

	function _number(val) {
		return {
			type: NUMBER,
			value: val
		};
	}

	function _string(val) {
		return {
			type: STRING,
			value: val
		};
	}

	function _return(node) {
		return {
			type: RETURN,
			_scope: node._scope,
			value: node
		};
	}

	function _semicolon(node) {
		var stmt = _node(node, SEMICOLON);
		stmt.expression = node;
		return stmt;
	}

	function _safeName(precious, name) {
		if (name.substring(0, 2) === '__') while (precious[name]) name += 'A';
		return name;
	}
	// cosmetic stuff: template logic generates nested blocks. Flatten them.

	function _flatten(node) {
		if (node.type == BLOCK || node.type == SCRIPT) {
			do {
				var found = false;
				var children = [];
				node.children.forEach(function(child) {
					if (child._isFunctionReference || (child.type == SEMICOLON && (child.expression == null || child.expression._isFunction))) return; // eliminate empty statement and dummy function node;
					node._async |= child._async;
					if (child.type == BLOCK || child.type == SCRIPT) {
						children = children.concat(child.children);
						found = true;
					} else children.push(child);
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

	function _propagate(node, fn, doAll, clone) {
		var result = clone ? clone : node;
		for (var prop in node) {
			// funDecls and expDecls are aliases to children
			// target property creates loop (see Node.prototype.toString)
			if (node.hasOwnProperty(prop) && prop.indexOf("Decls") < 0 && (doAll || prop != 'target') && prop[0] != '_') {
				var child = node[prop];
				if (child != null) {
					if (Array.isArray(child)) {
						if (clone) result[prop] = (child = [].concat(child));
						var undef = false;
						for (var i = 0; i < child.length; i++) {
							if (doAll || (child[i] && child[i].type)) {
								child[i] = fn(child[i], node);
								undef |= typeof child[i] === "undefined"
							}
						}
						if (undef) {
							result[prop] = child.filter(function(elt) {
								return typeof elt !== "undefined";
							});
						}
					} else {
						if (doAll || (child && child.type)) result[prop] = fn(child, node);

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
			if (!child || !child.type) return child;
			var cloneId = child._cloneId;
			if (!cloneId) cloneId = (child._cloneId = ++lastId);
			var clone = clones[cloneId];
			if (clone) return clone;
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

	function Template(pass, str, isExpression, createScope) {
		// parser the function and set the root
		var _root = parse("function _t(){" + str + "}").children[0].body;
		if (_root.children.length == 1) _root = _root.children[0];
		else _root = _node(_root.children[0], BLOCK, _root.children);

		// if template is an expression rather than a full statement, go one more step down
		//if (isExpression) 
		//	_root = _root.expression;
		// generates a parse tree from a template by substituting bindings.
		this.generate = function(scopeNode, bindings) {
			var scope = scopeNode._scope;
			_assert(scope != null);
			bindings = bindings || {};
			var fn = null;

			function gen(node) {
				if (node.type != SCRIPT && node.type != BLOCK) node._pass = pass;
				if (node.type == FUNCTION && createScope) {
					_assert(fn == null);
					fn = node;
				}
				if (!node || !node.type) {
					if (node == "_") return scope.options.callback;
					// not a parse node - replace if it is a name that matches a binding
					if (typeof node === "string") {
						if (node[0] === "$") return bindings[node];
						return _safeName(scope.options.precious, node);
					}
					return node;
				}
				node._scope = scope;
				// if node is ident; statement (SEMICOLON) or ident expression, try to match with binding
				var ident = node.type == SEMICOLON ? node.expression : node;
				if (ident && ident.type == IDENTIFIER && ident.value[0] === "$") {
					var result = bindings[ident.value];
					// transfer initializer if there is one
					if (ident.initializer) {
						result.initializer = gen(ident.initializer);
						if (result.initializer._async) result._async = true;
					}
					return result;
				} else {
					// recurse through sub nodes
					node = _propagate(node, function(child) {
						child = gen(child);
						// propagate async flag like analyze phase
						if (child && (child._async || (child === scope.options.callback && createScope)) && node.type !== FUNCTION) node._async = true;
						return child;
					}, true);
					node = _flatten(node);
					return node;
				}
			}

			// generate
			var result = gen(_clone(_root));
			if (fn) {
				// parser drops parenthesized flag (because of return)
				fn.parenthesized = true;
				var scope = new Scope(fn.body, fn._scope.options);
				scope.name = fn._scope.name;
				scope.line = fn._scope.line;
				scope.last = fn._scope.last;
				_assert(fn.params[0] === fn._scope.options.callback);
				scope.cbIndex = 0;

				function _changeScope(node, parent) {
					if (node.type == FUNCTION) return node;
					node._scope = scope;
					return _propagate(node, _changeScope);
				}
				_propagate(fn, _changeScope);
			}
			return isExpression ? result.value : result;
		}
		this.root = isExpression ? _root.value : _root; // for simplify pass
	}

	/*
	 * Utility to generate names of intermediate variables
	 */

	function Scope(script, options) {
		this.script = script;
		this.line = 0;
		this.last = 0;
		this.vars = [];
		this.functions = [];
		this.options = options;
		this.cbIndex = -1;
		this.isAsync = function() {
			return this.cbIndex >= 0;
		}
	}

	function _genId(node) {
		return _safeName(node._scope.options.precious, "__" + ++node._scope.last);
	}

	/*
	 * Preliminary pass: mark source nodes so we can map line numbers
	 * Also eliminate _fast_ syntax
	 */
	function _removeFast(node, options) {
		function _isMarker(node) {
			return node.type === IDENTIFIER && node.value === options.callback;
		}
		function _isStar(node) {
			return node.type === CALL && _isMarker(node.children[0]) && node.children[1].children.length === 2;
		}
		// ~_ -> _
		if (node.type === BITWISE_NOT && _isMarker(node.children[0])) {
			options.needsTransform = true;
			return node.children[0];
		}
		// [_] -> _ (with multiple marker)
		if (node.type === ARRAY_INIT && node.children.length === 1 && _isMarker(node.children[0])) {
			options.needsTransform = true;
			node.children[0]._returnArray = true; 
			return node.children[0];
		}
		// _ >> x -> x
		if (node.type === RSH && _isMarker(node.children[0])) {
			options.needsTransform = true;
			return node.children[1];
		}
		// _ << x -> x
		if (node.type === LSH && _isMarker(node.children[0])) {
			options.needsTransform = true;
			return node.children[1];
		}
		// !_ -> null
		if (node.type === NOT && _isMarker(node.children[0])) {
			options.needsTransform = true;
			node.type = FALSE;
			node.children = [];
			return node;
		}
		if (_isStar(node)) {
			node._isStar = true;
			options.needsTransform = true;
			node.children[0].value = _safeName(options.precious, "__rt") + ".streamlinify"
			return node;
		} 
		return node;
	}

	function _markSource(node, options) {
		function _markOne(node) {
			if (typeof node.value === 'string') options.precious[node.value] = true;
			node.params && node.params.forEach(function(param) {
				options.precious[param] = true;
			});
			node._isSourceNode = true;
			_propagate(node, function(child) {
				child = _removeFast(child, options);
				_markOne(child);
				return child;
			});
		}

		_markOne(node);
	}

	/*
	 * Canonicalization pass: wrap top level script if async
	 */

	function _isScriptAsync(script, options) {
		var async = false;

		function _doIt(node, parent) {
			switch (node.type) {
			case FUNCTION:
				// do not propagate into functions
				return node;
			case IDENTIFIER:
				if (node.value == options.callback) {
					async = true;
				} else { // propagate only if async is still false
					_propagate(node, _doIt);
				}
				return node;
			case CALL:
				// special hack for coffeescript top level closure
				var fn = node.children[0],
					args = node.children[1],
					ident;
				if (fn.type === DOT && (ident = fn.children[1]).value === "call" && (fn = fn.children[0]).type === FUNCTION && fn.params.length === 0 && !fn.name && args.children.length === 1 && args.children[0].type === THIS) {
					_propagate(fn.body, _doIt);
					return node;
				}
				// fall through			
			default:
				// do not propagate if async has been found
				if (!async) {
					_propagate(node, _doIt);
				}
				return node;
			}
		}
		_propagate(script, _doIt);
		if (async && options.verbose) console.log("WARNING: async calls found at top level in " + script.filename);
		return async;
	}

	var _rootTemplate = new Template("root",
	// define as string on one line to get lineno = 1
	"(function main(_){ $script }).call(this, __trap);");

	function _canonTopLevelScript(script, options) {
		script._scope = new Scope(script, options);
		if (_isScriptAsync(script, options)) return _rootTemplate.generate(script, {
			$script: script
		});
		else return script;
	}

	/*
	 * Scope canonicalization pass:
	 *   Set _scope on all nodes
	 *   Set _async on all nodes that contain an async marker
	 *   Move vars and functions to beginning of scope.
	 *   Replace this by __this.
	 *   Set _breaks flag on all statements that end with return, throw or break
	 */
	var _assignTemplate = new Template("canon", "$lhs = $rhs;");

	// try to give a meaningful name to an anonymous func

	function _guessName(node, parent) {
		function _sanitize(name) {
			// replace all invalid chars by '_o_'
			name = name.replace(/[^A-Z0-9_$]/ig, '_o_');
			// add '_o_' prefix if name is empty or starts with a digit
			return name && !/^\d/.test(name) ? name : '_o_' + name;
		}
		var id = _genId(node),
			n, nn;
		if (parent.type === IDENTIFIER) return _sanitize(parent.value) + id;
		if (parent.type === ASSIGN) {
			n = parent.children[0];
			var s = "";
			while ((n.type === DOT && (nn = n.children[1]).type === IDENTIFIER) || (n.type === INDEX && (nn = n.children[1]).type === STRING)) {
				s = s ? nn.value + "_" + s : nn.value;
				n = n.children[0];
			}
			if (n.type === IDENTIFIER) s = s ? n.value + "_" + s : n.value;
			if (s) return _sanitize(s) + id;
		} else if (parent.type == PROPERTY_INIT) {
			n = parent.children[0];
			if (n.type === IDENTIFIER || n.type === STRING) return _sanitize(n.value) + id;
		}
		return id;
	}

	function _canonScopes(node, options) {
		function _doIt(node, parent) {
			var scope = parent._scope;
			node._scope = scope;
			var async = scope.isAsync();
			if (!async && node.type !== FUNCTION) {
				if (node.type === IDENTIFIER && node.value === options.callback && !parent._isStar) {
					throw new Error(node.filename + ": Function contains async calls but does not have _ parameter: " + node.name + " at line " + node.lineno);
				}
				return _propagate(node, _doIt);
			}

			if (node.type === TRY) node._async = true;
			switch (node.type) {
			case FUNCTION:
				var result = node;
				var cbIndex = node.params.reduce(function(index, param, i) {
					if (param != options.callback) return index;
					if (index < 0) return i;
					else throw new Error("duplicate _ parameter");
				}, -1);
				if (cbIndex >= 0) {
					// handle coffeescript fat arrow method definition (issue #141)
					if (_isFatArrow(node)) return node;
					// should rename options -> context because transform writes into it.
					options.needsTransform = true;
					// assign names to anonymous functions (for futures)
					if (!node.name) node.name = _guessName(node, parent);
				}
				// if function is a statement, move it away
				if (async && (parent.type === SCRIPT || parent.type === BLOCK)) {
					scope.functions.push(node);
					result = undefined;
				}
				// create new scope for the body
				var bodyScope = new Scope(node.body, options);
				node.body._scope = bodyScope;
				bodyScope.name = node.name;
				bodyScope.cbIndex = cbIndex;
				bodyScope.line = node.lineno;
				node.body = _propagate(node.body, _doIt);
				// insert declarations at beginning of body
				if (cbIndex >= 0) bodyScope.functions.push(_string("BEGIN_BODY")); // will be removed later
				node.body.children = bodyScope.functions.concat(node.body.children);
				if (bodyScope.hasThis && !node._inhibitThis) {
					bodyScope.vars.push(_identifier(_safeName(options.precious, "__this"), _node(node, THIS)));
				}
				if (bodyScope.hasArguments && !node._inhibitArguments) {
					bodyScope.vars.push(_identifier(_safeName(options.precious, "__arguments"), _identifier("arguments")));
				}
				if (bodyScope.vars.length > 0) {
					node.body.children.splice(0, 0, _node(node, VAR, bodyScope.vars));
				}
				// do not set _async flag
				return result;
			case VAR:
				var children = node.children.map(function(child) {
					if (!scope.vars.some(function(elt) {
						return elt.value == child.value;
					})) {
						scope.vars.push(_identifier(child.value));
					}
					if (!child.initializer) return null;
					child = _assignTemplate.generate(parent, {
						$lhs: _identifier(child.value),
						$rhs: child.initializer
					});
					if (parent.type === FOR) child = child.expression;
					return child;
				}).filter(function(child) {
					return child != null;
				});
				if (children.length == 0) {
					return;
				}
				var type = parent.type == BLOCK || parent.type === SCRIPT ? BLOCK : COMMA;
				var result = _node(parent, type, children);
				result = _propagate(result, _doIt);
				parent._async |= result._async;
				return result;
			case THIS:
				scope.hasThis = true;
				return _identifier(_safeName(options.precious, "__this"));
			case IDENTIFIER:
				if (node.value === "arguments") {
					scope.hasArguments = true;
					//if (!options.ninja) throw new Error("To use 'arguments' inside streamlined function, read the doc and set the 'ninja' option");
					return _identifier(_safeName(options.precious, "__arguments"));
				}
				node = _propagate(node, _doIt);
				node._async |= node.value === options.callback;
				if (node._async && !parent.isArgsList && // func(_) is ok
					!(parent.type === PROPERTY_INIT && node === parent.children[0]) && // { _: 1 } is ok
					!(parent.type === DOT && node === parent.children[1]))
					throw new Error("invalid usage of '_'")
				parent._async |= node._async;
				return node;
			case NEW_WITH_ARGS:
				var cbIndex = node.children[1].children.reduce(function(index, arg, i) {
					if (arg.type !== IDENTIFIER || arg.value !== options.callback) return index;
					if (index < 0) return i;
					else throw new Error("duplicate _ argument");
				}, -1);
				if (cbIndex >= 0) {
					var constr = _node(node, CALL, [_identifier(_safeName(options.precious, '__construct')), _node(node, LIST, [node.children[0], _number(cbIndex)])]);
					node = _node(node, CALL, [constr, node.children[1]]);
				}
				node.children[1].isArgsList = true;
				node = _propagate(node, _doIt);
				parent._async |= node._async;
				return node;
			case CALL:
				node.children[1].isArgsList = true;
				_convertCoffeeScriptCalls(node, options);
				_convertApply(node, options);
				node.children[1].isArgsList = true;
				// fall through
			default:
				// todo: set breaks flag
				node = _propagate(node, _doIt);
				_setBreaks(node);
				parent._async |= node._async;
				return node;
			}
		}
		return _propagate(node, _doIt);
	}

	function _convertCoffeeScriptCalls(node, options) {
		// takes care of anonymous functions inserted by 
		// CoffeeScript compiler
		var fn = node.children[0];
		var args = node.children[1];
		if (fn.type === FUNCTION && fn.params.length === 0 && !fn.name && args.children.length == 0) {
			// (function() { ... })() 
			// --> (function(_) { ... })(_)
			fn._noFuture = true;
			fn.name = "___closure";
			fn.params = [options.callback];
			args.children = [_identifier(options.callback)];
		} else if (fn.type === DOT) {
			var ident = fn.children[1];
			fn = fn.children[0];
			if (fn.type === FUNCTION && fn.params.length === 0 && !fn.name && ident.type === IDENTIFIER) {
				if (ident.value === "call" && args.children.length === 1 && args.children[0].type === THIS) {
					// (function() { ... }).call(this) 
					// --> (function(_) { ... })(_)
					node.children[0] = fn;
					fn._noFuture = true;
					fn.name = "___closure";
					fn.params = [options.callback];
					args.children = [_identifier(options.callback)];
					node._scope.hasThis = true;
					fn._inhibitThis = true;
				} else if (ident.value === "apply" && args.children.length === 2 && args.children[0].type === THIS && args.children[1].type === IDENTIFIER && args.children[1].value === "arguments") {
					// (function() { ... }).apply(this, arguments) 
					// --> (function(_) { ... })(_)
					node.children[0] = fn;
					fn._noFuture = true;
					fn.name = "___closure";
					fn.params = [options.callback];
					args.children = [_identifier(options.callback)];
					node._scope.hasThis = true;
					node._scope.hasArguments = true;
					fn._inhibitThis = true;
					fn._inhibitArguments = true;
				}
			}
		}
	}

	function _isFatArrow(node) {
		//this.method = function(_) {
        //	return Test.prototype.method.apply(_this, arguments);
      	//};
      	// Params may vary but so we only test body.
      	if (node.body.children.length !== 1) return false;
      	var n = node.body.children[0];
      	if (n.type !== RETURN || !n.value) return false;
      	n = n.value;
      	if (n.type !== CALL) return false;
      	var args = n.children[1].children;
      	var target = n.children[0];
      	if (args.length !== 2 || args[0].value !== '_this' || args[1].value !== 'arguments') return false;
      	if (target.type !== DOT || target.children[1].value !== 'apply') return false;
      	target = target.children[0];
      	if (target.type !== DOT || target.children[1].type !== IDENTIFIER) return false;
      	target = target.children[0];
      	if (target.type !== DOT || target.children[1].value !== 'prototype') return false;
      	target = target.children[0];
      	if (target.type !== IDENTIFIER) return false;
      	// Got it. Params are useless so nuke them
      	node.params = [];
      	return true;
    }

	function _convertApply(node, options) {
		// f.apply(this, arguments) -> __apply(_, f, __this, __arguments, cbIndex)
		var dot = node.children[0];
		var args = node.children[1];
		if (dot.type === DOT) {
			var ident = dot.children[1];
			if (ident.type === IDENTIFIER && ident.value === "apply" && args.children.length === 2 && args.children[0].type === THIS && args.children[1].type === IDENTIFIER && args.children[1].value === "arguments") {
				var f = dot.children[0];
				node.children[0] = _identifier('__apply');
				args.children = [_identifier(options.callback), f, _identifier('__this'), _identifier('__arguments'), _number(node._scope.cbIndex)];
				node._scope.hasThis = true;
				node._scope.hasArguments = true;
			}
		}
	}

	var _switchVarTemplate = new Template("canon", "{ var $v = true; }");
	var _switchIfTemplate = new Template("canon", "if ($v) { $block; }");

	function _setBreaks(node) {
		switch (node.type) {
		case IF:
			node._breaks = node.thenPart._breaks && node.elsePart && node.elsePart._breaks;
			break;
		case SWITCH:
			for (var i = 0; i < node.cases.length; i++) {
				var stmts = node.cases[i].statements;
				if (node._async && stmts.children.length > 0 && !stmts._breaks) {
					// narcissus has the strange idea of inserting an empty default after last case.
					// If we detect this and if the last case is not terminated by a break, we do not consider it an error 
					// and we just fix it by adding a break.
					if (i == node.cases.length - 2 && node.cases[i + 1].type === DEFAULT && node.cases[i + 1].statements.children.length === 1 && node.cases[i + 1].statements.children[0].type === SEMICOLON && node.cases[i + 1].statements.children[0].expression == null) {
						stmts.children.push(_node(node, BREAK));
						stmts._breaks = true;
					} else if (i === node.cases.length - 1) {
						stmts.children.push(_node(node, BREAK));
						stmts._breaks = true;
					} else {
						// we rewrite:
						//		case A: no_break_A
						//		case B: no_break_B
						//		case C: breaking_C
						//
						// as:
						//		case A: var __A = true;
						//		case B: var __B = true;
						//		case C:
						//			if (__A) no_break_A
						//			if (__B) no_break_B
						//			breaking_C
						var v = _identifier(_genId(node));
						node.cases[i].statements = _switchVarTemplate.generate(node.cases[i], {
							$v: v,
						});
						var ifStmt = _switchIfTemplate.generate(node.cases[i], {
							$v: v,
							$block: stmts,
						});
						node.cases[i + 1].statements.children.splice(0, 0, ifStmt);
					}
				}
			}
			break;
		case TRY:
			node._breaks = node.tryBlock._breaks && node.catchClauses[0] && node.catchClauses[0].block._breaks;
			break;
		case BLOCK:
		case SCRIPT:
			node.children.forEach(function(child) {
				node._breaks |= child._breaks;
			});
			break;
		case RETURN:
		case THROW:
		case BREAK:
			node._breaks = true;
			break;
		}
	}

	/*
	 * Flow canonicalization pass:
	 *   Converts all loops to FOR format
	 *   Converts lazy expressions
	 *   Splits try/catch/finally
	 *   Wraps isolated statements into blocks
	 */

	function _statementify(exp) {
		if (!exp) return exp;
		var block = _node(exp, BLOCK, []);

		function uncomma(node) {
			if (node.type === COMMA) {
				node.children.forEach(uncomma);
			} else {
				block.children.push(node.type == SEMICOLON ? node : _semicolon(node));
			}
		}
		uncomma(exp);
		return block;

	}

	function _blockify(node) {
		if (!node || node.type == BLOCK) return node;
		if (node.type == COMMA) return _statementify(node);
		var block = _node(node, BLOCK, [node]);
		block._async = node._async;
		return block;
	}

	var _flowsTemplates = {
		WHILE: new Template("flows", "{" + //
		"	for (; $condition;) {" + //
		"		$body;" + //
		"	}" + //
		"}"),

		DO: new Template("flows", "{" + //
		"	var $firstTime = true;" + //
		"	for (; $firstTime || $condition;) {" + //
		"		$firstTime = false;" + //
		"		$body;" + //
		"	}" + //
		"}"),

		FOR: new Template("flows", "{" + //
		"	$setup;" + //
		"	for (; $condition; $update) {" + //
		"		$body;" + //
		"	}" + //
		"}"),

		FOR_IN: new Template("flows", "{" + //
		"	var $array = __forIn($object);" + //
		"	var $i = 0;" + //
		"	for (; $i < $array.length;) {" + //
		"		$iter = $array[$i++];" + //
		"		$body;" + //
		"	}" + //
		"}"),

		TRY: new Template("flows", "" + //
		"try {" + //
		"	try { $try; }" + //
		"	catch ($ex) { $catch; }" + //
		"}" + //
		"finally { $finally; }"),

		AND: new Template("flows", "" + //
		"return (function $name(_){" + //
		"	var $v = $op1;" + //
		"	if (!$v) {" + //
		"		return $v;" + //
		"	}" + //
		"	return $op2;" + //
		"})(_)", true, true),

		OR: new Template("flows", "" + //
		"return (function $name(_){" + //
		"	var $v = $op1;" + //
		"	if ($v) {" + //
		"		return $v;" + //
		"	}" + //
		"	return $op2;" + //
		"})(_)", true, true),

		HOOK: new Template("flows", "" + //
		"return (function $name(_){" + //
		"	var $v = $condition;" + //
		"	if ($v) {" + //
		"		return $true;" + //
		"	}" + //
		"	return $false;" + //
		"})(_);", true, true),

		COMMA: new Template("flows", "" + //
		"return (function $name(_){" + //
		"	$body;" + //
		"	return $result;" + //
		"})(_);", true, true),

		CONDITION: new Template("flows", "" + //
		"return (function $name(_){" + //
		"	return $condition;" + //
		"})(_);", true, true),

		UPDATE: new Template("flows", "" + //
		"return (function $name(_){" + //
		"	$update;" + //
		"})(_);", true, true)
	};

	function _canonFlows(node, options) {
		function _doIt(node, parent, force) {
			var scope = node._scope;

			function _doAsyncFor(node) {
				// extra pass to wrap async condition and update
				if (node.condition && node.condition._async && node.condition.type !== CALL) node.condition = _flowsTemplates.CONDITION.generate(node, {
					$name: "__$" + node._scope.name,
					$condition: _doIt(node.condition, node, true),
				});
				if (node.update && node.update._async) node.update = _flowsTemplates.UPDATE.generate(node, {
					$name: "__$" + node._scope.name,
					$update: _statementify(node.update)
				});
			}
			if (node.type == FOR && node._pass === "flows") _doAsyncFor(node);
			if (!scope || !scope.isAsync() || (!force && node._pass === "flows")) return _propagate(node, _doIt);

			switch (node.type) {
			case IF:
				node.thenPart = _blockify(node.thenPart);
				node.elsePart = _blockify(node.elsePart);
				break;
			case SWITCH:
				if (node._async) {
					var def = node.cases.filter(function(n) {
						return n.type == DEFAULT
					})[0];
					if (!def) {
						def = _node(node, DEFAULT);
						def.statements = _node(node, BLOCK, []);
						node.cases.push(def);
					}
					if (!def._breaks) {
						def.statements.children.push(_node(node, BREAK))
					}
				}
				break;
			case WHILE:
				node.body = _blockify(node.body);
				if (node._async) {
					node = _flowsTemplates.WHILE.generate(node, {
						$condition: node.condition,
						$body: node.body
					});
				}
				break;
			case DO:
				node.body = _blockify(node.body);
				if (node._async) {
					node = _flowsTemplates.DO.generate(node, {
						$firstTime: _identifier(_genId(node)),
						$condition: node.condition,
						$body: node.body
					});
				}
				break;
			case FOR:
				node.condition = node.condition || _number(1);
				node.body = _blockify(node.body);
				if (node._async) {
					if (node.setup) {
						node = _flowsTemplates.FOR.generate(node, {
							$setup: _statementify(node.setup),
							$condition: node.condition,
							$update: node.update,
							$body: node.body
						});
					} else {
						if (node._pass !== "flows") {
							node._pass = "flows";
							_doAsyncFor(node);
						}
					}
				}
				break;
			case FOR_IN:
				node.body = _blockify(node.body);
				if (node._async) {
					if (node.iterator.type != IDENTIFIER) {
						throw new Error("unsupported 'for ... in' syntax: type=" + _tag(node.iterator));
					}
					node = _flowsTemplates.FOR_IN.generate(node, {
						$array: _identifier(_genId(node)),
						$i: _identifier(_genId(node)),
						$object: node.object,
						$iter: node.iterator,
						$body: node.body
					});
				}
				break;
			case TRY:
				if (node.tryBlock && node.catchClauses[0] && node.finallyBlock) {
					node = _flowsTemplates.TRY.generate(node, {
						$try: node.tryBlock,
						$catch: node.catchClauses[0].block,
						$ex: node.catchClauses[0].varName,
						$finally: node.finallyBlock
					})
				}
				break;
			case AND:
			case OR:
				if (node._async) {
					node = _flowsTemplates[_tag(node)].generate(node, {
						$name: "__$" + node._scope.name,
						$v: _identifier(_genId(node)),
						$op1: node.children[0],
						$op2: node.children[1]
					});
				}
				break;
			case HOOK:
				if (node._async) {
					node = _flowsTemplates.HOOK.generate(node, {
						$name: "__$" + node._scope.name,
						$v: _identifier(_genId(node)),
						$condition: node.children[0],
						$true: node.children[1],
						$false: node.children[2]
					});
				}
				break;

			case COMMA:
				if (node._async) {
					node = _flowsTemplates.COMMA.generate(node, {
						$name: "__$" + node._scope.name,
						$body: _node(node, BLOCK, node.children.slice(0, node.children.length - 1).map(_semicolon)),
						$result: node.children[node.children.length - 1]
					});
				}
				break;
			}
			return _propagate(node, _doIt);
		}
		return _propagate(node, _doIt);
	}

	/*
	 * Disassembly pass
	 */

	function _split(node, prop) {
		var exp = node[prop];
		if (!exp || !exp._async) return node;
		var id = _genId(node);
		var v = _identifier(id, exp);
		node[prop] = _identifier(id);
		return _node(node, BLOCK, [_node(node, VAR, [v]), node]);
	}

	function _disassemble(node, options) {
		function _disassembleIt(node, parent, noResult) {
			if (!node._async) return _propagate(node, _scanIt);
			node = _propagate(node, _disassembleIt);
			if (node.type === CALL) {
				if (node.children[0].type === IDENTIFIER && node.children[0].value.indexOf('__wrap') == 0) {
					node._isWrapper = true;
					return node;
				}
				var args = node.children[1];
				if (args.children.some(function(arg) {
					return (arg.type === IDENTIFIER && arg.value === options.callback) || arg._isWrapper;
				})) {
					if (noResult) {
						node._scope.disassembly.push(_statementify(node));
						return;
					} else {
						if (parent.type == IDENTIFIER && parent.value.indexOf('__') === 0) {
							// don't generate another ID, use the parent one
							node._skipDisassembly = true;
							return node;
						}
						var id = _genId(node);
						var v = _identifier(id, node);
						node = _node(node, VAR, [v]);
						node._scope.disassembly.push(node);
						return _identifier(id);
					}
				}
			}
			return node;
		}

		function _scanIt(node, parent) {
			var scope = node._scope;
			if (!scope || !scope.isAsync() || !node._async) return _propagate(node, _scanIt);
			switch (node.type) {
			case IF:
				node = _split(node, "condition");
				break;
			case SWITCH:
				node = _split(node, "discriminant");
				break;
			case FOR:
				break;
			case RETURN:
				node = _split(node, "value");
				break;
			case THROW:
				node = _split(node, "exception");
				break;
			case VAR:
				_assert(node.children.length === 1);
				var ident = node.children[0];
				scope.disassembly = [];
				ident.initializer = _disassembleIt(ident.initializer, ident);
				node._async = ident.initializer._skipDisassembly;
				scope.disassembly.push(node);
				return _node(parent, BLOCK, scope.disassembly);
			case SEMICOLON:
				scope.disassembly = [];
				node.expression = _disassembleIt(node.expression, node, true);
				if (node.expression) {
					node._async = false;
					scope.disassembly.push(node);
				}
				return _node(parent, BLOCK, scope.disassembly);
			}
			return _propagate(node, _scanIt);
		}
		return _propagate(node, _scanIt);

	}

	/*
	 * Transformation pass - introducing callbacks
	 */
	var _cbTemplates = {
		FUNCTION: new Template("cb", "{" + //
		"	$decls;" + //
		"	var __frame = { name: $fname, line: $line };" + //
		"	return __func(_, this, arguments, $fn, $index, __frame, function $name(){" + //
		"		$body;" + //
		"		_();" + //
		"	});" + //
		"}"),

		FUNCTION_INTERNAL: new Template("cb", "{ $decls; $body; _(); }"),

		RETURN: new Template("cb", "return _(null, $value);"),

		RETURN_UNDEFINED: new Template("cb", "return _(null);"),

		THROW: new Template("cb", "return _($exception);"),

		IF: new Template("cb", "" + //
		"return (function $name(__then){" + //
		"	if ($condition) { $then; __then(); }" + //
		"	else { $else; __then(); }" + //
		"})(function $name(){ $tail; });"),

		SWITCH: new Template("cb", "" + // 
		"return (function $name(__break){" + //
		"	$statement;" + //
		"})(function $name(){ $tail; });"),

		LABEL: new Template("cb", "" + // 
		"$statement;" + //
		"$tail;"),

		BREAK: new Template("cb", "return __break();"),
		
		LABELLED_BREAK: new Template("cb", "return $break();"),

		CONTINUE: new Template("cb", "" + //
		"while (__more) { __loop(); } __more = true;" + //
		"return;"),

		LABELLED_CONTINUE: new Template("cb", "" + //
		"while ($more.get()) { $loop(); } $more.set(true);" + //
		"return;"),

		LOOP1: new Template("cb", "" + //
		"if ($v) {" + //
		"	$body;" + //
		"	while (__more) { __loop(); } __more = true;" + //
		"}" + //
		"else { __break(); }"),

		// LOOP2 is in temp pass so that it gets transformed if update is async
		LOOP2: new Template("temp", "var $v = $condition; $loop1;"),

		LOOP2_UPDATE: new Template("temp", "" + //
		"if ($beenHere) { $update; } else { $beenHere = true; }" + //
		"var $v = $condition; $loop1;"),

		FOR: new Template("cb", "" + //
		"return (function ___(__break){" + //
		"	var __more;" + //
		"	var __loop = __cb(_, __frame, 0, 0, function $name(){" + //
		"		__more = false;" + //
		"		$loop2" + //
		"	});" + //
		"	do { __loop(); } while (__more); __more = true;" + //
		"})(function $name(){ $tail;});"),

		LABELLED_FOR: new Template("cb", "" + //
		"return (function ___(__break){" + //
		"	var __more, $more = { get: function() { return __more; }, set: function(v) { __more = v; }};" + //
		"	var __loop = __cb(_, __frame, 0, 0, function $name(){" + //
		"		var $break = __break, $loop = __loop;" + //
		"		__more = false;" + //
		"		$loop2" + //
		"	});" + //
		"	do { __loop(); } while (__more); __more = true;" + //
		"})(function $name(){ $tail;});"),

		FOR_UPDATE: new Template("cb", "" + //
		"var $beenHere = false;" + //
		"return (function ___(__break){" + //
		"	var __more;" + //
		"	var __loop = __cb(_, __frame, 0, 0, function $name(){" + //
		"		__more = false;" + //
		"		$loop2" + //
		"	});" + //
		"	do { __loop(); } while (__more); __more = true;" + //
		"})(function $name(){ $tail; });"),

		LABELLED_FOR_UPDATE: new Template("cb", "" + //
		"var $beenHere = false;" + //
		"return (function ___(__break){" + //
		"	var __more, $more = { get: function() { return __more; }, set: function(v) { __more = v; }};" + //
		"	var __loop = __cb(_, __frame, 0, 0, function $name(){" + //
		"		var $break = __break, $loop = __loop;" + //
		"		__more = false;" + //
		"		$loop2" + //
		"	});" + //
		"	do { __loop(); } while (__more); __more = true;" + //
		"})(function $name(){ $tail; });"),

		CATCH: new Template("cb", "" + //
		"return (function ___(__then){" + //
		"	(function ___(_){" + //
		"		__tryCatch(_, function $name(){ $try; __then(); });" + //
		"	})(function ___($ex, __result){" + //
		"		__catch(function $name(){" + //
		"			if ($ex) { $catch; __then(); }" + //
		"			else { _(null, __result); }" + //
		"		});" + //
		"	});" + //
		"})(function ___(){" + //
		"	__tryCatch(_, function $name(){ $tail; });" + //
		"});"),

		FINALLY: new Template("cb", "" + //
		"return (function ___(__then){" + //
		"	(function ___(_){" + //
		"		__tryCatch(_, function $name(){ $try; _(null, null, true); });" + //
		"	})(function ___(__e, __r, __cont){" + //
		"		(function ___(__then){" + //
		"			__tryCatch(_, function $name(){ $finally; __then(); });" + //
		"		})(function ___(){" + //
		"			__tryCatch(_, function ___(){" + //
		"				if (__cont) __then(); else _(__e, __r);" + //
		"			});" + //
		"		})" + //
		"	});" + //
		"})(function ___(){" + //
		"	__tryCatch(_, function $name(){ $tail; });" + //
		"});"),

		CALL_VOID: new Template("cb", "return __cb(_, __frame, $offset, $col, function $name(){ $tail; }, true, $returnArray)", true),

		CALL_TMP: new Template("cb", "return __cb(_, __frame, $offset, $col, function ___(__0, $result){ $tail }, true, $returnArray)", true),

		CALL_RESULT: new Template("cb", "" + //
		"return __cb(_, __frame, $offset, $col, function $name(__0, $v){" + //
		"	var $result = $v;" + //
		"	$tail" + //
		"}, true, $returnArray)", true)
	};

	function _callbackify(node, options) {
		var label;
		function _scanIt(node, parent) {
			//console.log("CBIT: " + _tag(node) + " " + pp(node))
			node = _flatten(node);
			if (!node._scope || !node._scope.isAsync() || node._pass === "cb") return _propagate(node, _scanIt);
			switch (node.type) {
			case SCRIPT:
				if (parent._pass !== "cb") {
					// isolate the leading decls from the body because 'use strict'
					// do not allow hoisted functions inside try/catch
					var decls;
					for (var cut = 0; cut < node.children.length; cut++) {
						var child = node.children[cut];
						if (child.type === STRING && child.value === "BEGIN_BODY") {
							decls = node.children.splice(0, cut);
							node.children.splice(0, 1);
							break;
						}
					}
					var template = parent._noFuture || parent._pass === "flows" ? _cbTemplates.FUNCTION_INTERNAL : _cbTemplates.FUNCTION;
					node = template.generate(node, {
						$fn: parent.name,
						//node._scope.name ? _identifier(node._scope.name) : _node(node, NULL),
						$name: "__$" + node._scope.name,
						$fname: _string(parent.name),
						$line: _number(originalLine(options, node._scope.line)),
						$index: _number(node._scope.cbIndex),
						$decls: _node(node, BLOCK, decls || []),
						$body: node
					});
				}
				node.type = SCRIPT;
				// continue with block restructure
			case BLOCK:
				for (var i = 0; i < node.children.length; i++) {
					node.children[i] = _restructureIt(node, i);
				}
				return node;
			}
			return _propagate(node, _scanIt);
		}

		function _extractTail(parent, i) {
			return _node(parent, BLOCK, parent.children.splice(i + 1, parent.children.length - i - 1));
		}

		function _restructureIt(parent, i) {
			var node = parent.children[i];
			if (node._pass === "cb") return _propagate(node, _scanIt);
			//console.log("RESTRUCTUREIT: " + _tag(node) + " " + pp(node))
			switch (node.type) {
			case RETURN:
				_extractTail(parent, i);
				var template = node.value ? _cbTemplates.RETURN : _cbTemplates.RETURN_UNDEFINED;
				node = template.generate(node, {
					$value: node.value
				});
				break;
			case THROW:
				_extractTail(parent, i);
				node = _cbTemplates.THROW.generate(node, {
					$exception: node.exception
				});
				break;
			case BREAK:
				if (node.target && !node.target._async) {
					break;
				}
				_extractTail(parent, i);
				if (node.label) {
					node = _cbTemplates.LABELLED_BREAK.generate(node, {
						$break: _safeName(options.precious, '__break__' + node.label)
					});
				} else {
					node = _cbTemplates.BREAK.generate(node, {});					
				}
				break;
			case CONTINUE:
				if (node.target && !node.target._async) {
					break;
				}
				_extractTail(parent, i);
				if (node.label) {
					node = _cbTemplates.LABELLED_CONTINUE.generate(node, {
						$loop: _safeName(options.precious, '__loop__' + node.label),
						$more: _safeName(options.precious, '__more__' + node.label),
					});					
				} else {
					node = _cbTemplates.CONTINUE.generate(node, {});					
				}
				break;
			case TRY:
				var tail = _extractTail(parent, i);
				if (node.catchClauses[0]) {
					node = _cbTemplates.CATCH.generate(node, {
						$name: "__$" + node._scope.name,
						$try: node.tryBlock,
						$catch: node.catchClauses[0].block,
						$ex: node.catchClauses[0].varName,
						$tail: tail
					});
				} else {
					node = _cbTemplates.FINALLY.generate(node, {
						$name: "__$" + node._scope.name,
						$try: node.tryBlock,
						$finally: node.finallyBlock,
						$tail: tail
					});
				}
				break;
			default:
				if (node._async) {
					var tail = _extractTail(parent, i);
					switch (node.type) {
					case IF:
						node = _cbTemplates.IF.generate(node, {
							$name: "__$" + node._scope.name,
							$condition: node.condition,
							$then: node.thenPart,
							$else: node.elsePart || _node(node, BLOCK, []),
							$tail: tail
						});
						break;
					case SWITCH:
						node._pass = "cb"; // avoid infinite recursion
						node = _cbTemplates.SWITCH.generate(node, {
							$name: "__$" + node._scope.name,
							$statement: node,
							$tail: tail
						});
						break;
					case LABEL:
						var l = label;
						label = node.label;
						node = _cbTemplates.LABEL.generate(node, {
							$name: "__$" + node._scope.name,
							$statement: node.statement,
							$tail: tail
						});
						node = _scanIt(node, parent);
						label = l;
						return node;
					case FOR:
						var v = _identifier(_genId(node));
						var loop1 = _cbTemplates.LOOP1.generate(node, {
							$v: v,
							$body: node.body,
						});
						var update = node.update;
						var beenHere = update && _identifier(_genId(node));
						var loop2 = (update ? _cbTemplates.LOOP2_UPDATE : _cbTemplates.LOOP2).generate(node, {
							$v: v,
							$condition: node.condition,
							$beenHere: beenHere,
							$update: _statementify(update),
							$loop1: loop1
						});
						node = (update 
							? (label ? _cbTemplates.LABELLED_FOR_UPDATE : _cbTemplates.FOR_UPDATE) 
							: (label ? _cbTemplates.LABELLED_FOR : _cbTemplates.FOR)).generate(node, {
							$name: "__$" + node._scope.name,
							$loop: _identifier(_safeName(options.precious, '__loop__' + label)),
							$break: _identifier(_safeName(options.precious, '__break__' + label)),
							$more: _identifier(_safeName(options.precious, '__more__' + label)),
							$beenHere: beenHere,
							$loop2: loop2,
							$tail: tail

						});
						break;
					case VAR:
						_assert(node.children.length == 1);
						var ident = node.children[0];
						_assert(ident.type === IDENTIFIER);
						var call = ident.initializer;
						delete ident.initializer;
						_assert(call && call.type === CALL);
						return _restructureCall(call, tail, ident.value);
					case SEMICOLON:
						var call = node.expression;
						_assert(call.type === CALL)
						return _restructureCall(call, tail);
					default:
						throw new Error("internal error: bad node type: " + _tag(node) + ": " + pp(node));
					}
				}
			}
			return _scanIt(node, parent);

			function _restructureCall(node, tail, result) {
				var args = node.children[1];

				function _cbIndex(args) {
					return args.children.reduce(function(index, arg, i) {
						if ((arg.type == IDENTIFIER && arg.value === options.callback) || arg._isWrapper) return i;
						else return index;
					}, -1);
				}
				var i = _cbIndex(args);
				_assert(i >= 0);
				var returnArray = args.children[i]._returnArray;
				if (args.children[i]._isWrapper) {
					args = args.children[i].children[1];
					i = _cbIndex(args);
				}
				// find the appropriate node for this call:
				// e.g. for "a.b(_)", find the node "b"
				var identifier = node.children[0];
				while (identifier.type == DOT) {
					identifier = identifier.children[1];
				}
				var bol = options.source.lastIndexOf('\n', identifier.start) + 1;
				var col = identifier.start - bol;
				args.children[i] = (result ? result.indexOf('__') === 0 ? _cbTemplates.CALL_TMP : _cbTemplates.CALL_RESULT : _cbTemplates.CALL_VOID).generate(node, {
					$v: _genId(node),
					$frameName: _string(node._scope.name),
					$offset: _number(originalLine(options, identifier.lineno, col) - originalLine(options, node._scope.line)),
					$col: _number(originalCol(options, identifier.lineno, col)),
					$name: "__$" + node._scope.name,
					$returnArray: returnArray,
					$result: result,
					$tail: tail
				});
				node = _propagate(node, _scanIt);

				var stmt = _node(node, RETURN, []);
				stmt.value = node;
				stmt._pass = "cb";
				return stmt;
			}
		}
		return _propagate(node, _scanIt);
	}

	/*
	 * Simplify pass - introducing callbacks
	 */

	function _checkUsed(val, used) {
		if (typeof val === "string" && val.substring(0, 2) === "__") used[val] = true;
	}


	var _optims = {
		function__0$fn: new Template("simplify", "return function ___(__0) { $fn(); }", true).root,
		function$return: new Template("simplify", "return function $fn1() { return $fn2(); }", true).root,
		function__0$arg1return_null$arg2: new Template("simplify", "return function ___(__0, $arg1) { return _(null, $arg2); }", true).root,
		__cb__: new Template("simplify", "return __cb(_, $frameVar, $line, $col, _)", true).root,
		__cbt__: new Template("simplify", "return __cb(_, $frameVar, $line, $col, _, true)", true).root,
		function$fn: new Template("simplify", "return function $fn1() { $fn2(); }", true).root,
		closure: new Template("simplify", "return (function ___closure(_){ $body; })(__cb(_,$frameVar,$line,$col,function $fnName(){_();},true))", true).root,
		safeParam: new Template("simplify", "return (function $fnName($param){ $body; })(function $fnName(){_();})", true).root,
	}

	function _simplify(node, options, used) {
		if (node._simplified) return node;
		node._simplified = true;
		_propagate(node, function(child) {
			return _simplify(child, options, used)
		});
		_checkUsed(node.value, used);

		function _match(prop, v1, v2, result) {
			var ignored = ["parenthesized", "lineno", "start", "end", "tokenizer", "hasReturnWithValue"];
			if (prop.indexOf('_') == 0 || ignored.indexOf(prop) >= 0) return true;
			if (v1 == v2) return true;
			if (v1 == null || v2 == null) {
				// ignore difference between null and empty array
				if (prop == "children" && v1 && v1.length === 0) return true;
				return false;
			}
			if (Array.isArray(v1)) {
				if (v1.length != v2.length) return false;
				for (var i = 0; i < v1.length; i++) {
					if (!_match(prop, v1[i], v2[i], result)) return false;
				}
				return true;
			}
			if (v1.type === IDENTIFIER && v1.value[0] === "$" && v2.type === NUMBER) {
				result[v1.value] = v2.value;
				return true;
			}
			if (typeof v1 == "string" && v1[0] == "$" && typeof v2 == "string") {
				result[v1] = v2;
				return true;
			}
			if (v1.type) {
				var exp;
				if (v1.type == SCRIPT && v1.children[0] && (exp = v1.children[0].expression) && typeof exp.value == "string" && exp.value[0] == '$') {
					result[exp.value] = v2;
					return true;
				}
				if (v1.type != v2.type) return false;
				if (v1.type == IDENTIFIER && v1.value == '$') {
					result[v1.value] = v2.value;
					return true;
				}

				for (var prop in v1) {
					if (v1.hasOwnProperty(prop) && prop.indexOf("Decls") < 0 && prop != "target") {
						if (!_match(prop, v1[prop], v2[prop], result)) return false;
					}
				}
				return true;
			}
			return false;
		}

		var result = {};
		if (_match("", _optims.function__0$fn, node, result)) return _identifier(result.$fn);
		if (_match("", _optims.function$return, node, result) && (result.$fn1 === '___' || result.$fn1.indexOf('__$') === 0) && (result.$fn2 === '__break')) return _identifier(result.$fn2);
		if (_match("", _optims.function__0$arg1return_null$arg2, node, result) && result.$arg1 == result.$arg2) return _identifier("_");
		if (options.optimize && _match("", _optims.__cb__, node, result)) return _identifier("_");
		if (options.optimize && _match("", _optims.__cbt__, node, result)) return _identifier("_");
		if (_match("", _optims.function$fn, node, result) && (result.$fn1 === '___' || result.$fn1.indexOf('__$') === 0) && (result.$fn2 === '__then' || result.$fn2 === '__loop')) return _identifier(result.$fn2);
		if (_match("", _optims.closure, node, result)) node.children[1] = _identifier("_");
		if (_match("", _optims.safeParam, node, result) && (result.$param === '__then' || result.$param === '__break')) node.children[1] = _identifier("_");
		_flatten(node);
		return node;
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

	/// * `transformed = transform.transform(source, options)`  
	///   Transforms streamline source.  
	///   The following `options` may be specified:
	///   * `sourceName` identifies source (stack traces, transformation errors)
	///   * `lines` controls line mapping
	//    Undocumented options:
	//    * (obsolete) `callback` alternative identifier if `_` is already used 
	//    * (internal) `noHelpers` disables generation of helper functions (`__cb`, etc.)
	//    * (internal) `optimize` optimizes transform (but misses stack frames)
	exports.transform = function(source, options) {
		try {
			source = source.replace(/\r\n/g, "\n");
			options = options ? _extend({}, options) : {}; // clone to isolate options set at file level
			var sourceOptions = /streamline\.options\s*=\s*(\{.*\})/.exec(source);
			if (sourceOptions) {
				_extend(options, JSON.parse(sourceOptions[1]));
			}
			options.source = source;
			options.callback = options.callback || "_";
			options.lines = options.lines || "preserve";
			options.precious = {}; // identifiers found inside source
			//console.log("TRANSFORMING " + options.sourceName)
			//console.log("source=" + source);
			var node = parse(source + "\n", options.sourceName); // final newline avoids infinite loop if unterminated string literal at the end
			var strict = node.children[0] && node.children[0].expression && node.children[0].expression.value == "use strict";
			strict && node.children.splice(0, 1);
			_markSource(node, options);
			//console.log("tree=" + node);
			node = _canonTopLevelScript(node, options);
			//console.log("CANONTOPLEVEL=" + pp(node));
			node = _canonScopes(node, options);
			//console.log("CANONSCOPES=" + pp(node));
			if (!options.needsTransform) return source;
			node = _canonFlows(node, options);
			//console.log("CANONFLOWS=" + pp(node));
			node = _disassemble(node, options);
			//console.log("DISASSEMBLE=" + pp(node))
			node = _callbackify(node, options);
			//console.log("CALLBACKIFY=" + pp(node))
			var used = {};
			node = _simplify(node, options, used);

			var result = format(node, options.lines);

			// add helpers at beginning so that __g is initialized before any other code
			if (!options.noHelpers) {
				var s = exports.helpersSource(options, used, strict);
				if (options.lines == "sourcemap") {
					result.prepend(s);
				} else {
					result = s + result;
				}
			}
			//console.log("result=" + result);
			//console.log("TRANSFORMED " + options.sourceName + ": " + result.length)
			return result;
		} catch (err) {
			var message = "error streamlining " + (options.sourceName || 'source') + ": " + err.message;
			if (err.source && err.cursor) {
				var line = 1;
				for (var i = 0; i < err.cursor; i++) {
					if (err.source[i] === "\n") line += 1;
				}
				message += " on line " + line;
			} else if (err.stack) {
				message += "\nSTACK:\n" + err.stack;
			}
			throw new Error(message);
		}
	}
	// hack to fix #123
	exports.transform.version = exports.version;

	function _trim(fn) {
		return fn.toString().replace(/\s+/g, " ");
	}

	function include(mod, modules) {
		var source = modules + "['" + mod + "']=(mod={exports:{}});";
		source += "(function(module, exports){";
		var req = require; 	// prevents client side require from getting fs as a dependency
		source += req('fs').readFileSync(__dirname + '/../' + mod + '.js', 'utf8').replace(/(\/\/[^"\n]*\n|\/\*[\s\S]*?\*\/|\n)[ \t]*/g, "");
		source += "})(mod, mod.exports);";
		return source;
	}

	function requireRuntime(options) {
		if (!options.standalone) return "require('streamline/lib/callbacks/runtime').runtime(__filename, " + !!options.oldStyleFutures + ")";
		var modules = _safeName(options.precious, "__modules");
		var s = "(function(){var " + modules + "={},mod;";
		s += "function require(p){var m=" + modules + "[p.substring(15)]; return m && m.exports};";
		s += include('globals', modules);
		s += include('util/future', modules);
		s += include('callbacks/runtime', modules);
		if (['funnel', 'forEach_', 'map_', 'filter_', 'every_', 'some_', 'reduce_', 'reduceRight_', 'sort_', 'apply_'].some(function(name) {
				return options.precious[name];
			})) s += include('callbacks/builtins', modules);
		s += "return " + modules + "['callbacks/runtime'].exports.runtime('" + options.sourceName + "', " + !!options.oldStyleFutures + ");";
		s += "})()";
		return s;
	}

	// Undocumented (internal)
	exports.helpersSource = function(options, used, strict) {
		var srcName = "" + options.sourceName; // + "_.js";
		var i = srcName.indexOf('node_modules/');
		if (i == -1 && typeof process === 'object' && typeof process.cwd === 'function') i = process.cwd().length;
		srcName = i >= 0 ? srcName.substring(i + 13) : srcName;
		var sep = options.lines == "preserve" ? " " : "\n";
		strict = strict ? '"use strict";' + sep : "";
		var s = sep + strict;
		var keys = ['__g', '__func', '__cb', '__future', '__propagate', '__trap', '__catch', '__tryCatch', '__forIn', '__apply', '__construct', '__setEF'];
		var __rt = _safeName(options.precious, "__rt");
		s += "var " + __rt + "=" + requireRuntime(options);
		keys.forEach(function(key) {
			var k = _safeName(options.precious, key);
			if (used[k]) s += "," + k + "=" + __rt + "." + key;
		});
		s += ";" + sep;
		return s;
	}
})(typeof exports !== 'undefined' ? exports : (window.Streamline = window.Streamline || {}));
/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
(function(exports) {
	exports.future = function(fn, args, i) {
		var err, result, done, q = [], self = this;
		args = Array.prototype.slice.call(args);
		args[i] = function(e, r) {
			err = e, result = r, done = true;
			q && q.forEach(function(f) {
				f.call(self, e, r);
			});
			q = null;
		};
		args[i].__futurecb = true;
		fn.apply(this, args);
		var ret = function F(cb) {
			if (typeof cb !== 'function') {
				if (cb !== false && !require('streamline/lib/globals').oldStyleFutures) throw new Error("no callback given (argument #0). If you're a Streamline user, more info: https://github.com/Sage/streamlinejs/blob/master/FAQ.md#no-callback-given-error");
				return F;
			}
			if (done) cb.call(self, err, result);
			else q.push(cb);
		};
		ret.__future = true;
		return ret;
	};

	exports.streamlinify = function(fn, idx) {
		return function() {
			if (!arguments[idx]) return exports.future.call(this, fn, arguments, idx);
			else return fn.apply(this, arguments);
		};
	};
})(typeof exports !== 'undefined' ? exports : (Streamline.future = Streamline.future || {}));

/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
(function(exports) {
	var __g = require("streamline/lib/globals");
	__g.runtime = 'callbacks';
	var __fut = require("streamline/lib/util/future");
	__g.context = __g.context || {};
	__g.depth = __g.depth || 0;

	__g.trampoline = (function() {
		var q = [];
		return {
			queue: function(fn) {
				q.push(fn);
			},
			flush: function() {
				__g.depth++;
				try {
					var fn;
					while (fn = q.shift()) fn();
				} finally {
					__g.depth--;
				}
			}
		}
	})();

	exports.runtime = function(filename, oldStyleFutures) {
		__g.oldStyleFutures = oldStyleFutures;
		function __func(_, __this, __arguments, fn, index, frame, body) {
			if (typeof _ !== 'function') {
				if (_ !== false && !__g.oldStyleFutures) throw new Error("no callback given (argument #" + index + "). If you're a Streamline user, more info: https://github.com/Sage/streamlinejs/blob/master/FAQ.md#no-callback-given-error");
				return __fut.future.call(__this, fn, __arguments, index);
			}
			frame.file = filename;
			frame.prev = __g.frame;
			__g.frame = frame;
			__g.depth === 0 && __g.emitter && __g.emitter.emit("resume");
			__g.depth++;
			__g.emitter && __g.emitter.emit("enter", _); // <- This allows the event handler to detect if the callback starts a new asynchronous path.
			try {
				frame.active = true;
				body();
			} catch (e) {
				__setEF(e, frame.prev);
				__propagate(_, e);
			} finally {
				frame.active = false;
				// We emit this before resetting the frame so that the 'exit' handler has access to the current frame.
				__g.emitter && __g.emitter.emit("exit");
				__g.frame = frame.prev;
				if (--__g.depth === 0 && __g.trampoline) __g.trampoline.flush();
				__g.depth === 0 && __g.emitter && __g.emitter.emit("yield");
			}
		}

		return {
			__g: __g,
			__func: __func,
			__cb: __cb,
			__future: __fut.future,
			__propagate: __propagate,
			__trap: __trap,
			__tryCatch: __tryCatch,
			__catch: __catch,
			__forIn: __forIn,
			__apply: __apply,
			__construct: __construct,
			__setEF: __setEF,
			streamlinify: __fut.streamlinify,
		};
	};

	function __cb(_, frame, offset, col, fn, trampo, returnArray) {
		frame.offset = offset;
		frame.col = col;
		var ctx = __g.context;
		var ret = function ___(err, result) {
			if (returnArray) result = Array.prototype.slice.call(arguments, 1);
			returnArray = false; // so that we don't do it twice if we trampoline
			var oldFrame = __g.frame;
			__g.frame = frame;
			__g.context = ctx;
			__g.depth === 0 && __g.emitter && __g.emitter.emit("resume");
			__g.depth++;
			__g.emitter && __g.emitter.emit('enter');
			try {
				if (trampo && frame.active && __g.trampoline) {
					__g.trampoline.queue(function() {
						return ___(err, result);
					});
				} else {
					// detect extra callback.
					// The offset/col test is necessary because __cb is also used by loops and called multiple times then.
					/*if (___.dispatched && (offset || col)) throw new Error("callback called twice");*/
					___.dispatched = true;
					if (err) {
						__setEF(err, frame);
						return _(err);
					}
					frame.active = true;
					return fn(null, result);
				}
			} catch (ex) {
				if (___.dispatched && _.name !== '___' && _.name !== '__trap') throw ex;
				__setEF(ex, frame);
				return __propagate(_, ex);
			} finally {
				frame.active = false;
				// We emit this before resetting the frame so that the 'exit' handler has access to the current frame.
				__g.emitter && __g.emitter.emit("exit");
				__g.frame = oldFrame;
				if (--__g.depth === 0 && __g.trampoline) __g.trampoline.flush();
				__g.depth === 0 && __g.emitter && __g.emitter.emit("yield");
			}
		};
		ret.__streamlined = true;
		return ret;
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
			if (__g.context && __g.context.errorHandler) __g.context.errorHandler(err);
			else process.nextTick(function() {
				throw err;
			});
		}
	}

	function __tryCatch(_, fn) {
		try {
			fn();
		} catch (e) {
			try {
				_(e);
			} catch (ex) {
				__trap(ex);
			}
		}
	}

	function __catch(fn) {
		var frame = __g.frame,
			context = __g.context;
		__g.trampoline.queue(function() {
			var oldFrame = __g.frame,
				oldContext = __g.context;
			__g.frame = frame;
			__g.context = context;
			try {
				fn();
			} finally {
				__g.frame = oldFrame;
				__g.context = oldContext;
			}
		});
	}

	function __forIn(object) {
		var array = [];
		for (var obj in object) {
			array.push(obj);
		}
		return array;
	}

	function __apply(cb, fn, thisObj, args, index) {
		if (cb == null) return __fut.future(__apply, arguments, 0);
		args = Array.prototype.slice.call(args, 0);
		args[index != null ? index : args.length] = cb;
		return fn.apply(thisObj, args);
	}

	function __construct(constructor, i) {
		var key = '__async' + i,
			f;
		return constructor[key] || (constructor[key] = function() {
			var args = arguments;

			function F() {
				var self = this;
				var cb = args[i];
				args[i] = function(e, r) {
					cb(e, self);
				};
				args[i].__streamlined = cb.__streamlined;
				args[i].__futurecb = cb.__futurecb;
				return constructor.apply(self, args);
			}
			F.prototype = constructor.prototype;
			return new F();
		});
	}

	function __setEF(e, f) {
		function formatStack(e, raw) {
			var ff = typeof navigator === 'object' && navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
			// firefox does not include message
			if (ff) raw = "Error: " + e.message + '\n' + raw;
			var s = raw,
				f, skip;
			if (s) {
				var lines = s.split('\n');
				s = lines[0] + '\n    <<< async stack >>>\n' + lines.slice(1).map(function(l) {
					// try to map firefox format to V8 format
					// ffOffset takes care of lines difference introduced by require.js script.
					var ffOffset = (typeof navigator === 'object' && typeof require === 'function' && require.async) ? 11 : 0;
					var m = /([^@]*)\@(.*?)\:(\d+)(?:\:(\d+))?$/.exec(l);
					l = m ? "    at " + m[1] + " (" + m[2] + ":" + (parseInt(m[3]) - ffOffset) + ":" + (m[4] || "0") + ")" : l;
					var i = l.indexOf('__$');
					if (i >= 0 && !skip) {
						skip = true;
						return l.substring(0, i) + l.substring(i + 3);
					}
					return skip ? '' : l;
				}).filter(function(l) {
					return l;
				}).join('\n');
				for (var f = e.__frame; f; f = f.prev) {
					if (f.offset >= 0) s += "\n    at " + f.name + " (" + f.file + ":" + (f.line + f.offset) + ":" + (f.col+1) + ")"
				}
			}
			var nl = raw.indexOf('\n');
			s += '\n    <<< raw stack >>>' + (nl >= 0 ? raw.substring(nl) : raw);
			return s;
		};
		e.__frame = e.__frame || f;
		if (exports.stackTraceEnabled && e.__lookupGetter__ && e.__lookupGetter__("rawStack") == null) {
			var getter = e.__lookupGetter__("stack");
			if (!getter) { // FF or Safari case
				var raw = e.stack || "raw stack unavailable";
				getter = function() {
					return raw;
				}
			}
			e.__defineGetter__("rawStack", getter);
			e.__defineGetter__("stack", function() {
				return formatStack(e, getter());
			});
		}
	}

	/// * `runtime.stackTraceEnabled = true/false;`
	///   If true, `err.stack` returns the reconstructed _sync_ stack trace.
	///   Otherwise, it returns the _raw_ stack trace.
	///   The default is true, but you must require the flows module
	///   at least once to enable sync stack traces.
	exports.stackTraceEnabled = true;
})(typeof exports !== 'undefined' ? exports : (Streamline.runtime = Streamline.runtime || {}));
require && require("streamline/lib/callbacks/builtins");
/*** Generated by streamline 0.10.9 (callbacks) - DO NOT EDIT ***/ var __rt=require('streamline/lib/callbacks/runtime').runtime(__filename, false),__func=__rt.__func,__cb=__rt.__cb; (function(exports) {








  "use strict";
  var VERSION = 3;



  var future = function(fn, args, i) {
    var err, result, done, q = [], self = this;

    args = Array.prototype.slice.call(args);
    args[i] = function(e, r) {
      err = e, result = r, done = true;
      (q && q.forEach(function(f) {
        f.call(self, e, r); }));

      q = null; };

    fn.apply(this, args);
    return function F(cb) {
      if (!cb) { return F };
      if (done) { cb.call(self, err, result); } else {
        q.push(cb); }; }; };




  exports.funnel = function(max) {
    max = ((max == null) ? -1 : max);
    if ((max === 0)) { max = funnel.defaultSize; };
    if ((typeof max !== "number")) { throw new Error(("bad max number: " + max)) };
    var queue = [], active = 0, closed = false;



    var funCb = function(callback, fn) {
      if ((callback == null)) { return future(funCb, arguments, 0) };

      if (((max < 0) || (max == Infinity))) { return fn(callback) };

      queue.push({
        fn: fn,
        cb: callback });


      function _doOne() {
        var current = queue.splice(0, 1)[0];
        if (!current.cb) { return current.fn() };
        active++;
        current.fn(function(err, result) {
          active--;
          if (!closed) {
            current.cb(err, result);
            while (((active < max) && (queue.length > 0))) { _doOne();; }; } ; }); };




      while (((active < max) && (queue.length > 0))) { _doOne();; }; };

    var fun = __rt.streamlinify(funCb, 0);

    fun.close = function() {
      queue = [], closed = true; };

    return fun; };

  var funnel = exports.funnel;
  funnel.defaultSize = 4;

  function _parallel(options) {
    if ((typeof options === "number")) { return options };
    if ((typeof options.parallel === "number")) { return options.parallel };
    return (options.parallel ? -1 : 1); };


  if ((Array.prototype.forEach_ && (Array.prototype.forEach_.version_ >= VERSION))) { return };


  try {
    Object.defineProperty({ }, "x", { });
  } catch (e) {
    return; };


  var has = Object.prototype.hasOwnProperty;

























  delete Array.prototype.forEach_;
  Object.defineProperty(Array.prototype, "forEach_", {
    configurable: true,
    writable: true,
    enumerable: false,
    value: function value__1(_, options, fn, thisObj) { var par, len, i, __this = this; var __frame = { name: "value__1", line: 124 }; return __func(_, this, arguments, value__1, 0, __frame, function __$value__1() {
        if ((typeof options === "function")) { thisObj = fn, fn = options, options = 1; } ;
        par = _parallel(options);
        thisObj = ((thisObj !== undefined) ? thisObj : __this);
        len = __this.length; return (function __$value__1(__then) {
          if (((par === 1) || (len <= 1))) {
            i = 0; var __2 = false; return (function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$value__1() { __more = false; if (__2) { i++; } else { __2 = true; } ; var __1 = (i < len); if (__1) { return (function __$value__1(__then) {
                    if (has.call(__this, i)) { return fn.call(thisObj, __cb(_, __frame, 7, 31, __then, true), __this[i], i); } else { __then(); } ; })(function __$value__1() { while (__more) { __loop(); }; __more = true; }); } else { __break(); } ; }); do { __loop(); } while (__more); __more = true; })(__then); } else {


            return __this.map_(__cb(_, __frame, 10, 9, __then, true), par, fn, thisObj); } ; })(function __$value__1() { return _(null, __this); }); }); } });




  Array.prototype.forEach_.version_ = VERSION;


  delete Array.prototype.map_;
  Object.defineProperty(Array.prototype, "map_", {
    configurable: true,
    writable: true,
    enumerable: false,
    value: function value__2(_, options, fn, thisObj) { var par, len, result, i, fun, __this = this; var __frame = { name: "value__2", line: 147 }; return __func(_, this, arguments, value__2, 0, __frame, function __$value__2() {
        if ((typeof options === "function")) { thisObj = fn, fn = options, options = 1; } ;
        par = _parallel(options);
        thisObj = ((thisObj !== undefined) ? thisObj : __this);
        len = __this.length; return (function __$value__2(__then) {

          if (((par === 1) || (len <= 1))) {
            result = new Array(len);
            i = 0; var __4 = false; return (function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$value__2() { __more = false; if (__4) { i++; } else { __4 = true; } ; var __3 = (i < len); if (__3) { return (function __$value__2(__then) {
                    if (has.call(__this, i)) { return fn.call(thisObj, __cb(_, __frame, 9, 43, function ___(__0, __1) { result[i] = __1; __then(); }, true), __this[i], i); } else { __then(); } ; })(function __$value__2() { while (__more) { __loop(); }; __more = true; }); } else { __break(); } ; }); do { __loop(); } while (__more); __more = true; })(__then); } else {


            fun = funnel(par);
            result = __this.map(function(elt, i) {
              return fun(false, function __1(_) { var __frame = { name: "__1", line: 161 }; return __func(_, this, arguments, __1, 0, __frame, function __$__1() {
                  return fn.call(thisObj, __cb(_, __frame, 1, 16, _, true), elt, i); }); }); });


            i = 0; var __7 = false; return (function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$value__2() { __more = false; if (__7) { i++; } else { __7 = true; } ; var __6 = (i < len); if (__6) { return (function __$value__2(__then) {
                    if (has.call(__this, i)) { return result[i](__cb(_, __frame, 19, 40, function ___(__0, __2) { result[i] = __2; __then(); }, true)); } else { __then(); } ; })(function __$value__2() { while (__more) { __loop(); }; __more = true; }); } else { __break(); } ; }); do { __loop(); } while (__more); __more = true; })(__then); } ; })(function __$value__2() {


          return _(null, result); }); }); } });




  delete Array.prototype.filter_;
  Object.defineProperty(Array.prototype, "filter_", {
    configurable: true,
    writable: true,
    enumerable: false,
    value: function value__3(_, options, fn, thisObj) { var par, result, len, i, elt, __this = this; var __frame = { name: "value__3", line: 179 }; return __func(_, this, arguments, value__3, 0, __frame, function __$value__3() {
        if ((typeof options === "function")) { thisObj = fn, fn = options, options = 1; } ;
        par = _parallel(options);
        thisObj = ((thisObj !== undefined) ? thisObj : __this);
        result = [];
        len = __this.length; return (function __$value__3(__then) {
          if (((par === 1) || (len <= 1))) {
            i = 0; var __4 = false; return (function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$value__3() { __more = false; if (__4) { i++; } else { __4 = true; } ; var __3 = (i < len); if (__3) { return (function __$value__3(__then) {
                    if (has.call(__this, i)) {
                      elt = __this[i];
                      return fn.call(thisObj, __cb(_, __frame, 10, 13, function ___(__0, __2) { return (function __$value__3(__then) { if (__2) { result.push(elt); __then(); } else { __then(); } ; })(__then); }, true), elt); } else { __then(); } ; })(function __$value__3() { while (__more) { __loop(); }; __more = true; }); } else { __break(); } ; }); do { __loop(); } while (__more); __more = true; })(__then); } else {



            return __this.map_(__cb(_, __frame, 14, 9, __then, true), par, function __1(_, elt) { var __frame = { name: "__1", line: 193 }; return __func(_, this, arguments, __1, 0, __frame, function __$__1() {
                return fn.call(thisObj, __cb(_, __frame, 1, 12, function ___(__0, __1) { return (function __$__1(__then) { if (__1) { result.push(elt); __then(); } else { __then(); } ; })(_); }, true), elt); });
            }, thisObj); } ; })(function __$value__3() {

          return _(null, result); }); }); } });




  delete Array.prototype.every_;
  Object.defineProperty(Array.prototype, "every_", {
    configurable: true,
    writable: true,
    enumerable: false,
    value: function value__4(_, options, fn, thisObj) { var par, len, i, fun, futures, __this = this; var __frame = { name: "value__4", line: 207 }; return __func(_, this, arguments, value__4, 0, __frame, function __$value__4() {
        if ((typeof options === "function")) { thisObj = fn, fn = options, options = 1; } ;
        par = _parallel(options);
        thisObj = ((thisObj !== undefined) ? thisObj : __this);
        len = __this.length; return (function __$value__4(__then) {
          if (((par === 1) || (len <= 1))) {
            i = 0; var __6 = false; return (function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$value__4() { __more = false; if (__6) { i++; } else { __6 = true; } ; var __5 = (i < len); if (__5) { return (function __$value__4(_) {

                    var __1 = has.call(__this, i); if (!__1) { return _(null, __1); } ; return fn.call(thisObj, __cb(_, __frame, 8, 34, function ___(__0, __3) { var __2 = !__3; return _(null, __2); }, true), __this[i]); })(__cb(_, __frame, -206, 17, function ___(__0, __3) { return (function __$value__4(__then) { if (__3) { return _(null, false); } else { __then(); } ; })(function __$value__4() { while (__more) { __loop(); }; __more = true; }); }, true)); } else { __break(); } ; }); do { __loop(); } while (__more); __more = true; })(__then); } else {


            fun = funnel(par);
            futures = __this.map(function(elt) {
              return fun(false, function __1(_) { var __frame = { name: "__1", line: 220 }; return __func(_, this, arguments, __1, 0, __frame, function __$__1() {
                  return fn.call(thisObj, __cb(_, __frame, 1, 16, _, true), elt); }); }); });


            i = 0; var __9 = false; return (function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$value__4() { __more = false; if (__9) { i++; } else { __9 = true; } ; var __8 = (i < len); if (__8) { return (function __$value__4(_) {
                    var __2 = has.call(__this, i); if (!__2) { return _(null, __2); } ; return futures[i](__cb(_, __frame, 18, 31, function ___(__0, __4) { var __3 = !__4; return _(null, __3); }, true)); })(__cb(_, __frame, -206, 17, function ___(__0, __4) { return (function __$value__4(__then) { if (__4) {
                        fun.close();
                        return _(null, false); } else { __then(); } ; })(function __$value__4() { while (__more) { __loop(); }; __more = true; }); }, true)); } else { __break(); } ; }); do { __loop(); } while (__more); __more = true; })(__then); } ; })(function __$value__4() {



          return _(null, true); }); }); } });




  delete Array.prototype.some_;
  Object.defineProperty(Array.prototype, "some_", {
    configurable: true,
    writable: true,
    enumerable: false,
    value: function value__5(_, options, fn, thisObj) { var par, len, i, fun, futures, __this = this; var __frame = { name: "value__5", line: 241 }; return __func(_, this, arguments, value__5, 0, __frame, function __$value__5() {
        if ((typeof options === "function")) { thisObj = fn, fn = options, options = 1; } ;
        par = _parallel(options);
        thisObj = ((thisObj !== undefined) ? thisObj : __this);
        len = __this.length; return (function __$value__5(__then) {
          if (((par === 1) || (len <= 1))) {
            i = 0; var __6 = false; return (function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$value__5() { __more = false; if (__6) { i++; } else { __6 = true; } ; var __5 = (i < len); if (__5) { return (function __$value__5(_) {
                    var __1 = has.call(__this, i); if (!__1) { return _(null, __1); } ; return fn.call(thisObj, __cb(_, __frame, 7, 33, _, true), __this[i]); })(__cb(_, __frame, -240, 17, function ___(__0, __3) { return (function __$value__5(__then) { if (__3) { return _(null, true); } else { __then(); } ; })(function __$value__5() { while (__more) { __loop(); }; __more = true; }); }, true)); } else { __break(); } ; }); do { __loop(); } while (__more); __more = true; })(__then); } else {


            fun = funnel(par);
            futures = __this.map(function(elt) {
              return fun(false, function __1(_) { var __frame = { name: "__1", line: 253 }; return __func(_, this, arguments, __1, 0, __frame, function __$__1() {
                  return fn.call(thisObj, __cb(_, __frame, 1, 16, _, true), elt); }); }); });


            i = 0; var __9 = false; return (function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$value__5() { __more = false; if (__9) { i++; } else { __9 = true; } ; var __8 = (i < len); if (__8) { return (function __$value__5(_) {
                    var __2 = has.call(__this, i); if (!__2) { return _(null, __2); } ; return futures[i](__cb(_, __frame, 17, 30, _, true)); })(__cb(_, __frame, -240, 17, function ___(__0, __4) { return (function __$value__5(__then) { if (__4) {
                        fun.close();
                        return _(null, true); } else { __then(); } ; })(function __$value__5() { while (__more) { __loop(); }; __more = true; }); }, true)); } else { __break(); } ; }); do { __loop(); } while (__more); __more = true; })(__then); } ; })(function __$value__5() {



          return _(null, false); }); }); } });




  delete Array.prototype.reduce_;
  Object.defineProperty(Array.prototype, "reduce_", {
    configurable: true,
    writable: true,
    enumerable: false,
    value: function value__6(_, fn, v, thisObj) { var len, i, __this = this; var __frame = { name: "value__6", line: 274 }; return __func(_, this, arguments, value__6, 0, __frame, function __$value__6() {
        thisObj = ((thisObj !== undefined) ? thisObj : __this);
        len = __this.length;
        i = 0; var __3 = false; return (function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$value__6() { __more = false; if (__3) { i++; } else { __3 = true; } ; var __2 = (i < len); if (__2) { return (function __$value__6(__then) {
                if (has.call(__this, i)) { return fn.call(thisObj, __cb(_, __frame, 4, 34, function ___(__0, __1) { v = __1; __then(); }, true), v, __this[i], i, __this); } else { __then(); } ; })(function __$value__6() { while (__more) { __loop(); }; __more = true; }); } else { __break(); } ; }); do { __loop(); } while (__more); __more = true; })(function __$value__6() {

          return _(null, v); }); }); } });




  delete Array.prototype.reduceRight_;
  Object.defineProperty(Array.prototype, "reduceRight_", {
    configurable: true,
    writable: true,
    enumerable: false,
    value: function value__7(_, fn, v, thisObj) { var len, i, __this = this; var __frame = { name: "value__7", line: 290 }; return __func(_, this, arguments, value__7, 0, __frame, function __$value__7() {
        thisObj = ((thisObj !== undefined) ? thisObj : __this);
        len = __this.length;
        i = (len - 1); var __3 = false; return (function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$value__7() { __more = false; if (__3) { i--; } else { __3 = true; } ; var __2 = (i >= 0); if (__2) { return (function __$value__7(__then) {
                if (has.call(__this, i)) { return fn.call(thisObj, __cb(_, __frame, 4, 34, function ___(__0, __1) { v = __1; __then(); }, true), v, __this[i], i, __this); } else { __then(); } ; })(function __$value__7() { while (__more) { __loop(); }; __more = true; }); } else { __break(); } ; }); do { __loop(); } while (__more); __more = true; })(function __$value__7() {

          return _(null, v); }); }); } });






  delete Array.prototype.sort_;
  Object.defineProperty(Array.prototype, "sort_", {
    configurable: true,
    writable: true,
    enumerable: false,
    value: function value__8(_, compare, beg, end) { var array, __this = this;




      function _qsort(_, beg, end) { var tmp, mid, o, nbeg, nend; var __frame = { name: "_qsort", line: 313 }; return __func(_, this, arguments, _qsort, 0, __frame, function __$_qsort() {
          if ((beg >= end)) { return _(null); } ; return (function __$_qsort(__then) {

            if ((end == (beg + 1))) {
              return compare(__cb(_, __frame, 4, 9, function ___(__0, __4) { var __3 = (__4 > 0); return (function __$_qsort(__then) { if (__3) {
                    tmp = array[beg];
                    array[beg] = array[end];
                    array[end] = tmp; __then(); } else { __then(); } ; })(function __$_qsort() { return _(null); }); }, true), array[beg], array[end]); } else { __then(); } ; })(function __$_qsort() {




            mid = Math.floor((((beg + end)) / 2));
            o = array[mid];
            nbeg = beg;
            nend = end; return (function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$_qsort() { __more = false;

                var __6 = (nbeg <= nend); if (__6) { return (function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$_qsort() { __more = false; return (function __$_qsort(_) { return (function __$_qsort(_) {
                          var __1 = (nbeg < end); if (!__1) { return _(null, __1); } ; return compare(__cb(_, __frame, 18, 26, function ___(__0, __3) { var __2 = (__3 < 0); return _(null, __2); }, true), array[nbeg], o); })(__cb(_, __frame, -312, 17, _, true)); })(__cb(_, __frame, -312, 17, function ___(__0, __7) { if (__7) { nbeg++; while (__more) { __loop(); }; __more = true; } else { __break(); } ; }, true)); }); do { __loop(); } while (__more); __more = true; })(function __$_qsort() { return (function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$_qsort() { __more = false; return (function __$_qsort(_) { return (function __$_qsort(_) {
                            var __2 = (beg < nend); if (!__2) { return _(null, __2); } ; return compare(__cb(_, __frame, 19, 26, function ___(__0, __4) { var __3 = (__4 < 0); return _(null, __3); }, true), o, array[nend]); })(__cb(_, __frame, -312, 17, _, true)); })(__cb(_, __frame, -312, 17, function ___(__0, __9) { if (__9) { nend--; while (__more) { __loop(); }; __more = true; } else { __break(); } ; }, true)); }); do { __loop(); } while (__more); __more = true; })(function __$_qsort() {

                      if ((nbeg <= nend)) {
                        tmp = array[nbeg];
                        array[nbeg] = array[nend];
                        array[nend] = tmp;
                        nbeg++;
                        nend--; } ; while (__more) { __loop(); }; __more = true; }); }); } else { __break(); } ; }); do { __loop(); } while (__more); __more = true; })(function __$_qsort() { return (function __$_qsort(__then) {



                if ((nbeg < end)) { return _qsort(__cb(_, __frame, 30, 20, __then, true), nbeg, end); } else { __then(); } ; })(function __$_qsort() { return (function __$_qsort(__then) {
                  if ((beg < nend)) { return _qsort(__cb(_, __frame, 31, 20, __then, true), beg, nend); } else { __then(); } ; })(_); }); }); }); }); }; var __frame = { name: "value__8", line: 308 }; return __func(_, this, arguments, value__8, 0, __frame, function __$value__8() { array = __this; beg = (beg || 0); end = ((end == null) ? (array.length - 1) : end);

        return _qsort(__cb(_, __frame, 38, 3, function __$value__8() {
          return _(null, array); }, true), beg, end); }); } });











  delete Function.prototype.apply_;
  Object.defineProperty(Function.prototype, "apply_", {
    configurable: true,
    writable: true,
    enumerable: false,
    value: function(callback, thisObj, args, index) {
      args = Array.prototype.slice.call(args, 0);
      args.splice((((index != null) && (index >= 0)) ? index : args.length), 0, callback);
      return this.apply(thisObj, args); } });


})(((typeof exports !== "undefined") ? exports : (Streamline.builtins = (Streamline.builtins || {}))));
