// Douyin: add a small "下载" button next to player controls.

(function () {
  const SB = window.__SB;
  if (!SB) return;

  function inject(container) {
    if (container.querySelector(".sb-dy-download")) return;
    const btn = SB.h(
      "div",
      {
        class: "sb-dy-download",
        style: {
          order: "1",
          color: "rgba(255,255,255,.85)",
          margin: "0 10px 0 0",
          cursor: "pointer",
          userSelect: "none",
        },
        title: "下载当前视频",
      },
      "下载"
    );
    btn.addEventListener("click", async () => {
      const source = document.querySelector("video source");
      const url = source?.src || document.querySelector("video")?.src;
      if (!url) {
        alert("未获取到视频地址，可能受站点保护或尚未加载。");
        return;
      }
      const title = document.querySelector(".title")?.textContent || document.title || "douyin";
      await SB.download(url, `${title}.mp4`);
    });
    container.appendChild(btn);
  }

  const tick = () => {
    document.querySelectorAll(".xg-right-grid").forEach(inject);
  };
  tick();
  // SPA: react to DOM changes.
  const obs = new MutationObserver(SB.debounce(tick, 600));
  obs.observe(document.body, { childList: true, subtree: true });
})();
