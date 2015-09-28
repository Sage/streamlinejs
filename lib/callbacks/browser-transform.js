"use strict";
var streamline = require('babel-plugin-streamline');

window.Streamline = {
	transform: function(code, streamlineOptions) {
		return babel.transform(code, {
			plugins: [streamline],
			blacklist: ['regenerator'],
			extra: {
				streamline: streamlineOptions,
			},
		}).code;
	},
	runtime: {
		generators: require('streamline-runtime/lib/runtime-generators'),
	},
	builtins: {
		generators: require('streamline-runtime/lib/builtins-generators'),
	},
	require: function(path) {
		switch (path) {
			case 'streamline-runtime/lib/runtime-generators': return Streamline.runtime.generators;
			case 'streamline-runtime/lib/builtins-generators': return Streamline.builtins.generators;
			default: throw new Error("cannot require: " + path);
		}
	},
	globals: require('streamline/lib/globals'),
};