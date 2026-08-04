import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

historyCode = '''
// --- History API Routing ---
let isPopState = false;

window.addEventListener('popstate', (e) => {
  isPopState = true;
  // First, check if any modals are open. If so, close them.
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
'''

js = js.replace('function loadBooks() {', 'function loadBooks() {\n  if (typeof pushHistoryState === \'function\') pushHistoryState(0, {});')
js = js.replace('function loadChapters(bookId, bookName) {', 'function loadChapters(bookId, bookName) {\n  if (typeof pushHistoryState === \'function\') pushHistoryState(1, { bookId, bookName });')
js = js.replace('function loadWords(bookId, chapterId, chapterName) {', 'function loadWords(bookId, chapterId, chapterName) {\n  if (typeof pushHistoryState === \'function\') pushHistoryState(2, { bookId, chapterId, chapterName });')

def repl(m):
    return m.group(0) + " if (typeof pushModalState === 'function' && " + m.group(1) + ".classList && " + m.group(1) + ".classList.contains('modal-screen')) pushModalState();"

js = re.sub(r'([a-zA-Z0-9_]+)\.classList\.remove\(\'hidden\'\);', repl, js)

js += '\n' + historyCode

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
