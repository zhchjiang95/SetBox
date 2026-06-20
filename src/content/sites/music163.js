// NetEase Music: add download buttons for the current song and album cover.
// Without webRequest in MV3 we can't intercept the audio URL automatically,
// but we can grab it from the page's <audio> element once playback starts.

(function () {
  const SB = window.__SB;
  if (!SB) return;

  function getDoc() {
    try {
      return frames.contentFrame?.document || null;
    } catch {
      return null;
    }
  }

  function findAudioElement() {
    // The page audio element lives in the top frame.
    const tries = [
      document.getElementById("audio"),
      document.querySelector("audio"),
      ...document.querySelectorAll("audio"),
    ].filter(Boolean);
    return tries.find((a) => a.src) || null;
  }

  function init() {
    if (!location.hash.includes("song")) return;
    const doc = getDoc();
    if (!doc) return;

    const ops = doc.getElementById("content-operation");
    if (!ops) return;
    if (ops.querySelector(".sb-music-download")) return;

    const songBtn = SB.h(
      "a",
      {
        class: "u-btni u-btni-dl sb-music-download",
        href: "javascript:;",
        title: "下载音乐",
      },
      SB.h("i", null, "下载音乐")
    );
    const coverBtn = SB.h(
      "a",
      {
        class: "u-btni u-btni-dl sb-music-cover",
        href: "javascript:;",
        title: "下载专辑图",
      },
      SB.h("i", null, "下载专辑图")
    );

    songBtn.addEventListener("click", async () => {
      const audio = findAudioElement();
      if (!audio?.src) {
        alert("请先点击播放按钮，等音频开始播放后再下载。");
        return;
      }
      const title = doc.querySelector(".tit")?.innerText || "song";
      const singer = doc.querySelectorAll(".des a.s-fc7")?.[0]?.innerText || "";
      songBtn.style.opacity = "0.5";
      songBtn.style.pointerEvents = "none";
      try {
        await SB.download(audio.src, `${singer ? singer + " - " : ""}${title}`);
      } finally {
        songBtn.style.opacity = "";
        songBtn.style.pointerEvents = "";
      }
    });

    coverBtn.addEventListener("click", async () => {
      const el = doc.querySelector("img.j-img")
      const cover = el?.dataset.src;
      if (!cover) return;
      const album = el?.getAttribute("alt")?.split("_")[0] || "cover";
      await SB.download(cover, album);
    });

    ops.querySelectorAll(".u-btni.u-btni-cmmt").forEach((b) => b.remove());
    ops.querySelectorAll("a.u-btni.u-btni-dl").forEach((b) => b.remove());
    ops.appendChild(songBtn);
    ops.appendChild(coverBtn);
  }

  // Initial + react to SPA hash changes.
  setTimeout(init, 1500);
  window.addEventListener("hashchange", () => setTimeout(init, 800));
})();
