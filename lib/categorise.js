const categorise = (...tests) => values =>
  values.reduce(
    (results, value) => results.map((result, i) => {
      const isInclude = (i in tests) ? tests[i](value) : true;
      return isInclude ? result.concat(value) : result;
    }),
    (new Array(tests.length + 1)).fill([])
  );

module.exports = categorise;
