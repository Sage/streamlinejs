"use strict";
var streamline = require('babel-plugin-streamline');

window.Streamline = {
	transform: function(code, streamlineOptions) {
		streamlineOptions = streamlineOptions || {};
		streamlineOptions.runtime = streamlineOptions.runtime || "callbacks";
		return babel.transform(code, {
			plugins: [streamline],
			blacklist: streamlineOptions.runtime !== 'callbacks' ? ['regenerator'] : [],
			extra: {
				streamline: streamlineOptions,
			},
		}).code;
	},
	modules: {
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