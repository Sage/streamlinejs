QUnit.module(module.id);

function evalTest(f, val) {
	f(_ >> function(err, result) {
		var str = err ? "ERR: " + err : result;
		strictEqual(str, val, val);
		start();
	});
}

function delay(_, val) {
	setTimeout(~_, 0);
	return val;
}

function delayFail(_, err) {
	setTimeout(~_, 0);
	throw err;
}

function throwError(message) {
	throw new Error(message);
}

asyncTest("eval return", 1, function(_) {
	evalTest(function f(_) {
		return delay(_, 5);
	}, 5);
})
asyncTest("eval if true", 1, function(_) {
	evalTest(function f(_) {
		if (true) return delay(_, 3);
		return 4;
	}, 3);
})
asyncTest("eval if false", 1, function(_) {
	evalTest(function f(_) {
		if (false) return delay(_, 3);
		return 4;
	}, 4);
})
asyncTest("eval while", 1, function(_) {
	evalTest(function f(_) {
		var i = 1,
			result = 1;
		while (i < 5) {
			result = delay(_, i * result);
			i++;
		}
		return result;
	}, 24);
})
asyncTest("eval for", 1, function(_) {
	evalTest(function f(_) {
		var result = 1;
		for (var i = 1; i < 5; i++) {
			result = delay(_, i) * delay(_, result);
		}
		return result;
	}, 24);
})
asyncTest("eval for in", 1, function(_) {
	evalTest(function f(_) {
		var foo = {
			a: 1,
			b: 2,
			c: 3,
			d: 5
		}
		var result = 1;
		for (var k in foo) {
			result = delay(_, foo[delay(_, k)]) * delay(_, result);
		}
		return result;
	}, 30);
})
asyncTest("fully async for in", 1, function(_) {
	evalTest(function f(_) {
		var result = 1;
		for (var i = delay(_, 2); i < delay(_, 5); i = delay(_, i) + 1) {
			result = delay(_, result) * delay(_, i)
		}
		return result;
	}, 24);
})
asyncTest("break in loop", 1, function(_) {
	evalTest(function f(_) {
		var result = 1;
		for (var i = 1; i < 10; i++) {
			if (i == 5) break;
			result = delay(_, result) * delay(_, i)
		}
		return result;
	}, 24);
})
asyncTest("continue", 1, function(_) {
	evalTest(function f(_) {
		var result = 1;
		for (var i = 1; i < 10; i++) {
			if (i >= 5) continue;
			result = delay(_, result) * delay(_, i)
		}
		return result;
	}, 24);
})
asyncTest("break in while", 1, function(_) {
	evalTest(function f(_) {
		var i = 1,
			result = 1;
		while (i < 10) {
			if (i == 5) break;
			result = delay(_, result) * delay(_, i);
			i++;
		}
		return result;
	}, 24);
})
asyncTest("continue in while", 1, function(_) {
	evalTest(function f(_) {
		var i = 1,
			result = 1;
		while (i < 10) {
			i++;
			if (i >= 5) continue;
			result = delay(_, result) * delay(_, i);
		}
		return result;
	}, 24);
})
asyncTest("for (;;)", 1, function(_) {
	evalTest(function f(_) {
		var i = 0;
		for (;;) {
			if (delay(_, ++i) === 10) return i;
		}
	}, 10);
})
asyncTest("eval lazy", 1, function(_) {
	evalTest(function f(_) {
		var result = 1;
		return delay(_, delay(_, result + 8) < 5) && true ? 2 : 4
	}, 4);
})
asyncTest("eval lazy full async", 1, function(_) {
	evalTest(function f(_) {
		var result = 1;
		return delay(_, delay(_, result + 8) < 5) && true ? delay(_, 2) : delay(_, 4)
	}, 4);
})
asyncTest("try catch 1", 1, function(_) {
	evalTest(function f(_) {
		try {
			return delay(_, "ok");
		} catch (ex) {
			return delay(_, "err");
		}
	}, "ok");
})
asyncTest("try catch 2", 1, function(_) {
	evalTest(function f(_) {
		try {
			throw delay(_, "thrown");
		} catch (ex) {
			return delay(_, "caught ") + ex;
		}
	}, "caught thrown");
})
asyncTest("try catch 3", 1, function(_) {
	evalTest(function f(_) {
		try {
			throw delay(_, "thrown");
		} catch (ex) {
			return delay(_, "caught ") + ex;
		}
	}, "caught thrown");
})
asyncTest("try catch 5", 1, function(_) {
	evalTest(function f(_) {
		try {
			delayFail(_, "delay fail");
		} catch (ex) {
			return delay(_, "caught ") + ex;
		}
	}, "caught delay fail");
})
asyncTest("try catch 6", 1, function(_) {
	evalTest(function f(_) {
		try {
			throwError("direct")
			return delay(_, "ok")
		} catch (ex) {
			return delay(_, "caught ") + ex.message;
		}
	}, "caught direct");
})
asyncTest("try catch 7", 1, function(_) {
	evalTest(function f(_) {
		try {
			var message = delay(_, "indirect");
			throwError(message)
			return delay(_, "ok")
		} catch (ex) {
			return delay(_, "caught ") + ex.message;
		}
	}, "caught indirect");
})
asyncTest("try finally 1", 1, function(_) {
	evalTest(function f(_) {
		var x = "";
		try {
			x += delay(_, "try")
		} finally {
			x += delay(_, " finally");
		}
		x += " end"
		return x;
	}, "try finally end");
})
asyncTest("try finally 2", 1, function(_) {
	evalTest(function f(_) {
		var x = "";
		try {
			x += delay(_, "try")
			return x;
		} finally {
			x += delay(_, " finally");
		}
		x += " end"
		return x;
	}, "try");
})
asyncTest("try finally 3", 1, function(_) {
	evalTest(function f(_) {
		var x = "";
		try {
			x += delay(_, "try")
			throw "bad try";
		} finally {
			x += delay(_, " finally");
		}
		x += " end"
		return x;
	}, "ERR: bad try");
})
asyncTest("try finally 4", 1, function(_) {
	evalTest(function f(_) {
		var x = "";
		try {
			x += delay(_, "try")
			throwError("except");
		} finally {
			x += delay(_, " finally");
		}
		x += " end"
		return x;
	}, "ERR: Error: except");
})
asyncTest("try finally 5", 1, function(_) {
	evalTest(function f(_) {
		var x = "";
		try {
			try {
				x += delay(_, "try")
				throwError("except");
				x += " unreached"
			} finally {
				x += delay(_, " finally");
			}
			x += " end"
			return x;
		} catch (ex) {
			return x + "/" + ex.message;
		}
	}, "try finally/except");
})
asyncTest("try catch finally 1", 1, function(_) {
	evalTest(function f(_) {
		var x = "";
		try {
			try {
				x += delay(_, "try")
				throw new Error("except");
				x += " unreached"
			} catch (ex) {
				x += delay(_, " catch " + ex.message);
				throw ex;
			} finally {
				x += delay(_, " finally");
			}
			x += " end"
			return x;
		} catch (ex) {
			return x + "/" + ex.message;
		}
	}, "try catch except finally/except");
})
asyncTest("try catch finally 2", 1, function(_) {
	evalTest(function f(_) {
		var x = "";
		try {
			try {
				x += delay(_, "try")
				throwError("except");
				x += " unreached"
			} catch (ex) {
				x += " catch " + ex.message;
				throw ex;
			} finally {
				x += " finally";
			}
			x += " end"
			return x;
		} catch (ex) {
			return x + "/" + ex.message;
		}
	}, "try catch except finally/except");
})
asyncTest("nested try/catch 1", 1, function(_) {
	evalTest(function f(_) {
		var x = "";
		try {
			try {
				x += delay(_, "try")
			} catch (ex) {
				x += delay(_, " inner catch " + ex.message);
			}
			throwError(" except");
		} catch (ex) {
			return x + " outer catch" + ex.message;
		}
	}, "try outer catch except");
})
asyncTest("nested try/catch 2", 1, function(_) {
	evalTest(function f(_) {
		var x = "";
		try {
			try {
				x += delay(_, "try")
			} catch (ex) {
				x += " inner catch " + ex.message;
			}
			throw new Error(" except");
		} catch (ex) {
			return x + " outer catch" + ex.message;
		}
	}, "try outer catch except");
})
asyncTest("nested try/catch 3", 1, function(_) {
	evalTest(function f(_) {
		var x = "";
		try {
			try {
				x += delay(_, "try")
			} catch (ex) {
				x += delay(_, " inner catch " + ex.message);
			}
			throw new Error(" except");
		} catch (ex) {
			return x + " outer catch" + ex.message;
		}
	}, "try outer catch except");
})
asyncTest("nested try/finally 1", 1, function(_) {
	evalTest(function f(_) {
		var x = "";
		try {
			try {
				x += delay(_, "try")
			} finally {
				x += delay(_, " inner finally");
			}
			throwError(" except");
		} catch (ex) {
			return x + " outer catch" + ex.message;
		}
	}, "try inner finally outer catch except");
})
asyncTest("nested try/finally 2", 1, function(_) {
	evalTest(function f(_) {
		var x = "";
		try {
			try {
				x += delay(_, "try")
			} finally {
				x += " inner finally";
			}
			throwError(" except");
		} catch (ex) {
			return x + " outer catch" + ex.message;
		}
	}, "try inner finally outer catch except");
})
asyncTest("nested try/finally 3", 1, function(_) {
	evalTest(function f(_) {
		var x = "";
		try {
			try {
				x += delay(_, "try")
			} finally {
				x += delay(_, " inner finally");
			}
			throw new Error(" except");
		} catch (ex) {
			return x + " outer catch" + ex.message;
		}
	}, "try inner finally outer catch except");
})
asyncTest("and ok", 1, function(_) {
	evalTest(function f(_) {
		var x = "<<";
		if (delay(_, true) && delay(_, true)) x += "T1";
		else x += "F1"
		if (delay(_, true) && delay(_, false)) x += "T2";
		else x += "F2"
		if (delay(_, false) && delay(_, true)) x += "T3";
		else x += "F3"
		if (delay(_, false) && delay(_, false)) x += "T4";
		else x += "F4"
		if (delay(_, false) && delayFail(_, "bad")) x += "T5";
		else x += "F5"
		x += ">>";
		return x;
	}, "<<T1F2F3F4F5>>");
})
asyncTest("or ok", 1, function(_) {
	evalTest(function f(_) {
		var x = "<<";
		if (delay(_, true) || delay(_, true)) x += "T1";
		else x += "F1"
		if (delay(_, true) || delay(_, false)) x += "T2";
		else x += "F2"
		if (delay(_, false) || delay(_, true)) x += "T3";
		else x += "F3"
		if (delay(_, false) || delay(_, false)) x += "T4";
		else x += "F4"
		if (delay(_, true) || delayFail(_, "bad")) x += "T5";
		else x += "F5"
		x += ">>";
		return x;
	}, "<<T1T2T3F4T5>>");
})
asyncTest("switch with default", 1, function(_) {
	evalTest(function f(_) {
		function g(_, i) {
			var result = "a"
			switch (delay(_, i)) {
			case 1:
				result = delay(_, "b");
				break;
			case 2:
				return delay(_, "c");
			case 3:
			case 4:
				result = delay(_, "d");
				break;
			default:
				result = delay(_, "e");
			}
			return result;
		}

		return g(_, 0) + g(_, 1) + g(_, 2) + g(_, 3) + g(_, 4) + g(_, 5);
	}, "ebcdde");
})
asyncTest("switch without default", 1, function(_) {
	evalTest(function f(_) {
		function g(_, i) {
			var result = "a"
			switch (delay(_, i)) {
			case 1:
				result = "b";
				break;
			case 2:
				return "c";
			case 3:
			case 4:
				result = "d";
				break;
			}
			return result;
		}

		return g(_, 0) + g(_, 1) + g(_, 2) + g(_, 3) + g(_, 4) + g(_, 5);
	}, "abcdda");
})
asyncTest("switch with fall through", 1, function(_) {
	evalTest(function f(_) {
		function g(_, i) {
			var result = "/"
			switch (delay(_, i)) {
			case 1:
				result += delay(_, "b");
				break;
			case 2:
				result += delay(_, "c");
			case 3:
			case 4:
				result += "d";
			case 5:
				result += delay(_, "e");
				break;
			case 6:
				result += delay(_, "f");
			default:
				result += delay(_, "g");
			}
			return result;
		}

		return g(_, 0) + g(_, 1) + g(_, 2) + g(_, 3) + g(_, 4) + g(_, 5) + g(_, 6) + g(_, 7);
	}, "/g/b/cde/de/de/e/fg/g");
})
asyncTest("this", 5, function(_) {
	evalTest(function f(_) {
		function O(x) {
			this.x = x;
		}

		O.prototype.test1 = function(_) {
			var self = this;
			this.x = delay(_, this.x + 1);
			strictEqual(this, self);
		}
		O.prototype.test2 = function(_) {
			var self = this;
			try {
				this.x = delay(_, this.x + 1);
				strictEqual(this, self);
			} catch (ex) {
				ok(false);
			}
		}
		O.prototype.test3 = function(_) {
			var self = this;
			try {
				this.x = delay(_, this.x + 1);
				throwError("test3");
				ok(false);
			} catch (ex) {
				strictEqual(this, self);
				this.x = delay(_, this.x + 1);
			}
		}

		function delay2(val, _) {
			return delay(_, val);
		}

		O.prototype.test4 = function(_) {
			var self = this;
			var v1 = delay2(this.x + 1, !_);
			var v2 = delay2(1, !_);
			this.x = v1(_) + v2(_);
			strictEqual(this, self);
		}
		var o = new O(1);
		o.test1(_);
		o.test2(_);
		o.test3(_);
		o.test4(_);
		return o.x;
	}, 7);
})
asyncTest("scoping", 1, function(_) {
	evalTest(function f(_) {
		function test(_) {
			var foo = "abc";

			function bar() {
				return foo;
			}

			delay(_);
			var foo = "xyz";
			return bar;
		}

		return test(_)();
	}, "xyz");
})
asyncTest("return undefined", 1, function(_) {
	evalTest(function f(_) {
		function test(_) {
			delay(_);
			return;
		}

		return test(_);
	}, undefined);
})
asyncTest("futures test", 1, function(_) {
	evalTest(function f(_) {
		function delay2(val, _) {
			return delay(_, val);
		}

		var a = delay2('a', !_);
		var b = delay2('b', !_);
		var c = delay2('c', !_);
		var d = delay2('d', !_);
		return a(_) + b(_) + d(_) + c(_);
	}, "abdc");
})
asyncTest("last case without break", 1, function(_) {
	evalTest(function f(_) {
		switch (true) {
		case true:
			delay(_);
		}
		return 1;
	}, 1);
})

