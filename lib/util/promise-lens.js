const lens = (from = '*', to = from) => {
  const isSelector = value =>
    ((typeof value === 'string') && (value !== '*'));

  const getter = hash =>
    (isSelector(from) ? hash[from] : hash);

  const setter = existing => value =>
    ((typeof value === 'undefined') ?
      existing :
      Object.assign({}, existing, isSelector(to) ? {[to]: value} : value));

  return fn => (hashOrHashArray) => {
    const hash = Object.assign.apply(null, [{}].concat(hashOrHashArray));
    return Promise.resolve(getter(hash))
      .then(fn)
      .then(setter(hash));
  };
};

exports.lens = lens;


const merge = (...fns) => (args) => {
  const reduceObject = (reduced1, obj, i) => Object.keys(obj)
    .filter(k => (i === 0) || ((obj[k] !== args[k]) && (obj[k] !== reduced1[k])))
    .reduce((reduced2, k) => Object.assign(reduced2, {[k]: obj[k]}), reduced1);

  return Promise.all(fns.map(fn => Promise.resolve(args).then(fn)))
    .then(results => [args].concat(results).reduce(reduceObject, {}));
};

exports.merge = merge;
