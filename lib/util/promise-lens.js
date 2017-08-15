const promiseLense = (labels) => {
  let self = {};
  let total = 0;
  let completed = 0;


  const create = label =>
    ((label === '*') ? self : promiseLense(labels.concat(label)));


  const add = (label) => {
    total++;
    if (labels.length) {
      console.log(`create ${label} ${self}`);
    }

    return (v) => {
      completed++;
      if (labels.length) {
        console.log(`complete ${label} ${self}`);
      }
      return v;
    };
  };


  const lens = (from = '*', to = from, label = to) => {
    const complete = add('lens');

    const isSelector = value =>
      ((typeof value === 'string') && (value !== '*'));

    const getter = hash =>
      (isSelector(from) ? hash[from] : hash);

    const setter = existing => value =>
      ((typeof value === 'undefined') ?
        existing :
        Object.assign({}, existing, isSelector(to) ? {[to]: value} : value));

    return fn => (args, nested = self) => {
      const hash = Object.assign.apply(null, [{}].concat(args));

      return Promise.resolve(getter(hash))
        .then(v => fn(v, nested.create(label)))
        .then(setter(hash))
        .then(complete);
    };
  };


  // TODO throttle this by promise pool
  const all = (list, fn) =>
    Promise.all(list.map((element) => {
      const complete = add('all');

      return fn(element).then(complete);
    }));


  const map = fn => (list, nested = self) =>
    nested.all(list, v => fn(v, nested));


  const merge = (...fns) => (args, nested = self) => {
    const reduceObject = (reduced1, obj, i) => Object.keys(obj)
      .filter(k => (i === 0) || ((obj[k] !== args[k]) && (obj[k] !== reduced1[k])))
      .reduce((reduced2, k) => Object.assign(reduced2, {[k]: obj[k]}), reduced1);

    return nested.all(fns, fn => fn(args, nested))
      .then(results => [args].concat(results).reduce(reduceObject, {}));
  };


  const toString = () =>
    `(${completed}/${total}) ${labels.join(' / ')}`;


  self = {create, lens, merge, map, all, toString};
  return self;
};

module.exports = promiseLense([]);
