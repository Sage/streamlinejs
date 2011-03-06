var _samples = {
	sequenceSample: "demo('call 1', _); demo('call 2', _); demo('call 3', _);",
	compositionSample: "demo(demo('call 1', _) + demo('call 2' + demo('call 2.1', _), _) + demo('call 3', _), _);",
	functionsSample: "function f(message, _) { return demo('f: ' + message, _); }" +
	 "function g(message, _) { return f('g: ' + message, _); }" +
	 "demo(g('hello world', _), _)",
	ifElseSample: "var cond = true; demo('before if', _);" +
	"if (cond) { demo('true branch', _); }" +
	"else { demo('false branch', _); }" +
	"demo('after branch', _)",
	whileSample: "var count = 3; demo('before loop', _);" +
	"while (count-- > 0)" +
	" { demo('looping: count is ' + count, _); }" +
	"demo('after loop', _)",
	tryCatchSample: "var fail = true; demo('before try', _);" +
	"try { demo('before fail test', _);" +
	" if (fail) throw new Error('test exception');" +
	" demo('did not fail', _); }" +
	"catch (ex) { demo('caught ' + ex.message, _); }" +
	"finally { demo('inside finally', _); }" +
	"demo('after try catch', _);",
	lazySample: "var len = 4;" +
	"var result = len >= demo('--5', _).length && len <= demo('----7', _).length ? 'inside' : 'outside';" +
	"demo('val is ' + result, _);"
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
		if (_beautify(_samples[this.id])) 
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
	_transform();
})
