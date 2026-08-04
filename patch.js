const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

const historyCode = 
// --- History API Routing ---
let isPopState = false;

window.addEventListener('popstate', (e) => {
  isPopState = true;
  const openModals = document.querySelectorAll('.modal-screen:not(.hidden)');
  if (openModals.length > 0) {
    openModals.forEach(m => m.classList.add('hidden'));
    isPopState = false;
    return;
  }

  const state = e.state;
  if (!state || state.level === 0) {
    loadBooks();
  } else if (state.level === 1) {
    loadChapters(state.bookId, state.bookName);
  } else if (state.level === 2) {
    loadWords(state.bookId, state.chapterId, state.chapterName);
  } else {
    loadBooks();
  }
  isPopState = false;
});

function pushHistoryState(level, data) {
  if (isPopState) return;
  const current = history.state || { level: 0 };
  if (current.level === level && current.chapterId === data.chapterId && current.bookId === data.bookId) return;
  history.pushState(Object.assign({ level: level }, data), '');
}

function pushModalState() {
  if (isPopState) return;
  const current = history.state || { level: 0 };
  history.pushState(Object.assign({}, current, { modalOpen: true }), '');
}

history.replaceState({ level: 0 }, '');
;

js = js.replace('function loadBooks() {', 'function loadBooks() {\n  if (typeof pushHistoryState === \\'function\\') pushHistoryState(0, {});');
js = js.replace('function loadChapters(bookId, bookName) {', 'function loadChapters(bookId, bookName) {\n  if (typeof pushHistoryState === \\'function\\') pushHistoryState(1, { bookId, bookName });');
js = js.replace('function loadWords(bookId, chapterId, chapterName) {', 'function loadWords(bookId, chapterId, chapterName) {\n  if (typeof pushHistoryState === \\'function\\') pushHistoryState(2, { bookId, chapterId, chapterName });');

js = js.replace(/([a-zA-Z0-9_]+)\.classList\.remove\('hidden'\);/g, (match, p1) => {
  return \\ if (typeof pushModalState === 'function' && \.classList && \.classList.contains('modal-screen')) pushModalState();\;
});

js += '\n' + historyCode;
fs.writeFileSync('app.js', js, 'utf8');