asyncTest("async comma operator", 1, function(_) {
	evalTest(function f(_) {
		var a;
		return a = 4, a++, a = delay(_, 2 * a), delay(_, a + 1);
	}, 11);
})

asyncTest("async constructor", 1, function(_) {
	evalTest(function f(_) {
		function Foo(val, _) {
			delay(_);
			this.x = val;
		}
		Foo.prototype.y = function() {
			return this.x + 1;
		}
		return new Foo(5, _).y();
	}, 6);
})

asyncTest("fibo false async", 1, function(_) {
	evalTest(function f(_) {
		function fibo(_, n) {
			return n > 1 ? fibo(_, n - 1) + fibo(_, n - 2) : 1;
		}
		return fibo(_, 16);
	}, 1597);
})

asyncTest("coffeescript wrapper 1", 1, function(_) {
	evalTest(function f(_) {
		return (function() {
			return delay(_, "cs1");
		})();
	}, "cs1");
})

asyncTest("coffeescript wrapper 2", 1, function(_) {
	evalTest(function f(_) {
		return (function() {
			return delay(_, "cs2");
		}).call(this);
	}, "cs2");
})

asyncTest("coffeescript wrapper 3", 1, function(_) {
	evalTest(function f(_) {
		return (function() {
			return delay(_, "cs3");
		}).apply(this, arguments);
	}, "cs3");
})

