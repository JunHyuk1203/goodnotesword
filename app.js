// ═══════════════════════════════════════════════════════════════════════════════
// GoodNotes 단어장 앱 - app.js (Complete Rewrite v20)
// 구글 로그인 없음. default_user로 Firebase에 직접 저장.
// ═══════════════════════════════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore, collection, doc, setDoc, getDocs, addDoc,
  query, orderBy, serverTimestamp
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
const db = getFirestore(firebaseApp);

// ─── Global State ─────────────────────────────────────────────────────────────
const currentUser = { uid: "default_user" };
let selectedBookId = null;
let selectedChapterId = null;
let currentLoadedWords = [];
let generatedData = [];
let activeTab = 'text';
let uploadedImages = [];

// ─── API Key ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'gn_gemini_api_key';
function getApiKey() { return localStorage.getItem(STORAGE_KEY) || ''; }
function setApiKey(k) { localStorage.setItem(STORAGE_KEY, k); }

// ─── Utility ──────────────────────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }
function escapeHTML(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escapeCSV(s) {
  if (s == null) return '';
  const v = String(s).replace(/"/g, '""');
  return (v.includes(',') || v.includes('\n') || v.includes('"')) ? `"${v}"` : v;
}

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const apiModal = $('api-modal');
const apiModalInput = $('api-modal-input');
const apiModalSave = $('api-modal-save');
const apiKeyStatus = $('api-key-status');
const changeKeyBtn = $('change-key-btn');
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
const vocabInput = $('vocab-input');
const charCount = $('char-count');
const generateBtn = $('generate-btn');
const btnText = $('btn-text');
const progressSection = $('progress-section');
const progressBar = $('progress-bar');
const progressText = $('progress-text');
const progressSub = $('progress-sub');
const tabTextBtn = $('tab-text-btn');
const tabImageBtn = $('tab-image-btn');
const panelText = $('panel-text');
const panelImage = $('panel-image');
const imageDropzone = $('image-dropzone');
const imageFileInput = $('image-file-input');
const pickFileBtn = $('pick-file-btn');
const imagePreviews = $('image-previews');
const imageGrid = $('image-grid');
const previewCount = $('preview-count');
const clearImagesBtn = $('clear-images-btn');
const exportCsvBtn = $('export-csv-btn');

// ═══════════════════════════════════════════════════════════════════════════════
// API KEY MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function showApiModal() { apiModal.classList.remove('hidden'); apiModalInput.focus(); }
function hideApiModal() { apiModal.classList.add('hidden'); }

function updateKeyStatus() {
  const key = getApiKey();
  if (key) {
    apiKeyStatus.textContent = '✓ API 키 저장됨';
    apiKeyStatus.className = 'key-status ok';
  } else {
    apiKeyStatus.textContent = 'API 키 필요';
    apiKeyStatus.className = 'key-status';
  }
}

changeKeyBtn.addEventListener('click', () => { apiModalInput.value = ''; showApiModal(); });

apiModalSave.addEventListener('click', () => {
  const key = apiModalInput.value.trim();
  if (key.length < 10) { apiModalInput.style.borderColor = 'var(--danger)'; return; }
  setApiKey(key);
  hideApiModal();
  updateKeyStatus();
  updateGenerateButton();
});

apiModalInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') apiModalSave.click();
  apiModalInput.style.borderColor = '';
});

// ═══════════════════════════════════════════════════════════════════════════════
// LIBRARY: Books → Chapters → Words
// ═══════════════════════════════════════════════════════════════════════════════

crumbHome.addEventListener('click', () => loadBooks());
crumbBookName.addEventListener('click', () => {
  if (selectedBookId) loadChapters(selectedBookId, crumbBookName.textContent);
});

