const PuppeteerToIstanbul = require('./lib/puppeteer-to-istanbul');

module.exports = {
  write: async puppeteerFormat => {
    const pti = PuppeteerToIstanbul(puppeteerFormat);
    await pti.setup();
    await pti.writeIstanbulFormat();
  },
};
