(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _lineNumbers = require("line-numbers");

var _lineNumbers2 = _interopRequireDefault(_lineNumbers);

var _repeating = require("repeating");

var _repeating2 = _interopRequireDefault(_repeating);

var _jsTokens = require("js-tokens");

var _jsTokens2 = _interopRequireDefault(_jsTokens);

var _esutils = require("esutils");

var _esutils2 = _interopRequireDefault(_esutils);

var _chalk = require("chalk");

var _chalk2 = _interopRequireDefault(_chalk);

/**
 * Chalk styles for token types.
 */

var defs = {
  string: _chalk2["default"].red,
  punctuator: _chalk2["default"].bold,
  curly: _chalk2["default"].green,
  parens: _chalk2["default"].blue.bold,
  square: _chalk2["default"].yellow,
  keyword: _chalk2["default"].cyan,
  number: _chalk2["default"].magenta,
  regex: _chalk2["default"].magenta,
  comment: _chalk2["default"].grey,
  invalid: _chalk2["default"].inverse
};

/**
 * RegExp to test for newlines in terminal.
 */

var NEWLINE = /\r\n|[\n\r\u2028\u2029]/;

/**
 * Get the type of token, specifying punctuator type.
 */

function getTokenType(match) {
  var token = _jsTokens2["default"].matchToToken(match);
  if (token.type === "name" && _esutils2["default"].keyword.isReservedWordES6(token.value)) {
    return "keyword";
  }

  if (token.type === "punctuator") {
    switch (token.value) {
      case "{":
      case "}":
        return "curly";
      case "(":
      case ")":
        return "parens";
      case "[":
      case "]":
        return "square";
    }
  }

  return token.type;
}

/**
 * Highlight `text`.
 */

function highlight(text) {
  return text.replace(_jsTokens2["default"], function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var type = getTokenType(args);
    var colorize = defs[type];
    if (colorize) {
      return args[0].split(NEWLINE).map(function (str) {
        return colorize(str);
      }).join("\n");
    } else {
      return args[0];
    }
  });
}

/**
 * Create a code frame, adding line numbers, code highlighting, and pointing to a given position.
 */

exports["default"] = function (lines, lineNumber, colNumber) {
  var opts = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

  colNumber = Math.max(colNumber, 0);

  var highlighted = opts.highlightCode && _chalk2["default"].supportsColor;
  if (highlighted) lines = highlight(lines);

  lines = lines.split(NEWLINE);

  var start = Math.max(lineNumber - 3, 0);
  var end = Math.min(lines.length, lineNumber + 3);

  if (!lineNumber && !colNumber) {
    start = 0;
    end = lines.length;
  }

  var frame = _lineNumbers2["default"](lines.slice(start, end), {
    start: start + 1,
    before: "  ",
    after: " | ",
    transform: function transform(params) {
      if (params.number !== lineNumber) {
        return;
      }

      if (colNumber) {
        params.line += "\n" + params.before + _repeating2["default"](" ", params.width) + params.after + _repeating2["default"](" ", colNumber - 1) + "^";
      }

      params.before = params.before.replace(/^./, ">");
    }
  }).join("\n");

  if (highlighted) {
    return _chalk2["default"].reset(frame);
  } else {
    return frame;
  }
};

module.exports = exports["default"];
},{"chalk":62,"esutils":73,"js-tokens":76,"line-numbers":77,"repeating":180}],2:[function(require,module,exports){
/**
 * Create an object with a `null` prototype.
 */

"use strict";

exports.__esModule = true;

exports["default"] = function () {
  return Object.create(null);
};

module.exports = exports["default"];
},{}],3:[function(require,module,exports){
"use strict";

exports.__esModule = true;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

var _babylon = require("babylon");

var babylon = _interopRequireWildcard(_babylon);

/**
 * Parse `code` with normalized options, collecting tokens and comments.
 */

exports["default"] = function (code) {
  var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var parseOpts = {
    allowImportExportEverywhere: opts.looseModules,
    allowReturnOutsideFunction: opts.looseModules,
    allowHashBang: true,
    ecmaVersion: 6,
    strictMode: opts.strictMode,
    sourceType: opts.sourceType,
    locations: true,
    features: opts.features || {},
    plugins: opts.plugins || {}
  };

  if (opts.nonStandard) {
    parseOpts.plugins.jsx = true;
    parseOpts.plugins.flow = true;
  }

  return babylon.parse(code, parseOpts);
};

module.exports = exports["default"];
},{"babylon":42}],4:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.get = get;
exports.parseArgs = parseArgs;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

var _util = require("util");

var util = _interopRequireWildcard(_util);

/**
 * Mapping of messages to be used in Babel.
 * Messages can include $0-style placeholders.
 */

var MESSAGES = {
  tailCallReassignmentDeopt: "Function reference has been reassigned, so it will probably be dereferenced, therefore we can't optimise this with confidence",
  JSXNamespacedTags: "Namespace tags are not supported. ReactJSX is not XML.",
  classesIllegalBareSuper: "Illegal use of bare super",
  classesIllegalSuperCall: "Direct super call is illegal in non-constructor, use super.$1() instead",
  scopeDuplicateDeclaration: "Duplicate declaration $1",
  settersNoRest: "Setters aren't allowed to have a rest",
  noAssignmentsInForHead: "No assignments allowed in for-in/of head",
  expectedMemberExpressionOrIdentifier: "Expected type MemberExpression or Identifier",
  invalidParentForThisNode: "We don't know how to handle this node within the current parent - please open an issue",
  readOnly: "$1 is read-only",
  unknownForHead: "Unknown node type $1 in ForStatement",
  didYouMean: "Did you mean $1?",
  codeGeneratorDeopt: "Note: The code generator has deoptimised the styling of $1 as it exceeds the max of $2.",
  missingTemplatesDirectory: "no templates directory - this is most likely the result of a broken `npm publish`. Please report to https://github.com/babel/babel/issues",
  unsupportedOutputType: "Unsupported output type $1",
  illegalMethodName: "Illegal method name $1",
  lostTrackNodePath: "We lost track of this node's position, likely because the AST was directly manipulated",

  modulesIllegalExportName: "Illegal export $1",
  modulesDuplicateDeclarations: "Duplicate module declarations with the same source but in different scopes",

  undeclaredVariable: "Reference to undeclared variable $1",
  undeclaredVariableType: "Referencing a type alias outside of a type annotation",
  undeclaredVariableSuggestion: "Reference to undeclared variable $1 - did you mean $2?",

  traverseNeedsParent: "You must pass a scope and parentPath unless traversing a Program/File got a $1 node",
  traverseVerifyRootFunction: "You passed `traverse()` a function when it expected a visitor object, are you sure you didn't mean `{ enter: Function }`?",
  traverseVerifyVisitorProperty: "You passed `traverse()` a visitor object with the property $1 that has the invalid property $2",
  traverseVerifyNodeType: "You gave us a visitor for the node type $1 but it's not a valid type",

  pluginIllegalKind: "Illegal kind $1 for plugin $2",
  pluginIllegalPosition: "Illegal position $1 for plugin $2",
  pluginKeyCollision: "The plugin $1 collides with another of the same name",
  pluginNotTransformer: "The plugin $1 didn't export a Plugin instance",
  pluginUnknown: "Unknown plugin $1",

  pluginNotFile: "Plugin $1 is resolving to a different Babel version than what is performing the transformation.",

  pluginInvalidProperty: "Plugin $1 provided an invalid property of $2.",
  pluginInvalidPropertyVisitor: "Define your visitor methods inside a `visitor` property like so:\n\n  new Plugin(\"foobar\", {\n    visitor: {\n      // define your visitor methods here!\n    }\n  });\n"
};

exports.MESSAGES = MESSAGES;
/**
 * Get a message with $0 placeholders replaced by arguments.
 */

function get(key) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  var msg = MESSAGES[key];
  if (!msg) throw new ReferenceError("Unknown message " + JSON.stringify(key));

  // stringify args
  args = parseArgs(args);

  // replace $0 placeholders with args
  return msg.replace(/\$(\d+)/g, function (str, i) {
    return args[--i];
  });
}

/**
 * Stingify arguments to be used inside messages.
 */

function parseArgs(args) {
  return args.map(function (val) {
    if (val != null && val.inspect) {
      return val.inspect();
    } else {
      try {
        return JSON.stringify(val) || val + "";
      } catch (e) {
        return util.inspect(val);
      }
    }
  });
}
},{"util":193}],5:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.isCompatTag = isCompatTag;
exports.buildChildren = buildChildren;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

var _types = require("../../types");

var t = _interopRequireWildcard(_types);

var isReactComponent = t.buildMatchMemberExpression("React.Component");

exports.isReactComponent = isReactComponent;
/**
 * [Please add a description.]
 */

function isCompatTag(tagName) {
  return tagName && /^[a-z]|\-/.test(tagName);
}

/**
 * [Please add a description.]
 */

function cleanJSXElementLiteralChild(child, args) {
  var lines = child.value.split(/\r\n|\n|\r/);

  var lastNonEmptyLine = 0;

  for (var i = 0; i < lines.length; i++) {
    if (lines[i].match(/[^ \t]/)) {
      lastNonEmptyLine = i;
    }
  }

  var str = "";

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    var isFirstLine = i === 0;
    var isLastLine = i === lines.length - 1;
    var isLastNonEmptyLine = i === lastNonEmptyLine;

    // replace rendered whitespace tabs with spaces
    var trimmedLine = line.replace(/\t/g, " ");

    // trim whitespace touching a newline
    if (!isFirstLine) {
      trimmedLine = trimmedLine.replace(/^[ ]+/, "");
    }

    // trim whitespace touching an endline
    if (!isLastLine) {
      trimmedLine = trimmedLine.replace(/[ ]+$/, "");
    }

    if (trimmedLine) {
      if (!isLastNonEmptyLine) {
        trimmedLine += " ";
      }

      str += trimmedLine;
    }
  }

  if (str) args.push(t.literal(str));
}

/**
 * [Please add a description.]
 */

function buildChildren(node) {
  var elems = [];

  for (var i = 0; i < node.children.length; i++) {
    var child = node.children[i];

    if (t.isLiteral(child) && typeof child.value === "string") {
      cleanJSXElementLiteralChild(child, elems);
      continue;
    }

    if (t.isJSXExpressionContainer(child)) child = child.expression;
    if (t.isJSXEmptyExpression(child)) continue;

    elems.push(child);
  }

  return elems;
}
},{"../../types":38}],6:[function(require,module,exports){
"use strict";

exports.__esModule = true;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// istanbul ignore next

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _path = require("./path");

var _path2 = _interopRequireDefault(_path);

var _types = require("../types");

var t = _interopRequireWildcard(_types);

/**
 * [Please add a description.]
 */

var TraversalContext = (function () {
  function TraversalContext(scope, opts, state, parentPath) {
    _classCallCheck(this, TraversalContext);

    this.queue = null;

    this.parentPath = parentPath;
    this.scope = scope;
    this.state = state;
    this.opts = opts;
  }

  /**
   * [Please add a description.]
   */

  TraversalContext.prototype.shouldVisit = function shouldVisit(node) {
    var opts = this.opts;
    if (opts.enter || opts.exit) return true;

    if (opts[node.type]) return true;

    var keys = t.VISITOR_KEYS[node.type];
    if (!keys || !keys.length) return false;

    var _arr = keys;
    for (var _i = 0; _i < _arr.length; _i++) {
      var key = _arr[_i];
      if (node[key]) return true;
    }

    return false;
  };

  /**
   * [Please add a description.]
   */

  TraversalContext.prototype.create = function create(node, obj, key, listKey) {
    var path = _path2["default"].get({
      parentPath: this.parentPath,
      parent: node,
      container: obj,
      key: key,
      listKey: listKey
    });
    path.unshiftContext(this);
    return path;
  };

  /**
   * [Please add a description.]
   */

  TraversalContext.prototype.visitMultiple = function visitMultiple(container, parent, listKey) {
    // nothing to traverse!
    if (container.length === 0) return false;

    var visited = [];

    var queue = this.queue = [];
    var stop = false;

    // build up initial queue
    for (var key = 0; key < container.length; key++) {
      var self = container[key];
      if (self && this.shouldVisit(self)) {
        queue.push(this.create(parent, container, key, listKey));
      }
    }

    // visit the queue
    var _arr2 = queue;
    for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
      var path = _arr2[_i2];
      path.resync();

      if (visited.indexOf(path.node) >= 0) continue;
      visited.push(path.node);

      if (path.visit()) {
        stop = true;
        break;
      }
    }

    var _arr3 = queue;
    for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
      var path = _arr3[_i3];
      path.shiftContext();
    }

    this.queue = null;

    return stop;
  };

  /**
   * [Please add a description.]
   */

  TraversalContext.prototype.visitSingle = function visitSingle(node, key) {
    if (this.shouldVisit(node[key])) {
      var path = this.create(node, node, key);
      path.visit();
      path.shiftContext();
    }
  };

  /**
   * [Please add a description.]
   */

  TraversalContext.prototype.visit = function visit(node, key) {
    var nodes = node[key];
    if (!nodes) return;

    if (Array.isArray(nodes)) {
      return this.visitMultiple(nodes, node, key);
    } else {
      return this.visitSingle(node, key);
    }
  };

  return TraversalContext;
})();

exports["default"] = TraversalContext;
module.exports = exports["default"];
},{"../types":38,"./path":14}],7:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = traverse;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _context = require("./context");

var _context2 = _interopRequireDefault(_context);

var _visitors = require("./visitors");

var visitors = _interopRequireWildcard(_visitors);

var _messages = require("../messages");

var messages = _interopRequireWildcard(_messages);

var _lodashCollectionIncludes = require("lodash/collection/includes");

var _lodashCollectionIncludes2 = _interopRequireDefault(_lodashCollectionIncludes);

var _types = require("../types");

var t = _interopRequireWildcard(_types);

/**
 * [Please add a description.]
 */

function traverse(parent, opts, scope, state, parentPath) {
  if (!parent) return;
  if (!opts) opts = {};

  if (!opts.noScope && !scope) {
    if (parent.type !== "Program" && parent.type !== "File") {
      throw new Error(messages.get("traverseNeedsParent", parent.type));
    }
  }

  visitors.explode(opts);

  // array of nodes
  if (Array.isArray(parent)) {
    for (var i = 0; i < parent.length; i++) {
      traverse.node(parent[i], opts, scope, state, parentPath);
    }
  } else {
    traverse.node(parent, opts, scope, state, parentPath);
  }
}

traverse.visitors = visitors;
traverse.verify = visitors.verify;
traverse.explode = visitors.explode;

/**
 * [Please add a description.]
 */

traverse.node = function (node, opts, scope, state, parentPath, skipKeys) {
  var keys = t.VISITOR_KEYS[node.type];
  if (!keys) return;

  var context = new _context2["default"](scope, opts, state, parentPath);
  var _arr = keys;
  for (var _i = 0; _i < _arr.length; _i++) {
    var key = _arr[_i];
    if (skipKeys && skipKeys[key]) continue;
    if (context.visit(node, key)) return;
  }
};

/**
 * [Please add a description.]
 */

var CLEAR_KEYS = t.COMMENT_KEYS.concat(["_scopeInfo", "_paths", "tokens", "comments", "start", "end", "loc", "raw", "rawValue"]);

/**
 * [Please add a description.]
 */

traverse.clearNode = function (node) {
  for (var i = 0; i < CLEAR_KEYS.length; i++) {
    var key = CLEAR_KEYS[i];
    if (node[key] != null) node[key] = undefined;
  }
};

/**
 * [Please add a description.]
 */

var clearVisitor = {
  noScope: true,
  exit: traverse.clearNode
};

/**
 * [Please add a description.]
 */

traverse.removeProperties = function (tree) {
  traverse(tree, clearVisitor);
  traverse.clearNode(tree);

  return tree;
};

/**
 * [Please add a description.]
 */

function hasBlacklistedType(node, parent, scope, state) {
  if (node.type === state.type) {
    state.has = true;
    this.skip();
  }
}

/**
 * [Please add a description.]
 */

traverse.hasType = function (tree, scope, type, blacklistTypes) {
  // the node we're searching in is blacklisted
  if (_lodashCollectionIncludes2["default"](blacklistTypes, tree.type)) return false;

  // the type we're looking for is the same as the passed node
  if (tree.type === type) return true;

  var state = {
    has: false,
    type: type
  };

  traverse(tree, {
    blacklist: blacklistTypes,
    enter: hasBlacklistedType
  }, scope, state);

  return state.has;
};
module.exports = exports["default"];
},{"../messages":4,"../types":38,"./context":6,"./visitors":27,"lodash/collection/includes":86}],8:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.findParent = findParent;
exports.getFunctionParent = getFunctionParent;
exports.getStatementParent = getStatementParent;
exports.getEarliestCommonAncestorFrom = getEarliestCommonAncestorFrom;
exports.getDeepestCommonAncestorFrom = getDeepestCommonAncestorFrom;
exports.getAncestry = getAncestry;
exports.inType = inType;
exports.inShadow = inShadow;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

var _types = require("../../types");

var t = _interopRequireWildcard(_types);

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

/**
 * Call the provided `callback` with the `NodePath`s of all the parents.
 * When the `callback` returns a truthy value, we return that node path.
 */

function findParent(callback) {
  var path = this;
  while (path = path.parentPath) {
    if (callback(path)) return path;
  }
  return null;
}

/**
 * Get the parent function of the current path.
 */

function getFunctionParent() {
  return this.findParent(function (path) {
    return path.isFunction() || path.isProgram();
  });
}

/**
 * Walk up the tree until we hit a parent node path in a list.
 */

function getStatementParent() {
  var path = this;
  do {
    if (Array.isArray(path.container)) {
      return path;
    }
  } while (path = path.parentPath);
}

/**
 * Get the deepest common ancestor and then from it, get the earliest relationship path
 * to that ancestor.
 *
 * Earliest is defined as being "before" all the other nodes in terms of list container
 * position and visiting key.
 */

function getEarliestCommonAncestorFrom(paths) {
  return this.getDeepestCommonAncestorFrom(paths, function (deepest, i, ancestries) {
    var earliest;
    var keys = t.VISITOR_KEYS[deepest.type];

    var _arr = ancestries;
    for (var _i = 0; _i < _arr.length; _i++) {
      var ancestry = _arr[_i];
      var path = ancestry[i + 1];

      // first path
      if (!earliest) {
        earliest = path;
        continue;
      }

      // handle containers
      if (path.listKey && earliest.listKey === path.listKey) {
        // we're in the same container so check if we're earlier
        if (path.key < earliest.key) {
          earliest = path;
          continue;
        }
      }

      // handle keys
      var earliestKeyIndex = keys.indexOf(earliest.parentKey);
      var currentKeyIndex = keys.indexOf(path.parentKey);
      if (earliestKeyIndex > currentKeyIndex) {
        // key appears before so it's earlier
        earliest = path;
      }
    }

    return earliest;
  });
}

/**
 * Get the earliest path in the tree where the provided `paths` intersect.
 *
 * TODO: Possible optimisation target.
 */

function getDeepestCommonAncestorFrom(paths, filter) {
  // istanbul ignore next

  var _this = this;

  if (!paths.length) {
    return this;
  }

  if (paths.length === 1) {
    return paths[0];
  }

  // minimum depth of the tree so we know the highest node
  var minDepth = Infinity;

  // last common ancestor
  var lastCommonIndex, lastCommon;

  // get the ancestors of the path, breaking when the parent exceeds ourselves
  var ancestries = paths.map(function (path) {
    var ancestry = [];

    do {
      ancestry.unshift(path);
    } while ((path = path.parentPath) && path !== _this);

    // save min depth to avoid going too far in
    if (ancestry.length < minDepth) {
      minDepth = ancestry.length;
    }

    return ancestry;
  });

  // get the first ancestry so we have a seed to assess all other ancestries with
  var first = ancestries[0];

  // check ancestor equality
  depthLoop: for (var i = 0; i < minDepth; i++) {
    var shouldMatch = first[i];

    var _arr2 = ancestries;
    for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
      var ancestry = _arr2[_i2];
      if (ancestry[i] !== shouldMatch) {
        // we've hit a snag
        break depthLoop;
      }
    }

    // next iteration may break so store these so they can be returned
    lastCommonIndex = i;
    lastCommon = shouldMatch;
  }

  if (lastCommon) {
    if (filter) {
      return filter(lastCommon, lastCommonIndex, ancestries);
    } else {
      return lastCommon;
    }
  } else {
    throw new Error("Couldn't find intersection");
  }
}

/**
 * Build an array of node paths containing the entire ancestry of the current node path.
 *
 * NOTE: The current node path is included in this.
 */

function getAncestry() {
  var path = this;
  var paths = [];
  do {
    paths.push(path);
  } while (path = path.parentPath);
  return paths;
}

/**
 * [Please add a description.]
 */

function inType() {
  var path = this;
  while (path) {
    var _arr3 = arguments;

    for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
      var type = _arr3[_i3];
      if (path.node.type === type) return true;
    }
    path = path.parentPath;
  }

  return false;
}

/**
 * Check if we're inside a shadowed function.
 */

function inShadow(key) {
  var path = this;
  do {
    if (path.isFunction()) {
      var shadow = path.node.shadow;
      if (shadow) {
        // this is because sometimes we may have a `shadow` value of:
        //
        //   { this: false }
        //
        // we need to catch this case if `inShadow` has been passed a `key`
        if (!key || shadow[key] !== false) {
          return path;
        }
      } else if (path.isArrowFunctionExpression()) {
        return path;
      }

      // normal function, we've found our function context
      return null;
    }
  } while (path = path.parentPath);
  return null;
}
},{"../../types":38,"./index":14}],9:[function(require,module,exports){
/**
 * Share comments amongst siblings.
 */

"use strict";

exports.__esModule = true;
exports.shareCommentsWithSiblings = shareCommentsWithSiblings;
exports.addComment = addComment;
exports.addComments = addComments;

function shareCommentsWithSiblings() {
  var node = this.node;
  if (!node) return;

  var trailing = node.trailingComments;
  var leading = node.leadingComments;
  if (!trailing && !leading) return;

  var prev = this.getSibling(this.key - 1);
  var next = this.getSibling(this.key + 1);

  if (!prev.node) prev = next;
  if (!next.node) next = prev;

  prev.addComments("trailing", leading);
  next.addComments("leading", trailing);
}

/**
 * [Please add a description.]
 */

function addComment(type, content, line) {
  this.addComments(type, [{
    type: line ? "CommentLine" : "CommentBlock",
    value: content
  }]);
}

/**
 * Give node `comments` of the specified `type`.
 */

function addComments(type, comments) {
  if (!comments) return;

  var node = this.node;
  if (!node) return;

  var key = type + "Comments";

  if (node[key]) {
    node[key] = node[key].concat(comments);
  } else {
    node[key] = comments;
  }
}
},{}],10:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.call = call;
exports.isBlacklisted = isBlacklisted;
exports.visit = visit;
exports.skip = skip;
exports.skipKey = skipKey;
exports.stop = stop;
exports.setScope = setScope;
exports.setContext = setContext;
exports.resync = resync;
exports._resyncParent = _resyncParent;
exports._resyncKey = _resyncKey;
exports._resyncList = _resyncList;
exports._resyncRemoved = _resyncRemoved;
exports.shiftContext = shiftContext;
exports.unshiftContext = unshiftContext;
exports.setup = setup;
exports.setKey = setKey;
exports.queueNode = queueNode;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _index = require("../index");

var _index2 = _interopRequireDefault(_index);

/**
 * [Please add a description.]
 */

function call(key) {
  var node = this.node;
  if (!node) return;

  var opts = this.opts;

  var _arr = [opts[key], opts[node.type] && opts[node.type][key]];
  for (var _i = 0; _i < _arr.length; _i++) {
    var fns = _arr[_i];
    if (!fns) continue;

    var _arr2 = fns;
    for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
      var fn = _arr2[_i2];
      if (!fn) continue;

      var _node = this.node;
      if (!_node) return;

      var previousType = this.type;

      // call the function with the params (node, parent, scope, state)
      var replacement = fn.call(this, _node, this.parent, this.scope, this.state);

      if (replacement) {
        this.replaceWith(replacement, true);
      }

      if (this.shouldStop || this.shouldSkip || this.removed) return;

      if (previousType !== this.type) {
        this.queueNode(this);
        return;
      }
    }
  }
}

/**
 * [Please add a description.]
 */

function isBlacklisted() {
  var blacklist = this.opts.blacklist;
  return blacklist && blacklist.indexOf(this.node.type) > -1;
}

/**
 * Visits a node and calls appropriate enter and exit callbacks
 * as required.
 */

function visit() {
  if (this.isBlacklisted()) return false;
  if (this.opts.shouldSkip && this.opts.shouldSkip(this)) return false;

  this.call("enter");

  if (this.shouldSkip) {
    return this.shouldStop;
  }

  var node = this.node;
  var opts = this.opts;

  if (node) {
    if (Array.isArray(node)) {
      // traverse over these replacement nodes we purposely don't call exitNode
      // as the original node has been destroyed
      for (var i = 0; i < node.length; i++) {
        _index2["default"].node(node[i], opts, this.scope, this.state, this, this.skipKeys);
      }
    } else {
      _index2["default"].node(node, opts, this.scope, this.state, this, this.skipKeys);
      this.call("exit");
    }
  }

  return this.shouldStop;
}

/**
 * Sets shouldSkip flag true so that this node will be skipped while visiting.
 */

function skip() {
  this.shouldSkip = true;
}

/**
 * Adds given key to the list of keys to be skipped.
 */

function skipKey(key) {
  this.skipKeys[key] = true;
}

/**
 * [Please add a description.]
 */

function stop() {
  this.shouldStop = true;
  this.shouldSkip = true;
}

/**
 * [Please add a description.]
 */

function setScope() {
  if (this.opts && this.opts.noScope) return;

  var target = this.context || this.parentPath;
  this.scope = this.getScope(target && target.scope);
  if (this.scope) this.scope.init();
}

/**
 * [Please add a description.]
 */

function setContext(context) {
  this.shouldSkip = false;
  this.shouldStop = false;
  this.removed = false;
  this.skipKeys = {};

  if (context) {
    this.context = context;
    this.state = context.state;
    this.opts = context.opts;
  }

  this.setScope();

  return this;
}

/**
 * Here we resync the node paths `key` and `container`. If they've changed according
 * to what we have stored internally then we attempt to resync by crawling and looking
 * for the new values.
 */

function resync() {
  if (this.removed) return;

  this._resyncParent();
  this._resyncList();
  this._resyncKey();
  //this._resyncRemoved();
}

/**
 * [Please add a description.]
 */

function _resyncParent() {
  if (this.parentPath) {
    this.parent = this.parentPath.node;
  }
}

/**
 * [Please add a description.]
 */

function _resyncKey() {
  if (!this.container) return;

  if (this.node === this.container[this.key]) return;

  // grrr, path key is out of sync. this is likely due to a modification to the AST
  // not done through our path APIs

  if (Array.isArray(this.container)) {
    for (var i = 0; i < this.container.length; i++) {
      if (this.container[i] === this.node) {
        return this.setKey(i);
      }
    }
  } else {
    for (var key in this.container) {
      if (this.container[key] === this.node) {
        return this.setKey(key);
      }
    }
  }

  this.key = null;
}

/**
 * [Please add a description.]
 */

function _resyncList() {
  var listKey = this.listKey;
  var parentPath = this.parentPath;
  if (!listKey || !parentPath) return;

  var newContainer = parentPath.node[listKey];
  if (this.container === newContainer) return;

  // container is out of sync. this is likely the result of it being reassigned

  if (newContainer) {
    this.container = newContainer;
  } else {
    this.container = null;
  }
}

/**
 * [Please add a description.]
 */

function _resyncRemoved() {
  if (this.key == null || !this.container || this.container[this.key] !== this.node) {
    this._markRemoved();
  }
}

/**
 * [Please add a description.]
 */

function shiftContext() {
  this.contexts.shift();
  this.setContext(this.contexts[0]);
}

/**
 * [Please add a description.]
 */

function unshiftContext(context) {
  this.contexts.unshift(context);
  this.setContext(context);
}

/**
 * [Please add a description.]
 */

function setup(parentPath, container, listKey, key) {
  this.inList = !!listKey;
  this.listKey = listKey;
  this.parentKey = listKey || key;
  this.container = container;

  this.parentPath = parentPath || this.parentPath;
  this.setKey(key);
}

/**
 * [Please add a description.]
 */

function setKey(key) {
  this.key = key;
  this.node = this.container[this.key];
  this.type = this.node && this.node.type;
}

/**
 * [Please add a description.]
 */

function queueNode(path) {
  var _arr3 = this.contexts;

  for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
    var context = _arr3[_i3];
    if (context.queue) {
      context.queue.push(path);
    }
  }
}
},{"../index":7}],11:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.toComputedKey = toComputedKey;
exports.ensureBlock = ensureBlock;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

var _types = require("../../types");

var t = _interopRequireWildcard(_types);

/**
 * [Please add a description.]
 */

function toComputedKey() {
  var node = this.node;

  var key;
  if (this.isMemberExpression()) {
    key = node.property;
  } else if (this.isProperty()) {
    key = node.key;
  } else {
    throw new ReferenceError("todo");
  }

  if (!node.computed) {
    if (t.isIdentifier(key)) key = t.literal(key.name);
  }

  return key;
}

/**
 * [Please add a description.]
 */

function ensureBlock() {
  return t.ensureBlock(this.node);
}
},{"../../types":38}],12:[function(require,module,exports){
(function (global){
/* eslint eqeqeq: 0 */

"use strict";

exports.__esModule = true;
exports.evaluateTruthy = evaluateTruthy;
exports.evaluate = evaluate;
var VALID_CALLEES = ["String", "Number", "Math"];

/**
 * Walk the input `node` and statically evaluate if it's truthy.
 *
 * Returning `true` when we're sure that the expression will evaluate to a
 * truthy value, `false` if we're sure that it will evaluate to a falsy
 * value and `undefined` if we aren't sure. Because of this please do not
 * rely on coercion when using this method and check with === if it's false.
 *
 * For example do:
 *
 *   if (t.evaluateTruthy(node) === false) falsyLogic();
 *
 * **AND NOT**
 *
 *   if (!t.evaluateTruthy(node)) falsyLogic();
 *
 */

function evaluateTruthy() {
  var res = this.evaluate();
  if (res.confident) return !!res.value;
}

/**
 * Walk the input `node` and statically evaluate it.
 *
 * Returns an object in the form `{ confident, value }`. `confident` indicates
 * whether or not we had to drop out of evaluating the expression because of
 * hitting an unknown node that we couldn't confidently find the value of.
 *
 * Example:
 *
 *   t.evaluate(parse("5 + 5")) // { confident: true, value: 10 }
 *   t.evaluate(parse("!true")) // { confident: true, value: false }
 *   t.evaluate(parse("foo + foo")) // { confident: false, value: undefined }
 *
 */

function evaluate() {
  var confident = true;

  var value = evaluate(this);
  if (!confident) value = undefined;
  return {
    confident: confident,
    value: value
  };

  function evaluate(path) {
    if (!confident) return;

    var node = path.node;

    if (path.isSequenceExpression()) {
      var exprs = path.get("expressions");
      return evaluate(exprs[exprs.length - 1]);
    }

    if (path.isLiteral()) {
      if (node.regex) {
        // we have a regex and we can't represent it natively
      } else {
          return node.value;
        }
    }

    if (path.isConditionalExpression()) {
      if (evaluate(path.get("test"))) {
        return evaluate(path.get("consequent"));
      } else {
        return evaluate(path.get("alternate"));
      }
    }

    if (path.isTypeCastExpression()) {
      return evaluate(path.get("expression"));
    }

    if (path.isIdentifier() && !path.scope.hasBinding(node.name, true)) {
      if (node.name === "undefined") {
        return undefined;
      } else if (node.name === "Infinity") {
        return Infinity;
      } else if (node.name === "NaN") {
        return NaN;
      }
    }

    // "foo".length
    if (path.isMemberExpression() && !path.parentPath.isCallExpression({ callee: node })) {
      var _property = path.get("property");
      var object = path.get("object");

      if (object.isLiteral() && _property.isIdentifier()) {
        var _value = object.node.value;
        var type = typeof _value;
        if (type === "number" || type === "string") {
          return _value[_property.node.name];
        }
      }
    }

    if (path.isReferencedIdentifier()) {
      var binding = path.scope.getBinding(node.name);
      if (binding && binding.hasValue) {
        return binding.value;
      } else {
        var resolved = path.resolve();
        if (resolved === path) {
          return confident = false;
        } else {
          return evaluate(resolved);
        }
      }
    }

    if (path.isUnaryExpression({ prefix: true })) {
      var argument = path.get("argument");
      var arg = evaluate(argument);
      switch (node.operator) {
        case "void":
          return undefined;
        case "!":
          return !arg;
        case "+":
          return +arg;
        case "-":
          return -arg;
        case "~":
          return ~arg;
        case "typeof":
          if (argument.isFunction()) {
            return "function";
          } else {
            return typeof arg;
          }
      }
    }

    if (path.isArrayExpression() || path.isObjectExpression()) {
      // we could evaluate these but it's probably impractical and not very useful
    }

    if (path.isLogicalExpression()) {
      // If we are confident that one side of an && is false, or one side of
      // an || is true, we can be confident about the entire expression
      var wasConfident = confident;
      var left = evaluate(path.get("left"));
      var leftConfident = confident;
      confident = wasConfident;
      var right = evaluate(path.get("right"));
      var rightConfident = confident;
      var uncertain = leftConfident !== rightConfident;
      confident = leftConfident && rightConfident;

      switch (node.operator) {
        case "||":
          if ((left || right) && uncertain) {
            confident = true;
          }
          return left || right;
        case "&&":
          if (!left && leftConfident || !right && rightConfident) {
            confident = true;
          }
          return left && right;
      }
    }

    if (path.isBinaryExpression()) {
      var left = evaluate(path.get("left"));
      var right = evaluate(path.get("right"));

      switch (node.operator) {
        case "-":
          return left - right;
        case "+":
          return left + right;
        case "/":
          return left / right;
        case "*":
          return left * right;
        case "%":
          return left % right;
        case "**":
          return Math.pow(left, right);
        case "<":
          return left < right;
        case ">":
          return left > right;
        case "<=":
          return left <= right;
        case ">=":
          return left >= right;
        case "==":
          return left == right;
        case "!=":
          return left != right;
        case "===":
          return left === right;
        case "!==":
          return left !== right;
        case "|":
          return left | right;
        case "&":
          return left & right;
        case "^":
          return left ^ right;
        case "<<":
          return left << right;
        case ">>":
          return left >> right;
        case ">>>":
          return left >>> right;
      }
    }

    if (path.isCallExpression()) {
      var callee = path.get("callee");
      var context;
      var func;

      // Number(1);
      if (callee.isIdentifier() && !path.scope.getBinding(callee.node.name, true) && VALID_CALLEES.indexOf(callee.node.name) >= 0) {
        func = global[node.callee.name];
      }

      if (callee.isMemberExpression()) {
        var object = callee.get("object");
        var property = callee.get("property");

        // Math.min(1, 2)
        if (object.isIdentifier() && property.isIdentifier() && VALID_CALLEES.indexOf(object.node.name) >= 0) {
          context = global[object.node.name];
          func = context[property.node.name];
        }

        // "abc".charCodeAt(4)
        if (object.isLiteral() && property.isIdentifier()) {
          var type = typeof object.node.value;
          if (type === "string" || type === "number") {
            context = object.node.value;
            func = context[property.node.name];
          }
        }
      }

      if (func) {
        var args = path.get("arguments").map(evaluate);
        if (!confident) return;

        return func.apply(context, args);
      }
    }

    confident = false;
  }
}
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],13:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.getStatementParent = getStatementParent;
exports.getOpposite = getOpposite;
exports.getCompletionRecords = getCompletionRecords;
exports.getSibling = getSibling;
exports.get = get;
exports._getKey = _getKey;
exports._getPattern = _getPattern;
exports.getBindingIdentifiers = getBindingIdentifiers;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

var _types = require("../../types");

var t = _interopRequireWildcard(_types);

/**
 * [Please add a description.]
 */

function getStatementParent() {
  var path = this;

  do {
    if (!path.parentPath || Array.isArray(path.container) && path.isStatement()) {
      break;
    } else {
      path = path.parentPath;
    }
  } while (path);

  if (path && (path.isProgram() || path.isFile())) {
    throw new Error("File/Program node, we can't possibly find a statement parent to this");
  }

  return path;
}

/**
 * [Please add a description.]
 */

function getOpposite() {
  if (this.key === "left") {
    return this.getSibling("right");
  } else if (this.key === "right") {
    return this.getSibling("left");
  }
}

/**
 * [Please add a description.]
 */

function getCompletionRecords() {
  var paths = [];

  var add = function add(path) {
    if (path) paths = paths.concat(path.getCompletionRecords());
  };

  if (this.isIfStatement()) {
    add(this.get("consequent"));
    add(this.get("alternate"));
  } else if (this.isDoExpression() || this.isFor() || this.isWhile()) {
    add(this.get("body"));
  } else if (this.isProgram() || this.isBlockStatement()) {
    add(this.get("body").pop());
  } else if (this.isFunction()) {
    return this.get("body").getCompletionRecords();
  } else if (this.isTryStatement()) {
    add(this.get("block"));
    add(this.get("handler"));
    add(this.get("finalizer"));
  } else {
    paths.push(this);
  }

  return paths;
}

/**
 * [Please add a description.]
 */

function getSibling(key) {
  return _index2["default"].get({
    parentPath: this.parentPath,
    parent: this.parent,
    container: this.container,
    listKey: this.listKey,
    key: key
  });
}

/**
 * [Please add a description.]
 */

function get(key, context) {
  if (context === true) context = this.context;
  var parts = key.split(".");
  if (parts.length === 1) {
    // "foo"
    return this._getKey(key, context);
  } else {
    // "foo.bar"
    return this._getPattern(parts, context);
  }
}

/**
 * [Please add a description.]
 */

function _getKey(key, context) {
  // istanbul ignore next

  var _this = this;

  var node = this.node;
  var container = node[key];

  if (Array.isArray(container)) {
    // requested a container so give them all the paths
    return container.map(function (_, i) {
      return _index2["default"].get({
        listKey: key,
        parentPath: _this,
        parent: node,
        container: container,
        key: i
      }).setContext(context);
    });
  } else {
    return _index2["default"].get({
      parentPath: this,
      parent: node,
      container: node,
      key: key
    }).setContext(context);
  }
}

/**
 * [Please add a description.]
 */

function _getPattern(parts, context) {
  var path = this;
  var _arr = parts;
  for (var _i = 0; _i < _arr.length; _i++) {
    var part = _arr[_i];
    if (part === ".") {
      path = path.parentPath;
    } else {
      if (Array.isArray(path)) {
        path = path[part];
      } else {
        path = path.get(part, context);
      }
    }
  }
  return path;
}

/**
 * [Please add a description.]
 */

function getBindingIdentifiers(duplicates) {
  return t.getBindingIdentifiers(this.node, duplicates);
}
},{"../../types":38,"./index":14}],14:[function(require,module,exports){
"use strict";

exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

// istanbul ignore next

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _libVirtualTypes = require("./lib/virtual-types");

var virtualTypes = _interopRequireWildcard(_libVirtualTypes);

var _index = require("../index");

var _index2 = _interopRequireDefault(_index);

var _lodashObjectAssign = require("lodash/object/assign");

var _lodashObjectAssign2 = _interopRequireDefault(_lodashObjectAssign);

var _scope = require("../scope");

var _scope2 = _interopRequireDefault(_scope);

var _types = require("../../types");

var t = _interopRequireWildcard(_types);

/**
 * [Please add a description.]
 */

var NodePath = (function () {

  /**
   * [Please add a description.]
   */

  function NodePath(hub, parent) {
    _classCallCheck(this, NodePath);

    this.contexts = [];
    this.parent = parent;
    this.data = {};
    this.hub = hub;

    this.shouldSkip = false;
    this.shouldStop = false;
    this.removed = false;
    this.state = null;
    this.opts = null;
    this.skipKeys = null;
    this.parentPath = null;
    this.context = null;
    this.container = null;
    this.listKey = null;
    this.inList = false;
    this.parentKey = null;
    this.key = null;
    this.node = null;
    this.scope = null;
    this.type = null;
    this.typeAnnotation = null;
  }

  /**
   * [Please add a description.]
   */

  /**
   * [Please add a description.]
   */

  NodePath.get = function get(_ref) {
    var hub = _ref.hub;
    var parentPath = _ref.parentPath;
    var parent = _ref.parent;
    var container = _ref.container;
    var listKey = _ref.listKey;
    var key = _ref.key;

    if (!hub && parentPath) {
      hub = parentPath.hub;
    }

    var targetNode = container[key];
    var paths = parent._paths = parent._paths || [];
    var path;

    for (var i = 0; i < paths.length; i++) {
      var pathCheck = paths[i];
      if (pathCheck.node === targetNode) {
        path = pathCheck;
        break;
      }
    }

    if (!path) {
      path = new NodePath(hub, parent);
      paths.push(path);
    }

    path.setup(parentPath, container, listKey, key);

    return path;
  };

  /**
   * [Please add a description.]
   */

  NodePath.prototype.getScope = function getScope(scope) {
    var ourScope = scope;

    // we're entering a new scope so let's construct it!
    if (this.isScope()) {
      ourScope = new _scope2["default"](this, scope);
    }

    return ourScope;
  };

  /**
   * [Please add a description.]
   */

  NodePath.prototype.setData = function setData(key, val) {
    return this.data[key] = val;
  };

  /**
   * [Please add a description.]
   */

  NodePath.prototype.getData = function getData(key, def) {
    var val = this.data[key];
    if (!val && def) val = this.data[key] = def;
    return val;
  };

  /**
   * [Please add a description.]
   */

  NodePath.prototype.errorWithNode = function errorWithNode(msg) {
    var Error = arguments.length <= 1 || arguments[1] === undefined ? SyntaxError : arguments[1];

    return this.hub.file.errorWithNode(this.node, msg, Error);
  };

  /**
   * [Please add a description.]
   */

  NodePath.prototype.traverse = function traverse(visitor, state) {
    _index2["default"](this.node, visitor, this.scope, state, this);
  };

  return NodePath;
})();

exports["default"] = NodePath;
_lodashObjectAssign2["default"](NodePath.prototype, require("./ancestry"));
_lodashObjectAssign2["default"](NodePath.prototype, require("./inference"));
_lodashObjectAssign2["default"](NodePath.prototype, require("./replacement"));
_lodashObjectAssign2["default"](NodePath.prototype, require("./evaluation"));
_lodashObjectAssign2["default"](NodePath.prototype, require("./conversion"));
_lodashObjectAssign2["default"](NodePath.prototype, require("./introspection"));
_lodashObjectAssign2["default"](NodePath.prototype, require("./context"));
_lodashObjectAssign2["default"](NodePath.prototype, require("./removal"));
_lodashObjectAssign2["default"](NodePath.prototype, require("./modification"));
_lodashObjectAssign2["default"](NodePath.prototype, require("./family"));
_lodashObjectAssign2["default"](NodePath.prototype, require("./comments"));

var _arr = t.TYPES;

var _loop = function () {
  var type = _arr[_i];
  var typeKey = "is" + type;
  NodePath.prototype[typeKey] = function (opts) {
    return t[typeKey](this.node, opts);
  };
};

for (var _i = 0; _i < _arr.length; _i++) {
  _loop();
}

var _loop2 = function (type) {
  if (type[0] === "_") return "continue";
  if (t.TYPES.indexOf(type) < 0) t.TYPES.push(type);

  NodePath.prototype["is" + type] = function (opts) {
    return virtualTypes[type].checkPath(this, opts);
  };
};

for (var type in virtualTypes) {
  var _ret2 = _loop2(type);

  // istanbul ignore next
  if (_ret2 === "continue") continue;
}
module.exports = exports["default"];
},{"../../types":38,"../index":7,"../scope":26,"./ancestry":8,"./comments":9,"./context":10,"./conversion":11,"./evaluation":12,"./family":13,"./inference":15,"./introspection":18,"./lib/virtual-types":21,"./modification":22,"./removal":23,"./replacement":24,"lodash/object/assign":163}],15:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.getTypeAnnotation = getTypeAnnotation;
exports._getTypeAnnotation = _getTypeAnnotation;
exports.isBaseType = isBaseType;
exports.couldBeBaseType = couldBeBaseType;
exports.baseTypeStrictlyMatches = baseTypeStrictlyMatches;
exports.isGenericType = isGenericType;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

var _inferers = require("./inferers");

var inferers = _interopRequireWildcard(_inferers);

var _types = require("../../../types");

var t = _interopRequireWildcard(_types);

/**
 * Infer the type of the current `NodePath`.
 */

function getTypeAnnotation() {
  if (this.typeAnnotation) return this.typeAnnotation;

  var type = this._getTypeAnnotation() || t.anyTypeAnnotation();
  if (t.isTypeAnnotation(type)) type = type.typeAnnotation;
  return this.typeAnnotation = type;
}

/**
 * todo: split up this method
 */

function _getTypeAnnotation() {
  var node = this.node;

  if (!node) {
    // handle initializerless variables, add in checks for loop initializers too
    if (this.key === "init" && this.parentPath.isVariableDeclarator()) {
      var declar = this.parentPath.parentPath;
      var declarParent = declar.parentPath;

      // for (var NODE in bar) {}
      if (declar.key === "left" && declarParent.isForInStatement()) {
        return t.stringTypeAnnotation();
      }

      // for (var NODE of bar) {}
      if (declar.key === "left" && declarParent.isForOfStatement()) {
        return t.anyTypeAnnotation();
      }

      return t.voidTypeAnnotation();
    } else {
      return;
    }
  }

  if (node.typeAnnotation) {
    return node.typeAnnotation;
  }

  var inferer = inferers[node.type];
  if (inferer) {
    return inferer.call(this, node);
  }

  inferer = inferers[this.parentPath.type];
  if (inferer && inferer.validParent) {
    return this.parentPath.getTypeAnnotation();
  }
}

/**
 * [Please add a description.]
 */

function isBaseType(baseName, soft) {
  return _isBaseType(baseName, this.getTypeAnnotation(), soft);
}

/**
 * [Please add a description.]
 */

function _isBaseType(baseName, type, soft) {
  if (baseName === "string") {
    return t.isStringTypeAnnotation(type);
  } else if (baseName === "number") {
    return t.isNumberTypeAnnotation(type);
  } else if (baseName === "boolean") {
    return t.isBooleanTypeAnnotation(type);
  } else if (baseName === "any") {
    return t.isAnyTypeAnnotation(type);
  } else if (baseName === "mixed") {
    return t.isMixedTypeAnnotation(type);
  } else if (baseName === "void") {
    return t.isVoidTypeAnnotation(type);
  } else {
    if (soft) {
      return false;
    } else {
      throw new Error("Unknown base type " + baseName);
    }
  }
}

/**
 * [Please add a description.]
 */

function couldBeBaseType(name) {
  var type = this.getTypeAnnotation();
  if (t.isAnyTypeAnnotation(type)) return true;

  if (t.isUnionTypeAnnotation(type)) {
    var _arr = type.types;

    for (var _i = 0; _i < _arr.length; _i++) {
      var type2 = _arr[_i];
      if (t.isAnyTypeAnnotation(type2) || _isBaseType(name, type2, true)) {
        return true;
      }
    }
    return false;
  } else {
    return _isBaseType(name, type, true);
  }
}

/**
 * [Please add a description.]
 */

function baseTypeStrictlyMatches(right) {
  var left = this.getTypeAnnotation();
  right = right.getTypeAnnotation();

  if (!t.isAnyTypeAnnotation() && t.isFlowBaseAnnotation(left)) {
    return right.type === left.type;
  }
}

/**
 * [Please add a description.]
 */

function isGenericType(genericName) {
  var type = this.getTypeAnnotation();
  return t.isGenericTypeAnnotation(type) && t.isIdentifier(type.id, { name: genericName });
}
},{"../../../types":38,"./inferers":17}],16:[function(require,module,exports){
"use strict";

exports.__esModule = true;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

var _types = require("../../../types");

var t = _interopRequireWildcard(_types);

/**
 * [Please add a description.]
 */

exports["default"] = function (node) {
  if (!this.isReferenced()) return;

  // check if a binding exists of this value and if so then return a union type of all
  // possible types that the binding could be
  var binding = this.scope.getBinding(node.name);
  if (binding) {
    if (binding.identifier.typeAnnotation) {
      return binding.identifier.typeAnnotation;
    } else {
      return getTypeAnnotationBindingConstantViolations(this, node.name);
    }
  }

  // built-in values
  if (node.name === "undefined") {
    return t.voidTypeAnnotation();
  } else if (node.name === "NaN" || node.name === "Infinity") {
    return t.numberTypeAnnotation();
  } else if (node.name === "arguments") {
    // todo
  }
};

/**
 * [Please add a description.]
 */

function getTypeAnnotationBindingConstantViolations(path, name) {
  var binding = path.scope.getBinding(name);

  var types = [];
  path.typeAnnotation = t.unionTypeAnnotation(types);

  var functionConstantViolations = [];
  var constantViolations = getConstantViolationsBefore(binding, path, functionConstantViolations);

  var testType = getConditionalAnnotation(path, name);
  if (testType) {
    var testConstantViolations = getConstantViolationsBefore(binding, testType.ifStatement);

    // remove constant violations observed before the IfStatement
    constantViolations = constantViolations.filter(function (path) {
      return testConstantViolations.indexOf(path) < 0;
    });

    // clear current types and add in observed test type
    types.push(testType.typeAnnotation);
  }

  if (constantViolations.length) {
    // pick one constant from each scope which will represent the last possible
    // control flow path that it could've taken/been
    var rawConstantViolations = constantViolations.reverse();
    var visitedScopes = [];
    constantViolations = [];
    var _arr = rawConstantViolations;
    for (var _i = 0; _i < _arr.length; _i++) {
      var violation = _arr[_i];
      var violationScope = violation.scope;
      if (visitedScopes.indexOf(violationScope) >= 0) continue;

      visitedScopes.push(violationScope);
      constantViolations.push(violation);

      if (violationScope === path.scope) {
        constantViolations = [violation];
        break;
      }
    }

    // add back on function constant violations since we can't track calls
    constantViolations = constantViolations.concat(functionConstantViolations);

    // push on inferred types of violated paths
    var _arr2 = constantViolations;
    for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
      var violation = _arr2[_i2];
      types.push(violation.getTypeAnnotation());
    }
  }

  if (types.length) {
    return t.createUnionTypeAnnotation(types);
  }
}

/**
 * [Please add a description.]
 */

function getConstantViolationsBefore(binding, path, functions) {
  var violations = binding.constantViolations.slice();
  violations.unshift(binding.path);
  return violations.filter(function (violation) {
    violation = violation.resolve();
    var status = violation._guessExecutionStatusRelativeTo(path);
    if (functions && status === "function") functions.push(violation);
    return status === "before";
  });
}

/**
 * [Please add a description.]
 */

function inferAnnotationFromBinaryExpression(name, path) {
  var operator = path.node.operator;

  var right = path.get("right").resolve();
  var left = path.get("left").resolve();

  var target;
  if (left.isIdentifier({ name: name })) {
    target = right;
  } else if (right.isIdentifier({ name: name })) {
    target = left;
  }
  if (target) {
    if (operator === "===") {
      return target.getTypeAnnotation();
    } else if (t.BOOLEAN_NUMBER_BINARY_OPERATORS.indexOf(operator) >= 0) {
      return t.numberTypeAnnotation();
    } else {
      return;
    }
  } else {
    if (operator !== "===") return;
  }

  //
  var typeofPath;
  var typePath;
  if (left.isUnaryExpression({ operator: "typeof" })) {
    typeofPath = left;
    typePath = right;
  } else if (right.isUnaryExpression({ operator: "typeof" })) {
    typeofPath = right;
    typePath = left;
  }
  if (!typePath && !typeofPath) return;

  // ensure that the type path is a Literal
  typePath = typePath.resolve();
  if (!typePath.isLiteral()) return;

  // and that it's a string so we can infer it
  var typeValue = typePath.node.value;
  if (typeof typeValue !== "string") return;

  // and that the argument of the typeof path references us!
  if (!typeofPath.get("argument").isIdentifier({ name: name })) return;

  // turn type value into a type annotation
  return t.createTypeAnnotationBasedOnTypeof(typePath.node.value);
}

/**
 * [Please add a description.]
 */

function getParentConditionalPath(path) {
  var parentPath;
  while (parentPath = path.parentPath) {
    if (parentPath.isIfStatement() || parentPath.isConditionalExpression()) {
      if (path.key === "test") {
        return;
      } else {
        return parentPath;
      }
    } else {
      path = parentPath;
    }
  }
}

/**
 * [Please add a description.]
 */

function getConditionalAnnotation(path, name) {
  var ifStatement = getParentConditionalPath(path);
  if (!ifStatement) return;

  var test = ifStatement.get("test");
  var paths = [test];
  var types = [];

  do {
    var _path = paths.shift().resolve();

    if (_path.isLogicalExpression()) {
      paths.push(_path.get("left"));
      paths.push(_path.get("right"));
    }

    if (_path.isBinaryExpression()) {
      var type = inferAnnotationFromBinaryExpression(name, _path);
      if (type) types.push(type);
    }
  } while (paths.length);

  if (types.length) {
    return {
      typeAnnotation: t.createUnionTypeAnnotation(types),
      ifStatement: ifStatement
    };
  } else {
    return getConditionalAnnotation(ifStatement, name);
  }
}
module.exports = exports["default"];
},{"../../../types":38}],17:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.VariableDeclarator = VariableDeclarator;
exports.TypeCastExpression = TypeCastExpression;
exports.NewExpression = NewExpression;
exports.TemplateLiteral = TemplateLiteral;
exports.UnaryExpression = UnaryExpression;
exports.BinaryExpression = BinaryExpression;
exports.LogicalExpression = LogicalExpression;
exports.ConditionalExpression = ConditionalExpression;
exports.SequenceExpression = SequenceExpression;
exports.AssignmentExpression = AssignmentExpression;
exports.UpdateExpression = UpdateExpression;
exports.Literal = Literal;
exports.ObjectExpression = ObjectExpression;
exports.ArrayExpression = ArrayExpression;
exports.RestElement = RestElement;
exports.CallExpression = CallExpression;
exports.TaggedTemplateExpression = TaggedTemplateExpression;
// istanbul ignore next

function _interopRequire(obj) { return obj && obj.__esModule ? obj["default"] : obj; }

// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

var _types = require("../../../types");

var t = _interopRequireWildcard(_types);

var _infererReference = require("./inferer-reference");

exports.Identifier = _interopRequire(_infererReference);

/**
 * [Please add a description.]
 */

function VariableDeclarator() {
  var id = this.get("id");

  if (id.isIdentifier()) {
    return this.get("init").getTypeAnnotation();
  } else {
    return;
  }
}

/**
 * [Please add a description.]
 */

function TypeCastExpression(node) {
  return node.typeAnnotation;
}

TypeCastExpression.validParent = true;

/**
 * [Please add a description.]
 */

function NewExpression(node) {
  if (this.get("callee").isIdentifier()) {
    // only resolve identifier callee
    return t.genericTypeAnnotation(node.callee);
  }
}

/**
 * [Please add a description.]
 */

function TemplateLiteral() {
  return t.stringTypeAnnotation();
}

/**
 * [Please add a description.]
 */

function UnaryExpression(node) {
  var operator = node.operator;

  if (operator === "void") {
    return t.voidTypeAnnotation();
  } else if (t.NUMBER_UNARY_OPERATORS.indexOf(operator) >= 0) {
    return t.numberTypeAnnotation();
  } else if (t.STRING_UNARY_OPERATORS.indexOf(operator) >= 0) {
    return t.stringTypeAnnotation();
  } else if (t.BOOLEAN_UNARY_OPERATORS.indexOf(operator) >= 0) {
    return t.booleanTypeAnnotation();
  }
}

/**
 * [Please add a description.]
 */

function BinaryExpression(node) {
  var operator = node.operator;

  if (t.NUMBER_BINARY_OPERATORS.indexOf(operator) >= 0) {
    return t.numberTypeAnnotation();
  } else if (t.BOOLEAN_BINARY_OPERATORS.indexOf(operator) >= 0) {
    return t.booleanTypeAnnotation();
  } else if (operator === "+") {
    var right = this.get("right");
    var left = this.get("left");

    if (left.isBaseType("number") && right.isBaseType("number")) {
      // both numbers so this will be a number
      return t.numberTypeAnnotation();
    } else if (left.isBaseType("string") || right.isBaseType("string")) {
      // one is a string so the result will be a string
      return t.stringTypeAnnotation();
    }

    // unsure if left and right are strings or numbers so stay on the safe side
    return t.unionTypeAnnotation([t.stringTypeAnnotation(), t.numberTypeAnnotation()]);
  }
}

/**
 * [Please add a description.]
 */

function LogicalExpression() {
  return t.createUnionTypeAnnotation([this.get("left").getTypeAnnotation(), this.get("right").getTypeAnnotation()]);
}

/**
 * [Please add a description.]
 */

function ConditionalExpression() {
  return t.createUnionTypeAnnotation([this.get("consequent").getTypeAnnotation(), this.get("alternate").getTypeAnnotation()]);
}

/**
 * [Please add a description.]
 */

function SequenceExpression() {
  return this.get("expressions").pop().getTypeAnnotation();
}

/**
 * [Please add a description.]
 */

function AssignmentExpression() {
  return this.get("right").getTypeAnnotation();
}

/**
 * [Please add a description.]
 */

function UpdateExpression(node) {
  var operator = node.operator;
  if (operator === "++" || operator === "--") {
    return t.numberTypeAnnotation();
  }
}

/**
 * [Please add a description.]
 */

function Literal(node) {
  var value = node.value;
  if (typeof value === "string") return t.stringTypeAnnotation();
  if (typeof value === "number") return t.numberTypeAnnotation();
  if (typeof value === "boolean") return t.booleanTypeAnnotation();
  if (value === null) return t.voidTypeAnnotation();
  if (node.regex) return t.genericTypeAnnotation(t.identifier("RegExp"));
}

/**
 * [Please add a description.]
 */

function ObjectExpression() {
  return t.genericTypeAnnotation(t.identifier("Object"));
}

/**
 * [Please add a description.]
 */

function ArrayExpression() {
  return t.genericTypeAnnotation(t.identifier("Array"));
}

/**
 * [Please add a description.]
 */

function RestElement() {
  return ArrayExpression();
}

RestElement.validParent = true;

/**
 * [Please add a description.]
 */

function Func() {
  return t.genericTypeAnnotation(t.identifier("Function"));
}

exports.Function = Func;
exports.Class = Func;

/**
 * [Please add a description.]
 */

function CallExpression() {
  return resolveCall(this.get("callee"));
}

/**
 * [Please add a description.]
 */

function TaggedTemplateExpression() {
  return resolveCall(this.get("tag"));
}

/**
 * [Please add a description.]
 */

function resolveCall(callee) {
  callee = callee.resolve();

  if (callee.isFunction()) {
    if (callee.is("async")) {
      if (callee.is("generator")) {
        return t.genericTypeAnnotation(t.identifier("AsyncIterator"));
      } else {
        return t.genericTypeAnnotation(t.identifier("Promise"));
      }
    } else {
      if (callee.node.returnType) {
        return callee.node.returnType;
      } else {
        // todo: get union type of all return arguments
      }
    }
  }
}
},{"../../../types":38,"./inferer-reference":16}],18:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.matchesPattern = matchesPattern;
exports.has = has;
exports.isnt = isnt;
exports.equals = equals;
exports.isNodeType = isNodeType;
exports.canHaveVariableDeclarationOrExpression = canHaveVariableDeclarationOrExpression;
exports.canSwapBetweenExpressionAndStatement = canSwapBetweenExpressionAndStatement;
exports.isCompletionRecord = isCompletionRecord;
exports.isStatementOrBlock = isStatementOrBlock;
exports.referencesImport = referencesImport;
exports.getSource = getSource;
exports.willIMaybeExecuteBefore = willIMaybeExecuteBefore;
exports._guessExecutionStatusRelativeTo = _guessExecutionStatusRelativeTo;
exports.resolve = resolve;
exports._resolve = _resolve;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _lodashCollectionIncludes = require("lodash/collection/includes");

var _lodashCollectionIncludes2 = _interopRequireDefault(_lodashCollectionIncludes);

var _types = require("../../types");

var t = _interopRequireWildcard(_types);

/**
 * Match the current node if it matches the provided `pattern`.
 *
 * For example, given the match `React.createClass` it would match the
 * parsed nodes of `React.createClass` and `React["createClass"]`.
 */

function matchesPattern(pattern, allowPartial) {
  // not a member expression
  if (!this.isMemberExpression()) return false;

  var parts = pattern.split(".");
  var search = [this.node];
  var i = 0;

  function matches(name) {
    var part = parts[i];
    return part === "*" || name === part;
  }

  while (search.length) {
    var node = search.shift();

    if (allowPartial && i === parts.length) {
      return true;
    }

    if (t.isIdentifier(node)) {
      // this part doesn't match
      if (!matches(node.name)) return false;
    } else if (t.isLiteral(node)) {
      // this part doesn't match
      if (!matches(node.value)) return false;
    } else if (t.isMemberExpression(node)) {
      if (node.computed && !t.isLiteral(node.property)) {
        // we can't deal with this
        return false;
      } else {
        search.unshift(node.property);
        search.unshift(node.object);
        continue;
      }
    } else if (t.isThisExpression(node)) {
      if (!matches("this")) return false;
    } else {
      // we can't deal with this
      return false;
    }

    // too many parts
    if (++i > parts.length) {
      return false;
    }
  }

  return i === parts.length;
}

/**
 * Check whether we have the input `key`. If the `key` references an array then we check
 * if the array has any items, otherwise we just check if it's falsy.
 */

function has(key) {
  var val = this.node[key];
  if (val && Array.isArray(val)) {
    return !!val.length;
  } else {
    return !!val;
  }
}

/**
 * Alias of `has`.
 */

var is = has;

exports.is = is;
/**
 * Opposite of `has`.
 */

function isnt(key) {
  return !this.has(key);
}

/**
 * Check whether the path node `key` strict equals `value`.
 */

function equals(key, value) {
  return this.node[key] === value;
}

/**
 * Check the type against our stored internal type of the node. This is handy when a node has
 * been removed yet we still internally know the type and need it to calculate node replacement.
 */

function isNodeType(type) {
  return t.isType(this.type, type);
}

/**
 * This checks whether or not we're in one of the following positions:
 *
 *   for (KEY in right);
 *   for (KEY;;);
 *
 * This is because these spots allow VariableDeclarations AND normal expressions so we need
 * to tell the path replacement that it's ok to replace this with an expression.
 */

function canHaveVariableDeclarationOrExpression() {
  return (this.key === "init" || this.key === "left") && this.parentPath.isFor();
}

/**
 * This checks whether we are swapping an arrow function's body between an
 * expression and a block statement (or vice versa).
 *
 * This is because arrow functions may implicitly return an expression, which
 * is the same as containing a block statement.
 */

function canSwapBetweenExpressionAndStatement(replacement) {
  if (this.key !== "body" || !this.parentPath.isArrowFunctionExpression()) {
    return false;
  }

  if (this.isExpression()) {
    return t.isBlockStatement(replacement);
  } else if (this.isBlockStatement()) {
    return t.isExpression(replacement);
  }

  return false;
}

/**
 * Check whether the current path references a completion record
 */

function isCompletionRecord(allowInsideFunction) {
  var path = this;
  var first = true;

  do {
    var container = path.container;

    // we're in a function so can't be a completion record
    if (path.isFunction() && !first) {
      return !!allowInsideFunction;
    }

    first = false;

    // check to see if we're the last item in the container and if we are
    // we're a completion record!
    if (Array.isArray(container) && path.key !== container.length - 1) {
      return false;
    }
  } while ((path = path.parentPath) && !path.isProgram());

  return true;
}

/**
 * Check whether or not the current `key` allows either a single statement or block statement
 * so we can explode it if necessary.
 */

function isStatementOrBlock() {
  if (this.parentPath.isLabeledStatement() || t.isBlockStatement(this.container)) {
    return false;
  } else {
    return _lodashCollectionIncludes2["default"](t.STATEMENT_OR_BLOCK_KEYS, this.key);
  }
}

/**
 * Check if the currently assigned path references the `importName` of `moduleSource`.
 */

function referencesImport(moduleSource, importName) {
  if (!this.isReferencedIdentifier()) return false;

  var binding = this.scope.getBinding(this.node.name);
  if (!binding || binding.kind !== "module") return false;

  var path = binding.path;
  var parent = path.parentPath;
  if (!parent.isImportDeclaration()) return false;

  // check moduleSource
  if (parent.node.source.value === moduleSource) {
    if (!importName) return true;
  } else {
    return false;
  }

  if (path.isImportDefaultSpecifier() && importName === "default") {
    return true;
  }

  if (path.isImportNamespaceSpecifier() && importName === "*") {
    return true;
  }

  if (path.isImportSpecifier() && path.node.imported.name === importName) {
    return true;
  }

  return false;
}

/**
 * Get the source code associated with this node.
 */

function getSource() {
  var node = this.node;
  if (node.end) {
    return this.hub.file.code.slice(node.start, node.end);
  } else {
    return "";
  }
}

/**
 * [Please add a description.]
 */

function willIMaybeExecuteBefore(target) {
  return this._guessExecutionStatusRelativeTo(target) !== "after";
}

/**
 * Given a `target` check the execution status of it relative to the current path.
 *
 * "Execution status" simply refers to where or not we **think** this will execuete
 * before or after the input `target` element.
 */

function _guessExecutionStatusRelativeTo(target) {
  // check if the two paths are in different functions, we can't track execution of these
  var targetFuncParent = target.scope.getFunctionParent();
  var selfFuncParent = this.scope.getFunctionParent();
  if (targetFuncParent !== selfFuncParent) {
    return "function";
  }

  var targetPaths = target.getAncestry();
  //if (targetPaths.indexOf(this) >= 0) return "after";

  var selfPaths = this.getAncestry();

  // get ancestor where the branches intersect
  var commonPath;
  var targetIndex;
  var selfIndex;
  for (selfIndex = 0; selfIndex < selfPaths.length; selfIndex++) {
    var selfPath = selfPaths[selfIndex];
    targetIndex = targetPaths.indexOf(selfPath);
    if (targetIndex >= 0) {
      commonPath = selfPath;
      break;
    }
  }
  if (!commonPath) {
    return "before";
  }

  // get the relationship paths that associate these nodes to their common ancestor
  var targetRelationship = targetPaths[targetIndex - 1];
  var selfRelationship = selfPaths[selfIndex - 1];
  if (!targetRelationship || !selfRelationship) {
    return "before";
  }

  // container list so let's see which one is after the other
  if (targetRelationship.listKey && targetRelationship.container === selfRelationship.container) {
    return targetRelationship.key > selfRelationship.key ? "before" : "after";
  }

  // otherwise we're associated by a parent node, check which key comes before the other
  var targetKeyPosition = t.VISITOR_KEYS[targetRelationship.type].indexOf(targetRelationship.key);
  var selfKeyPosition = t.VISITOR_KEYS[selfRelationship.type].indexOf(selfRelationship.key);
  return targetKeyPosition > selfKeyPosition ? "before" : "after";
}

/**
 * Resolve a "pointer" `NodePath` to it's absolute path.
 */

function resolve(dangerous, resolved) {
  return this._resolve(dangerous, resolved) || this;
}

/**
 * [Please add a description.]
 */

function _resolve(dangerous, resolved) {
  // detect infinite recursion
  // todo: possibly have a max length on this just to be safe
  if (resolved && resolved.indexOf(this) >= 0) return;

  // we store all the paths we've "resolved" in this array to prevent infinite recursion
  resolved = resolved || [];
  resolved.push(this);

  if (this.isVariableDeclarator()) {
    if (this.get("id").isIdentifier()) {
      return this.get("init").resolve(dangerous, resolved);
    } else {
      // otherwise it's a request for a pattern and that's a bit more tricky
    }
  } else if (this.isReferencedIdentifier()) {
      var binding = this.scope.getBinding(this.node.name);
      if (!binding) return;

      // reassigned so we can't really resolve it
      if (!binding.constant) return;

      // todo - lookup module in dependency graph
      if (binding.kind === "module") return;

      if (binding.path !== this) {
        return binding.path.resolve(dangerous, resolved);
      }
    } else if (this.isTypeCastExpression()) {
      return this.get("expression").resolve(dangerous, resolved);
    } else if (dangerous && this.isMemberExpression()) {
      // this is dangerous, as non-direct target assignments will mutate it's state
      // making this resolution inaccurate

      var targetKey = this.toComputedKey();
      if (!t.isLiteral(targetKey)) return;

      var targetName = targetKey.value;

      var target = this.get("object").resolve(dangerous, resolved);

      if (target.isObjectExpression()) {
        var props = target.get("properties");
        var _arr = props;
        for (var _i = 0; _i < _arr.length; _i++) {
          var prop = _arr[_i];
          if (!prop.isProperty()) continue;

          var key = prop.get("key");

          // { foo: obj }
          var match = prop.isnt("computed") && key.isIdentifier({ name: targetName });

          // { "foo": "obj" } or { ["foo"]: "obj" }
          match = match || key.isLiteral({ value: targetName });

          if (match) return prop.get("value").resolve(dangerous, resolved);
        }
      } else if (target.isArrayExpression() && !isNaN(+targetName)) {
        var elems = target.get("elements");
        var elem = elems[targetName];
        if (elem) return elem.resolve(dangerous, resolved);
      }
    }
}
},{"../../types":38,"lodash/collection/includes":86}],19:[function(require,module,exports){
"use strict";

exports.__esModule = true;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

// istanbul ignore next

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _transformationHelpersReact = require("../../../transformation/helpers/react");

var react = _interopRequireWildcard(_transformationHelpersReact);

var _types = require("../../../types");

var t = _interopRequireWildcard(_types);

/**
 * [Please add a description.]
 */

var referenceVisitor = {

  /**
   * [Please add a description.]
   */

  ReferencedIdentifier: function ReferencedIdentifier(node, parent, scope, state) {
    if (this.isJSXIdentifier() && react.isCompatTag(node.name)) {
      return;
    }

    // direct references that we need to track to hoist this to the highest scope we can
    var binding = scope.getBinding(node.name);
    if (!binding) return;

    // this binding isn't accessible from the parent scope so we can safely ignore it
    // eg. it's in a closure etc
    if (binding !== state.scope.getBinding(node.name)) return;

    if (binding.constant) {
      state.bindings[node.name] = binding;
    } else {
      var _arr = binding.constantViolations;

      for (var _i = 0; _i < _arr.length; _i++) {
        var violationPath = _arr[_i];
        state.breakOnScopePaths = state.breakOnScopePaths.concat(violationPath.getAncestry());
      }
    }
  }
};

/**
 * [Please add a description.]
 */

var PathHoister = (function () {
  function PathHoister(path, scope) {
    _classCallCheck(this, PathHoister);

    this.breakOnScopePaths = [];
    this.bindings = {};
    this.scopes = [];
    this.scope = scope;
    this.path = path;
  }

  /**
   * [Please add a description.]
   */

  PathHoister.prototype.isCompatibleScope = function isCompatibleScope(scope) {
    for (var key in this.bindings) {
      var binding = this.bindings[key];
      if (!scope.bindingIdentifierEquals(key, binding.identifier)) {
        return false;
      }
    }

    return true;
  };

  /**
   * [Please add a description.]
   */

  PathHoister.prototype.getCompatibleScopes = function getCompatibleScopes() {
    var scope = this.path.scope;
    do {
      if (this.isCompatibleScope(scope)) {
        this.scopes.push(scope);
      } else {
        break;
      }

      if (this.breakOnScopePaths.indexOf(scope.path) >= 0) {
        break;
      }
    } while (scope = scope.parent);
  };

  /**
   * [Please add a description.]
   */

  PathHoister.prototype.getAttachmentPath = function getAttachmentPath() {
    var scopes = this.scopes;

    var scope = scopes.pop();
    if (!scope) return;

    if (scope.path.isFunction()) {
      if (this.hasOwnParamBindings(scope)) {
        // should ignore this scope since it's ourselves
        if (this.scope === scope) return;

        // needs to be attached to the body
        return scope.path.get("body").get("body")[0];
      } else {
        // doesn't need to be be attached to this scope
        return this.getNextScopeStatementParent();
      }
    } else if (scope.path.isProgram()) {
      return this.getNextScopeStatementParent();
    }
  };

  /**
   * [Please add a description.]
   */

  PathHoister.prototype.getNextScopeStatementParent = function getNextScopeStatementParent() {
    var scope = this.scopes.pop();
    if (scope) return scope.path.getStatementParent();
  };

  /**
   * [Please add a description.]
   */

  PathHoister.prototype.hasOwnParamBindings = function hasOwnParamBindings(scope) {
    for (var name in this.bindings) {
      if (!scope.hasOwnBinding(name)) continue;

      var binding = this.bindings[name];
      if (binding.kind === "param") return true;
    }
    return false;
  };

  /**
   * [Please add a description.]
   */

  PathHoister.prototype.run = function run() {
    var node = this.path.node;
    if (node._hoisted) return;
    node._hoisted = true;

    this.path.traverse(referenceVisitor, this);

    this.getCompatibleScopes();

    var attachTo = this.getAttachmentPath();
    if (!attachTo) return;

    // don't bother hoisting to the same function as this will cause multiple branches to be evaluated more than once leading to a bad optimisation
    if (attachTo.getFunctionParent() === this.path.getFunctionParent()) return;

    var uid = attachTo.scope.generateUidIdentifier("ref");

    attachTo.insertBefore([t.variableDeclaration("var", [t.variableDeclarator(uid, this.path.node)])]);

    var parent = this.path.parentPath;

    if (parent.isJSXElement() && this.path.container === parent.node.children) {
      // turning the `span` in `<div><span /></div>` to an expression so we need to wrap it with
      // an expression container
      uid = t.JSXExpressionContainer(uid);
    }

    this.path.replaceWith(uid);
  };

  return PathHoister;
})();

exports["default"] = PathHoister;
module.exports = exports["default"];
},{"../../../transformation/helpers/react":5,"../../../types":38}],20:[function(require,module,exports){
// this file contains hooks that handle ancestry cleanup of parent nodes when removing children

"use strict";

exports.__esModule = true;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

var _types = require("../../../types");

var t = _interopRequireWildcard(_types);

/**
 * Pre hooks should be used for either rejecting removal or delegating removal
 */

var pre = [

/**
 * [Please add a description.]
 */

function (self) {
  if (self.key === "body" && (self.isBlockStatement() || self.isClassBody())) {
    // function () NODE
    // class NODE
    // attempting to remove a block statement that's someones body so let's just clear all the inner
    // statements instead
    self.node.body = [];
    return true;
  }
},

/**
 * [Please add a description.]
 */

function (self, parent) {
  var replace = false;

  // () => NODE;
  // removing the body of an arrow function
  replace = replace || self.key === "body" && parent.isArrowFunctionExpression();

  // throw NODE;
  // removing a throw statement argument
  replace = replace || self.key === "argument" && parent.isThrowStatement();

  if (replace) {
    self.replaceWith(t.identifier("undefined"));
    return true;
  }
}];

exports.pre = pre;
/**
 * Post hooks should be used for cleaning up parents
 */

var post = [

/**
 * [Please add a description.]
 */

function (self, parent) {
  var removeParent = false;

  // while (NODE);
  // removing the test of a while/switch, we can either just remove it entirely *or* turn the `test` into `true`
  // unlikely that the latter will ever be what's wanted so we just remove the loop to avoid infinite recursion
  removeParent = removeParent || self.key === "test" && (parent.isWhile() || parent.isSwitchCase());

  // export NODE;
  // just remove a declaration for an export as this is no longer valid
  removeParent = removeParent || self.key === "declaration" && parent.isExportDeclaration();

  // label: NODE
  // stray labeled statement with no body
  removeParent = removeParent || self.key === "body" && parent.isLabeledStatement();

  // var NODE;
  // remove an entire declaration if there are no declarators left
  removeParent = removeParent || self.listKey === "declarations" && parent.isVariableDeclaration() && parent.node.declarations.length === 0;

  // NODE;
  // remove the entire expression statement if there's no expression
  removeParent = removeParent || self.key === "expression" && parent.isExpressionStatement();

  // if (NODE);
  // remove the entire if since the consequent is never going to be hit, if there's an alternate then it's already been
  // handled with the `pre` hook
  removeParent = removeParent || self.key === "test" && parent.isIfStatement();

  if (removeParent) {
    parent.dangerouslyRemove();
    return true;
  }
},

/**
 * [Please add a description.]
 */

function (self, parent) {
  if (parent.isSequenceExpression() && parent.node.expressions.length === 1) {
    // (node, NODE);
    // we've just removed the second element of a sequence expression so let's turn that sequence
    // expression into a regular expression
    parent.replaceWith(parent.node.expressions[0]);
    return true;
  }
},

/**
 * [Please add a description.]
 */

function (self, parent) {
  if (parent.isBinary()) {
    // left + NODE;
    // NODE + right;
    // we're in a binary expression, better remove it and replace it with the last expression
    if (self.key === "left") {
      parent.replaceWith(parent.node.right);
    } else {
      // key === "right"
      parent.replaceWith(parent.node.left);
    }
    return true;
  }
}];
exports.post = post;
},{"../../../types":38}],21:[function(require,module,exports){
"use strict";

exports.__esModule = true;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

var _transformationHelpersReact = require("../../../transformation/helpers/react");

var react = _interopRequireWildcard(_transformationHelpersReact);

var _types = require("../../../types");

var t = _interopRequireWildcard(_types);

/**
 * [Please add a description.]
 */

var ReferencedIdentifier = {
  types: ["Identifier", "JSXIdentifier"],
  checkPath: function checkPath(_ref, opts) {
    var node = _ref.node;
    var parent = _ref.parent;

    if (!t.isIdentifier(node, opts)) {
      if (t.isJSXIdentifier(node, opts)) {
        if (react.isCompatTag(node.name)) return false;
      } else {
        // not a JSXIdentifier or an Identifier
        return false;
      }
    }

    // check if node is referenced
    return t.isReferenced(node, parent);
  }
};

exports.ReferencedIdentifier = ReferencedIdentifier;
/**
 * [Please add a description.]
 */

var BindingIdentifier = {
  types: ["Identifier"],
  checkPath: function checkPath(_ref2) {
    var node = _ref2.node;
    var parent = _ref2.parent;

    return t.isBinding(node, parent);
  }
};

exports.BindingIdentifier = BindingIdentifier;
/**
 * [Please add a description.]
 */

var Statement = {
  types: ["Statement"],
  checkPath: function checkPath(_ref3) {
    var node = _ref3.node;
    var parent = _ref3.parent;

    if (t.isStatement(node)) {
      if (t.isVariableDeclaration(node)) {
        if (t.isForXStatement(parent, { left: node })) return false;
        if (t.isForStatement(parent, { init: node })) return false;
      }

      return true;
    } else {
      return false;
    }
  }
};

exports.Statement = Statement;
/**
 * [Please add a description.]
 */

var Expression = {
  types: ["Expression"],
  checkPath: function checkPath(path) {
    if (path.isIdentifier()) {
      return path.isReferencedIdentifier();
    } else {
      return t.isExpression(path.node);
    }
  }
};

exports.Expression = Expression;
/**
 * [Please add a description.]
 */

var Scope = {
  types: ["Scopable"],
  checkPath: function checkPath(path) {
    return t.isScope(path.node, path.parent);
  }
};

exports.Scope = Scope;
/**
 * [Please add a description.]
 */

var Referenced = {
  checkPath: function checkPath(path) {
    return t.isReferenced(path.node, path.parent);
  }
};

exports.Referenced = Referenced;
/**
 * [Please add a description.]
 */

var BlockScoped = {
  checkPath: function checkPath(path) {
    return t.isBlockScoped(path.node);
  }
};

exports.BlockScoped = BlockScoped;
/**
 * [Please add a description.]
 */

var Var = {
  types: ["VariableDeclaration"],
  checkPath: function checkPath(path) {
    return t.isVar(path.node);
  }
};

exports.Var = Var;
/**
 * [Please add a description.]
 */

var DirectiveLiteral = {
  types: ["Literal"],
  checkPath: function checkPath(path) {
    return path.isLiteral() && path.parentPath.isExpressionStatement();
  }
};

exports.DirectiveLiteral = DirectiveLiteral;
/**
 * [Please add a description.]
 */

var Directive = {
  types: ["ExpressionStatement"],
  checkPath: function checkPath(path) {
    return path.get("expression").isLiteral();
  }
};

exports.Directive = Directive;
/**
 * [Please add a description.]
 */

var User = {
  checkPath: function checkPath(path) {
    return path.node && !!path.node.loc;
  }
};

exports.User = User;
/**
 * [Please add a description.]
 */

var Generated = {
  checkPath: function checkPath(path) {
    return !path.isUser();
  }
};

exports.Generated = Generated;
/**
 * [Please add a description.]
 */

var Flow = {
  types: ["Flow", "ImportDeclaration", "ExportDeclaration"],
  checkPath: function checkPath(_ref4) {
    var node = _ref4.node;

    if (t.isFlow(node)) {
      return true;
    } else if (t.isImportDeclaration(node)) {
      return node.importKind === "type" || node.importKind === "typeof";
    } else if (t.isExportDeclaration(node)) {
      return node.exportKind === "type";
    } else {
      return false;
    }
  }
};
exports.Flow = Flow;
},{"../../../transformation/helpers/react":5,"../../../types":38}],22:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.insertBefore = insertBefore;
exports._containerInsert = _containerInsert;
exports._containerInsertBefore = _containerInsertBefore;
exports._containerInsertAfter = _containerInsertAfter;
exports._maybePopFromStatements = _maybePopFromStatements;
exports.insertAfter = insertAfter;
exports.updateSiblingKeys = updateSiblingKeys;
exports._verifyNodeList = _verifyNodeList;
exports.unshiftContainer = unshiftContainer;
exports.pushContainer = pushContainer;
exports.hoist = hoist;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _libHoister = require("./lib/hoister");

var _libHoister2 = _interopRequireDefault(_libHoister);

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

var _types = require("../../types");

var t = _interopRequireWildcard(_types);

/**
 * Insert the provided nodes before the current one.
 */

function insertBefore(nodes) {
  this._assertUnremoved();

  nodes = this._verifyNodeList(nodes);

  if (this.parentPath.isExpressionStatement() || this.parentPath.isLabeledStatement()) {
    return this.parentPath.insertBefore(nodes);
  } else if (this.isNodeType("Expression") || this.parentPath.isForStatement() && this.key === "init") {
    if (this.node) nodes.push(this.node);
    this.replaceExpressionWithStatements(nodes);
  } else {
    this._maybePopFromStatements(nodes);
    if (Array.isArray(this.container)) {
      return this._containerInsertBefore(nodes);
    } else if (this.isStatementOrBlock()) {
      if (this.node) nodes.push(this.node);
      this.node = this.container[this.key] = t.blockStatement(nodes);
    } else {
      throw new Error("We don't know what to do with this node type. We were previously a Statement but we can't fit in here?");
    }
  }

  return [this];
}

/**
 * [Please add a description.]
 */

function _containerInsert(from, nodes) {
  this.updateSiblingKeys(from, nodes.length);

  var paths = [];

  for (var i = 0; i < nodes.length; i++) {
    var to = from + i;
    var node = nodes[i];
    this.container.splice(to, 0, node);

    if (this.context) {
      var path = this.context.create(this.parent, this.container, to, this.listKey);
      paths.push(path);
      this.queueNode(path);
    } else {
      paths.push(_index2["default"].get({
        parentPath: this,
        parent: node,
        container: this.container,
        listKey: this.listKey,
        key: to
      }));
    }
  }

  return paths;
}

/**
 * [Please add a description.]
 */

function _containerInsertBefore(nodes) {
  return this._containerInsert(this.key, nodes);
}

/**
 * [Please add a description.]
 */

function _containerInsertAfter(nodes) {
  return this._containerInsert(this.key + 1, nodes);
}

/**
 * [Please add a description.]
 */

function _maybePopFromStatements(nodes) {
  var last = nodes[nodes.length - 1];
  if (t.isExpressionStatement(last) && t.isIdentifier(last.expression) && !this.isCompletionRecord()) {
    nodes.pop();
  }
}

/**
 * Insert the provided nodes after the current one. When inserting nodes after an
 * expression, ensure that the completion record is correct by pushing the current node.
 */

function insertAfter(nodes) {
  this._assertUnremoved();

  nodes = this._verifyNodeList(nodes);

  if (this.parentPath.isExpressionStatement() || this.parentPath.isLabeledStatement()) {
    return this.parentPath.insertAfter(nodes);
  } else if (this.isNodeType("Expression") || this.parentPath.isForStatement() && this.key === "init") {
    if (this.node) {
      var temp = this.scope.generateDeclaredUidIdentifier();
      nodes.unshift(t.expressionStatement(t.assignmentExpression("=", temp, this.node)));
      nodes.push(t.expressionStatement(temp));
    }
    this.replaceExpressionWithStatements(nodes);
  } else {
    this._maybePopFromStatements(nodes);
    if (Array.isArray(this.container)) {
      return this._containerInsertAfter(nodes);
    } else if (this.isStatementOrBlock()) {
      if (this.node) nodes.unshift(this.node);
      this.node = this.container[this.key] = t.blockStatement(nodes);
    } else {
      throw new Error("We don't know what to do with this node type. We were previously a Statement but we can't fit in here?");
    }
  }

  return [this];
}

/**
 * Update all sibling node paths after `fromIndex` by `incrementBy`.
 */

function updateSiblingKeys(fromIndex, incrementBy) {
  var paths = this.parent._paths;
  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (path.key >= fromIndex) {
      path.key += incrementBy;
    }
  }
}

/**
 * [Please add a description.]
 */

function _verifyNodeList(nodes) {
  if (nodes.constructor !== Array) {
    nodes = [nodes];
  }

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (!node) {
      throw new Error("Node list has falsy node with the index of " + i);
    } else if (typeof node !== "object") {
      throw new Error("Node list contains a non-object node with the index of " + i);
    } else if (!node.type) {
      throw new Error("Node list contains a node without a type with the index of " + i);
    } else if (node instanceof _index2["default"]) {
      nodes[i] = node.node;
    }
  }

  return nodes;
}

/**
 * [Please add a description.]
 */

function unshiftContainer(listKey, nodes) {
  this._assertUnremoved();

  nodes = this._verifyNodeList(nodes);

  // get the first path and insert our nodes before it, if it doesn't exist then it
  // doesn't matter, our nodes will be inserted anyway

  var container = this.node[listKey];
  var path = _index2["default"].get({
    parentPath: this,
    parent: this.node,
    container: container,
    listKey: listKey,
    key: 0
  });

  return path.insertBefore(nodes);
}

/**
 * [Please add a description.]
 */

function pushContainer(listKey, nodes) {
  this._assertUnremoved();

  nodes = this._verifyNodeList(nodes);

  // get an invisible path that represents the last node + 1 and replace it with our
  // nodes, effectively inlining it

  var container = this.node[listKey];
  var i = container.length;
  var path = _index2["default"].get({
    parentPath: this,
    parent: this.node,
    container: container,
    listKey: listKey,
    key: i
  });

  return path.replaceWith(nodes, true);
}

/**
 * Hoist the current node to the highest scope possible and return a UID
 * referencing it.
 */

function hoist() {
  var scope = arguments.length <= 0 || arguments[0] === undefined ? this.scope : arguments[0];

  var hoister = new _libHoister2["default"](this, scope);
  return hoister.run();
}
},{"../../types":38,"./index":14,"./lib/hoister":19}],23:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.remove = remove;
exports.dangerouslyRemove = dangerouslyRemove;
exports._callRemovalHooks = _callRemovalHooks;
exports._remove = _remove;
exports._markRemoved = _markRemoved;
exports._assertUnremoved = _assertUnremoved;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

var _libRemovalHooks = require("./lib/removal-hooks");

var removalHooks = _interopRequireWildcard(_libRemovalHooks);

/**
 * Deprecated in favor of `dangerouslyRemove` as it's far more scary and more accurately portrays
 * the risk.
 */

function remove() {
  console.trace("Path#remove has been renamed to Path#dangerouslyRemove, removing a node is extremely dangerous so please refrain using it.");
  return this.dangerouslyRemove();
}

/**
 * Dangerously remove the current node. This may sometimes result in a tainted
 * invalid AST so use with caution.
 */

function dangerouslyRemove() {
  this._assertUnremoved();

  this.resync();

  if (this._callRemovalHooks("pre")) {
    this._markRemoved();
    return;
  }

  this.shareCommentsWithSiblings();
  this._remove();
  this._markRemoved();

  this._callRemovalHooks("post");
}

/**
 * [Please add a description.]
 */

function _callRemovalHooks(position) {
  var _arr = removalHooks[position];

  for (var _i = 0; _i < _arr.length; _i++) {
    var fn = _arr[_i];
    if (fn(this, this.parentPath)) return true;
  }
}

/**
 * [Please add a description.]
 */

function _remove() {
  if (Array.isArray(this.container)) {
    this.container.splice(this.key, 1);
    this.updateSiblingKeys(this.key, -1);
  } else {
    this.container[this.key] = null;
  }
}

/**
 * [Please add a description.]
 */

function _markRemoved() {
  this.shouldSkip = true;
  this.removed = true;
  this.node = null;
}

/**
 * [Please add a description.]
 */

function _assertUnremoved() {
  if (this.removed) {
    throw this.errorWithNode("NodePath has been removed so is read-only.");
  }
}
},{"./lib/removal-hooks":20}],24:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.replaceWithMultiple = replaceWithMultiple;
exports.replaceWithSourceString = replaceWithSourceString;
exports.replaceWith = replaceWith;
exports.replaceExpressionWithStatements = replaceExpressionWithStatements;
exports.replaceInline = replaceInline;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _helpersCodeFrame = require("../../helpers/code-frame");

var _helpersCodeFrame2 = _interopRequireDefault(_helpersCodeFrame);

var _index = require("../index");

var _index2 = _interopRequireDefault(_index);

var _index3 = require("./index");

var _index4 = _interopRequireDefault(_index3);

var _helpersParse = require("../../helpers/parse");

var _helpersParse2 = _interopRequireDefault(_helpersParse);

var _types = require("../../types");

var t = _interopRequireWildcard(_types);

/**
 * [Please add a description.]
 */

var hoistVariablesVisitor = {

  /**
   * [Please add a description.]
   */

  Function: function Function() {
    this.skip();
  },

  /**
   * [Please add a description.]
   */

  VariableDeclaration: function VariableDeclaration(node, parent, scope) {
    if (node.kind !== "var") return;

    var bindings = this.getBindingIdentifiers();
    for (var key in bindings) {
      scope.push({ id: bindings[key] });
    }

    var exprs = [];

    var _arr = node.declarations;
    for (var _i = 0; _i < _arr.length; _i++) {
      var declar = _arr[_i];
      if (declar.init) {
        exprs.push(t.expressionStatement(t.assignmentExpression("=", declar.id, declar.init)));
      }
    }

    return exprs;
  }
};

/**
 * Replace a node with an array of multiple. This method performs the following steps:
 *
 *  - Inherit the comments of first provided node with that of the current node.
 *  - Insert the provided nodes after the current node.
 *  - Remove the current node.
 */

function replaceWithMultiple(nodes) {
  this.resync();

  nodes = this._verifyNodeList(nodes);
  t.inheritLeadingComments(nodes[0], this.node);
  t.inheritTrailingComments(nodes[nodes.length - 1], this.node);
  this.node = this.container[this.key] = null;
  this.insertAfter(nodes);
  if (!this.node) this.dangerouslyRemove();
}

/**
 * Parse a string as an expression and replace the current node with the result.
 *
 * NOTE: This is typically not a good idea to use. Building source strings when
 * transforming ASTs is an antipattern and SHOULD NOT be encouraged. Even if it's
 * easier to use, your transforms will be extremely brittle.
 */

function replaceWithSourceString(replacement) {
  this.resync();

  try {
    replacement = "(" + replacement + ")";
    replacement = _helpersParse2["default"](replacement);
  } catch (err) {
    var loc = err.loc;
    if (loc) {
      err.message += " - make sure this is an expression.";
      err.message += "\n" + _helpersCodeFrame2["default"](replacement, loc.line, loc.column + 1);
    }
    throw err;
  }

  replacement = replacement.program.body[0].expression;
  _index2["default"].removeProperties(replacement);
  return this.replaceWith(replacement);
}

/**
 * Replace the current node with another.
 */

function replaceWith(replacement, whateverAllowed) {
  this.resync();

  if (this.removed) {
    throw new Error("You can't replace this node, we've already removed it");
  }

  if (replacement instanceof _index4["default"]) {
    replacement = replacement.node;
  }

  if (!replacement) {
    throw new Error("You passed `path.replaceWith()` a falsy node, use `path.dangerouslyRemove()` instead");
  }

  if (this.node === replacement) {
    return;
  }

  if (this.isProgram() && !t.isProgram(replacement)) {
    throw new Error("You can only replace a Program root node with another Program node");
  }

  // normalise inserting an entire AST
  if (t.isProgram(replacement) && !this.isProgram()) {
    replacement = replacement.body;
    whateverAllowed = true;
  }

  if (Array.isArray(replacement)) {
    if (whateverAllowed) {
      return this.replaceWithMultiple(replacement);
    } else {
      throw new Error("Don't use `path.replaceWith()` with an array of nodes, use `path.replaceWithMultiple()`");
    }
  }

  if (typeof replacement === "string") {
    // triggers an error
    return this.replaceWithSourceString();
  }

  if (this.isNodeType("Statement") && t.isExpression(replacement)) {
    if (!this.canHaveVariableDeclarationOrExpression() && !this.canSwapBetweenExpressionAndStatement(replacement)) {
      // replacing a statement with an expression so wrap it in an expression statement
      replacement = t.expressionStatement(replacement);
    }
  }

  if (this.isNodeType("Expression") && t.isStatement(replacement)) {
    if (!this.canSwapBetweenExpressionAndStatement(replacement)) {
      // replacing an expression with a statement so let's explode it
      return this.replaceExpressionWithStatements([replacement]);
    }
  }

  var oldNode = this.node;
  if (oldNode) t.inheritsComments(replacement, oldNode);

  // replace the node
  this.node = this.container[this.key] = replacement;
  this.type = replacement.type;

  // potentially create new scope
  this.setScope();
}

/**
 * This method takes an array of statements nodes and then explodes it
 * into expressions. This method retains completion records which is
 * extremely important to retain original semantics.
 */

function replaceExpressionWithStatements(nodes) {
  this.resync();

  var toSequenceExpression = t.toSequenceExpression(nodes, this.scope);

  if (toSequenceExpression) {
    return this.replaceWith(toSequenceExpression);
  } else {
    var container = t.functionExpression(null, [], t.blockStatement(nodes));
    container.shadow = true;

    this.replaceWith(t.callExpression(container, []));
    this.traverse(hoistVariablesVisitor);

    // add implicit returns to all ending expression statements
    var last = this.get("callee").getCompletionRecords();
    var _arr2 = last;
    for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
      var lastNode = _arr2[_i2];
      if (!lastNode.isExpressionStatement()) continue;

      var loop = lastNode.findParent(function (path) {
        return path.isLoop();
      });
      if (loop) {
        var uid = this.get("callee").scope.generateDeclaredUidIdentifier("ret");
        this.get("callee.body").pushContainer("body", t.returnStatement(uid));
        lastNode.get("expression").replaceWith(t.assignmentExpression("=", uid, lastNode.node.expression));
      } else {
        lastNode.replaceWith(t.returnStatement(lastNode.node.expression));
      }
    }

    return this.node;
  }
}

/**
 * [Please add a description.]
 */

function replaceInline(nodes) {
  this.resync();

  if (Array.isArray(nodes)) {
    if (Array.isArray(this.container)) {
      nodes = this._verifyNodeList(nodes);
      this._containerInsertAfter(nodes);
      return this.dangerouslyRemove();
    } else {
      return this.replaceWithMultiple(nodes);
    }
  } else {
    return this.replaceWith(nodes);
  }
}
},{"../../helpers/code-frame":1,"../../helpers/parse":3,"../../types":38,"../index":7,"./index":14}],25:[function(require,module,exports){
/**
 * This class is responsible for a binding inside of a scope.
 *
 * It tracks the following:
 *
 *  * Node path.
 *  * Amount of times referenced by other nodes.
 *  * Paths to nodes that reassign or modify this binding.
 *  * The kind of binding. (Is it a parameter, declaration etc)
 */

"use strict";

exports.__esModule = true;
// istanbul ignore next

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Binding = (function () {
  function Binding(_ref) {
    var existing = _ref.existing;
    var identifier = _ref.identifier;
    var scope = _ref.scope;
    var path = _ref.path;
    var kind = _ref.kind;

    _classCallCheck(this, Binding);

    this.constantViolations = [];
    this.constant = true;

    this.identifier = identifier;
    this.references = 0;
    this.referenced = false;

    this.scope = scope;
    this.path = path;
    this.kind = kind;

    this.hasValue = false;
    this.hasDeoptedValue = false;
    this.value = null;

    this.clearValue();

    if (existing) {
      this.constantViolations = [].concat(existing.path, existing.constantViolations, this.constantViolations);
    }
  }

  /**
   * [Please add a description.]
   */

  Binding.prototype.deoptValue = function deoptValue() {
    this.clearValue();
    this.hasDeoptedValue = true;
  };

  /**
   * [Please add a description.]
   */

  Binding.prototype.setValue = function setValue(value) {
    if (this.hasDeoptedValue) return;
    this.hasValue = true;
    this.value = value;
  };

  /**
   * [Please add a description.]
   */

  Binding.prototype.clearValue = function clearValue() {
    this.hasDeoptedValue = false;
    this.hasValue = false;
    this.value = null;
  };

  /**
   * Register a constant violation with the provided `path`.
   */

  Binding.prototype.reassign = function reassign(path) {
    this.constant = false;
    this.constantViolations.push(path);
  };

  /**
   * Increment the amount of references to this binding.
   */

  Binding.prototype.reference = function reference() {
    this.referenced = true;
    this.references++;
  };

  /**
   * Decrement the amount of references to this binding.
   */

  Binding.prototype.dereference = function dereference() {
    this.references--;
    this.referenced = !!this.references;
  };

  return Binding;
})();

exports["default"] = Binding;
module.exports = exports["default"];
},{}],26:[function(require,module,exports){
"use strict";

exports.__esModule = true;
// istanbul ignore next

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// istanbul ignore next

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _lodashCollectionIncludes = require("lodash/collection/includes");

var _lodashCollectionIncludes2 = _interopRequireDefault(_lodashCollectionIncludes);

var _repeating = require("repeating");

var _repeating2 = _interopRequireDefault(_repeating);

var _index = require("../index");

var _index2 = _interopRequireDefault(_index);

var _lodashObjectDefaults = require("lodash/object/defaults");

var _lodashObjectDefaults2 = _interopRequireDefault(_lodashObjectDefaults);

var _messages = require("../../messages");

var messages = _interopRequireWildcard(_messages);

var _binding = require("./binding");

var _binding2 = _interopRequireDefault(_binding);

var _globals = require("globals");

var _globals2 = _interopRequireDefault(_globals);

var _lodashArrayFlatten = require("lodash/array/flatten");

var _lodashArrayFlatten2 = _interopRequireDefault(_lodashArrayFlatten);

var _lodashObjectExtend = require("lodash/object/extend");

var _lodashObjectExtend2 = _interopRequireDefault(_lodashObjectExtend);

var _helpersObject = require("../../helpers/object");

var _helpersObject2 = _interopRequireDefault(_helpersObject);

var _types = require("../../types");

var t = _interopRequireWildcard(_types);

var collectorVisitor = {
  For: function For() {
    var _arr = t.FOR_INIT_KEYS;

    for (var _i = 0; _i < _arr.length; _i++) {
      var key = _arr[_i];
      var declar = this.get(key);
      if (declar.isVar()) this.scope.getFunctionParent().registerBinding("var", declar);
    }
  },

  Declaration: function Declaration() {
    // delegate block scope handling to the `blockVariableVisitor`
    if (this.isBlockScoped()) return;

    // this will be hit again once we traverse into it after this iteration
    if (this.isExportDeclaration() && this.get("declaration").isDeclaration()) return;

    // we've ran into a declaration!
    this.scope.getFunctionParent().registerDeclaration(this);
  },

  ReferencedIdentifier: function ReferencedIdentifier(node, parent, scope, state) {
    state.references.push(this);
  },

  ForXStatement: function ForXStatement(node, parent, scope, state) {
    var left = this.get("left");
    if (left.isPattern() || left.isIdentifier()) {
      state.constantViolations.push(left);
    }
  },

  ExportDeclaration: {
    exit: function exit(node, parent, scope) {
      var declar = node.declaration;
      if (t.isClassDeclaration(declar) || t.isFunctionDeclaration(declar)) {
        var binding = scope.getBinding(declar.id.name);
        if (binding) binding.reference();
      } else if (t.isVariableDeclaration(declar)) {
        var _arr2 = declar.declarations;

        for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
          var decl = _arr2[_i2];
          var ids = t.getBindingIdentifiers(decl);
          for (var _name in ids) {
            var binding = scope.getBinding(_name);
            if (binding) binding.reference();
          }
        }
      }
    }
  },

  LabeledStatement: function LabeledStatement() {
    this.scope.getProgramParent().addGlobal(this.node);
    this.scope.getBlockParent().registerDeclaration(this);
  },

  AssignmentExpression: function AssignmentExpression(node, parent, scope, state) {
    state.assignments.push(this);
  },

  UpdateExpression: function UpdateExpression(node, parent, scope, state) {
    state.constantViolations.push(this.get("argument"));
  },

  UnaryExpression: function UnaryExpression(node, parent, scope, state) {
    if (this.node.operator === "delete") {
      state.constantViolations.push(this.get("argument"));
    }
  },

  BlockScoped: function BlockScoped() {
    var scope = this.scope;
    if (scope.path === this) scope = scope.parent;
    scope.getBlockParent().registerDeclaration(this);
  },

  ClassDeclaration: function ClassDeclaration() {
    var name = this.node.id.name;
    this.scope.bindings[name] = this.scope.getBinding(name);
  },

  Block: function Block() {
    var paths = this.get("body");
    var _arr3 = paths;
    for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
      var bodyPath = _arr3[_i3];
      if (bodyPath.isFunctionDeclaration()) {
        this.scope.getBlockParent().registerDeclaration(bodyPath);
      }
    }
  }
};

/**
 * [Please add a description.]
 */

var renameVisitor = {

  /**
   * [Please add a description.]
   */

  ReferencedIdentifier: function ReferencedIdentifier(node, parent, scope, state) {
    if (node.name === state.oldName) {
      node.name = state.newName;
    }
  },

  /**
   * [Please add a description.]
   */

  Scope: function Scope(node, parent, scope, state) {
    if (!scope.bindingIdentifierEquals(state.oldName, state.binding)) {
      this.skip();
    }
  },

  "AssignmentExpression|Declaration": function AssignmentExpressionDeclaration(node, parent, scope, state) {
    var ids = this.getBindingIdentifiers();

    for (var name in ids) {
      if (name === state.oldName) ids[name].name = state.newName;
    }
  }
};

/**
 * [Please add a description.]
 */

var Scope = (function () {

  /**
   * This searches the current "scope" and collects all references/bindings
   * within.
   */

  function Scope(path, parent) {
    _classCallCheck(this, Scope);

    if (parent && parent.block === path.node) {
      return parent;
    }

    var cached = path.getData("scope");
    if (cached && cached.parent === parent && cached.block === path.node) {
      return cached;
    } else {
      path.setData("scope", this);
    }

    this.parent = parent;
    this.hub = path.hub;

    this.parentBlock = path.parent;
    this.block = path.node;
    this.path = path;
  }

  /**
   * Globals.
   */

  /**
   * Traverse node with current scope and path.
   */

  Scope.prototype.traverse = function traverse(node, opts, state) {
    _index2["default"](node, opts, this, state, this.path);
  };

  /**
   * Generate a unique identifier and add it to the current scope.
   */

  Scope.prototype.generateDeclaredUidIdentifier = function generateDeclaredUidIdentifier() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? "temp" : arguments[0];

    var id = this.generateUidIdentifier(name);
    this.push({ id: id });
    return id;
  };

  /**
   * Generate a unique identifier.
   */

  Scope.prototype.generateUidIdentifier = function generateUidIdentifier(name) {
    return t.identifier(this.generateUid(name));
  };

  /**
   * Generate a unique `_id1` binding.
   */

  Scope.prototype.generateUid = function generateUid(name) {
    name = t.toIdentifier(name).replace(/^_+/, "");

    var uid;
    var i = 0;
    do {
      uid = this._generateUid(name, i);
      i++;
    } while (this.hasBinding(uid) || this.hasGlobal(uid) || this.hasReference(uid));

    var program = this.getProgramParent();
    program.references[uid] = true;
    program.uids[uid] = true;

    return uid;
  };

  /**
   * Generate an `_id1`.
   */

  Scope.prototype._generateUid = function _generateUid(name, i) {
    var id = name;
    if (i > 1) id += i;
    return "_" + id;
  };

  /**
   * Generate a unique identifier based on a node.
   */

  Scope.prototype.generateUidIdentifierBasedOnNode = function generateUidIdentifierBasedOnNode(parent, defaultName) {
    var node = parent;

    if (t.isAssignmentExpression(parent)) {
      node = parent.left;
    } else if (t.isVariableDeclarator(parent)) {
      node = parent.id;
    } else if (t.isProperty(node)) {
      node = node.key;
    }

    var parts = [];

    var add = function add(node) {
      if (t.isModuleDeclaration(node)) {
        if (node.source) {
          add(node.source);
        } else if (node.specifiers && node.specifiers.length) {
          var _arr4 = node.specifiers;

          for (var _i4 = 0; _i4 < _arr4.length; _i4++) {
            var specifier = _arr4[_i4];
            add(specifier);
          }
        } else if (node.declaration) {
          add(node.declaration);
        }
      } else if (t.isModuleSpecifier(node)) {
        add(node.local);
      } else if (t.isMemberExpression(node)) {
        add(node.object);
        add(node.property);
      } else if (t.isIdentifier(node)) {
        parts.push(node.name);
      } else if (t.isLiteral(node)) {
        parts.push(node.value);
      } else if (t.isCallExpression(node)) {
        add(node.callee);
      } else if (t.isObjectExpression(node) || t.isObjectPattern(node)) {
        var _arr5 = node.properties;

        for (var _i5 = 0; _i5 < _arr5.length; _i5++) {
          var prop = _arr5[_i5];
          add(prop.key || prop.argument);
        }
      }
    };

    add(node);

    var id = parts.join("$");
    id = id.replace(/^_/, "") || defaultName || "ref";

    return this.generateUidIdentifier(id);
  };

  /**
   * Determine whether evaluating the specific input `node` is a consequenceless reference. ie.
   * evaluating it wont result in potentially arbitrary code from being ran. The following are
   * whitelisted and determined not to cause side effects:
   *
   *  - `this` expressions
   *  - `super` expressions
   *  - Bound identifiers
   */

  Scope.prototype.isStatic = function isStatic(node) {
    if (t.isThisExpression(node) || t.isSuper(node)) {
      return true;
    }

    if (t.isIdentifier(node)) {
      var binding = this.getBinding(node.name);
      if (binding) {
        return binding.constant;
      } else {
        return this.hasBinding(node.name);
      }
    }

    return false;
  };

  /**
   * Possibly generate a memoised identifier if it is not static and has consequences.
   */

  Scope.prototype.maybeGenerateMemoised = function maybeGenerateMemoised(node, dontPush) {
    if (this.isStatic(node)) {
      return null;
    } else {
      var id = this.generateUidIdentifierBasedOnNode(node);
      if (!dontPush) this.push({ id: id });
      return id;
    }
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.checkBlockScopedCollisions = function checkBlockScopedCollisions(local, kind, name, id) {
    // ignore parameters
    if (kind === "param") return;

    // ignore hoisted functions if there's also a local let
    if (kind === "hoisted" && local.kind === "let") return;

    var duplicate = false;

    // don't allow duplicate bindings to exist alongside
    if (!duplicate) duplicate = kind === "let" || local.kind === "let" || local.kind === "const" || local.kind === "module";

    // don't allow a local of param with a kind of let
    if (!duplicate) duplicate = local.kind === "param" && (kind === "let" || kind === "const");

    if (duplicate) {
      throw this.hub.file.errorWithNode(id, messages.get("scopeDuplicateDeclaration", name), TypeError);
    }
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.rename = function rename(oldName, newName, block) {
    newName = newName || this.generateUidIdentifier(oldName).name;

    var info = this.getBinding(oldName);
    if (!info) return;

    var state = {
      newName: newName,
      oldName: oldName,
      binding: info.identifier,
      info: info
    };

    var scope = info.scope;
    scope.traverse(block || scope.block, renameVisitor, state);

    if (!block) {
      scope.removeOwnBinding(oldName);
      scope.bindings[newName] = info;
      state.binding.name = newName;
    }

    var file = this.hub.file;
    if (file) {
      this._renameFromMap(file.moduleFormatter.localImports, oldName, newName, state.binding);
      //this._renameFromMap(file.moduleFormatter.localExports, oldName, newName);
    }
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype._renameFromMap = function _renameFromMap(map, oldName, newName, value) {
    if (map[oldName]) {
      map[newName] = value;
      map[oldName] = null;
    }
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.dump = function dump() {
    var sep = _repeating2["default"]("-", 60);
    console.log(sep);
    var scope = this;
    do {
      console.log("#", scope.block.type);
      for (var name in scope.bindings) {
        var binding = scope.bindings[name];
        console.log(" -", name, {
          constant: binding.constant,
          references: binding.references,
          kind: binding.kind
        });
      }
    } while (scope = scope.parent);
    console.log(sep);
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.toArray = function toArray(node, i) {
    var file = this.hub.file;

    if (t.isIdentifier(node)) {
      var binding = this.getBinding(node.name);
      if (binding && binding.constant && binding.path.isGenericType("Array")) return node;
    }

    if (t.isArrayExpression(node)) {
      return node;
    }

    if (t.isIdentifier(node, { name: "arguments" })) {
      return t.callExpression(t.memberExpression(file.addHelper("slice"), t.identifier("call")), [node]);
    }

    var helperName = "to-array";
    var args = [node];
    if (i === true) {
      helperName = "to-consumable-array";
    } else if (i) {
      args.push(t.literal(i));
      helperName = "sliced-to-array";
      if (this.hub.file.isLoose("es6.forOf")) helperName += "-loose";
    }
    return t.callExpression(file.addHelper(helperName), args);
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.registerDeclaration = function registerDeclaration(path) {
    if (path.isLabeledStatement()) {
      this.registerBinding("label", path);
    } else if (path.isFunctionDeclaration()) {
      this.registerBinding("hoisted", path.get("id"), path);
    } else if (path.isVariableDeclaration()) {
      var declarations = path.get("declarations");
      var _arr6 = declarations;
      for (var _i6 = 0; _i6 < _arr6.length; _i6++) {
        var declar = _arr6[_i6];
        this.registerBinding(path.node.kind, declar);
      }
    } else if (path.isClassDeclaration()) {
      this.registerBinding("let", path);
    } else if (path.isImportDeclaration()) {
      var specifiers = path.get("specifiers");
      var _arr7 = specifiers;
      for (var _i7 = 0; _i7 < _arr7.length; _i7++) {
        var specifier = _arr7[_i7];
        this.registerBinding("module", specifier);
      }
    } else if (path.isExportDeclaration()) {
      var declar = path.get("declaration");
      if (declar.isClassDeclaration() || declar.isFunctionDeclaration() || declar.isVariableDeclaration()) {
        this.registerDeclaration(declar);
      }
    } else {
      this.registerBinding("unknown", path);
    }
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.registerConstantViolation = function registerConstantViolation(path) {
    var ids = path.getBindingIdentifiers();
    for (var _name2 in ids) {
      var binding = this.getBinding(_name2);
      if (binding) binding.reassign(path);
    }
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.registerBinding = function registerBinding(kind, path) {
    var bindingPath = arguments.length <= 2 || arguments[2] === undefined ? path : arguments[2];
    return (function () {
      if (!kind) throw new ReferenceError("no `kind`");

      if (path.isVariableDeclaration()) {
        var declarators = path.get("declarations");
        var _arr8 = declarators;
        for (var _i8 = 0; _i8 < _arr8.length; _i8++) {
          var declar = _arr8[_i8];
          this.registerBinding(kind, declar);
        }
        return;
      }

      var parent = this.getProgramParent();
      var ids = path.getBindingIdentifiers(true);

      for (var name in ids) {
        var _arr9 = ids[name];

        for (var _i9 = 0; _i9 < _arr9.length; _i9++) {
          var id = _arr9[_i9];
          var local = this.getOwnBinding(name);
          if (local) {
            // same identifier so continue safely as we're likely trying to register it
            // multiple times
            if (local.identifier === id) continue;

            this.checkBlockScopedCollisions(local, kind, name, id);
          }

          parent.references[name] = true;

          this.bindings[name] = new _binding2["default"]({
            identifier: id,
            existing: local,
            scope: this,
            path: bindingPath,
            kind: kind
          });
        }
      }
    }).apply(this, arguments);
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.addGlobal = function addGlobal(node) {
    this.globals[node.name] = node;
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.hasUid = function hasUid(name) {
    var scope = this;

    do {
      if (scope.uids[name]) return true;
    } while (scope = scope.parent);

    return false;
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.hasGlobal = function hasGlobal(name) {
    var scope = this;

    do {
      if (scope.globals[name]) return true;
    } while (scope = scope.parent);

    return false;
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.hasReference = function hasReference(name) {
    var scope = this;

    do {
      if (scope.references[name]) return true;
    } while (scope = scope.parent);

    return false;
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.isPure = function isPure(node, constantsOnly) {
    if (t.isIdentifier(node)) {
      var binding = this.getBinding(node.name);
      if (!binding) return false;
      if (constantsOnly) return binding.constant;
      return true;
    } else if (t.isClass(node)) {
      return !node.superClass || this.isPure(node.superClass, constantsOnly);
    } else if (t.isBinary(node)) {
      return this.isPure(node.left, constantsOnly) && this.isPure(node.right, constantsOnly);
    } else if (t.isArrayExpression(node)) {
      var _arr10 = node.elements;

      for (var _i10 = 0; _i10 < _arr10.length; _i10++) {
        var elem = _arr10[_i10];
        if (!this.isPure(elem, constantsOnly)) return false;
      }
      return true;
    } else if (t.isObjectExpression(node)) {
      var _arr11 = node.properties;

      for (var _i11 = 0; _i11 < _arr11.length; _i11++) {
        var prop = _arr11[_i11];
        if (!this.isPure(prop, constantsOnly)) return false;
      }
      return true;
    } else if (t.isProperty(node)) {
      if (node.computed && !this.isPure(node.key, constantsOnly)) return false;
      return this.isPure(node.value, constantsOnly);
    } else {
      return t.isPure(node);
    }
  };

  /**
   * Set some arbitrary data on the current scope.
   */

  Scope.prototype.setData = function setData(key, val) {
    return this.data[key] = val;
  };

  /**
   * Recursively walk up scope tree looking for the data `key`.
   */

  Scope.prototype.getData = function getData(key) {
    var scope = this;
    do {
      var data = scope.data[key];
      if (data != null) return data;
    } while (scope = scope.parent);
  };

  /**
   * Recursively walk up scope tree looking for the data `key` and if it exists,
   * remove it.
   */

  Scope.prototype.removeData = function removeData(key) {
    var scope = this;
    do {
      var data = scope.data[key];
      if (data != null) scope.data[key] = null;
    } while (scope = scope.parent);
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.init = function init() {
    if (!this.references) this.crawl();
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.crawl = function crawl() {
    var path = this.path;

    //

    var info = this.block._scopeInfo;
    if (info) return _lodashObjectExtend2["default"](this, info);

    info = this.block._scopeInfo = {
      references: _helpersObject2["default"](),
      bindings: _helpersObject2["default"](),
      globals: _helpersObject2["default"](),
      uids: _helpersObject2["default"](),
      data: _helpersObject2["default"]()
    };

    _lodashObjectExtend2["default"](this, info);

    // ForStatement - left, init

    if (path.isLoop()) {
      var _arr12 = t.FOR_INIT_KEYS;

      for (var _i12 = 0; _i12 < _arr12.length; _i12++) {
        var key = _arr12[_i12];
        var node = path.get(key);
        if (node.isBlockScoped()) this.registerBinding(node.node.kind, node);
      }
    }

    // FunctionExpression - id

    if (path.isFunctionExpression() && path.has("id")) {
      this.registerBinding("local", path.get("id"), path);
    }

    // Class

    if (path.isClassExpression() && path.has("id")) {
      this.registerBinding("local", path);
    }

    // Function - params, rest

    if (path.isFunction()) {
      var params = path.get("params");
      var _arr13 = params;
      for (var _i13 = 0; _i13 < _arr13.length; _i13++) {
        var param = _arr13[_i13];
        this.registerBinding("param", param);
      }
    }

    // CatchClause - param

    if (path.isCatchClause()) {
      this.registerBinding("let", path);
    }

    // ComprehensionExpression - blocks

    if (path.isComprehensionExpression()) {
      this.registerBinding("let", path);
    }

    // Program

    var parent = this.getProgramParent();
    if (parent.crawling) return;

    var state = {
      references: [],
      constantViolations: [],
      assignments: []
    };

    this.crawling = true;
    path.traverse(collectorVisitor, state);
    this.crawling = false;

    // register assignments
    for (var _iterator = state.assignments, _isArray = Array.isArray(_iterator), _i14 = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i14 >= _iterator.length) break;
        _ref = _iterator[_i14++];
      } else {
        _i14 = _iterator.next();
        if (_i14.done) break;
        _ref = _i14.value;
      }

      var _path = _ref;

      // register undeclared bindings as globals
      var ids = _path.getBindingIdentifiers();
      var programParent = undefined;
      for (var _name3 in ids) {
        if (_path.scope.getBinding(_name3)) continue;

        programParent = programParent || _path.scope.getProgramParent();
        programParent.addGlobal(ids[_name3]);
      }

      // register as constant violation
      _path.scope.registerConstantViolation(_path);
    }

    // register references
    for (var _iterator2 = state.references, _isArray2 = Array.isArray(_iterator2), _i15 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray2) {
        if (_i15 >= _iterator2.length) break;
        _ref2 = _iterator2[_i15++];
      } else {
        _i15 = _iterator2.next();
        if (_i15.done) break;
        _ref2 = _i15.value;
      }

      var ref = _ref2;

      var binding = ref.scope.getBinding(ref.node.name);
      if (binding) {
        binding.reference(ref);
      } else {
        ref.scope.getProgramParent().addGlobal(ref.node);
      }
    }

    // register constant violations
    for (var _iterator3 = state.constantViolations, _isArray3 = Array.isArray(_iterator3), _i16 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
      var _ref3;

      if (_isArray3) {
        if (_i16 >= _iterator3.length) break;
        _ref3 = _iterator3[_i16++];
      } else {
        _i16 = _iterator3.next();
        if (_i16.done) break;
        _ref3 = _i16.value;
      }

      var _path2 = _ref3;

      _path2.scope.registerConstantViolation(_path2);
    }
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.push = function push(opts) {
    var path = this.path;

    if (path.isSwitchStatement()) {
      path = this.getFunctionParent().path;
    }

    if (path.isLoop() || path.isCatchClause() || path.isFunction()) {
      t.ensureBlock(path.node);
      path = path.get("body");
    }

    if (!path.isBlockStatement() && !path.isProgram()) {
      path = this.getBlockParent().path;
    }

    var unique = opts.unique;
    var kind = opts.kind || "var";
    var blockHoist = opts._blockHoist == null ? 2 : opts._blockHoist;

    var dataKey = "declaration:" + kind + ":" + blockHoist;
    var declarPath = !unique && path.getData(dataKey);

    if (!declarPath) {
      var declar = t.variableDeclaration(kind, []);
      declar._generated = true;
      declar._blockHoist = blockHoist;

      this.hub.file.attachAuxiliaryComment(declar);

      var _path$unshiftContainer = path.unshiftContainer("body", [declar]);

      declarPath = _path$unshiftContainer[0];

      if (!unique) path.setData(dataKey, declarPath);
    }

    var declarator = t.variableDeclarator(opts.id, opts.init);
    declarPath.node.declarations.push(declarator);
    this.registerBinding(kind, declarPath.get("declarations").pop());
  };

  /**
   * Walk up to the top of the scope tree and get the `Program`.
   */

  Scope.prototype.getProgramParent = function getProgramParent() {
    var scope = this;
    do {
      if (scope.path.isProgram()) {
        return scope;
      }
    } while (scope = scope.parent);
    throw new Error("We couldn't find a Function or Program...");
  };

  /**
   * Walk up the scope tree until we hit either a Function or reach the
   * very top and hit Program.
   */

  Scope.prototype.getFunctionParent = function getFunctionParent() {
    var scope = this;
    do {
      if (scope.path.isFunctionParent()) {
        return scope;
      }
    } while (scope = scope.parent);
    throw new Error("We couldn't find a Function or Program...");
  };

  /**
   * Walk up the scope tree until we hit either a BlockStatement/Loop/Program/Function/Switch or reach the
   * very top and hit Program.
   */

  Scope.prototype.getBlockParent = function getBlockParent() {
    var scope = this;
    do {
      if (scope.path.isBlockParent()) {
        return scope;
      }
    } while (scope = scope.parent);
    throw new Error("We couldn't find a BlockStatement, For, Switch, Function, Loop or Program...");
  };

  /**
   * Walks the scope tree and gathers **all** bindings.
   */

  Scope.prototype.getAllBindings = function getAllBindings() {
    var ids = _helpersObject2["default"]();

    var scope = this;
    do {
      _lodashObjectDefaults2["default"](ids, scope.bindings);
      scope = scope.parent;
    } while (scope);

    return ids;
  };

  /**
   * Walks the scope tree and gathers all declarations of `kind`.
   */

  Scope.prototype.getAllBindingsOfKind = function getAllBindingsOfKind() {
    var ids = _helpersObject2["default"]();

    var _arr14 = arguments;
    for (var _i17 = 0; _i17 < _arr14.length; _i17++) {
      var kind = _arr14[_i17];
      var scope = this;
      do {
        for (var name in scope.bindings) {
          var binding = scope.bindings[name];
          if (binding.kind === kind) ids[name] = binding;
        }
        scope = scope.parent;
      } while (scope);
    }

    return ids;
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.bindingIdentifierEquals = function bindingIdentifierEquals(name, node) {
    return this.getBindingIdentifier(name) === node;
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.getBinding = function getBinding(name) {
    var scope = this;

    do {
      var binding = scope.getOwnBinding(name);
      if (binding) return binding;
    } while (scope = scope.parent);
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.getOwnBinding = function getOwnBinding(name) {
    return this.bindings[name];
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.getBindingIdentifier = function getBindingIdentifier(name) {
    var info = this.getBinding(name);
    return info && info.identifier;
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.getOwnBindingIdentifier = function getOwnBindingIdentifier(name) {
    var binding = this.bindings[name];
    return binding && binding.identifier;
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.hasOwnBinding = function hasOwnBinding(name) {
    return !!this.getOwnBinding(name);
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.hasBinding = function hasBinding(name, noGlobals) {
    if (!name) return false;
    if (this.hasOwnBinding(name)) return true;
    if (this.parentHasBinding(name, noGlobals)) return true;
    if (this.hasUid(name)) return true;
    if (!noGlobals && _lodashCollectionIncludes2["default"](Scope.globals, name)) return true;
    if (!noGlobals && _lodashCollectionIncludes2["default"](Scope.contextVariables, name)) return true;
    return false;
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.parentHasBinding = function parentHasBinding(name, noGlobals) {
    return this.parent && this.parent.hasBinding(name, noGlobals);
  };

  /**
   * Move a binding of `name` to another `scope`.
   */

  Scope.prototype.moveBindingTo = function moveBindingTo(name, scope) {
    var info = this.getBinding(name);
    if (info) {
      info.scope.removeOwnBinding(name);
      info.scope = scope;
      scope.bindings[name] = info;
    }
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.removeOwnBinding = function removeOwnBinding(name) {
    delete this.bindings[name];
  };

  /**
   * [Please add a description.]
   */

  Scope.prototype.removeBinding = function removeBinding(name) {
    // clear literal binding
    var info = this.getBinding(name);
    if (info) {
      info.scope.removeOwnBinding(name);
    }

    // clear uids with this name - https://github.com/babel/babel/issues/2101
    var scope = this;
    do {
      if (scope.uids[name]) {
        scope.uids[name] = false;
      }
    } while (scope = scope.parent);
  };

  _createClass(Scope, null, [{
    key: "globals",
    value: _lodashArrayFlatten2["default"]([_globals2["default"].builtin, _globals2["default"].browser, _globals2["default"].node].map(Object.keys)),

    /**
     * Variables available in current context.
     */

    enumerable: true
  }, {
    key: "contextVariables",
    value: ["arguments", "undefined", "Infinity", "NaN"],
    enumerable: true
  }]);

  return Scope;
})();

exports["default"] = Scope;
module.exports = exports["default"];
},{"../../helpers/object":2,"../../messages":4,"../../types":38,"../index":7,"./binding":25,"globals":75,"lodash/array/flatten":80,"lodash/collection/includes":86,"lodash/object/defaults":164,"lodash/object/extend":165,"repeating":180}],27:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.explode = explode;
exports.verify = verify;
exports.merge = merge;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

var _pathLibVirtualTypes = require("./path/lib/virtual-types");

var virtualTypes = _interopRequireWildcard(_pathLibVirtualTypes);

var _messages = require("../messages");

var messages = _interopRequireWildcard(_messages);

var _types = require("../types");

var t = _interopRequireWildcard(_types);

var _lodashLangClone = require("lodash/lang/clone");

var _lodashLangClone2 = _interopRequireDefault(_lodashLangClone);

/**
 * [Please add a description.]
 */

function explode(visitor) {
  if (visitor._exploded) return visitor;
  visitor._exploded = true;

  // normalise pipes
  for (var nodeType in visitor) {
    if (shouldIgnoreKey(nodeType)) continue;

    var parts = nodeType.split("|");
    if (parts.length === 1) continue;

    var fns = visitor[nodeType];
    delete visitor[nodeType];

    var _arr = parts;
    for (var _i = 0; _i < _arr.length; _i++) {
      var part = _arr[_i];
      visitor[part] = fns;
    }
  }

  // verify data structure
  verify(visitor);

  // make sure there's no __esModule type since this is because we're using loose mode
  // and it sets __esModule to be enumerable on all modules :(
  delete visitor.__esModule;

  // ensure visitors are objects
  ensureEntranceObjects(visitor);

  // ensure enter/exit callbacks are arrays
  ensureCallbackArrays(visitor);

  // add type wrappers

  var _arr2 = Object.keys(visitor);

  for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
    var nodeType = _arr2[_i2];
    if (shouldIgnoreKey(nodeType)) continue;

    var wrapper = virtualTypes[nodeType];
    if (!wrapper) continue;

    // wrap all the functions
    var fns = visitor[nodeType];
    for (var type in fns) {
      fns[type] = wrapCheck(wrapper, fns[type]);
    }

    // clear it from the visitor
    delete visitor[nodeType];

    if (wrapper.types) {
      var _arr4 = wrapper.types;

      for (var _i4 = 0; _i4 < _arr4.length; _i4++) {
        var type = _arr4[_i4];
        // merge the visitor if necessary or just put it back in
        if (visitor[type]) {
          mergePair(visitor[type], fns);
        } else {
          visitor[type] = fns;
        }
      }
    } else {
      mergePair(visitor, fns);
    }
  }

  // add aliases
  for (var nodeType in visitor) {
    if (shouldIgnoreKey(nodeType)) continue;

    var fns = visitor[nodeType];

    var aliases = t.FLIPPED_ALIAS_KEYS[nodeType];
    if (!aliases) continue;

    // clear it from the visitor
    delete visitor[nodeType];

    var _arr3 = aliases;
    for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
      var alias = _arr3[_i3];
      var existing = visitor[alias];
      if (existing) {
        mergePair(existing, fns);
      } else {
        visitor[alias] = _lodashLangClone2["default"](fns);
      }
    }
  }

  for (var nodeType in visitor) {
    if (shouldIgnoreKey(nodeType)) continue;

    ensureCallbackArrays(visitor[nodeType]);
  }

  return visitor;
}

/**
 * [Please add a description.]
 */

function verify(visitor) {
  if (visitor._verified) return;

  if (typeof visitor === "function") {
    throw new Error(messages.get("traverseVerifyRootFunction"));
  }

  for (var nodeType in visitor) {
    if (shouldIgnoreKey(nodeType)) continue;

    if (t.TYPES.indexOf(nodeType) < 0) {
      throw new Error(messages.get("traverseVerifyNodeType", nodeType));
    }

    var visitors = visitor[nodeType];
    if (typeof visitors === "object") {
      for (var visitorKey in visitors) {
        if (visitorKey === "enter" || visitorKey === "exit") continue;
        throw new Error(messages.get("traverseVerifyVisitorProperty", nodeType, visitorKey));
      }
    }
  }

  visitor._verified = true;
}

/**
 * [Please add a description.]
 */

function merge(visitors) {
  var rootVisitor = {};

  var _arr5 = visitors;
  for (var _i5 = 0; _i5 < _arr5.length; _i5++) {
    var visitor = _arr5[_i5];
    explode(visitor);

    for (var type in visitor) {
      var nodeVisitor = rootVisitor[type] = rootVisitor[type] || {};
      mergePair(nodeVisitor, visitor[type]);
    }
  }

  return rootVisitor;
}

/**
 * [Please add a description.]
 */

function ensureEntranceObjects(obj) {
  for (var key in obj) {
    if (shouldIgnoreKey(key)) continue;

    var fns = obj[key];
    if (typeof fns === "function") {
      obj[key] = { enter: fns };
    }
  }
}

/**
 * Makes sure that enter and exit callbacks are arrays.
 */

function ensureCallbackArrays(obj) {
  if (obj.enter && !Array.isArray(obj.enter)) obj.enter = [obj.enter];
  if (obj.exit && !Array.isArray(obj.exit)) obj.exit = [obj.exit];
}

/**
 * [Please add a description.]
 */

function wrapCheck(wrapper, fn) {
  return function () {
    if (wrapper.checkPath(this)) {
      return fn.apply(this, arguments);
    }
  };
}

/**
 * [Please add a description.]
 */

function shouldIgnoreKey(key) {
  // internal/hidden key
  if (key[0] === "_") return true;

  // ignore function keys
  if (key === "enter" || key === "exit" || key === "shouldSkip") return true;

  // ignore other options
  if (key === "blacklist" || key === "noScope" || key === "skipKeys") return true;

  return false;
}

/**
 * [Please add a description.]
 */

function mergePair(dest, src) {
  for (var key in src) {
    dest[key] = [].concat(dest[key] || [], src[key]);
  }
}
},{"../messages":4,"../types":38,"./path/lib/virtual-types":21,"lodash/lang/clone":149}],28:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.toComputedKey = toComputedKey;
exports.toSequenceExpression = toSequenceExpression;
exports.toKeyAlias = toKeyAlias;
exports.toIdentifier = toIdentifier;
exports.toBindingIdentifierName = toBindingIdentifierName;
exports.toStatement = toStatement;
exports.toExpression = toExpression;
exports.toBlock = toBlock;
exports.valueToNode = valueToNode;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _lodashLangIsPlainObject = require("lodash/lang/isPlainObject");

var _lodashLangIsPlainObject2 = _interopRequireDefault(_lodashLangIsPlainObject);

var _lodashLangIsNumber = require("lodash/lang/isNumber");

var _lodashLangIsNumber2 = _interopRequireDefault(_lodashLangIsNumber);

var _lodashLangIsRegExp = require("lodash/lang/isRegExp");

var _lodashLangIsRegExp2 = _interopRequireDefault(_lodashLangIsRegExp);

var _lodashLangIsString = require("lodash/lang/isString");

var _lodashLangIsString2 = _interopRequireDefault(_lodashLangIsString);

var _traversal = require("../traversal");

var _traversal2 = _interopRequireDefault(_traversal);

var _index = require("./index");

var t = _interopRequireWildcard(_index);

/**
 * [Please add a description.]
 */

function toComputedKey(node) {
  var key = arguments.length <= 1 || arguments[1] === undefined ? node.key || node.property : arguments[1];
  return (function () {
    if (!node.computed) {
      if (t.isIdentifier(key)) key = t.literal(key.name);
    }
    return key;
  })();
}

/**
 * Turn an array of statement `nodes` into a `SequenceExpression`.
 *
 * Variable declarations are turned into simple assignments and their
 * declarations hoisted to the top of the current scope.
 *
 * Expression statements are just resolved to their expression.
 */

function toSequenceExpression(nodes, scope) {
  var declars = [];
  var bailed = false;

  var result = convert(nodes);
  if (bailed) return;

  for (var i = 0; i < declars.length; i++) {
    scope.push(declars[i]);
  }

  return result;

  function convert(nodes) {
    var ensureLastUndefined = false;
    var exprs = [];

    var _arr = nodes;
    for (var _i = 0; _i < _arr.length; _i++) {
      var node = _arr[_i];
      if (t.isExpression(node)) {
        exprs.push(node);
      } else if (t.isExpressionStatement(node)) {
        exprs.push(node.expression);
      } else if (t.isVariableDeclaration(node)) {
        if (node.kind !== "var") return bailed = true; // bailed

        var _arr2 = node.declarations;
        for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
          var declar = _arr2[_i2];
          var bindings = t.getBindingIdentifiers(declar);
          for (var key in bindings) {
            declars.push({
              kind: node.kind,
              id: bindings[key]
            });
          }

          if (declar.init) {
            exprs.push(t.assignmentExpression("=", declar.id, declar.init));
          }
        }

        ensureLastUndefined = true;
        continue;
      } else if (t.isIfStatement(node)) {
        var consequent = node.consequent ? convert([node.consequent]) : t.identifier("undefined");
        var alternate = node.alternate ? convert([node.alternate]) : t.identifier("undefined");
        if (!consequent || !alternate) return bailed = true;

        exprs.push(t.conditionalExpression(node.test, consequent, alternate));
      } else if (t.isBlockStatement(node)) {
        exprs.push(convert(node.body));
      } else if (t.isEmptyStatement(node)) {
        // empty statement so ensure the last item is undefined if we're last
        ensureLastUndefined = true;
        continue;
      } else {
        // bailed, we can't turn this statement into an expression
        return bailed = true;
      }

      ensureLastUndefined = false;
    }

    if (ensureLastUndefined) {
      exprs.push(t.identifier("undefined"));
    }

    //

    if (exprs.length === 1) {
      return exprs[0];
    } else {
      return t.sequenceExpression(exprs);
    }
  }
}

/**
 * [Please add a description.]
 */

function toKeyAlias(node) {
  var key = arguments.length <= 1 || arguments[1] === undefined ? node.key : arguments[1];
  return (function () {
    var alias;

    if (node.kind === "method") {
      return toKeyAlias.uid++;
    } else if (t.isIdentifier(key)) {
      alias = key.name;
    } else if (t.isLiteral(key)) {
      alias = JSON.stringify(key.value);
    } else {
      alias = JSON.stringify(_traversal2["default"].removeProperties(t.cloneDeep(key)));
    }

    if (node.computed) {
      alias = "[" + alias + "]";
    }

    return alias;
  })();
}

toKeyAlias.uid = 0;

/**
 * [Please add a description.]
 */

function toIdentifier(name) {
  if (t.isIdentifier(name)) return name.name;

  name = name + "";

  // replace all non-valid identifiers with dashes
  name = name.replace(/[^a-zA-Z0-9$_]/g, "-");

  // remove all dashes and numbers from start of name
  name = name.replace(/^[-0-9]+/, "");

  // camel case
  name = name.replace(/[-\s]+(.)?/g, function (match, c) {
    return c ? c.toUpperCase() : "";
  });

  if (!t.isValidIdentifier(name)) {
    name = "_" + name;
  }

  return name || "_";
}

/**
 * [Please add a description.]
 */

function toBindingIdentifierName(name) {
  name = toIdentifier(name);
  if (name === "eval" || name === "arguments") name = "_" + name;
  return name;
}

/**
 * [Please add a description.]
 * @returns {Object|Boolean}
 */

function toStatement(node, ignore) {
  if (t.isStatement(node)) {
    return node;
  }

  var mustHaveId = false;
  var newType;

  if (t.isClass(node)) {
    mustHaveId = true;
    newType = "ClassDeclaration";
  } else if (t.isFunction(node)) {
    mustHaveId = true;
    newType = "FunctionDeclaration";
  } else if (t.isAssignmentExpression(node)) {
    return t.expressionStatement(node);
  }

  if (mustHaveId && !node.id) {
    newType = false;
  }

  if (!newType) {
    if (ignore) {
      return false;
    } else {
      throw new Error("cannot turn " + node.type + " to a statement");
    }
  }

  node.type = newType;

  return node;
}

/**
 * [Please add a description.]
 */

function toExpression(node) {
  if (t.isExpressionStatement(node)) {
    node = node.expression;
  }

  if (t.isClass(node)) {
    node.type = "ClassExpression";
  } else if (t.isFunction(node)) {
    node.type = "FunctionExpression";
  }

  if (t.isExpression(node)) {
    return node;
  } else {
    throw new Error("cannot turn " + node.type + " to an expression");
  }
}

/**
 * [Please add a description.]
 */

function toBlock(node, parent) {
  if (t.isBlockStatement(node)) {
    return node;
  }

  if (t.isEmptyStatement(node)) {
    node = [];
  }

  if (!Array.isArray(node)) {
    if (!t.isStatement(node)) {
      if (t.isFunction(parent)) {
        node = t.returnStatement(node);
      } else {
        node = t.expressionStatement(node);
      }
    }

    node = [node];
  }

  return t.blockStatement(node);
}

/**
 * [Please add a description.]
 */

function valueToNode(value) {
  // undefined
  if (value === undefined) {
    return t.identifier("undefined");
  }

  // null, booleans, strings, numbers, regexs
  if (value === true || value === false || value === null || _lodashLangIsString2["default"](value) || _lodashLangIsNumber2["default"](value) || _lodashLangIsRegExp2["default"](value)) {
    return t.literal(value);
  }

  // array
  if (Array.isArray(value)) {
    return t.arrayExpression(value.map(t.valueToNode));
  }

  // object
  if (_lodashLangIsPlainObject2["default"](value)) {
    var props = [];
    for (var key in value) {
      var nodeKey;
      if (t.isValidIdentifier(key)) {
        nodeKey = t.identifier(key);
      } else {
        nodeKey = t.literal(key);
      }
      props.push(t.property("init", nodeKey, t.valueToNode(value[key])));
    }
    return t.objectExpression(props);
  }

  throw new Error("don't know how to turn this value into a node");
}
},{"../traversal":7,"./index":38,"lodash/lang/isNumber":157,"lodash/lang/isPlainObject":159,"lodash/lang/isRegExp":160,"lodash/lang/isString":161}],29:[function(require,module,exports){
"use strict";

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

_index2["default"]("ArrayExpression", {
  visitor: ["elements"],
  aliases: ["Expression"]
});

_index2["default"]("AssignmentExpression", {
  builder: ["operator", "left", "right"],
  visitor: ["left", "right"],
  aliases: ["Expression"]
});

_index2["default"]("BinaryExpression", {
  builder: ["operator", "left", "right"],
  visitor: ["left", "right"],
  aliases: ["Binary", "Expression"]
});

_index2["default"]("BlockStatement", {
  visitor: ["body"],
  aliases: ["Scopable", "BlockParent", "Block", "Statement"]
});

_index2["default"]("BreakStatement", {
  visitor: ["label"],
  aliases: ["Statement", "Terminatorless", "CompletionStatement"]
});

_index2["default"]("CallExpression", {
  visitor: ["callee", "arguments"],
  aliases: ["Expression"]
});

_index2["default"]("CatchClause", {
  visitor: ["param", "body"],
  aliases: ["Scopable"]
});

_index2["default"]("ConditionalExpression", {
  visitor: ["test", "consequent", "alternate"],
  aliases: ["Expression"]
});

_index2["default"]("ContinueStatement", {
  visitor: ["label"],
  aliases: ["Statement", "Terminatorless", "CompletionStatement"]
});

_index2["default"]("DebuggerStatement", {
  aliases: ["Statement"]
});

_index2["default"]("DoWhileStatement", {
  visitor: ["body", "test"],
  aliases: ["Statement", "BlockParent", "Loop", "While", "Scopable"]
});

_index2["default"]("EmptyStatement", {
  aliases: ["Statement"]
});

_index2["default"]("ExpressionStatement", {
  visitor: ["expression"],
  aliases: ["Statement"]
});

_index2["default"]("File", {
  builder: ["program", "comments", "tokens"],
  visitor: ["program"]
});

_index2["default"]("ForInStatement", {
  visitor: ["left", "right", "body"],
  aliases: ["Scopable", "Statement", "For", "BlockParent", "Loop", "ForXStatement"]
});

_index2["default"]("ForStatement", {
  visitor: ["init", "test", "update", "body"],
  aliases: ["Scopable", "Statement", "For", "BlockParent", "Loop"]
});

_index2["default"]("FunctionDeclaration", {
  builder: {
    id: null,
    params: null,
    body: null,
    generator: false,
    async: false
  },
  visitor: ["id", "params", "body", "returnType", "typeParameters"],
  aliases: ["Scopable", "Function", "Func", "BlockParent", "FunctionParent", "Statement", "Pure", "Declaration"]
});

_index2["default"]("FunctionExpression", {
  builder: {
    id: null,
    params: null,
    body: null,
    generator: false,
    async: false
  },
  visitor: ["id", "params", "body", "returnType", "typeParameters"],
  aliases: ["Scopable", "Function", "Func", "BlockParent", "FunctionParent", "Expression", "Pure"]
});

_index2["default"]("Identifier", {
  builder: ["name"],
  visitor: ["typeAnnotation"],
  aliases: ["Expression"]
});

_index2["default"]("IfStatement", {
  visitor: ["test", "consequent", "alternate"],
  aliases: ["Statement"]
});

_index2["default"]("LabeledStatement", {
  visitor: ["label", "body"],
  aliases: ["Statement"]
});

_index2["default"]("Literal", {
  builder: ["value"],
  aliases: ["Expression", "Pure"]
});

_index2["default"]("LogicalExpression", {
  builder: ["operator", "left", "right"],
  visitor: ["left", "right"],
  aliases: ["Binary", "Expression"]
});

_index2["default"]("MemberExpression", {
  builder: {
    object: null,
    property: null,
    computed: false
  },
  visitor: ["object", "property"],
  aliases: ["Expression"]
});

_index2["default"]("NewExpression", {
  visitor: ["callee", "arguments"],
  aliases: ["Expression"]
});

_index2["default"]("ObjectExpression", {
  visitor: ["properties"],
  aliases: ["Expression"]
});

_index2["default"]("Program", {
  visitor: ["body"],
  aliases: ["Scopable", "BlockParent", "Block", "FunctionParent"]
});

_index2["default"]("Property", {
  builder: {
    kind: "init",
    key: null,
    value: null,
    computed: false
  },
  visitor: ["key", "value", "decorators"],
  aliases: ["UserWhitespacable"]
});

_index2["default"]("RestElement", {
  visitor: ["argument", "typeAnnotation"]
});

_index2["default"]("ReturnStatement", {
  visitor: ["argument"],
  aliases: ["Statement", "Terminatorless", "CompletionStatement"]
});

_index2["default"]("SequenceExpression", {
  visitor: ["expressions"],
  aliases: ["Expression"]
});

_index2["default"]("SwitchCase", {
  visitor: ["test", "consequent"]
});

_index2["default"]("SwitchStatement", {
  visitor: ["discriminant", "cases"],
  aliases: ["Statement", "BlockParent", "Scopable"]
});

_index2["default"]("ThisExpression", {
  aliases: ["Expression"]
});

_index2["default"]("ThrowStatement", {
  visitor: ["argument"],
  aliases: ["Statement", "Terminatorless", "CompletionStatement"]
});

_index2["default"]("TryStatement", {
  builder: ["block", "handler", "finalizer"],
  visitor: ["block", "handlers", "handler", "guardedHandlers", "finalizer"],
  aliases: ["Statement"]
});

_index2["default"]("UnaryExpression", {
  builder: {
    operator: null,
    argument: null,
    prefix: false
  },
  visitor: ["argument"],
  aliases: ["UnaryLike", "Expression"]
});

_index2["default"]("UpdateExpression", {
  builder: {
    operator: null,
    argument: null,
    prefix: false
  },
  visitor: ["argument"],
  aliases: ["Expression"]
});

_index2["default"]("VariableDeclaration", {
  builder: ["kind", "declarations"],
  visitor: ["declarations"],
  aliases: ["Statement", "Declaration"]
});

_index2["default"]("VariableDeclarator", {
  visitor: ["id", "init"]
});

_index2["default"]("WhileStatement", {
  visitor: ["test", "body"],
  aliases: ["Statement", "BlockParent", "Loop", "While", "Scopable"]
});

_index2["default"]("WithStatement", {
  visitor: ["object", "body"],
  aliases: ["Statement"]
});
},{"./index":33}],30:[function(require,module,exports){
"use strict";

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

_index2["default"]("AssignmentPattern", {
  visitor: ["left", "right"],
  aliases: ["Pattern"]
});

_index2["default"]("ArrayPattern", {
  visitor: ["elements", "typeAnnotation"],
  aliases: ["Pattern"]
});

_index2["default"]("ArrowFunctionExpression", {
  builder: ["params", "body", "async"],
  visitor: ["params", "body", "returnType"],
  aliases: ["Scopable", "Function", "Func", "BlockParent", "FunctionParent", "Expression", "Pure"]
});

_index2["default"]("ClassBody", {
  visitor: ["body"]
});

_index2["default"]("ClassDeclaration", {
  visitor: ["id", "body", "superClass", "typeParameters", "superTypeParameters", "implements", "decorators"],
  aliases: ["Scopable", "Class", "Statement", "Declaration"]
});

_index2["default"]("ClassExpression", {
  visitor: ["id", "body", "superClass", "typeParameters", "superTypeParameters", "implements", "decorators"],
  aliases: ["Scopable", "Class", "Expression"]
});

_index2["default"]("ExportAllDeclaration", {
  visitor: ["source", "exported"],
  aliases: ["Statement", "Declaration", "ModuleDeclaration", "ExportDeclaration"]
});

_index2["default"]("ExportDefaultDeclaration", {
  visitor: ["declaration"],
  aliases: ["Statement", "Declaration", "ModuleDeclaration", "ExportDeclaration"]
});

_index2["default"]("ExportNamedDeclaration", {
  visitor: ["declaration", "specifiers", "source"],
  aliases: ["Statement", "Declaration", "ModuleDeclaration", "ExportDeclaration"]
});

_index2["default"]("ExportDefaultSpecifier", {
  visitor: ["exported"],
  aliases: ["ModuleSpecifier"]
});

_index2["default"]("ExportNamespaceSpecifier", {
  visitor: ["exported"],
  aliases: ["ModuleSpecifier"]
});

_index2["default"]("ExportSpecifier", {
  visitor: ["local", "exported"],
  aliases: ["ModuleSpecifier"]
});

_index2["default"]("ForOfStatement", {
  visitor: ["left", "right", "body"],
  aliases: ["Scopable", "Statement", "For", "BlockParent", "Loop", "ForXStatement"]
});

_index2["default"]("ImportDeclaration", {
  visitor: ["specifiers", "source"],
  aliases: ["Statement", "Declaration", "ModuleDeclaration"]
});

_index2["default"]("ImportDefaultSpecifier", {
  visitor: ["local"],
  aliases: ["ModuleSpecifier"]
});

_index2["default"]("ImportNamespaceSpecifier", {
  visitor: ["local"],
  aliases: ["ModuleSpecifier"]
});

_index2["default"]("ImportSpecifier", {
  visitor: ["local", "imported"],
  aliases: ["ModuleSpecifier"]
});

_index2["default"]("MetaProperty", {
  visitor: ["meta", "property"],
  aliases: ["Expression"]
});

_index2["default"]("MethodDefinition", {
  builder: {
    key: null,
    value: null,
    kind: "method",
    computed: false,
    "static": false
  },
  visitor: ["key", "value", "decorators"]
});

_index2["default"]("ObjectPattern", {
  visitor: ["properties", "typeAnnotation"],
  aliases: ["Pattern"]
});

_index2["default"]("SpreadElement", {
  visitor: ["argument"],
  aliases: ["UnaryLike"]
});

_index2["default"]("Super", {
  aliases: ["Expression"]
});

_index2["default"]("TaggedTemplateExpression", {
  visitor: ["tag", "quasi"],
  aliases: ["Expression"]
});

_index2["default"]("TemplateElement");

_index2["default"]("TemplateLiteral", {
  visitor: ["quasis", "expressions"],
  aliases: ["Expression"]
});

_index2["default"]("YieldExpression", {
  builder: ["argument", "delegate"],
  visitor: ["argument"],
  aliases: ["Expression", "Terminatorless"]
});
},{"./index":33}],31:[function(require,module,exports){
"use strict";

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

_index2["default"]("AwaitExpression", {
  builder: ["argument", "all"],
  visitor: ["argument"],
  aliases: ["Expression", "Terminatorless"]
});

_index2["default"]("BindExpression", {
  visitor: ["object", "callee"]
});

_index2["default"]("ComprehensionBlock", {
  visitor: ["left", "right"]
});

_index2["default"]("ComprehensionExpression", {
  visitor: ["filter", "blocks", "body"],
  aliases: ["Expression", "Scopable"]
});

_index2["default"]("Decorator", {
  visitor: ["expression"]
});

_index2["default"]("DoExpression", {
  visitor: ["body"],
  aliases: ["Expression"]
});

_index2["default"]("SpreadProperty", {
  visitor: ["argument"],
  aliases: ["UnaryLike"]
});
},{"./index":33}],32:[function(require,module,exports){
"use strict";

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

_index2["default"]("AnyTypeAnnotation", {
  aliases: ["Flow", "FlowBaseAnnotation"]
});

_index2["default"]("ArrayTypeAnnotation", {
  visitor: ["elementType"],
  aliases: ["Flow"]
});

_index2["default"]("BooleanTypeAnnotation", {
  aliases: ["Flow", "FlowBaseAnnotation"]
});

_index2["default"]("BooleanLiteralTypeAnnotation", {
  aliases: ["Flow"]
});

_index2["default"]("ClassImplements", {
  visitor: ["id", "typeParameters"],
  aliases: ["Flow"]
});

_index2["default"]("ClassProperty", {
  visitor: ["key", "value", "typeAnnotation", "decorators"],
  aliases: ["Flow"]
});

_index2["default"]("DeclareClass", {
  visitor: ["id", "typeParameters", "extends", "body"],
  aliases: ["Flow", "FlowDeclaration", "Statement", "Declaration"]
});

_index2["default"]("DeclareFunction", {
  visitor: ["id"],
  aliases: ["Flow", "FlowDeclaration", "Statement", "Declaration"]
});

_index2["default"]("DeclareModule", {
  visitor: ["id", "body"],
  aliases: ["Flow", "FlowDeclaration", "Statement", "Declaration"]
});

_index2["default"]("DeclareVariable", {
  visitor: ["id"],
  aliases: ["Flow", "FlowDeclaration", "Statement", "Declaration"]
});

_index2["default"]("FunctionTypeAnnotation", {
  visitor: ["typeParameters", "params", "rest", "returnType"],
  aliases: ["Flow"]
});

_index2["default"]("FunctionTypeParam", {
  visitor: ["name", "typeAnnotation"],
  aliases: ["Flow"]
});

_index2["default"]("GenericTypeAnnotation", {
  visitor: ["id", "typeParameters"],
  aliases: ["Flow"]
});

_index2["default"]("InterfaceExtends", {
  visitor: ["id", "typeParameters"],
  aliases: ["Flow"]
});

_index2["default"]("InterfaceDeclaration", {
  visitor: ["id", "typeParameters", "extends", "body"],
  aliases: ["Flow", "FlowDeclaration", "Statement", "Declaration"]
});

_index2["default"]("IntersectionTypeAnnotation", {
  visitor: ["types"],
  aliases: ["Flow"]
});

_index2["default"]("MixedTypeAnnotation", {
  aliases: ["Flow", "FlowBaseAnnotation"]
});

_index2["default"]("NullableTypeAnnotation", {
  visitor: ["typeAnnotation"],
  aliases: ["Flow"]
});

_index2["default"]("NumberLiteralTypeAnnotation", {
  aliases: ["Flow"]
});

_index2["default"]("NumberTypeAnnotation", {
  aliases: ["Flow", "FlowBaseAnnotation"]
});

_index2["default"]("StringLiteralTypeAnnotation", {
  aliases: ["Flow"]
});

_index2["default"]("StringTypeAnnotation", {
  aliases: ["Flow", "FlowBaseAnnotation"]
});

_index2["default"]("TupleTypeAnnotation", {
  visitor: ["types"],
  aliases: ["Flow"]
});

_index2["default"]("TypeofTypeAnnotation", {
  visitor: ["argument"],
  aliases: ["Flow"]
});

_index2["default"]("TypeAlias", {
  visitor: ["id", "typeParameters", "right"],
  aliases: ["Flow", "FlowDeclaration", "Statement", "Declaration"]
});

_index2["default"]("TypeAnnotation", {
  visitor: ["typeAnnotation"],
  aliases: ["Flow"]
});

_index2["default"]("TypeCastExpression", {
  visitor: ["expression", "typeAnnotation"],
  aliases: ["Flow"]
});

_index2["default"]("TypeParameterDeclaration", {
  visitor: ["params"],
  aliases: ["Flow"]
});

_index2["default"]("TypeParameterInstantiation", {
  visitor: ["params"],
  aliases: ["Flow"]
});

_index2["default"]("ObjectTypeAnnotation", {
  visitor: ["properties", "indexers", "callProperties"],
  aliases: ["Flow"]
});

_index2["default"]("ObjectTypeCallProperty", {
  visitor: ["value"],
  aliases: ["Flow", "UserWhitespacable"]
});

_index2["default"]("ObjectTypeIndexer", {
  visitor: ["id", "key", "value"],
  aliases: ["Flow", "UserWhitespacable"]
});

_index2["default"]("ObjectTypeProperty", {
  visitor: ["key", "value"],
  aliases: ["Flow", "UserWhitespacable"]
});

_index2["default"]("QualifiedTypeIdentifier", {
  visitor: ["id", "qualification"],
  aliases: ["Flow"]
});

_index2["default"]("UnionTypeAnnotation", {
  visitor: ["types"],
  aliases: ["Flow"]
});

_index2["default"]("VoidTypeAnnotation", {
  aliases: ["Flow", "FlowBaseAnnotation"]
});
},{"./index":33}],33:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = defineType;
var VISITOR_KEYS = {};
exports.VISITOR_KEYS = VISITOR_KEYS;
var ALIAS_KEYS = {};
exports.ALIAS_KEYS = ALIAS_KEYS;
var BUILDER_KEYS = {};

exports.BUILDER_KEYS = BUILDER_KEYS;
function builderFromArray(arr) {
  var builder = {};
  var _arr = arr;
  for (var _i = 0; _i < _arr.length; _i++) {
    var key = _arr[_i];builder[key] = null;
  }return builder;
}

function defineType(type) {
  var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  opts.visitor = opts.visitor || [];
  opts.aliases = opts.aliases || [];

  if (!opts.builder) opts.builder = builderFromArray(opts.visitor);
  if (Array.isArray(opts.builder)) opts.builder = builderFromArray(opts.builder);

  VISITOR_KEYS[type] = opts.visitor;
  ALIAS_KEYS[type] = opts.aliases;
  BUILDER_KEYS[type] = opts.builder;
}
},{}],34:[function(require,module,exports){
"use strict";

require("./index");

require("./core");

require("./es2015");

require("./flow");

require("./jsx");

require("./misc");

require("./experimental");
},{"./core":29,"./es2015":30,"./experimental":31,"./flow":32,"./index":33,"./jsx":35,"./misc":36}],35:[function(require,module,exports){
"use strict";

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

_index2["default"]("JSXAttribute", {
  visitor: ["name", "value"],
  aliases: ["JSX", "Immutable"]
});

_index2["default"]("JSXClosingElement", {
  visitor: ["name"],
  aliases: ["JSX", "Immutable"]
});

_index2["default"]("JSXElement", {
  visitor: ["openingElement", "closingElement", "children"],
  aliases: ["JSX", "Immutable", "Expression"]
});

_index2["default"]("JSXEmptyExpression", {
  aliases: ["JSX", "Expression"]
});

_index2["default"]("JSXExpressionContainer", {
  visitor: ["expression"],
  aliases: ["JSX", "Immutable"]
});

_index2["default"]("JSXIdentifier", {
  aliases: ["JSX", "Expression"]
});

_index2["default"]("JSXMemberExpression", {
  visitor: ["object", "property"],
  aliases: ["JSX", "Expression"]
});

_index2["default"]("JSXNamespacedName", {
  visitor: ["namespace", "name"],
  aliases: ["JSX"]
});

_index2["default"]("JSXOpeningElement", {
  visitor: ["name", "attributes"],
  aliases: ["JSX", "Immutable"]
});

_index2["default"]("JSXSpreadAttribute", {
  visitor: ["argument"],
  aliases: ["JSX"]
});
},{"./index":33}],36:[function(require,module,exports){
"use strict";

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

_index2["default"]("Noop", {
  visitor: []
});

_index2["default"]("ParenthesizedExpression", {
  visitor: ["expression"],
  aliases: ["Expression"]
});
},{"./index":33}],37:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.createUnionTypeAnnotation = createUnionTypeAnnotation;
exports.removeTypeDuplicates = removeTypeDuplicates;
exports.createTypeAnnotationBasedOnTypeof = createTypeAnnotationBasedOnTypeof;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

var _index = require("./index");

var t = _interopRequireWildcard(_index);

/**
 * Takes an array of `types` and flattens them, removing duplicates and
 * returns a `UnionTypeAnnotation` node containg them.
 */

function createUnionTypeAnnotation(types) {
  var flattened = removeTypeDuplicates(types);

  if (flattened.length === 1) {
    return flattened[0];
  } else {
    return t.unionTypeAnnotation(flattened);
  }
}

/**
 * Dedupe type annotations.
 */

function removeTypeDuplicates(nodes) {
  var generics = {};
  var bases = {};

  // store union type groups to circular references
  var typeGroups = [];

  var types = [];

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (!node) continue;

    // detect duplicates
    if (types.indexOf(node) >= 0) {
      continue;
    }

    // this type matches anything
    if (t.isAnyTypeAnnotation(node)) {
      return [node];
    }

    //
    if (t.isFlowBaseAnnotation(node)) {
      bases[node.type] = node;
      continue;
    }

    //
    if (t.isUnionTypeAnnotation(node)) {
      if (typeGroups.indexOf(node.types) < 0) {
        nodes = nodes.concat(node.types);
        typeGroups.push(node.types);
      }
      continue;
    }

    // find a matching generic type and merge and deduplicate the type parameters
    if (t.isGenericTypeAnnotation(node)) {
      var _name = node.id.name;

      if (generics[_name]) {
        var existing = generics[_name];
        if (existing.typeParameters) {
          if (node.typeParameters) {
            existing.typeParameters.params = removeTypeDuplicates(existing.typeParameters.params.concat(node.typeParameters.params));
          }
        } else {
          existing = node.typeParameters;
        }
      } else {
        generics[_name] = node;
      }

      continue;
    }

    types.push(node);
  }

  // add back in bases
  for (var type in bases) {
    types.push(bases[type]);
  }

  // add back in generics
  for (var _name2 in generics) {
    types.push(generics[_name2]);
  }

  return types;
}

/**
 * Create a type anotation based on typeof expression.
 */

function createTypeAnnotationBasedOnTypeof(type) {
  if (type === "string") {
    return t.stringTypeAnnotation();
  } else if (type === "number") {
    return t.numberTypeAnnotation();
  } else if (type === "undefined") {
    return t.voidTypeAnnotation();
  } else if (type === "boolean") {
    return t.booleanTypeAnnotation();
  } else if (type === "function") {
    return t.genericTypeAnnotation(t.identifier("Function"));
  } else if (type === "object") {
    return t.genericTypeAnnotation(t.identifier("Object"));
  } else if (type === "symbol") {
    return t.genericTypeAnnotation(t.identifier("Symbol"));
  } else {
    throw new Error("Invalid typeof value");
  }
}
},{"./index":38}],38:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.is = is;
exports.isType = isType;
exports.shallowEqual = shallowEqual;
exports.appendToMemberExpression = appendToMemberExpression;
exports.prependToMemberExpression = prependToMemberExpression;
exports.ensureBlock = ensureBlock;
exports.clone = clone;
exports.cloneDeep = cloneDeep;
exports.buildMatchMemberExpression = buildMatchMemberExpression;
exports.removeComments = removeComments;
exports.inheritsComments = inheritsComments;
exports.inheritTrailingComments = inheritTrailingComments;
exports.inheritLeadingComments = inheritLeadingComments;
exports.inheritInnerComments = inheritInnerComments;
exports.inherits = inherits;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _toFastProperties = require("to-fast-properties");

var _toFastProperties2 = _interopRequireDefault(_toFastProperties);

var _lodashArrayCompact = require("lodash/array/compact");

var _lodashArrayCompact2 = _interopRequireDefault(_lodashArrayCompact);

var _lodashObjectAssign = require("lodash/object/assign");

var _lodashObjectAssign2 = _interopRequireDefault(_lodashObjectAssign);

var _lodashCollectionEach = require("lodash/collection/each");

var _lodashCollectionEach2 = _interopRequireDefault(_lodashCollectionEach);

var _lodashArrayUniq = require("lodash/array/uniq");

var _lodashArrayUniq2 = _interopRequireDefault(_lodashArrayUniq);

require("./definitions/init");

var _definitions = require("./definitions");

var t = exports;

/**
 * Registers `is[Type]` and `assert[Type]` generated functions for a given `type`.
 * Pass `skipAliasCheck` to force it to directly compare `node.type` with `type`.
 */

function registerType(type, skipAliasCheck) {
  var is = t["is" + type] = function (node, opts) {
    return t.is(type, node, opts, skipAliasCheck);
  };

  t["assert" + type] = function (node, opts) {
    opts = opts || {};
    if (!is(node, opts)) {
      throw new Error("Expected type " + JSON.stringify(type) + " with option " + JSON.stringify(opts));
    }
  };
}

/**
 * Constants.
 */

var STATEMENT_OR_BLOCK_KEYS = ["consequent", "body", "alternate"];
exports.STATEMENT_OR_BLOCK_KEYS = STATEMENT_OR_BLOCK_KEYS;
var FLATTENABLE_KEYS = ["body", "expressions"];
exports.FLATTENABLE_KEYS = FLATTENABLE_KEYS;
var FOR_INIT_KEYS = ["left", "init"];
exports.FOR_INIT_KEYS = FOR_INIT_KEYS;
var COMMENT_KEYS = ["leadingComments", "trailingComments", "innerComments"];

exports.COMMENT_KEYS = COMMENT_KEYS;
var INHERIT_KEYS = {
  optional: ["typeAnnotation", "typeParameters", "returnType"],
  force: ["_scopeInfo", "_paths", "start", "loc", "end"]
};

exports.INHERIT_KEYS = INHERIT_KEYS;
var BOOLEAN_NUMBER_BINARY_OPERATORS = [">", "<", ">=", "<="];
exports.BOOLEAN_NUMBER_BINARY_OPERATORS = BOOLEAN_NUMBER_BINARY_OPERATORS;
var EQUALITY_BINARY_OPERATORS = ["==", "===", "!=", "!=="];
exports.EQUALITY_BINARY_OPERATORS = EQUALITY_BINARY_OPERATORS;
var COMPARISON_BINARY_OPERATORS = EQUALITY_BINARY_OPERATORS.concat(["in", "instanceof"]);
exports.COMPARISON_BINARY_OPERATORS = COMPARISON_BINARY_OPERATORS;
var BOOLEAN_BINARY_OPERATORS = [].concat(COMPARISON_BINARY_OPERATORS, BOOLEAN_NUMBER_BINARY_OPERATORS);
exports.BOOLEAN_BINARY_OPERATORS = BOOLEAN_BINARY_OPERATORS;
var NUMBER_BINARY_OPERATORS = ["-", "/", "*", "**", "&", "|", ">>", ">>>", "<<", "^"];

exports.NUMBER_BINARY_OPERATORS = NUMBER_BINARY_OPERATORS;
var BOOLEAN_UNARY_OPERATORS = ["delete", "!"];
exports.BOOLEAN_UNARY_OPERATORS = BOOLEAN_UNARY_OPERATORS;
var NUMBER_UNARY_OPERATORS = ["+", "-", "++", "--", "~"];
exports.NUMBER_UNARY_OPERATORS = NUMBER_UNARY_OPERATORS;
var STRING_UNARY_OPERATORS = ["typeof"];

exports.STRING_UNARY_OPERATORS = STRING_UNARY_OPERATORS;
exports.VISITOR_KEYS = _definitions.VISITOR_KEYS;
exports.BUILDER_KEYS = _definitions.BUILDER_KEYS;
exports.ALIAS_KEYS = _definitions.ALIAS_KEYS;

/**
 * Registers `is[Type]` and `assert[Type]` for all types.
 */

_lodashCollectionEach2["default"](t.VISITOR_KEYS, function (keys, type) {
  registerType(type, true);
});

/**
 * Flip `ALIAS_KEYS` for faster access in the reverse direction.
 */

t.FLIPPED_ALIAS_KEYS = {};

_lodashCollectionEach2["default"](t.ALIAS_KEYS, function (aliases, type) {
  _lodashCollectionEach2["default"](aliases, function (alias) {
    var types = t.FLIPPED_ALIAS_KEYS[alias] = t.FLIPPED_ALIAS_KEYS[alias] || [];
    types.push(type);
  });
});

/**
 * Registers `is[Alias]` and `assert[Alias]` functions for all aliases.
 */

_lodashCollectionEach2["default"](t.FLIPPED_ALIAS_KEYS, function (types, type) {
  t[type.toUpperCase() + "_TYPES"] = types;
  registerType(type, false);
});

var TYPES = Object.keys(t.VISITOR_KEYS).concat(Object.keys(t.FLIPPED_ALIAS_KEYS));

exports.TYPES = TYPES;
/**
 * Returns whether `node` is of given `type`.
 *
 * For better performance, use this instead of `is[Type]` when `type` is unknown.
 * Optionally, pass `skipAliasCheck` to directly compare `node.type` with `type`.
 */

// @TODO should `skipAliasCheck` be removed?
/*eslint-disable no-unused-vars */

function is(type, node, opts, skipAliasCheck) {
  if (!node) return false;

  var matches = isType(node.type, type);
  if (!matches) return false;

  if (typeof opts === "undefined") {
    return true;
  } else {
    return t.shallowEqual(node, opts);
  }
}

/*eslint-enable no-unused-vars */

/**
 * Test if a `nodeType` is a `targetType` or if `targetType` is an alias of `nodeType`.
 */

function isType(nodeType, targetType) {
  if (nodeType === targetType) return true;

  var aliases = t.FLIPPED_ALIAS_KEYS[targetType];
  if (aliases) {
    if (aliases[0] === nodeType) return true;

    var _arr = aliases;
    for (var _i = 0; _i < _arr.length; _i++) {
      var alias = _arr[_i];
      if (nodeType === alias) return true;
    }
  }

  return false;
}

/**
 * [Please add a description.]
 */

_lodashCollectionEach2["default"](t.VISITOR_KEYS, function (keys, type) {
  if (t.BUILDER_KEYS[type]) return;

  var defs = {};
  _lodashCollectionEach2["default"](keys, function (key) {
    defs[key] = null;
  });
  t.BUILDER_KEYS[type] = defs;
});

/**
 * [Please add a description.]
 */

_lodashCollectionEach2["default"](t.BUILDER_KEYS, function (keys, type) {
  var builder = function builder() {
    var node = {};
    node.type = type;

    var i = 0;

    for (var key in keys) {
      var arg = arguments[i++];
      if (arg === undefined) arg = keys[key];
      node[key] = arg;
    }

    return node;
  };

  t[type] = builder;
  t[type[0].toLowerCase() + type.slice(1)] = builder;
});

/**
 * Test if an object is shallowly equal.
 */

function shallowEqual(actual, expected) {
  var keys = Object.keys(expected);

  var _arr2 = keys;
  for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
    var key = _arr2[_i2];
    if (actual[key] !== expected[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Append a node to a member expression.
 */

function appendToMemberExpression(member, append, computed) {
  member.object = t.memberExpression(member.object, member.property, member.computed);
  member.property = append;
  member.computed = !!computed;
  return member;
}

/**
 * Prepend a node to a member expression.
 */

function prependToMemberExpression(member, prepend) {
  member.object = t.memberExpression(prepend, member.object);
  return member;
}

/**
 * Ensure the `key` (defaults to "body") of a `node` is a block.
 * Casting it to a block if it is not.
 */

function ensureBlock(node) {
  var key = arguments.length <= 1 || arguments[1] === undefined ? "body" : arguments[1];

  return node[key] = t.toBlock(node[key], node);
}

/**
 * Create a shallow clone of a `node` excluding `_private` properties.
 */

function clone(node) {
  var newNode = {};
  for (var key in node) {
    if (key[0] === "_") continue;
    newNode[key] = node[key];
  }
  return newNode;
}

/**
 * Create a deep clone of a `node` and all of it's child nodes
 * exluding `_private` properties.
 */

function cloneDeep(node) {
  var newNode = {};

  for (var key in node) {
    if (key[0] === "_") continue;

    var val = node[key];

    if (val) {
      if (val.type) {
        val = t.cloneDeep(val);
      } else if (Array.isArray(val)) {
        val = val.map(t.cloneDeep);
      }
    }

    newNode[key] = val;
  }

  return newNode;
}

/**
 * Build a function that when called will return whether or not the
 * input `node` `MemberExpression` matches the input `match`.
 *
 * For example, given the match `React.createClass` it would match the
 * parsed nodes of `React.createClass` and `React["createClass"]`.
 */

function buildMatchMemberExpression(match, allowPartial) {
  var parts = match.split(".");

  return function (member) {
    // not a member expression
    if (!t.isMemberExpression(member)) return false;

    var search = [member];
    var i = 0;

    while (search.length) {
      var node = search.shift();

      if (allowPartial && i === parts.length) {
        return true;
      }

      if (t.isIdentifier(node)) {
        // this part doesn't match
        if (parts[i] !== node.name) return false;
      } else if (t.isLiteral(node)) {
        // this part doesn't match
        if (parts[i] !== node.value) return false;
      } else if (t.isMemberExpression(node)) {
        if (node.computed && !t.isLiteral(node.property)) {
          // we can't deal with this
          return false;
        } else {
          search.push(node.object);
          search.push(node.property);
          continue;
        }
      } else {
        // we can't deal with this
        return false;
      }

      // too many parts
      if (++i > parts.length) {
        return false;
      }
    }

    return true;
  };
}

/**
 * Remove comment properties from a node.
 */

function removeComments(node) {
  var _arr3 = COMMENT_KEYS;

  for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
    var key = _arr3[_i3];
    delete node[key];
  }
  return node;
}

/**
 * Inherit all unique comments from `parent` node to `child` node.
 */

function inheritsComments(child, parent) {
  inheritTrailingComments(child, parent);
  inheritLeadingComments(child, parent);
  inheritInnerComments(child, parent);
  return child;
}

function inheritTrailingComments(child, parent) {
  _inheritComments("trailingComments", child, parent);
}

function inheritLeadingComments(child, parent) {
  _inheritComments("leadingComments", child, parent);
}

function inheritInnerComments(child, parent) {
  _inheritComments("innerComments", child, parent);
}

function _inheritComments(key, child, parent) {
  if (child && parent) {
    child[key] = _lodashArrayUniq2["default"](_lodashArrayCompact2["default"]([].concat(child[key], parent[key])));
  }
}

/**
 * Inherit all contextual properties from `parent` node to `child` node.
 */

function inherits(child, parent) {
  if (!child || !parent) return child;

  var _arr4 = t.INHERIT_KEYS.optional;
  for (var _i4 = 0; _i4 < _arr4.length; _i4++) {
    var key = _arr4[_i4];
    if (child[key] == null) {
      child[key] = parent[key];
    }
  }

  var _arr5 = t.INHERIT_KEYS.force;
  for (var _i5 = 0; _i5 < _arr5.length; _i5++) {
    var key = _arr5[_i5];
    child[key] = parent[key];
  }

  t.inheritsComments(child, parent);

  return child;
}

// Optimize property access.
_toFastProperties2["default"](t);
_toFastProperties2["default"](t.VISITOR_KEYS);

// Export all type checkers from other files.
_lodashObjectAssign2["default"](t, require("./retrievers"));
_lodashObjectAssign2["default"](t, require("./validators"));
_lodashObjectAssign2["default"](t, require("./converters"));
_lodashObjectAssign2["default"](t, require("./flow"));
},{"./converters":28,"./definitions":33,"./definitions/init":34,"./flow":37,"./retrievers":39,"./validators":40,"lodash/array/compact":79,"lodash/array/uniq":82,"lodash/collection/each":84,"lodash/object/assign":163,"to-fast-properties":184}],39:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.getBindingIdentifiers = getBindingIdentifiers;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

var _index = require("./index");

var t = _interopRequireWildcard(_index);

/**
 * Return a list of binding identifiers associated with the input `node`.
 */

function getBindingIdentifiers(node, duplicates) {
  var search = [].concat(node);
  var ids = Object.create(null);

  while (search.length) {
    var id = search.shift();
    if (!id) continue;

    var keys = t.getBindingIdentifiers.keys[id.type];

    if (t.isIdentifier(id)) {
      if (duplicates) {
        var _ids = ids[id.name] = ids[id.name] || [];
        _ids.push(id);
      } else {
        ids[id.name] = id;
      }
    } else if (t.isExportDeclaration(id)) {
      if (t.isDeclaration(node.declaration)) {
        search.push(node.declaration);
      }
    } else if (keys) {
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (id[key]) {
          search = search.concat(id[key]);
        }
      }
    }
  }

  return ids;
}

/**
 * Mapping of types to their identifier keys.
 */

getBindingIdentifiers.keys = {
  DeclareClass: ["id"],
  DeclareFunction: ["id"],
  DeclareModule: ["id"],
  DeclareVariable: ["id"],
  InterfaceDeclaration: ["id"],
  TypeAlias: ["id"],

  ComprehensionExpression: ["blocks"],
  ComprehensionBlock: ["left"],

  CatchClause: ["param"],
  LabeledStatement: ["label"],
  UnaryExpression: ["argument"],
  AssignmentExpression: ["left"],

  ImportSpecifier: ["local"],
  ImportNamespaceSpecifier: ["local"],
  ImportDefaultSpecifier: ["local"],
  ImportDeclaration: ["specifiers"],

  FunctionDeclaration: ["id", "params"],
  FunctionExpression: ["id", "params"],

  ClassDeclaration: ["id"],
  ClassExpression: ["id"],

  RestElement: ["argument"],
  UpdateExpression: ["argument"],

  SpreadProperty: ["argument"],
  Property: ["value"],

  AssignmentPattern: ["left"],
  ArrayPattern: ["elements"],
  ObjectPattern: ["properties"],

  VariableDeclaration: ["declarations"],
  VariableDeclarator: ["id"]
};
},{"./index":38}],40:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.isBinding = isBinding;
exports.isReferenced = isReferenced;
exports.isValidIdentifier = isValidIdentifier;
exports.isLet = isLet;
exports.isBlockScoped = isBlockScoped;
exports.isVar = isVar;
exports.isSpecifierDefault = isSpecifierDefault;
exports.isScope = isScope;
exports.isImmutable = isImmutable;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _retrievers = require("./retrievers");

var _esutils = require("esutils");

var _esutils2 = _interopRequireDefault(_esutils);

var _index = require("./index");

var t = _interopRequireWildcard(_index);

/**
 * Check if the input `node` is a binding identifier.
 */

function isBinding(node, parent) {
  var keys = _retrievers.getBindingIdentifiers.keys[parent.type];
  if (keys) {
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var val = parent[key];
      if (Array.isArray(val)) {
        if (val.indexOf(node) >= 0) return true;
      } else {
        if (val === node) return true;
      }
    }
  }

  return false;
}

/**
 * Check if the input `node` is a reference to a bound variable.
 */

function isReferenced(node, parent) {
  switch (parent.type) {
    // yes: PARENT[NODE]
    // yes: NODE.child
    // no: parent.NODE
    case "MemberExpression":
    case "JSXMemberExpression":
      if (parent.property === node && parent.computed) {
        return true;
      } else if (parent.object === node) {
        return true;
      } else {
        return false;
      }

    // no: new.NODE
    // no: NODE.target
    case "MetaProperty":
      return false;

    // yes: { [NODE]: "" }
    // yes: { NODE }
    // no: { NODE: "" }
    case "Property":
      if (parent.key === node) {
        return parent.computed;
      }

    // no: var NODE = init;
    // yes: var id = NODE;
    case "VariableDeclarator":
      return parent.id !== node;

    // no: function NODE() {}
    // no: function foo(NODE) {}
    case "ArrowFunctionExpression":
    case "FunctionDeclaration":
    case "FunctionExpression":
      var _arr = parent.params;

      for (var _i = 0; _i < _arr.length; _i++) {
        var param = _arr[_i];
        if (param === node) return false;
      }

      return parent.id !== node;

    // no: export { foo as NODE };
    // yes: export { NODE as foo };
    // no: export { NODE as foo } from "foo";
    case "ExportSpecifier":
      if (parent.source) {
        return false;
      } else {
        return parent.local === node;
      }

    // no: <div NODE="foo" />
    case "JSXAttribute":
      return parent.name !== node;

    // no: class { NODE = value; }
    // yes: class { key = NODE; }
    case "ClassProperty":
      return parent.value === node;

    // no: import NODE from "foo";
    // no: import * as NODE from "foo";
    // no: import { NODE as foo } from "foo";
    // no: import { foo as NODE } from "foo";
    // no: import NODE from "bar";
    case "ImportDefaultSpecifier":
    case "ImportNamespaceSpecifier":
    case "ImportSpecifier":
      return false;

    // no: class NODE {}
    case "ClassDeclaration":
    case "ClassExpression":
      return parent.id !== node;

    // yes: class { [NODE](){} }
    case "MethodDefinition":
      return parent.key === node && parent.computed;

    // no: NODE: for (;;) {}
    case "LabeledStatement":
      return false;

    // no: try {} catch (NODE) {}
    case "CatchClause":
      return parent.param !== node;

    // no: function foo(...NODE) {}
    case "RestElement":
      return false;

    // yes: left = NODE;
    // no: NODE = right;
    case "AssignmentExpression":
      return parent.right === node;

    // no: [NODE = foo] = [];
    // yes: [foo = NODE] = [];
    case "AssignmentPattern":
      return parent.right === node;

    // no: [NODE] = [];
    // no: ({ NODE }) = [];
    case "ObjectPattern":
    case "ArrayPattern":
      return false;
  }

  return true;
}

/**
 * Check if the input `name` is a valid identifier name
 * and isn't a reserved word.
 */

function isValidIdentifier(name) {
  if (typeof name !== "string" || _esutils2["default"].keyword.isReservedWordES6(name, true)) {
    return false;
  } else {
    return _esutils2["default"].keyword.isIdentifierNameES6(name);
  }
}

/**
 * Check if the input `node` is a `let` variable declaration.
 */

function isLet(node) {
  return t.isVariableDeclaration(node) && (node.kind !== "var" || node._let);
}

/**
 * Check if the input `node` is block scoped.
 */

function isBlockScoped(node) {
  return t.isFunctionDeclaration(node) || t.isClassDeclaration(node) || t.isLet(node);
}

/**
 * Check if the input `node` is a variable declaration.
 */

function isVar(node) {
  return t.isVariableDeclaration(node, { kind: "var" }) && !node._let;
}

/**
 * Check if the input `specifier` is a `default` import or export.
 */

function isSpecifierDefault(specifier) {
  return t.isImportDefaultSpecifier(specifier) || t.isIdentifier(specifier.imported || specifier.exported, { name: "default" });
}

/**
 * Check if the input `node` is a scope.
 */

function isScope(node, parent) {
  if (t.isBlockStatement(node) && t.isFunction(parent, { body: node })) {
    return false;
  }

  return t.isScopable(node);
}

/**
 * Check if the input `node` is definitely immutable.
 */

function isImmutable(node) {
  if (t.isType(node.type, "Immutable")) return true;

  if (t.isLiteral(node)) {
    if (node.regex) {
      // regexs are mutable
      return false;
    } else {
      // immutable!
      return true;
    }
  } else if (t.isIdentifier(node)) {
    if (node.name === "undefined") {
      // immutable!
      return true;
    } else {
      // no idea...
      return false;
    }
  }

  return false;
}
},{"./index":38,"./retrievers":39,"esutils":73}],41:[function(require,module,exports){
(function (__dirname){
"use strict";

exports.__esModule = true;
exports.canCompile = canCompile;
exports.list = list;
exports.regexify = regexify;
exports.arrayify = arrayify;
exports.booleanify = booleanify;
exports.shouldIgnore = shouldIgnore;
exports.template = template;
exports.parseTemplate = parseTemplate;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _lodashStringEscapeRegExp = require("lodash/string/escapeRegExp");

var _lodashStringEscapeRegExp2 = _interopRequireDefault(_lodashStringEscapeRegExp);

var _lodashStringStartsWith = require("lodash/string/startsWith");

var _lodashStringStartsWith2 = _interopRequireDefault(_lodashStringStartsWith);

var _lodashLangCloneDeep = require("lodash/lang/cloneDeep");

var _lodashLangCloneDeep2 = _interopRequireDefault(_lodashLangCloneDeep);

var _lodashLangIsBoolean = require("lodash/lang/isBoolean");

var _lodashLangIsBoolean2 = _interopRequireDefault(_lodashLangIsBoolean);

var _messages = require("./messages");

var messages = _interopRequireWildcard(_messages);

var _minimatch = require("minimatch");

var _minimatch2 = _interopRequireDefault(_minimatch);

var _lodashCollectionContains = require("lodash/collection/contains");

var _lodashCollectionContains2 = _interopRequireDefault(_lodashCollectionContains);

var _traversal = require("./traversal");

var _traversal2 = _interopRequireDefault(_traversal);

var _lodashLangIsString = require("lodash/lang/isString");

var _lodashLangIsString2 = _interopRequireDefault(_lodashLangIsString);

var _lodashLangIsRegExp = require("lodash/lang/isRegExp");

var _lodashLangIsRegExp2 = _interopRequireDefault(_lodashLangIsRegExp);

var _lodashLangIsEmpty = require("lodash/lang/isEmpty");

var _lodashLangIsEmpty2 = _interopRequireDefault(_lodashLangIsEmpty);

var _helpersParse = require("./helpers/parse");

var _helpersParse2 = _interopRequireDefault(_helpersParse);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _lodashObjectHas = require("lodash/object/has");

var _lodashObjectHas2 = _interopRequireDefault(_lodashObjectHas);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _types = require("./types");

var t = _interopRequireWildcard(_types);

var _slash = require("slash");

var _slash2 = _interopRequireDefault(_slash);

var _pathExists = require("path-exists");

var _pathExists2 = _interopRequireDefault(_pathExists);

var _util = require("util");

exports.inherits = _util.inherits;
exports.inspect = _util.inspect;

/**
 * Test if a filename ends with a compilable extension.
 */

function canCompile(filename, altExts) {
  var exts = altExts || canCompile.EXTENSIONS;
  var ext = _path2["default"].extname(filename);
  return _lodashCollectionContains2["default"](exts, ext);
}

/**
 * Default set of compilable extensions.
 */

canCompile.EXTENSIONS = [".js", ".jsx", ".es6", ".es"];

/**
 * Create an array from any value, splitting strings by ",".
 */

function list(val) {
  if (!val) {
    return [];
  } else if (Array.isArray(val)) {
    return val;
  } else if (typeof val === "string") {
    return val.split(",");
  } else {
    return [val];
  }
}

/**
 * Create a RegExp from a string, array, or regexp.
 */

function regexify(val) {
  if (!val) return new RegExp(/.^/);

  if (Array.isArray(val)) val = new RegExp(val.map(_lodashStringEscapeRegExp2["default"]).join("|"), "i");

  if (_lodashLangIsString2["default"](val)) {
    // normalise path separators
    val = _slash2["default"](val);

    // remove starting wildcards or relative separator if present
    if (_lodashStringStartsWith2["default"](val, "./") || _lodashStringStartsWith2["default"](val, "*/")) val = val.slice(2);
    if (_lodashStringStartsWith2["default"](val, "**/")) val = val.slice(3);

    var regex = _minimatch2["default"].makeRe(val, { nocase: true });
    return new RegExp(regex.source.slice(1, -1), "i");
  }

  if (_lodashLangIsRegExp2["default"](val)) return val;

  throw new TypeError("illegal type for regexify");
}

/**
 * Create an array from a boolean, string, or array, mapped by and optional function.
 */

function arrayify(val, mapFn) {
  if (!val) return [];
  if (_lodashLangIsBoolean2["default"](val)) return arrayify([val], mapFn);
  if (_lodashLangIsString2["default"](val)) return arrayify(list(val), mapFn);

  if (Array.isArray(val)) {
    if (mapFn) val = val.map(mapFn);
    return val;
  }

  return [val];
}

/**
 * Makes boolean-like strings into booleans.
 */

function booleanify(val) {
  if (val === "true") return true;
  if (val === "false") return false;
  return val;
}

/**
 * Tests if a filename should be ignored based on "ignore" and "only" options.
 */

function shouldIgnore(filename, ignore, only) {
  filename = _slash2["default"](filename);

  if (only) {
    var _arr = only;

    for (var _i = 0; _i < _arr.length; _i++) {
      var pattern = _arr[_i];
      if (_shouldIgnore(pattern, filename)) return false;
    }
    return true;
  } else if (ignore.length) {
    var _arr2 = ignore;

    for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
      var pattern = _arr2[_i2];
      if (_shouldIgnore(pattern, filename)) return true;
    }
  }

  return false;
}

/**
 * Returns result of calling function with filename if pattern is a function.
 * Otherwise returns result of matching pattern Regex with filename.
 */

function _shouldIgnore(pattern, filename) {
  if (typeof pattern === "function") {
    return pattern(filename);
  } else {
    return pattern.test(filename);
  }
}

/**
 * A visitor for Babel templates, replaces placeholder references.
 */

var templateVisitor = {

  /**
   * 360 NoScope PWNd
   */
  noScope: true,

  enter: function enter(node, parent, scope, nodes) {
    if (t.isExpressionStatement(node)) {
      node = node.expression;
    }

    if (t.isIdentifier(node) && _lodashObjectHas2["default"](nodes, node.name)) {
      this.skip();
      this.replaceInline(nodes[node.name]);
    }
  },

  exit: function exit(node) {
    _traversal2["default"].clearNode(node);
  }
};

/**
 * Create an instance of a template to use in a transformer.
 */

function template(name, nodes, keepExpression) {
  var ast = exports.templates[name];
  if (!ast) throw new ReferenceError("unknown template " + name);

  if (nodes === true) {
    keepExpression = true;
    nodes = null;
  }

  ast = _lodashLangCloneDeep2["default"](ast);

  if (!_lodashLangIsEmpty2["default"](nodes)) {
    _traversal2["default"](ast, templateVisitor, null, nodes);
  }

  if (ast.body.length > 1) return ast.body;

  var node = ast.body[0];

  if (!keepExpression && t.isExpressionStatement(node)) {
    return node.expression;
  } else {
    return node;
  }
}

/**
 * Parse a template.
 */

function parseTemplate(loc, code) {
  var ast = _helpersParse2["default"](code, { filename: loc, looseModules: true }).program;
  ast = _traversal2["default"].removeProperties(ast);
  return ast;
}

/**
 * Load templates from transformation/templates directory.
 */

function loadTemplates() {
  var templates = {};

  var templatesLoc = _path2["default"].join(__dirname, "transformation/templates");
  if (!_pathExists2["default"].sync(templatesLoc)) {
    throw new ReferenceError(messages.get("missingTemplatesDirectory"));
  }

  var _arr3 = _fs2["default"].readdirSync(templatesLoc);

  for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
    var name = _arr3[_i3];
    if (name[0] === ".") return;

    var key = _path2["default"].basename(name, _path2["default"].extname(name));
    var loc = _path2["default"].join(templatesLoc, name);
    var code = _fs2["default"].readFileSync(loc, "utf8");

    templates[key] = parseTemplate(loc, code);
  }

  return templates;
}

try {
  exports.templates = require("../templates.json");
} catch (err) {
  if (err.code !== "MODULE_NOT_FOUND") throw err;
  exports.templates = loadTemplates();
}
}).call(this,"/node_modules/babel-core/lib")
},{"../templates.json":185,"./helpers/parse":3,"./messages":4,"./traversal":7,"./types":38,"fs":188,"lodash/collection/contains":83,"lodash/lang/cloneDeep":150,"lodash/lang/isBoolean":153,"lodash/lang/isEmpty":154,"lodash/lang/isRegExp":160,"lodash/lang/isString":161,"lodash/object/has":166,"lodash/string/escapeRegExp":171,"lodash/string/startsWith":172,"minimatch":175,"path":190,"path-exists":179,"slash":183,"util":193}],42:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.parse = parse;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _parser = require("./parser");

var _parser2 = _interopRequireDefault(_parser);

require("./parser/util");

require("./parser/statement");

require("./parser/lval");

require("./parser/expression");

require("./parser/node");

require("./parser/location");

require("./parser/comments");

var _tokenizerTypes = require("./tokenizer/types");

require("./tokenizer");

require("./tokenizer/context");

var _pluginsFlow = require("./plugins/flow");

var _pluginsFlow2 = _interopRequireDefault(_pluginsFlow);

var _pluginsJsx = require("./plugins/jsx");

var _pluginsJsx2 = _interopRequireDefault(_pluginsJsx);

_parser.plugins.flow = _pluginsFlow2["default"];
_parser.plugins.jsx = _pluginsJsx2["default"];

function parse(input, options) {
  return new _parser2["default"](options, input).parse();
}

exports.tokTypes = _tokenizerTypes.types;
},{"./parser":46,"./parser/comments":44,"./parser/expression":45,"./parser/location":47,"./parser/lval":48,"./parser/node":49,"./parser/statement":50,"./parser/util":51,"./plugins/flow":52,"./plugins/jsx":53,"./tokenizer":56,"./tokenizer/context":55,"./tokenizer/types":58}],43:[function(require,module,exports){
// A second optional argument can be given to further configure
// the parser process. These options are recognized:

"use strict";

exports.__esModule = true;
exports.getOptions = getOptions;
var defaultOptions = {
  // Source type ("script" or "module") for different semantics
  sourceType: "script",
  // By default, reserved words are not enforced. Disable
  // `allowReserved` to enforce them. When this option has the
  // value "never", reserved words and keywords can also not be
  // used as property names.
  allowReserved: true,
  // When enabled, a return at the top level is not considered an
  // error.
  allowReturnOutsideFunction: false,
  // When enabled, import/export statements are not constrained to
  // appearing at the top of the program.
  allowImportExportEverywhere: false,
  plugins: {},
  // Babel-specific options
  features: {},
  strictMode: null
};

exports.defaultOptions = defaultOptions;
// Interpret and default an options object

function getOptions(opts) {
  var options = {};
  for (var key in defaultOptions) {
    options[key] = opts && key in opts ? opts[key] : defaultOptions[key];
  }
  return options;
}
},{}],44:[function(require,module,exports){
/**
 * Based on the comment attachment algorithm used in espree and estraverse.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright
 *   notice, this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

function last(stack) {
  return stack[stack.length - 1];
}

var pp = _index2["default"].prototype;

pp.addComment = function (comment) {
  this.state.trailingComments.push(comment);
  this.state.leadingComments.push(comment);
};

pp.processComment = function (node) {
  if (node.type === "Program" && node.body.length > 0) return;

  var stack = this.state.commentStack;

  var lastChild, trailingComments, i;

  if (this.state.trailingComments.length > 0) {
    // If the first comment in trailingComments comes after the
    // current node, then we're good - all comments in the array will
    // come after the node and so it's safe to add them as official
    // trailingComments.
    if (this.state.trailingComments[0].start >= node.end) {
      trailingComments = this.state.trailingComments;
      this.state.trailingComments = [];
    } else {
      // Otherwise, if the first comment doesn't come after the
      // current node, that means we have a mix of leading and trailing
      // comments in the array and that leadingComments contains the
      // same items as trailingComments. Reset trailingComments to
      // zero items and we'll handle this by evaluating leadingComments
      // later.
      this.state.trailingComments.length = 0;
    }
  } else {
    var lastInStack = last(stack);
    if (stack.length > 0 && lastInStack.trailingComments && lastInStack.trailingComments[0].start >= node.end) {
      trailingComments = lastInStack.trailingComments;
      lastInStack.trailingComments = null;
    }
  }

  // Eating the stack.
  while (stack.length > 0 && last(stack).start >= node.start) {
    lastChild = stack.pop();
  }

  if (lastChild) {
    if (lastChild.leadingComments) {
      if (lastChild !== node && last(lastChild.leadingComments).end <= node.start) {
        node.leadingComments = lastChild.leadingComments;
        lastChild.leadingComments = null;
      } else {
        // A leading comment for an anonymous class had been stolen by its first MethodDefinition,
        // so this takes back the leading comment.
        // See also: https://github.com/eslint/espree/issues/158
        for (i = lastChild.leadingComments.length - 2; i >= 0; --i) {
          if (lastChild.leadingComments[i].end <= node.start) {
            node.leadingComments = lastChild.leadingComments.splice(0, i + 1);
            break;
          }
        }
      }
    }
  } else if (this.state.leadingComments.length > 0) {
    if (last(this.state.leadingComments).end <= node.start) {
      node.leadingComments = this.state.leadingComments;
      this.state.leadingComments = [];
    } else {
      // https://github.com/eslint/espree/issues/2
      //
      // In special cases, such as return (without a value) and
      // debugger, all comments will end up as leadingComments and
      // will otherwise be eliminated. This step runs when the
      // commentStack is empty and there are comments left
      // in leadingComments.
      //
      // This loop figures out the stopping point between the actual
      // leading and trailing comments by finding the location of the
      // first comment that comes after the given node.
      for (i = 0; i < this.state.leadingComments.length; i++) {
        if (this.state.leadingComments[i].end > node.start) {
          break;
        }
      }

      // Split the array based on the location of the first comment
      // that comes after the node. Keep in mind that this could
      // result in an empty array, and if so, the array must be
      // deleted.
      node.leadingComments = this.state.leadingComments.slice(0, i);
      if (node.leadingComments.length === 0) {
        node.leadingComments = null;
      }

      // Similarly, trailing comments are attached later. The variable
      // must be reset to null if there are no trailing comments.
      trailingComments = this.state.leadingComments.slice(i);
      if (trailingComments.length === 0) {
        trailingComments = null;
      }
    }
  }

  if (trailingComments) {
    if (trailingComments.length && trailingComments[0].start >= node.start && last(trailingComments).end <= node.end) {
      node.innerComments = trailingComments;
    } else {
      node.trailingComments = trailingComments;
    }
  }

  stack.push(node);
};
},{"./index":46}],45:[function(require,module,exports){
// A recursive descent parser operates by defining functions for all
// syntactic elements, and recursively calling those, each function
// advancing the input stream and returning an AST node. Precedence
// of constructs (for example, the fact that `!x[1]` means `!(x[1])`
// instead of `(!x)[1]` is handled by the fact that the parser
// function that parses unary prefix operators is called first, and
// in turn calls the function that parses `[]` subscripts — that
// way, it'll receive the node for `x[1]` already parsed, and wraps
// *that* in the unary operator node.
//
// Acorn uses an [operator precedence parser][opp] to handle binary
// operator precedence, because it is much more compact than using
// the technique outlined above, which uses different, nesting
// functions to specify precedence, for all of the ten binary
// precedence levels that JavaScript defines.
//
// [opp]: http://en.wikipedia.org/wiki/Operator-precedence_parser

"use strict";

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _tokenizerTypes = require("../tokenizer/types");

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

var _utilIdentifier = require("../util/identifier");

var pp = _index2["default"].prototype;

// Check if property name clashes with already added.
// Object/class getters and setters are not allowed to clash —
// either with each other or with an init property — and in
// strict mode, init properties are also not allowed to be repeated.

pp.checkPropClash = function (prop, propHash) {
  if (prop.computed || prop.method || prop.shorthand) return;

  var key = prop.key,
      name = undefined;
  switch (key.type) {
    case "Identifier":
      name = key.name;break;
    case "Literal":
      name = String(key.value);break;
    default:
      return;
  }

  var kind = prop.kind;
  if (name === "__proto__" && kind === "init") {
    if (propHash.proto) this.raise(key.start, "Redefinition of __proto__ property");
    propHash.proto = true;
  }
};

// ### Expression parsing

// These nest, from the most general expression type at the top to
// 'atomic', nondivisible expression types at the bottom. Most of
// the functions will simply let the function (s) below them parse,
// and, *if* the syntactic construct they handle is present, wrap
// the AST node that the inner parser gave them in another node.

// Parse a full expression. The optional arguments are used to
// forbid the `in` operator (in for loops initalization expressions)
// and provide reference for storing '=' operator inside shorthand
// property assignment in contexts where both object expression
// and object pattern might appear (so it's possible to raise
// delayed syntax error at correct position).

pp.parseExpression = function (noIn, refShorthandDefaultPos) {
  var startPos = this.state.start,
      startLoc = this.state.startLoc;
  var expr = this.parseMaybeAssign(noIn, refShorthandDefaultPos);
  if (this.match(_tokenizerTypes.types.comma)) {
    var node = this.startNodeAt(startPos, startLoc);
    node.expressions = [expr];
    while (this.eat(_tokenizerTypes.types.comma)) {
      node.expressions.push(this.parseMaybeAssign(noIn, refShorthandDefaultPos));
    }
    this.toReferencedList(node.expressions);
    return this.finishNode(node, "SequenceExpression");
  }
  return expr;
};

// Parse an assignment expression. This includes applications of
// operators like `+=`.

pp.parseMaybeAssign = function (noIn, refShorthandDefaultPos, afterLeftParse) {
  if (this.match(_tokenizerTypes.types._yield) && this.state.inGenerator) {
    return this.parseYield();
  }

  var failOnShorthandAssign = undefined;
  if (!refShorthandDefaultPos) {
    refShorthandDefaultPos = { start: 0 };
    failOnShorthandAssign = true;
  } else {
    failOnShorthandAssign = false;
  }
  var startPos = this.state.start,
      startLoc = this.state.startLoc;
  if (this.match(_tokenizerTypes.types.parenL) || this.match(_tokenizerTypes.types.name)) {
    this.state.potentialArrowAt = this.state.start;
  }
  var left = this.parseMaybeConditional(noIn, refShorthandDefaultPos);
  if (afterLeftParse) left = afterLeftParse.call(this, left, startPos, startLoc);
  if (this.state.type.isAssign) {
    var node = this.startNodeAt(startPos, startLoc);
    node.operator = this.state.value;
    node.left = this.match(_tokenizerTypes.types.eq) ? this.toAssignable(left) : left;
    refShorthandDefaultPos.start = 0; // reset because shorthand default was used correctly
    this.checkLVal(left);
    if (left.parenthesizedExpression) {
      var errorMsg = undefined;
      if (left.type === "ObjectPattern") {
        errorMsg = "`({a}) = 0` use `({a} = 0)`";
      } else if (left.type === "ArrayPattern") {
        errorMsg = "`([a]) = 0` use `([a] = 0)`";
      }
      if (errorMsg) {
        this.raise(left.start, "You're trying to assign to a parenthesized expression, eg. instead of " + errorMsg);
      }
    }
    this.next();
    node.right = this.parseMaybeAssign(noIn);
    return this.finishNode(node, "AssignmentExpression");
  } else if (failOnShorthandAssign && refShorthandDefaultPos.start) {
    this.unexpected(refShorthandDefaultPos.start);
  }
  return left;
};

// Parse a ternary conditional (`?:`) operator.

pp.parseMaybeConditional = function (noIn, refShorthandDefaultPos) {
  var startPos = this.state.start,
      startLoc = this.state.startLoc;
  var expr = this.parseExprOps(noIn, refShorthandDefaultPos);
  if (refShorthandDefaultPos && refShorthandDefaultPos.start) return expr;
  if (this.eat(_tokenizerTypes.types.question)) {
    var node = this.startNodeAt(startPos, startLoc);
    node.test = expr;
    node.consequent = this.parseMaybeAssign();
    this.expect(_tokenizerTypes.types.colon);
    node.alternate = this.parseMaybeAssign(noIn);
    return this.finishNode(node, "ConditionalExpression");
  }
  return expr;
};

// Start the precedence parser.

pp.parseExprOps = function (noIn, refShorthandDefaultPos) {
  var startPos = this.state.start,
      startLoc = this.state.startLoc;
  var expr = this.parseMaybeUnary(refShorthandDefaultPos);
  if (refShorthandDefaultPos && refShorthandDefaultPos.start) {
    return expr;
  } else {
    return this.parseExprOp(expr, startPos, startLoc, -1, noIn);
  }
};

// Parse binary operators with the operator precedence parsing
// algorithm. `left` is the left-hand side of the operator.
// `minPrec` provides context that allows the function to stop and
// defer further parser to one of its callers when it encounters an
// operator that has a lower precedence than the set it is parsing.

pp.parseExprOp = function (left, leftStartPos, leftStartLoc, minPrec, noIn) {
  var prec = this.state.type.binop;
  if (prec != null && (!noIn || !this.match(_tokenizerTypes.types._in))) {
    if (prec > minPrec) {
      var node = this.startNodeAt(leftStartPos, leftStartLoc);
      node.left = left;
      node.operator = this.state.value;
      var op = this.state.type;
      this.next();
      var startPos = this.state.start,
          startLoc = this.state.startLoc;
      node.right = this.parseExprOp(this.parseMaybeUnary(), startPos, startLoc, op.rightAssociative ? prec - 1 : prec, noIn);
      this.finishNode(node, op === _tokenizerTypes.types.logicalOR || op === _tokenizerTypes.types.logicalAND ? "LogicalExpression" : "BinaryExpression");
      return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, noIn);
    }
  }
  return left;
};

// Parse unary operators, both prefix and postfix.

pp.parseMaybeUnary = function (refShorthandDefaultPos) {
  if (this.state.type.prefix) {
    var node = this.startNode(),
        update = this.match(_tokenizerTypes.types.incDec);
    node.operator = this.state.value;
    node.prefix = true;
    this.next();
    node.argument = this.parseMaybeUnary();
    if (refShorthandDefaultPos && refShorthandDefaultPos.start) this.unexpected(refShorthandDefaultPos.start);
    if (update) {
      this.checkLVal(node.argument);
    } else if (this.strict && node.operator === "delete" && node.argument.type === "Identifier") {
      this.raise(node.start, "Deleting local variable in strict mode");
    }
    return this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
  }

  var startPos = this.state.start,
      startLoc = this.state.startLoc;
  var expr = this.parseExprSubscripts(refShorthandDefaultPos);
  if (refShorthandDefaultPos && refShorthandDefaultPos.start) return expr;
  while (this.state.type.postfix && !this.canInsertSemicolon()) {
    var node = this.startNodeAt(startPos, startLoc);
    node.operator = this.state.value;
    node.prefix = false;
    node.argument = expr;
    this.checkLVal(expr);
    this.next();
    expr = this.finishNode(node, "UpdateExpression");
  }
  return expr;
};

// Parse call, dot, and `[]`-subscript expressions.

pp.parseExprSubscripts = function (refShorthandDefaultPos) {
  var startPos = this.state.start,
      startLoc = this.state.startLoc;
  var expr = this.parseExprAtom(refShorthandDefaultPos);
  if (refShorthandDefaultPos && refShorthandDefaultPos.start) {
    return expr;
  } else {
    return this.parseSubscripts(expr, startPos, startLoc);
  }
};

pp.parseSubscripts = function (base, startPos, startLoc, noCalls) {
  for (;;) {
    if (!noCalls && this.eat(_tokenizerTypes.types.doubleColon)) {
      var node = this.startNodeAt(startPos, startLoc);
      node.object = base;
      node.callee = this.parseNoCallExpr();
      return this.parseSubscripts(this.finishNode(node, "BindExpression"), startPos, startLoc, noCalls);
    } else if (this.eat(_tokenizerTypes.types.dot)) {
      var node = this.startNodeAt(startPos, startLoc);
      node.object = base;
      node.property = this.parseIdent(true);
      node.computed = false;
      base = this.finishNode(node, "MemberExpression");
    } else if (this.eat(_tokenizerTypes.types.bracketL)) {
      var node = this.startNodeAt(startPos, startLoc);
      node.object = base;
      node.property = this.parseExpression();
      node.computed = true;
      this.expect(_tokenizerTypes.types.bracketR);
      base = this.finishNode(node, "MemberExpression");
    } else if (!noCalls && this.match(_tokenizerTypes.types.parenL)) {
      var possibleAsync = base.type === "Identifier" && base.name === "async" && !this.canInsertSemicolon();
      this.next();

      var node = this.startNodeAt(startPos, startLoc);
      node.callee = base;
      node.arguments = this.parseExprList(_tokenizerTypes.types.parenR, this.options.features["es7.trailingFunctionCommas"]);
      base = this.finishNode(node, "CallExpression");

      if (possibleAsync && (this.match(_tokenizerTypes.types.colon) || this.match(_tokenizerTypes.types.arrow))) {
        base = this.parseAsyncArrowFromCallExpression(this.startNodeAt(startPos, startLoc), node);
      } else {
        this.toReferencedList(node.arguments);
      }
    } else if (this.match(_tokenizerTypes.types.backQuote)) {
      var node = this.startNodeAt(startPos, startLoc);
      node.tag = base;
      node.quasi = this.parseTemplate();
      base = this.finishNode(node, "TaggedTemplateExpression");
    } else {
      return base;
    }
  }
};

pp.parseAsyncArrowFromCallExpression = function (node, call) {
  if (!this.options.features["es7.asyncFunctions"]) this.unexpected();
  this.expect(_tokenizerTypes.types.arrow);
  return this.parseArrowExpression(node, call.arguments, true);
};

// Parse a no-call expression (like argument of `new` or `::` operators).

pp.parseNoCallExpr = function () {
  var startPos = this.state.start,
      startLoc = this.state.startLoc;
  return this.parseSubscripts(this.parseExprAtom(), startPos, startLoc, true);
};

// Parse an atomic expression — either a single token that is an
// expression, an expression started by a keyword like `function` or
// `new`, or an expression wrapped in punctuation like `()`, `[]`,
// or `{}`.

pp.parseExprAtom = function (refShorthandDefaultPos) {
  var node = undefined,
      canBeArrow = this.state.potentialArrowAt === this.state.start;
  switch (this.state.type) {
    case _tokenizerTypes.types._super:
      if (!this.state.inFunction) this.raise(this.state.start, "'super' outside of function or class");
    case _tokenizerTypes.types._this:
      var type = this.match(_tokenizerTypes.types._this) ? "ThisExpression" : "Super";
      node = this.startNode();
      this.next();
      return this.finishNode(node, type);

    case _tokenizerTypes.types._yield:
      if (this.state.inGenerator) this.unexpected();

    case _tokenizerTypes.types._do:
      if (this.options.features["es7.doExpressions"]) {
        var _node = this.startNode();
        this.next();
        var oldInFunction = this.state.inFunction;
        var oldLabels = this.state.labels;
        this.state.labels = [];
        this.state.inFunction = false;
        _node.body = this.parseBlock();
        this.state.inFunction = oldInFunction;
        this.state.labels = oldLabels;
        return this.finishNode(_node, "DoExpression");
      }

    case _tokenizerTypes.types.name:
      node = this.startNode();
      var id = this.parseIdent(true);

      if (this.options.features["es7.asyncFunctions"]) {
        if (id.name === "await") {
          if (this.inAsync) return this.parseAwait(node);
        } else if (id.name === "async" && this.match(_tokenizerTypes.types._function) && !this.canInsertSemicolon()) {
          this.next();
          return this.parseFunction(node, false, false, true);
        } else if (canBeArrow && id.name === "async" && this.match(_tokenizerTypes.types.name)) {
          var params = [this.parseIdent()];
          this.expect(_tokenizerTypes.types.arrow);
          // var foo = bar => {};
          return this.parseArrowExpression(node, params, true);
        }
      }

      if (canBeArrow && !this.canInsertSemicolon() && this.eat(_tokenizerTypes.types.arrow)) {
        return this.parseArrowExpression(node, [id]);
      }

      return id;

    case _tokenizerTypes.types.regexp:
      var value = this.state.value;
      node = this.parseLiteral(value.value);
      node.regex = { pattern: value.pattern, flags: value.flags };
      return node;

    case _tokenizerTypes.types.num:case _tokenizerTypes.types.string:
      return this.parseLiteral(this.state.value);

    case _tokenizerTypes.types._null:case _tokenizerTypes.types._true:case _tokenizerTypes.types._false:
      node = this.startNode();
      node.rawValue = node.value = this.match(_tokenizerTypes.types._null) ? null : this.match(_tokenizerTypes.types._true);
      node.raw = this.state.type.keyword;
      this.next();
      return this.finishNode(node, "Literal");

    case _tokenizerTypes.types.parenL:
      return this.parseParenAndDistinguishExpression(null, null, canBeArrow);

    case _tokenizerTypes.types.bracketL:
      node = this.startNode();
      this.next();
      // check whether this is array comprehension or regular array
      if (this.options.features["es7.comprehensions"] && this.match(_tokenizerTypes.types._for)) {
        return this.parseComprehension(node, false);
      }
      node.elements = this.parseExprList(_tokenizerTypes.types.bracketR, true, true, refShorthandDefaultPos);
      this.toReferencedList(node.elements);
      return this.finishNode(node, "ArrayExpression");

    case _tokenizerTypes.types.braceL:
      return this.parseObj(false, refShorthandDefaultPos);

    case _tokenizerTypes.types._function:
      node = this.startNode();
      this.next();
      return this.parseFunction(node, false);

    case _tokenizerTypes.types.at:
      this.parseDecorators();

    case _tokenizerTypes.types._class:
      node = this.startNode();
      this.takeDecorators(node);
      return this.parseClass(node, false);

    case _tokenizerTypes.types._new:
      return this.parseNew();

    case _tokenizerTypes.types.backQuote:
      return this.parseTemplate();

    case _tokenizerTypes.types.doubleColon:
      node = this.startNode();
      this.next();
      node.object = null;
      var callee = node.callee = this.parseNoCallExpr();
      if (callee.type === "MemberExpression") {
        return this.finishNode(node, "BindExpression");
      } else {
        this.raise(callee.start, "Binding should be performed on object property.");
      }

    default:
      this.unexpected();
  }
};

pp.parseLiteral = function (value) {
  var node = this.startNode();
  node.rawValue = node.value = value;
  node.raw = this.input.slice(this.state.start, this.state.end);
  this.next();
  return this.finishNode(node, "Literal");
};

pp.parseParenExpression = function () {
  this.expect(_tokenizerTypes.types.parenL);
  var val = this.parseExpression();
  this.expect(_tokenizerTypes.types.parenR);
  return val;
};

pp.parseParenAndDistinguishExpression = function (startPos, startLoc, canBeArrow, isAsync) {
  startPos = startPos || this.state.start;
  startLoc = startLoc || this.state.startLoc;
  var val = undefined;
  this.next();

  if (this.options.features["es7.comprehensions"] && this.match(_tokenizerTypes.types._for)) {
    return this.parseComprehension(this.startNodeAt(startPos, startLoc), true);
  }

  var innerStartPos = this.state.start,
      innerStartLoc = this.state.startLoc;
  var exprList = [],
      first = true;
  var refShorthandDefaultPos = { start: 0 },
      spreadStart = undefined,
      innerParenStart = undefined,
      optionalCommaStart = undefined;
  while (!this.match(_tokenizerTypes.types.parenR)) {
    if (first) {
      first = false;
    } else {
      this.expect(_tokenizerTypes.types.comma);
      if (this.match(_tokenizerTypes.types.parenR) && this.options.features["es7.trailingFunctionCommas"]) {
        optionalCommaStart = this.state.start;
        break;
      }
    }

    if (this.match(_tokenizerTypes.types.ellipsis)) {
      var spreadNodeStartPos = this.state.start,
          spreadNodeStartLoc = this.state.startLoc;
      spreadStart = this.state.start;
      exprList.push(this.parseParenItem(this.parseRest(), spreadNodeStartLoc, spreadNodeStartPos));
      break;
    } else {
      if (this.match(_tokenizerTypes.types.parenL) && !innerParenStart) {
        innerParenStart = this.state.start;
      }
      exprList.push(this.parseMaybeAssign(false, refShorthandDefaultPos, this.parseParenItem));
    }
  }
  var innerEndPos = this.state.start;
  var innerEndLoc = this.state.startLoc;
  this.expect(_tokenizerTypes.types.parenR);

  if (canBeArrow && !this.canInsertSemicolon() && this.eat(_tokenizerTypes.types.arrow)) {
    if (innerParenStart) this.unexpected(innerParenStart);
    return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList, isAsync);
  }

  if (!exprList.length) {
    if (isAsync) {
      return;
    } else {
      this.unexpected(this.state.lastTokStart);
    }
  }
  if (optionalCommaStart) this.unexpected(optionalCommaStart);
  if (spreadStart) this.unexpected(spreadStart);
  if (refShorthandDefaultPos.start) this.unexpected(refShorthandDefaultPos.start);

  if (exprList.length > 1) {
    val = this.startNodeAt(innerStartPos, innerStartLoc);
    val.expressions = exprList;
    this.toReferencedList(val.expressions);
    this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
  } else {
    val = exprList[0];
  }

  val.parenthesizedExpression = true;
  return val;
};

pp.parseParenItem = function (node) {
  return node;
};

// New's precedence is slightly tricky. It must allow its argument
// to be a `[]` or dot subscript expression, but not a call — at
// least, not without wrapping it in parentheses. Thus, it uses the

pp.parseNew = function () {
  var node = this.startNode();
  var meta = this.parseIdent(true);

  if (this.eat(_tokenizerTypes.types.dot)) {
    node.meta = meta;
    node.property = this.parseIdent(true);

    if (node.property.name !== "target") {
      this.raise(node.property.start, "The only valid meta property for new is new.target");
    }

    return this.finishNode(node, "MetaProperty");
  }

  node.callee = this.parseNoCallExpr();

  if (this.eat(_tokenizerTypes.types.parenL)) {
    node.arguments = this.parseExprList(_tokenizerTypes.types.parenR, this.options.features["es7.trailingFunctionCommas"]);
    this.toReferencedList(node.arguments);
  } else {
    node.arguments = [];
  }

  return this.finishNode(node, "NewExpression");
};

// Parse template expression.

pp.parseTemplateElement = function () {
  var elem = this.startNode();
  elem.value = {
    raw: this.input.slice(this.state.start, this.state.end).replace(/\r\n?/g, "\n"),
    cooked: this.state.value
  };
  this.next();
  elem.tail = this.match(_tokenizerTypes.types.backQuote);
  return this.finishNode(elem, "TemplateElement");
};

pp.parseTemplate = function () {
  var node = this.startNode();
  this.next();
  node.expressions = [];
  var curElt = this.parseTemplateElement();
  node.quasis = [curElt];
  while (!curElt.tail) {
    this.expect(_tokenizerTypes.types.dollarBraceL);
    node.expressions.push(this.parseExpression());
    this.expect(_tokenizerTypes.types.braceR);
    node.quasis.push(curElt = this.parseTemplateElement());
  }
  this.next();
  return this.finishNode(node, "TemplateLiteral");
};

// Parse an object literal or binding pattern.

pp.parseObj = function (isPattern, refShorthandDefaultPos) {
  var node = this.startNode(),
      first = true,
      propHash = Object.create(null);
  node.properties = [];
  var decorators = [];
  this.next();
  while (!this.eat(_tokenizerTypes.types.braceR)) {
    if (first) {
      first = false;
    } else {
      this.expect(_tokenizerTypes.types.comma);
      if (this.eat(_tokenizerTypes.types.braceR)) break;
    }

    while (this.match(_tokenizerTypes.types.at)) {
      decorators.push(this.parseDecorator());
    }

    var prop = this.startNode(),
        isGenerator = false,
        isAsync = false,
        startPos = undefined,
        startLoc = undefined;
    if (decorators.length) {
      prop.decorators = decorators;
      decorators = [];
    }
    if (this.options.features["es7.objectRestSpread"] && this.match(_tokenizerTypes.types.ellipsis)) {
      prop = this.parseSpread();
      prop.type = "SpreadProperty";
      node.properties.push(prop);
      continue;
    }
    prop.method = false;
    prop.shorthand = false;
    if (isPattern || refShorthandDefaultPos) {
      startPos = this.state.start;
      startLoc = this.state.startLoc;
    }
    if (!isPattern) {
      isGenerator = this.eat(_tokenizerTypes.types.star);
    }
    if (!isPattern && this.options.features["es7.asyncFunctions"] && this.isContextual("async")) {
      if (isGenerator) this.unexpected();
      var asyncId = this.parseIdent();
      if (this.match(_tokenizerTypes.types.colon) || this.match(_tokenizerTypes.types.parenL) || this.match(_tokenizerTypes.types.braceR)) {
        prop.key = asyncId;
      } else {
        isAsync = true;
        this.parsePropertyName(prop);
      }
    } else {
      this.parsePropertyName(prop);
    }
    this.parseObjPropValue(prop, startPos, startLoc, isGenerator, isAsync, isPattern, refShorthandDefaultPos);
    this.checkPropClash(prop, propHash);
    node.properties.push(this.finishNode(prop, "Property"));
  }
  if (decorators.length) {
    this.raise(this.state.start, "You have trailing decorators with no property");
  }
  return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression");
};

pp.parseObjPropValue = function (prop, startPos, startLoc, isGenerator, isAsync, isPattern, refShorthandDefaultPos) {
  if (this.eat(_tokenizerTypes.types.colon)) {
    prop.value = isPattern ? this.parseMaybeDefault(this.state.start, this.state.startLoc) : this.parseMaybeAssign(false, refShorthandDefaultPos);
    prop.kind = "init";
  } else if (this.match(_tokenizerTypes.types.parenL)) {
    if (isPattern) this.unexpected();
    prop.kind = "init";
    prop.method = true;
    prop.value = this.parseMethod(isGenerator, isAsync);
  } else if (!prop.computed && prop.key.type === "Identifier" && (prop.key.name === "get" || prop.key.name === "set") && !this.match(_tokenizerTypes.types.comma) && !this.match(_tokenizerTypes.types.braceR)) {
    if (isGenerator || isAsync || isPattern) this.unexpected();
    prop.kind = prop.key.name;
    this.parsePropertyName(prop);
    prop.value = this.parseMethod(false);
    var paramCount = prop.kind === "get" ? 0 : 1;
    if (prop.value.params.length !== paramCount) {
      var start = prop.value.start;
      if (prop.kind === "get") this.raise(start, "getter should have no params");else this.raise(start, "setter should have exactly one param");
    }
  } else if (!prop.computed && prop.key.type === "Identifier") {
    prop.kind = "init";
    if (isPattern) {
      if (this.isKeyword(prop.key.name) || this.strict && (_utilIdentifier.reservedWords.strictBind(prop.key.name) || _utilIdentifier.reservedWords.strict(prop.key.name)) || !this.options.allowReserved && this.isReservedWord(prop.key.name)) this.raise(prop.key.start, "Binding " + prop.key.name);
      prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key.__clone());
    } else if (this.match(_tokenizerTypes.types.eq) && refShorthandDefaultPos) {
      if (!refShorthandDefaultPos.start) refShorthandDefaultPos.start = this.state.start;
      prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key.__clone());
    } else {
      prop.value = prop.key.__clone();
    }
    prop.shorthand = true;
  } else {
    this.unexpected();
  }
};

pp.parsePropertyName = function (prop) {
  if (this.eat(_tokenizerTypes.types.bracketL)) {
    prop.computed = true;
    prop.key = this.parseMaybeAssign();
    this.expect(_tokenizerTypes.types.bracketR);
    return prop.key;
  } else {
    prop.computed = false;
    return prop.key = this.match(_tokenizerTypes.types.num) || this.match(_tokenizerTypes.types.string) ? this.parseExprAtom() : this.parseIdent(true);
  }
};

// Initialize empty function node.

pp.initFunction = function (node, isAsync) {
  node.id = null;
  node.generator = false;
  node.expression = false;
  if (this.options.features["es7.asyncFunctions"]) {
    node.async = !!isAsync;
  }
};

// Parse object or class method.

pp.parseMethod = function (isGenerator, isAsync) {
  var node = this.startNode();
  this.initFunction(node, isAsync);
  this.expect(_tokenizerTypes.types.parenL);
  node.params = this.parseBindingList(_tokenizerTypes.types.parenR, false, this.options.features["es7.trailingFunctionCommas"]);
  node.generator = isGenerator;
  this.parseFunctionBody(node);
  return this.finishNode(node, "FunctionExpression");
};

// Parse arrow function expression with given parameters.

pp.parseArrowExpression = function (node, params, isAsync) {
  this.initFunction(node, isAsync);
  node.params = this.toAssignableList(params, true);
  this.parseFunctionBody(node, true);
  return this.finishNode(node, "ArrowFunctionExpression");
};

// Parse function body and check parameters.

pp.parseFunctionBody = function (node, allowExpression) {
  var isExpression = allowExpression && !this.match(_tokenizerTypes.types.braceL);

  var oldInAsync = this.inAsync;
  this.inAsync = node.async;
  if (isExpression) {
    node.body = this.parseMaybeAssign();
    node.expression = true;
  } else {
    // Start a new scope with regard to labels and the `inFunction`
    // flag (restore them to their old value afterwards).
    var oldInFunc = this.state.inFunction,
        oldInGen = this.state.inGenerator,
        oldLabels = this.state.labels;
    this.state.inFunction = true;this.state.inGenerator = node.generator;this.state.labels = [];
    node.body = this.parseBlock(true);
    node.expression = false;
    this.state.inFunction = oldInFunc;this.state.inGenerator = oldInGen;this.state.labels = oldLabels;
  }
  this.inAsync = oldInAsync;

  // If this is a strict mode function, verify that argument names
  // are not repeated, and it does not try to bind the words `eval`
  // or `arguments`.
  if (this.strict || !isExpression && node.body.body.length && this.isUseStrict(node.body.body[0])) {
    var nameHash = Object.create(null),
        oldStrict = this.strict;
    this.strict = true;
    if (node.id) {
      this.checkLVal(node.id, true);
    }
    var _arr = node.params;
    for (var _i = 0; _i < _arr.length; _i++) {
      var param = _arr[_i];
      this.checkLVal(param, true, nameHash);
    }
    this.strict = oldStrict;
  }
};

// Parses a comma-separated list of expressions, and returns them as
// an array. `close` is the token type that ends the list, and
// `allowEmpty` can be turned on to allow subsequent commas with
// nothing in between them to be parsed as `null` (which is needed
// for array literals).

pp.parseExprList = function (close, allowTrailingComma, allowEmpty, refShorthandDefaultPos) {
  var elts = [],
      first = true;
  while (!this.eat(close)) {
    if (first) {
      first = false;
    } else {
      this.expect(_tokenizerTypes.types.comma);
      if (allowTrailingComma && this.eat(close)) break;
    }

    elts.push(this.parseExprListItem(allowEmpty, refShorthandDefaultPos));
  }
  return elts;
};

pp.parseExprListItem = function (allowEmpty, refShorthandDefaultPos) {
  var elt = undefined;
  if (allowEmpty && this.match(_tokenizerTypes.types.comma)) {
    elt = null;
  } else if (this.match(_tokenizerTypes.types.ellipsis)) {
    elt = this.parseSpread(refShorthandDefaultPos);
  } else {
    elt = this.parseMaybeAssign(false, refShorthandDefaultPos);
  }
  return elt;
};

// Parse the next token as an identifier. If `liberal` is true (used
// when parsing properties), it will also convert keywords into
// identifiers.

pp.parseIdent = function (liberal) {
  var node = this.startNode();
  if (this.match(_tokenizerTypes.types.name)) {
    if (!liberal && (!this.options.allowReserved && this.isReservedWord(this.state.value) || this.strict && _utilIdentifier.reservedWords.strict(this.state.value))) this.raise(this.state.start, "The keyword '" + this.state.value + "' is reserved");
    node.name = this.state.value;
  } else if (liberal && this.state.type.keyword) {
    node.name = this.state.type.keyword;
  } else {
    this.unexpected();
  }
  this.next();
  return this.finishNode(node, "Identifier");
};

// Parses await expression inside async function.

pp.parseAwait = function (node) {
  if (this.eat(_tokenizerTypes.types.semi) || this.canInsertSemicolon()) {
    this.unexpected();
  }
  node.all = this.eat(_tokenizerTypes.types.star);
  node.argument = this.parseMaybeUnary();
  return this.finishNode(node, "AwaitExpression");
};

// Parses yield expression inside generator.

pp.parseYield = function () {
  var node = this.startNode();
  this.next();
  if (this.match(_tokenizerTypes.types.semi) || this.canInsertSemicolon() || !this.match(_tokenizerTypes.types.star) && !this.state.type.startsExpr) {
    node.delegate = false;
    node.argument = null;
  } else {
    node.delegate = this.eat(_tokenizerTypes.types.star);
    node.argument = this.parseMaybeAssign();
  }
  return this.finishNode(node, "YieldExpression");
};

// Parses array and generator comprehensions.

pp.parseComprehension = function (node, isGenerator) {
  node.blocks = [];
  while (this.match(_tokenizerTypes.types._for)) {
    var block = this.startNode();
    this.next();
    this.expect(_tokenizerTypes.types.parenL);
    block.left = this.parseBindingAtom();
    this.checkLVal(block.left, true);
    this.expectContextual("of");
    block.right = this.parseExpression();
    this.expect(_tokenizerTypes.types.parenR);
    node.blocks.push(this.finishNode(block, "ComprehensionBlock"));
  }
  node.filter = this.eat(_tokenizerTypes.types._if) ? this.parseParenExpression() : null;
  node.body = this.parseExpression();
  this.expect(isGenerator ? _tokenizerTypes.types.parenR : _tokenizerTypes.types.bracketR);
  node.generator = isGenerator;
  return this.finishNode(node, "ComprehensionExpression");
};
},{"../tokenizer/types":58,"../util/identifier":59,"./index":46}],46:[function(require,module,exports){
"use strict";

exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// istanbul ignore next

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// istanbul ignore next

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _utilIdentifier = require("../util/identifier");

var _options = require("../options");

var _tokenizer = require("../tokenizer");

var _tokenizer2 = _interopRequireDefault(_tokenizer);

// Registered plugins

var plugins = {};

exports.plugins = plugins;

var Parser = (function (_Tokenizer) {
  _inherits(Parser, _Tokenizer);

  function Parser(options, input) {
    _classCallCheck(this, Parser);

    _Tokenizer.call(this, input);

    this.options = _options.getOptions(options);
    this.isKeyword = _utilIdentifier.isKeyword;
    this.isReservedWord = _utilIdentifier.reservedWords[6];
    this.input = input;
    this.loadPlugins(this.options.plugins);

    // Figure out if it's a module code.
    this.inModule = this.options.sourceType === "module";
    this.strict = this.options.strictMode === false ? false : this.inModule;

    // If enabled, skip leading hashbang line.
    if (this.state.pos === 0 && this.input[0] === "#" && this.input[1] === "!") {
      this.skipLineComment(2);
    }
  }

  Parser.prototype.extend = function extend(name, f) {
    this[name] = f(this[name]);
  };

  Parser.prototype.loadPlugins = function loadPlugins(plugins) {
    for (var _name in plugins) {
      var plugin = exports.plugins[_name];
      if (!plugin) throw new Error("Plugin '" + _name + "' not found");
      plugin(this, plugins[_name]);
    }
  };

  Parser.prototype.parse = function parse() {
    var file = this.startNode();
    var program = this.startNode();
    this.nextToken();
    return this.parseTopLevel(file, program);
  };

  return Parser;
})(_tokenizer2["default"]);

exports["default"] = Parser;
},{"../options":43,"../tokenizer":56,"../util/identifier":59}],47:[function(require,module,exports){
"use strict";

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _utilLocation = require("../util/location");

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

var pp = _index2["default"].prototype;

// This function is used to raise exceptions on parse errors. It
// takes an offset integer (into the current `input`) to indicate
// the location of the error, attaches the position to the end
// of the error message, and then raises a `SyntaxError` with that
// message.

pp.raise = function (pos, message) {
  var loc = _utilLocation.getLineInfo(this.input, pos);
  message += " (" + loc.line + ":" + loc.column + ")";
  var err = new SyntaxError(message);
  err.pos = pos;
  err.loc = loc;
  throw err;
};
},{"../util/location":60,"./index":46}],48:[function(require,module,exports){
"use strict";

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _tokenizerTypes = require("../tokenizer/types");

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

var _utilIdentifier = require("../util/identifier");

var pp = _index2["default"].prototype;

// Convert existing expression atom to assignable pattern
// if possible.

pp.toAssignable = function (node, isBinding) {
  if (node) {
    switch (node.type) {
      case "Identifier":
      case "ObjectPattern":
      case "ArrayPattern":
      case "AssignmentPattern":
        break;

      case "ObjectExpression":
        node.type = "ObjectPattern";
        var _arr = node.properties;
        for (var _i = 0; _i < _arr.length; _i++) {
          var prop = _arr[_i];
          if (prop.type === "SpreadProperty") continue;
          if (prop.kind !== "init") this.raise(prop.key.start, "Object pattern can't contain getter or setter");
          this.toAssignable(prop.value, isBinding);
        }
        break;

      case "ArrayExpression":
        node.type = "ArrayPattern";
        this.toAssignableList(node.elements, isBinding);
        break;

      case "AssignmentExpression":
        if (node.operator === "=") {
          node.type = "AssignmentPattern";
          delete node.operator;
        } else {
          this.raise(node.left.end, "Only '=' operator can be used for specifying default value.");
        }
        break;

      case "MemberExpression":
        if (!isBinding) break;

      default:
        this.raise(node.start, "Assigning to rvalue");
    }
  }
  return node;
};

// Convert list of expression atoms to binding list.

pp.toAssignableList = function (exprList, isBinding) {
  var end = exprList.length;
  if (end) {
    var last = exprList[end - 1];
    if (last && last.type === "RestElement") {
      --end;
    } else if (last && last.type === "SpreadElement") {
      last.type = "RestElement";
      var arg = last.argument;
      this.toAssignable(arg, isBinding);
      if (arg.type !== "Identifier" && arg.type !== "MemberExpression" && arg.type !== "ArrayPattern") {
        this.unexpected(arg.start);
      }
      --end;
    }
  }
  for (var i = 0; i < end; i++) {
    var elt = exprList[i];
    if (elt) this.toAssignable(elt, isBinding);
  }
  return exprList;
};

// Convert list of expression atoms to a list of

pp.toReferencedList = function (exprList) {
  return exprList;
};

// Parses spread element.

pp.parseSpread = function (refShorthandDefaultPos) {
  var node = this.startNode();
  this.next();
  node.argument = this.parseMaybeAssign(refShorthandDefaultPos);
  return this.finishNode(node, "SpreadElement");
};

pp.parseRest = function () {
  var node = this.startNode();
  this.next();
  node.argument = this.match(_tokenizerTypes.types.name) || this.match(_tokenizerTypes.types.bracketL) ? this.parseBindingAtom() : this.unexpected();
  return this.finishNode(node, "RestElement");
};

// Parses lvalue (assignable) atom.

pp.parseBindingAtom = function () {
  switch (this.state.type) {
    case _tokenizerTypes.types.name:
      return this.parseIdent();

    case _tokenizerTypes.types.bracketL:
      var node = this.startNode();
      this.next();
      node.elements = this.parseBindingList(_tokenizerTypes.types.bracketR, true, true);
      return this.finishNode(node, "ArrayPattern");

    case _tokenizerTypes.types.braceL:
      return this.parseObj(true);

    default:
      this.unexpected();
  }
};

pp.parseBindingList = function (close, allowEmpty, allowTrailingComma) {
  var elts = [],
      first = true;
  while (!this.eat(close)) {
    if (first) first = false;else this.expect(_tokenizerTypes.types.comma);
    if (allowEmpty && this.match(_tokenizerTypes.types.comma)) {
      elts.push(null);
    } else if (allowTrailingComma && this.eat(close)) {
      break;
    } else if (this.match(_tokenizerTypes.types.ellipsis)) {
      elts.push(this.parseAssignableListItemTypes(this.parseRest()));
      this.expect(close);
      break;
    } else {
      var left = this.parseMaybeDefault();
      this.parseAssignableListItemTypes(left);
      elts.push(this.parseMaybeDefault(null, null, left));
    }
  }
  return elts;
};

pp.parseAssignableListItemTypes = function (param) {
  return param;
};

// Parses assignment pattern around given atom if possible.

pp.parseMaybeDefault = function (startPos, startLoc, left) {
  startLoc = startLoc || this.state.startLoc;
  startPos = startPos || this.state.start;
  left = left || this.parseBindingAtom();
  if (!this.eat(_tokenizerTypes.types.eq)) return left;

  var node = this.startNodeAt(startPos, startLoc);
  node.left = left;
  node.right = this.parseMaybeAssign();
  return this.finishNode(node, "AssignmentPattern");
};

// Verify that a node is an lval — something that can be assigned
// to.

pp.checkLVal = function (expr, isBinding, checkClashes) {
  switch (expr.type) {
    case "Identifier":
      if (this.strict && (_utilIdentifier.reservedWords.strictBind(expr.name) || _utilIdentifier.reservedWords.strict(expr.name))) this.raise(expr.start, (isBinding ? "Binding " : "Assigning to ") + expr.name + " in strict mode");
      if (checkClashes) {
        if (checkClashes[expr.name]) {
          this.raise(expr.start, "Argument name clash in strict mode");
        } else {
          checkClashes[expr.name] = true;
        }
      }
      break;

    case "MemberExpression":
      if (isBinding) this.raise(expr.start, (isBinding ? "Binding" : "Assigning to") + " member expression");
      break;

    case "ObjectPattern":
      var _arr2 = expr.properties;

      for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
        var prop = _arr2[_i2];
        if (prop.type === "Property") prop = prop.value;
        this.checkLVal(prop, isBinding, checkClashes);
      }
      break;

    case "ArrayPattern":
      var _arr3 = expr.elements;

      for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
        var elem = _arr3[_i3];
        if (elem) this.checkLVal(elem, isBinding, checkClashes);
      }
      break;

    case "AssignmentPattern":
      this.checkLVal(expr.left, isBinding, checkClashes);
      break;

    case "SpreadProperty":
    case "RestElement":
      this.checkLVal(expr.argument, isBinding, checkClashes);
      break;

    default:
      this.raise(expr.start, (isBinding ? "Binding" : "Assigning to") + " rvalue");
  }
};
},{"../tokenizer/types":58,"../util/identifier":59,"./index":46}],49:[function(require,module,exports){
"use strict";

exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// istanbul ignore next

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

var _utilLocation = require("../util/location");

// Start an AST node, attaching a start offset.

var pp = _index2["default"].prototype;

var Node = (function () {
  function Node(parser, pos, loc) {
    _classCallCheck(this, Node);

    this.type = "";
    this.start = pos;
    this.end = 0;
    this.loc = new _utilLocation.SourceLocation(loc);
  }

  Node.prototype.__clone = function __clone() {
    var node2 = new Node();
    for (var key in this) node2[key] = this[key];
    return node2;
  };

  return Node;
})();

exports.Node = Node;

pp.startNode = function () {
  return new Node(this, this.state.start, this.state.startLoc);
};

pp.startNodeAt = function (pos, loc) {
  return new Node(this, pos, loc);
};

function finishNodeAt(node, type, pos, loc) {
  node.type = type;
  node.end = pos;
  node.loc.end = loc;
  this.processComment(node);
  return node;
}

// Finish an AST node, adding `type` and `end` properties.

pp.finishNode = function (node, type) {
  return finishNodeAt.call(this, node, type, this.state.lastTokEnd, this.state.lastTokEndLoc);
};

// Finish node at given position

pp.finishNodeAt = function (node, type, pos, loc) {
  return finishNodeAt.call(this, node, type, pos, loc);
};
},{"../util/location":60,"./index":46}],50:[function(require,module,exports){
"use strict";

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _tokenizerTypes = require("../tokenizer/types");

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

var _utilWhitespace = require("../util/whitespace");

var pp = _index2["default"].prototype;

// ### Statement parsing

// Parse a program. Initializes the parser, reads any number of
// statements, and wraps them in a Program node.  Optionally takes a
// `program` argument.  If present, the statements will be appended
// to its body instead of creating a new node.

pp.parseTopLevel = function (file, program) {
  program.sourceType = this.options.sourceType;
  program.body = [];

  var first = true;
  while (!this.match(_tokenizerTypes.types.eof)) {
    var stmt = this.parseStatement(true, true);
    program.body.push(stmt);
    if (first) {
      if (this.isUseStrict(stmt)) this.setStrict(true);
      first = false;
    }
  }
  this.next();

  file.program = this.finishNode(program, "Program");
  file.comments = this.state.comments;
  file.tokens = this.state.tokens;

  return this.finishNode(file, "File");
};

var loopLabel = { kind: "loop" },
    switchLabel = { kind: "switch" };

// Parse a single statement.
//
// If expecting a statement and finding a slash operator, parse a
// regular expression literal. This is to handle cases like
// `if (foo) /blah/.exec(foo)`, where looking at the previous token
// does not help.

pp.parseStatement = function (declaration, topLevel) {
  if (this.match(_tokenizerTypes.types.at)) {
    this.parseDecorators(true);
  }

  var starttype = this.state.type,
      node = this.startNode();

  // Most types of statements are recognized by the keyword they
  // start with. Many are trivial to parse, some require a bit of
  // complexity.

  switch (starttype) {
    case _tokenizerTypes.types._break:case _tokenizerTypes.types._continue:
      return this.parseBreakContinueStatement(node, starttype.keyword);
    case _tokenizerTypes.types._debugger:
      return this.parseDebuggerStatement(node);
    case _tokenizerTypes.types._do:
      return this.parseDoStatement(node);
    case _tokenizerTypes.types._for:
      return this.parseForStatement(node);
    case _tokenizerTypes.types._function:
      if (!declaration) this.unexpected();
      return this.parseFunctionStatement(node);

    case _tokenizerTypes.types._class:
      if (!declaration) this.unexpected();
      this.takeDecorators(node);
      return this.parseClass(node, true);

    case _tokenizerTypes.types._if:
      return this.parseIfStatement(node);
    case _tokenizerTypes.types._return:
      return this.parseReturnStatement(node);
    case _tokenizerTypes.types._switch:
      return this.parseSwitchStatement(node);
    case _tokenizerTypes.types._throw:
      return this.parseThrowStatement(node);
    case _tokenizerTypes.types._try:
      return this.parseTryStatement(node);
    case _tokenizerTypes.types._let:case _tokenizerTypes.types._const:
      if (!declaration) this.unexpected(); // NOTE: falls through to _var
    case _tokenizerTypes.types._var:
      return this.parseVarStatement(node, starttype);
    case _tokenizerTypes.types._while:
      return this.parseWhileStatement(node);
    case _tokenizerTypes.types._with:
      return this.parseWithStatement(node);
    case _tokenizerTypes.types.braceL:
      return this.parseBlock();
    case _tokenizerTypes.types.semi:
      return this.parseEmptyStatement(node);
    case _tokenizerTypes.types._export:
    case _tokenizerTypes.types._import:
      if (!this.options.allowImportExportEverywhere) {
        if (!topLevel) this.raise(this.state.start, "'import' and 'export' may only appear at the top level");

        if (!this.inModule) this.raise(this.state.start, "'import' and 'export' may appear only with 'sourceType: module'");
      }
      return starttype === _tokenizerTypes.types._import ? this.parseImport(node) : this.parseExport(node);

    case _tokenizerTypes.types.name:
      if (this.options.features["es7.asyncFunctions"] && this.state.value === "async") {
        // peek ahead and see if next token is a function
        var state = this.state.clone();
        this.next();
        if (this.match(_tokenizerTypes.types._function) && !this.canInsertSemicolon()) {
          this.expect(_tokenizerTypes.types._function);
          return this.parseFunction(node, true, false, true);
        } else {
          this.state = state;
        }
      }

    // If the statement does not start with a statement keyword or a
    // brace, it's an ExpressionStatement or LabeledStatement. We
    // simply start parsing an expression, and afterwards, if the
    // next token is a colon and the expression was a simple
    // Identifier node, we switch to interpreting it as a label.
    default:
      var maybeName = this.state.value,
          expr = this.parseExpression();

      if (starttype === _tokenizerTypes.types.name && expr.type === "Identifier" && this.eat(_tokenizerTypes.types.colon)) {
        return this.parseLabeledStatement(node, maybeName, expr);
      } else {
        return this.parseExpressionStatement(node, expr);
      }
  }
};

pp.takeDecorators = function (node) {
  if (this.state.decorators.length) {
    node.decorators = this.state.decorators;
    this.state.decorators = [];
  }
};

pp.parseDecorators = function (allowExport) {
  while (this.match(_tokenizerTypes.types.at)) {
    this.state.decorators.push(this.parseDecorator());
  }

  if (allowExport && this.match(_tokenizerTypes.types._export)) {
    return;
  }

  if (!this.match(_tokenizerTypes.types._class)) {
    this.raise(this.state.start, "Leading decorators must be attached to a class declaration");
  }
};

pp.parseDecorator = function () {
  if (!this.options.features["es7.decorators"]) {
    this.unexpected();
  }
  var node = this.startNode();
  this.next();
  node.expression = this.parseMaybeAssign();
  return this.finishNode(node, "Decorator");
};

pp.parseBreakContinueStatement = function (node, keyword) {
  var isBreak = keyword === "break";
  this.next();

  if (this.eat(_tokenizerTypes.types.semi) || this.canInsertSemicolon()) {
    node.label = null;
  } else if (!this.match(_tokenizerTypes.types.name)) {
    this.unexpected();
  } else {
    node.label = this.parseIdent();
    this.semicolon();
  }

  // Verify that there is an actual destination to break or
  // continue to.
  for (var i = 0; i < this.state.labels.length; ++i) {
    var lab = this.state.labels[i];
    if (node.label == null || lab.name === node.label.name) {
      if (lab.kind != null && (isBreak || lab.kind === "loop")) break;
      if (node.label && isBreak) break;
    }
  }
  if (i === this.state.labels.length) this.raise(node.start, "Unsyntactic " + keyword);
  return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");
};

pp.parseDebuggerStatement = function (node) {
  this.next();
  this.semicolon();
  return this.finishNode(node, "DebuggerStatement");
};

pp.parseDoStatement = function (node) {
  this.next();
  this.state.labels.push(loopLabel);
  node.body = this.parseStatement(false);
  this.state.labels.pop();
  this.expect(_tokenizerTypes.types._while);
  node.test = this.parseParenExpression();
  this.eat(_tokenizerTypes.types.semi);
  return this.finishNode(node, "DoWhileStatement");
};

// Disambiguating between a `for` and a `for`/`in` or `for`/`of`
// loop is non-trivial. Basically, we have to parse the init `var`
// statement or expression, disallowing the `in` operator (see
// the second parameter to `parseExpression`), and then check
// whether the next token is `in` or `of`. When there is no init
// part (semicolon immediately after the opening parenthesis), it
// is a regular `for` loop.

pp.parseForStatement = function (node) {
  this.next();
  this.state.labels.push(loopLabel);
  this.expect(_tokenizerTypes.types.parenL);

  if (this.match(_tokenizerTypes.types.semi)) {
    return this.parseFor(node, null);
  }

  if (this.match(_tokenizerTypes.types._var) || this.match(_tokenizerTypes.types._let) || this.match(_tokenizerTypes.types._const)) {
    var _init = this.startNode(),
        varKind = this.state.type;
    this.next();
    this.parseVar(_init, true, varKind);
    this.finishNode(_init, "VariableDeclaration");
    if ((this.match(_tokenizerTypes.types._in) || this.isContextual("of")) && _init.declarations.length === 1 && !(varKind !== _tokenizerTypes.types._var && _init.declarations[0].init)) return this.parseForIn(node, _init);
    return this.parseFor(node, _init);
  }

  var refShorthandDefaultPos = { start: 0 };
  var init = this.parseExpression(true, refShorthandDefaultPos);
  if (this.match(_tokenizerTypes.types._in) || this.isContextual("of")) {
    this.toAssignable(init);
    this.checkLVal(init);
    return this.parseForIn(node, init);
  } else if (refShorthandDefaultPos.start) {
    this.unexpected(refShorthandDefaultPos.start);
  }
  return this.parseFor(node, init);
};

pp.parseFunctionStatement = function (node) {
  this.next();
  return this.parseFunction(node, true);
};

pp.parseIfStatement = function (node) {
  this.next();
  node.test = this.parseParenExpression();
  node.consequent = this.parseStatement(false);
  node.alternate = this.eat(_tokenizerTypes.types._else) ? this.parseStatement(false) : null;
  return this.finishNode(node, "IfStatement");
};

pp.parseReturnStatement = function (node) {
  if (!this.state.inFunction && !this.options.allowReturnOutsideFunction) {
    this.raise(this.state.start, "'return' outside of function");
  }

  this.next();

  // In `return` (and `break`/`continue`), the keywords with
  // optional arguments, we eagerly look for a semicolon or the
  // possibility to insert one.

  if (this.eat(_tokenizerTypes.types.semi) || this.canInsertSemicolon()) {
    node.argument = null;
  } else {
    node.argument = this.parseExpression();
    this.semicolon();
  }

  return this.finishNode(node, "ReturnStatement");
};

pp.parseSwitchStatement = function (node) {
  this.next();
  node.discriminant = this.parseParenExpression();
  node.cases = [];
  this.expect(_tokenizerTypes.types.braceL);
  this.state.labels.push(switchLabel);

  // Statements under must be grouped (by label) in SwitchCase
  // nodes. `cur` is used to keep the node that we are currently
  // adding statements to.

  for (var cur, sawDefault; !this.match(_tokenizerTypes.types.braceR);) {
    if (this.match(_tokenizerTypes.types._case) || this.match(_tokenizerTypes.types._default)) {
      var isCase = this.match(_tokenizerTypes.types._case);
      if (cur) this.finishNode(cur, "SwitchCase");
      node.cases.push(cur = this.startNode());
      cur.consequent = [];
      this.next();
      if (isCase) {
        cur.test = this.parseExpression();
      } else {
        if (sawDefault) this.raise(this.state.lastTokStart, "Multiple default clauses");
        sawDefault = true;
        cur.test = null;
      }
      this.expect(_tokenizerTypes.types.colon);
    } else {
      if (!cur) this.unexpected();
      cur.consequent.push(this.parseStatement(true));
    }
  }
  if (cur) this.finishNode(cur, "SwitchCase");
  this.next(); // Closing brace
  this.state.labels.pop();
  return this.finishNode(node, "SwitchStatement");
};

pp.parseThrowStatement = function (node) {
  this.next();
  if (_utilWhitespace.lineBreak.test(this.input.slice(this.state.lastTokEnd, this.state.start))) this.raise(this.state.lastTokEnd, "Illegal newline after throw");
  node.argument = this.parseExpression();
  this.semicolon();
  return this.finishNode(node, "ThrowStatement");
};

// Reused empty array added for node fields that are always empty.

var empty = [];

pp.parseTryStatement = function (node) {
  this.next();
  node.block = this.parseBlock();
  node.handler = null;
  if (this.match(_tokenizerTypes.types._catch)) {
    var clause = this.startNode();
    this.next();
    this.expect(_tokenizerTypes.types.parenL);
    clause.param = this.parseBindingAtom();
    this.checkLVal(clause.param, true);
    this.expect(_tokenizerTypes.types.parenR);
    clause.body = this.parseBlock();
    node.handler = this.finishNode(clause, "CatchClause");
  }

  node.guardedHandlers = empty;
  node.finalizer = this.eat(_tokenizerTypes.types._finally) ? this.parseBlock() : null;

  if (!node.handler && !node.finalizer) {
    this.raise(node.start, "Missing catch or finally clause");
  }

  return this.finishNode(node, "TryStatement");
};

pp.parseVarStatement = function (node, kind) {
  this.next();
  this.parseVar(node, false, kind);
  this.semicolon();
  return this.finishNode(node, "VariableDeclaration");
};

pp.parseWhileStatement = function (node) {
  this.next();
  node.test = this.parseParenExpression();
  this.state.labels.push(loopLabel);
  node.body = this.parseStatement(false);
  this.state.labels.pop();
  return this.finishNode(node, "WhileStatement");
};

pp.parseWithStatement = function (node) {
  if (this.strict) this.raise(this.state.start, "'with' in strict mode");
  this.next();
  node.object = this.parseParenExpression();
  node.body = this.parseStatement(false);
  return this.finishNode(node, "WithStatement");
};

pp.parseEmptyStatement = function (node) {
  this.next();
  return this.finishNode(node, "EmptyStatement");
};

pp.parseLabeledStatement = function (node, maybeName, expr) {
  var _arr = this.state.labels;

  for (var _i = 0; _i < _arr.length; _i++) {
    var label = _arr[_i];
    if (label.name === maybeName) {
      this.raise(expr.start, "Label '" + maybeName + "' is already declared");
    }
  }

  var kind = this.state.type.isLoop ? "loop" : this.match(_tokenizerTypes.types._switch) ? "switch" : null;
  for (var i = this.state.labels.length - 1; i >= 0; i--) {
    var label = this.state.labels[i];
    if (label.statementStart === node.start) {
      label.statementStart = this.state.start;
      label.kind = kind;
    } else {
      break;
    }
  }

  this.state.labels.push({ name: maybeName, kind: kind, statementStart: this.state.start });
  node.body = this.parseStatement(true);
  this.state.labels.pop();
  node.label = expr;
  return this.finishNode(node, "LabeledStatement");
};

pp.parseExpressionStatement = function (node, expr) {
  node.expression = expr;
  this.semicolon();
  return this.finishNode(node, "ExpressionStatement");
};

// Parse a semicolon-enclosed block of statements, handling `"use
// strict"` declarations when `allowStrict` is true (used for
// function bodies).

pp.parseBlock = function (allowStrict) {
  var node = this.startNode(),
      first = true,
      oldStrict = undefined;
  node.body = [];
  this.expect(_tokenizerTypes.types.braceL);
  while (!this.eat(_tokenizerTypes.types.braceR)) {
    var stmt = this.parseStatement(true);
    node.body.push(stmt);
    if (first && allowStrict && this.isUseStrict(stmt)) {
      oldStrict = this.strict;
      this.setStrict(this.strict = true);
    }
    first = false;
  }
  if (oldStrict === false) this.setStrict(false);
  return this.finishNode(node, "BlockStatement");
};

// Parse a regular `for` loop. The disambiguation code in
// `parseStatement` will already have parsed the init statement or
// expression.

pp.parseFor = function (node, init) {
  node.init = init;
  this.expect(_tokenizerTypes.types.semi);
  node.test = this.match(_tokenizerTypes.types.semi) ? null : this.parseExpression();
  this.expect(_tokenizerTypes.types.semi);
  node.update = this.match(_tokenizerTypes.types.parenR) ? null : this.parseExpression();
  this.expect(_tokenizerTypes.types.parenR);
  node.body = this.parseStatement(false);
  this.state.labels.pop();
  return this.finishNode(node, "ForStatement");
};

// Parse a `for`/`in` and `for`/`of` loop, which are almost
// same from parser's perspective.

pp.parseForIn = function (node, init) {
  var type = this.match(_tokenizerTypes.types._in) ? "ForInStatement" : "ForOfStatement";
  this.next();
  node.left = init;
  node.right = this.parseExpression();
  this.expect(_tokenizerTypes.types.parenR);
  node.body = this.parseStatement(false);
  this.state.labels.pop();
  return this.finishNode(node, type);
};

// Parse a list of variable declarations.

pp.parseVar = function (node, isFor, kind) {
  node.declarations = [];
  node.kind = kind.keyword;
  for (;;) {
    var decl = this.startNode();
    this.parseVarHead(decl);
    if (this.eat(_tokenizerTypes.types.eq)) {
      decl.init = this.parseMaybeAssign(isFor);
    } else if (kind === _tokenizerTypes.types._const && !(this.match(_tokenizerTypes.types._in) || this.isContextual("of"))) {
      this.unexpected();
    } else if (decl.id.type !== "Identifier" && !(isFor && (this.match(_tokenizerTypes.types._in) || this.isContextual("of")))) {
      this.raise(this.state.lastTokEnd, "Complex binding patterns require an initialization value");
    } else {
      decl.init = null;
    }
    node.declarations.push(this.finishNode(decl, "VariableDeclarator"));
    if (!this.eat(_tokenizerTypes.types.comma)) break;
  }
  return node;
};

pp.parseVarHead = function (decl) {
  decl.id = this.parseBindingAtom();
  this.checkLVal(decl.id, true);
};

// Parse a function declaration or literal (depending on the
// `isStatement` parameter).

pp.parseFunction = function (node, isStatement, allowExpressionBody, isAsync) {
  this.initFunction(node, isAsync);
  node.generator = this.eat(_tokenizerTypes.types.star);

  if (isStatement || this.match(_tokenizerTypes.types.name)) {
    node.id = this.parseIdent();
  }

  this.parseFunctionParams(node);
  this.parseFunctionBody(node, allowExpressionBody);
  return this.finishNode(node, isStatement ? "FunctionDeclaration" : "FunctionExpression");
};

pp.parseFunctionParams = function (node) {
  this.expect(_tokenizerTypes.types.parenL);
  node.params = this.parseBindingList(_tokenizerTypes.types.parenR, false, this.options.features["es7.trailingFunctionCommas"]);
};

// Parse a class declaration or literal (depending on the
// `isStatement` parameter).

pp.parseClass = function (node, isStatement) {
  this.next();
  this.parseClassId(node, isStatement);
  this.parseClassSuper(node);
  var classBody = this.startNode();
  var hadConstructor = false;
  classBody.body = [];
  this.expect(_tokenizerTypes.types.braceL);
  var decorators = [];
  while (!this.eat(_tokenizerTypes.types.braceR)) {
    if (this.eat(_tokenizerTypes.types.semi)) continue;
    if (this.match(_tokenizerTypes.types.at)) {
      decorators.push(this.parseDecorator());
      continue;
    }
    var method = this.startNode();
    if (decorators.length) {
      method.decorators = decorators;
      decorators = [];
    }
    var isMaybeStatic = this.match(_tokenizerTypes.types.name) && this.state.value === "static";
    var isGenerator = this.eat(_tokenizerTypes.types.star),
        isAsync = false;
    this.parsePropertyName(method);
    method["static"] = isMaybeStatic && !this.match(_tokenizerTypes.types.parenL);
    if (method["static"]) {
      if (isGenerator) this.unexpected();
      isGenerator = this.eat(_tokenizerTypes.types.star);
      this.parsePropertyName(method);
    }
    if (!isGenerator && method.key.type === "Identifier" && !method.computed && this.isClassProperty()) {
      classBody.body.push(this.parseClassProperty(method));
      continue;
    }
    if (this.options.features["es7.asyncFunctions"] && !this.match(_tokenizerTypes.types.parenL) && !method.computed && method.key.type === "Identifier" && method.key.name === "async") {
      isAsync = true;
      this.parsePropertyName(method);
    }
    var isGetSet = false;
    method.kind = "method";
    if (!method.computed) {
      var key = method.key;

      if (!isAsync && !isGenerator && key.type === "Identifier" && !this.match(_tokenizerTypes.types.parenL) && (key.name === "get" || key.name === "set")) {
        isGetSet = true;
        method.kind = key.name;
        key = this.parsePropertyName(method);
      }
      if (!method["static"] && (key.type === "Identifier" && key.name === "constructor" || key.type === "Literal" && key.value === "constructor")) {
        if (hadConstructor) this.raise(key.start, "Duplicate constructor in the same class");
        if (isGetSet) this.raise(key.start, "Constructor can't have get/set modifier");
        if (isGenerator) this.raise(key.start, "Constructor can't be a generator");
        if (isAsync) this.raise(key.start, "Constructor can't be an async function");
        method.kind = "constructor";
        hadConstructor = true;
      }
    }
    if (method.kind === "constructor" && method.decorators) {
      this.raise(method.start, "You can't attach decorators to a class constructor");
    }
    this.parseClassMethod(classBody, method, isGenerator, isAsync);
    if (isGetSet) {
      var paramCount = method.kind === "get" ? 0 : 1;
      if (method.value.params.length !== paramCount) {
        var start = method.value.start;
        if (method.kind === "get") {
          this.raise(start, "getter should have no params");
        } else {
          this.raise(start, "setter should have exactly one param");
        }
      }
    }
  }

  if (decorators.length) {
    this.raise(this.state.start, "You have trailing decorators with no method");
  }

  node.body = this.finishNode(classBody, "ClassBody");
  return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression");
};

pp.isClassProperty = function () {
  return this.match(_tokenizerTypes.types.eq) || this.match(_tokenizerTypes.types.semi) || this.canInsertSemicolon();
};

pp.parseClassProperty = function (node) {
  if (this.match(_tokenizerTypes.types.eq)) {
    if (!this.options.features["es7.classProperties"]) this.unexpected();
    this.next();
    node.value = this.parseMaybeAssign();
  } else {
    node.value = null;
  }
  this.semicolon();
  return this.finishNode(node, "ClassProperty");
};

pp.parseClassMethod = function (classBody, method, isGenerator, isAsync) {
  method.value = this.parseMethod(isGenerator, isAsync);
  classBody.body.push(this.finishNode(method, "MethodDefinition"));
};

pp.parseClassId = function (node, isStatement) {
  node.id = this.match(_tokenizerTypes.types.name) ? this.parseIdent() : isStatement ? this.unexpected() : null;
};

pp.parseClassSuper = function (node) {
  node.superClass = this.eat(_tokenizerTypes.types._extends) ? this.parseExprSubscripts() : null;
};

// Parses module export declaration.

pp.parseExport = function (node) {
  this.next();
  // export * from '...'
  if (this.match(_tokenizerTypes.types.star)) {
    var specifier = this.startNode();
    this.next();
    if (this.options.features["es7.exportExtensions"] && this.eatContextual("as")) {
      specifier.exported = this.parseIdent();
      node.specifiers = [this.finishNode(specifier, "ExportNamespaceSpecifier")];
      this.parseExportSpecifiersMaybe(node);
      this.parseExportFrom(node, true);
    } else {
      this.parseExportFrom(node, true);
      return this.finishNode(node, "ExportAllDeclaration");
    }
  } else if (this.options.features["es7.exportExtensions"] && this.isExportDefaultSpecifier()) {
    var specifier = this.startNode();
    specifier.exported = this.parseIdent(true);
    node.specifiers = [this.finishNode(specifier, "ExportDefaultSpecifier")];
    if (this.match(_tokenizerTypes.types.comma) && this.lookahead().type === _tokenizerTypes.types.star) {
      this.expect(_tokenizerTypes.types.comma);
      var _specifier = this.startNode();
      this.expect(_tokenizerTypes.types.star);
      this.expectContextual("as");
      _specifier.exported = this.parseIdent();
      node.specifiers.push(this.finishNode(_specifier, "ExportNamespaceSpecifier"));
    } else {
      this.parseExportSpecifiersMaybe(node);
    }
    this.parseExportFrom(node, true);
  } else if (this.eat(_tokenizerTypes.types._default)) {
    // export default ...
    var possibleDeclaration = this.match(_tokenizerTypes.types._function) || this.match(_tokenizerTypes.types._class);
    var expr = this.parseMaybeAssign();
    var needsSemi = true;
    if (possibleDeclaration) {
      needsSemi = false;
      if (expr.id) {
        expr.type = expr.type === "FunctionExpression" ? "FunctionDeclaration" : "ClassDeclaration";
      }
    }
    node.declaration = expr;
    if (needsSemi) this.semicolon();
    this.checkExport(node);
    return this.finishNode(node, "ExportDefaultDeclaration");
  } else if (this.state.type.keyword || this.shouldParseExportDeclaration()) {
    node.specifiers = [];
    node.source = null;
    node.declaration = this.parseExportDeclaration(node);
  } else {
    // export { x, y as z } [from '...']
    node.declaration = null;
    node.specifiers = this.parseExportSpecifiers();
    this.parseExportFrom(node);
  }
  this.checkExport(node);
  return this.finishNode(node, "ExportNamedDeclaration");
};

pp.parseExportDeclaration = function () {
  return this.parseStatement(true);
};

pp.isExportDefaultSpecifier = function () {
  if (this.match(_tokenizerTypes.types.name)) {
    return this.state.value !== "type" && this.state.value !== "async";
  }

  if (!this.match(_tokenizerTypes.types._default)) {
    return false;
  }

  var lookahead = this.lookahead();
  return lookahead.type === _tokenizerTypes.types.comma || lookahead.type === _tokenizerTypes.types.name && lookahead.value === "from";
};

pp.parseExportSpecifiersMaybe = function (node) {
  if (this.eat(_tokenizerTypes.types.comma)) {
    node.specifiers = node.specifiers.concat(this.parseExportSpecifiers());
  }
};

pp.parseExportFrom = function (node, expect) {
  if (this.eatContextual("from")) {
    node.source = this.match(_tokenizerTypes.types.string) ? this.parseExprAtom() : this.unexpected();
    this.checkExport(node);
  } else {
    if (expect) {
      this.unexpected();
    } else {
      node.source = null;
    }
  }

  this.semicolon();
};

pp.shouldParseExportDeclaration = function () {
  return this.options.features["es7.asyncFunctions"] && this.isContextual("async");
};

pp.checkExport = function (node) {
  if (this.state.decorators.length) {
    var isClass = node.declaration && (node.declaration.type === "ClassDeclaration" || node.declaration.type === "ClassExpression");
    if (!node.declaration || !isClass) {
      this.raise(node.start, "You can only use decorators on an export when exporting a class");
    }
    this.takeDecorators(node.declaration);
  }
};

// Parses a comma-separated list of module exports.

pp.parseExportSpecifiers = function () {
  var nodes = [],
      first = true;
  // export { x, y as z } [from '...']
  this.expect(_tokenizerTypes.types.braceL);

  while (!this.eat(_tokenizerTypes.types.braceR)) {
    if (first) {
      first = false;
    } else {
      this.expect(_tokenizerTypes.types.comma);
      if (this.eat(_tokenizerTypes.types.braceR)) break;
    }

    var node = this.startNode();
    node.local = this.parseIdent(this.match(_tokenizerTypes.types._default));
    node.exported = this.eatContextual("as") ? this.parseIdent(true) : node.local.__clone();
    nodes.push(this.finishNode(node, "ExportSpecifier"));
  }

  return nodes;
};

// Parses import declaration.

pp.parseImport = function (node) {
  this.next();

  // import '...'
  if (this.match(_tokenizerTypes.types.string)) {
    node.specifiers = [];
    node.source = this.parseExprAtom();
  } else {
    node.specifiers = [];
    this.parseImportSpecifiers(node);
    this.expectContextual("from");
    node.source = this.match(_tokenizerTypes.types.string) ? this.parseExprAtom() : this.unexpected();
  }
  this.semicolon();
  return this.finishNode(node, "ImportDeclaration");
};

// Parses a comma-separated list of module imports.

pp.parseImportSpecifiers = function (node) {
  var first = true;
  if (this.match(_tokenizerTypes.types.name)) {
    // import defaultObj, { x, y as z } from '...'
    var startPos = this.state.start,
        startLoc = this.state.startLoc;
    node.specifiers.push(this.parseImportSpecifierDefault(this.parseIdent(), startPos, startLoc));
    if (!this.eat(_tokenizerTypes.types.comma)) return;
  }

  if (this.match(_tokenizerTypes.types.star)) {
    var specifier = this.startNode();
    this.next();
    this.expectContextual("as");
    specifier.local = this.parseIdent();
    this.checkLVal(specifier.local, true);
    node.specifiers.push(this.finishNode(specifier, "ImportNamespaceSpecifier"));
    return;
  }

  this.expect(_tokenizerTypes.types.braceL);
  while (!this.eat(_tokenizerTypes.types.braceR)) {
    if (first) {
      first = false;
    } else {
      this.expect(_tokenizerTypes.types.comma);
      if (this.eat(_tokenizerTypes.types.braceR)) break;
    }

    var specifier = this.startNode();
    specifier.imported = this.parseIdent(true);
    specifier.local = this.eatContextual("as") ? this.parseIdent() : specifier.imported.__clone();
    this.checkLVal(specifier.local, true);
    node.specifiers.push(this.finishNode(specifier, "ImportSpecifier"));
  }
};

pp.parseImportSpecifierDefault = function (id, startPos, startLoc) {
  var node = this.startNodeAt(startPos, startLoc);
  node.local = id;
  this.checkLVal(node.local, true);
  return this.finishNode(node, "ImportDefaultSpecifier");
};
},{"../tokenizer/types":58,"../util/whitespace":61,"./index":46}],51:[function(require,module,exports){
"use strict";

// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _tokenizerTypes = require("../tokenizer/types");

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

var _utilWhitespace = require("../util/whitespace");

var pp = _index2["default"].prototype;

// ## Parser utilities

// Test whether a statement node is the string literal `"use strict"`.

pp.isUseStrict = function (stmt) {
  return stmt.type === "ExpressionStatement" && stmt.expression.type === "Literal" && stmt.expression.raw.slice(1, -1) === "use strict";
};

// TODO

pp.isRelational = function (op) {
  return this.match(_tokenizerTypes.types.relational) && this.state.value === op;
};

// TODO

pp.expectRelational = function (op) {
  if (this.isRelational(op)) {
    this.next();
  } else {
    this.unexpected();
  }
};

// Tests whether parsed token is a contextual keyword.

pp.isContextual = function (name) {
  return this.match(_tokenizerTypes.types.name) && this.state.value === name;
};

// Consumes contextual keyword if possible.

pp.eatContextual = function (name) {
  return this.state.value === name && this.eat(_tokenizerTypes.types.name);
};

// Asserts that following token is given contextual keyword.

pp.expectContextual = function (name) {
  if (!this.eatContextual(name)) this.unexpected();
};

// Test whether a semicolon can be inserted at the current position.

pp.canInsertSemicolon = function () {
  return this.match(_tokenizerTypes.types.eof) || this.match(_tokenizerTypes.types.braceR) || _utilWhitespace.lineBreak.test(this.input.slice(this.state.lastTokEnd, this.state.start));
};

// Consume a semicolon, or, failing that, see if we are allowed to
// pretend that there is a semicolon at this position.

pp.semicolon = function () {
  if (!this.eat(_tokenizerTypes.types.semi) && !this.canInsertSemicolon()) this.unexpected();
};

// Expect a token of a given type. If found, consume it, otherwise,
// raise an unexpected token error.

pp.expect = function (type) {
  return this.eat(type) || this.unexpected();
};

// Raise an unexpected token error.

pp.unexpected = function (pos) {
  this.raise(pos != null ? pos : this.state.start, "Unexpected token");
};
},{"../tokenizer/types":58,"../util/whitespace":61,"./index":46}],52:[function(require,module,exports){
"use strict";

exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _tokenizerTypes = require("../tokenizer/types");

var _parser = require("../parser");

var _parser2 = _interopRequireDefault(_parser);

var pp = _parser2["default"].prototype;

pp.flowParseTypeInitialiser = function (tok) {
  var oldInType = this.state.inType;
  this.state.inType = true;
  this.expect(tok || _tokenizerTypes.types.colon);
  var type = this.flowParseType();
  this.state.inType = oldInType;
  return type;
};

pp.flowParseDeclareClass = function (node) {
  this.next();
  this.flowParseInterfaceish(node, true);
  return this.finishNode(node, "DeclareClass");
};

pp.flowParseDeclareFunction = function (node) {
  this.next();

  var id = node.id = this.parseIdent();

  var typeNode = this.startNode();
  var typeContainer = this.startNode();

  if (this.isRelational("<")) {
    typeNode.typeParameters = this.flowParseTypeParameterDeclaration();
  } else {
    typeNode.typeParameters = null;
  }

  this.expect(_tokenizerTypes.types.parenL);
  var tmp = this.flowParseFunctionTypeParams();
  typeNode.params = tmp.params;
  typeNode.rest = tmp.rest;
  this.expect(_tokenizerTypes.types.parenR);
  typeNode.returnType = this.flowParseTypeInitialiser();

  typeContainer.typeAnnotation = this.finishNode(typeNode, "FunctionTypeAnnotation");
  id.typeAnnotation = this.finishNode(typeContainer, "TypeAnnotation");

  this.finishNode(id, id.type);

  this.semicolon();

  return this.finishNode(node, "DeclareFunction");
};

pp.flowParseDeclare = function (node) {
  if (this.match(_tokenizerTypes.types._class)) {
    return this.flowParseDeclareClass(node);
  } else if (this.match(_tokenizerTypes.types._function)) {
    return this.flowParseDeclareFunction(node);
  } else if (this.match(_tokenizerTypes.types._var)) {
    return this.flowParseDeclareVariable(node);
  } else if (this.isContextual("module")) {
    return this.flowParseDeclareModule(node);
  } else {
    this.unexpected();
  }
};

pp.flowParseDeclareVariable = function (node) {
  this.next();
  node.id = this.flowParseTypeAnnotatableIdentifier();
  this.semicolon();
  return this.finishNode(node, "DeclareVariable");
};

pp.flowParseDeclareModule = function (node) {
  this.next();

  if (this.match(_tokenizerTypes.types.string)) {
    node.id = this.parseExprAtom();
  } else {
    node.id = this.parseIdent();
  }

  var bodyNode = node.body = this.startNode();
  var body = bodyNode.body = [];
  this.expect(_tokenizerTypes.types.braceL);
  while (!this.match(_tokenizerTypes.types.braceR)) {
    var node2 = this.startNode();

    // todo: declare check
    this.next();

    body.push(this.flowParseDeclare(node2));
  }
  this.expect(_tokenizerTypes.types.braceR);

  this.finishNode(bodyNode, "BlockStatement");
  return this.finishNode(node, "DeclareModule");
};

// Interfaces

pp.flowParseInterfaceish = function (node, allowStatic) {
  node.id = this.parseIdent();

  if (this.isRelational("<")) {
    node.typeParameters = this.flowParseTypeParameterDeclaration();
  } else {
    node.typeParameters = null;
  }

  node["extends"] = [];

  if (this.eat(_tokenizerTypes.types._extends)) {
    do {
      node["extends"].push(this.flowParseInterfaceExtends());
    } while (this.eat(_tokenizerTypes.types.comma));
  }

  node.body = this.flowParseObjectType(allowStatic);
};

pp.flowParseInterfaceExtends = function () {
  var node = this.startNode();

  node.id = this.parseIdent();
  if (this.isRelational("<")) {
    node.typeParameters = this.flowParseTypeParameterInstantiation();
  } else {
    node.typeParameters = null;
  }

  return this.finishNode(node, "InterfaceExtends");
};

pp.flowParseInterface = function (node) {
  this.flowParseInterfaceish(node, false);
  return this.finishNode(node, "InterfaceDeclaration");
};

// Type aliases

pp.flowParseTypeAlias = function (node) {
  node.id = this.parseIdent();

  if (this.isRelational("<")) {
    node.typeParameters = this.flowParseTypeParameterDeclaration();
  } else {
    node.typeParameters = null;
  }

  node.right = this.flowParseTypeInitialiser(_tokenizerTypes.types.eq);
  this.semicolon();

  return this.finishNode(node, "TypeAlias");
};

// Type annotations

pp.flowParseTypeParameterDeclaration = function () {
  var node = this.startNode();
  node.params = [];

  this.expectRelational("<");
  while (!this.isRelational(">")) {
    node.params.push(this.flowParseTypeAnnotatableIdentifier());
    if (!this.isRelational(">")) {
      this.expect(_tokenizerTypes.types.comma);
    }
  }
  this.expectRelational(">");

  return this.finishNode(node, "TypeParameterDeclaration");
};

pp.flowParseTypeParameterInstantiation = function () {
  var node = this.startNode(),
      oldInType = this.state.inType;
  node.params = [];

  this.state.inType = true;

  this.expectRelational("<");
  while (!this.isRelational(">")) {
    node.params.push(this.flowParseType());
    if (!this.isRelational(">")) {
      this.expect(_tokenizerTypes.types.comma);
    }
  }
  this.expectRelational(">");

  this.state.inType = oldInType;

  return this.finishNode(node, "TypeParameterInstantiation");
};

pp.flowParseObjectPropertyKey = function () {
  return this.match(_tokenizerTypes.types.num) || this.match(_tokenizerTypes.types.string) ? this.parseExprAtom() : this.parseIdent(true);
};

pp.flowParseObjectTypeIndexer = function (node, isStatic) {
  node["static"] = isStatic;

  this.expect(_tokenizerTypes.types.bracketL);
  node.id = this.flowParseObjectPropertyKey();
  node.key = this.flowParseTypeInitialiser();
  this.expect(_tokenizerTypes.types.bracketR);
  node.value = this.flowParseTypeInitialiser();

  this.flowObjectTypeSemicolon();
  return this.finishNode(node, "ObjectTypeIndexer");
};

pp.flowParseObjectTypeMethodish = function (node) {
  node.params = [];
  node.rest = null;
  node.typeParameters = null;

  if (this.isRelational("<")) {
    node.typeParameters = this.flowParseTypeParameterDeclaration();
  }

  this.expect(_tokenizerTypes.types.parenL);
  while (this.match(_tokenizerTypes.types.name)) {
    node.params.push(this.flowParseFunctionTypeParam());
    if (!this.match(_tokenizerTypes.types.parenR)) {
      this.expect(_tokenizerTypes.types.comma);
    }
  }

  if (this.eat(_tokenizerTypes.types.ellipsis)) {
    node.rest = this.flowParseFunctionTypeParam();
  }
  this.expect(_tokenizerTypes.types.parenR);
  node.returnType = this.flowParseTypeInitialiser();

  return this.finishNode(node, "FunctionTypeAnnotation");
};

pp.flowParseObjectTypeMethod = function (startPos, startLoc, isStatic, key) {
  var node = this.startNodeAt(startPos, startLoc);
  node.value = this.flowParseObjectTypeMethodish(this.startNodeAt(startPos, startLoc));
  node["static"] = isStatic;
  node.key = key;
  node.optional = false;
  this.flowObjectTypeSemicolon();
  return this.finishNode(node, "ObjectTypeProperty");
};

pp.flowParseObjectTypeCallProperty = function (node, isStatic) {
  var valueNode = this.startNode();
  node["static"] = isStatic;
  node.value = this.flowParseObjectTypeMethodish(valueNode);
  this.flowObjectTypeSemicolon();
  return this.finishNode(node, "ObjectTypeCallProperty");
};

pp.flowParseObjectType = function (allowStatic) {
  var nodeStart = this.startNode();
  var node;
  var propertyKey;
  var isStatic;

  nodeStart.callProperties = [];
  nodeStart.properties = [];
  nodeStart.indexers = [];

  this.expect(_tokenizerTypes.types.braceL);

  while (!this.match(_tokenizerTypes.types.braceR)) {
    var optional = false;
    var startPos = this.state.start,
        startLoc = this.state.startLoc;
    node = this.startNode();
    if (allowStatic && this.isContextual("static")) {
      this.next();
      isStatic = true;
    }

    if (this.match(_tokenizerTypes.types.bracketL)) {
      nodeStart.indexers.push(this.flowParseObjectTypeIndexer(node, isStatic));
    } else if (this.match(_tokenizerTypes.types.parenL) || this.isRelational("<")) {
      nodeStart.callProperties.push(this.flowParseObjectTypeCallProperty(node, allowStatic));
    } else {
      if (isStatic && this.match(_tokenizerTypes.types.colon)) {
        propertyKey = this.parseIdent();
      } else {
        propertyKey = this.flowParseObjectPropertyKey();
      }
      if (this.isRelational("<") || this.match(_tokenizerTypes.types.parenL)) {
        // This is a method property
        nodeStart.properties.push(this.flowParseObjectTypeMethod(startPos, startLoc, isStatic, propertyKey));
      } else {
        if (this.eat(_tokenizerTypes.types.question)) {
          optional = true;
        }
        node.key = propertyKey;
        node.value = this.flowParseTypeInitialiser();
        node.optional = optional;
        node["static"] = isStatic;
        this.flowObjectTypeSemicolon();
        nodeStart.properties.push(this.finishNode(node, "ObjectTypeProperty"));
      }
    }
  }

  this.expect(_tokenizerTypes.types.braceR);

  return this.finishNode(nodeStart, "ObjectTypeAnnotation");
};

pp.flowObjectTypeSemicolon = function () {
  if (!this.eat(_tokenizerTypes.types.semi) && !this.eat(_tokenizerTypes.types.comma) && !this.match(_tokenizerTypes.types.braceR)) {
    this.unexpected();
  }
};

pp.flowParseGenericType = function (startPos, startLoc, id) {
  var node = this.startNodeAt(startPos, startLoc);

  node.typeParameters = null;
  node.id = id;

  while (this.eat(_tokenizerTypes.types.dot)) {
    var node2 = this.startNodeAt(startPos, startLoc);
    node2.qualification = node.id;
    node2.id = this.parseIdent();
    node.id = this.finishNode(node2, "QualifiedTypeIdentifier");
  }

  if (this.isRelational("<")) {
    node.typeParameters = this.flowParseTypeParameterInstantiation();
  }

  return this.finishNode(node, "GenericTypeAnnotation");
};

pp.flowParseTypeofType = function () {
  var node = this.startNode();
  this.expect(_tokenizerTypes.types._typeof);
  node.argument = this.flowParsePrimaryType();
  return this.finishNode(node, "TypeofTypeAnnotation");
};

pp.flowParseTupleType = function () {
  var node = this.startNode();
  node.types = [];
  this.expect(_tokenizerTypes.types.bracketL);
  // We allow trailing commas
  while (this.state.pos < this.input.length && !this.match(_tokenizerTypes.types.bracketR)) {
    node.types.push(this.flowParseType());
    if (this.match(_tokenizerTypes.types.bracketR)) break;
    this.expect(_tokenizerTypes.types.comma);
  }
  this.expect(_tokenizerTypes.types.bracketR);
  return this.finishNode(node, "TupleTypeAnnotation");
};

pp.flowParseFunctionTypeParam = function () {
  var optional = false;
  var node = this.startNode();
  node.name = this.parseIdent();
  if (this.eat(_tokenizerTypes.types.question)) {
    optional = true;
  }
  node.optional = optional;
  node.typeAnnotation = this.flowParseTypeInitialiser();
  return this.finishNode(node, "FunctionTypeParam");
};

pp.flowParseFunctionTypeParams = function () {
  var ret = { params: [], rest: null };
  while (this.match(_tokenizerTypes.types.name)) {
    ret.params.push(this.flowParseFunctionTypeParam());
    if (!this.match(_tokenizerTypes.types.parenR)) {
      this.expect(_tokenizerTypes.types.comma);
    }
  }
  if (this.eat(_tokenizerTypes.types.ellipsis)) {
    ret.rest = this.flowParseFunctionTypeParam();
  }
  return ret;
};

pp.flowIdentToTypeAnnotation = function (startPos, startLoc, node, id) {
  switch (id.name) {
    case "any":
      return this.finishNode(node, "AnyTypeAnnotation");

    case "void":
      return this.finishNode(node, "VoidTypeAnnotation");

    case "bool":
    case "boolean":
      return this.finishNode(node, "BooleanTypeAnnotation");

    case "mixed":
      return this.finishNode(node, "MixedTypeAnnotation");

    case "number":
      return this.finishNode(node, "NumberTypeAnnotation");

    case "string":
      return this.finishNode(node, "StringTypeAnnotation");

    default:
      return this.flowParseGenericType(startPos, startLoc, id);
  }
};

// The parsing of types roughly parallels the parsing of expressions, and
// primary types are kind of like primary expressions...they're the
// primitives with which other types are constructed.
pp.flowParsePrimaryType = function () {
  var startPos = this.state.start,
      startLoc = this.state.startLoc;
  var node = this.startNode();
  var tmp;
  var type;
  var isGroupedType = false;

  switch (this.state.type) {
    case _tokenizerTypes.types.name:
      return this.flowIdentToTypeAnnotation(startPos, startLoc, node, this.parseIdent());

    case _tokenizerTypes.types.braceL:
      return this.flowParseObjectType();

    case _tokenizerTypes.types.bracketL:
      return this.flowParseTupleType();

    case _tokenizerTypes.types.relational:
      if (this.state.value === "<") {
        node.typeParameters = this.flowParseTypeParameterDeclaration();
        this.expect(_tokenizerTypes.types.parenL);
        tmp = this.flowParseFunctionTypeParams();
        node.params = tmp.params;
        node.rest = tmp.rest;
        this.expect(_tokenizerTypes.types.parenR);

        this.expect(_tokenizerTypes.types.arrow);

        node.returnType = this.flowParseType();

        return this.finishNode(node, "FunctionTypeAnnotation");
      }

    case _tokenizerTypes.types.parenL:
      this.next();

      // Check to see if this is actually a grouped type
      if (!this.match(_tokenizerTypes.types.parenR) && !this.match(_tokenizerTypes.types.ellipsis)) {
        if (this.match(_tokenizerTypes.types.name)) {
          var token = this.lookahead().type;
          isGroupedType = token !== _tokenizerTypes.types.question && token !== _tokenizerTypes.types.colon;
        } else {
          isGroupedType = true;
        }
      }

      if (isGroupedType) {
        type = this.flowParseType();
        this.expect(_tokenizerTypes.types.parenR);

        // If we see a => next then someone was probably confused about
        // function types, so we can provide a better error message
        if (this.eat(_tokenizerTypes.types.arrow)) {
          this.raise(node, "Unexpected token =>. It looks like " + "you are trying to write a function type, but you ended up " + "writing a grouped type followed by an =>, which is a syntax " + "error. Remember, function type parameters are named so function " + "types look like (name1: type1, name2: type2) => returnType. You " + "probably wrote (type1) => returnType");
        }

        return type;
      }

      tmp = this.flowParseFunctionTypeParams();
      node.params = tmp.params;
      node.rest = tmp.rest;

      this.expect(_tokenizerTypes.types.parenR);

      this.expect(_tokenizerTypes.types.arrow);

      node.returnType = this.flowParseType();
      node.typeParameters = null;

      return this.finishNode(node, "FunctionTypeAnnotation");

    case _tokenizerTypes.types.string:
      node.rawValue = node.value = this.state.value;
      node.raw = this.input.slice(this.state.start, this.state.end);
      this.next();
      return this.finishNode(node, "StringLiteralTypeAnnotation");

    case _tokenizerTypes.types._true:case _tokenizerTypes.types._false:
      node.value = this.match(_tokenizerTypes.types._true);
      this.next();
      return this.finishNode(node, "BooleanLiteralTypeAnnotation");

    case _tokenizerTypes.types.num:
      node.rawValue = node.value = this.state.value;
      node.raw = this.input.slice(this.state.start, this.state.end);
      this.next();
      return this.finishNode(node, "NumberLiteralTypeAnnotation");

    default:
      if (this.state.type.keyword === "typeof") {
        return this.flowParseTypeofType();
      }
  }

  this.unexpected();
};

pp.flowParsePostfixType = function () {
  var node = this.startNode();
  var type = node.elementType = this.flowParsePrimaryType();
  if (this.match(_tokenizerTypes.types.bracketL)) {
    this.expect(_tokenizerTypes.types.bracketL);
    this.expect(_tokenizerTypes.types.bracketR);
    return this.finishNode(node, "ArrayTypeAnnotation");
  } else {
    return type;
  }
};

pp.flowParsePrefixType = function () {
  var node = this.startNode();
  if (this.eat(_tokenizerTypes.types.question)) {
    node.typeAnnotation = this.flowParsePrefixType();
    return this.finishNode(node, "NullableTypeAnnotation");
  } else {
    return this.flowParsePostfixType();
  }
};

pp.flowParseIntersectionType = function () {
  var node = this.startNode();
  var type = this.flowParsePrefixType();
  node.types = [type];
  while (this.eat(_tokenizerTypes.types.bitwiseAND)) {
    node.types.push(this.flowParsePrefixType());
  }
  return node.types.length === 1 ? type : this.finishNode(node, "IntersectionTypeAnnotation");
};

pp.flowParseUnionType = function () {
  var node = this.startNode();
  var type = this.flowParseIntersectionType();
  node.types = [type];
  while (this.eat(_tokenizerTypes.types.bitwiseOR)) {
    node.types.push(this.flowParseIntersectionType());
  }
  return node.types.length === 1 ? type : this.finishNode(node, "UnionTypeAnnotation");
};

pp.flowParseType = function () {
  var oldInType = this.state.inType;
  this.state.inType = true;
  var type = this.flowParseUnionType();
  this.state.inType = oldInType;
  return type;
};

pp.flowParseTypeAnnotation = function () {
  var node = this.startNode();
  node.typeAnnotation = this.flowParseTypeInitialiser();
  return this.finishNode(node, "TypeAnnotation");
};

pp.flowParseTypeAnnotatableIdentifier = function (requireTypeAnnotation, canBeOptionalParam) {
  var ident = this.parseIdent();
  var isOptionalParam = false;

  if (canBeOptionalParam && this.eat(_tokenizerTypes.types.question)) {
    this.expect(_tokenizerTypes.types.question);
    isOptionalParam = true;
  }

  if (requireTypeAnnotation || this.match(_tokenizerTypes.types.colon)) {
    ident.typeAnnotation = this.flowParseTypeAnnotation();
    this.finishNode(ident, ident.type);
  }

  if (isOptionalParam) {
    ident.optional = true;
    this.finishNode(ident, ident.type);
  }

  return ident;
};

exports["default"] = function (instance) {
  // function name(): string {}
  instance.extend("parseFunctionBody", function (inner) {
    return function (node, allowExpression) {
      if (this.match(_tokenizerTypes.types.colon) && !allowExpression) {
        // if allowExpression is true then we're parsing an arrow function and if
        // there's a return type then it's been handled elsewhere
        node.returnType = this.flowParseTypeAnnotation();
      }

      return inner.call(this, node, allowExpression);
    };
  });

  instance.extend("parseStatement", function (inner) {
    return function (declaration, topLevel) {
      // strict mode handling of `interface` since it's a reserved word
      if (this.strict && this.match(_tokenizerTypes.types.name) && this.state.value === "interface") {
        var node = this.startNode();
        this.next();
        return this.flowParseInterface(node);
      } else {
        return inner.call(this, declaration, topLevel);
      }
    };
  });

  instance.extend("parseExpressionStatement", function (inner) {
    return function (node, expr) {
      if (expr.type === "Identifier") {
        if (expr.name === "declare") {
          if (this.match(_tokenizerTypes.types._class) || this.match(_tokenizerTypes.types.name) || this.match(_tokenizerTypes.types._function) || this.match(_tokenizerTypes.types._var)) {
            return this.flowParseDeclare(node);
          }
        } else if (this.match(_tokenizerTypes.types.name)) {
          if (expr.name === "interface") {
            return this.flowParseInterface(node);
          } else if (expr.name === "type") {
            return this.flowParseTypeAlias(node);
          }
        }
      }

      return inner.call(this, node, expr);
    };
  });

  instance.extend("shouldParseExportDeclaration", function (inner) {
    return function () {
      return this.isContextual("type") || inner.call(this);
    };
  });

  instance.extend("parseParenItem", function () {
    return function (node, startLoc, startPos, forceArrow) {
      if (this.match(_tokenizerTypes.types.colon)) {
        var typeCastNode = this.startNodeAt(startLoc, startPos);
        typeCastNode.expression = node;
        typeCastNode.typeAnnotation = this.flowParseTypeAnnotation();

        if (forceArrow && !this.match(_tokenizerTypes.types.arrow)) {
          this.unexpected();
        }

        if (this.eat(_tokenizerTypes.types.arrow)) {
          // ((lol): number => {});
          var func = this.parseArrowExpression(this.startNodeAt(startLoc, startPos), [node]);
          func.returnType = typeCastNode.typeAnnotation;
          return func;
        } else {
          return this.finishNode(typeCastNode, "TypeCastExpression");
        }
      } else {
        return node;
      }
    };
  });

  instance.extend("parseExport", function (inner) {
    return function (node) {
      node = inner.call(this, node);
      if (node.type === "ExportNamedDeclaration") {
        node.exportKind = node.exportKind || "value";
      }
      return node;
    };
  });

  instance.extend("parseExportDeclaration", function (inner) {
    return function (node) {
      if (this.isContextual("type")) {
        node.exportKind = "type";

        var declarationNode = this.startNode();
        this.next();

        if (this.match(_tokenizerTypes.types.braceL)) {
          // export type { foo, bar };
          node.specifiers = this.parseExportSpecifiers();
          this.parseExportFrom(node);
          return null;
        } else {
          // export type Foo = Bar;
          return this.flowParseTypeAlias(declarationNode);
        }
      } else {
        return inner.call(this, node);
      }
    };
  });

  instance.extend("parseClassId", function (inner) {
    return function (node, isStatement) {
      inner.call(this, node, isStatement);
      if (this.isRelational("<")) {
        node.typeParameters = this.flowParseTypeParameterDeclaration();
      }
    };
  });

  // don't consider `void` to be a keyword as then it'll use the void token type
  // and set startExpr
  instance.extend("isKeyword", function (inner) {
    return function (name) {
      if (this.state.inType && name === "void") {
        return false;
      } else {
        return inner.call(this, name);
      }
    };
  });

  instance.extend("readToken", function (inner) {
    return function (code) {
      if (this.state.inType && (code === 62 || code === 60)) {
        return this.finishOp(_tokenizerTypes.types.relational, 1);
      } else {
        return inner.call(this, code);
      }
    };
  });

  instance.extend("jsx_readToken", function (inner) {
    return function () {
      if (!this.state.inType) return inner.call(this);
    };
  });

  function typeCastToParameter(node) {
    node.expression.typeAnnotation = node.typeAnnotation;
    return node.expression;
  }

  instance.extend("toAssignableList", function (inner) {
    return function (exprList, isBinding) {
      for (var i = 0; i < exprList.length; i++) {
        var expr = exprList[i];
        if (expr && expr.type === "TypeCastExpression") {
          exprList[i] = typeCastToParameter(expr);
        }
      }
      return inner.call(this, exprList, isBinding);
    };
  });

  instance.extend("toReferencedList", function () {
    return function (exprList) {
      for (var i = 0; i < exprList.length; i++) {
        var expr = exprList[i];
        if (expr && expr._exprListItem && expr.type === "TypeCastExpression") {
          this.raise(expr.start, "Unexpected type cast");
        }
      }

      return exprList;
    };
  });

  instance.extend("parseExprListItem", function (inner) {
    return function (allowEmpty, refShorthandDefaultPos) {
      var container = this.startNode();
      var node = inner.call(this, allowEmpty, refShorthandDefaultPos);
      if (this.match(_tokenizerTypes.types.colon)) {
        container._exprListItem = true;
        container.expression = node;
        container.typeAnnotation = this.flowParseTypeAnnotation();
        return this.finishNode(container, "TypeCastExpression");
      } else {
        return node;
      }
    };
  });

  instance.extend("parseClassProperty", function (inner) {
    return function (node) {
      if (this.match(_tokenizerTypes.types.colon)) {
        node.typeAnnotation = this.flowParseTypeAnnotation();
      }
      return inner.call(this, node);
    };
  });

  instance.extend("isClassProperty", function (inner) {
    return function () {
      return this.match(_tokenizerTypes.types.colon) || inner.call(this);
    };
  });

  instance.extend("parseClassMethod", function () {
    return function (classBody, method, isGenerator, isAsync) {
      var typeParameters;
      if (this.isRelational("<")) {
        typeParameters = this.flowParseTypeParameterDeclaration();
      }
      method.value = this.parseMethod(isGenerator, isAsync);
      method.value.typeParameters = typeParameters;
      classBody.body.push(this.finishNode(method, "MethodDefinition"));
    };
  });

  instance.extend("parseClassSuper", function (inner) {
    return function (node, isStatement) {
      inner.call(this, node, isStatement);
      if (node.superClass && this.isRelational("<")) {
        node.superTypeParameters = this.flowParseTypeParameterInstantiation();
      }
      if (this.isContextual("implements")) {
        this.next();
        var implemented = node["implements"] = [];
        do {
          var _node = this.startNode();
          _node.id = this.parseIdent();
          if (this.isRelational("<")) {
            _node.typeParameters = this.flowParseTypeParameterInstantiation();
          } else {
            _node.typeParameters = null;
          }
          implemented.push(this.finishNode(_node, "ClassImplements"));
        } while (this.eat(_tokenizerTypes.types.comma));
      }
    };
  });

  instance.extend("parseObjPropValue", function (inner) {
    return function (prop) {
      var typeParameters;

      // method shorthand
      if (this.isRelational("<")) {
        typeParameters = this.flowParseTypeParameterDeclaration();
        if (!this.match(_tokenizerTypes.types.parenL)) this.unexpected();
      }

      inner.apply(this, arguments);

      // add typeParameters if we found them
      if (typeParameters) {
        prop.value.typeParameters = typeParameters;
      }
    };
  });

  instance.extend("parseAssignableListItemTypes", function () {
    return function (param) {
      if (this.eat(_tokenizerTypes.types.question)) {
        param.optional = true;
      }
      if (this.match(_tokenizerTypes.types.colon)) {
        param.typeAnnotation = this.flowParseTypeAnnotation();
      }
      this.finishNode(param, param.type);
      return param;
    };
  });

  instance.extend("parseImportSpecifiers", function (inner) {
    return function (node) {
      node.importKind = "value";

      var kind = this.match(_tokenizerTypes.types._typeof) ? "typeof" : this.isContextual("type") ? "type" : null;
      if (kind) {
        var lh = this.lookahead();
        if (lh.type === _tokenizerTypes.types.name && lh.value !== "from" || lh.type === _tokenizerTypes.types.braceL || lh.type === _tokenizerTypes.types.star) {
          this.next();
          node.importKind = kind;
        }
      }

      inner.call(this, node);
    };
  });

  // function foo<T>() {}
  instance.extend("parseFunctionParams", function (inner) {
    return function (node) {
      if (this.isRelational("<")) {
        node.typeParameters = this.flowParseTypeParameterDeclaration();
      }
      inner.call(this, node);
    };
  });

  // var foo: string = bar
  instance.extend("parseVarHead", function (inner) {
    return function (decl) {
      inner.call(this, decl);
      if (this.match(_tokenizerTypes.types.colon)) {
        decl.id.typeAnnotation = this.flowParseTypeAnnotation();
        this.finishNode(decl.id, decl.id.type);
      }
    };
  });

  // var foo = (async (): number => {});
  instance.extend("parseAsyncArrowFromCallExpression", function (inner) {
    return function (node, call) {
      if (this.match(_tokenizerTypes.types.colon)) {
        node.returnType = this.flowParseTypeAnnotation();
      }

      return inner.call(this, node, call);
    };
  });

  instance.extend("parseParenAndDistinguishExpression", function (inner) {
    return function (startPos, startLoc, canBeArrow, isAsync) {
      startPos = startPos || this.state.start;
      startLoc = startLoc || this.state.startLoc;

      if (this.lookahead().type === _tokenizerTypes.types.parenR) {
        // var foo = (): number => {};
        this.expect(_tokenizerTypes.types.parenL);
        this.expect(_tokenizerTypes.types.parenR);

        var node = this.startNodeAt(startPos, startLoc);
        if (this.match(_tokenizerTypes.types.colon)) node.returnType = this.flowParseTypeAnnotation();
        this.expect(_tokenizerTypes.types.arrow);
        return this.parseArrowExpression(node, [], isAsync);
      } else {
        // var foo = (foo): number => {};
        var node = inner.call(this, startPos, startLoc, canBeArrow, isAsync);

        if (this.match(_tokenizerTypes.types.colon)) {
          var state = this.state.clone();
          try {
            return this.parseParenItem(node, startPos, startLoc, true);
          } catch (err) {
            if (err instanceof SyntaxError) {
              this.state = state;
              return node;
            } else {
              throw err;
            }
          }
        } else {
          return node;
        }
      }
    };
  });
};

module.exports = exports["default"];
},{"../parser":46,"../tokenizer/types":58}],53:[function(require,module,exports){
"use strict";

exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _xhtml = require("./xhtml");

var _xhtml2 = _interopRequireDefault(_xhtml);

var _tokenizerTypes = require("../../tokenizer/types");

var _tokenizerContext = require("../../tokenizer/context");

var _parser = require("../../parser");

var _parser2 = _interopRequireDefault(_parser);

var _utilIdentifier = require("../../util/identifier");

var _utilWhitespace = require("../../util/whitespace");

var HEX_NUMBER = /^[\da-fA-F]+$/;
var DECIMAL_NUMBER = /^\d+$/;

_tokenizerContext.types.j_oTag = new _tokenizerContext.TokContext("<tag", false);
_tokenizerContext.types.j_cTag = new _tokenizerContext.TokContext("</tag", false);
_tokenizerContext.types.j_expr = new _tokenizerContext.TokContext("<tag>...</tag>", true, true);

_tokenizerTypes.types.jsxName = new _tokenizerTypes.TokenType("jsxName");
_tokenizerTypes.types.jsxText = new _tokenizerTypes.TokenType("jsxText", { beforeExpr: true });
_tokenizerTypes.types.jsxTagStart = new _tokenizerTypes.TokenType("jsxTagStart");
_tokenizerTypes.types.jsxTagEnd = new _tokenizerTypes.TokenType("jsxTagEnd");

_tokenizerTypes.types.jsxTagStart.updateContext = function () {
  this.state.context.push(_tokenizerContext.types.j_expr); // treat as beginning of JSX expression
  this.state.context.push(_tokenizerContext.types.j_oTag); // start opening tag context
  this.state.exprAllowed = false;
};

_tokenizerTypes.types.jsxTagEnd.updateContext = function (prevType) {
  var out = this.state.context.pop();
  if (out === _tokenizerContext.types.j_oTag && prevType === _tokenizerTypes.types.slash || out === _tokenizerContext.types.j_cTag) {
    this.state.context.pop();
    this.state.exprAllowed = this.curContext() === _tokenizerContext.types.j_expr;
  } else {
    this.state.exprAllowed = true;
  }
};

var pp = _parser2["default"].prototype;

// Reads inline JSX contents token.

pp.jsxReadToken = function () {
  var out = "",
      chunkStart = this.state.pos;
  for (;;) {
    if (this.state.pos >= this.input.length) {
      this.raise(this.state.start, "Unterminated JSX contents");
    }

    var ch = this.input.charCodeAt(this.state.pos);

    switch (ch) {
      case 60: // "<"
      case 123:
        // "{"
        if (this.state.pos === this.state.start) {
          if (ch === 60 && this.state.exprAllowed) {
            ++this.state.pos;
            return this.finishToken(_tokenizerTypes.types.jsxTagStart);
          }
          return this.getTokenFromCode(ch);
        }
        out += this.input.slice(chunkStart, this.state.pos);
        return this.finishToken(_tokenizerTypes.types.jsxText, out);

      case 38:
        // "&"
        out += this.input.slice(chunkStart, this.state.pos);
        out += this.jsxReadEntity();
        chunkStart = this.state.pos;
        break;

      default:
        if (_utilWhitespace.isNewLine(ch)) {
          out += this.input.slice(chunkStart, this.state.pos);
          out += this.jsxReadNewLine(true);
          chunkStart = this.state.pos;
        } else {
          ++this.state.pos;
        }
    }
  }
};

pp.jsxReadNewLine = function (normalizeCRLF) {
  var ch = this.input.charCodeAt(this.state.pos);
  var out;
  ++this.state.pos;
  if (ch === 13 && this.input.charCodeAt(this.state.pos) === 10) {
    ++this.state.pos;
    out = normalizeCRLF ? "\n" : "\r\n";
  } else {
    out = String.fromCharCode(ch);
  }
  ++this.state.curLine;
  this.state.lineStart = this.state.pos;

  return out;
};

pp.jsxReadString = function (quote) {
  var out = "",
      chunkStart = ++this.state.pos;
  for (;;) {
    if (this.state.pos >= this.input.length) {
      this.raise(this.state.start, "Unterminated string constant");
    }

    var ch = this.input.charCodeAt(this.state.pos);
    if (ch === quote) break;
    if (ch === 38) {
      // "&"
      out += this.input.slice(chunkStart, this.state.pos);
      out += this.jsxReadEntity();
      chunkStart = this.state.pos;
    } else if (_utilWhitespace.isNewLine(ch)) {
      out += this.input.slice(chunkStart, this.state.pos);
      out += this.jsxReadNewLine(false);
      chunkStart = this.state.pos;
    } else {
      ++this.state.pos;
    }
  }
  out += this.input.slice(chunkStart, this.state.pos++);
  return this.finishToken(_tokenizerTypes.types.string, out);
};

pp.jsxReadEntity = function () {
  var str = "",
      count = 0,
      entity;
  var ch = this.input[this.state.pos];

  var startPos = ++this.state.pos;
  while (this.state.pos < this.input.length && count++ < 10) {
    ch = this.input[this.state.pos++];
    if (ch === ";") {
      if (str[0] === "#") {
        if (str[1] === "x") {
          str = str.substr(2);
          if (HEX_NUMBER.test(str)) entity = String.fromCharCode(parseInt(str, 16));
        } else {
          str = str.substr(1);
          if (DECIMAL_NUMBER.test(str)) entity = String.fromCharCode(parseInt(str, 10));
        }
      } else {
        entity = _xhtml2["default"][str];
      }
      break;
    }
    str += ch;
  }
  if (!entity) {
    this.state.pos = startPos;
    return "&";
  }
  return entity;
};

// Read a JSX identifier (valid tag or attribute name).
//
// Optimized version since JSX identifiers can"t contain
// escape characters and so can be read as single slice.
// Also assumes that first character was already checked
// by isIdentifierStart in readToken.

pp.jsxReadWord = function () {
  var ch,
      start = this.state.pos;
  do {
    ch = this.input.charCodeAt(++this.state.pos);
  } while (_utilIdentifier.isIdentifierChar(ch) || ch === 45); // "-"
  return this.finishToken(_tokenizerTypes.types.jsxName, this.input.slice(start, this.state.pos));
};

// Transforms JSX element name to string.

function getQualifiedJSXName(object) {
  if (object.type === "JSXIdentifier") {
    return object.name;
  }

  if (object.type === "JSXNamespacedName") {
    return object.namespace.name + ":" + object.name.name;
  }

  if (object.type === "JSXMemberExpression") {
    return getQualifiedJSXName(object.object) + "." + getQualifiedJSXName(object.property);
  }
}

// Parse next token as JSX identifier

pp.jsxParseIdentifier = function () {
  var node = this.startNode();
  if (this.match(_tokenizerTypes.types.jsxName)) {
    node.name = this.state.value;
  } else if (this.state.type.keyword) {
    node.name = this.state.type.keyword;
  } else {
    this.unexpected();
  }
  this.next();
  return this.finishNode(node, "JSXIdentifier");
};

// Parse namespaced identifier.

pp.jsxParseNamespacedName = function () {
  var startPos = this.state.start,
      startLoc = this.state.startLoc;
  var name = this.jsxParseIdentifier();
  if (!this.eat(_tokenizerTypes.types.colon)) return name;

  var node = this.startNodeAt(startPos, startLoc);
  node.namespace = name;
  node.name = this.jsxParseIdentifier();
  return this.finishNode(node, "JSXNamespacedName");
};

// Parses element name in any form - namespaced, member
// or single identifier.

pp.jsxParseElementName = function () {
  var startPos = this.state.start,
      startLoc = this.state.startLoc;
  var node = this.jsxParseNamespacedName();
  while (this.eat(_tokenizerTypes.types.dot)) {
    var newNode = this.startNodeAt(startPos, startLoc);
    newNode.object = node;
    newNode.property = this.jsxParseIdentifier();
    node = this.finishNode(newNode, "JSXMemberExpression");
  }
  return node;
};

// Parses any type of JSX attribute value.

pp.jsxParseAttributeValue = function () {
  var node;
  switch (this.state.type) {
    case _tokenizerTypes.types.braceL:
      node = this.jsxParseExpressionContainer();
      if (node.expression.type === "JSXEmptyExpression") {
        this.raise(node.start, "JSX attributes must only be assigned a non-empty expression");
      } else {
        return node;
      }

    case _tokenizerTypes.types.jsxTagStart:
    case _tokenizerTypes.types.string:
      node = this.parseExprAtom();
      node.rawValue = null;
      return node;

    default:
      this.raise(this.state.start, "JSX value should be either an expression or a quoted JSX text");
  }
};

// JSXEmptyExpression is unique type since it doesn"t actually parse anything,
// and so it should start at the end of last read token (left brace) and finish
// at the beginning of the next one (right brace).

pp.jsxParseEmptyExpression = function () {
  var tmp = this.state.start;
  this.state.start = this.state.lastTokEnd;
  this.state.lastTokEnd = tmp;

  tmp = this.state.startLoc;
  this.state.startLoc = this.state.lastTokEndLoc;
  this.state.lastTokEndLoc = tmp;

  return this.finishNode(this.startNode(), "JSXEmptyExpression");
};

// Parses JSX expression enclosed into curly brackets.

pp.jsxParseExpressionContainer = function () {
  var node = this.startNode();
  this.next();
  if (this.match(_tokenizerTypes.types.braceR)) {
    node.expression = this.jsxParseEmptyExpression();
  } else {
    node.expression = this.parseExpression();
  }
  this.expect(_tokenizerTypes.types.braceR);
  return this.finishNode(node, "JSXExpressionContainer");
};

// Parses following JSX attribute name-value pair.

pp.jsxParseAttribute = function () {
  var node = this.startNode();
  if (this.eat(_tokenizerTypes.types.braceL)) {
    this.expect(_tokenizerTypes.types.ellipsis);
    node.argument = this.parseMaybeAssign();
    this.expect(_tokenizerTypes.types.braceR);
    return this.finishNode(node, "JSXSpreadAttribute");
  }
  node.name = this.jsxParseNamespacedName();
  node.value = this.eat(_tokenizerTypes.types.eq) ? this.jsxParseAttributeValue() : null;
  return this.finishNode(node, "JSXAttribute");
};

// Parses JSX opening tag starting after "<".

pp.jsxParseOpeningElementAt = function (startPos, startLoc) {
  var node = this.startNodeAt(startPos, startLoc);
  node.attributes = [];
  node.name = this.jsxParseElementName();
  while (!this.match(_tokenizerTypes.types.slash) && !this.match(_tokenizerTypes.types.jsxTagEnd)) {
    node.attributes.push(this.jsxParseAttribute());
  }
  node.selfClosing = this.eat(_tokenizerTypes.types.slash);
  this.expect(_tokenizerTypes.types.jsxTagEnd);
  return this.finishNode(node, "JSXOpeningElement");
};

// Parses JSX closing tag starting after "</".

pp.jsxParseClosingElementAt = function (startPos, startLoc) {
  var node = this.startNodeAt(startPos, startLoc);
  node.name = this.jsxParseElementName();
  this.expect(_tokenizerTypes.types.jsxTagEnd);
  return this.finishNode(node, "JSXClosingElement");
};

// Parses entire JSX element, including it"s opening tag
// (starting after "<"), attributes, contents and closing tag.

pp.jsxParseElementAt = function (startPos, startLoc) {
  var node = this.startNodeAt(startPos, startLoc);
  var children = [];
  var openingElement = this.jsxParseOpeningElementAt(startPos, startLoc);
  var closingElement = null;

  if (!openingElement.selfClosing) {
    contents: for (;;) {
      switch (this.state.type) {
        case _tokenizerTypes.types.jsxTagStart:
          startPos = this.state.start;startLoc = this.state.startLoc;
          this.next();
          if (this.eat(_tokenizerTypes.types.slash)) {
            closingElement = this.jsxParseClosingElementAt(startPos, startLoc);
            break contents;
          }
          children.push(this.jsxParseElementAt(startPos, startLoc));
          break;

        case _tokenizerTypes.types.jsxText:
          children.push(this.parseExprAtom());
          break;

        case _tokenizerTypes.types.braceL:
          children.push(this.jsxParseExpressionContainer());
          break;

        default:
          this.unexpected();
      }
    }

    if (getQualifiedJSXName(closingElement.name) !== getQualifiedJSXName(openingElement.name)) {
      this.raise(closingElement.start, "Expected corresponding JSX closing tag for <" + getQualifiedJSXName(openingElement.name) + ">");
    }
  }

  node.openingElement = openingElement;
  node.closingElement = closingElement;
  node.children = children;
  if (this.match(_tokenizerTypes.types.relational) && this.state.value === "<") {
    this.raise(this.state.start, "Adjacent JSX elements must be wrapped in an enclosing tag");
  }
  return this.finishNode(node, "JSXElement");
};

// Parses entire JSX element from current position.

pp.jsxParseElement = function () {
  var startPos = this.state.start,
      startLoc = this.state.startLoc;
  this.next();
  return this.jsxParseElementAt(startPos, startLoc);
};

exports["default"] = function (instance) {
  instance.extend("parseExprAtom", function (inner) {
    return function (refShortHandDefaultPos) {
      if (this.match(_tokenizerTypes.types.jsxText)) {
        var node = this.parseLiteral(this.state.value);
        // https://github.com/babel/babel/issues/2078
        node.rawValue = null;
        return node;
      } else if (this.match(_tokenizerTypes.types.jsxTagStart)) {
        return this.jsxParseElement();
      } else {
        return inner.call(this, refShortHandDefaultPos);
      }
    };
  });

  instance.extend("readToken", function (inner) {
    return function (code) {
      var context = this.curContext();

      if (context === _tokenizerContext.types.j_expr) {
        return this.jsxReadToken();
      }

      if (context === _tokenizerContext.types.j_oTag || context === _tokenizerContext.types.j_cTag) {
        if (_utilIdentifier.isIdentifierStart(code)) {
          return this.jsxReadWord();
        }

        if (code === 62) {
          ++this.state.pos;
          return this.finishToken(_tokenizerTypes.types.jsxTagEnd);
        }

        if ((code === 34 || code === 39) && context === _tokenizerContext.types.j_oTag) {
          return this.jsxReadString(code);
        }
      }

      if (code === 60 && this.state.exprAllowed) {
        ++this.state.pos;
        return this.finishToken(_tokenizerTypes.types.jsxTagStart);
      }

      return inner.call(this, code);
    };
  });

  instance.extend("updateContext", function (inner) {
    return function (prevType) {
      if (this.match(_tokenizerTypes.types.braceL)) {
        var curContext = this.curContext();
        if (curContext === _tokenizerContext.types.j_oTag) {
          this.state.context.push(_tokenizerContext.types.b_expr);
        } else if (curContext === _tokenizerContext.types.j_expr) {
          this.state.context.push(_tokenizerContext.types.b_tmpl);
        } else {
          inner.call(this, prevType);
        }
        this.state.exprAllowed = true;
      } else if (this.match(_tokenizerTypes.types.slash) && prevType === _tokenizerTypes.types.jsxTagStart) {
        this.state.context.length -= 2; // do not consider JSX expr -> JSX open tag -> ... anymore
        this.state.context.push(_tokenizerContext.types.j_cTag); // reconsider as closing tag context
        this.state.exprAllowed = false;
      } else {
        return inner.call(this, prevType);
      }
    };
  });
};

module.exports = exports["default"];
},{"../../parser":46,"../../tokenizer/context":55,"../../tokenizer/types":58,"../../util/identifier":59,"../../util/whitespace":61,"./xhtml":54}],54:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports["default"] = {
  quot: "\"",
  amp: "&",
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
  iexcl: "¡",
  cent: "¢",
  pound: "£",
  curren: "¤",
  yen: "¥",
  brvbar: "¦",
  sect: "§",
  uml: "¨",
  copy: "©",
  ordf: "ª",
  laquo: "«",
  not: "¬",
  shy: "­",
  reg: "®",
  macr: "¯",
  deg: "°",
  plusmn: "±",
  sup2: "²",
  sup3: "³",
  acute: "´",
  micro: "µ",
  para: "¶",
  middot: "·",
  cedil: "¸",
  sup1: "¹",
  ordm: "º",
  raquo: "»",
  frac14: "¼",
  frac12: "½",
  frac34: "¾",
  iquest: "¿",
  Agrave: "À",
  Aacute: "Á",
  Acirc: "Â",
  Atilde: "Ã",
  Auml: "Ä",
  Aring: "Å",
  AElig: "Æ",
  Ccedil: "Ç",
  Egrave: "È",
  Eacute: "É",
  Ecirc: "Ê",
  Euml: "Ë",
  Igrave: "Ì",
  Iacute: "Í",
  Icirc: "Î",
  Iuml: "Ï",
  ETH: "Ð",
  Ntilde: "Ñ",
  Ograve: "Ò",
  Oacute: "Ó",
  Ocirc: "Ô",
  Otilde: "Õ",
  Ouml: "Ö",
  times: "×",
  Oslash: "Ø",
  Ugrave: "Ù",
  Uacute: "Ú",
  Ucirc: "Û",
  Uuml: "Ü",
  Yacute: "Ý",
  THORN: "Þ",
  szlig: "ß",
  agrave: "à",
  aacute: "á",
  acirc: "â",
  atilde: "ã",
  auml: "ä",
  aring: "å",
  aelig: "æ",
  ccedil: "ç",
  egrave: "è",
  eacute: "é",
  ecirc: "ê",
  euml: "ë",
  igrave: "ì",
  iacute: "í",
  icirc: "î",
  iuml: "ï",
  eth: "ð",
  ntilde: "ñ",
  ograve: "ò",
  oacute: "ó",
  ocirc: "ô",
  otilde: "õ",
  ouml: "ö",
  divide: "÷",
  oslash: "ø",
  ugrave: "ù",
  uacute: "ú",
  ucirc: "û",
  uuml: "ü",
  yacute: "ý",
  thorn: "þ",
  yuml: "ÿ",
  OElig: "Œ",
  oelig: "œ",
  Scaron: "Š",
  scaron: "š",
  Yuml: "Ÿ",
  fnof: "ƒ",
  circ: "ˆ",
  tilde: "˜",
  Alpha: "Α",
  Beta: "Β",
  Gamma: "Γ",
  Delta: "Δ",
  Epsilon: "Ε",
  Zeta: "Ζ",
  Eta: "Η",
  Theta: "Θ",
  Iota: "Ι",
  Kappa: "Κ",
  Lambda: "Λ",
  Mu: "Μ",
  Nu: "Ν",
  Xi: "Ξ",
  Omicron: "Ο",
  Pi: "Π",
  Rho: "Ρ",
  Sigma: "Σ",
  Tau: "Τ",
  Upsilon: "Υ",
  Phi: "Φ",
  Chi: "Χ",
  Psi: "Ψ",
  Omega: "Ω",
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  iota: "ι",
  kappa: "κ",
  lambda: "λ",
  mu: "μ",
  nu: "ν",
  xi: "ξ",
  omicron: "ο",
  pi: "π",
  rho: "ρ",
  sigmaf: "ς",
  sigma: "σ",
  tau: "τ",
  upsilon: "υ",
  phi: "φ",
  chi: "χ",
  psi: "ψ",
  omega: "ω",
  thetasym: "ϑ",
  upsih: "ϒ",
  piv: "ϖ",
  ensp: " ",
  emsp: " ",
  thinsp: " ",
  zwnj: "‌",
  zwj: "‍",
  lrm: "‎",
  rlm: "‏",
  ndash: "–",
  mdash: "—",
  lsquo: "‘",
  rsquo: "’",
  sbquo: "‚",
  ldquo: "“",
  rdquo: "”",
  bdquo: "„",
  dagger: "†",
  Dagger: "‡",
  bull: "•",
  hellip: "…",
  permil: "‰",
  prime: "′",
  Prime: "″",
  lsaquo: "‹",
  rsaquo: "›",
  oline: "‾",
  frasl: "⁄",
  euro: "€",
  image: "ℑ",
  weierp: "℘",
  real: "ℜ",
  trade: "™",
  alefsym: "ℵ",
  larr: "←",
  uarr: "↑",
  rarr: "→",
  darr: "↓",
  harr: "↔",
  crarr: "↵",
  lArr: "⇐",
  uArr: "⇑",
  rArr: "⇒",
  dArr: "⇓",
  hArr: "⇔",
  forall: "∀",
  part: "∂",
  exist: "∃",
  empty: "∅",
  nabla: "∇",
  isin: "∈",
  notin: "∉",
  ni: "∋",
  prod: "∏",
  sum: "∑",
  minus: "−",
  lowast: "∗",
  radic: "√",
  prop: "∝",
  infin: "∞",
  ang: "∠",
  and: "∧",
  or: "∨",
  cap: "∩",
  cup: "∪",
  "int": "∫",
  there4: "∴",
  sim: "∼",
  cong: "≅",
  asymp: "≈",
  ne: "≠",
  equiv: "≡",
  le: "≤",
  ge: "≥",
  sub: "⊂",
  sup: "⊃",
  nsub: "⊄",
  sube: "⊆",
  supe: "⊇",
  oplus: "⊕",
  otimes: "⊗",
  perp: "⊥",
  sdot: "⋅",
  lceil: "⌈",
  rceil: "⌉",
  lfloor: "⌊",
  rfloor: "⌋",
  lang: "〈",
  rang: "〉",
  loz: "◊",
  spades: "♠",
  clubs: "♣",
  hearts: "♥",
  diams: "♦"
};
module.exports = exports["default"];
},{}],55:[function(require,module,exports){
// The algorithm used to determine whether a regexp can appear at a
// given point in the program is loosely based on sweet.js' approach.
// See https://github.com/mozilla/sweet.js/wiki/design

"use strict";

exports.__esModule = true;
// istanbul ignore next

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _types = require("./types");

var TokContext = function TokContext(token, isExpr, preserveSpace, override) {
  _classCallCheck(this, TokContext);

  this.token = token;
  this.isExpr = !!isExpr;
  this.preserveSpace = !!preserveSpace;
  this.override = override;
};

exports.TokContext = TokContext;
var types = {
  b_stat: new TokContext("{", false),
  b_expr: new TokContext("{", true),
  b_tmpl: new TokContext("${", true),
  p_stat: new TokContext("(", false),
  p_expr: new TokContext("(", true),
  q_tmpl: new TokContext("`", true, true, function (p) {
    return p.readTmplToken();
  }),
  f_expr: new TokContext("function", true)
};

exports.types = types;
// Token-specific context update code

_types.types.parenR.updateContext = _types.types.braceR.updateContext = function () {
  if (this.state.context.length === 1) {
    this.state.exprAllowed = true;
    return;
  }

  var out = this.state.context.pop();
  if (out === types.b_stat && this.curContext() === types.f_expr) {
    this.state.context.pop();
    this.state.exprAllowed = false;
  } else if (out === types.b_tmpl) {
    this.state.exprAllowed = true;
  } else {
    this.state.exprAllowed = !out.isExpr;
  }
};

_types.types.braceL.updateContext = function (prevType) {
  this.state.context.push(this.braceIsBlock(prevType) ? types.b_stat : types.b_expr);
  this.state.exprAllowed = true;
};

_types.types.dollarBraceL.updateContext = function () {
  this.state.context.push(types.b_tmpl);
  this.state.exprAllowed = true;
};

_types.types.parenL.updateContext = function (prevType) {
  var statementParens = prevType === _types.types._if || prevType === _types.types._for || prevType === _types.types._with || prevType === _types.types._while;
  this.state.context.push(statementParens ? types.p_stat : types.p_expr);
  this.state.exprAllowed = true;
};

_types.types.incDec.updateContext = function () {
  // tokExprAllowed stays unchanged
};

_types.types._function.updateContext = function () {
  if (this.curContext() !== types.b_stat) {
    this.state.context.push(types.f_expr);
  }

  this.state.exprAllowed = false;
};

_types.types.backQuote.updateContext = function () {
  if (this.curContext() === types.q_tmpl) {
    this.state.context.pop();
  } else {
    this.state.context.push(types.q_tmpl);
  }
  this.state.exprAllowed = false;
};
},{"./types":58}],56:[function(require,module,exports){
"use strict";

exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// istanbul ignore next

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _utilIdentifier = require("../util/identifier");

var _types = require("./types");

var _context = require("./context");

var _utilLocation = require("../util/location");

var _utilWhitespace = require("../util/whitespace");

var _state = require("./state");

var _state2 = _interopRequireDefault(_state);

// Object type used to represent tokens. Note that normally, tokens
// simply exist as properties on the parser object. This is only
// used for the onToken callback and the external tokenizer.

var Token = function Token(state) {
  _classCallCheck(this, Token);

  this.type = state.type;
  this.value = state.value;
  this.start = state.start;
  this.end = state.end;
  this.loc = new _utilLocation.SourceLocation(state.startLoc, state.endLoc);
}

// ## Tokenizer

// Are we running under Rhino?
/* global Packages */
;

exports.Token = Token;
var isRhino = typeof Packages === "object" && Object.prototype.toString.call(Packages) === "[object JavaPackage]";

// Parse a regular expression. Some context-awareness is necessary,
// since a '/' inside a '[]' set does not end the expression.

function tryCreateRegexp(src, flags, throwErrorStart) {
  try {
    return new RegExp(src, flags);
  } catch (e) {
    if (throwErrorStart !== undefined) {
      if (e instanceof SyntaxError) this.raise(throwErrorStart, "Error parsing regular expression: " + e.message);
      this.raise(e);
    }
  }
}

var regexpUnicodeSupport = !!tryCreateRegexp("￿", "u");

function codePointToString(code) {
  // UTF-16 Decoding
  if (code <= 0xFFFF) return String.fromCharCode(code);
  return String.fromCharCode((code - 0x10000 >> 10) + 0xD800, (code - 0x10000 & 1023) + 0xDC00);
}

var Tokenizer = (function () {
  function Tokenizer(input) {
    _classCallCheck(this, Tokenizer);

    this.state = new _state2["default"]();
    this.state.init(input);
  }

  // Move to the next token

  Tokenizer.prototype.next = function next() {
    this.state.tokens.push(new Token(this.state));

    this.state.lastTokEnd = this.state.end;
    this.state.lastTokStart = this.state.start;
    this.state.lastTokEndLoc = this.state.endLoc;
    this.state.lastTokStartLoc = this.state.startLoc;
    this.nextToken();
  };

  // TODO

  Tokenizer.prototype.eat = function eat(type) {
    if (this.match(type)) {
      this.next();
      return true;
    } else {
      return false;
    }
  };

  // TODO

  Tokenizer.prototype.match = function match(type) {
    return this.state.type === type;
  };

  // TODO

  Tokenizer.prototype.lookahead = function lookahead() {
    var old = this.state;
    this.state = old.clone();
    this.next();
    var curr = this.state.clone();
    this.state = old;
    return curr;
  };

  // Toggle strict mode. Re-reads the next number or string to please
  // pedantic tests (`"use strict"; 010;` should fail).

  Tokenizer.prototype.setStrict = function setStrict(strict) {
    this.strict = strict;
    if (!this.match(_types.types.num) && !this.match(_types.types.string)) return;
    this.state.pos = this.state.start;
    while (this.state.pos < this.state.lineStart) {
      this.state.lineStart = this.input.lastIndexOf("\n", this.state.lineStart - 2) + 1;
      --this.state.curLine;
    }
    this.nextToken();
  };

  Tokenizer.prototype.curContext = function curContext() {
    return this.state.context[this.state.context.length - 1];
  };

  // Read a single token, updating the parser object's token-related
  // properties.

  Tokenizer.prototype.nextToken = function nextToken() {
    var curContext = this.curContext();
    if (!curContext || !curContext.preserveSpace) this.skipSpace();

    this.state.start = this.state.pos;
    this.state.startLoc = this.state.curPosition();
    if (this.state.pos >= this.input.length) return this.finishToken(_types.types.eof);

    if (curContext.override) {
      return curContext.override(this);
    } else {
      return this.readToken(this.fullCharCodeAtPos());
    }
  };

  Tokenizer.prototype.readToken = function readToken(code) {
    // Identifier or keyword. '\uXXXX' sequences are allowed in
    // identifiers, so '\' also dispatches to that.
    if (_utilIdentifier.isIdentifierStart(code, true) || code === 92 /* '\' */) return this.readWord();

    return this.getTokenFromCode(code);
  };

  Tokenizer.prototype.fullCharCodeAtPos = function fullCharCodeAtPos() {
    var code = this.input.charCodeAt(this.state.pos);
    if (code <= 0xd7ff || code >= 0xe000) return code;

    var next = this.input.charCodeAt(this.state.pos + 1);
    return (code << 10) + next - 0x35fdc00;
  };

  Tokenizer.prototype.pushComment = function pushComment(block, text, start, end, startLoc, endLoc) {
    var comment = {
      type: block ? "CommentBlock" : "CommentLine",
      value: text,
      start: start,
      end: end,
      loc: new _utilLocation.SourceLocation(startLoc, endLoc),
      range: [start, end]
    };

    this.state.tokens.push(comment);
    this.state.comments.push(comment);
    this.addComment(comment);
  };

  Tokenizer.prototype.skipBlockComment = function skipBlockComment() {
    var startLoc = this.state.curPosition();
    var start = this.state.pos,
        end = this.input.indexOf("*/", this.state.pos += 2);
    if (end === -1) this.raise(this.state.pos - 2, "Unterminated comment");

    this.state.pos = end + 2;
    _utilWhitespace.lineBreakG.lastIndex = start;
    var match = undefined;
    while ((match = _utilWhitespace.lineBreakG.exec(this.input)) && match.index < this.state.pos) {
      ++this.state.curLine;
      this.state.lineStart = match.index + match[0].length;
    }

    this.pushComment(true, this.input.slice(start + 2, end), start, this.state.pos, startLoc, this.state.curPosition());
  };

  Tokenizer.prototype.skipLineComment = function skipLineComment(startSkip) {
    var start = this.state.pos;
    var startLoc = this.state.curPosition();
    var ch = this.input.charCodeAt(this.state.pos += startSkip);
    while (this.state.pos < this.input.length && ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8233) {
      ++this.state.pos;
      ch = this.input.charCodeAt(this.state.pos);
    }

    this.pushComment(false, this.input.slice(start + startSkip, this.state.pos), start, this.state.pos, startLoc, this.state.curPosition());
  };

  // Called at the start of the parse and after every token. Skips
  // whitespace and comments, and.

  Tokenizer.prototype.skipSpace = function skipSpace() {
    loop: while (this.state.pos < this.input.length) {
      var ch = this.input.charCodeAt(this.state.pos);
      switch (ch) {
        case 32:case 160:
          // ' '
          ++this.state.pos;
          break;

        case 13:
          if (this.input.charCodeAt(this.state.pos + 1) === 10) {
            ++this.state.pos;
          }

        case 10:case 8232:case 8233:
          ++this.state.pos;
          ++this.state.curLine;
          this.state.lineStart = this.state.pos;
          break;

        case 47:
          // '/'
          switch (this.input.charCodeAt(this.state.pos + 1)) {
            case 42:
              // '*'
              this.skipBlockComment();
              break;

            case 47:
              this.skipLineComment(2);
              break;

            default:
              break loop;
          }
          break;

        default:
          if (ch > 8 && ch < 14 || ch >= 5760 && _utilWhitespace.nonASCIIwhitespace.test(String.fromCharCode(ch))) {
            ++this.state.pos;
          } else {
            break loop;
          }
      }
    }
  };

  // Called at the end of every token. Sets `end`, `val`, and
  // maintains `context` and `exprAllowed`, and skips the space after
  // the token, so that the next one's `start` will point at the
  // right position.

  Tokenizer.prototype.finishToken = function finishToken(type, val) {
    this.state.end = this.state.pos;
    this.state.endLoc = this.state.curPosition();
    var prevType = this.state.type;
    this.state.type = type;
    this.state.value = val;

    this.updateContext(prevType);
  };

  // ### Token reading

  // This is the function that is called to fetch the next token. It
  // is somewhat obscure, because it works in character codes rather
  // than characters, and because operator parsing has been inlined
  // into it.
  //
  // All in the name of speed.
  //

  Tokenizer.prototype.readToken_dot = function readToken_dot() {
    var next = this.input.charCodeAt(this.state.pos + 1);
    if (next >= 48 && next <= 57) {
      return this.readNumber(true);
    }

    var next2 = this.input.charCodeAt(this.state.pos + 2);
    if (next === 46 && next2 === 46) {
      // 46 = dot '.'
      this.state.pos += 3;
      return this.finishToken(_types.types.ellipsis);
    } else {
      ++this.state.pos;
      return this.finishToken(_types.types.dot);
    }
  };

  Tokenizer.prototype.readToken_slash = function readToken_slash() {
    // '/'
    if (this.state.exprAllowed) {
      ++this.state.pos;
      return this.readRegexp();
    }

    var next = this.input.charCodeAt(this.state.pos + 1);
    if (next === 61) {
      return this.finishOp(_types.types.assign, 2);
    } else {
      return this.finishOp(_types.types.slash, 1);
    }
  };

  Tokenizer.prototype.readToken_mult_modulo = function readToken_mult_modulo(code) {
    // '%*'
    var type = code === 42 ? _types.types.star : _types.types.modulo;
    var width = 1;
    var next = this.input.charCodeAt(this.state.pos + 1);

    if (next === 42 && this.options.features["es7.exponentiationOperator"]) {
      // '*'
      width++;
      next = this.input.charCodeAt(this.state.pos + 2);
      type = _types.types.exponent;
    }

    if (next === 61) {
      width++;
      type = _types.types.assign;
    }

    return this.finishOp(type, width);
  };

  Tokenizer.prototype.readToken_pipe_amp = function readToken_pipe_amp(code) {
    // '|&'
    var next = this.input.charCodeAt(this.state.pos + 1);
    if (next === code) return this.finishOp(code === 124 ? _types.types.logicalOR : _types.types.logicalAND, 2);
    if (next === 61) return this.finishOp(_types.types.assign, 2);
    return this.finishOp(code === 124 ? _types.types.bitwiseOR : _types.types.bitwiseAND, 1);
  };

  Tokenizer.prototype.readToken_caret = function readToken_caret() {
    // '^'
    var next = this.input.charCodeAt(this.state.pos + 1);
    if (next === 61) {
      return this.finishOp(_types.types.assign, 2);
    } else {
      return this.finishOp(_types.types.bitwiseXOR, 1);
    }
  };

  Tokenizer.prototype.readToken_plus_min = function readToken_plus_min(code) {
    // '+-'
    var next = this.input.charCodeAt(this.state.pos + 1);

    if (next === code) {
      if (next === 45 && this.input.charCodeAt(this.state.pos + 2) === 62 && _utilWhitespace.lineBreak.test(this.input.slice(this.state.lastTokEnd, this.state.pos))) {
        // A `-->` line comment
        this.skipLineComment(3);
        this.skipSpace();
        return this.nextToken();
      }
      return this.finishOp(_types.types.incDec, 2);
    }

    if (next === 61) {
      return this.finishOp(_types.types.assign, 2);
    } else {
      return this.finishOp(_types.types.plusMin, 1);
    }
  };

  Tokenizer.prototype.readToken_lt_gt = function readToken_lt_gt(code) {
    // '<>'
    var next = this.input.charCodeAt(this.state.pos + 1);
    var size = 1;

    if (next === code) {
      size = code === 62 && this.input.charCodeAt(this.state.pos + 2) === 62 ? 3 : 2;
      if (this.input.charCodeAt(this.state.pos + size) === 61) return this.finishOp(_types.types.assign, size + 1);
      return this.finishOp(_types.types.bitShift, size);
    }

    if (next === 33 && code === 60 && this.input.charCodeAt(this.state.pos + 2) === 45 && this.input.charCodeAt(this.state.pos + 3) === 45) {
      if (this.inModule) this.unexpected();
      // `<!--`, an XML-style comment that should be interpreted as a line comment
      this.skipLineComment(4);
      this.skipSpace();
      return this.nextToken();
    }

    if (next === 61) {
      size = this.input.charCodeAt(this.state.pos + 2) === 61 ? 3 : 2;
    }

    return this.finishOp(_types.types.relational, size);
  };

  Tokenizer.prototype.readToken_eq_excl = function readToken_eq_excl(code) {
    // '=!'
    var next = this.input.charCodeAt(this.state.pos + 1);
    if (next === 61) return this.finishOp(_types.types.equality, this.input.charCodeAt(this.state.pos + 2) === 61 ? 3 : 2);
    if (code === 61 && next === 62) {
      // '=>'
      this.state.pos += 2;
      return this.finishToken(_types.types.arrow);
    }
    return this.finishOp(code === 61 ? _types.types.eq : _types.types.prefix, 1);
  };

  Tokenizer.prototype.getTokenFromCode = function getTokenFromCode(code) {
    switch (code) {
      // The interpretation of a dot depends on whether it is followed
      // by a digit or another two dots.
      case 46:
        // '.'
        return this.readToken_dot();

      // Punctuation tokens.
      case 40:
        ++this.state.pos;return this.finishToken(_types.types.parenL);
      case 41:
        ++this.state.pos;return this.finishToken(_types.types.parenR);
      case 59:
        ++this.state.pos;return this.finishToken(_types.types.semi);
      case 44:
        ++this.state.pos;return this.finishToken(_types.types.comma);
      case 91:
        ++this.state.pos;return this.finishToken(_types.types.bracketL);
      case 93:
        ++this.state.pos;return this.finishToken(_types.types.bracketR);
      case 123:
        ++this.state.pos;return this.finishToken(_types.types.braceL);
      case 125:
        ++this.state.pos;return this.finishToken(_types.types.braceR);

      case 58:
        if (this.options.features["es7.functionBind"] && this.input.charCodeAt(this.state.pos + 1) === 58) {
          return this.finishOp(_types.types.doubleColon, 2);
        } else {
          ++this.state.pos;
          return this.finishToken(_types.types.colon);
        }

      case 63:
        ++this.state.pos;return this.finishToken(_types.types.question);
      case 64:
        ++this.state.pos;return this.finishToken(_types.types.at);

      case 96:
        // '`'
        ++this.state.pos;
        return this.finishToken(_types.types.backQuote);

      case 48:
        // '0'
        var next = this.input.charCodeAt(this.state.pos + 1);
        if (next === 120 || next === 88) return this.readRadixNumber(16); // '0x', '0X' - hex number
        if (next === 111 || next === 79) return this.readRadixNumber(8); // '0o', '0O' - octal number
        if (next === 98 || next === 66) return this.readRadixNumber(2); // '0b', '0B' - binary number
      // Anything else beginning with a digit is an integer, octal
      // number, or float.
      case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:
        // 1-9
        return this.readNumber(false);

      // Quotes produce strings.
      case 34:case 39:
        // '"', "'"
        return this.readString(code);

      // Operators are parsed inline in tiny state machines. '=' (61) is
      // often referred to. `finishOp` simply skips the amount of
      // characters it is given as second argument, and returns a token
      // of the type given by its first argument.

      case 47:
        // '/'
        return this.readToken_slash();

      case 37:case 42:
        // '%*'
        return this.readToken_mult_modulo(code);

      case 124:case 38:
        // '|&'
        return this.readToken_pipe_amp(code);

      case 94:
        // '^'
        return this.readToken_caret();

      case 43:case 45:
        // '+-'
        return this.readToken_plus_min(code);

      case 60:case 62:
        // '<>'
        return this.readToken_lt_gt(code);

      case 61:case 33:
        // '=!'
        return this.readToken_eq_excl(code);

      case 126:
        // '~'
        return this.finishOp(_types.types.prefix, 1);
    }

    this.raise(this.state.pos, "Unexpected character '" + codePointToString(code) + "'");
  };

  Tokenizer.prototype.finishOp = function finishOp(type, size) {
    var str = this.input.slice(this.state.pos, this.state.pos + size);
    this.state.pos += size;
    return this.finishToken(type, str);
  };

  Tokenizer.prototype.readRegexp = function readRegexp() {
    // istanbul ignore next

    var _this = this;

    var escaped = undefined,
        inClass = undefined,
        start = this.state.pos;
    for (;;) {
      if (this.state.pos >= this.input.length) this.raise(start, "Unterminated regular expression");
      var ch = this.input.charAt(this.state.pos);
      if (_utilWhitespace.lineBreak.test(ch)) {
        this.raise(start, "Unterminated regular expression");
      }
      if (escaped) {
        escaped = false;
      } else {
        if (ch === "[") {
          inClass = true;
        } else if (ch === "]" && inClass) {
          inClass = false;
        } else if (ch === "/" && !inClass) {
          break;
        }
        escaped = ch === "\\";
      }
      ++this.state.pos;
    }
    var content = this.input.slice(start, this.state.pos);
    ++this.state.pos;
    // Need to use `readWord1` because '\uXXXX' sequences are allowed
    // here (don't ask).
    var mods = this.readWord1();
    var tmp = content;
    if (mods) {
      var validFlags = /^[gmsiyu]*$/;
      if (!validFlags.test(mods)) this.raise(start, "Invalid regular expression flag");
      if (mods.indexOf("u") >= 0 && !regexpUnicodeSupport) {
        // Replace each astral symbol and every Unicode escape sequence that
        // possibly represents an astral symbol or a paired surrogate with a
        // single ASCII symbol to avoid throwing on regular expressions that
        // are only valid in combination with the `/u` flag.
        // Note: replacing with the ASCII symbol `x` might cause false
        // negatives in unlikely scenarios. For example, `[\u{61}-b]` is a
        // perfectly valid pattern that is equivalent to `[a-b]`, but it would
        // be replaced by `[x-b]` which throws an error.
        tmp = tmp.replace(/\\u\{([0-9a-fA-F]+)\}/g, function (match, code, offset) {
          code = Number("0x" + code);
          if (code > 0x10FFFF) _this.raise(start + offset + 3, "Code point out of bounds");
          return "x";
        });
        tmp = tmp.replace(/\\u([a-fA-F0-9]{4})|[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "x");
      }
    }
    // Detect invalid regular expressions.
    var value = null;
    // Rhino's regular expression parser is flaky and throws uncatchable exceptions,
    // so don't do detection if we are running under Rhino
    if (!isRhino) {
      tryCreateRegexp.call(this, tmp, undefined, start);
      // Get a regular expression object for this pattern-flag pair, or `null` in
      // case the current environment doesn't support the flags it uses.
      value = tryCreateRegexp.call(this, content, mods);
    }
    return this.finishToken(_types.types.regexp, {
      pattern: content,
      flags: mods,
      value: value
    });
  };

  // Read an integer in the given radix. Return null if zero digits
  // were read, the integer value otherwise. When `len` is given, this
  // will return `null` unless the integer has exactly `len` digits.

  Tokenizer.prototype.readInt = function readInt(radix, len) {
    var start = this.state.pos,
        total = 0;
    for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
      var code = this.input.charCodeAt(this.state.pos),
          val = undefined;
      if (code >= 97) {
        val = code - 97 + 10; // a
      } else if (code >= 65) {
          val = code - 65 + 10; // A
        } else if (code >= 48 && code <= 57) {
            val = code - 48; // 0-9
          } else {
              val = Infinity;
            }
      if (val >= radix) break;
      ++this.state.pos;
      total = total * radix + val;
    }
    if (this.state.pos === start || len != null && this.state.pos - start !== len) return null;

    return total;
  };

  Tokenizer.prototype.readRadixNumber = function readRadixNumber(radix) {
    this.state.pos += 2; // 0x
    var val = this.readInt(radix);
    if (val == null) this.raise(this.state.start + 2, "Expected number in radix " + radix);
    if (_utilIdentifier.isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.state.pos, "Identifier directly after number");
    return this.finishToken(_types.types.num, val);
  };

  // Read an integer, octal integer, or floating-point number.

  Tokenizer.prototype.readNumber = function readNumber(startsWithDot) {
    var start = this.state.pos,
        isFloat = false,
        octal = this.input.charCodeAt(this.state.pos) === 48;
    if (!startsWithDot && this.readInt(10) === null) this.raise(start, "Invalid number");
    var next = this.input.charCodeAt(this.state.pos);
    if (next === 46) {
      // '.'
      ++this.state.pos;
      this.readInt(10);
      isFloat = true;
      next = this.input.charCodeAt(this.state.pos);
    }
    if (next === 69 || next === 101) {
      // 'eE'
      next = this.input.charCodeAt(++this.state.pos);
      if (next === 43 || next === 45) ++this.state.pos; // '+-'
      if (this.readInt(10) === null) this.raise(start, "Invalid number");
      isFloat = true;
    }
    if (_utilIdentifier.isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.state.pos, "Identifier directly after number");

    var str = this.input.slice(start, this.state.pos),
        val = undefined;
    if (isFloat) {
      val = parseFloat(str);
    } else if (!octal || str.length === 1) {
      val = parseInt(str, 10);
    } else if (/[89]/.test(str) || this.strict) {
      this.raise(start, "Invalid number");
    } else {
      val = parseInt(str, 8);
    }
    return this.finishToken(_types.types.num, val);
  };

  // Read a string value, interpreting backslash-escapes.

  Tokenizer.prototype.readCodePoint = function readCodePoint() {
    var ch = this.input.charCodeAt(this.state.pos),
        code = undefined;

    if (ch === 123) {
      var codePos = ++this.state.pos;
      code = this.readHexChar(this.input.indexOf("}", this.state.pos) - this.state.pos);
      ++this.state.pos;
      if (code > 0x10FFFF) this.raise(codePos, "Code point out of bounds");
    } else {
      code = this.readHexChar(4);
    }
    return code;
  };

  Tokenizer.prototype.readString = function readString(quote) {
    var out = "",
        chunkStart = ++this.state.pos;
    for (;;) {
      if (this.state.pos >= this.input.length) this.raise(this.state.start, "Unterminated string constant");
      var ch = this.input.charCodeAt(this.state.pos);
      if (ch === quote) break;
      if (ch === 92) {
        // '\'
        out += this.input.slice(chunkStart, this.state.pos);
        out += this.readEscapedChar(false);
        chunkStart = this.state.pos;
      } else {
        if (_utilWhitespace.isNewLine(ch)) this.raise(this.state.start, "Unterminated string constant");
        ++this.state.pos;
      }
    }
    out += this.input.slice(chunkStart, this.state.pos++);
    return this.finishToken(_types.types.string, out);
  };

  // Reads template string tokens.

  Tokenizer.prototype.readTmplToken = function readTmplToken() {
    var out = "",
        chunkStart = this.state.pos;
    for (;;) {
      if (this.state.pos >= this.input.length) this.raise(this.state.start, "Unterminated template");
      var ch = this.input.charCodeAt(this.state.pos);
      if (ch === 96 || ch === 36 && this.input.charCodeAt(this.state.pos + 1) === 123) {
        // '`', '${'
        if (this.state.pos === this.state.start && this.match(_types.types.template)) {
          if (ch === 36) {
            this.state.pos += 2;
            return this.finishToken(_types.types.dollarBraceL);
          } else {
            ++this.state.pos;
            return this.finishToken(_types.types.backQuote);
          }
        }
        out += this.input.slice(chunkStart, this.state.pos);
        return this.finishToken(_types.types.template, out);
      }
      if (ch === 92) {
        // '\'
        out += this.input.slice(chunkStart, this.state.pos);
        out += this.readEscapedChar(true);
        chunkStart = this.state.pos;
      } else if (_utilWhitespace.isNewLine(ch)) {
        out += this.input.slice(chunkStart, this.state.pos);
        ++this.state.pos;
        switch (ch) {
          case 13:
            if (this.input.charCodeAt(this.state.pos) === 10) ++this.state.pos;
          case 10:
            out += "\n";
            break;
          default:
            out += String.fromCharCode(ch);
            break;
        }
        ++this.state.curLine;
        this.state.lineStart = this.state.pos;
        chunkStart = this.state.pos;
      } else {
        ++this.state.pos;
      }
    }
  };

  // Used to read escaped characters

  Tokenizer.prototype.readEscapedChar = function readEscapedChar(inTemplate) {
    var ch = this.input.charCodeAt(++this.state.pos);
    ++this.state.pos;
    switch (ch) {
      case 110:
        return "\n"; // 'n' -> '\n'
      case 114:
        return "\r"; // 'r' -> '\r'
      case 120:
        return String.fromCharCode(this.readHexChar(2)); // 'x'
      case 117:
        return codePointToString(this.readCodePoint()); // 'u'
      case 116:
        return "\t"; // 't' -> '\t'
      case 98:
        return "\b"; // 'b' -> '\b'
      case 118:
        return "\u000b"; // 'v' -> '\u000b'
      case 102:
        return "\f"; // 'f' -> '\f'
      case 13:
        if (this.input.charCodeAt(this.state.pos) === 10) ++this.state.pos; // '\r\n'
      case 10:
        // ' \n'
        this.state.lineStart = this.state.pos;
        ++this.state.curLine;
        return "";
      default:
        if (ch >= 48 && ch <= 55) {
          var octalStr = this.input.substr(this.state.pos - 1, 3).match(/^[0-7]+/)[0];
          var octal = parseInt(octalStr, 8);
          if (octal > 255) {
            octalStr = octalStr.slice(0, -1);
            octal = parseInt(octalStr, 8);
          }
          if (octal > 0 && (this.strict || inTemplate)) {
            this.raise(this.state.pos - 2, "Octal literal in strict mode");
          }
          this.state.pos += octalStr.length - 1;
          return String.fromCharCode(octal);
        }
        return String.fromCharCode(ch);
    }
  };

  // Used to read character escape sequences ('\x', '\u', '\U').

  Tokenizer.prototype.readHexChar = function readHexChar(len) {
    var codePos = this.state.pos;
    var n = this.readInt(16, len);
    if (n === null) this.raise(codePos, "Bad character escape sequence");
    return n;
  };

  // Read an identifier, and return it as a string. Sets `this.state.containsEsc`
  // to whether the word contained a '\u' escape.
  //
  // Incrementally adds only escaped chars, adding other chunks as-is
  // as a micro-optimization.

  Tokenizer.prototype.readWord1 = function readWord1() {
    this.state.containsEsc = false;
    var word = "",
        first = true,
        chunkStart = this.state.pos;
    while (this.state.pos < this.input.length) {
      var ch = this.fullCharCodeAtPos();
      if (_utilIdentifier.isIdentifierChar(ch, true)) {
        this.state.pos += ch <= 0xffff ? 1 : 2;
      } else if (ch === 92) {
        // "\"
        this.state.containsEsc = true;

        word += this.input.slice(chunkStart, this.state.pos);
        var escStart = this.state.pos;

        if (this.input.charCodeAt(++this.state.pos) !== 117) {
          // "u"
          this.raise(this.state.pos, "Expecting Unicode escape sequence \\uXXXX");
        }

        ++this.state.pos;
        var esc = this.readCodePoint();
        if (!(first ? _utilIdentifier.isIdentifierStart : _utilIdentifier.isIdentifierChar)(esc, true)) {
          this.raise(escStart, "Invalid Unicode escape");
        }

        word += codePointToString(esc);
        chunkStart = this.state.pos;
      } else {
        break;
      }
      first = false;
    }
    return word + this.input.slice(chunkStart, this.state.pos);
  };

  // Read an identifier or keyword token. Will check for reserved
  // words when necessary.

  Tokenizer.prototype.readWord = function readWord() {
    var word = this.readWord1();
    var type = _types.types.name;
    if (!this.state.containsEsc && this.isKeyword(word)) type = _types.keywords[word];
    return this.finishToken(type, word);
  };

  Tokenizer.prototype.braceIsBlock = function braceIsBlock(prevType) {
    if (prevType === _types.types.colon) {
      var _parent = this.curContext();
      if (_parent === _context.types.b_stat || _parent === _context.types.b_expr) {
        return !_parent.isExpr;
      }
    }

    if (prevType === _types.types._return) {
      return _utilWhitespace.lineBreak.test(this.input.slice(this.state.lastTokEnd, this.state.start));
    }

    if (prevType === _types.types._else || prevType === _types.types.semi || prevType === _types.types.eof || prevType === _types.types.parenR) {
      return true;
    }

    if (prevType === _types.types.braceL) {
      return this.curContext() === _context.types.b_stat;
    }

    return !this.state.exprAllowed;
  };

  Tokenizer.prototype.updateContext = function updateContext(prevType) {
    var update = undefined,
        type = this.state.type;
    if (type.keyword && prevType === _types.types.dot) {
      this.state.exprAllowed = false;
    } else if (update = type.updateContext) {
      update.call(this, prevType);
    } else {
      this.state.exprAllowed = type.beforeExpr;
    }
  };

  return Tokenizer;
})();

exports["default"] = Tokenizer;
},{"../util/identifier":59,"../util/location":60,"../util/whitespace":61,"./context":55,"./state":57,"./types":58}],57:[function(require,module,exports){
"use strict";

exports.__esModule = true;
// istanbul ignore next

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _utilLocation = require("../util/location");

var _context = require("./context");

var _types = require("./types");

var State = (function () {
  function State() {
    _classCallCheck(this, State);
  }

  State.prototype.init = function init(input) {
    this.input = input;

    // Used to signify the start of a potential arrow function
    this.potentialArrowAt = -1;

    // Flags to track whether we are in a function, a generator.
    this.inFunction = this.inGenerator = false;

    // Labels in scope.
    this.labels = [];

    // Leading decorators.
    this.decorators = [];

    // Token store.
    this.tokens = [];

    // Comment store.
    this.comments = [];

    // Comment attachment store
    this.trailingComments = [];
    this.leadingComments = [];
    this.commentStack = [];

    // The current position of the tokenizer in the input.
    this.pos = this.lineStart = 0;
    this.curLine = 1;

    // Properties of the current token:
    // Its type
    this.type = _types.types.eof;
    // For tokens that include more information than their type, the value
    this.value = null;
    // Its start and end offset
    this.start = this.end = this.pos;
    // And, if locations are used, the {line, column} object
    // corresponding to those offsets
    this.startLoc = this.endLoc = this.curPosition();

    // Position information for the previous token
    this.lastTokEndLoc = this.lastTokStartLoc = null;
    this.lastTokStart = this.lastTokEnd = this.pos;

    // The context stack is used to superficially track syntactic
    // context to predict whether a regular expression is allowed in a
    // given position.
    this.context = [_context.types.b_stat];
    this.exprAllowed = true;

    // Used to signal to callers of `readWord1` whether the word
    // contained any escape sequences. This is needed because words with
    // escape sequences must not be interpreted as keywords.

    this.containsEsc = false;

    return this;
  };

  State.prototype.curPosition = function curPosition() {
    return new _utilLocation.Position(this.curLine, this.pos - this.lineStart);
  };

  State.prototype.clone = function clone() {
    var state = new State();
    for (var key in this) {
      var val = this[key];
      if (Array.isArray(val)) val = val.slice();
      state[key] = val;
    }
    return state;
  };

  return State;
})();

exports["default"] = State;
module.exports = exports["default"];
},{"../util/location":60,"./context":55,"./types":58}],58:[function(require,module,exports){
// ## Token types

// The assignment of fine-grained, information-carrying type objects
// allows the tokenizer to store the information it has about a
// token in a way that is very cheap for the parser to look up.

// All token type variables start with an underscore, to make them
// easy to recognize.

// The `beforeExpr` property is used to disambiguate between regular
// expressions and divisions. It is set on all token types that can
// be followed by an expression (thus, a slash after them would be a
// regular expression).
//
// `isLoop` marks a keyword as starting a loop, which is important
// to know when parsing a label, in order to allow or disallow
// continue jumps to that label.

"use strict";

exports.__esModule = true;
// istanbul ignore next

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TokenType = function TokenType(label) {
  var conf = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  _classCallCheck(this, TokenType);

  this.label = label;
  this.keyword = conf.keyword;
  this.beforeExpr = !!conf.beforeExpr;
  this.startsExpr = !!conf.startsExpr;
  this.rightAssociative = !!conf.rightAssociative;
  this.isLoop = !!conf.isLoop;
  this.isAssign = !!conf.isAssign;
  this.prefix = !!conf.prefix;
  this.postfix = !!conf.postfix;
  this.binop = conf.binop || null;
  this.updateContext = null;
};

exports.TokenType = TokenType;

function binop(name, prec) {
  return new TokenType(name, { beforeExpr: true, binop: prec });
}
var beforeExpr = { beforeExpr: true },
    startsExpr = { startsExpr: true };

var types = {
  num: new TokenType("num", startsExpr),
  regexp: new TokenType("regexp", startsExpr),
  string: new TokenType("string", startsExpr),
  name: new TokenType("name", startsExpr),
  eof: new TokenType("eof"),

  // Punctuation token types.
  bracketL: new TokenType("[", { beforeExpr: true, startsExpr: true }),
  bracketR: new TokenType("]"),
  braceL: new TokenType("{", { beforeExpr: true, startsExpr: true }),
  braceR: new TokenType("}"),
  parenL: new TokenType("(", { beforeExpr: true, startsExpr: true }),
  parenR: new TokenType(")"),
  comma: new TokenType(",", beforeExpr),
  semi: new TokenType(";", beforeExpr),
  colon: new TokenType(":", beforeExpr),
  doubleColon: new TokenType("::", beforeExpr),
  dot: new TokenType("."),
  question: new TokenType("?", beforeExpr),
  arrow: new TokenType("=>", beforeExpr),
  template: new TokenType("template"),
  ellipsis: new TokenType("...", beforeExpr),
  backQuote: new TokenType("`", startsExpr),
  dollarBraceL: new TokenType("${", { beforeExpr: true, startsExpr: true }),
  at: new TokenType("@"),

  // Operators. These carry several kinds of properties to help the
  // parser use them properly (the presence of these properties is
  // what categorizes them as operators).
  //
  // `binop`, when present, specifies that this operator is a binary
  // operator, and will refer to its precedence.
  //
  // `prefix` and `postfix` mark the operator as a prefix or postfix
  // unary operator.
  //
  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
  // binary operators with a very low precedence, that should result
  // in AssignmentExpression nodes.

  eq: new TokenType("=", { beforeExpr: true, isAssign: true }),
  assign: new TokenType("_=", { beforeExpr: true, isAssign: true }),
  incDec: new TokenType("++/--", { prefix: true, postfix: true, startsExpr: true }),
  prefix: new TokenType("prefix", { beforeExpr: true, prefix: true, startsExpr: true }),
  logicalOR: binop("||", 1),
  logicalAND: binop("&&", 2),
  bitwiseOR: binop("|", 3),
  bitwiseXOR: binop("^", 4),
  bitwiseAND: binop("&", 5),
  equality: binop("==/!=", 6),
  relational: binop("</>", 7),
  bitShift: binop("<</>>", 8),
  plusMin: new TokenType("+/-", { beforeExpr: true, binop: 9, prefix: true, startsExpr: true }),
  modulo: binop("%", 10),
  star: binop("*", 10),
  slash: binop("/", 10),
  exponent: new TokenType("**", { beforeExpr: true, binop: 11, rightAssociative: true })
};

exports.types = types;
// Map keyword names to token types.

var keywords = {};

exports.keywords = keywords;
// Succinct definitions of keyword token types
function kw(name) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  options.keyword = name;
  keywords[name] = types["_" + name] = new TokenType(name, options);
}

kw("break");
kw("case", beforeExpr);
kw("catch");
kw("continue");
kw("debugger");
kw("default", beforeExpr);
kw("do", { isLoop: true });
kw("else", beforeExpr);
kw("finally");
kw("for", { isLoop: true });
kw("function", startsExpr);
kw("if");
kw("return", beforeExpr);
kw("switch");
kw("throw", beforeExpr);
kw("try");
kw("var");
kw("let");
kw("const");
kw("while", { isLoop: true });
kw("with");
kw("new", { beforeExpr: true, startsExpr: true });
kw("this", startsExpr);
kw("super", startsExpr);
kw("class");
kw("extends", beforeExpr);
kw("export");
kw("import");
kw("yield", { beforeExpr: true, startsExpr: true });
kw("null", startsExpr);
kw("true", startsExpr);
kw("false", startsExpr);
kw("in", { beforeExpr: true, binop: 7 });
kw("instanceof", { beforeExpr: true, binop: 7 });
kw("typeof", { beforeExpr: true, prefix: true, startsExpr: true });
kw("void", { beforeExpr: true, prefix: true, startsExpr: true });
kw("delete", { beforeExpr: true, prefix: true, startsExpr: true });
},{}],59:[function(require,module,exports){
// This is a trick taken from Esprima. It turns out that, on
// non-Chrome browsers, to check whether a string is in a set, a
// predicate containing a big ugly `switch` statement is faster than
// a regular expression, and on Chrome the two are about on par.
// This function uses `eval` (non-lexical) to produce such a
// predicate from a space-separated string of words.
//
// It starts by sorting the words by length.

"use strict";

exports.__esModule = true;
exports.isIdentifierStart = isIdentifierStart;
exports.isIdentifierChar = isIdentifierChar;
function makePredicate(words) {
  words = words.split(" ");
  return function (str) {
    return words.indexOf(str) >= 0;
  };
}

// Reserved word lists for various dialects of the language

var reservedWords = {
  6: makePredicate("enum await"),
  strict: makePredicate("implements interface let package private protected public static yield"),
  strictBind: makePredicate("eval arguments")
};

exports.reservedWords = reservedWords;
// And the keywords

var isKeyword = makePredicate("break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this let const class extends export import yield super");

exports.isKeyword = isKeyword;
// ## Character categories

// Big ugly regular expressions that match characters in the
// whitespace, identifier, and identifier-start categories. These
// are only applied when a character is found to actually have a
// code point above 128.
// Generated by `tools/generate-identifier-regex.js`.

var nonASCIIidentifierStartChars = '';
var nonASCIIidentifierChars = '';

var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

nonASCIIidentifierStartChars = '';

// These are a run-length and offset encoded representation of the
// >0xffff code points that are a valid part of identifiers. The
// offset starts at 0x10000, and each pair of numbers represents an
// offset to the next range, and then a size of the range. They were
// generated by tools/generate-identifier-regex.js
var astralIdentifierStartCodes = [0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 17, 26, 6, 37, 11, 29, 3, 35, 5, 7, 2, 4, 43, 157, 99, 39, 9, 51, 157, 310, 10, 21, 11, 7, 153, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22, 11, 22, 10, 30, 98, 21, 11, 25, 71, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 26, 45, 28, 4, 28, 36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 955, 52, 76, 44, 33, 24, 27, 35, 42, 34, 4, 0, 13, 47, 15, 3, 22, 0, 38, 17, 2, 24, 133, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2, 4, 4, 0, 32, 4, 287, 47, 21, 1, 2, 0, 185, 46, 82, 47, 21, 0, 60, 42, 502, 63, 32, 0, 449, 56, 1288, 920, 104, 110, 2962, 1070, 13266, 568, 8, 30, 114, 29, 19, 47, 17, 3, 32, 20, 6, 18, 881, 68, 12, 0, 67, 12, 16481, 1, 3071, 106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7, 4149, 196, 1340, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16, 4421, 42710, 42, 4148, 12, 221, 16355, 541];
var astralIdentifierCodes = [509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 1306, 2, 54, 14, 32, 9, 16, 3, 46, 10, 54, 9, 7, 2, 37, 13, 2, 9, 52, 0, 13, 2, 49, 13, 16, 9, 83, 11, 168, 11, 6, 9, 8, 2, 57, 0, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 316, 19, 13, 9, 214, 6, 3, 8, 112, 16, 16, 9, 82, 12, 9, 9, 535, 9, 20855, 9, 135, 4, 60, 6, 26, 9, 1016, 45, 17, 3, 19723, 1, 5319, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 1418, 49, 4305, 6, 792618, 239];

// This has a complexity linear to the value of the code. The
// assumption is that looking up astral identifier characters is
// rare.
function isInAstralSet(code, set) {
  var pos = 0x10000;
  for (var i = 0; i < set.length; i += 2) {
    pos += set[i];
    if (pos > code) return false;

    pos += set[i + 1];
    if (pos >= code) return true;
  }
}

// Test whether a given character code starts an identifier.

function isIdentifierStart(code) {
  if (code < 65) return code === 36;
  if (code < 91) return true;
  if (code < 97) return code === 95;
  if (code < 123) return true;
  if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
  return isInAstralSet(code, astralIdentifierStartCodes);
}

// Test whether a given character is part of an identifier.

function isIdentifierChar(code) {
  if (code < 48) return code === 36;
  if (code < 58) return true;
  if (code < 65) return false;
  if (code < 91) return true;
  if (code < 97) return code === 95;
  if (code < 123) return true;
  if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
  return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes);
}
},{}],60:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.getLineInfo = getLineInfo;
// istanbul ignore next

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _whitespace = require("./whitespace");

// These are used when `options.locations` is on, for the
// `startLoc` and `endLoc` properties.

var Position = function Position(line, col) {
  _classCallCheck(this, Position);

  this.line = line;
  this.column = col;
};

exports.Position = Position;

var SourceLocation = function SourceLocation(start, end) {
  _classCallCheck(this, SourceLocation);

  this.start = start;
  this.end = end;
}

// The `getLineInfo` function is mostly useful when the
// `locations` option is off (for performance reasons) and you
// want to find the line/column position for a given character
// offset. `input` should be the code string that the offset refers
// into.

;

exports.SourceLocation = SourceLocation;

function getLineInfo(input, offset) {
  for (var line = 1, cur = 0;;) {
    _whitespace.lineBreakG.lastIndex = cur;
    var match = _whitespace.lineBreakG.exec(input);
    if (match && match.index < offset) {
      ++line;
      cur = match.index + match[0].length;
    } else {
      return new Position(line, offset - cur);
    }
  }
}
},{"./whitespace":61}],61:[function(require,module,exports){
// Matches a whole line break (where CRLF is considered a single
// line break). Used to count lines.

"use strict";

exports.__esModule = true;
exports.isNewLine = isNewLine;
var lineBreak = /\r\n?|\n|\u2028|\u2029/;
exports.lineBreak = lineBreak;
var lineBreakG = new RegExp(lineBreak.source, "g");

exports.lineBreakG = lineBreakG;

function isNewLine(code) {
  return code === 10 || code === 13 || code === 0x2028 || code === 0x2029;
}

var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
exports.nonASCIIwhitespace = nonASCIIwhitespace;
},{}],62:[function(require,module,exports){
(function (process){
'use strict';
var escapeStringRegexp = require('escape-string-regexp');
var ansiStyles = require('ansi-styles');
var stripAnsi = require('strip-ansi');
var hasAnsi = require('has-ansi');
var supportsColor = require('supports-color');
var defineProps = Object.defineProperties;
var isSimpleWindowsTerm = process.platform === 'win32' && !/^xterm/i.test(process.env.TERM);

function Chalk(options) {
	// detect mode if not set manually
	this.enabled = !options || options.enabled === undefined ? supportsColor : options.enabled;
}

// use bright blue on Windows as the normal blue color is illegible
if (isSimpleWindowsTerm) {
	ansiStyles.blue.open = '\u001b[94m';
}

var styles = (function () {
	var ret = {};

	Object.keys(ansiStyles).forEach(function (key) {
		ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');

		ret[key] = {
			get: function () {
				return build.call(this, this._styles.concat(key));
			}
		};
	});

	return ret;
})();

var proto = defineProps(function chalk() {}, styles);

function build(_styles) {
	var builder = function () {
		return applyStyle.apply(builder, arguments);
	};

	builder._styles = _styles;
	builder.enabled = this.enabled;
	// __proto__ is used because we must return a function, but there is
	// no way to create a function with a different prototype.
	/* eslint-disable no-proto */
	builder.__proto__ = proto;

	return builder;
}

function applyStyle() {
	// support varags, but simply cast to string in case there's only one arg
	var args = arguments;
	var argsLen = args.length;
	var str = argsLen !== 0 && String(arguments[0]);

	if (argsLen > 1) {
		// don't slice `arguments`, it prevents v8 optimizations
		for (var a = 1; a < argsLen; a++) {
			str += ' ' + args[a];
		}
	}

	if (!this.enabled || !str) {
		return str;
	}

	var nestedStyles = this._styles;
	var i = nestedStyles.length;

	// Turns out that on Windows dimmed gray text becomes invisible in cmd.exe,
	// see https://github.com/chalk/chalk/issues/58
	// If we're on Windows and we're dealing with a gray color, temporarily make 'dim' a noop.
	var originalDim = ansiStyles.dim.open;
	if (isSimpleWindowsTerm && (nestedStyles.indexOf('gray') !== -1 || nestedStyles.indexOf('grey') !== -1)) {
		ansiStyles.dim.open = '';
	}

	while (i--) {
		var code = ansiStyles[nestedStyles[i]];

		// Replace any instances already present with a re-opening code
		// otherwise only the part of the string until said closing code
		// will be colored, and the rest will simply be 'plain'.
		str = code.open + str.replace(code.closeRe, code.open) + code.close;
	}

	// Reset the original 'dim' if we changed it to work around the Windows dimmed gray issue.
	ansiStyles.dim.open = originalDim;

	return str;
}

function init() {
	var ret = {};

	Object.keys(styles).forEach(function (name) {
		ret[name] = {
			get: function () {
				return build.call(this, [name]);
			}
		};
	});

	return ret;
}

defineProps(Chalk.prototype, init());

module.exports = new Chalk();
module.exports.styles = ansiStyles;
module.exports.hasColor = hasAnsi;
module.exports.stripColor = stripAnsi;
module.exports.supportsColor = supportsColor;

}).call(this,require('_process'))
},{"_process":191,"ansi-styles":63,"escape-string-regexp":64,"has-ansi":65,"strip-ansi":67,"supports-color":69}],63:[function(require,module,exports){
'use strict';

function assembleStyles () {
	var styles = {
		modifiers: {
			reset: [0, 0],
			bold: [1, 22], // 21 isn't widely supported and 22 does the same thing
			dim: [2, 22],
			italic: [3, 23],
			underline: [4, 24],
			inverse: [7, 27],
			hidden: [8, 28],
			strikethrough: [9, 29]
		},
		colors: {
			black: [30, 39],
			red: [31, 39],
			green: [32, 39],
			yellow: [33, 39],
			blue: [34, 39],
			magenta: [35, 39],
			cyan: [36, 39],
			white: [37, 39],
			gray: [90, 39]
		},
		bgColors: {
			bgBlack: [40, 49],
			bgRed: [41, 49],
			bgGreen: [42, 49],
			bgYellow: [43, 49],
			bgBlue: [44, 49],
			bgMagenta: [45, 49],
			bgCyan: [46, 49],
			bgWhite: [47, 49]
		}
	};

	// fix humans
	styles.colors.grey = styles.colors.gray;

	Object.keys(styles).forEach(function (groupName) {
		var group = styles[groupName];

		Object.keys(group).forEach(function (styleName) {
			var style = group[styleName];

			styles[styleName] = group[styleName] = {
				open: '\u001b[' + style[0] + 'm',
				close: '\u001b[' + style[1] + 'm'
			};
		});

		Object.defineProperty(styles, groupName, {
			value: group,
			enumerable: false
		});
	});

	return styles;
}

Object.defineProperty(module, 'exports', {
	enumerable: true,
	get: assembleStyles
});

},{}],64:[function(require,module,exports){
'use strict';

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

module.exports = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return str.replace(matchOperatorsRe,  '\\$&');
};

},{}],65:[function(require,module,exports){
'use strict';
var ansiRegex = require('ansi-regex');
var re = new RegExp(ansiRegex().source); // remove the `g` flag
module.exports = re.test.bind(re);

},{"ansi-regex":66}],66:[function(require,module,exports){
'use strict';
module.exports = function () {
	return /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
};

},{}],67:[function(require,module,exports){
'use strict';
var ansiRegex = require('ansi-regex')();

module.exports = function (str) {
	return typeof str === 'string' ? str.replace(ansiRegex, '') : str;
};

},{"ansi-regex":68}],68:[function(require,module,exports){
arguments[4][66][0].apply(exports,arguments)
},{"dup":66}],69:[function(require,module,exports){
(function (process){
'use strict';
var argv = process.argv;

var terminator = argv.indexOf('--');
var hasFlag = function (flag) {
	flag = '--' + flag;
	var pos = argv.indexOf(flag);
	return pos !== -1 && (terminator !== -1 ? pos < terminator : true);
};

module.exports = (function () {
	if ('FORCE_COLOR' in process.env) {
		return true;
	}

	if (hasFlag('no-color') ||
		hasFlag('no-colors') ||
		hasFlag('color=false')) {
		return false;
	}

	if (hasFlag('color') ||
		hasFlag('colors') ||
		hasFlag('color=true') ||
		hasFlag('color=always')) {
		return true;
	}

	if (process.stdout && !process.stdout.isTTY) {
		return false;
	}

	if (process.platform === 'win32') {
		return true;
	}

	if ('COLORTERM' in process.env) {
		return true;
	}

	if (process.env.TERM === 'dumb') {
		return false;
	}

	if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM)) {
		return true;
	}

	return false;
})();

}).call(this,require('_process'))
},{"_process":191}],70:[function(require,module,exports){
/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS'
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
    'use strict';

    function isExpression(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'ArrayExpression':
            case 'AssignmentExpression':
            case 'BinaryExpression':
            case 'CallExpression':
            case 'ConditionalExpression':
            case 'FunctionExpression':
            case 'Identifier':
            case 'Literal':
            case 'LogicalExpression':
            case 'MemberExpression':
            case 'NewExpression':
            case 'ObjectExpression':
            case 'SequenceExpression':
            case 'ThisExpression':
            case 'UnaryExpression':
            case 'UpdateExpression':
                return true;
        }
        return false;
    }

    function isIterationStatement(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'DoWhileStatement':
            case 'ForInStatement':
            case 'ForStatement':
            case 'WhileStatement':
                return true;
        }
        return false;
    }

    function isStatement(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'BlockStatement':
            case 'BreakStatement':
            case 'ContinueStatement':
            case 'DebuggerStatement':
            case 'DoWhileStatement':
            case 'EmptyStatement':
            case 'ExpressionStatement':
            case 'ForInStatement':
            case 'ForStatement':
            case 'IfStatement':
            case 'LabeledStatement':
            case 'ReturnStatement':
            case 'SwitchStatement':
            case 'ThrowStatement':
            case 'TryStatement':
            case 'VariableDeclaration':
            case 'WhileStatement':
            case 'WithStatement':
                return true;
        }
        return false;
    }

    function isSourceElement(node) {
      return isStatement(node) || node != null && node.type === 'FunctionDeclaration';
    }

    function trailingStatement(node) {
        switch (node.type) {
        case 'IfStatement':
            if (node.alternate != null) {
                return node.alternate;
            }
            return node.consequent;

        case 'LabeledStatement':
        case 'ForStatement':
        case 'ForInStatement':
        case 'WhileStatement':
        case 'WithStatement':
            return node.body;
        }
        return null;
    }

    function isProblematicIfStatement(node) {
        var current;

        if (node.type !== 'IfStatement') {
            return false;
        }
        if (node.alternate == null) {
            return false;
        }
        current = node.consequent;
        do {
            if (current.type === 'IfStatement') {
                if (current.alternate == null)  {
                    return true;
                }
            }
            current = trailingStatement(current);
        } while (current);

        return false;
    }

    module.exports = {
        isExpression: isExpression,
        isStatement: isStatement,
        isIterationStatement: isIterationStatement,
        isSourceElement: isSourceElement,
        isProblematicIfStatement: isProblematicIfStatement,

        trailingStatement: trailingStatement
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */

},{}],71:[function(require,module,exports){
/*
  Copyright (C) 2013-2014 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2014 Ivan Nikulin <ifaaan@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
    'use strict';

    var ES6Regex, ES5Regex, NON_ASCII_WHITESPACES, IDENTIFIER_START, IDENTIFIER_PART, ch;

    // See `tools/generate-identifier-regex.js`.
    ES5Regex = {
        // ECMAScript 5.1/Unicode v7.0.0 NonAsciiIdentifierStart:
        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
        // ECMAScript 5.1/Unicode v7.0.0 NonAsciiIdentifierPart:
        NonAsciiIdentifierPart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/
    };

    ES6Regex = {
        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierStart:
        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDE00-\uDE11\uDE13-\uDE2B\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDE00-\uDE2F\uDE44\uDE80-\uDEAA]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]/,
        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierPart:
        NonAsciiIdentifierPart: /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDD0-\uDDDA\uDE00-\uDE11\uDE13-\uDE37\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF01-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
    };

    function isDecimalDigit(ch) {
        return 0x30 <= ch && ch <= 0x39;  // 0..9
    }

    function isHexDigit(ch) {
        return 0x30 <= ch && ch <= 0x39 ||  // 0..9
            0x61 <= ch && ch <= 0x66 ||     // a..f
            0x41 <= ch && ch <= 0x46;       // A..F
    }

    function isOctalDigit(ch) {
        return ch >= 0x30 && ch <= 0x37;  // 0..7
    }

    // 7.2 White Space

    NON_ASCII_WHITESPACES = [
        0x1680, 0x180E,
        0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A,
        0x202F, 0x205F,
        0x3000,
        0xFEFF
    ];

    function isWhiteSpace(ch) {
        return ch === 0x20 || ch === 0x09 || ch === 0x0B || ch === 0x0C || ch === 0xA0 ||
            ch >= 0x1680 && NON_ASCII_WHITESPACES.indexOf(ch) >= 0;
    }

    // 7.3 Line Terminators

    function isLineTerminator(ch) {
        return ch === 0x0A || ch === 0x0D || ch === 0x2028 || ch === 0x2029;
    }

    // 7.6 Identifier Names and Identifiers

    function fromCodePoint(cp) {
        if (cp <= 0xFFFF) { return String.fromCharCode(cp); }
        var cu1 = String.fromCharCode(Math.floor((cp - 0x10000) / 0x400) + 0xD800);
        var cu2 = String.fromCharCode(((cp - 0x10000) % 0x400) + 0xDC00);
        return cu1 + cu2;
    }

    IDENTIFIER_START = new Array(0x80);
    for(ch = 0; ch < 0x80; ++ch) {
        IDENTIFIER_START[ch] =
            ch >= 0x61 && ch <= 0x7A ||  // a..z
            ch >= 0x41 && ch <= 0x5A ||  // A..Z
            ch === 0x24 || ch === 0x5F;  // $ (dollar) and _ (underscore)
    }

    IDENTIFIER_PART = new Array(0x80);
    for(ch = 0; ch < 0x80; ++ch) {
        IDENTIFIER_PART[ch] =
            ch >= 0x61 && ch <= 0x7A ||  // a..z
            ch >= 0x41 && ch <= 0x5A ||  // A..Z
            ch >= 0x30 && ch <= 0x39 ||  // 0..9
            ch === 0x24 || ch === 0x5F;  // $ (dollar) and _ (underscore)
    }

    function isIdentifierStartES5(ch) {
        return ch < 0x80 ? IDENTIFIER_START[ch] : ES5Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch));
    }

    function isIdentifierPartES5(ch) {
        return ch < 0x80 ? IDENTIFIER_PART[ch] : ES5Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch));
    }

    function isIdentifierStartES6(ch) {
        return ch < 0x80 ? IDENTIFIER_START[ch] : ES6Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch));
    }

    function isIdentifierPartES6(ch) {
        return ch < 0x80 ? IDENTIFIER_PART[ch] : ES6Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch));
    }

    module.exports = {
        isDecimalDigit: isDecimalDigit,
        isHexDigit: isHexDigit,
        isOctalDigit: isOctalDigit,
        isWhiteSpace: isWhiteSpace,
        isLineTerminator: isLineTerminator,
        isIdentifierStartES5: isIdentifierStartES5,
        isIdentifierPartES5: isIdentifierPartES5,
        isIdentifierStartES6: isIdentifierStartES6,
        isIdentifierPartES6: isIdentifierPartES6
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */

},{}],72:[function(require,module,exports){
/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
    'use strict';

    var code = require('./code');

    function isStrictModeReservedWordES6(id) {
        switch (id) {
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'let':
            return true;
        default:
            return false;
        }
    }

    function isKeywordES5(id, strict) {
        // yield should not be treated as keyword under non-strict mode.
        if (!strict && id === 'yield') {
            return false;
        }
        return isKeywordES6(id, strict);
    }

    function isKeywordES6(id, strict) {
        if (strict && isStrictModeReservedWordES6(id)) {
            return true;
        }

        switch (id.length) {
        case 2:
            return (id === 'if') || (id === 'in') || (id === 'do');
        case 3:
            return (id === 'var') || (id === 'for') || (id === 'new') || (id === 'try');
        case 4:
            return (id === 'this') || (id === 'else') || (id === 'case') ||
                (id === 'void') || (id === 'with') || (id === 'enum');
        case 5:
            return (id === 'while') || (id === 'break') || (id === 'catch') ||
                (id === 'throw') || (id === 'const') || (id === 'yield') ||
                (id === 'class') || (id === 'super');
        case 6:
            return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
                (id === 'switch') || (id === 'export') || (id === 'import');
        case 7:
            return (id === 'default') || (id === 'finally') || (id === 'extends');
        case 8:
            return (id === 'function') || (id === 'continue') || (id === 'debugger');
        case 10:
            return (id === 'instanceof');
        default:
            return false;
        }
    }

    function isReservedWordES5(id, strict) {
        return id === 'null' || id === 'true' || id === 'false' || isKeywordES5(id, strict);
    }

    function isReservedWordES6(id, strict) {
        return id === 'null' || id === 'true' || id === 'false' || isKeywordES6(id, strict);
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    function isIdentifierNameES5(id) {
        var i, iz, ch;

        if (id.length === 0) { return false; }

        ch = id.charCodeAt(0);
        if (!code.isIdentifierStartES5(ch)) {
            return false;
        }

        for (i = 1, iz = id.length; i < iz; ++i) {
            ch = id.charCodeAt(i);
            if (!code.isIdentifierPartES5(ch)) {
                return false;
            }
        }
        return true;
    }

    function decodeUtf16(lead, trail) {
        return (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
    }

    function isIdentifierNameES6(id) {
        var i, iz, ch, lowCh, check;

        if (id.length === 0) { return false; }

        check = code.isIdentifierStartES6;
        for (i = 0, iz = id.length; i < iz; ++i) {
            ch = id.charCodeAt(i);
            if (0xD800 <= ch && ch <= 0xDBFF) {
                ++i;
                if (i >= iz) { return false; }
                lowCh = id.charCodeAt(i);
                if (!(0xDC00 <= lowCh && lowCh <= 0xDFFF)) {
                    return false;
                }
                ch = decodeUtf16(ch, lowCh);
            }
            if (!check(ch)) {
                return false;
            }
            check = code.isIdentifierPartES6;
        }
        return true;
    }

    function isIdentifierES5(id, strict) {
        return isIdentifierNameES5(id) && !isReservedWordES5(id, strict);
    }

    function isIdentifierES6(id, strict) {
        return isIdentifierNameES6(id) && !isReservedWordES6(id, strict);
    }

    module.exports = {
        isKeywordES5: isKeywordES5,
        isKeywordES6: isKeywordES6,
        isReservedWordES5: isReservedWordES5,
        isReservedWordES6: isReservedWordES6,
        isRestrictedWord: isRestrictedWord,
        isIdentifierNameES5: isIdentifierNameES5,
        isIdentifierNameES6: isIdentifierNameES6,
        isIdentifierES5: isIdentifierES5,
        isIdentifierES6: isIdentifierES6
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */

},{"./code":71}],73:[function(require,module,exports){
/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


(function () {
    'use strict';

    exports.ast = require('./ast');
    exports.code = require('./code');
    exports.keyword = require('./keyword');
}());
/* vim: set sw=4 ts=4 et tw=80 : */

},{"./ast":70,"./code":71,"./keyword":72}],74:[function(require,module,exports){
module.exports={
	"builtin": {
		"Array": false,
		"ArrayBuffer": false,
		"Boolean": false,
		"constructor": false,
		"Date": false,
		"decodeURI": false,
		"decodeURIComponent": false,
		"encodeURI": false,
		"encodeURIComponent": false,
		"Error": false,
		"eval": false,
		"EvalError": false,
		"Float32Array": false,
		"Float64Array": false,
		"Function": false,
		"hasOwnProperty": false,
		"Infinity": false,
		"Int16Array": false,
		"Int32Array": false,
		"Int8Array": false,
		"isFinite": false,
		"isNaN": false,
		"isPrototypeOf": false,
		"JSON": false,
		"Map": false,
		"Math": false,
		"NaN": false,
		"Number": false,
		"Object": false,
		"parseFloat": false,
		"parseInt": false,
		"Promise": false,
		"propertyIsEnumerable": false,
		"Proxy": false,
		"RangeError": false,
		"ReferenceError": false,
		"Reflect": false,
		"RegExp": false,
		"Set": false,
		"String": false,
		"Symbol": false,
		"SyntaxError": false,
		"System": false,
		"toLocaleString": false,
		"toString": false,
		"TypeError": false,
		"Uint16Array": false,
		"Uint32Array": false,
		"Uint8Array": false,
		"Uint8ClampedArray": false,
		"undefined": false,
		"URIError": false,
		"valueOf": false,
		"WeakMap": false,
		"WeakSet": false
	},
	"nonstandard": {
		"escape": false,
		"unescape": false
	},
	"browser": {
		"addEventListener": false,
		"alert": false,
		"applicationCache": false,
		"atob": false,
		"Audio": false,
		"AudioProcessingEvent": false,
		"BeforeUnloadEvent": false,
		"Blob": false,
		"blur": false,
		"btoa": false,
		"cancelAnimationFrame": false,
		"CanvasGradient": false,
		"CanvasPattern": false,
		"CanvasRenderingContext2D": false,
		"clearInterval": false,
		"clearTimeout": false,
		"close": false,
		"closed": false,
		"CloseEvent": false,
		"Comment": false,
		"CompositionEvent": false,
		"confirm": false,
		"console": false,
		"crypto": false,
		"CSS": false,
		"CustomEvent": false,
		"DataView": false,
		"Debug": false,
		"defaultStatus": false,
		"devicePixelRatio": false,
		"dispatchEvent": false,
		"document": false,
		"Document": false,
		"DocumentFragment": false,
		"DOMParser": false,
		"DragEvent": false,
		"Element": false,
		"ElementTimeControl": false,
		"ErrorEvent": false,
		"event": false,
		"Event": false,
		"FileReader": false,
		"fetch": false,
		"find": false,
		"focus": false,
		"FocusEvent": false,
		"FormData": false,
		"frameElement": false,
		"frames": false,
		"GamepadEvent": false,
		"getComputedStyle": false,
		"getSelection": false,
		"HashChangeEvent": false,
		"Headers": false,
		"history": false,
		"HTMLAnchorElement": false,
		"HTMLBaseElement": false,
		"HTMLBlockquoteElement": false,
		"HTMLBodyElement": false,
		"HTMLBRElement": false,
		"HTMLButtonElement": false,
		"HTMLCanvasElement": false,
		"HTMLDirectoryElement": false,
		"HTMLDivElement": false,
		"HTMLDListElement": false,
		"HTMLElement": false,
		"HTMLFieldSetElement": false,
		"HTMLFontElement": false,
		"HTMLFormElement": false,
		"HTMLFrameElement": false,
		"HTMLFrameSetElement": false,
		"HTMLHeadElement": false,
		"HTMLHeadingElement": false,
		"HTMLHRElement": false,
		"HTMLHtmlElement": false,
		"HTMLIFrameElement": false,
		"HTMLImageElement": false,
		"HTMLInputElement": false,
		"HTMLIsIndexElement": false,
		"HTMLLabelElement": false,
		"HTMLLayerElement": false,
		"HTMLLegendElement": false,
		"HTMLLIElement": false,
		"HTMLLinkElement": false,
		"HTMLMapElement": false,
		"HTMLMenuElement": false,
		"HTMLMetaElement": false,
		"HTMLModElement": false,
		"HTMLObjectElement": false,
		"HTMLOListElement": false,
		"HTMLOptGroupElement": false,
		"HTMLOptionElement": false,
		"HTMLParagraphElement": false,
		"HTMLParamElement": false,
		"HTMLPreElement": false,
		"HTMLQuoteElement": false,
		"HTMLScriptElement": false,
		"HTMLSelectElement": false,
		"HTMLStyleElement": false,
		"HTMLTableCaptionElement": false,
		"HTMLTableCellElement": false,
		"HTMLTableColElement": false,
		"HTMLTableElement": false,
		"HTMLTableRowElement": false,
		"HTMLTableSectionElement": false,
		"HTMLTextAreaElement": false,
		"HTMLTitleElement": false,
		"HTMLUListElement": false,
		"HTMLVideoElement": false,
		"IDBCursor": false,
		"IDBCursorWithValue": false,
		"IDBDatabase": false,
		"IDBEnvironment": false,
		"IDBFactory": false,
		"IDBIndex": false,
		"IDBKeyRange": false,
		"IDBObjectStore": false,
		"IDBOpenDBRequest": false,
		"IDBRequest": false,
		"IDBTransaction": false,
		"IDBVersionChangeEvent": false,
		"Image": false,
		"indexedDB": false,
		"innerHeight": false,
		"innerWidth": false,
		"InputEvent": false,
		"Intl": false,
		"KeyboardEvent": false,
		"length": false,
		"localStorage": false,
		"location": false,
		"matchMedia": false,
		"MessageChannel": false,
		"MessageEvent": false,
		"MessagePort": false,
		"MouseEvent": false,
		"moveBy": false,
		"moveTo": false,
		"MutationObserver": false,
		"name": false,
		"navigator": false,
		"Node": false,
		"NodeFilter": false,
		"NodeList": false,
		"Notification": false,
		"OfflineAudioCompletionEvent": false,
		"onbeforeunload": true,
		"onblur": true,
		"onerror": true,
		"onfocus": true,
		"onload": true,
		"onresize": true,
		"onunload": true,
		"open": false,
		"openDatabase": false,
		"opener": false,
		"opera": false,
		"Option": false,
		"outerHeight": false,
		"outerWidth": false,
		"PageTransitionEvent": false,
		"pageXOffset": false,
		"pageYOffset": false,
		"parent": false,
		"PopStateEvent": false,
		"postMessage": false,
		"print": false,
		"ProgressEvent": false,
		"prompt": false,
		"Range": false,
		"Request": false,
		"Response": false,
		"removeEventListener": false,
		"requestAnimationFrame": false,
		"resizeBy": false,
		"resizeTo": false,
		"screen": false,
		"screenX": false,
		"screenY": false,
		"scroll": false,
		"scrollbars": false,
		"scrollBy": false,
		"scrollTo": false,
		"scrollX": false,
		"scrollY": false,
		"self": false,
		"sessionStorage": false,
		"setInterval": false,
		"setTimeout": false,
		"SharedWorker": false,
		"showModalDialog": false,
		"status": false,
		"stop": false,
		"StorageEvent": false,
		"SVGAElement": false,
		"SVGAltGlyphDefElement": false,
		"SVGAltGlyphElement": false,
		"SVGAltGlyphItemElement": false,
		"SVGAngle": false,
		"SVGAnimateColorElement": false,
		"SVGAnimatedAngle": false,
		"SVGAnimatedBoolean": false,
		"SVGAnimatedEnumeration": false,
		"SVGAnimatedInteger": false,
		"SVGAnimatedLength": false,
		"SVGAnimatedLengthList": false,
		"SVGAnimatedNumber": false,
		"SVGAnimatedNumberList": false,
		"SVGAnimatedPathData": false,
		"SVGAnimatedPoints": false,
		"SVGAnimatedPreserveAspectRatio": false,
		"SVGAnimatedRect": false,
		"SVGAnimatedString": false,
		"SVGAnimatedTransformList": false,
		"SVGAnimateElement": false,
		"SVGAnimateMotionElement": false,
		"SVGAnimateTransformElement": false,
		"SVGAnimationElement": false,
		"SVGCircleElement": false,
		"SVGClipPathElement": false,
		"SVGColor": false,
		"SVGColorProfileElement": false,
		"SVGColorProfileRule": false,
		"SVGComponentTransferFunctionElement": false,
		"SVGCSSRule": false,
		"SVGCursorElement": false,
		"SVGDefsElement": false,
		"SVGDescElement": false,
		"SVGDocument": false,
		"SVGElement": false,
		"SVGElementInstance": false,
		"SVGElementInstanceList": false,
		"SVGEllipseElement": false,
		"SVGEvent": false,
		"SVGExternalResourcesRequired": false,
		"SVGFEBlendElement": false,
		"SVGFEColorMatrixElement": false,
		"SVGFEComponentTransferElement": false,
		"SVGFECompositeElement": false,
		"SVGFEConvolveMatrixElement": false,
		"SVGFEDiffuseLightingElement": false,
		"SVGFEDisplacementMapElement": false,
		"SVGFEDistantLightElement": false,
		"SVGFEFloodElement": false,
		"SVGFEFuncAElement": false,
		"SVGFEFuncBElement": false,
		"SVGFEFuncGElement": false,
		"SVGFEFuncRElement": false,
		"SVGFEGaussianBlurElement": false,
		"SVGFEImageElement": false,
		"SVGFEMergeElement": false,
		"SVGFEMergeNodeElement": false,
		"SVGFEMorphologyElement": false,
		"SVGFEOffsetElement": false,
		"SVGFEPointLightElement": false,
		"SVGFESpecularLightingElement": false,
		"SVGFESpotLightElement": false,
		"SVGFETileElement": false,
		"SVGFETurbulenceElement": false,
		"SVGFilterElement": false,
		"SVGFilterPrimitiveStandardAttributes": false,
		"SVGFitToViewBox": false,
		"SVGFontElement": false,
		"SVGFontFaceElement": false,
		"SVGFontFaceFormatElement": false,
		"SVGFontFaceNameElement": false,
		"SVGFontFaceSrcElement": false,
		"SVGFontFaceUriElement": false,
		"SVGForeignObjectElement": false,
		"SVGGElement": false,
		"SVGGlyphElement": false,
		"SVGGlyphRefElement": false,
		"SVGGradientElement": false,
		"SVGHKernElement": false,
		"SVGICCColor": false,
		"SVGImageElement": false,
		"SVGLangSpace": false,
		"SVGLength": false,
		"SVGLengthList": false,
		"SVGLinearGradientElement": false,
		"SVGLineElement": false,
		"SVGLocatable": false,
		"SVGMarkerElement": false,
		"SVGMaskElement": false,
		"SVGMatrix": false,
		"SVGMetadataElement": false,
		"SVGMissingGlyphElement": false,
		"SVGMPathElement": false,
		"SVGNumber": false,
		"SVGNumberList": false,
		"SVGPaint": false,
		"SVGPathElement": false,
		"SVGPathSeg": false,
		"SVGPathSegArcAbs": false,
		"SVGPathSegArcRel": false,
		"SVGPathSegClosePath": false,
		"SVGPathSegCurvetoCubicAbs": false,
		"SVGPathSegCurvetoCubicRel": false,
		"SVGPathSegCurvetoCubicSmoothAbs": false,
		"SVGPathSegCurvetoCubicSmoothRel": false,
		"SVGPathSegCurvetoQuadraticAbs": false,
		"SVGPathSegCurvetoQuadraticRel": false,
		"SVGPathSegCurvetoQuadraticSmoothAbs": false,
		"SVGPathSegCurvetoQuadraticSmoothRel": false,
		"SVGPathSegLinetoAbs": false,
		"SVGPathSegLinetoHorizontalAbs": false,
		"SVGPathSegLinetoHorizontalRel": false,
		"SVGPathSegLinetoRel": false,
		"SVGPathSegLinetoVerticalAbs": false,
		"SVGPathSegLinetoVerticalRel": false,
		"SVGPathSegList": false,
		"SVGPathSegMovetoAbs": false,
		"SVGPathSegMovetoRel": false,
		"SVGPatternElement": false,
		"SVGPoint": false,
		"SVGPointList": false,
		"SVGPolygonElement": false,
		"SVGPolylineElement": false,
		"SVGPreserveAspectRatio": false,
		"SVGRadialGradientElement": false,
		"SVGRect": false,
		"SVGRectElement": false,
		"SVGRenderingIntent": false,
		"SVGScriptElement": false,
		"SVGSetElement": false,
		"SVGStopElement": false,
		"SVGStringList": false,
		"SVGStylable": false,
		"SVGStyleElement": false,
		"SVGSVGElement": false,
		"SVGSwitchElement": false,
		"SVGSymbolElement": false,
		"SVGTests": false,
		"SVGTextContentElement": false,
		"SVGTextElement": false,
		"SVGTextPathElement": false,
		"SVGTextPositioningElement": false,
		"SVGTitleElement": false,
		"SVGTransform": false,
		"SVGTransformable": false,
		"SVGTransformList": false,
		"SVGTRefElement": false,
		"SVGTSpanElement": false,
		"SVGUnitTypes": false,
		"SVGURIReference": false,
		"SVGUseElement": false,
		"SVGViewElement": false,
		"SVGViewSpec": false,
		"SVGVKernElement": false,
		"SVGZoomAndPan": false,
		"Text": false,
		"TextDecoder": false,
		"TextEncoder": false,
		"TimeEvent": false,
		"top": false,
		"TouchEvent": false,
		"UIEvent": false,
		"URL": false,
		"WebGLActiveInfo": false,
		"WebGLBuffer": false,
		"WebGLContextEvent": false,
		"WebGLFramebuffer": false,
		"WebGLProgram": false,
		"WebGLRenderbuffer": false,
		"WebGLRenderingContext": false,
		"WebGLShader": false,
		"WebGLShaderPrecisionFormat": false,
		"WebGLTexture": false,
		"WebGLUniformLocation": false,
		"WebSocket": false,
		"WheelEvent": false,
		"window": false,
		"Window": false,
		"Worker": false,
		"XDomainRequest": false,
		"XMLHttpRequest": false,
		"XMLSerializer": false,
		"XPathEvaluator": false,
		"XPathException": false,
		"XPathExpression": false,
		"XPathNamespace": false,
		"XPathNSResolver": false,
		"XPathResult": false
	},
	"worker": {
		"importScripts": true,
		"postMessage": true,
		"self": true
	},
	"node": {
		"__dirname": false,
		"__filename": false,
		"arguments": false,
		"Buffer": false,
		"clearImmediate": false,
		"clearInterval": false,
		"clearTimeout": false,
		"console": false,
		"DataView": false,
		"exports": true,
		"GLOBAL": false,
		"global": false,
		"module": false,
		"process": false,
		"require": false,
		"setImmediate": false,
		"setInterval": false,
		"setTimeout": false
	},
	"amd": {
		"define": false,
		"require": false
	},
	"mocha": {
		"after": false,
		"afterEach": false,
		"before": false,
		"beforeEach": false,
		"context": false,
		"describe": false,
		"it": false,
		"setup": false,
		"specify": false,
		"suite": false,
		"suiteSetup": false,
		"suiteTeardown": false,
		"teardown": false,
		"test": false,
		"xcontext": false,
		"xdescribe": false,
		"xit": false,
		"xspecify": false
	},
	"jasmine": {
		"afterAll": false,
		"afterEach": false,
		"beforeAll": false,
		"beforeEach": false,
		"describe": false,
		"expect": false,
		"fail": false,
		"fdescribe": false,
		"fit": false,
		"it": false,
		"jasmine": false,
		"pending": false,
		"runs": false,
		"spyOn": false,
		"waits": false,
		"waitsFor": false,
		"xdescribe": false,
		"xit": false
	},
	"qunit": {
		"asyncTest": false,
		"deepEqual": false,
		"equal": false,
		"expect": false,
		"module": false,
		"notDeepEqual": false,
		"notEqual": false,
		"notPropEqual": false,
		"notStrictEqual": false,
		"ok": false,
		"propEqual": false,
		"QUnit": false,
		"raises": false,
		"start": false,
		"stop": false,
		"strictEqual": false,
		"test": false,
		"throws": false
	},
	"phantomjs": {
		"console": true,
		"exports": true,
		"phantom": true,
		"require": true,
		"WebPage": true
	},
	"couch": {
		"emit": false,
		"exports": false,
		"getRow": false,
		"log": false,
		"module": false,
		"provides": false,
		"require": false,
		"respond": false,
		"send": false,
		"start": false,
		"sum": false
	},
	"rhino": {
		"defineClass": false,
		"deserialize": false,
		"gc": false,
		"help": false,
		"importClass": false,
		"importPackage": false,
		"java": false,
		"load": false,
		"loadClass": false,
		"Packages": false,
		"print": false,
		"quit": false,
		"readFile": false,
		"readUrl": false,
		"runCommand": false,
		"seal": false,
		"serialize": false,
		"spawn": false,
		"sync": false,
		"toint32": false,
		"version": false
	},
	"wsh": {
		"ActiveXObject": true,
		"Enumerator": true,
		"GetObject": true,
		"ScriptEngine": true,
		"ScriptEngineBuildVersion": true,
		"ScriptEngineMajorVersion": true,
		"ScriptEngineMinorVersion": true,
		"VBArray": true,
		"WScript": true,
		"WSH": true,
		"XDomainRequest": true
	},
	"jquery": {
		"$": false,
		"jQuery": false
	},
	"yui": {
		"Y": false,
		"YUI": false,
		"YUI_config": false
	},
	"shelljs": {
		"cat": false,
		"cd": false,
		"chmod": false,
		"config": false,
		"cp": false,
		"dirs": false,
		"echo": false,
		"env": false,
		"error": false,
		"exec": false,
		"exit": false,
		"find": false,
		"grep": false,
		"ls": false,
		"mkdir": false,
		"mv": false,
		"popd": false,
		"pushd": false,
		"pwd": false,
		"rm": false,
		"sed": false,
		"target": false,
		"tempdir": false,
		"test": false,
		"which": false
	},
	"prototypejs": {
		"$": false,
		"$$": false,
		"$A": false,
		"$break": false,
		"$continue": false,
		"$F": false,
		"$H": false,
		"$R": false,
		"$w": false,
		"Abstract": false,
		"Ajax": false,
		"Autocompleter": false,
		"Builder": false,
		"Class": false,
		"Control": false,
		"Draggable": false,
		"Draggables": false,
		"Droppables": false,
		"Effect": false,
		"Element": false,
		"Enumerable": false,
		"Event": false,
		"Field": false,
		"Form": false,
		"Hash": false,
		"Insertion": false,
		"ObjectRange": false,
		"PeriodicalExecuter": false,
		"Position": false,
		"Prototype": false,
		"Scriptaculous": false,
		"Selector": false,
		"Sortable": false,
		"SortableObserver": false,
		"Sound": false,
		"Template": false,
		"Toggle": false,
		"Try": false
	},
	"meteor": {
		"$": false,
		"_": false,
		"Accounts": false,
		"App": false,
		"Assets": false,
		"Blaze": false,
		"check": false,
		"Cordova": false,
		"DDP": false,
		"DDPServer": false,
		"Deps": false,
		"EJSON": false,
		"Email": false,
		"HTTP": false,
		"Log": false,
		"Match": false,
		"Meteor": false,
		"Mongo": false,
		"MongoInternals": false,
		"Npm": false,
		"Package": false,
		"Plugin": false,
		"process": false,
		"Random": false,
		"ReactiveDict": false,
		"ReactiveVar": false,
		"Router": false,
		"Session": false,
		"share": false,
		"Spacebars": false,
		"Template": false,
		"Tinytest": false,
		"Tracker": false,
		"UI": false,
		"Utils": false,
		"WebApp": false,
		"WebAppInternals": false
	},
	"mongo": {
		"_isWindows": false,
		"_rand": false,
		"BulkWriteResult": false,
		"cat": false,
		"cd": false,
		"connect": false,
		"db": false,
		"getHostName": false,
		"getMemInfo": false,
		"hostname": false,
		"listFiles": false,
		"load": false,
		"ls": false,
		"md5sumFile": false,
		"mkdir": false,
		"Mongo": false,
		"ObjectId": false,
		"PlanCache": false,
		"pwd": false,
		"quit": false,
		"removeFile": false,
		"rs": false,
		"sh": false,
		"UUID": false,
		"version": false,
		"WriteResult": false
	},
	"applescript": {
		"$": false,
		"Application": false,
		"Automation": false,
		"console": false,
		"delay": false,
		"Library": false,
		"ObjC": false,
		"ObjectSpecifier": false,
		"Path": false,
		"Progress": false,
		"Ref": false
	}
}

},{}],75:[function(require,module,exports){
module.exports = require('./globals.json');

},{"./globals.json":74}],76:[function(require,module,exports){
// Copyright 2014, 2015 Simon Lydell
// X11 (“MIT”) Licensed. (See LICENSE.)

// This regex comes from regex.coffee, and is inserted here by generate-index.js
// (run `npm run build`).
module.exports = /((['"])(?:(?!\2|\\).|\\(?:\r\n|[\s\S]))*(\2)?|`(?:[^`\\$]|\\[\s\S]|\$(?!\{)|\$\{(?:[^{}]|\{[^}]*\}?)*\}?)*(`)?)|(\/\/.*)|(\/\*(?:[^*]|\*(?!\/))*(\*\/)?)|(\/(?!\*)(?:\[(?:(?![\]\\]).|\\.)*\]|(?![\/\]\\]).|\\.)+\/(?:(?!\s*(?:\b|[\u0080-\uFFFF$\\'"~({]|[+\-!](?!=)|\.?\d))|[gmiyu]{1,5}\b(?![\u0080-\uFFFF$\\]|\s*(?:[+\-*%&|^<>!=?({]|\/(?![\/*])))))|((?:0[xX][\da-fA-F]+|0[oO][0-7]+|0[bB][01]+|(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?))|((?!\d)(?:(?!\s)[$\w\u0080-\uFFFF]|\\u[\da-fA-F]{4}|\\u\{[\da-fA-F]{1,6}\})+)|(--|\+\+|&&|\|\||=>|\.{3}|(?:[+\-*\/%&|^]|<{1,2}|>{1,3}|!=?|={1,2})=?|[?:~]|[;,.[\](){}])|(\s+)|(^$|[\s\S])/g

module.exports.matchToToken = function(match) {
  var token = {type: "invalid", value: match[0]}
       if (match[ 1]) token.type = "string" , token.closed = !!(match[3] || match[4])
  else if (match[ 5]) token.type = "comment"
  else if (match[ 6]) token.type = "comment", token.closed = !!match[7]
  else if (match[ 8]) token.type = "regex"
  else if (match[ 9]) token.type = "number"
  else if (match[10]) token.type = "name"
  else if (match[11]) token.type = "punctuator"
  else if (match[12]) token.type = "whitespace"
  return token
}

},{}],77:[function(require,module,exports){
// Copyright 2014, 2015 Simon Lydell
// X11 (“MIT”) Licensed. (See LICENSE.)

var leftPad = require("left-pad")

function get(options, key, defaultValue) {
  return (key in options ? options[key] : defaultValue)
}

function lineNumbers(code, options) {
  var getOption = get.bind(null, options || {})
  var transform = getOption("transform", Function.prototype)
  var padding   = getOption("padding", " ")
  var before    = getOption("before", " ")
  var after     = getOption("after", " | ")
  var start     = getOption("start", 1)
  var isArray   = Array.isArray(code)
  var lines     = (isArray ? code : code.split("\n"))
  var end       = start + lines.length - 1
  var width     = String(end).length
  var numbered  = lines.map(function(line, index) {
    var number  = start + index
    var params  = {before: before, number: number, width: width, after: after,
                   line: line}
    transform(params)
    return params.before + leftPad(params.number, width, padding) +
           params.after + params.line
  })
  return (isArray ? numbered : numbered.join("\n"))
}

module.exports = lineNumbers

},{"left-pad":78}],78:[function(require,module,exports){
module.exports = leftpad;

function leftpad (str, len, ch) {
  str = String(str);

  var i = -1;

  ch || (ch = ' ');
  len = len - str.length;


  while (++i < len) {
    str = ch + str;
  }

  return str;
}

},{}],79:[function(require,module,exports){
/**
 * Creates an array with all falsey values removed. The values `false`, `null`,
 * `0`, `""`, `undefined`, and `NaN` are falsey.
 *
 * @static
 * @memberOf _
 * @category Array
 * @param {Array} array The array to compact.
 * @returns {Array} Returns the new array of filtered values.
 * @example
 *
 * _.compact([0, 1, false, 2, '', 3]);
 * // => [1, 2, 3]
 */
function compact(array) {
  var index = -1,
      length = array ? array.length : 0,
      resIndex = -1,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (value) {
      result[++resIndex] = value;
    }
  }
  return result;
}

module.exports = compact;

},{}],80:[function(require,module,exports){
var baseFlatten = require('../internal/baseFlatten'),
    isIterateeCall = require('../internal/isIterateeCall');

/**
 * Flattens a nested array. If `isDeep` is `true` the array is recursively
 * flattened, otherwise it's only flattened a single level.
 *
 * @static
 * @memberOf _
 * @category Array
 * @param {Array} array The array to flatten.
 * @param {boolean} [isDeep] Specify a deep flatten.
 * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
 * @returns {Array} Returns the new flattened array.
 * @example
 *
 * _.flatten([1, [2, 3, [4]]]);
 * // => [1, 2, 3, [4]]
 *
 * // using `isDeep`
 * _.flatten([1, [2, 3, [4]]], true);
 * // => [1, 2, 3, 4]
 */
function flatten(array, isDeep, guard) {
  var length = array ? array.length : 0;
  if (guard && isIterateeCall(array, isDeep, guard)) {
    isDeep = false;
  }
  return length ? baseFlatten(array, isDeep) : [];
}

module.exports = flatten;

},{"../internal/baseFlatten":100,"../internal/isIterateeCall":140}],81:[function(require,module,exports){
/**
 * Gets the last element of `array`.
 *
 * @static
 * @memberOf _
 * @category Array
 * @param {Array} array The array to query.
 * @returns {*} Returns the last element of `array`.
 * @example
 *
 * _.last([1, 2, 3]);
 * // => 3
 */
function last(array) {
  var length = array ? array.length : 0;
  return length ? array[length - 1] : undefined;
}

module.exports = last;

},{}],82:[function(require,module,exports){
var baseCallback = require('../internal/baseCallback'),
    baseUniq = require('../internal/baseUniq'),
    isIterateeCall = require('../internal/isIterateeCall'),
    sortedUniq = require('../internal/sortedUniq');

/**
 * Creates a duplicate-free version of an array, using
 * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
 * for equality comparisons, in which only the first occurence of each element
 * is kept. Providing `true` for `isSorted` performs a faster search algorithm
 * for sorted arrays. If an iteratee function is provided it's invoked for
 * each element in the array to generate the criterion by which uniqueness
 * is computed. The `iteratee` is bound to `thisArg` and invoked with three
 * arguments: (value, index, array).
 *
 * If a property name is provided for `iteratee` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `iteratee` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * @static
 * @memberOf _
 * @alias unique
 * @category Array
 * @param {Array} array The array to inspect.
 * @param {boolean} [isSorted] Specify the array is sorted.
 * @param {Function|Object|string} [iteratee] The function invoked per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array} Returns the new duplicate-value-free array.
 * @example
 *
 * _.uniq([2, 1, 2]);
 * // => [2, 1]
 *
 * // using `isSorted`
 * _.uniq([1, 1, 2], true);
 * // => [1, 2]
 *
 * // using an iteratee function
 * _.uniq([1, 2.5, 1.5, 2], function(n) {
 *   return this.floor(n);
 * }, Math);
 * // => [1, 2.5]
 *
 * // using the `_.property` callback shorthand
 * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
 * // => [{ 'x': 1 }, { 'x': 2 }]
 */
function uniq(array, isSorted, iteratee, thisArg) {
  var length = array ? array.length : 0;
  if (!length) {
    return [];
  }
  if (isSorted != null && typeof isSorted != 'boolean') {
    thisArg = iteratee;
    iteratee = isIterateeCall(array, isSorted, thisArg) ? undefined : isSorted;
    isSorted = false;
  }
  iteratee = iteratee == null ? iteratee : baseCallback(iteratee, thisArg, 3);
  return (isSorted)
    ? sortedUniq(array, iteratee)
    : baseUniq(array, iteratee);
}

module.exports = uniq;

},{"../internal/baseCallback":96,"../internal/baseUniq":115,"../internal/isIterateeCall":140,"../internal/sortedUniq":146}],83:[function(require,module,exports){
module.exports = require('./includes');

},{"./includes":86}],84:[function(require,module,exports){
module.exports = require('./forEach');

},{"./forEach":85}],85:[function(require,module,exports){
var arrayEach = require('../internal/arrayEach'),
    baseEach = require('../internal/baseEach'),
    createForEach = require('../internal/createForEach');

/**
 * Iterates over elements of `collection` invoking `iteratee` for each element.
 * The `iteratee` is bound to `thisArg` and invoked with three arguments:
 * (value, index|key, collection). Iteratee functions may exit iteration early
 * by explicitly returning `false`.
 *
 * **Note:** As with other "Collections" methods, objects with a "length" property
 * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
 * may be used for object iteration.
 *
 * @static
 * @memberOf _
 * @alias each
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array|Object|string} Returns `collection`.
 * @example
 *
 * _([1, 2]).forEach(function(n) {
 *   console.log(n);
 * }).value();
 * // => logs each value from left to right and returns the array
 *
 * _.forEach({ 'a': 1, 'b': 2 }, function(n, key) {
 *   console.log(n, key);
 * });
 * // => logs each value-key pair and returns the object (iteration order is not guaranteed)
 */
var forEach = createForEach(arrayEach, baseEach);

module.exports = forEach;

},{"../internal/arrayEach":90,"../internal/baseEach":99,"../internal/createForEach":126}],86:[function(require,module,exports){
var baseIndexOf = require('../internal/baseIndexOf'),
    getLength = require('../internal/getLength'),
    isArray = require('../lang/isArray'),
    isIterateeCall = require('../internal/isIterateeCall'),
    isLength = require('../internal/isLength'),
    isString = require('../lang/isString'),
    values = require('../object/values');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Checks if `target` is in `collection` using
 * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
 * for equality comparisons. If `fromIndex` is negative, it's used as the offset
 * from the end of `collection`.
 *
 * @static
 * @memberOf _
 * @alias contains, include
 * @category Collection
 * @param {Array|Object|string} collection The collection to search.
 * @param {*} target The value to search for.
 * @param {number} [fromIndex=0] The index to search from.
 * @param- {Object} [guard] Enables use as a callback for functions like `_.reduce`.
 * @returns {boolean} Returns `true` if a matching element is found, else `false`.
 * @example
 *
 * _.includes([1, 2, 3], 1);
 * // => true
 *
 * _.includes([1, 2, 3], 1, 2);
 * // => false
 *
 * _.includes({ 'user': 'fred', 'age': 40 }, 'fred');
 * // => true
 *
 * _.includes('pebbles', 'eb');
 * // => true
 */
function includes(collection, target, fromIndex, guard) {
  var length = collection ? getLength(collection) : 0;
  if (!isLength(length)) {
    collection = values(collection);
    length = collection.length;
  }
  if (typeof fromIndex != 'number' || (guard && isIterateeCall(target, fromIndex, guard))) {
    fromIndex = 0;
  } else {
    fromIndex = fromIndex < 0 ? nativeMax(length + fromIndex, 0) : (fromIndex || 0);
  }
  return (typeof collection == 'string' || !isArray(collection) && isString(collection))
    ? (fromIndex <= length && collection.indexOf(target, fromIndex) > -1)
    : (!!length && baseIndexOf(collection, target, fromIndex) > -1);
}

module.exports = includes;

},{"../internal/baseIndexOf":105,"../internal/getLength":131,"../internal/isIterateeCall":140,"../internal/isLength":142,"../lang/isArray":152,"../lang/isString":161,"../object/values":170}],87:[function(require,module,exports){
/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Native method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates a function that invokes `func` with the `this` binding of the
 * created function and arguments from `start` and beyond provided as an array.
 *
 * **Note:** This method is based on the [rest parameter](https://developer.mozilla.org/Web/JavaScript/Reference/Functions/rest_parameters).
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var say = _.restParam(function(what, names) {
 *   return what + ' ' + _.initial(names).join(', ') +
 *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
 * });
 *
 * say('hello', 'fred', 'barney', 'pebbles');
 * // => 'hello fred, barney, & pebbles'
 */
function restParam(func, start) {
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  start = nativeMax(start === undefined ? (func.length - 1) : (+start || 0), 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        rest = Array(length);

    while (++index < length) {
      rest[index] = args[start + index];
    }
    switch (start) {
      case 0: return func.call(this, rest);
      case 1: return func.call(this, args[0], rest);
      case 2: return func.call(this, args[0], args[1], rest);
    }
    var otherArgs = Array(start + 1);
    index = -1;
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = rest;
    return func.apply(this, otherArgs);
  };
}

module.exports = restParam;

},{}],88:[function(require,module,exports){
(function (global){
var cachePush = require('./cachePush'),
    getNative = require('./getNative');

/** Native method references. */
var Set = getNative(global, 'Set');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeCreate = getNative(Object, 'create');

/**
 *
 * Creates a cache object to store unique values.
 *
 * @private
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var length = values ? values.length : 0;

  this.data = { 'hash': nativeCreate(null), 'set': new Set };
  while (length--) {
    this.push(values[length]);
  }
}

// Add functions to the `Set` cache.
SetCache.prototype.push = cachePush;

module.exports = SetCache;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./cachePush":120,"./getNative":133}],89:[function(require,module,exports){
/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function arrayCopy(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

module.exports = arrayCopy;

},{}],90:[function(require,module,exports){
/**
 * A specialized version of `_.forEach` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEach;

},{}],91:[function(require,module,exports){
/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

module.exports = arrayPush;

},{}],92:[function(require,module,exports){
/**
 * A specialized version of `_.some` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

module.exports = arraySome;

},{}],93:[function(require,module,exports){
/**
 * Used by `_.defaults` to customize its `_.assign` use.
 *
 * @private
 * @param {*} objectValue The destination object property value.
 * @param {*} sourceValue The source object property value.
 * @returns {*} Returns the value to assign to the destination object.
 */
function assignDefaults(objectValue, sourceValue) {
  return objectValue === undefined ? sourceValue : objectValue;
}

module.exports = assignDefaults;

},{}],94:[function(require,module,exports){
var keys = require('../object/keys');

/**
 * A specialized version of `_.assign` for customizing assigned values without
 * support for argument juggling, multiple sources, and `this` binding `customizer`
 * functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {Function} customizer The function to customize assigned values.
 * @returns {Object} Returns `object`.
 */
function assignWith(object, source, customizer) {
  var index = -1,
      props = keys(source),
      length = props.length;

  while (++index < length) {
    var key = props[index],
        value = object[key],
        result = customizer(value, source[key], key, object, source);

    if ((result === result ? (result !== value) : (value === value)) ||
        (value === undefined && !(key in object))) {
      object[key] = result;
    }
  }
  return object;
}

module.exports = assignWith;

},{"../object/keys":167}],95:[function(require,module,exports){
var baseCopy = require('./baseCopy'),
    keys = require('../object/keys');

/**
 * The base implementation of `_.assign` without support for argument juggling,
 * multiple sources, and `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
  return source == null
    ? object
    : baseCopy(source, keys(source), object);
}

module.exports = baseAssign;

},{"../object/keys":167,"./baseCopy":98}],96:[function(require,module,exports){
var baseMatches = require('./baseMatches'),
    baseMatchesProperty = require('./baseMatchesProperty'),
    bindCallback = require('./bindCallback'),
    identity = require('../utility/identity'),
    property = require('../utility/property');

/**
 * The base implementation of `_.callback` which supports specifying the
 * number of arguments to provide to `func`.
 *
 * @private
 * @param {*} [func=_.identity] The value to convert to a callback.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function baseCallback(func, thisArg, argCount) {
  var type = typeof func;
  if (type == 'function') {
    return thisArg === undefined
      ? func
      : bindCallback(func, thisArg, argCount);
  }
  if (func == null) {
    return identity;
  }
  if (type == 'object') {
    return baseMatches(func);
  }
  return thisArg === undefined
    ? property(func)
    : baseMatchesProperty(func, thisArg);
}

module.exports = baseCallback;

},{"../utility/identity":173,"../utility/property":174,"./baseMatches":109,"./baseMatchesProperty":110,"./bindCallback":117}],97:[function(require,module,exports){
var arrayCopy = require('./arrayCopy'),
    arrayEach = require('./arrayEach'),
    baseAssign = require('./baseAssign'),
    baseForOwn = require('./baseForOwn'),
    initCloneArray = require('./initCloneArray'),
    initCloneByTag = require('./initCloneByTag'),
    initCloneObject = require('./initCloneObject'),
    isArray = require('../lang/isArray'),
    isObject = require('../lang/isObject');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values supported by `_.clone`. */
var cloneableTags = {};
cloneableTags[argsTag] = cloneableTags[arrayTag] =
cloneableTags[arrayBufferTag] = cloneableTags[boolTag] =
cloneableTags[dateTag] = cloneableTags[float32Tag] =
cloneableTags[float64Tag] = cloneableTags[int8Tag] =
cloneableTags[int16Tag] = cloneableTags[int32Tag] =
cloneableTags[numberTag] = cloneableTags[objectTag] =
cloneableTags[regexpTag] = cloneableTags[stringTag] =
cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
cloneableTags[errorTag] = cloneableTags[funcTag] =
cloneableTags[mapTag] = cloneableTags[setTag] =
cloneableTags[weakMapTag] = false;

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * The base implementation of `_.clone` without support for argument juggling
 * and `this` binding `customizer` functions.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @param {Function} [customizer] The function to customize cloning values.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The object `value` belongs to.
 * @param {Array} [stackA=[]] Tracks traversed source objects.
 * @param {Array} [stackB=[]] Associates clones with source counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone(value, isDeep, customizer, key, object, stackA, stackB) {
  var result;
  if (customizer) {
    result = object ? customizer(value, key, object) : customizer(value);
  }
  if (result !== undefined) {
    return result;
  }
  if (!isObject(value)) {
    return value;
  }
  var isArr = isArray(value);
  if (isArr) {
    result = initCloneArray(value);
    if (!isDeep) {
      return arrayCopy(value, result);
    }
  } else {
    var tag = objToString.call(value),
        isFunc = tag == funcTag;

    if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
      result = initCloneObject(isFunc ? {} : value);
      if (!isDeep) {
        return baseAssign(result, value);
      }
    } else {
      return cloneableTags[tag]
        ? initCloneByTag(value, tag, isDeep)
        : (object ? value : {});
    }
  }
  // Check for circular references and return its corresponding clone.
  stackA || (stackA = []);
  stackB || (stackB = []);

  var length = stackA.length;
  while (length--) {
    if (stackA[length] == value) {
      return stackB[length];
    }
  }
  // Add the source value to the stack of traversed objects and associate it with its clone.
  stackA.push(value);
  stackB.push(result);

  // Recursively populate clone (susceptible to call stack limits).
  (isArr ? arrayEach : baseForOwn)(value, function(subValue, key) {
    result[key] = baseClone(subValue, isDeep, customizer, key, value, stackA, stackB);
  });
  return result;
}

module.exports = baseClone;

},{"../lang/isArray":152,"../lang/isObject":158,"./arrayCopy":89,"./arrayEach":90,"./baseAssign":95,"./baseForOwn":103,"./initCloneArray":135,"./initCloneByTag":136,"./initCloneObject":137}],98:[function(require,module,exports){
/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property names to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @returns {Object} Returns `object`.
 */
function baseCopy(source, props, object) {
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];
    object[key] = source[key];
  }
  return object;
}

module.exports = baseCopy;

},{}],99:[function(require,module,exports){
var baseForOwn = require('./baseForOwn'),
    createBaseEach = require('./createBaseEach');

/**
 * The base implementation of `_.forEach` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object|string} Returns `collection`.
 */
var baseEach = createBaseEach(baseForOwn);

module.exports = baseEach;

},{"./baseForOwn":103,"./createBaseEach":122}],100:[function(require,module,exports){
var arrayPush = require('./arrayPush'),
    isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isArrayLike = require('./isArrayLike'),
    isObjectLike = require('./isObjectLike');

/**
 * The base implementation of `_.flatten` with added support for restricting
 * flattening and specifying the start index.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {boolean} [isDeep] Specify a deep flatten.
 * @param {boolean} [isStrict] Restrict flattening to arrays-like objects.
 * @param {Array} [result=[]] The initial result value.
 * @returns {Array} Returns the new flattened array.
 */
function baseFlatten(array, isDeep, isStrict, result) {
  result || (result = []);

  var index = -1,
      length = array.length;

  while (++index < length) {
    var value = array[index];
    if (isObjectLike(value) && isArrayLike(value) &&
        (isStrict || isArray(value) || isArguments(value))) {
      if (isDeep) {
        // Recursively flatten arrays (susceptible to call stack limits).
        baseFlatten(value, isDeep, isStrict, result);
      } else {
        arrayPush(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}

module.exports = baseFlatten;

},{"../lang/isArguments":151,"../lang/isArray":152,"./arrayPush":91,"./isArrayLike":138,"./isObjectLike":143}],101:[function(require,module,exports){
var createBaseFor = require('./createBaseFor');

/**
 * The base implementation of `baseForIn` and `baseForOwn` which iterates
 * over `object` properties returned by `keysFunc` invoking `iteratee` for
 * each property. Iteratee functions may exit iteration early by explicitly
 * returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

module.exports = baseFor;

},{"./createBaseFor":123}],102:[function(require,module,exports){
var baseFor = require('./baseFor'),
    keysIn = require('../object/keysIn');

/**
 * The base implementation of `_.forIn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForIn(object, iteratee) {
  return baseFor(object, iteratee, keysIn);
}

module.exports = baseForIn;

},{"../object/keysIn":168,"./baseFor":101}],103:[function(require,module,exports){
var baseFor = require('./baseFor'),
    keys = require('../object/keys');

/**
 * The base implementation of `_.forOwn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return baseFor(object, iteratee, keys);
}

module.exports = baseForOwn;

},{"../object/keys":167,"./baseFor":101}],104:[function(require,module,exports){
var toObject = require('./toObject');

/**
 * The base implementation of `get` without support for string paths
 * and default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} path The path of the property to get.
 * @param {string} [pathKey] The key representation of path.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path, pathKey) {
  if (object == null) {
    return;
  }
  if (pathKey !== undefined && pathKey in toObject(object)) {
    path = [pathKey];
  }
  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[path[index++]];
  }
  return (index && index == length) ? object : undefined;
}

module.exports = baseGet;

},{"./toObject":147}],105:[function(require,module,exports){
var indexOfNaN = require('./indexOfNaN');

/**
 * The base implementation of `_.indexOf` without support for binary searches.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  if (value !== value) {
    return indexOfNaN(array, fromIndex);
  }
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

module.exports = baseIndexOf;

},{"./indexOfNaN":134}],106:[function(require,module,exports){
var baseIsEqualDeep = require('./baseIsEqualDeep'),
    isObject = require('../lang/isObject'),
    isObjectLike = require('./isObjectLike');

/**
 * The base implementation of `_.isEqual` without support for `this` binding
 * `customizer` functions.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {Function} [customizer] The function to customize comparing values.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, customizer, isLoose, stackA, stackB) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, baseIsEqual, customizer, isLoose, stackA, stackB);
}

module.exports = baseIsEqual;

},{"../lang/isObject":158,"./baseIsEqualDeep":107,"./isObjectLike":143}],107:[function(require,module,exports){
var equalArrays = require('./equalArrays'),
    equalByTag = require('./equalByTag'),
    equalObjects = require('./equalObjects'),
    isArray = require('../lang/isArray'),
    isTypedArray = require('../lang/isTypedArray');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    objectTag = '[object Object]';

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing objects.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA=[]] Tracks traversed `value` objects.
 * @param {Array} [stackB=[]] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = arrayTag,
      othTag = arrayTag;

  if (!objIsArr) {
    objTag = objToString.call(object);
    if (objTag == argsTag) {
      objTag = objectTag;
    } else if (objTag != objectTag) {
      objIsArr = isTypedArray(object);
    }
  }
  if (!othIsArr) {
    othTag = objToString.call(other);
    if (othTag == argsTag) {
      othTag = objectTag;
    } else if (othTag != objectTag) {
      othIsArr = isTypedArray(other);
    }
  }
  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && !(objIsArr || objIsObj)) {
    return equalByTag(object, other, objTag);
  }
  if (!isLoose) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      return equalFunc(objIsWrapped ? object.value() : object, othIsWrapped ? other.value() : other, customizer, isLoose, stackA, stackB);
    }
  }
  if (!isSameTag) {
    return false;
  }
  // Assume cyclic values are equal.
  // For more information on detecting circular references see https://es5.github.io/#JO.
  stackA || (stackA = []);
  stackB || (stackB = []);

  var length = stackA.length;
  while (length--) {
    if (stackA[length] == object) {
      return stackB[length] == other;
    }
  }
  // Add `object` and `other` to the stack of traversed objects.
  stackA.push(object);
  stackB.push(other);

  var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isLoose, stackA, stackB);

  stackA.pop();
  stackB.pop();

  return result;
}

module.exports = baseIsEqualDeep;

},{"../lang/isArray":152,"../lang/isTypedArray":162,"./equalArrays":127,"./equalByTag":128,"./equalObjects":129}],108:[function(require,module,exports){
var baseIsEqual = require('./baseIsEqual'),
    toObject = require('./toObject');

/**
 * The base implementation of `_.isMatch` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Array} matchData The propery names, values, and compare flags to match.
 * @param {Function} [customizer] The function to customize comparing objects.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 */
function baseIsMatch(object, matchData, customizer) {
  var index = matchData.length,
      length = index,
      noCustomizer = !customizer;

  if (object == null) {
    return !length;
  }
  object = toObject(object);
  while (index--) {
    var data = matchData[index];
    if ((noCustomizer && data[2])
          ? data[1] !== object[data[0]]
          : !(data[0] in object)
        ) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0],
        objValue = object[key],
        srcValue = data[1];

    if (noCustomizer && data[2]) {
      if (objValue === undefined && !(key in object)) {
        return false;
      }
    } else {
      var result = customizer ? customizer(objValue, srcValue, key) : undefined;
      if (!(result === undefined ? baseIsEqual(srcValue, objValue, customizer, true) : result)) {
        return false;
      }
    }
  }
  return true;
}

module.exports = baseIsMatch;

},{"./baseIsEqual":106,"./toObject":147}],109:[function(require,module,exports){
var baseIsMatch = require('./baseIsMatch'),
    getMatchData = require('./getMatchData'),
    toObject = require('./toObject');

/**
 * The base implementation of `_.matches` which does not clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new function.
 */
function baseMatches(source) {
  var matchData = getMatchData(source);
  if (matchData.length == 1 && matchData[0][2]) {
    var key = matchData[0][0],
        value = matchData[0][1];

    return function(object) {
      if (object == null) {
        return false;
      }
      return object[key] === value && (value !== undefined || (key in toObject(object)));
    };
  }
  return function(object) {
    return baseIsMatch(object, matchData);
  };
}

module.exports = baseMatches;

},{"./baseIsMatch":108,"./getMatchData":132,"./toObject":147}],110:[function(require,module,exports){
var baseGet = require('./baseGet'),
    baseIsEqual = require('./baseIsEqual'),
    baseSlice = require('./baseSlice'),
    isArray = require('../lang/isArray'),
    isKey = require('./isKey'),
    isStrictComparable = require('./isStrictComparable'),
    last = require('../array/last'),
    toObject = require('./toObject'),
    toPath = require('./toPath');

/**
 * The base implementation of `_.matchesProperty` which does not clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to compare.
 * @returns {Function} Returns the new function.
 */
function baseMatchesProperty(path, srcValue) {
  var isArr = isArray(path),
      isCommon = isKey(path) && isStrictComparable(srcValue),
      pathKey = (path + '');

  path = toPath(path);
  return function(object) {
    if (object == null) {
      return false;
    }
    var key = pathKey;
    object = toObject(object);
    if ((isArr || !isCommon) && !(key in object)) {
      object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
      if (object == null) {
        return false;
      }
      key = last(path);
      object = toObject(object);
    }
    return object[key] === srcValue
      ? (srcValue !== undefined || (key in object))
      : baseIsEqual(srcValue, object[key], undefined, true);
  };
}

module.exports = baseMatchesProperty;

},{"../array/last":81,"../lang/isArray":152,"./baseGet":104,"./baseIsEqual":106,"./baseSlice":113,"./isKey":141,"./isStrictComparable":144,"./toObject":147,"./toPath":148}],111:[function(require,module,exports){
/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

module.exports = baseProperty;

},{}],112:[function(require,module,exports){
var baseGet = require('./baseGet'),
    toPath = require('./toPath');

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new function.
 */
function basePropertyDeep(path) {
  var pathKey = (path + '');
  path = toPath(path);
  return function(object) {
    return baseGet(object, path, pathKey);
  };
}

module.exports = basePropertyDeep;

},{"./baseGet":104,"./toPath":148}],113:[function(require,module,exports){
/**
 * The base implementation of `_.slice` without an iteratee call guard.
 *
 * @private
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function baseSlice(array, start, end) {
  var index = -1,
      length = array.length;

  start = start == null ? 0 : (+start || 0);
  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = (end === undefined || end > length) ? length : (+end || 0);
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

module.exports = baseSlice;

},{}],114:[function(require,module,exports){
/**
 * Converts `value` to a string if it's not one. An empty string is returned
 * for `null` or `undefined` values.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  return value == null ? '' : (value + '');
}

module.exports = baseToString;

},{}],115:[function(require,module,exports){
var baseIndexOf = require('./baseIndexOf'),
    cacheIndexOf = require('./cacheIndexOf'),
    createCache = require('./createCache');

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * The base implementation of `_.uniq` without support for callback shorthands
 * and `this` binding.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} [iteratee] The function invoked per iteration.
 * @returns {Array} Returns the new duplicate free array.
 */
function baseUniq(array, iteratee) {
  var index = -1,
      indexOf = baseIndexOf,
      length = array.length,
      isCommon = true,
      isLarge = isCommon && length >= LARGE_ARRAY_SIZE,
      seen = isLarge ? createCache() : null,
      result = [];

  if (seen) {
    indexOf = cacheIndexOf;
    isCommon = false;
  } else {
    isLarge = false;
    seen = iteratee ? [] : result;
  }
  outer:
  while (++index < length) {
    var value = array[index],
        computed = iteratee ? iteratee(value, index, array) : value;

    if (isCommon && value === value) {
      var seenIndex = seen.length;
      while (seenIndex--) {
        if (seen[seenIndex] === computed) {
          continue outer;
        }
      }
      if (iteratee) {
        seen.push(computed);
      }
      result.push(value);
    }
    else if (indexOf(seen, computed, 0) < 0) {
      if (iteratee || isLarge) {
        seen.push(computed);
      }
      result.push(value);
    }
  }
  return result;
}

module.exports = baseUniq;

},{"./baseIndexOf":105,"./cacheIndexOf":119,"./createCache":124}],116:[function(require,module,exports){
/**
 * The base implementation of `_.values` and `_.valuesIn` which creates an
 * array of `object` property values corresponding to the property names
 * of `props`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} props The property names to get values for.
 * @returns {Object} Returns the array of property values.
 */
function baseValues(object, props) {
  var index = -1,
      length = props.length,
      result = Array(length);

  while (++index < length) {
    result[index] = object[props[index]];
  }
  return result;
}

module.exports = baseValues;

},{}],117:[function(require,module,exports){
var identity = require('../utility/identity');

/**
 * A specialized version of `baseCallback` which only supports `this` binding
 * and specifying the number of arguments to provide to `func`.
 *
 * @private
 * @param {Function} func The function to bind.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function bindCallback(func, thisArg, argCount) {
  if (typeof func != 'function') {
    return identity;
  }
  if (thisArg === undefined) {
    return func;
  }
  switch (argCount) {
    case 1: return function(value) {
      return func.call(thisArg, value);
    };
    case 3: return function(value, index, collection) {
      return func.call(thisArg, value, index, collection);
    };
    case 4: return function(accumulator, value, index, collection) {
      return func.call(thisArg, accumulator, value, index, collection);
    };
    case 5: return function(value, other, key, object, source) {
      return func.call(thisArg, value, other, key, object, source);
    };
  }
  return function() {
    return func.apply(thisArg, arguments);
  };
}

module.exports = bindCallback;

},{"../utility/identity":173}],118:[function(require,module,exports){
(function (global){
/** Native method references. */
var ArrayBuffer = global.ArrayBuffer,
    Uint8Array = global.Uint8Array;

/**
 * Creates a clone of the given array buffer.
 *
 * @private
 * @param {ArrayBuffer} buffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function bufferClone(buffer) {
  var result = new ArrayBuffer(buffer.byteLength),
      view = new Uint8Array(result);

  view.set(new Uint8Array(buffer));
  return result;
}

module.exports = bufferClone;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],119:[function(require,module,exports){
var isObject = require('../lang/isObject');

/**
 * Checks if `value` is in `cache` mimicking the return signature of
 * `_.indexOf` by returning `0` if the value is found, else `-1`.
 *
 * @private
 * @param {Object} cache The cache to search.
 * @param {*} value The value to search for.
 * @returns {number} Returns `0` if `value` is found, else `-1`.
 */
function cacheIndexOf(cache, value) {
  var data = cache.data,
      result = (typeof value == 'string' || isObject(value)) ? data.set.has(value) : data.hash[value];

  return result ? 0 : -1;
}

module.exports = cacheIndexOf;

},{"../lang/isObject":158}],120:[function(require,module,exports){
var isObject = require('../lang/isObject');

/**
 * Adds `value` to the cache.
 *
 * @private
 * @name push
 * @memberOf SetCache
 * @param {*} value The value to cache.
 */
function cachePush(value) {
  var data = this.data;
  if (typeof value == 'string' || isObject(value)) {
    data.set.add(value);
  } else {
    data.hash[value] = true;
  }
}

module.exports = cachePush;

},{"../lang/isObject":158}],121:[function(require,module,exports){
var bindCallback = require('./bindCallback'),
    isIterateeCall = require('./isIterateeCall'),
    restParam = require('../function/restParam');

/**
 * Creates a `_.assign`, `_.defaults`, or `_.merge` function.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return restParam(function(object, sources) {
    var index = -1,
        length = object == null ? 0 : sources.length,
        customizer = length > 2 ? sources[length - 2] : undefined,
        guard = length > 2 ? sources[2] : undefined,
        thisArg = length > 1 ? sources[length - 1] : undefined;

    if (typeof customizer == 'function') {
      customizer = bindCallback(customizer, thisArg, 5);
      length -= 2;
    } else {
      customizer = typeof thisArg == 'function' ? thisArg : undefined;
      length -= (customizer ? 1 : 0);
    }
    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, customizer);
      }
    }
    return object;
  });
}

module.exports = createAssigner;

},{"../function/restParam":87,"./bindCallback":117,"./isIterateeCall":140}],122:[function(require,module,exports){
var getLength = require('./getLength'),
    isLength = require('./isLength'),
    toObject = require('./toObject');

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach(eachFunc, fromRight) {
  return function(collection, iteratee) {
    var length = collection ? getLength(collection) : 0;
    if (!isLength(length)) {
      return eachFunc(collection, iteratee);
    }
    var index = fromRight ? length : -1,
        iterable = toObject(collection);

    while ((fromRight ? index-- : ++index < length)) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}

module.exports = createBaseEach;

},{"./getLength":131,"./isLength":142,"./toObject":147}],123:[function(require,module,exports){
var toObject = require('./toObject');

/**
 * Creates a base function for `_.forIn` or `_.forInRight`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var iterable = toObject(object),
        props = keysFunc(object),
        length = props.length,
        index = fromRight ? length : -1;

    while ((fromRight ? index-- : ++index < length)) {
      var key = props[index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

module.exports = createBaseFor;

},{"./toObject":147}],124:[function(require,module,exports){
(function (global){
var SetCache = require('./SetCache'),
    getNative = require('./getNative');

/** Native method references. */
var Set = getNative(global, 'Set');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeCreate = getNative(Object, 'create');

/**
 * Creates a `Set` cache object to optimize linear searches of large arrays.
 *
 * @private
 * @param {Array} [values] The values to cache.
 * @returns {null|Object} Returns the new cache object if `Set` is supported, else `null`.
 */
function createCache(values) {
  return (nativeCreate && Set) ? new SetCache(values) : null;
}

module.exports = createCache;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./SetCache":88,"./getNative":133}],125:[function(require,module,exports){
var restParam = require('../function/restParam');

/**
 * Creates a `_.defaults` or `_.defaultsDeep` function.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @param {Function} customizer The function to customize assigned values.
 * @returns {Function} Returns the new defaults function.
 */
function createDefaults(assigner, customizer) {
  return restParam(function(args) {
    var object = args[0];
    if (object == null) {
      return object;
    }
    args.push(customizer);
    return assigner.apply(undefined, args);
  });
}

module.exports = createDefaults;

},{"../function/restParam":87}],126:[function(require,module,exports){
var bindCallback = require('./bindCallback'),
    isArray = require('../lang/isArray');

/**
 * Creates a function for `_.forEach` or `_.forEachRight`.
 *
 * @private
 * @param {Function} arrayFunc The function to iterate over an array.
 * @param {Function} eachFunc The function to iterate over a collection.
 * @returns {Function} Returns the new each function.
 */
function createForEach(arrayFunc, eachFunc) {
  return function(collection, iteratee, thisArg) {
    return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
      ? arrayFunc(collection, iteratee)
      : eachFunc(collection, bindCallback(iteratee, thisArg, 3));
  };
}

module.exports = createForEach;

},{"../lang/isArray":152,"./bindCallback":117}],127:[function(require,module,exports){
var arraySome = require('./arraySome');

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing arrays.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var index = -1,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isLoose && othLength > arrLength)) {
    return false;
  }
  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index],
        result = customizer ? customizer(isLoose ? othValue : arrValue, isLoose ? arrValue : othValue, index) : undefined;

    if (result !== undefined) {
      if (result) {
        continue;
      }
      return false;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (isLoose) {
      if (!arraySome(other, function(othValue) {
            return arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
          })) {
        return false;
      }
    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB))) {
      return false;
    }
  }
  return true;
}

module.exports = equalArrays;

},{"./arraySome":92}],128:[function(require,module,exports){
/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    stringTag = '[object String]';

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag) {
  switch (tag) {
    case boolTag:
    case dateTag:
      // Coerce dates and booleans to numbers, dates to milliseconds and booleans
      // to `1` or `0` treating invalid dates coerced to `NaN` as not equal.
      return +object == +other;

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case numberTag:
      // Treat `NaN` vs. `NaN` as equal.
      return (object != +object)
        ? other != +other
        : object == +other;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings primitives and string
      // objects as equal. See https://es5.github.io/#x15.10.6.4 for more details.
      return object == (other + '');
  }
  return false;
}

module.exports = equalByTag;

},{}],129:[function(require,module,exports){
var keys = require('../object/keys');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing values.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var objProps = keys(object),
      objLength = objProps.length,
      othProps = keys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isLoose) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isLoose ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  var skipCtor = isLoose;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key],
        result = customizer ? customizer(isLoose ? othValue : objValue, isLoose? objValue : othValue, key) : undefined;

    // Recursively compare objects (susceptible to call stack limits).
    if (!(result === undefined ? equalFunc(objValue, othValue, customizer, isLoose, stackA, stackB) : result)) {
      return false;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (!skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      return false;
    }
  }
  return true;
}

module.exports = equalObjects;

},{"../object/keys":167}],130:[function(require,module,exports){
/** Used to escape characters for inclusion in compiled regexes. */
var regexpEscapes = {
  '0': 'x30', '1': 'x31', '2': 'x32', '3': 'x33', '4': 'x34',
  '5': 'x35', '6': 'x36', '7': 'x37', '8': 'x38', '9': 'x39',
  'A': 'x41', 'B': 'x42', 'C': 'x43', 'D': 'x44', 'E': 'x45', 'F': 'x46',
  'a': 'x61', 'b': 'x62', 'c': 'x63', 'd': 'x64', 'e': 'x65', 'f': 'x66',
  'n': 'x6e', 'r': 'x72', 't': 'x74', 'u': 'x75', 'v': 'x76', 'x': 'x78'
};

/** Used to escape characters for inclusion in compiled string literals. */
var stringEscapes = {
  '\\': '\\',
  "'": "'",
  '\n': 'n',
  '\r': 'r',
  '\u2028': 'u2028',
  '\u2029': 'u2029'
};

/**
 * Used by `_.escapeRegExp` to escape characters for inclusion in compiled regexes.
 *
 * @private
 * @param {string} chr The matched character to escape.
 * @param {string} leadingChar The capture group for a leading character.
 * @param {string} whitespaceChar The capture group for a whitespace character.
 * @returns {string} Returns the escaped character.
 */
function escapeRegExpChar(chr, leadingChar, whitespaceChar) {
  if (leadingChar) {
    chr = regexpEscapes[chr];
  } else if (whitespaceChar) {
    chr = stringEscapes[chr];
  }
  return '\\' + chr;
}

module.exports = escapeRegExpChar;

},{}],131:[function(require,module,exports){
var baseProperty = require('./baseProperty');

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

module.exports = getLength;

},{"./baseProperty":111}],132:[function(require,module,exports){
var isStrictComparable = require('./isStrictComparable'),
    pairs = require('../object/pairs');

/**
 * Gets the propery names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */
function getMatchData(object) {
  var result = pairs(object),
      length = result.length;

  while (length--) {
    result[length][2] = isStrictComparable(result[length][1]);
  }
  return result;
}

module.exports = getMatchData;

},{"../object/pairs":169,"./isStrictComparable":144}],133:[function(require,module,exports){
var isNative = require('../lang/isNative');

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = object == null ? undefined : object[key];
  return isNative(value) ? value : undefined;
}

module.exports = getNative;

},{"../lang/isNative":156}],134:[function(require,module,exports){
/**
 * Gets the index at which the first occurrence of `NaN` is found in `array`.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched `NaN`, else `-1`.
 */
function indexOfNaN(array, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 0 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    var other = array[index];
    if (other !== other) {
      return index;
    }
  }
  return -1;
}

module.exports = indexOfNaN;

},{}],135:[function(require,module,exports){
/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray(array) {
  var length = array.length,
      result = new array.constructor(length);

  // Add array properties assigned by `RegExp#exec`.
  if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}

module.exports = initCloneArray;

},{}],136:[function(require,module,exports){
var bufferClone = require('./bufferClone');

/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    stringTag = '[object String]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to match `RegExp` flags from their coerced string values. */
var reFlags = /\w*$/;

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag(object, tag, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag:
      return bufferClone(object);

    case boolTag:
    case dateTag:
      return new Ctor(+object);

    case float32Tag: case float64Tag:
    case int8Tag: case int16Tag: case int32Tag:
    case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
      var buffer = object.buffer;
      return new Ctor(isDeep ? bufferClone(buffer) : buffer, object.byteOffset, object.length);

    case numberTag:
    case stringTag:
      return new Ctor(object);

    case regexpTag:
      var result = new Ctor(object.source, reFlags.exec(object));
      result.lastIndex = object.lastIndex;
  }
  return result;
}

module.exports = initCloneByTag;

},{"./bufferClone":118}],137:[function(require,module,exports){
/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  var Ctor = object.constructor;
  if (!(typeof Ctor == 'function' && Ctor instanceof Ctor)) {
    Ctor = Object;
  }
  return new Ctor;
}

module.exports = initCloneObject;

},{}],138:[function(require,module,exports){
var getLength = require('./getLength'),
    isLength = require('./isLength');

/**
 * Checks if `value` is array-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 */
function isArrayLike(value) {
  return value != null && isLength(getLength(value));
}

module.exports = isArrayLike;

},{"./getLength":131,"./isLength":142}],139:[function(require,module,exports){
/** Used to detect unsigned integer values. */
var reIsUint = /^\d+$/;

/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

module.exports = isIndex;

},{}],140:[function(require,module,exports){
var isArrayLike = require('./isArrayLike'),
    isIndex = require('./isIndex'),
    isObject = require('../lang/isObject');

/**
 * Checks if the provided arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
      ? (isArrayLike(object) && isIndex(index, object.length))
      : (type == 'string' && index in object)) {
    var other = object[index];
    return value === value ? (value === other) : (other !== other);
  }
  return false;
}

module.exports = isIterateeCall;

},{"../lang/isObject":158,"./isArrayLike":138,"./isIndex":139}],141:[function(require,module,exports){
var isArray = require('../lang/isArray'),
    toObject = require('./toObject');

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\n\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  var type = typeof value;
  if ((type == 'string' && reIsPlainProp.test(value)) || type == 'number') {
    return true;
  }
  if (isArray(value)) {
    return false;
  }
  var result = !reIsDeepProp.test(value);
  return result || (object != null && value in toObject(object));
}

module.exports = isKey;

},{"../lang/isArray":152,"./toObject":147}],142:[function(require,module,exports){
/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = isLength;

},{}],143:[function(require,module,exports){
/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],144:[function(require,module,exports){
var isObject = require('../lang/isObject');

/**
 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` if suitable for strict
 *  equality comparisons, else `false`.
 */
function isStrictComparable(value) {
  return value === value && !isObject(value);
}

module.exports = isStrictComparable;

},{"../lang/isObject":158}],145:[function(require,module,exports){
var isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isIndex = require('./isIndex'),
    isLength = require('./isLength'),
    keysIn = require('../object/keysIn');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A fallback implementation of `Object.keys` which creates an array of the
 * own enumerable property names of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function shimKeys(object) {
  var props = keysIn(object),
      propsLength = props.length,
      length = propsLength && object.length;

  var allowIndexes = !!length && isLength(length) &&
    (isArray(object) || isArguments(object));

  var index = -1,
      result = [];

  while (++index < propsLength) {
    var key = props[index];
    if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
      result.push(key);
    }
  }
  return result;
}

module.exports = shimKeys;

},{"../lang/isArguments":151,"../lang/isArray":152,"../object/keysIn":168,"./isIndex":139,"./isLength":142}],146:[function(require,module,exports){
/**
 * An implementation of `_.uniq` optimized for sorted arrays without support
 * for callback shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} [iteratee] The function invoked per iteration.
 * @returns {Array} Returns the new duplicate free array.
 */
function sortedUniq(array, iteratee) {
  var seen,
      index = -1,
      length = array.length,
      resIndex = -1,
      result = [];

  while (++index < length) {
    var value = array[index],
        computed = iteratee ? iteratee(value, index, array) : value;

    if (!index || seen !== computed) {
      seen = computed;
      result[++resIndex] = value;
    }
  }
  return result;
}

module.exports = sortedUniq;

},{}],147:[function(require,module,exports){
var isObject = require('../lang/isObject');

/**
 * Converts `value` to an object if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Object} Returns the object.
 */
function toObject(value) {
  return isObject(value) ? value : Object(value);
}

module.exports = toObject;

},{"../lang/isObject":158}],148:[function(require,module,exports){
var baseToString = require('./baseToString'),
    isArray = require('../lang/isArray');

/** Used to match property names within property paths. */
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `value` to property path array if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Array} Returns the property path array.
 */
function toPath(value) {
  if (isArray(value)) {
    return value;
  }
  var result = [];
  baseToString(value).replace(rePropName, function(match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
}

module.exports = toPath;

},{"../lang/isArray":152,"./baseToString":114}],149:[function(require,module,exports){
var baseClone = require('../internal/baseClone'),
    bindCallback = require('../internal/bindCallback'),
    isIterateeCall = require('../internal/isIterateeCall');

/**
 * Creates a clone of `value`. If `isDeep` is `true` nested objects are cloned,
 * otherwise they are assigned by reference. If `customizer` is provided it's
 * invoked to produce the cloned values. If `customizer` returns `undefined`
 * cloning is handled by the method instead. The `customizer` is bound to
 * `thisArg` and invoked with up to three argument; (value [, index|key, object]).
 *
 * **Note:** This method is loosely based on the
 * [structured clone algorithm](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm).
 * The enumerable properties of `arguments` objects and objects created by
 * constructors other than `Object` are cloned to plain `Object` objects. An
 * empty object is returned for uncloneable values such as functions, DOM nodes,
 * Maps, Sets, and WeakMaps.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @param {Function} [customizer] The function to customize cloning values.
 * @param {*} [thisArg] The `this` binding of `customizer`.
 * @returns {*} Returns the cloned value.
 * @example
 *
 * var users = [
 *   { 'user': 'barney' },
 *   { 'user': 'fred' }
 * ];
 *
 * var shallow = _.clone(users);
 * shallow[0] === users[0];
 * // => true
 *
 * var deep = _.clone(users, true);
 * deep[0] === users[0];
 * // => false
 *
 * // using a customizer callback
 * var el = _.clone(document.body, function(value) {
 *   if (_.isElement(value)) {
 *     return value.cloneNode(false);
 *   }
 * });
 *
 * el === document.body
 * // => false
 * el.nodeName
 * // => BODY
 * el.childNodes.length;
 * // => 0
 */
function clone(value, isDeep, customizer, thisArg) {
  if (isDeep && typeof isDeep != 'boolean' && isIterateeCall(value, isDeep, customizer)) {
    isDeep = false;
  }
  else if (typeof isDeep == 'function') {
    thisArg = customizer;
    customizer = isDeep;
    isDeep = false;
  }
  return typeof customizer == 'function'
    ? baseClone(value, isDeep, bindCallback(customizer, thisArg, 3))
    : baseClone(value, isDeep);
}

module.exports = clone;

},{"../internal/baseClone":97,"../internal/bindCallback":117,"../internal/isIterateeCall":140}],150:[function(require,module,exports){
var baseClone = require('../internal/baseClone'),
    bindCallback = require('../internal/bindCallback');

/**
 * Creates a deep clone of `value`. If `customizer` is provided it's invoked
 * to produce the cloned values. If `customizer` returns `undefined` cloning
 * is handled by the method instead. The `customizer` is bound to `thisArg`
 * and invoked with up to three argument; (value [, index|key, object]).
 *
 * **Note:** This method is loosely based on the
 * [structured clone algorithm](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm).
 * The enumerable properties of `arguments` objects and objects created by
 * constructors other than `Object` are cloned to plain `Object` objects. An
 * empty object is returned for uncloneable values such as functions, DOM nodes,
 * Maps, Sets, and WeakMaps.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to deep clone.
 * @param {Function} [customizer] The function to customize cloning values.
 * @param {*} [thisArg] The `this` binding of `customizer`.
 * @returns {*} Returns the deep cloned value.
 * @example
 *
 * var users = [
 *   { 'user': 'barney' },
 *   { 'user': 'fred' }
 * ];
 *
 * var deep = _.cloneDeep(users);
 * deep[0] === users[0];
 * // => false
 *
 * // using a customizer callback
 * var el = _.cloneDeep(document.body, function(value) {
 *   if (_.isElement(value)) {
 *     return value.cloneNode(true);
 *   }
 * });
 *
 * el === document.body
 * // => false
 * el.nodeName
 * // => BODY
 * el.childNodes.length;
 * // => 20
 */
function cloneDeep(value, customizer, thisArg) {
  return typeof customizer == 'function'
    ? baseClone(value, true, bindCallback(customizer, thisArg, 3))
    : baseClone(value, true);
}

module.exports = cloneDeep;

},{"../internal/baseClone":97,"../internal/bindCallback":117}],151:[function(require,module,exports){
var isArrayLike = require('../internal/isArrayLike'),
    isObjectLike = require('../internal/isObjectLike');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Native method references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Checks if `value` is classified as an `arguments` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  return isObjectLike(value) && isArrayLike(value) &&
    hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
}

module.exports = isArguments;

},{"../internal/isArrayLike":138,"../internal/isObjectLike":143}],152:[function(require,module,exports){
var getNative = require('../internal/getNative'),
    isLength = require('../internal/isLength'),
    isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var arrayTag = '[object Array]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/* Native method references for those with the same name as other `lodash` methods. */
var nativeIsArray = getNative(Array, 'isArray');

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(function() { return arguments; }());
 * // => false
 */
var isArray = nativeIsArray || function(value) {
  return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
};

module.exports = isArray;

},{"../internal/getNative":133,"../internal/isLength":142,"../internal/isObjectLike":143}],153:[function(require,module,exports){
var isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var boolTag = '[object Boolean]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a boolean primitive or object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isBoolean(false);
 * // => true
 *
 * _.isBoolean(null);
 * // => false
 */
function isBoolean(value) {
  return value === true || value === false || (isObjectLike(value) && objToString.call(value) == boolTag);
}

module.exports = isBoolean;

},{"../internal/isObjectLike":143}],154:[function(require,module,exports){
var isArguments = require('./isArguments'),
    isArray = require('./isArray'),
    isArrayLike = require('../internal/isArrayLike'),
    isFunction = require('./isFunction'),
    isObjectLike = require('../internal/isObjectLike'),
    isString = require('./isString'),
    keys = require('../object/keys');

/**
 * Checks if `value` is empty. A value is considered empty unless it's an
 * `arguments` object, array, string, or jQuery-like collection with a length
 * greater than `0` or an object with own enumerable properties.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {Array|Object|string} value The value to inspect.
 * @returns {boolean} Returns `true` if `value` is empty, else `false`.
 * @example
 *
 * _.isEmpty(null);
 * // => true
 *
 * _.isEmpty(true);
 * // => true
 *
 * _.isEmpty(1);
 * // => true
 *
 * _.isEmpty([1, 2, 3]);
 * // => false
 *
 * _.isEmpty({ 'a': 1 });
 * // => false
 */
function isEmpty(value) {
  if (value == null) {
    return true;
  }
  if (isArrayLike(value) && (isArray(value) || isString(value) || isArguments(value) ||
      (isObjectLike(value) && isFunction(value.splice)))) {
    return !value.length;
  }
  return !keys(value).length;
}

module.exports = isEmpty;

},{"../internal/isArrayLike":138,"../internal/isObjectLike":143,"../object/keys":167,"./isArguments":151,"./isArray":152,"./isFunction":155,"./isString":161}],155:[function(require,module,exports){
var isObject = require('./isObject');

/** `Object#toString` result references. */
var funcTag = '[object Function]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in older versions of Chrome and Safari which return 'function' for regexes
  // and Safari 8 which returns 'object' for typed array constructors.
  return isObject(value) && objToString.call(value) == funcTag;
}

module.exports = isFunction;

},{"./isObject":158}],156:[function(require,module,exports){
var isFunction = require('./isFunction'),
    isObjectLike = require('../internal/isObjectLike');

/** Used to detect host constructors (Safari > 5). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var fnToString = Function.prototype.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * Checks if `value` is a native function.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
 * @example
 *
 * _.isNative(Array.prototype.push);
 * // => true
 *
 * _.isNative(_);
 * // => false
 */
function isNative(value) {
  if (value == null) {
    return false;
  }
  if (isFunction(value)) {
    return reIsNative.test(fnToString.call(value));
  }
  return isObjectLike(value) && reIsHostCtor.test(value);
}

module.exports = isNative;

},{"../internal/isObjectLike":143,"./isFunction":155}],157:[function(require,module,exports){
var isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var numberTag = '[object Number]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Number` primitive or object.
 *
 * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are classified
 * as numbers, use the `_.isFinite` method.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isNumber(8.4);
 * // => true
 *
 * _.isNumber(NaN);
 * // => true
 *
 * _.isNumber('8.4');
 * // => false
 */
function isNumber(value) {
  return typeof value == 'number' || (isObjectLike(value) && objToString.call(value) == numberTag);
}

module.exports = isNumber;

},{"../internal/isObjectLike":143}],158:[function(require,module,exports){
/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],159:[function(require,module,exports){
var baseForIn = require('../internal/baseForIn'),
    isArguments = require('./isArguments'),
    isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var objectTag = '[object Object]';

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * **Note:** This method assumes objects created by the `Object` constructor
 * have no inherited enumerable properties.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  var Ctor;

  // Exit early for non `Object` objects.
  if (!(isObjectLike(value) && objToString.call(value) == objectTag && !isArguments(value)) ||
      (!hasOwnProperty.call(value, 'constructor') && (Ctor = value.constructor, typeof Ctor == 'function' && !(Ctor instanceof Ctor)))) {
    return false;
  }
  // IE < 9 iterates inherited properties before own properties. If the first
  // iterated property is an object's own property then there are no inherited
  // enumerable properties.
  var result;
  // In most environments an object's own properties are iterated before
  // its inherited properties. If the last iterated property is an object's
  // own property then there are no inherited enumerable properties.
  baseForIn(value, function(subValue, key) {
    result = key;
  });
  return result === undefined || hasOwnProperty.call(value, result);
}

module.exports = isPlainObject;

},{"../internal/baseForIn":102,"../internal/isObjectLike":143,"./isArguments":151}],160:[function(require,module,exports){
var isObject = require('./isObject');

/** `Object#toString` result references. */
var regexpTag = '[object RegExp]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `RegExp` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isRegExp(/abc/);
 * // => true
 *
 * _.isRegExp('/abc/');
 * // => false
 */
function isRegExp(value) {
  return isObject(value) && objToString.call(value) == regexpTag;
}

module.exports = isRegExp;

},{"./isObject":158}],161:[function(require,module,exports){
var isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var stringTag = '[object String]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isString('abc');
 * // => true
 *
 * _.isString(1);
 * // => false
 */
function isString(value) {
  return typeof value == 'string' || (isObjectLike(value) && objToString.call(value) == stringTag);
}

module.exports = isString;

},{"../internal/isObjectLike":143}],162:[function(require,module,exports){
var isLength = require('../internal/isLength'),
    isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dateTag] = typedArrayTags[errorTag] =
typedArrayTags[funcTag] = typedArrayTags[mapTag] =
typedArrayTags[numberTag] = typedArrayTags[objectTag] =
typedArrayTags[regexpTag] = typedArrayTags[setTag] =
typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
function isTypedArray(value) {
  return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
}

module.exports = isTypedArray;

},{"../internal/isLength":142,"../internal/isObjectLike":143}],163:[function(require,module,exports){
var assignWith = require('../internal/assignWith'),
    baseAssign = require('../internal/baseAssign'),
    createAssigner = require('../internal/createAssigner');

/**
 * Assigns own enumerable properties of source object(s) to the destination
 * object. Subsequent sources overwrite property assignments of previous sources.
 * If `customizer` is provided it's invoked to produce the assigned values.
 * The `customizer` is bound to `thisArg` and invoked with five arguments:
 * (objectValue, sourceValue, key, object, source).
 *
 * **Note:** This method mutates `object` and is based on
 * [`Object.assign`](http://ecma-international.org/ecma-262/6.0/#sec-object.assign).
 *
 * @static
 * @memberOf _
 * @alias extend
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {*} [thisArg] The `this` binding of `customizer`.
 * @returns {Object} Returns `object`.
 * @example
 *
 * _.assign({ 'user': 'barney' }, { 'age': 40 }, { 'user': 'fred' });
 * // => { 'user': 'fred', 'age': 40 }
 *
 * // using a customizer callback
 * var defaults = _.partialRight(_.assign, function(value, other) {
 *   return _.isUndefined(value) ? other : value;
 * });
 *
 * defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
 * // => { 'user': 'barney', 'age': 36 }
 */
var assign = createAssigner(function(object, source, customizer) {
  return customizer
    ? assignWith(object, source, customizer)
    : baseAssign(object, source);
});

module.exports = assign;

},{"../internal/assignWith":94,"../internal/baseAssign":95,"../internal/createAssigner":121}],164:[function(require,module,exports){
var assign = require('./assign'),
    assignDefaults = require('../internal/assignDefaults'),
    createDefaults = require('../internal/createDefaults');

/**
 * Assigns own enumerable properties of source object(s) to the destination
 * object for all destination properties that resolve to `undefined`. Once a
 * property is set, additional values of the same property are ignored.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @example
 *
 * _.defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
 * // => { 'user': 'barney', 'age': 36 }
 */
var defaults = createDefaults(assign, assignDefaults);

module.exports = defaults;

},{"../internal/assignDefaults":93,"../internal/createDefaults":125,"./assign":163}],165:[function(require,module,exports){
module.exports = require('./assign');

},{"./assign":163}],166:[function(require,module,exports){
var baseGet = require('../internal/baseGet'),
    baseSlice = require('../internal/baseSlice'),
    isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isIndex = require('../internal/isIndex'),
    isKey = require('../internal/isKey'),
    isLength = require('../internal/isLength'),
    last = require('../array/last'),
    toPath = require('../internal/toPath');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Checks if `path` is a direct property.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns `true` if `path` is a direct property, else `false`.
 * @example
 *
 * var object = { 'a': { 'b': { 'c': 3 } } };
 *
 * _.has(object, 'a');
 * // => true
 *
 * _.has(object, 'a.b.c');
 * // => true
 *
 * _.has(object, ['a', 'b', 'c']);
 * // => true
 */
function has(object, path) {
  if (object == null) {
    return false;
  }
  var result = hasOwnProperty.call(object, path);
  if (!result && !isKey(path)) {
    path = toPath(path);
    object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
    if (object == null) {
      return false;
    }
    path = last(path);
    result = hasOwnProperty.call(object, path);
  }
  return result || (isLength(object.length) && isIndex(path, object.length) &&
    (isArray(object) || isArguments(object)));
}

module.exports = has;

},{"../array/last":81,"../internal/baseGet":104,"../internal/baseSlice":113,"../internal/isIndex":139,"../internal/isKey":141,"../internal/isLength":142,"../internal/toPath":148,"../lang/isArguments":151,"../lang/isArray":152}],167:[function(require,module,exports){
var getNative = require('../internal/getNative'),
    isArrayLike = require('../internal/isArrayLike'),
    isObject = require('../lang/isObject'),
    shimKeys = require('../internal/shimKeys');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeKeys = getNative(Object, 'keys');

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
var keys = !nativeKeys ? shimKeys : function(object) {
  var Ctor = object == null ? undefined : object.constructor;
  if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
      (typeof object != 'function' && isArrayLike(object))) {
    return shimKeys(object);
  }
  return isObject(object) ? nativeKeys(object) : [];
};

module.exports = keys;

},{"../internal/getNative":133,"../internal/isArrayLike":138,"../internal/shimKeys":145,"../lang/isObject":158}],168:[function(require,module,exports){
var isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isIndex = require('../internal/isIndex'),
    isLength = require('../internal/isLength'),
    isObject = require('../lang/isObject');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  if (object == null) {
    return [];
  }
  if (!isObject(object)) {
    object = Object(object);
  }
  var length = object.length;
  length = (length && isLength(length) &&
    (isArray(object) || isArguments(object)) && length) || 0;

  var Ctor = object.constructor,
      index = -1,
      isProto = typeof Ctor == 'function' && Ctor.prototype === object,
      result = Array(length),
      skipIndexes = length > 0;

  while (++index < length) {
    result[index] = (index + '');
  }
  for (var key in object) {
    if (!(skipIndexes && isIndex(key, length)) &&
        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = keysIn;

},{"../internal/isIndex":139,"../internal/isLength":142,"../lang/isArguments":151,"../lang/isArray":152,"../lang/isObject":158}],169:[function(require,module,exports){
var keys = require('./keys'),
    toObject = require('../internal/toObject');

/**
 * Creates a two dimensional array of the key-value pairs for `object`,
 * e.g. `[[key1, value1], [key2, value2]]`.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the new array of key-value pairs.
 * @example
 *
 * _.pairs({ 'barney': 36, 'fred': 40 });
 * // => [['barney', 36], ['fred', 40]] (iteration order is not guaranteed)
 */
function pairs(object) {
  object = toObject(object);

  var index = -1,
      props = keys(object),
      length = props.length,
      result = Array(length);

  while (++index < length) {
    var key = props[index];
    result[index] = [key, object[key]];
  }
  return result;
}

module.exports = pairs;

},{"../internal/toObject":147,"./keys":167}],170:[function(require,module,exports){
var baseValues = require('../internal/baseValues'),
    keys = require('./keys');

/**
 * Creates an array of the own enumerable property values of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property values.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.values(new Foo);
 * // => [1, 2] (iteration order is not guaranteed)
 *
 * _.values('hi');
 * // => ['h', 'i']
 */
function values(object) {
  return baseValues(object, keys(object));
}

module.exports = values;

},{"../internal/baseValues":116,"./keys":167}],171:[function(require,module,exports){
var baseToString = require('../internal/baseToString'),
    escapeRegExpChar = require('../internal/escapeRegExpChar');

/**
 * Used to match `RegExp` [syntax characters](http://ecma-international.org/ecma-262/6.0/#sec-patterns)
 * and those outlined by [`EscapeRegExpPattern`](http://ecma-international.org/ecma-262/6.0/#sec-escaperegexppattern).
 */
var reRegExpChars = /^[:!,]|[\\^$.*+?()[\]{}|\/]|(^[0-9a-fA-Fnrtuvx])|([\n\r\u2028\u2029])/g,
    reHasRegExpChars = RegExp(reRegExpChars.source);

/**
 * Escapes the `RegExp` special characters "\", "/", "^", "$", ".", "|", "?",
 * "*", "+", "(", ")", "[", "]", "{" and "}" in `string`.
 *
 * @static
 * @memberOf _
 * @category String
 * @param {string} [string=''] The string to escape.
 * @returns {string} Returns the escaped string.
 * @example
 *
 * _.escapeRegExp('[lodash](https://lodash.com/)');
 * // => '\[lodash\]\(https:\/\/lodash\.com\/\)'
 */
function escapeRegExp(string) {
  string = baseToString(string);
  return (string && reHasRegExpChars.test(string))
    ? string.replace(reRegExpChars, escapeRegExpChar)
    : (string || '(?:)');
}

module.exports = escapeRegExp;

},{"../internal/baseToString":114,"../internal/escapeRegExpChar":130}],172:[function(require,module,exports){
var baseToString = require('../internal/baseToString');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeMin = Math.min;

/**
 * Checks if `string` starts with the given target string.
 *
 * @static
 * @memberOf _
 * @category String
 * @param {string} [string=''] The string to search.
 * @param {string} [target] The string to search for.
 * @param {number} [position=0] The position to search from.
 * @returns {boolean} Returns `true` if `string` starts with `target`, else `false`.
 * @example
 *
 * _.startsWith('abc', 'a');
 * // => true
 *
 * _.startsWith('abc', 'b');
 * // => false
 *
 * _.startsWith('abc', 'b', 1);
 * // => true
 */
function startsWith(string, target, position) {
  string = baseToString(string);
  position = position == null
    ? 0
    : nativeMin(position < 0 ? 0 : (+position || 0), string.length);

  return string.lastIndexOf(target, position) == position;
}

module.exports = startsWith;

},{"../internal/baseToString":114}],173:[function(require,module,exports){
/**
 * This method returns the first argument provided to it.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'user': 'fred' };
 *
 * _.identity(object) === object;
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = identity;

},{}],174:[function(require,module,exports){
var baseProperty = require('../internal/baseProperty'),
    basePropertyDeep = require('../internal/basePropertyDeep'),
    isKey = require('../internal/isKey');

/**
 * Creates a function that returns the property value at `path` on a
 * given object.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': { 'c': 2 } } },
 *   { 'a': { 'b': { 'c': 1 } } }
 * ];
 *
 * _.map(objects, _.property('a.b.c'));
 * // => [2, 1]
 *
 * _.pluck(_.sortBy(objects, _.property(['a', 'b', 'c'])), 'a.b.c');
 * // => [1, 2]
 */
function property(path) {
  return isKey(path) ? baseProperty(path) : basePropertyDeep(path);
}

module.exports = property;

},{"../internal/baseProperty":111,"../internal/basePropertyDeep":112,"../internal/isKey":141}],175:[function(require,module,exports){
module.exports = minimatch
minimatch.Minimatch = Minimatch

var path = { sep: '/' }
try {
  path = require('path')
} catch (er) {}

var GLOBSTAR = minimatch.GLOBSTAR = Minimatch.GLOBSTAR = {}
var expand = require('brace-expansion')

// any single thing other than /
// don't need to escape / when using new RegExp()
var qmark = '[^/]'

// * => any number of characters
var star = qmark + '*?'

// ** when dots are allowed.  Anything goes, except .. and .
// not (^ or / followed by one or two dots followed by $ or /),
// followed by anything, any number of times.
var twoStarDot = '(?:(?!(?:\\\/|^)(?:\\.{1,2})($|\\\/)).)*?'

// not a ^ or / followed by a dot,
// followed by anything, any number of times.
var twoStarNoDot = '(?:(?!(?:\\\/|^)\\.).)*?'

// characters that need to be escaped in RegExp.
var reSpecials = charSet('().*{}+?[]^$\\!')

// "abc" -> { a:true, b:true, c:true }
function charSet (s) {
  return s.split('').reduce(function (set, c) {
    set[c] = true
    return set
  }, {})
}

// normalizes slashes.
var slashSplit = /\/+/

minimatch.filter = filter
function filter (pattern, options) {
  options = options || {}
  return function (p, i, list) {
    return minimatch(p, pattern, options)
  }
}

function ext (a, b) {
  a = a || {}
  b = b || {}
  var t = {}
  Object.keys(b).forEach(function (k) {
    t[k] = b[k]
  })
  Object.keys(a).forEach(function (k) {
    t[k] = a[k]
  })
  return t
}

minimatch.defaults = function (def) {
  if (!def || !Object.keys(def).length) return minimatch

  var orig = minimatch

  var m = function minimatch (p, pattern, options) {
    return orig.minimatch(p, pattern, ext(def, options))
  }

  m.Minimatch = function Minimatch (pattern, options) {
    return new orig.Minimatch(pattern, ext(def, options))
  }

  return m
}

Minimatch.defaults = function (def) {
  if (!def || !Object.keys(def).length) return Minimatch
  return minimatch.defaults(def).Minimatch
}

function minimatch (p, pattern, options) {
  if (typeof pattern !== 'string') {
    throw new TypeError('glob pattern string required')
  }

  if (!options) options = {}

  // shortcut: comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    return false
  }

  // "" only matches ""
  if (pattern.trim() === '') return p === ''

  return new Minimatch(pattern, options).match(p)
}

function Minimatch (pattern, options) {
  if (!(this instanceof Minimatch)) {
    return new Minimatch(pattern, options)
  }

  if (typeof pattern !== 'string') {
    throw new TypeError('glob pattern string required')
  }

  if (!options) options = {}
  pattern = pattern.trim()

  // windows support: need to use /, not \
  if (path.sep !== '/') {
    pattern = pattern.split(path.sep).join('/')
  }

  this.options = options
  this.set = []
  this.pattern = pattern
  this.regexp = null
  this.negate = false
  this.comment = false
  this.empty = false

  // make the set of regexps etc.
  this.make()
}

Minimatch.prototype.debug = function () {}

Minimatch.prototype.make = make
function make () {
  // don't do it more than once.
  if (this._made) return

  var pattern = this.pattern
  var options = this.options

  // empty patterns and comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    this.comment = true
    return
  }
  if (!pattern) {
    this.empty = true
    return
  }

  // step 1: figure out negation, etc.
  this.parseNegate()

  // step 2: expand braces
  var set = this.globSet = this.braceExpand()

  if (options.debug) this.debug = console.error

  this.debug(this.pattern, set)

  // step 3: now we have a set, so turn each one into a series of path-portion
  // matching patterns.
  // These will be regexps, except in the case of "**", which is
  // set to the GLOBSTAR object for globstar behavior,
  // and will not contain any / characters
  set = this.globParts = set.map(function (s) {
    return s.split(slashSplit)
  })

  this.debug(this.pattern, set)

  // glob --> regexps
  set = set.map(function (s, si, set) {
    return s.map(this.parse, this)
  }, this)

  this.debug(this.pattern, set)

  // filter out everything that didn't compile properly.
  set = set.filter(function (s) {
    return s.indexOf(false) === -1
  })

  this.debug(this.pattern, set)

  this.set = set
}

Minimatch.prototype.parseNegate = parseNegate
function parseNegate () {
  var pattern = this.pattern
  var negate = false
  var options = this.options
  var negateOffset = 0

  if (options.nonegate) return

  for (var i = 0, l = pattern.length
    ; i < l && pattern.charAt(i) === '!'
    ; i++) {
    negate = !negate
    negateOffset++
  }

  if (negateOffset) this.pattern = pattern.substr(negateOffset)
  this.negate = negate
}

// Brace expansion:
// a{b,c}d -> abd acd
// a{b,}c -> abc ac
// a{0..3}d -> a0d a1d a2d a3d
// a{b,c{d,e}f}g -> abg acdfg acefg
// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
//
// Invalid sets are not expanded.
// a{2..}b -> a{2..}b
// a{b}c -> a{b}c
minimatch.braceExpand = function (pattern, options) {
  return braceExpand(pattern, options)
}

Minimatch.prototype.braceExpand = braceExpand

function braceExpand (pattern, options) {
  if (!options) {
    if (this instanceof Minimatch) {
      options = this.options
    } else {
      options = {}
    }
  }

  pattern = typeof pattern === 'undefined'
    ? this.pattern : pattern

  if (typeof pattern === 'undefined') {
    throw new Error('undefined pattern')
  }

  if (options.nobrace ||
    !pattern.match(/\{.*\}/)) {
    // shortcut. no need to expand.
    return [pattern]
  }

  return expand(pattern)
}

// parse a component of the expanded set.
// At this point, no pattern may contain "/" in it
// so we're going to return a 2d array, where each entry is the full
// pattern, split on '/', and then turned into a regular expression.
// A regexp is made at the end which joins each array with an
// escaped /, and another full one which joins each regexp with |.
//
// Following the lead of Bash 4.1, note that "**" only has special meaning
// when it is the *only* thing in a path portion.  Otherwise, any series
// of * is equivalent to a single *.  Globstar behavior is enabled by
// default, and can be disabled by setting options.noglobstar.
Minimatch.prototype.parse = parse
var SUBPARSE = {}
function parse (pattern, isSub) {
  var options = this.options

  // shortcuts
  if (!options.noglobstar && pattern === '**') return GLOBSTAR
  if (pattern === '') return ''

  var re = ''
  var hasMagic = !!options.nocase
  var escaping = false
  // ? => one single character
  var patternListStack = []
  var negativeLists = []
  var plType
  var stateChar
  var inClass = false
  var reClassStart = -1
  var classStart = -1
  // . and .. never match anything that doesn't start with .,
  // even when options.dot is set.
  var patternStart = pattern.charAt(0) === '.' ? '' // anything
  // not (start or / followed by . or .. followed by / or end)
  : options.dot ? '(?!(?:^|\\\/)\\.{1,2}(?:$|\\\/))'
  : '(?!\\.)'
  var self = this

  function clearStateChar () {
    if (stateChar) {
      // we had some state-tracking character
      // that wasn't consumed by this pass.
      switch (stateChar) {
        case '*':
          re += star
          hasMagic = true
        break
        case '?':
          re += qmark
          hasMagic = true
        break
        default:
          re += '\\' + stateChar
        break
      }
      self.debug('clearStateChar %j %j', stateChar, re)
      stateChar = false
    }
  }

  for (var i = 0, len = pattern.length, c
    ; (i < len) && (c = pattern.charAt(i))
    ; i++) {
    this.debug('%s\t%s %s %j', pattern, i, re, c)

    // skip over any that are escaped.
    if (escaping && reSpecials[c]) {
      re += '\\' + c
      escaping = false
      continue
    }

    switch (c) {
      case '/':
        // completely not allowed, even escaped.
        // Should already be path-split by now.
        return false

      case '\\':
        clearStateChar()
        escaping = true
      continue

      // the various stateChar values
      // for the "extglob" stuff.
      case '?':
      case '*':
      case '+':
      case '@':
      case '!':
        this.debug('%s\t%s %s %j <-- stateChar', pattern, i, re, c)

        // all of those are literals inside a class, except that
        // the glob [!a] means [^a] in regexp
        if (inClass) {
          this.debug('  in class')
          if (c === '!' && i === classStart + 1) c = '^'
          re += c
          continue
        }

        // if we already have a stateChar, then it means
        // that there was something like ** or +? in there.
        // Handle the stateChar, then proceed with this one.
        self.debug('call clearStateChar %j', stateChar)
        clearStateChar()
        stateChar = c
        // if extglob is disabled, then +(asdf|foo) isn't a thing.
        // just clear the statechar *now*, rather than even diving into
        // the patternList stuff.
        if (options.noext) clearStateChar()
      continue

      case '(':
        if (inClass) {
          re += '('
          continue
        }

        if (!stateChar) {
          re += '\\('
          continue
        }

        plType = stateChar
        patternListStack.push({
          type: plType,
          start: i - 1,
          reStart: re.length
        })
        // negation is (?:(?!js)[^/]*)
        re += stateChar === '!' ? '(?:(?!(?:' : '(?:'
        this.debug('plType %j %j', stateChar, re)
        stateChar = false
      continue

      case ')':
        if (inClass || !patternListStack.length) {
          re += '\\)'
          continue
        }

        clearStateChar()
        hasMagic = true
        re += ')'
        var pl = patternListStack.pop()
        plType = pl.type
        // negation is (?:(?!js)[^/]*)
        // The others are (?:<pattern>)<type>
        switch (plType) {
          case '!':
            negativeLists.push(pl)
            re += ')[^/]*?)'
            pl.reEnd = re.length
            break
          case '?':
          case '+':
          case '*':
            re += plType
            break
          case '@': break // the default anyway
        }
      continue

      case '|':
        if (inClass || !patternListStack.length || escaping) {
          re += '\\|'
          escaping = false
          continue
        }

        clearStateChar()
        re += '|'
      continue

      // these are mostly the same in regexp and glob
      case '[':
        // swallow any state-tracking char before the [
        clearStateChar()

        if (inClass) {
          re += '\\' + c
          continue
        }

        inClass = true
        classStart = i
        reClassStart = re.length
        re += c
      continue

      case ']':
        //  a right bracket shall lose its special
        //  meaning and represent itself in
        //  a bracket expression if it occurs
        //  first in the list.  -- POSIX.2 2.8.3.2
        if (i === classStart + 1 || !inClass) {
          re += '\\' + c
          escaping = false
          continue
        }

        // handle the case where we left a class open.
        // "[z-a]" is valid, equivalent to "\[z-a\]"
        if (inClass) {
          // split where the last [ was, make sure we don't have
          // an invalid re. if so, re-walk the contents of the
          // would-be class to re-translate any characters that
          // were passed through as-is
          // TODO: It would probably be faster to determine this
          // without a try/catch and a new RegExp, but it's tricky
          // to do safely.  For now, this is safe and works.
          var cs = pattern.substring(classStart + 1, i)
          try {
            RegExp('[' + cs + ']')
          } catch (er) {
            // not a valid class!
            var sp = this.parse(cs, SUBPARSE)
            re = re.substr(0, reClassStart) + '\\[' + sp[0] + '\\]'
            hasMagic = hasMagic || sp[1]
            inClass = false
            continue
          }
        }

        // finish up the class.
        hasMagic = true
        inClass = false
        re += c
      continue

      default:
        // swallow any state char that wasn't consumed
        clearStateChar()

        if (escaping) {
          // no need
          escaping = false
        } else if (reSpecials[c]
          && !(c === '^' && inClass)) {
          re += '\\'
        }

        re += c

    } // switch
  } // for

  // handle the case where we left a class open.
  // "[abc" is valid, equivalent to "\[abc"
  if (inClass) {
    // split where the last [ was, and escape it
    // this is a huge pita.  We now have to re-walk
    // the contents of the would-be class to re-translate
    // any characters that were passed through as-is
    cs = pattern.substr(classStart + 1)
    sp = this.parse(cs, SUBPARSE)
    re = re.substr(0, reClassStart) + '\\[' + sp[0]
    hasMagic = hasMagic || sp[1]
  }

  // handle the case where we had a +( thing at the *end*
  // of the pattern.
  // each pattern list stack adds 3 chars, and we need to go through
  // and escape any | chars that were passed through as-is for the regexp.
  // Go through and escape them, taking care not to double-escape any
  // | chars that were already escaped.
  for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
    var tail = re.slice(pl.reStart + 3)
    // maybe some even number of \, then maybe 1 \, followed by a |
    tail = tail.replace(/((?:\\{2})*)(\\?)\|/g, function (_, $1, $2) {
      if (!$2) {
        // the | isn't already escaped, so escape it.
        $2 = '\\'
      }

      // need to escape all those slashes *again*, without escaping the
      // one that we need for escaping the | character.  As it works out,
      // escaping an even number of slashes can be done by simply repeating
      // it exactly after itself.  That's why this trick works.
      //
      // I am sorry that you have to see this.
      return $1 + $1 + $2 + '|'
    })

    this.debug('tail=%j\n   %s', tail, tail)
    var t = pl.type === '*' ? star
      : pl.type === '?' ? qmark
      : '\\' + pl.type

    hasMagic = true
    re = re.slice(0, pl.reStart) + t + '\\(' + tail
  }

  // handle trailing things that only matter at the very end.
  clearStateChar()
  if (escaping) {
    // trailing \\
    re += '\\\\'
  }

  // only need to apply the nodot start if the re starts with
  // something that could conceivably capture a dot
  var addPatternStart = false
  switch (re.charAt(0)) {
    case '.':
    case '[':
    case '(': addPatternStart = true
  }

  // Hack to work around lack of negative lookbehind in JS
  // A pattern like: *.!(x).!(y|z) needs to ensure that a name
  // like 'a.xyz.yz' doesn't match.  So, the first negative
  // lookahead, has to look ALL the way ahead, to the end of
  // the pattern.
  for (var n = negativeLists.length - 1; n > -1; n--) {
    var nl = negativeLists[n]

    var nlBefore = re.slice(0, nl.reStart)
    var nlFirst = re.slice(nl.reStart, nl.reEnd - 8)
    var nlLast = re.slice(nl.reEnd - 8, nl.reEnd)
    var nlAfter = re.slice(nl.reEnd)

    nlLast += nlAfter

    // Handle nested stuff like *(*.js|!(*.json)), where open parens
    // mean that we should *not* include the ) in the bit that is considered
    // "after" the negated section.
    var openParensBefore = nlBefore.split('(').length - 1
    var cleanAfter = nlAfter
    for (i = 0; i < openParensBefore; i++) {
      cleanAfter = cleanAfter.replace(/\)[+*?]?/, '')
    }
    nlAfter = cleanAfter

    var dollar = ''
    if (nlAfter === '' && isSub !== SUBPARSE) {
      dollar = '$'
    }
    var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast
    re = newRe
  }

  // if the re is not "" at this point, then we need to make sure
  // it doesn't match against an empty path part.
  // Otherwise a/* will match a/, which it should not.
  if (re !== '' && hasMagic) {
    re = '(?=.)' + re
  }

  if (addPatternStart) {
    re = patternStart + re
  }

  // parsing just a piece of a larger pattern.
  if (isSub === SUBPARSE) {
    return [re, hasMagic]
  }

  // skip the regexp for non-magical patterns
  // unescape anything in it, though, so that it'll be
  // an exact match against a file etc.
  if (!hasMagic) {
    return globUnescape(pattern)
  }

  var flags = options.nocase ? 'i' : ''
  var regExp = new RegExp('^' + re + '$', flags)

  regExp._glob = pattern
  regExp._src = re

  return regExp
}

minimatch.makeRe = function (pattern, options) {
  return new Minimatch(pattern, options || {}).makeRe()
}

Minimatch.prototype.makeRe = makeRe
function makeRe () {
  if (this.regexp || this.regexp === false) return this.regexp

  // at this point, this.set is a 2d array of partial
  // pattern strings, or "**".
  //
  // It's better to use .match().  This function shouldn't
  // be used, really, but it's pretty convenient sometimes,
  // when you just want to work with a regex.
  var set = this.set

  if (!set.length) {
    this.regexp = false
    return this.regexp
  }
  var options = this.options

  var twoStar = options.noglobstar ? star
    : options.dot ? twoStarDot
    : twoStarNoDot
  var flags = options.nocase ? 'i' : ''

  var re = set.map(function (pattern) {
    return pattern.map(function (p) {
      return (p === GLOBSTAR) ? twoStar
      : (typeof p === 'string') ? regExpEscape(p)
      : p._src
    }).join('\\\/')
  }).join('|')

  // must match entire pattern
  // ending in a * or ** will make it less strict.
  re = '^(?:' + re + ')$'

  // can match anything, as long as it's not this.
  if (this.negate) re = '^(?!' + re + ').*$'

  try {
    this.regexp = new RegExp(re, flags)
  } catch (ex) {
    this.regexp = false
  }
  return this.regexp
}

minimatch.match = function (list, pattern, options) {
  options = options || {}
  var mm = new Minimatch(pattern, options)
  list = list.filter(function (f) {
    return mm.match(f)
  })
  if (mm.options.nonull && !list.length) {
    list.push(pattern)
  }
  return list
}

Minimatch.prototype.match = match
function match (f, partial) {
  this.debug('match', f, this.pattern)
  // short-circuit in the case of busted things.
  // comments, etc.
  if (this.comment) return false
  if (this.empty) return f === ''

  if (f === '/' && partial) return true

  var options = this.options

  // windows: need to use /, not \
  if (path.sep !== '/') {
    f = f.split(path.sep).join('/')
  }

  // treat the test path as a set of pathparts.
  f = f.split(slashSplit)
  this.debug(this.pattern, 'split', f)

  // just ONE of the pattern sets in this.set needs to match
  // in order for it to be valid.  If negating, then just one
  // match means that we have failed.
  // Either way, return on the first hit.

  var set = this.set
  this.debug(this.pattern, 'set', set)

  // Find the basename of the path by looking for the last non-empty segment
  var filename
  var i
  for (i = f.length - 1; i >= 0; i--) {
    filename = f[i]
    if (filename) break
  }

  for (i = 0; i < set.length; i++) {
    var pattern = set[i]
    var file = f
    if (options.matchBase && pattern.length === 1) {
      file = [filename]
    }
    var hit = this.matchOne(file, pattern, partial)
    if (hit) {
      if (options.flipNegate) return true
      return !this.negate
    }
  }

  // didn't get any hits.  this is success if it's a negative
  // pattern, failure otherwise.
  if (options.flipNegate) return false
  return this.negate
}

// set partial to true to test if, for example,
// "/a/b" matches the start of "/*/b/*/d"
// Partial means, if you run out of file before you run
// out of pattern, then that's fine, as long as all
// the parts match.
Minimatch.prototype.matchOne = function (file, pattern, partial) {
  var options = this.options

  this.debug('matchOne',
    { 'this': this, file: file, pattern: pattern })

  this.debug('matchOne', file.length, pattern.length)

  for (var fi = 0,
      pi = 0,
      fl = file.length,
      pl = pattern.length
      ; (fi < fl) && (pi < pl)
      ; fi++, pi++) {
    this.debug('matchOne loop')
    var p = pattern[pi]
    var f = file[fi]

    this.debug(pattern, p, f)

    // should be impossible.
    // some invalid regexp stuff in the set.
    if (p === false) return false

    if (p === GLOBSTAR) {
      this.debug('GLOBSTAR', [pattern, p, f])

      // "**"
      // a/**/b/**/c would match the following:
      // a/b/x/y/z/c
      // a/x/y/z/b/c
      // a/b/x/b/x/c
      // a/b/c
      // To do this, take the rest of the pattern after
      // the **, and see if it would match the file remainder.
      // If so, return success.
      // If not, the ** "swallows" a segment, and try again.
      // This is recursively awful.
      //
      // a/**/b/**/c matching a/b/x/y/z/c
      // - a matches a
      // - doublestar
      //   - matchOne(b/x/y/z/c, b/**/c)
      //     - b matches b
      //     - doublestar
      //       - matchOne(x/y/z/c, c) -> no
      //       - matchOne(y/z/c, c) -> no
      //       - matchOne(z/c, c) -> no
      //       - matchOne(c, c) yes, hit
      var fr = fi
      var pr = pi + 1
      if (pr === pl) {
        this.debug('** at the end')
        // a ** at the end will just swallow the rest.
        // We have found a match.
        // however, it will not swallow /.x, unless
        // options.dot is set.
        // . and .. are *never* matched by **, for explosively
        // exponential reasons.
        for (; fi < fl; fi++) {
          if (file[fi] === '.' || file[fi] === '..' ||
            (!options.dot && file[fi].charAt(0) === '.')) return false
        }
        return true
      }

      // ok, let's see if we can swallow whatever we can.
      while (fr < fl) {
        var swallowee = file[fr]

        this.debug('\nglobstar while', file, fr, pattern, pr, swallowee)

        // XXX remove this slice.  Just pass the start index.
        if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
          this.debug('globstar found match!', fr, fl, swallowee)
          // found a match.
          return true
        } else {
          // can't swallow "." or ".." ever.
          // can only swallow ".foo" when explicitly asked.
          if (swallowee === '.' || swallowee === '..' ||
            (!options.dot && swallowee.charAt(0) === '.')) {
            this.debug('dot detected!', file, fr, pattern, pr)
            break
          }

          // ** swallows a segment, and continue.
          this.debug('globstar swallow a segment, and continue')
          fr++
        }
      }

      // no match was found.
      // However, in partial mode, we can't say this is necessarily over.
      // If there's more *pattern* left, then
      if (partial) {
        // ran out of file
        this.debug('\n>>> no match, partial?', file, fr, pattern, pr)
        if (fr === fl) return true
      }
      return false
    }

    // something other than **
    // non-magic patterns just have to match exactly
    // patterns with magic have been turned into regexps.
    var hit
    if (typeof p === 'string') {
      if (options.nocase) {
        hit = f.toLowerCase() === p.toLowerCase()
      } else {
        hit = f === p
      }
      this.debug('string match', p, f, hit)
    } else {
      hit = f.match(p)
      this.debug('pattern match', p, f, hit)
    }

    if (!hit) return false
  }

  // Note: ending in / means that we'll get a final ""
  // at the end of the pattern.  This can only match a
  // corresponding "" at the end of the file.
  // If the file ends in /, then it can only match a
  // a pattern that ends in /, unless the pattern just
  // doesn't have any more for it. But, a/b/ should *not*
  // match "a/b/*", even though "" matches against the
  // [^/]*? pattern, except in partial mode, where it might
  // simply not be reached yet.
  // However, a/b/ should still satisfy a/*

  // now either we fell off the end of the pattern, or we're done.
  if (fi === fl && pi === pl) {
    // ran out of pattern and filename at the same time.
    // an exact hit!
    return true
  } else if (fi === fl) {
    // ran out of file, but still had pattern left.
    // this is ok if we're doing the match as part of
    // a glob fs traversal.
    return partial
  } else if (pi === pl) {
    // ran out of pattern, still have file left.
    // this is only acceptable if we're on the very last
    // empty segment of a file with a trailing slash.
    // a/* should match a/b/
    var emptyFileEnd = (fi === fl - 1) && (file[fi] === '')
    return emptyFileEnd
  }

  // should be unreachable.
  throw new Error('wtf?')
}

// replace stuff like \* with *
function globUnescape (s) {
  return s.replace(/\\(.)/g, '$1')
}

function regExpEscape (s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

},{"brace-expansion":176,"path":190}],176:[function(require,module,exports){
var concatMap = require('concat-map');
var balanced = require('balanced-match');

module.exports = expandTop;

var escSlash = '\0SLASH'+Math.random()+'\0';
var escOpen = '\0OPEN'+Math.random()+'\0';
var escClose = '\0CLOSE'+Math.random()+'\0';
var escComma = '\0COMMA'+Math.random()+'\0';
var escPeriod = '\0PERIOD'+Math.random()+'\0';

function numeric(str) {
  return parseInt(str, 10) == str
    ? parseInt(str, 10)
    : str.charCodeAt(0);
}

function escapeBraces(str) {
  return str.split('\\\\').join(escSlash)
            .split('\\{').join(escOpen)
            .split('\\}').join(escClose)
            .split('\\,').join(escComma)
            .split('\\.').join(escPeriod);
}

function unescapeBraces(str) {
  return str.split(escSlash).join('\\')
            .split(escOpen).join('{')
            .split(escClose).join('}')
            .split(escComma).join(',')
            .split(escPeriod).join('.');
}


// Basically just str.split(","), but handling cases
// where we have nested braced sections, which should be
// treated as individual members, like {a,{b,c},d}
function parseCommaParts(str) {
  if (!str)
    return [''];

  var parts = [];
  var m = balanced('{', '}', str);

  if (!m)
    return str.split(',');

  var pre = m.pre;
  var body = m.body;
  var post = m.post;
  var p = pre.split(',');

  p[p.length-1] += '{' + body + '}';
  var postParts = parseCommaParts(post);
  if (post.length) {
    p[p.length-1] += postParts.shift();
    p.push.apply(p, postParts);
  }

  parts.push.apply(parts, p);

  return parts;
}

function expandTop(str) {
  if (!str)
    return [];

  return expand(escapeBraces(str), true).map(unescapeBraces);
}

function identity(e) {
  return e;
}

function embrace(str) {
  return '{' + str + '}';
}
function isPadded(el) {
  return /^-?0\d/.test(el);
}

function lte(i, y) {
  return i <= y;
}
function gte(i, y) {
  return i >= y;
}

function expand(str, isTop) {
  var expansions = [];

  var m = balanced('{', '}', str);
  if (!m || /\$$/.test(m.pre)) return [str];

  var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
  var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
  var isSequence = isNumericSequence || isAlphaSequence;
  var isOptions = /^(.*,)+(.+)?$/.test(m.body);
  if (!isSequence && !isOptions) {
    // {a},b}
    if (m.post.match(/,.*}/)) {
      str = m.pre + '{' + m.body + escClose + m.post;
      return expand(str);
    }
    return [str];
  }

  var n;
  if (isSequence) {
    n = m.body.split(/\.\./);
  } else {
    n = parseCommaParts(m.body);
    if (n.length === 1) {
      // x{{a,b}}y ==> x{a}y x{b}y
      n = expand(n[0], false).map(embrace);
      if (n.length === 1) {
        var post = m.post.length
          ? expand(m.post, false)
          : [''];
        return post.map(function(p) {
          return m.pre + n[0] + p;
        });
      }
    }
  }

  // at this point, n is the parts, and we know it's not a comma set
  // with a single entry.

  // no need to expand pre, since it is guaranteed to be free of brace-sets
  var pre = m.pre;
  var post = m.post.length
    ? expand(m.post, false)
    : [''];

  var N;

  if (isSequence) {
    var x = numeric(n[0]);
    var y = numeric(n[1]);
    var width = Math.max(n[0].length, n[1].length)
    var incr = n.length == 3
      ? Math.abs(numeric(n[2]))
      : 1;
    var test = lte;
    var reverse = y < x;
    if (reverse) {
      incr *= -1;
      test = gte;
    }
    var pad = n.some(isPadded);

    N = [];

    for (var i = x; test(i, y); i += incr) {
      var c;
      if (isAlphaSequence) {
        c = String.fromCharCode(i);
        if (c === '\\')
          c = '';
      } else {
        c = String(i);
        if (pad) {
          var need = width - c.length;
          if (need > 0) {
            var z = new Array(need + 1).join('0');
            if (i < 0)
              c = '-' + z + c.slice(1);
            else
              c = z + c;
          }
        }
      }
      N.push(c);
    }
  } else {
    N = concatMap(n, function(el) { return expand(el, false) });
  }

  for (var j = 0; j < N.length; j++) {
    for (var k = 0; k < post.length; k++) {
      var expansion = pre + N[j] + post[k];
      if (!isTop || isSequence || expansion)
        expansions.push(expansion);
    }
  }

  return expansions;
}


},{"balanced-match":177,"concat-map":178}],177:[function(require,module,exports){
module.exports = balanced;
function balanced(a, b, str) {
  var r = range(a, b, str);

  return r && {
    start: r[0],
    end: r[1],
    pre: str.slice(0, r[0]),
    body: str.slice(r[0] + a.length, r[1]),
    post: str.slice(r[1] + b.length)
  };
}

balanced.range = range;
function range(a, b, str) {
  var begs, beg, left, right, result;
  var ai = str.indexOf(a);
  var bi = str.indexOf(b, ai + 1);
  var i = ai;

  if (ai >= 0 && bi > 0) {
    begs = [];
    left = str.length;

    while (i < str.length && i >= 0 && ! result) {
      if (i == ai) {
        begs.push(i);
        ai = str.indexOf(a, i + 1);
      } else if (begs.length == 1) {
        result = [ begs.pop(), bi ];
      } else {
        beg = begs.pop();
        if (beg < left) {
          left = beg;
          right = bi;
        }

        bi = str.indexOf(b, i + 1);
      }

      i = ai < bi && ai >= 0 ? ai : bi;
    }

    if (begs.length) {
      result = [ left, right ];
    }
  }

  return result;
}

},{}],178:[function(require,module,exports){
module.exports = function (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        var x = fn(xs[i], i);
        if (isArray(x)) res.push.apply(res, x);
        else res.push(x);
    }
    return res;
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],179:[function(require,module,exports){
'use strict';
var fs = require('fs')

module.exports = function (pth, cb) {
	var fn = typeof fs.access === 'function' ? fs.access : fs.stat;

	fn(pth, function (err) {
		cb(null, !err);
	});
};

module.exports.sync = function (pth) {
	var fn = typeof fs.accessSync === 'function' ? fs.accessSync : fs.statSync;

	try {
		fn(pth);
		return true;
	} catch (err) {
		return false;
	}
};

},{"fs":188}],180:[function(require,module,exports){
'use strict';
var isFinite = require('is-finite');

module.exports = function (str, n) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string as the first argument');
	}

	if (n < 0 || !isFinite(n)) {
		throw new TypeError('Expected a finite positive number');
	}

	var ret = '';

	do {
		if (n & 1) {
			ret += str;
		}

		str += str;
	} while (n = n >> 1);

	return ret;
};

},{"is-finite":181}],181:[function(require,module,exports){
'use strict';
var numberIsNan = require('number-is-nan');

module.exports = Number.isFinite || function (val) {
	return !(typeof val !== 'number' || numberIsNan(val) || val === Infinity || val === -Infinity);
};

},{"number-is-nan":182}],182:[function(require,module,exports){
'use strict';
module.exports = Number.isNaN || function (x) {
	return x !== x;
};

},{}],183:[function(require,module,exports){
'use strict';
module.exports = function (str) {
	var isExtendedLengthPath = /^\\\\\?\\/.test(str);
	var hasNonAscii = /[^\x00-\x80]+/.test(str);

	if (isExtendedLengthPath || hasNonAscii) {
		return str;
	}

	return str.replace(/\\/g, '/');
};

},{}],184:[function(require,module,exports){
'use strict';
module.exports = function toFastProperties(obj) {
	/*jshint -W027*/
	function f() {}
	f.prototype = obj;
	new f();
	return;
	eval(obj);
};

},{}],185:[function(require,module,exports){
module.exports={"abstract-expression-call":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"PROPERTY"},"property":{"type":"MemberExpression","object":{"type":"Identifier","name":"Symbol"},"property":{"type":"Identifier","name":"referenceGet"},"computed":false},"computed":true},"arguments":[{"type":"Identifier","name":"OBJECT"}]},"property":{"type":"Identifier","name":"call"},"computed":false},"arguments":[{"type":"Identifier","name":"OBJECT"}]}}]},"abstract-expression-delete":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"PROPERTY"},"property":{"type":"MemberExpression","object":{"type":"Identifier","name":"Symbol"},"property":{"type":"Identifier","name":"referenceDelete"},"computed":false},"computed":true},"arguments":[{"type":"Identifier","name":"OBJECT"}]}}]},"abstract-expression-get":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"PROPERTY"},"property":{"type":"MemberExpression","object":{"type":"Identifier","name":"Symbol"},"property":{"type":"Identifier","name":"referenceGet"},"computed":false},"computed":true},"arguments":[{"type":"Identifier","name":"OBJECT"}]}}]},"abstract-expression-set":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"PROPERTY"},"property":{"type":"MemberExpression","object":{"type":"Identifier","name":"Symbol"},"property":{"type":"Identifier","name":"referenceSet"},"computed":false},"computed":true},"arguments":[{"type":"Identifier","name":"OBJECT"},{"type":"Identifier","name":"VALUE"}]}}]},"array-comprehension-container":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[],"body":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"KEY"},"init":{"type":"ArrayExpression","elements":[]}}],"kind":"var"},{"type":"ReturnStatement","argument":{"type":"Identifier","name":"KEY"}}]},"parenthesizedExpression":true},"arguments":[]}}]},"array-from":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Array"},"property":{"type":"Identifier","name":"from"},"computed":false},"arguments":[{"type":"Identifier","name":"VALUE"}]}}]},"array-push":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"KEY"},"property":{"type":"Identifier","name":"push"},"computed":false},"arguments":[{"type":"Identifier","name":"STATEMENT"}]}}]},"call":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"OBJECT"},"property":{"type":"Identifier","name":"call"},"computed":false},"arguments":[{"type":"Identifier","name":"CONTEXT"}]}}]},"class-decorator":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"Identifier","name":"CLASS_REF"},"right":{"type":"LogicalExpression","left":{"type":"CallExpression","callee":{"type":"Identifier","name":"DECORATOR"},"arguments":[{"type":"Identifier","name":"CLASS_REF"}]},"operator":"||","right":{"type":"Identifier","name":"CLASS_REF"}}}}]},"class-derived-default-constructor":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[],"body":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"Super"},"arguments":[{"type":"SpreadElement","argument":{"type":"Identifier","name":"arguments"}}]}}]},"parenthesizedExpression":true}}]},"default-parameter-assign":{"type":"Program","body":[{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"VARIABLE_NAME"},"operator":"===","right":{"type":"Identifier","name":"undefined"}},"consequent":{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"Identifier","name":"VARIABLE_NAME"},"right":{"type":"Identifier","name":"DEFAULT_VALUE"}}},"alternate":null}]},"default-parameter":{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"VARIABLE_NAME"},"init":{"type":"ConditionalExpression","test":{"type":"LogicalExpression","left":{"type":"BinaryExpression","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"ARGUMENTS"},"property":{"type":"Identifier","name":"length"},"computed":false},"operator":"<=","right":{"type":"Identifier","name":"ARGUMENT_KEY"}},"operator":"||","right":{"type":"BinaryExpression","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"ARGUMENTS"},"property":{"type":"Identifier","name":"ARGUMENT_KEY"},"computed":true},"operator":"===","right":{"type":"Identifier","name":"undefined"}}},"consequent":{"type":"Identifier","name":"DEFAULT_VALUE"},"alternate":{"type":"MemberExpression","object":{"type":"Identifier","name":"ARGUMENTS"},"property":{"type":"Identifier","name":"ARGUMENT_KEY"},"computed":true}}}],"kind":"let"}]},"exports-assign":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"exports"},"property":{"type":"Identifier","name":"KEY"},"computed":false},"right":{"type":"Identifier","name":"VALUE"}}}]},"exports-default-assign":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"module"},"property":{"type":"Identifier","name":"exports"},"computed":false},"right":{"type":"Identifier","name":"VALUE"}}}]},"exports-from-assign":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"defineProperty"},"computed":false},"arguments":[{"type":"Identifier","name":"exports"},{"type":"Identifier","name":"ID"},{"type":"ObjectExpression","properties":[{"type":"Property","method":false,"shorthand":false,"computed":false,"key":{"type":"Identifier","name":"enumerable"},"value":{"type":"Literal","value":true},"kind":"init"},{"type":"Property","method":false,"shorthand":false,"computed":false,"key":{"type":"Identifier","name":"get"},"value":{"type":"FunctionExpression","id":{"type":"Identifier","name":"get"},"generator":false,"expression":false,"params":[],"body":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"Identifier","name":"INIT"}}]}},"kind":"init"}]}]}}]},"exports-module-declaration-loose":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"exports"},"property":{"type":"Identifier","name":"__esModule"},"computed":false},"right":{"type":"Literal","value":true}}}]},"exports-module-declaration":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"defineProperty"},"computed":false},"arguments":[{"type":"Identifier","name":"exports"},{"type":"Literal","value":"__esModule"},{"type":"ObjectExpression","properties":[{"type":"Property","method":false,"shorthand":false,"computed":false,"key":{"type":"Identifier","name":"value"},"value":{"type":"Literal","value":true},"kind":"init"}]}]}}]},"for-of-array":{"type":"Program","body":[{"type":"ForStatement","init":{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"KEY"},"init":{"type":"Literal","value":0}}],"kind":"var"},"test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"KEY"},"operator":"<","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"ARR"},"property":{"type":"Identifier","name":"length"},"computed":false}},"update":{"type":"UpdateExpression","operator":"++","prefix":false,"argument":{"type":"Identifier","name":"KEY"}},"body":{"type":"ExpressionStatement","expression":{"type":"Identifier","name":"BODY"}}}]},"for-of-loose":{"type":"Program","body":[{"type":"ForStatement","init":{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"LOOP_OBJECT"},"init":{"type":"Identifier","name":"OBJECT"}},{"type":"VariableDeclarator","id":{"type":"Identifier","name":"IS_ARRAY"},"init":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Array"},"property":{"type":"Identifier","name":"isArray"},"computed":false},"arguments":[{"type":"Identifier","name":"LOOP_OBJECT"}]}},{"type":"VariableDeclarator","id":{"type":"Identifier","name":"INDEX"},"init":{"type":"Literal","value":0}},{"type":"VariableDeclarator","id":{"type":"Identifier","name":"LOOP_OBJECT"},"init":{"type":"ConditionalExpression","test":{"type":"Identifier","name":"IS_ARRAY"},"consequent":{"type":"Identifier","name":"LOOP_OBJECT"},"alternate":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"LOOP_OBJECT"},"property":{"type":"MemberExpression","object":{"type":"Identifier","name":"Symbol"},"property":{"type":"Identifier","name":"iterator"},"computed":false},"computed":true},"arguments":[]}}}],"kind":"var"},"test":null,"update":null,"body":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"ID"},"init":null}],"kind":"var"},{"type":"IfStatement","test":{"type":"Identifier","name":"IS_ARRAY"},"consequent":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"INDEX"},"operator":">=","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"LOOP_OBJECT"},"property":{"type":"Identifier","name":"length"},"computed":false}},"consequent":{"type":"BreakStatement","label":null},"alternate":null},{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"Identifier","name":"ID"},"right":{"type":"MemberExpression","object":{"type":"Identifier","name":"LOOP_OBJECT"},"property":{"type":"UpdateExpression","operator":"++","prefix":false,"argument":{"type":"Identifier","name":"INDEX"}},"computed":true}}}]},"alternate":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"Identifier","name":"INDEX"},"right":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"LOOP_OBJECT"},"property":{"type":"Identifier","name":"next"},"computed":false},"arguments":[]}}},{"type":"IfStatement","test":{"type":"MemberExpression","object":{"type":"Identifier","name":"INDEX"},"property":{"type":"Identifier","name":"done"},"computed":false},"consequent":{"type":"BreakStatement","label":null},"alternate":null},{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"Identifier","name":"ID"},"right":{"type":"MemberExpression","object":{"type":"Identifier","name":"INDEX"},"property":{"type":"Identifier","name":"value"},"computed":false}}}]}}]}}]},"for-of":{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"ITERATOR_COMPLETION"},"init":{"type":"Literal","value":true}}],"kind":"var"},{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"ITERATOR_HAD_ERROR_KEY"},"init":{"type":"Literal","value":false}}],"kind":"var"},{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"ITERATOR_ERROR_KEY"},"init":{"type":"Identifier","name":"undefined"}}],"kind":"var"},{"type":"TryStatement","block":{"type":"BlockStatement","body":[{"type":"ForStatement","init":{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"ITERATOR_KEY"},"init":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"OBJECT"},"property":{"type":"MemberExpression","object":{"type":"Identifier","name":"Symbol"},"property":{"type":"Identifier","name":"iterator"},"computed":false},"computed":true},"arguments":[]}},{"type":"VariableDeclarator","id":{"type":"Identifier","name":"STEP_KEY"},"init":null}],"kind":"var"},"test":{"type":"UnaryExpression","operator":"!","prefix":true,"argument":{"type":"AssignmentExpression","operator":"=","left":{"type":"Identifier","name":"ITERATOR_COMPLETION"},"right":{"type":"MemberExpression","object":{"type":"AssignmentExpression","operator":"=","left":{"type":"Identifier","name":"STEP_KEY"},"right":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"ITERATOR_KEY"},"property":{"type":"Identifier","name":"next"},"computed":false},"arguments":[]},"parenthesizedExpression":true},"property":{"type":"Identifier","name":"done"},"computed":false},"parenthesizedExpression":true}},"update":{"type":"AssignmentExpression","operator":"=","left":{"type":"Identifier","name":"ITERATOR_COMPLETION"},"right":{"type":"Literal","value":true}},"body":{"type":"BlockStatement","body":[]}}]},"handler":{"type":"CatchClause","param":{"type":"Identifier","name":"err"},"body":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"Identifier","name":"ITERATOR_HAD_ERROR_KEY"},"right":{"type":"Literal","value":true}}},{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"Identifier","name":"ITERATOR_ERROR_KEY"},"right":{"type":"Identifier","name":"err"}}}]}},"guardedHandlers":[],"finalizer":{"type":"BlockStatement","body":[{"type":"TryStatement","block":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"LogicalExpression","left":{"type":"UnaryExpression","operator":"!","prefix":true,"argument":{"type":"Identifier","name":"ITERATOR_COMPLETION"}},"operator":"&&","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"ITERATOR_KEY"},"property":{"type":"Literal","value":"return"},"computed":true}},"consequent":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"ITERATOR_KEY"},"property":{"type":"Literal","value":"return"},"computed":true},"arguments":[]}}]},"alternate":null}]},"handler":null,"guardedHandlers":[],"finalizer":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"Identifier","name":"ITERATOR_HAD_ERROR_KEY"},"consequent":{"type":"BlockStatement","body":[{"type":"ThrowStatement","argument":{"type":"Identifier","name":"ITERATOR_ERROR_KEY"}}]},"alternate":null}]}}]}}]},"helper-async-to-generator":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"fn"}],"body":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[],"body":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"gen"},"init":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"fn"},"property":{"type":"Identifier","name":"apply"},"computed":false},"arguments":[{"type":"ThisExpression"},{"type":"Identifier","name":"arguments"}]}}],"kind":"var"},{"type":"ReturnStatement","argument":{"type":"NewExpression","callee":{"type":"Identifier","name":"Promise"},"arguments":[{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"resolve"},{"type":"Identifier","name":"reject"}],"body":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"callNext"},"init":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"step"},"property":{"type":"Identifier","name":"bind"},"computed":false},"arguments":[{"type":"Literal","value":null,"rawValue":null},{"type":"Literal","value":"next"}]}}],"kind":"var"},{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"callThrow"},"init":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"step"},"property":{"type":"Identifier","name":"bind"},"computed":false},"arguments":[{"type":"Literal","value":null,"rawValue":null},{"type":"Literal","value":"throw"}]}}],"kind":"var"},{"type":"FunctionDeclaration","id":{"type":"Identifier","name":"step"},"generator":false,"expression":false,"params":[{"type":"Identifier","name":"key"},{"type":"Identifier","name":"arg"}],"body":{"type":"BlockStatement","body":[{"type":"TryStatement","block":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"info"},"init":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"gen"},"property":{"type":"Identifier","name":"key"},"computed":true},"arguments":[{"type":"Identifier","name":"arg"}]}}],"kind":"var"},{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"value"},"init":{"type":"MemberExpression","object":{"type":"Identifier","name":"info"},"property":{"type":"Identifier","name":"value"},"computed":false}}],"kind":"var"}]},"handler":{"type":"CatchClause","param":{"type":"Identifier","name":"error"},"body":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"Identifier","name":"reject"},"arguments":[{"type":"Identifier","name":"error"}]}},{"type":"ReturnStatement","argument":null}]}},"guardedHandlers":[],"finalizer":null},{"type":"IfStatement","test":{"type":"MemberExpression","object":{"type":"Identifier","name":"info"},"property":{"type":"Identifier","name":"done"},"computed":false},"consequent":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"Identifier","name":"resolve"},"arguments":[{"type":"Identifier","name":"value"}]}}]},"alternate":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Promise"},"property":{"type":"Identifier","name":"resolve"},"computed":false},"arguments":[{"type":"Identifier","name":"value"}]},"property":{"type":"Identifier","name":"then"},"computed":false},"arguments":[{"type":"Identifier","name":"callNext"},{"type":"Identifier","name":"callThrow"}]}}]}}]}},{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"Identifier","name":"callNext"},"arguments":[]}}]}}]}}]}}}]},"parenthesizedExpression":true}}]},"helper-bind":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"MemberExpression","object":{"type":"MemberExpression","object":{"type":"Identifier","name":"Function"},"property":{"type":"Identifier","name":"prototype"},"computed":false},"property":{"type":"Identifier","name":"bind"},"computed":false}}]},"helper-class-call-check":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"instance"},{"type":"Identifier","name":"Constructor"}],"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"UnaryExpression","operator":"!","prefix":true,"argument":{"type":"BinaryExpression","left":{"type":"Identifier","name":"instance"},"operator":"instanceof","right":{"type":"Identifier","name":"Constructor"},"parenthesizedExpression":true}},"consequent":{"type":"BlockStatement","body":[{"type":"ThrowStatement","argument":{"type":"NewExpression","callee":{"type":"Identifier","name":"TypeError"},"arguments":[{"type":"Literal","value":"Cannot call a class as a function"}]}}]},"alternate":null}]},"parenthesizedExpression":true}}]},"helper-create-class":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[],"body":{"type":"BlockStatement","body":[{"type":"FunctionDeclaration","id":{"type":"Identifier","name":"defineProperties"},"generator":false,"expression":false,"params":[{"type":"Identifier","name":"target"},{"type":"Identifier","name":"props"}],"body":{"type":"BlockStatement","body":[{"type":"ForStatement","init":{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"i"},"init":{"type":"Literal","value":0}}],"kind":"var"},"test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"i"},"operator":"<","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"props"},"property":{"type":"Identifier","name":"length"},"computed":false}},"update":{"type":"UpdateExpression","operator":"++","prefix":false,"argument":{"type":"Identifier","name":"i"}},"body":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"descriptor"},"init":{"type":"MemberExpression","object":{"type":"Identifier","name":"props"},"property":{"type":"Identifier","name":"i"},"computed":true}}],"kind":"var"},{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"enumerable"},"computed":false},"right":{"type":"LogicalExpression","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"enumerable"},"computed":false},"operator":"||","right":{"type":"Literal","value":false}}}},{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"configurable"},"computed":false},"right":{"type":"Literal","value":true}}},{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"Literal","value":"value"},"operator":"in","right":{"type":"Identifier","name":"descriptor"}},"consequent":{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"writable"},"computed":false},"right":{"type":"Literal","value":true}}},"alternate":null},{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"defineProperty"},"computed":false},"arguments":[{"type":"Identifier","name":"target"},{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"key"},"computed":false},{"type":"Identifier","name":"descriptor"}]}}]}}]}},{"type":"ReturnStatement","argument":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"Constructor"},{"type":"Identifier","name":"protoProps"},{"type":"Identifier","name":"staticProps"}],"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"Identifier","name":"protoProps"},"consequent":{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"Identifier","name":"defineProperties"},"arguments":[{"type":"MemberExpression","object":{"type":"Identifier","name":"Constructor"},"property":{"type":"Identifier","name":"prototype"},"computed":false},{"type":"Identifier","name":"protoProps"}]}},"alternate":null},{"type":"IfStatement","test":{"type":"Identifier","name":"staticProps"},"consequent":{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"Identifier","name":"defineProperties"},"arguments":[{"type":"Identifier","name":"Constructor"},{"type":"Identifier","name":"staticProps"}]}},"alternate":null},{"type":"ReturnStatement","argument":{"type":"Identifier","name":"Constructor"}}]}}}]},"parenthesizedExpression":true},"arguments":[]}}]},"helper-create-decorated-class":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[],"body":{"type":"BlockStatement","body":[{"type":"FunctionDeclaration","id":{"type":"Identifier","name":"defineProperties"},"generator":false,"expression":false,"params":[{"type":"Identifier","name":"target"},{"type":"Identifier","name":"descriptors"},{"type":"Identifier","name":"initializers"}],"body":{"type":"BlockStatement","body":[{"type":"ForStatement","init":{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"i"},"init":{"type":"Literal","value":0}}],"kind":"var"},"test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"i"},"operator":"<","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptors"},"property":{"type":"Identifier","name":"length"},"computed":false}},"update":{"type":"UpdateExpression","operator":"++","prefix":false,"argument":{"type":"Identifier","name":"i"}},"body":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"descriptor"},"init":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptors"},"property":{"type":"Identifier","name":"i"},"computed":true}}],"kind":"var"},{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"decorators"},"init":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"decorators"},"computed":false}}],"kind":"var"},{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"key"},"init":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"key"},"computed":false}}],"kind":"var"},{"type":"ExpressionStatement","expression":{"type":"UnaryExpression","operator":"delete","prefix":true,"argument":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor","leadingComments":null},"property":{"type":"Identifier","name":"key"},"computed":false,"leadingComments":null},"leadingComments":null}},{"type":"ExpressionStatement","expression":{"type":"UnaryExpression","operator":"delete","prefix":true,"argument":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"decorators"},"computed":false}}},{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"enumerable"},"computed":false},"right":{"type":"LogicalExpression","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"enumerable"},"computed":false},"operator":"||","right":{"type":"Literal","value":false}}}},{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"configurable"},"computed":false},"right":{"type":"Literal","value":true}}},{"type":"IfStatement","test":{"type":"LogicalExpression","left":{"type":"BinaryExpression","left":{"type":"Literal","value":"value"},"operator":"in","right":{"type":"Identifier","name":"descriptor"}},"operator":"||","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"initializer"},"computed":false}},"consequent":{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"writable"},"computed":false},"right":{"type":"Literal","value":true}}},"alternate":null},{"type":"IfStatement","test":{"type":"Identifier","name":"decorators"},"consequent":{"type":"BlockStatement","body":[{"type":"ForStatement","init":{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"f"},"init":{"type":"Literal","value":0}}],"kind":"var"},"test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"f"},"operator":"<","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"decorators"},"property":{"type":"Identifier","name":"length"},"computed":false}},"update":{"type":"UpdateExpression","operator":"++","prefix":false,"argument":{"type":"Identifier","name":"f"}},"body":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"decorator"},"init":{"type":"MemberExpression","object":{"type":"Identifier","name":"decorators"},"property":{"type":"Identifier","name":"f"},"computed":true}}],"kind":"var"},{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"UnaryExpression","operator":"typeof","prefix":true,"argument":{"type":"Identifier","name":"decorator"}},"operator":"===","right":{"type":"Literal","value":"function"}},"consequent":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"Identifier","name":"descriptor"},"right":{"type":"LogicalExpression","left":{"type":"CallExpression","callee":{"type":"Identifier","name":"decorator"},"arguments":[{"type":"Identifier","name":"target"},{"type":"Identifier","name":"key"},{"type":"Identifier","name":"descriptor"}]},"operator":"||","right":{"type":"Identifier","name":"descriptor"}}}}]},"alternate":{"type":"BlockStatement","body":[{"type":"ThrowStatement","argument":{"type":"NewExpression","callee":{"type":"Identifier","name":"TypeError"},"arguments":[{"type":"BinaryExpression","left":{"type":"BinaryExpression","left":{"type":"BinaryExpression","left":{"type":"Literal","value":"The decorator for method "},"operator":"+","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"key"},"computed":false}},"operator":"+","right":{"type":"Literal","value":" is of the invalid type "}},"operator":"+","right":{"type":"UnaryExpression","operator":"typeof","prefix":true,"argument":{"type":"Identifier","name":"decorator"}}}]}}]}}]}},{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"initializer"},"computed":false},"operator":"!==","right":{"type":"Identifier","name":"undefined"}},"consequent":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"initializers"},"property":{"type":"Identifier","name":"key"},"computed":true},"right":{"type":"Identifier","name":"descriptor"}}},{"type":"ContinueStatement","label":null}]},"alternate":null}]},"alternate":null},{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"defineProperty"},"computed":false},"arguments":[{"type":"Identifier","name":"target"},{"type":"Identifier","name":"key"},{"type":"Identifier","name":"descriptor"}]}}]}}]}},{"type":"ReturnStatement","argument":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"Constructor"},{"type":"Identifier","name":"protoProps"},{"type":"Identifier","name":"staticProps"},{"type":"Identifier","name":"protoInitializers"},{"type":"Identifier","name":"staticInitializers"}],"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"Identifier","name":"protoProps"},"consequent":{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"Identifier","name":"defineProperties"},"arguments":[{"type":"MemberExpression","object":{"type":"Identifier","name":"Constructor"},"property":{"type":"Identifier","name":"prototype"},"computed":false},{"type":"Identifier","name":"protoProps"},{"type":"Identifier","name":"protoInitializers"}]}},"alternate":null},{"type":"IfStatement","test":{"type":"Identifier","name":"staticProps"},"consequent":{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"Identifier","name":"defineProperties"},"arguments":[{"type":"Identifier","name":"Constructor"},{"type":"Identifier","name":"staticProps"},{"type":"Identifier","name":"staticInitializers"}]}},"alternate":null},{"type":"ReturnStatement","argument":{"type":"Identifier","name":"Constructor"}}]}}}]},"parenthesizedExpression":true},"arguments":[]}}]},"helper-create-decorated-object":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"descriptors"}],"body":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"target"},"init":{"type":"ObjectExpression","properties":[]}}],"kind":"var"},{"type":"ForStatement","init":{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"i"},"init":{"type":"Literal","value":0}}],"kind":"var"},"test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"i"},"operator":"<","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptors"},"property":{"type":"Identifier","name":"length"},"computed":false}},"update":{"type":"UpdateExpression","operator":"++","prefix":false,"argument":{"type":"Identifier","name":"i"}},"body":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"descriptor"},"init":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptors"},"property":{"type":"Identifier","name":"i"},"computed":true}}],"kind":"var"},{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"decorators"},"init":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"decorators"},"computed":false}}],"kind":"var"},{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"key"},"init":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"key"},"computed":false}}],"kind":"var"},{"type":"ExpressionStatement","expression":{"type":"UnaryExpression","operator":"delete","prefix":true,"argument":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor","leadingComments":null},"property":{"type":"Identifier","name":"key"},"computed":false,"leadingComments":null},"leadingComments":null}},{"type":"ExpressionStatement","expression":{"type":"UnaryExpression","operator":"delete","prefix":true,"argument":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"decorators"},"computed":false}}},{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"enumerable"},"computed":false},"right":{"type":"Literal","value":true}}},{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"configurable"},"computed":false},"right":{"type":"Literal","value":true}}},{"type":"IfStatement","test":{"type":"LogicalExpression","left":{"type":"BinaryExpression","left":{"type":"Literal","value":"value"},"operator":"in","right":{"type":"Identifier","name":"descriptor"}},"operator":"||","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"initializer"},"computed":false}},"consequent":{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"writable"},"computed":false},"right":{"type":"Literal","value":true}}},"alternate":null},{"type":"IfStatement","test":{"type":"Identifier","name":"decorators"},"consequent":{"type":"BlockStatement","body":[{"type":"ForStatement","init":{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"f"},"init":{"type":"Literal","value":0}}],"kind":"var"},"test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"f"},"operator":"<","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"decorators"},"property":{"type":"Identifier","name":"length"},"computed":false}},"update":{"type":"UpdateExpression","operator":"++","prefix":false,"argument":{"type":"Identifier","name":"f"}},"body":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"decorator"},"init":{"type":"MemberExpression","object":{"type":"Identifier","name":"decorators"},"property":{"type":"Identifier","name":"f"},"computed":true}}],"kind":"var"},{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"UnaryExpression","operator":"typeof","prefix":true,"argument":{"type":"Identifier","name":"decorator"}},"operator":"===","right":{"type":"Literal","value":"function"}},"consequent":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"Identifier","name":"descriptor"},"right":{"type":"LogicalExpression","left":{"type":"CallExpression","callee":{"type":"Identifier","name":"decorator"},"arguments":[{"type":"Identifier","name":"target"},{"type":"Identifier","name":"key"},{"type":"Identifier","name":"descriptor"}]},"operator":"||","right":{"type":"Identifier","name":"descriptor"}}}}]},"alternate":{"type":"BlockStatement","body":[{"type":"ThrowStatement","argument":{"type":"NewExpression","callee":{"type":"Identifier","name":"TypeError"},"arguments":[{"type":"BinaryExpression","left":{"type":"BinaryExpression","left":{"type":"BinaryExpression","left":{"type":"Literal","value":"The decorator for method "},"operator":"+","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"key"},"computed":false}},"operator":"+","right":{"type":"Literal","value":" is of the invalid type "}},"operator":"+","right":{"type":"UnaryExpression","operator":"typeof","prefix":true,"argument":{"type":"Identifier","name":"decorator"}}}]}}]}}]}}]},"alternate":null},{"type":"IfStatement","test":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"initializer"},"computed":false},"consequent":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"value"},"computed":false},"right":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"initializer"},"computed":false},"property":{"type":"Identifier","name":"call"},"computed":false},"arguments":[{"type":"Identifier","name":"target"}]}}}]},"alternate":null},{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"defineProperty"},"computed":false},"arguments":[{"type":"Identifier","name":"target"},{"type":"Identifier","name":"key"},{"type":"Identifier","name":"descriptor"}]}}]}},{"type":"ReturnStatement","argument":{"type":"Identifier","name":"target"}}]},"parenthesizedExpression":true}}]},"helper-default-props":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"defaultProps"},{"type":"Identifier","name":"props"}],"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"Identifier","name":"defaultProps"},"consequent":{"type":"BlockStatement","body":[{"type":"ForInStatement","left":{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"propName"},"init":null}],"kind":"var"},"right":{"type":"Identifier","name":"defaultProps"},"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"UnaryExpression","operator":"typeof","prefix":true,"argument":{"type":"MemberExpression","object":{"type":"Identifier","name":"props"},"property":{"type":"Identifier","name":"propName"},"computed":true}},"operator":"===","right":{"type":"Literal","value":"undefined"}},"consequent":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"props"},"property":{"type":"Identifier","name":"propName"},"computed":true},"right":{"type":"MemberExpression","object":{"type":"Identifier","name":"defaultProps"},"property":{"type":"Identifier","name":"propName"},"computed":true}}}]},"alternate":null}]}}]},"alternate":null},{"type":"ReturnStatement","argument":{"type":"Identifier","name":"props"}}]},"parenthesizedExpression":true}}]},"helper-defaults":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"obj"},{"type":"Identifier","name":"defaults"}],"body":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"keys"},"init":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"getOwnPropertyNames"},"computed":false},"arguments":[{"type":"Identifier","name":"defaults"}]}}],"kind":"var"},{"type":"ForStatement","init":{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"i"},"init":{"type":"Literal","value":0}}],"kind":"var"},"test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"i"},"operator":"<","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"keys"},"property":{"type":"Identifier","name":"length"},"computed":false}},"update":{"type":"UpdateExpression","operator":"++","prefix":false,"argument":{"type":"Identifier","name":"i"}},"body":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"key"},"init":{"type":"MemberExpression","object":{"type":"Identifier","name":"keys"},"property":{"type":"Identifier","name":"i"},"computed":true}}],"kind":"var"},{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"value"},"init":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"getOwnPropertyDescriptor"},"computed":false},"arguments":[{"type":"Identifier","name":"defaults"},{"type":"Identifier","name":"key"}]}}],"kind":"var"},{"type":"IfStatement","test":{"type":"LogicalExpression","left":{"type":"LogicalExpression","left":{"type":"Identifier","name":"value"},"operator":"&&","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"value"},"property":{"type":"Identifier","name":"configurable"},"computed":false}},"operator":"&&","right":{"type":"BinaryExpression","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"obj"},"property":{"type":"Identifier","name":"key"},"computed":true},"operator":"===","right":{"type":"Identifier","name":"undefined"}}},"consequent":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"defineProperty"},"computed":false},"arguments":[{"type":"Identifier","name":"obj"},{"type":"Identifier","name":"key"},{"type":"Identifier","name":"value"}]}}]},"alternate":null}]}},{"type":"ReturnStatement","argument":{"type":"Identifier","name":"obj"}}]},"parenthesizedExpression":true}}]},"helper-define-decorated-property-descriptor":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"target"},{"type":"Identifier","name":"key"},{"type":"Identifier","name":"descriptors"}],"body":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"_descriptor"},"init":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptors"},"property":{"type":"Identifier","name":"key"},"computed":true}}],"kind":"var"},{"type":"IfStatement","test":{"type":"UnaryExpression","operator":"!","prefix":true,"argument":{"type":"Identifier","name":"_descriptor"}},"consequent":{"type":"ReturnStatement","argument":null,"leadingComments":null,"trailingComments":null},"alternate":null},{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"descriptor","leadingComments":null},"init":{"type":"ObjectExpression","properties":[]},"leadingComments":null}],"kind":"var"},{"type":"ForInStatement","left":{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"_key"},"init":null}],"kind":"var"},"right":{"type":"Identifier","name":"_descriptor"},"body":{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"_key"},"computed":true},"right":{"type":"MemberExpression","object":{"type":"Identifier","name":"_descriptor"},"property":{"type":"Identifier","name":"_key"},"computed":true}},"trailingComments":null}},{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor","leadingComments":null},"property":{"type":"Identifier","name":"value"},"computed":false,"leadingComments":null},"right":{"type":"ConditionalExpression","test":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"initializer"},"computed":false},"consequent":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"MemberExpression","object":{"type":"Identifier","name":"descriptor"},"property":{"type":"Identifier","name":"initializer"},"computed":false},"property":{"type":"Identifier","name":"call"},"computed":false},"arguments":[{"type":"Identifier","name":"target"}]},"alternate":{"type":"Identifier","name":"undefined"}},"leadingComments":null}},{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"defineProperty"},"computed":false},"arguments":[{"type":"Identifier","name":"target"},{"type":"Identifier","name":"key"},{"type":"Identifier","name":"descriptor"}]}}]},"parenthesizedExpression":true}}]},"helper-define-property":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"obj"},{"type":"Identifier","name":"key"},{"type":"Identifier","name":"value"}],"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"key","leadingComments":null},"operator":"in","right":{"type":"Identifier","name":"obj"},"leadingComments":null},"consequent":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"defineProperty"},"computed":false},"arguments":[{"type":"Identifier","name":"obj"},{"type":"Identifier","name":"key"},{"type":"ObjectExpression","properties":[{"type":"Property","method":false,"shorthand":false,"computed":false,"key":{"type":"Identifier","name":"value"},"value":{"type":"Identifier","name":"value"},"kind":"init"},{"type":"Property","method":false,"shorthand":false,"computed":false,"key":{"type":"Identifier","name":"enumerable"},"value":{"type":"Literal","value":true},"kind":"init"},{"type":"Property","method":false,"shorthand":false,"computed":false,"key":{"type":"Identifier","name":"configurable"},"value":{"type":"Literal","value":true},"kind":"init"},{"type":"Property","method":false,"shorthand":false,"computed":false,"key":{"type":"Identifier","name":"writable"},"value":{"type":"Literal","value":true},"kind":"init"}]}]}}]},"alternate":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"obj"},"property":{"type":"Identifier","name":"key"},"computed":true},"right":{"type":"Identifier","name":"value"}}}]}},{"type":"ReturnStatement","argument":{"type":"Identifier","name":"obj"}}]},"parenthesizedExpression":true}}]},"helper-extends":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"LogicalExpression","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"assign"},"computed":false},"operator":"||","right":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"target"}],"body":{"type":"BlockStatement","body":[{"type":"ForStatement","init":{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"i"},"init":{"type":"Literal","value":1}}],"kind":"var"},"test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"i"},"operator":"<","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"arguments"},"property":{"type":"Identifier","name":"length"},"computed":false}},"update":{"type":"UpdateExpression","operator":"++","prefix":false,"argument":{"type":"Identifier","name":"i"}},"body":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"source"},"init":{"type":"MemberExpression","object":{"type":"Identifier","name":"arguments"},"property":{"type":"Identifier","name":"i"},"computed":true}}],"kind":"var"},{"type":"ForInStatement","left":{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"key"},"init":null}],"kind":"var"},"right":{"type":"Identifier","name":"source"},"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"MemberExpression","object":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"prototype"},"computed":false},"property":{"type":"Identifier","name":"hasOwnProperty"},"computed":false},"property":{"type":"Identifier","name":"call"},"computed":false},"arguments":[{"type":"Identifier","name":"source"},{"type":"Identifier","name":"key"}]},"consequent":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"target"},"property":{"type":"Identifier","name":"key"},"computed":true},"right":{"type":"MemberExpression","object":{"type":"Identifier","name":"source"},"property":{"type":"Identifier","name":"key"},"computed":true}}}]},"alternate":null}]}}]}},{"type":"ReturnStatement","argument":{"type":"Identifier","name":"target"}}]}}}}]},"helper-get":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":{"type":"Identifier","name":"get"},"generator":false,"expression":false,"params":[{"type":"Identifier","name":"object"},{"type":"Identifier","name":"property"},{"type":"Identifier","name":"receiver"}],"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"object"},"operator":"===","right":{"type":"Literal","value":null,"rawValue":null}},"consequent":{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"Identifier","name":"object"},"right":{"type":"MemberExpression","object":{"type":"Identifier","name":"Function"},"property":{"type":"Identifier","name":"prototype"},"computed":false}}},"alternate":null},{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"desc"},"init":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"getOwnPropertyDescriptor"},"computed":false},"arguments":[{"type":"Identifier","name":"object"},{"type":"Identifier","name":"property"}]}}],"kind":"var"},{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"desc"},"operator":"===","right":{"type":"Identifier","name":"undefined"}},"consequent":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"parent"},"init":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"getPrototypeOf"},"computed":false},"arguments":[{"type":"Identifier","name":"object"}]}}],"kind":"var"},{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"parent"},"operator":"===","right":{"type":"Literal","value":null,"rawValue":null}},"consequent":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"Identifier","name":"undefined"}}]},"alternate":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"CallExpression","callee":{"type":"Identifier","name":"get"},"arguments":[{"type":"Identifier","name":"parent"},{"type":"Identifier","name":"property"},{"type":"Identifier","name":"receiver"}]}}]}}]},"alternate":{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"Literal","value":"value"},"operator":"in","right":{"type":"Identifier","name":"desc"}},"consequent":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"MemberExpression","object":{"type":"Identifier","name":"desc"},"property":{"type":"Identifier","name":"value"},"computed":false}}]},"alternate":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"getter"},"init":{"type":"MemberExpression","object":{"type":"Identifier","name":"desc"},"property":{"type":"Identifier","name":"get"},"computed":false}}],"kind":"var"},{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"getter"},"operator":"===","right":{"type":"Identifier","name":"undefined"}},"consequent":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"Identifier","name":"undefined"}}]},"alternate":null},{"type":"ReturnStatement","argument":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"getter"},"property":{"type":"Identifier","name":"call"},"computed":false},"arguments":[{"type":"Identifier","name":"receiver"}]}}]}}}]},"parenthesizedExpression":true}}]},"helper-has-own":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"MemberExpression","object":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"prototype"},"computed":false},"property":{"type":"Identifier","name":"hasOwnProperty"},"computed":false}}]},"helper-inherits":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"subClass"},{"type":"Identifier","name":"superClass"}],"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"LogicalExpression","left":{"type":"BinaryExpression","left":{"type":"UnaryExpression","operator":"typeof","prefix":true,"argument":{"type":"Identifier","name":"superClass"}},"operator":"!==","right":{"type":"Literal","value":"function"}},"operator":"&&","right":{"type":"BinaryExpression","left":{"type":"Identifier","name":"superClass"},"operator":"!==","right":{"type":"Literal","value":null,"rawValue":null}}},"consequent":{"type":"BlockStatement","body":[{"type":"ThrowStatement","argument":{"type":"NewExpression","callee":{"type":"Identifier","name":"TypeError"},"arguments":[{"type":"BinaryExpression","left":{"type":"Literal","value":"Super expression must either be null or a function, not "},"operator":"+","right":{"type":"UnaryExpression","operator":"typeof","prefix":true,"argument":{"type":"Identifier","name":"superClass"}}}]}}]},"alternate":null},{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"subClass"},"property":{"type":"Identifier","name":"prototype"},"computed":false},"right":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"create"},"computed":false},"arguments":[{"type":"LogicalExpression","left":{"type":"Identifier","name":"superClass"},"operator":"&&","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"superClass"},"property":{"type":"Identifier","name":"prototype"},"computed":false}},{"type":"ObjectExpression","properties":[{"type":"Property","method":false,"shorthand":false,"computed":false,"key":{"type":"Identifier","name":"constructor"},"value":{"type":"ObjectExpression","properties":[{"type":"Property","method":false,"shorthand":false,"computed":false,"key":{"type":"Identifier","name":"value"},"value":{"type":"Identifier","name":"subClass"},"kind":"init"},{"type":"Property","method":false,"shorthand":false,"computed":false,"key":{"type":"Identifier","name":"enumerable"},"value":{"type":"Literal","value":false},"kind":"init"},{"type":"Property","method":false,"shorthand":false,"computed":false,"key":{"type":"Identifier","name":"writable"},"value":{"type":"Literal","value":true},"kind":"init"},{"type":"Property","method":false,"shorthand":false,"computed":false,"key":{"type":"Identifier","name":"configurable"},"value":{"type":"Literal","value":true},"kind":"init"}]},"kind":"init"}]}]}}},{"type":"IfStatement","test":{"type":"Identifier","name":"superClass"},"consequent":{"type":"ExpressionStatement","expression":{"type":"ConditionalExpression","test":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"setPrototypeOf"},"computed":false},"consequent":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"setPrototypeOf"},"computed":false},"arguments":[{"type":"Identifier","name":"subClass"},{"type":"Identifier","name":"superClass"}]},"alternate":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"subClass"},"property":{"type":"Identifier","name":"__proto__"},"computed":false},"right":{"type":"Identifier","name":"superClass"}}}},"alternate":null}]},"parenthesizedExpression":true}}]},"helper-instanceof":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"left"},{"type":"Identifier","name":"right"}],"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"LogicalExpression","left":{"type":"BinaryExpression","left":{"type":"Identifier","name":"right"},"operator":"!=","right":{"type":"Literal","value":null,"rawValue":null}},"operator":"&&","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"right"},"property":{"type":"MemberExpression","object":{"type":"Identifier","name":"Symbol"},"property":{"type":"Identifier","name":"hasInstance"},"computed":false},"computed":true}},"consequent":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"right"},"property":{"type":"MemberExpression","object":{"type":"Identifier","name":"Symbol"},"property":{"type":"Identifier","name":"hasInstance"},"computed":false},"computed":true},"arguments":[{"type":"Identifier","name":"left"}]}}]},"alternate":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"BinaryExpression","left":{"type":"Identifier","name":"left"},"operator":"instanceof","right":{"type":"Identifier","name":"right"}}}]}}]},"parenthesizedExpression":true}}]},"helper-interop-export-wildcard":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"obj"},{"type":"Identifier","name":"defaults"}],"body":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"newObj"},"init":{"type":"CallExpression","callee":{"type":"Identifier","name":"defaults"},"arguments":[{"type":"ObjectExpression","properties":[]},{"type":"Identifier","name":"obj"}]}}],"kind":"var"},{"type":"ExpressionStatement","expression":{"type":"UnaryExpression","operator":"delete","prefix":true,"argument":{"type":"MemberExpression","object":{"type":"Identifier","name":"newObj"},"property":{"type":"Literal","value":"default"},"computed":true}}},{"type":"ReturnStatement","argument":{"type":"Identifier","name":"newObj"}}]},"parenthesizedExpression":true}}]},"helper-interop-require-default":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"obj"}],"body":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"ConditionalExpression","test":{"type":"LogicalExpression","left":{"type":"Identifier","name":"obj"},"operator":"&&","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"obj"},"property":{"type":"Identifier","name":"__esModule"},"computed":false}},"consequent":{"type":"Identifier","name":"obj"},"alternate":{"type":"ObjectExpression","properties":[{"type":"Property","method":false,"shorthand":false,"computed":false,"key":{"type":"Literal","value":"default"},"value":{"type":"Identifier","name":"obj"},"kind":"init"}]}}}]},"parenthesizedExpression":true}}]},"helper-interop-require-wildcard":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"obj"}],"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"LogicalExpression","left":{"type":"Identifier","name":"obj"},"operator":"&&","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"obj"},"property":{"type":"Identifier","name":"__esModule"},"computed":false}},"consequent":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"Identifier","name":"obj"}}]},"alternate":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"newObj"},"init":{"type":"ObjectExpression","properties":[]}}],"kind":"var"},{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"obj"},"operator":"!=","right":{"type":"Literal","value":null,"rawValue":null}},"consequent":{"type":"BlockStatement","body":[{"type":"ForInStatement","left":{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"key"},"init":null}],"kind":"var"},"right":{"type":"Identifier","name":"obj"},"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"MemberExpression","object":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"prototype"},"computed":false},"property":{"type":"Identifier","name":"hasOwnProperty"},"computed":false},"property":{"type":"Identifier","name":"call"},"computed":false},"arguments":[{"type":"Identifier","name":"obj"},{"type":"Identifier","name":"key"}]},"consequent":{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"newObj"},"property":{"type":"Identifier","name":"key"},"computed":true},"right":{"type":"MemberExpression","object":{"type":"Identifier","name":"obj"},"property":{"type":"Identifier","name":"key"},"computed":true}}},"alternate":null}]}}]},"alternate":null},{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"newObj"},"property":{"type":"Literal","value":"default"},"computed":true},"right":{"type":"Identifier","name":"obj"}}},{"type":"ReturnStatement","argument":{"type":"Identifier","name":"newObj"}}]}}]},"parenthesizedExpression":true}}]},"helper-interop-require":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"obj"}],"body":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"ConditionalExpression","test":{"type":"LogicalExpression","left":{"type":"Identifier","name":"obj"},"operator":"&&","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"obj"},"property":{"type":"Identifier","name":"__esModule"},"computed":false}},"consequent":{"type":"MemberExpression","object":{"type":"Identifier","name":"obj"},"property":{"type":"Literal","value":"default"},"computed":true},"alternate":{"type":"Identifier","name":"obj"}}}]},"parenthesizedExpression":true}}]},"helper-new-arrow-check":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"innerThis"},{"type":"Identifier","name":"boundThis"}],"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"innerThis"},"operator":"!==","right":{"type":"Identifier","name":"boundThis"}},"consequent":{"type":"BlockStatement","body":[{"type":"ThrowStatement","argument":{"type":"NewExpression","callee":{"type":"Identifier","name":"TypeError"},"arguments":[{"type":"Literal","value":"Cannot instantiate an arrow function"}]}}]},"alternate":null}]},"parenthesizedExpression":true}}]},"helper-object-destructuring-empty":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"obj"}],"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"obj"},"operator":"==","right":{"type":"Literal","value":null,"rawValue":null}},"consequent":{"type":"ThrowStatement","argument":{"type":"NewExpression","callee":{"type":"Identifier","name":"TypeError"},"arguments":[{"type":"Literal","value":"Cannot destructure undefined"}]}},"alternate":null}]},"parenthesizedExpression":true}}]},"helper-object-without-properties":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"obj"},{"type":"Identifier","name":"keys"}],"body":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"target"},"init":{"type":"ObjectExpression","properties":[]}}],"kind":"var"},{"type":"ForInStatement","left":{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"i"},"init":null}],"kind":"var"},"right":{"type":"Identifier","name":"obj"},"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"keys"},"property":{"type":"Identifier","name":"indexOf"},"computed":false},"arguments":[{"type":"Identifier","name":"i"}]},"operator":">=","right":{"type":"Literal","value":0}},"consequent":{"type":"ContinueStatement","label":null},"alternate":null},{"type":"IfStatement","test":{"type":"UnaryExpression","operator":"!","prefix":true,"argument":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"MemberExpression","object":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"prototype"},"computed":false},"property":{"type":"Identifier","name":"hasOwnProperty"},"computed":false},"property":{"type":"Identifier","name":"call"},"computed":false},"arguments":[{"type":"Identifier","name":"obj"},{"type":"Identifier","name":"i"}]}},"consequent":{"type":"ContinueStatement","label":null},"alternate":null},{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"target"},"property":{"type":"Identifier","name":"i"},"computed":true},"right":{"type":"MemberExpression","object":{"type":"Identifier","name":"obj"},"property":{"type":"Identifier","name":"i"},"computed":true}}}]}},{"type":"ReturnStatement","argument":{"type":"Identifier","name":"target"}}]},"parenthesizedExpression":true}}]},"helper-self-global":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"ConditionalExpression","test":{"type":"BinaryExpression","left":{"type":"UnaryExpression","operator":"typeof","prefix":true,"argument":{"type":"Identifier","name":"global"}},"operator":"===","right":{"type":"Literal","value":"undefined"}},"consequent":{"type":"Identifier","name":"self"},"alternate":{"type":"Identifier","name":"global"}}}]},"helper-set":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":{"type":"Identifier","name":"set"},"generator":false,"expression":false,"params":[{"type":"Identifier","name":"object"},{"type":"Identifier","name":"property"},{"type":"Identifier","name":"value"},{"type":"Identifier","name":"receiver"}],"body":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"desc"},"init":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"getOwnPropertyDescriptor"},"computed":false},"arguments":[{"type":"Identifier","name":"object"},{"type":"Identifier","name":"property"}]}}],"kind":"var"},{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"desc"},"operator":"===","right":{"type":"Identifier","name":"undefined"}},"consequent":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"parent"},"init":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"getPrototypeOf"},"computed":false},"arguments":[{"type":"Identifier","name":"object"}]}}],"kind":"var"},{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"parent"},"operator":"!==","right":{"type":"Literal","value":null,"rawValue":null}},"consequent":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"Identifier","name":"set"},"arguments":[{"type":"Identifier","name":"parent"},{"type":"Identifier","name":"property"},{"type":"Identifier","name":"value"},{"type":"Identifier","name":"receiver"}]}}]},"alternate":null}]},"alternate":{"type":"IfStatement","test":{"type":"LogicalExpression","left":{"type":"BinaryExpression","left":{"type":"Literal","value":"value"},"operator":"in","right":{"type":"Identifier","name":"desc"}},"operator":"&&","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"desc"},"property":{"type":"Identifier","name":"writable"},"computed":false}},"consequent":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"desc"},"property":{"type":"Identifier","name":"value"},"computed":false},"right":{"type":"Identifier","name":"value"}}}]},"alternate":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"setter"},"init":{"type":"MemberExpression","object":{"type":"Identifier","name":"desc"},"property":{"type":"Identifier","name":"set"},"computed":false}}],"kind":"var"},{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"setter"},"operator":"!==","right":{"type":"Identifier","name":"undefined"}},"consequent":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"setter"},"property":{"type":"Identifier","name":"call"},"computed":false},"arguments":[{"type":"Identifier","name":"receiver"},{"type":"Identifier","name":"value"}]}}]},"alternate":null}]}}},{"type":"ReturnStatement","argument":{"type":"Identifier","name":"value"}}]},"parenthesizedExpression":true}}]},"helper-slice":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"MemberExpression","object":{"type":"MemberExpression","object":{"type":"Identifier","name":"Array"},"property":{"type":"Identifier","name":"prototype"},"computed":false},"property":{"type":"Identifier","name":"slice"},"computed":false}}]},"helper-sliced-to-array-loose":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"arr"},{"type":"Identifier","name":"i"}],"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Array"},"property":{"type":"Identifier","name":"isArray"},"computed":false},"arguments":[{"type":"Identifier","name":"arr"}]},"consequent":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"Identifier","name":"arr"}}]},"alternate":{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"Symbol"},"property":{"type":"Identifier","name":"iterator"},"computed":false},"operator":"in","right":{"type":"CallExpression","callee":{"type":"Identifier","name":"Object"},"arguments":[{"type":"Identifier","name":"arr"}]}},"consequent":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"_arr"},"init":{"type":"ArrayExpression","elements":[]}}],"kind":"var"},{"type":"ForStatement","init":{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"_iterator"},"init":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"arr"},"property":{"type":"MemberExpression","object":{"type":"Identifier","name":"Symbol"},"property":{"type":"Identifier","name":"iterator"},"computed":false},"computed":true},"arguments":[]}},{"type":"VariableDeclarator","id":{"type":"Identifier","name":"_step"},"init":null}],"kind":"var"},"test":{"type":"UnaryExpression","operator":"!","prefix":true,"argument":{"type":"MemberExpression","object":{"type":"AssignmentExpression","operator":"=","left":{"type":"Identifier","name":"_step"},"right":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"_iterator"},"property":{"type":"Identifier","name":"next"},"computed":false},"arguments":[]},"parenthesizedExpression":true},"property":{"type":"Identifier","name":"done"},"computed":false}},"update":null,"body":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"_arr"},"property":{"type":"Identifier","name":"push"},"computed":false},"arguments":[{"type":"MemberExpression","object":{"type":"Identifier","name":"_step"},"property":{"type":"Identifier","name":"value"},"computed":false}]}},{"type":"IfStatement","test":{"type":"LogicalExpression","left":{"type":"Identifier","name":"i"},"operator":"&&","right":{"type":"BinaryExpression","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"_arr"},"property":{"type":"Identifier","name":"length"},"computed":false},"operator":"===","right":{"type":"Identifier","name":"i"}}},"consequent":{"type":"BreakStatement","label":null},"alternate":null}]}},{"type":"ReturnStatement","argument":{"type":"Identifier","name":"_arr"}}]},"alternate":{"type":"BlockStatement","body":[{"type":"ThrowStatement","argument":{"type":"NewExpression","callee":{"type":"Identifier","name":"TypeError"},"arguments":[{"type":"Literal","value":"Invalid attempt to destructure non-iterable instance"}]}}]}}}]},"parenthesizedExpression":true}}]},"helper-sliced-to-array":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[],"body":{"type":"BlockStatement","body":[{"type":"FunctionDeclaration","id":{"type":"Identifier","name":"sliceIterator","leadingComments":null},"generator":false,"expression":false,"params":[{"type":"Identifier","name":"arr"},{"type":"Identifier","name":"i"}],"body":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"_arr","leadingComments":null},"init":{"type":"ArrayExpression","elements":[]},"leadingComments":null}],"kind":"var"},{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"_n"},"init":{"type":"Literal","value":true}}],"kind":"var"},{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"_d"},"init":{"type":"Literal","value":false}}],"kind":"var"},{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"_e"},"init":{"type":"Identifier","name":"undefined"}}],"kind":"var"},{"type":"TryStatement","block":{"type":"BlockStatement","body":[{"type":"ForStatement","init":{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"_i"},"init":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"arr"},"property":{"type":"MemberExpression","object":{"type":"Identifier","name":"Symbol"},"property":{"type":"Identifier","name":"iterator"},"computed":false},"computed":true},"arguments":[]}},{"type":"VariableDeclarator","id":{"type":"Identifier","name":"_s"},"init":null}],"kind":"var"},"test":{"type":"UnaryExpression","operator":"!","prefix":true,"argument":{"type":"AssignmentExpression","operator":"=","left":{"type":"Identifier","name":"_n"},"right":{"type":"MemberExpression","object":{"type":"AssignmentExpression","operator":"=","left":{"type":"Identifier","name":"_s"},"right":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"_i"},"property":{"type":"Identifier","name":"next"},"computed":false},"arguments":[]},"parenthesizedExpression":true},"property":{"type":"Identifier","name":"done"},"computed":false},"parenthesizedExpression":true}},"update":{"type":"AssignmentExpression","operator":"=","left":{"type":"Identifier","name":"_n"},"right":{"type":"Literal","value":true}},"body":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"_arr"},"property":{"type":"Identifier","name":"push"},"computed":false},"arguments":[{"type":"MemberExpression","object":{"type":"Identifier","name":"_s"},"property":{"type":"Identifier","name":"value"},"computed":false}]}},{"type":"IfStatement","test":{"type":"LogicalExpression","left":{"type":"Identifier","name":"i"},"operator":"&&","right":{"type":"BinaryExpression","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"_arr"},"property":{"type":"Identifier","name":"length"},"computed":false},"operator":"===","right":{"type":"Identifier","name":"i"}}},"consequent":{"type":"BreakStatement","label":null},"alternate":null}]}}]},"handler":{"type":"CatchClause","param":{"type":"Identifier","name":"err"},"body":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"Identifier","name":"_d"},"right":{"type":"Literal","value":true}}},{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"Identifier","name":"_e"},"right":{"type":"Identifier","name":"err"}}}]}},"guardedHandlers":[],"finalizer":{"type":"BlockStatement","body":[{"type":"TryStatement","block":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"LogicalExpression","left":{"type":"UnaryExpression","operator":"!","prefix":true,"argument":{"type":"Identifier","name":"_n"}},"operator":"&&","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"_i"},"property":{"type":"Literal","value":"return"},"computed":true}},"consequent":{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"_i"},"property":{"type":"Literal","value":"return"},"computed":true},"arguments":[]}},"alternate":null}]},"handler":null,"guardedHandlers":[],"finalizer":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"Identifier","name":"_d"},"consequent":{"type":"ThrowStatement","argument":{"type":"Identifier","name":"_e"}},"alternate":null}]}}]}},{"type":"ReturnStatement","argument":{"type":"Identifier","name":"_arr"}}]}},{"type":"ReturnStatement","argument":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"arr"},{"type":"Identifier","name":"i"}],"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Array"},"property":{"type":"Identifier","name":"isArray"},"computed":false},"arguments":[{"type":"Identifier","name":"arr"}]},"consequent":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"Identifier","name":"arr"}}]},"alternate":{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"Symbol"},"property":{"type":"Identifier","name":"iterator"},"computed":false},"operator":"in","right":{"type":"CallExpression","callee":{"type":"Identifier","name":"Object"},"arguments":[{"type":"Identifier","name":"arr"}]}},"consequent":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"CallExpression","callee":{"type":"Identifier","name":"sliceIterator"},"arguments":[{"type":"Identifier","name":"arr"},{"type":"Identifier","name":"i"}]}}]},"alternate":{"type":"BlockStatement","body":[{"type":"ThrowStatement","argument":{"type":"NewExpression","callee":{"type":"Identifier","name":"TypeError"},"arguments":[{"type":"Literal","value":"Invalid attempt to destructure non-iterable instance"}]}}]}}}]}}}]},"parenthesizedExpression":true},"arguments":[]}}]},"helper-tagged-template-literal-loose":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"strings"},{"type":"Identifier","name":"raw"}],"body":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"strings"},"property":{"type":"Identifier","name":"raw"},"computed":false},"right":{"type":"Identifier","name":"raw"}}},{"type":"ReturnStatement","argument":{"type":"Identifier","name":"strings"}}]},"parenthesizedExpression":true}}]},"helper-tagged-template-literal":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"strings"},{"type":"Identifier","name":"raw"}],"body":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"freeze"},"computed":false},"arguments":[{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"defineProperties"},"computed":false},"arguments":[{"type":"Identifier","name":"strings"},{"type":"ObjectExpression","properties":[{"type":"Property","method":false,"shorthand":false,"computed":false,"key":{"type":"Identifier","name":"raw"},"value":{"type":"ObjectExpression","properties":[{"type":"Property","method":false,"shorthand":false,"computed":false,"key":{"type":"Identifier","name":"value"},"value":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Object"},"property":{"type":"Identifier","name":"freeze"},"computed":false},"arguments":[{"type":"Identifier","name":"raw"}]},"kind":"init"}]},"kind":"init"}]}]}]}}]},"parenthesizedExpression":true}}]},"helper-temporal-assert-defined":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"val"},{"type":"Identifier","name":"name"},{"type":"Identifier","name":"undef"}],"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"val"},"operator":"===","right":{"type":"Identifier","name":"undef"}},"consequent":{"type":"BlockStatement","body":[{"type":"ThrowStatement","argument":{"type":"NewExpression","callee":{"type":"Identifier","name":"ReferenceError"},"arguments":[{"type":"BinaryExpression","left":{"type":"Identifier","name":"name"},"operator":"+","right":{"type":"Literal","value":" is not defined - temporal dead zone"}}]}}]},"alternate":null},{"type":"ReturnStatement","argument":{"type":"Literal","value":true}}]},"parenthesizedExpression":true}}]},"helper-temporal-undefined":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"ObjectExpression","properties":[],"parenthesizedExpression":true}}]},"helper-to-array":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"arr"}],"body":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"ConditionalExpression","test":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Array"},"property":{"type":"Identifier","name":"isArray"},"computed":false},"arguments":[{"type":"Identifier","name":"arr"}]},"consequent":{"type":"Identifier","name":"arr"},"alternate":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Array"},"property":{"type":"Identifier","name":"from"},"computed":false},"arguments":[{"type":"Identifier","name":"arr"}]}}}]},"parenthesizedExpression":true}}]},"helper-to-consumable-array":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"arr"}],"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Array"},"property":{"type":"Identifier","name":"isArray"},"computed":false},"arguments":[{"type":"Identifier","name":"arr"}]},"consequent":{"type":"BlockStatement","body":[{"type":"ForStatement","init":{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"i"},"init":{"type":"Literal","value":0}},{"type":"VariableDeclarator","id":{"type":"Identifier","name":"arr2"},"init":{"type":"CallExpression","callee":{"type":"Identifier","name":"Array"},"arguments":[{"type":"MemberExpression","object":{"type":"Identifier","name":"arr"},"property":{"type":"Identifier","name":"length"},"computed":false}]}}],"kind":"var"},"test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"i"},"operator":"<","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"arr"},"property":{"type":"Identifier","name":"length"},"computed":false}},"update":{"type":"UpdateExpression","operator":"++","prefix":false,"argument":{"type":"Identifier","name":"i"}},"body":{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"arr2"},"property":{"type":"Identifier","name":"i"},"computed":true},"right":{"type":"MemberExpression","object":{"type":"Identifier","name":"arr"},"property":{"type":"Identifier","name":"i"},"computed":true}}}},{"type":"ReturnStatement","argument":{"type":"Identifier","name":"arr2"}}]},"alternate":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Array"},"property":{"type":"Identifier","name":"from"},"computed":false},"arguments":[{"type":"Identifier","name":"arr"}]}}]}}]},"parenthesizedExpression":true}}]},"helper-typeof-react-element":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"LogicalExpression","left":{"type":"LogicalExpression","left":{"type":"LogicalExpression","left":{"type":"BinaryExpression","left":{"type":"UnaryExpression","operator":"typeof","prefix":true,"argument":{"type":"Identifier","name":"Symbol"}},"operator":"===","right":{"type":"Literal","value":"function"}},"operator":"&&","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"Symbol"},"property":{"type":"Literal","value":"for"},"computed":true}},"operator":"&&","right":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"Symbol"},"property":{"type":"Literal","value":"for"},"computed":true},"arguments":[{"type":"Literal","value":"react.element"}]}},"operator":"||","right":{"type":"Literal","value":60103}}}]},"helper-typeof":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"obj"}],"body":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"ConditionalExpression","test":{"type":"LogicalExpression","left":{"type":"Identifier","name":"obj"},"operator":"&&","right":{"type":"BinaryExpression","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"obj"},"property":{"type":"Identifier","name":"constructor"},"computed":false},"operator":"===","right":{"type":"Identifier","name":"Symbol"}}},"consequent":{"type":"Literal","value":"symbol"},"alternate":{"type":"UnaryExpression","operator":"typeof","prefix":true,"argument":{"type":"Identifier","name":"obj"}}}}]},"parenthesizedExpression":true}}]},"let-scoping-return":{"type":"Program","body":[{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"UnaryExpression","operator":"typeof","prefix":true,"argument":{"type":"Identifier","name":"RETURN"}},"operator":"===","right":{"type":"Literal","value":"object"}},"consequent":{"type":"ReturnStatement","argument":{"type":"MemberExpression","object":{"type":"Identifier","name":"RETURN"},"property":{"type":"Identifier","name":"v"},"computed":false}},"alternate":null}]},"named-function":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[],"body":{"type":"BlockStatement","body":[{"type":"FunctionDeclaration","id":{"type":"Identifier","name":"GET_OUTER_ID"},"generator":false,"expression":false,"params":[],"body":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"Identifier","name":"FUNCTION_ID"}}]}},{"type":"ReturnStatement","argument":{"type":"Identifier","name":"FUNCTION"}}]},"parenthesizedExpression":true},"arguments":[]}}]},"property-method-assignment-wrapper-generator":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"FUNCTION_KEY"}],"body":{"type":"BlockStatement","body":[{"type":"FunctionDeclaration","id":{"type":"Identifier","name":"FUNCTION_ID"},"generator":true,"expression":false,"params":[],"body":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"YieldExpression","delegate":true,"argument":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"FUNCTION_KEY"},"property":{"type":"Identifier","name":"apply"},"computed":false},"arguments":[{"type":"ThisExpression"},{"type":"Identifier","name":"arguments"}]}}}]}},{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"FUNCTION_ID"},"property":{"type":"Identifier","name":"toString"},"computed":false},"right":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[],"body":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"FUNCTION_KEY"},"property":{"type":"Identifier","name":"toString"},"computed":false},"arguments":[]}}]}}}},{"type":"ReturnStatement","argument":{"type":"Identifier","name":"FUNCTION_ID"}}]},"parenthesizedExpression":true},"arguments":[{"type":"Identifier","name":"FUNCTION"}]}}]},"property-method-assignment-wrapper":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"FUNCTION_KEY"}],"body":{"type":"BlockStatement","body":[{"type":"FunctionDeclaration","id":{"type":"Identifier","name":"FUNCTION_ID"},"generator":false,"expression":false,"params":[],"body":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"FUNCTION_KEY"},"property":{"type":"Identifier","name":"apply"},"computed":false},"arguments":[{"type":"ThisExpression"},{"type":"Identifier","name":"arguments"}]}}]}},{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"FUNCTION_ID"},"property":{"type":"Identifier","name":"toString"},"computed":false},"right":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[],"body":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"FUNCTION_KEY"},"property":{"type":"Identifier","name":"toString"},"computed":false},"arguments":[]}}]}}}},{"type":"ReturnStatement","argument":{"type":"Identifier","name":"FUNCTION_ID"}}]},"parenthesizedExpression":true},"arguments":[{"type":"Identifier","name":"FUNCTION"}]}}]},"prototype-identifier":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"MemberExpression","object":{"type":"Identifier","name":"CLASS_NAME"},"property":{"type":"Identifier","name":"prototype"},"computed":false}}]},"require-assign-key":{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"VARIABLE_NAME"},"init":{"type":"MemberExpression","object":{"type":"CallExpression","callee":{"type":"Identifier","name":"require"},"arguments":[{"type":"Identifier","name":"MODULE_NAME"}]},"property":{"type":"Identifier","name":"KEY"},"computed":false}}],"kind":"var"}]},"require":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"Identifier","name":"require"},"arguments":[{"type":"Identifier","name":"MODULE_NAME"}]}}]},"rest":{"type":"Program","body":[{"type":"ForStatement","init":{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"LEN"},"init":{"type":"MemberExpression","object":{"type":"Identifier","name":"ARGUMENTS"},"property":{"type":"Identifier","name":"length"},"computed":false}},{"type":"VariableDeclarator","id":{"type":"Identifier","name":"ARRAY"},"init":{"type":"CallExpression","callee":{"type":"Identifier","name":"Array"},"arguments":[{"type":"Identifier","name":"ARRAY_LEN"}]}},{"type":"VariableDeclarator","id":{"type":"Identifier","name":"KEY"},"init":{"type":"Identifier","name":"START"}}],"kind":"var"},"test":{"type":"BinaryExpression","left":{"type":"Identifier","name":"KEY"},"operator":"<","right":{"type":"Identifier","name":"LEN"}},"update":{"type":"UpdateExpression","operator":"++","prefix":false,"argument":{"type":"Identifier","name":"KEY"}},"body":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"ARRAY"},"property":{"type":"Identifier","name":"ARRAY_KEY"},"computed":true},"right":{"type":"MemberExpression","object":{"type":"Identifier","name":"ARGUMENTS"},"property":{"type":"Identifier","name":"KEY"},"computed":true}}}]}}]},"self-contained-helpers-head":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"exports"},"property":{"type":"Literal","value":"default"},"computed":true},"right":{"type":"Identifier","name":"HELPER"}}},{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"exports"},"property":{"type":"Identifier","name":"__esModule"},"computed":false},"right":{"type":"Literal","value":true}}}]},"system":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"MemberExpression","object":{"type":"Identifier","name":"System"},"property":{"type":"Identifier","name":"register"},"computed":false},"arguments":[{"type":"Identifier","name":"MODULE_NAME"},{"type":"Identifier","name":"MODULE_DEPENDENCIES"},{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"EXPORT_IDENTIFIER"}],"body":{"type":"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":"ObjectExpression","properties":[{"type":"Property","method":false,"shorthand":false,"computed":false,"key":{"type":"Identifier","name":"setters"},"value":{"type":"Identifier","name":"SETTERS"},"kind":"init"},{"type":"Property","method":false,"shorthand":false,"computed":false,"key":{"type":"Identifier","name":"execute"},"value":{"type":"Identifier","name":"EXECUTE"},"kind":"init"}]}}]}}]}}]},"tail-call-body":{"type":"Program","body":[{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"AGAIN_ID"},"init":{"type":"Literal","value":true}}],"kind":"var"},{"type":"LabeledStatement","body":{"type":"WhileStatement","test":{"type":"Identifier","name":"AGAIN_ID"},"body":{"type":"ExpressionStatement","expression":{"type":"Identifier","name":"BLOCK"}}},"label":{"type":"Identifier","name":"FUNCTION_ID"}}]}]},"test-exports":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"BinaryExpression","left":{"type":"UnaryExpression","operator":"typeof","prefix":true,"argument":{"type":"Identifier","name":"exports"}},"operator":"!==","right":{"type":"Literal","value":"undefined"}}}]},"test-module":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"BinaryExpression","left":{"type":"UnaryExpression","operator":"typeof","prefix":true,"argument":{"type":"Identifier","name":"module"}},"operator":"!==","right":{"type":"Literal","value":"undefined"}}}]},"umd-commonjs-strict":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"root"},{"type":"Identifier","name":"factory"}],"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"LogicalExpression","left":{"type":"BinaryExpression","left":{"type":"UnaryExpression","operator":"typeof","prefix":true,"argument":{"type":"Identifier","name":"define"}},"operator":"===","right":{"type":"Literal","value":"function"}},"operator":"&&","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"define"},"property":{"type":"Identifier","name":"amd"},"computed":false}},"consequent":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"Identifier","name":"define"},"arguments":[{"type":"Identifier","name":"AMD_ARGUMENTS"},{"type":"Identifier","name":"factory"}]}}]},"alternate":{"type":"IfStatement","test":{"type":"BinaryExpression","left":{"type":"UnaryExpression","operator":"typeof","prefix":true,"argument":{"type":"Identifier","name":"exports"}},"operator":"===","right":{"type":"Literal","value":"object"}},"consequent":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"Identifier","name":"factory"},"arguments":[{"type":"Identifier","name":"COMMON_ARGUMENTS"}]}}]},"alternate":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"Identifier","name":"factory"},"arguments":[{"type":"Identifier","name":"BROWSER_ARGUMENTS"}]}}]}}}]},"parenthesizedExpression":true},"arguments":[{"type":"Identifier","name":"UMD_ROOT"},{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"FACTORY_PARAMETERS"}],"body":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"Identifier","name":"FACTORY_BODY"}}]}}]}}]},"umd-runner-body":{"type":"Program","body":[{"type":"ExpressionStatement","expression":{"type":"FunctionExpression","id":null,"generator":false,"expression":false,"params":[{"type":"Identifier","name":"global"},{"type":"Identifier","name":"factory"}],"body":{"type":"BlockStatement","body":[{"type":"IfStatement","test":{"type":"LogicalExpression","left":{"type":"BinaryExpression","left":{"type":"UnaryExpression","operator":"typeof","prefix":true,"argument":{"type":"Identifier","name":"define"}},"operator":"===","right":{"type":"Literal","value":"function"}},"operator":"&&","right":{"type":"MemberExpression","object":{"type":"Identifier","name":"define"},"property":{"type":"Identifier","name":"amd"},"computed":false}},"consequent":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"Identifier","name":"define"},"arguments":[{"type":"Identifier","name":"AMD_ARGUMENTS"},{"type":"Identifier","name":"factory"}]}}]},"alternate":{"type":"IfStatement","test":{"type":"Identifier","name":"COMMON_TEST"},"consequent":{"type":"BlockStatement","body":[{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"Identifier","name":"factory"},"arguments":[{"type":"Identifier","name":"COMMON_ARGUMENTS"}]}}]},"alternate":{"type":"BlockStatement","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"mod"},"init":{"type":"ObjectExpression","properties":[{"type":"Property","method":false,"shorthand":false,"computed":false,"key":{"type":"Identifier","name":"exports"},"value":{"type":"ObjectExpression","properties":[]},"kind":"init"}]}}],"kind":"var"},{"type":"ExpressionStatement","expression":{"type":"CallExpression","callee":{"type":"Identifier","name":"factory"},"arguments":[{"type":"MemberExpression","object":{"type":"Identifier","name":"mod"},"property":{"type":"Identifier","name":"exports"},"computed":false},{"type":"Identifier","name":"BROWSER_ARGUMENTS"}]}},{"type":"ExpressionStatement","expression":{"type":"AssignmentExpression","operator":"=","left":{"type":"MemberExpression","object":{"type":"Identifier","name":"global"},"property":{"type":"Identifier","name":"GLOBAL_ARG"},"computed":false},"right":{"type":"MemberExpression","object":{"type":"Identifier","name":"mod"},"property":{"type":"Identifier","name":"exports"},"computed":false}}}]}}}]},"parenthesizedExpression":true}}]}}
},{}],186:[function(require,module,exports){
"use strict";
module.exports = require('./lib/plugin');
},{"./lib/plugin":187}],187:[function(require,module,exports){
(function (__filename){
"use strict";

var colors = require('colors/safe');
var util = require('babel-core/lib/util');

function log(message) {
	// use console.error as stdout seems swallowed
	console.error(colors.gray("[STREAMLINE-PLUGIN] " + message));
}

function warn(message) {
	// use console.error as stdout seems swallowed
	console.error(colors.yellow("[STREAMLINE-PLUGIN] " + message));
}

function error(message) {
	return new Error(colors.magenta("[STREAMLINE-PLUGIN] " + message));
}

function assert(cond) {
	if (!cond) throw error("assertion failed");
}

function is_(node) {
	return node.type === 'Identifier' && node.name === '_' && !node.$done;
}

function isTilde_(node) {
	return node.type === 'UnaryExpression' && node.operator === '~' && is_(node.argument);
}

function isCallbackArg(node) {
	return is_(node) || isTilde_(node);
}

function isFutureArg(node) {
	return node.type === 'UnaryExpression' && node.operator === '!' && is_(node.argument);
}

function isPromiseArg(node) {
	return node.type === 'UnaryExpression' && node.operator === 'void' && is_(node.argument);
}

function isRShift_(node) {
	return node.type === 'BinaryExpression' && node.operator === '>>' && is_(node.left);
}

function isArray_(node) {
	return node.type === 'ArrayExpression' && node.elements.length === 1 && is_(node.elements[0]);
}

function findIndex(array, pred) {
	for (var i = 0; i < array.length; i++)
	if (pred(array[i])) return i;
	return -1;
}

var runtimes = {
	await: {
		name: 'await',
		generator: false,
		async: true,
	},
	callbacks: {
		name: 'callbacks',
		generator: true,
		regenerator: true,
		async: false,
	},
	fibers: {
		name: 'fibers',
		generator: false,
		async: false,
	},
	generators: {
		name: 'generators',
		generator: true,
		async: false,
	}
}

function makeTemplate(name, code) {
	util.templates["streamline-" + name] = util.parseTemplate(__filename, code);
}

function applyTemplate(name, nodes) {
	return util.template("streamline-" + name, nodes)
}

function runtimeCall(t, state, name, args) {
	return t.CallExpression(
	t.memberExpression(
	t.identifier(state.streamline.runtimeVar), t.identifier(name)), args)
}
makeTemplate('call-wrapper', '$runtime$.$method$($file$, $line$, $object$, $property$, $index1$, $index2$, $returnArray$)');

function streamlineCall(t, scope, state, node, method, index1, index2, returnArray) {
	var callee = node.callee;
	var object, property;
	if (t.isMemberExpression(callee)) {
		object = callee.object;
		property = callee.computed ? callee.property : t.literal(callee.property.name);
	} else {
		/* enable this later
		var binding = scope.getBinding(callee.name);
		if (binding && binding.identifier.isStreamlineId && method === 'await' && index2 == null && !returnArray) {
			return t.callExpression(t.memberExpression(callee, t.literal('awaitWrapper-' + index1), true), node.arguments);
		}
		*/
		object = t.literal(null);
		property = callee;
	}

	var fn = applyTemplate('call-wrapper', {
		$runtime$: t.identifier(state.streamline.runtimeVar),
		$method$: t.identifier(method),
		$file$: t.identifier(state.streamline.filenameVar),
		$line$: t.literal(node.loc && node.loc.start.line),
		$object$: object,
		$property$: property,
		$index1$: t.literal(index1),
		$index2$: t.literal(index2),
		$returnArray$: t.literal(returnArray),
	});
	return t.callExpression(fn, node.arguments);
}

function awaitWrap(t, state, expression) {
	var rt = state.streamline.runtime;
	if (rt.async) return t.awaitExpression(expression);
	else if (rt.generator) return t.yieldExpression(expression);
	else return expression;
}

function awaitCall(t, scope, state, node, index1, index2, returnArray) {
	return awaitWrap(t, state, streamlineCall(t, scope, state, node, 'await', index1, index2, returnArray));
}

function futureCall(t, scope, state, node, index) {
	return streamlineCall(t, scope, state, node, 'future', index, null, false);
}

makeTemplate('function-wrapper', '$runtime$.async(function $id_$($params$) { $body$ }, $index$, $arity$)');

function guessName(t, parent) {
	if (t.isVariableDeclarator(parent)) {
		return parent.id.name;
	}
	if (t.isProperty(parent)) {
		if (t.isIdentifier(parent.key)) return parent.key.name;
		if (t.isLiteral(parent.key)) return '' + parent.key.value;
	}
	return "";
}

function streamlineFunction(t, state, node, scope, index) {
	var params = node.params;
	var rt = state.streamline.runtime;

	var body = node.type === 'ArrowFunctionExpression' && !t.isStatement(node.body) ? t.returnStatement(node.body) : node.body;
	var innerCall = applyTemplate('function-wrapper', {
		$runtime$: t.identifier(state.streamline.runtimeVar),
		$id_$: t.identifier(scope.generateUid(wrapName(node.id ? node.id.name : guessName(t, this.parent)))),
		$params$: params.slice(),
		$body$: body,
		$index$: t.literal(index),
		$arity$: t.literal(params.length),
	});
	var innerFunc = innerCall.arguments[0];
	if (node.type === 'ArrowFunctionExpression') innerFunc.type = node.type;
	innerFunc.generator = rt.generator;
	innerFunc.async = rt.async;
	innerFunc.isStreamline = true;
	return innerCall;
}

function streamlineNew(t, state, node, index) {
	return t.callExpression(
	runtimeCall(t, state, 'new', [
		t.identifier(state.streamline.filenameVar),
		t.literal(node.loc && node.loc.start.line), 
		node.callee, 
		t.literal(index)]), node.arguments);
}

makeTemplate("require-var", "var $name = typeof require === 'function' ? require($path) : Streamline.require($path);");
makeTemplate("require", "typeof require === 'function' ? require($path) : Streamline.require($path)");

function runtimePrologue(t, state) {
	var prologue = [];
	if (state.streamline.runtime.regenerator && state.streamline.hasGenerator) {
		prologue.push(applyTemplate("require-var", {
			$name: t.identifier('regeneratorRuntime'),
			$path: t.literal('streamline-runtime/lib/callbacks/regenerator'),
		}));
	}
	if (canTransform(state)) {
		prologue.push(applyTemplate("require-var", {
			$name: t.identifier(state.streamline.runtimeVar),
			$path: t.literal('streamline-runtime/lib/' + state.streamline.runtime.name + '/runtime'),
		}));
		prologue.push(t.variableDeclaration('var', [t.variableDeclarator(t.identifier(state.streamline.filenameVar), t.literal(state.opts.filename))]))
	}
	return prologue;
}

makeTemplate("program-wrapper", "$runtime$.async($arg$, 0, 1).call(this, function(err) { if (err) throw err; })");

function asyncProgramWrapper(t, state, node, scope) {
	var wrapper = t.functionExpression(t.identifier(scope.generateUid('')), [], //
		t.blockStatement(node.body), //
		state.streamline.runtime.generator, //
		state.streamline.runtime.async);

	return applyTemplate("program-wrapper", {
		$runtime$: t.identifier(state.streamline.runtimeVar),
		$arg$: wrapper,
	});
}

function canTransform(state) {
	return state.streamline.forceTransform || /^(unknown|.*\._(js|coffee))$/.test(state.opts.filename);
}

function quiet(state) {
	var st = state.opts.extra.streamline;
	return st && st.quiet;
}

function wrapName(name) {
	return /\$\$/.test(name) ? name : "$$" + name + "$$";
}

makeTemplate("var-decl", "var $name$ = $value$;");

function hoist(t, scope, nodes) {
	// Brute force hoisting by moving function bodies to top of enclosing functions
	var hoisted = nodes.filter(function(node) {
		return t.isFunctionDeclaration(node);
	}).map(function(node) {
		return applyTemplate('var-decl', {
			$name$: t.identifier(node.id.name),
			$value$: t.functionExpression(t.identifier(node.id.name), node.params, node.body, node.generator, node.async),
		})
	});
	var other = nodes.filter(function(node) {
		return !t.isFunctionDeclaration(node);
	});
	return hoisted.concat(other);
}

function likeThis(t, node) {
	return t.isThisExpression(node) || (t.isIdentifier(node) && node.name === '_this');
}

function unwrapIIFE(t, node) {
	var callee = node.callee;
	if (t.isFunctionExpression(callee) && callee.params.length === 0 && node.arguments.length === 0) {
		// (function() { ... })() ->  (await (async function() { ... })())
		return callee;
	} else if (t.isMemberExpression(callee) && t.isFunctionExpression(callee.object) && callee.object.params.length === 0) {
		if (callee.property.name === 'call' && node.arguments.length === 1 && likeThis(t, node.arguments[0])) {
			// (function() { ... }).call(this) ->  (await (async function(_) { ... }).call(this, _)
			return callee.object;
		} else if (callee.property.name === 'apply' && node.arguments.length === 2 && likeThis(t, node.arguments[0]) && node.arguments[1].name === 'arguments') {
			// (function() { ... }).apply(this, arguments) ->  (await (async function() { ... }).apply(this, arguments))
			return callee.object;
		}
	}
	return null;
}

function checkProgramAsync(t, node, parent, scope, state) {
	scope.traverse(node, {
		CallExpression: function(node, parent, scope, state) {
			var index = findIndex(node.arguments, isCallbackArg);
			if (index >= 0) {
				if (!state.streamline.programIsAsync) {
					state.streamline.programIsAsync = true;
					if (!quiet(state)) warn(state.errorWithNode(node, "warning: async call at top level").message);					
				}
			} else {
				var innerFunc = unwrapIIFE(t, node);
				if (innerFunc) innerFunc.isIIFE = true;
			}
		},
		Function: function(node, parent, scope, state) {
			if (!node.isIIFE) this.skip();
		},
	}, state);
	return state.streamline.programIsAsync;
}

module.exports = function(pluginArguments) {
	var Plugin = pluginArguments.Plugin;
	var t = pluginArguments.types;
	return new Plugin("streamline", {
		visitor: {
			Identifier: {
				exit: function(node, parent, scope, state) {
					if (!canTransform(state)) return;
					if (is_(node) && !node.done) {
						throw state.errorWithNode(node, "unexpected _");
					}
				}
			},
			Program: {
				enter: function(node, parent, scope, state) {
					if (!state.opts.extra.streamline) state.opts.extra.streamline = {}
					var st = state.opts.extra.streamline;
					if (!st.runtime) {
						if (!quiet(state)) warn("streamline runtime not configured. Defaulting to callbacks");
						st.runtime = "callbacks";
					}
					state.streamline = {
						forceTransform: st.forceTransform,
						runtime: runtimes[st.runtime],
						fastLocs: [],
					};
					if (!state.streamline.runtime) throw new Error("invalid runtime configuration: " + st.runtime);

					//if (!quiet(state)) log("transforming " + state.opts.filename + ' (' + st.runtime + ')');
					state.streamline.runtimeVar = scope.generateUid('streamline');
					state.streamline.filenameVar = scope.generateUid('filename');
					node = t.program(hoist(t, scope, node.body));
					node.isStreamline = checkProgramAsync(t, node, parent, scope, state);
					return node;
				},
				exit: function(node, parent, scope, state) {
					if (!canTransform(state) && !state.streamline.hasGenerator) return;
					if (state.streamline.fastLocs.length > 0) {
						if (!quiet(state)) warn(state.opts.filename + ": " + "obsolete fast syntax detected at lines " + state.streamline.fastLocs.map(function(loc) {
							return loc ? loc.start.line : '?';
						}).join(','));
					}
					return t.program(runtimePrologue(t, state).concat(state.streamline.programIsAsync ? asyncProgramWrapper(t, state, node, scope) : node.body));
				}
			},
			Function: function(node, parent, scope, state) {
				// regenerator transform does not automatically add its variable to we do it (even on .js files)
				if (node.async || node.generator) state.streamline.hasGenerator = true;
				if (!canTransform(state)) return;
				var index;
				if ((index = findIndex(node.params, is_)) >= 0) {
					if (t.isFunctionDeclaration(node) && node.loc) throw state.errorWithNode(node, "nested function declaration");
					var param = node.params[index];
					param.$done = true;
					if (node.generator) throw state.errorWithNode(param, "parameter _ not allowed in generator function");
					if (node.async) throw state.errorWithNode(param, "parameter _ not allowed: function already marked `async`");
					return streamlineFunction.call(this, t, state, node, scope, index);
				}

			},
			CallExpression: function(node, parent, scope, state) {
				if (!canTransform(state)) return;
				var callee = node.callee;
				var index1;
				var funcScope = scope.getFunctionParent();
				if ((index1 = findIndex(node.arguments, isCallbackArg)) >= 0) {
					if (isTilde_(node.arguments[index1])) state.streamline.fastLocs.push(node.arguments[index1].loc);
					if (!funcScope.block.isStreamline) throw state.errorWithNode(node, "unexpected `_` argument: enclosing function does not have an `_` parameter.");
					node.arguments[index1] = t.literal(true);
					var index2 = findIndex(node.arguments, is_);
					if (index2 >= 0) {
						node.arguments[index2] = t.literal(true);
						if (findIndex(node.arguments, is_) >= 0) throw state.errorWithNode(node, "async call cannot have more than 2 _ arguments");
						return awaitCall(t, scope, state, node, index1, index2, false);
					}
					return awaitCall(t, scope, state, node, index1, null, false);
				}
				if ((index1 = findIndex(node.arguments, isFutureArg)) >= 0) {
					node.arguments[index1] = t.literal(false);
					return futureCall(t, scope, state, node, index1);
				}
				if ((index1 = findIndex(node.arguments, isPromiseArg)) >= 0) {
					node.arguments[index1] = t.literal(false);
					return t.memberExpression(futureCall(t, scope, state, node, index1), t.identifier('promise'));
				}
				if ((index1 = findIndex(node.arguments, isRShift_)) >= 0) {
					state.streamline.fastLocs.push(node.arguments[index1].loc);
					node.arguments[index1] = node.arguments[index1].right;
					return node;
				}
				if ((index1 = findIndex(node.arguments, isArray_)) >= 0) {
					node.arguments[index1] = t.literal(true);
					return awaitCall(t, scope, state, node, index1, null, true);
				}
				if (is_(callee) && node.arguments.length === 2) {
					state.streamline.fastLocs.push(node.loc);
					return node.arguments[0];
				}
				if (funcScope.block.isStreamline) {
					// handle CoffeeScript IIFE 
					var innerFunc = unwrapIIFE(t, node);
					if (innerFunc && !innerFunc.isStreamline) {
						// this is a CS IIFE - (and we are not recursing)
						innerFunc.isStreamline = true;
						if (state.streamline.runtime.async) {
							innerFunc.async = true;
							return t.awaitExpression(node);
						} else if (state.streamline.runtime.generator) {
							innerFunc.generator = true;
							return t.yieldExpression(node);
						} else {
							return node;
						}
					}
				}
			},
			NewExpression: function(node, parent, scope, state) {
				if (!canTransform(state)) return;
				var index;
				if ((index = findIndex(node.arguments, is_)) >= 0) {
					node.arguments[index] = t.literal(true);
					return awaitWrap(t, state, streamlineNew(t, state, node, index));
				}
			},
			"YieldExpression|AwaitExpression": function(node, parent, scope, state) {
				// regenerator transform does not automatically add its variable to we do it (even on .js files)
				state.streamline.hasGenerator = true;
			},
			BlockStatement: function(node, parent, scope, state) {
				return t.blockStatement(hoist(t, scope, node.body));
			},
		}
	});
}
}).call(this,"/node_modules/babel-plugin-streamline/lib/plugin.js")
},{"babel-core/lib/util":41,"colors/safe":203}],188:[function(require,module,exports){

},{}],189:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],190:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":191}],191:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],192:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],193:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":192,"_process":191,"inherits":189}],194:[function(require,module,exports){
/*

The MIT License (MIT)

Original Library 
  - Copyright (c) Marak Squires

Additional functionality
 - Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

var colors = {};
module['exports'] = colors;

colors.themes = {};

var ansiStyles = colors.styles = require('./styles');
var defineProps = Object.defineProperties;

colors.supportsColor = require('./system/supports-colors');

if (typeof colors.enabled === "undefined") {
  colors.enabled = colors.supportsColor;
}

colors.stripColors = colors.strip = function(str){
  return ("" + str).replace(/\x1B\[\d+m/g, '');
};


var stylize = colors.stylize = function stylize (str, style) {
  if (!colors.enabled) {
    return str+'';
  }

  return ansiStyles[style].open + str + ansiStyles[style].close;
}

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
var escapeStringRegexp = function (str) {
  if (typeof str !== 'string') {
    throw new TypeError('Expected a string');
  }
  return str.replace(matchOperatorsRe,  '\\$&');
}

function build(_styles) {
  var builder = function builder() {
    return applyStyle.apply(builder, arguments);
  };
  builder._styles = _styles;
  // __proto__ is used because we must return a function, but there is
  // no way to create a function with a different prototype.
  builder.__proto__ = proto;
  return builder;
}

var styles = (function () {
  var ret = {};
  ansiStyles.grey = ansiStyles.gray;
  Object.keys(ansiStyles).forEach(function (key) {
    ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');
    ret[key] = {
      get: function () {
        return build(this._styles.concat(key));
      }
    };
  });
  return ret;
})();

var proto = defineProps(function colors() {}, styles);

function applyStyle() {
  var args = arguments;
  var argsLen = args.length;
  var str = argsLen !== 0 && String(arguments[0]);
  if (argsLen > 1) {
    for (var a = 1; a < argsLen; a++) {
      str += ' ' + args[a];
    }
  }

  if (!colors.enabled || !str) {
    return str;
  }

  var nestedStyles = this._styles;

  var i = nestedStyles.length;
  while (i--) {
    var code = ansiStyles[nestedStyles[i]];
    str = code.open + str.replace(code.closeRe, code.open) + code.close;
  }

  return str;
}

function applyTheme (theme) {
  for (var style in theme) {
    (function(style){
      colors[style] = function(str){
        if (typeof theme[style] === 'object'){
          var out = str;
          for (var i in theme[style]){
            out = colors[theme[style][i]](out);
          }
          return out;
        }
        return colors[theme[style]](str);
      };
    })(style)
  }
}

colors.setTheme = function (theme) {
  if (typeof theme === 'string') {
    try {
      colors.themes[theme] = require(theme);
      applyTheme(colors.themes[theme]);
      return colors.themes[theme];
    } catch (err) {
      console.log(err);
      return err;
    }
  } else {
    applyTheme(theme);
  }
};

function init() {
  var ret = {};
  Object.keys(styles).forEach(function (name) {
    ret[name] = {
      get: function () {
        return build([name]);
      }
    };
  });
  return ret;
}

var sequencer = function sequencer (map, str) {
  var exploded = str.split(""), i = 0;
  exploded = exploded.map(map);
  return exploded.join("");
};

// custom formatter methods
colors.trap = require('./custom/trap');
colors.zalgo = require('./custom/zalgo');

// maps
colors.maps = {};
colors.maps.america = require('./maps/america');
colors.maps.zebra = require('./maps/zebra');
colors.maps.rainbow = require('./maps/rainbow');
colors.maps.random = require('./maps/random')

for (var map in colors.maps) {
  (function(map){
    colors[map] = function (str) {
      return sequencer(colors.maps[map], str);
    }
  })(map)
}

defineProps(colors, init());
},{"./custom/trap":195,"./custom/zalgo":196,"./maps/america":197,"./maps/rainbow":198,"./maps/random":199,"./maps/zebra":200,"./styles":201,"./system/supports-colors":202}],195:[function(require,module,exports){
module['exports'] = function runTheTrap (text, options) {
  var result = "";
  text = text || "Run the trap, drop the bass";
  text = text.split('');
  var trap = {
    a: ["\u0040", "\u0104", "\u023a", "\u0245", "\u0394", "\u039b", "\u0414"],
    b: ["\u00df", "\u0181", "\u0243", "\u026e", "\u03b2", "\u0e3f"],
    c: ["\u00a9", "\u023b", "\u03fe"],
    d: ["\u00d0", "\u018a", "\u0500" , "\u0501" ,"\u0502", "\u0503"],
    e: ["\u00cb", "\u0115", "\u018e", "\u0258", "\u03a3", "\u03be", "\u04bc", "\u0a6c"],
    f: ["\u04fa"],
    g: ["\u0262"],
    h: ["\u0126", "\u0195", "\u04a2", "\u04ba", "\u04c7", "\u050a"],
    i: ["\u0f0f"],
    j: ["\u0134"],
    k: ["\u0138", "\u04a0", "\u04c3", "\u051e"],
    l: ["\u0139"],
    m: ["\u028d", "\u04cd", "\u04ce", "\u0520", "\u0521", "\u0d69"],
    n: ["\u00d1", "\u014b", "\u019d", "\u0376", "\u03a0", "\u048a"],
    o: ["\u00d8", "\u00f5", "\u00f8", "\u01fe", "\u0298", "\u047a", "\u05dd", "\u06dd", "\u0e4f"],
    p: ["\u01f7", "\u048e"],
    q: ["\u09cd"],
    r: ["\u00ae", "\u01a6", "\u0210", "\u024c", "\u0280", "\u042f"],
    s: ["\u00a7", "\u03de", "\u03df", "\u03e8"],
    t: ["\u0141", "\u0166", "\u0373"],
    u: ["\u01b1", "\u054d"],
    v: ["\u05d8"],
    w: ["\u0428", "\u0460", "\u047c", "\u0d70"],
    x: ["\u04b2", "\u04fe", "\u04fc", "\u04fd"],
    y: ["\u00a5", "\u04b0", "\u04cb"],
    z: ["\u01b5", "\u0240"]
  }
  text.forEach(function(c){
    c = c.toLowerCase();
    var chars = trap[c] || [" "];
    var rand = Math.floor(Math.random() * chars.length);
    if (typeof trap[c] !== "undefined") {
      result += trap[c][rand];
    } else {
      result += c;
    }
  });
  return result;

}

},{}],196:[function(require,module,exports){
// please no
module['exports'] = function zalgo(text, options) {
  text = text || "   he is here   ";
  var soul = {
    "up" : [
      '̍', '̎', '̄', '̅',
      '̿', '̑', '̆', '̐',
      '͒', '͗', '͑', '̇',
      '̈', '̊', '͂', '̓',
      '̈', '͊', '͋', '͌',
      '̃', '̂', '̌', '͐',
      '̀', '́', '̋', '̏',
      '̒', '̓', '̔', '̽',
      '̉', 'ͣ', 'ͤ', 'ͥ',
      'ͦ', 'ͧ', 'ͨ', 'ͩ',
      'ͪ', 'ͫ', 'ͬ', 'ͭ',
      'ͮ', 'ͯ', '̾', '͛',
      '͆', '̚'
    ],
    "down" : [
      '̖', '̗', '̘', '̙',
      '̜', '̝', '̞', '̟',
      '̠', '̤', '̥', '̦',
      '̩', '̪', '̫', '̬',
      '̭', '̮', '̯', '̰',
      '̱', '̲', '̳', '̹',
      '̺', '̻', '̼', 'ͅ',
      '͇', '͈', '͉', '͍',
      '͎', '͓', '͔', '͕',
      '͖', '͙', '͚', '̣'
    ],
    "mid" : [
      '̕', '̛', '̀', '́',
      '͘', '̡', '̢', '̧',
      '̨', '̴', '̵', '̶',
      '͜', '͝', '͞',
      '͟', '͠', '͢', '̸',
      '̷', '͡', ' ҉'
    ]
  },
  all = [].concat(soul.up, soul.down, soul.mid),
  zalgo = {};

  function randomNumber(range) {
    var r = Math.floor(Math.random() * range);
    return r;
  }

  function is_char(character) {
    var bool = false;
    all.filter(function (i) {
      bool = (i === character);
    });
    return bool;
  }
  

  function heComes(text, options) {
    var result = '', counts, l;
    options = options || {};
    options["up"] =   typeof options["up"]   !== 'undefined' ? options["up"]   : true;
    options["mid"] =  typeof options["mid"]  !== 'undefined' ? options["mid"]  : true;
    options["down"] = typeof options["down"] !== 'undefined' ? options["down"] : true;
    options["size"] = typeof options["size"] !== 'undefined' ? options["size"] : "maxi";
    text = text.split('');
    for (l in text) {
      if (is_char(l)) {
        continue;
      }
      result = result + text[l];
      counts = {"up" : 0, "down" : 0, "mid" : 0};
      switch (options.size) {
      case 'mini':
        counts.up = randomNumber(8);
        counts.mid = randomNumber(2);
        counts.down = randomNumber(8);
        break;
      case 'maxi':
        counts.up = randomNumber(16) + 3;
        counts.mid = randomNumber(4) + 1;
        counts.down = randomNumber(64) + 3;
        break;
      default:
        counts.up = randomNumber(8) + 1;
        counts.mid = randomNumber(6) / 2;
        counts.down = randomNumber(8) + 1;
        break;
      }

      var arr = ["up", "mid", "down"];
      for (var d in arr) {
        var index = arr[d];
        for (var i = 0 ; i <= counts[index]; i++) {
          if (options[index]) {
            result = result + soul[index][randomNumber(soul[index].length)];
          }
        }
      }
    }
    return result;
  }
  // don't summon him
  return heComes(text, options);
}

},{}],197:[function(require,module,exports){
var colors = require('../colors');

module['exports'] = (function() {
  return function (letter, i, exploded) {
    if(letter === " ") return letter;
    switch(i%3) {
      case 0: return colors.red(letter);
      case 1: return colors.white(letter)
      case 2: return colors.blue(letter)
    }
  }
})();
},{"../colors":194}],198:[function(require,module,exports){
var colors = require('../colors');

module['exports'] = (function () {
  var rainbowColors = ['red', 'yellow', 'green', 'blue', 'magenta']; //RoY G BiV
  return function (letter, i, exploded) {
    if (letter === " ") {
      return letter;
    } else {
      return colors[rainbowColors[i++ % rainbowColors.length]](letter);
    }
  };
})();


},{"../colors":194}],199:[function(require,module,exports){
var colors = require('../colors');

module['exports'] = (function () {
  var available = ['underline', 'inverse', 'grey', 'yellow', 'red', 'green', 'blue', 'white', 'cyan', 'magenta'];
  return function(letter, i, exploded) {
    return letter === " " ? letter : colors[available[Math.round(Math.random() * (available.length - 1))]](letter);
  };
})();
},{"../colors":194}],200:[function(require,module,exports){
var colors = require('../colors');

module['exports'] = function (letter, i, exploded) {
  return i % 2 === 0 ? letter : colors.inverse(letter);
};
},{"../colors":194}],201:[function(require,module,exports){
/*
The MIT License (MIT)

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

var styles = {};
module['exports'] = styles;

var codes = {
  reset: [0, 0],

  bold: [1, 22],
  dim: [2, 22],
  italic: [3, 23],
  underline: [4, 24],
  inverse: [7, 27],
  hidden: [8, 28],
  strikethrough: [9, 29],

  black: [30, 39],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  white: [37, 39],
  gray: [90, 39],
  grey: [90, 39],

  bgBlack: [40, 49],
  bgRed: [41, 49],
  bgGreen: [42, 49],
  bgYellow: [43, 49],
  bgBlue: [44, 49],
  bgMagenta: [45, 49],
  bgCyan: [46, 49],
  bgWhite: [47, 49],

  // legacy styles for colors pre v1.0.0
  blackBG: [40, 49],
  redBG: [41, 49],
  greenBG: [42, 49],
  yellowBG: [43, 49],
  blueBG: [44, 49],
  magentaBG: [45, 49],
  cyanBG: [46, 49],
  whiteBG: [47, 49]

};

Object.keys(codes).forEach(function (key) {
  var val = codes[key];
  var style = styles[key] = [];
  style.open = '\u001b[' + val[0] + 'm';
  style.close = '\u001b[' + val[1] + 'm';
});
},{}],202:[function(require,module,exports){
(function (process){
/*
The MIT License (MIT)

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

var argv = process.argv;

module.exports = (function () {
  if (argv.indexOf('--no-color') !== -1 ||
    argv.indexOf('--color=false') !== -1) {
    return false;
  }

  if (argv.indexOf('--color') !== -1 ||
    argv.indexOf('--color=true') !== -1 ||
    argv.indexOf('--color=always') !== -1) {
    return true;
  }

  if (process.stdout && !process.stdout.isTTY) {
    return false;
  }

  if (process.platform === 'win32') {
    return true;
  }

  if ('COLORTERM' in process.env) {
    return true;
  }

  if (process.env.TERM === 'dumb') {
    return false;
  }

  if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM)) {
    return true;
  }

  return false;
})();
}).call(this,require('_process'))
},{"_process":191}],203:[function(require,module,exports){
//
// Remark: Requiring this file will use the "safe" colors API which will not touch String.prototype
//
//   var colors = require('colors/safe);
//   colors.red("foo")
//
//
var colors = require('./lib/colors');
module['exports'] = colors;
},{"./lib/colors":194}],204:[function(require,module,exports){
"use strict";

/// !doc
/// 
/// # Global context API
/// 
/// The global `context` is a reference which is maintained across asynchronous calls.
/// 
/// This context is very handy to store information that all calls should be able to access
/// but that you don't want to pass explicitly via function parameters. The most obvious example is
/// the `locale` that each request may set differently and that your low level libraries should
/// be able to retrieve to format messages.
/// 
/// `var globals = require('streamline-runtime').globals`
/// 
/// * `globals.context = ctx`
/// * `ctx = globals.context`  
///   sets and gets the context
/// 
/// Note: an empty context (`{}`) is automatically set by the server wrappers of the `ez-streams` module,
/// before they dispatch a request. So, with these wrappers, each request starts with a fresh empty context.
// This module may be loaded several times so we need a true global (with a secret name!).
// This implementation also allows us to share the context between modules compiled in callback and fibers mode.

Object.defineProperty(exports, 'globals', {
	get: function() {
		return require('./lib/util').getGlobals();
	}
});

Object.defineProperty(exports, 'flows', {
	get: function() {
		return require('./lib/flows');
	}
});

Object.defineProperty(exports, 'runtime', {
	get: function() {
		var util = require('./lib/util');
		return util.getGlobals().runtime || util.defaultRuntime();
	}, set: function(value) {
		var util = require('./lib/util');
		util.getGlobals(value);
	}
});

},{"./lib/flows":209,"./lib/util":214}],205:[function(require,module,exports){
var regeneratorRuntime = typeof require === "function" ? require("streamline-runtime/lib/callbacks/regenerator") : Streamline.require("streamline-runtime/lib/callbacks/regenerator");

var _streamline = typeof require === "function" ? require("streamline-runtime/lib/callbacks/runtime") : Streamline.require("streamline-runtime/lib/callbacks/runtime");

var _filename = "builtins._js";
/**
 * Copyright (c) 2012 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
/// !doc
///
/// # Streamline built-ins

(function (exports) {
	var _parallel = function _parallel(options) {
		if (typeof options === "number") return options;
		if (typeof options.parallel === "number") return options.parallel;
		return options.parallel ? -1 : 1;
	};

	"use strict";
	var VERSION = 3;

	var future = function (fn, args, i) {
		var err,
		    result,
		    done,
		    q = [],
		    self = this;
		args = Array.prototype.slice.call(args);
		args[i] = function (e, r) {
			err = e;
			result = r;
			done = true;
			q && q.forEach(function (f) {
				f.call(self, e, r);
			});
			q = null;
		};
		fn.apply(this, args);
		return function F(cb) {
			if (!cb) return F;
			if (done) cb.call(self, err, result);else q.push(cb);
		};
	};

	var funnel = require('../funnel');

	if (Array.prototype.forEach_ && Array.prototype.forEach_.version_ >= VERSION) return;

	// bail out (silently) if JS does not support defineProperty (IE 8).
	try {
		Object.defineProperty({}, 'x', {});
	} catch (e) {
		return;
	}

	var has = Object.prototype.hasOwnProperty;

	/* eslint-disable no-extend-native */

	/// ## Array functions 
	///
	/// These functions are asynchronous variants of the EcmaScript 5 Array functions.
	///
	/// Common Rules:
	///
	/// These variants are postfixed by an underscore. 
	/// They take the `_` callback as first parameter. 
	/// They pass the `_` callback as first argument to their `fn` callback. 
	/// Most of them have an optional `options` second parameter which controls the level of
	/// parallelism. This `options` parameter may be specified either as `{ parallel: par }`
	/// where `par` is an integer, or directly as a `par` integer value. 
	/// The `par` values are interpreted as follows:
	///
	/// * If absent or equal to 1, execution is sequential.
	/// * If > 1, at most `par` operations are parallelized.
	/// * if 0, a default number of operations are parallelized.
	///   This default is defined by `flows.funnel.defaultSize` (4 by default - see `flows` module).
	/// * If < 0 or Infinity, operations are fully parallelized (no limit).
	///
	/// Functions:
	///
	/// * `array.forEach_(_[, options], fn[, thisObj])` 
	///   `fn` is called as `fn(_, elt, i, array)`.
	delete Array.prototype.forEach_;
	Object.defineProperty(Array.prototype, 'forEach_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(regeneratorRuntime.mark(function _$$value$$(_, options, fn, thisObj) {
			var par, len, i;
			return regeneratorRuntime.wrap(function _$$value$$$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						if (typeof options === "function") {
								thisObj = fn;
								fn = options;
								options = 1;
							}
						par = _parallel(options);

						thisObj = thisObj !== undefined ? thisObj : this;
						len = this.length;

						if (!(par === 1 || len <= 1)) {
							context$2$0.next = 15;
							break;
						}

						i = 0;

					case 6:
						if (!(i < len)) {
							context$2$0.next = 13;
							break;
						}

						if (!has.call(this, i)) {
							context$2$0.next = 10;
							break;
						}

						context$2$0.next = 10;
						return _streamline.await(_filename, 95, fn, "call", 1, null, false)(thisObj, true, this[i], i, this);

					case 10:
						i++;
						context$2$0.next = 6;
						break;

					case 13:
						context$2$0.next = 17;
						break;

					case 15:
						context$2$0.next = 17;
						return _streamline.await(_filename, 98, this, "map_", 0, null, false)(true, par, fn, thisObj);

					case 17:
						return context$2$0.abrupt("return", this);

					case 18:
					case "end":
						return context$2$0.stop();
				}
			}, _$$value$$, this);
		}), 0, 4)
	});
	Array.prototype.forEach_.version_ = VERSION;
	/// * `result = array.map_(_[, options], fn[, thisObj])` 
	///   `fn` is called as `fn(_, elt, i, array)`.
	delete Array.prototype.map_;
	Object.defineProperty(Array.prototype, 'map_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(regeneratorRuntime.mark(function _$$value$$2(_, options, fn, thisObj) {
			var par, len, result, i, fun;
			return regeneratorRuntime.wrap(function _$$value$$2$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						if (typeof options === "function") {
								thisObj = fn;
								fn = options;
								options = 1;
							}
						par = _parallel(options);

						thisObj = thisObj !== undefined ? thisObj : this;
						len = this.length;

						if (!(par === 1 || len <= 1)) {
							context$2$0.next = 17;
							break;
						}

						result = new Array(len);
						i = 0;

					case 7:
						if (!(i < len)) {
							context$2$0.next = 15;
							break;
						}

						if (!has.call(this, i)) {
							context$2$0.next = 12;
							break;
						}

						context$2$0.next = 11;
						return _streamline.await(_filename, 124, fn, "call", 1, null, false)(thisObj, true, this[i], i, this);

					case 11:
						result[i] = context$2$0.sent;

					case 12:
						i++;
						context$2$0.next = 7;
						break;

					case 15:
						context$2$0.next = 28;
						break;

					case 17:
						fun = funnel(par);

						result = this.map(function (elt, i, arr) {
							return _streamline.future(_filename, 129, null, fun, 0, null, false)(false, _streamline.async(regeneratorRuntime.mark(function _$$$$(_) {
								return regeneratorRuntime.wrap(function _$$$$$(context$4$0) {
									while (1) switch (context$4$0.prev = context$4$0.next) {
										case 0:
											context$4$0.next = 2;
											return _streamline.await(_filename, 130, fn, "call", 1, null, false)(thisObj, true, elt, i, arr);

										case 2:
											return context$4$0.abrupt("return", context$4$0.sent);

										case 3:
										case "end":
											return context$4$0.stop();
									}
								}, _$$$$, this);
							}), 0, 1));
						});
						i = 0;

					case 20:
						if (!(i < len)) {
							context$2$0.next = 28;
							break;
						}

						if (!has.call(this, i)) {
							context$2$0.next = 25;
							break;
						}

						context$2$0.next = 24;
						return _streamline.await(_filename, 134, result, i, 0, null, false)(true);

					case 24:
						result[i] = context$2$0.sent;

					case 25:
						i++;
						context$2$0.next = 20;
						break;

					case 28:
						return context$2$0.abrupt("return", result);

					case 29:
					case "end":
						return context$2$0.stop();
				}
			}, _$$value$$2, this);
		}), 0, 4)
	});
	/// * `result = array.filter_(_[, options], fn[, thisObj])` 
	///   `fn` is called as `fn(_, elt, i, array)`.
	delete Array.prototype.filter_;
	Object.defineProperty(Array.prototype, 'filter_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(regeneratorRuntime.mark(function _$$value$$3(_, options, fn, thisObj) {
			var par, result, len, i, elt;
			return regeneratorRuntime.wrap(function _$$value$$3$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						if (typeof options === "function") {
								thisObj = fn;
								fn = options;
								options = 1;
							}
						par = _parallel(options);

						thisObj = thisObj !== undefined ? thisObj : this;
						result = [];
						len = this.length;

						if (!(par === 1 || len <= 1)) {
							context$2$0.next = 19;
							break;
						}

						i = 0;

					case 7:
						if (!(i < len)) {
							context$2$0.next = 17;
							break;
						}

						if (!has.call(this, i)) {
							context$2$0.next = 14;
							break;
						}

						elt = this[i];
						context$2$0.next = 12;
						return _streamline.await(_filename, 161, fn, "call", 1, null, false)(thisObj, true, elt, i, this);

					case 12:
						if (!context$2$0.sent) {
							context$2$0.next = 14;
							break;
						}

						result.push(elt);

					case 14:
						i++;
						context$2$0.next = 7;
						break;

					case 17:
						context$2$0.next = 21;
						break;

					case 19:
						context$2$0.next = 21;
						return _streamline.await(_filename, 165, this, "map_", 0, null, false)(true, par, _streamline.async(regeneratorRuntime.mark(function _$$$$2(_, elt, i, arr) {
							return regeneratorRuntime.wrap(function _$$$$2$(context$3$0) {
								while (1) switch (context$3$0.prev = context$3$0.next) {
									case 0:
										context$3$0.next = 2;
										return _streamline.await(_filename, 166, fn, "call", 1, null, false)(thisObj, true, elt, i, arr);

									case 2:
										if (!context$3$0.sent) {
											context$3$0.next = 4;
											break;
										}

										result.push(elt);

									case 4:
									case "end":
										return context$3$0.stop();
								}
							}, _$$$$2, this);
						}), 0, 4), thisObj);

					case 21:
						return context$2$0.abrupt("return", result);

					case 22:
					case "end":
						return context$2$0.stop();
				}
			}, _$$value$$3, this);
		}), 0, 4)
	});
	/// * `bool = array.every_(_[, options], fn[, thisObj])` 
	///   `fn` is called as `fn(_, elt, i, array)`.
	delete Array.prototype.every_;
	Object.defineProperty(Array.prototype, 'every_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(regeneratorRuntime.mark(function _$$value$$4(_, options, fn, thisObj) {
			var par, len, i, fun, futures;
			return regeneratorRuntime.wrap(function _$$value$$4$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						if (typeof options === "function") {
								thisObj = fn;
								fn = options;
								options = 1;
							}
						par = _parallel(options);

						thisObj = thisObj !== undefined ? thisObj : this;
						len = this.length;

						if (!(par === 1 || len <= 1)) {
							context$2$0.next = 19;
							break;
						}

						i = 0;

					case 6:
						if (!(i < len)) {
							context$2$0.next = 17;
							break;
						}

						context$2$0.t0 = has.call(this, i);

						if (!context$2$0.t0) {
							context$2$0.next = 12;
							break;
						}

						context$2$0.next = 11;
						return _streamline.await(_filename, 191, fn, "call", 1, null, false)(thisObj, true, this[i], i, this);

					case 11:
						context$2$0.t0 = !context$2$0.sent;

					case 12:
						if (!context$2$0.t0) {
							context$2$0.next = 14;
							break;
						}

						return context$2$0.abrupt("return", false);

					case 14:
						i++;
						context$2$0.next = 6;
						break;

					case 17:
						context$2$0.next = 34;
						break;

					case 19:
						fun = funnel(par);
						futures = this.map(function (elt, i, arr) {
							return _streamline.future(_filename, 196, null, fun, 0, null, false)(false, _streamline.async(regeneratorRuntime.mark(function _$$$$3(_) {
								return regeneratorRuntime.wrap(function _$$$$3$(context$4$0) {
									while (1) switch (context$4$0.prev = context$4$0.next) {
										case 0:
											context$4$0.next = 2;
											return _streamline.await(_filename, 197, fn, "call", 1, null, false)(thisObj, true, elt, i, arr);

										case 2:
											return context$4$0.abrupt("return", context$4$0.sent);

										case 3:
										case "end":
											return context$4$0.stop();
									}
								}, _$$$$3, this);
							}), 0, 1));
						});
						i = 0;

					case 22:
						if (!(i < len)) {
							context$2$0.next = 34;
							break;
						}

						context$2$0.t1 = has.call(this, i);

						if (!context$2$0.t1) {
							context$2$0.next = 28;
							break;
						}

						context$2$0.next = 27;
						return _streamline.await(_filename, 201, futures, i, 0, null, false)(true);

					case 27:
						context$2$0.t1 = !context$2$0.sent;

					case 28:
						if (!context$2$0.t1) {
							context$2$0.next = 31;
							break;
						}

						fun.close();
						return context$2$0.abrupt("return", false);

					case 31:
						i++;
						context$2$0.next = 22;
						break;

					case 34:
						return context$2$0.abrupt("return", true);

					case 35:
					case "end":
						return context$2$0.stop();
				}
			}, _$$value$$4, this);
		}), 0, 4)
	});
	/// * `bool = array.some_(_[, options], fn[, thisObj])` 
	///   `fn` is called as `fn(_, elt, i, array)`.
	delete Array.prototype.some_;
	Object.defineProperty(Array.prototype, 'some_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(regeneratorRuntime.mark(function _$$value$$5(_, options, fn, thisObj) {
			var par, len, i, fun, futures;
			return regeneratorRuntime.wrap(function _$$value$$5$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						if (typeof options === "function") {
								thisObj = fn;
								fn = options;
								options = 1;
							}
						par = _parallel(options);

						thisObj = thisObj !== undefined ? thisObj : this;
						len = this.length;

						if (!(par === 1 || len <= 1)) {
							context$2$0.next = 19;
							break;
						}

						i = 0;

					case 6:
						if (!(i < len)) {
							context$2$0.next = 17;
							break;
						}

						context$2$0.t0 = has.call(this, i);

						if (!context$2$0.t0) {
							context$2$0.next = 12;
							break;
						}

						context$2$0.next = 11;
						return _streamline.await(_filename, 228, fn, "call", 1, null, false)(thisObj, true, this[i], i, this);

					case 11:
						context$2$0.t0 = context$2$0.sent;

					case 12:
						if (!context$2$0.t0) {
							context$2$0.next = 14;
							break;
						}

						return context$2$0.abrupt("return", true);

					case 14:
						i++;
						context$2$0.next = 6;
						break;

					case 17:
						context$2$0.next = 34;
						break;

					case 19:
						fun = funnel(par);
						futures = this.map(function (elt, i, arr) {
							return _streamline.future(_filename, 233, null, fun, 0, null, false)(false, _streamline.async(regeneratorRuntime.mark(function _$$$$4(_) {
								return regeneratorRuntime.wrap(function _$$$$4$(context$4$0) {
									while (1) switch (context$4$0.prev = context$4$0.next) {
										case 0:
											context$4$0.next = 2;
											return _streamline.await(_filename, 234, fn, "call", 1, null, false)(thisObj, true, elt, i, arr);

										case 2:
											return context$4$0.abrupt("return", context$4$0.sent);

										case 3:
										case "end":
											return context$4$0.stop();
									}
								}, _$$$$4, this);
							}), 0, 1));
						});
						i = 0;

					case 22:
						if (!(i < len)) {
							context$2$0.next = 34;
							break;
						}

						context$2$0.t1 = has.call(this, i);

						if (!context$2$0.t1) {
							context$2$0.next = 28;
							break;
						}

						context$2$0.next = 27;
						return _streamline.await(_filename, 238, futures, i, 0, null, false)(true);

					case 27:
						context$2$0.t1 = context$2$0.sent;

					case 28:
						if (!context$2$0.t1) {
							context$2$0.next = 31;
							break;
						}

						fun.close();
						return context$2$0.abrupt("return", true);

					case 31:
						i++;
						context$2$0.next = 22;
						break;

					case 34:
						return context$2$0.abrupt("return", false);

					case 35:
					case "end":
						return context$2$0.stop();
				}
			}, _$$value$$5, this);
		}), 0, 4)
	});
	/// * `result = array.reduce_(_, fn, val[, thisObj])` 
	///   `fn` is called as `val = fn(_, val, elt, i, array)`.
	delete Array.prototype.reduce_;
	Object.defineProperty(Array.prototype, 'reduce_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(regeneratorRuntime.mark(function _$$value$$6(_, fn, v, thisObj) {
			var len, i;
			return regeneratorRuntime.wrap(function _$$value$$6$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						thisObj = thisObj !== undefined ? thisObj : this;
						len = this.length;
						i = 0;

					case 3:
						if (!(i < len)) {
							context$2$0.next = 11;
							break;
						}

						if (!has.call(this, i)) {
							context$2$0.next = 8;
							break;
						}

						context$2$0.next = 7;
						return _streamline.await(_filename, 258, fn, "call", 1, null, false)(thisObj, true, v, this[i], i, this);

					case 7:
						v = context$2$0.sent;

					case 8:
						i++;
						context$2$0.next = 3;
						break;

					case 11:
						return context$2$0.abrupt("return", v);

					case 12:
					case "end":
						return context$2$0.stop();
				}
			}, _$$value$$6, this);
		}), 0, 4)
	});
	/// * `result = array.reduceRight_(_, fn, val[, thisObj])` 
	///   `fn` is called as `val = fn(_, val, elt, i, array)`.
	delete Array.prototype.reduceRight_;
	Object.defineProperty(Array.prototype, 'reduceRight_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(regeneratorRuntime.mark(function _$$value$$7(_, fn, v, thisObj) {
			var len, i;
			return regeneratorRuntime.wrap(function _$$value$$7$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						thisObj = thisObj !== undefined ? thisObj : this;
						len = this.length;
						i = len - 1;

					case 3:
						if (!(i >= 0)) {
							context$2$0.next = 11;
							break;
						}

						if (!has.call(this, i)) {
							context$2$0.next = 8;
							break;
						}

						context$2$0.next = 7;
						return _streamline.await(_filename, 274, fn, "call", 1, null, false)(thisObj, true, v, this[i], i, this);

					case 7:
						v = context$2$0.sent;

					case 8:
						i--;
						context$2$0.next = 3;
						break;

					case 11:
						return context$2$0.abrupt("return", v);

					case 12:
					case "end":
						return context$2$0.stop();
				}
			}, _$$value$$7, this);
		}), 0, 4)
	});

	/// * `array = array.sort_(_, compare [, beg [, end]])` 
	///   `compare` is called as `cmp = compare(_, elt1, elt2)`. 
	///   Note: this function _changes_ the original array (and returns it).
	delete Array.prototype.sort_;
	Object.defineProperty(Array.prototype, 'sort_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(regeneratorRuntime.mark(function _$$value$$8(_, compare, beg, end) {
			var _qsort, array;

			return regeneratorRuntime.wrap(function _$$value$$8$(context$2$0) {
				while (1) switch (context$2$0.prev = context$2$0.next) {
					case 0:
						_qsort = _streamline.async(regeneratorRuntime.mark(function _$$_qsort$$(_, beg, end) {
							var tmp, mid, o, nbeg, nend;
							return regeneratorRuntime.wrap(function _$$_qsort$$$(context$3$0) {
								while (1) switch (context$3$0.prev = context$3$0.next) {
									case 0:
										if (!(beg >= end)) {
											context$3$0.next = 2;
											break;
										}

										return context$3$0.abrupt("return");

									case 2:
										if (!(end === beg + 1)) {
											context$3$0.next = 11;
											break;
										}

										context$3$0.next = 5;
										return _streamline.await(_filename, 298, null, compare, 0, null, false)(true, array[beg], array[end]);

									case 5:
										context$3$0.t0 = context$3$0.sent;

										if (!(context$3$0.t0 > 0)) {
											context$3$0.next = 10;
											break;
										}

										tmp = array[beg];
										array[beg] = array[end];
										array[end] = tmp;

									case 10:
										return context$3$0.abrupt("return");

									case 11:
										mid = Math.floor((beg + end) / 2);
										o = array[mid];
										nbeg = beg;
										nend = end;

									case 15:
										if (!(nbeg <= nend)) {
											context$3$0.next = 39;
											break;
										}

									case 16:
										context$3$0.t1 = nbeg < end;

										if (!context$3$0.t1) {
											context$3$0.next = 22;
											break;
										}

										context$3$0.next = 20;
										return _streamline.await(_filename, 312, null, compare, 0, null, false)(true, array[nbeg], o);

									case 20:
										context$3$0.t2 = context$3$0.sent;
										context$3$0.t1 = context$3$0.t2 < 0;

									case 22:
										if (!context$3$0.t1) {
											context$3$0.next = 26;
											break;
										}

										nbeg++;
										context$3$0.next = 16;
										break;

									case 26:
										context$3$0.t3 = beg < nend;

										if (!context$3$0.t3) {
											context$3$0.next = 32;
											break;
										}

										context$3$0.next = 30;
										return _streamline.await(_filename, 313, null, compare, 0, null, false)(true, o, array[nend]);

									case 30:
										context$3$0.t4 = context$3$0.sent;
										context$3$0.t3 = context$3$0.t4 < 0;

									case 32:
										if (!context$3$0.t3) {
											context$3$0.next = 36;
											break;
										}

										nend--;

										context$3$0.next = 26;
										break;

									case 36:
										if (nbeg <= nend) {
												tmp = array[nbeg];
												array[nbeg] = array[nend];
												array[nend] = tmp;
												nbeg++;
												nend--;
											}
										context$3$0.next = 15;
										break;

									case 39:
										if (!(nbeg < end)) {
											context$3$0.next = 42;
											break;
										}

										context$3$0.next = 42;
										return _streamline.await(_filename, 324, null, _qsort, 0, null, false)(true, nbeg, end);

									case 42:
										if (!(beg < nend)) {
											context$3$0.next = 45;
											break;
										}

										context$3$0.next = 45;
										return _streamline.await(_filename, 325, null, _qsort, 0, null, false)(true, beg, nend);

									case 45:
									case "end":
										return context$3$0.stop();
								}
							}, _$$_qsort$$, this);
						}), 0, 3);
						array = this;

						beg = beg || 0;
						end = end == null ? array.length - 1 : end;

						context$2$0.next = 6;
						return _streamline.await(_filename, 327, null, _qsort, 0, null, false)(true, beg, end);

					case 6:
						return context$2$0.abrupt("return", array);

					case 7:
					case "end":
						return context$2$0.stop();
				}
			}, _$$value$$8, this);
		}), 0, 4)
	});

	///
	/// ## Function functions 
	///
	/// * `result = fn.apply_(_, thisObj, args[, index])` 
	///   Helper to use `Function.prototype.apply` inside streamlined functions. 
	///   Equivalent to `result = fn.apply(thisObj, argsWith_)` where `argsWith_` is
	///   a modified `args` in which the callback has been inserted at `index`
	///   (at the end of the argument list if `index` is omitted or negative).
	delete Function.prototype.apply_;
	Object.defineProperty(Function.prototype, 'apply_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: function (callback, thisObj, args, index) {
			args = Array.prototype.slice.call(args, 0);
			args.splice(index != null && index >= 0 ? index : args.length, 0, callback);
			return this.apply(thisObj, args);
		}
	});
})(typeof exports !== 'undefined' ? exports : Streamline.builtins = Streamline.builtins || {});
///
},{"../funnel":210,"streamline-runtime/lib/callbacks/regenerator":207,"streamline-runtime/lib/callbacks/runtime":208}],206:[function(require,module,exports){
(function (process){
var regeneratorRuntime = typeof require === "function" ? require("streamline-runtime/lib/callbacks/regenerator") : Streamline.require("streamline-runtime/lib/callbacks/regenerator");

var _streamline = typeof require === "function" ? require("streamline-runtime/lib/callbacks/runtime") : Streamline.require("streamline-runtime/lib/callbacks/runtime");

var _filename = "flows._js";
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
 *
 */
/// !doc
///
/// # Control Flow utilities
/// 
/// `var flows = require('streamline-runtime').flows`

(function (exports) {
	"use strict";
	var globals = require('../util').getGlobals();
	/// !nodoc
	/// Obsolete API
	///
	/// This API is obsolete. Use `array.forEach_`, `array.map_`, ... instead.
	///
	/// * `flows.each(_, array, fn, [thisObj])` 
	///   applies `fn` sequentially to the elements of `array`. 
	///   `fn` is called as `fn(_, elt, i)`.
	exports.each = _streamline.async(regeneratorRuntime.mark(function _$$$$(_, array, fn, thisObj) {
		return regeneratorRuntime.wrap(function _$$$$$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					if (!(array && array.length)) {
						context$2$0.next = 6;
						break;
					}

					context$2$0.next = 3;
					return _streamline.await(_filename, 44, array, "forEach_", 0, null, false)(true, fn, thisObj);

				case 3:
					context$2$0.t0 = context$2$0.sent;
					context$2$0.next = 7;
					break;

				case 6:
					context$2$0.t0 = undefined;

				case 7:
					return context$2$0.abrupt("return", context$2$0.t0);

				case 8:
				case "end":
					return context$2$0.stop();
			}
		}, _$$$$, this);
	}), 0, 4);
	/// * `result = flows.map(_, array, fn, [thisObj])` 
	///   transforms `array` by applying `fn` to each element in turn. 
	///   `fn` is called as `fn(_, elt, i)`.
	exports.map = _streamline.async(regeneratorRuntime.mark(function _$$$$2(_, array, fn, thisObj) {
		return regeneratorRuntime.wrap(function _$$$$2$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					if (!array) {
						context$2$0.next = 6;
						break;
					}

					context$2$0.next = 3;
					return _streamline.await(_filename, 50, array, "map_", 0, null, false)(true, fn, thisObj);

				case 3:
					context$2$0.t0 = context$2$0.sent;
					context$2$0.next = 7;
					break;

				case 6:
					context$2$0.t0 = array;

				case 7:
					return context$2$0.abrupt("return", context$2$0.t0);

				case 8:
				case "end":
					return context$2$0.stop();
			}
		}, _$$$$2, this);
	}), 0, 4);
	/// * `result = flows.filter(_, array, fn, [thisObj])` 
	///   generates a new array that only contains the elements that satisfy the `fn` predicate. 
	///   `fn` is called as `fn(_, elt)`.
	exports.filter = _streamline.async(regeneratorRuntime.mark(function _$$$$3(_, array, fn, thisObj) {
		return regeneratorRuntime.wrap(function _$$$$3$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					if (!array) {
						context$2$0.next = 6;
						break;
					}

					context$2$0.next = 3;
					return _streamline.await(_filename, 56, array, "filter_", 0, null, false)(true, fn, thisObj);

				case 3:
					context$2$0.t0 = context$2$0.sent;
					context$2$0.next = 7;
					break;

				case 6:
					context$2$0.t0 = array;

				case 7:
					return context$2$0.abrupt("return", context$2$0.t0);

				case 8:
				case "end":
					return context$2$0.stop();
			}
		}, _$$$$3, this);
	}), 0, 4);
	/// * `bool = flows.every(_, array, fn, [thisObj])` 
	///   returns true if `fn` is true on every element (if `array` is empty too). 
	///   `fn` is called as `fn(_, elt)`.
	exports.every = _streamline.async(regeneratorRuntime.mark(function _$$$$4(_, array, fn, thisObj) {
		return regeneratorRuntime.wrap(function _$$$$4$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					if (!array) {
						context$2$0.next = 6;
						break;
					}

					context$2$0.next = 3;
					return _streamline.await(_filename, 62, array, "every_", 0, null, false)(true, fn, thisObj);

				case 3:
					context$2$0.t0 = context$2$0.sent;
					context$2$0.next = 7;
					break;

				case 6:
					context$2$0.t0 = undefined;

				case 7:
					return context$2$0.abrupt("return", context$2$0.t0);

				case 8:
				case "end":
					return context$2$0.stop();
			}
		}, _$$$$4, this);
	}), 0, 4);
	/// * `bool = flows.some(_, array, fn, [thisObj])` 
	///   returns true if `fn` is true for at least one element. 
	///   `fn` is called as `fn(_, elt)`.
	exports.some = _streamline.async(regeneratorRuntime.mark(function _$$$$5(_, array, fn, thisObj) {
		return regeneratorRuntime.wrap(function _$$$$5$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					if (!array) {
						context$2$0.next = 6;
						break;
					}

					context$2$0.next = 3;
					return _streamline.await(_filename, 68, array, "some_", 0, null, false)(true, fn, thisObj);

				case 3:
					context$2$0.t0 = context$2$0.sent;
					context$2$0.next = 7;
					break;

				case 6:
					context$2$0.t0 = undefined;

				case 7:
					return context$2$0.abrupt("return", context$2$0.t0);

				case 8:
				case "end":
					return context$2$0.stop();
			}
		}, _$$$$5, this);
	}), 0, 4);
	/// * `result = flows.reduce(_, array, fn, val, [thisObj])` 
	///   reduces by applying `fn` to each element. 
	///   `fn` is called as `val = fn(_, val, elt, i, array)`.
	exports.reduce = _streamline.async(regeneratorRuntime.mark(function _$$$$6(_, array, fn, v, thisObj) {
		return regeneratorRuntime.wrap(function _$$$$6$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					if (!array) {
						context$2$0.next = 6;
						break;
					}

					context$2$0.next = 3;
					return _streamline.await(_filename, 74, array, "reduce_", 0, null, false)(true, fn, v, thisObj);

				case 3:
					context$2$0.t0 = context$2$0.sent;
					context$2$0.next = 7;
					break;

				case 6:
					context$2$0.t0 = v;

				case 7:
					return context$2$0.abrupt("return", context$2$0.t0);

				case 8:
				case "end":
					return context$2$0.stop();
			}
		}, _$$$$6, this);
	}), 0, 5);
	/// * `result = flows.reduceRight(_, array, fn, val, [thisObj])` 
	///   reduces from end to start by applying `fn` to each element. 
	///   `fn` is called as `val = fn(_, val, elt, i, array)`.
	exports.reduceRight = _streamline.async(regeneratorRuntime.mark(function _$$$$7(_, array, fn, v, thisObj) {
		return regeneratorRuntime.wrap(function _$$$$7$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					if (!array) {
						context$2$0.next = 6;
						break;
					}

					context$2$0.next = 3;
					return _streamline.await(_filename, 80, array, "reduceRight_", 0, null, false)(true, fn, v, thisObj);

				case 3:
					context$2$0.t0 = context$2$0.sent;
					context$2$0.next = 7;
					break;

				case 6:
					context$2$0.t0 = v;

				case 7:
					return context$2$0.abrupt("return", context$2$0.t0);

				case 8:
				case "end":
					return context$2$0.stop();
			}
		}, _$$$$7, this);
	}), 0, 5);

	/// * `array = flows.sort(_, array, compare, [beg], [end])` 
	///   sorts the array. 
	///   `compare` is called as `cmp = compare(_, elt1, elt2)`
	///  
	///   Note: this function _changes_ the original array (and returns it)
	exports.sort = _streamline.async(regeneratorRuntime.mark(function _$$$$8(_, array, compare, beg, end) {
		return regeneratorRuntime.wrap(function _$$$$8$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					if (!array) {
						context$2$0.next = 6;
						break;
					}

					context$2$0.next = 3;
					return _streamline.await(_filename, 89, array, "sort_", 0, null, false)(true, compare, beg, end);

				case 3:
					context$2$0.t0 = context$2$0.sent;
					context$2$0.next = 7;
					break;

				case 6:
					context$2$0.t0 = array;

				case 7:
					return context$2$0.abrupt("return", context$2$0.t0);

				case 8:
				case "end":
					return context$2$0.stop();
			}
		}, _$$$$8, this);
	}), 0, 5);
	///
	/// ## Object utility (obsolete)
	///
	/// This API is obsolete. Use `Object.keys(obj).forEach_` instead.
	///
	/// * `flows.eachKey(_, obj, fn)` 
	///   calls `fn(_, key, obj[key])` for every `key` in `obj`.
	exports.eachKey = _streamline.async(regeneratorRuntime.mark(function _$$$$9(_, obj, fn, thisObj) {
		return regeneratorRuntime.wrap(function _$$$$9$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					context$2$0.next = 2;
					return _streamline.await(_filename, 99, obj ? Object.keys(obj) : [], "forEach_", 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$10(_, elt) {
						return regeneratorRuntime.wrap(function _$$$$10$(context$3$0) {
							while (1) switch (context$3$0.prev = context$3$0.next) {
								case 0:
									context$3$0.next = 2;
									return _streamline.await(_filename, 100, fn, "call", 1, null, false)(thisObj, true, elt, obj[elt]);

								case 2:
								case "end":
									return context$3$0.stop();
							}
						}, _$$$$10, this);
					}), 0, 2));

				case 2:
					return context$2$0.abrupt("return", context$2$0.sent);

				case 3:
				case "end":
					return context$2$0.stop();
			}
		}, _$$$$9, this);
	}), 0, 4);

	// deprecated -- don't document
	exports.spray = function (fns, max) {
		return new function () {
			var funnel = exports.funnel(max);
			this.collect = _streamline.async(regeneratorRuntime.mark(function _$$$$11(_, count, trim) {
				return regeneratorRuntime.wrap(function _$$$$11$(context$4$0) {
					while (1) switch (context$4$0.prev = context$4$0.next) {
						case 0:
							context$4$0.next = 2;
							return _streamline.await(_filename, 109, function (callback) {
								if (typeof callback !== "function") throw new Error("invalid call to collect: no callback");
								var results = trim ? [] : new Array(fns.length);
								count = count < 0 ? fns.length : Math.min(count, fns.length);
								if (count === 0) return callback(null, results);
								var collected = 0;
								for (var i = 0; i < fns.length; i++) {
									(function (i) {
										funnel(function (err, result) {
											if (err) return callback(err);
											if (trim) results.push(result);else results[i] = result;
											if (++collected === count) return callback(null, results);
										}, fns[i]);
									})(i);
								}
							}, "call", 1, null, false)(this, true);

						case 2:
							return context$4$0.abrupt("return", context$4$0.sent);

						case 3:
						case "end":
							return context$4$0.stop();
					}
				}, _$$$$11, this);
			}), 0, 3);
			this.collectOne = _streamline.async(regeneratorRuntime.mark(function _$$$$12(_) {
				var result;
				return regeneratorRuntime.wrap(function _$$$$12$(context$4$0) {
					while (1) switch (context$4$0.prev = context$4$0.next) {
						case 0:
							context$4$0.next = 2;
							return _streamline.await(_filename, 128, this, "collect", 0, null, false)(true, 1, true);

						case 2:
							result = context$4$0.sent;
							return context$4$0.abrupt("return", result && result[0]);

						case 4:
						case "end":
							return context$4$0.stop();
					}
				}, _$$$$12, this);
			}), 0, 1);
			this.collectAll = _streamline.async(regeneratorRuntime.mark(function _$$$$13(_) {
				return regeneratorRuntime.wrap(function _$$$$13$(context$4$0) {
					while (1) switch (context$4$0.prev = context$4$0.next) {
						case 0:
							context$4$0.next = 2;
							return _streamline.await(_filename, 132, this, "collect", 0, null, false)(true, -1, false);

						case 2:
							return context$4$0.abrupt("return", context$4$0.sent);

						case 3:
						case "end":
							return context$4$0.stop();
					}
				}, _$$$$13, this);
			}), 0, 1);
		}();
	};

	/// !doc
	/// ## funnel
	/// * `fun = flows.funnel(max)` 
	///   limits the number of concurrent executions of a given code block.
	///
	/// The `funnel` function is typically used with the following pattern:
	///
	/// ``` javascript
	/// // somewhere
	/// var myFunnel = flows.funnel(10); // create a funnel that only allows 10 concurrent executions.
	///
	/// // elsewhere
	/// myFunnel(_, function(_) { /* code with at most 10 concurrent executions */ });
	/// ```
	///
	/// The `diskUsage2.js` example demonstrates how these calls can be combined to control concurrent execution.
	///
	/// The `funnel` function can also be used to implement critical sections. Just set funnel's `max` parameter to 1.
	///
	/// If `max` is set to 0, a default number of parallel executions is allowed.
	/// This default number can be read and set via `flows.funnel.defaultSize`. 
	/// If `max` is negative, the funnel does not limit the level of parallelism.
	///
	/// The funnel can be closed with `fun.close()`. 
	/// When a funnel is closed, the operations that are still in the funnel will continue but their callbacks
	/// won't be called, and no other operation will enter the funnel.
	exports.funnel = require('streamline-runtime/lib/funnel');

	/// ## handshake and queue
	/// * `hs = flows.handshake()` 
	///   allocates a simple semaphore that can be used to do simple handshakes between two tasks. 
	///   The returned handshake object has two methods: 
	///   `hs.wait(_)`: waits until `hs` is notified. 
	///   `hs.notify()`: notifies `hs`. 
	///   Note: `wait` calls are not queued. An exception is thrown if wait is called while another `wait` is pending.
	exports.handshake = function () {
		var callback = null,
		    notified = false;
		return {
			wait: function (cb) {
				if (callback) throw new Error("already waiting");
				if (notified) exports.setImmediate(cb);else callback = cb;
				notified = false;
			},
			notify: function () {
				if (!callback) notified = true;else exports.setImmediate(callback);
				callback = null;
			}
		};
	};

	/// * `q = flows.queue(options)` 
	///   allocates a queue which may be used to send data asynchronously between two tasks. 
	///   The `max` option can be set to control the maximum queue length. 
	///   When `max` has been reached `q.put(data)` discards data and returns false.
	///   The returned queue has the following methods: 
	exports.queue = function (options) {
		if (typeof options === 'number') options = {
			max: options
		};
		options = options || {};
		var max = options.max != null ? options.max : -1;
		var callback = null,
		    err = null,
		    q = [],
		    pendingWrites = [];
		var queue = {
			///   `data = q.read(_)`: dequeues an item from the queue. Waits if no element is available. 
			read: function (cb) {
				if (callback) throw new Error("already getting");
				if (q.length > 0) {
						var item = q.shift();
						// recycle queue when empty to avoid maintaining arrays that have grown large and shrunk
						if (q.length === 0) q = [];
						exports.setImmediate(function () {
							cb(err, item);
						});
						if (pendingWrites.length > 0) {
								var wr = pendingWrites.shift();
								exports.setImmediate(function () {
									wr[0](err, wr[1]);
								});
							}
					} else {
						callback = cb;
					}
			},
			///   `q.write(_, data)`:  queues an item. Waits if the queue is full. 
			write: function (cb, item) {
				if (this.put(item)) {
						exports.setImmediate(function () {
							cb(err);
						});
					} else {
						pendingWrites.push([cb, item]);
					}
			},
			///   `ok = q.put(data)`: queues an item synchronously. Returns true if the queue accepted it, false otherwise.
			put: function (item, force) {
				if (!callback) {
						if (max >= 0 && q.length >= max && !force) return false;
						q.push(item);
					} else {
						var cb = callback;
						callback = null;
						exports.setImmediate(function () {
							cb(err, item);
						});
					}
				return true;
			},
			///   `q.end()`: ends the queue. This is the synchronous equivalent of `q.write(_, undefined)` 
			end: function () {
				this.put(undefined, true);
			},
			///   `data = q.peek()`: returns the first item, without dequeuing it. Returns `undefined` if the queue is empty. 
			peek: function () {
				return q[0];
			},
			///   `array = q.contents()`: returns a copy of the queue's contents. 
			contents: function () {
				return q.slice(0);
			},
			///   `q.adjust(fn[, thisObj])`: adjusts the contents of the queue by calling `newContents = fn(oldContents)`. 
			adjust: function (fn, thisObj) {
				var nq = fn.call(thisObj, q);
				if (!Array.isArray(nq)) throw new Error("reorder function does not return array");
				q = nq;
			}
		};
		///   `q.length`: number of items currently in the queue. 
		Object.defineProperty(queue, "length", {
			get: function () {
				return q.length;
			}
		});
		return queue;
	};

	///
	/// ## Miscellaneous utilities
	/// * `results = flows.collect(_, futures)` 
	///   collects the results of an array of futures
	exports.collect = _streamline.async(regeneratorRuntime.mark(function _$$$$14(_, futures) {
		return regeneratorRuntime.wrap(function _$$$$14$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					context$2$0.t0 = futures;

					if (!context$2$0.t0) {
						context$2$0.next = 5;
						break;
					}

					context$2$0.next = 4;
					return _streamline.await(_filename, 279, futures, "map_", 0, null, false)(true, _streamline.async(regeneratorRuntime.mark(function _$$$$15(_, future) {
						return regeneratorRuntime.wrap(function _$$$$15$(context$3$0) {
							while (1) switch (context$3$0.prev = context$3$0.next) {
								case 0:
									context$3$0.next = 2;
									return _streamline.await(_filename, 280, null, future, 0, null, false)(true);

								case 2:
									return context$3$0.abrupt("return", context$3$0.sent);

								case 3:
								case "end":
									return context$3$0.stop();
							}
						}, _$$$$15, this);
					}), 0, 2));

				case 4:
					context$2$0.t0 = context$2$0.sent;

				case 5:
					return context$2$0.abrupt("return", context$2$0.t0);

				case 6:
				case "end":
					return context$2$0.stop();
			}
		}, _$$$$14, this);
	}), 0, 2);

	// Obsolete API - use require('streamline-runtime').globals.context instead
	exports.setContext = function (ctx) {
		var old = globals.context;
		globals.context = ctx;
		return old;
	};
	exports.getContext = function () {
		return globals.context;
	};

	///
	/// * `result = flows.trampoline(_, fn, thisObj)` 
	///   Executes `fn(_)` through a trampoline. 
	///   Waits for `fn`'s result and returns it. 
	///   This is equivalent to calling `fn.call(thisObj, _)` but the current stack is unwound
	///   before calling `fn`.
	exports.trampoline = function (cb, fn, thisObj) {
		exports.setImmediate(exports.withContext(function () {
			fn.call(thisObj, cb);
		}, globals.context));
	};

	///
	/// * `flows.setImmediate(fn)` 
	///   portable `setImmediate` both browser and server. 
	exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function (fn) {
		setTimeout(fn, 0);
	};

	///
	/// * `flows.nextTick(_)` 
	///   `nextTick` function for both browser and server. 
	///   Aliased to `process.nextTick` on the server side.
	var nextTick = typeof process === "object" && typeof process.nextTick === "function" ? process.nextTick : function (cb) {
		cb();
	};

	// document later
	exports.nextTick = _streamline.async(regeneratorRuntime.mark(function _$$$$16(_) {
		return regeneratorRuntime.wrap(function _$$$$16$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					context$2$0.next = 2;
					return _streamline.await(_filename, 323, null, nextTick, 0, null, false)(true);

				case 2:
				case "end":
					return context$2$0.stop();
			}
		}, _$$$$16, this);
	}), 0, 1);

	// document later
	// should probably cap millis instead of trying to be too smart
	exports.setTimeout = function (fn, millis) {
		// node's setTimeout notifies immediately if millis > max!!
		// So be safe and work around it.
		// Gotcha: timeout cannot be cancelled beyond max.
		var max = 0x7fffffff;
		if (millis > max) {
				return setTimeout(function () {
					exports.setTimeout(fn, millis - max);
				}, max);
			} else {
				return setTimeout(function () {
					_streamline.future(_filename, 339, null, fn, 0, null, false)(false);
				}, millis);
			}
	};

	// document later
	exports.setInterval = function (fn, millis) {
		return setInterval(function () {
			_streamline.future(_filename, 347, null, fn, 0, null, false)(false);
		}, millis);
	};

	///
	/// * `flows.sleep(_, millis)` 
	///   Sleeps `millis` ms. 
	exports.sleep = _streamline.async(regeneratorRuntime.mark(function _$$$$17(_, millis) {
		return regeneratorRuntime.wrap(function _$$$$17$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					context$2$0.next = 2;
					return _streamline.await(_filename, 355, null, setTimeout, 0, null, false)(true, millis);

				case 2:
					return context$2$0.abrupt("return", context$2$0.sent);

				case 3:
				case "end":
					return context$2$0.stop();
			}
		}, _$$$$17, this);
	}), 0, 2);

	exports.eventHandler = function (fn) {
		return function () {
			var that = this;
			var args = Array.prototype.slice(arguments, 0);
			return _streamline.async(regeneratorRuntime.mark(function _$$$$18(_) {
				return regeneratorRuntime.wrap(function _$$$$18$(context$4$0) {
					while (1) switch (context$4$0.prev = context$4$0.next) {
						case 0:
							context$4$0.next = 2;
							return _streamline.await(_filename, 363, fn, "apply_", 0, null, false)(true, that, args, 0);

						case 2:
							return context$4$0.abrupt("return", context$4$0.sent);

						case 3:
						case "end":
							return context$4$0.stop();
					}
				}, _$$$$18, this);
			}), 0, 1)(function (err) {
				if (err) throw err;
			});
		};
	};

	//   Obsolete. Use `fn.apply_` instead.
	exports.apply = _streamline.async(regeneratorRuntime.mark(function _$$apply$$(_, fn, thisObj, args, index) {
		return regeneratorRuntime.wrap(function _$$apply$$$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					context$2$0.next = 2;
					return _streamline.await(_filename, 372, fn, "apply_", 0, null, false)(true, thisObj, args, index);

				case 2:
					return context$2$0.abrupt("return", context$2$0.sent);

				case 3:
				case "end":
					return context$2$0.stop();
			}
		}, _$$apply$$, this);
	}), 0, 5);

	///
	/// * `flows.callWithTimeout(_, fn, millis)` 
	///   Calls `fn(_)` with a timeout guard. 
	///   Throws a timeout exception if `fn` takes more than `millis` ms to complete. 
	exports.callWithTimeout = function (cb, fn, millis) {
		var tid = setTimeout(function () {
			if (cb) {
					var ex = new Error("timeout");
					ex.code = "ETIMEOUT";
					ex.errno = "ETIMEOUT";
					cb(ex);
					cb = null;
				}
		}, millis);
		fn(function (err, result) {
			if (cb) {
					clearTimeout(tid);
					cb(err, result);
					cb = null;
				}
		});
	};

	///
	/// * `fn = flows.withContext(fn, cx)` 
	///   wraps a function so that it executes with context `cx` (or a wrapper around current context if `cx` is falsy).
	///   The previous context will be restored when the function returns (or throws). 
	///   returns the wrapped function.
	exports.withContext = function (fn, cx) {
		return function () {
			var oldContext = globals.context;
			globals.context = cx || Object.create(oldContext);
			try {
				return fn.apply(this, arguments);
			} finally {
				globals.context = oldContext;
			}
		};
	};

	///
	/// * `flows.ignore` 
	///   callback that ignores errors (`function(err) {}`) 
	exports.ignore = function (err) {};

	///
	/// * `flows.check` 
	///   callback that throws errors (`function(err) { if (err) throw err; }`) 
	exports.check = function (err) {
		if (err) throw err;
	};
})(typeof exports !== 'undefined' ? exports : Streamline.flows = Streamline.flows || {});
///
}).call(this,require('_process'))
},{"../util":214,"_process":191,"streamline-runtime/lib/callbacks/regenerator":207,"streamline-runtime/lib/callbacks/runtime":208,"streamline-runtime/lib/funnel":210}],207:[function(require,module,exports){
"use strict";
module.exports = require("regenerator/runtime");
},{"regenerator/runtime":215}],208:[function(require,module,exports){
var regeneratorRuntime = typeof require === 'function' ? require('streamline-runtime/lib/callbacks/regenerator') : Streamline.require('streamline-runtime/lib/callbacks/regenerator');

var makeArgs = function makeArgs(i) {
	if (i <= 0) return "";
	return i > 1 ? makeArgs(i - 1) + ', a' + i : "a1";
};

var isGenerator = function isGenerator(val) {
	return val && (Object.prototype.toString.call(val) === "[object Generator]" || val.toString() === "[object Generator]");
};

var Frame = function Frame(file, line, fn) {
	this.fn = fn;
	this.file = file || "unknown";
	this.line = line || 0;
};

var pushFrame = function pushFrame(g) {
	if (glob.emitter) glob.emitter.emit('enter', g.frame);
	g.frame = g.frame || glob.frame;
	glob.frame = null;
};

var popFrame = function popFrame(g) {
	if (glob.emitter) glob.emitter.emit('exit', g.frame);
};

var run = function run(fn, g, cb, options) {
	var rsm = glob.resume;
	var emit = function (ev, g) {
		if (glob.emitter) glob.emitter.emit(ev, g.frame);
	};

	try {
		if (glob.frame) {
				g.frame = glob.frame;
				g.frame.g = g;
				glob.frame = null;
			} else {
				g.frame = new Frame("", 0, fn);
			}

		glob.resume = function (err, val) {
			if (glob.yielded) {
					emit("resume", g);
					glob.yielded = false;
				}
			while (g) {
				if (options && options.interrupt && options.interrupt()) return;
				try {
					// ES6 is deprecating send in favor of next. Following line makes us compatible with both.
					var send = g.send || g.next;
					var v = err ? g.throw(err) : send.call(g, val);
					val = v.value;
					err = null;
					// if we get PENDING, the current call completed with a pending I/O
					// resume will be called again when the I/O completes. So just save the context and return here.
					if (val === glob.PENDING) {
							if (!glob.yielded) {
									emit("yield", g);
									glob.yielded = true;
								}
							return;
						}
					// if we get [PENDING, e, r], the current call invoked its callback synchronously
					// we just loop to send/throw what the callback gave us.
					if (val && val[0] === glob.PENDING) {
							err = val[1];
							val = val[2];
							if (err) err = wrapError(err, g);
						}
						// else, if g is done we unwind it we send val to the parent generator (or through cb if we are at the top)
					else if (v.done) {
								//g.close();
								popFrame(g);
								g = g.prev;
							}
							// else if val is not a generator we have an error. Yield was not applied to a generators
						else {
								if (!isGenerator(val)) {
										throw new Error("invalid value was yielded. Expected a generator, got " + val);
									}
								// we got a new generator which means that g called another generator function
								// the new generator become current and we loop with g.send(undefined) (equiv to g.next())
								val.prev = g;
								g = val;
								pushFrame(g);
								val = undefined;
							}
				} catch (ex) {
					// the send/throw call failed.
					// we unwind the current generator and we rethrow into the parent generator (or through cb if at the top)
					//g.close();
					err = wrapError(ex, g);
					popFrame(g);
					g = g.prev;
					val = undefined;
				}
			}
			// we have exhausted the stack of generators.
			// return the result or error through the callback.
			cb(err, val);
		};

		// start the resume loop
		glob.resume();
	} finally {
		// restore resume global
		glob.resume = rsm;
	}
};

var mapResults = function mapResults(options, args) {
	if (options && typeof options === "object") {
			if (options.returnArray) return args;
			if (options.returnObject) return options.returnObject.reduce(function (res, key, i) {
				res[key] = args[i];
				return res;
			}, {});
		}
	return args[0];
};

var invoke = function invoke(that, fn, args, index, index2, returnArray) {
	// Set things up so that call returns:
	// * PENDING if it completes with a pending I/O (and cb will be called later)
	// * [PENDING, e, r] if the callback is called synchronously.
	var result = glob.PENDING,
	    sync = true;
	var rsm = glob.resume;

	// convert args to array so that args.length gets correctly set if index is args.length
	args = Array.prototype.slice.call(args, 0);
	var cx = glob.context;
	var callback = function (e, r) {
		var oldContext = glob.context;
		var oldResume = glob.resume;
		try {
			if (returnArray) r = Array.prototype.slice.call(arguments, 1);
			glob.context = cx;
			glob.resume = rsm;
			if (sync) {
					result = [glob.PENDING, e, r];
				} else {
					glob.resume(e, r);
				}
		} finally {
			glob.context = oldContext;
			glob.resume = oldResume;
		}
	};
	if (index2 != null) {
			args[index] = function (r) {
				callback(null, r);
			};
			args[index2] = function (e) {
				callback(e);
			};
		} else {
			args[index] = callback;
		}
	fn.apply(that, args);
	sync = false;
	return result;
};

var makeUnstarror = function makeUnstarror(i) {
	return eval("(function(fn, options)" + unstarBody.replace(/function\s*F\(\)/, "function F(" + makeArgs(i) + ")") + ")");
};

var unstar = function unstar(fn, index, arity) {
	var i = arity != null ? arity : index == null ? fn.length + 1 : fn.length;
	var unstarror = unstarrors[i] || (unstarrors[i] = makeUnstarror(i));
	return unstarror(fn, index);
};

var wrapError = function wrapError(err, g) {
	if (!(err instanceof Error)) return err; // handle throw "some string";
	for (var gg = err.g; gg; gg = gg.prev) {
		if (gg === g) return err;
	}
	err = Object.create(err);
	err.g = g;
	Object.defineProperty(err, 'stack', {
		get: function () {
			return stackTrace(this);
		}
	});
	return err;
};

var stackTrace = function stackTrace(err) {
	var starredStack = function starredStack(e) {
		if (!e || !e.g) return "";
		var s = starredStack(Object.getPrototypeOf(e));
		for (var g = e.g; g.prev; g = g.prev) {
			var fname = g.prev.frame.name || "";
			var m = /\$\$(.*)\$\$/.exec(fname);
			if (m) fname = m[1];
			s += '    at ' + fname + ' (' + g.frame.file + ':' + g.frame.line + ')\n';
		}
		return s;
	};

	var extra;

	var rawStack = Object.getOwnPropertyDescriptor(new Error(), 'stack').get.call(err);
	var cut = rawStack.indexOf('    at GeneratorFunctionPrototype');
	if (cut < 0) cut = rawStack.indexOf('\n') + 1;
	var result = rawStack.substring(0, cut).replace(/\n.*regenerator.runtime.*/g, '') + //
	'    <<< yield stack >>>\n' + starredStack(err) + //
	'    <<< raw stack >>>\n' + rawStack.substring(cut);
	return result;
};

"use strict";
/**
 * Copyright (c) 2013 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
var util = require('../util');
var glob = util.getGlobals('callbacks');

var counters = {
	slowAwait: 0,
	fastAwait: 0
};

if (typeof glob.yielded === "undefined") glob.yielded = true;
glob.PENDING = glob.PENDING || {};

Object.defineProperty(Frame.prototype, "name", {
	get: function () {
		var fn = this.fn;
		return fn && (fn.__name__ || fn.name) || "unknown";
	}
});

Object.defineProperty(Frame.prototype, "info", {
	get: function () {
		return this;
	}
});

var star = function (fn, index, index2, returnArray) {
	return regeneratorRuntime.mark(function callee$1$0() {
		var args$2$0 = arguments;
		return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					context$2$0.next = 2;
					return invoke(this, fn, args$2$0, index, index2, returnArray);

				case 2:
					return context$2$0.abrupt('return', context$2$0.sent);

				case 3:
				case 'end':
					return context$2$0.stop();
			}
		}, callee$1$0, this);
	});
};

var unstarTemplate = function (fn, options) {
	var index = options && typeof options === 'object' ? options.callbackIndex : options;
	if (index == null) index = fn.length;

	var F = function F() {
		var cb = arguments[index];
		if (typeof cb !== "function") {
				if (glob.allowBooleanPlaceholders && typeof cb === 'boolean') {
						if (cb) cb = util.defaultCallback;else return exports.future("", 0, null, wrapper.bind(this), index)(arguments);
					} else throw util.argError(fn.name, index, "function", typeof cb);
			}
		var g = fn.apply(this, arguments);
		run.call(this, fn, g, cb);
	};
	// track the original name for stack frames
	F.__name__ = fn.name;
	return F;
};

var unstarBody = unstarTemplate.toString();
unstarBody = unstarBody.substring(unstarBody.indexOf('{'));
var unstarrors = [];

exports.await = function (file, line, object, property, index1, index2, returnArray) {
	var bound = typeof property !== "function";
	var fn = bound ? object[property] : property;
	glob.frame = new Frame(file, line, fn);
	var key = '';
	if (index2 == null && !returnArray) {
			key = 'starred-' + index1;
			var wrapper = fn[key];
			if (wrapper) {
					counters.fastAwait++;
					return bound ? wrapper.bind(object) : wrapper;
				}
		}
	counters.slowAwait++;
	if (typeof fn !== "function") throw util.typeError("cannot call", "function", fn);
	wrapper = star(fn, index1, index2, returnArray);
	if (!bound && key) {
			fn[key] = wrapper;
		}
	return bound ? wrapper.bind(object) : wrapper;
};

exports.async = function (fn, index, arity) {
	if (typeof fn !== "function") throw util.typeError("cannot wrap function", "function", fn);
	var unstarred = unstar(fn, index, arity);
	unstarred["starred-" + index] = fn;
	return unstarred;
};

exports.new = function (file, line, constructor, index) {
	if (typeof constructor !== "function") throw util.typeError("cannot instantiate", "function", constructor);
	glob.frame = new Frame(file, line, constructor);
	var starred = star(constructor, index);
	return regeneratorRuntime.mark(function callee$1$0() {
		var that,
		    args$2$0 = arguments;
		return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
			while (1) switch (context$2$0.prev = context$2$0.next) {
				case 0:
					that = Object.create(constructor.prototype);
					context$2$0.next = 3;
					return starred.apply(that, args$2$0);

				case 3:
					return context$2$0.abrupt('return', that);

				case 4:
				case 'end':
					return context$2$0.stop();
			}
		}, callee$1$0, this);
	});
};

exports.future = require('../future');
require('./builtins');
},{"../future":211,"../util":214,"./builtins":205,"streamline-runtime/lib/callbacks/regenerator":207}],209:[function(require,module,exports){
"use strict";
var runtime = require('./util').getGlobals().runtime;
function idem(x) { return x; } // streamline-require compat
if (runtime) module.exports = require(idem('./' + runtime + '/flows'));
else module.exports = require('./callbacks/flows');
},{"./callbacks/flows":206,"./util":214}],210:[function(require,module,exports){
"use strict";

// Do not use this one directly, require it through the flows module.
module.exports = function funnel(max) {
	max = max == null ? -1 : max;
	if (max === 0) max = module.exports.defaultSize;
	if (typeof max !== "number") throw new Error("bad max number: " + max);
	var queue = [],
		active = 0,
		closed = false;

	var fun = function(callback, fn) {
			if (callback == null) return future(fun, arguments, 0);
			//console.log("FUNNEL: active=" + active + ", queued=" + queue.length);
			if (max < 0 || max === Infinity) return fn(callback);

			queue.push({
				fn: fn,
				cb: callback
			});

			function _doOne() {
				var current = queue.splice(0, 1)[0];
				if (!current.cb) return current.fn();
				active++;
				current.fn(function(err, result) {
					active--;
					if (!closed) {
						current.cb(err, result);
						while (active < max && queue.length > 0) _doOne();
					}
				});
			}

			while (active < max && queue.length > 0) _doOne();
		};

	fun.close = function() {
		queue = [];
		closed = true;
	};
	return fun;
};
module.exports.defaultSize = 4;
},{}],211:[function(require,module,exports){
"use strict";

var util = require('./util');

module.exports = function(file, line, object, property, index) {
	var bound = typeof property !== "function";
	var fn = bound ? object[property] : property;
	var self = bound ? object : this;
	if (typeof fn !== "function") throw new Error("cannot create future", "function", fn);
	return function futured() {
		var err, result, done, q = [];
		var args = Array.prototype.slice.call(arguments);
		var callback = function(e, r) {
			//if (e) console.error(e);
			err = e;
			result = r;
			done = true;
			q && q.forEach(function(f) {
				if (sync) {
					setImmediate(function() {
						f.call(self, e, r);
					});
				} else {
					f.call(self, e, r);					
				}
			});
			q = null;
		};
		args[index] = callback; 
		var sync = true;
		fn.apply(self, args);
		sync = false;
		var future = function(cb) {
			if (typeof cb !== "function") throw argError(fn.name, index, "function", cb);
			if (done) {
				cb.call(self, err, result);
			}
			else q.push(cb);
		};
		// computed property so that we don't allocate promise if we don't need to
		Object.defineProperty(future, 'promise', {
			get: function() {
				return new Promise(function(resolve, reject) {
					if (done) {
						if (err) reject(err);
						else resolve(result);
					} else {
						q.push(function(e, r) {
							if (e) reject(e);
							else resolve(r);
						})
					}
				});
			}
		});
		return future;
	};
}

},{"./util":214}],212:[function(require,module,exports){
var _streamline = typeof require === "function" ? require("streamline-runtime/lib/generators/runtime") : Streamline.require("streamline-runtime/lib/generators/runtime");

var _filename = "builtins._js";
/**
 * Copyright (c) 2012 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
/// !doc
///
/// # Streamline built-ins

(function (exports) {
	var _parallel = function _parallel(options) {
		if (typeof options === "number") return options;
		if (typeof options.parallel === "number") return options.parallel;
		return options.parallel ? -1 : 1;
	};

	"use strict";
	var VERSION = 3;

	var future = function (fn, args, i) {
		var err,
		    result,
		    done,
		    q = [],
		    self = this;
		args = Array.prototype.slice.call(args);
		args[i] = function (e, r) {
			err = e;
			result = r;
			done = true;
			q && q.forEach(function (f) {
				f.call(self, e, r);
			});
			q = null;
		};
		fn.apply(this, args);
		return function F(cb) {
			if (!cb) return F;
			if (done) cb.call(self, err, result);else q.push(cb);
		};
	};

	var funnel = require('../funnel');

	if (Array.prototype.forEach_ && Array.prototype.forEach_.version_ >= VERSION) return;

	// bail out (silently) if JS does not support defineProperty (IE 8).
	try {
		Object.defineProperty({}, 'x', {});
	} catch (e) {
		return;
	}

	var has = Object.prototype.hasOwnProperty;

	/* eslint-disable no-extend-native */

	/// ## Array functions 
	///
	/// These functions are asynchronous variants of the EcmaScript 5 Array functions.
	///
	/// Common Rules:
	///
	/// These variants are postfixed by an underscore. 
	/// They take the `_` callback as first parameter. 
	/// They pass the `_` callback as first argument to their `fn` callback. 
	/// Most of them have an optional `options` second parameter which controls the level of
	/// parallelism. This `options` parameter may be specified either as `{ parallel: par }`
	/// where `par` is an integer, or directly as a `par` integer value. 
	/// The `par` values are interpreted as follows:
	///
	/// * If absent or equal to 1, execution is sequential.
	/// * If > 1, at most `par` operations are parallelized.
	/// * if 0, a default number of operations are parallelized.
	///   This default is defined by `flows.funnel.defaultSize` (4 by default - see `flows` module).
	/// * If < 0 or Infinity, operations are fully parallelized (no limit).
	///
	/// Functions:
	///
	/// * `array.forEach_(_[, options], fn[, thisObj])` 
	///   `fn` is called as `fn(_, elt, i, array)`.
	delete Array.prototype.forEach_;
	Object.defineProperty(Array.prototype, 'forEach_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(function* _$$value$$(_, options, fn, thisObj) {
			{
				if (typeof options === "function") {
						thisObj = fn;
						fn = options;
						options = 1;
					}
				var par = _parallel(options);
				thisObj = thisObj !== undefined ? thisObj : this;
				var len = this.length;
				if (par === 1 || len <= 1) {
						for (var i = 0; i < len; i++) {
							if (has.call(this, i)) yield _streamline.await(_filename, 95, fn, "call", 1, null, false)(thisObj, true, this[i], i, this);
						}
					} else {
						yield _streamline.await(_filename, 98, this, "map_", 0, null, false)(true, par, fn, thisObj);
					}
				return this;
			}
		}, 0, 4)
	});
	Array.prototype.forEach_.version_ = VERSION;
	/// * `result = array.map_(_[, options], fn[, thisObj])` 
	///   `fn` is called as `fn(_, elt, i, array)`.
	delete Array.prototype.map_;
	Object.defineProperty(Array.prototype, 'map_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(function* _$$value$$2(_, options, fn, thisObj) {
			{
				if (typeof options === "function") {
						thisObj = fn;
						fn = options;
						options = 1;
					}
				var par = _parallel(options);
				thisObj = thisObj !== undefined ? thisObj : this;
				var len = this.length;
				var result, i;
				if (par === 1 || len <= 1) {
						result = new Array(len);
						for (i = 0; i < len; i++) {
							if (has.call(this, i)) result[i] = yield _streamline.await(_filename, 124, fn, "call", 1, null, false)(thisObj, true, this[i], i, this);
						}
					} else {
						var fun = funnel(par);
						result = this.map(function (elt, i, arr) {
							return _streamline.future(_filename, 129, null, fun, 0, null, false)(false, _streamline.async(function* _$$$$(_) {
								{
									return yield _streamline.await(_filename, 130, fn, "call", 1, null, false)(thisObj, true, elt, i, arr);
								}
							}, 0, 1));
						});
						for (i = 0; i < len; i++) {
							if (has.call(this, i)) result[i] = yield _streamline.await(_filename, 134, result, i, 0, null, false)(true);
						}
					}
				return result;
			}
		}, 0, 4)
	});
	/// * `result = array.filter_(_[, options], fn[, thisObj])` 
	///   `fn` is called as `fn(_, elt, i, array)`.
	delete Array.prototype.filter_;
	Object.defineProperty(Array.prototype, 'filter_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(function* _$$value$$3(_, options, fn, thisObj) {
			{
				if (typeof options === "function") {
						thisObj = fn;
						fn = options;
						options = 1;
					}
				var par = _parallel(options);
				thisObj = thisObj !== undefined ? thisObj : this;
				var result = [];
				var len = this.length;
				if (par === 1 || len <= 1) {
						for (var i = 0; i < len; i++) {
							if (has.call(this, i)) {
									var elt = this[i];
									if (yield _streamline.await(_filename, 161, fn, "call", 1, null, false)(thisObj, true, elt, i, this)) result.push(elt);
								}
						}
					} else {
						yield _streamline.await(_filename, 165, this, "map_", 0, null, false)(true, par, _streamline.async(function* _$$$$2(_, elt, i, arr) {
							{
								if (yield _streamline.await(_filename, 166, fn, "call", 1, null, false)(thisObj, true, elt, i, arr)) result.push(elt);
							}
						}, 0, 4), thisObj);
					}
				return result;
			}
		}, 0, 4)
	});
	/// * `bool = array.every_(_[, options], fn[, thisObj])` 
	///   `fn` is called as `fn(_, elt, i, array)`.
	delete Array.prototype.every_;
	Object.defineProperty(Array.prototype, 'every_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(function* _$$value$$4(_, options, fn, thisObj) {
			{
				if (typeof options === "function") {
						thisObj = fn;
						fn = options;
						options = 1;
					}
				var par = _parallel(options);
				thisObj = thisObj !== undefined ? thisObj : this;
				var len = this.length,
				    i;
				if (par === 1 || len <= 1) {
						for (i = 0; i < len; i++) {

							if (has.call(this, i) && !(yield _streamline.await(_filename, 191, fn, "call", 1, null, false)(thisObj, true, this[i], i, this))) return false;
						}
					} else {
						var fun = funnel(par);
						var futures = this.map(function (elt, i, arr) {
							return _streamline.future(_filename, 196, null, fun, 0, null, false)(false, _streamline.async(function* _$$$$3(_) {
								{
									return yield _streamline.await(_filename, 197, fn, "call", 1, null, false)(thisObj, true, elt, i, arr);
								}
							}, 0, 1));
						});
						for (i = 0; i < len; i++) {
							if (has.call(this, i) && !(yield _streamline.await(_filename, 201, futures, i, 0, null, false)(true))) {
									fun.close();
									return false;
								}
						}
					}
				return true;
			}
		}, 0, 4)
	});
	/// * `bool = array.some_(_[, options], fn[, thisObj])` 
	///   `fn` is called as `fn(_, elt, i, array)`.
	delete Array.prototype.some_;
	Object.defineProperty(Array.prototype, 'some_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(function* _$$value$$5(_, options, fn, thisObj) {
			{
				if (typeof options === "function") {
						thisObj = fn;
						fn = options;
						options = 1;
					}
				var par = _parallel(options);
				thisObj = thisObj !== undefined ? thisObj : this;
				var len = this.length,
				    i;
				if (par === 1 || len <= 1) {
						for (i = 0; i < len; i++) {
							if (has.call(this, i) && (yield _streamline.await(_filename, 228, fn, "call", 1, null, false)(thisObj, true, this[i], i, this))) return true;
						}
					} else {
						var fun = funnel(par);
						var futures = this.map(function (elt, i, arr) {
							return _streamline.future(_filename, 233, null, fun, 0, null, false)(false, _streamline.async(function* _$$$$4(_) {
								{
									return yield _streamline.await(_filename, 234, fn, "call", 1, null, false)(thisObj, true, elt, i, arr);
								}
							}, 0, 1));
						});
						for (i = 0; i < len; i++) {
							if (has.call(this, i) && (yield _streamline.await(_filename, 238, futures, i, 0, null, false)(true))) {
									fun.close();
									return true;
								}
						}
					}
				return false;
			}
		}, 0, 4)
	});
	/// * `result = array.reduce_(_, fn, val[, thisObj])` 
	///   `fn` is called as `val = fn(_, val, elt, i, array)`.
	delete Array.prototype.reduce_;
	Object.defineProperty(Array.prototype, 'reduce_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(function* _$$value$$6(_, fn, v, thisObj) {
			{
				thisObj = thisObj !== undefined ? thisObj : this;
				var len = this.length;
				for (var i = 0; i < len; i++) {
					if (has.call(this, i)) v = yield _streamline.await(_filename, 258, fn, "call", 1, null, false)(thisObj, true, v, this[i], i, this);
				}
				return v;
			}
		}, 0, 4)
	});
	/// * `result = array.reduceRight_(_, fn, val[, thisObj])` 
	///   `fn` is called as `val = fn(_, val, elt, i, array)`.
	delete Array.prototype.reduceRight_;
	Object.defineProperty(Array.prototype, 'reduceRight_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(function* _$$value$$7(_, fn, v, thisObj) {
			{
				thisObj = thisObj !== undefined ? thisObj : this;
				var len = this.length;
				for (var i = len - 1; i >= 0; i--) {
					if (has.call(this, i)) v = yield _streamline.await(_filename, 274, fn, "call", 1, null, false)(thisObj, true, v, this[i], i, this);
				}
				return v;
			}
		}, 0, 4)
	});

	/// * `array = array.sort_(_, compare [, beg [, end]])` 
	///   `compare` is called as `cmp = compare(_, elt1, elt2)`. 
	///   Note: this function _changes_ the original array (and returns it).
	delete Array.prototype.sort_;
	Object.defineProperty(Array.prototype, 'sort_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: _streamline.async(function* _$$value$$8(_, compare, beg, end) {
			{
				var _qsort = _streamline.async(function* _$$_qsort$$(_, beg, end) {
					{
						if (beg >= end) return;

						var tmp;
						if (end === beg + 1) {
								if ((yield _streamline.await(_filename, 298, null, compare, 0, null, false)(true, array[beg], array[end])) > 0) {
										tmp = array[beg];
										array[beg] = array[end];
										array[end] = tmp;
									}
								return;
							}

						var mid = Math.floor((beg + end) / 2);
						var o = array[mid];
						var nbeg = beg;
						var nend = end;

						while (nbeg <= nend) {
							while (nbeg < end && (yield _streamline.await(_filename, 312, null, compare, 0, null, false)(true, array[nbeg], o)) < 0) nbeg++;
							while (beg < nend && (yield _streamline.await(_filename, 313, null, compare, 0, null, false)(true, o, array[nend])) < 0) nend--;

							if (nbeg <= nend) {
									tmp = array[nbeg];
									array[nbeg] = array[nend];
									array[nend] = tmp;
									nbeg++;
									nend--;
								}
						}

						if (nbeg < end) yield _streamline.await(_filename, 324, null, _qsort, 0, null, false)(true, nbeg, end);
						if (beg < nend) yield _streamline.await(_filename, 325, null, _qsort, 0, null, false)(true, beg, nend);
					}
				}, 0, 3);

				var array = this;
				beg = beg || 0;
				end = end == null ? array.length - 1 : end;

				yield _streamline.await(_filename, 327, null, _qsort, 0, null, false)(true, beg, end);
				return array;
			}
		}, 0, 4)
	});

	///
	/// ## Function functions 
	///
	/// * `result = fn.apply_(_, thisObj, args[, index])` 
	///   Helper to use `Function.prototype.apply` inside streamlined functions. 
	///   Equivalent to `result = fn.apply(thisObj, argsWith_)` where `argsWith_` is
	///   a modified `args` in which the callback has been inserted at `index`
	///   (at the end of the argument list if `index` is omitted or negative).
	delete Function.prototype.apply_;
	Object.defineProperty(Function.prototype, 'apply_', {
		configurable: true,
		writable: true,
		enumerable: false,
		value: function (callback, thisObj, args, index) {
			args = Array.prototype.slice.call(args, 0);
			args.splice(index != null && index >= 0 ? index : args.length, 0, callback);
			return this.apply(thisObj, args);
		}
	});
})(typeof exports !== 'undefined' ? exports : Streamline.builtins = Streamline.builtins || {});
///
},{"../funnel":210,"streamline-runtime/lib/generators/runtime":213}],213:[function(require,module,exports){
"use strict";
/**
 * Copyright (c) 2013 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */
var util = require('../util');
var glob = util.getGlobals('generators');

var counters = {
	slowAwait: 0,
	fastAwait: 0,
};

function makeArgs(i) {
	if (i <= 0) return "";
	return i > 1 ? makeArgs(i - 1) + ', a' + i : "a1";
}

if (typeof glob.yielded === "undefined") glob.yielded = true;
glob.PENDING = glob.PENDING || {};

function isGenerator(val) {
	return val && (
	Object.prototype.toString.call(val) === "[object Generator]" || val.toString() === "[object Generator]");
}

function Frame(file, line, fn) {
	this.fn = fn;
	this.file = file || "unknown";
	this.line = line || 0;
}

Object.defineProperty(Frame.prototype, "name", {
	get: function() {
		var fn = this.fn;
		return (fn && (fn.__name__ || fn.name)) || "unknown";
	}
});

Object.defineProperty(Frame.prototype, "info", {
	get: function() {
		return this;
	}
});

function pushFrame(g) {
	if (glob.emitter) glob.emitter.emit('enter', g.frame);
	g.frame = g.frame || glob.frame;
	glob.frame = null;
}

function popFrame(g) {
	if (glob.emitter) glob.emitter.emit('exit', g.frame);
}

function run(fn, g, cb, options) {
	var rsm = glob.resume;
	var emit = function(ev, g) {
			if (glob.emitter) glob.emitter.emit(ev, g.frame);
		}

	try {
		if (glob.frame) {
			g.frame = glob.frame;
			g.frame.g = g;
			glob.frame = null;
		} else {
			g.frame = new Frame("", 0, fn);
		}

		glob.resume = function(err, val) {
			if (glob.yielded) {
				emit("resume", g);
				glob.yielded = false;
			}
			while (g) {
				if (options && options.interrupt && options.interrupt()) return;
				try {
					// ES6 is deprecating send in favor of next. Following line makes us compatible with both.
					var send = g.send || g.next;
					var v = err ? g.
					throw (err) : send.call(g, val);
					val = v.value;
					err = null;
					// if we get PENDING, the current call completed with a pending I/O
					// resume will be called again when the I/O completes. So just save the context and return here.
					if (val === glob.PENDING) {
						if (!glob.yielded) {
							emit("yield", g);
							glob.yielded = true;
						}
						return;
					}
					// if we get [PENDING, e, r], the current call invoked its callback synchronously
					// we just loop to send/throw what the callback gave us.
					if (val && val[0] === glob.PENDING) {
						err = val[1];
						val = val[2];
						if (err) err = wrapError(err, g);
					}
					// else, if g is done we unwind it we send val to the parent generator (or through cb if we are at the top)
					else if (v.done) {
						//g.close();
						popFrame(g);
						g = g.prev;
					}
					// else if val is not a generator we have an error. Yield was not applied to a generators
					else {
						if (!isGenerator(val)) {
							throw new Error("invalid value was yielded. Expected a generator, got " + val);
						}
						// we got a new generator which means that g called another generator function
						// the new generator become current and we loop with g.send(undefined) (equiv to g.next()) 
						val.prev = g;
						g = val;
						pushFrame(g);
						val = undefined;
					}
				} catch (ex) {
					// the send/throw call failed.
					// we unwind the current generator and we rethrow into the parent generator (or through cb if at the top)
					//g.close();
					err = wrapError(ex, g);
					popFrame(g);
					g = g.prev;
					val = undefined;
				}
			}
			// we have exhausted the stack of generators. 
			// return the result or error through the callback.
			cb(err, val);
		}

		// start the resume loop
		glob.resume();
	} finally {
		// restore resume global
		glob.resume = rsm;
	}
}

function mapResults(options, args) {
	if (options && typeof options === "object") {
		if (options.returnArray) return args;
		if (options.returnObject) return options.returnObject.reduce(function(res, key, i) {
			res[key] = args[i];
			return res;
		}, {});
	}
	return args[0];
}

function invoke(that, fn, args, index, index2, returnArray) {
	// Set things up so that call returns:
	// * PENDING if it completes with a pending I/O (and cb will be called later)
	// * [PENDING, e, r] if the callback is called synchronously.
	var result = glob.PENDING,
		sync = true;
	var rsm = glob.resume;

	// convert args to array so that args.length gets correctly set if index is args.length
	args = Array.prototype.slice.call(args, 0);
	var cx = glob.context;
	var callback = function(e, r) {
			var oldContext = glob.context;
			var oldResume = glob.resume;
			try {
				if (returnArray) r = Array.prototype.slice.call(arguments, 1);
				glob.context = cx;
				glob.resume = rsm;
				if (sync) {
					result = [glob.PENDING, e, r];
				} else {
					glob.resume(e, r);
				}
			} finally {
				glob.context = oldContext;
				glob.resume = oldResume;
			}
		}
	if (index2 != null) {
		args[index] = function(r) {
			callback(null, r);
		}
		args[index2] = function(e) {
			callback(e);
		}
	} else {
		args[index] = callback;
	}
	fn.apply(that, args);
	sync = false;
	return result;
}

var star = function(fn, index, index2, returnArray) {
	return function *() {
		return (yield invoke(this, fn, arguments, index, index2, returnArray));
	};
}

var unstarTemplate = function(fn, options) {
		var index = (options && typeof options === 'object') ? options.callbackIndex : options;
		if (index == null) index = fn.length;

		var F = function F() {
			var cb = arguments[index];
			if (typeof cb !== "function") {
				if (glob.allowBooleanPlaceholders && typeof cb === 'boolean') {
					if (cb) cb = util.defaultCallback;
					else return exports.future("", 0, null, wrapper.bind(this), index)(arguments);
				}
				else throw util.argError(fn.name, index, "function", typeof cb);
			}
			var g = fn.apply(this, arguments);
			run.call(this, fn, g, cb);
		};
		// track the original name for stack frames
		F.__name__ = fn.name;
		return F;
	}

var unstarBody = unstarTemplate.toString();
unstarBody = unstarBody.substring(unstarBody.indexOf('{'));
var unstarrors = [];

function makeUnstarror(i) {
	return eval("(function(fn, options)" + unstarBody.replace(/function\s*F\(\)/, "function F(" + makeArgs(i) + ")") + ")");
}

function unstar(fn, index, arity) {
	var i = arity != null ? arity : (index == null ? fn.length + 1 : fn.length);
	var unstarror = unstarrors[i] || (unstarrors[i] = makeUnstarror(i));
	return unstarror(fn, index);
}

function wrapError(err, g) {
	if (!(err instanceof Error)) return err; // handle throw "some string";
	for (var gg = err.g; gg; gg = gg.prev) {
		if (gg === g) return err;
	}
	err = Object.create(err);
	err.g = g;
	Object.defineProperty(err, 'stack', {
		get: function() {
			return stackTrace(this);
		}
	});
	return err;
}

function stackTrace(err) {
	var extra;
	function starredStack(e) {
		if (!e || !e.g) return "";
		var s = starredStack(Object.getPrototypeOf(e));
		for (var g = e.g; g.prev; g = g.prev) {
			var fname = g.prev.frame.name || "";
			var m = /\$\$(.*)\$\$/.exec(fname);
			if (m) fname = m[1];
			s += '    at ' + fname + ' (' + g.frame.file + ':' + g.frame.line + ')\n';
		}
		return s;
	}
	var rawStack = Object.getOwnPropertyDescriptor(new Error(), 'stack').get.call(err);
	var cut = rawStack.indexOf('    at GeneratorFunctionPrototype');
	if (cut < 0) cut = rawStack.indexOf('\n') + 1;
	var result = rawStack.substring(0, cut).replace(/\n.*regenerator.runtime.*/g, '') + //
	'    <<< yield stack >>>\n' + starredStack(err) + //
	'    <<< raw stack >>>\n' + rawStack.substring(cut);
	return result;
}

exports.await = function(file, line, object, property, index1, index2, returnArray) {
	var bound = typeof property !== "function";
	var fn = bound ? object[property] : property;
	glob.frame = new Frame(file, line, fn);
	var key = '';
	if (index2 == null && !returnArray) {
		key = 'starred-' + index1;
		var wrapper = fn[key];
		if (wrapper) {
			counters.fastAwait++;
			return bound ? wrapper.bind(object) : wrapper;
		}
	}
	counters.slowAwait++;
	if (typeof fn !== "function") throw util.typeError("cannot call", "function", fn);
	wrapper = star(fn, index1, index2, returnArray);
	if (!bound && key) {
		fn[key] = wrapper;
	}
	return bound ? wrapper.bind(object) : wrapper;
};

exports.async = function(fn, index, arity) {
	if (typeof fn !== "function") throw util.typeError("cannot wrap function", "function", fn);
	var unstarred = unstar(fn, index, arity);
	unstarred["starred-" + index] = fn;
	return unstarred;
}

exports.new = function(file, line, constructor, index) {
	if (typeof constructor !== "function") throw util.typeError("cannot instantiate", "function", constructor);
	glob.frame = new Frame(file, line, constructor);
	var starred = star(constructor, index);
	return function *() {
		var that = Object.create(constructor.prototype);
		yield starred.apply(that, arguments);
		return that;
	};
};

exports.future = require('../future');
require('./builtins');
},{"../future":211,"../util":214,"./builtins":212}],214:[function(require,module,exports){
(function (process,global){
"use strict";
// colors package does not work in browser - fails on reference to node's `process` global
var idem = function(x) { return x; };
var colors;
if (typeof(process) !== 'undefined' && !process.browser) {
	try {
		colors = require(idem('colors'));
	} catch (ex) {
		// console.error(ex.stack);
	}
}
if (!colors) colors = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray'].reduce(function(r, c) {
	r[c] = idem;
	return r;
}, {});

function log(message) {
	console.error(colors.gray("[STREAMLINE-RUNTIME] " + message));
}
function warn(message) {
	console.error(colors.magenta("[STREAMLINE-RUNTIME] " + message));
}
function error(message) {
	console.error(colors.red("[STREAMLINE-RUNTIME] " + message));
}

function trace(obj) {
	if (obj instanceof TypeError) util.error(obj.stack);
	//else console.error(obj);
};

function typeName(val) {
	return val === null ? "null" : typeof val;
}

function typeError(message, expected, got) {
	var err = new TypeError(message + ": expected " + expected + ", got " + typeName(got));
	console.error(err.stack);
	throw err;
}

function argError(fname, index, expected, got) {
	return typeError("invalid argument " + index + " to function `" + fname + "`", expected, got);
}

function getGlobals(runtime) {
	var glob = typeof global === "object" ? global : window;
	var secret = "_20c7abceb95c4eb88b7ca1895b1170d1";
	var g = (glob[secret] = (glob[secret] || { context: {} }));
	if (runtime && g.runtime !== runtime) {
		if (g.runtime) console.warn("[STREAMLINE-RUNTIME] " + runtime + " runtime loaded on top of " + g.runtime);
		else g.runtime = runtime;
	}
	return g;
}

function defaultCallback(err) {
	if (err) throw err;
}

// fix names in stack traces
var origPrepareStackTrace = Error.prepareStackTrace;
if (origPrepareStackTrace) Error.prepareStackTrace = function (_, stack) { 
	// eval stack frames from streamline-runtime fibers are botched: column number is 0, 
	// which causes an error in source-map-support.js / mapEvalOrigin.
	// So we filter them out.
	stack = stack.filter(function(frame) {
		var origin = frame.isEval() && frame.getEvalOrigin();
		return (!(origin && /\bstreamline-runtime\b/.test(origin)));
	});
	var result;
	try {
		result = origPrepareStackTrace.call(this, _, stack);
	} catch (ex) {
		result = "\n*** STACKTRACE PREPARE FAILED: " + ex.message + " ***\n" + stack.join('\n');
	}
	result = result.replace(/_\$\$(.*)\$\$\d*/g, function(all, x) { return x; })
		.replace(/Function\.(.*) \[as awaitWrapper-0\]/g, function(all, x) { return x; });
	return result;
};

function defaultRuntime() {
	var _defRT;
	return _defRT || (_defRT = (function() {
		try {
			require(idem('fibers'));
			return 'fibers';
		} catch (ex) {}
		try {
			eval("(function*(){})");
			return 'generators';
		} catch (ex) {}
		return "callbacks";
	})());
}

module.exports = {
	log: log,
	warn: warn,
	error: error,
	trace: trace,
	typeName: typeName,
	typeError: typeError,
	argError: argError,
	getGlobals: getGlobals,
	defaultCallback: defaultCallback,
	defaultRuntime: defaultRuntime,
};
var util = module.exports;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":191}],215:[function(require,module,exports){
(function (process,global){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
 * additional grant of patent rights can be found in the PATENTS file in
 * the same directory.
 */

!(function(global) {
  "use strict";

  var hasOwn = Object.prototype.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  var inModule = typeof module === "object";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    if (inModule) {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided, then outerFn.prototype instanceof Generator.
    var generator = Object.create((outerFn || Generator).prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype;
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] = GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  runtime.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `value instanceof AwaitArgument` to determine if the yielded value is
  // meant to be awaited. Some may consider the name of this method too
  // cutesy, but they are curmudgeons.
  runtime.awrap = function(arg) {
    return new AwaitArgument(arg);
  };

  function AwaitArgument(arg) {
    this.arg = arg;
  }

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value instanceof AwaitArgument) {
          return Promise.resolve(value.arg).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration. If the Promise is rejected, however, the
          // result for this iteration will be rejected with the same
          // reason. Note that rejections of yielded Promises are not
          // thrown back into the generator function, as is the case
          // when an awaited Promise is rejected. This difference in
          // behavior between yield and await is important, because it
          // allows the consumer to decide what to do with the yielded
          // rejection (swallow it and continue, manually .throw it back
          // into the generator, abandon iteration, whatever). With
          // await, by contrast, there is no opportunity to examine the
          // rejection reason outside the generator function, so the
          // only option is to throw it from the await expression, and
          // let the generator function handle the exception.
          result.value = unwrapped;
          resolve(result);
        }, reject);
      }
    }

    if (typeof process === "object" && process.domain) {
      invoke = process.domain.bind(invoke);
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return runtime.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          if (method === "return" ||
              (method === "throw" && delegate.iterator[method] === undefined)) {
            // A return or throw (when the delegate iterator has no throw
            // method) always terminates the yield* loop.
            context.delegate = null;

            // If the delegate iterator has a return method, give it a
            // chance to clean up.
            var returnMethod = delegate.iterator["return"];
            if (returnMethod) {
              var record = tryCatch(returnMethod, delegate.iterator, arg);
              if (record.type === "throw") {
                // If the return method threw an exception, let that
                // exception prevail over the original return or throw.
                method = "throw";
                arg = record.arg;
                continue;
              }
            }

            if (method === "return") {
              // Continue with the outer return, now that the delegate
              // iterator has been terminated.
              continue;
            }
          }

          var record = tryCatch(
            delegate.iterator[method],
            delegate.iterator,
            arg
          );

          if (record.type === "throw") {
            context.delegate = null;

            // Like returning generator.throw(uncaught), but without the
            // overhead of an extra function call.
            method = "throw";
            arg = record.arg;
            continue;
          }

          // Delegate generator ran and handled its own exceptions so
          // regardless of what the method was, we continue as if it is
          // "next" with an undefined arg.
          method = "next";
          arg = undefined;

          var info = record.arg;
          if (info.done) {
            context[delegate.resultName] = info.value;
            context.next = delegate.nextLoc;
          } else {
            state = GenStateSuspendedYield;
            return info;
          }

          context.delegate = null;
        }

        if (method === "next") {
          if (state === GenStateSuspendedYield) {
            context.sent = arg;
          } else {
            context.sent = undefined;
          }

        } else if (method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw arg;
          }

          if (context.dispatchException(arg)) {
            // If the dispatched exception was caught by a catch block,
            // then let that catch block handle the exception normally.
            method = "next";
            arg = undefined;
          }

        } else if (method === "return") {
          context.abrupt("return", arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          var info = {
            value: record.arg,
            done: context.done
          };

          if (record.arg === ContinueSentinel) {
            if (context.delegate && method === "next") {
              // Deliberately forget the last sent value so that we don't
              // accidentally pass it on to the delegate.
              arg = undefined;
            }
          } else {
            return info;
          }

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(arg) call above.
          method = "throw";
          arg = record.arg;
        }
      }
    };
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp[toStringTagSymbol] = "Generator";

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      this.sent = undefined;
      this.done = false;
      this.delegate = null;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;
        return !!caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.next = finallyEntry.finallyLoc;
      } else {
        this.complete(record);
      }

      return ContinueSentinel;
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = record.arg;
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      return ContinueSentinel;
    }
  };
})(
  // Among the various tricks for obtaining a reference to the global
  // object, this seems to be the most reliable technique that does not
  // use indirect eval (which violates Content Security Policy).
  typeof global === "object" ? global :
  typeof window === "object" ? window :
  typeof self === "object" ? self : this
);

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":191}],216:[function(require,module,exports){
"use strict";
var streamline = require('babel-plugin-streamline');

window.Streamline = {
	transform: function transform(code, streamlineOptions) {
		streamlineOptions = streamlineOptions || {};
		streamlineOptions.runtime = streamlineOptions.runtime || "callbacks";
		return babel.transform(code, {
			plugins: [streamline],
			blacklist: streamlineOptions.runtime !== 'callbacks' ? ['regenerator'] : [],
			extra: {
				streamline: streamlineOptions
			}
		}).code;
	},
	modules: {
		'streamline-runtime/lib/callbacks/runtime': require('streamline-runtime/lib/callbacks/runtime'),
		'streamline-runtime/lib/callbacks/builtins': require('streamline-runtime/lib/callbacks/builtins'),
		'streamline-runtime/lib/generators/runtime': require('streamline-runtime/lib/generators/runtime'),
		'streamline-runtime/lib/generators/builtins': require('streamline-runtime/lib/generators/builtins')
	},
	require: function require(path) {
		var api = Streamline.modules[path];
		if (!api) throw new Error("cannot require: " + path);
		return api;
	},
	globals: require('streamline-runtime').globals
};

},{"babel-plugin-streamline":186,"streamline-runtime":204,"streamline-runtime/lib/callbacks/builtins":205,"streamline-runtime/lib/callbacks/runtime":208,"streamline-runtime/lib/generators/builtins":212,"streamline-runtime/lib/generators/runtime":213}]},{},[216]);
