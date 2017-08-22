const {extname} = require('path');
const {stat} = require('fs');
const {promisify} = require('util');
const md5File = require('md5-file');
const titleCase = require('title-case');

const exif = require('./exif');
const mov = require('./mov');


const inferName = ({absolute, meta, stats, checksum}) => {
  const {
    exif: {DateTimeOriginal} = {},
    image: {Make, Model} = {}
  } = meta || {};
  const {birthtime} = stats || {};

  const hasExif = [DateTimeOriginal, Make, Model].every(Boolean);
  const hasStats = [birthtime].every(Boolean);
  const isValid = (hasExif || hasStats) && !!checksum;

  if (isValid) {
    const datenum = +(hasExif ? meta.exif.DateTimeOriginal : birthtime) / 1000;
    const ext = extname(absolute).slice(1).toLowerCase();
    const hash = checksum.slice(0, 8);
    if (hasExif) {
      const make = Make.trim().split(/\s/).shift();
      const camera = [titleCase(make), Model.replace(make, '')]
        .join('')
        .replace(/[^a-zA-Z0-9]+/g, '');
      return `${datenum}-${camera}-${hash}.${ext}`;
    } else {
      return `${datenum}-${hash}.${ext}`;
    }
  } else {
    return null;
  }
};


const scanMedia = ({useExif, useMov, useStat, useMd5}) => (absolute) =>
  Promise.all([
    useExif ? exif(absolute) : null,
    useMov ? mov(absolute) : null,
    useStat ? promisify(stat)(absolute) : null,
    useMd5 ? promisify(md5File)(absolute) : null
  ])
    .then(([meta, movStats, fileStats, checksum]) => {
      const stats = Object.assign({}, fileStats, movStats);
      return ({
        absolute,
        meta,
        stats,
        checksum,
        cannonical: inferName({absolute, meta, stats, checksum}),
        toString: () => absolute
      });
    });

module.exports = scanMedia;