asyncTest("sync try/catch in async", 1, function(_) {
	evalTest(function f(_) {
		try {
			throw new Error("catch me");
		} catch (ex) {
			return "got it";
		}
	}, "got it");
})

asyncTest("sync try/catch inside conditional", 1, function(_) {
	evalTest(function f(_) {
		if (true) {
			try {} catch (ex) {}
		}
	}, undefined);
})

asyncTest("labelled break", 1, function(_) {
	evalTest(function f(_) {
		var result = '';
		outer:
		for (var i = 1; i < 10; i++) {
			inner:
			for (var j = 5; j < 10; j++) {
				result = delay(_, result) + '!'
				if (i == 1 && j == 7) break;
				if (i == 2 && j == 7) break inner;
				if (i == 3 && j == 7) continue inner;
				if (i == 4 && j == 7) continue outer;
				if (i == 5 && j == 7) break outer;
				result = delay(_, result) + delay(_, i) + delay(_, j) + '-';
			}
			result += delay(_, '/')
		}
		return result;
	}, '!15-!16-!/!25-!26-!/!35-!36-!!38-!39-/!45-!46-!!55-!56-!');
})

asyncTest("octal literal", 1, function(_) {
	evalTest(function f(_) {
		return 010;
	}, 8);
})

asyncTest("typeof rewriting bug (fibers)", 1, function(_) {
	evalTest(function f(_) {
		var hello = "hello";
		return typeof(hello);
	}, "string");
});

