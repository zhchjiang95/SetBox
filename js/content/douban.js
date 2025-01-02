const slothful_douban = {
  init() {
    const title = $('#content h1 span:eq(0)').text()?.split(' ')[0];
    const btns = `
      <a href="https://www.dianyinggou.com/so/${title}" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>电影狗</span></a>
      <a href="https://aliso.cc/s/${title}-1-0.html" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>阿里搜</span></a>
      <a href="https://panso.pro/search?q=${title}&type=ALY" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>盘搜</span></a>
      <a href="https://www.upyunso.com/search.html?page=1&keyword=${title}" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>UP云搜</span></a>
      <a href="https://yiso.fun/info?searchKey=${title}" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>易搜</span></a>
      <a href="https://vidhub1.cc/vodsearch/${title}-------------.html" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>Vidhub</span></a>
      <a href="https://www.hdmoli.pro/search.php?searchword=${title}&submit=" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>HDmoli</span></a>
      <a href="https://lemonto.top/search?keyword=${title}" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>磁力柠檬</span></a>
      <a href="https://so.zimuku.org/search?q=${title}&chost=zimuku.org" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>字幕库</span></a>
    `
    $('#interest_sect_level').prepend(btns);
  }
}

slothful_douban.init();