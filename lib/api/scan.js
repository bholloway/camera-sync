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
      (source, {lens}) =>
        assertDirectory(source)
          .then(path => ({path}))
          .catch(onBadSource)
          .then(lens('path', '*')(
            (path, {merge, lens, map}) =>
              promisify(glob)(`${path}/**/*`, {nodir: true})
                .then(categorise({
                  images: isImage,
                  videos: isVideo,
                  others: isOther
                }))
                .then(merge(
                  lens('images')(map(scanMedia(path, {
                    useExif: true,
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

module.exports = scan;
