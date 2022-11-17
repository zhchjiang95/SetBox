const jsPath = 'js/inject/musictools.js';
var temp = document.createElement('script');
temp.setAttribute('type', 'text/javascript');
temp.src = chrome.extension.getURL(jsPath);
temp.onload = function () {
  this.parentNode.removeChild(this);
};
document.head.appendChild(temp);