const get = require('lodash.get');
const set = require('lodash.set');
const ProgressBar = require('ascii-progress');

const curryOptions = require('./curry-options');


const DETAILS = '__DETAILS__';

const instances = [];
const entities = {};


const progress = curryOptions(
  {width: 40},
  (options) => {
    const depthFirstRender = (hash, remainingBars) =>
      Object.keys(hash)
        .filter((k) => (k !== DETAILS))
        .reduce((reducedBars, label) => {
          const {labels, completed, total} = hash[label][DETAILS];

          const remainder = 80 - options.width - 1;
          const annotation = `${labels.join(' : ')} (${completed}/${total})`
            .slice(0, remainder);
          const padding = (new Array(29 - annotation.length)).fill(' ').join('');

          reducedBars[0].setSchema(`[:bar] ${annotation}${padding}`);
          reducedBars[0].update(completed / total);

          return depthFirstRender(
            hash[label],
            reducedBars.slice(1)
          );
        }, remainingBars);

    return ({labels, completed, total}) => {

      // find or create
      const path = labels.concat(DETAILS);
      const element = get(entities, path, false);
      if (!element) {
        instances.push(new ProgressBar(options));
      }
      set(entities, path, {labels, completed, total});

      // update in order
      depthFirstRender(entities, instances);
    };
  }
);

module.exports = progress;
