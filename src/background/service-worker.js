// Service worker (MV3). Handles context menus, translation requests,
// and timing-reload tab tracking.

import { translate } from "../shared/translator.js";
import { MSG, FEATURES } from "../shared/messaging.js";
import { getTimingInterval, setTimingInterval } from "../shared/storage.js";

/* -------------------- Context menus -------------------- */
const SEARCH_ENGINES = [
  { id: "sb-search-google", title: '谷歌搜索 "%s"', url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  { id: "sb-search-bing", title: '必应搜索 "%s"', url: (q) => `https://cn.bing.com/search?q=${encodeURIComponent(q)}` },
  { id: "sb-search-baidu", title: '百度搜索 "%s"', url: (q) => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}` },
  { id: "sb-search-baidu-dev", title: '百度开发者搜索 "%s"', url: (q) => `https://kaifa.baidu.com/searchPage?module=SEARCH&wd=${encodeURIComponent(q)}` },
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
    sendResponse({ ok: true });
    return false;
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

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.alarms.clear(ALARM_PREFIX + tabId);
});
