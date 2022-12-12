const slothful_douban = {
  init() {
    const title = $('#content h1 span:eq(0)').text()?.split(' ')[0];
    const btns = `
      <a href="https://www.dianyinggou.com/so/${title}" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>在电影狗搜索</span></a>
      <a href="https://cupfox.app/search?key=${title}" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>在茶杯狐搜索</span></a>
      <a href="https://www.upyunso.com/search.html?page=1&keyword=${title}" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>在UP云搜搜索</span></a>
      <a href="https://yiso.fun/info?searchKey=${title}" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>在易搜搜索</span></a>
    `
    $('#interest_sect_level').prepend(btns);
  }
}

slothful_douban.init();