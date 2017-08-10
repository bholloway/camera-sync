const path = require('path');

const imageExtensions = require('image-extensions').concat('orf');
const videoExtensions = require('video-extensions');


const toExt = file =>
  path.extname(file).slice(1).toLowerCase();

exports.toExt = toExt;


const isImage = file =>
  imageExtensions.includes(toExt(file));

exports.isImage = isImage;


const isVideo = file =>
  videoExtensions.includes(toExt(file));

exports.isVideo = isVideo;


const isMedia = file =>
  isImage(file) || isVideo(file);

exports.isMedia = isMedia;


const isOther = file =>
  !isMedia(file);

exports.isOther = isOther;
