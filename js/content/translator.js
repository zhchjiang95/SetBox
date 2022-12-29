const slothful_translator = {
  init() {
    let selectionText = '';
    const $btn = $(`<div id="slothful_translator_btn">
      <div class="slothful_t"></div>
      <div class="slothful_b"></div>
      <div class="slothful_loading">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 2a1 1 0 0 1 1 1v3a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm0 15a1 1 0 0 1 1 1v3a1 1 0 0 1-2 0v-3a1 1 0 0 1 1-1zm8.66-10a1 1 0 0 1-.366 1.366l-2.598 1.5a1 1 0 1 1-1-1.732l2.598-1.5A1 1 0 0 1 20.66 7zM7.67 14.5a1 1 0 0 1-.366 1.366l-2.598 1.5a1 1 0 1 1-1-1.732l2.598-1.5a1 1 0 0 1 1.366.366zM20.66 17a1 1 0 0 1-1.366.366l-2.598-1.5a1 1 0 0 1 1-1.732l2.598 1.5A1 1 0 0 1 20.66 17zM7.67 9.5a1 1 0 0 1-1.366.366l-2.598-1.5a1 1 0 1 1 1-1.732l2.598 1.5A1 1 0 0 1 7.67 9.5z"/></svg>
      </div>
      <div class="slothful_result"></div>
    </div>`);
    $btn.click(() => {
      $btn.find('.slothful_loading').show();
      chrome.runtime.sendMessage({ selectionText }, function (response) {
        // console.log('收到来自后台的回复：' + response);
      });

      chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.translatorResult) {
          $btn.find('.slothful_loading').hide();
          $btn.find('.slothful_result').text(request.translatorResult).show();
        }
      });
    }).hide().find('.slothful_loading').hide().click(function (e) {
      e.stopPropagation();
    }).end().find('.slothful_result').click(function (e) {
      e.stopPropagation();
    });

    const onRestoration = () => {
      $btn.hide().find('.slothful_result').hide().end().find('.slothful_loading').hide();
    }
    $('body').append($btn);
    let timer
    document.addEventListener('selectionchange', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const selection = document.getSelection()
        const text = selection.toString()
        if (text) {
          selectionText = text;
          const oRange = selection.getRangeAt(0)
          const oRect = oRange.getBoundingClientRect()
          onRestoration();
          $btn.css({ left: oRect.left + 'px', top: oRect.top + 20 + 'px' }).show();
        } else {
          onRestoration();
        }
      }, 400)
    })
  },
}

slothful_translator.init();