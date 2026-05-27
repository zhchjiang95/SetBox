// Remove the recurring WeChat-login modal on gushiwen.cn.

(function () {
  const kill = () => document.getElementById("threeWeixin2")?.remove();
  kill();
  new MutationObserver(kill).observe(document.documentElement, { childList: true, subtree: true });
})();
