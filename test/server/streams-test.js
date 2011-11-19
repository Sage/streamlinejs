/*** Generated by streamline 0.1.46 - DO NOT EDIT ***/ "use strict"; var __rt=require('streamline/lib/callbacks/runtime').runtime(__filename),__func=__rt.__func,__cb=__rt.__cb,__propagate=__rt.__propagate,__trap=__rt.__trap,__future=__rt.__future,__setEF=__rt.__setEF,__g=__rt.__g; var streams = require("streamline/lib/streams/streams");


var module = QUnit.module;

var bufSize = 100;
var bufCount = 3;
var totalSize = (bufCount * bufSize);
var modulo = 17;

function makeBuffer(i) {
 var buf = new Buffer(bufSize);
 for (var j = 0; (j < bufSize); j++) { buf[j] = ((48 + i) + ((j % modulo)));; };


 return buf;};


function checkBuffer(buf, start) {
 ok((buf != null), "buffer not null");
 var i = Math.floor((start / bufSize));
 var j = (start % bufSize);
 for (var k = 0; (k < buf.length); k++, j++) {
 if ((j == bufSize)) {
 i++;
 j = 0; } ;

 if ((buf[k] !== ((48 + i) + ((j % modulo))))) {
 return ok(false, ((((((("buffer verification failed:  i=" + i) + ", j=") + j) + " k=") + k) + " val=") + buf[k])) }; };

 ok(true, "buffer content is valid");
 return (start + buf.length);};


new streams.HttpServer(function __1(req, res, _) { var i; var __frame = { name: "__1", line: 35 }; return __func(_, this, arguments, __1, 2, __frame, function __$__1() {
 res.writeHead(200, { "Content-Type": "application/octet-stream" });
 res.emitter.on("drain", function() {
 process.stderr.write("*"); });

 i = 0; var __2 = false; return (function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$__1() { __more = false; if (__2) { i++; } else { __2 = true; } ; var __1 = (i < bufCount); if (__1) {
 return res.write(__cb(_, __frame, 6, 2, function __$__1() {
 return process.nextTick(__cb(_, __frame, 7, 2, function __$__1() { while (__more) { __loop(); }; __more = true; })); }), makeBuffer(i)); } else { __break(); } ; }); do { __loop(); } while (__more); __more = true; })(function __$__1() {

 res.end(); _(); }); });
}).listen(null, 1337, "127.0.0.1");


var paused = 0, resumed = 0;
var doStop = false;

module("node streams test", {
 setup: function() {  },

 teardown: function() {
 if (doStop) {

 setTimeout(function() {
 process.kill(process.pid);
 }, 0); } ; }});




function addBufferHooks(stream) {
 var pause = stream.pause.bind(stream);
 stream.pause = function() {

 paused++;
 pause(); };

 var resume = stream.resume.bind(stream);
 stream.resume = function() {

 resumed++;
 resume(); };};



function doTest(_, name, options, fn) { var resp, last; var __frame = { name: "doTest", line: 79 }; return __func(_, this, arguments, doTest, 0, __frame, function __$doTest() {

 options.url = "http://127.0.0.1:1337/";
 return streams.httpRequest(options).end().response(__cb(_, __frame, 3, 13, function ___(__0, __1) { resp = __1;
 addBufferHooks(resp.emitter);
 return fn(__cb(_, __frame, 5, 1, function __$doTest() {
 return resp.read(__cb(_, __frame, 6, 12, function ___(__0, __2) { last = __2;
 strictEqual(last, null, "read return null at end"); _(); })); }), resp); })); });};



function dot(_) { var __frame = { name: "dot", line: 90 }; return __func(_, this, arguments, dot, 0, __frame, function __$dot() {
 return process.nextTick(__cb(_, __frame, 1, 1, _)); });};




function testPass(name, options) {

 var t0 = Date.now();

 function testRead(name, detail, size) {
 asyncTest(((name + " / ") + detail), function __1(_) { var __frame = { name: "__1", line: 101 }; return __func(_, this, arguments, __1, 0, __frame, function __$__1() {
 return doTest(__cb(_, __frame, 1, 3, function __$__1() {







 start(); _(); }), name, options, function __1(_, resp) { var i, total, len, buf; var __frame = { name: "__1", line: 102 }; return __func(_, this, arguments, __1, 0, __frame, function __$__1() { i = 0; total = 0; var __3 = false; return (function ___(__break) { var __more; var __loop = __cb(_, __frame, 0, 0, function __$__1() { __more = false; if (__3) { i++; } else { __3 = true; } ; var __2 = (total < totalSize); if (__2) { len = ((size && (typeof size === "function")) ? size() : size); return resp.read(__cb(_, __frame, 3, 15, function ___(__0, __1) { buf = __1; total = checkBuffer(buf, total); while (__more) { __loop(); }; __more = true; }), len); } else { __break(); } ; }); do { __loop(); } while (__more); __more = true; })(_); }); }); }); }); };



 testRead(name, "chunk read");
 testRead(name, "half size read", Math.floor((bufSize / 2)));
 testRead(name, "double size read", (bufSize * 2));
 testRead(name, "odd size read", Math.floor(((4 * bufSize) / 7)));
 (false && testRead(name, "random size read", function() {
 var r = Math.random();
 return Math.floor((((((r * r) * r) * r) * 3) * bufSize)); }));};




var oneTenth = Math.floor(((bufCount * bufSize) / 10));

testPass("default buffering", {});
testPass("buffer 0/1 tenth", { lowMark: 0, highMark: oneTenth});
testPass("buffer 2/3 tenth", { lowMark: (2 * oneTenth), highMark: (3 * oneTenth)});
testPass("buffer 1 tenth and above", { lowMark: oneTenth, highMark: (11 * oneTenth)});
testPass("buffer all", { lowMark: 0, highMark: (11 * oneTenth)});

asyncTest("stop  tests", 0, function __2(_) { var __frame = { name: "__2", line: 133 }; return __func(_, this, arguments, __2, 0, __frame, function __$__2() {
 doStop = true;
 start(); _(); });});