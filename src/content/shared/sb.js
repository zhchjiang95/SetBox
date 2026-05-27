// Shared utilities for content scripts. Exposed on window.__SB.
// IMPORTANT: This is a classic script, no ES modules in content scripts (MV3).

(function () {
  if (window.__SB) return;

  const FEATURES = Object.freeze({
    PREVIEW_PICS: "previewPics",
    AUTO_SCROLL: "autoScrolling",
    EDIT_MODE: "editMode",
    GRAYSCALE: "grayscale",
    TIMING_RELOAD: "timingReload",
  });

  const MSG = Object.freeze({
    TRANSLATE: "sb:translate",
    TIMING_RELOAD: "sb:timing-reload",
    TOGGLE_FEATURE: "sb:toggle-feature",
    CONTEXT_SEARCH: "sb:context-search",
  });

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $$(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  /** Create element with attributes and children. */
  function h(tag, props, children) {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (k === "class") el.className = v;
        else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
        else if (k === "dataset") Object.assign(el.dataset, v);
        else if (k.startsWith("on") && typeof v === "function") {
          el.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (v != null) el.setAttribute(k, v);
      }
    }
    if (children != null) {
      const arr = Array.isArray(children) ? children : [children];
      for (const c of arr) {
        if (c == null) continue;
        el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      }
    }
    return el;
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function throttle(fn, ms) {
    let last = 0;
    let timer = null;
    return function (...args) {
      const now = Date.now();
      if (now - last >= ms) {
        last = now;
        fn.apply(this, args);
      } else {
        clearTimeout(timer);
        timer = setTimeout(() => {
          last = Date.now();
          fn.apply(this, args);
        }, ms - (now - last));
      }
    };
  }

  /** Wait for an element matching `selector` (uses MutationObserver). */
  function waitFor(selector, { root = document, timeout = 15000 } = {}) {
    return new Promise((resolve, reject) => {
      const initial = (root || document).querySelector(selector);
      if (initial) return resolve(initial);
      const obs = new MutationObserver(() => {
        const found = (root || document).querySelector(selector);
        if (found) {
          obs.disconnect();
          clearTimeout(timer);
          resolve(found);
        }
      });
      obs.observe(root || document, { childList: true, subtree: true });
      const timer = setTimeout(() => {
        obs.disconnect();
        reject(new Error(`waitFor timeout: ${selector}`));
      }, timeout);
    });
  }

  /** Listen on the runtime, returning a removal handle. */
  function onMessage(handler) {
    const wrapped = (msg, sender, sendResponse) => {
      try {
        const r = handler(msg, sender, sendResponse);
        if (r === true) return true;
      } catch (e) {
        console.warn("[SetBox] msg handler error", e);
      }
    };
    chrome.runtime.onMessage.addListener(wrapped);
    return () => chrome.runtime.onMessage.removeListener(wrapped);
  }

  /** Trigger a download for a URL with given filename. */
  async function download(url, filename) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename || "";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    } catch (e) {
      console.warn("[SetBox] download failed", e);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "";
      a.target = "_blank";
      a.click();
    }
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } finally {
        ta.remove();
      }
      return true;
    }
  }

  window.__SB = { FEATURES, MSG, $, $$, h, debounce, throttle, waitFor, onMessage, download, copy };
})();
