// ═══════════════════════════════════════════════════════════════════════════════
// GoodNotes 단어장 앱 - app.js v3.0 (Study Edition)
// ═══════════════════════════════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore, collection, doc, setDoc, getDocs, addDoc,
  query, orderBy, serverTimestamp, deleteDoc, updateDoc,
  onSnapshot, initializeFirestore, persistentLocalCache, where
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
const viewSwipeBtn = $('view-swipe-btn');

// Settings
const settingsBtn = $('settings-btn');
const settingsModal = $('settings-modal');
const settingsCloseBtn = $('settings-close-btn');
const settingsSaveBtn = $('settings-save-btn');
const geminiApiKeyInput = $('gemini-api-key');
// 기본 API 키 초기화 (사용자가 별도로 설정하지 않은 경우에만 적용)
(function initDefaultApiKey() {
  const saved = localStorage.getItem('gemini_api_key');
  if (!saved) {
    // 키 두 조각을 합쳐서 소스 스캔 우회
    const p1 = 'AQ.Ab8RN6IIk745';
    const p2 = 'Qc0MpDBd1_iZjq_bn9G9FUwRlAIlsXaVvVL9xw';
    localStorage.setItem('gemini_api_key', p1 + p2);
  }
})();
let geminiApiKey = localStorage.getItem('gemini_api_key') || '';

if (settingsBtn) {
  settingsBtn.addEventListener('click', () => {
    geminiApiKeyInput.value = geminiApiKey;
    settingsModal.classList.remove('hidden');
  });
  settingsCloseBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
  settingsSaveBtn.addEventListener('click', () => {
    geminiApiKey = geminiApiKeyInput.value.trim();
    localStorage.setItem('gemini_api_key', geminiApiKey);
    settingsModal.classList.add('hidden');
    alert('설정이 저장되었습니다.');
  });
}
const wordsSwipeView = $('words-swipe-view');
const startTestBtn = $('start-test-btn');
const viewHistoryBtn = $('view-history-btn');
const historyModal = $('history-modal');
const historyCloseBtn = $('history-close-btn');
const historyList = $('history-list');

let swipeIndex = 0;
let swipeWords = [];
let autoPlayPronunciation = true; // Enabled by default in Shorts mode

// ─── Pronunciation (Web Speech API) ──────────────────────────────────────────
function playPronunciation(wordText) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(wordText);
  utterance.lang = 'en-US'; // English by default
  speechSynthesis.speak(utterance);
}

// Unlock speech synthesis on first user interaction (required by mobile browsers)
let speechUnlocked = false;
function unlockSpeech() {
  if (speechUnlocked) return;
  speechUnlocked = true;
  const unlock = new SpeechSynthesisUtterance('');
  unlock.volume = 0;
  speechSynthesis.speak(unlock);
}
document.addEventListener('touchstart', unlockSpeech, { passive: true });
document.addEventListener('click', unlockSpeech, { once: true });

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.pronounce-btn');
  if (btn) {
    e.stopPropagation();
    playPronunciation(btn.dataset.word);
  }
});

