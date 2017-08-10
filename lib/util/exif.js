const fs = require('fs');
const {promisify} = require('util');
const exifReader = require('exif-reader');


const sanitiseBytes = buffer => new Promise((resolve) => {
  const header = buffer.toString('hex', 0, 2);
  const isTiff = (header === '4949');

  // replace header with exif format and standard tiff header
  // else find the exif section
  if (isTiff) {
    const pending = new Buffer(buffer.length);
    (new Buffer('Exif\0')).copy(pending, 0, 0);
    (new Buffer([0x49, 0x49, 0x2a, 0x00])).copy(pending, 6, 0);
    buffer.copy(pending, 10, 4);

    return resolve(pending);
  } else {
    let offset = 1;
    let isFound = false;
    for (; (offset < buffer.length) && !isFound; offset++) {
      isFound = (buffer[offset - 1] === 0xFF) && (buffer[offset] === 0xE1);
    }
    if (isFound) {
      const exifLength = buffer.readUInt16BE(offset);
      const exifStart = offset + 2;
      const pending = new Buffer(exifLength);
      buffer.copy(pending, 0, exifStart, exifStart + exifLength);

      return resolve(pending);
    }
  }

  // not valid
  return resolve(null);
});


const exif = fullPath =>
  promisify(fs.readFile)(fullPath)
    .then(sanitiseBytes)
    .then(buffer => buffer && exifReader(buffer));

module.exports = exif;
