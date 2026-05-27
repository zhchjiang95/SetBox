// Image collector. Listens for image loads in the page and surfaces a panel.
// MV3 has no webRequestBlocking; we collect from the DOM via MutationObserver
// + a lightweight Image() probe for performance entries.

(function () {
  const SB = window.__SB;
  if (!SB) return;

  let panel = null;
  const seen = new Set();

  function collectFromDom() {
    document.querySelectorAll("img").forEach((img) => {
      const url = img.currentSrc || img.src;
      if (url && /^https?:/.test(url)) seen.add(url);
    });
    // Background images (best-effort, common patterns)
    document.querySelectorAll("[style*='background']").forEach((el) => {
      const m = (el.getAttribute("style") || "").match(/url\(["']?(https?:[^"')]+)["']?\)/);
      if (m) seen.add(m[1]);
    });
  }

  function observeImages() {
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.tagName === "IMG" && node.src) {
            seen.add(node.src);
          } else if (node.querySelectorAll) {
            node.querySelectorAll("img").forEach((img) => {
              if (img.src) seen.add(img.src);
            });
          }
        }
      }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  function pickPerformanceImages() {
    if (!performance?.getEntriesByType) return;
    performance.getEntriesByType("resource").forEach((e) => {
      if (e.initiatorType === "img" || /\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/i.test(e.name)) {
        seen.add(e.name);
      }
    });
  }

  function buildPanel() {
    if (panel) panel.remove();
    pickPerformanceImages();
    collectFromDom();

    const head = SB.h("div", { class: "sb-imgbox-head" }, [
      SB.h("span", { class: "sb-title" }, `图片匣子 · ${seen.size}`),
      SB.h("span", { class: "sb-actions" }, [
        SB.h("button", { title: "刷新", onclick: buildPanel }, "↻"),
        SB.h("button", { title: "关闭", onclick: close }, "×"),
      ]),
    ]);
    const grid = SB.h("div", { class: "sb-imgbox-grid" });

    if (seen.size === 0) {
      grid.appendChild(SB.h("div", { class: "sb-imgbox-empty" }, "暂未捕获到图片，滚动页面后点击 ↻"));
    } else {
      Array.from(seen).slice(0, 200).forEach((url) => {
        const img = SB.h("img", { loading: "lazy", referrerpolicy: "no-referrer" });
        img.dataset.src = url;
        img.addEventListener("click", () => window.open(url, "_blank"));
        grid.appendChild(img);
      });
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.src = e.target.dataset.src;
            io.unobserve(e.target);
          }
        }
      }, { root: grid });
      grid.querySelectorAll("img").forEach((img) => io.observe(img));
    }

    panel = SB.h("div", { class: "sb-imgbox" }, [head, grid]);
    document.body.appendChild(panel);
    enableDrag(head);
  }

  function enableDrag(handle) {
    let startX, startY, originX, originY, dragging = false;
    handle.addEventListener("mousedown", (e) => {
      if (e.target.tagName === "BUTTON") return;
      dragging = true;
      const rect = panel.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      originX = rect.left;
      originY = rect.top;
      e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      panel.style.left = originX + (e.clientX - startX) + "px";
      panel.style.top = originY + (e.clientY - startY) + "px";
      panel.style.right = "auto";
    });
    document.addEventListener("mouseup", () => (dragging = false));
  }

  function close() {
    panel?.remove();
    panel = null;
  }

  observeImages();

  SB.onMessage((msg) => {
    if (msg?.type !== SB.MSG.TOGGLE_FEATURE) return;
    if (msg.feature !== SB.FEATURES.PREVIEW_PICS) return;
    if (msg.enabled) buildPanel();
    else close();
    return false;
  });
})();
