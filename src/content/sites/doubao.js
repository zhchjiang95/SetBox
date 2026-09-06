// 豆包 (doubao.com) AI 生成图片无水印还原
// 核心原理：
// 1. 豆包服务端在返回图片数据时，数据包（creations 字段）中本身就包含了无水印的原图地址（image_ori_raw.url）。
// 2. 页面默认展示和下载所引用的字段（image_ori, image_preview 等）被拼接了带 ~tplv- 开头的水印及压缩模板参数。
// 3. 本脚本运行在主世界（MAIN World），在最底层 Hook window.JSON.parse，将图片各展示字段的原地篡改为无水印原图，
//    并建立路径映射表，全链路拦截 fetch、XHR、new Image() 及 a 标签点击下载，确保展示与下载均为高清无水印大图。

(function () {
  "use strict";

  // 防止脚本被重复执行
  if (window.__SB_DOUBAO_WATERMARK_REMOVER__) return;
  window.__SB_DOUBAO_WATERMARK_REMOVER__ = true;

  /* ------------------------ 常量定义 ------------------------ */

  // 数据结构中的关键字段名
  const CREATIONS = "creations";
  const IMAGE_ORI_RAW = "image_ori_raw";
  const IMAGE_ORI = "image_ori";
  const IMAGE_PREVIEW = "image_preview";
  const IMAGE_THUMB = "image_thumb";
  const IMAGE_PREVIEW_RESIZE = "image_preview_resize";

  // 需要替换为无水印 URL 的图片字段列表
  const IMAGE_KEYS = [IMAGE_ORI, IMAGE_PREVIEW, IMAGE_THUMB, IMAGE_PREVIEW_RESIZE];

  // 缓存容量上限（防止长时间对话占用过多内存）
  const MAX_CACHE_SIZE = 300;

  /* ------------------------ 原生方法引用 ------------------------ */

  const nativeJSONParse = window.JSON.parse;
  const nativeFetch = window.fetch;
  const nativeXHROpen = XMLHttpRequest.prototype.open;
  const nativeAnchorClick = HTMLAnchorElement.prototype.click;

  /* ------------------------ 缓存与映射 ------------------------ */

  // 路径键（截断 ~tplv- 参数的 pathname） -> 原始无水印完整 URL
  const rawByPath = new Map();

  // 规范化字符串缓存，避免重复正则替换
  const normCache = new Map();
  // 路径键缓存
  const pathKeyCache = new Map();

  // 辅助函数：控制 Map 尺寸，超出上限则移除最旧的一项（LRU 策略）
  function limitMapSize(map, maxSize) {
    while (map.size > maxSize) {
      const oldestKey = map.keys().next().value;
      map.delete(oldestKey);
    }
  }

  /* ------------------------ 工具函数 ------------------------ */

  /**
   * 规范化字符串：
   * - 还原转义斜杠 \/ 和 unicode 转义 \u002F
   * - 还原 HTML 实体 &amp;
   */
  function normalizeString(s) {
    if (typeof s !== "string") return s;
    if (normCache.has(s)) return normCache.get(s);

    const normalized = s
      .replace(/\\u002F/g, "/")
      .replace(/\\\//g, "/")
      .replace(/&amp;/g, "&");

    normCache.set(s, normalized);
    limitMapSize(normCache, MAX_CACHE_SIZE);
    return normalized;
  }

  /**
   * 提取 URL 的“路径特征键”：
   * 去除查询参数，并截取到 ~tplv- 模板参数之前的部分，
   * 只要是同一张图片，无论带有什么水印或缩放参数，该路径键均一致。
   */
  function getPathKey(url) {
    if (typeof url !== "string") return "";
    if (pathKeyCache.has(url)) return pathKeyCache.get(url);

    try {
      const parsed = new URL(normalizeString(url), location.href);
      const tplvIndex = parsed.pathname.indexOf("~tplv-");
      const key = tplvIndex >= 0 ? parsed.pathname.slice(0, tplvIndex) : parsed.pathname;
      pathKeyCache.set(url, key);
      limitMapSize(pathKeyCache, MAX_CACHE_SIZE);
      return key;
    } catch {
      pathKeyCache.set(url, "");
      limitMapSize(pathKeyCache, MAX_CACHE_SIZE);
      return "";
    }
  }

  /**
   * 判断一个 URL 是否为合法的原始无水印 URL
   * 验证条件：包含 ~tplv- 模板参数，且路径或参数中含有 image_raw 或 ori_raw 标识
   */
  function isValidRawUrl(url) {
    if (typeof url !== "string" || !url.includes("~tplv-")) return false;
    return /(image_raw|ori_raw)/i.test(url);
  }

  /**
   * 将带水印的 URL 重写为原始无水印 URL（如果映射表中已存在记录）
   */
  function rewriteForDownload(url) {
    if (typeof url !== "string" || !url.includes("~tplv-")) return url;
    const key = getPathKey(url);
    return key ? rawByPath.get(key) || url : url;
  }

  /* ------------------------ 核心：处理解析后的 JSON 数据 ------------------------ */

  /**
   * 遍历处理 JSON 数据：
   * - 快速初筛是否含有 creations 关键字
   * - 深入遍历并替换图片对象为无水印 URL
   */
  function processParsedData(text, data) {
    if (typeof text !== "string" || text.indexOf(CREATIONS) === -1) {
      return data;
    }
    traverseData(data);
    return data;
  }

  /**
   * 递归遍历对象/数组，寻找包含 creations 属性的节点
   */
  function traverseData(value) {
    if (!value || typeof value !== "object") return;

    const isPlainObject = !Array.isArray(value);

    // 如果当前对象自身包含 creations 属性，优先处理
    if (isPlainObject && Object.prototype.hasOwnProperty.call(value, CREATIONS)) {
      processCreationList(value[CREATIONS]);
    }

    // 递归遍历其余子属性
    for (const key of Object.keys(value)) {
      if (isPlainObject && key === CREATIONS) continue; // 避免重复处理
      const child = value[key];
      if (child && typeof child === "object") {
        traverseData(child);
      }
    }
  }

  /**
   * 处理 creations 数组：
   * 1. 提取每个条目里的原始无水印 URL（image_ori_raw.url）
   * 2. 将 image_ori、image_preview、image_thumb 等所有展示字段的 url 篡改为无水印原图
   * 3. 提取路径键并存入 rawByPath 映射表，供后续下载与网络拦截使用
   */
  function processCreationList(creationList) {
    if (!Array.isArray(creationList)) return;

    for (let i = 0; i < creationList.length; i++) {
      const item = creationList[i];
      const image = item && item.image;
      if (!image) continue;

      // 获取原始无水印图片地址
      const rawUrl = image[IMAGE_ORI_RAW] && image[IMAGE_ORI_RAW].url;
      if (!rawUrl) continue;

      const normalizedRaw = normalizeString(rawUrl);
      const rawValid = isValidRawUrl(normalizedRaw);
      const rawKey = rawValid ? getPathKey(normalizedRaw) : "";

      // 遍历所有需要替换的字段并原地覆盖其 url
      for (let j = 0; j < IMAGE_KEYS.length; j++) {
        const imageKey = IMAGE_KEYS[j];
        const imageField = image[imageKey];
        if (!imageField || !imageField.url) continue;

        imageField.url = rawUrl;
      }

      // 记录路径映射
      if (rawValid && rawKey) {
        rawByPath.set(rawKey, normalizedRaw);
        limitMapSize(rawByPath, MAX_CACHE_SIZE);
      }
    }
  }

  /* ------------------------ 1. 拦截 window.JSON.parse ------------------------ */

  // 在前端业务解析后端接口返回的 JSON 时介入篡改
  window.JSON.parse = function (text, reviver) {
    const data = nativeJSONParse.call(this, text, reviver);
    return processParsedData(text, data);
  };

  /* ------------------------ 2. 拦截网络请求 ------------------------ */

  // 拦截 window.fetch：重写目标图片资源地址为无水印地址
  if (typeof nativeFetch === "function") {
    window.fetch = function patchedFetch(resource, init) {
      let nextResource = resource;
      try {
        if (typeof resource === "string") {
          nextResource = rewriteForDownload(resource);
        } else if (resource instanceof Request) {
          const rewritten = rewriteForDownload(resource.url);
          if (rewritten !== resource.url) {
            nextResource = new Request(rewritten, resource);
          }
        }
      } catch {
        // 忽略异常，保持原生请求
      }
      return nativeFetch.call(this, nextResource, init);
    };
  }

  // 拦截 XMLHttpRequest.prototype.open：重写请求 URL
  XMLHttpRequest.prototype.open = function patchedOpen(method, url, ...rest) {
    let nextUrl = String(url || "");
    try {
      nextUrl = rewriteForDownload(nextUrl);
      this.__sb_doubao_url = nextUrl;
    } catch {
      // 忽略异常
    }
    return nativeXHROpen.call(this, method, nextUrl, ...rest);
  };

  /* ------------------------ 3. 拦截 Image.src（下载场景） ------------------------ */

  // 拦截 HTMLImageElement 的 src setter：
  // 离线创建的 Image 对象（未挂载在 DOM 上）通常用于 canvas 绘制并保存图片，在此处重写为无水印 URL
  const imgSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
  if (imgSrcDescriptor && imgSrcDescriptor.set) {
    Object.defineProperty(HTMLImageElement.prototype, "src", {
      configurable: true,
      enumerable: imgSrcDescriptor.enumerable,
      get: imgSrcDescriptor.get,
      set(value) {
        const raw = String(value || "");
        const next = this.isConnected ? raw : rewriteForDownload(raw);
        return imgSrcDescriptor.set.call(this, next);
      },
    });
  }

  /* ------------------------ 4. 拦截链接点击与下载 ------------------------ */

  /**
   * 尝试将 a 标签的 href 替换为无水印 URL
   */
  function tryPatchAnchor(anchor) {
    if (!(anchor instanceof HTMLAnchorElement)) return;

    const href = anchor.getAttribute("href") || anchor.href || "";
    if (!href.includes("~tplv-")) return;

    const next = rewriteForDownload(href);
    if (next && next !== href) {
      anchor.setAttribute("href", next);
    }
  }

  // 在捕获阶段监听全文档的 click 事件，保证在浏览器默认点击跳转或下载之前先完成替换
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!anchor) return;

      tryPatchAnchor(anchor);
    },
    true
  );

  // 拦截程序式调用的 a.click()
  HTMLAnchorElement.prototype.click = function patchedAnchorClick(...args) {
    try {
      tryPatchAnchor(this);
    } catch {
      // 忽略异常
    }
    return nativeAnchorClick.apply(this, args);
  };

  /* ------------------------ 调试接口 ------------------------ */

  window.__SB_DOUBAO_DEBUG__ = {
    rawByPath,
    rewriteForDownload,
  };
})();
