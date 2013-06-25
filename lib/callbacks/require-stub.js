if (!Object.create || !Object.defineProperty || !Object.defineProperties) alert("Example will fail because your browser does not support ECMAScript 5. Try with another browser!");
var __filename = "" + window.location;

function require(str) {
	if (str == "streamline/lib/util/flows") return StreamlineFlows;
	else if (str == "streamline/lib/callbacks/runtime") return StreamlineRuntime;
	else if (str == "streamline/lib/callbacks/transform") return Streamline;
	else if (str == "streamline/lib/callbacks/builtins") return StreamlineBuiltins;
	else if (str == "streamline/lib/globals") return StreamlineRuntime.globals;
	else alert("cannot require " + str)
}