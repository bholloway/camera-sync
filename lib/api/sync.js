const path = require('path');
const {promisify} = require('util');

const assertDirectory = require('../util/assert');
const promiseLens = require('../util/promise-lens');
const curryOptions = require('../util/curry-options');
const copyFile = require('../util/copy-file');
const md5File = require('md5-file');


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
          ...['images', 'videos'].map(
            (key) => lens({label: key, from: key, to: 'errors'})(map(
              ({source, destination, checksum: expectedSum}) =>
                copyFile({source, destination})
                  .then(() => promisify(md5File)(destination))
                  .catch(() =>
                    Promise.reject(new Error('copy'))
                  )
                  .then((actualSum) =>
                    (actualSum !== expectedSum) && Promise.reject(new Error('checksum'))
                  )
                  .catch((error) =>
                    `${path.basename(source)}:${error.message}`
                  )
              ,
              (v) => v.filter(Boolean)
            ))
          )
        )
      ))
);

module.exports = sync;
