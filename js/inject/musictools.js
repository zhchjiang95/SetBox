setTimeout(() => {
  const text = $('script').text();
  const s = text.match(/(?<=name == ').*(?=')/g)[0];
  // document.querySelector('.name').value = s;
  ((s) => (window.md5 = () => s))(s);
}, 100);