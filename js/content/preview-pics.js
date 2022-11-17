let pageSlothfulImages = [];

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  const { slothfulImages } = request;
  if (slothfulImages?.length) {
    pageSlothfulImages = slothfulImages;
  }
  sendResponse('ok');
});

const onClose = () => {
  document.querySelector('.slothful-imgbox')?.remove();
}

const onRenderPics = () => {
  const elImgs = [];
  pageSlothfulImages.forEach(url => {
    const img = new Image();
    img.src = url;
    img.onclick = () => {
      window.open(url);
    }
    elImgs.push(img);
  })
  const div = `<div class="slothful-imgbox">
    <h4 class="slothful-imgbox-h4"><svg class="slothful-imgbox-close" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" fill="rgba(236,106,94,1)"/></svg><div class="drag-move" draggable="true">发现 ${elImgs.length} 张图片（非实时）</div><svg class="slothful-imgbox-refresh" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26"><path fill="none" d="M0 0h24v24H0z"/><path d="M5.463 4.433A9.961 9.961 0 0 1 12 2c5.523 0 10 4.477 10 10 0 2.136-.67 4.116-1.81 5.74L17 12h3A8 8 0 0 0 6.46 6.228l-.997-1.795zm13.074 15.134A9.961 9.961 0 0 1 12 22C6.477 22 2 17.523 2 12c0-2.136.67-4.116 1.81-5.74L7 12H4a8 8 0 0 0 13.54 5.772l.997 1.795z" fill="rgba(49,108,244,1)"/></svg></h4>
  </div>`;
  const $imgDiv = $('<div></div>')
  const $div = $(div);
  $imgDiv[0].append(...elImgs);
  $div.append($imgDiv);
  $('.slothful-imgbox')?.remove();
  $('body').append($div);
  setTimeout(() => {
    // $('.slothful-imgbox .drag-move')[0].ondragstart = function (e) {
    //   console.log(e);
    // }
    let flag = true;
    $('.slothful-imgbox .drag-move')[0].ondrag = function (e) {
      if (flag) {
        if (e.clientX === 0 && e.clientY === 0) {
          return;
        }
        flag = false;
        $('.slothful-imgbox').css({ top: e.clientY - 20, left: e.clientX - 148 });
        setTimeout(function () {
          flag = true;
        }, 16.66);
      }
    }
  }, 100)
}

$('body').on('click', '.slothful-imgbox-close', () => {
  onClose();
})
$('body').on('click', '.slothful-imgbox-refresh', () => {
  onRenderPics();
})


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.previewPics === 'show') {
    onRenderPics();
  } else if (request.previewPics === 'hide') {
    onClose();
  }
});

