const curryOptions = (fn, curriedOptions = {}) => (...args) => {
  const isCurry = args
    .every((v) => !!v && (typeof v === 'object') && !Array.isArray(v));

  return isCurry ?
    curryOptions(fn, Object.assign.apply(null, [{}, curriedOptions].concat(args))) :
    fn(curriedOptions)(...args);
};

module.exports = curryOptions;
