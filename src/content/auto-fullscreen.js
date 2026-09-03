// 网页自动全屏内容脚本：支持指定选择器的元素视口全屏铺满与恢复
(function () {
  const SB = window.__SB;
  if (!SB) return;

  const STYLE_ID = "sb-element-fullscreen-style";
  let activeSelector = null;

  /**
   * 将指定选择器的元素设置为固定视口全屏铺满
   */
  async function applyElementFullscreen(selector) {
    if (!selector) return;
    activeSelector = selector;

    try {
      // 等待目标元素出现（支持 Vue/React 等 SPA 异步挂载）
      const el = await SB.waitFor(selector, { timeout: 10000 });
      if (!el) return;

      let styleEl = document.getElementById(STYLE_ID);
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = STYLE_ID;
        (document.head || document.documentElement).appendChild(styleEl);
      }

      styleEl.textContent = `
        ${selector} {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          max-width: 100vw !important;
          max-height: 100vh !important;
          margin: 0 !important;
          z-index: 2147483647 !important;
          box-sizing: border-box !important;
        }
        body.sb-has-fullscreen-element {
          overflow: hidden !important;
        }
      `;

      document.body.classList.add("sb-has-fullscreen-element");

      // 触发视口 resize 事件，让 ECharts、DataV、Canvas 图表组件自适应重绘
      triggerResize();
    } catch (err) {
      console.warn(`[SetBox] 自动全屏未找到目标元素: ${selector}`, err);
    }
  }

  /**
   * 移除元素全屏样式并恢复网页正常布局
   */
  function removeElementFullscreen() {
    const styleEl = document.getElementById(STYLE_ID);
    if (styleEl) styleEl.remove();
    document.body.classList.remove("sb-has-fullscreen-element");
    activeSelector = null;
    triggerResize();
  }

  /**
   * 连续触发 resize 事件使图表/画布自动调整尺寸
   */
  function triggerResize() {
    window.dispatchEvent(new Event("resize"));
    setTimeout(() => window.dispatchEvent(new Event("resize")), 100);
    setTimeout(() => window.dispatchEvent(new Event("resize")), 300);
  }

  // 监听来自 Background 的全屏元素指令
  SB.onMessage((msg) => {
    if (msg?.type === SB.MSG.FULLSCREEN_ELEMENT) {
      if (msg.selector) {
        applyElementFullscreen(msg.selector);
      } else {
        removeElementFullscreen();
      }
      return false;
    }
  });

  // 按 Esc 键时退出元素全屏
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && activeSelector) {
      removeElementFullscreen();
    }
  });
})();
