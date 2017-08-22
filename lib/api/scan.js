const {promisify} = require('util');
const glob = require('glob');

const assertDirectory = require('../cli/assert');
const promiseLens = require('../functional/promise-lens');
const curryOptions = require('../functional/curry-options');
const categorise = require('../functional/categorise');
const scanMedia = require('../media');
const {isImage, isVideo, isOther} = require('../media/extname');


const onBadSource = (error) => {
  throw new Error(`error: source ${error.message}`);
};


const validCanonicalName = ({cannonical}) =>
  !!cannonical;


const invalidCanonicalName = ({cannonical}) =>
  !cannonical;


const scan = curryOptions(
  {parallelism: 16, progress: null, allowStat: false},
  (options) => (args, {lens} = promiseLens(options)) =>
    Promise.resolve(args)
      .then(lens({from: 'source', to: 'scan'})(
        (source, {lens}) =>
          assertDirectory(source)
            .then((path) => ({path}))
            .catch(onBadSource)
            .then(lens({from: 'path', to: '*'})(
              (path, {merge, lens, map, compose}) =>
                promisify(glob)(`${path}/**/*`, {nodir: true})
                  .then(categorise({
                    images: isImage,
                    videos: isVideo,
                    others: isOther
                  }))
                  .then(merge(
                    lens({from: 'images', to: '*'})(
                      compose(
                        map(scanMedia({
                          useExif: true,
                          useMov: false,
                          useStat: options.allowStat,
                          useMd5: true
                        })),
                        categorise({
                          images: validCanonicalName,
                          errors: invalidCanonicalName
                        })
                      )
                    ),
                    lens({from: 'videos', to: '*'})(
                      compose(
                        map(scanMedia({
                          useExif: false,
                          useMov: true,
                          useStat: options.allowStat,
                          useMd5: true
                        })),
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
