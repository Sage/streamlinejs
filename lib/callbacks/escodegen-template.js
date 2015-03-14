"use strict";
// template to expose escodegen server side
(function() {
	// load utils.code
	var modules = {};
	var mod = {};
	(function(module) {
		{{'../../node_modules/escodegen/node_modules/esutils/lib/code.js'}}
	})(mod);
	modules.esutils = {
		code: mod.exports,
	};

	// load estraverse
	(function(exports) {
		{{'../../node_modules/escodegen/node_modules/estraverse/estraverse.js'}}
	})(modules.estraverse = {});

	modules['./package.json'] = {{'../../package.json'}};

	(function(require, exports) {
		{{'../../node_modules/escodegen/escodegen.js'}}
	})(function(path) {
		if (!modules[path]) throw new Error("unexpected require: " + path);
		return modules[path];
	}, window.escodegen = {
		browser: true,
	});
})();
