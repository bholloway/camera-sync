const path = require('path');

const promiseLens = require('../util/promise-lens');
const curryOptions = require('../util/curry-options');
const categorise = require('../util/categorise');


const isValid = (listed) => ({cannonical, checksum}) => {
  const element = listed.find(({absolute}) => (path.basename(absolute) === cannonical));
  return !!element && (element.checksum === checksum);
};


const isInvalid = (listed) => (args) =>
  !isValid(listed)(args);


const plan = curryOptions(
  {parallelism: 16, progress: null},
  (options) => (args, {merge, lens} = promiseLens(options)) =>
    Promise.resolve(args)
      .then(merge(
        require('./scan'),
        require('./list')
      ))
      .then(lens({from: '*', to: 'plan'})(
        ({
          scan: {images: scanImg, videos: scanVid},
          list: {base, images: listImg, videos: listVid}
        }) => categorise({
          present: isValid(listImg.concat(listVid)),
          pending: isInvalid(listImg.concat(listVid)),
          base
        })(scanImg.concat(scanVid))
      ))
      .then(lens({from: 'plan'})(
        lens({from: '*', to: 'pending'})(
          ({base, pending}) => pending
            .map(({absolute, cannonical, checksum, stats: {birthtime}}) => ({
              cannonical,
              checksum,
              birthtime,
              source: absolute,
              destination: path.join(base, cannonical),
              toString: () => cannonical
            }))
        )
      ))
);

module.exports = plan;
