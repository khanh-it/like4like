const crawler = require('./crawler');
const crawlerHelpers = require('./crawler/helpers');

// Start crawler
(function() {
  this.init().then(() => {
    this.doCrawl({
      _reqid: crawlerHelpers.shortUID()
    })
    .then(data => console.log(data))
    .catch(err => console.error(err))
  });
}).bind(crawler)();
