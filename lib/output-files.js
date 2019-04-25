// output JavaScript bundled in puppeteer output to format
// that can be eaten by Istanbul.

// TODO: Put function interfaces on this file
const fetch = require('node-fetch');
const fs = require('fs');
const mkdirp = require('mkdirp');
const clone = require('clone');
const pathLib = require('path');
const url = require('url');

const storagePath = './.nyc_output/js';

class OutputFiles {
  constructor(coverageInfo) {
    // Clone coverageInfo to prevent mutating the passed in data
    this.coverageInfo = clone(coverageInfo);
    this.iterator = 0;
  }

  parsePath(path) {
    let urlPath;

    try {
      urlPath = new url.URL(path);
    } catch (error) {
      path = 'file://' + path;
      urlPath = new url.URL(path);
    }

    let postProtocolPath = urlPath.pathname.substring(1);

    if (urlPath.hostname) {
      let hostnameAndPort = urlPath.hostname;
      if (urlPath.port) {
        hostnameAndPort = hostnameAndPort + '_' + urlPath.port;
      }

      postProtocolPath = hostnameAndPort + '/' + postProtocolPath;
    }

    return postProtocolPath;
  }

  rewritePath(path) {
    // generate a new path relative to ./coverage/js.
    // this would be around where you'd use mkdirp.

    let str = ``;
    let parsedPath = this.parsePath(path);

    // Special case: when html present, strip and return specialized string
    if (parsedPath.includes('.html')) {
      parsedPath =
        pathLib.resolve(storagePath, parsedPath) + 'puppeteerTemp-inline';
    } else if (!parsedPath.endsWith('.js')) {
      parsedPath = `${parsedPath}-${++this.iterator}`;
      parsedPath = pathLib.resolve(storagePath, parsedPath);
    } else {
      parsedPath = parsedPath.split('.js')[0];
      parsedPath = pathLib.resolve(storagePath, parsedPath);
    }

    mkdirp.sync(storagePath);

    str = `${parsedPath}.js`;
    return str;
  }

  async parseAndIsolate() {
    for (var i = 0; i < this.coverageInfo.length; i++) {
      const fileUrl = this.coverageInfo[i].url;
      var path = this.rewritePath(fileUrl);
      this.coverageInfo[i].url = path;

      mkdirp.sync(pathLib.parse(path).dir);

      if (fileUrl.endsWith('.js')) {
        console.log('Finding', `${fileUrl}.map`);
        try {
          const rawSourceMap = await fetch(`${fileUrl}.map`).then(res =>
            res.text()
          );
          fs.writeFileSync(`${path}.map`, rawSourceMap);
        } catch (e) {
          console.error('error', e);
        }
      }

      fs.writeFileSync(path, this.coverageInfo[i].text);
    }
  }

  getTransformedCoverage() {
    return this.coverageInfo;
  }
}

module.exports = function(coverageInfo) {
  return new OutputFiles(coverageInfo);
};
