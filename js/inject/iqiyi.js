let n = Number();
Date.now = () => { return new Date().getTime() + (n += 10000) };
setInterval(() => { n = Number() }, 300000);