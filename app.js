// ═══════════════════════════════════════════════════════════════════════════════
// GoodNotes 단어장 앱 - app.js v3.0 (Study Edition)
// ═══════════════════════════════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore, collection, doc, setDoc, getDocs, addDoc,
  query, orderBy, serverTimestamp, deleteDoc, updateDoc,
  onSnapshot, initializeFirestore, persistentLocalCache
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ─── Firebase Init ────────────────────────────────────────────────────────────
const firebaseApp = initializeApp({
  apiKey: "AIzaSyDToPgxyeRpAfYUqSlweugc7M5vwCwagsU",
  authDomain: "goodnotesword-454fa.firebaseapp.com",
  projectId: "goodnotesword-454fa",
  storageBucket: "goodnotesword-454fa.firebasestorage.app",
  messagingSenderId: "509235514160",
  appId: "1:509235514160:web:cd710bfa87fd69971696f5",
  measurementId: "G-87JDYFLD85"
});
const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache()
});

// ─── Global State ─────────────────────────────────────────────────────────────
const currentUser = { uid: "default_user" };
let unsubBooks = null;
let unsubChapters = null;
let unsubWords = null;
let selectedBookId = null;
let selectedChapterId = null;
let currentLoadedWords = [];
let generatedData = [];
let currentViewMode = 'card'; // 'card' | 'table'
let hideState = { word: true, meaning: true, example: true, related: true };

// Test state
let testWords = [];
let testIndex = 0;
let testMode = 'flash'; // 'flash' | 'quiz'
let testDir = 'word2meaning'; // 'word2meaning' | 'meaning2word'
let testOrder = 'sequential';
let testCorrect = 0;
let testWrong = [];
let testIsFlipped = false;

// ─── Utility ──────────────────────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }
function escapeHTML(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escapeCSV(s) {
  if (s == null) return '';
  const v = String(s).replace(/"/g, '""');
  return (v.includes(',') || v.includes('\n') || v.includes('"')) ? `"${v}"` : v;
}

// ─── Custom Modals ────────────────────────────────────────────────────────────
function showPrompt(message, defaultVal = '') {
  return new Promise(resolve => {
    const modal = $('custom-prompt-modal');
    const msgEl = $('custom-prompt-message');
    const input = $('custom-prompt-input');
    const okBtn = $('custom-prompt-ok');
    const cancelBtn = $('custom-prompt-cancel');
    msgEl.textContent = message;
    input.value = defaultVal;
    modal.classList.remove('hidden');
    setTimeout(() => input.focus(), 50);
    const cleanup = (val) => {
      modal.classList.add('hidden');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      input.removeEventListener('keydown', onKey);
      resolve(val);
    };
    const onOk = () => cleanup(input.value.trim() || null);
    const onCancel = () => cleanup(null);
    const onKey = (e) => { if (e.key === 'Enter') onOk(); if (e.key === 'Escape') onCancel(); };
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    input.addEventListener('keydown', onKey);
  });
}

function showConfirm(message) {
  return new Promise(resolve => {
    const modal = $('custom-confirm-modal');
    const msgEl = $('custom-confirm-message');
    const okBtn = $('custom-confirm-ok');
    const cancelBtn = $('custom-confirm-cancel');
    msgEl.textContent = message;
    modal.classList.remove('hidden');
    const cleanup = (val) => {
      modal.classList.add('hidden');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      resolve(val);
    };
    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
  });
}

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const errorSection = $('error-section');
const errorTitle = $('error-title');
const errorMsg = $('error-msg');
const viewBooks = $('view-books');
const viewChapters = $('view-chapters');
const viewWords = $('view-words');
const crumbHome = $('crumb-home');
const crumbBook = $('crumb-book');
const crumbBookName = $('crumb-book-name');
const crumbChapter = $('crumb-chapter');
const crumbChapterName = $('crumb-chapter-name');
const addBookBtn = $('add-book-btn');
const addBookWrap = $('add-book-wrap');
const addChapterBtn = $('add-chapter-btn');
const addChapterWrap = $('add-chapter-wrap');
const wordCountBadge = $('word-count-badge');
const wordsTbody = $('words-tbody');
const wordsCardView = $('words-card-view');
const wordsTableView = $('words-table-view');
const hideToggleBar = $('hide-toggle-bar');
const extractSection = $('extract-section');
const openExtractBtn = $('open-extract-btn');
const closeExtractBtn = $('close-extract-btn');
const promptOutput = $('prompt-output');
const copyPromptBtn = $('copy-prompt-btn');
const aiJsonInput = $('ai-json-input');
const convertBtn = $('convert-btn');
const exportCsvBtn = $('export-csv-btn');
const selectAllWords = $('select-all-words');
const deleteSelectedBtn = $('delete-selected-btn');
const cardFrontSel = $('card-front-sel');
const cardBackSel = $('card-back-sel');
const viewCardBtn = $('view-card-btn');
const viewTableBtn = $('view-table-btn');
const startTestBtn = $('start-test-btn');

// ═══════════════════════════════════════════════════════════════════════════════
// LIBRARY: Books → Chapters → Words
// ═══════════════════════════════════════════════════════════════════════════════

crumbHome.addEventListener('click', () => loadBooks());
crumbBookName.addEventListener('click', () => {
  if (selectedBookId) loadChapters(selectedBookId, crumbBookName.textContent);
});

// ─── Load Books ───────────────────────────────────────────────────────────────
function loadBooks() {
  if (unsubChapters) { unsubChapters(); unsubChapters = null; }
  if (unsubWords) { unsubWords(); unsubWords = null; }
  selectedBookId = null;
  selectedChapterId = null;

  viewBooks.classList.remove('hidden');
  viewChapters.classList.add('hidden');
  viewWords.classList.add('hidden');
  addBookWrap.classList.remove('hidden');
  addChapterWrap.classList.add('hidden');
  crumbBook.classList.add('hidden');
  crumbChapter.classList.add('hidden');

  if (!unsubBooks) {
    viewBooks.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-secondary);">로딩 중...</p>';
    unsubBooks = onSnapshot(collection(db, `users/${currentUser.uid}/books`), (snap) => {
      viewBooks.innerHTML = '';
      if (snap.empty) {
        viewBooks.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;">저장된 단어장이 없습니다. 위의 [+ 새 단어장 만들기] 버튼을 눌러 시작하세요!</p>';
        return;
      }
      snap.forEach(d => {
        const data = d.data();
        const div = document.createElement('div');
        div.className = 'lib-card';
        div.innerHTML = `<div class="lib-icon">📘</div><div class="lib-title">${escapeHTML(data.name)}</div><button class="lib-delete-btn" title="단어장 삭제" style="position:absolute;top:8px;right:8px;background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.2rem;">✕</button>`;
        div.onclick = () => loadChapters(d.id, data.name);
        div.querySelector('.lib-delete-btn').onclick = async (e) => {
          e.stopPropagation();
          if (await showConfirm('이 단어장을 삭제하시겠습니까? (모든 단원과 함께 삭제됩니다)')) {
            try { await deleteDoc(doc(db, `users/${currentUser.uid}/books`, d.id)); }
            catch(err) { alert('삭제 실패: ' + err.message); }
          }
        };
        viewBooks.appendChild(div);
      });
    }, (e) => {
      console.error(e);
      viewBooks.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--danger);">오류: ${e.message}</p>`;
    });
  }
}

