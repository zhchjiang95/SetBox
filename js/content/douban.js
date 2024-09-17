const slothful_douban = {
  init() {
    const title = $('#content h1 span:eq(0)').text()?.split(' ')[0];
    const btns = `
      <a href="https://www.dianyinggou.com/so/${title}" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>电影狗</span></a>
      <a href="https://cupfox.app/search?key=${title}" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>茶杯狐</span></a>
      <a href="https://a.sousou.pro/search.htm?keyword=${title}" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>网盘小站</span></a>
      <a href="https://www.upyunso.com/search.html?page=1&keyword=${title}" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>UP云搜</span></a>
      <a href="https://yiso.fun/info?searchKey=${title}" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>易搜</span></a>
      <a href="https://cld96.buzz/search-${title}-0-0-1.html" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>磁力帝</span></a>
      <a href="https://idope.se/torrent-list/${title}/" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>idope</span></a>
      <a href="https://lemonto.top/search?keyword=${title}" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>磁力柠檬</span></a>
      <a href="https://so.zimuku.org/search?q=${title}&chost=zimuku.org" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>字幕库</span></a>
    `
    $('#interest_sect_level').prepend(btns);
  }
}

slothful_douban.init();