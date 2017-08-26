const crypto = require('crypto');
const fs = require('fs');


const hashFile = ({hashName, bufferSize}) => (absolute) =>
  new Promise((resolve, reject) => {
    const input = fs.createReadStream(absolute, {highWaterMark: bufferSize});
    input.on('error', (err) => reject(err));

    const output = crypto.createHash(hashName);
    output.once('readable', () => {
      resolve(output.read().toString('hex'));
    });

    input.pipe(output);
  });

module.exports = hashFile;
