const slothful_csdn = {
  init() {
    document.querySelector('.look-more-preCode')?.click();
    const copyBtns = $('.hljs-button');
    document.querySelector('#article_content').style.height = 'auto';
    document.querySelector('.hide-article-box')?.remove()
    copyBtns.each(function () {
      let code = this.previousSibling;
      if(typeof code !== 'string') {
        code = $(this).siblings('code')[0]?.innerText;
      }
      if(typeof code !== 'string') {
        code = $(this).parents('code')[0]?.innerText;
      }
      const divBtn = `<div class="slothful-csdn-copy-button" data-clipboard-text="${code?.replaceAll('"', '\'')}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M7 6V3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3v3c0 .552-.45 1-1.007 1H4.007A1.001 1.001 0 0 1 3 21l.003-14c0-.552.45-1 1.007-1H7zm2 0h8v10h2V4H9v2zm-2 5v2h6v-2H7zm0 4v2h6v-2H7z" fill="rgba(255,255,255,1)"/></svg> <span>复制</span></div>`;
      $(this).before(divBtn);
      $(this).remove();
      $('.slothful-csdn-copy-button').click(function () {
        $(this).find('span').text('已复制！');
        setTimeout(() => {
          $(this).find('span').text('复制');
        }, 2000);
      })
    })
    new ClipboardJS('.slothful-csdn-copy-button');
  }
}

slothful_csdn.init();