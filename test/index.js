const test = require('tape');
const {gen, check} = require('tape-check');
const {sync: globSync} = require('glob');
const {promisify} = require('util');
const {stat} = require('fs');

const mov = require('../lib/media/mov');
const exif = require('../lib/media/exif');
const {imageExtensions} = require('../lib/media/extname');


const toUTC = (localDate) =>
  new Date(localDate - localDate.getTimezoneOffset() * 60000);


const glob = (pattern) => {
  const list = globSync(`${__dirname}/source/${pattern}`, {nocase: true});
  return [{times: list.length}, gen.oneOf(list)];
};


const assertDateTimeOriginal = (t) => (args) =>
  Promise.resolve(args)
    .then(([meta, {birthtime}]) => {
      const {exif: {DateTimeOriginal} = {}} = meta || {};
      t.ok(
        DateTimeOriginal,
        'should extract DateTimeOriginal from the file'
      );

      const diff = Math.abs(+DateTimeOriginal - toUTC(birthtime)) / 1000;
      t.ok(
        diff < 30,
        `DateTimeOriginal as UTC should match file birthtime as Local to within 30sec (${diff} sec)`
      );
    })
    .catch((error) => t.fail(error.message))
    .then(() => t.end());

test('mov DateTimeOriginal', check(
  ...glob('*.mov'),
  (t, filename) =>
    Promise.all([
      mov(filename),
      promisify(stat)(filename)
    ])
      .then(assertDateTimeOriginal(t))
));

test('mp4 DateTimeOriginal', check(
  ...glob('*.mp4'),
  (t, filename) =>
    Promise.all([
      mov(filename),
      promisify(stat)(filename)
    ])
      .then(assertDateTimeOriginal(t))
));

test('avi DateTimeOriginal', check(
  ...glob('*.avi'),
  (t, filename) =>
    Promise.all([
      mov(filename),
      promisify(stat)(filename)
    ])
      .then(assertDateTimeOriginal(t))
));

test('exif DateTimeOriginal', check(
  ...glob(`*.@(${imageExtensions.join('|')})`),
  (t, filename) =>
    Promise.all([
      exif(filename),
      promisify(stat)(filename)
    ])
      .then(assertDateTimeOriginal(t))
));
