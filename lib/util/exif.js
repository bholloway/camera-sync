const fs = require('fs');
const {promisify} = require('util');
const exifReader = require('exif-reader');


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

    return resolve(pending);
  } else {
    let pointer = 2;
    let isFound = false;
    for (; (pointer < buffer.length - 6) && !isFound; pointer += !isFound) {
      const appMarker = buffer.toString('hex', pointer - 2, pointer);
      const appHeader = buffer.toString('utf8', pointer + 2, pointer + 6);
      isFound = (appMarker === 'ffe1') && (appHeader === 'Exif');
    }
    if (isFound) {
      const appDataSize = buffer.readUInt16BE(pointer);
      const appDataStart = pointer + 2;
      const pending = new Buffer(appDataSize);
      buffer.copy(pending, 0, appDataStart, appDataStart + appDataSize);
      return resolve(pending);
    }
  }

  // not valid
  return resolve(null);
});


const exif = (fullPath) =>
  promisify(fs.readFile)(fullPath)
    .then(sanitiseBytes)
    .then((buffer) => buffer && exifReader(buffer));

module.exports = exif;
