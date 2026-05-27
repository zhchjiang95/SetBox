// Data-baker TTS: lift the input character cap, add a download button.

(function () {
  const SB = window.__SB;
  if (!SB) return;

  async function init() {
    try {
      const textarea = await SB.waitFor(".compose-tts textarea", { timeout: 10000 });
      textarea.setAttribute("maxLength", "-1");
      const ops = document.querySelector(".operate-btn");
      if (!ops || ops.querySelector(".sb-tts-download")) return;

      const btn = SB.h(
        "div",
        {
          class: "sb-tts-download",
          style: {
            margin: "6px auto 0",
            cursor: "pointer",
            width: "122px",
            height: "36px",
            lineHeight: "36px",
            color: "#fff",
            background: "#5769f6",
            boxShadow: "0 8px 10px 0 rgba(0,0,0,0.10)",
            borderRadius: "25px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
        },
        SB.h("span", null, "下载语音")
      );
      btn.addEventListener("click", async () => {
        const audio = document.querySelector("audio");
        if (!audio?.src) {
          alert("请先合成语音再下载。");
          return;
        }
        await SB.download(audio.src, `tts-${Date.now()}.wav`);
      });
      ops.appendChild(btn);
    } catch {}
  }

  init();
})();
