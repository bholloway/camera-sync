const path = require('path');
const {exists, stat} = require('fs');
const {promisify} = require('util');


const assertDirectory = (shortPath) => {
  const fullPath = (typeof shortPath === 'string') ? path.resolve(shortPath) : null;

  const throwError = () => {
    throw new Error(`"${fullPath}" not a directory`);
  };

  return fullPath ?
    promisify(exists)(fullPath)
      .then(isFound => isFound || throwError())
      .then(() => promisify(stat)(fullPath))
      .then(stats => stats.isDirectory() || throwError())
      .then(() => fullPath) :
    Promise.reject(new Error('not specified'));
};

module.exports = assertDirectory;
