pushd `dirname $0` > /dev/null

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
	
popd > /dev/null
