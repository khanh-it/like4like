// const path = require('path');
const { crawlerConf } = require('../configs');
const helpers = require('../helpers');
const BrowserContext = require('./BrowserContext');

/**
 * crawler creator
 */
async function Like4LikeCrawler(inputData, brwItem, crawlCb)
{
  // Init
  const { browser } = brwItem;
  const page = (await browser.pages())[0]; // || await browser.newPage();
  // return page.goto('chrome://version/');
  const {
    preload,
    stepLogin,
    stepFreeFacebookLikes,
    stepLikeOnFacebook,
    stepPax,
    stepReservNo
  } = BrowserContext();
  let { request_url } = crawlerConf();
  //
  let step = '';
  let resObj = {};
  let crawlObj = {};

  // Expose function(s) to browser context
  function _pptCall(input)
  {
    input = Object.assign({}, input);
    let cmd = input.cmd;
    let res_obj = input.res_obj;
    let crawl_obj = input.crawl_obj;
    // Set data for response object?
    if (res_obj) {
      Object.assign(resObj, res_obj);
    }
    // Set data for crawl object?
    if (crawl_obj) {
      Object.assign(crawlObj, crawl_obj);
    }
    // Stop node process
    if ('exit' == cmd) {
      let err = input.err ? new Error(input.err) : null;
      Object.assign(resObj, {
        booking_cookie_db: 1 * !!(crawlObj && crawlObj.paxCookies)
      });
      return crawlCb(err, resObj, crawlObj);
    }
    return {
      inputData,
      configData: crawlerConf(),
      resObj,
      crawlObj
    };
  };
  // Forward console.log trong browser ra ngoai nodejs process
  function _pptCLog()
  {
    helpers.log(arguments[0], inputData._reqid);
    return helpers.clog.apply(helpers, arguments);
  };
  //
  async function initPage(page) {
    try {
      await page.exposeFunction('_pptCall', _pptCall);  
    } catch (error) {
      console.log(error.messages);
    }
    try {
      await page.exposeFunction('_pptCLog', _pptCLog);
    } catch (error) {
      console.log(error.messages);
    }
  }

  // On window.open,...
  browser.on('targetcreated', async (target) => {
    let browser = target.browser();
    let pages = await browser.pages();
    let page = pages[pages.length - 1];
    await initPage(page);
    await page.evaluate(preload, {});
    await page.evaluate(stepLikeOnFacebook);
  });

  /**
   * Do crawl
   */
  async function doCrawl()
  {
    await initPage(page);
    await page.evaluateOnNewDocument(preload, {});
    await page.evaluateOnNewDocument(stepLogin, { break: false });
    await page.evaluateOnNewDocument(stepFreeFacebookLikes, { break: false });
    // Start load page
    await page.goto(request_url, { waitUntil: "domcontentloaded" }).catch(crawlCb);
  }

  // Return
  return doCrawl;
};
module.exports = Like4LikeCrawler;
