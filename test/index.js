const test = require('tape');
const {gen, check} = require('tape-check');
const {sync: globSync} = require('glob');
const {promisify} = require('util');
const {stat} = require('fs');

const mp4 = require('../lib/media/mp4');
const exif = require('../lib/media/exifReader');
const {imageExtensions, videoExtensions} = require('../lib/media/extname');


const allowableOffsets = (date) => [
  0,
  date.getTimezoneOffset() * 60,
  60 * 60,
  date.getTimezoneOffset() * 60 + (60 * 60),
  date.getTimezoneOffset() * 60 - (60 * 60)
];


const glob = (pattern) => {
  const list = globSync(`${__dirname}/source/${pattern}`, {nocase: true});
  return [{times: list.length * 10}, gen.oneOf(list)];
};


test('mp4/mov DateTimeOriginal', check(
  ...glob(`*.@(${videoExtensions.join('|')})`),
  (t, filename) =>
    Promise.all([
      mp4(filename),
      promisify(stat)(filename)
    ])
      .then((args) =>
        Promise.resolve(args)
          .then(([meta, {birthtime}]) => {
            const {exif: {DateTimeOriginal, Duration} = {}} = meta || {};
            t.ok(
              DateTimeOriginal,
              'should extract DateTimeOriginal from the file'
            );

            t.ok(
              Duration,
              'should extract Duration from the file'
            );

            const diff = birthtime / 1000 - DateTimeOriginal / 1000 - Duration;
            t.ok(
              allowableOffsets(birthtime).some((offset) => (diff + offset) < 5),
              'shutter + duration should match file birthtime (allowing for timezone) within 5 sec'
            );
          })
          .catch((error) => t.fail(error.message))
          .then(() => t.end())
      )
));

test('exif DateTimeOriginal', check(
  ...glob(`*.@(${imageExtensions.join('|')})`),
  (t, filename) =>
    Promise.all([
      exif(filename),
      promisify(stat)(filename)
    ])
      .then((args) =>
        Promise.resolve(args)
          .then(([meta, {birthtime}]) => {
            const {exif: {DateTimeOriginal} = {}} = meta || {};
            t.ok(
              DateTimeOriginal,
              'should extract DateTimeOriginal from the file'
            );

            const diff = birthtime / 1000 - DateTimeOriginal / 1000;
            t.ok(
              allowableOffsets(birthtime).some((offset) => (diff + offset) < 5),
              'shutter should match file birthtime (allowing for timezone) within 5 sec'
            );
          })
          .catch((error) => t.fail(error.message))
          .then(() => t.end())
      )
));
