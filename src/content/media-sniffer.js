// 网页视频嗅探 - 隔离世界（Isolated World）脚本
// 负责接收主世界事件、DOM 扫描、Performance API 资源发现，以及与后台 Service Worker 通信。

(function () {
  const SB = window.__SB;
  if (!SB) return;

  let enabled = false;
  const earlyBuffer = [];

  // 浮窗状态管理
  let userClosedFloat = false;
  let mediaList = [];

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
      // 获取当前已嗅探到的列表并更新浮窗
      fetchAndRenderFloat();
    } else {
      earlyBuffer.length = 0;
    }
  });

  // 从后台获取当前的媒体列表并进行浮窗更新
  function fetchAndRenderFloat() {
    if (window !== window.top) return;
    chrome.runtime.sendMessage({ type: "sb:get-media-list" }, (res) => {
      if (res && res.ok && Array.isArray(res.list)) {
        mediaList = res.list;
        updateFloatWidget();
      }
    });
  }

  // 清除网页左下角的资源列表浮窗
  function removeFloatWidget() {
    const el = document.getElementById("sb-sniffer-float");
    if (el) el.remove();
  }

  // 更新/渲染网页左下角的资源列表浮窗
  function updateFloatWidget() {
    if (!enabled || userClosedFloat || mediaList.length === 0) {
      removeFloatWidget();
      return;
    }

    SB.waitFor("body").then((body) => {
      let widget = document.getElementById("sb-sniffer-float");
      if (!widget) {
        widget = SB.h("div", { id: "sb-sniffer-float", class: "sb-sniffer-float" });
        body.appendChild(widget);
      }

      // 清空旧元素，重新填充
      widget.innerHTML = "";

      // 1. 头部标题和关闭按钮
      const head = SB.h("div", { class: "sb-sniffer-float-head" }, [
        SB.h("span", { class: "sb-sniffer-float-title" }, `集盒已检测到的资源 (${mediaList.length})`),
        SB.h("button", {
          class: "sb-sniffer-float-close",
          title: "关闭",
          onclick: () => {
            userClosedFloat = true;
            removeFloatWidget();
          }
        }, "×")
      ]);

      // 2. 资源列表
      const listEl = SB.h("ul", { class: "sb-sniffer-float-list" });
      mediaList.forEach((item, index) => {
        // 提取文件名
        let filename = "";
        try {
          const parsed = new URL(item.url);
          const lastPart = parsed.pathname.substring(parsed.pathname.lastIndexOf("/") + 1);
          filename = lastPart && lastPart.includes(".") ? decodeURIComponent(lastPart) : "";
        } catch (e) {}

        if (!filename) {
          filename = item.title || "未知资源";
        }

        const badgeClass = item.type.toLowerCase().replace(/[^a-z0-9]/g, "");

        const buttons = [];
        
        // 复制链接按钮
        const copyBtn = SB.h("button", {
          class: "sb-sniffer-float-btn",
          onclick: () => {
            SB.copy(item.url).then(() => {
              copyBtn.textContent = "已复制";
              setTimeout(() => { copyBtn.textContent = "复制"; }, 1500);
            });
          }
        }, "复制");
        buttons.push(copyBtn);

        // 下载按钮（流媒体除外）
        if (item.type !== "m3u8" && item.type !== "mpd") {
          const dlBtn = SB.h("button", {
            class: "sb-sniffer-float-btn",
            onclick: () => {
              SB.download(item.url, filename.includes(".") ? filename : `${filename}.mp4`);
            }
          }, "下载");
          buttons.push(dlBtn);
        }

        const itemEl = SB.h("li", { class: "sb-sniffer-float-item" }, [
          SB.h("span", { class: `sb-sniffer-float-badge ${badgeClass}` }, item.type.toUpperCase()),
          SB.h("span", { class: "sb-sniffer-float-name", title: item.url }, `${index + 1}. ${filename}`),
          SB.h("div", { style: "display: flex; gap: 2px; flex-shrink: 0;" }, buttons)
        ]);

        listEl.appendChild(itemEl);
      });

      widget.appendChild(head);
      widget.appendChild(listEl);
    });
  }

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
      // 跳过 blob: URL
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
      title: document.title || "未知资源"
    }).catch(() => {});
  }

  // 监听 popup/background 的消息
  SB.onMessage((msg) => {
    if (msg?.type === SB.MSG.TOGGLE_FEATURE && msg.feature === "mediaSniffer") {
      enabled = !!msg.enabled;
      if (enabled) {
        userClosedFloat = false; // 重新开启功能时重置关闭标志
        while (earlyBuffer.length > 0) {
          const item = earlyBuffer.shift();
          reportMedia(item.url, item.type);
        }
        initSniffer();
        fetchAndRenderFloat();
      } else {
        earlyBuffer.length = 0;
        removeFloatWidget();
      }
    }

    // 下载代理
    if (msg?.type === "sb:download-media" && msg.url) {
      SB.download(msg.url, msg.filename || "download");
    }

    // 接收后台发来的最新媒体资源列表广播
    if (msg?.type === "sb:media-list-updated") {
      if (window === window.top) {
        mediaList = msg.list || [];
        updateFloatWidget();
      }
    }

    return false;
  });
})();
