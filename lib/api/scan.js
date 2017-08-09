const path = require('path');
const {promisify} = require('util');

const glob = require('glob');
const imageExtensions = require('image-extensions');
const videoExtensions = require('video-extensions');

const assertDirectory = require('../util/assert');


const categorise = require('../util/categorise')(
  file => imageExtensions.includes(path.extname(file).slice(1)),
  file => videoExtensions.includes(path.extname(file).slice(1))
);


const onBadSource = (error) => {
  throw new Error(`error: source ${error.message}`);
};


const scan = args =>
  assertDirectory(args.source)
    .catch(onBadSource)
    .then(source => promisify(glob)(`${source}/**/*`, {nodir: true})
      .then((files) => {
        const [images, videos, others] = categorise(files);
        return Object.assign({}, args, {source, images, videos, others});
      })
    );

module.exports = scan;
