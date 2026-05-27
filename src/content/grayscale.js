// Toggleable grayscale filter for the entire page.

(function () {
  const STYLE_ID = "sb-grayscale-style";

  function inject() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `html { filter: grayscale(100%) !important; }`;
    (document.head || document.documentElement).appendChild(style);
  }
  function remove() {
    document.getElementById(STYLE_ID)?.remove();
  }

  // SB may not be available at document_start; use bare chrome.runtime.
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type !== "sb:toggle-feature") return;
    if (msg.feature !== "grayscale") return;
    if (msg.enabled) inject();
    else remove();
  });
})();
