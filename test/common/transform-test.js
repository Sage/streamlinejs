var module = QUnit.module;
var transform = require('streamline/lib/callbacks/transform').transform;

module("streamline generation");

function clean(s) {
	if (typeof jQuery === "function" && jQuery.browser.mozilla) return new Function(s).toString();
	else return s.replace(/[\n\t ]/g, '').replace(/};/g, '}').replace(/=\(_\|\|__trap\)/g, '=_||__trap').replace(/__frame,-?\d+,-?\d+,/g, '__frame,?,?,');
}

function genTest(f1, f2) {
	var s1 = clean(transform(f1.toString(), {
		noHelpers: true,
		lines: "ignore",
		optimize: true,
	}));
	var s2 = clean(f2.toString());
	if (s1 !== s2) {
		console.log("transformed=" + s1);
		console.log("expected   =" + s2);
	}
	strictEqual(s1, s2);
}

test("basic", 1, function() {
	genTest(function f(_) {
		f1(_);
		f2();
	}, function f(_) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			return f1(__cb(_, __frame, 1, 4, function __$f() {
				f2();
				_();
			}, true));
		});
	});
});
test("var return", 1, function() {
	genTest(function f(_) {
		var x = f1(_);
		f2();
		return x;
	}, function f(_) {
		var x;
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			return f1(__cb(_, __frame, 1, 12, function ___(__0, __1) {
				x = __1;
				f2();
				return _(null, x);
			}, true));
		});
	});
});
test("return", 1, function() {
	genTest(function f(_) {
		f1();
		return f2(_);
	}, function f(_) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			f1();
			return f2(_);
		});
	});
});
test("if", 1, function() {
	genTest(function f(_, b) {
		f1();
		if (b) {
			f2();
			f3(_);
			f4();
		}
		f5();
	}, function f(_, b) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			f1();
			return (function __$f(__then) {
				if (b) {
					f2();
					return f3(__cb(_, __frame, 4, 8, function __$f() {
						f4();
						__then();
					}, true));
				} else {
					__then();
				}
			})(function __$f() {
				f5();
				_();
			});
		});
	});
});
test("simplified if", 1, function() {
	genTest(function f(_, b) {
		f1();
		if (b) {
			f2();
			f3(_);
			f4();
		}
	}, function f(_, b) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			f1();
			return (function __$f(__then) {
				if (b) {
					f2();
					return f3(__cb(_, __frame, 4, 8, function __$f() {
						f4();
						__then();
					}, true));
				} else {
					__then();
				}
			})(_);
		});
	});
});
test("if else", 1, function() {
	genTest(function f(_, b) {
		f1();
		if (b) {
			f2();
			f3(_);
			f4();
		} else {
			f5();
			f6(_);
			f7();
		}
		f8();
	}, function f(_, b) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			f1();
			return (function __$f(__then) {
				if (b) {
					f2();
					return f3(__cb(_, __frame, 4, 8, function __$f() {
						f4();
						__then();
					}, true));
				} else {
					f5();
					return f6(__cb(_, __frame, 8, 8, function __$f() {
						f7();
						__then();
					}, true));
				}
			})(function __$f() {
				f8();
				_();
			});
		});
	});
});
test("if else 2", 1, function() {
	genTest(function f(_, b) {
		f1();
		if (b) {
			f2();
			f3(_);
			f4();
			return 1;
		} else {
			f5();
		}
		f6();
		return 2;
	}, function f(_, b) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			f1();
			return (function __$f(__then) {
				if (b) {
					f2();
					return f3(__cb(_, __frame, 4, 8, function __$f() {
						f4();
						return _(null, 1);
					}, true));
				} else {
					f5();
					__then();
				}
			})(function __$f() {
				f6();
				return _(null, 2);
			});
		});
	});
});
test("each", 1, function() {
	genTest(function f(_, arr) {
		f1();
		each(_, arr, function(_, elt) {
			f2(_, elt);
			f3();
		})
		f4();
	}, function f(_, arr) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			f1();
			return each(__cb(_, __frame, 2, 4, function __$f() {
				f4();
				_();
			}, true), arr, function __1(_, elt) {
				var __frame = {
					name: "__1",
					line: 3
				};
				return __func(_, this, arguments, __1, 0, __frame, function __$__1() {
					return f2(__cb(_, __frame, 0, 36, function __$__1() {
						f3();
						_();
					}, true), elt);
				});
			});
		});
	});
});
test("while", 1, function() {
	genTest(function f(_) {
		f1();
		while (cond) {
			f2(_);
			f3();
		}
		f4();
	}, function f(_) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			f1();
			return (function ___(__break) {
				var __more;
				var __loop = __cb(_, __frame, 0, 0, function __$f() {
					__more = false;
					var __1 = cond;
					if (__1) {
						return f2(__cb(_, __frame, 3, 8, function __$f() {
							f3();
							while (__more) {
								__loop();
							}
							__more = true;
						}, true));
					} else {
						__break();
					}
				});
				do {
					__loop();
				}
				while (__more);
				__more = true;
			})(function __$f() {
				f4();
				_();
			});
		});
	});
});
test("do while", 1, function() {
	genTest(function f(_) {
		f1();
		do {
			f2(_);
			f3();
		}
		while (cond);
		f4();
	}, function f(_) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			f1();
			var __1 = true;
			return (function ___(__break) {
				var __more;
				var __loop = __cb(_, __frame, 0, 0, function __$f() {
					__more = false;
					var __2 = (__1 || cond);
					if (__2) {
						__1 = false;
						return f2(__cb(_, __frame, 3, 8, function __$f() {
							f3();
							while (__more) {
								__loop();
							}
							__more = true;
						}, true));
					} else {
						__break();
					}
				});
				do {
					__loop();
				}
				while (__more);
				__more = true;
			})(function __$f() {
				f4();
				_();
			});
		});
	});
});
test("for", 1, function() {
	genTest(function f(_, arr) {
		f1();
		for (var i = 0; i < arr.length; i++) {
			f2(_);
			f3();
		}
		f4();
	}, function f(_, arr) {
		var i;
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			f1();
			i = 0;
			var __2 = false;
			return (function ___(__break) {
				var __more;
				var __loop = __cb(_, __frame, 0, 0, function __$f() {
					__more = false;
					if (__2) {
						i++;
					} else {
						__2 = true;
					}
					var __1 = (i < arr.length);
					if (__1) {
						return f2(__cb(_, __frame, 3, 8, function __$f() {
							f3();
							while (__more) {
								__loop();
							}
							__more = true;
						}, true));
					} else {
						__break();
					}
				});
				do {
					__loop();
				}
				while (__more);
				__more = true;
			})(function __$f() {
				f4();
				_();
			});
		});
	})
})
test("for in", 1, function() {
	genTest(function f(_) {
		f1();
		for (var k in obj) {
			f2(_, k);
			f3(k);
		}
		f4();
	}, function f(_) {
		var k;
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			f1();
			var __1 = __forIn(obj);
			var __2 = 0;
			return (function ___(__break) {
				var __more;
				var __loop = __cb(_, __frame, 0, 0, function __$f() {
					__more = false;
					var __3 = (__2 < __1.length);
					if (__3) {
						k = __1[__2++];
						return f2(__cb(_, __frame, 3, 8, function __$f() {
							f3(k);
							while (__more) {
								__loop();
							}
							__more = true;
						}, true), k);
					} else {
						__break();
					}
				});
				do {
					__loop();
				}
				while (__more);
				__more = true;
			})(function __$f() {
				f4();
				_();
			});
		});
	});
})
test("for in (without var)", 1, function() {
	genTest(function f(_) {
		var k;
		f1();
		for (k in obj) {
			f2(_, k);
			f3(k);
		}
		f4();
	}, function f(_) {
		var k;
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			f1();
			var __1 = __forIn(obj);
			var __2 = 0;
			return (function ___(__break) {
				var __more;
				var __loop = __cb(_, __frame, 0, 0, function __$f() {
					__more = false;
					var __3 = (__2 < __1.length);
					if (__3) {
						k = __1[__2++];
						return f2(__cb(_, __frame, 4, 8, function __$f() {
							f3(k);
							while (__more) {
								__loop();
							}
							__more = true;
						}, true), k);
					} else {
						__break();
					}
				});
				do {
					__loop();
				}
				while (__more);
				__more = true;
			})(function __$f() {
				f4();
				_();
			});
		});
	});
})
test("switch", 1, function() {
	genTest(function f(_) {
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
	}, function f(_) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			f1();
			return (function __$f(__break) {
				switch (exp) {
				case "a":
					return f2(__cb(_, __frame, 4, 8, function __$f() {
						f3();
						return __break();
					}, true));
				case "b":
				case "c":
					f4();
					return f5(__cb(_, __frame, 10, 8, __break, true));
				default:
					f6();
					return __break();
				}
			})(function __$f() {
				f7();
				_();
			});
		});
	});
})
test("nested switch", 1, function() {
	genTest(function f(_) {
		switch (exp) {
		case 'a':
			f2(_);
			switch (exp2) {
			case "b":
				break;
			}
			break;
		}
	}, function f(_) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			return (function __$f(__break) {
				switch (exp) {
				case "a":
					return f2(__cb(_, __frame, 3, 8, function __$f() {
						switch (exp2) {
						case "b":
							break;
						}
						return __break();
					}, true));
				default:
					return __break();
				}
			})(_);
		});
	});
})
test("nested calls", 1, function() {
	genTest(function f(_) {
		f1();
		f2(_, f3(_, f4(_)), f5(_, f6()));
		f7();
	}, function f(_) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			f1();
			return f4(__cb(_, __frame, 2, 16, function ___(__0, __1) {
				return f3(__cb(_, __frame, 2, 10, function ___(__0, __2) {
					return f5(__cb(_, __frame, 2, 24, function ___(__0, __3) {
						return f2(__cb(_, __frame, 2, 4, function __$f() {
							f7();
							_();
						}, true), __2, __3);
					}, true), f6());
				}, true), __1);
			}, true));
		});
	});
})
test("async while condition", 1, function() {
	genTest(function f(_) {
		f1();
		while (f2(_))
		f3();
		f4();
	}, function f(_) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			f1();
			return (function ___(__break) {
				var __more;
				var __loop = __cb(_, __frame, 0, 0, function __$f() {
					__more = false;
					return f2(__cb(_, __frame, 2, 11, function ___(__0, __1) {
						if (__1) {
							f3();
							while (__more) {
								__loop();
							}
							__more = true;
						} else {
							__break();
						}
					}, true));
				});
				do {
					__loop();
				}
				while (__more);
				__more = true;
			})(function __$f() {
				f4();
				_();
			});
		});
	})
})
test("try catch", 1, function() {
	genTest(function f(_) {
		f1();
		try {
			f2();
			f3(_);
			f4();
		} catch (ex) {
			f5();
			f6(_);
			f7();
		}
		f8();
	}, function f(_) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			f1();
			return (function ___(__then) {
				(function ___(_) {
					__tryCatch(_, function __$f() {
						f2();
						return f3(__cb(_, __frame, 4, 8, function __$f() {
							f4();
							__then();
						}, true));
					});

				})(function ___(ex, __result) {
					__tryCatch(_, function __$f() {
						if (ex) {
							f5();
							return f6(__cb(_, __frame, 8, 8, function __$f() {
								f7();
								__then();
							}, true));
						} else {
							_(null, __result);
						}
					});
				});
			})(function ___() {
				__tryCatch(_, function __$f() {
					f8();
					_();
				});
			});
		});
	});
})
test("try finally", 1, function() {
	genTest(function f(_) {
		f1();
		try {
			f2();
			f3(_);
			f4();
		} finally {
			f5();
			f6(_);
			f7();
		}
		f8();
	}, function f(_) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			f1();
			return (function ___(__then) {
				(function ___(_) {
					__tryCatch(_, function __$f() {
						f2();
						return f3(__cb(_, __frame, 4, 8, function __$f() {
							f4();
							_(null, null, true);
						}, true));
					});
				})(function ___(__e, __r, __cont) {
					(function ___(__then) {
						__tryCatch(_, function __$f() {
							f5();
							return f6(__cb(_, __frame, 8, 8, function __$f() {
								f7();
								__then();
							}, true));
						});
					})(function ___() {
						__tryCatch(_, function ___() {
							if (__cont) {
								__then();
							} else {
								_(__e, __r);
							}
						});
					});
				});
			})(function ___() {
				__tryCatch(_, function __$f() {
					f8();
					_();
				});
			});
		});
	})
})
test("lazy and", 1, function() {
	// Note: __future is overkill in inner as _ cannot be null - fix later
	genTest(function f(_) {
		f1();
		if (f2(_) && f3(_)) {
			f4();
			f5(_);
			f6()
		}
		f7();
	}, function f(_) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			f1();
			return (function __$f(_) {
				return f2(__cb(_, __frame, 2, 8, function ___(__0, __1) {
					var __2 = !__1;
					return (function __$f(__then) {
						if (__2) {
							var __3 = __1;
							return _(null, __3);
						} else {
							__then();
						}
					})(function __$f() {
						return f3(_);
					});
				}, true));
			})(__cb(_, __frame, 0, 5, function ___(__0, __2) {
				return (function __$f(__then) {
					if (__2) {
						f4();
						return f5(__cb(_, __frame, 4, 8, function __$f() {
							f6();
							__then();
						}, true));
					} else {
						__then();
					}
				})(function __$f() {
					f7();
					_();
				});
			}, true));
		});
	})
})
test("empty body", 1, function() {
	genTest(function f(_) {}, function f(_) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, _);
	});
})
test("only return in body", 1, function() {
	genTest(function f(_) {
		return 4;
	}, function f(_) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			return _(null, 4);
		});
	});
})
test("optim pass _", 1, function() {
	genTest(function f(_, arg1) {
		return g(_, arg2);
	}, function f(_, arg1) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			return g(_, arg2);
		});
	});
})
test("wrappers", 1, function() {
	genTest(function f(_, arg1) {
		return g(__wrap1(_), arg2) + 5;
	}, function f(_, arg1) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			return g(__wrap1(__cb(_, __frame, 1, 11, function ___(__0, __2) {
				var __1 = (__2 + 5);
				return _(null, __1);
			}, true)), arg2);
		});
	});
})
test("scoping", 1, function() {
	genTest(function f(_) {
		g(_);
		if (x) {
			var a1, a2, a3, b1 = 1,
				b2 = 2,
				b3 = 3;
			var c1, c2;
			a1 = 1;
			a2 = 2;
		} else {
			var a2 = 2;
			b2++;
			c1 = 1;
		}
		a3++;
		b3++;
		c2 = 2;
	}, function f(_) {
		var a1, a2, a3, b1, b2, b3, c1, c2;
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			return g(__cb(_, __frame, 1, 4, function __$f() {
				if (x) {
					b1 = 1;
					b2 = 2;
					b3 = 3;
					a1 = 1;
					a2 = 2;
				} else {
					a2 = 2;
					b2++;
					c1 = 1;
				}
				a3++;
				b3++;
				c2 = 2;
				_();
			}, true));
		});
	});
})
test("sync code not modified", 1, function() {
	genTest(function f() {
		g();
		if (x) {
			var a1, a2, a3, b1 = 1,
				b2 = 2,
				b3 = 3;
			var c1, c2;
			a1 = 1;
			a2 = 2;
		} else {
			var a2 = 2;
			b2++;
			c1 = 1;
		}
		a3++;
		b3++;
		c2 = 2;
	}, function f() {
		g();
		if (x) {
			var a1, a2, a3, b1 = 1,
				b2 = 2,
				b3 = 3;
			var c1, c2;
			a1 = 1;
			a2 = 2;
		} else {
			var a2 = 2;
			b2++;
			c1 = 1;
		}
		a3++;
		b3++;
		c2 = 2;
	})
})
test("function forward reference", 1, function() {
	genTest(function f(_) {
		foo();
		g(_);

		function foo() {}
	}, function f(_) {
		function foo() {}
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			foo();
			return g(_);
		});
	});
})
test("CoffeeScript closure ()", 1, function() {
	genTest(function f(_) {
		(function() {
			return g(_);
		})();
	}, function f(_) {
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			return (function __1(_) {
				return g(_);
			})(_);
		});
	});
})
test("CoffeeScript closure (this)", 1, function() {
	genTest(function f(_) {
		(function() {
			return g(_, this);
		}).call(this);
	}, function f(_) {
		var __this = this;
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			return (function __1(_) {
				return g(_, __this);
			})(_);
		});
	});
})
test("CoffeeScript closure (this, arguments)", 1, function() {
	genTest(function f(_) {
		(function() {
			return g(_, this, arguments);
		}).apply(this, arguments);
	}, function f(_) {
		var __this = this,
			__arguments = arguments;
		var __frame = {
			name: "f",
			line: 1
		};
		return __func(_, this, arguments, f, 0, __frame, function __$f() {
			return (function __1(_) {
				return g(_, __this, __arguments);
			})(_);
		});
	});
})
test("CoffeeScript fat arrow", 1, function() {
	genTest(function f() {
		this.method = function(_) {
        	return Test.prototype.method.apply(_this, arguments);
      	};
	}, function f() {
		this.method = function() {
        	return Test.prototype.method.apply(_this, arguments);
      	};
	});
})

