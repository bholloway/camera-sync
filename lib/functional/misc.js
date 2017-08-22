const passThrough = (fn) => (v) => {
  fn(v);
  return v;
};

exports.passThrough = passThrough;


const rethrow = (error) => {
  throw error;
};

exports.rethrow = rethrow;


const nextTick = (fn) =>
  passThrough(() => process.nextTick(fn));

exports.nextTick = nextTick;
