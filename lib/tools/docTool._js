/**
 * Copyright (c) 2011 Bruno Jouhier <bruno.jouhier@sage.com>
 * MIT License
 */

"use strict";
/// !doc
/// 
/// # Documentation tool
/// 
/// Usage:
/// 
/// 	_node streamline/lib/tools/docTool [path]
/// 
/// Extracts documentation comments from `.js` and `._js` files and generates `API.md` file 
/// under package root.
/// 
/// Top of source file must contain `/// !doc` marker to enable doc extraction.  
/// Documentation comments must start with `/// ` (with 1 trailing space).  
/// Extraction can be turned off with `/// !nodoc` and turned back on with `/// !doc`.
/// 
/// `/// !doc` can be replaced by `/// !example`. 
/// In this case, the source code will be transformed to source blocks in the generated `.md` file.
/// 
/// The tool can also be invoked programatically with:
/// 
/// `var docTool = require('streamline/lib/tools/docTool')`
/// 
var fs = require('fs');
var fsp = require('path');

function exists(cb, p) {
	(fs.exists || fsp.exists)(p, function(result) {
		cb(null, result)
	});
}
/// * `doc = docTool.generate(_, path)`  
///   extracts documentation comments from file `path`
exports.generate = function(_, path, options) {
	options = options || {}
	var isWin32 = process.platform === 'win32';

	function _generate(_, path, dontSave) {
		// lstat not available on Windows
		var stat = (isWin32 ? fs.stat : fs.lstat)(path, _);
		if (stat.isFile()) {
			var match;
			if ((match = /^(.*)\._?(js|coffee)$/.exec(path)) && path.indexOf('--fibers.js') < 0) {
				var inside, save, example, inSource, tocEntry = {
					path: match[1],
					description: ''
				};
				var doc = fs.readFile(path, "utf8", _).split('\n').map(function(line) {
					var i = line.indexOf('//' + '/ ');
					if (i >= 0) {
						line = line.substring(i + 4);
						if (line[0] === '!') {
							if (line === "!doc") {
								inside = true;
							} else if (line === "!nodoc") {
								inside = false;
							} else if (line === "!example") {
								inside = true;
								example = true;
								tocEntry.example = true;
								save = true;
							}
							return null;
						}
						if (inside) {
							if (inSource) {
								line = "```\n\n" + line;
								inSource = false;
							}
							if (!tocEntry.done) {
								if (!tocEntry.title && line[0] === '#') tocEntry.title = line;
								else if (tocEntry.title && line.length > 0) tocEntry.description += line + '\n';
								else if (tocEntry.description && line.length === 0) tocEntry.done = true;
							}
							return line + "\n";
						}
						return null;
					} else {
						if (inside && example) {
							if (!inSource) {
								line = "\n``` javascript\n" + line;
								inSource = true;
							}
							return line + "\n";
						}
						return null;
					}
				}).filter(function(line) {
					return line != null;
				}).join("");
				if (inside && inSource) doc += "```\n\n";
				if (doc) {
					if (!tocEntry.title) throw new Error(path + ": doc error: title missing");
					var p = path.substring(0, path.lastIndexOf('.')) + ".md";
					fs.writeFile(p, doc, "utf8", _);
					if (options.verbose) console.log("generated " + p);
					return [tocEntry];
				}
			}
			return null;
		} else if (stat.isDirectory() && (isWin32 || !stat.isSymbolicLink())) {
			var split = path.split("/");
			var isPackage = split[split.length - 2] == 'node_modules';
			var toc = [];
			var files = fs.readdir(path, _);
			for (var i = 0; i < files.length; i++) {
				var entries = _generate(_, path + "/" + files[i], isPackage || dontSave);
				if (entries) toc = toc.concat(entries);
			}
			if (isPackage && !dontSave && toc.length) {
				var text;
				if (exists(_, path + '/package.json')) {
					var pkg = JSON.parse(fs.readFile(path + '/package.json', 'utf8', _));
					text = '# ' + pkg.name + '\n\n' + pkg.description + '\n\n';
				} else {
					text = '# ' + path.substring(path.lastIndexOf('node_modules') + 13) + '\n\n';
				}
				text += toc.filter(function(entry) {
					return !entry.example;
				}).map(function(entry) {
					var p = entry.path.substring(entry.path.lastIndexOf('node_modules') + 13);
					var href = p.substring(p.indexOf('/') + 1) + '.md';
					return '* [' + p + '](' + href + ')  \n  ' + entry.title.substring(2) + '\n';
				}).join('');
				fs.writeFile(path + "/API.md", text, "utf8", _);
				if (options.verbose) console.log("generated " + path + "/API.md");
				return null;
			}
			return toc;
		} else return null;
	}
	// options.verbose = true;
	_generate(_, path);
}
if (process.argv[1] && process.argv[1].indexOf("/docTool") >= 0) exports.generate(_, fsp.join(process.cwd(), process.argv[2] || '.'), {
	verbose: true
});
