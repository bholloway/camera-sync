const {basename} = require('path');
const {stat} = require('fs');
const {promisify} = require('util');
const {utimes} = require('@ronomon/utimes');
const md5File = require('md5-file');

const assertDirectory = require('../cli/assert');
const promiseLens = require('../functional/promise-lens');
const curryOptions = require('../functional/curry-options');
const copyFile = require('../file/copy-file');


const sync = curryOptions(
  {parallelism: 16, progress: null, allowStat: false},
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
        require('./plan')(options)
      ))
      .then(lens({from: 'plan', to: 'sync'})(
        lens({from: 'pending', to: 'errors', label: '*'})(
          compose(
            map(({source, destination, checksum, birthtime}) =>
              Promise.resolve()
                .then(() =>
                  copyFile({source, destination})
                    .catch(() => Promise.reject(new Error('copy')))
                )
                .then(() =>
                  promisify(utimes)(destination, +birthtime, undefined, undefined)
                    .catch(() => Promise.reject(new Error('btime')))
                )
                .then(() => Promise.all([
                  promisify(md5File)(destination)
                    .then((actualSum) =>
                      (actualSum !== checksum) && Promise.reject(new Error('checksum'))
                    ),
                  promisify(stat)(destination)
                    .then(({birthtime: actualBtime}) =>
                      (+actualBtime !== +birthtime) && Promise.reject(new Error('btime'))
                    )
                ]))
                .then(() => false)
                .catch((error) => `${error.message}:${basename(source)}`)
            ),
            (errors) => errors.filter(Boolean)
          )
        )
      ))
);

module.exports = sync;
