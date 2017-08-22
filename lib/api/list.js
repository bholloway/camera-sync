const {readdir} = require('fs');
const {join} = require('path');
const {promisify} = require('util');

const assertDirectory = require('../cli/assert');
const promiseLens = require('../functional/promise-lens');
const curryOptions = require('../functional/curry-options');
const categorise = require('../functional/categorise');
const scanMedia = require('../media');
const {isImage, isVideo, isOther} = require('../media/extname');


const onBadDestination = (error) => {
  throw new Error(`error: destination ${error.message}`);
};


const list = curryOptions(
  {parallelism: 16, progress: null, allowStat: false},
  (options) => (args, {lens} = promiseLens(options)) =>
    Promise.resolve(args)
      .then(lens({from: 'destination', to: 'list'})(
        (destination, {lens}) =>
          assertDirectory(destination)
            .then((base) => ({base}))
            .catch(onBadDestination)
            .then(lens({from: 'base', to: '*'})(
              (base, {merge, lens, map}) =>
                promisify(readdir)(base)
                  .then((basenames) => basenames.map((basename) => join(base, basename)))
                  .then(categorise({
                    images: isImage,
                    videos: isVideo,
                    others: isOther
                  }))
                  .then(merge(
                    lens({from: 'images'})(map(scanMedia({
                      useExif: false,
                      useMov: true,
                      useStat: options.allowStat
                    }))),
                    lens({from: 'videos'})(map(scanMedia({
                      useExif: false,
                      useMov: true,
                      useStat: options.allowStat
                    })))
                  ))
            ))
      ))
);

module.exports = list;
