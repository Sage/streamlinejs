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
		'regenerator/runtime': require('regenerator/runtime'),
		'streamline-runtime/lib/runtime-callbacks': require('streamline-runtime/lib/runtime-callbacks'),
		'streamline-runtime/lib/builtins-callbacks': require('streamline-runtime/lib/builtins-callbacks'),
		'streamline-runtime/lib/runtime-generators': require('streamline-runtime/lib/runtime-generators'),
		'streamline-runtime/lib/builtins-generators': require('streamline-runtime/lib/builtins-generators'),
	},
	require: function(path) {
		var api = Streamline.modules[path];
		if (!api) throw new Error("cannot require: " + path);
		return api;
	},
	globals: require('streamline/lib/globals'),
};