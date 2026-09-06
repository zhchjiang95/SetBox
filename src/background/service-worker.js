// Service worker (MV3). Handles context menus, translation requests,
// and timing-reload tab tracking.

import { translate } from "../shared/translator.js";
import { MSG, FEATURES } from "../shared/messaging.js";
import { getTimingInterval, setTimingInterval, getFeatures, getFullscreenUrls } from "../shared/storage.js";

/* -------------------- Context menus -------------------- */
const SEARCH_ENGINES = [
  { id: "sb-search-google", title: '谷歌搜索 "%s"', url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  { id: "sb-search-bing", title: '必应搜索 "%s"', url: (q) => `https://cn.bing.com/search?q=${encodeURIComponent(q)}` },
  { id: "sb-search-baidu", title: '百度搜索 "%s"', url: (q) => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}` },
];

function installContextMenus() {
  chrome.contextMenus.removeAll(() => {
    for (const { id, title } of SEARCH_ENGINES) {
      chrome.contextMenus.create({
        id,
        title,
        contexts: ["selection"],
      });
    }
  });
}

chrome.runtime.onInstalled.addListener(installContextMenus);
chrome.runtime.onStartup?.addListener(installContextMenus);

chrome.contextMenus.onClicked.addListener((info) => {
  const engine = SEARCH_ENGINES.find((e) => e.id === info.menuItemId);
  if (!engine || !info.selectionText) return;
  chrome.tabs.create({ url: engine.url(info.selectionText) });
});

/* -------------------- Media Sniffer Cache -------------------- */
const tabMedia = {}; // 存储各个标签页检测到的媒体资源列表

/* -------------------- Messaging -------------------- */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg !== "object") return false;

  if (msg.type === MSG.TRANSLATE) {
    translate(msg.text, { from: msg.from, to: msg.to })
      .then((data) => sendResponse({ ok: true, ...data }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true; // async
  }

  if (msg.type === MSG.TOGGLE_FEATURE) {
    if (msg.feature === FEATURES.TIMING_RELOAD) {
      handleTimingReload(sender.tab, msg.enabled, msg.intervalSeconds);
    }
    if (msg.feature === FEATURES.MEDIA_SNIFFER) {
      if (!msg.enabled) {
        // 关闭时清除缓存与徽章数
        for (const tabId of Object.keys(tabMedia)) {
          delete tabMedia[tabId];
          chrome.action.setBadgeText({ tabId: Number(tabId), text: "" }).catch(() => {});
        }
      }
    }
    if (msg.feature === FEATURES.AUTO_FULLSCREEN && msg.enabled) {
      // 开启功能时，若当前激活的标签页已符合规则，立即尝试全屏
      chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        if (tab?.id) {
          checkAndTriggerFullscreen(tab.id, tab.url, tab.windowId);
        }
      }).catch(() => {});
    }
    sendResponse({ ok: true });
    return false;
  }

  // 媒体资源嗅探上报
  if (msg.type === MSG.MEDIA_DETECTED) {
    const tabId = sender.tab?.id;
    if (!tabId) return false;

    if (!tabMedia[tabId]) {
      tabMedia[tabId] = [];
    }

    // 重复性检查
    if (!tabMedia[tabId].some((m) => m.url === msg.url)) {
      tabMedia[tabId].push({
        url: msg.url,
        title: msg.title || "未知视频",
        type: msg.mediaType || "video",
        time: Date.now()
      });

      // 更新徽章数
      const count = tabMedia[tabId].length;
      chrome.action.setBadgeText({ tabId, text: String(count) }).catch(() => {});
      chrome.action.setBadgeBackgroundColor({ tabId, color: "#316cf4" }).catch(() => {});

      // 向页面发送最新的资源列表广播
      chrome.tabs.sendMessage(tabId, {
        type: "sb:media-list-updated",
        list: tabMedia[tabId]
      }).catch(() => {});
    }
    return false;
  }

  // 获取特定标签页的媒体列表
  if (msg.type === MSG.GET_MEDIA_LIST) {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      const list = tab && tabMedia[tab.id] ? tabMedia[tab.id] : [];
      sendResponse({ ok: true, list });
    }).catch((err) => {
      sendResponse({ ok: false, error: err.message });
    });
    return true; // 异步响应
  }

  // 清空特定标签页的媒体列表
  if (msg.type === MSG.CLEAR_MEDIA_LIST) {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.id) {
        delete tabMedia[tab.id];
        chrome.action.setBadgeText({ tabId: tab.id, text: "" }).catch(() => {});
        // 广播空列表以关闭/清理网页上的浮窗
        chrome.tabs.sendMessage(tab.id, {
          type: "sb:media-list-updated",
          list: []
        }).catch(() => {});
      }
      sendResponse({ ok: true });
    }).catch((err) => {
      sendResponse({ ok: false, error: err.message });
    });
    return true; // 异步响应
  }

  // 手动触发当前窗口全屏
  if (msg.type === MSG.TRIGGER_FULLSCREEN) {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.windowId) {
        chrome.windows.update(tab.windowId, { state: "fullscreen" });
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false, error: "未找到活跃窗口" });
      }
    }).catch((err) => {
      sendResponse({ ok: false, error: err.message });
    });
    return true; // 异步响应
  }

  return false;
});

/* -------------------- Timing reload (per-tab alarms) -------------------- */
const ALARM_PREFIX = "sb-reload-";

async function handleTimingReload(senderTab, enabled, intervalSeconds) {
  // The active tab may not equal the sender (popup has no tab); resolve from active tab.
  let tabId = senderTab?.id;
  if (!tabId) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    tabId = tab?.id;
  }
  if (!tabId) return;

  const alarmName = ALARM_PREFIX + tabId;
  if (!enabled) {
    chrome.alarms.clear(alarmName);
    return;
  }
  const seconds = Math.max(30, Number(intervalSeconds) || (await getTimingInterval()));
  await setTimingInterval(seconds);
  // chrome.alarms minimum period is 30s for periodInMinutes < 0.5; we use periodInMinutes.
  chrome.alarms.create(alarmName, { periodInMinutes: seconds / 60 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (!alarm.name.startsWith(ALARM_PREFIX)) return;
  const tabId = Number(alarm.name.slice(ALARM_PREFIX.length));
  chrome.tabs.reload(tabId).catch(() => {
    chrome.alarms.clear(alarm.name);
  });
});

/* -------------------- Auto Fullscreen (网页自动全屏) -------------------- */

/**
 * 匹配当前 URL 是否符合自动全屏规则
 * 返回匹配到的规则对象，若未命中则返回 null
 */
function findMatchingFullscreenRule(url, rules) {
  if (!url || !Array.isArray(rules) || rules.length === 0) return null;
  // 排除浏览器内置系统页面与扩展页面
  if (
    url.startsWith("chrome://") ||
    url.startsWith("edge://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("devtools://") ||
    url.startsWith("about:")
  ) {
    return null;
  }

  return (
    rules.find((rule) => {
      const pattern = (rule?.pattern || (typeof rule === "string" ? rule : "")).trim();
      if (!pattern) return false;

      // 通配符支持（例如 *dashboard* 或 https://example.com/screen/*）
      if (pattern.includes("*")) {
        try {
          const regexStr = "^" + pattern.split("*").map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$";
          return new RegExp(regexStr, "i").test(url);
        } catch {
          return false;
        }
      }

      // 默认做不区分大小写的包含匹配
      return url.toLowerCase().includes(pattern.toLowerCase());
    }) || null
  );
}

/**
 * 检查指定标签页是否命中规则，若命中则将窗口静默切入全屏并处理元素全屏
 */
async function checkAndTriggerFullscreen(tabId, url, windowId) {
  try {
    const features = await getFeatures();
    if (!features.autoFullscreen) return;

    const rules = await getFullscreenUrls();
    if (!rules || !rules.length) return;

    // 如果未传入 url 或 windowId，主动向 tabs 获取
    if (!url || !windowId) {
      const tab = await chrome.tabs.get(tabId);
      url = url || tab?.url;
      windowId = windowId || tab?.windowId;
    }

    const matchedRule = findMatchingFullscreenRule(url, rules);
    if (!matchedRule) return;

    // 1. 检查当前窗口状态，仅在非全屏时执行窗口全屏
    const win = await chrome.windows.get(windowId);
    if (win && win.state !== "fullscreen") {
      await chrome.windows.update(windowId, { state: "fullscreen" });
      console.log(`[SetBox] 自动全屏规则匹配成功，窗口已切换全屏: ${url}`);
    }

    // 2. 如果配置了指定元素选择器，通知页面内容脚本进行元素视口铺满
    if (matchedRule.selector) {
      chrome.tabs.sendMessage(tabId, {
        type: MSG.FULLSCREEN_ELEMENT,
        selector: matchedRule.selector,
      }).catch(() => {});
    }
  } catch (err) {
    console.debug("[SetBox] checkAndTriggerFullscreen error:", err.message);
  }
}

// 标签页更新时：loading 清理媒体缓存；complete 检测自动全屏
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading") {
    delete tabMedia[tabId];
    chrome.action.setBadgeText({ tabId, text: "" }).catch(() => {});
  }
  if (changeInfo.status === "complete" && tab) {
    checkAndTriggerFullscreen(tabId, tab.url, tab.windowId);
  }
});

// 标签页切换激活时：若切到目标页面也确保保持全屏体验
chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  checkAndTriggerFullscreen(tabId, null, windowId);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.alarms.clear(ALARM_PREFIX + tabId);
  delete tabMedia[tabId];
});
