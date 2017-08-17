const test = require('./plan');

const promiseLens = require('../util/promise-lens');
const curryOptions = require('../util/curry-options');

const sync = curryOptions(
  {parallelism: 8, progress: null},
  (options) => (args, {lens} = promiseLens(options)) =>
    Promise.resolve(args)
      .then(test)
      .then(lens({from: '*', to: 'sync'})(
        ({source, destination, updates, others}) => {
          console.log('sync', {source, destination, updates, others});

          return Object.assign({}, args, {source, destination, updates, others});
        }
      ))
);

module.exports = sync;
