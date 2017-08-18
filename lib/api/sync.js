const assertDirectory = require('../util/assert');
const promiseLens = require('../util/promise-lens');
const curryOptions = require('../util/curry-options');


const sync = curryOptions(
  {parallelism: 16, progress: null},
  (options) => (args, {lens, merge} = promiseLens(options)) =>
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
      .then(lens({from: '*', to: 'sync'})(
        ({source, destination, updates, others}) => {
          // TODO
          return Object.assign({}, args, {source, destination, updates, others});
        }
      ))
);

module.exports = sync;
