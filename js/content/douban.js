const slothful_douban = {
  init() {
    const title = document.querySelector('#content h1 span').innerText?.split(' ')[0];
    const btns = `
      <a href="https://www.gying.net/s/1---1/${title}" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>观影GYING</span></a>
      <a href="https://aliso.cc/s/${title}-1-0.html" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>阿里搜</span></a>
      <a href="https://panso.pro/search?q=${title}&type=ALY" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>盘搜</span></a>
      <a href="https://www.upyunso.com/search.html?page=1&keyword=${title}" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>UP云搜</span></a>
      <a href="https://yiso.fun/info?searchKey=${title}" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>易搜</span></a>
      <a href="https://vidhub1.cc/vodsearch/${title}-------------.html" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>Vidhub</span></a>
      <a href="https://www.hdmoli.pro/search.php?searchword=${title}&submit=" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>HDmoli</span></a>
      <a href="https://www.yuhuage.wiki/search/${encodeURIComponent(title).replaceAll('%', '')}_1_.html" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>磁力搜索</span></a>
      <a href="https://so.zimuku.org/search?q=${title}&chost=zimuku.org" target="_blank" class="colbutt ll" style="letter-spacing: initial"><span>字幕库</span></a>
    `
    document.querySelector('#interest_sect_level').innerHTML = btns;
  }
}
slothful_douban.init();