'use strict';

const url = require('url');
const path = require('path');
const https = require('https');
const { parse } = require('node-html-parser');
const { decode } = require('html-entities');
const { DownloaderHelper } = require('node-downloader-helper');
const moment = require('moment');
const cliProgress = require('cli-progress');

process.bitchute_get = {
};

// https://gist.github.com/thomseddon/3511330
const byteHelper = function (value) {
  if (value === 0) {
      return '0 b';
  }
  const units = ['b', 'kB', 'MB', 'GB', 'TB'];
  const number = Math.floor(Math.log(value) / Math.log(1024));
  return (value / Math.pow(1024, Math.floor(number))).toFixed(1) + ' ' + units[number];
};

exports.main = videoUrl => {
  return new Promise((resolve, reject) => {
    resolve({
      urlParsed: url.parse(videoUrl)
    });
  })
  // validate input url
  .then(state => {
    if (state.urlParsed.protocol !== 'https:') {
      console.log(`not supported protocol:  ${state.urlParsed.protocol}`);
      return new Promise.reject();
    }
    else if (state.urlParsed.host !== 'www.bitchute.com') {
      console.log(`wrong host:  ${state.urlParsed.host}`);
      return new Promise.reject();
    }
    else if (!state.urlParsed.path.startsWith('/video/')) {
      console.log(`malformed url path:  ${state.urlParsed.path}`);
      return new Promise.reject();
    }

    return state;
  })
  // download target page
  .then(state => new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: state.urlParsed.host,
      port: 443,
      path: state.urlParsed.path,
      method: 'GET'
    };

    const request = https.request(requestOptions, res => {
      var body = '';
      res.on('data', chunk => {
        body += chunk; // string conversion
      }).on('end', () => {
        resolve([state, body]);
      });
    });

    request.on('error', error => {
      console.error(error);
      reject(error);
    });

    request.end();
  }))
  // parse page for metadata
  .then(([state, body]) => {
    const root = parse(body);
    const pageDetail = root.querySelector('#page-detail');
    const dateSplit = pageDetail.querySelector('.video-publish-date').innerHTML.trim().replace('First published at ','').slice(0, -1).split(' on ');
    const dateStr = `${dateSplit[1]} ${dateSplit[0]}`; // February 3rd, 2021 15:54 UTC
    const channelDetails = pageDetail.querySelector('.channel-banner').querySelector('.details');

    state = {
      ...state,
      metaData:{
        date: moment(dateStr, 'MMM DD, YYYY HH:mm A').format(),
        channel: decode(channelDetails.querySelector('.name').querySelector('a').innerHTML).trim(),
        owner: decode(channelDetails.querySelector('.owner').querySelector('a').innerHTML).trim(),
        title: decode(root.querySelector('#video-title').innerHTML).trim(),
        videoUrl: root.querySelector('#player').querySelector('source').getAttribute('src')
      }
    };

    console.log(metaData);
    return state;
  })
  // start download
  .then(state => new Promise((resolve, reject) => {
    if (process.bitchute_get.options !== undefined && !process.bitchute_get.options.download) {
      console.log('skipping download');
      resolve(state);
    }

    const options = {
      fileName: path.parse(url.parse(state.metaData.videoUrl).path).base,
      override: {
        skip: true,
        skipSmaller: true
      }
    };

    const downloaderHelper = new DownloaderHelper(state.metaData.videoUrl, process.cwd(), options);
    const bar = new cliProgress.SingleBar({
      format: '[{bar}] {percentage}% | ETA: {eta}s | {value}/{total} | Speed: {speed}'
    }, cliProgress.Presets.shades_grey);

    downloaderHelper.on('end', () => {
      bar.stop();
      resolve(state);
    });

    downloaderHelper.on('error', error => {
      bar.stop();
      console.error(`${error.status}: ${error.message}`);
      reject(error);
    });

    downloaderHelper.on('download', downloadInfo => {
      bar.start(downloadInfo.totalSize, downloadInfo.downloadedSize, {
        speed: 'N/A'
      });
    });

    downloaderHelper.on('progress', stats => {
      const speed = byteHelper(stats.speed);
      bar.update(stats.downloaded, {
        speed: `${speed}/s`
      });
    });

    downloaderHelper.on('skip', skipInfo => {
      console.log('continuing broken download');
      bar.update(skipInfo.downloadedSize, {
        speed: 'N/A'
      });
      downloaderHelper.__downloaded = skipInfo.downloadedSize; // brutal hax to able to continue broken downloads; works great on node-downloader-helper 1.0.17
      downloaderHelper.resume();
    });

    downloaderHelper.resume();
  }))
  .then(state => {
    // console.log('COMPLETED');
    return state;
  })
  .catch(error => {
    console.error('FINISHED WITH ERROR');
    return Promise.reject(error);
  });
}
