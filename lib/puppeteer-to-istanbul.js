const fs = require('fs');
const OutputFiles = require('./output-files');
const mkdirp = require('mkdirp');
const PuppeteerToV8 = require('./puppeteer-to-v8');
const v8toIstanbul = require('../../v8-to-istanbul/index.js');

class PuppeteerToIstanbul {
  constructor(coverageInfo) {
    this.coverageInfo = coverageInfo;
  }

  async setup() {
    const outputFiles = OutputFiles(this.coverageInfo);

    await outputFiles.parseAndIsolate();

    this.puppeteerToConverter = outputFiles.getTransformedCoverage();
    this.puppeteerToV8Info = PuppeteerToV8(
      this.puppeteerToConverter
    ).convertCoverage();
  }

  setCoverageInfo(coverageInfo) {
    this.coverageInfo = coverageInfo;
  }

  async writeIstanbulFormat() {
    var fullJson = {};

    for (let jsFile of this.puppeteerToV8Info) {
      const converter = v8toIstanbul(jsFile.url);
      await converter.load();
      converter.applyCoverage(jsFile.functions);

      let istanbulCoverage = converter.toIstanbul();
      let keys = Object.keys(istanbulCoverage);

      fullJson[keys[0]] = istanbulCoverage[keys[0]];
    }

    mkdirp.sync('./.nyc_output');
    fs.writeFileSync(
      './.nyc_output/out.json',
      JSON.stringify(fullJson),
      'utf8'
    );
  }
}

module.exports = function(coverageInfo) {
  return new PuppeteerToIstanbul(coverageInfo);
};
