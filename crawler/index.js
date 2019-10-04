// const path = require('path');
const puppeteer = require('puppeteer');
const {
  crawlerConf,
  userAgentArr,
  proxyArr,
  viewportArr
} = require('./configs');
const helpers = require('./helpers');
//
const Like4LikeCrawler = require('./Like4Like/');


// List of browser
const browsers = [];
// 
const clLbl = '[crawler]';

/**
 * crawler
 */
const crawler = {
  /**
   * Instance's id
   * @var {String}
   */
  instId: null,

  /**
   * Init
   * @param {Object} opts
   */
  init: async function init(opts)
  {
    // Get, format options
    opts = Object.assign({
      id: helpers.shortUID(),
      mode: 'crawler'
    }, opts);

    // Instance's id
    this.instId = opts.id;

    // @TODO: Start monitor
    // this.startMonit();

    // Start browsers?!
    await this.startBrowsers();

    // [log]
    helpers.clog(`crawler#${this.instId} initilized, mode '${opts.mode}'.`);
  },

  /**
   * Init (min) browsers
   * @param {Object} opts
   * @returns void
   */
  startBrowsers: async function startBrowsers(opts)
  {
    const { min_browsers } = crawlerConf();
    for (var i = 0; i < min_browsers; i++) {
      this.start1Browser(opts);
    }
  },

  // @var {Number}
  uaIdx: 0,
  /**
   * Generate random user agent string
   * @return string
   */
  randomUA: function randomUA()
  {
    let uaArr = userAgentArr();
    if (this.uaIdx > uaArr.length - 1) {
      this.uaIdx = 0;
    }
    let ua = uaArr[this.uaIdx++];
    return ua;
  },

  // @var {Number}
  proxyIdx: 0,
  /**
   * Generate random proxy
   * @return string
   */
  randomProxy: function randomProxy()
  {
    let pArr = proxyArr();
    if (this.proxyIdx > pArr.length - 1) {
      this.proxyIdx = 0;
    }
    let proxy = pArr[this.proxyIdx++];
    return proxy;
  },

  // @var {Number}
  viewportIdx: 0,
  /**
   * Generate random viewport
   * @return {Object}
   */
  randomViewport: function randomViewport()
  {
    let vpArr = viewportArr();
    if (this.viewportIdx > vpArr.length - 1) {
      this.viewportIdx = 0;
    }
    let vp = vpArr[this.viewportIdx++];
    return vp;
  },

  /**
   * Start a browser
   * @param {Object} opts
   * @returns {Object}
   */
  start1Browser: async function start1Browser(opts)
  {
    opts = Object.assign({
      brw_type: 'crawler', // 'crawler' | 'cookie_feeder'
    }, opts);

    //
    let {
      min_browsers,
      max_browsers,
      browser_flag_ua,
      browser_flag_proxy,
      browser_launch
    } = crawlerConf();
    let brwItem = null;

    // @TODO : T/H: quan sl browsers vuot max
    if (browsers.length > max_browsers) {
      // return brwItem;
    }

    // Init browser_launch
    let brwLaunch = Object.assign({}, browser_launch);
    brwLaunch.args = browser_launch.args.concat([]);
    // +++ userAgent
    if (browser_flag_ua) {
      let userAgent = this.randomUA();
      if (userAgent) {
        brwLaunch.args.push(`--user-agent=${userAgent}`);
      }
      helpers.clog(`userAgent: ${userAgent || 'DEFAULT'}.`);
    }
    // +++ proxy
    if (browser_flag_proxy) {
      let proxy = opts.ip_proxy || this.randomProxy();
      if (proxy) {
        brwLaunch.args.push(`--proxy-server=${proxy}`);
      }
      helpers.clog(`proxy: ${proxy || 'NOT FOUND'}.`);
    }
    // +++ viewport
    let viewport = this.randomViewport();
    if (viewport) {
      brwLaunch.args.push(`--window-size=${viewport.width},${viewport.height}`);
      brwLaunch.defaultViewport = viewport;
    }
    helpers.clog(`viewport: ${viewport ? JSON.stringify(viewport) : null}.`);

    // Launch browser
    if (opts.alterBrwLaunch) {
      brwLaunch = opts.alterBrwLaunch(brwLaunch);
    }
    let browser = await puppeteer.launch(brwLaunch);
    //
    brwItem = {
      browser,
      status: 0,
      type: opts.brw_type,
      startedDate: new Date(),
      lastUsesDate: new Date()
    };
    browsers.push(brwItem);

    // Return
    return brwItem;
  },

  /**
   * Get avail browser
   * @returns {Number}
   */
  getAvailBrowsers: function getAvailBrowsers()
  {
    let arr = [];
    (browsers || []).forEach((_bItem) => {
      let { browser, status } = _bItem;
      if ((browser && !browser.isClosed()) && (0 === status)) {
        arr.push(_bItem);
      }
    });

    // Return
    return arr;
  },

  /**
   * Pick avail browser
   * @param {Object} opts
   * @returns {Object} Promise
   */
  pickAvailBrowser: async function pickAvailBrowser(opts)
  {
    opts = Object.assign(opts || {}, {});

    //
    let brwItem = null;
    (browsers || []).forEach((_bItem) => {
      let { browser, status } = _bItem;
      if (!brwItem && (0 === status)) {
        brwItem = _bItem;
      }
    });

    // Case: no browser is ready --> start a new one
    if (!brwItem) {
      brwItem = await this.start1Browser(opts);
    }

    // Update
    if (brwItem) {
      // Mark this browser is using,..!
      brwItem.status = 1;
      brwItem.lastUsesDate = new Date();
    }

    // Return
    return brwItem;
  },

  /**
   * Do crawl
   * @param {Object} crawlData
   * @returns {Object} Promise
   */
  doCrawl: async function doCrawl(crawlData)
  {
    return new Promise(async (resolve, reject) => {
      //
      let brwItem = await this.pickAvailBrowser({});
      // T/H: full browser?
      if (!brwItem) {
        reject(new Error('Browsers is full.')); return;
      }

      //
      let doCrawl = await Like4LikeCrawler(crawlData, brwItem, (err, resObj) => {
        // Destruct/cleanup?
        let { browser_destruct_delay } = crawlerConf();
        setTimeout(() => {
          this.closeBrowser(brwItem);
        }, browser_destruct_delay);
        //.end
        // T/H: error?
        if (err) {
          reject(err); return;
        }
        resolve(resObj);
      });
      return doCrawl();
    });
  },

  /**
   * Close 1 browser's pages
   * @param {Object} browser
   * @param {Object} opts Options
   * @return void
   */
  closePages: async function closeBrowser(browser, opts)
  {
    opts = (opts || {});
    if (browser) {
      const pages = await browser.pages();
      (pages || []).forEach(async (page) => {
        if (!page.isClosed()) {
          await page.close().catch(err => helpers.clog(err));	
        }
      })
    }
  },

  /**
   * Close 1 browser
   * @param {Object} brwItem
   * @param {Object} opts Options
   * @return void
   */
  closeBrowser: async function closeBrowser(brwItem, opts)
  {
    opts = (opts || {});
    let { status } = opts;

    //
    let foundBItem = null;
    let foundIndex = (browsers || []).findIndex(_bItem => _bItem === brwItem);
    if (foundIndex >= 0) {
      foundBItem = browsers[foundIndex];
      browsers.splice(foundIndex, 1);
    }
    if (foundBItem) {
      let { browser } = foundBItem;
      // Set browser's status?
      if (!(status === undefined)) {
        // @TODO: 
        foundBItem.status = -1; //status;
      }
      if (browser) {
        await browser.close();
      }
    }
  },

  /**
   * @return null|int
   */
  browserTimeoutTimer: null,

  /**
   * Start monitor
   * @return void
   */
  startMonit: async function startMonit()
  {
    let myClLbl = `${clLbl}[monit] `;
    let {
      monit_brw_timeout_interval,
      monit_brw_respawn_interval
    } = crawlerConf();
    // [log]
    helpers.clog(`${myClLbl}started.`);

    // Close all browsers
    this.browserTimeoutTimer = setInterval(() => {
      let { monit_brw_timeout } = crawlerConf();
      let curDate = new Date();
      (browsers || {}).forEach(async (brwItem) => {
        let { lastUsesDate, status } = brwItem;
        // @TODO:
        if ((0 !== status) && (curDate.getTime() - lastUsesDate.getTime() > monit_brw_timeout)) {
          this.closeBrowser(brwItem);
          // [log]
          helpers.clog(`${myClLbl}close browser.`);
        }
      });
    }, monit_brw_timeout_interval);

    // @TODO: Respawn?
    this.browserRespawnTimer = setInterval(() => {
      let { min_browsers } = crawlerConf();
      // let availBrowsers = this.getAvailBrowsers().length;
      let availBrowsers = browsers.length;
      if (availBrowsers < min_browsers) {
        for (let i = 0; i < (min_browsers - availBrowsers); i++) {
          this.start1Browser().catch(err => helpers.clog(err));
          // [log]
          helpers.clog(`${myClLbl}start browser.`);
        }
      }
    }, monit_brw_respawn_interval);
  },

  /**
   * CleanUp when app is exited
   * @return void
   */
  cleanUp: async function cleanUp()
  {
    //
    clearInterval(this.browserTimeoutTimer);

    // Close all browsers
    (browsers || {}).forEach(async (brwItem) => {
      await this.closeBrowser(brwItem);
    });
  }

};

// System's events
// process.on('beforeExit', async () => { await crawler.cleanUp(); });
['SIGINT'/*, 'SIGKILL'*/].forEach((signal) => {
  process.on(signal, function() {
    console.log(`Caught signal: ${signal}.`);
    crawler.cleanUp().then(
      () => process.exit(0),
      err => process.exit(1)
    );
  });
});

// exports all
module.exports = crawler;
