// ═══════════════════════════════════════════════════════════════════════════════
// GoodNotes 단어장 앱 - app.js (Complete Rewrite v20)
// 구글 로그인 없음. default_user로 Firebase에 직접 저장.
// ═══════════════════════════════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore, collection, doc, setDoc, getDocs, addDoc,
  query, orderBy, serverTimestamp, deleteDoc, updateDoc, onSnapshot, initializeFirestore, persistentLocalCache
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
let activeTab = 'text';
let uploadedImages = [];

// ─── Utility ──────────────────────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }
function escapeHTML(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escapeCSV(s) {
  if (s == null) return '';
  const v = String(s).replace(/"/g, '""');
  return (v.includes(',') || v.includes('\n') || v.includes('"')) ? `"${v}"` : v;
}

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
// Custom modal helpers (replace browser prompt/confirm which get blocked)
function showPrompt(message, defaultVal = '') {
  return new Promise(resolve => {
    const modal = document.getElementById('custom-prompt-modal');
    const msgEl = document.getElementById('custom-prompt-message');
    const input = document.getElementById('custom-prompt-input');
    const okBtn = document.getElementById('custom-prompt-ok');
    const cancelBtn = document.getElementById('custom-prompt-cancel');
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

function showConfirm(message, okLabel = '삭제') {
  return new Promise(resolve => {
    const modal = document.getElementById('custom-confirm-modal');
    const msgEl = document.getElementById('custom-confirm-message');
    const okBtn = document.getElementById('custom-confirm-ok');
    const cancelBtn = document.getElementById('custom-confirm-cancel');
    msgEl.textContent = message;
    okBtn.textContent = okLabel;
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

const errorSection = $('error-section');
const errorTitle = $('error-title');
const errorMsg = $('error-msg');

// Library
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

// Extract
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
    wordsTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">로딩 중...</td></tr>';
    
    const q = query(collection(db, `users/${currentUser.uid}/books/${bookId}/chapters/${chapterId}/words`), orderBy('order'));
    unsubWords = onSnapshot(q, (snap) => {
      currentLoadedWords = [];
      if (selectAllWords) selectAllWords.checked = false;
      if (deleteSelectedBtn) deleteSelectedBtn.classList.add('hidden');
      
      wordsTbody.innerHTML = '';
      wordCountBadge.textContent = `${snap.size} 단어`;
      let i = 1;
      snap.forEach(d => {
        const data = d.data();
        currentLoadedWords.push(data);
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><input type="checkbox" class="word-chk" data-path="${d.ref.path}" /></td><td>${i++}</td><td>${escapeHTML(data.front)}</td><td style="white-space:pre-wrap;">${escapeHTML(data.back)}</td>
          <td>
            <div style="display:flex;gap:4px;">
              <button class="word-edit-btn" style="padding:4px 8px;font-size:0.8rem;cursor:pointer;border-radius:4px;border:1px solid var(--border);background:var(--bg-card);color:var(--text);">수정</button>
              <button class="word-delete-btn" style="padding:4px 8px;font-size:0.8rem;cursor:pointer;border-radius:4px;border:1px solid #ff4d4f;background:#fff1f0;color:#ff4d4f;">삭제</button>
            </div>
          </td>`;
        tr.querySelector('.word-edit-btn').onclick = async () => {
          const newFront = await showPrompt('앞면(질문):', data.front);
          if (newFront === null) return;
          const newBack = await showPrompt('뒷면(정답):', data.back);
          if (newBack === null) return;
          try { await updateDoc(d.ref, { front: newFront, back: newBack }); }
          catch(err) { alert('수정 실패: ' + err.message); }
        };
        tr.querySelector('.word-delete-btn').onclick = async () => {
          if (await showConfirm('이 단어를 삭제하시겠습니까?')) {
            try { await deleteDoc(d.ref); }
            catch(err) { alert('삭제 실패: ' + err.message); }
          }
        };
        wordsTbody.appendChild(tr);
        tr.querySelector('.word-chk').addEventListener('change', updateDeleteBtn);
      });
      if (snap.empty) {
        wordsTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">단어가 없습니다. [✨ 새 단어 추출하기] 버튼으로 추가하세요!</td></tr>';
      }
    }, (e) => {
      console.error(e);
      wordsTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--danger);">오류: ${e.message}</td></tr>`;
    });
  }
}

// ─── Create Book / Chapter ────────────────────────────────────────────────────
addBookBtn.addEventListener('click', async () => {
  const name = await showPrompt('새 단어장의 이름을 입력하세요:');
  if (!name || !name.trim()) return;
  try {
    await addDoc(collection(db, `users/${currentUser.uid}/books`), {
      name: name.trim(), createdAt: serverTimestamp()
    });
    /* auto updated by onSnapshot */
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
    /* auto updated by onSnapshot */
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
    /* auto updated by onSnapshot */
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
  exampleStr += `\n  }
]`;

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
Each object MUST have the following keys (and ONLY these keys if requested):
${formatStr}

Example:
${exampleStr}
`;

  promptOutput.value = prompt;
}

if (cardFrontSel) cardFrontSel.addEventListener('change', updatePrompt);
if (cardBackSel) cardBackSel.addEventListener('change', updatePrompt);
// Init prompt on load
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
  return { front: front.trim(), back: parts.join('\n\n').trim() };
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
      
      // Clear input after success
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

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO SAVE TO LIBRARY
// ═══════════════════════════════════════════════════════════════════════════════

async function autoSaveToLibrary(data) {
  if (!selectedBookId || !selectedChapterId) {
    alert('저장할 단원을 찾지 못했습니다. 단원(챕터) 안에서 추출해주세요.');
    return;
  }
  try {
    let maxOrder = currentLoadedWords.reduce((max, w) => Math.max(max, w.order || 0), -1);
    for (let i = 0; i < data.length; i++) {
      const wordRef = doc(collection(db, `users/${currentUser.uid}/books/${selectedBookId}/chapters/${selectedChapterId}/words`));
      await setDoc(wordRef, { front: data[i].front, back: data[i].back, order: maxOrder + 1 + i });
    }
    alert(`${data.length}개 단어가 성공적으로 저장되었습니다!`);
    if (typeof extractSection !== 'undefined' && extractSection) {
      extractSection.classList.add('hidden');
    }
    /* auto updated by onSnapshot */
  } catch (e) {
    console.error(e);
    alert('저장 실패: ' + e.message);
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
