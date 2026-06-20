// 网页视频嗅探 - 隔离世界（Isolated World）脚本
// 负责接收主世界事件、DOM 扫描、Performance API 资源发现，以及与后台 Service Worker 通信。

(function () {
  const SB = window.__SB;
  if (!SB) return;

  let enabled = false;
  const earlyBuffer = [];

  // 1. 立即同步监听主世界的媒体捕获事件，避免因异步读取配置而遗漏早期事件
  window.addEventListener("sb-media-detected", (e) => {
    if (!e.detail || !e.detail.url) return;
    if (enabled) {
      reportMedia(e.detail.url, e.detail.type);
    } else {
      earlyBuffer.push(e.detail);
    }
  });

  // 2. 异步获取功能配置
  chrome.storage.local.get("sb_features", (res) => {
    const features = res.sb_features || {};
    enabled = !!features.mediaSniffer;
    if (enabled) {
      // 释放缓冲区
      while (earlyBuffer.length > 0) {
        const item = earlyBuffer.shift();
        reportMedia(item.url, item.type);
      }
      initSniffer();
    } else {
      earlyBuffer.length = 0;
    }
  });

  // 初始化嗅探
  function initSniffer() {
    if (window.__SB_SNIFFER_INITIALIZED) return;
    window.__SB_SNIFFER_INITIALIZED = true;

    // DOM 扫描
    scanDom();
    const observer = new MutationObserver(SB.debounce(scanDom, 1000));
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Performance API 资源发现（补充手段）
    scanPerformanceEntries();
    try {
      const perfObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          checkPerformanceEntry(entry);
        }
      });
      perfObserver.observe({ entryTypes: ["resource"] });
    } catch (e) {
      // PerformanceObserver 可能在部分环境不可用
    }
  }

  // 扫描 DOM 中的 video/audio 元素
  function scanDom() {
    if (!enabled) return;
    document.querySelectorAll("video, audio").forEach((el) => {
      const src = el.currentSrc || el.src;
      // 跳过 blob: URL（MediaSource 产生的 blob 链接无法直接下载，无用）
      if (src && !src.startsWith("blob:")) {
        reportMedia(src, el.tagName.toLowerCase() === "audio" ? "audio" : "video");
      }
      el.querySelectorAll("source").forEach((source) => {
        if (source.src && !source.src.startsWith("blob:")) {
          reportMedia(source.src, el.tagName.toLowerCase() === "audio" ? "audio" : "video");
        }
      });
    });
  }

  // 扫描 Performance 资源条目
  function scanPerformanceEntries() {
    if (!performance?.getEntriesByType) return;
    performance.getEntriesByType("resource").forEach(checkPerformanceEntry);
  }

  function checkPerformanceEntry(entry) {
    if (!enabled) return;
    const url = entry.name;
    if (!url || url.startsWith("blob:")) return;
    // 根据 initiatorType 或 URL 后缀判断
    if (entry.initiatorType === "video" || entry.initiatorType === "audio") {
      reportMedia(url, entry.initiatorType);
      return;
    }
    // URL 后缀匹配
    if (/\.(mp4|webm|flv|mov|mkv|m3u8|mpd)(\?|$)/i.test(url)) {
      let type = "video";
      if (/\.m3u8(\?|$)/i.test(url)) type = "m3u8";
      else if (/\.mpd(\?|$)/i.test(url)) type = "mpd";
      reportMedia(url, type);
    }
    if (/\.(mp3|wav|aac|ogg|oga|flac)(\?|$)/i.test(url)) {
      reportMedia(url, "audio");
    }
  }

  // 已上报 URL 集合
  const reported = new Set();

  function reportMedia(url, type) {
    if (!enabled) return;
    if (!url || typeof url !== "string") return;
    if (reported.has(url)) return;
    reported.add(url);

    chrome.runtime.sendMessage({
      type: SB.MSG.MEDIA_DETECTED,
      url: url,
      mediaType: type,
      title: document.title || "未知视频"
    }).catch(() => {});
  }

  // 监听 popup/background 的消息
  SB.onMessage((msg) => {
    if (msg?.type === SB.MSG.TOGGLE_FEATURE && msg.feature === "mediaSniffer") {
      enabled = !!msg.enabled;
      if (enabled) {
        while (earlyBuffer.length > 0) {
          const item = earlyBuffer.shift();
          reportMedia(item.url, item.type);
        }
        initSniffer();
      } else {
        earlyBuffer.length = 0;
      }
    }

    // 下载代理
    if (msg?.type === "sb:download-media" && msg.url) {
      SB.download(msg.url, msg.filename || "download");
    }

    return false;
  });
})();
