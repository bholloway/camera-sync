const {readFile} = require('fs');
const {promisify} = require('util');
const {MP4Box} = require('mp4box');


const mp4Box = (arrayBuffer) =>
  new Promise((resolve, reject) => {
    const mp4box = new MP4Box();
    mp4box.onError = (error) => reject(error);
    mp4box.onReady = (info) => resolve(info);
    mp4box.appendBuffer(Object.assign(arrayBuffer, {fileStart: 0}));
    mp4box.flush();
  });


const toExif = ({duration, timescale, created}) => ({
  exif: {
    DateTimeOriginal: created,
    Duration: duration / timescale
  }
});


const mp4 = (fullPath) =>
  promisify(readFile)(fullPath)
    .then(({buffer}) => buffer)
    .then(mp4Box)
    .then(toExif);

module.exports = mp4;
