const test = require('./test');

const sync = args =>
  test(args)
    .then(({source, destination, updates, others}) => {
      console.log('sync', {source, destination, updates, others});
      return Object.assign({}, args, {source, destination, updates, others});
    });

module.exports = sync;
