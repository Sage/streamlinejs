pushd `dirname $0` > /dev/null
cd ../..

# compile built-ins
RUNTIME=node_modules/streamline-runtime/lib
bin/_node -f --runtime await -c $RUNTIME/builtins._js
mv $RUNTIME/builtins.js $RUNTIME/builtins-await.js
cp $RUNTIME/builtins-await.js $RUNTIME/builtins-fibers.js
cp $RUNTIME/builtins-await.js $RUNTIME/builtins-generators.js
bin/_node -f --runtime fibers -c $RUNTIME/builtins._js
mv $RUNTIME/builtins.js $RUNTIME/builtins-fibers.js
bin/_node -f --runtime generators -c $RUNTIME/builtins._js
mv $RUNTIME/builtins.js $RUNTIME/builtins-generators.js

# compile test files for client too (standalone, except flows-test)
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
	lib/callbacks/builtins.js | sed -e "s/\/\/\/ \!doc//" | sed -e "s/require\([^ dR]\)/require_\1/g" > lib/browser/transform.js
	
cat lib/callbacks/require-stub.js \
	lib/globals.js \
	lib/util/future.js \
	lib/callbacks/runtime.js \
	lib/callbacks/builtins.js | sed -e "s/\/\/\/ \!doc//" | sed -e "s/require\([^ dR]\)/require_\1/g" > lib/browser/runtime-callbacks.js
	
popd > /dev/null
