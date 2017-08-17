const isObject = (candidate) =>
  (!!candidate && (typeof candidate === 'object') && !Array.isArray(candidate));


const requiredKeys = (whitelist) => (candidate) =>
  (whitelist ?
    Object.keys(candidate).every((k) => whitelist.includes(k)) :
    true);


const curryOptions = (...opts) => (...args) => {
  const curriedOptions = opts.find(isObject);
  const fn = opts.find((v) => (typeof v === 'function'));

  const isValidKey = requiredKeys(curriedOptions && Object.keys(curriedOptions));
  const isCurry = args.every((v) => isObject(v) && isValidKey(v));

  return isCurry ?
    curryOptions(fn, Object.assign.apply(null, [{}, curriedOptions].concat(args))) :
    fn(curriedOptions)(...args);
};

module.exports = curryOptions;
