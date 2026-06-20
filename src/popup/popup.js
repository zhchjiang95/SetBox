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

/* -------------------- Media Sniffer -------------------- */
async function initSniffer() {
  const snifferList = $("#sniffer-list");
  const snifferStatus = $("#sniffer-status");
  const clearBtn = $("#sniffer-clear");

  const renderSniffer = async () => {
    const features = await getFeatures();
    
    // 如果嗅探功能未开启
    if (!features.mediaSniffer) {
      snifferStatus.hidden = false;
      snifferList.hidden = true;
      clearBtn.hidden = true;
      snifferStatus.innerHTML = `
        <span>网页资源嗅探功能已关闭</span>
        <button type="button" class="toggle-hint-btn" id="sniffer-enable-btn">开启功能</button>
      `;
      
      const enableBtn = $("#sniffer-enable-btn", snifferStatus);
      if (enableBtn) {
        enableBtn.addEventListener("click", async () => {
          const cb = $(`input[type=checkbox][data-toggle=mediaSniffer]`);
          if (cb) {
            cb.checked = true;
            cb.dispatchEvent(new Event("change"));
            // 稍等一会儿让后台与存储状态更新
            setTimeout(renderSniffer, 100);
          }
        });
      }
      return;
    }

    // 已开启，向 background 请求当前活跃 tab 嗅探到的媒体文件
    const res = await sendToBackground({ type: "sb:get-media-list" });
    if (res && res.ok && Array.isArray(res.list) && res.list.length > 0) {
      snifferStatus.hidden = true;
      snifferList.hidden = false;
      clearBtn.hidden = false;
      snifferList.innerHTML = "";

      res.list.forEach((item) => {
        const li = document.createElement("li");
        li.className = "sniffer-item";

        // 标签类型徽章
        const badge = document.createElement("span");
        const badgeClass = item.type.toLowerCase().replace(/[^a-z0-9]/g, "");
        badge.className = `sniffer-badge ${badgeClass}`;
        badge.textContent = item.type.toUpperCase();

        // 信息区
        const info = document.createElement("div");
        info.className = "sniffer-info";

        // 提取文件名
        let filename = "";
        try {
          const parsed = new URL(item.url);
          const lastPart = parsed.pathname.substring(parsed.pathname.lastIndexOf("/") + 1);
          filename = lastPart && lastPart.includes(".") ? decodeURIComponent(lastPart) : "";
        } catch (e) {}

        if (!filename) {
          filename = item.title || "未知媒体";
        }

        const name = document.createElement("div");
        name.className = "sniffer-name";
        name.textContent = filename;
        name.title = item.url;

        const urlEl = document.createElement("div");
        urlEl.className = "sniffer-url";
        urlEl.textContent = item.url;

        info.appendChild(name);
        info.appendChild(urlEl);

        // 操作按钮区
        const actions = document.createElement("div");
        actions.className = "sniffer-actions";

        // 复制链接按钮（所有类型都支持）
        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "sniffer-btn";
        copyBtn.textContent = "复制";
        copyBtn.addEventListener("click", () => copyText(item.url));
        actions.appendChild(copyBtn);

        // 下载按钮（m3u8/mpd 需要专业工具，仅提供复制链接；其余类型可直接下载）
        if (item.type !== "m3u8" && item.type !== "mpd") {
          const dlBtn = document.createElement("button");
          dlBtn.type = "button";
          dlBtn.className = "sniffer-btn";
          dlBtn.textContent = "下载";
          dlBtn.addEventListener("click", async () => {
            await sendToActiveTab({
              type: "sb:download-media",
              url: item.url,
              filename: filename.includes(".") ? filename : `${filename}.mp4`
            });
            toast("已开始下载...");
          });
          actions.appendChild(dlBtn);
        }

        li.appendChild(badge);
        li.appendChild(info);
        li.appendChild(actions);
        snifferList.appendChild(li);
      });
    } else {
      snifferStatus.hidden = false;
      snifferList.hidden = true;
      clearBtn.hidden = true;
      snifferStatus.innerHTML = `
        <span>暂未捕获到媒体资源</span>
        <span style="font-size: 11px; opacity: 0.7;">播放网页视频可自动触发嗅探</span>
      `;
    }
  };

  // 清空按钮事件
  clearBtn.addEventListener("click", async () => {
    const res = await sendToBackground({ type: "sb:clear-media-list" });
    if (res && res.ok) {
      toast("已清空当前列表");
      renderSniffer();
    }
  });

  // 点击 sniffer tab 时重新渲染
  const snifferTab = $(".tab[data-tab=sniffer]");
  if (snifferTab) {
    snifferTab.addEventListener("click", renderSniffer);
  }

  // 初始加载
  await renderSniffer();
}

/* -------------------- Boot -------------------- */
initTabs();
initTranslator();
initCalculator();
initToggles();
initPinyin();
initSniffer();
