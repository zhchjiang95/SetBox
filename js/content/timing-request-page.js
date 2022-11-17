const slothful_timingRequest = {
  timer: 0,
  open(){
    const t = Number(prompt('请输入时间间隔（单位秒，默认20秒）：')) || 20;
    const div = `
      <div class="slothful-edit-mode">
        <span style="color: #e21f0a">每${t}秒将重复请求（非刷新）当前网页，请不要刷新或关闭当前页面</span>
        <svg class="ri-close-fill" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" fill="#ffffff"/></svg>
      </div>
    `
    $('.slothful-edit-mode').remove();
    $('body').append(div);
    $('.slothful-edit-mode .ri-close-fill').click(() => {
      this.close();
    })
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      fetch(location.href);
    }, 1000 * t)
  },
  close(){
    clearInterval(this.timer);
    $('.slothful-edit-mode').remove();
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.timingRequest === 'show') {
    slothful_timingRequest.open();
  } else if (request.timingRequest === 'hide') {
    slothful_timingRequest.close();
  }
  sendResponse('slothful_timingRequest ok!');
});
