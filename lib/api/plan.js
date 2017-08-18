const path = require('path');

const promiseLens = require('../util/promise-lens');
const curryOptions = require('../util/curry-options');


const plan = curryOptions(
  {parallelism: 16, progress: null},
  (options) => (args, {merge, lens} = promiseLens(options)) =>
    Promise.resolve(args)
      .then(merge(
        require('./scan'),
        require('./list')
      ))
      .then(lens({from: '*', to: 'plan'})(
        (hash, {lens, merge}) =>
          Promise.resolve(hash)
            .then(lens({from: 'scan', to: 'errors'})(
              (scan) => ['images', 'videos']
                .reduce((reduced, key) => reduced.concat(
                  scan[key].filter(({cannonical}) => !cannonical)
                ), [])
            ))
            .then(merge(
              ...['images', 'videos'].map(
                (key) => lens({from: '*', to: key})(
                  ({scan, list}) => scan[key]
                    .filter(({cannonical, checksum}) => {
                      const element = list[key]
                        .find(({absolute}) => (path.basename(absolute) === cannonical));

                      return !element || (element.checksum !== checksum);
                    })
                    .map(({absolute, cannonical}) => ({
                      cannonical,
                      source: absolute,
                      destination: path.join(list.path, cannonical),
                      toString: () => cannonical
                    }))
                )
              )
            ))
      ))
);

module.exports = plan;
