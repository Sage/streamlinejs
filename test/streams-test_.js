//streamline.options = { "lines" : "ignore" }
var http = require('http');
var streams = require('../lib/streams');

var bufSize = 30000;
var bufCount = 80;
var totalSize = bufCount * bufSize;
var modulo = 50;

function makeBuffer(i) {
	var buf = new Buffer(bufSize);
	for (var j = 0; j < bufSize; j++)
		buf[j] = 0x30 + i + (j % modulo);
	//console.error("\nGEN: " + i + ": " + buf)
	return buf;
}

function checkBuffer(buf, start) {
	if (buf == null)
		throw new Error("null buffer");
	var i = Math.floor(start / bufSize);
	var j = start % bufSize;
	for (var k = 0; k < buf.length; k++, j++) {
		if (j == bufSize) {
			i++;
			j = 0;
		}
		if (buf[k] !== 0x30 + i + (j % modulo))
			throw new Error("data corruption: i=" + i + ", j=" + j + " k=" + k + " val=" + buf[k]);
	}
	return start + buf.length;
}

new streams.HttpServer( function (req, res, _) {
	res.writeHead(200, {'Content-Type': 'application/octet-stream'});
	res.emitter.on("drain", function() {
		process.stderr.write("*");
	})
	for (var i = 0; i < bufCount; i++) {
		res.write(_, makeBuffer(i));
		process.nextTick(_);
	}
	res.end();
}).listen(_, 1337, "127.0.0.1");
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
	addBufferHooks(resp.emitter);
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

	function testRead(_, name, size) {
		test(_, name, options, function(_, resp) {
			for (var i = 0, total = 0; total < totalSize; i++) {
				var len = size && typeof size === "function" ? size() : size;
				var buf = resp.read(_, len);
				total = checkBuffer(buf, total);
				dot(_);
			}
		});
	}

	testRead(_, "chunk read");
	testRead(_, "half size read", Math.floor(bufSize / 2));
	testRead(_, "double size read", bufSize * 2);
	testRead(_, "odd size read", Math.floor(bufSize / 7));
	testRead(_, "random size read", function() { var r = Math.random(); return Math.floor(r * r * r * r * 3 * bufSize); });
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
