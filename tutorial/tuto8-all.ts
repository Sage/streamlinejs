///<reference path='../typescript/node_.d.ts'/>
///<reference path='../typescript/mongodb_.d.ts'/>
///<reference path='../typescript/streamline-main.d.ts'/>
"use strict";

// tell streamline that this file needs to be transformed
~~~streamline();

import streams = module('streamline/lib/streams/server/streams');
import url = module('url');
import qs = module('querystring');

var begPage = '<html><head><title>My Search</title></head></body>' + //
'<form action="/">Search: ' + //
'<input name="q" value="{q}"/>' + //
'<input type="submit"/>' + //
'</form><hr/>';
var endPage = '<hr/>generated in {ms}ms</body></html>';

streams.createHttpServer(function(request, response, _) {
	var query = qs.parse(url.parse(request.url).query),
		t0 = new Date().getTime();
	response.writeHead(200, {
		'Content-Type': 'text/html; charset=utf8'
	});
	response.write(_, begPage.replace('{q}', query.q || ''));
	response.write(_, search(_, query.q));
	response.write(_, endPage.replace('{ms}', '' + (new Date().getTime() - t0)));
	response.end();
}).listen(_, 1337);
console.log('Server running at http://127.0.0.1:1337/');

function search(_: async, q: string) {
	if (!q || /^\s*$/.test(q)) return "Please enter a text to search";
	try {
		// start the 3 futures
		var googleFuture = future_(googleSearch(null, q));
		var fileFuture = future_(fileSearch(null, q));
		var mongoFuture = future_(mongoSearch(null, q));
		// join the results
		return '<h2>Web</h2>' + googleFuture(_) //
		+ '<hr/><h2>Files</h2>' + fileFuture(_) //
		+ '<hr/><h2>Mongo</h2>' + mongoFuture(_);
	} catch (ex) {
		return 'an error occured. Retry or contact the site admin: ' + ex.stack;
	}
}

function googleSearch(_: async, q: string) {
	var t0 = new Date().getTime();
	var json = streams.httpRequest({
		url: 'http://ajax.googleapis.com/ajax/services/search/web?v=1.0&q=' + q,
		proxy: process.env.http_proxy
	}).end().response(_).checkStatus(200).readAll(_);
	// parse JSON response
	var parsed = JSON.parse(json);
	// Google may refuse our request. Return the message then.
	if (!parsed.responseData) return "GOOGLE ERROR: " + parsed.responseDetails;
	// format result in HTML
	return '<ul>' + parsed.responseData.results.map(function(entry) {
		return '<li><a href="' + entry.url + '">' + entry.titleNoFormatting + '</a></li>';
	}).join('') + '</ul>' + '<br/>completed in ' + (new Date().getTime() - t0) + ' ms';
}

import fs = module('fs');
import flows = module('streamline/lib/util/flows');
// allocate a funnel for 100 concurrent open files
var filesFunnel = flows.funnel(100);

function fileSearch(_: async, q: string) {
	var t0 = new Date().getTime();
	var results = '';

	function doDir(_, dir) {
		fs.readdir(dir, _).forEach_(_, -1, function(_, file) {
			var f = dir + '/' + file;
			var stat = fs.stat(f, _);
			if (stat.isFile()) {
				// use the funnel to limit the number of open files 
				filesFunnel(_, function(_) {
					fs.readFile(f, 'utf8', _).split('\n').forEach(function(line, i) {
						if (line.indexOf(q) >= 0) results += '<br/>' + f + ':' + i + ':' + line;
					});
				});
			} else if (stat.isDirectory()) {
				doDir(_, f);
			}
		});
	}
	doDir(_, __dirname);
	return results + '<br/>completed in ' + (new Date().getTime() - t0) + ' ms';;
}

import mongodb = module('mongodb');
var mongoFunnel = flows.funnel(1);

function mongoSearch(_: async, q: string) {
	var t0 = new Date().getTime();
	var db = new mongodb.Db('tutorial', new mongodb.Server("127.0.0.1", 27017, {}));
	db.open(_);
	try {
		var coln = db.collection('movies', _);
		mongoFunnel(_, function(_) {
			if (coln.count(_) === 0) coln.insert(MOVIES, _);
		});
		var re = new RegExp(".*" + q + ".*");
		return coln.find({
			$or: <any[]>[{
				title: re
			}, {
				director: re
			}]
		}, _).toArray(_).map(function(movie) {
			return movie.title + ': ' + movie.director;
		}).join('<br/>') + '<br/>completed in ' + (new Date().getTime() - t0) + ' ms';;
	} finally {
		db.close();
	}
}

var MOVIES = [{
	title: 'To be or not to be',
	director: 'Ernst Lubitsch'
}, {
	title: 'La Strada',
	director: 'Federico Fellini'
}, {
	title: 'Metropolis',
	director: 'Fritz Lang'
}, {
	title: 'Barry Lyndon',
	director: 'Stanley Kubrick'
}];
