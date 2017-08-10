const scan = require('./scan');
const list = require('./list');
const {merge} = require('../util/promise-lens');


const plan = args =>
  Promise.resolve(args)
    .then(merge(
      list,
      scan
    ));

module.exports = plan;
