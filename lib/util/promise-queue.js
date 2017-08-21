const compose = require('compose-function');

const {passThrough, rethrow, nextTick} = require('./functional-utils');


const createChannel = ({name, trigger}) => {
  const queue = [];

  return {
    get name() {
      return name;
    },
    get length() {
      return queue.length;
    },
    enqueue: (fn) => new Promise((resolve, reject) => {
      queue.push(
        () => Promise.resolve()
          .then(fn)
          .then(resolve)
          .catch(reject)
      );
      // must wait for promise body to execute
      process.nextTick(trigger);
    }),
    dequeue: () => queue.splice(0, 1).pop()
  };
};


const promiseQueue = ({parallelism}) => {
  let numActive = 0;
  const channels = [];

  const complete = passThrough(() => numActive--);

  const trigger = passThrough(() => {
    if (numActive < parallelism) {
      const i = channels.findIndex(({length}) => (length > 0));
      if (i >= 0) {
        numActive++;

        const channel = channels.splice(i, 1).pop();
        channels.push(channel);

        Promise.resolve()
          .then(channel.dequeue())
          .then(compose(nextTick(trigger), complete))
          .catch(compose(rethrow, nextTick(trigger), complete));
      }
    }
  });

  const pushChannel = passThrough((v) => channels.push(v));

  return (name) => (
    channels.find((element) => (element.name === name)) ||
    pushChannel(createChannel({name, trigger}))
  ).enqueue;
};

module.exports = promiseQueue;
