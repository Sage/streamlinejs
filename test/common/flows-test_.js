//streamline.options = { "lines" : "preserve" }
var module = QUnit.module;
var flows = require("streamline/lib/util/flows");

function delay(_, val) {
	flows.nextTick(_);
	return val;
}

function delayFail(_, err) {
	flows.nextTick(_);
	throw err;
}

module("flows");

asyncTest("each", 1, function(_) {
	var result = 1;
	flows.each(_, [1, 2, 3, 4], function(_, val) {
		result = result * delay(_, val);
	})
	strictEqual(result, 24);
	start();
})
asyncTest("map", 1, function(_) {
	var result = flows.map(_, [1, 2, 3, 4], function(_, val) {
		return 2 * delay(_, val);
	});
	deepEqual(result, [2, 4, 6, 8]);
	start();
})
asyncTest("filter", 1, function(_) {
	var result = flows.filter(_, [1, 2, 3, 4], function(_, val) {
		return delay(_, val) % 2;
	});
	deepEqual(result, [1, 3]);
	start();
})
asyncTest("every", 1, function(_) {
	var result = flows.every(_, [1, 2, 3, 4], function(_, val) {
		return delay(_, val) < 5;
	});
	strictEqual(result, true);
	start();
});
asyncTest("every", 1, function(_) {
	var result = flows.every(_, [1, 2, 3, 4], function(_, val) {
		return delay(_, val) < 3;
	});
	strictEqual(result, false);
	start();
});
asyncTest("some", 1, function(_) {
	var result = flows.some(_, [1, 2, 3, 4], function(_, val) {
		return delay(_, val) < 3;
	});
	strictEqual(result, true);
	start();
});
asyncTest("some", 1, function(_) {
	var result = flows.some(_, [1, 2, 3, 4], function(_, val) {
		return delay(_, val) < 0;
	});
	strictEqual(result, false);
	start();
});
asyncTest("reduce", 1, function(_) {
	var result = flows.reduce(_, [1, 2, 3, 4], function(_, v, val) {
		return v * delay(_, val);
	}, 1);
	strictEqual(result, 24);
	start();
});
asyncTest("reduceRight", 1, function(_) {
	var result = flows.reduceRight(_, [1, 2, 3, 4], function(_, v, val) {
		return v * delay(_, val);
	}, 1);
	strictEqual(result, 24);
	start();
});
asyncTest("sort", 3, function(_) {
	var array = [1, 2, 3, 4];
	flows.sort(_, array, function(_, a, b) {
		return delay(_, a - b);
	});
	deepEqual(array, [1, 2, 3, 4], "In order array sort ok");
	array = [4, 3, 2, 1];
	flows.sort(_, array, function(_, a, b) {
		return delay(_, a - b);
	});
	deepEqual(array, [1, 2, 3, 4], "Reverse array sort ok");
	array = [1, 4, 2, 3];
	flows.sort(_, array, function(_, a, b) {
		return delay(_, a - b);
	});
	deepEqual(array, [1, 2, 3, 4], "Random array sort ok");
	start();
});
asyncTest("collectAll", 4, function(_) {
	var total = 0;
	var peak = 0;
	var count = 0;

	function doIt(i) {
		return function(_) {
			count++;
			peak = Math.max(count, peak);
			total += delay(_, i);
			count--;
			return 2 * i;
		}
	}

	var results = flows.spray([doIt(1), doIt(2), doIt(3)]).collectAll(_);
	equal(total, 6);
	ok(peak >= 2);
	equal(count, 0);
	deepEqual(results, [2, 4, 6]);
	start();
})
asyncTest("collectOne", 4, function(_) {
	var total = 0;
	var peak = 0;
	var count = 0;

	function doIt(i) {
		return function(_) {
			count++;
			peak = Math.max(count, peak);
			total += delay(_, i);
			count--;
			return 2 * i;
		}
	}

	var result = flows.spray([doIt(1), doIt(2), doIt(3)]).collectOne(_);
	ok(total == 1 || total == 2);
	ok(peak >= 2);
	ok(count > 0);
	ok(result == 2 || result == 4);
	start();
})
asyncTest("collectAll with limit", 1, function(_) {
	var total = 0;
	var peak = 0;
	var count = 0;

	function doIt(i) {
		return function(_) {
			count++;
			peak = Math.max(count, peak);
			total += delay(_, i);
			count--;
			return 2 * i;
		}
	}

	var results = flows.spray([doIt(1), doIt(2), doIt(3)], 2).collectAll(_);
	deepEqual([total, peak, count, results], [6, 2, 0, [2, 4, 6]]);
	start();
})
asyncTest("contexts", 3, function(_) {
	function testContext(_, x) {
		flows.setContext({
			val: x
		});
		var y = delay(_, 2 * x);
		strictEqual(y, 2 * flows.getContext().val);
		return y + 1;
	}

	var result = flows.spray([

	function(_) {
		return testContext(_, 3);
	},

	function(_) {
		return testContext(_, 5);
	}

	]).collectAll(_);
	deepEqual(result, [7, 11]);
	start();
})

asyncTest("futures multiplex", 3, function(_) {
	var result1 = 0;
	var result2 = 0;
	var result3 = 0;

	function doIt(future, _) {
		result1 += future(_);
		result2 += future(_);
		delay(_);
		result3 += future(_);
	}

	var f1 = delay(null, 1);
	var f10 = delay(null, 10);

	flows.collect(_, [doIt(f1), doIt(f10), doIt(f1)]);

	deepEqual(result1, 12);
	deepEqual(result2, 12);
	deepEqual(result3, 12);
	start();
})