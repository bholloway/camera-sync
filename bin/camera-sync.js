#!/usr/bin/env node

const path = require('path');
const program = require('commander');

const {version, description} = require('../package.json');

const onStats = ({source, destination, images, videos, others, writes}) => {
  const format = (list) => {
    const text = list
      .map(fullName => path.basename(fullName))
      .join(', ')
      .slice(0, 60);

    return (text.length === 60) ? text.replace(/[^,]*$/, ' ...') : text;
  };

  const message = [
    `source     : ${source}`,
    `destination: ${destination || '-'}`,
    images && `images     : (${images.length}) ${format(images)}`,
    videos && `videos     : (${videos.length}) ${format(videos)}`,
    others && `others     : (${others.length}) ${format(others)}`,
    writes && `writes     : (${writes.length}) ${format(writes)}`
  ]
    .filter(Boolean)
    .join('\n');

  console.log(message);
};

const onError = (error) => {
  console.error(error.message);
  process.exit(1);
};

program
  .command('scan <source>')
  .description('find source files')
  .action(source =>
    require('../lib/scan')({source})
      .then(onStats)
      .catch(onError)
  );

program
  .command('test <source> <destination>')
  .description('test sync without writing files')
  .action((source, destination) =>
    require('../lib/test')({source, destination})
      .then(onStats)
      .catch(onError)
  );

program
  .command('sync <source> <destination>')
  .description('sync by writing files to the destination')
  .action((source, destination) =>
    require('../lib/sync')({source, destination})
      .then(onStats)
      .catch(onError)
  );

program
  .version(version)
  .description(description)
  .parse(process.argv);
