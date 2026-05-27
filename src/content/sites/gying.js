// Override the playback-rate context menu on gying.net.

(function () {
  const SB = window.__SB;
  if (!SB) return;

  const speeds = ["3", "2.5", "2", "1.5", "1.3", "1.25", "1.2", "1.1", "1", "0.75"];

  async function patch() {
    try {
      const menu = await SB.waitFor(".art-contextmenu.art-contextmenu-playbackRate", { timeout: 15000 });
      menu.innerHTML = "播放速度：";
      speeds.forEach((s) => {
        const span = SB.h("span", { dataset: { value: s } }, s === "1" ? "正常" : s);
        if (s === "1") span.classList.add("art-current");
        menu.appendChild(span);
      });
    } catch {}
  }
  patch();
})();