asyncTest("ASI problems", 1, function(_) {
	evalTest(function f(_) {
		var s = "a";
		s = delay(_, s)
		s = delay(_, s)
		delay(_, s)
		delay(_, s)
		return s
	}, "a");
});

function twoResults(a, b, cb) {
	setTimeout(function() {
		cb(null, a, b);
	}, 0);
}

function twoResultsSync(a, b, cb) {
	cb(null, a, b);
}

asyncTest("multiple results ~_", 1, function(_) {
	evalTest(function f(_) {
		var results = twoResults('abc', 'def', ~_);
		return results;
	}, "abc");
});

asyncTest("multiple results [_]", 1, function(_) {
	evalTest(function f(_) {
		var results = twoResults('abc', 'def', [_]);
		return results.join('-');
	}, "abc-def");
});

asyncTest("multiple results with future", 1, function(_) {
	evalTest(function f(_) {
		function wrapper(a, b, _) { return twoResults(a, b, [_]); }
		var results = wrapper('abc', 'def', !_)(_);
		return results.join('-');
	}, "abc-def");
});

asyncTest("multiple results synchronously", 1, function(_) {
	evalTest(function f(_) {
		var results = twoResultsSync('abc', 'def', [_]);
		return results.join('-');
	}, "abc-def");
});

