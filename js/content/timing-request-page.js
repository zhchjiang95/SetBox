const slothful_timingRequest = {
  open(time) {
    location.reload();
    // const div = `
    //   <div class="slothful-edit-mode">
    //     <span style="color: #e21f0a">每${time}秒将重复请求（非刷新）当前网页，请不要刷新或关闭当前页面</span>
    //     <svg class="ri-close-fill" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" fill="#ffffff"/></svg>
    //   </div>
    // `
    // $('.slothful-edit-mode').remove();
    // $('body').append(div);
    // $('.slothful-edit-mode .ri-close-fill').click(() => {
    //   this.close();
    // })
  },
  close() {
    $('.slothful-edit-mode').remove();
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  const { timingRequest } = request;
  if (timingRequest) {
    if (timingRequest.type === 'show') {
      slothful_timingRequest.open(timingRequest.time);
    } else if (timingRequest.type === 'hide') {
      // slothful_timingRequest.close();
    }
    sendResponse('slothful_timingRequest ok!');
  }
});
