// Tiny typed messaging helpers shared across contexts.

export const MSG = Object.freeze({
  TRANSLATE: "sb:translate",
  TIMING_RELOAD: "sb:timing-reload",
  TOGGLE_FEATURE: "sb:toggle-feature",
  CONTEXT_SEARCH: "sb:context-search",
  MEDIA_DETECTED: "sb:media-detected",
  GET_MEDIA_LIST: "sb:get-media-list",
  CLEAR_MEDIA_LIST: "sb:clear-media-list",
});

export const FEATURES = Object.freeze({
  PREVIEW_PICS: "previewPics",
  AUTO_SCROLL: "autoScrolling",
  EDIT_MODE: "editMode",
  GRAYSCALE: "grayscale",
  TIMING_RELOAD: "timingReload",
  MEDIA_SNIFFER: "mediaSniffer",
});

/** Send a message to the active tab. Returns the response or null on failure. */
export async function sendToActiveTab(payload) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return null;
    return await chrome.tabs.sendMessage(tab.id, payload);
  } catch (err) {
    // Tabs without a content script (chrome://, edge://) will throw.
    console.debug("[SetBox] sendToActiveTab failed:", err.message);
    return null;
  }
}

/** Promise-based runtime.sendMessage. */
export function sendToBackground(payload) {
  return chrome.runtime.sendMessage(payload).catch((err) => {
    console.debug("[SetBox] sendToBackground failed:", err.message);
    return null;
  });
}
