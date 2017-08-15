const path = require('path');
const {lens, merge} = require('../util/promise-lens');


const plan = args =>
  Promise.resolve(args)
    .then(merge(
      require('./scan'),
      require('./list')
    ))
    .then(lens('*', 'plan')(
      (hash, {lens, merge}) =>
        Promise.resolve(hash)
          .then(lens('scan', 'errors')(
            scan => ['images', 'videos']
              .reduce((reduced, key) => reduced.concat(
                scan[key].filter(({cannonical}) => !cannonical)
              ), [])
          ))
          .then(merge(
            ...['images', 'videos'].map(
              key => lens('*', key)(
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
