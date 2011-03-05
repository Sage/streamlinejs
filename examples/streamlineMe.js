var _samples = {
	"ifElseSample": "var cond = true; demo('before if', _);" +
		"if (cond) { demo('true branch', _); }" +
		"else { demo('false branch', _); }" +
		"demo('after branch', _)",
	"whileSample": "var count = 3; demo('before loop', _);" + 
		"while (count-- > 0)" + 
		" { demo('looping: count is ' + count, _); }" +
		"demo('after loop', _)",
	"tryCatchSample": "var fail = true; demo('before try', _);" + 
		"try { demo('before fail test', _);" + 
		" if (fail) throw new Error('test exception');" + 
		" demo('did not fail', _); }" + 
		"catch (ex) { demo('caught ' + ex.message, _); }" + 
		"finally { demo('inside finally', _); }" + 
		"demo('after try catch', _);",
}

var _complete = false;

function demo(message, callback){
	if (typeof callback !== "function")
		throw new Error("demo callback is not a function");
	$('#result').text(message + " (waiting 1s ...)");
	setTimeout(function(){
		$('#result').text(message + " (done!)");
		try {
			callback(null);
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

function _error(message) {
	$('#result').removeClass('success').addClass('error').text(message);
}

function _success(message) {
	$('#result').removeClass('error').addClass('success').text(message);
}

function _transform(){
	var codeIn = $('#codeIn').val();
	try {
		var codeOut = Streamline.transform(codeIn, _complete ? {
			lines: "ignore"
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
	} 
	catch (ex) {
		_error(ex.message);
	}
}

$(function(){
	$('#codeIn').keyup(_transform);
	$('.sample').click(function(){
		_beautify(_samples[this.id]);
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
