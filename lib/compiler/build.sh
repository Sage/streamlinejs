pushd `dirname $0` > /dev/null
../../bin/_node -lp -v -f --internal -c builtins._js flows._js
mv builtins.js ../callbacks
mv flows.js ../callbacks

../../bin/_node -lp -v -f --internal -c compile._js
< compile.js    sed -e "s/\/\/\/ \!doc//" > ../callbacks/compile.js
rm compile.js

../../bin/_node -lp -v -f --internal --fibers -c builtins._js flows._js
< builtins.js   sed -e "s/\/\/\/ \!doc//" > ../fibers/builtins.js
< flows.js      sed -e "s/\/\/\/ \!doc//" > ../fibers/flows.js
rm builtins.js flows.js

../../bin/_node -lp -v -f --internal --fibers --fast --aggressive -c builtins._js flows._js
< builtins.js   sed -e "s/\/\/\/ \!doc//" > ../fibers-fast/builtins.js
< flows.js      sed -e "s/\/\/\/ \!doc//" > ../fibers-fast/flows.js
rm builtins.js flows.js

../../bin/_node -lp -v -f --internal --generators -c builtins._js flows._js
< builtins.js   sed -e "s/\/\/\/ \!doc//" > ../generators/builtins.js
< flows.js      sed -e "s/\/\/\/ \!doc//" > ../generators/flows.js
rm builtins.js flows.js

../../bin/_node -lp -v -f --internal --generators --fast -c builtins._js flows._js
< builtins.js   sed -e "s/\/\/\/ \!doc//" > ../generators-fast/builtins.js
< flows.js      sed -e "s/\/\/\/ \!doc//" > ../generators-fast/flows.js
rm builtins.js flows.js

../../bin/_node -lp -v -f --internal -c ../streams/client/streams._js

# compile test files for client too (standalone, except flows-test)
cd ../..
TEST=test/common
# compile eval-test with --standalone to exercise this option
bin/_node -lp -v -f --standalone -o $TEST/callbacks/ -c $TEST/eval-test._js
# the other 3 test the runtime-all.js file.
bin/_node -lp -v -f -o $TEST/callbacks/ -c $TEST/{flows,stack,futures}-test._js
bin/_node --generators -v -f -o $TEST/generators/ -c $TEST/*._js

cat lib/callbacks/require-stub.js \
	node_modules/esprima/esprima.js \
	lib/callbacks/escodegen-browser.js \
	lib/version.js \
	lib/util/source-map.js \
	lib/callbacks/transform.js \
	lib/globals.js \
	lib/util/future.js \
	lib/callbacks/runtime.js \
	lib/callbacks/builtins.js | sed -e "s/\/\/\/ \!doc//" | sed -e "s/require\([^ dR]\)/require_\1/g" > lib/callbacks/transform-all.js
	
cat lib/callbacks/require-stub.js \
	lib/globals.js \
	lib/util/future.js \
	lib/callbacks/runtime.js \
	lib/callbacks/builtins.js | sed -e "s/\/\/\/ \!doc//" | sed -e "s/require\([^ dR]\)/require_\1/g" > lib/callbacks/runtime-all.js
	
cat lib/generators/require-stub.js \
	node_modules/esprima/esprima.js \
	lib/callbacks/escodegen-browser.js \
	lib/version.js \
	lib/util/source-map.js \
	lib/fibers/walker.js \
	lib/generators/transform.js \
	node_modules/galaxy/lib/galaxy.js \
	lib/globals.js \
	lib/util/future.js \
	lib/generators/runtime.js \
	lib/generators/builtins.js | sed -e "s/\/\/\/ \!doc//" | sed -e "s/require\([^ dR]\)/require_\1/g" > lib/generators/transform-all.js
	
cat lib/generators/require-stub.js \
	node_modules/galaxy/lib/galaxy.js \
	lib/globals.js \
	lib/util/future.js \
	lib/generators/runtime.js \
	lib/generators/builtins.js | sed -e "s/\/\/\/ \!doc//" | sed -e "s/require\([^ dR]\)/require_\1/g" > lib/generators/runtime-all.js
	
popd > /dev/null
