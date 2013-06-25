if (!Object.create || !Object.defineProperty || !Object.defineProperties) alert("Example will fail because your browser does not support ECMAScript 5. Try with another browser!");
var __filename = "" + window.location;

window.StreamlineRuntime = {
	globals: {}
};

function require(str) {
	if (str == "streamline/lib/util/flows") return StreamlineFlows;
	else if (str == "streamline/lib/fibers/walker") return StreamlineWalker;
	else if (str == "streamline/lib/fibers/transform") return Streamline;
	else if (str == "streamline/lib/generators/runtime") return StreamlineRuntime;
	else if (str == "streamline/lib/generators/transform") return Streamline;
	else if (str == "streamline/lib/generators/builtins") return StreamlineBuiltins;
	else if (str == "streamline/lib/globals") return StreamlineRuntime.globals;
	else if (str == "streamline/lib/callbacks/transform") return Streamline; // hack for eval test
	else alert("cannot require " + str)
}