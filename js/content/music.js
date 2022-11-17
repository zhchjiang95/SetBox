let pageSlothfulMusic = undefined;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  const { slothfulMusic } = request;
  pageSlothfulMusic = slothfulMusic;
  sendResponse('music ok');
});

const slothful_music = {
  init() {
    setTimeout(() => {
      if (location.host.includes('music.163.com')) {
        if (location.hash.includes('song')) {
          this.music163();
        }
      }
    }, 1000)
  },
  music163() {
    const doc = frames.contentFrame.document;
    const btns = doc.querySelector('#content-operation');
    $(btns).find('.u-btni.u-btni-cmmt').remove();
    $(btns).find('a.u-btni.u-btni-dl').remove();
    const $downloadMusic = $('<a class="u-btni u-btni-dl slothful-download-music" href="javascript:;"><i>下载音乐</i></a>');
    const $downloadPic = $('<a class="u-btni u-btni-dl slothful-download-pic" href="javascript:;"><i>下载专辑图</i></a>')

    $downloadMusic.click(function(){
      if(!pageSlothfulMusic){
        alert('请先点击播放按钮播放音乐！');
        return;
      }
      this.style.opacity = 0.3;
      this.style.pointerEvents = 'none';
      $(this).find('i').text('请稍后...');
      fetch(pageSlothfulMusic).then(r => r.blob()).then(res => {
        const title = doc.querySelector('.tit').innerText;
        const singer = doc.querySelectorAll('.des a.s-fc7')[0].innerText;
        const url = URL.createObjectURL(res);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${singer} - ${title}`;
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.style.opacity = 1;
        this.style.pointerEvents = 'auto';
        $(this).find('i').text('下载音乐');
      })
    })
    $downloadPic.click(function () {
      const picUrl = doc.querySelector('img.j-img').dataset.src;
      this.style.opacity = 0.3;
      this.style.pointerEvents = 'none';
      $(this).find('i').text('请稍后...');
      fetch(picUrl).then(r => r.blob()).then(res => {
        const url = URL.createObjectURL(res);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.querySelectorAll('.des a.s-fc7')[1].innerText;
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.style.opacity = 1;
        this.style.pointerEvents = 'auto';
        $(this).find('i').text('下载专辑图');
      })
    })

    $(btns).append([$downloadMusic, $downloadPic]);
  }
}

slothful_music.init();
window.onhashchange = () => {
  slothful_music.init();
}