const categorise = (testHash) => {
  const keys = Object.keys(testHash);
  const init = keys
    .reduce((reduced, k) => Object.assign(reduced, {[k]: []}), {});

  return values =>
    values.reduce((results, value) => {
      const category = keys.find(k => testHash[k](value));
      return Object.assign(results, {
        [category]: results[category].concat(value)
      });
    }, init);
};

module.exports = categorise;
