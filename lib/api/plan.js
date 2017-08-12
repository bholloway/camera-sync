const path = require('path');
const {lens, merge} = require('../util/promise-lens');


const plan = args =>
  Promise.resolve(args)
    .then(merge(
      require('./scan'),
      require('./list')
    ))
    .then(lens('*', 'plan')(
      withScanAndList => Promise.resolve(withScanAndList)
        .then(lens('scan', 'errors')(
          scan => ['images', 'videos']
            .reduce((list, key) => list.concat(
              scan[key].filter(({cannonical}) => !cannonical)
            ), [])
        ))
        .then(lens()(
          ({scan, list}) => ['images', 'videos']
            .reduce((reduced, key) => Object.assign(reduced, {
              [key]: scan[key]
                .filter(({basename}) => !list[key].includes(basename))
                .map(({absolute, cannonical}) => ({
                  cannonical,
                  source: absolute,
                  destination: path.join(list.path, cannonical),
                  toString: () => cannonical
                }))
            }), {})
        ))
    ));

module.exports = plan;
