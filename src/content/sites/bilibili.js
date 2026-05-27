// Adds 2.5x / 3x / 3.5x / 4x to bilibili player speed menus.

(function () {
  const SB = window.__SB;
  if (!SB) return;

  const EXTRA = ["4", "3.5", "3", "2.5"];

  async function patchVideoMenu() {
    if (!location.pathname.includes("/video")) return;
    try {
      const menu = await SB.waitFor(".bpx-player-ctrl-playbackrate-menu", { timeout: 20000 });
      if (menu.dataset.sbPatched) return;
      menu.dataset.sbPatched = "1";
      EXTRA.forEach((v) => {
        const li = SB.h("li", {
          class: "bpx-player-ctrl-playbackrate-menu-item",
          dataset: { value: v },
        }, `${v}x`);
        li.addEventListener("click", () => {
          const video = document.querySelector("video");
          if (video) video.playbackRate = parseFloat(v);
        });
        menu.prepend(li);
      });
    } catch {}
  }

  async function patchBangumiMenu() {
    if (!location.pathname.includes("/play")) return;
    try {
      const menu = await SB.waitFor(".squirtle-speed-select-list", { timeout: 20000 });
      if (menu.dataset.sbPatched) return;
      menu.dataset.sbPatched = "1";
      menu.innerHTML = "";
      const speeds = ["4.0", "3.5", "3.0", "2.5", "2.0", "1.5", "1.25", "1.0", "0.75", "0.5"];
      speeds.forEach((s) => {
        const li = SB.h("li", { class: "squirtle-select-item" }, `${s}x`);
        li.addEventListener("click", () => {
          const rate = parseFloat(s);
          const video = document.querySelector("video");
          if (video) video.playbackRate = rate;
          const result = document.querySelector(".squirtle-speed-select-result");
          if (result) result.textContent = `${s}x`;
          menu.querySelectorAll(".squirtle-select-item").forEach((el) => {
            el.style.color = el === li ? "#479fd1" : "";
          });
        });
        menu.appendChild(li);
      });
    } catch {}
  }

  patchVideoMenu();
  patchBangumiMenu();

  // SPA navigation
  let lastPath = location.pathname;
  setInterval(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      patchVideoMenu();
      patchBangumiMenu();
    }
  }, 1500);
})();