// ─── Load Chapters ────────────────────────────────────────────────────────────
function loadChapters(bookId, bookName) {
  if (unsubWords) { unsubWords(); unsubWords = null; }
  if (unsubChapters && selectedBookId !== bookId) {
    unsubChapters();
    unsubChapters = null;
  }
  selectedBookId = bookId;
  selectedChapterId = null;

  viewBooks.classList.add('hidden');
  viewChapters.classList.remove('hidden');
  viewWords.classList.add('hidden');
  addBookWrap.classList.add('hidden');
  addChapterWrap.classList.remove('hidden');
  crumbBook.classList.remove('hidden');
  crumbBookName.textContent = bookName;
  crumbChapter.classList.add('hidden');

  if (!unsubChapters) {
    viewChapters.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-secondary);">로딩 중...</p>';
    unsubChapters = onSnapshot(collection(db, `users/${currentUser.uid}/books/${bookId}/chapters`), (snap) => {
      viewChapters.innerHTML = '';
      if (snap.empty) {
        viewChapters.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;">단원이 없습니다. [+ 새 단원 추가] 버튼을 눌러주세요!</p>';
        return;
      }
      snap.forEach(d => {
        const data = d.data();
        const div = document.createElement('div');
        div.className = 'lib-card';
        div.innerHTML = `<div class="lib-icon">📂</div><div class="lib-title">${escapeHTML(data.name)}</div><button class="lib-delete-btn" title="단원 삭제" style="position:absolute;top:8px;right:8px;background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.2rem;">✕</button>`;
        div.onclick = () => loadWords(bookId, d.id, data.name);
        div.querySelector('.lib-delete-btn').onclick = async (e) => {
          e.stopPropagation();
          if (await showConfirm('이 단원을 삭제하시겠습니까? (모든 단어와 함께 삭제됩니다)')) {
            try { await deleteDoc(doc(db, `users/${currentUser.uid}/books/${bookId}/chapters`, d.id)); }
            catch(err) { alert('삭제 실패: ' + err.message); }
          }
        };
        viewChapters.appendChild(div);
      });
    }, (e) => {
      console.error(e);
      viewChapters.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--danger);">오류: ${e.message}</p>`;
    });
  }
}

// ─── Load Words ───────────────────────────────────────────────────────────────
function loadWords(bookId, chapterId, chapterName) {
  if (unsubWords && selectedChapterId !== chapterId) {
    unsubWords();
    unsubWords = null;
  }
  selectedBookId = bookId;
  selectedChapterId = chapterId;

  viewBooks.classList.add('hidden');
  viewChapters.classList.add('hidden');
  viewWords.classList.remove('hidden');
  addBookWrap.classList.add('hidden');
  addChapterWrap.classList.add('hidden');
  crumbChapter.classList.remove('hidden');
  crumbChapterName.textContent = chapterName;

  if (!unsubWords) {
    wordsCardView.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:2rem;">로딩 중...</p>';
    wordsTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">로딩 중...</td></tr>';

    const q = query(collection(db, `users/${currentUser.uid}/books/${bookId}/chapters/${chapterId}/words`), orderBy('order'));
    unsubWords = onSnapshot(q, (snap) => {
      currentLoadedWords = [];
      if (selectAllWords) selectAllWords.checked = false;
      if (deleteSelectedBtn) deleteSelectedBtn.classList.add('hidden');

      wordCountBadge.textContent = `${snap.size} 단어`;
      const allDocs = [];
      snap.forEach(d => {
        const data = { ...d.data(), _ref: d.ref, _path: d.ref.path };
        currentLoadedWords.push(data);
        allDocs.push(data);
      });

      renderCardView(allDocs);
      renderTableView(allDocs);
    }, (e) => {
      console.error(e);
      wordsCardView.innerHTML = `<p style="text-align:center;color:var(--danger);padding:2rem;">오류: ${e.message}</p>`;
    });
  }
}

