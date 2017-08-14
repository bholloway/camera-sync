const {readdir} = require('fs');
const {promisify} = require('util');

const assertDirectory = require('../util/assert');
const {lens, merge, map} = require('../util/promise-lens');
const categorise = require('../util/categorise');
const {isImage, isVideo, isOther} = require('../util/extname');
const scanMedia = require('../util/scan-media');


const onBadDestination = (error) => {
  throw new Error(`error: destination ${error.message}`);
};


const list = args =>
  Promise.resolve(args)
    .then(lens('destination', 'list')(
      destination => assertDirectory(destination).then(path => ({path}))
        .catch(onBadDestination)
        .then(lens('path', '*')(
          path => promisify(readdir)(path)
            .then(categorise({
              images: isImage,
              videos: isVideo,
              others: isOther
            }))
            .then(merge(
              map('images')(scanMedia(path, {useExif: false, useStat: true, useMd5: true})),
              map('videos')(scanMedia(path, {useExif: false, useStat: true, useMd5: true}))
            ))
        ))
    ));

module.exports = list;
