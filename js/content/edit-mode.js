const editMode = {
  open(){
    const div = `
      <div class="slothful-edit-mode">
        <span>编辑模式已开启</span>
        <svg class="ri-close-fill" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" fill="#ffffff"/></svg>
      </div>
    `
    document.designMode = 'on';
    $('.slothful-edit-mode').remove();
    $('body').append(div);
    $('.slothful-edit-mode .ri-close-fill').click(() => {
      this.close();
    })
  },
  close(){
    document.designMode = 'off';
    $('.slothful-edit-mode').remove();
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.editMode === 'show') {
    editMode.open();
  } else if (request.editMode === 'hide') {
    editMode.close();
  }
  sendResponse('edit mode rec!');
});
