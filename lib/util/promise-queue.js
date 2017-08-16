const compose = require('compose-function');


const passThrough = fn => (v) => {
  fn(v);
  return v;
};


const rethrow = (error) => {
  throw error;
};


const nextTick = fn =>
  passThrough(() => process.nextTick(fn));


const createChannel = ({name, trigger}) => {
  const queue = [];

  return {
    get name() {
      return name;
    },
    get length() {
      return queue.length;
    },
    enqueue: fn => new Promise(compose(
      (resolve, reject) => queue.push(
        () => Promise.resolve()
          .then(fn)
          .then(resolve)
          .catch(reject)
      ),
      nextTick(trigger)
    )),
    dequeue: () => queue.splice(0, 1).pop()
  };
};


const promiseQueue = ({parallelism}) => {
  let numActive = 0;
  const channels = [];

  const begin = passThrough(() => numActive++);

  const complete = passThrough(() => numActive--);

  const trigger = passThrough(() => {
    if (numActive < parallelism) {
      const i = channels.findIndex(({length}) => (length > 0));
      if (i >= 0) {
        const channel = channels.splice(i, 1).pop();
        channels.push(channel);

        Promise.resolve()
          .then(begin)
          .then(channel.dequeue())
          .then(compose(nextTick(trigger), complete))
          .catch(compose(rethrow, nextTick(trigger), complete));
      }
    }
  });

  return name => (
    channels.find(element => (element.name === name)) ||
    passThrough(v => channels.push(v))(createChannel({name, trigger}))
  ).enqueue;
};

module.exports = promiseQueue;
