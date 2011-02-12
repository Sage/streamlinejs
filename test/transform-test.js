$(document).ready(function(){
	var module = QUnit.module;
	var transform = Streamline.transform;
	
	module("generation");
	
	function clean(s){
		if (jQuery.browser.mozilla) 
			return new Function(s).toString();
		else 
			return s.replace(/[\n\t ]/g, '').replace(/};/g, '}').replace(/\(_\|\|__throw\)/g, '_||__throw');
	}
	
	function genTest(f1, f2, withTryCatch){
		var s1 = clean(transform(f1.toString(), {
			noHelpers: true,
			noTryCatch: !withTryCatch
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
			return f1(__cb(_, function(){
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
			var __ = (_ = _ || __throw);
			try {
				return f1(__cb(_, function(){
					f2();
					return __();
				}));
			} 
			catch (__err) {
				return _(__err);
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
			return f1(__cb(_, function(__0, __1){
				var x = __1;
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
			return f2(__cb(_, function(__0, __1){
				return _(null, __1);
			}));
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
					return f3(__cb(_, function(){
						f4();
						return __();
					}));
				};
				return __();
			})(function(){
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
				return f3(__cb(_, function(){
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
					return f3(__cb(_, function(){
						f4();
						return __();
					}));
				}
				else {
					f5();
					return f6(__cb(_, function(){
						f7();
						return __();
					}));
				}
			})(function(){
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
					return f3(__cb(_, function(){
						f4();
						return _(null, 1);
					}));
				}
				else {
					f5();
				}
				return __();
			})(function(){
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
			return each(__cb(_, function(){
				f4();
				return __();
			}), arr, function(_, elt){
				var __ = (_ = _ || __throw);
				return f2(__cb(_, function(){
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
				var __loop = __nt(_, function(){
					var __ = __loop;
					if (cond) {
						return f2(__cb(_, function(){
							f3();
							return __();
						}));
					}
					else {
						return __break();
					}
				});
				return __loop();
			})(function(){
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
				var __loop = __nt(_, function(){
					var __ = __loop;
					if ((__1 || cond)) {
						__1 = false;
						return f2(__cb(_, function(){
							f3();
							return __();
						}));
					}
					else {
						return __break();
					}
				});
				return __loop();
			})(function(){
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
				var __loop = __nt(_, function(){
					var __ = __loop;
					if (__2) {
						i++;
					}
					else {
						__2 = true;
					}
					if ((i < arr.length)) {
						return f2(__cb(_, function(){
							f3();
							return __();
						}));
					}
					else {
						return __break();
					}
				});
				return __loop();
			})(function(){
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
			var __1 = [];
			for (var __2 in obj) {
				__1.push(__2);
			}
			var __3 = 0;
			return (function(__break){
				var __loop = __nt(_, function(){
					var __ = __loop;
					if ((__3 < __1.length)) {
						var k = __1[__3++];
						return f2(__cb(_, function(){
							f3(k);
							return __();
						}), k);
					}
					else {
						return __break();
					}
				});
				return __loop();
			})(function(){
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
						return f2(__cb(_, function(){
							f3();
							return __break();
						}));
					case "b":
						
					case "c":
						f4();
						return f5(__cb(_, function(){
							return __break();
						}));
					default:
						f6();
						return __break();
				}
				return __();
			})(function(){
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
					return f2(__cb(_, function(){
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
			return f4(__cb(_, function(__0, __3){
				return f3(__cb(_, function(__0, __2){
					return f5(__cb(_, function(__0, __4){
						return f2(__cb(_, function(){
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
				var __loop = __nt(_, function(){
					var __ = __loop;
					return f2(__cb(_, function(__0, __1){
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
			})(function(){
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
						return f3(__cb(_, function(){
							f4();
							return __();
						}));
					} 
					catch (__err) {
						return _(__err);
					}
					
				})(function(ex, __result){
					if (ex) {
						f5();
						return f6(__cb(_, function(){
							f7();
							return __();
						}));
					}
					else 
						return _(null, __result);
				});
			})(function(){
				f8();
				return __();
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
						return f3(__cb(_, function(){
							f4();
							return __();
						}));
					} 
					catch (__err) {
						return _(__err);
					}
				})(function(__err, __result, __cont){
					return (function(__){
						f5();
						return f6(__cb(_, function(){
							f7();
							return __();
						}));
					})(function(){
						if (__cont) {
							return __()
						}
						else {
							return _(__err, __result)
						}
					});
				});
			})(function(){
				f8();
				return __();
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
					return f2(__cb(_, function(__0, __1){
						var __val = __1;
						if ((!__val == true)) {
							return _(null, __val);
						}
						return f3(__cb(_, function(__0, __2){
							return _(null, __2);
							
						}));
					}));
				})(__cb(_, function(__0, __1){
					if (__1) {
						f4();
						return f5(__cb(_, function(){
							f6();
							return __();
						}));
					}
					return __();
				}));
			})(function(){
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
	
	
	module("evaluation");
	function evalTest(f, val){
		var str = transform(f.toString());
		(function(){
			eval(str);
			f(function(err, result){
				var str = err ? "ERR: " + err : result;
				strictEqual(str, val);
				start();
			})
		})();
	}
	
	function delay(_, val){
		setTimeout(function(){
			_(null, val);
		}, 0);
	}
	
	function delayFail(_, err){
		setTimeout(function(){
			_(err);
		}, 0);
	}
	
	function throwError(message) {
		throw new Error(message);
	}
	
	asyncTest("eval return", 1, function(){
		evalTest(function f(_){
			return delay(_, 5);
		}, 5);
	})
	
	asyncTest("eval if true", 1, function(){
		evalTest(function f(_){
			if (true) 
				return delay(_, 3);
			return 4;
		}, 3);
	})
	
	asyncTest("eval if false", 1, function(){
		evalTest(function f(_){
			if (false) 
				return delay(_, 3);
			return 4;
		}, 4);
	})
	
	asyncTest("eval while", 1, function(){
		evalTest(function f(_){
			var i = 1, result = 1;
			while (i < 5) {
				result = delay(_, i * result);
				i++;
			}
			return result;
		}, 24);
	})
	
	asyncTest("eval for", 1, function(){
		evalTest(function f(_){
			var result = 1;
			for (var i = 1; i < 5; i++) {
				result = delay(_, i) * delay(_, result);
			}
			return result;
		}, 24);
	})
	
	asyncTest("eval for in", 1, function(){
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
	
	asyncTest("fully async for in", 1, function(){
		evalTest(function f(_){
			var result = 1;
			for (var i = delay(_, 1); i < delay(_, 5); i = delay(_, i) + 1) {
				result = delay(_, result) * delay(_, i)
			}
			return result;
		}, 24);
	})
	
	asyncTest("break in loop", 1, function(){
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
	
	asyncTest("continue", 1, function(){
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
	
	asyncTest("break in while", 1, function(){
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
	
	asyncTest("continue in while", 1, function(){
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
	
	asyncTest("eval lazy", 1, function(){
		evalTest(function f(_){
			var result = 1;
			return delay(_, delay(_, result + 8) < 5) && true ? 2 : 4
		}, 4);
	})
	
	asyncTest("try catch 1", 1, function(){
		evalTest(function f(_){
			try {
				return delay(_, "ok");
			} 
			catch (ex) {
				return delay(_, "err");
			}
		}, "ok");
	})
	
	asyncTest("try catch 2", 1, function(){
		evalTest(function f(_){
			try {
				throw delay(_, "thrown");
			} 
			catch (ex) {
				return delay(_, "caught ") + ex;
			}
		}, "caught thrown");
	})
	
	asyncTest("try catch 3", 1, function(){
		evalTest(function f(_){
			try {
				throw delay(_, "thrown");
			} 
			catch (ex) {
				return delay(_, "caught ") + ex;
			}
		}, "caught thrown");
	})
	
	asyncTest("try catch 5", 1, function(){
		evalTest(function f(_){
			try {
				delayFail(_, "delay fail");
			} 
			catch (ex) {
				return delay(_, "caught ") + ex;
			}
		}, "caught delay fail");
	})
	
	asyncTest("try catch 6", 1, function(){
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
	
	asyncTest("try catch 7", 1, function(){
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
	
	asyncTest("try finally 1", 1, function(){
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
	
	asyncTest("try finally 2", 1, function(){
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
	
	asyncTest("try finally 3", 1, function(){
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
	
	asyncTest("try finally 4", 1, function(){
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
	
	asyncTest("try finally 5", 1, function(){
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
	
	asyncTest("and ok", 1, function(){
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
	
	asyncTest("or ok", 1, function(){
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
	
	asyncTest("switch with default", 1, function(){
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
	
	asyncTest("switch without default", 1, function(){
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
	
})

