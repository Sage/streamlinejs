//streamline.options = { "lines" : "ignore" }
var http = require('http');
var streams = require('../lib/streams');

var bufSize = 1000;
var bufCount = 8;
var modulo = 50;

function makeBuffer(i) {
	var buf = new Buffer(bufSize);
	for (var j = 0; j < bufSize; j++)
		buf[j] = 0x30 + i + (j % modulo);
	//console.error("\nGEN: " + i + ": " + buf)
	return buf;
}

function checkBuffer(buf, i, offset, size) {
	if (buf == null)
		throw new Error("null buffer: " + i);
	if (buf.length != size)
		throw new Error("bad buffer length: " + buf.length);
	for (var j = 0; j < size; j++) {
		var ii = i + Math.floor((offset + j) / bufSize);
		var jj = offset + j;
		if (buf[j] !== 0x30 + ii + (jj % modulo))
			throw new Error("data corruption: ii=" + ii + ", jj=" + jj + " val=" + buf[j]);
	}
}

http.createServer( function (req, res, _) {
	res.writeHead(200, {'Content-Type': 'application/octet-stream'});
	for (var i = 0; i < bufCount; i++) {
		res.write(makeBuffer(i));
		process.nextTick(_);
	}
	res.end();
}).listen(1337, "127.0.0.1");
console.error('Server running at http://127.0.0.1:1337/');

function addBufferHooks(stream) {
	var pause = stream.pause.bind(stream);
	stream.pause = function() {
		process.stderr.write("<");
		pause();
	}
	var resume = stream.resume.bind(stream);
	stream.resume = function() {
		process.stderr.write(">");
		resume();
	}
}

function test(_, name, options, fn) {
	process.stderr.write("\ttesting " + name);
	options.url = 'http://127.0.0.1:1337/';
	var resp =  streams.httpRequest(options).end().response(_);
	addBufferHooks(resp.stream);
	fn(_, resp);
	if (resp.read(_))
		throw new Error("unexpected data at end")
	console.error(" ok");
}

function dot(_) {
	process.nextTick(_);
	process.stderr.write(".");
	
}

function testPass(_, name, options) {
	console.error("pass " + name);
	var t0 = Date.now();

	test(_, "chunk read", options, function(_, resp) {
		for (var i = 0; i < bufCount; i++) {
			var buf = resp.read(_);
			checkBuffer(buf, i, 0, bufSize);
			dot(_);
		}
	});
	test(_, "half size read", options, function(_, resp) {
		for (var i = 0; i < bufCount * 2; i++) {
			var half = bufSize / 2;
			var buf = resp.read(_, half);
			checkBuffer(buf, Math.floor(i / 2), (i % 2) * half, half);
			dot(_);
		}
	});
	test(_, "double size read", options, function(_, resp) {
		for (var i = 0; i < Math.floor(bufCount / 2); i++) {
			var dbl = bufSize * 2;
			var buf = resp.read(_, dbl);
			checkBuffer(buf, i * 2, 0, dbl);
			dot(_);
		}
	});
	test(_, "odd size read", options, function(_, resp) {
		var total = 0;
		for (var i = 0; i < Math.floor(bufCount * 7); i++) {
			var len = Math.floor(bufSize / 7);
			var buf = resp.read(_, len);
			checkBuffer(buf, Math.floor(total / bufSize), total % bufSize, len);
			total += buf.length;
			dot(_);
		}
		var remain = bufCount * bufSize - total;
		var buf = resp.read(_, remain);
		checkBuffer(buf, bufCount - 1, total % bufSize, remain);
		total += buf.length;
		if (total != bufCount * bufSize)
			throw new Error("bad total at end");
	});
	test(_, "random size read", options, function(_, resp) {
		var total = 0;
		while (total < bufCount * bufSize) {
			var len = Math.floor(Math.random() * 3 * bufSize);
			var buf = resp.read(_, len);
			var expected = total + len < bufCount * bufSize ? len : bufCount * bufSize - total;
			checkBuffer(buf, Math.floor(total / bufSize), total % bufSize, expected);
			total += buf.length;
			dot(_);
		}
		if (total != bufCount * bufSize)
			throw new Error("bad total at end");
	})
	console.error("pass completed in " + (Date.now() - t0) + " ms");
}

var oneTenth = Math.floor(bufCount * bufSize / 10);
testPass(_, "default buffering (warm up)", {});
testPass(_, "default buffering", {});
testPass(_, "buffer 0/1 tenth", { lowMark: 0, highMark: oneTenth });
testPass(_, "buffer 2/3 tenth", { lowMark: 2 * oneTenth, highMark: 3 * oneTenth });
testPass(_, "buffer 1 tenth and above", { lowMark: oneTenth, highMark: 11 * oneTenth });
testPass(_, "buffer all", { lowMark: 0, highMark: 11 * oneTenth });
process.exit();
