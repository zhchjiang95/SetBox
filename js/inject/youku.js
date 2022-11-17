setInterval(() => {
  const v = document.querySelectorAll("video")[1]
  if (v) {
    v.playbackRate = 16;
  }
}, 100);