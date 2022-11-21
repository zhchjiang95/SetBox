var backgroundInit = {
  timer: 0,
  timerTag: 0,
  currentTag: {},
  contextMenu() {
    chrome.contextMenus.create({
      title: '百度搜索“%s”',
      contexts: ['selection'],
      onclick(params) {
        chrome.tabs.create({ url: 'https://www.baidu.com/s?ie=utf-8&wd=' + encodeURI(params.selectionText) });
      }
    });
    chrome.contextMenus.create({
      title: '百度开发者搜索“%s”',
      contexts: ['selection'],
      onclick(params) {
        chrome.tabs.create({ url: 'https://kaifa.baidu.com/searchPage?module=SEARCH&wd=' + encodeURI(params.selectionText) });
      }
    });
    chrome.contextMenus.create({
      title: '必应搜索“%s”',
      contexts: ['selection'],
      onclick(params) {
        chrome.tabs.create({ url: 'https://cn.bing.com/search?q=' + encodeURI(params.selectionText) });
      }
    });
    chrome.contextMenus.create({
      title: '谷歌搜索“%s”',
      contexts: ['selection'],
      onclick(params) {
        chrome.tabs.create({ url: 'https://www.google.com/search?q=' + encodeURI(params.selectionText) });
      }
    });
  },
  images() {
    const images = [];
    let timer
    let mTimer
    chrome.webRequest.onBeforeRequest.addListener(details => {
      if (details.type === 'image') {
        images.push(details.url);
        clearTimeout(timer);
        timer = setTimeout(() => {
          chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0]?.id, { slothfulImages: Array.from(new Set(images)) }, function (response) {
              console.log(response);
            });
          })
        }, 1000)
      } else if (details.initiator === 'https://music.163.com' && details.type === 'media') {
        clearTimeout(mTimer);
        mTimer = setTimeout(() => {
          chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0]?.id, { slothfulMusic: details.url }, function (response) {
              console.log(response);
            });
          })
        }, 1000)
      }
    }, { urls: ["<all_urls>"] }, ["blocking"]);
  },
  interval(ty, t) {
    clearInterval(this.timer);
    clearInterval(this.timerTag);
    if (ty === 'show') {
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, (tabs) => {
        this.currentTag = tabs[0];
        this.timerTag = setInterval(() => {
          chrome.tabs.query({
          }, (tabs) => {
            if (!tabs.find(v => v.title === this.currentTag.title)) {
              clearInterval(this.timer);
              clearInterval(this.timerTag);
            }
          })
        }, t * 1000 * 4);
        this.timer = setInterval(() => {
          console.log('33333');
          chrome.tabs.sendMessage(tabs[0]?.id, { timingRequest: { type: ty, time: t }, })
        }, t * 1000);
      })
    }
  }
}

backgroundInit.contextMenu();
backgroundInit.images();