// ─── Parse Word Data ──────────────────────────────────────────────────────────
// Handles both old {front, back} format and new structured format
function parseWordData(data) {
  // If has structured fields, use them directly
  if (data.word) {
    return {
      word: data.word || data.front || '',
      pos: data.pos || '',
      pronunciation: data.pronunciation || '',
      meaning: data.meaning || '',
      examples: Array.isArray(data.examples) ? data.examples : [],
      synonyms: Array.isArray(data.synonyms) ? data.synonyms : [],
      antonyms: Array.isArray(data.antonyms) ? data.antonyms : [],
      related: Array.isArray(data.related) ? data.related : [],
      front: data.front || data.word || '',
      back: data.back || '',
    };
  }

  // Legacy: parse from front/back text
  const front = data.front || '';
  const back = data.back || '';

  // Parse front: "word  ⓐ  [pronunciation]"
  const frontParts = front.split(/\s{2,}/);
  const word = frontParts[0] || front;
  let pos = '';
  let pronunciation = '';
  for (let i = 1; i < frontParts.length; i++) {
    if (frontParts[i].startsWith('[') || frontParts[i].startsWith('(')) {
      pronunciation = frontParts[i];
    } else {
      pos = frontParts[i];
    }
  }

  // Parse back sections by emoji labels
  let meaning = '';
  let examples = [];
  let synonyms = [];
  let antonyms = [];
  let related = [];

  const sections = back.split(/\n\n/);
  for (const section of sections) {
    const trimmed = section.trim();
    if (trimmed.startsWith('📌 뜻')) {
      meaning = trimmed.replace(/^📌 뜻\n?/, '').trim();
    } else if (trimmed.startsWith('📖 예문')) {
      examples = trimmed.replace(/^📖 예문\n?/, '').split('\n').map(s => s.replace(/^•\s*/, '').trim()).filter(Boolean);
    } else if (trimmed.startsWith('✅ 유의어')) {
      synonyms = trimmed.replace(/^✅ 유의어\n?/, '').split('\n').map(s => s.replace(/^•\s*/, '').trim()).filter(Boolean);
    } else if (trimmed.startsWith('❌ 반의어')) {
      antonyms = trimmed.replace(/^❌ 반의어\n?/, '').split('\n').map(s => s.replace(/^•\s*/, '').trim()).filter(Boolean);
    } else if (trimmed.startsWith('🔗 관련어')) {
      related = trimmed.replace(/^🔗 관련어\n?/, '').split('\n').map(s => s.replace(/^•\s*/, '').trim()).filter(Boolean);
    } else if (!meaning && trimmed) {
      // Fallback: if no label, treat as meaning
      meaning = trimmed;
    }
  }

  // If no parsed meaning, use back directly
  if (!meaning && !examples.length) {
    meaning = back;
  }

  return { word, pos, pronunciation, meaning, examples, synonyms, antonyms, related, front, back };
}

