const puppeteer = require('puppeteer');

async function timeZoneChecker({ timeZone }) {
  // all kind of config to pass to browser
  const launchConfig = {
    args: [
      '-disable-per-user-timezone',
      // '--incognito', // This won't share cookies/cache with other browser contexts.
      '--bwsi',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--window-size=1280,900`,
    ],
    headless: false,
    devtools: true,
    defaultViewport: {
      width: 1280,
      height: 900
    }
  };

  if (timeZone) {
    launchConfig.env = {
      TZ: timeZone,
      ...process.env,
    };
  }
  const browser = await puppeteer.launch(launchConfig);
  const page =(await browser.pages() || [await browser.newPage()])[0];

  await page.evaluateOnNewDocument(function() {
    if (window === window.top) {
      let _Date = Date;
      Date = function() {
        return new _Date(...arguments);
      };
    }
  });
  await page.goto('https://www.ana.co.jp/ja/jp/', { waitUntil: "load" });
  // await page.waitForSelector('[data-fetched="time_zone"]');
  // const detectedTimezone = await page.$eval('[data-fetched="time_zone"]', e => e.textContent);
  // await page.screenshot({ path: `screenshots/timeZone_${timeZone.replace('/', '-')}.png`, fullPage: true });

  // await browser.close();

  // return { timeZone, detectedTimezone };
}

Promise.all([
  // timeZoneChecker({ timeZone: 'Australia/Melbourne' }),
  timeZoneChecker({ timeZone: 'Asia/Singapore' }),
]).then(console.log);