const os = require('os');
const spawn = require('cross-spawn');


const getCommand = ({
  darwin: ({source, destination}) => ['cp', ['-p', source, destination], {}],
  win32: ({source, destination}) => ['cmd', ['/C', 'copy', source, destination], {}]
})[os.platform()];


const copyFile = (args) =>
  new Promise((resolve, reject) => {
    const cp = spawn(...getCommand(args));

    const stdout = [];
    cp.stdout
      .on('data', (data) => {
        stdout.push(data.toString());
      })
      .on('end', () => {
        resolve(stdout.join(''));
      });

    const stderr = [];
    cp.stderr
      .on('data', (data) => {
        stderr.push(data.toString());
      })
      .on('end', () => {
        reject(stderr.join(''));
      });
  })
    .catch((error) => error.message);

module.exports = copyFile;
