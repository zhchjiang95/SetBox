const douyinDownBtn = () => {
  const shareBtns = document.querySelectorAll('div[data-e2e=video-player-share');
  shareBtns.forEach(current => {
    if (!current.dataset.jump) {
      const parent = current.parentElement.parentElement;
      const area = parent.parentElement;
      const player = $(area).parents('.xgplayer')[0];
      if (player) {
        current.dataset.jump = 1;
        const source = player.querySelector('video source');
        const el = parent.cloneNode(true);
        el.dataset.jump = 1;
        el.title = '下载（@公众号Slothful）'
        el.style.transform = 'rotate(90deg)';
        el.onclick = () => {
          el.style.opacity = 0.3;
          el.style.pointerEvents = 'none';
          fetch(source.src).then(r => r.blob()).then(res => {
            const url = URL.createObjectURL(res);
            const a = document.createElement('a');
            a.href = url;
            a.download = player.querySelector('.title').innerText;
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            el.style.opacity = 1;
            el.style.pointerEvents = 'auto';
          })
        };
        area.appendChild(el);
      }
    }
  })
}
setInterval(() => { douyinDownBtn() }, 2000)