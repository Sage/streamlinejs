"use strict";
var babel = require('babel-core');
var streamline = require('babel-plugin-streamline');
var es2015 = require('babel-preset-es2015');
var es2015Plugins = es2015.plugins;

window.Streamline = {
	transform: function(code, streamlineOptions) {
		streamlineOptions = streamlineOptions || {};
		streamlineOptions.runtime = streamlineOptions.runtime || "callbacks";
		var plugins = [[streamline, streamlineOptions]];
		// remove regenerator plugin (last one in es2015 preset) if generators mode
		es2015.plugins = es2015Plugins.slice(); // restore original plugins list
		if (streamlineOptions.runtime === 'generators') es2015.plugins.pop();
		return babel.transform(code, {
			plugins: plugins,
			presets: es2015,
		}).code;
	},
	modules: {
		'streamline-runtime/lib/callbacks/regenerator' : require('streamline-runtime/lib/callbacks/regenerator'),
		'streamline-runtime/lib/callbacks/runtime': require('streamline-runtime/lib/callbacks/runtime'),
		'streamline-runtime/lib/callbacks/builtins': require('streamline-runtime/lib/callbacks/builtins'),
		'streamline-runtime/lib/generators/runtime': require('streamline-runtime/lib/generators/runtime'),
		'streamline-runtime/lib/generators/builtins': require('streamline-runtime/lib/generators/builtins'),
	},
	require: function(path) {
		var api = Streamline.modules[path];
		if (!api) throw new Error("cannot require: " + path);
		return api;
	},
	globals: require('streamline-runtime').globals,
};