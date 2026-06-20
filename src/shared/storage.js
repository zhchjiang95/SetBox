// Thin promise wrapper over chrome.storage.local.

const KEYS = {
  features: "sb_features",
  timingInterval: "sb_timing_interval",
  calcHistory: "sb_calc_history",
};

export const STORAGE_KEYS = KEYS;

const DEFAULT_FEATURES = {
  previewPics: false,
  autoScrolling: false,
  editMode: false,
  grayscale: false,
  timingReload: false,
  mediaSniffer: true,
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
