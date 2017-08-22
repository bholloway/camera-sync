const categorise = (testHash) => {
  const keys = Object.keys(testHash);
  const init = keys
    .reduce(
      (reduced, k) => Object.assign(reduced, {
        [k]: (typeof testHash[k] === 'function') ? [] : testHash[k]
      }),
      {}
    );

  return (values) =>
    values.reduce((results, value) => {
      const category = keys.find((k) => {
        const fn = testHash[k];
        return (typeof fn === 'function') && fn(value);
      });

      return category ?
        Object.assign(results, {[category]: results[category].concat(value)}) :
        results;
    }, init);
};

module.exports = categorise;
