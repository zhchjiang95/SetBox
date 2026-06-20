// 网页视频嗅探 - 主世界（Main World）脚本
// 核心策略：不再依赖无意义的 blob: URL，而是通过拦截 fetch/XHR 的【响应】来检查 Content-Type，
// 捕获播放器背后实际请求的 CDN 源地址（这些才是真正可下载的链接）。

(function () {
  if (window.__SB_MAIN_SNIFFER_INITIALIZED) return;
  window.__SB_MAIN_SNIFFER_INITIALIZED = true;

  // 已上报的 URL 集合（主世界侧去重）
  const reported = new Set();

  // 上报媒体资源给隔离世界的内容脚本
  function reportMedia(url, type) {
    if (!url || typeof url !== "string") return;
    if (reported.has(url)) return;
    reported.add(url);

    window.dispatchEvent(new CustomEvent("sb-media-detected", {
      detail: { url, type }
    }));
  }

  // 根据 URL 后缀推断媒体类型
  function guessTypeFromUrl(url) {
    if (/\.(m3u8)(\?|$)/i.test(url)) return "m3u8";
    if (/\.(mpd)(\?|$)/i.test(url)) return "mpd";
    if (/\.(mp4|webm|flv|mov|mkv|wmv|3gp|avi)(\?|$)/i.test(url)) return "video";
    if (/\.(mp3|wav|aac|ogg|oga|flac)(\?|$)/i.test(url)) return "audio";
    return null;
  }

  // 根据 Content-Type 推断媒体类型
  function guessTypeFromContentType(ct) {
    if (!ct) return null;
    const lower = ct.toLowerCase();
    if (lower.includes("mpegurl") || lower.includes("x-mpegurl")) return "m3u8";
    if (lower.includes("dash+xml")) return "mpd";
    if (lower.startsWith("video/")) return "video";
    if (lower.startsWith("audio/")) return "audio";
    return null;
  }

  // 通用的 URL 快速排除（非媒体常见资源）
  function isDefinitelyNotMedia(url) {
    return /\.(js|css|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|json|html?|xml|txt|map)(\?|#|$)/i.test(url);
  }

  // 判断是否是流媒体分片（仅在没有 Content-Type 确认时用于过滤）
  function isSegmentUrl(url) {
    return /\.(ts|m4s|mp4s)(\?|$)/i.test(url) ||
           /\/segment[\-_]/i.test(url) ||
           /\/range\//i.test(url);
  }

  // 尝试规范化 URL（用于基于请求 URL 的检测）
  function tryResolveUrl(url) {
    try {
      return new URL(url, window.location.href).href;
    } catch (e) {
      return null;
    }
  }

  // ===================== 1. 拦截 fetch（检查请求 URL + 响应 Content-Type） =====================
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    let requestUrl = "";
    if (typeof input === "string") {
      requestUrl = input;
    } else if (input instanceof Request) {
      requestUrl = input.url;
    }

    const resolved = requestUrl ? tryResolveUrl(requestUrl) : null;

    // 基于 URL 模式的快速检测（m3u8 / mpd / mp4 等明确后缀）
    if (resolved && !isDefinitelyNotMedia(resolved)) {
      const urlType = guessTypeFromUrl(resolved);
      if (urlType) {
        reportMedia(resolved, urlType);
      }
    }

    // 调用原始 fetch 并检查响应的 Content-Type
    const result = originalFetch.apply(this, arguments);
    result.then((response) => {
      try {
        const ct = response.headers.get("content-type") || "";
        const finalUrl = response.url || resolved || "";
        if (!finalUrl || isDefinitelyNotMedia(finalUrl)) return;

        const ctType = guessTypeFromContentType(ct);
        if (ctType) {
          reportMedia(finalUrl, ctType);
        }
      } catch (e) {
        // 某些跨域响应可能无法读取 headers，静默忽略
      }
    }).catch(() => {});

    return result;
  };

  // ===================== 2. 拦截 XMLHttpRequest（检查请求 URL + 响应 Content-Type） =====================
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    if (typeof url === "string") {
      this._sb_url = url;
    }
    return originalOpen.apply(this, arguments);
  };

  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function () {
    const self = this;
    const resolved = self._sb_url ? tryResolveUrl(self._sb_url) : null;

    // 基于 URL 模式的快速检测
    if (resolved && !isDefinitelyNotMedia(resolved)) {
      const urlType = guessTypeFromUrl(resolved);
      if (urlType) {
        reportMedia(resolved, urlType);
      }
    }

    // 监听响应完成事件，检查 Content-Type
    self.addEventListener("load", function () {
      try {
        const ct = self.getResponseHeader("content-type") || "";
        const finalUrl = self.responseURL || resolved || "";
        if (!finalUrl || isDefinitelyNotMedia(finalUrl)) return;

        const ctType = guessTypeFromContentType(ct);
        if (ctType) {
          reportMedia(finalUrl, ctType);
        }
      } catch (e) {
        // 静默忽略
      }
    });

    return originalSend.apply(this, arguments);
  };

  // ===================== 3. 拦截 HTMLMediaElement.prototype.src setter =====================
  const srcDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "src");
  if (srcDescriptor && srcDescriptor.set) {
    const originalSrcSet = srcDescriptor.set;
    Object.defineProperty(HTMLMediaElement.prototype, "src", {
      ...srcDescriptor,
      set: function (val) {
        if (val && typeof val === "string") {
          const resolved = tryResolveUrl(val);
          if (resolved && !resolved.startsWith("blob:")) {
            const type = guessTypeFromUrl(resolved) || "video";
            reportMedia(resolved, type);
          }
        }
        return originalSrcSet.apply(this, arguments);
      }
    });
  }

  // ===================== 4. 拦截 HTMLMediaElement.prototype.play =====================
  const originalPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    const src = this.currentSrc || this.src;
    if (src && !src.startsWith("blob:")) {
      const type = guessTypeFromUrl(src) || "video";
      reportMedia(src, type);
    }
    return originalPlay.apply(this, arguments);
  };

  // ===================== 5. 拦截 URL.createObjectURL（仅记录普通 Blob，忽略 MediaSource） =====================
  const originalCreateObjectURL = URL.createObjectURL;
  URL.createObjectURL = function (obj) {
    const url = originalCreateObjectURL.apply(this, arguments);
    // 只有当参数是带 video/audio MIME 的普通 Blob 时才上报（可以直接下载）
    // MediaSource 创建的 blob: URL 是不可下载的，不上报
    if (obj instanceof Blob && !(typeof MediaSource !== "undefined" && obj instanceof MediaSource)) {
      const mime = obj.type || "";
      if (mime.startsWith("video/") || mime.startsWith("audio/")) {
        reportMedia(url, mime.startsWith("audio/") ? "audio" : "video");
      }
    }
    return url;
  };
})();
