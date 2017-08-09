const test = require('./test');

const sync = args =>
  test(args)
    .then(({source, destination, writes, others}) => {
      console.log('sync', {source, destination, writes, others});
      return Object.assign({}, args, {source, destination, writes, others});
    });

module.exports = sync;
