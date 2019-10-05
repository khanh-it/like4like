const path = require('path');
const helpers = require('../helpers');

const username = process.argv[2];
const userDataDir = path.join(__dirname, '../../data/' + (username || 'default'));
helpers.mkdir(userDataDir);

const loginInfo = {
	fbacc1e5: {
		username: 'fbacc1e5',
		password: '_a147896325!'
	},
	fbacc1e51outlook: {
		username: 'fbacc1e51outlook',
		password: '_a147896325!'
	},
	olacc1e53: {
		username: 'olacc1e53',
		password: '_a147896325!'
	}
};

/**
 * 
 */
const crawlerConf = {
  request_url: 'https://www.like4like.org/',
  // Browsers
  min_browsers: 1,
  max_browsers: 1,
  browser_flag_ua: 0,
  browser_flag_proxy: 0,
  browser_launch: {
    headless: false,
    devtools: false,
	userDataDir,
    // https://peter.sh/experiments/chromium-command-line-switches/
    args: [],
  },
};
Object.assign(crawlerConf, loginInfo[username]);
module.exports = crawlerConf;
