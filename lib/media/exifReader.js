const {readFile} = require('fs');
const {promisify} = require('util');


const sanitiseBytes = (buffer) => new Promise((resolve) => {
  const fileHeader = buffer.toString('hex', 0, 2);
  const isTiff = (fileHeader === '4949');

  // replace header with exif format and standard tiff header
  // else find the exif section
  if (isTiff) {
    const pending = new Buffer(buffer.length);
    (new Buffer('Exif\0')).copy(pending, 0, 0);
    (new Buffer([0x49, 0x49, 0x2a, 0x00])).copy(pending, 6, 0);
    buffer.copy(pending, 10, 4);

    resolve(pending);
  } else {
    const WORKLOAD = 64E+3;
    const LIMIT = buffer.length - 6;

    let pointer = 2;
    let isFound = false;
    let isDone = false;

    const next = () => {
      let i = 0;
      for (; (i < WORKLOAD) && !isDone && !isFound; i++) {
        const appMarker = buffer.toString('hex', pointer - 2, pointer);
        const appHeader = buffer.toString('utf8', pointer + 2, pointer + 6);
        isFound = (appMarker === 'ffe1') && (appHeader === 'Exif');
        isDone = (pointer === LIMIT);
        pointer += !isFound;
      }
      if (isFound) {
        const appDataSize = buffer.readUInt16BE(pointer);
        const appDataStart = pointer + 2;
        const pending = new Buffer(appDataSize);
        buffer.copy(pending, 0, appDataStart, appDataStart + appDataSize);
        resolve(pending);
      } else if (isDone) {
        resolve(null);
      } else {
        setTimeout(next, 10);
      }
    };
    next();
  }
});


const exifReader = (fullPath) =>
  promisify(readFile)(fullPath)
    .then(sanitiseBytes)
    .then((buffer) => buffer && require('exif-reader')(buffer));

module.exports = exifReader;
