const test = require('tape');
const {gen, check} = require('tape-check');

test('test', check(gen.int, (t, integer) => {
  t.ok(integer);

  t.end();
}));
