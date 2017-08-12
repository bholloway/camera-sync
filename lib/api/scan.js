const {promisify} = require('util');
const glob = require('glob');

const assertDirectory = require('../util/assert');
const {lens} = require('../util/promise-lens');
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
            .then(lens('images')(
              images => Promise.all(
                images.map(scanMedia(path, {useExif: true, useStat: true, useMd5: true}))
              )
            ))
            .then(lens('videos')(
              video => Promise.all(
                video.map(scanMedia(path, {useExif: false, useStat: true, useMd5: true}))
              )
            ))
        ))
    ));

module.exports = scan;
