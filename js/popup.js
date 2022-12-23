const bgWindow = chrome.extension.getBackgroundPage();
const popupInit = {
  translate() {
    new ClipboardJS('.btn-sm');
    const tr = new Map([['zh-Hans', '中文（简体）'], ['en', '英语']]);
    let timer;
    let copyTimer;
    let token = 'bKq9SKrj94cYOZjLD0aS3GrD3hdF8q5Y';
    let key = '1665478121981';

    fetch('https://cn.bing.com/translator?ref=TThis&text=&from=zh-Hans&to=en').then(res => res.text()).then(res => {
      const reg = /(?<=params_RichTranslateHelper = \[).*?(?=",)/;
      const r = res.match(reg)[0];
      const result = r?.split(',\"');
      token = result?.[1];
      key = result?.[0];
    })

    $('.tr-toggle').hide();
    $('.spinner-border').hide();
    $('.copy-success').hide();
    $('.translation').on('input', function (e) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const val = e.target.value;
        $('.result button').remove();
        if (val !== undefined && val !== null && val !== '') {
          $('.empty').hide();
          $('.spinner-border').show();
          onTranslation(val);
        } else {
          $('.tr-toggle').hide();
          $('.empty').text('翻译').show();
        }
      }, 1000)
    })

    $('.tr-toggle').on('click', '.toggle-btn', function () {
      $('.result button').remove();
      $('.empty').hide();
      $('.spinner-border').show();
      onTranslation($('textarea').val(), $('.type-2').data('tr'));
    })


    $('.result').on('click', '.btn-sm', function () {
      clearTimeout(copyTimer);
      $('.copy-success div').text($(this).text() + ' 已复制到剪切板！').parent().show();
      copyTimer = setTimeout(function () {
        $('.copy-success').hide();
      }, 2000)
    })

    const onTranslation = (value, f) => {
      const pattern = new RegExp("[\u4E00-\u9FA5]+");
      const from = f ? f : pattern.test(value) ? 'zh-Hans' : 'en'
      const to = from === 'en' ? 'zh-Hans' : 'en'
      const p = `&isVertical=1&IG=9B029BBF312D4BC593DB3D0530630910&text=${encodeURIComponent(value)}&to=${to}&token=${token}&key=${key}`
      const url1 = `https://cn.bing.com/tlookupv3?IID=translator.5022.2&from=${from}`;
      const url2 = `https://cn.bing.com/ttranslatev3?IID=translator.5022.5&fromLang=${from}`;

      $('.type-1').text(tr.get(from)).data('tr', from);
      $('.type-2').text(tr.get(to)).data('tr', to);
      $('.tr-toggle').show();

      fetch(url1 + p, {
        method: 'POST'
      }).then(res => res.json()).then((res) => {
        if (res?.[0]?.translations.length) {
          $('.spinner-border').hide();
          splicingResult(res?.[0]?.translations, 'displayTarget');
        } else {
          fetch(url2 + p, {
            method: 'POST'
          }).then(res => res.json()).then((res) => {
            $('.spinner-border').hide();
            if (res?.[0]?.translations.length) {
              splicingResult(res?.[0]?.translations, 'text');
            } else {
              $('.empty').text('暂无翻译结果').show();
            }
          })
        }
      })
    }

    const splicingResult = (arr, key) => {
      const btns = arr.map(v => `<button type="button" class="btn btn-outline-success btn-sm" data-clipboard-text="${v[key]}"><i class="ri-file-copy-2-line"></i>${v[key]}</button>`)
      $('.result').append(btns).show();
    }
  },
  // 开关类事件
  rest() {
    $('#translate-tools').show();
    $('#rest-tools').hide();

    $('#transBtn').click(() => {
      $('#translate-tools').show();
      $('#rest-tools').hide();
    })
    $('#restBtn').click(() => {
      $('#translate-tools').hide();
      $('#rest-tools').show();
    })

    const sendMessage = (p) => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, p, function (response) {
          console.log(response);
        });
      });
    }

    $('.form-check-input').click(function () {
      const ty = this.checked ? 'show' : 'hide';
      switch ($(this).data('type')) {
        case 'previewPics':
          sendMessage({ previewPics: ty });
          break;
        case 'autoScrolling':
          sendMessage({ autoScrolling: ty });
          break;
        case 'editMode':
          sendMessage({ editMode: ty });
          break;
        case 'timingRequest':
          let t = 20;
          if (ty === 'show') {
            t = Number(prompt('请输入时间间隔（单位秒，默认20秒，留空或点击取消按钮将每20秒会重复刷新页面。请谨慎设置过小的时间间隔！为防止内存泄漏请尽量在开启处拨动开关以停止刷新！）：')) || 20;
          }
          bgWindow.backgroundInit.interval(ty, t);
          break;
        case 'grayscale':
          sendMessage({ grayscale: ty });
          break;
      }
    })
  },
  // 功能类事件
  onFeatHandler() {
    $('.feat-item').click(function () {
      const { featType } = $(this).data();
      $('.offcanvas .offcanvas-title').text($(this).find('span').text());
      switch (featType) {
        case 'IP':
          $('.offcanvas .contnet').text('');
          $('.offcanvas .spinner-border').show();
          fetch('https://ip8.com/').then((res) => res.text()).then((res) => {
            const reg = /(?<=<td>)([\w\W]*?)(?=<\/td>)/g;
            const arr = res.match(reg);
            arr.splice(6, 2);
            arr.splice(27, 2);
            const results = []
            let i = 0;
            for (; i < arr.length;) {
              o = {}
              if (i % 3 === 0) {
                let item = arr[i + 2];
                if (item.includes('</a>')) {
                  const reg1 = /(?<=\>)([\w\W]*)(?=\<\/)/g;
                  item = item.match(reg1)[0];
                }
                if (item.includes('<img')) {
                  item = item.replace('src="', 'src="http://ip8.com');
                }
                o.title = arr[i];
                o.value = item;
                i += 3;
              } else {
                i++
              }
              results.push(o)
            }
            results.splice(9);
            // console.log(results);
            let listr = '';
            results.forEach((item) => {
              listr += `
              <li class="list-group-item d-flex justify-content-between align-items-start">
                <div class="ms-2 me-auto">
                  <div class="fw-bold">${item.title}</div>
                  ${item.value}
                </div>
              </li>`
            })
            const ulstr = `<ul class="list-group">${listr}</ul>`
            $('.offcanvas .contnet').append(ulstr);
          }).catch(() => {
            $('.offcanvas .contnet').text('出错了，请重试。');
          }).finally(() => {
            $('.offcanvas .spinner-border').hide();
          });
          // fetch('https://ipinfo.io/json').then(res => res.json()).then(res => {
          //   delete res.readme;
          //   const keys = Object.keys(res);
          //   const values = Object.values(res);
          //   let listr = '';
          //   keys.forEach((key, i) => {
          //     listr += `<li class="list-group-item d-flex justify-content-between align-items-center">
          //         ${key}
          //         <span class="badge bg-primary rounded-pill">${values[i]}</span>
          //     </li>`
          //   })
          //   const ulstr = `<ul class="list-group">${listr}</ul>`
          //   $('.offcanvas .contnet').append(ulstr);
          // }).catch(() => {
          //   $('.offcanvas .contnet').text('出错了，请重试。');
          // }).finally(() => {
          //   $('.offcanvas .spinner-border').hide();
          // });
          break;
        case 'pinyin':
          let timer;
          $('#toPinyin').on('input', function () {
            clearTimeout(timer);
            timer = setTimeout(() => {
              const value = $(this).val();
              if (value) {
                const results = pinyinUtil.getPinyin(value, ' ', true, true);
                let listr = '';
                results.forEach(v => {
                  listr += `<li class="list-group-item d-flex justify-content-between align-items-center">${v}</li>`
                });
                const ulstr = `<ul style="margin: 8px 0" class="list-group">${listr}</ul>`
                $('.offcanvas .contnet').find('.list-group').remove().end().append(ulstr);
              } else {
                $('.offcanvas .contnet').find('.list-group').remove()
              }
            }, 800)
          })
          break;
      }
    })
  }
}

popupInit.translate();
popupInit.rest();
popupInit.onFeatHandler();
