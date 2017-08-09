#!/usr/bin/env node

const program = require('commander');

const {version, description} = require('../package.json');
const {multiline, simple, fileList} = require('../lib/util/format');


const onError = (error) => {
  console.error(error);
  process.exit(1);
};


const logStats = formatter => stats =>
  console.log(formatter(stats));


program
  .command('scan <source>')
  .description('find source files')
  .action(source =>
    require('../lib/api/scan')({source})
      .then(logStats(multiline(
        simple('source'),
        fileList('images'),
        fileList('videos'),
        fileList('others')
      )))
      .catch(onError)
  );

program
  .command('test <source> <destination>')
  .description('test sync without writing files')
  .action((source, destination) =>
    require('../lib/api/test')({source, destination})
      .then(logStats(multiline(
        simple('source'),
        simple('destination'),
        fileList('others'),
        fileList('updates')
      )))
      .catch(onError)
  );

program
  .command('sync <source> <destination>')
  .description('sync by writing files to the destination')
  .action((source, destination) =>
    require('../lib/api/sync')({source, destination})
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
