// Auto-scroll toolbar with adjustable speed.

(function () {
  const SB = window.__SB;
  if (!SB) return;

  let toolbar = null;
  let raf = 0;
  let running = false;
  // pixels per frame
  let speed = 1;
  // step display
  const refs = {};

  function render() {
    if (toolbar) toolbar.remove();
    refs.label = SB.h("span", { class: "sb-pill" }, `${speed}px/帧`);
    refs.slow = SB.h("button", { title: "更慢", onclick: () => setSpeed(speed - 1) }, "⟪");
    refs.play = SB.h("button", { title: "播放", onclick: play }, "▶");
    refs.pause = SB.h("button", { title: "暂停", onclick: pause, style: { display: "none" } }, "⏸");
    refs.fast = SB.h("button", { title: "更快", onclick: () => setSpeed(speed + 1) }, "⟫");
    refs.close = SB.h("button", { class: "sb-close", title: "关闭", onclick: close }, "×");

    toolbar = SB.h("div", { class: "sb-toolbar" }, [refs.slow, refs.play, refs.pause, refs.fast, refs.label, refs.close]);
    document.body.appendChild(toolbar);
  }

  function setSpeed(v) {
    speed = Math.max(1, Math.min(50, v));
    refs.label.textContent = `${speed}px/帧`;
  }

  function step() {
    if (!running) return;
    const before = window.scrollY;
    window.scrollBy(0, speed);
    if (window.scrollY === before) {
      // Reached bottom
      pause();
      return;
    }
    raf = requestAnimationFrame(step);
  }

  function play() {
    if (running) return;
    running = true;
    refs.play.style.display = "none";
    refs.pause.style.display = "";
    raf = requestAnimationFrame(step);
  }
  function pause() {
    running = false;
    cancelAnimationFrame(raf);
    refs.play.style.display = "";
    refs.pause.style.display = "none";
  }
  function close() {
    pause();
    toolbar?.remove();
    toolbar = null;
  }

  SB.onMessage((msg) => {
    if (msg?.type !== SB.MSG.TOGGLE_FEATURE) return;
    if (msg.feature !== SB.FEATURES.AUTO_SCROLL) return;
    if (msg.enabled) render();
    else close();
    return false;
  });
})();
