setTimeout(function () {
  if (location.host.includes('bilibili')) {
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