asyncTest("this in futures", 2, function(_) {
	var c = {
		v: 1,
		test: function(_) { return this.v; }
	}
	strictEqual(c.test(_), 1, "direct call");
	strictEqual(c.test(!_)(_), 1, "future call");
	start();
});

asyncTest("arity of async functions", 3, function(_) {
	var f = function(_, a, b, c, d, e, f, g, h, i) { return a + b; };
	var g = function(_, a) { return f(_, 1, 2)}
	strictEqual(f.length, 10, "f.length === 10");
	strictEqual(g.length, 2, "g.length === 2");
	strictEqual(g(_), 3, "g(_) === 3");
	start();
});

asyncTest("futures on _(fn, idx)", 1, function(_) {
	var f = _(function(i, cb) {
		setTimeout(function() {
			cb(null, i + 1);
		}, 0);
	}, 1);
	var fut = f(5, !_);
	strictEqual(fut(_), 6, "fut(_) === 6");
	start();
});

asyncTest("do while", 1, function(_) {
	var i = 0;
	function read(_) {
		return delay(_, ++i); 
	}
	var s = "";
	var v = read(_);
	do {
		s += v;
	} while ((v = read(_)) < 5);
	strictEqual(s, "1234");
	start();
});

asyncTest("return undefined", 1, function(_) {
	function read(_) {
		return delay(_, 1); 
	}
	function f(_) {
		read(_);
	}
	strictEqual(f(_), undefined);
	start();
});

// enable later
false && asyncTest("futures on non-streamline APIs", 1, function(_) {
	function nat(cb) {
		setImmediate(function() {
			cb(null, "abc");
		});
	}
	var fut = nat(!_);
	strictEqual(fut(_), "abc");
	start();
});