// ─── Load Books ───────────────────────────────────────────────────────────────
async function loadBooks() {
  selectedBookId = null;
  selectedChapterId = null;

  viewBooks.classList.remove('hidden');
  viewChapters.classList.add('hidden');
  viewWords.classList.add('hidden');
  addBookWrap.classList.remove('hidden');
  addChapterWrap.classList.add('hidden');
  crumbBook.classList.add('hidden');
  crumbChapter.classList.add('hidden');

  viewBooks.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-secondary);">로딩 중...</p>';
  try {
    const snap = await getDocs(collection(db, `users/${currentUser.uid}/books`));
    viewBooks.innerHTML = '';
    if (snap.empty) {
      viewBooks.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;">저장된 단어장이 없습니다. 위의 [+ 새 단어장 만들기] 버튼을 눌러 시작하세요!</p>';
      return;
    }
    snap.forEach(d => {
      const data = d.data();
      const div = document.createElement('div');
      div.className = 'lib-card';
      div.innerHTML = `<div class="lib-icon">📘</div><div class="lib-title">${escapeHTML(data.name)}</div>`;
      div.onclick = () => loadChapters(d.id, data.name);
      viewBooks.appendChild(div);
    });
  } catch (e) {
    console.error(e);
    viewBooks.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--danger);">오류: ${e.message}</p>`;
  }
}

// ─── Load Chapters ────────────────────────────────────────────────────────────
async function loadChapters(bookId, bookName) {
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

  viewChapters.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-secondary);">로딩 중...</p>';
  try {
    const snap = await getDocs(collection(db, `users/${currentUser.uid}/books/${bookId}/chapters`));
    viewChapters.innerHTML = '';
    if (snap.empty) {
      viewChapters.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;">단원이 없습니다. [+ 새 단원 추가] 버튼을 눌러주세요!</p>';
      return;
    }
    snap.forEach(d => {
      const data = d.data();
      const div = document.createElement('div');
      div.className = 'lib-card';
      div.innerHTML = `<div class="lib-icon">📂</div><div class="lib-title">${escapeHTML(data.name)}</div>`;
      div.onclick = () => loadWords(bookId, d.id, data.name);
      viewChapters.appendChild(div);
    });
  } catch (e) {
    console.error(e);
    viewChapters.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--danger);">오류: ${e.message}</p>`;
  }
}

