const os = require('os');
const spawn = require('cross-spawn');


const getCommand = ({
  darwin: ({source, destination}) => ['cp', ['-p', source, destination], {}],
  win32: ({source, destination}) => ['robocopy', [source, destination], {}]
})[os.platform()];


const copyFile = (args) =>
  new Promise((resolve, reject) => {
    const cp = spawn(...getCommand(args))
      .on('close', resolve);
    cp.stdout
      .on('data', (data) => {
        resolve(data.toString());
      });
    cp.stderr
      .on('data', (data) => {
        reject(new Error(data.toString()));
      });
  })
    .catch((error) => error.message);

module.exports = copyFile;