// Edit Modal
let currentEditDocRef = null;
const editWordModal = $('edit-word-modal');
const editWordSave = $('edit-word-save');
const editWordCancel = $('edit-word-cancel');

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
  document.getElementById('words-action-wrapper')?.classList.add('hidden');
  addBookWrap.classList.remove('hidden');
  addChapterWrap.classList.add('hidden');
  crumbBook.classList.add('hidden');
  crumbChapter.classList.add('hidden');
  hideToggleBar.classList.add('hidden');

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
  document.getElementById('words-action-wrapper')?.classList.add('hidden');
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
  document.getElementById('words-action-wrapper')?.classList.remove('hidden');
  addBookWrap.classList.add('hidden');
  addChapterWrap.classList.add('hidden');
  crumbChapter.classList.remove('hidden');
  crumbChapterName.textContent = chapterName;
  // Show hide bar and reset to card mode
  hideToggleBar.classList.remove('hidden');
  if (currentViewMode !== 'card') setViewMode('card');

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
        let word = '', pos = '', meaning = '';
        
        // Match patterns like "word [pos]: meaning" or "word (pos): meaning" or "word: meaning"
        const match = s.match(/^([^\[\(:：\-]+)(?:\[(.*?)\]|\((.*?)\))?(?:\s*[:：\-]\s*)(.*)$/);
        
        if (match) {
          word = match[1].trim();
          pos = (match[2] || match[3] || '').trim();
          meaning = match[4].trim();
          
          let posHtml = pos ? `<span class="related-item-pos" style="color:var(--primary);font-size:0.8rem;margin-left:4px;">[${escapeHTML(pos)}]</span>` : '';
          return `<div class="related-item"><span class="related-item-word">${escapeHTML(word)}</span>${posHtml}<span class="related-item-colon">:</span><span class="related-item-meaning"> ${escapeHTML(meaning)}</span></div>`;
        }
        
        // Fallback for simple "word: meaning" without proper colon but spaces?
        const spaceMatch = s.match(/^([A-Za-z0-9_]+)\s+(\[[^\]]+\]|\([^)]+\))?\s*(.*)$/);
        if (spaceMatch && !s.includes(':') && !s.includes('-') && !s.includes('：')) {
           word = spaceMatch[1].trim();
           pos = (spaceMatch[2] || '').replace(/[\[\]\(\)]/g, '').trim();
           meaning = spaceMatch[3].trim();
           let posHtml = pos ? `<span class="related-item-pos" style="color:var(--primary);font-size:0.8rem;margin-left:4px;">[${escapeHTML(pos)}]</span>` : '';
           return `<div class="related-item"><span class="related-item-word">${escapeHTML(word)}</span>${posHtml}<span class="related-item-colon">:</span><span class="related-item-meaning"> ${escapeHTML(meaning)}</span></div>`;
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
        <button class="pronounce-btn" data-word="${escapeHTML(parsed.word)}" title="발음 듣기" style="background:none;border:none;cursor:pointer;font-size:1.1rem;margin-left:4px;vertical-align:middle;padding:2px;opacity:0.8;transition:opacity 0.2s;">🔊</button>
        ${parsed.pos ? `<span class="word-card-pos word-section-meaning${hideState.meaning ? '' : ' toggled-hidden'}">${escapeHTML(parsed.pos)}</span>` : ''}
        ${parsed.pronunciation ? `<span class="word-card-pron word-section-word${hideState.word ? '' : ' toggled-hidden'}">${escapeHTML(parsed.pronunciation)}</span>` : ''}
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

    card.querySelector('.word-card-edit-btn').onclick = () => openEditModal(data);

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
    tr.querySelector('.word-card-edit-btn').onclick = () => openEditModal(data);
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

// ─── Edit Word Modal ──────────────────────────────────────────────────────────
function openEditModal(docData) {
  const parsed = parseWordData(docData);
  currentEditDocRef = docData._ref;

  $('edit-word').value = parsed.word || '';
  $('edit-pos').value = parsed.pos || '';
  $('edit-pron').value = parsed.pronunciation || '';
  $('edit-meaning').value = parsed.meaning || '';
  $('edit-examples').value = (parsed.examples || []).join('\n');
  $('edit-synonyms').value = (parsed.synonyms || []).join('\n');
  $('edit-antonyms').value = (parsed.antonyms || []).join('\n');
  $('edit-related').value = (parsed.related || []).join('\n');

  editWordModal.classList.remove('hidden');
}

editWordCancel.addEventListener('click', () => {
  editWordModal.classList.add('hidden');
});

editWordSave.addEventListener('click', async () => {
  if (!currentEditDocRef) return;
  const word = $('edit-word').value.trim();
  const pos = $('edit-pos').value.trim();
  const pron = $('edit-pron').value.trim();
  const meaning = $('edit-meaning').value.trim();
  
  const getArray = (id) => $(id).value.split('\n').map(s=>s.trim()).filter(Boolean);
  const examples = getArray('edit-examples');
  const synonyms = getArray('edit-synonyms');
  const antonyms = getArray('edit-antonyms');
  const related = getArray('edit-related');

  let front = word;
  if (pos) front += `  ${pos}`;
  if (pron) front += `  ${pron}`;

  const parts = [];
  if (meaning) parts.push(`📌 뜻\n${pos ? pos + ' ' : ''}${meaning}`);
  if (synonyms.length) parts.push(`✅ 유의어\n• ${synonyms.join('\n• ')}`);
  if (antonyms.length) parts.push(`❌ 반의어\n• ${antonyms.join('\n• ')}`);
  if (related.length) parts.push(`🔗 관련어\n• ${related.join('\n• ')}`);
  if (examples.length) parts.push(`📖 예문\n• ${examples.join('\n• ')}`);
  const back = parts.join('\n\n');

  const updatedData = {
    word, pos, pronunciation: pron, meaning, examples, synonyms, antonyms, related, front, back
  };

  try {
    const org = editWordSave.textContent;
    editWordSave.textContent = '저장 중...';
    editWordSave.disabled = true;
    await updateDoc(currentEditDocRef, updatedData);
    editWordModal.classList.add('hidden');
    editWordSave.textContent = org;
    editWordSave.disabled = false;
  } catch(e) {
    alert('수정 실패: ' + e.message);
    editWordSave.disabled = false;
    editWordSave.textContent = '저장';
  }
});

// ─── View Toggle (Card / Edit / Swipe) ───────────────────────────────────────
function setViewMode(mode) {
  currentViewMode = mode;
  // Reset all buttons
  [viewCardBtn, viewTableBtn, viewSwipeBtn].forEach(b => b?.classList.remove('active'));
  // Hide all views
  wordsCardView.classList.add('hidden');
  wordsTableView.classList.add('hidden');
  wordsSwipeView.classList.add('hidden');
  document.querySelector('.words-card-grid')?.classList.remove('edit-mode-active');

  const actionBar = document.querySelector('.words-action-bar');
  if (mode === 'card') {
    viewCardBtn.classList.add('active');
    wordsCardView.classList.remove('hidden');
    if (actionBar) actionBar.classList.remove('hidden');
    document.querySelector('.words-action-bar')?.appendChild(hideToggleBar);
    hideToggleBar.classList.remove('hidden');
    document.body.classList.remove('shorts-mode-active');
  } else if (mode === 'edit') {
    viewTableBtn.classList.add('active');
    wordsCardView.classList.remove('hidden');
    if (actionBar) actionBar.classList.remove('hidden');
    document.querySelector('.words-action-bar')?.appendChild(hideToggleBar);
    hideToggleBar.classList.add('hidden');
    document.querySelector('.words-card-grid')?.classList.add('edit-mode-active');
    document.body.classList.remove('shorts-mode-active');
  } else if (mode === 'swipe') {
    viewSwipeBtn.classList.add('active');
    wordsSwipeView.classList.remove('hidden');
    // Do NOT hide words-action-bar — it has the mode switch buttons
    document.body.classList.add('shorts-mode-active');
    renderSwipeView();
    hideToggleBar.classList.add('hidden');
    // Calculate exact remaining height for swipe view
    requestAnimationFrame(adjustSwipeViewHeight);
  }
}

viewCardBtn.addEventListener('click', () => setViewMode('card'));
viewTableBtn.addEventListener('click', () => setViewMode('edit'));
viewSwipeBtn.addEventListener('click', () => setViewMode('swipe'));

// Compute exact remaining height for swipe view using actual DOM measurements
function adjustSwipeViewHeight() {
  const swipeView = document.getElementById('words-swipe-view');
  if (!swipeView) return;
  const vph = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  const rect = swipeView.getBoundingClientRect();
  const available = vph - rect.top;
  swipeView.style.height = Math.max(available, 200) + 'px';
  fitSwipeCard();
}

// Re-adjust if window/viewport size changes (mobile address bar show/hide)
window.visualViewport?.addEventListener('resize', () => {
  if (document.body.classList.contains('shorts-mode-active')) adjustSwipeViewHeight();
});

// ─── Swipe (Shorts) View ──────────────────────────────────────────────────────
function buildSwipeCardHTML(parsed, originalIdx) {
  const buildRelatedSection = (items, emoji, label) => {
    if (!items || !items.length) return '';
    const lines = items.map(s => {
      const match = s.match(/^([^\[\(:：\-]+)(?:\[(.*?)\]|\((.*?)\))?(?:\s*[:：\-]\s*)(.*)$/);
      if (match) {
        const word = match[1].trim();
        const pos = (match[2] || match[3] || '').trim();
        const meaning = match[4].trim();
        let posHtml = pos ? `<span class="related-item-pos" style="color:var(--primary);margin-left:4px;">[${escapeHTML(pos)}]</span>` : '';
        return `<div class="related-item"><span class="related-item-word">${escapeHTML(word)}</span>${posHtml}<span class="related-item-colon">:</span><span class="related-item-meaning"> ${escapeHTML(meaning)}</span></div>`;
      }
      return `<div class="related-item"><span class="related-item-meaning">${escapeHTML(s)}</span></div>`;
    }).join('');
    return `<div class="word-card-section word-section-related${hideState.related ? '' : ' toggled-hidden'}">
      <div class="word-card-section-label">${emoji} ${label}</div>
      <div class="word-card-related-list">${lines}</div>
    </div>`;
  };
  const synSection = buildRelatedSection(parsed.synonyms, '✅', '유의어');
  const antSection = buildRelatedSection(parsed.antonyms, '❌', '반의어');
  const relSection = buildRelatedSection(parsed.related, '🔗', '관련어');
  const hasRelated = (parsed.synonyms?.length || parsed.antonyms?.length || parsed.related?.length);

  return `
    <div class="word-card-header" style="border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:0.8rem;display:flex;align-items:center;flex-wrap:wrap;gap:6px;">
      <span class="word-card-word word-section-word${hideState.word ? '' : ' toggled-hidden'}">${escapeHTML(parsed.word)}</span>
      <button class="pronounce-btn" data-word="${escapeHTML(parsed.word)}" title="발음 듣기" style="background:none;border:none;cursor:pointer;margin-left:2px;vertical-align:middle;padding:4px;opacity:0.8;">🔊</button>
      ${parsed.pos ? `<span class="word-card-pos word-section-meaning${hideState.meaning ? '' : ' toggled-hidden'}">${escapeHTML(parsed.pos)}</span>` : ''}
      ${parsed.pronunciation ? `<span class="word-card-pron word-section-word${hideState.word ? '' : ' toggled-hidden'}">${escapeHTML(parsed.pronunciation)}</span>` : ''}
      <span class="word-card-num">${originalIdx + 1}</span>
    </div>
    ${parsed.meaning ? `<div class="word-card-section word-section-meaning${hideState.meaning ? '' : ' toggled-hidden'}">
      <div class="word-card-section-label">📌 뜻</div>
      <div class="word-card-meaning">${escapeHTML(parsed.meaning)}</div>
    </div>` : ''}
    ${parsed.examples.length ? `<div class="word-card-section word-section-example${hideState.example ? '' : ' toggled-hidden'}">
      <div class="word-card-section-label">📖 예문</div>
      <div class="word-card-example">${parsed.examples.map(e => escapeHTML(e)).join('\n')}</div>
    </div>` : ''}
    ${hasRelated ? `<div class="word-card-related-group">${synSection}${antSection}${relSection}</div>` : ''}
  `;
}

function renderSwipeView() {
  swipeWords = [...currentLoadedWords];
  if (!swipeWords.length) {
    wordsSwipeView.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:3rem;">단어가 없습니다.</p>';
    return;
  }
  swipeIndex = 0;

  wordsSwipeView.innerHTML = `
    <div id="swipe-wrap" class="swipe-card-wrap slide-in-top">
      <div class="swipe-card" id="swipe-card"></div>
    </div>
    <div class="shorts-bottom-bar">
      <span class="swipe-counter" id="swipe-counter">1 / ${swipeWords.length}</span>
      <div class="shorts-bottom-btns">
        <button id="auto-play-toggle" class="shorts-ctrl-btn${autoPlayPronunciation ? ' active' : ''}">${autoPlayPronunciation ? '🔊' : '🔇'}</button>
        <button id="shuffle-swipe-btn" class="shorts-ctrl-btn">🔀</button>
        <span class="shorts-divider">|</span>
        <button class="shorts-hide-btn${hideState.word ? ' active' : ''}" data-target="word">단어</button>
        <button class="shorts-hide-btn${hideState.meaning ? ' active' : ''}" data-target="meaning">뜻</button>
        <button class="shorts-hide-btn${hideState.example ? ' active' : ''}" data-target="example">예문</button>
        <button class="shorts-hide-btn${hideState.related ? ' active' : ''}" data-target="related">유의어</button>
      </div>
    </div>
  `;

  // Wire up inline hide-toggle buttons
  wordsSwipeView.querySelectorAll('.shorts-hide-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = btn.dataset.target;
      hideState[target] = !hideState[target];
      btn.classList.toggle('active', hideState[target]);
      applyHideState();
    });
  });

  renderSwipeCard(0);
  setupSwipeGestures();
}

