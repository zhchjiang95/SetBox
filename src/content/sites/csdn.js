// CSDN: auto-expand collapsed code blocks, add a copy button (no login needed),
// and remove the "follow to read more" wall.

(function () {
  const SB = window.__SB;
  if (!SB) return;

  function init() {
    document.querySelector(".look-more-preCode")?.click();
    const article = document.getElementById("article_content");
    if (article) article.style.height = "auto";
    document.querySelector(".hide-article-box")?.remove();

    document.querySelectorAll(".hljs-button").forEach((btn) => {
      const code =
        btn.previousSibling?.textContent ||
        btn.parentElement?.querySelector("code")?.innerText ||
        btn.closest("code")?.innerText ||
        "";
      const copy = SB.h("div", {
        class: "sb-csdn-copy",
        title: "复制代码",
      }, [SB.h("span", null, "📋"), SB.h("span", { class: "sb-label" }, "复制")]);
      copy.addEventListener("click", async () => {
        await SB.copy(code);
        const label = copy.querySelector(".sb-label");
        if (label) {
          label.textContent = "已复制";
          setTimeout(() => (label.textContent = "复制"), 1600);
        }
      });
      btn.parentElement?.insertBefore(copy, btn);
      btn.remove();
    });
  }

  init();
  // Some article fragments load lazily.
  const obs = new MutationObserver(SB.debounce(init, 800));
  obs.observe(document.body, { childList: true, subtree: true });
})();
