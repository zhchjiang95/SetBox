const slothful_douyin = {
  init() {
    const box = document.querySelector(".xg-right-grid");
    if (!box) {
      return;
    }
    const btn = box.querySelector("#slothful_douyin");
    if (btn) {
      return;
    }
    const downbtn = $(
      `<div id="slothful_douyin" style="order: 1;color: rgba(255,255,255,.8);margin: 0 10px 0 0;">下载</div>`
    );
    downbtn.click(() => {
      const source = document.querySelector("video source");
      if (!source) {
        const u = document.querySelector("video")?.src;
        a = document.createElement("a");
        a.href = u;
        a.download = document.title + ".mp4";
        a.click();
        a.remove();
        // alert("不支持当前视频下载，关注公众号：Slothful了解更多");
        return;
      }
      const url = source.src;
      fetch(url)
        .then((res) => res.blob())
        .then((res) => {
          const title =
            document.querySelector(".title")?.textContent || document.title;
          const u = URL.createObjectURL(res);
          a = document.createElement("a");
          a.href = u;
          a.download = title + ".mp4";
          a.click();
          URL.revokeObjectURL(u);
          a.remove();
        });
    });
    $(box).append(downbtn);
  },
};

setInterval(() => {
  slothful_douyin.init();
}, 2000);
