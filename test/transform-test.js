$(document).ready(function(){
	var module = QUnit.module;
	var transform = Streamline.transform;
	
	module("generation");
	
	function clean(s){
		if (jQuery.browser.mozilla) 
			return new Function(s).toString();
		else 
			return s.replace(/[\n\t ]/g, '').replace(/};/g, '}').replace(/=\(_\|\|__throw\)/g, '=_||__throw');
	}
	
	function genTest(f1, f2, extraTryCatch){
		var s1 = clean(transform(f1.toString(), {
			noHelpers: true,
			extraTryCatch: extraTryCatch
		}));
		var s2 = clean(f2.toString());
		if (s1 !== s2) {
			console.log("transformed=" + s1);
			console.log("expected   =" + s2);
		}
		strictEqual(s1, s2);
	}
	
	test("basic", 1, function(){
		genTest(function f(_){
			f1(_);
			f2();
		}, function f(_){
			var __ = (_ = _ || __throw);
			return f1(__cb(_, this, function(){
				f2();
				return __();
			}));
		});
	});
	
	test("basic with try/catch", 1, function(){
		genTest(function f(_){
			f1(_);
			f2();
		}, function f(_){
			var __ = (_ = __wrapIn((_ || __throw)));
			try {
				return f1(__cb(_, this, function(){
					f2();
					return __();
				}));
			} 
			catch (e) {
				return __propagate(_, this, e);
			}
		}, true);
	});
	
	test("var return", 1, function(){
		genTest(function f(_){
			var x = f1(_);
			f2();
			return x;
		}, function f(_){
			var __ = (_ = _ || __throw);
			return f1(__cb(_, this, function(__0, x){
				f2();
				return _(null, x);
			}));
		});
	});
	
	test("return", 1, function(){
		genTest(function f(_){
			f1();
			return f2(_);
		}, function f(_){
			var __ = (_ = _ || __throw);
			f1();
			return f2(_);
		});
	});
	
	test("if", 1, function(){
		genTest(function f(_, b){
			f1();
			if (b) {
				f2();
				f3(_);
				f4();
			}
			f5();
		}, function f(_, b){
			var __ = (_ = _ || __throw);
			f1();
			return (function(__){
				if (b) {
					f2();
					return f3(__cb(_, this, function(){
						f4();
						return __();
					}));
				};
				return __();
			}).call(this, function(){
				f5();
				return __();
			});
		});
	});
	
	test("simplified if", 1, function(){
		genTest(function f(_, b){
			f1();
			if (b) {
				f2();
				f3(_);
				f4();
			}
		}, function f(_, b){
			var __ = (_ = _ || __throw);
			f1();
			if (b) {
				f2();
				return f3(__cb(_, this, function(){
					f4();
					return __();
				}));
			};
			return __();
		});
	});
	
	test("if else", 1, function(){
		genTest(function f(_, b){
			f1();
			if (b) {
				f2();
				f3(_);
				f4();
			}
			else {
				f5();
				f6(_);
				f7();
			}
			f8();
		}, function f(_, b){
			var __ = (_ = _ || __throw);
			f1();
			return (function(__){
				if (b) {
					f2();
					return f3(__cb(_, this, function(){
						f4();
						return __();
					}));
				}
				else {
					f5();
					return f6(__cb(_, this, function(){
						f7();
						return __();
					}));
				}
			}).call(this, function(){
				f8();
				return __();
			});
		});
	});
	
	test("if else 2", 1, function(){
		genTest(function f(_, b){
			f1();
			if (b) {
				f2();
				f3(_);
				f4();
				return 1;
			}
			else {
				f5();
			}
			f6();
			return 2;
		}, function f(_, b){
			var __ = (_ = _ || __throw);
			f1();
			return (function(__){
				if (b) {
					f2();
					return f3(__cb(_, this, function(){
						f4();
						return _(null, 1);
					}));
				}
				else {
					f5();
				}
				return __();
			}).call(this, function(){
				f6();
				return _(null, 2);
			});
		});
	});
	
	test("each", 1, function(){
		genTest(function f(_, arr){
			f1();
			each(_, arr, function(_, elt){
				f2(_, elt);
				f3();
			})
			f4();
		}, function f(_, arr){
			var __ = (_ = _ || __throw);
			f1();
			return each(__cb(_, this, function(){
				f4();
				return __();
			}), arr, function(_, elt){
				var __ = (_ = _ || __throw);
				return f2(__cb(_, this, function(){
					f3();
					return __();
				}), elt);
			});
		});
	});
	
	test("while", 1, function(){
		genTest(function f(_){
			f1();
			while (cond) {
				f2(_);
				f3();
			}
			f4();
		}, function f(_){
			var __ = (_ = _ || __throw);
			f1();
			return (function(__break){
				var __loop = __nt(_, this, function(){
					var __ = __loop;
					if (cond) {
						return f2(__cb(_, this, function(){
							f3();
							return __();
						}));
					}
					else {
						return __break();
					}
				});
				return __loop();
			}).call(this, function(){
				f4();
				return __();
			});
		});
	});
	
	test("do while", 1, function(){
		genTest(function f(_){
			f1();
			do {
				f2(_);
				f3();
			}
			while (cond);
			f4();
		}, function f(_){
			var __ = (_ = _ || __throw);
			f1();
			var __1 = true;
			return (function(__break){
				var __loop = __nt(_, this, function(){
					var __ = __loop;
					if ((__1 || cond)) {
						__1 = false;
						return f2(__cb(_, this, function(){
							f3();
							return __();
						}));
					}
					else {
						return __break();
					}
				});
				return __loop();
			}).call(this, function(){
				f4();
				return __();
			});
		});
	});
	
	test("for", 1, function(){
		genTest(function f(_, arr){
			f1();
			for (var i = 0; i < arr.length; i++) {
				f2(_);
				f3();
			}
			f4();
		}, function f(_, arr){
			var __ = (_ = _ || __throw);
			f1();
			var i = 0;
			var __2 = false;
			return (function(__break){
				var __loop = __nt(_, this, function(){
					var __ = __loop;
					if (__2) {
						i++;
					}
					else {
						__2 = true;
					}
					if ((i < arr.length)) {
						return f2(__cb(_, this, function(){
							f3();
							return __();
						}));
					}
					else {
						return __break();
					}
				});
				return __loop();
			}).call(this, function(){
				f4();
				return __();
			});
		})
	})
	
	test("for in", 1, function(){
		genTest(function f(_){
			f1();
			for (var k in obj) {
				f2(_, k);
				f3(k);
			}
			f4();
		}, function f(_){
			var __ = (_ = _ || __throw);
			f1();
			var __1 = __forIn(obj);
			var __2 = 0;
			return (function(__break){
				var __loop = __nt(_, this, function(){
					var __ = __loop;
					if ((__2 < __1.length)) {
						var k = __1[__2++];
						return f2(__cb(_, this, function(){
							f3(k);
							return __();
						}), k);
					}
					else {
						return __break();
					}
				});
				return __loop();
			}).call(this, function(){
				f4();
				return __();
			});
		});
	})
	
	test("switch", 1, function(){
		genTest(function f(_){
			f1();
			switch (exp) {
				case 'a':
					f2(_);
					f3();
					break;
				case 'b':
				case 'c':
					f4();
					f5(_);
					break;
				default:
					f6();
					break;
			}
			f7();
		}, function f(_){
			var __ = (_ = _ || __throw);
			f1();
			return (function(__){
				var __break = __;
				switch (exp) {
					case "a":
						return f2(__cb(_, this, function(){
							f3();
							return __break();
						}));
					case "b":
						
					case "c":
						f4();
						return f5(__cb(_, this, function(){
							return __break();
						}));
					default:
						f6();
						return __break();
				}
				return __();
			}).call(this, function(){
				f7();
				return __();
			});
		});
	})
	
	test("nested switch", 1, function(){
		genTest(function f(_){
			switch (exp) {
				case 'a':
					f2(_);
					switch (exp2) {
						case "b":
							break;
					}
					break;
			}
		}, function f(_){
			var __ = (_ = _ || __throw);
			var __break = __;
			switch (exp) {
				case "a":
					return f2(__cb(_, this, function(){
						switch (exp2) {
							case "b":
								break;
						}
						return __break();
					}));
			}
			return __();
		});
	})
	
	test("nested calls", 1, function(){
		genTest(function f(_){
			f1();
			f2(_, f3(_, f4(_)), f5(_, f6()));
			f7();
		}, function f(_){
			var __ = (_ = _ || __throw);
			f1();
			return f4(__cb(_, this, function(__0, __3){
				return f3(__cb(_, this, function(__0, __2){
					return f5(__cb(_, this, function(__0, __4){
						return f2(__cb(_, this, function(){
							f7();
							return __();
						}), __2, __4);
					}), f6());
				}), __3);
			}));
		});
	})
	
	test("async while condition", 1, function(){
		genTest(function f(_){
			f1();
			while (f2(_)) 
				f3();
			f4();
		}, function f(_){
			var __ = (_ = _ || __throw);
			f1();
			return (function(__break){
				var __loop = __nt(_, this, function(){
					var __ = __loop;
					return f2(__cb(_, this, function(__0, __1){
						if (__1) {
							f3();
						}
						else {
							return __break();
						}
						return __();
					}));
				});
				return __loop();
			}).call(this, function(){
				f4();
				return __();
			});
		})
	})
	
	test("try catch", 1, function(){
		genTest(function f(_){
			f1();
			try {
				f2();
				f3(_);
				f4();
			} 
			catch (ex) {
				f5();
				f6(_);
				f7();
			}
			f8();
		}, function f(_){
			var __ = (_ = _ || __throw);
			f1();
			return (function(__){
				return (function(_){
					try {
						f2();
						return f3(__cb(_, this, function(){
							f4();
							return __();
						}));
					} 
					catch (e) {
						return __propagate(_, this, e);
					}
					
				}).call(this, function(ex, __result){
					if (ex) {
						f5();
						return f6(__cb(_, this, function(){
							f7();
							return __();
						}));
					}
					else 
						return _(null, __result);
				});
			}).call(this, function(){
				try {
					f8();
					return __();
				}
				catch (e) {
					return __propagate(_, this, e);
				}
			});
		});
	})
	
	test("try finally", 1, function(){
		genTest(function f(_){
			f1();
			try {
				f2();
				f3(_);
				f4();
			}
			finally {
				f5();
				f6(_);
				f7();
			}
			f8();
		}, function f(_){
			var __ = (_ = _ || __throw);
			f1();
			return (function(__){
				return (function(_){
					function __(){
						return _(null, null, true);
					}
					try {
						f2();
						return f3(__cb(_, this, function(){
							f4();
							return __();
						}));
					} 
					catch (e) {
						return __propagate(_, this, e);
					}
				}).call(this, function(__err, __result, __cont){
					return (function(__){
						f5();
						return f6(__cb(_, this, function(){
							f7();
							return __();
						}));
					}).call(this, function(){
						if (__cont) {
							return __()
						}
						else {
							return _(__err, __result)
						}
					});
				});
			}).call(this, function(){
				try {
					f8();
					return __();
				}
				catch (e) {
					return __propagate(_, this, e);
				}
			});
		})
	})
	
	test("lazy and", 1, function(){
		genTest(function f(_){
			f1();
			if (f2(_) && f3(_)) {
				f4();
				f5(_);
				f6()
			}
			f7();
		}, function f(_){
			var __ = (_ = _ || __throw);
			f1();
			return (function(__){
				return (function(_){
					var __ = (_ = _ || __throw);
					return f2(__cb(_, this, function(__0, __val){
						if ((!__val == true)) {
							return _(null, __val);
						}
						return f3(_);
					}));
				}).call(this, __cb(_, this, function(__0, __1){
					if (__1) {
						f4();
						return f5(__cb(_, this, function(){
							f6();
							return __();
						}));
					}
					return __();
				}));
			}).call(this, function(){
				f7();
				return __();
			});
		})
	})
	
	test("empty body", 1, function(){
		genTest(function f(_){
		}, function f(_){
			var __ = (_ = _ || __throw);
			return __();
		})
	})
	
	test("only return in body", 1, function(){
		genTest(function f(_){
			return 4;
		}, function f(_){
			var __ = (_ = _ || __throw);
			return _(null, 4);
		})
	})
	
	test("optim pass _", 1, function(){
		genTest(function f(_, arg1){
			return g(_, arg2);
		}, function f(_, arg1){
			var __ = (_ = _ || __throw);
			return g(_, arg2);
		})
	})
	
	test("out wrappers", 1, function(){
		genTest(function f(_, arg1){
			return g(__wrapOut(_), arg2) + 5;
		}, function f(_, arg1){
			var __ = (_ = _ || __throw);
			return g(__wrapOut(__cb(_, this, function(__0, __1){
				return _(null, (__1 + 5));
			})), arg2);
		})
	})
	
	test("scoping", 1, function(){
		genTest(function f(_){
			g(_);
			if (x) {
				var a1, a2, a3, b1 = 1, b2 = 2, b3 = 3;
				var c1, c2;
				a1 = 1;
				a2 = 2;
			}
			else {
				var a2 = 2;
				b2++;
				c1 = 1;
			}
			a3++;
			b3++;
			c2 = 2;
		}, function f(_){
			var __ = (_ = _ || __throw);
			var a2, a3, b2, b3, c1, c2;
			return g(__cb(_, this, function(){
				if (x) {
					var a1;
					var b1 = 1;
					b2 = 2;
					b3 = 3;
					a1 = 1;
					a2 = 2;
				}
				else {
					a2 = 2;
					b2++;
					c1 = 1;
				}
				a3++;
				b3++;
				c2 = 2;
				return __();
			}));
		})
	})
	
	test("sync code not modified", 1, function(){
		genTest(function f(){
			g();
			if (x) {
				var a1, a2, a3, b1 = 1, b2 = 2, b3 = 3;
				var c1, c2;
				a1 = 1;
				a2 = 2;
			}
			else {
				var a2 = 2;
				b2++;
				c1 = 1;
			}
			a3++;
			b3++;
			c2 = 2;
		}, function f(){
			g();
			if (x) {
				var a1, a2, a3, b1 = 1, b2 = 2, b3 = 3;
				var c1, c2;
				a1 = 1;
				a2 = 2;
			}
			else {
				var a2 = 2;
				b2++;
				c1 = 1;
			}
			a3++;
			b3++;
			c2 = 2;
		})
	})
	
	module("evaluation");
	function evalTest1(f, val, options, next){
		var str = transform(f.toString(), options);
		(function(){
			eval(str);
			f(function(err, result){
				var str = err ? "ERR: " + err : result;
				strictEqual(str, val);
				next();
			})
		})();
	}

	function evalTest(f, val){
		delay = delayUnsafe;
		evalTest1(f, val, {
				extraTryCatch: true
			}, function(){
			delay = delaySafe;
			evalTest1(f, val, null, start)
		})
	}
	
	function delayUnsafe(_, val){
		setTimeout(function(){
			_(null, val);
		}, 0);
	}
	
	function delaySafe(_, val){
		setTimeout(function(){
			try {
				_(null, val);
			} 
			catch (ex) {
				_(ex)
			}
		}, 0);
	}
	
	var delay;
	
	function delayFail(_, err){
		setTimeout(function(){
			_(err);
		}, 0);
	}
	
	function throwError(message){
		throw new Error(message);
	}
	
	asyncTest("eval return", 2, function(){
		evalTest(function f(_){
			return delay(_, 5);
		}, 5);
	})
	
	asyncTest("eval if true", 2, function(){
		evalTest(function f(_){
			if (true) 
				return delay(_, 3);
			return 4;
		}, 3);
	})
	
	asyncTest("eval if false", 2, function(){
		evalTest(function f(_){
			if (false) 
				return delay(_, 3);
			return 4;
		}, 4);
	})
	
	asyncTest("eval while", 2, function(){
		evalTest(function f(_){
			var i = 1, result = 1;
			while (i < 5) {
				result = delay(_, i * result);
				i++;
			}
			return result;
		}, 24);
	})
	
	asyncTest("eval for", 2, function(){
		evalTest(function f(_){
			var result = 1;
			for (var i = 1; i < 5; i++) {
				result = delay(_, i) * delay(_, result);
			}
			return result;
		}, 24);
	})
	
	asyncTest("eval for in", 2, function(){
		evalTest(function f(_){
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
	
	asyncTest("fully async for in", 2, function(){
		evalTest(function f(_){
			var result = 1;
			for (var i = delay(_, 2); i < delay(_, 5); i = delay(_, i) + 1) {
				result = delay(_, result) * delay(_, i)
			}
			return result;
		}, 24);
	})
	
	asyncTest("break in loop", 2, function(){
		evalTest(function f(_){
			var result = 1;
			for (var i = 1; i < 10; i++) {
				if (i == 5) 
					break;
				result = delay(_, result) * delay(_, i)
			}
			return result;
		}, 24);
	})
	
	asyncTest("continue", 2, function(){
		evalTest(function f(_){
			var result = 1;
			for (var i = 1; i < 10; i++) {
				if (i >= 5) 
					continue;
				result = delay(_, result) * delay(_, i)
			}
			return result;
		}, 24);
	})
	
	asyncTest("break in while", 2, function(){
		evalTest(function f(_){
			var i = 1, result = 1;
			while (i < 10) {
				if (i == 5) 
					break;
				result = delay(_, result) * delay(_, i);
				i++;
			}
			return result;
		}, 24);
	})
	
	asyncTest("continue in while", 2, function(){
		evalTest(function f(_){
			var i = 1, result = 1;
			while (i < 10) {
				i++;
				if (i >= 5) 
					continue;
				result = delay(_, result) * delay(_, i);
			}
			return result;
		}, 24);
	})
	
	asyncTest("eval lazy", 2, function(){
		evalTest(function f(_){
			var result = 1;
			return delay(_, delay(_, result + 8) < 5) && true ? 2 : 4
		}, 4);
	})
	
	asyncTest("try catch 1", 2, function(){
		evalTest(function f(_){
			try {
				return delay(_, "ok");
			} 
			catch (ex) {
				return delay(_, "err");
			}
		}, "ok");
	})
	
	asyncTest("try catch 2", 2, function(){
		evalTest(function f(_){
			try {
				throw delay(_, "thrown");
			} 
			catch (ex) {
				return delay(_, "caught ") + ex;
			}
		}, "caught thrown");
	})
	
	asyncTest("try catch 3", 2, function(){
		evalTest(function f(_){
			try {
				throw delay(_, "thrown");
			} 
			catch (ex) {
				return delay(_, "caught ") + ex;
			}
		}, "caught thrown");
	})
	
	asyncTest("try catch 5", 2, function(){
		evalTest(function f(_){
			try {
				delayFail(_, "delay fail");
			} 
			catch (ex) {
				return delay(_, "caught ") + ex;
			}
		}, "caught delay fail");
	})
	
	asyncTest("try catch 6", 2, function(){
		evalTest(function f(_){
			try {
				throwError("direct")
				return delay(_, "ok")
			} 
			catch (ex) {
				return delay(_, "caught ") + ex.message;
			}
		}, "caught direct");
	})
	
	asyncTest("try catch 7", 2, function(){
		evalTest(function f(_){
			try {
				var message = delay(_, "indirect");
				throwError(message)
				return delay(_, "ok")
			} 
			catch (ex) {
				return delay(_, "caught ") + ex.message;
			}
		}, "caught indirect");
	})
	
	asyncTest("try finally 1", 2, function(){
		evalTest(function f(_){
			var x = "";
			try {
				x += delay(_, "try")
			}
			finally {
				x += delay(_, " finally");
			}
			x += " end"
			return x;
		}, "try finally end");
	})
	
	asyncTest("try finally 2", 2, function(){
		evalTest(function f(_){
			var x = "";
			try {
				x += delay(_, "try")
				return x;
			}
			finally {
				x += delay(_, " finally");
			}
			x += " end"
			return x;
		}, "try");
	})
	
	asyncTest("try finally 3", 2, function(){
		evalTest(function f(_){
			var x = "";
			try {
				x += delay(_, "try")
				throw "bad try";
			}
			finally {
				x += delay(_, " finally");
			}
			x += " end"
			return x;
		}, "ERR: bad try");
	})
	
	asyncTest("try finally 4", 2, function(){
		evalTest(function f(_){
			var x = "";
			try {
				x += delay(_, "try")
				throwError("except");
			}
			finally {
				x += delay(_, " finally");
			}
			x += " end"
			return x;
		}, "ERR: Error: except");
	})
	
	asyncTest("try finally 5", 2, function(){
		evalTest(function f(_){
			var x = "";
			try {
				try {
					x += delay(_, "try")
					throwError("except");
					x += " unreached"
				}
				finally {
					x += delay(_, " finally");
				}
				x += " end"
				return x;
			} 
			catch (ex) {
				return x + "/" + ex.message;
			}
		}, "try finally/except");
	})
	
	asyncTest("try catch finally 1", 2, function(){
		evalTest(function f(_){
			var x = "";
			try {
				try {
					x += delay(_, "try")
					throw new Error("except");
					x += " unreached"
				}
				catch (ex) {
					x += delay(_, " catch " + ex.message);
					throw ex;
				}
				finally {
					x += delay(_, " finally");
				}
				x += " end"
				return x;
			} 
			catch (ex) {
				return x + "/" + ex.message;
			}
		}, "try catch except finally/except");
	})

	asyncTest("try catch finally 2", 2, function(){
		evalTest(function f(_){
			var x = "";
			try {
				try {
					x += delay(_, "try")
					throwError("except");
					x += " unreached"
				}
				catch (ex) {
					x += " catch " + ex.message;
					throw ex;
				}
				finally {
					x += " finally";
				}
				x += " end"
				return x;
			} 
			catch (ex) {
				return x + "/" + ex.message;
			}
		}, "try catch except finally/except");
	})

	asyncTest("nested try/catch 1", 2, function(){
		evalTest(function f(_){
			var x = "";
			try {
				try {
					x += delay(_, "try")
				}
				catch (ex) {
					x += delay(_, " inner catch " + ex.message);
				}
				throwError(" except");
			} 
			catch (ex) {
				return x + " outer catch" + ex.message;
			}
		}, "try outer catch except");
	})
	
	asyncTest("nested try/catch 2", 2, function(){
		evalTest(function f(_){
			var x = "";
			try {
				try {
					x += delay(_, "try")
				}
				catch (ex) {
					x += " inner catch " + ex.message;
				}
				throw new Error(" except");
			} 
			catch (ex) {
				return x + " outer catch" + ex.message;
			}
		}, "try outer catch except");
	})
	
	asyncTest("nested try/catch 3", 2, function(){
		evalTest(function f(_){
			var x = "";
			try {
				try {
					x += delay(_, "try")
				}
				catch (ex) {
					x += delay(_, " inner catch " + ex.message);
				}
				throw new Error(" except");
			} 
			catch (ex) {
				return x + " outer catch" + ex.message;
			}
		}, "try outer catch except");
	})
	
	asyncTest("nested try/finally 1", 2, function(){
		evalTest(function f(_){
			var x = "";
			try {
				try {
					x += delay(_, "try")
				}
				finally {
					x += delay(_, " inner finally");
				}
				throwError(" except");
			} 
			catch (ex) {
				return x + " outer catch" + ex.message;
			}
		}, "try inner finally outer catch except");
	})
	
	asyncTest("nested try/finally 2", 2, function(){
		evalTest(function f(_){
			var x = "";
			try {
				try {
					x += delay(_, "try")
				}
				finally {
					x += " inner finally";
				}
				throwError(" except");
			} 
			catch (ex) {
				return x + " outer catch" + ex.message;
			}
		}, "try inner finally outer catch except");
	})
	
	asyncTest("nested try/finally 3", 2, function(){
		evalTest(function f(_){
			var x = "";
			try {
				try {
					x += delay(_, "try")
				}
				finally {
					x += delay(_, " inner finally");
				}
				throw new Error(" except");
			} 
			catch (ex) {
				return x + " outer catch" + ex.message;
			}
		}, "try inner finally outer catch except");
	})
	
	asyncTest("and ok", 2, function(){
		evalTest(function f(_){
			var x = "<<";
			if (delay(_, true) && delay(_, true)) 
				x += "T1";
			else 
				x += "F1"
			if (delay(_, true) && delay(_, false)) 
				x += "T2";
			else 
				x += "F2"
			if (delay(_, false) && delay(_, true)) 
				x += "T3";
			else 
				x += "F3"
			if (delay(_, false) && delay(_, false)) 
				x += "T4";
			else 
				x += "F4"
			if (delay(_, false) && delayFail(_, "bad")) 
				x += "T5";
			else 
				x += "F5"
			x += ">>";
			return x;
		}, "<<T1F2F3F4F5>>");
	})
	
	asyncTest("or ok", 2, function(){
		evalTest(function f(_){
			var x = "<<";
			if (delay(_, true) || delay(_, true)) 
				x += "T1";
			else 
				x += "F1"
			if (delay(_, true) || delay(_, false)) 
				x += "T2";
			else 
				x += "F2"
			if (delay(_, false) || delay(_, true)) 
				x += "T3";
			else 
				x += "F3"
			if (delay(_, false) || delay(_, false)) 
				x += "T4";
			else 
				x += "F4"
			if (delay(_, true) || delayFail(_, "bad")) 
				x += "T5";
			else 
				x += "F5"
			x += ">>";
			return x;
		}, "<<T1T2T3F4T5>>");
	})
	
	asyncTest("switch with default", 2, function(){
		evalTest(function f(_){
			function g(_, i){
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
	
	asyncTest("switch without default", 2, function(){
		evalTest(function f(_){
			function g(_, i){
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
	
	asyncTest("this", 8, function(){
		evalTest(function f(_){
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
				}
				catch (ex) {
					ok(false);
				}
			}
			O.prototype.test3 = function(_) {
				var self = this;
				try {
					this.x = delay(_, this.x + 1);
					throwError("test3");
					ok(false);
				}
				catch (ex) {
					strictEqual(this, self);
					this.x = delay(_, this.x + 1);
				}
			}
			var o = new O(1);
			o.test1(_);
			o.test2(_);
			o.test3(_);
			return o.x;
		}, 5);
	})

	asyncTest("scoping", 2, function(){
		evalTest(function f(_){
			function test(_){
				var foo = "abc";
				function bar(){
					return foo;
				}
				delay(_);
				var foo = "xyz";
				return bar;
			}
			return test(_)();
		}, "xyz");
	})
	
})

