const {readdir} = require('fs');
const {join} = require('path');
const {promisify} = require('util');

const {lens} = require('../util/promise-lens')({
  parallelism: 8,
  progress: (info) => console.log(String(info))
});

const assertDirectory = require('../util/assert');
const categorise = require('../util/categorise');
const {isImage, isVideo, isOther} = require('../util/extname');
const scanMedia = require('../util/scan-media');


const onBadDestination = (error) => {
  throw new Error(`error: destination ${error.message}`);
};


const list = (args) =>
  Promise.resolve(args)
    .then(lens({from: 'destination', to: 'list'})(
      (destination, {lens}) =>
        assertDirectory(destination)
          .then((path) => ({path}))
          .catch(onBadDestination)
          .then(lens({from: 'path', to: '*'})(
            (path, {merge, map}) =>
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
    ));

module.exports = list;
