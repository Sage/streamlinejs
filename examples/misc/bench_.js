function bench(_, name, fn) {
	function tryItNative(cb, count) {
		var t0 = Date.now();
		var failed;

		function loop(i) {
			if (i < count) {
				fn(function(err) {
					if (err) return cb(err);
					try {
						loop(i + 1);
					} catch (ex) {
						!failed && console.log("Native\t\t" + name + "\tFAILED: " + ex.message);
						failed = true;
						cb(null, true);
					}
				});
			} else {
				var dt = (Date.now() - t0);
				if (dt < 100) return cb(null, false);
				dt = Math.round(dt * 100 * 1000 / count) / 100;
				console.log("Native\t\t" + name + "\t" + dt + "ns");
				return cb(null, true);
			}
		}
		loop(0);
	}

	function tryItStreamline(_, count) {
		var t0 = Date.now();
		for (var i = 0; i < count; i++) fn(_);
		var dt = (Date.now() - t0);
		if (dt < 100) return false;
		dt = Math.round(dt * 100 * 1000 / count) / 100;
		console.log("Streamline\t" + name + "\t" + dt + "ns");
		return true;

	}

	function run(_, tryIt) {
		var count = 1;
		while (!tryIt(_, count)) count *= 2;
	}
	run(_, tryItStreamline);
	run(_, tryItNative);
}

function delay(_, val) {
	process.nextTick(_);
	return val;
}

bench(_, "nop", function(_) {})
bench(_, "nextTick", function(_) {
	process.nextTick(_);
})

bench(_, "delay", function(_) {
	delay(_);
})

bench(_, "try/catch", function(_) {
	try {
		process.nextTick(_);
	} catch (ex) {}
})

bench(_, "try/catch/throw", function(_) {
	try {
		process.nextTick(_);
		throw new Error("");
	} catch (ex) {}
})

bench(_, "try/finally", function(_) {
	try {
		process.nextTick(_);
	} finally {}
})

bench(_, "nextTick if", function(_) {
	if (true) process.nextTick(_);
})

bench(_, "recurse", function(_) {
	function f(_, depth) {
		if (depth > 0) f(_, depth - 1);
		else process.nextTick(_)
	};
	f(_, 100);
})

bench(_, "mixed", function(_) {
	for (var i = 0; delay(_, i) < 10; i++) {
		try {
			if (delay(_, i) % 2) {
				process.nextTick(_);
			}
		} catch (ex) {}
	}
})