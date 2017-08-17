const {readdir} = require('fs');
const {join} = require('path');
const {promisify} = require('util');

const promiseLens = require('../util/promise-lens');
const curryOptions = require('../util/curry-options');
const assertDirectory = require('../util/assert');
const categorise = require('../util/categorise');
const {isImage, isVideo, isOther} = require('../util/extname');
const scanMedia = require('../util/scan-media');


const onBadDestination = (error) => {
  throw new Error(`error: destination ${error.message}`);
};


const list = curryOptions(
  {parallelism: 8, progress: null},
  (options) => (args, {lens} = promiseLens(options)) =>
    Promise.resolve(args)
      .then(lens({from: 'destination', to: 'list'})(
        (destination, {lens}) =>
          assertDirectory(destination)
            .then((path) => ({path}))
            .catch(onBadDestination)
            .then(lens({from: 'path', to: '*'})(
              (path, {merge, lens, map}) =>
                promisify(readdir)(path)
                  .then((basenames) => basenames.map((basename) => join(path, basename)))
                  .then(categorise({
                    images: isImage,
                    videos: isVideo,
                    others: isOther
                  }))
                  .then(merge(
                    lens({from: 'images'})(map(scanMedia(path, {
                      useExif: false,
                      useStat: true,
                      useMd5: true
                    }))),
                    lens({from: 'videos'})(map(scanMedia(path, {
                      useExif: false,
                      useStat: true,
                      useMd5: true
                    })))
                  ))
            ))
      ))
);

module.exports = list;
