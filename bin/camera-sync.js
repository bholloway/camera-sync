#!/usr/bin/env node

const program = require('commander');

const {version, description} = require('../package.json');
const {multiline, simple, fileList} = require('../lib/util/format');
const progress = require('../lib/util/progress');


const onError = (error) => {
  console.error(error);
  process.exit(1);
};


const logStats = (formatter) => (stats) =>
  console.log(formatter(stats));


program
  .command('scan <source>')
  .description('find source files')
  .action((source) =>
    require('../lib/api/scan')({progress})({source})
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
      .then(logStats(multiline(
        simple('source'),
        simple('destination'),
        fileList('others'),
        fileList('updates')
      )))
      .catch(onError)
  );

program
  .version(version)
  .description(description)
  .parse(process.argv);
