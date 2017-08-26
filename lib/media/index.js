const {extname} = require('path');
const {stat} = require('fs');
const {promisify} = require('util');
const titleCase = require('title-case');

const cryptoFile = require('../file/hash-file');


const fromSec = (seconds) =>
  seconds * 1000;


const fromMin = (minutes) =>
  fromSec(minutes * 60);


const getMultiplierMap = (i, n) =>
  ((new Array(n)).fill('0') + Number(i).toString(3))
    .slice(-n)
    .split('')
    .map((char) => ((char === '1') ? -1 : (char === '2') ? +1 : 0));


const permuteOffsets = (reference) => {
  const keys = Object.keys(reference);

  return (new Array(3 ** keys.length))
    .fill(0)
    .map((_, i) => {
      const multipliers = getMultiplierMap(i, keys.length);

      const m = multipliers
        .reduce((reduced, multiplier, j) => Object.assign(reduced, {
          [keys[j]]: multiplier
        }), {});

      const v = multipliers
        .reduce((reduced, multiplier, j) => reduced + multiplier * reference[keys[j]], 0);

      return {m, v};
    });
};


const validateDates = ({createdDate, fileDate, duration = 0}) => {
  const permittedOffsets = permuteOffsets({
    timezone: fromMin(fileDate.getTimezoneOffset()),
    dst: fromMin(60),
    duration: fromSec(duration)
  });

  const candidateUTCs = permittedOffsets
    .map(({m, v: offset}) => ({m, v: new Date((+fileDate) + offset)}));

  const errorMap = candidateUTCs
    .map(({m, v: candidate}) => ({m, v: Math.abs((+candidate) - (+createdDate))}));

  const minError = errorMap
    .reduce((min, {v: err}) => Math.min(min, err), Number.MAX_SAFE_INTEGER);

  if (minError < 3000) {
    const {m} = candidateUTCs.find((_, i) => (errorMap[i].v === minError)) || {};
    return m;
  } else {
    return null;
  }
};


const validateMeta = ([meta, {birthtime}]) => {
  const {
    exif: {DateTimeOriginal: createdDate, Duration: duration} = {},
    image: {Make, Model} = {}
  } = meta || {};

  const dateInfo = validateDates({fileDate: birthtime, createdDate, duration});

  if (!dateInfo) {
    return {birthtime};
  } else if (!Make || !Model) {
    return {createdDate, dateInfo, birthtime};
  } else {
    const make = Make.trim().split(/\s/).shift();
    const makeModel = [titleCase(make), Model.replace(make, '')]
      .join('')
      .replace(/[^a-zA-Z0-9]+/g, '');

    return {createdDate, dateInfo, birthtime, makeModel};
  }
};


const name = ({absolute, date, makeModel, checksum}) => {
  const datenum = Math.round(+date / 1000);
  const hash = checksum.slice(0, 12);
  const basename = [datenum, makeModel, hash].filter(Boolean).join('-');
  const ext = extname(absolute).slice(1).toLowerCase();
  return `${basename}.${ext}`;
};


const scanMedia = (exifFn, {whitelist = [], useMeta = false} = {}) =>
  (absolute) =>
    Promise.all([
      Promise.all([
        useMeta && exifFn(absolute),
        promisify(stat)(absolute),
      ]).then(validateMeta),

      cryptoFile('sha256')(absolute)
    ])
      .then(([{createdDate, dateInfo, makeModel, birthtime}, checksum]) => {
        const ext = extname(absolute).slice(1).toLowerCase();
        const date = useMeta ?
          (dateInfo ? createdDate : whitelist.includes(ext) ? birthtime : null) :
          birthtime;
        const canonical = date ? name({absolute, date, makeModel, checksum}) : null;
        const toString = () => absolute;

        return {absolute, createdDate, dateInfo, birthtime, checksum, canonical, toString};
      });


module.exports = Object.assign({
  scanMedia,
  exif: require('./exifReader'),
  mp4: require('./mp4'),
}, require('./extname'));
