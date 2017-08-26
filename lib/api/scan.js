const assertDirectory = require('../cli/assert');
const promiseLens = require('../functional/promise-lens');
const curryOptions = require('../functional/curry-options');
const categorise = require('../functional/categorise');
const globPath = require('../file/glob-path');
const {scanMedia, exif, mp4, isImage, isVideo, isOther} = require('../media');


const onBadSource = (error) => {
  throw new Error(`error: source ${error.message}`);
};


const validCanonicalName = ({canonical}) =>
  !!canonical;


const invalidCanonicalName = ({canonical}) =>
  !canonical;


const scan = curryOptions(
  {parallelism: 16, bufferSize: 4E+6, progress: null, useMeta: false, whitelist: []},
  (options) => (args, {lens} = promiseLens(options)) =>
    Promise.resolve(args)
      .then(lens({from: 'source', to: 'scan'})(
        (source, {lens}) =>
          assertDirectory(source)
            .then((path) => ({path}))
            .catch(onBadSource)
            .then(lens({from: 'path', to: '*'})(
              (path, {merge, lens, map, compose}) =>
                globPath(path)
                  .then(categorise({
                    images: isImage,
                    videos: isVideo,
                    others: isOther
                  }))
                  .then(merge(
                    lens({from: 'images', to: '*', label: 'images'})(
                      compose(
                        map(scanMedia(exif, options)),
                        categorise({
                          images: validCanonicalName,
                          errors: invalidCanonicalName
                        })
                      )
                    ),
                    lens({from: 'videos', to: '*', label: 'videos'})(
                      compose(
                        map(scanMedia(mp4, options)),
                        categorise({
                          videos: validCanonicalName,
                          errors: invalidCanonicalName
                        })
                      )
                    )
                  ))
            ))
      ))
);

module.exports = scan;
