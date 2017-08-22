const {basename} = require('path');
const get = require('lodash.get');


const truncate = (textOrFn) => (length, ...args) => {
  const text = (typeof textOrFn === 'function') ? textOrFn(...args) : String(textOrFn);
  return (text.length > length) ? `${text.slice(0, length - 4)} ...` : text;
};


const pad = (textOrFn) => (length, ...args) => {
  const text = (typeof textOrFn === 'function') ? textOrFn(...args) : String(textOrFn);
  const padding = (new Array(length - text.length)).fill(' ').join('');
  return `${text}${padding}`;
};


const literal = (key) => ({
  length: key.length,
  render: truncate(key)
});


const lookup = (key, formatter) => ({
  length: Number.MAX_SAFE_INTEGER,
  render: truncate((hash) => (formatter ? formatter(get(hash, key)) : get(hash, key)))
});


const safeBasename = (v) =>
  (/\//.test(v) ? basename(v) : v);


exports.text = (value) => ({
  length: String(value).length,
  render: () => String(value)
});


exports.blankline = () =>
  exports.text('');


exports.simple = (label) => ([
  literal(label),
  lookup(label)
]);


exports.fileList = (label) => ([
  literal(label),
  lookup(label, (list) => (list ?
    `(${list.length}) ${list.map(String).map(safeBasename).join(', ')}` :
    '-')
  )
]);


exports.multiline = (...lines) => {
  const width0 = lines
    .reduce((max, columns) => {
      const [first] = [].concat(columns);
      return Math.max(max, first.length);
    }, 0);

  const widths = [width0, 80 - width0];
  return (hash) => lines
    .map((columns) => [].concat(columns)
      .map((column, i) => column.render(widths[i], hash))
      .map((text, i) => pad(text)(widths[i]))
      .join(': ')
    )
    .join('\n');
};
