const scan = require('./scan');
const assertDirectory = require('./assert');


const onBadDestination = (error) => {
  throw new Error(`error: destination ${error.message}`);
};


const test = args =>
  Promise.all([
    scan(args),
    assertDirectory(args.destination).catch(onBadDestination)
  ])
    .then(([{source, images, videos, others}, destination]) => {
      console.log('test', {source, destination, images, videos, others});
      return Object.assign({}, args, {source, destination, images, videos, others});
    });

module.exports = test;
