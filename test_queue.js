const _fetchingWords = new Set();
let _queueVersion = 0;
let _imgQueue = Promise.resolve();
let _lastImgReq = 0;
const IMG_COOLDOWN = 1000;

function queueImageFetch(word, path) {
  if (_fetchingWords.has(path)) return;
  _fetchingWords.add(path);
  const currentVersion = _queueVersion;

  _imgQueue = _imgQueue.then(async () => {
    if (currentVersion !== _queueVersion) {
      console.log('Cancelled 1:', word);
      _fetchingWords.delete(path);
      return;
    }
    const now = Date.now();
    const wait = Math.max(0, IMG_COOLDOWN - (now - _lastImgReq));
    if (wait > 0) {
      console.log('Waiting', wait, 'for', word);
      await new Promise(r => setTimeout(r, wait));
    }
    
    if (currentVersion !== _queueVersion) {
      console.log('Cancelled 2:', word);
      _fetchingWords.delete(path);
      return;
    }
    
    _lastImgReq = Date.now();
    console.log('Fetching:', word);
    // Simulate fetch
    await new Promise(r => setTimeout(r, 500));
    console.log('Done:', word);
    _fetchingWords.delete(path);
  });
}

queueImageFetch('apple', 'path1');
queueImageFetch('banana', 'path2');
setTimeout(() => {
  console.log('RESET');
  _queueVersion++;
  _fetchingWords.clear();
  queueImageFetch('cherry', 'path3');
}, 1500);
