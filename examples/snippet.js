$(window).on('beforeunload', function(evt) {
  evt.preventDefault(); return (evt.returnValue = '');
});
$(window).off('beforeunload');

// https://stackoverflow.com/questions/6157929/how-to-simulate-a-mouse-click-using-javascript
// Simulate user's click!
function simulate(element, eventName) {
  var options = extend(defaultOptions, arguments[2] || {});
  var oEvent, eventType = null;
  for (var name in eventMatchers) {
    if (eventMatchers[name].test(eventName)) {
      eventType = name; break;
    }
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
function extend(destination, source) {
    for (var property in source) {
      destination[property] = source[property];
    }
    return destination;
}
var eventMatchers = {
  'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
  'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
}
var defaultOptions = {
  pointerX: 0,
  pointerY: 0,
  button: 0,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  metaKey: false,
  bubbles: true,
  cancelable: true
}
//.end

// https://stackoverflow.com/questions/3596583/javascript-detect-an-ajax-event
(function(callback) {
  var s_ajaxListener = new Object();
  s_ajaxListener.tempOpen = XMLHttpRequest.prototype.open;
  s_ajaxListener.tempSend = XMLHttpRequest.prototype.send;
  s_ajaxListener.callback = callback;

  XMLHttpRequest.prototype.open = function(a,b) {
    if (!a) var a='';
    if (!b) var b='';
    s_ajaxListener.tempOpen.apply(this, arguments);
    s_ajaxListener.method = a;  
    s_ajaxListener.url = b;
    if (a.toLowerCase() == 'get') {
      s_ajaxListener.data = b.split('?');
      s_ajaxListener.data = s_ajaxListener.data[1];
    }
  }

  XMLHttpRequest.prototype.send = function(a,b) {
    if (!a) var a='';
    if (!b) var b='';
    s_ajaxListener.tempSend.apply(this, arguments);
    if(s_ajaxListener.method.toLowerCase() == 'post')s_ajaxListener.data = a;
    s_ajaxListener.callback();
  }

  return s_ajaxListener;
})(function() {
  console.log(this);
  // this.method :the ajax method used
  // this.url    :the url of the requested script (including query string, if any) (urlencoded) 
  // this.data   :the data sent, if any ex: foo=bar&a=b (urlencoded)
});