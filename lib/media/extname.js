const {extname} = require('path');

const imageExtensions = require('image-extensions').concat('orf');

exports.imageExtensions = imageExtensions;


const videoExtensions = require('video-extensions');

exports.videoExtensions = videoExtensions;


const toExt = (file) =>
  extname(file).slice(1).toLowerCase();

exports.toExt = toExt;


const isImage = (file) =>
  imageExtensions.includes(toExt(file));

exports.isImage = isImage;


const isVideo = (file) =>
  videoExtensions.includes(toExt(file));

exports.isVideo = isVideo;


const isMedia = (file) =>
  isImage(file) || isVideo(file);

exports.isMedia = isMedia;


const isOther = (file) =>
  !isMedia(file);

exports.isOther = isOther;
