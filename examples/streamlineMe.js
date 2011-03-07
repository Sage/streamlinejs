var _samples = {
	introSample: "" +
	"// Demonstrates how 'streamline.js' transforms synchronous-looking code" +
	"\n// into asynchronous code with callbacks." +
	"\n// You can use this little tool to investigate the callback patterns" +
	"\n// that correspond to various Javascript constructs." +
	"\n//" +
	"\n// Try one of the samples above, or write your own code below." +
	"\n// Syntax is simple: just use '_' anywhere a callback is expected" +
	"\n//" +
	"\n// You can use the 'demo' function:" +
	"\n//" +
	"\n// demo(message, callback)" +
	"\n//  displays message with 1s timeout and" +
	"\n//  returns '[message]' through callback" +
	"\n//" +
	"\n// Look at the transformed code and run it with the 'execute' button." +
	"\n//" +
	"\n// The generated code uses two parameters/variables to control the flow:" +
	"\n//   _:  the callback. This is where execution will continue on a return or" +
	"\n//       throw statement." +
	"\n//   __: the 'next' flow. This is where execution will continue at the end of" +
	"\n//       the construct if it didn't encounter a return or throw." +
	"\n//" +
	"\n// The transformed code has been simplified a bit." +
	"\n// Select the 'show complete code' option to see the whole code." +
	"\n//" +
	"\n// The 'beautify' button can help you tidy your code." +
	"\n" +
	"\ndemo('Hello world!', _);",
	
	sequenceSample: "" +
	"// Simple sequence of asynchronous calls:" +
	"\n" +
	"\ndemo('hello', _);" +
	"\ndemo('world', _);" +
	"\ndemo('how\\'s life?', _);",
	
	expressionsSample: "" +
	"// Expression that combines asynchronous calls:" +
	"\n" +
	"\ndemo(demo('call 1', _) + " +
	"\n  demo('call 2', _) + " +
	"\n  demo('call 3', _) + " +
	"\n  demo('call 4', _), _);",
	
	functionsSample: "" +
	"// Asynchronous functions that call each other: " +
	"\n" +
	"\nfunction f(message, _) {" +
	"\n  return demo('f: ' + message, _);" +
	"\n}" +
	"\n" +
	"\nfunction g(message, _) {" +
	"\n  return f('g: ' + message, _);" +
	"\n}" +
	"\n" +
	"\ndemo(g('hello world', _), _);",
	
	ifElseSample: "" +
	"// if/else demo. Try toggling 'cond'." +
	"\n" +
	"\nvar cond = true;" +
	"\ndemo('before if', _);" +
	"\n" +
	"\nif (cond) { demo('true branch', _); }" +
	"\nelse { demo('false branch', _); }" +
	"\n" +
	"\ndemo('after branch', _);",
	
	whileSample: "" +
	"// Loop demo." +
	"\n// See what happens if you increase count and run another sample!" +
	"\n" +
	"\nvar count = 3;" +
	"\ndemo('before loop', _);" +
	"\n" +
	"\nwhile (count-- > 0) {" +
	"\n  demo('looping: count is ' + count, _);" +
	"\n}" +
	"\n" +
	"\ndemo('after loop', _);",
	
	tryCatchSample: "" +
	"// try/catch demo. Try toggling 'fail'." +
	"\n" +
	"\nvar fail = true;" +
	"\ndemo('before try', _);" +
	"\n" +
	"\ntry {" +
	"\n  demo('before fail test', _);" +
	"\n  if (fail) throw new Error('test exception');" +
	"\n  demo('did not fail', _);" +
	"\n}" +
	"\ncatch (ex) { demo('caught ' + ex.message, _); }" +
	"\nfinally { demo('inside finally', _); }" +
	"\n" +
	"\ndemo('after try catch', _);",
	
	lazySample: "" +
	"// Lazy operators demo." +
	"\n// Try increasing len and check that only " +
	"\n// relevant sub-expressions are evaluated." +
	"\n" +
	"\nvar len = 4;" +
	"\nvar result = len >= demo('--5', _).length " +
	"\n  && len <= demo('----7', _).length" +
	"\n  ? demo('inside', _)" +
	"\n  : demo('outside', _);" +
	"\n" +
	"\ndemo(len + ' is ' + result, _);"
}

var _complete = false;

function demo(message, callback){
	if (typeof callback !== "function") 
		throw new Error("demo callback is not a function");
	$('#result').text(message + " (waiting 1s ...)");
	setTimeout(function(){
		$('#result').text(message + " (done!)");
		try {
			callback(null, "[" + message + "]");
		} 
		catch (ex) {
			try {
				callback(ex);
			} 
			catch (ex) {
				_error("fatal error: " + ex.message);
			}
		}
	}, 1000)
}

function _error(message){
	$('#result').removeClass('success').addClass('error').text(message);
}

function _success(message){
	$('#result').removeClass('error').addClass('success').text(message);
}

function _transform(){
	var codeIn = $('#codeIn').val();
	try {
		var codeOut = Streamline.transform(codeIn, _complete ? {
			lines: "mark"
		} : {
			noHelpers: true,
			lines: "ignore",
			demo: true
		});
		console.log(codeOut);
		$('#codeOut').val(codeOut);
		_success("ready")
	} 
	catch (ex) {
		console.error(ex);
		_error(ex.message)
	}
}

function _execute(){
	var codeIn = $('#codeIn').val();
	try {
		var codeOut = Streamline.transform(codeIn, {
			lines: "preserve"
		});
		eval(codeOut);
	} 
	catch (ex) {
		_error(ex.message);
	}
}

function _beautify(str){
	try {
		var str = Narcissus.decompiler.pp(Narcissus.parser.parse(str));
		str = str.replace(/}\s*;/g, "}")
		$('#codeIn').val(str);
		return true;
	} 
	catch (ex) {
		_error(ex.message);
		return false;
	}
}

$(function(){
	$('#codeIn').keyup(_transform);
	$('.sample').click(function(){
		$('#codeIn').val(_samples[this.id]);
		_transform();
	});
	$('#beautify').click(function(){
		_beautify($('#codeIn').val());
	})
	$('#complete').change(function(){
		_complete = !_complete;
		_transform();
	})
	$('#execute').click(function(){
		_execute();
	})
	$('#codeIn').val(_samples["introSample"]);
	_transform();
})
