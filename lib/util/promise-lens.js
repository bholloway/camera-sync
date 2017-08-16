const curryOptionsOrCall = (fn, curriedOptions = {}) => (...args) => {
  const isCurry = args
    .every(v => !!v && (typeof v === 'object') && !Array.isArray(v));

  return isCurry ?
    curryOptionsOrCall(fn, Object.assign.apply(null, [{}, curriedOptions].concat(args))) :
    fn(curriedOptions)(...args);
};


const promiseLense = ({parallelism, progress}) => {
  const numChannels = Math.max(1, parallelism || 8);

  const factory = (labels = []) => {
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

      const onCompleted = (v) => {
        completed++;
        if (labels.length && progress) {
          progress(info());
        }
        return v;
      };

      const child = (label === '*') ? self : factory(labels.concat(label));

      return {onCompleted, child};
    };


    const lens = curryOptionsOrCall(({from = '*', to = from, label = to}) => {
      const isSelector = value =>
        ((typeof value === 'string') && (value !== '*'));

      const getter = hash =>
        (isSelector(from) ? hash[from] : hash);

      const setter = existing => value =>
        ((typeof value === 'undefined') ?
          existing :
          Object.assign({}, existing, isSelector(to) ? {[to]: value} : value));

      return fn => (args, context = self) => {
        const {onCompleted, child} = context.create(label);

        return Promise.resolve(getter(args))
          .then(v => fn(v, child))
          .then(setter(args))
          .then(onCompleted);
      };
    });


    // TODO throttle this by numChannels
    const all = (list, fn) =>
      Promise.all(list.map((element) => {
        const {onCompleted} = create();

        return fn(element).then(onCompleted);
      }));


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
