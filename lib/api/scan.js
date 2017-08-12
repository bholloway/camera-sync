const {promisify} = require('util');
const md5File = require('md5-file');
const titleCase = require('title-case');
const glob = require('glob');

const assertDirectory = require('../util/assert');
const exif = require('../util/exif');
const {lens} = require('../util/promise-lens');
const categorise = require('../util/categorise');
const {isImage, isVideo, isOther} = require('../util/extname');


const onBadSource = (error) => {
  throw new Error(`error: source ${error.message}`);
};


const inferName = ({meta, checksum}) => {
  const {
    exif: {DateTimeOriginal} = {},
    image: {Make, Model} = {}
  } = meta || {};

  if ([DateTimeOriginal, Make, Model].includes(undefined)) {
    return null;
  } else {
    const datenum = +meta.exif.DateTimeOriginal / 1000;
    const make = Make.trim().split(/\s/).shift();
    const camera = [titleCase(make), Model.replace(make, '')]
      .join('')
      .replace(/[^a-zA-Z0-9]+/g, '');

    return `${datenum}-${camera}-${checksum.slice(0, 8)}`;
  }
};


const scanImage = source =>
  Promise.all([
    exif(source),
    promisify(md5File)(source)
  ])
    .then(([meta, checksum]) => ({source, meta, checksum}))
    .then(lens('*', 'basename')(inferName))
    .then(lens('source', 'toString')(v => () => v));


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
        ))
        .then(lens('images')(images => Promise.all(images.map(scanImage))))
    ));

module.exports = scan;
