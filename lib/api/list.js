const {readdir} = require('fs');
const {join} = require('path');
const {promisify} = require('util');

const assertDirectory = require('../cli/assert');
const promiseLens = require('../functional/promise-lens');
const curryOptions = require('../functional/curry-options');
const categorise = require('../functional/categorise');
const {scanMedia, exif, mp4, isImage, isVideo, isOther} = require('../media');


const onBadDestination = (error) => {
  throw new Error(`error: destination ${error.message}`);
};


const list = curryOptions(
  {parallelism: 16, bufferSize: 4E+6, progress: null, useMeta: false, whitelist: []},
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
                    lens({from: 'images'})(map(scanMedia(exif, {bufferSize: options.bufferSize}))),
                    lens({from: 'videos'})(map(scanMedia(mp4, {bufferSize: options.bufferSize})))
                  ))
            ))
      ))
);

module.exports = list;
