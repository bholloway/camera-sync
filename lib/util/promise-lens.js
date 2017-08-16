const promiseQueue = require('./promise-queue');
const curryOptions = require('./curry-options');


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
      const isSelector = value =>
        ((typeof value === 'string') && (value !== '*'));

      const getter = hash =>
        (isSelector(from) ? hash[from] : hash);

      const setter = existing => value =>
        ((typeof value === 'undefined') ?
          existing :
          Object.assign({}, existing, isSelector(to) ? {[to]: value} : value));

      return fn => (args, context = self) => {
        const {onComplete, child} = context.create(label);

        return Promise.resolve(getter(args))
          .then(v => fn(v, child))
          .then(setter(args))
          .then(onComplete);
      };
    });


    const all = (list, fn) =>
      Promise.all(list.map(v =>
        enqueue(() => fn(v))
          .then(create().onComplete)
      ));


    const map = fn => (list, context = self) =>
      context.all(list, v => fn(v, context));


    const merge = (...fns) => (args, context = self) => {
      const reduceObject = (reduced1, obj, i) => Object.keys(obj)
        .filter(k => (i === 0) || ((obj[k] !== args[k]) && (obj[k] !== reduced1[k])))
        .reduce((reduced2, k) => Object.assign(reduced2, {[k]: obj[k]}), reduced1);

      return context.all(fns, fn => fn(args, context))
        .then(results => [args].concat(results).reduce(reduceObject, {}));
    };


    self = {create, lens, merge, map, all, toString, info};
    return self;
  };

  return factory();
};

module.exports = promiseLense;
