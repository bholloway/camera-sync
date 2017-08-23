const {extname} = require('path');
const {stat} = require('fs');
const {promisify} = require('util');
const md5File = require('md5-file');
const titleCase = require('title-case');

const exif = require('./exif');
const mov = require('./mov');


const inferName = ({absolute, meta, birthtimeMs, checksum}) => {
  const {
    exif: {DateTimeOriginal} = {},
    image: {Make, Model} = {}
  } = meta || {};

  const hasMakeModel = !!Make && !!Model;
  const hasBirthtime = !!DateTimeOriginal || !!birthtimeMs;
  const hasChecksum = !!checksum;

  if (hasBirthtime && hasChecksum) {
    const datenum = (DateTimeOriginal ? +DateTimeOriginal : birthtimeMs) / 1000;
    const ext = extname(absolute).slice(1).toLowerCase();
    const hash = checksum.slice(0, 8);
    if (hasMakeModel) {
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


const scanMedia = ({useExif, useMov, useStat}) => (absolute) =>
  Promise.all([
    useExif ? exif(absolute) : null,
    useMov ? mov(absolute) : null,
    promisify(stat)(absolute),
    promisify(md5File)(absolute)
  ])
    .then(([meta, movStats, fileStats, checksum]) => {
      const {birthtimeMs} = Object.assign({}, useStat && fileStats, movStats);
      return ({
        absolute,
        birthtimeMs,
        checksum,
        cannonical: inferName({absolute, meta, birthtimeMs, checksum}),
        toString: () => absolute
      });
    });

module.exports = scanMedia;
