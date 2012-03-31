_node -lp -v -f -c builtins._js
mv builtins.js ../callbacks

_node -lp -v -f --fibers -c builtins._js
mv builtins.js ../fibers

_node -lp -v -f -c compile._js

# compile test files for client too
pushd ../../test/common > /dev/null
_node -lp -v -f -c .
mv flows-test.js stack-test.js .callbacks
popd > /dev/null
