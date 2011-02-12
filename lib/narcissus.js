var fs = require('fs');
var path = require('path');

function read(basename) {
    var filename = path.join(__dirname, '../../narcissus/lib', basename + '.js');
    return fs.readFileSync(filename, 'utf8');
};

(function() {
    var Narcissus;

    eval(read('jsdefs'));
    eval(read('jslex'));
    eval(read('jsparse'));
    eval(read('jsdecomp'));

    exports.definitions = Narcissus.definitions;
    exports.lexer = Narcissus.lexer;
    exports.parser = Narcissus.parser;
    exports.decompiler = Narcissus.decompiler;
})();
