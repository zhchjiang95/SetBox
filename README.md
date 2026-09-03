# 集盒 SetBox

一个工具集合盒子的浏览器扩展，专注小而实用。

## v2.1.0

完整重构。

- 升级到 **Manifest V3**（service worker、`chrome.alarms`、`chrome.scripting`）
- 移除 jQuery / Bootstrap / ClipboardJS，全部使用原生 DOM、`navigator.clipboard`、`MutationObserver`、`IntersectionObserver`
- 弹窗与共享逻辑使用 **ES Modules**；内容脚本使用 IIFE + 共享 `window.__SB`
- 翻译模块带 token 缓存与 Google 兜底，定位与失败提示更精准
- 计算器使用自实现的递归下降解析器（无 `eval`/`new Function`）
- 设置项落地到 `chrome.storage.local`，跨会话保留
- 定时刷新交由 `chrome.alarms` 管理，按 tab 维度持久
- 划词翻译只在选区有效时显示，结束选区即收起
- 图片匣子使用 DOM + Performance Timing 收集，无需 `webRequest`，可拖拽

## 已支持

通用：

- 划词翻译（Bing 主，Google 备）
- 自动滚动（可调速）
- 网页编辑模式
- 定时刷新（按当前标签页）
- 图片匣子（懒加载、可拖拽）
- 网页置灰
- 右键多平台搜索（谷歌 / 必应 / 百度 / 百度开发者）
- 网页资源嗅探（默认开启，自动捕获视频/音频真实源地址，支持 bilibili, 抖音等网站）
- 网页自动全屏（目标网址加载完成时自动进入 F11 全屏，适合大屏看板、展厅展示、沉浸浏览等）

站点增强：

- bilibili 视频与番剧增加 2.5x / 3x / 3.5x / 4x 倍速
- 古诗文网移除 WeChat 登录弹窗
- gying.net 倍速菜单整理
- CSDN 自动展开、免登录复制、移除「关注」墙
- 网易云专辑/音乐下载（需先播放后点下载）
- 豆瓣电影页快捷搜片入口
- 标贝 TTS 字数解锁与语音下载

弹窗：

- 翻译（粘贴或输入即译）
- 计算器（含历史，按 Enter 入库）
- 汉字转拼音
- 自动全屏配置（一键填入当前页、指定元素选择器全屏、通配符规则管理、一键全屏窗口）

### 网页自动全屏说明

- **场景与痛点**：普通网页 JS（`element.requestFullscreen()`）受浏览器瞬态手势策略（User Activation）限制，无法在页面打开或刷新后自动无感全屏。
- **实现原理**：
  1. **窗口全屏**：集盒借助 Manifest V3 的 `chrome.windows.update(windowId, { state: 'fullscreen' })` API，在目标网址加载完成（`complete`）或切换激活时静默将浏览器窗口切入全屏模式（等同按 F11，彻底隐藏地址栏与标签页）。
  2. **元素全屏**：若配置了元素选择器（如 `#my-screen`、`.chart-container`），内容脚本将自动使用 `position: fixed !important; inset: 0 !important;` 将该元素铺满整个物理屏幕视口，并触发图表 `resize` 自适应重绘。按键盘 `Esc` 键即可退出元素全屏。
- **配置方式**：
  1. 在弹窗「更多工具 -> 开关」开启「网页自动全屏」。
  2. 点击「自动全屏配置」按钮：
     - 点击「填入当前页面」快速将当前网址写入输入框；
     - 在「元素选择器」中填入需要单独全屏的元素 ID 或 CSS 选择器（如 `#my-chart` 或 `#dashboard`，留空则整页全屏）；
     - 也可手动输入前缀、关键字（如 `http://localhost:3000`、`192.168.1.100`、`/dashboard`）或带通配符的规则（如 `*screen*`）；
     - 点击「添加规则」入库；列表清晰标识「整页」或具体「选择器」；
     - 可随时单条删除规则，或点击「立即全屏窗口」测试窗口全屏效果。

## 目录结构

```
manifest.json
popup.html
src/
  background/service-worker.js
  popup/{popup.js, popup.css}
  shared/{messaging,storage,translator,calculator}.js
  content/
    shared/{sb.js, content.css}      # 共享工具与样式
    {preview-pics,auto-scrolling,edit-mode,timing-reload,
     translator,grayscale}.js
    sites/{bilibili,csdn,...}.js
  vendor/pinyin/                     # 第三方拼音字典
img/icon.png
```

## 安装

打开 `chrome://extensions`，开启「开发者模式」，点击「加载已解压的扩展」选择本目录即可。

## 公众号教程

[微信公众号 - 集盒浏览器扩展安装方法](https://mp.weixin.qq.com/s/2Pn_D5hi6i6aMF7GySZ9rQ)