// ─── Load Words ───────────────────────────────────────────────────────────────
async function loadWords(bookId, chapterId, chapterName) {
  selectedBookId = bookId;
  selectedChapterId = chapterId;

  viewBooks.classList.add('hidden');
  viewChapters.classList.add('hidden');
  viewWords.classList.remove('hidden');
  addBookWrap.classList.add('hidden');
  addChapterWrap.classList.add('hidden');
  crumbChapter.classList.remove('hidden');
  crumbChapterName.textContent = chapterName;

  wordsTbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">로딩 중...</td></tr>';
  currentLoadedWords = [];
  try {
    const q = query(collection(db, `users/${currentUser.uid}/books/${bookId}/chapters/${chapterId}/words`), orderBy('order'));
    const snap = await getDocs(q);
    wordsTbody.innerHTML = '';
    wordCountBadge.textContent = `${snap.size} 단어`;
    let i = 1;
    snap.forEach(d => {
      const data = d.data();
      currentLoadedWords.push(data);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i++}</td><td>${escapeHTML(data.front)}</td><td style="white-space:pre-wrap;">${escapeHTML(data.back)}</td>`;
      wordsTbody.appendChild(tr);
    });
    if (snap.empty) {
      wordsTbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">단어가 없습니다. [✨ 새 단어 추출하기] 버튼으로 추가하세요!</td></tr>';
    }
  } catch (e) {
    console.error(e);
    wordsTbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--danger);">오류: ${e.message}</td></tr>`;
  }
}

// ─── Create Book / Chapter ────────────────────────────────────────────────────
addBookBtn.addEventListener('click', async () => {
  const name = prompt('새 단어장의 이름을 입력하세요:');
  if (!name || !name.trim()) return;
  try {
    await addDoc(collection(db, `users/${currentUser.uid}/books`), {
      name: name.trim(), createdAt: serverTimestamp()
    });
    loadBooks();
  } catch (e) {
    alert('단어장 생성 실패: ' + e.message);
  }
});

addChapterBtn.addEventListener('click', async () => {
  const name = prompt('새 단원(챕터)의 이름을 입력하세요:');
  if (!name || !name.trim() || !selectedBookId) return;
  try {
    await addDoc(collection(db, `users/${currentUser.uid}/books/${selectedBookId}/chapters`), {
      name: name.trim(), createdAt: serverTimestamp()
    });
    loadChapters(selectedBookId, crumbBookName.textContent);
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

// ═══════════════════════════════════════════════════════════════════════════════
// EXTRACT SECTION TOGGLE
// ═══════════════════════════════════════════════════════════════════════════════

openExtractBtn.addEventListener('click', () => extractSection.classList.remove('hidden'));
closeExtractBtn.addEventListener('click', () => extractSection.classList.add('hidden'));

// ═══════════════════════════════════════════════════════════════════════════════
// TAB SWITCHING (Text / Image)
// ═══════════════════════════════════════════════════════════════════════════════

tabTextBtn.addEventListener('click', () => switchTab('text'));
tabImageBtn.addEventListener('click', () => switchTab('image'));

function switchTab(tab) {
  activeTab = tab;
  tabTextBtn.classList.toggle('tab-active', tab === 'text');
  tabImageBtn.classList.toggle('tab-active', tab === 'image');
  panelText.classList.toggle('hidden', tab !== 'text');
  panelImage.classList.toggle('hidden', tab !== 'image');
  updateGenerateButton();
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEXT INPUT
// ═══════════════════════════════════════════════════════════════════════════════

vocabInput.addEventListener('input', () => {
  charCount.textContent = `${vocabInput.value.length}자`;
  updateGenerateButton();
});

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE INPUT
// ═══════════════════════════════════════════════════════════════════════════════

imageDropzone.addEventListener('dragover', e => { e.preventDefault(); imageDropzone.classList.add('drag-over'); });
imageDropzone.addEventListener('dragleave', e => { if (!imageDropzone.contains(e.relatedTarget)) imageDropzone.classList.remove('drag-over'); });
imageDropzone.addEventListener('drop', e => {
  e.preventDefault(); imageDropzone.classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  if (files.length) addImageFiles(files);
});
pickFileBtn.addEventListener('click', e => { e.stopPropagation(); imageFileInput.click(); });
imageFileInput.addEventListener('change', () => {
  const files = Array.from(imageFileInput.files);
  if (files.length) addImageFiles(files);
  imageFileInput.value = '';
});
clearImagesBtn.addEventListener('click', () => { uploadedImages = []; renderImagePreviews(); updateGenerateButton(); });

function addImageFiles(files) {
  Promise.all(files.map(file => new Promise(resolve => {
    if (file.size > 50*1024*1024) { resolve(null); return; }
    const reader = new FileReader();
    reader.onload = e => resolve({ file, dataUrl: e.target.result, mimeType: file.type || 'image/jpeg', name: file.name });
    reader.readAsDataURL(file);
  }))).then(results => {
    uploadedImages = [...uploadedImages, ...results.filter(Boolean)];
    renderImagePreviews();
    updateGenerateButton();
  });
}

function renderImagePreviews() {
  imageGrid.innerHTML = '';
  if (!uploadedImages.length) { imagePreviews.classList.add('hidden'); return; }
  imagePreviews.classList.remove('hidden');
  previewCount.textContent = `${uploadedImages.length}장`;
  uploadedImages.forEach((img, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'img-thumb-wrap';
    const thumb = document.createElement('img');
    thumb.className = 'img-thumb'; thumb.src = img.dataUrl;
    const rm = document.createElement('button');
    rm.className = 'img-thumb-remove'; rm.textContent = '✕';
    rm.onclick = e => { e.stopPropagation(); uploadedImages.splice(idx, 1); renderImagePreviews(); updateGenerateButton(); };
    wrap.appendChild(thumb); wrap.appendChild(rm);
    imageGrid.appendChild(wrap);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATE BUTTON STATE
// ═══════════════════════════════════════════════════════════════════════════════

function updateGenerateButton() {
  const ready = (activeTab === 'text' && vocabInput.value.trim().length > 10) || (activeTab === 'image' && uploadedImages.length > 0);
  generateBtn.disabled = !ready;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GEMINI API
// ═══════════════════════════════════════════════════════════════════════════════

const BATCH_SIZE = 4;
const FALLBACK_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash'];

function buildPrompt(frontOpt, backOpt, lang, maxWords) {
  const langName = lang === 'ko' ? '한국어' : '영어';
  const includeExample = backOpt !== 'meaning_only';
  const includeSynAnt = backOpt === 'full';
  return `You are an expert vocabulary extraction assistant. Extract up to ${maxWords} English vocabulary words.
OUTPUT FORMAT: Return ONLY a valid JSON array. No markdown, no code fences, no extra text.
Each item: {"word":"","pos":"","pronunciation":"","meaning":"","synonyms":[],"antonyms":[],"examples":[],"related":""}
- pos: use ⓝ ⓥ ⓐ ad. prep. conj. pron.
- meaning: in ${langName}, include ALL meanings with POS symbols
- synonyms: ${includeSynAnt ? 'array with POS+meaning (max 5)' : 'empty array []'}
- antonyms: ${includeSynAnt ? 'array with POS+meaning (max 4)' : 'empty array []'}
- examples: ${includeExample ? 'array of sentences with translations (max 2)' : 'empty array []'}
- related: related forms with meanings, or empty string`;
}

async function executeWithFallback(apiKey, body) {
  let lastError;
  for (const model of FALLBACK_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const e = new Error(`API (${res.status}): ${err?.error?.message || res.statusText}`);
        e.status = res.status;
        if (res.status === 429 || res.status === 403) { lastError = e; continue; }
        throw e;
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('AI 응답이 비어있습니다.');
      return text;
    } catch (e) {
      lastError = e;
      if (e.status === 429 || e.status === 403) {
        progressSub.textContent = `${model} 한도 초과, 다음 모델로 시도 중...`;
        continue;
      }
      throw e;
    }
  }
  throw lastError || new Error('모든 모델 실패');
}

function parseResponse(text) {
  let c = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const s = c.indexOf('['), e = c.lastIndexOf(']');
  if (s === -1 || e === -1) throw new Error('JSON 데이터를 찾을 수 없습니다.');
  return JSON.parse(c.slice(s, e + 1));
}

function formatCard(item, frontOpt, backOpt) {
  let front = item.word || '';
  if (frontOpt === 'word_pos' && item.pos) front += `  ${item.pos}`;
  if (frontOpt === 'word_pron' && item.pronunciation) front += `  ${item.pronunciation}`;
  const parts = [];
  if (item.meaning) parts.push(`📌 뜻\n${item.pos ? item.pos + ' ' : ''}${item.meaning}`);
  if (backOpt === 'full') {
    if (item.synonyms?.length) parts.push(`✅ 유의어\n• ${item.synonyms.join('\n• ')}`);
    if (item.antonyms?.length) parts.push(`❌ 반의어\n• ${item.antonyms.join('\n• ')}`);
    if (item.related) parts.push(`🔗 관련어\n• ${item.related}`);
  }
  if (backOpt !== 'meaning_only' && item.examples?.length) parts.push(`📖 예문\n• ${item.examples.join('\n• ')}`);
  return { front: front.trim(), back: parts.join('\n\n').trim() };
}

function setProgress(pct, text, sub) {
  progressBar.style.width = `${pct}%`;
  if (text) progressText.textContent = text;
  if (sub !== undefined) progressSub.textContent = sub;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATE HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

generateBtn.addEventListener('click', handleGenerate);

async function handleGenerate() {
  hideError();
  const apiKey = getApiKey();
  if (!apiKey) { showApiModal(); return; }

  progressSection.classList.remove('hidden');
  generateBtn.disabled = true;
  btnText.textContent = '생성 중...';

  const frontOpt = $('card-front-sel').value;
  const backOpt = $('card-back-sel').value;
  const maxWords = parseInt($('max-words-sel').value, 10);
  const prompt = buildPrompt(frontOpt, backOpt, 'ko', maxWords);

  try {
    let allParsed = [];

    if (activeTab === 'image') {
      const batches = [];
      for (let i = 0; i < uploadedImages.length; i += BATCH_SIZE) batches.push(uploadedImages.slice(i, i + BATCH_SIZE));
      for (let b = 0; b < batches.length; b++) {
        setProgress(5 + Math.round((b / batches.length) * 80), `배치 ${b+1}/${batches.length} 처리 중...`, '');
        const parts = batches[b].map(img => ({ inline_data: { mime_type: img.mimeType, data: img.dataUrl.split(',')[1] } }));
        parts.push({ text: prompt });
        const responseText = await executeWithFallback(apiKey, { contents: [{ parts }], generationConfig: { temperature: 0.3, maxOutputTokens: 8192 } });
        allParsed = [...allParsed, ...parseResponse(responseText)];
        if (b < batches.length - 1) await new Promise(r => setTimeout(r, 600));
      }
    } else {
      setProgress(15, 'AI가 텍스트를 분석 중...', '');
      const body = { contents: [{ parts: [{ text: prompt + `\n\nTEXT:\n"""\n${vocabInput.value.trim()}\n"""` }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 8192 } };
      const responseText = await executeWithFallback(apiKey, body);
      allParsed = parseResponse(responseText);
    }

    if (!allParsed.length) throw new Error('AI 응답에서 단어를 추출하지 못했습니다.');

    // Deduplicate
    const seen = new Set();
    const deduped = allParsed.filter(item => {
      const key = (item.word || '').toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    generatedData = deduped.slice(0, maxWords).map(item => formatCard(item, frontOpt, backOpt));

    // Auto-save to current chapter
    await autoSaveToLibrary(generatedData);

  } catch (err) {
    console.error(err);
    showError(err.message?.includes('API') ? 'API 오류' : '처리 오류', err.message);
  } finally {
    progressSection.classList.add('hidden');
    generateBtn.disabled = false;
    btnText.textContent = '생성하고 즉시 저장하기';
    updateGenerateButton();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO SAVE TO LIBRARY
// ═══════════════════════════════════════════════════════════════════════════════

async function autoSaveToLibrary(data) {
  if (!selectedBookId || !selectedChapterId) {
    alert('저장할 단원을 찾지 못했습니다. 단원(챕터) 안에서 추출해주세요.');
    return;
  }
  setProgress(90, '단어장에 저장 중...', '');
  try {
    for (let i = 0; i < data.length; i++) {
      const wordRef = doc(collection(db, `users/${currentUser.uid}/books/${selectedBookId}/chapters/${selectedChapterId}/words`));
      await setDoc(wordRef, { front: data[i].front, back: data[i].back, order: i });
    }
    setProgress(100, '저장 완료!', `${data.length}개 단어 저장됨`);
    setTimeout(() => {
      vocabInput.value = '';
      charCount.textContent = '0자';
      extractSection.classList.add('hidden');
      progressSection.classList.add('hidden');
      loadWords(selectedBookId, selectedChapterId, crumbChapterName.textContent);
    }, 800);
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

updateKeyStatus();
if (!getApiKey()) showApiModal();
updateGenerateButton();
loadBooks();
fetchLatestVersion();
