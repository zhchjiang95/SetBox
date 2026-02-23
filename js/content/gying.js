const els = `播放速度: 
<span data-value="3">3.0</span>
<span data-value="2.5">2.5</span>
<span data-value="2">2.0</span>
<span data-value="1.5">1.5</span>
<span data-value="1.3">1.3</span>
<span data-value="1.25">1.25</span>
<span data-value="1.2">1.2</span>
<span data-value="1.1">1.1</span>
<span data-value="1" class="art-current">正常</span>
<span data-value="0.75">0.8</span>`

setTimeout(() => {
  const bkel = document.querySelector('.art-contextmenu.art-contextmenu-playbackRate')
  bkel.innerHTML = els;
}, 1000);