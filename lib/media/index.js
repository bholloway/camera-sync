const {extname} = require('path');
const {stat} = require('fs');
const {promisify} = require('util');
const md5File = require('md5-file');
const titleCase = require('title-case');
const merge = require('lodash.merge');

const exif = require('./exif');
const mov = require('./mov');


const toUTC = (localDate) =>
  new Date(localDate - localDate.getTimezoneOffset() * 60000);


const inferName = ({absolute, meta, birthtime, checksum}) => {
  const {
    exif: {DateTimeOriginal} = {},
    image: {Make, Model} = {}
  } = meta || {};

  const hasMakeModel = !!Make && !!Model;
  const hasBirthtime = !!DateTimeOriginal || !!birthtime;
  const hasChecksum = !!checksum;

  if (hasBirthtime && hasChecksum) {
    const utcDatenum = (+DateTimeOriginal || +toUTC(birthtime)) / 1000;
    const ext = extname(absolute).slice(1).toLowerCase();
    const hash = checksum.slice(0, 8);
    if (hasMakeModel) {
      const make = Make.trim().split(/\s/).shift();
      const camera = [titleCase(make), Model.replace(make, '')]
        .join('')
        .replace(/[^a-zA-Z0-9]+/g, '');
      return `${utcDatenum}-${camera}-${hash}.${ext}`;
    } else {
      return `${utcDatenum}-${hash}.${ext}`;
    }
  } else {
    return null;
  }
};


const scanMedia = ({useExif, useMov, useStat}) => (absolute) =>
  Promise.all([
    useExif && exif(absolute),
    useMov && mov(absolute),
    promisify(stat)(absolute),
    promisify(md5File)(absolute)
  ])
    .then(([exifMeta, movMeta, {birthtime}, checksum]) => {
      const meta = merge({}, exifMeta, movMeta);
      const cannonical = inferName({absolute, meta, birthtime: useStat && birthtime, checksum});
      return ({
        absolute,
        birthtime,
        checksum,
        cannonical,
        toString: () => absolute
      });
    });

module.exports = scanMedia;
