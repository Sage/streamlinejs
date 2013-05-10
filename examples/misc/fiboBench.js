var fs = require('fs');

function fib(n) {
	return n <= 1 ? 1 : fib(n - 1) + fib(n - 2);
}

function rawBench(n, loop, modulo, asyncFn, callback) {
	var count = 0;
	var l = loop;

	function fibo(nn, cb) {
		if (modulo && count++ % modulo === 0) asyncFn(function(err) {
			if (err) return cb(err);
			fibo1(nn, cb);
		});
		else fibo1(nn, cb);

	}

	function fibo1(nn, cb) {
		if (nn <= 1) return cb(null, 1);
		fibo(nn - 1, function(err, v1) {
			if (err) return cb(err);
			fibo(nn - 2, function(err, v2) {
				if (err) return cb(err);
				cb(null, v1 + v2);
			})
		})
	}

	var expected = fib(n);
	var t0 = Date.now();
	var loopCb = function(err, got) {
			if (err) return callback(err);
			if (got !== expected) throw new Error("bench failed: got " + got + ', expected ' + expected);
			if (--l > 0) {
				fibo(n, loopCb);
			} else {
				console.log('raw callbacks:\t' + (Date.now() - t0) + "ms");
				callback(null, count);
			}
		};
	fibo(n, loopCb);
}

function bench(prefix, n, loop, modulo, asyncFn, _) {
	var count = 0;

	function fibo(_, nn) {
		if (modulo && count++ % modulo === 0) asyncFn(_);
		if (nn <= 1) return 1;
		return fibo(_, nn - 1) + fibo(_, nn - 2);

	}
	var expected = fib(n);
	var t0 = Date.now();
	for (var i = 0; i < loop; i++) {
		var got = fibo(_, n);
		if (got !== expected) throw new Error("bench failed: got " + got + ', expected ' + expected);
	}
	var tabs = (prefix.length < 7) ? '\t\t' : '\t';
	console.log(prefix + ':' + tabs + (Date.now() - t0) + "ms");
	return count;
}

var syncBench = bench;

function makeBench(mode) {
	var fn;
	var str = "(function() {" + require("streamline/lib/" + mode + "/transform").transform("fn=" + bench.toString()) + "return bench; })()";
	eval(str);
	//console.log(mode + ": " + fn);
	return function(n, loop, modulo, asyncFn, cb) {
		fn(mode, n, loop, modulo, asyncFn, cb);
	}
}

var callbacksBench = makeBench('callbacks')
var fibersBench = makeBench('fibers');
var generatorsBench = makeBench('generators');

function fname(fn) {
	if (fn === setImmediate) return 'setImmediate';
	return fn.name;
}

function pass(n, loop, modulo, asyncFn, cb) {
	console.log('STARTING PASS: n=' + n + ', loop=' + loop + ', modulo=' + modulo + ', fn=' + fname(asyncFn));;
	rawBench(n, loop, modulo, asyncFn, function(err, count) {
		callbacksBench(n, loop, modulo, asyncFn, function(err, c) {
			if (err) throw err;
			if (c !== count) throw new Error("count mismatch: expected " + count + ', got ' + c);
			fibersBench(n, loop, modulo, asyncFn, function(err, c) {
				if (err) throw err;
				if (c !== count) throw new Error("count mismatch: expected " + count + ', got ' + c);
				generatorsBench(n, loop, modulo, asyncFn, function(err) {
					if (err) throw err;
					if (c !== count) throw new Error("count mismatch: expected " + count + ', got ' + c);
					cb();
				})
			})
		})
	})
}

function warmUp(cb) {
	console.log("*** WARMING UP ***")
	pass(25, 1, 3, setImmediate, function() {
		pass(25, 1, 3, setImmediate, function() {
			pass(25, 1, 3, setImmediate, function() {
				cb();
			});
		});
	});
}

function test1(cb) {
	console.log("\n*** setImmediate n=25, loop=1 ***")
	pass(25, 1, 3, setImmediate, function() {
		pass(25, 1, 10, setImmediate, function() {
			pass(25, 1, 100, setImmediate, function() {
				pass(25, 1, 1000, setImmediate, function() {
					cb();
				});
			});
		});
	});
}

function test2(cb) {
	console.log("\n*** setImmediate n=1 loop=100000 ***")
	pass(1, 100000, 3, setImmediate, function() {
		pass(1, 100000, 10, setImmediate, function() {
			pass(1, 100000, 100, setImmediate, function() {
				pass(1, 100000, 1000, setImmediate, function() {
					cb();
				});
			});
		});
	});
}

function readMe(cb) {
	fs.readFile(__filename, "utf8", cb);
}

function test3(cb) {
	console.log("\n*** readMe n=1 loop=10000 ***")
	pass(1, 10000, 3, readMe, function() {
		pass(1, 10000, 10, readMe, function() {
			pass(1, 10000, 100, readMe, function() {
				cb();
			});
		});
	});
}

warmUp(function() {
	test1(function() {
		test2(function() {
			test3(function() {
				console.log("BENCH COMPLETE!")
			});
		});
	});
});