import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

historyCode = '''
// --- History API Routing ---
let isPopState = false;

window.addEventListener('popstate', (e) => {
  // Check if any modals are open. If so, close them.
  const openModals = document.querySelectorAll('.modal-screen:not(.hidden)');
  if (openModals.length > 0) {
    openModals.forEach(m => m.classList.add('hidden'));
    
    // Re-push current state to negate the pop
    if (currentLibraryLevel === 0) {
      history.pushState({ level: 0 }, '');
    } else if (currentLibraryLevel === 1) {
      history.pushState({ level: 1, bookId: selectedBookId, bookName: currentBookNameStore }, '');
    } else if (currentLibraryLevel === 2) {
      const cName = document.getElementById('ios-nav-title-inline') ? document.getElementById('ios-nav-title-inline').textContent : '';
      history.pushState({ level: 2, bookId: selectedBookId, chapterId: selectedChapterId, chapterName: cName }, ''); 
    }
    return;
  }

  isPopState = true;
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
  setTimeout(() => { isPopState = false; }, 50);
});

function pushHistoryState(level, data) {
  if (isPopState) return;
  const current = history.state || { level: -1 };
  if (current.level === level && current.chapterId === data.chapterId && current.bookId === data.bookId) return;
  history.pushState(Object.assign({ level: level }, data), '');
}

// Push initial state if none exists
if (!history.state) {
  history.replaceState({ level: 0 }, '');
}
'''

# Fix 1: updateHideToggleAvailability
js = js.replace(
    'const parsed = parseBackContent(w.back);',
    'const parsed = parseWordData(w);'
)

# Fix 2: Add History API pushes
js = js.replace(
    'function loadBooks() {',
    'function loadBooks() {\n  if (typeof pushHistoryState === \'function\') pushHistoryState(0, {});'
)
js = js.replace(
    'function loadChapters(bookId, bookName) {',
    'function loadChapters(bookId, bookName) {\n  if (typeof pushHistoryState === \'function\') pushHistoryState(1, { bookId: bookId, bookName: bookName });'
)
js = js.replace(
    'function loadWords(bookId, chapterId, chapterName) {',
    'function loadWords(bookId, chapterId, chapterName) {\n  if (typeof pushHistoryState === \'function\') pushHistoryState(2, { bookId: bookId, chapterId: chapterId, chapterName: chapterName });'
)

js += '\n' + historyCode

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('Applied safe fixes')
