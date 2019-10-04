const path = require('path');
const helpers = require('../helpers');

// screenshot
const screenshot_path = path.join(__dirname, '/../../logs/', `${helpers.dateStr()}/`);
helpers.mkdir(screenshot_path);

// cookies
const cf_log_cookies_path = path.join(__dirname, '/../../logs/_cookies/');
helpers.mkdir(cf_log_cookies_path);

/**
 * 
 */
const crawlerConf = {
  // Server
  request_timeout: 25 * 1e3,
  // +++
  request_url: 'https://www.ana.co.jp/ja/jp',
  // +++
  mode_debug: true,
  // +++
  mode_STUB: true,

  // Monitor
  monit_brw_timeout_interval: 10 * 1e3,
  monit_brw_respawn_interval: 10 * 1e3,
  monit_brw_timeout: 30 * 1e3,

  // Crawler
  brwctx_pax_retry: 2, // retry before throw error

  // Cookie feeder
  cf_log_cookies_path,
  cf_min_browsers: 1, // min: 1
  cf_brwctx_pax_rdr_tout: 3e3, // time wait before redirect to previous step
  cf_brwctx_pax_rld_tout: 5e3, // time wait before reload page
  cf_brwctx_pax_retry: 5, // retry before redirect to previous step
  cf_brwctx_pax_itv_tout: 7e3, // interval timeout
  cf_brwctx_pax_trigger_tout: 400, // trigger setTimeout timeout
  cf_brwctx_pax_itv_retry: 4, // interval retry

  // Browsers
  min_browsers: 0,
  max_browsers: 12,
  browser_flag_ua: 0,
  browser_flag_proxy: 0,
  browser_destruct_delay: 1.5 * 1e3,
  browser_launch: {
    // ignoreDefaultArgs: true,
    headless: true,
    devtools: false,
    // https://peter.sh/experiments/chromium-command-line-switches/
    args: [
      // '--disable-background-networking',
      // '--disable-default-apps',
      // '--disable-extensions',
      // '--disable-sync',
      // '--disable-translate',
      // '--hide-scrollbars',
      // '--metrics-recording-only',
      // '--mute-audio',
      //'--no-first-run',
      // '--safebrowsing-disable-auto-update',
      // '--ignore-certificate-errors',
      // '--ignore-ssl-errors',
      // '--ignore-certificate-errors-spki-list',
      // '--user-data-dir=C:\\Users\\KhanhDTP\\AppData\\Local\\Chromium\\User Data',
      // '--profile-directory=C:\\Users\\KhanhDTP\\AppData\\Local\\Chromium\\User Data\\' + `${helpers.dateStr()}\\`,
      // '--no-startup-window',
      // '--incognito', // This won't share cookies/cache with other browser contexts.
      // '--bwsi',
      // '--no-sandbox',
      // '--disable-setuid-sandbox',
      '--wm-window-animations-disabled'
    ],
  },
  // +++ screenshot configs
  screenshot_on: 0,
  screenshot_err_on: 1,
  screenshot_path,
  // +++ page configs
  page_wait_for_page: 0 * 1e3, // break time between pages
  page_wait_for_selector: 30 * 1e3,
  page_wait_for_navigation: 6 * 1e3,
  //
  page_request_block: function(req)
  {
    let rsType = req.resourceType(), url = req.url();
    // block images / css, .. (stylesheet)
    // /stylesheet|image|media|font/
    if (rsType.match(/image|media|font/)) {
      return true;
    }
    /* if (url.match(/ana\.co\.jp\/(static|public)\/[a-z0-9]+/)) { return true; } */
    // js
    if (rsType.match(/script/)) {
      let domain = (url.match(/^https?:\/\/([^\/]+)/) || [''])[1];
      if (!domain.match(/\.ana\.co\.jp/i) || url.match(/mbox/)) {
        return true;
      }
    }
    return false;
  },
  page_request_cache: true,

  // CMS
  // +++ url send cookies
  cms_send_cookies_url: 'http://aws-dev.ticket-reserve.net/booking/get_cookie_db'
};
module.exports = crawlerConf;
