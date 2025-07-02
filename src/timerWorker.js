let interval = null;

self.onmessage = function(e) {
  if (e.data.command === 'start') {
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
      self.postMessage('tick');
    }, 1000);
  } else if (e.data.command === 'stop') {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }
};
