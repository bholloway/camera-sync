const promiseQueue = require('./promise-queue');
const curryOptions = require('./curry-options');


const mergeResults = (original) => (individualResults) =>
  Object.assign(
    {},
    original,
    individualResults.reduce(
      (reduced1, obj = {}) =>
        Object.keys(obj)
          .filter((k) => (obj[k] !== original[k]) && (obj[k] !== reduced1[k]))
          .reduce((reduced2, k) => Object.assign(reduced2, {
            [k]: [reduced2[k], obj[k]].every(Array.isArray) ?
              reduced2[k].concat(obj[k]) :
              obj[k]
          }), reduced1),
      {}
    )
  );


const promiseLense = ({parallelism, progress}) => {
  const getChannel = promiseQueue({
    parallelism: Math.max(1, parallelism || 8)
  });

  const factory = (labels = []) => {
    const enqueue = getChannel(labels.join('|'));

    let self = {};
    let total = 0;
    let completed = 0;

    const toString = () =>
      `(${completed}/${total}) ${labels.join(' / ')}`;

    const info = () => ({
      labels: labels.concat(),
      completed,
      total,
      toString
    });

    const create = (label = '*') => {
      total++;
      if (labels.length && progress) {
        progress(info());
      }

      const onComplete = (v) => {
        completed++;
        if (labels.length && progress) {
          progress(info());
        }
        return v;
      };

      const child = (label === '*') ? self : factory(labels.concat(label));

      return {onComplete, child};
    };

    const lens = curryOptions(({from = '*', to = from, label = to}) => {
      const isSelector = (value) =>
        ((typeof value === 'string') && (value !== '*'));

      const getter = (hash) =>
        (isSelector(from) ? hash[from] : hash);

      const setter = (existing) => (value) =>
        ((typeof value === 'undefined') ?
          existing :
          Object.assign({}, existing, isSelector(to) ? {[to]: value} : value));

      return (fn) => (args, context = self) => {
        const {onComplete, child} = context.create(label);

        return Promise.resolve(getter(args))
          .then((v) => (fn ? fn(v, child) : v))
          .then(setter(args))
          .then(onComplete);
      };
    });

    const parallel = (list, fn) =>
      Promise.all(list.map((v) =>
        enqueue(() => fn(v))
          .then(create().onComplete)
      ));

    const serial = (list, fn) => (args) =>
      list.reduce(
        (promise, v) => promise
          .then((next) => enqueue(() => fn(v)(next)))
          .then(create().onComplete),
        Promise.resolve(args)
      );

    const map = (mapFn) => (list, context = self) =>
      context.parallel(list, (v) => mapFn(v, context));

    const compose = (...fns) => (args, context = self) =>
      context.serial(fns, (fn) => (v) => fn(v, context))(args);

    const merge = (...fns) => (args, context = self) =>
      context.parallel(fns, (fn) => fn(args, context))
        .then(mergeResults(args));

    self = {create, lens, merge, map, compose, parallel, serial, toString, info};
    return self;
  };

  return factory();
};

module.exports = promiseLense;