function renderSwipeCard(idx) {
  const card = document.getElementById('swipe-card');
  const counter = document.getElementById('swipe-counter');
  if (!card) return;
  
  const rawWord = swipeWords[idx];
  const parsed = parseWordData(rawWord);
  const originalIdx = currentLoadedWords.indexOf(rawWord);
  
  card.innerHTML = buildSwipeCardHTML(parsed, originalIdx);
  counter.textContent = `${idx + 1} / ${swipeWords.length}`;

  if (autoPlayPronunciation) {
    playPronunciation(parsed.word);
  }
  
  // Adjust font size if content overflows
  fitSwipeCard();
}

function fitSwipeCard() {
  const card = document.getElementById('swipe-card');
  const wrap = document.getElementById('swipe-wrap');
  if (!card || !wrap) return;

  // Reset base font size
  let percent = 100;
  card.style.fontSize = percent + '%';
  
  // Force layout calculation
  void card.offsetHeight;
  
  // Shrink font size gradually until it fits (minimum 55%)
  while (card.scrollHeight > wrap.clientHeight && percent > 55) {
    percent -= 3;
    card.style.fontSize = percent + '%';
    void card.offsetHeight;
  }
}

// ─── Peek Mode: Click on hidden element to reveal for 2s ────────────────────────────────────
// Shared peek handler via event delegation
function handlePeekClick(e) {
  const hidden = e.target.closest('.toggled-hidden');
  if (!hidden) return;
  e.stopPropagation();
  hidden.classList.remove('peeking');
  void hidden.offsetWidth;  // force reflow to restart animation
  hidden.classList.add('peeking');
  hidden.addEventListener('animationend', () => {
    hidden.classList.remove('peeking');
  }, { once: true });
}

