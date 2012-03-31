"use strict";

var mode = typeof fstreamline__ !== 'undefined' ? "fibers" : "callback";

function bench(_, name, fn, native) {
  function tryNative(cb, count) {
    var t0 = Date.now();
    var depth = 0;

    function loop(i) {
      if (++depth > 10) {
        console.log(mode + " native\t\t" + name + "\tSKIPPED (risk of stack overflow)");
        return cb(null, true);
      }
      if (i < count) {
        fn(function(err) {
          if (err) return cb(err);
          loop(i + 1);
        });
      } else {
        var dt = (Date.now() - t0);
        if (dt < 100) return cb(null, false);
        dt = Math.round(dt * 100 * 1000 / count) / 100;
        console.log(mode + " native\t\t" + name + "\t" + dt + "ns");
        return cb(null, true);
      }
      depth--;
    }
    loop(0);
  }

  function tryStreamline(_, count) {
    var t0 = Date.now();
    for (var i = 0; i < count; i++) fn(_);
    var dt = (Date.now() - t0);
    if (dt < 100) return false;
    dt = Math.round(dt * 100 * 1000 / count) / 100;
    console.log(mode + " streamline\t" + name + "\t" + dt + "ns");
    return true;

  }

  function run(_, tryIt) {
    var count = 1;
    while (!tryIt(_, count)) count *= 2;
  }
  run(_, native ? tryNative : tryStreamline);
}

function delay(_, val) {
  process.nextTick(_);
  return val;
}

function recurse(_, depth) {
  if (depth > 0) recurse(_, depth - 1);
  else process.nextTick(_)
}

var benches = {
  "nop\t": function(_) {},
  "nextTick": function(_) {
    process.nextTick(_);
  },
  "delay\t": function(_) {
    delay(_);
  },
  "try/catch": function(_) {
    try {
      process.nextTick(_);
    } catch (ex) {}
  },
  "try/catch/throw": function(_) {
    try {
      process.nextTick(_);
      throw new Error("");
    } catch (ex) {}
  },
  "try/finally": function(_) {
    try {
      process.nextTick(_);
    } finally {}
  },
  "if\t": function(_) {
    if (true) process.nextTick(_);
  },
  "recurse 2": function(_) {
    recurse(_, 2);
  },
  "recurse 10": function(_) {
    recurse(_, 10);
  },
  "recurse 100": function(_) {
    recurse(_, 100);
  },
  "fact 10\t": function(_) {
    function fact(_, n) {
      return n <= 1 ? delay(_, 1) : n * fact(_, n - 1);
    }
    fact(_, 10);
  },
  "fibo\t": function(_) {
    function fibo(_, n) {
      return n <= 1 ? delay(_, 1) : fibo(_, n - 1) + fibo(_, n - 2);
    }
    fibo(_, 6);
  },
  "mixed\t": function(_) {
    for (var i = 0; delay(_, i) < 10; i++) {
      try {
        if (delay(_, i) % 2) {
          process.nextTick(_);
        }
      } catch (ex) {}
    }
  }
}

function runAll(_, native) {
  for (var k in benches) {
    bench(_, k, benches[k], native)
  }
}

runAll(_, false);
runAll(_, true);