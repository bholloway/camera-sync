const {readdir} = require('fs');
const {promisify} = require('util');

const assertDirectory = require('../util/assert');
const {lens} = require('../util/promise-lens');
const categorise = require('../util/categorise');
const {isMedia, isOther} = require('../util/extname');


const onBadDestination = (error) => {
  throw new Error(`error: destination ${error.message}`);
};


const list = args =>
  Promise.resolve(args)
    .then(lens('destination')(destination => assertDirectory(destination).catch(onBadDestination)))
    .then(lens('destination', '*')(destination =>
      Promise.resolve(destination)
        .then(promisify(readdir))
        .then(categorise({
          existing: isMedia,
          others: isOther
        }))
    ));

module.exports = list;
