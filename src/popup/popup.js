import { translate, LANG_LABEL, detectSourceLang, flipLang } from "../shared/translator.js";
import { evaluate, formatResult } from "../shared/calculator.js";
import {
  getFeatures,
  setFeature,
  getTimingInterval,
  setTimingInterval,
  getCalcHistory,
  pushCalcHistory,
  clearCalcHistory,
} from "../shared/storage.js";
import { sendToActiveTab, sendToBackground, MSG, FEATURES } from "../shared/messaging.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/* -------------------- Tabs -------------------- */
function initTabs() {
  $$(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".tab").forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", active);
      });
      $$(".panel").forEach((p) => {
        p.hidden = p.dataset.panel !== btn.dataset.tab;
      });
    });
  });
}

/* -------------------- Toast -------------------- */
let toastTimer;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 1600);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`已复制：${text.length > 20 ? text.slice(0, 20) + "…" : text}`);
  } catch {
    toast("复制失败");
  }
}

/* -------------------- Translator -------------------- */
function initTranslator() {
  const input = $("#trans-input");
  const result = $("#trans-result");
  const toggle = $("#trans-toggle");
  const fromEl = toggle.querySelector("[data-from]");
  const toEl = toggle.querySelector("[data-to]");
  const swap = toggle.querySelector(".swap");

  let currentTo = "";

  const renderEmpty = (text) => {
    result.innerHTML = "";
    const li = document.createElement("li");
    li.className = "trans-empty";
    li.textContent = text;
    result.appendChild(li);
  };

  const renderLoading = () => {
    result.innerHTML = '<li class="trans-loading">翻译中…</li>';
  };

  const renderResults = (items) => {
    result.innerHTML = "";
    items.forEach((text) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "trans-pill";
      btn.innerHTML = `<span class="copy-ico">⧉</span><span class="trans-text"></span>`;
      btn.querySelector(".trans-text").textContent = text;
      btn.addEventListener("click", () => copyText(text));
      li.appendChild(btn);
      result.appendChild(li);
    });
  };

  const setLangs = (from, to) => {
    currentTo = to;
    fromEl.textContent = LANG_LABEL[from] || from;
    toEl.textContent = LANG_LABEL[to] || to;
    toggle.hidden = false;
  };

  const run = async (forceFrom) => {
    const text = input.value.trim();
    if (!text) {
      toggle.hidden = true;
      renderEmpty("翻译结果");
      return;
    }
    const from = forceFrom || detectSourceLang(text);
    const to = flipLang(from);
    setLangs(from, to);
    renderLoading();
    try {
      const { results } = await translate(text, { from, to });
      if (!results.length) {
        renderEmpty("无翻译结果");
        return;
      }
      renderResults(results);
    } catch (err) {
      console.warn("[SetBox] translate", err);
      renderEmpty("翻译失败（网络异常或被拦截）");
    }
  };

  input.addEventListener("input", debounce(() => run(), 600));
  swap.addEventListener("click", () => run(currentTo));
}

/* -------------------- Calculator -------------------- */
async function initCalculator() {
  const input = $("#calc-input");
  const result = $("#calc-result");
  const valEl = result.querySelector(".val");
  const historyEl = $("#calc-history");
  const clearBtn = $("#calc-clear");

  const renderHistory = async () => {
    const history = await getCalcHistory();
    historyEl.innerHTML = "";
    history.forEach(({ expr, value }) => {
      const li = document.createElement("li");
      li.title = "点击复用";
      li.innerHTML = `<span class="expr"></span><span class="val"></span>`;
      li.querySelector(".expr").textContent = expr;
      li.querySelector(".val").textContent = "= " + value;
      li.addEventListener("click", () => {
        input.value = expr;
        input.dispatchEvent(new Event("input"));
        input.focus();
      });
      historyEl.appendChild(li);
    });
  };

  const compute = () => {
    const expr = input.value.trim();
    if (!expr) {
      result.hidden = true;
      result.classList.remove("is-error");
      return null;
    }
    try {
      const v = evaluate(expr);
      valEl.textContent = formatResult(v);
      result.hidden = false;
      result.classList.remove("is-error");
      return formatResult(v);
    } catch {
      valEl.textContent = "表达式错误";
      result.hidden = false;
      result.classList.add("is-error");
      return null;
    }
  };

  input.addEventListener("input", compute);
  input.addEventListener("keypress", async (e) => {
    if (e.key !== "Enter") return;
    const value = compute();
    if (!value) return;
    await pushCalcHistory({ expr: input.value.trim(), value });
    input.value = "";
    result.hidden = true;
    await renderHistory();
  });

  clearBtn.addEventListener("click", async () => {
    await clearCalcHistory();
    await renderHistory();
  });

  await renderHistory();
}

/* -------------------- Feature toggles -------------------- */
async function initToggles() {
  const features = await getFeatures();

  for (const cb of $$("input[type=checkbox][data-toggle]")) {
    const name = cb.dataset.toggle;
    cb.checked = !!features[name];
    cb.addEventListener("change", async () => {
      let payload = { type: MSG.TOGGLE_FEATURE, feature: name, enabled: cb.checked };

      if (name === FEATURES.TIMING_RELOAD && cb.checked) {
        const seconds = Number(prompt("请输入刷新间隔秒数（默认 30，最小 30）：", await getTimingInterval())) || 30;
        const safe = Math.max(30, seconds);
        await setTimingInterval(safe);
        payload.intervalSeconds = safe;
      }

      await setFeature(name, cb.checked);
      // Tell background (for tab-scoped logic like timing reload)
      await sendToBackground(payload);
      // Tell active tab content script (for in-page UI)
      await sendToActiveTab(payload);
    });
  }
}

/* -------------------- Pinyin sheet -------------------- */
async function initPinyin() {
  const sheet = $("#pinyin-sheet");
  const input = $("#pinyin-input");
  const out = $("#pinyin-result");

  let pinyinReady = null;
  const loadPinyin = () => {
    if (pinyinReady) return pinyinReady;
    pinyinReady = new Promise((resolve, reject) => {
      const dict = document.createElement("script");
      dict.src = "src/vendor/pinyin/pinyin_dict_withtone.js";
      dict.onload = () => {
        const util = document.createElement("script");
        util.src = "src/vendor/pinyin/pinyinUtil.js";
        util.onload = resolve;
        util.onerror = reject;
        document.head.appendChild(util);
      };
      dict.onerror = reject;
      document.head.appendChild(dict);
    });
    return pinyinReady;
  };

  $$(".feat[data-feat=pinyin]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      input.value = "";
      out.innerHTML = "";
      try {
        await loadPinyin();
      } catch (e) {
        console.warn("[SetBox] pinyin load failed", e);
      }
      sheet.showModal();
      input.focus();
    });
  });

  $$("[data-close]", sheet).forEach((b) =>
    b.addEventListener("click", () => sheet.close())
  );

  input.addEventListener(
    "input",
    debounce(() => {
      const value = input.value.trim();
      if (!value) {
        out.innerHTML = "";
        return;
      }
      const util = window.pinyinUtil;
      if (!util) return;
      const arr = util.getPinyin(value, " ", true, true);
      const items = Array.isArray(arr) ? arr : [arr];
      out.innerHTML = "";
      items.forEach((s) => {
        const li = document.createElement("li");
        li.textContent = s;
        out.appendChild(li);
      });
    }, 300)
  );
}

/* -------------------- Boot -------------------- */
initTabs();
initTranslator();
initCalculator();
initToggles();
initPinyin();
