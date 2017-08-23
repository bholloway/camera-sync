const fs = require('fs');
const {promisify} = require('util');


const checkBirthtime = (buffer) => {
  const header = (offset) => {
    const size = buffer.readUInt32BE(offset);
    const label = buffer.toString('ascii', offset + 4, offset + 8).trim();
    return {label, start: offset + 8, next: offset + size};
  };

  const mdhd = (offset) => {
    const {label, start, next} = header(offset);
    if (label === 'mdhd') {
      const meta = {
        exif: {
          DateTimeOriginal: new Date(buffer.readUInt32BE(start + 4) * 1000 - 2082844800000)
        }
      };
      return {meta};
    } else {
      return {next};
    }
  };

  const mdia = (offset) => {
    const {label, start, next} = header(offset);
    if (label === 'mdia') {
      for (let i = 0, loc = start; (start < next) && (i < 1000); i++) {
        const {next: nextLoc, meta} = mdhd(loc);
        if (meta) {
          return {meta};
        } else {
          loc = nextLoc;
        }
      }
      return undefined;
    } else {
      return {next};
    }
  };

  const trak = (offset) => {
    const {label, start, next} = header(offset);
    if (label === 'trak') {
      for (let i = 0, loc = start; (loc < next); i++) {
        const {next: nextLoc, meta} = mdia(loc);
        if (meta) {
          return {meta};
        } else {
          loc = nextLoc;
        }
      }
      return undefined;
    } else {
      return {next};
    }
  };

  const qt = (offset) => {
    const {label, start} = header(offset);
    const count = buffer.readUInt16BE(start + 6);
    if (label === 'qt') {
      for (let i = 0, loc = start + 12; (i < count) && (loc < buffer.length); i++) {
        const {next: nextLoc, meta} = trak(loc);
        if (meta) {
          return meta;
        } else {
          loc = nextLoc;
        }
      }
    }
    return undefined;
  };

  return qt(12);
};

const mov = (fullPath) =>
  promisify(fs.readFile)(fullPath)
    .then(checkBirthtime);

module.exports = mov;
