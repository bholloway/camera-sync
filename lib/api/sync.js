const assertDirectory = require('../util/assert');
const promiseLens = require('../util/promise-lens');
const curryOptions = require('../util/curry-options');
const copyFile = require('../util/copy-file');


const filter = (v) =>
  v.filter(Boolean);

const sync = curryOptions(
  {parallelism: 16, progress: null},
  (options) => (args, {lens, merge, map} = promiseLens(options)) =>
    Promise.resolve(args)
      .then(merge(
        ({source, destination}, {all}) =>
          all([source, destination], assertDirectory)
            .catch(() => {
              /* let test handle errors with specific directories */
            })
            .then(([a, b]) => {
              if (a === b) {
                throw new Error('error: source and destination directories must be different');
              }
            })
      ))
      .then(merge(
        require('./plan')
      ))
      .then(lens({from: 'plan', to: 'sync'})(
        merge(
          lens({label: 'copy', from: 'images', to: 'errors'})(map(copyFile, filter)),
          lens({label: 'copy', from: 'videos', to: 'errors'})(map(copyFile, filter))
        )
      ))
);

module.exports = sync;
