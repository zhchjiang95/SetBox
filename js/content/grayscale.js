
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.grayscale === 'show') {
    document.querySelector('#slothful-grayscale')?.remove();
    const style = `<style id="slothful-grayscale">*{filter: grayscale(100%) !important}</style>`;
    $('body').append(style);
  } else if (request.grayscale === 'hide') {
    document.querySelector('#slothful-grayscale').remove();
    const style = `<style id="slothful-grayscale">*{filter: none !important}</style>`;
    $('body').append(style);
  }
  sendResponse('grayscale ok!');
});
