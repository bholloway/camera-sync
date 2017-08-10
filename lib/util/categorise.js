const categorise = (testHash) => {
  const keys = Object.keys(testHash);

  return values =>
    values.reduce((results, value) => {
      const category = keys.find(k => testHash[k](value));
      const existing = results[category] || [];

      return Object.assign(results, {
        [category]: existing.concat(value)
      });
    }, {});
};

module.exports = categorise;
