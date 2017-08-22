const path = require('path');
const {promisify} = require('util');
const md5File = require('md5-file');

const assertDirectory = require('../cli/assert');
const promiseLens = require('../functional/promise-lens');
const curryOptions = require('../functional/curry-options');
const copyFile = require('../file/copy-file');


const copyAndValidate = ({source, destination, checksum: expectedSum}) =>
  copyFile({source, destination})
    .then(() => promisify(md5File)(destination))
    .catch(() => Promise.reject(new Error('copy')))
    .then((actualSum) => (actualSum !== expectedSum) && Promise.reject(new Error('checksum')))
    .catch((error) => `${error.message}:${path.basename(source)}`);


const sync = curryOptions(
  {parallelism: 16, progress: null},
  (options) => (args, {lens, merge, map, compose} = promiseLens(options)) =>
    Promise.resolve(args)
      .then(merge(
        ({source, destination}) =>
          Promise.all([source, destination].map(assertDirectory))
            .catch(() => { /* handle errors with specific directories in planning below */ })
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
        lens({from: 'pending', to: 'errors'})(
          compose(
            map(copyAndValidate),
            (v) => v.filter(Boolean)
          )
        )
      ))
);

module.exports = sync;
