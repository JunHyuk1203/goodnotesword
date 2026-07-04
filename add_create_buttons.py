import re

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

book_btn_html = '''
        <div id="add-book-wrap" style="margin-bottom: 1rem; text-align: right;">
          <button id="add-book-btn" class="generate-btn" style="width:auto; padding: 0.5rem 1rem; font-size: 0.9rem; border-radius: 6px;">+ 새 단어장 만들기</button>
        </div>
        <!-- Books View -->
'''
if 'id="add-book-btn"' not in html:
    html = html.replace('<!-- Books View -->', book_btn_html)

chapter_btn_html = '''
        <div id="add-chapter-wrap" class="hidden" style="margin-bottom: 1rem; text-align: right;">
          <button id="add-chapter-btn" class="generate-btn" style="width:auto; padding: 0.5rem 1rem; font-size: 0.9rem; border-radius: 6px;">+ 새 단원 추가</button>
        </div>
        <!-- Chapters View -->
'''
if 'id="add-chapter-btn"' not in html:
    html = html.replace('<!-- Chapters View -->', chapter_btn_html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)


# 2. Update app.js
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Make sure add-chapter-wrap is toggled appropriately
# In loadChapters(), we show it.
# Instead of complex regex, let's just append the button listeners and use CSS to show/hide based on crumb state,
# but the easiest is just let JS handle it.

addition_js = '''
// --- Book / Chapter Creation ---
const addBookBtn = document.getElementById('add-book-btn');
const addChapterBtn = document.getElementById('add-chapter-btn');
const addChapterWrap = document.getElementById('add-chapter-wrap');
const addBookWrap = document.getElementById('add-book-wrap');

addBookBtn?.addEventListener('click', async () => {
  const name = prompt('새 단어장의 이름을 입력하세요:');
  if (!name || !name.trim()) return;
  try {
    const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
    await addDoc(collection(db, `users/${currentUser.uid}/books`), {
      name: name.trim(),
      createdAt: serverTimestamp()
    });
    if (typeof loadBooks === 'function') loadBooks();
  } catch (err) {
    console.error(err);
    alert('단어장 생성 실패: ' + err.message);
  }
});

addChapterBtn?.addEventListener('click', async () => {
  const name = prompt('새 단원(챕터)의 이름을 입력하세요:');
  if (!name || !name.trim() || !selectedBookId) return;
  try {
    const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
    await addDoc(collection(db, `users/${currentUser.uid}/books/${selectedBookId}/chapters`), {
      name: name.trim(),
      createdAt: serverTimestamp()
    });
    const crumbBookName = document.getElementById('crumb-book-name')?.textContent || '단어장';
    if (typeof loadChapters === 'function') loadChapters(selectedBookId, crumbBookName);
  } catch (err) {
    console.error(err);
    alert('단원 생성 실패: ' + err.message);
  }
});

// Hook into existing navigation to show/hide buttons
const originalLoadBooks = loadBooks;
window.loadBooks = async function() {
  if (addBookWrap) addBookWrap.classList.remove('hidden');
  if (addChapterWrap) addChapterWrap.classList.add('hidden');
  await originalLoadBooks();
};

const originalLoadChapters = loadChapters;
window.loadChapters = async function(bookId, bookName) {
  if (addBookWrap) addBookWrap.classList.add('hidden');
  if (addChapterWrap) addChapterWrap.classList.remove('hidden');
  await originalLoadChapters(bookId, bookName);
};

const originalLoadWords = loadWords;
window.loadWords = async function(bookId, chapterId, chapterName) {
  if (addBookWrap) addBookWrap.classList.add('hidden');
  if (addChapterWrap) addChapterWrap.classList.add('hidden');
  await originalLoadWords(bookId, chapterId, chapterName);
};
'''

if 'const addBookBtn' not in js:
    with open('app.js', 'a', encoding='utf-8') as f:
        f.write('\n' + addition_js)

print("done")