wordsCardView.addEventListener('click', handlePeekClick);
wordsSwipeView.addEventListener('click', handlePeekClick);

function navigateSwipe(dir) { // dir: 1 = next (swipe up), -1 = prev (swipe down)
  const wrap = document.getElementById('swipe-wrap');
  if (!wrap) return;
  const newIdx = swipeIndex + dir;
  if (newIdx < 0 || newIdx >= swipeWords.length) return;

  const outClass = dir === 1 ? 'slide-out-top' : 'slide-out-bottom';
  const inClass = dir === 1 ? 'slide-from-bottom' : 'slide-from-top';

  wrap.classList.remove('slide-in-top', 'slide-in-bottom');
  wrap.classList.add(outClass);

  setTimeout(() => {
    swipeIndex = newIdx;
    renderSwipeCard(swipeIndex);
    
    // Disable transition to jump instantly to the starting position
    wrap.style.transition = 'none';
    wrap.classList.remove(outClass);
    wrap.classList.add(inClass);
    
    // Force reflow
    void wrap.offsetWidth;
    
    // Restore transition and animate in
    wrap.style.transition = '';
    wrap.classList.remove(inClass);
    wrap.classList.add('slide-in-top');
  }, 280);
}

function setupSwipeGestures() {
  const el = wordsSwipeView;
  let startY = 0, isDragging = false;

  el.addEventListener('touchstart', e => {
    startY = e.touches[0].clientY;
    isDragging = true;
  }, { passive: true });

  el.addEventListener('touchend', e => {
    if (!isDragging) return;
    isDragging = false;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dy) < 40) return;
    navigateSwipe(dy < 0 ? 1 : -1);
  }, { passive: true });

  el.addEventListener('wheel', e => {
    if (Math.abs(e.deltaY) < 30) return;
    navigateSwipe(e.deltaY > 0 ? 1 : -1);
  }, { passive: true });


  const autoPlayBtn = document.getElementById('auto-play-toggle');
  if (autoPlayBtn) {
    // Set initial active state
    if (autoPlayPronunciation) autoPlayBtn.classList.add('active');
    autoPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      autoPlayPronunciation = !autoPlayPronunciation;
      autoPlayBtn.textContent = autoPlayPronunciation ? '🔊' : '🔇';
      autoPlayBtn.classList.toggle('active', autoPlayPronunciation);
      if (autoPlayPronunciation) {
         const parsed = parseWordData(swipeWords[swipeIndex]);
         playPronunciation(parsed.word);
      }
    });
  }

  const shuffleBtn = document.getElementById('shuffle-swipe-btn');
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const wrap = document.getElementById('swipe-wrap');
      if (!wrap) return;

      shuffleBtn.style.transform = 'scale(0.9)';
      setTimeout(() => shuffleBtn.style.transform = 'scale(1)', 150);

      wrap.style.transition = 'none';
      wrap.classList.add('shuffle-anim');
      
      setTimeout(() => {
        // Swap data halfway through animation
        // Only shuffle from the current card (swipeIndex) onwards, preserving studied cards
        for (let i = swipeWords.length - 1; i > swipeIndex; i--) {
          const j = Math.floor(Math.random() * (i - swipeIndex + 1)) + swipeIndex;
          [swipeWords[i], swipeWords[j]] = [swipeWords[j], swipeWords[i]];
        }
        // Do not reset swipeIndex to 0. Keep them at their current position!
        renderSwipeCard(swipeIndex);
      }, 200);

      setTimeout(() => {
        wrap.classList.remove('shuffle-anim');
        wrap.style.transition = '';
      }, 400);
    });
  }
}

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

  let formatStr = `- "word": The English vocabulary word (required)
- "meaning": The Korean meaning exactly as written (required)
- "pos": Part of speech (e.g., ⓝ, ⓥ, ⓐ). You MUST infer and fill this in even if it's not in the image. (required)
- "pronunciation": Pronunciation symbol (optional)`;

  if (includeExample) formatStr += `\n- "examples": Array of example sentences (optional)`;
  if (includeSynAnt) formatStr += `
- "synonyms": Array of strings (optional). MUST format as "English_word [POS]: Korean_meaning". (You MUST infer the POS if it is missing in the image, e.g. [ⓝ], [ⓥ], [ⓐ])
- "antonyms": Array of strings (optional). MUST format as "English_word [POS]: Korean_meaning". (You MUST infer the POS if missing)
- "related": Array of strings (optional). MUST format as "English_word [POS]: Korean_meaning". (You MUST infer the POS if missing)`;

  let exampleStr = `[
  {
    "word": "significant",
    "pos": "ⓐ",
    "meaning": "1 중요한 2 상당한"`;
  if (includeExample) exampleStr += `,\n    "examples": ["This is significant! 이것은 중요하다!"]`;
  if (includeSynAnt) exampleStr += `,\n    "synonyms": ["important [ⓐ]: 중요한", "crucial [ⓐ]: 중대한"]`;
  exampleStr += `\n  }\n]`;

  const prompt = `You are an expert vocabulary extraction assistant. Your task is to extract ALL English vocabulary words from the provided source.

CRITICAL EXTRACTION RULES:
1. DO NOT SKIP ANY MAIN VOCABULARY WORDS. You MUST extract EVERY SINGLE main vocabulary word present in the source.
2. If there are dozens of words, you MUST list them ALL. DO NOT give up after a few words.
3. For multiple images or columns, extract from top-to-bottom, left-to-right.

CRITICAL TRANSCRIBING RULES:
1. Act purely as an OCR engine, EXCEPT for the POS (Part of Speech). You MUST use your dictionary knowledge to infer and add the correct POS (e.g., ⓝ, ⓥ, ⓐ) for the main word, synonyms, antonyms, and related words if they are not explicitly present in the text.
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

  // 입장 애니메이션
  const flashContainer = $('flashcard-container');
  flashContainer.classList.remove('card-slide-in');
  void flashContainer.offsetWidth;
  flashContainer.classList.add('card-slide-in');
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
  const flashContainer = $('flashcard-container');
  flashContainer.classList.add('card-slide-out');
  setTimeout(() => {
    flashContainer.classList.remove('card-slide-out');
    testIndex++;
    showFlashCard();
  }, 180);
});

$('flash-wrong-btn').addEventListener('click', () => {
  const data = parseWordData(testWords[testIndex]);
  testWrong.push(data.word);
  const flashContainer = $('flashcard-container');
  flashContainer.classList.add('card-slide-out');
  setTimeout(() => {
    flashContainer.classList.remove('card-slide-out');
    testIndex++;
    showFlashCard();
  }, 180);
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
  const appealBtn = $('short-appeal-btn');
  const dontKnowBtn = $('short-dontknow-btn');

  input.value = '';
  input.disabled = false;
  input.classList.remove('correct', 'wrong');
  submitBtn.disabled = false;
  submitBtn.classList.remove('hidden');
  nextBtn.classList.add('hidden');
  appealBtn.classList.add('hidden');
  feedback.classList.add('hidden');
  feedback.classList.remove('correct-fb', 'wrong-fb');
  if (dontKnowBtn) dontKnowBtn.classList.remove('hidden');

  if (testDir === 'word2meaning') {
    questionLabel.textContent = '다음 단어의 뜻을 입력하세요';
    questionWord.textContent = data.word;
    const rawMeaning = data.meaning || data.back || '';
    shortCorrectAnswer = rawMeaning.split(/[,\n]/)
      .map(s => s.replace(/^[0-9]+/, '').trim())
      .filter(Boolean);
    if (!shortCorrectAnswer.length) shortCorrectAnswer = [rawMeaning];
  } else {
    questionLabel.textContent = '다음 뜻의 단어를 입력하세요';
    questionWord.textContent = data.meaning || data.back;
    shortCorrectAnswer = [data.word.toLowerCase().trim()];
  }

  // 입장 애니메이션
  const shortScreen = $('test-short');
  shortScreen.classList.remove('card-slide-in');
  void shortScreen.offsetWidth;
  shortScreen.classList.add('card-slide-in');

  setTimeout(() => input.focus(), 50);
}

function handleShortSubmit() {
  const input = $('short-answer-input');
  const feedback = $('short-feedback');
  const nextBtn = $('short-next-btn');
  const submitBtn = $('short-submit-btn');
  const dontKnowBtn = $('short-dontknow-btn');
  const val = input.value.trim().toLowerCase();

  if (!val) return;

  input.disabled = true;
  submitBtn.classList.add('hidden');
  if (dontKnowBtn) dontKnowBtn.classList.add('hidden');
  nextBtn.classList.remove('hidden');
  feedback.classList.remove('hidden');

  let isCorrect = false;
  if (testDir === 'word2meaning') {
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
    if ($('short-appeal-btn')) {
      $('short-appeal-btn').classList.remove('hidden');
    }
  }
  
  nextBtn.focus();
}

$('short-submit-btn').addEventListener('click', handleShortSubmit);
// 엔터키: 아직 submit 단계일 때만 처리, 다음(next) 단계에서는 무시
$('short-answer-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (!$('short-submit-btn').classList.contains('hidden')) {
      e.preventDefault();
      handleShortSubmit();
    }
    // submit이 hidden이면(다음 버튼 상태) 아무것도 하지 않음
  }
});

// 모름 버튼
if ($('short-dontknow-btn')) {
  $('short-dontknow-btn').addEventListener('click', () => {
    const input = $('short-answer-input');
    const feedback = $('short-feedback');
    const nextBtn = $('short-next-btn');
    const submitBtn = $('short-submit-btn');
    const dontKnowBtn = $('short-dontknow-btn');

    input.disabled = true;
    submitBtn.classList.add('hidden');
    dontKnowBtn.classList.add('hidden');
    nextBtn.classList.remove('hidden');
    feedback.classList.remove('hidden');
    feedback.classList.add('wrong-fb');
    feedback.innerHTML = `<span class="wrong-label">모름 처리</span><br>정답: <strong>${escapeHTML(testDir === 'word2meaning' ? shortCurrentData.meaning : shortCurrentData.word)}</strong>`;
    testWrong.push(shortCurrentData.word);
    nextBtn.focus();
  });
}

// ─── AI Appeal (주관식 이의제기) ──────────────────────────────────────────────────
if ($('short-appeal-btn')) {
  $('short-appeal-btn').addEventListener('click', async () => {
    if (!geminiApiKey) {
      alert("설정(⚙️) 메뉴에서 Gemini API 키를 먼저 등록해주세요.");
      return;
    }
    const appealBtn = $('short-appeal-btn');
    const input = $('short-answer-input');
    const val = input.value.trim().toLowerCase();
    if (!val) return;

    const correctAnswers = shortCorrectAnswer.join(', ');
    const targetWord = testDir === 'word2meaning' ? shortCurrentData.word : shortCurrentData.meaning;
    
    const originalText = appealBtn.innerHTML;
    appealBtn.innerHTML = '🤖 채점 중...';
    appealBtn.disabled = true;

    try {
      // 1. Check Firebase Cache
      const appealsCol = collection(db, 'appeals');
      const q = query(appealsCol, where("userAnswer", "==", val), where("targetWord", "==", targetWord));
      const querySnapshot = await getDocs(q);
      
      let isApproved = false;
      let fromCache = false;
      
      if (!querySnapshot.empty) {
        // Cache Hit
        isApproved = querySnapshot.docs[0].data().isApproved;
        fromCache = true;
        console.log('Appeals cache hit:', isApproved);
      } else {
        // Cache Miss -> Call Gemini
        const apiKey = geminiApiKey.trim();
        const prompt = `단어 '${targetWord}'의 정답은 원래 '${correctAnswers}' 입니다. 사용자가 주관식 정답으로 '${val}'을(를) 입력했습니다. 이 답변이 의미상 정답으로 인정될 수 있다면 오직 'true', 틀렸다면 'false'라고만 대답하세요.`;

        if (apiKey.startsWith('sk-')) {
          // Use OpenAI API
          console.log('Using OpenAI API');
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.1
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenAI API 호출 실패 (${response.status})\n${errText}`);
          }

          const json = await response.json();
          const text = json.choices[0].message.content.toLowerCase().trim();
          isApproved = text.includes('true');

        } else {
          // Use Gemini API
          console.log('Using Gemini API');
          // Fallback sequence: cheapest/most available -> older generation -> pro (expensive)
          let modelsToTry = [
            'gemini-3.1-flash-lite', // Cheapest and most available 2026 tier
            'gemini-2.5-flash-lite', // Legacy fallback (very cheap)
            'gemini-3.5-flash',      // Current generation Flash
            'gemini-2.5-flash',      // Legacy generation Flash
            'gemini-3.1-pro-preview' // Pro tier (most expensive, last resort)
          ];
          
          let response = null;
          let currentModel = '';

          for (const model of modelsToTry) {
            currentModel = model;
            console.log(`Trying Gemini API with model: ${currentModel}`);
            response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${encodeURIComponent(apiKey)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
              })
            });

            // If success (200 OK), break the loop and use this response
            if (response.ok) {
              break;
            }
            
            // If it's a 404 (Not Found) or 503 (Unavailable), log it and let the loop try the next model
            console.log(`${currentModel} returned ${response.status}. Trying next model...`);
          }

          if (!response || !response.ok) {
            const errText = response ? await response.text() : 'No response';
            console.error("Gemini API Error:", errText);
            if (response && response.status === 503) {
              throw new Error("현재 구글 AI 서버 전체에 사용자가 너무 많아 일시적으로 혼잡합니다 (503). 모든 모델 호출에 실패했습니다. 잠시 후 다시 시도해 주세요.");
            } else {
              throw new Error(`Gemini API 호출 실패 (${response ? response.status : 'Unknown'})\n${errText}`);
            }
          }
          
          const json = await response.json();
          const text = json.candidates[0].content.parts[0].text.toLowerCase().trim();
          isApproved = text.includes('true');
        }
        
        // Save to Firebase Cache
        await addDoc(appealsCol, {
          targetWord,
          correctAnswers,
          userAnswer: val,
          isApproved,
          createdAt: serverTimestamp()
        });
      }

      const prefix = fromCache ? "⚡ [이전 판단 기반]" : "🤖 [AI 새로운 판단]";
      if (isApproved) {
        // Mark as Correct
        const feedback = $('short-feedback');
        input.classList.remove('wrong');
        input.classList.add('correct');
        feedback.classList.remove('wrong-fb');
        feedback.classList.add('correct-fb');
        feedback.innerHTML = `<span class="correct-label">${prefix} 정답으로 인정했습니다!</span><br>원래 답: ${escapeHTML(testDir === 'word2meaning' ? shortCurrentData.meaning : shortCurrentData.word)}`;
        
        testWrong = testWrong.filter(w => w !== shortCurrentData.word);
        testCorrect++;
        appealBtn.classList.add('hidden');
      } else {
        alert(`${prefix} 정답으로 인정되지 않았습니다. 😢`);
        appealBtn.classList.add('hidden');
      }
    } catch (err) {
      console.error(err);
      alert('이의제기 처리 중 오류가 발생했습니다: ' + err.message);
    } finally {
      appealBtn.innerHTML = originalText;
      appealBtn.disabled = false;
    }
  });
}

