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
        const div = el.querySelector('div[data-e2e=video-player-share');
        div.style.display = 'flex';
        div.dataset.e2e = '';
        const text = div.querySelector('&>div:last-child')
        text.innerText = '下载';
        text.style.transform = 'rotate(-90deg)';
        el.onclick = () => {
          if(!source){
            alert('公众号Slothful：暂时无法下载！')
            return
          }
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