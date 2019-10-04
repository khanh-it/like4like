const os = require('os');
const fs = require('fs');
const path = require('path');
const request = require('request');
const { crawlerConf } = require('./configs');

/**
 * 
 */
const helpers = {
  /**
   * https://stackoverflow.com/questions/31424561/wait-until-all-es6-promises-complete-even-rejected-promises
   * @return string
   */
  Promise_allSettled: function Promise_allSettled(arrOfPromises)
  {
    return Promise.all(arrOfPromises || []).map((promise) => {
      return promise.then(
        data => ({ err: null, data, status: "resolved" }),
        err => ({ err, data: null, status: "rejected" })
      );
    });
  },

  /**
   * 
   * @param {*} min 
   * @param {*} max 
   */
  randInt: function randInt(min, max) {
    return (Math.floor(Math.random() * (max - min + 1)) + min);
  },

  /**
   * Short date string
   * @param {Date} now
   * @param {Object} opts
   * @return string
   */
  dateStr: function dateStr(now, opts)
  {
    // Get, format input
    opts = Object.assign({}, opts);
    //
    now = (now instanceof Date) ? now : new Date();
    let str = (`${now.getFullYear()}`
      + `0${now.getMonth() + 1}`.substr(-2)
      + `0${now.getDate()}`.substr(-2)
    );
    if (opts.inc_time) {
      str += (
        + `${now.getHours()}`
        + `${now.getMinutes()}`
        + `${now.getSeconds()}`
      );
    }
    if (opts.inc_extra_time) {
      str += (
        + `${now.getMilliseconds()}`
      );
    }
    //
    return str;
  },

  /**
   * Short UID
   * @return string
   */
  shortUID: function shortUID(opts)
  {
    // Get, format input
    // opts = Object.assign({}, opts);
    //
    let now = new Date();
    let dateStr = this.dateStr(now, { inc_time: 1, inc_extra_time: 1 });
    let uid = (`${dateStr}.${Math.floor(Math.random() * 10000)}`);
    //
    return uid;
  },

  /**
   * Terminal log
   */
  clog: function clog()
  {
    let args = Array.prototype.slice.call(arguments);
    args.unshift(`[${new Date().toLocaleString()}]`);
    return console.log.apply(console, args);
  },

  /**
   * Make dir
   * @param {String} folder Directory to make
   * @return void
   */
  mkdir: function mkdir(folder, opts)
  {
    try {
      // Make folder?
      !fs.existsSync(folder) && fs.mkdirSync(folder);
    } catch (err) {
      /* Handle the error */
      console.warn(err);
    }
  },

  /**
   * Logging
   * @return void
   */
  log: function log(data, filename, opts)
  {
    // Get, format input
    data = (typeof(data) === 'string') ? data : JSON.stringify(data, null, 2);
    opts = Object.assign({}, opts);
    //
    let curDate = new Date();
    let dateStr = curDate.getFullYear() + `0${curDate.getMonth() + 1}`.substr(-2) + `0${curDate.getDate() + 1}`.substr(-2);
    let timeStr = `0${curDate.getHours()}`.substr(-2);// + `0${curDate.getMinutes()}`.substr(-2) + curDate.getSeconds();
    let folder = opts.folder || path.resolve(`${__dirname}/../logs`);
    if (!(true === opts.skip_rotation)) {
      folder = `${folder}/${this.dateStr()}`;
    }
    filename = path.join(folder, (filename || timeStr) + (opts.file_ext || '.log'));
    // this.clog('filename: ', filename); process.exit(1);
    // Make folder?
    this.mkdir(folder);
    // Write (append) file
    fs.appendFileSync(
      filename,
      (!opts.skip_padding ? `[${new Date().toLocaleString()}] ` : '')
        + data + (!opts.skip_padding ? os.EOL : '')
    );
  },

  /**
   * Validate auto_booking request input
   * @param {Object} reqObj Request object
   * @return string
   */
  validateReqObj: function validateReqObj(reqObj)
  {
    let invalid = [];
    let required = [
      'dep',
      'des',
      // 'adult_count',
      // 'child_count',
      // 'infant_count',
      // 'flight_no',
      'year',
      'month',
      'day',
      'flight_info',
      'tel',
      'email',
      'traveller',
    ];
    required.map((key) => {
      if (!(reqObj && reqObj[key])) {
        invalid.push(key);
      }
    });
    if (invalid.length) {
      invalid = [
        'Invalid input, missing: ' + invalid.join(', ') + '.'
      ];
    } else {
      invalid = null;
    }

    return invalid;
  },

  /**
   * Get random cookies
   * @return {Array}
   */
  randCookies: function randCookies(callback)
  {
    let { cf_log_cookies_path: dir } = crawlerConf();
    //
    let cookies = [];
    let files = [];
    //
    let subdirs = fs.readdirSync(dir);
    subdirs.forEach(subdir => {
      subdir = path.resolve(dir, subdir);
      if (fs.statSync(subdir).isDirectory()) {
        let _files = fs.readdirSync(subdir);
        _files.forEach(_file => {
          _file = path.resolve(subdir, _file);
          if (fs.statSync(_file).isFile() && _file.match(/\.json$/)) {
            files.push(_file);
          }
        });
      }
    });
    //
    if (files.length) {
      let _cookies = require(files[this.randInt(0, files.length - 1)]);
      let _abck = _cookies.find(_cookie => _cookie.name.match(/_abck/i));
      if (_abck) {
        cookies.push(_abck);
      }
    }
    //
    return cookies;
  },

  /**
   * Send data response data to cms
   * @param {Object} reqObj Request object
   * @param {Object} resObj Response object
   * @return void
   */
  resCMS: function resCMS(reqObj, resObj, error)
  {
    resObj = Object.assign(resObj || {}, {});
    if (!reqObj) {
      // [log]
      helpers.log({ CMS: 'Empty reqObj.' });
      return;
    }
    if (!reqObj.response_url) {
      // [log]
      helpers.log({ CMS: 'No response_url.', reqObj, resObj, error }, reqObj._reqid);
      return;
    }
    let form = Object.assign(reqObj, {
      "reserveNum1": resObj.itineraryRsvNo,
      "price1": resObj.price,
      "child_price1": resObj.priceChild,
      "payment_url": "",
      "error": error ? 1 : 0,
      "error_detail": typeof error  === "string" ? error : (error && error.message),
      "booking_cookie_db": resObj.booking_cookie_db,
    });
    request.post({ url: reqObj.response_url, form }, (err, httpRes, body) => {
      // [log]
      helpers.log({ CMS: { req: form, res: { err, body } } }, reqObj._reqid);
    });
  },

  /**
   * Send cookies to cms
   * @return void
   */
  sendCMSCookies: function sendCMSCookies(cookies)
  {
    let {
      cms_send_cookies_url: url
    } = crawlerConf();
    //
    if (url && cookies) {
      let form = { cookies };
      request.post({ url, form }, (err, httpRes, body) => {
        // [log]
        helpers.log({ form, err, body }, 'send_cookies');
      });
    }
  }
};
module.exports = helpers;