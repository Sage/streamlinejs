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

function sparse() {
	var a = [];
	a[3] = 33;
	a[4] = 44;
	a[9] = 99;
	return a;
}

function dump(a) {
	return a.reduce(function(s, v) {
		return s + '/' + v;
	}, '');
}

asyncTest("each", 7, function(_) {
	var result = 1;
	flows.each(_, [1, 2, 3, 4], function(_, val) {
		result = result * delay(_, val);
	})
	strictEqual(result, 24);
	result = 1;
	[1, 2, 3, 4].forEach_(_, function(_, val) {
		var v = delay(_, val);
		result = result * v;
	})
	strictEqual(result, 24);
	result = 1;
	[1, 2, 3, 4].forEach_(_, 2, function(_, val) {
		var v = delay(_, val);
		result = result * v;
	})
	strictEqual(result, 24);
	result = 1;
	[1, 2, 3, 4].forEach_(_, {
		parallel: 2
	}, function(_, val) {
		var v = delay(_, val);
		result = result * v;
	})
	strictEqual(result, 24);
	result = 1;
	[1, 2, 3, 4].forEach_(_, -1, function(_, val) {
		var v = delay(_, val);
		result = result * v;
	})
	strictEqual(result, 24);
	result = '';
	sparse().forEach_(_, function(_, val, i) {
		var v = delay(_, val);
		result = result + '/' + i + ':' + v;
	})
	strictEqual(result, '/3:33/4:44/9:99');
	result = '';
	sparse().forEach_(_, -1, function(_, val, i) {
		var v = delay(_, val);
		result = result + '/' + i + ':' + v;
	})
	strictEqual(result, '/3:33/4:44/9:99');
	start();
})
asyncTest("map", 9, function(_) {
	var result = flows.map(_, [1, 2, 3, 4], function(_, val) {
		return 2 * delay(_, val);
	});
	deepEqual(result, [2, 4, 6, 8]);
	var result = [1, 2, 3, 4].map_(_, function(_, val) {
		return 2 * delay(_, val);
	});
	deepEqual(result, [2, 4, 6, 8]);
	var result = [1, 2, 3, 4].map_(_, 2, function(_, val) {
		return 2 * delay(_, val);
	});
	deepEqual(result, [2, 4, 6, 8]);
	var result = [1, 2, 3, 4].map_(_, {
		parallel: 2
	}, function(_, val) {
		return 2 * delay(_, val);
	});
	deepEqual(result, [2, 4, 6, 8]);
	var result = [1, 2, 3, 4].map_(_, -1, function(_, val) {
		return 2 * delay(_, val);
	});
	deepEqual(result, [2, 4, 6, 8]);
	result = sparse().map_(_, function(_, val, i) {
		var v = delay(_, val);
		return i + ':' + v;
	});
	strictEqual(result.length, 10);
	strictEqual(dump(result), '/3:33/4:44/9:99');
	result = sparse().map_(_, -1, function(_, val, i) {
		var v = delay(_, val);
		return i + ':' + v;
	});
	strictEqual(result.length, 10);
	strictEqual(dump(result), '/3:33/4:44/9:99');
	start();
})
asyncTest("filter", 9, function(_) {
	var result = flows.filter(_, [1, 2, 3, 4], function(_, val) {
		return delay(_, val) % 2;
	});
	deepEqual(result, [1, 3]);
	var result = [1, 2, 3, 4].filter_(_, function(_, val) {
		return delay(_, val) % 2;
	});
	deepEqual(result, [1, 3]);
	var result = [1, 2, 3, 4].filter_(_, 2, function(_, val) {
		return delay(_, val) % 2;
	});
	deepEqual(result, [1, 3]);
	var result = [1, 2, 3, 4].filter_(_, {
		parallel: 2
	}, function(_, val) {
		return delay(_, val) % 2;
	});
	deepEqual(result, [1, 3]);
	var result = [1, 2, 3, 4].filter_(_, -1, function(_, val) {
		return delay(_, val) % 2;
	});
	deepEqual(result, [1, 3]);
	result = sparse().filter_(_, function(_, val, i) {
		return delay(_, val) % 2;
	});
	strictEqual(result.length, 2);
	deepEqual(result, [33, 99]);
	result = sparse().filter_(_, -1, function(_, val, i) {
		return delay(_, val) % 2;
	});
	strictEqual(result.length, 2);
	deepEqual(result, [33, 99]);
	start();
})
asyncTest("every true", 7, function(_) {
	var result = flows.every(_, [1, 2, 3, 4], function(_, val) {
		return delay(_, val) < 5;
	});
	strictEqual(result, true);
	var result = [1, 2, 3, 4].every_(_, function(_, val) {
		return delay(_, val) < 5;
	});
	strictEqual(result, true);
	var result = [1, 2, 3, 4].every_(_, 2, function(_, val) {
		return delay(_, val) < 5;
	});
	strictEqual(result, true);
	var result = [1, 2, 3, 4].every_(_, {
		parallel: 2
	}, function(_, val) {
		return delay(_, val) < 5;
	});
	strictEqual(result, true);
	var result = [1, 2, 3, 4].every_(_, -1, function(_, val) {
		return delay(_, val) < 5;
	});
	strictEqual(result, true);
	result = sparse().every_(_, function(_, val, i) {
		return delay(_, val) > 30;
	});
	strictEqual(result, true);
	result = sparse().every_(_, -1, function(_, val, i) {
		return delay(_, val) > 30;
	});
	strictEqual(result, true);
	start();
});
asyncTest("every false", 7, function(_) {
	var result = flows.every(_, [1, 2, 3, 4], function(_, val) {
		return delay(_, val) < 3;
	});
	strictEqual(result, false);
	var result = [1, 2, 3, 4].every_(_, function(_, val) {
		return delay(_, val) < 3;
	});
	strictEqual(result, false);
	var result = [1, 2, 3, 4].every_(_, 2, function(_, val) {
		return delay(_, val) < 3;
	});
	strictEqual(result, false);
	var result = [1, 2, 3, 4].every_(_, {
		parallel: 2
	}, function(_, val) {
		return delay(_, val) < 3;
	});
	strictEqual(result, false);
	var result = [1, 2, 3, 4].every_(_, -1, function(_, val) {
		return delay(_, val) < 3;
	});
	strictEqual(result, false);
	result = sparse().every_(_, function(_, val, i) {
		return delay(_, val) > 40;
	});
	strictEqual(result, false);
	result = sparse().every_(_, -1, function(_, val, i) {
		return delay(_, val) > 40;
	});
	strictEqual(result, false);
	start();
});
asyncTest("some true", 7, function(_) {
	var result = flows.some(_, [1, 2, 3, 4], function(_, val) {
		return delay(_, val) < 3;
	});
	strictEqual(result, true);
	var result = [1, 2, 3, 4].some_(_, function(_, val) {
		return delay(_, val) < 3;
	});
	strictEqual(result, true);
	var result = [1, 2, 3, 4].some_(_, 2, function(_, val) {
		return delay(_, val) < 3;
	});
	strictEqual(result, true);
	var result = [1, 2, 3, 4].some_(_, {
		parallel: 2
	}, function(_, val) {
		return delay(_, val) < 3;
	});
	strictEqual(result, true);
	var result = [1, 2, 3, 4].some_(_, -1, function(_, val) {
		return delay(_, val) < 3;
	});
	strictEqual(result, true);
	result = sparse().some_(_, function(_, val, i) {
		return delay(_, val) > 30;
	});
	strictEqual(result, true);
	result = sparse().some_(_, -1, function(_, val, i) {
		return delay(_, val) > 30;
	});
	strictEqual(result, true);
	start();
});
asyncTest("some false", 7, function(_) {
	var result = flows.some(_, [1, 2, 3, 4], function(_, val) {
		return delay(_, val) < 0;
	});
	strictEqual(result, false);
	var result = [1, 2, 3, 4].some_(_, function(_, val) {
		return delay(_, val) < 0;
	});
	strictEqual(result, false);
	var result = [1, 2, 3, 4].some_(_, 2, function(_, val) {
		return delay(_, val) < 0;
	});
	strictEqual(result, false);
	var result = [1, 2, 3, 4].some_(_, {
		parallel: 2
	}, function(_, val) {
		return delay(_, val) < 0;
	});
	strictEqual(result, false);
	var result = [1, 2, 3, 4].some_(_, -1, function(_, val) {
		return delay(_, val) < 0;
	});
	strictEqual(result, false);
	result = sparse().some_(_, function(_, val, i) {
		return !(delay(_, val) > 20);
	});
	strictEqual(result, false);
	result = sparse().some_(_, -1, function(_, val, i) {
		return !(delay(_, val) > 20);
	});
	strictEqual(result, false);
	start();
});
asyncTest("reduce", 3, function(_) {
	var result = flows.reduce(_, [1, 2, 3, 4], function(_, v, val) {
		return v * delay(_, val);
	}, 1);
	strictEqual(result, 24);
	var result = [1, 2, 3, 4].reduce_(_, function(_, v, val) {
		return v * delay(_, val);
	}, 1);
	strictEqual(result, 24);
	var result = sparse().reduce_(_, function(_, v, val) {
		return v + '/' + delay(_, val);
	}, '');
	strictEqual(result, '/33/44/99');
	start();
});
asyncTest("reduceRight", 3, function(_) {
	var result = flows.reduceRight(_, [1, 2, 3, 4], function(_, v, val) {
		return v * delay(_, val);
	}, 1);
	strictEqual(result, 24);
	var result = [1, 2, 3, 4].reduceRight_(_, function(_, v, val) {
		return v * delay(_, val);
	}, 1);
	strictEqual(result, 24);
	var result = sparse().reduceRight_(_, function(_, v, val) {
		return v + '/' + delay(_, val);
	}, '');
	strictEqual(result, '/99/44/33');
	start();
});
asyncTest("sort", 4, function(_) {
	var array = [1, 2, 3, 4];
	flows.sort(_, array, function(_, a, b) {
		return delay(_, a - b);
	});
	deepEqual(array, [1, 2, 3, 4], "In order array sort ok");
	array.sort_(_, function(_, a, b) {
		return delay(_, a - b);
	});
	deepEqual(array, [1, 2, 3, 4], "In order array sort ok");
	array = [4, 3, 2, 1];
	array.sort_(_, function(_, a, b) {
		return delay(_, a - b);
	});
	deepEqual(array, [1, 2, 3, 4], "Reverse array sort ok");
	array = [3, 1, 2, 4];
	array.sort_(_, function(_, a, b) {
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
			total = delay(_, i) + total;
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
			total = delay(_, i) + total;
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
			total = delay(_, i) + total;
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
		result1 = future(_) + result1;
		result2 = future(_) + result2;
		delay(_);
		result3 = future(_) + result3;
	}

	var f1 = delay(null, 1);
	var f10 = delay(null, 10);

	flows.collect(_, [doIt(f1), doIt(f10), doIt(f1)]);

	deepEqual(result1, 12);
	deepEqual(result2, 12);
	deepEqual(result3, 12);
	start();
})