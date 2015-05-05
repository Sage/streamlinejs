"use strict";
// Little utility to visualize source-map by generating HTML spans with original source in tooltips
// See Usage below.
var fs = require('fs');
var sourceMap = require('source-map');

if (process.argv.length !== 3) {
	console.error('Usage: node source-map--to-html basename > basename.html' +
	'\n\twhere basename is the module name (without ._js extension).' +
	'\n\tAssumes that basename._js, basename.js and basename.map are present in the folder.');
	/* eslint no-process-exit: 0 */
	process.exit(1);
}

var fname = process.argv[2];

var generatedLines = fs.readFileSync(fname + '.js', 'utf8').split('\n');
var mapText = fs.readFileSync(fname + '.map', 'utf8');
var originals = {};

var result = [];

var smc = new sourceMap.SourceMapConsumer(mapText);

var line, col, prev;

function escape(text) {
	return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ {4}/g, '&nbsp;&nbsp;');
}

function original(m1, m2) {
	if (!m1.source) return "no mapping";
	var lines = originals[m1.source] || (originals[m1.source] = fs.readFileSync(m1.source, 'utf8').split('\n'));
	//if (!m2 || m2.source !== m1.source || m1.originalLine !== m2.originalLine) 
	return lines[m1.originalLine - 1].substring(m1.originalColumn);
	//else return lines[m1.originalLine - 1].substring(m1.originalColumn - 1, m2.originalColumn - 1);
}
function annotate(mapping) {
	result[result.length - 1] += '</span><span title="' + escape(prev.originalLine + ":" + prev.originalColumn + ": " + original(prev, mapping)) + '"' +
	(prev.source ? ' class="mapped"' : '' ) + '>';	
}

smc.eachMapping(function(mapping) {
	if (prev) annotate(mapping);
	while (result.length < mapping.generatedLine && result.length < generatedLines.length) {
		if (col != null) result[result.length - 1] += escape(line.substring(col));
		col = null;
		line = generatedLines[result.length];
		if (result.length === mapping.generatedLine - 1) {
			col = mapping.generatedColumn;
			result.push(escape(line.substring(0, col)));
		} else {
			result.push(escape(line));
		}
	}
	if (mapping.generatedColumn > col) result[result.length - 1] += escape(line.substring(col, mapping.generatedColumn));
	col = mapping.generatedColumn;
	prev = mapping;
});
if (col != null) result[result.length - 1] += line.substring(col);

var full = '<style>' +
'span { font-family:monospace; }' +
'span:hover { background:#dddd00;}' +
//'.mapped { background:#eeeeee;}' +
'</style><span>' + result.join('<br/>\n') + '</span>';
console.log(full);