const {lens, merge} = require('../util/promise-lens');


const plan = args =>
  Promise.resolve(args)
    .then(merge(
      require('./scan'),
      require('./list')
    ));

module.exports = plan;
