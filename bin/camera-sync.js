#!/usr/bin/env node

const program = require('commander');

const {version, description} = require('../package.json');
const {passThrough} = require('../lib/util/functional-utils');
const {multiline, simple, fileList} = require('../lib/util/format');
const {report: progress, destroy} = require('../lib/util/progress')({width: 40});


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


program
  .command('scan <source>')
  .description('find source files')
  .action((source) =>
    require('../lib/api/scan')({progress})({source})
      .then(passThrough(destroy))
      .then(logStats(multiline(
        simple('source'),
        simple('scan.path'),
        fileList('scan.images'),
        fileList('scan.videos'),
        fileList('scan.others')
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
        simple('list.path'),
        fileList('list.images'),
        fileList('list.videos'),
        fileList('list.others')
      )))
      .catch(onError)
  );

program
  .command('plan <source> <destination>')
  .description('test sync without writing files')
  .action((source, destination) =>
    require('../lib/api/plan')({progress})({source, destination})
      .then(passThrough(destroy))
      .then(logStats(multiline(
        simple('source'),
        simple('scan.path'),
        fileList('scan.images'),
        fileList('scan.videos'),
        fileList('scan.others'),
        simple('destination'),
        simple('list.path'),
        fileList('plan.images'),
        fileList('plan.videos'),
        fileList('plan.errors')
      )))
      .catch(onError)
  );

program
  .command('sync <source> <destination>')
  .description('sync by writing files to the destination')
  .action((source, destination) =>
    require('../lib/api/sync')({progress})({source, destination})
      .then(passThrough(destroy))
      .then(logStats(multiline(
        simple('source'),
        simple('scan.path'),
        fileList('scan.images'),
        fileList('scan.videos'),
        fileList('scan.others'),
        simple('destination'),
        simple('list.path'),
        fileList('plan.images'),
        fileList('plan.videos'),
        fileList('plan.errors'),
        fileList('sync.errors')
      )))
      .catch(onError)
  );

program
  .version(version)
  .description(description)
  .parse(process.argv);
