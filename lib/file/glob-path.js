const {sep} = require('path');
const {promisify} = require('util');
const glob = require('glob');


const globPath = (path) =>
  promisify(glob)(`${path}/**/*`, {nodir: true})
    .then((files) => files.map((posix) => posix.replace(/\//g, sep)));

module.exports = globPath;
