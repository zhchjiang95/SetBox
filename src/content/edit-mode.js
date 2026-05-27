// Page edit mode (designMode = 'on').

(function () {
  const SB = window.__SB;
  if (!SB) return;

  let bar = null;

  function open() {
    if (bar) return;
    document.designMode = "on";
    bar = SB.h("div", { class: "sb-edit-mode" }, [
      SB.h("span", { class: "sb-pill" }, "编辑模式已开启"),
      SB.h("button", { class: "sb-close", title: "关闭", onclick: close }, "×"),
    ]);
    document.body.appendChild(bar);
  }
  function close() {
    document.designMode = "off";
    bar?.remove();
    bar = null;
  }

  SB.onMessage((msg) => {
    if (msg?.type !== SB.MSG.TOGGLE_FEATURE) return;
    if (msg.feature !== SB.FEATURES.EDIT_MODE) return;
    if (msg.enabled) open();
    else close();
    return false;
  });
})();