// ─── Render Card View ─────────────────────────────────────────────────────────
function renderCardView(docs) {
  if (docs.length === 0) {
    wordsCardView.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:3rem;">단어가 없습니다. [✨ 단어 추출하기] 버튼으로 추가하세요!</p>';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'words-card-grid';

  docs.forEach((data, idx) => {
    const parsed = parseWordData(data);
    const card = document.createElement('div');
    card.className = 'word-card';

    // Build related sections HTML - each item on its own line
    const buildRelatedSection = (items, emoji, label, cls) => {
      if (!items || !items.length) return '';
      const lines = items.map(s => {
        // Each item is a string like "signify: ⓥ 중요하다" or "important: 중요한"
        // Split at the first colon to highlight the word part
        const colonIdx = s.indexOf(':');
        if (colonIdx > 0) {
          const word = s.slice(0, colonIdx).trim();
          const rest = s.slice(colonIdx + 1).trim();
          return `<div class="related-item"><span class="related-item-word">${escapeHTML(word)}</span><span class="related-item-colon">:</span><span class="related-item-meaning"> ${escapeHTML(rest)}</span></div>`;
        }
        return `<div class="related-item"><span class="related-item-meaning">${escapeHTML(s)}</span></div>`;
      }).join('');
      return `
        <div class="word-card-section word-section-related${hideState.related ? '' : ' toggled-hidden'}">
          <div class="word-card-section-label">${emoji} ${label}</div>
          <div class="word-card-related-list">${lines}</div>
        </div>`;
    };

    const synSection = buildRelatedSection(parsed.synonyms, '✅', '유의어');
    const antSection = buildRelatedSection(parsed.antonyms, '❌', '반의어');
    const relSection = buildRelatedSection(parsed.related, '🔗', '관련어');
    const hasRelated = (parsed.synonyms?.length || parsed.antonyms?.length || parsed.related?.length);

    card.innerHTML = `
      <div class="word-card-header">
        <span class="word-card-word word-section-word${hideState.word ? '' : ' toggled-hidden'}">${escapeHTML(parsed.word)}</span>
        ${parsed.pos ? `<span class="word-card-pos">${escapeHTML(parsed.pos)}</span>` : ''}
        ${parsed.pronunciation ? `<span class="word-card-pron">${escapeHTML(parsed.pronunciation)}</span>` : ''}
        <span class="word-card-num">${idx + 1}</span>
      </div>
      ${parsed.meaning ? `
        <div class="word-card-section word-section-meaning${hideState.meaning ? '' : ' toggled-hidden'}">
          <div class="word-card-section-label">📌 뜻</div>
          <div class="word-card-meaning">${escapeHTML(parsed.meaning)}</div>
        </div>
      ` : ''}
      ${parsed.examples.length ? `
        <div class="word-card-section word-section-example${hideState.example ? '' : ' toggled-hidden'}">
          <div class="word-card-section-label">📖 예문</div>
          <div class="word-card-example">${parsed.examples.map(e => escapeHTML(e)).join('\n')}</div>
        </div>
      ` : ''}
      ${hasRelated ? `<div class="word-card-related-group">${synSection}${antSection}${relSection}</div>` : ''}
      <div class="word-card-actions">
        <button class="word-card-edit-btn">✏️ 수정</button>
        <button class="word-card-delete-btn">🗑 삭제</button>
      </div>
    `;

    card.querySelector('.word-card-edit-btn').onclick = async () => {
      const newFront = await showPrompt('앞면(단어):', data.front);
      if (newFront === null) return;
      const newBack = await showPrompt('뒷면(뜻/정보):', data.back);
      if (newBack === null) return;
      try { await updateDoc(data._ref, { front: newFront, back: newBack, word: newFront }); }
      catch(err) { alert('수정 실패: ' + err.message); }
    };

    card.querySelector('.word-card-delete-btn').onclick = async () => {
      if (await showConfirm('이 단어를 삭제하시겠습니까?')) {
        try { await deleteDoc(data._ref); }
        catch(err) { alert('삭제 실패: ' + err.message); }
      }
    };

    grid.appendChild(card);
  });

  wordsCardView.innerHTML = '';
  wordsCardView.appendChild(grid);
  applyHideState();
}

// ─── Render Table View ────────────────────────────────────────────────────────
function renderTableView(docs) {
  wordsTbody.innerHTML = '';
  if (docs.length === 0) {
    wordsTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">단어가 없습니다.</td></tr>';
    return;
  }
  docs.forEach((data, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input type="checkbox" class="word-chk" data-path="${data._path}" /></td><td>${idx+1}</td><td style="font-weight:600;color:var(--primary-light);">${escapeHTML(data.front)}</td><td style="white-space:pre-wrap;font-size:0.82rem;color:var(--text-secondary);">${escapeHTML(data.back)}</td>
      <td><div style="display:flex;gap:4px;">
        <button class="word-card-edit-btn" style="font-size:0.78rem;padding:4px 10px;">수정</button>
        <button class="word-card-delete-btn" style="font-size:0.78rem;padding:4px 10px;">삭제</button>
      </div></td>`;
    tr.querySelector('.word-card-edit-btn').onclick = async () => {
      const newFront = await showPrompt('앞면(단어):', data.front);
      if (newFront === null) return;
      const newBack = await showPrompt('뒷면(뜻/정보):', data.back);
      if (newBack === null) return;
      try { await updateDoc(data._ref, { front: newFront, back: newBack }); }
      catch(err) { alert('수정 실패: ' + err.message); }
    };
    tr.querySelector('.word-card-delete-btn').onclick = async () => {
      if (await showConfirm('이 단어를 삭제하시겠습니까?')) {
        try { await deleteDoc(data._ref); }
        catch(err) { alert('삭제 실패: ' + err.message); }
      }
    };
    tr.querySelector('.word-chk').addEventListener('change', updateDeleteBtn);
    wordsTbody.appendChild(tr);
  });
}

// ─── View Toggle ──────────────────────────────────────────────────────────────
viewCardBtn.addEventListener('click', () => {
  currentViewMode = 'card';
  viewCardBtn.classList.add('active');
  viewTableBtn.classList.remove('active');
  wordsCardView.classList.remove('hidden');
  wordsTableView.classList.add('hidden');
  hideToggleBar.classList.remove('hidden');
});
viewTableBtn.addEventListener('click', () => {
  currentViewMode = 'table';
  viewTableBtn.classList.add('active');
  viewCardBtn.classList.remove('active');
  wordsTableView.classList.remove('hidden');
  wordsCardView.classList.add('hidden');
  hideToggleBar.classList.add('hidden');
});

// ─── Hide Toggles ─────────────────────────────────────────────────────────────
function applyHideState() {
  // word
  document.querySelectorAll('.word-section-word').forEach(el => {
    el.classList.toggle('toggled-hidden', !hideState.word);
  });
  // meaning
  document.querySelectorAll('.word-section-meaning').forEach(el => {
    el.classList.toggle('toggled-hidden', !hideState.meaning);
  });
  // example
  document.querySelectorAll('.word-section-example').forEach(el => {
    el.classList.toggle('toggled-hidden', !hideState.example);
  });
  // related
  document.querySelectorAll('.word-section-related').forEach(el => {
    el.classList.toggle('toggled-hidden', !hideState.related);
  });
}

document.querySelectorAll('.hide-toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    hideState[target] = !hideState[target];
    btn.classList.toggle('active', hideState[target]);
    applyHideState();
  });
});

// ─── Create Book / Chapter ────────────────────────────────────────────────────
addBookBtn.addEventListener('click', async () => {
  const name = await showPrompt('새 단어장의 이름을 입력하세요:');
  if (!name || !name.trim()) return;
  try {
    await addDoc(collection(db, `users/${currentUser.uid}/books`), {
      name: name.trim(), createdAt: serverTimestamp()
    });
  } catch (e) {
    alert('단어장 생성 실패: ' + e.message);
  }
});

addChapterBtn.addEventListener('click', async () => {
  const name = await showPrompt('새 단원(챕터)의 이름을 입력하세요:');
  if (!name || !name.trim() || !selectedBookId) return;
  try {
    await addDoc(collection(db, `users/${currentUser.uid}/books/${selectedBookId}/chapters`), {
      name: name.trim(), createdAt: serverTimestamp()
    });
  } catch (e) {
    alert('단원 생성 실패: ' + e.message);
  }
});

// ─── CSV Export ───────────────────────────────────────────────────────────────
exportCsvBtn.addEventListener('click', () => {
  if (!currentLoadedWords.length) { alert('내보낼 단어가 없습니다.'); return; }
  const csv = '\uFEFF' + currentLoadedWords.map(w => `${escapeCSV(w.front)},${escapeCSV(w.back)}`).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${crumbChapterName.textContent || 'words'}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// ─── Multi-Delete ─────────────────────────────────────────────────────────────
function updateDeleteBtn() {
  const checked = document.querySelectorAll('.word-chk:checked').length;
  const total = document.querySelectorAll('.word-chk').length;
  deleteSelectedBtn.classList.toggle('hidden', checked === 0);
  selectAllWords.checked = (checked === total && total > 0);
}

selectAllWords.addEventListener('change', e => {
  document.querySelectorAll('.word-chk').forEach(chk => chk.checked = e.target.checked);
  updateDeleteBtn();
});

deleteSelectedBtn.addEventListener('click', async () => {
  const chks = document.querySelectorAll('.word-chk:checked');
  if (!chks.length) return;
  if (!await showConfirm(`선택한 ${chks.length}개의 단어를 삭제하시겠습니까?`)) return;
  deleteSelectedBtn.disabled = true;
  deleteSelectedBtn.textContent = '삭제 중...';
  try {
    await Promise.all(Array.from(chks).map(chk => deleteDoc(doc(db, chk.dataset.path))));
  } catch(e) {
    alert('삭제 실패: ' + e.message);
  } finally {
    deleteSelectedBtn.disabled = false;
    deleteSelectedBtn.textContent = '🗑 선택 삭제';
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXTRACT SECTION TOGGLE
// ═══════════════════════════════════════════════════════════════════════════════

openExtractBtn.addEventListener('click', () => extractSection.classList.remove('hidden'));
closeExtractBtn.addEventListener('click', () => extractSection.classList.add('hidden'));

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

function updatePrompt() {
  if (!promptOutput || !cardFrontSel || !cardBackSel) return;
  const frontOpt = cardFrontSel.value;
  const backOpt = cardBackSel.value;

  const includeExample = backOpt !== 'meaning_only';
  const includeSynAnt = backOpt === 'full';

  let formatStr = `- "word": The English vocabulary word (required)\n- "meaning": The Korean meaning exactly as written (required)\n- "pos": Part of speech (e.g., ⓝ, ⓥ, ⓐ) (optional)\n- "pronunciation": Pronunciation symbol (optional)`;
  if (includeExample) formatStr += `\n- "examples": Array of example sentences (optional)`;
  if (includeSynAnt) formatStr += `\n- "synonyms": Array of strings (optional)\n- "antonyms": Array of strings (optional)\n- "related": Array of related words (optional)`;

  let exampleStr = `[
  {
    "word": "significant",
    "meaning": "1 중요한 2 상당한"`;
  if (includeExample) exampleStr += `,\n    "examples": ["This is significant! 이것은 중요하다!"]`;
  if (includeSynAnt) exampleStr += `,\n    "synonyms": ["important: 중요한"]`;
  exampleStr += `\n  }\n]`;

  const prompt = `You are an expert vocabulary extraction assistant. Your task is to extract ALL English vocabulary words from the provided source.

CRITICAL EXTRACTION RULES:
1. DO NOT SKIP ANY MAIN VOCABULARY WORDS. You MUST extract EVERY SINGLE main vocabulary word present in the source.
2. If there are dozens of words, you MUST list them ALL. DO NOT give up after a few words.
3. For multiple images or columns, extract from top-to-bottom, left-to-right.

CRITICAL TRANSCRIBING RULES:
1. NEVER USE YOUR OWN DICTIONARY KNOWLEDGE. Act purely as an OCR engine.
2. For the "meaning" field, you MUST copy the text EXACTLY as it appears. DO NOT summarize.

OUTPUT FORMAT:
You MUST output a valid JSON array of objects. Do not wrap it in markdown blockquotes.
Each object MUST have the following keys:
${formatStr}

Example:
${exampleStr}
`;

  promptOutput.value = prompt;
}

if (cardFrontSel) cardFrontSel.addEventListener('change', updatePrompt);
if (cardBackSel) cardBackSel.addEventListener('change', updatePrompt);
if (promptOutput) updatePrompt();

if (copyPromptBtn) {
  copyPromptBtn.addEventListener('click', () => {
    promptOutput.select();
    document.execCommand('copy');
    const orgText = copyPromptBtn.textContent;
    copyPromptBtn.textContent = '✅ 복사 완료!';
    setTimeout(() => copyPromptBtn.textContent = orgText, 2000);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERT HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

function parseResponse(text) {
  let c = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const s = c.indexOf('[');
  if (s === -1) throw new Error('JSON 배열 시작 부분을 찾을 수 없습니다.\nAI가 준 응답에서 [...] 형태의 데이터를 찾지 못했습니다.');
  c = c.slice(s);
  try {
    return JSON.parse(c);
  } catch (err) {
    let lastBrace = c.lastIndexOf('}');
    if (lastBrace !== -1) {
      let fixed = c.slice(0, lastBrace + 1) + ']';
      try { return JSON.parse(fixed); } catch (e) {}
    }
    try { return JSON.parse(c + ']'); } catch (e) {}
    throw new Error(`JSON 파싱 오류: ${err.message}\n(AI가 쌍따옴표를 잘못 썼거나 텍스트가 잘렸을 수 있습니다)`);
  }
}

function formatCard(item, frontOpt, backOpt) {
  const ensureStringArray = (arr) => Array.isArray(arr) ? arr.map(x => typeof x === 'object' ? Object.values(x).join(' ') : String(x)) : [];

  let front = item.word || '';
  if (frontOpt === 'word_pos' && item.pos) front += `  ${item.pos}`;
  if (frontOpt === 'word_pron' && item.pronunciation) front += `  ${item.pronunciation}`;

  const parts = [];
  if (item.meaning) parts.push(`📌 뜻\n${item.pos ? item.pos + ' ' : ''}${item.meaning}`);
  if (backOpt === 'full') {
    const syns = ensureStringArray(item.synonyms);
    const ants = ensureStringArray(item.antonyms);
    const rels = ensureStringArray(item.related);
    if (syns.length) parts.push(`✅ 유의어\n• ${syns.join('\n• ')}`);
    if (ants.length) parts.push(`❌ 반의어\n• ${ants.join('\n• ')}`);
    if (rels.length) parts.push(`🔗 관련어\n• ${rels.join('\n• ')}`);
  }
  const exs = ensureStringArray(item.examples);
  if (backOpt !== 'meaning_only' && exs.length) parts.push(`📖 예문\n• ${exs.join('\n• ')}`);

  // Return full structured data + front/back for compatibility
  return {
    front: front.trim(),
    back: parts.join('\n\n').trim(),
    word: item.word || '',
    pos: item.pos || '',
    pronunciation: item.pronunciation || '',
    meaning: item.meaning || '',
    examples: ensureStringArray(item.examples),
    synonyms: ensureStringArray(item.synonyms),
    antonyms: ensureStringArray(item.antonyms),
    related: ensureStringArray(item.related),
  };
}

if (convertBtn) {
  convertBtn.addEventListener('click', async () => {
    hideError();
    const rawText = aiJsonInput.value.trim();
    if (!rawText) {
      alert("AI가 준 결과를 붙여넣어 주세요.");
      return;
    }

    const frontOpt = cardFrontSel.value;
    const backOpt = cardBackSel.value;

    convertBtn.disabled = true;
    const orgText = convertBtn.innerHTML;
    convertBtn.innerHTML = '<span class="btn-icon">⚡</span> 변환 중...';

    try {
      const allParsed = parseResponse(rawText);
      if (!Array.isArray(allParsed) || !allParsed.length) {
        throw new Error("결과에서 단어를 추출하지 못했습니다. (배열이 비어있음)");
      }

      const seen = new Set();
      const deduped = allParsed.filter(item => {
        const key = (item.word || '').toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      generatedData = deduped.map(item => formatCard(item, frontOpt, backOpt));
      await autoSaveToLibrary(generatedData);
      aiJsonInput.value = '';

    } catch(err) {
      console.error(err);
      showError("변환 오류", err.message);
    } finally {
      convertBtn.disabled = false;
      convertBtn.innerHTML = orgText;
    }
  });
}

// ─── Auto Save ────────────────────────────────────────────────────────────────
async function autoSaveToLibrary(data) {
  if (!selectedBookId || !selectedChapterId) {
    alert('저장할 단원을 찾지 못했습니다. 단원(챕터) 안에서 추출해주세요.');
    return;
  }
  try {
    let maxOrder = currentLoadedWords.reduce((max, w) => Math.max(max, w.order || 0), -1);
    for (let i = 0; i < data.length; i++) {
      const wordRef = doc(collection(db, `users/${currentUser.uid}/books/${selectedBookId}/chapters/${selectedChapterId}/words`));
      await setDoc(wordRef, { ...data[i], order: maxOrder + 1 + i });
    }
    alert(`${data.length}개 단어가 성공적으로 저장되었습니다!`);
    if (extractSection) extractSection.classList.add('hidden');
  } catch (e) {
    console.error(e);
    alert('저장 실패: ' + e.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST MODE
// ═══════════════════════════════════════════════════════════════════════════════

const testModal = $('test-modal');
const testSetup = $('test-setup');
const testFlash = $('test-flash');
const testQuiz = $('test-quiz');
const testShort = $('test-short');
const testResult = $('test-result');

// Setup options state
let selectedTestMode = 'flash';
let selectedTestDir = 'word2meaning';
let selectedTestOrder = 'sequential';

// Setup button groups
function setupToggleGroup(selector, onSelect) {
  document.querySelectorAll(selector).forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll(selector).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onSelect(btn.dataset.mode || btn.dataset.dir || btn.dataset.order);
    });
  });
}

setupToggleGroup('[data-mode]', val => { selectedTestMode = val; });
setupToggleGroup('[data-dir]', val => { selectedTestDir = val; });
setupToggleGroup('[data-order]', val => { selectedTestOrder = val; });

// Open test setup
if (startTestBtn) {
  startTestBtn.addEventListener('click', () => {
    if (currentLoadedWords.length < 2) {
      alert('테스트를 위해 최소 2개 이상의 단어가 필요합니다.');
      return;
    }
    $('test-word-count-info').textContent = `총 ${currentLoadedWords.length}개 단어로 테스트합니다.`;
    showScreen('setup');
    testModal.classList.remove('hidden');
  });
}

$('test-cancel-btn').addEventListener('click', closeTest);
$('flash-close-btn').addEventListener('click', closeTest);
$('quiz-close-btn').addEventListener('click', closeTest);
$('short-close-btn').addEventListener('click', closeTest);
$('result-close-btn').addEventListener('click', closeTest);
$('result-retry-btn').addEventListener('click', () => startTest(testWords));
$('result-retry-wrong-btn').addEventListener('click', () => {
  const wrongWords = testWords.filter(w => testWrong.includes(parseWordData(w).word));
  startTest(wrongWords);
});

$('test-start-confirm-btn').addEventListener('click', () => {
  testMode = selectedTestMode;
  testDir = selectedTestDir;
  testOrder = selectedTestOrder;
  let words = [...currentLoadedWords];
  if (testOrder === 'random') words = words.sort(() => Math.random() - 0.5);
  startTest(words);
});

function showScreen(name) {
  [testSetup, testFlash, testQuiz, testShort, testResult].forEach(s => s.classList.add('hidden'));
  if (name === 'setup') testSetup.classList.remove('hidden');
  else if (name === 'flash') testFlash.classList.remove('hidden');
  else if (name === 'quiz') testQuiz.classList.remove('hidden');
  else if (name === 'short') testShort.classList.remove('hidden');
  else if (name === 'result') testResult.classList.remove('hidden');
}

function closeTest() {
  testModal.classList.add('hidden');
}

function startTest(words) {
  testWords = words;
  testIndex = 0;
  testCorrect = 0;
  testWrong = [];

  if (testMode === 'flash') {
    showScreen('flash');
    showFlashCard();
  } else if (testMode === 'quiz') {
    showScreen('quiz');
    showQuizCard();
  } else if (testMode === 'short') {
    showScreen('short');
    showShortCard();
  }
}

// ─── Flashcard ────────────────────────────────────────────────────────────────
function showFlashCard() {
  if (testIndex >= testWords.length) {
    showTestResult();
    return;
  }
  const data = parseWordData(testWords[testIndex]);
  const total = testWords.length;
  const pct = (testIndex / total) * 100;

  $('test-progress-fill').style.width = pct + '%';
  $('test-progress-text').textContent = `${testIndex + 1} / ${total}`;

  const card = $('flashcard');
  card.classList.remove('flipped');
  testIsFlipped = false;

  const flashFront = $('flashcard-front');
  const flashBack = $('flashcard-back');
  $('flash-actions').style.display = 'none';
  $('flip-hint').style.display = '';

  if (testDir === 'word2meaning') {
    flashFront.textContent = data.word;
    flashBack.innerHTML = '';
    if (data.meaning) {
      const m = document.createElement('div');
      m.style.cssText = 'font-weight:700;font-size:1.1rem;margin-bottom:8px;';
      m.textContent = data.meaning;
      flashBack.appendChild(m);
    }
    if (data.examples.length) {
      const e = document.createElement('div');
      e.style.cssText = 'font-size:0.85rem;color:var(--text-secondary);font-style:italic;';
      e.textContent = data.examples[0];
      flashBack.appendChild(e);
    }
  } else {
    flashFront.textContent = data.meaning || data.back;
    const wb = document.createElement('div');
    wb.style.cssText = 'font-size:1.8rem;font-weight:700;font-family:var(--font-mono);';
    wb.textContent = data.word;
    flashBack.innerHTML = '';
    flashBack.appendChild(wb);
    if (data.pronunciation) {
      const p = document.createElement('div');
      p.style.cssText = 'font-size:0.9rem;color:var(--text-secondary);';
      p.textContent = data.pronunciation;
      flashBack.appendChild(p);
    }
  }
}

// Global flip function (called from onclick in HTML)
window.flipCard = function() {
  const card = $('flashcard');
  if (!testIsFlipped) {
    card.classList.add('flipped');
    testIsFlipped = true;
    $('flash-actions').style.display = 'flex';
    $('flip-hint').style.display = 'none';
  }
};

$('flash-correct-btn').addEventListener('click', () => {
  testCorrect++;
  testIndex++;
  showFlashCard();
});

$('flash-wrong-btn').addEventListener('click', () => {
  const data = parseWordData(testWords[testIndex]);
  testWrong.push(data.word);
  testIndex++;
  showFlashCard();
});

// ─── Quiz (4지선다) ───────────────────────────────────────────────────────────
function showQuizCard() {
  if (testIndex >= testWords.length) {
    showTestResult();
    return;
  }
  const data = parseWordData(testWords[testIndex]);
  const total = testWords.length;
  const pct = (testIndex / total) * 100;

  $('quiz-progress-fill').style.width = pct + '%';
  $('quiz-progress-text').textContent = `${testIndex + 1} / ${total}`;

  const questionWord = $('quiz-question-word');
  const choices = $('quiz-choices');
  const questionLabel = document.querySelector('.quiz-question-label');

  // Build choices: 1 correct + 3 random from other words
  const allParsed = currentLoadedWords.map(parseWordData);
  let options;

  if (testDir === 'word2meaning') {
    questionLabel.textContent = '다음 단어의 뜻은?';
    questionWord.textContent = data.word;
    const correctAnswer = data.meaning || data.back || '(뜻 없음)';
    const wrongPool = allParsed
      .filter(w => w.word !== data.word && (w.meaning || w.back))
      .map(w => w.meaning || w.back)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    options = [correctAnswer, ...wrongPool].sort(() => Math.random() - 0.5);

    choices.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-choice-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => handleQuizAnswer(btn, opt, correctAnswer, choices));
      choices.appendChild(btn);
    });
  } else {
    questionLabel.textContent = '다음 뜻의 단어는?';
    questionWord.textContent = data.meaning || data.back;
    const correctAnswer = data.word;
    const wrongPool = allParsed
      .filter(w => w.word !== data.word && w.word)
      .map(w => w.word)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    options = [correctAnswer, ...wrongPool].sort(() => Math.random() - 0.5);

    choices.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-choice-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => handleQuizAnswer(btn, opt, correctAnswer, choices));
      choices.appendChild(btn);
    });
  }
}

function handleQuizAnswer(clickedBtn, selected, correct, choicesEl) {
  // Disable all buttons
  choicesEl.querySelectorAll('.quiz-choice-btn').forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add('correct');
  });

  if (selected === correct) {
    clickedBtn.classList.add('correct');
    testCorrect++;
  } else {
    clickedBtn.classList.add('wrong');
    const data = parseWordData(testWords[testIndex]);
    testWrong.push(data.word);
  }

  setTimeout(() => {
    testIndex++;
    showQuizCard();
  }, 900);
}

// ─── Short Answer (주관식) ──────────────────────────────────────────────────────
let shortCorrectAnswer = [];
let shortCurrentData = null;

function showShortCard() {
  if (testIndex >= testWords.length) {
    showTestResult();
    return;
  }
  const data = parseWordData(testWords[testIndex]);
  shortCurrentData = data;
  const total = testWords.length;
  const pct = (testIndex / total) * 100;

  $('short-progress-fill').style.width = pct + '%';
  $('short-progress-text').textContent = `${testIndex + 1} / ${total}`;

  const questionWord = $('short-question-word');
  const questionLabel = $('short-question-label');
  const input = $('short-answer-input');
  const feedback = $('short-feedback');
  const nextBtn = $('short-next-btn');
  const submitBtn = $('short-submit-btn');

  input.value = '';
  input.disabled = false;
  input.classList.remove('correct', 'wrong');
  submitBtn.disabled = false;
  submitBtn.classList.remove('hidden');
  nextBtn.classList.add('hidden');
  feedback.classList.add('hidden');
  feedback.classList.remove('correct-fb', 'wrong-fb');

  if (testDir === 'word2meaning') {
    questionLabel.textContent = '다음 단어의 뜻을 입력하세요';
    questionWord.textContent = data.word;
    // 뜻 텍스트에서 1, 2, 쉼표 등으로 구분된 여러 정답 추출 (단순화된 형태)
    const rawMeaning = data.meaning || data.back || '';
    shortCorrectAnswer = rawMeaning.split(/[,\n]/)
      .map(s => s.replace(/^[0-9]+/, '').trim()) // 앞의 숫자 제거
      .filter(Boolean);
    if (!shortCorrectAnswer.length) shortCorrectAnswer = [rawMeaning];
  } else {
    questionLabel.textContent = '다음 뜻의 단어를 입력하세요';
    questionWord.textContent = data.meaning || data.back;
    shortCorrectAnswer = [data.word.toLowerCase().trim()];
  }

  // Auto focus (might not work perfectly on iOS without user interaction, but good for PC)
  setTimeout(() => input.focus(), 50);
}

function handleShortSubmit() {
  const input = $('short-answer-input');
  const feedback = $('short-feedback');
  const nextBtn = $('short-next-btn');
  const submitBtn = $('short-submit-btn');
  const val = input.value.trim().toLowerCase();

  if (!val) return;

  input.disabled = true;
  submitBtn.classList.add('hidden');
  nextBtn.classList.remove('hidden');
  feedback.classList.remove('hidden');

  // 아주 단순한 정답 체크 로직 (하나라도 포함/일치하면 정답)
  let isCorrect = false;
  if (testDir === 'word2meaning') {
    // 사용자가 입력한 값이 정답들 중 하나에 포함되는지 확인 (또는 정답이 입력값에 포함되거나)
    isCorrect = shortCorrectAnswer.some(ans => {
      const cleanAns = ans.toLowerCase().replace(/\s+/g, '');
      const cleanVal = val.replace(/\s+/g, '');
      return cleanAns.includes(cleanVal) || cleanVal.includes(cleanAns);
    });
  } else {
    isCorrect = shortCorrectAnswer.includes(val);
  }

  if (isCorrect) {
    input.classList.add('correct');
    feedback.classList.add('correct-fb');
    feedback.innerHTML = `<span class="correct-label">정답입니다!</span><br>원래 답: ${escapeHTML(testDir === 'word2meaning' ? shortCurrentData.meaning : shortCurrentData.word)}`;
    testCorrect++;
  } else {
    input.classList.add('wrong');
    feedback.classList.add('wrong-fb');
    feedback.innerHTML = `<span class="wrong-label">틀렸습니다!</span><br>정답: <strong>${escapeHTML(testDir === 'word2meaning' ? shortCurrentData.meaning : shortCurrentData.word)}</strong>`;
    testWrong.push(shortCurrentData.word);
  }
  
  nextBtn.focus();
}

$('short-submit-btn').addEventListener('click', handleShortSubmit);
$('short-answer-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !$('short-submit-btn').classList.contains('hidden')) {
    handleShortSubmit();
  }
});

$('short-next-btn').addEventListener('click', () => {
  testIndex++;
  showShortCard();
});

// ─── Result ───────────────────────────────────────────────────────────────────
function showTestResult() {
  showScreen('result');
  const total = testWords.length;
  const pct = Math.round((testCorrect / total) * 100);

  $('result-pct').textContent = pct + '%';
  $('result-title').textContent = pct >= 80 ? '🎉 훌륭해요!' : pct >= 50 ? '👍 잘 했어요!' : '💪 더 연습해요!';
  $('result-desc').textContent = `${total}개 중 ${testCorrect}개 정답 (오답 ${testWrong.length}개)`;

  // Animate circle
  const circumference = 327;
  const offset = circumference - (pct / 100) * circumference;
  setTimeout(() => {
    $('result-circle-dash').style.strokeDashoffset = offset;
  }, 100);

  // Wrong words list
  const wrongList = $('result-wrong-list');
  if (testWrong.length > 0) {
    wrongList.innerHTML = '<strong style="color:var(--danger);">틀린 단어:</strong><br>' + testWrong.join(', ');
    $('result-retry-wrong-btn').classList.remove('hidden');
  } else {
    wrongList.innerHTML = '';
    $('result-retry-wrong-btn').classList.add('hidden');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function showError(title, msg) {
  errorTitle.textContent = title;
  errorMsg.textContent = msg;
  errorSection.classList.remove('hidden');
}
function hideError() { errorSection.classList.add('hidden'); }

// ═══════════════════════════════════════════════════════════════════════════════
// VERSION BADGE (from GitHub)
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchLatestVersion() {
  try {
    const res = await fetch('https://api.github.com/repos/JunHyuk1203/goodnotesword/commits/main');
    if (!res.ok) return;
    const data = await res.json();
    const date = new Date(data.commit.author.date);
    const badge = $('version-badge');
    if (badge) {
      badge.textContent = `업데이트 ${date.getMonth()+1}.${date.getDate()} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
      badge.title = data.commit.message;
    }
  } catch (e) { console.error('Version fetch failed:', e); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════════

loadBooks();
fetchLatestVersion();
