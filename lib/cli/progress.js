const set = require('lodash.set');
const ProgressBar = require('progress');


const DETAILS = '__DETAILS__';

const instances = [];
const entities = {};


const sumEachKey = (...objects) => objects
  .reduce(
    (reduced1, obj) => Object.keys(obj)
      .reduce(
        (reduced2, k) => Object.assign(reduced2, {
          [k]: (reduced2[k] || 0) + obj[k]
        }),
        reduced1
      ),
    {}
  );


const progress = (options) => {
  let isDestroyed = false;

  const render = (hash) =>
    Object.keys(hash)
      .reduce((reduced, key, i, keys) => {
        if (key !== DETAILS) {
          return sumEachKey(reduced, render(hash[key]));
        } else if (keys.length > 1) {
          return reduced;
        } else {
          const {completed: curr, total} = hash[DETAILS];
          return sumEachKey(reduced, {curr, total});
        }
      }, {curr: 0, total: 0});

  const report = ({labels, completed, total}) => {
    if (!isDestroyed) {
      const path = labels.concat(DETAILS);
      set(entities, path, {labels, completed, total});

      if (!instances.length) {
        instances.push(
          new ProgressBar('[:bar] :current / :total', Object.assign({total: 1}, options))
        );
      }

      const instance = instances[0];
      Object.assign(instance, render(entities));
      instance.render();
    }
  };

  const destroy = () => {
    isDestroyed = true;

    Object.keys(entities)
      .forEach((k) => delete entities[k]);

    instances.splice(0, instances.length)
      .forEach((instance) => instance.terminate());
  };

  return {report, destroy};
};

module.exports = progress;
