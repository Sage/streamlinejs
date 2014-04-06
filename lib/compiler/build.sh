pushd `dirname $0` > /dev/null
../../bin/_node -lp -v -f -c builtins._js flows._js
mv builtins.js ../callbacks
mv flows.js ../callbacks

../../bin/_node -lp -v -f -c compile._js
< compile.js    sed -e "s/\/\/\/ \!doc//" > ../callbacks/compile.js
rm compile.js

../../bin/_node -lp -v -f --fibers -c builtins._js flows._js
< builtins.js   sed -e "s/\/\/\/ \!doc//" > ../fibers/builtins.js
< flows.js      sed -e "s/\/\/\/ \!doc//" > ../fibers/flows.js
rm builtins.js flows.js

../../bin/_node -lp -v -f --fibers --fast -c builtins._js flows._js
< builtins.js   sed -e "s/\/\/\/ \!doc//" > ../fibers-fast/builtins.js
< flows.js      sed -e "s/\/\/\/ \!doc//" > ../fibers-fast/flows.js
rm builtins.js flows.js

../../bin/_node -lp -v -f --generators -c builtins._js flows._js
< builtins.js   sed -e "s/\/\/\/ \!doc//" > ../generators/builtins.js
< flows.js      sed -e "s/\/\/\/ \!doc//" > ../generators/flows.js
rm builtins.js flows.js

../../bin/_node -lp -v -f --generators --fast -c builtins._js flows._js
< builtins.js   sed -e "s/\/\/\/ \!doc//" > ../generators-fast/builtins.js
< flows.js      sed -e "s/\/\/\/ \!doc//" > ../generators-fast/flows.js
rm builtins.js flows.js

../../bin/_node -lp -v -f -c ../streams/client/streams._js

# compile test files for client too (standalone, except flows-test)
cd ../..
TEST=test/common
bin/_node -lp -v -f --standalone -o $TEST/callbacks/ -c $TEST/{eval,stack,futures}-test._js
bin/_node -lp -v -f -o $TEST/callbacks/ -c $TEST/flows-test._js
bin/_node --generators -v -f -o $TEST/generators/ -c $TEST/*._js

cat lib/callbacks/require-stub.js \
	deps/narcissus/lib/jsdefs.js \
	deps/narcissus/lib/jslex.js \
	deps/narcissus/lib/jsparse.js \
	deps/narcissus/lib/jsdecomp.js \
	lib/version.js \
	lib/util/source-map.js \
	lib/callbacks/format.js \
	lib/callbacks/transform.js \
	lib/util/future.js \
	lib/callbacks/runtime.js \
	lib/callbacks/builtins.js | sed -e "s/\/\/\/ \!doc//" > lib/transform-all.js
	
popd > /dev/null
