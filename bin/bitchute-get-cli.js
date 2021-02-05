#!/usr/bin/env node
'use strict';

const Module = require('module');
const bitchute_get = require('../index.js');

const options = process.bitchute_get.options = {
  download: true
}

const args = process.argv.slice(2);
const unknownOptions = [];
let targetIndex = args.length - 1;

for (const argidx in args) {
  const arg = args[argidx];

  if (arg.charAt(0) === '-') {
    targetIndex = parseInt(argidx) + 1;

    let i = 1;
    for (; i < arg.length; i++) {
      const code = arg.charAt(i);
      switch (code) {
        case 'p': { options.download = false; break; }
        default: { unknownOptions.push(code); }
      }
    }
  }
  else {
    break;
  }
}

if (unknownOptions.length === 0 && args.length > 0 && targetIndex < args.length) {
  process.argv = process.argv.filter((e, i) => i < 1 || i > (targetIndex + 1));
  return bitchute_get.main(args[targetIndex]);
}
else if (unknownOptions.length > 0) {
  console.log(`Unknown options: ${unknownOptions.join('')}`);
}
else {
  console.log('Basic usage:');
  console.log('$ bitchute-get {-options} [URL]');
  console.log('\nOptions:');
  console.log(' p - (P)rint only the html video info, no download');
  console.log('\nExample:');
  console.log('$ bitchute-get -p https://www.bitchute.com/video/xxxxxxxxxxx/');
}
