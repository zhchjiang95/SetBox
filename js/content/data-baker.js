const slothful_dataBaker = {
  init() {
    const textarea = document.querySelector('.compose-tts textarea');
    if (textarea) {
      textarea.setAttribute('maxLength', -1);
      const $btn = $(`
        <div style="margin: 6px auto 0;
        cursor: pointer;
        width: 122px;
        height: 36px;
        line-height: 36px;
        color: #fff;
        background: #5769f6;
        box-shadow: 0 8px 10px 0 rgb(0 0 0 / 10%);
        border-radius: 25px;
        display: flex;
        align-items: center;
        justify-content: center;"><img style="margin-right: 6px;
        display: block;
        transform: rotate(90deg);
        width: 17px;
        height: 17px;" src="https://databaker-gw-static.oss-accelerate.aliyuncs.com/assets/images/specs/status1.png" data-v-1f037fc0=""> <span>下载语音</span></div>
      `)
      $btn.click(function () {
        const url = document.querySelector('audio').src;
        if (url) {
          const a = document.createElement('a');
          a.href = url;
          a.download = new Date().getTime().toString();
          a.click();
          a.remove();
        } else {
          alert('请先合成语音！')
        }
      })
      $('.operate-btn').append($btn);
    }
  }
}

setTimeout(() => {
  slothful_dataBaker.init();
}, 2000);