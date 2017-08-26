const crypto = require('crypto');
const fs = require('fs');


const hashFile = (hashname) => (absolute) =>
  new Promise((resolve, reject) => {
    const input = fs.createReadStream(absolute);
    input.on('error', (err) => reject(err));

    const output = crypto.createHash(hashname);
    output.once('readable', () => {
      resolve(output.read().toString('hex'));
    });

    input.pipe(output);
  });

module.exports = hashFile;
