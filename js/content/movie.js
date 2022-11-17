const onRenderElement = (btnEl, playEl) => {
  $(btnEl).append('<div class="slothful-play-btn" style="color: #fff;padding: 8px 12px;font-size: 12px;border-radius: 4px;background: linear-gradient(45deg, #4263a7, #d53662);cursor: pointer;">点击尝试免费/去广告播放 @公众号：Slothful</div>');
  $('body').on('click', '.slothful-play-btn', function () {
    $(playEl).children().remove();
    $(playEl).append(`<iframe allowfullscreen width="100%" height="100%" style="box-sizing: border-box;" src="https://jx.bozrc.com:4433/player/?url=${location.origin + location.pathname}">`);
  })
}

const slothful_movie = {
  renderScript(jsPath){
    var temp = document.createElement('script');
    temp.setAttribute('type', 'text/javascript');
    temp.src = chrome.extension.getURL(jsPath);
    temp.onload = function () {
      this.parentNode.removeChild(this);
    };
    document.head.appendChild(temp);
  }
}

setTimeout(function () {
  if (location.host.includes('iqiyi')) {
    slothful_movie.renderScript('js/inject/iqiyi.js');
    setTimeout(function () {
      onRenderElement('.qy-side-head', '.flash-wrap');
    }, 2000)
  } else if (location.host.includes('youku')) {
    slothful_movie.renderScript('js/inject/youku.js');
    onRenderElement('.normal-title-wrap', '#ykPlayer');
  } else if (location.host.includes('qq.com')) {
    // slothful_movie.renderScript('js/inject/vqq.js');
    onRenderElement('.intro-wrapper__desc', '#player');
  } else if (location.host.includes('bilibili')) {
    onRenderElement('.pub-wrapper', '#bilibili-player');
    if (location.pathname.includes('/video')) {
      const timer = setInterval(() => {
        const playbackrateMenu = $('.bpx-player-ctrl-playbackrate-menu');
        if (playbackrateMenu[0]) {
          const lis = `
            <li class="bpx-player-ctrl-playbackrate-menu-item" data-value="4">4.0x</li>
            <li class="bpx-player-ctrl-playbackrate-menu-item" data-value="3.5">3.5x</li>
            <li class="bpx-player-ctrl-playbackrate-menu-item" data-value="3">3.0x</li>
            <li class="bpx-player-ctrl-playbackrate-menu-item" data-value="2.5">2.5x</li>
          `
          playbackrateMenu.prepend(lis);
          clearInterval(timer);
        }
      }, 1000);
    }
    if (location.pathname.includes('/play')) {
      const timer = setInterval(() => {
        const playbackrateMenu = $('.squirtle-speed-select-list');
        if (playbackrateMenu[0]) {
          clearInterval(timer);
          playbackrateMenu.empty();
          const lis = `
            <li class="squirtle-select-item">4.0x</li>
            <li class="squirtle-select-item">3.5x</li>
            <li class="squirtle-select-item">3.0x</li>
            <li class="squirtle-select-item">2.5x</li>
            <li class="squirtle-select-item">2.0x</li>
            <li class="squirtle-select-item">1.5x</li>
            <li class="squirtle-select-item">1.25x</li>
            <li class="squirtle-select-item">1.0x</li>
            <li class="squirtle-select-item">0.75x</li>
            <li class="squirtle-select-item">0.5x</li>
          `
          playbackrateMenu.prepend(lis);
          playbackrateMenu.find('.squirtle-select-item').click(function () {
            const rate = parseFloat($(this).text());
            $(this).css({ color: '#479fd1' }).siblings().css("cssText", "color: hsla(0,0%,100%,.9) !important");
            document.querySelector('video').playbackRate = rate;
            $('.squirtle-speed-select-result').text($(this).text());
          })
        }
      }, 1000);
    }
  }
}, 1000)

