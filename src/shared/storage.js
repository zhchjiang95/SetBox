// Thin promise wrapper over chrome.storage.local.

const KEYS = {
  features: "sb_features",
  timingInterval: "sb_timing_interval",
  calcHistory: "sb_calc_history",
  fullscreenUrls: "sb_fullscreen_urls",
};

export const STORAGE_KEYS = KEYS;

const DEFAULT_FEATURES = {
  previewPics: false,
  autoScrolling: false,
  editMode: false,
  grayscale: false,
  timingReload: false,
  mediaSniffer: true,
  autoFullscreen: false,
};

export async function getFeatures() {
  const { [KEYS.features]: features } = await chrome.storage.local.get(KEYS.features);
  return { ...DEFAULT_FEATURES, ...(features || {}) };
}

export async function setFeature(name, value) {
  const features = await getFeatures();
  features[name] = value;
  await chrome.storage.local.set({ [KEYS.features]: features });
  return features;
}

export async function getTimingInterval() {
  const { [KEYS.timingInterval]: v } = await chrome.storage.local.get(KEYS.timingInterval);
  return Number(v) || 30;
}

export async function setTimingInterval(seconds) {
  await chrome.storage.local.set({ [KEYS.timingInterval]: Number(seconds) || 30 });
}

export async function getCalcHistory() {
  const { [KEYS.calcHistory]: list } = await chrome.storage.local.get(KEYS.calcHistory);
  return Array.isArray(list) ? list : [];
}

export async function pushCalcHistory(item) {
  const history = await getCalcHistory();
  history.unshift(item);
  await chrome.storage.local.set({ [KEYS.calcHistory]: history.slice(0, 30) });
}

export async function clearCalcHistory() {
  await chrome.storage.local.set({ [KEYS.calcHistory]: [] });
}

export async function getFullscreenUrls() {
  const { [KEYS.fullscreenUrls]: list } = await chrome.storage.local.get(KEYS.fullscreenUrls);
  if (!Array.isArray(list)) return [];
  // 兼容旧版本的纯字符串数组格式，统一规范为对象结构
  return list
    .map((item) => {
      if (typeof item === "string") {
        return { pattern: item, selector: "" };
      }
      return {
        pattern: String(item?.pattern || "").trim(),
        selector: String(item?.selector || "").trim(),
      };
    })
    .filter((r) => Boolean(r.pattern));
}

export async function setFullscreenUrls(list) {
  const safeList = Array.isArray(list) ? list.filter((r) => Boolean(r && r.pattern)) : [];
  await chrome.storage.local.set({ [KEYS.fullscreenUrls]: safeList });
  return safeList;
}

export async function addFullscreenUrl(urlPattern, selector = "") {
  const pattern = (urlPattern || "").trim();
  const sel = (selector || "").trim();
  if (!pattern) return await getFullscreenUrls();
  const list = await getFullscreenUrls();
  const idx = list.findIndex((item) => item.pattern === pattern);
  if (idx >= 0) {
    list[idx].selector = sel;
  } else {
    list.unshift({ pattern, selector: sel });
  }
  await chrome.storage.local.set({ [KEYS.fullscreenUrls]: list });
  return list;
}

export async function removeFullscreenUrl(urlPattern) {
  const list = await getFullscreenUrls();
  const nextList = list.filter((item) => item.pattern !== urlPattern);
  await chrome.storage.local.set({ [KEYS.fullscreenUrls]: nextList });
  return nextList;
}

