// Timing reload is implemented in the service worker via chrome.alarms,
// so this script only needs to acknowledge the toggle for parity.
// (Logic lives in src/background/service-worker.js.)

(function () {
  const SB = window.__SB;
  if (!SB) return;

  SB.onMessage((msg) => {
    if (msg?.type !== SB.MSG.TOGGLE_FEATURE) return;
    if (msg.feature !== SB.FEATURES.TIMING_RELOAD) return;
    // No in-page UI for now. Background owns the alarm.
    return false;
  });
})();
