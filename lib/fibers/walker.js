// Copyright 2011 Marcel Laverdet
"use strict";
if (typeof exports !== 'undefined') {
	module.exports = Walker;
} else {
	Streamline.walker = Walker;
}

/**
 * It seems that Narcissus lacks a reasonable node walker. This implements a simple walker which
 * lets you walk a tree linearly, in terms of source code, and only subscribe to the parts that
 * you're interested in.
 */
function Walker(visitors) {
	return function walk(node) {
		var type = node.type;
		if (type === undefined) {
			throw new Error('Trying to walk unknown node!');
		}
		switch (type) {
			case 'AssignmentExpression':
				if (visitors[type]) {
					visitors[type].call(node, node.left, node.right);
				} else {
					walk(node.left);
					walk(node.right);
				}
				break;

			case 'ArrayExpression':
				if (visitors[type]) {
					visitors[type].call(node, node.elements);
				} else {
					node.elements.map(walk);
				}
				break;

			case 'ArrowFunctionExpression':
				throw new Error("NIY");

			case 'BinaryExpression':
			case 'LogicalExpression':
				if (visitors[type]) {
					visitors[type].call(node, node.operator, node.left, node.right);
				} else {
					walk(node.left);
					walk(node.right);
				}
				break;

			case 'BlockStatement':
			case 'Program':
				if (visitors[type]) {
					visitors[type].call(node, node.body);
				} else {
					node.body.map(walk);
				}
				break;

			case 'BreakStatement':
			case 'ContinueStatement':
				if (visitors[type]) {
					visitors[type].call(node, node.label && node.label.name);
				}
				break;

			case 'CallExpression':
			case 'NewExpression':
				if (visitors[type]) {
					visitors[type].call(node, node.callee, node.arguments);
				} else {
					walk(node.callee);
					node.arguments.map(walk);
				}
				break;

			case 'CatchClause':
				if (visitors[type]) {
					visitors[type].call(node, node.body);
				} else {
					walk(node.body);
				}
				break;

			case 'ConditionalExpression':
			case 'IfStatement':
				if (visitors[type]) {
					visitors[type].call(node, node.test, node.consequent, node.alternate);
				} else {
					walk(node.test);
					walk(node.consequent);
					node.alternate && walk(node.alternate);
				}
				break;

			case 'DebuggerStatement':
			case 'EmptyStatement':
			case 'ThisExpression':
				if (visitors[type]) {
					visitors[type].call(node);
				}
				break;

			case 'DoWhileStatement':
				if (visitors[type]) {
					visitors[type].call(node, node.test, node.body);
				} else {
					walk(node.body);
					walk(node.test);
				}
				break;

			case 'ExpressionStatement':
				if (visitors[type]) {
					visitors[type].call(node, node.expression);
				} else {
					node.expression && walk(node.expression);
				}
				break;

			case 'ForStatement':
				if (visitors[type]) {
					visitors[type].call(node, node.init, node.test, node.update, node.body);
				} else {
					node.init && walk(node.init);
					node.test && walk(node.test);
					node.update && walk(node.update);
					walk(node.body);
				}
				break;

			case 'ForInStatement':
				if (visitors[type]) {
					visitors[type].call(node, node.left, node.right, node.body);
				} else {
					walk(node.left);
					walk(node.right);
					walk(node.body);
				}
				break;

			case 'FunctionDeclaration':
			case 'FunctionExpression':
				if (visitors[type] || visitors.Function) {
					(visitors[type] || visitors.Function).call(node, node.id && node.id.name, node.params, node.body.body);
				} else {
					node.body.body.map(walk);
				}
				break;

			case 'Identifier':
				if (visitors[type]) {
					visitors[type].call(node, node.name);
				}
				break;

			case 'LabeledStatement':
				if (visitors[type]) {
					visitors[type].call(node, node.label.id, node.body);
				} else {
					walk(node.body);
				}
				break;

			case 'Literal':
				if (visitors[type]) {
					visitors[type].call(node, node.value);
				}
				break;

			case 'MemberExpression':
				if (visitors[type]) {
					visitors[type].call(node, node.object, node.property);
				} else {
					walk(node.object);
				}
				break;

			case 'ObjectExpression':
				if (visitors[type]) {
					visitors[type].call(node, node.properties);
				} else {
					node.properties.map(walk);
				}
				break;

			case 'Property':
				if (visitors[type]) {
					visitors[type].call(node, node.key, node.value);
				} else {
					walk(node.value);
				}
				break;

			case 'ReturnStatement':
			case 'ThrowStatement':
				if (visitors[type]) {
					visitors[type].call(node, node.argument);
				} else {
					node.argument && walk(node.argument);
				}
				break;

			case 'SequenceExpression':
				if (visitors[type]) {
					visitors[type].call(node, node.expressions);
				} else {
					node.expressions.map(walk);
				}
				break;

			case 'SwitchCase':
				if (visitors[type]) {
					visitors[type].call(node, node.test, node.consequent);
				} else {
					node.test && walk(node.test);
					node.consequent.map(walk);
					Walker.insideCase = false;
				}
				break;

			case 'SwitchStatement':
				if (visitors[type]) {
					visitors[type].call(node, node.discriminant, node.cases);
				} else {
					walk(node.discriminant);
					node.cases.map(walk);
				}
				break;

			case 'TryStatement':
				if (visitors[type]) {
					visitors[type].call(node, node.block, node.handlers, node.finalizer);
				} else {
					walk(node.block);
					node.handlers.map(walk);
					node.finalizer && walk(node.finalizer);
				}
				break;

			case 'UnaryExpression':
			case 'UpdateExpression':
				if (visitors[type]) {
					visitors[type].call(node, node.operator, node.argument);
				} else {
					walk(node.argument);
				}
				break;

			case 'VariableDeclaration':
				if (visitors[type]) {
					visitors[type].call(node, node.declarations);
				} else {
					node.declarations.map(walk);
				}
				break;

			case 'VariableDeclarator':
				if (visitors[type]) {
					visitors[type].call(node, node.id.name, node.init);
				} else {
					node.init && walk(node.init);
				}
				break;

			case 'WhileStatement':
				if (visitors[type]) {
					visitors[type].call(node, node.test, node.body);
				} else {
					walk(node.test);
					walk(node.body);
				}
				break;

			case 'WithStatement':
				if (visitors[type]) {
					visitors[type].call(node, node.object, node.body);
				} else {
					walk(node.object);
					walk(node.body);
				}
				break;


			default:
				throw new Error("unhandled node type: " + node.type);
		}
	};
}