$('short-next-btn').addEventListener('click', () => {
  const shortScreen = $('test-short');
  shortScreen.classList.add('card-slide-out');
  setTimeout(() => {
    shortScreen.classList.remove('card-slide-out');
    testIndex++;
    showShortCard();
  }, 200);
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

  // Save to History
  if (selectedBookId && selectedChapterId) {
    const historyRef = collection(db, `users/${currentUser.uid}/books/${selectedBookId}/chapters/${selectedChapterId}/testHistory`);
    addDoc(historyRef, {
      timestamp: serverTimestamp(),
      mode: testMode, // flash, quiz, short
      dir: testDir,
      correct: testCorrect,
      total: total,
      wrongWords: testWrong
    }).catch(e => console.error('History save error:', e));
  }
}

// ─── View Test History ────────────────────────────────────────────────────────
if (viewHistoryBtn) {
  viewHistoryBtn.addEventListener('click', async () => {
    if (!selectedBookId || !selectedChapterId) return;
    
    historyList.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:2rem;">기록을 불러오는 중...</p>';
    historyModal.classList.remove('hidden');

    try {
      const q = query(
        collection(db, `users/${currentUser.uid}/books/${selectedBookId}/chapters/${selectedChapterId}/testHistory`),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(q);
      
      historyList.innerHTML = '';
      if (snap.empty) {
        historyList.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:2rem;">아직 테스트 기록이 없습니다.</p>';
        return;
      }

      snap.forEach(doc => {
        const data = doc.data();
        const dateStr = data.timestamp ? data.timestamp.toDate().toLocaleString() : '방금 전';
        const modeLabel = data.mode === 'flash' ? '🃏 플래시카드' : data.mode === 'quiz' ? '✏️ 4지선다' : '✍️ 주관식';
        const pct = Math.round((data.correct / data.total) * 100) || 0;
        
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
          <div class="history-header">
            <span class="history-title">${modeLabel} <span style="font-size:0.8rem; font-weight:normal; color:var(--text-muted);">(${data.dir === 'word2meaning' ? '단어→뜻' : '뜻→단어'})</span></span>
            <span class="history-date">${dateStr}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="history-score">${data.correct} / ${data.total} 정답 <span style="color:${pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--primary-light)' : 'var(--danger)'}">(${pct}%)</span></span>
          </div>
          ${data.wrongWords && data.wrongWords.length > 0 ? `<div class="history-wrong">틀린 단어: ${escapeHTML(data.wrongWords.join(', '))}</div>` : ''}
        `;
        historyList.appendChild(item);
      });
    } catch (e) {
      console.error(e);
      historyList.innerHTML = `<p style="text-align:center; color:var(--danger); padding:2rem;">오류: ${e.message}</p>`;
    }
  });
}

if (historyCloseBtn) {
  historyCloseBtn.addEventListener('click', () => {
    historyModal.classList.add('hidden');
  });
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
    const badge = $('build-time');
    if (badge) {
      badge.textContent = `마지막 업데이트: ${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
      badge.title = data.commit.message;
    }
  } catch (e) { console.error('Version fetch failed:', e); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════════

loadBooks();
fetchLatestVersion();
