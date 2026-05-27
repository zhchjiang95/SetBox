// Selection translator. Shows a small button near the selection;
// clicking it asks the background service worker to translate.

(function () {
  const SB = window.__SB;
  if (!SB) return;

  let btn = null;
  let lastText = "";

  function ensureBtn() {
    if (btn) return btn;
    btn = SB.h("div", { class: "sb-translate-btn", title: "划词翻译" }, "译");
    btn.addEventListener("mousedown", (e) => e.stopPropagation());
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (btn.classList.contains("is-open")) return;
      btn.classList.remove("is-open");
      btn.classList.add("is-loading");
      btn.textContent = "";
      try {
        const resp = await chrome.runtime.sendMessage({ type: SB.MSG.TRANSLATE, text: lastText });
        btn.classList.remove("is-loading");
        if (resp?.ok && resp.results?.length) {
          btn.classList.add("is-open");
          btn.textContent = resp.results.join("\n");
        } else {
          btn.classList.add("is-open");
          btn.textContent = resp?.error ? `翻译失败：${resp.error}` : "翻译失败";
        }
      } catch (err) {
        btn.classList.remove("is-loading");
        btn.classList.add("is-open");
        btn.textContent = "翻译失败：" + err.message;
      }
    });
    document.body.appendChild(btn);
    return btn;
  }

  function reset() {
    if (!btn) return;
    btn.style.display = "none";
    btn.classList.remove("is-open", "is-loading");
    btn.textContent = "译";
  }

  function showAt(rect) {
    const el = ensureBtn();
    reset();
    el.style.display = "flex";
    // Button uses position: fixed, rect coords are already viewport-relative.
    el.style.left = `${Math.max(8, rect.right + 6)}px`;
    el.style.top = `${Math.max(8, rect.top)}px`;
  }

  document.addEventListener(
    "selectionchange",
    SB.debounce(() => {
      const sel = document.getSelection();
      const text = sel?.toString().trim() || "";
      if (!text) {
        reset();
        return;
      }
      lastText = text;
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        reset();
        return;
      }
      showAt(rect);
    }, 350)
  );

  document.addEventListener("mousedown", (e) => {
    if (btn && btn.contains(e.target)) return;
    reset();
  });
})();
