
/**
 * BrowserContext
 */
function BrowserContext()
{
    const BrowserContext = {};

    //
    //
    function preload(_opts)
    {
      // Only inject in top window
      if (window !== window.top) return;

      // Simulate events!
      function simulate(element, eventName)
      {
        var options = extend(defaultOptions, arguments[2] || {});
        var oEvent, eventType = null;
        for (var name in eventMatchers) {
          if (eventMatchers[name].test(eventName)) { eventType = name; break; }
        }
        if (!eventType) {
          throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');
        }
        if (document.createEvent) {
          oEvent = document.createEvent(eventType);
          if (eventType == 'HTMLEvents') {
            oEvent.initEvent(eventName, options.bubbles, options.cancelable);
          } else {
            oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
            options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
            options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
          }
          element.dispatchEvent(oEvent);
        } else {
          options.clientX = options.pointerX;
          options.clientY = options.pointerY;
          var evt = document.createEventObject();
          oEvent = extend(evt, options);
          element.fireEvent('on' + eventName, oEvent);
        }
        return element;
      }
      function extend(des, src) { for (var prop in src) { des[prop] = src[prop]; } return des; }
      var eventMatchers = {
        'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
        'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
      }
      var defaultOptions = { pointerX: 0, pointerY: 0, button: 0, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, bubbles: true, cancelable: true }
      //.end

      // Simulate click event
      function triggerClick(ele)
      {
        simulate(ele, 'mousedown');
        (ele && ele.click()); // simulate(ele, 'click');
        simulate(ele, 'mouseup');
      }
      //.end

      // Exposes
      window._ppt = {
        /**
         * Flag :
         * @var {String}
         */
        stepHandled: '',
        /**
         * @param {Number} min 
         * @param {Number} max 
         */
        randInt: function (min, max) {
          return (Math.floor(Math.random() * (max - min + 1)) + min);
        },
        /** */
        simulate,
        /** */
        triggerClick,
      };
    };
    BrowserContext.preload = preload;

    /**
     * 
     * @param {Object} opts An object options
     */
    async function stepLogin(opts)
    {
      // Get, format options
      opts = Object.assign({}, opts);

      // Page's current url
      var step = '[login] ';
      var locStr = location.pathname.toString();
      //
      if ((window !== window.top)
        || !locStr.match(/^\/(login\/)?$/i)
      ) { return; }
      // Debug
      console.warn(`${step}: ${locStr}`);
      // @var {Object} obj Crawl object data
      var { inputData } = await _pptCall();
      //
      _ppt.stepHandled = step.trim();
      _pptCall({ crawl_obj: { urlLogin: locStr } });
      //
      window.addEventListener('DOMContentLoaded', function() {
        //
        (jQuery)(function($) {
          try {
            var $formLogin = $('#login');
            // Case: login?
            if ($formLogin.length) {
              $('#username').val('khanhdtp');
              $('#password').val('HdAbwx1JY3MLe');
              $formLogin.find('a.form-button').get(0).click();
              return;
            }
            // Case: home page
            var $alogin = $('a[href="' + location.origin + '/login/"]');
            if ($alogin.length) { // login is needed
              return $alogin.get(0).click();
            }
            // Go to like share page
            location.assign('/free-facebook-likes.php');
          } catch (err) {
            err = `Load 'search' page has failed (${err.message}).`;
            _pptCall({ cmd: "exit", err });
          }
          //
        });
      });
    };
    BrowserContext.stepLogin = stepLogin;

    /**
     *
     * @param {Object} opts An object options
     */
    async function stepFreeFacebookLikes(opts)
    {
      // Get, format options
      opts = Object.assign({}, opts);

      // Page's current url
      var step = '[freeFacebookLikes] ';
      var locStr = location.pathname.toString();
      //
      if ((window !== window.top)
        || !locStr.match(/free-facebook-likes\.php/i)
      ) { return; }
      // Debug
      console.warn(`${step}: ${locStr}`);
      // @var {Object} obj Crawl object data
      // var { inputData } = await _pptCall();
      //
      window.addEventListener('DOMContentLoaded', function() {
        (jQuery)(function($) {
          // _pptCall({ crawl_obj: { urlFreeFacebookLikes: locStr } });
          try {
            function loadLinks(callback) {
              var $tableEarn = $('table[id^="facebook-earn-table"]');
              // Error: The Session For Earning Credits On This Page Has Expired. 
              if (!$tableEarn.length) {
                // TODO: config time
                return setTimeout(() => { location.reload(); }, 3e3);
              }
              var $likeButtons = $tableEarn.find('span[id^="likebutton"] a.earn_pages_button');
              _pptCLog(`likeButtons: ${$likeButtons.length}.`);
              if ($likeButtons.length && callback) {
                return callback($likeButtons);
              }
              // TODO: config time
              setTimeout(() => { loadLinks(callback); }, 5e3);
            }
            async function doLike($likeButton) {
              return new Promise((resolve, reject) => {
                var likeBtn = $likeButton.get(0);
                likeBtn && likeBtn.click();
                // @TODO: config time
                setTimeout(resolve, 60e3);
              });
            }
            async function doLikeButtons($likeButtons) {
              for (var i = 0; i < $likeButtons.length; i++) {
                var $likeButton = $likeButtons.eq(i);
                await doLike($likeButton);
              }
              // var loadMoreLink = $('#load-more-links').get(0);
              // loadMoreLink && loadMoreLink.click();
              // loadLinks(doLikeButtons);
              // @TODO: config time
              setTimeout(() => { location.reload(); }, 5e3);
            }
            loadLinks(doLikeButtons);
          } catch (err) {
            err = `Load 'freeFacebookLikes' page has failed (${err.message}).`;
            alert(err);
            // _pptCall({ cmd: "exit", err });
          }
        });
      });
    };
    BrowserContext.stepFreeFacebookLikes = stepFreeFacebookLikes;
  
    /**
     *
     * @param {Object} opts An object options
     */
    async function stepLikeOnFacebook(opts)
    {
      // Get, format options
      opts = Object.assign({}, opts);

      // Page's current url
      var step = '[likeOnFacebook] ';
      var locStr = location.toString();
      //
      if ((window !== window.top)
        || !locStr.match(/facebook\.com/i)
      ) { return; }
      // Debug
      console.warn(`${step}: ${locStr}`);
      // @var {Object} obj Crawl object data
      // var { inputData, crawlObj } = await _pptCall();
      //
      setTimeout(() => {
        try {
          var likeButton = null;
          // Like button by page
          likeButton || (likeButton = document.querySelector('button.likeButton'));
          // Like button by post (PC)
          likeButton || (likeButton = document.querySelector('a[data-testid="UFI2ReactionLink"] i.img'));
          // Like button by post (SP)
          likeButton || (likeButton = document.querySelector('a[role="button"][data-sigil~="touchable"]'));
          if (!likeButton) {
            var likeButtonWrap = document.querySelector('div[role="button"][aria-label][data-nt]');
            var likeButtonInner = likeButtonWrap && likeButtonWrap.querySelector('* > div');
            likeButton = likeButtonInner && likeButtonInner.querySelector('* > div:first-child');
          }
          // Trigger
          likeButton && _ppt.triggerClick(likeButton);
          if (!likeButton) {
            _pptCLog(`NO likeButton: ${locStr}.`);
          }
          // @TODO: 
          setTimeout(() => { window.close() }, 5e3);
        } catch (error) {
          err = `Load 'likeOnFacebook' page has failed (${error.message}).`;
          alert(err);
          // _pptCall({ cmd: "exit", err });
        }
      }, 5e3);
    };
    BrowserContext.stepLikeOnFacebook = stepLikeOnFacebook;
    
    //
    return BrowserContext;
};
module.exports = BrowserContext;
