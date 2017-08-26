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


program
  .command('scan <source>')
  .description('find source files')
  .option('-m --useMeta', 'Require metadata for the cannonical filename')
  .action((source, {useMeta}) =>
    require('../lib/api/scan')({progress, useMeta})({source})
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
  .action((destination) =>
    require('../lib/api/list')({progress})({destination})
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
  .option('-m --useMeta', 'use metadata in the cannonical filename')
  .option('-w --whitelist [ext]', 'allow files that dont have metadata', collect, [])
  .action((source, destination, {whitelist, useMeta}) =>
    require('../lib/api/plan')({progress, whitelist, useMeta})({source, destination})
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
  .option('-m --useMeta', 'use metadata in the cannonical filename')
  .option('-w --whitelist [ext]', 'allow files that dont have metadata', collect, [])
  .action((source, destination, {whitelist, useMeta}) =>
    require('../lib/api/sync')({progress, whitelist, useMeta})({source, destination})
      .then(passThrough(destroy))
      .then(logStats(multiline(
        simple('source'),
        simple('scan.path'),
        fileList('scan.images'),
        fileList('scan.videos'),
        fileList('scan.others'),
        blankline(),
        simple('destination'),
        simple('plan.base'),
        fileList('plan.pending'),
        fileList('plan.present'),
        fileList('sync.errors')
      )))
      .catch(onError)
  );

program
  .version(version)
  .description(description)
  .parse(process.argv);
