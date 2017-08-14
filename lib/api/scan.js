const {promisify} = require('util');
const glob = require('glob');

const assertDirectory = require('../util/assert');
const {lens, merge, map} = require('../util/promise-lens');
const categorise = require('../util/categorise');
const {isImage, isVideo, isOther} = require('../util/extname');
const scanMedia = require('../util/scan-media');


const onBadSource = (error) => {
  throw new Error(`error: source ${error.message}`);
};


const scan = args =>
  Promise.resolve(args)
    .then(lens('source', 'scan')(
      source => assertDirectory(source).then(path => ({path}))
        .catch(onBadSource)
        .then(lens('path', '*')(
          path => promisify(glob)(`${path}/**/*`, {nodir: true})
            .then(categorise({
              images: isImage,
              videos: isVideo,
              others: isOther
            }))
            .then(merge(
              map('images')(scanMedia(path, {useExif: true, useStat: true, useMd5: true})),
              map('videos')(scanMedia(path, {useExif: false, useStat: true, useMd5: true}))
            ))
        ))
    ));

module.exports = scan;
