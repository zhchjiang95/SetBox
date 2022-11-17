const onRenderScrollingBar = () => {
  let time = 20;
  let max = 1;
  let timer
  const div = `
    <div class="slothful-auto-scroll">
      <svg class="ri-rewind-fill" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 10.667l9.223-6.149a.5.5 0 0 1 .777.416v14.132a.5.5 0 0 1-.777.416L12 13.333v5.733a.5.5 0 0 1-.777.416L.624 12.416a.5.5 0 0 1 0-.832l10.599-7.066a.5.5 0 0 1 .777.416v5.733z" fill="rgba(88,90,90,1)"/></svg>
      <svg class="ri-play-fill" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M19.376 12.416L8.777 19.482A.5.5 0 0 1 8 19.066V4.934a.5.5 0 0 1 .777-.416l10.599 7.066a.5.5 0 0 1 0 .832z" fill="rgba(88,90,90,1)"/></svg>
      <svg class="ri-pause-fill" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M6 5h2v14H6V5zm10 0h2v14h-2V5z" fill="rgba(88,90,90,1)"/></svg>
      <svg class="ri-speed-fill" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 13.333l-9.223 6.149A.5.5 0 0 1 2 19.066V4.934a.5.5 0 0 1 .777-.416L12 10.667V4.934a.5.5 0 0 1 .777-.416l10.599 7.066a.5.5 0 0 1 0 .832l-10.599 7.066a.5.5 0 0 1-.777-.416v-5.733z" fill="rgba(88,90,90,1)"/></svg>
      <span>20|1</span>
      <svg class="ri-close-fill" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" fill="#ffffff"/></svg>
    </div>
  `
  $('.slothful-auto-scroll').remove();
  $('body').append(div);
  $('.ri-pause-fill').hide();
  $('.slothful-auto-scroll .ri-close-fill').click(function () {
    clearTimeout(timer);
    $('.slothful-auto-scroll').remove();
  })
  // 快
  $('.slothful-auto-scroll .ri-speed-fill').click(function () {
    if (time <= 0) {
      max += 1;
    } else {
      time -= 2;
    }
    $('.slothful-auto-scroll span').text(`${time}|${max}`);
  })
  // 慢
  $('.slothful-auto-scroll .ri-rewind-fill').click(function () {
    if (time <= 0 && max !== 1) {
      max -= 1;
    } else {
      time += 2;
    }
    $('.slothful-auto-scroll span').text(`${time}|${max}`);
  })
  $('.slothful-auto-scroll .ri-pause-fill').click(function () {
    clearTimeout(timer);
    $(this).hide();
    $('.slothful-auto-scroll .ri-play-fill').show();
  })
  $('.slothful-auto-scroll .ri-play-fill').click(function () {
    let h = undefined;
    const run = () => {
      timer = setTimeout(() => {
        window.scrollBy({ top: max })
        if (window.scrollY === h) {
          $('.slothful-auto-scroll .ri-pause-fill').hide();
          $(this).show();
        } else {
          h = window.scrollY;
          run();
        }
      }, time)
    }
    run();
    $(this).hide();
    $('.slothful-auto-scroll .ri-pause-fill').show();
  })
}

const onScrollClose = () => {
  $('.slothful-auto-scroll').remove();
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.autoScrolling === 'show') {
    onRenderScrollingBar();
  } else if (request.autoScrolling === 'hide') {
    onScrollClose();
  }
  sendResponse('autoScrolling rec!');
});
