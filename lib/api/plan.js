const {basename, join} = require('path');

const promiseLens = require('../functional/promise-lens');
const curryOptions = require('../functional/curry-options');
const categorise = require('../functional/categorise');


const isValid = (listed) => ({cannonical, checksum, birthtime}) => {
  const {checksum: actualChecksum, birthtime: actualBirthtime} = listed
    .find(({absolute}) => (basename(absolute) === cannonical)) || {};

  return (actualChecksum === checksum) && (+actualBirthtime === +birthtime);
};


const isInvalid = (listed) => (args) =>
  !isValid(listed)(args);


const plan = curryOptions(
  {parallelism: 16, progress: null, whitelist: []},
  (options) => (args, {merge, lens} = promiseLens(options)) =>
    Promise.resolve(args)
      .then(merge(
        require('./scan')(options),
        require('./list')(options)
      ))
      .then(lens({from: '*', to: 'plan'})(
        ({
          scan: {images: scanImg, videos: scanVid},
          list: {base, images: listImg, videos: listVid}
        }) => categorise({
          base,
          present: isValid(listImg.concat(listVid)),
          pending: isInvalid(listImg.concat(listVid))
        })(scanImg.concat(scanVid))
      ))
      .then(lens({from: 'plan'})(
        lens({from: '*', to: 'pending'})(
          ({base, pending}) => pending
            .map(({absolute, cannonical, checksum, birthtime}) => ({
              cannonical,
              checksum,
              birthtime,
              source: absolute,
              destination: join(base, cannonical),
              toString: () => cannonical
            }))
        )
      ))
);

module.exports = plan;
