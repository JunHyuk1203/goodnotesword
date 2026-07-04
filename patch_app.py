import sys

firebase_imports = """
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDocs, getDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDToPgxyeRpAfYUqSlweugc7M5vwCwagsU",
  authDomain: "goodnotesword-454fa.firebaseapp.com",
  projectId: "goodnotesword-454fa",
  storageBucket: "goodnotesword-454fa.firebasestorage.app",
  messagingSenderId: "509235514160",
  appId: "1:509235514160:web:cd710bfa87fd69971696f5",
  measurementId: "G-87JDYFLD85"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

let currentUser = null;
"""

firebase_logic = """
// ─── Firebase Auth & Library Logic ──────────────────────────────────────────────────────────

const loginBtn = document.getElementById('google-login-btn');
const logoutBtn = document.getElementById('google-logout-btn');
const authPrompt = document.getElementById('library-auth-prompt');
const libContent = document.getElementById('library-content');
const userAvatar = document.getElementById('user-avatar');

loginBtn?.addEventListener('click', async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    alert('로그인 실패: ' + err.message);
  }
});

logoutBtn?.addEventListener('click', () => {
  signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    authPrompt?.classList.add('hidden');
    libContent?.classList.remove('hidden');
    if (userAvatar) {
      userAvatar.src = user.photoURL || '';
      userAvatar.style.display = 'block';
    }
    loadBooks();
    loadSaveModalBooks();
  } else {
    authPrompt?.classList.remove('hidden');
    libContent?.classList.add('hidden');
    if (userAvatar) userAvatar.style.display = 'none';
  }
});

// Navigation
const navExtract = document.getElementById('nav-extract-btn');
const navLibrary = document.getElementById('nav-library-btn');
const secExtract = document.getElementById('extract-section');
const secLibrary = document.getElementById('library-section');

navExtract?.addEventListener('click', () => {
  navExtract.classList.add('active');
  navLibrary.classList.remove('active');
  secExtract.classList.remove('hidden');
  secLibrary.classList.add('hidden');
});

navLibrary?.addEventListener('click', () => {
  navLibrary.classList.add('active');
  navExtract.classList.remove('active');
  secLibrary.classList.remove('hidden');
  secExtract.classList.add('hidden');
  if (currentUser) loadBooks();
});

// Save Modal
const saveModal = document.getElementById('save-modal');
const saveLibraryBtn = document.getElementById('save-library-btn');
const saveCancelBtn = document.getElementById('save-cancel-btn');
const saveConfirmBtn = document.getElementById('save-confirm-btn');
const saveBookSel = document.getElementById('save-book-sel');
const saveBookNew = document.getElementById('save-book-new');
const saveChapterNew = document.getElementById('save-chapter-new');

saveLibraryBtn?.addEventListener('click', () => {
  if (!currentUser) {
    alert('저장하려면 먼저 우측 상단 [내 단어장] 탭에서 구글 로그인을 해주세요.');
    navLibrary.click();
    return;
  }
  saveModal.classList.remove('hidden');
  loadSaveModalBooks();
});

saveCancelBtn?.addEventListener('click', () => {
  saveModal.classList.add('hidden');
});

async function loadSaveModalBooks() {
  if (!currentUser || !saveBookSel) return;
  try {
    const snap = await getDocs(collection(db, `users/${currentUser.uid}/books`));
    saveBookSel.innerHTML = '<option value="">-- 기존 단어장 선택 --</option>';
    let count = 0;
    snap.forEach(doc => {
      count++;
      const opt = document.createElement('option');
      opt.value = doc.id;
      opt.textContent = doc.data().name;
      saveBookSel.appendChild(opt);
    });
    if (count > 0) saveBookSel.style.display = 'block';
    else saveBookSel.style.display = 'none';
  } catch (err) {
    console.error(err);
  }
}

saveConfirmBtn?.addEventListener('click', async () => {
  if (!currentUser) return;
  const bookId = saveBookSel.value;
  const newBookName = saveBookNew.value.trim();
  const chapterName = saveChapterNew.value.trim();

  if (!bookId && !newBookName) {
    alert('기존 단어장을 선택하거나 새 단어장 이름을 입력하세요.');
    return;
  }
  if (!chapterName) {
    alert('단원(챕터) 이름을 입력하세요.');
    return;
  }

  saveConfirmBtn.disabled = true;
  saveConfirmBtn.textContent = '저장 중...';

  try {
    let targetBookId = bookId;
    if (newBookName) {
      const newBookRef = doc(collection(db, `users/${currentUser.uid}/books`));
      await setDoc(newBookRef, { name: newBookName, createdAt: serverTimestamp() });
      targetBookId = newBookRef.id;
    }

    const newChapRef = doc(collection(db, `users/${currentUser.uid}/books/${targetBookId}/chapters`));
    await setDoc(newChapRef, { name: chapterName, createdAt: serverTimestamp() });

    const rows = document.querySelectorAll('#preview-tbody tr');
    const wordsToSave = [];
    rows.forEach(tr => {
      const front = tr.children[1].innerText;
      const back = tr.children[2].innerText;
      wordsToSave.push({ front, back });
    });

    for (let i=0; i<wordsToSave.length; i++) {
      const wordRef = doc(collection(db, `users/${currentUser.uid}/books/${targetBookId}/chapters/${newChapRef.id}/words`));
      await setDoc(wordRef, { 
        front: wordsToSave[i].front, 
        back: wordsToSave[i].back,
        order: i 
      });
    }

    alert('성공적으로 저장되었습니다!');
    saveModal.classList.add('hidden');
    saveBookNew.value = '';
    saveChapterNew.value = '';
    navLibrary.click();
  } catch (err) {
    alert('저장 오류: ' + err.message);
  } finally {
    saveConfirmBtn.disabled = false;
    saveConfirmBtn.textContent = '저장하기';
  }
});

// Library Views
const viewBooks = document.getElementById('view-books');
const viewChapters = document.getElementById('view-chapters');
const viewWords = document.getElementById('view-words');
const crumbHome = document.getElementById('crumb-home');
const crumbBook = document.getElementById('crumb-book');
const crumbBookName = document.getElementById('crumb-book-name');
const crumbChapter = document.getElementById('crumb-chapter');
const crumbChapterName = document.getElementById('crumb-chapter-name');
const wordCountBadge = document.getElementById('word-count-badge');
const libWordsTbody = document.getElementById('library-words-tbody');

let currentLoadedWords = [];
let selectedBookId = null;

crumbHome?.addEventListener('click', loadBooks);
crumbBookName?.addEventListener('click', () => {
  if (selectedBookId) loadChapters(selectedBookId, crumbBookName.textContent);
});

async function loadBooks() {
  if (!currentUser) return;
  viewBooks.classList.remove('hidden');
  viewChapters.classList.add('hidden');
  viewWords.classList.add('hidden');
  crumbBook.classList.add('hidden');
  crumbChapter.classList.add('hidden');

  viewBooks.innerHTML = '<p style="grid-column:1/-1;text-align:center;">로딩 중...</p>';
  try {
    const snap = await getDocs(collection(db, `users/${currentUser.uid}/books`));
    viewBooks.innerHTML = '';
    if (snap.empty) {
      viewBooks.innerHTML = '<p style="color:var(--text-light); grid-column:1/-1; text-align:center;">저장된 단어장이 없습니다.</p>';
      return;
    }
    snap.forEach(doc => {
      const data = doc.data();
      const div = document.createElement('div');
      div.className = 'lib-card';
      div.innerHTML = `
        <div class="lib-icon">📘</div>
        <div class="lib-title">${escapeHTML(data.name)}</div>
      `;
      div.onclick = () => loadChapters(doc.id, data.name);
      viewBooks.appendChild(div);
    });
  } catch(e) {
    viewBooks.innerHTML = '<p style="grid-column:1/-1;text-align:center;">오류가 발생했습니다.</p>';
  }
}

async function loadChapters(bookId, bookName) {
  selectedBookId = bookId;
  viewBooks.classList.add('hidden');
  viewChapters.classList.remove('hidden');
  viewWords.classList.add('hidden');
  
  crumbBook.classList.remove('hidden');
  crumbBookName.textContent = bookName;
  crumbChapter.classList.add('hidden');

  viewChapters.innerHTML = '<p style="grid-column:1/-1;text-align:center;">로딩 중...</p>';
  try {
    const snap = await getDocs(collection(db, `users/${currentUser.uid}/books/${bookId}/chapters`));
    viewChapters.innerHTML = '';
    if (snap.empty) {
      viewChapters.innerHTML = '<p style="color:var(--text-light); grid-column:1/-1; text-align:center;">단원이 없습니다.</p>';
      return;
    }
    snap.forEach(doc => {
      const data = doc.data();
      const div = document.createElement('div');
      div.className = 'lib-card';
      div.innerHTML = `
        <div class="lib-icon">📂</div>
        <div class="lib-title">${escapeHTML(data.name)}</div>
      `;
      div.onclick = () => loadWords(bookId, doc.id, data.name);
      viewChapters.appendChild(div);
    });
  } catch(e) {
    viewChapters.innerHTML = '<p style="grid-column:1/-1;text-align:center;">오류가 발생했습니다.</p>';
  }
}

async function loadWords(bookId, chapterId, chapterName) {
  viewChapters.classList.add('hidden');
  viewWords.classList.remove('hidden');
  
  crumbChapter.classList.remove('hidden');
  crumbChapterName.textContent = chapterName;

  libWordsTbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">로딩 중...</td></tr>';
  currentLoadedWords = [];

  try {
    const q = query(collection(db, `users/${currentUser.uid}/books/${bookId}/chapters/${chapterId}/words`), orderBy('order'));
    const snap = await getDocs(q);
    libWordsTbody.innerHTML = '';
    wordCountBadge.textContent = `${snap.size} 단어`;
    
    let i = 1;
    snap.forEach(doc => {
      const data = doc.data();
      currentLoadedWords.push(data);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i++}</td>
        <td>${escapeHTML(data.front)}</td>
        <td style="white-space: pre-wrap;">${escapeHTML(data.back)}</td>
      `;
      libWordsTbody.appendChild(tr);
    });
  } catch(e) {
    libWordsTbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">오류가 발생했습니다.</td></tr>';
    console.error(e);
  }
}

// Export Library CSV
document.getElementById('export-library-csv-btn')?.addEventListener('click', () => {
  if (currentLoadedWords.length === 0) {
    alert('내보낼 단어가 없습니다.');
    return;
  }
  
  const lines = [];
  currentLoadedWords.forEach(w => {
    let f = w.front.replace(/"/g, '""');
    let b = w.back.replace(/"/g, '""');
    lines.push(`"${f}","${b}"`);
  });
  
  const csvStr = "\\uFEFF" + lines.join("\\n");
  const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${crumbChapterName.textContent}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
"""

with open('app.js', 'r', encoding='utf-8') as f:
    original = f.read()

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(firebase_imports + "\n" + original + "\n" + firebase_logic)

print("done")
