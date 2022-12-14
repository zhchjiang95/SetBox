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
  // 网页图片匣子
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
  // 定时刷新网页
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
          chrome.tabs.sendMessage(tabs[0]?.id, { timingRequest: { type: ty, time: t }, })
        }, t * 1000);
      })
    }
  },
  // 划词翻译
  translator() {
    // 监听来自content-script的消息
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      if (request.selectionText) {
        const value = request.selectionText;
        let token = 'bKq9SKrj94cYOZjLD0aS3GrD3hdF8q5Y';
        let key = '1665478121981';

        fetch('https://cn.bing.com/translator?ref=TThis&text=&from=zh-Hans&to=en').then(res => res.text()).then(res => {
          const reg = /(?<=params_RichTranslateHelper = \[).*?(?=",)/;
          const r = res.match(reg)[0];
          const result = r?.split(',\"');
          token = result?.[1];
          key = result?.[0];

          const pattern = new RegExp("[\u4E00-\u9FA5]+");
          const from = pattern.test(value) ? 'zh-Hans' : 'en'
          const to = from === 'en' ? 'zh-Hans' : 'en'
          const p = `&isVertical=1&IG=9B029BBF312D4BC593DB3D0530630910&text=${encodeURIComponent(value)}&to=${to}&token=${token}&key=${key}`
          const url1 = `https://cn.bing.com/tlookupv3?IID=translator.5022.2&from=${from}`;
          const url2 = `https://cn.bing.com/ttranslatev3?IID=translator.5022.5&fromLang=${from}`;

          fetch(url1 + p, {
            method: 'POST'
          }).then(res => res.json()).then((res) => {
            if (res?.[0]?.translations.length) {
              const translatorResult = res?.[0]?.translations.map(v => v.displayTarget);
              chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { translatorResult }, function (response) {
                  console.log(response);
                });
              });
            } else {
              fetch(url2 + p, {
                method: 'POST'
              }).then(res => res.json()).then((res) => {
                if (res?.[0]?.translations.length) {
                  const translatorResult = res?.[0]?.translations.map(v => v.text);
                  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, { translatorResult }, function (response) {
                      console.log(response);
                    });
                  });
                } else {
                  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, { translatorResult: ['暂无翻译结果'] }, function (response) {
                      console.log(response);
                    });
                  });
                }
              })
            }
          })
        })
      }

      sendResponse({ translatorResult: [] });
      return true;
    });
  }
}

backgroundInit.contextMenu();
backgroundInit.images();
backgroundInit.translator();