var sourceMap = require('source-map');

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
