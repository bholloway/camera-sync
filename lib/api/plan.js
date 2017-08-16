const path = require('path');
const {lens, merge} = require('../util/promise-lens')({
  parallelism: 8,
  progress: info => console.log(String(info))
});


const plan = args =>
  Promise.resolve(args)
    .then(merge(
      require('./scan'),
      require('./list')
    ))
    .then(lens({from: '*', to: 'plan'})(
      (hash, {lens, merge}) =>
        Promise.resolve(hash)
          .then(lens({from: 'scan', to: 'errors'})(
            scan => ['images', 'videos']
              .reduce((reduced, key) => reduced.concat(
                scan[key].filter(({cannonical}) => !cannonical)
              ), [])
          ))
          .then(merge(
            ...['images', 'videos'].map(
              key => lens({from: '*', to: key})(
                ({scan, list}) => scan[key]
                  .filter(({basename}) => !list[key].includes(basename))
                  .map(({absolute, cannonical}) => ({
                    cannonical,
                    source: absolute,
                    destination: path.join(list.path, cannonical),
                    toString: () => cannonical
                  }))
              )
            )
          ))
    ));

module.exports = plan;
