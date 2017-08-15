const {readdir} = require('fs');
const {join} = require('path');
const {promisify} = require('util');

const assertDirectory = require('../util/assert');
const {lens} = require('../util/promise-lens');
const categorise = require('../util/categorise');
const {isImage, isVideo, isOther} = require('../util/extname');
const scanMedia = require('../util/scan-media');


const onBadDestination = (error) => {
  throw new Error(`error: destination ${error.message}`);
};


const list = args =>
  Promise.resolve(args)
    .then(lens('destination', 'list')(
      (destination, {lens}) =>
        assertDirectory(destination)
          .then(path => ({path}))
          .catch(onBadDestination)
          .then(lens('path', '*')(
            (path, {merge, map}) =>
              promisify(readdir)(path)
                .then(basenames => basenames.map(basename => join(path, basename)))
                .then(categorise({
                  images: isImage,
                  videos: isVideo,
                  others: isOther
                }))
                .then(merge(
                  lens('images')(map(scanMedia(path, {
                    useExif: false,
                    useStat: true,
                    useMd5: true
                  }))),
                  lens('videos')(map(scanMedia(path, {
                    useExif: false,
                    useStat: true,
                    useMd5: true
                  })))
                ))
          ))
    ));

module.exports = list;
