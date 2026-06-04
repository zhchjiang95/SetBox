// Douban movie page: replace the Wantto/Watched buttons with quick search links
// to common cloud-disk and movie sites.

(function () {
  const SB = window.__SB;
  if (!SB) return;

  function init() {
    const target = document.getElementById("interest_sect_level");
    const titleNode = document.querySelector("#content h1 span");
    if (!target || !titleNode) return;
    if (target.dataset.sbPatched) return;

    const title = titleNode.textContent.trim().split(" ")[0];
    if (!title) return;
    target.dataset.sbPatched = "1";

    const links = [
      { text: "观影GYING", url: `https://www.xn--wcv59z.com/search?q=${encodeURIComponent(title)}&type=&mode=1` },
      { text: "阿里搜", url: `https://aliso.cc/s/${encodeURIComponent(title)}-1-0.html` },
      { text: "盘搜", url: `https://panso.pro/search?q=${encodeURIComponent(title)}&type=ALY` },
      { text: "UP 云搜", url: `https://www.upyunso.com/search.html?page=1&keyword=${encodeURIComponent(title)}` },
      { text: "易搜", url: `https://yiso.fun/info?searchKey=${encodeURIComponent(title)}` },
      { text: "Vidhub", url: `https://vidhub1.cc/vodsearch/${encodeURIComponent(title)}-------------.html` },
      { text: "HDmoli", url: `https://www.hdmoli.pro/search.php?searchword=${encodeURIComponent(title)}` },
      { text: "字幕库", url: `https://so.zimuku.org/search?q=${encodeURIComponent(title)}` },
    ];

    target.innerHTML = "";
    links.forEach(({ text, url }) => {
      const a = SB.h("a", {
        href: url,
        target: "_blank",
        rel: "noopener",
        class: "colbutt ll",
        style: { letterSpacing: "initial" },
      }, SB.h("span", null, text));
      target.appendChild(a);
    });
  }

  init();
})();
