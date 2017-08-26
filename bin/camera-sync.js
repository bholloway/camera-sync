#!/usr/bin/env node

const program = require('commander');

const {version, description} = require('../package.json');
const {passThrough} = require('../lib/functional/misc');
const {multiline, blankline, simple, fileList} = require('../lib/cli/format');
const {report: progress, destroy} = require('../lib/cli/progress')({
  width: 60,
  clear: true
});


const onExit = () => {
  destroy();
  process.nextTick(() => process.exit(1));
};

const onError = (error) => {
  onExit();
  console.error(error);
};

const logStats = (formatter) => (stats) =>
  console.log(formatter(stats));

process.on('SIGINT', onExit);

process.on('unhandledRejection', (error) => {
  throw error;
});

const collect = (val, memo) => {
  memo.push(val);
  return memo;
};

const deriveOptions = ({memory, parallelism, whitelist, useMeta}) => ({
  progress,
  parallelism,
  whitelist,
  useMeta,
  bufferSize: memory * 1E+6 / parallelism
});


program
  .command('scan <source>')
  .description('find source files')
  .option('-p --parallelism', 'maximum parallel tasks (such as file operations)')
  .option('-m --memory', 'file buffer in megabytes')
  .option('-m --useMeta', 'use metadata in the canonical filename')
  .action((source, options) =>
    require('../lib/api/scan')(
      deriveOptions(options)
    )({
      source,
    })
      .then(passThrough(destroy))
      .then(logStats(multiline(
        simple('source'),
        simple('scan.path'),
        fileList('scan.images'),
        fileList('scan.videos'),
        fileList('scan.others'),
        fileList('scan.errors')
      )))
      .catch(onError)
  );

program
  .command('list <destination>')
  .description('list existing files in the destination')
  .option('-p --parallelism', 'maximum parallel tasks (such as file operations)')
  .option('-m --memory', 'file buffer in megabytes')
  .action((destination, options) =>
    require('../lib/api/list')(
      deriveOptions(options)
    )({
      destination
    })
      .then(passThrough(destroy))
      .then(logStats(multiline(
        simple('destination'),
        simple('list.base'),
        fileList('list.images'),
        fileList('list.videos'),
        fileList('list.others')
      )))
      .catch(onError)
  );

program
  .command('plan <source> <destination>')
  .description('test sync without writing files')
  .option('-p --parallelism', 'maximum parallel tasks (such as file operations)')
  .option('-m --memory', 'file buffer in megabytes')
  .option('-m --useMeta', 'use metadata in the canonical filename')
  .option('-w --whitelist [ext]', 'allow files that dont have metadata', collect, [])
  .action((source, destination, options) =>
    require('../lib/api/plan')(
      deriveOptions(options)
    )({
      source,
      destination
    })
      .then(passThrough(destroy))
      .then(logStats(multiline(
        simple('source'),
        simple('scan.path'),
        fileList('scan.images'),
        fileList('scan.videos'),
        fileList('scan.others'),
        fileList('scan.errors'),
        blankline(),
        simple('destination'),
        simple('plan.base'),
        fileList('plan.pending'),
        fileList('plan.present')
      )))
      .catch(onError)
  );

program
  .command('sync <source> <destination>')
  .description('sync by writing files to the destination')
  .option('-p --parallelism', 'maximum parallel tasks (such as file operations)')
  .option('-m --memory', 'file buffer in megabytes')
  .option('-m --useMeta', 'use metadata in the canonical filename')
  .option('-w --whitelist [ext]', 'allow files that dont have metadata', collect, [])
  .action((source, destination, options) =>
    require('../lib/api/sync')(
      deriveOptions(options)
    )({
      source,
      destination
    })
      .then(passThrough(destroy))
      .then(logStats(multiline(
        simple('source'),
        simple('scan.path'),
        fileList('scan.images'),
        fileList('scan.videos'),
        fileList('scan.others'),
        fileList('scan.errors'),
        blankline(),
        simple('destination'),
        simple('plan.base'),
        fileList('plan.pending'),
        fileList('plan.present'),
        blankline(),
        fileList('sync.errors')
      )))
      .catch(onError)
  );

program
  .version(version)
  .description(description)
  .parse(process.argv);
