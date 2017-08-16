const test = require('./plan');
const {lens} = require('../util/promise-lens')({
  parallelism: 8,
  progress: (info) => console.log(String(info))
});


const sync = (args) =>
  Promise.resolve(args)
    .then(test)
    .then(lens({from: '*', to: 'sync'})(
      ({source, destination, updates, others}) => {
        console.log('sync', {source, destination, updates, others});

        return Object.assign({}, args, {source, destination, updates, others});
      }
    ));

module.exports = sync;
