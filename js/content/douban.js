const slothful_douban = {
  init() {
    const title = $('#content h1 span:eq(0)').text()?.split(' ')[0];
    const btns = `
      <a href="https://www.dianyinggou.com/so/${title}" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>在电影狗搜索${title}</span></a>
      <a href="https://cupfox.app/search?key=${title}" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>在茶杯狐搜索${title}</span></a>
    `
    $('#interest_sect_level').prepend(btns);
  }
}

slothful_douban.init();