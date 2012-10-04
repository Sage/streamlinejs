pushd `dirname $0` > /dev/null
../../bin/_node -lp -v -f -c builtins._js
mv builtins.js ../callbacks

../../bin/_node -lp -v -f --fibers -c builtins._js
cat builtins.js | sed -e "s/\/\/\/ \!doc//" > ../fibers/builtins.js
rm builtins.js

../../bin/_node -lp -v -f --generators -c builtins._js
cat builtins.js | sed -e "s/\/\/\/ \!doc//" > ../generators/builtins.js
rm builtins.js

../../bin/_node -lp -v -f --spoon -c builtins._js
cat builtins.js | sed -e "s/\/\/\/ \!doc//" > ../spoon/builtins.js
rm builtins.js

../../bin/_node -lp -v -f -c compile._js
../../bin/_node -lp -v -f -c ../streams/client/streams._js

# compile test files for client too
pushd ../../test/common > /dev/null
../../bin/_node -lp -v -f -c .
mv eval-test.js flows-test.js stack-test.js futures-test.js callbacks
../../bin/_node --generators -v -f -c .
mv eval-test.js flows-test.js stack-test.js futures-test.js generators
../../bin/_node --spoon -v -f -c spoon
popd > /dev/null
popd > /dev/null
