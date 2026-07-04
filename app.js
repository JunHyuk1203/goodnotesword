
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, // onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
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

let currentUser = { uid: "default_user" };
setTimeout(loadBooks, 500);
let selectedBookId = null;
let selectedChapterId = null;


/**
 * GoodNotes Vocabulary Study Set Generator
 * app.js – v3 (fix: progressSection ref, improved 429 handling)
 *
 * Modes:
 *  - Text mode: user pastes vocab text → sends as text prompt to Gemini
 *  - Image mode: user uploads image(s) → sends as inline_data to Gemini Vision
 */

'use strict';

// ─── API Key (stored in localStorage) ───────────────────────────────────
const STORAGE_KEY = 'gn_gemini_api_key';
function getApiKey() { return localStorage.getItem(STORAGE_KEY) || ''; }
function setApiKey(k) { localStorage.setItem(STORAGE_KEY, k); }

// ─── DOM refs ────────────────────────────────────────────────────────────────
// API key modal
const apiModal          = document.getElementById('api-modal');
const apiModalInput     = document.getElementById('api-modal-input');
const apiModalSave      = document.getElementById('api-modal-save');
const apiModalToggle    = document.getElementById('api-modal-toggle');
const apiKeyStatus      = document.getElementById('api-key-status');
const changeKeyBtn      = document.getElementById('change-key-btn');
const vocabInput        = document.getElementById('vocab-input');
const charCount         = document.getElementById('char-count');
const loadSampleBtn     = document.getElementById('load-sample-btn');
const clearBtn          = document.getElementById('clear-btn');
const cardFrontSel      = document.getElementById('card-front-sel');
const cardBackSel       = document.getElementById('card-back-sel');
const langSel           = document.getElementById('lang-sel');
const maxWordsSel       = document.getElementById('max-words-sel');
const generateBtn       = document.getElementById('generate-btn');
const btnText           = document.getElementById('btn-text');
const generateHint      = document.getElementById('generate-hint');
const progressSection   = document.getElementById('progress-section');
const progressBar       = document.getElementById('progress-bar');
const progressText      = document.getElementById('progress-text');
const progressSub       = document.getElementById('progress-sub');
const resultSection     = document.getElementById('result-section');
const resultSummary     = document.getElementById('result-summary');
const previewTbody      = document.getElementById('preview-tbody');
const togglePreviewBtn  = document.getElementById('toggle-preview-btn');
const previewContainer  = document.getElementById('preview-container');
const downloadCsvBtn    = document.getElementById('download-csv-btn');
const copyCsvBtn        = document.getElementById('copy-csv-btn');
const errorSection      = document.getElementById('error-section');
const errorTitle        = document.getElementById('error-title');
const errorMsg          = document.getElementById('error-msg');

// Tab elements
const tabTextBtn        = document.getElementById('tab-text-btn');
const tabImageBtn       = document.getElementById('tab-image-btn');
const panelText         = document.getElementById('panel-text');
const panelImage        = document.getElementById('panel-image');

// Image upload elements
const imageDropzone     = document.getElementById('image-dropzone');
const imageFileInput    = document.getElementById('image-file-input');
const pickFileBtn       = document.getElementById('pick-file-btn');
const pasteImageBtn     = document.getElementById('paste-image-btn');
const imagePreviews     = document.getElementById('image-previews');
const imageGrid         = document.getElementById('image-grid');
const previewCount      = document.getElementById('preview-count');
const addMoreBtn        = document.getElementById('add-more-btn');
const clearImagesBtn    = document.getElementById('clear-images-btn');

// ─── State ───────────────────────────────────────────────────────────────────
let generatedData = [];
let activeTab = 'text'; // 'text' | 'image'
let uploadedImages = []; // Array of { file, dataUrl, mimeType }

// ─── Sample text ─────────────────────────────────────────────────────────────
const SAMPLE_TEXT = `accomplish [əkʌmplɪʃ] v. 성취하다, 달성하다
Syn: achieve, attain, fulfill, complete, carry out
Ant: fail, abandon, neglect, give up
Ex: She accomplished her goal of running a marathon in under four hours.
Ex: The team accomplished the project ahead of schedule.

abundant [əbʌndənt] adj. 풍부한, 넉넉한
Syn: plentiful, ample, copious, bountiful, profuse
Ant: scarce, rare, insufficient, lacking, meager
Ex: The region has abundant natural resources, including oil and minerals.
Related: abundance (n.), abundantly (adv.)

ambiguous [æmbɪɡjuəs] adj. 모호한, 불분명한
Syn: unclear, vague, equivocal, obscure, uncertain
Ant: clear, definite, explicit, unambiguous, certain
Ex: The contract contained several ambiguous clauses that led to disputes.
Related: ambiguity (n.), ambiguously (adv.)

scrutinize [skruːtɪnaɪz] v. 면밀히 조사하다, 자세히 살피다
Syn: examine, inspect, analyze, probe, investigate
Ant: ignore, overlook, neglect, skim
Ex: The auditors scrutinized every financial record in the company.

resilient [rɪzɪliənt] adj. 회복력이 있는, 탄력 있는
Syn: tough, strong, adaptable, flexible, buoyant
Ant: weak, fragile, vulnerable, brittle
Ex: Children are often more resilient than adults when it comes to change.
Related: resilience (n.), resiliently (adv.)`;

// ─── Tab switching ────────────────────────────────────────────────────────────
tabTextBtn.addEventListener('click', () => switchTab('text'));
tabImageBtn.addEventListener('click', () => switchTab('image'));

function switchTab(tab) {
  activeTab = tab;
  tabTextBtn.classList.toggle('tab-active', tab === 'text');
  tabImageBtn.classList.toggle('tab-active', tab === 'image');
  tabTextBtn.setAttribute('aria-selected', String(tab === 'text'));
  tabImageBtn.setAttribute('aria-selected', String(tab === 'image'));
  panelText.classList.toggle('hidden', tab !== 'text');
  panelImage.classList.toggle('hidden', tab !== 'image');
  updateGenerateButton();
}

// ─── Text mode events ─────────────────────────────────────────────────────────
vocabInput.addEventListener('input', () => {
  charCount.textContent = `${vocabInput.value.length.toLocaleString()}자`;
  onInputChange();
});
loadSampleBtn.addEventListener('click', () => {
  vocabInput.value = SAMPLE_TEXT;
  charCount.textContent = `${SAMPLE_TEXT.length.toLocaleString()}자`;
  vocabInput.scrollTop = 0;
  onInputChange();
});
clearBtn.addEventListener('click', () => {
  vocabInput.value = '';
  charCount.textContent = '0자';
  onInputChange();
});

// ─── Image mode events ────────────────────────────────────────────────────────

// Drag and drop on dropzone
imageDropzone.addEventListener('dragover', e => {
  e.preventDefault();
  imageDropzone.classList.add('drag-over');
});
imageDropzone.addEventListener('dragleave', e => {
  if (!imageDropzone.contains(e.relatedTarget)) {
    imageDropzone.classList.remove('drag-over');
  }
});
imageDropzone.addEventListener('drop', e => {
  e.preventDefault();
  imageDropzone.classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  if (files.length) addImageFiles(files);
});

// Keyboard accessibility for drop zone
imageDropzone.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); imageFileInput.click(); }
});

// File picker
pickFileBtn.addEventListener('click', e => { e.stopPropagation(); imageFileInput.click(); });
imageFileInput.addEventListener('change', () => {
  const files = Array.from(imageFileInput.files);
  if (files.length) addImageFiles(files);
  imageFileInput.value = ''; // reset so same file can be picked again
});
addMoreBtn.addEventListener('click', () => imageFileInput.click());

// Paste image from clipboard
pasteImageBtn.addEventListener('click', async () => {
  try {
    const items = await navigator.clipboard.read();
    let found = false;
    for (const item of items) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type);
          const file = new File([blob], `clipboard.${type.split('/')[1]}`, { type });
          addImageFiles([file]);
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (!found) showError('클립보드 오류', '클립보드에 이미지가 없습니다. 이미지를 복사한 뒤 다시 시도해주세요.');
  } catch (e) {
    showError('클립보드 접근 실패', '브라우저 권한이 필요합니다. 파일 선택을 이용해주세요.');
  }
});

// Global paste event (Ctrl+V anywhere on page)
document.addEventListener('paste', e => {
  if (activeTab !== 'image') return;
  const items = Array.from(e.clipboardData.items).filter(i => i.type.startsWith('image/'));
  if (!items.length) return;
  const files = items.map(i => i.getAsFile());
  addImageFiles(files.filter(Boolean));
});

// Clear all images
clearImagesBtn.addEventListener('click', () => {
  uploadedImages = [];
  renderImagePreviews();
  onInputChange();
});

// ─── Image file handling ──────────────────────────────────────────────────────

function addImageFiles(files) {
  const promises = files.map(file => {
    return new Promise(resolve => {
      // 50MB per image
      if (file.size > 50 * 1024 * 1024) {
        showError('파일 크기 초과', `"${file.name}" 파일이 50MB를 초과합니다.`);
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        resolve({
          file,
          dataUrl: e.target.result,
          mimeType: file.type || 'image/jpeg',
          name: file.name || 'image'
        });
      };
      reader.readAsDataURL(file);
    });
  });

  Promise.all(promises).then(results => {
    const valid = results.filter(Boolean);
    uploadedImages = [...uploadedImages, ...valid];
    renderImagePreviews();
    onInputChange();
  });
}

function renderImagePreviews() {
  imageGrid.innerHTML = '';
  if (uploadedImages.length === 0) {
    imagePreviews.classList.add('hidden');
    return;
  }
  imagePreviews.classList.remove('hidden');
  previewCount.textContent = `${uploadedImages.length}장 선택됨 (자동으로 배치 처리)`;

  uploadedImages.forEach((img, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'img-thumb-wrap';

    const thumb = document.createElement('img');
    thumb.className = 'img-thumb';
    thumb.src = img.dataUrl;
    thumb.alt = img.name;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'img-thumb-remove';
    removeBtn.textContent = '✕';
    removeBtn.title = '이미지 제거';
    removeBtn.addEventListener('click', e => {
      e.stopPropagation();
      uploadedImages.splice(idx, 1);
      renderImagePreviews();
      onInputChange();
    });

    const label = document.createElement('div');
    label.className = 'img-thumb-label';
    label.textContent = img.name;

    wrap.appendChild(thumb);
    wrap.appendChild(removeBtn);
    wrap.appendChild(label);
    imageGrid.appendChild(wrap);
  });
}

// ─── Generate button state ────────────────────────────────────────────────────

function onInputChange() {
  updateGenerateButton();
}

function updateGenerateButton() {
  const ready =
    (activeTab === 'text' && vocabInput.value.trim().length > 10) ||
    (activeTab === 'image' && uploadedImages.length > 0);
  generateBtn.disabled = !ready;
  generateHint.textContent = ready
    ? `AI가 이미지/텍스트에서 단어와 뜻을 자동 추출합니다${
        activeTab === 'image' && uploadedImages.length > 0
          ? ` (${uploadedImages.length}장 → ${Math.ceil(uploadedImages.length / BATCH_SIZE)}배치)`
          : ''
      }`
    : activeTab === 'image'
      ? '이미지를 업로드하면 버튼이 활성화됩니다 (여러 장 가능)'
      : '텍스트를 입력하면 버튼이 활성화됩니다';
}

// ─── Batch size (images per API call) ────────────────────────────────────────
const BATCH_SIZE = 4; // Gemini handles 4 images per request comfortably

// ─── Generate ─────────────────────────────────────────────────────────────────
generateBtn.addEventListener('click', handleGenerate);

async function handleGenerate() {
  hideError();
  resultSection.classList.add('hidden');
  progressSection.classList.remove('hidden');
  generateBtn.disabled = true;
  btnText.textContent = '생성 중...';

  const apiKey = getApiKey();
  if (!apiKey) { showApiModal(); return; }

  const frontOpt = cardFrontSel.value;
  const backOpt  = cardBackSel.value;
  const lang     = langSel.value;
  const maxWords = parseInt(maxWordsSel.value, 10);

  try {
    const prompt = buildPrompt(frontOpt, backOpt, lang, maxWords);

    let allParsed = [];

    if (activeTab === 'image') {
      // Split images into batches
      const batches = [];
      for (let i = 0; i < uploadedImages.length; i += BATCH_SIZE) {
        batches.push(uploadedImages.slice(i, i + BATCH_SIZE));
      }
      const totalBatches = batches.length;

      for (let b = 0; b < batches.length; b++) {
        const batchNum = b + 1;
        const pctStart = 5 + Math.round((b / totalBatches) * 80);
        const pctEnd   = 5 + Math.round(((b + 1) / totalBatches) * 80);

        setProgress(
          pctStart,
          `배치 ${batchNum}/${totalBatches} 처리 중...`,
          `이미지 ${batches[b].map((_, i) => b * BATCH_SIZE + i + 1).join(', ')}장 분석 중`
        );

        const responseText = await callGeminiVision(apiKey, prompt, batches[b]);
        const batchParsed = parseResponse(responseText);
        allParsed = [...allParsed, ...batchParsed];

        setProgress(pctEnd, `배치 ${batchNum}/${totalBatches} 완료`, `누적 ${allParsed.length}개 단어`);

        // Small delay between batches to avoid rate limiting
        if (b < batches.length - 1) await new Promise(r => setTimeout(r, 600));
      }
    } else {
      setProgress(5, 'AI에게 텍스트를 전송하는 중...', '');
      setProgress(15, 'AI가 단어를 분석하고 있습니다...', '예문, 유의어, 반의어를 추출 중');
      const responseText = await callGeminiText(apiKey, prompt, vocabInput.value.trim());
      allParsed = parseResponse(responseText);
    }

    setProgress(90, '데이터를 정리하고 있습니다...', '');

    if (!allParsed || allParsed.length === 0) {
      throw new Error('AI 응답에서 단어를 추출하지 못했습니다. 이미지가 선명한지 확인하거나 다시 시도해보세요.');
    }

    // Deduplicate by word
    const seen = new Set();
    const deduped = allParsed.filter(item => {
      const key = (item.word || '').toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    generatedData = deduped.slice(0, maxWords).map(item => formatCard(item, frontOpt, backOpt));

    setProgress(100, '완료!', `총 ${generatedData.length}개 단어 추출`);
    await new Promise(r => setTimeout(r, 400));

    
    // renderResults(generatedData, deduped.length);
    await autoSaveToLibrary(generatedData);


  } catch (err) {
    console.error(err);
    const isApiErr = err.message?.includes('API') || err.message?.includes('401') || err.message?.includes('403');
    showError(
      isApiErr ? 'API 오류' : '처리 오류',
      err.message || '알 수 없는 오류가 발생했습니다.'
    );
  } finally {
    progressSection.classList.add('hidden');
    generateBtn.disabled = false;
    btnText.textContent = 'AI로 스터디 세트 생성';
    updateGenerateButton();
    setProgress(0);
  }
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(frontOpt, backOpt, lang, maxWords) {
  const langName       = lang === 'ko' ? '한국어' : '영어';
  const includeExample = backOpt === 'full' || backOpt === 'meaning_example';
  const includeSynAnt  = backOpt === 'full';

  return `You are an expert vocabulary extraction assistant. Analyze the provided content (which may be text or an image of a vocabulary book) and extract English words with their information.

TASK: Extract up to ${maxWords} English vocabulary words.

OUTPUT FORMAT: Return ONLY a valid JSON array. No explanation, no markdown code fences, no extra text. Just the raw JSON array.

Each item in the array must have these fields:
- "word": the English word (string)
- "pos": part of speech symbol (strictly use: ⓝ for noun, ⓥ for verb, ⓐ for adjective, ad. for adverb, prep. for preposition, conj. for conjunction, pron. for pronoun) (string)
- "pronunciation": IPA or phonetic pronunciation if available, otherwise empty string
- "meaning": the detailed definition in ${langName}. If a word has multiple meanings, list ALL of them clearly separated by commas. If it has multiple parts of speech, include them clearly (e.g. "ⓥ 보이다, 보여 주다 ⓝ 전시품, 전시회") (string)
- "synonyms": array of synonym strings. Each MUST include the synonym, its POS symbol, and ALL its meanings in ${langName} (e.g., "achieve ⓥ 달성하다, 성취하다") (max 5)${includeSynAnt ? '' : ' — return empty array []'}
- "antonyms": array of antonym strings. Each MUST include the antonym, its POS symbol, and ALL its meanings in ${langName} (e.g., "fail ⓥ 실패하다") (max 4)${includeSynAnt ? '' : ' — return empty array []'}
- "examples": array of example sentences WITH THEIR TRANSLATIONS in ${langName} (e.g., "I love you. (나는 너를 사랑한다.)") (max 2)${includeExample ? '' : ' — return empty array []'}
- "related": related word forms WITH THEIR MEANINGS if any (string, e.g., "abundance ⓝ 풍부함"), or empty string

Rules:
- meaning must be in ${langName}
- If any field is not available in the source, infer it from your knowledge
- Make meanings concise and natural
- Ensure synonyms/antonyms are accurate
- If this is an image, carefully read all visible text including small print`;
}

// ─── Gemini API: Multi-Model Fallback ─────────────────────────────────────────

const FALLBACK_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3-flash',
  'gemini-2.5-flash'
];

async function callGeminiText(apiKey, prompt, text) {
  const body = {
    contents: [{
      parts: [
        { text: prompt + `\n\nTEXT TO ANALYZE:\n"""\n${text}\n"""` }
      ]
    }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 8192 }
  };
  return executeWithFallback(apiKey, body);
}

// ─── Gemini API: Vision (Image) ───────────────────────────────────────────────

async function callGeminiVision(apiKey, prompt, images) {
  const parts = images.map(img => ({
    inline_data: { mime_type: img.mimeType, data: img.dataUrl.split(',')[1] }
  }));
  parts.push({ text: prompt });

  const body = {
    contents: [{ parts }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 8192 }
  };
  return executeWithFallback(apiKey, body);
}

async function executeWithFallback(apiKey, body) {
  let lastError;
  for (let i = 0; i < FALLBACK_MODELS.length; i++) {
    const model = FALLBACK_MODELS[i];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      if (i > 0) {
        console.log(`[Fallback] Retrying with ${model}...`);
        const sub = document.getElementById('progress-sub');
        if (sub) sub.textContent = `이전 모델 한도 초과. ${model} 모델로 우회 접속 중...`;
      }
      return await fetchGemini(url, body);
    } catch (err) {
      lastError = err;
      if (err.status === 429 || err.status === 403 || (err.message && err.message.includes('할당량'))) {
        continue;
      }
      throw err; 
    }
  }

  if (lastError && (lastError.status === 429 || lastError.status === 403)) {
    throw new Error(`모든 예비 모델(5개)의 API 한도가 바닥났습니다 (429/403).
• 우측 상단 [API 키] 버튼을 눌러 새 키로 교체하세요.
• 또는 https://aistudio.google.com/app/apikey 에서 발급받으세요.`);
  }
  throw lastError;
}

async function fetchGemini(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errObj = await response.json().catch(() => ({}));
    const msg = errObj?.error?.message || response.statusText;
    const error = new Error(`API 오류 (${response.status}): ${msg}`);
    error.status = response.status;
    
    if (response.status === 401 || (response.status === 403 && !msg.includes('quota'))) {
      error.message = `API 키 인증 실패 (${response.status}): API 키를 확인해주세요.`;
    }
    throw error;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('AI 응답이 비어있습니다. 다시 시도해보세요.');
  return text;
}
// ─── Parsing ──────────────────────────────────────────────────────────────────

function parseResponse(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const startIdx = cleaned.indexOf('[');
  const endIdx   = cleaned.lastIndexOf(']');
  if (startIdx === -1 || endIdx === -1) {
    throw new Error('AI 응답에서 JSON 데이터를 찾을 수 없습니다. 다시 시도해주세요.');
  }
  cleaned = cleaned.slice(startIdx, endIdx + 1);
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`JSON 파싱 실패: ${e.message}. 다시 생성을 눌러주세요.`);
  }
}

// ─── Card formatting ──────────────────────────────────────────────────────────

function formatCard(item, frontOpt, backOpt) {
  let front = item.word || '';
  if (frontOpt === 'word_pos'  && item.pos)           front += `  ${item.pos}`;
  if (frontOpt === 'word_pron' && item.pronunciation) front += `  ${item.pronunciation}`;

  const backParts = [];
  if (item.meaning) {
    const posStr = item.pos ? `${item.pos} ` : '';
    backParts.push(`📌 뜻\n${posStr}${item.meaning}`);
  }
  if (backOpt === 'full') {
    if (item.synonyms?.length) backParts.push(`✅ 유의어\n• ${item.synonyms.join('\n• ')}`);
    if (item.antonyms?.length) backParts.push(`❌ 반의어\n• ${item.antonyms.join('\n• ')}`);
    if (item.related)          backParts.push(`🔗 관련어\n• ${item.related}`);
  }
  if (backOpt === 'full' || backOpt === 'meaning_example') {
    if (item.examples?.length) backParts.push(`📖 예문\n• ${item.examples.join('\n•\n')}`);
  }

  return { front: front.trim(), back: backParts.join('\n\n').trim() };
}

// ─── Render results ───────────────────────────────────────────────────────────

function renderResults(data, totalExtracted) {
  previewTbody.innerHTML = '';
  data.forEach((row, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${escapeHTML(row.front)}</td>
      <td>${escapeHTML(row.back).replace(/\n/g, '<br/>')}</td>
    `;
    previewTbody.appendChild(tr);
  });

  resultSummary.textContent = `총 ${data.length}개의 단어가 추출되었습니다.${
    totalExtracted > data.length ? ` (원본 ${totalExtracted}개 중 최대 ${data.length}개 표시)` : ''
  } 아래에서 미리보기 후 CSV를 다운로드하세요.`;

  resultSection.classList.remove('hidden');
  previewContainer.classList.remove('collapsed');
  togglePreviewBtn.textContent = '접기';
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Preview toggle ───────────────────────────────────────────────────────────
togglePreviewBtn.addEventListener('click', () => {
  const collapsed = previewContainer.classList.toggle('collapsed');
  togglePreviewBtn.textContent = collapsed ? '펼치기' : '접기';
});

// ─── Download / Copy ─────────────────────────────────────────────────────────
downloadCsvBtn.addEventListener('click', downloadCSV);
copyCsvBtn.addEventListener('click', copyCSV);

function escapeCSV(str) {
  if (str == null) return '';
  const s = String(str).replace(/"/g, '""');
  if (s.includes(',') || s.includes('\n') || s.includes('"')) return `"${s}"`;
  return s;
}

function buildCSV(data) {
  return data.map(row => `${escapeCSV(row.front)},${escapeCSV(row.back)}`).join('\n');
}

function downloadCSV() {
  if (!generatedData.length) return;
  const csv = buildCSV(generatedData);
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `goodnotes_study_set_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function copyCSV() {
  if (!generatedData.length) return;
  try {
    await navigator.clipboard.writeText(buildCSV(generatedData));
    const original = copyCsvBtn.innerHTML;
    copyCsvBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      복사 완료!`;
    setTimeout(() => { copyCsvBtn.innerHTML = original; }, 2000);
  } catch (e) {
    showError('복사 실패', '클립보드 접근 권한이 없습니다. CSV 다운로드를 이용해주세요.');
  }
}

// ─── Error helpers ────────────────────────────────────────────────────────────

function showError(title, msg) {
  errorTitle.textContent = title;
  errorMsg.textContent = msg;
  errorSection.classList.remove('hidden');
  errorSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function hideError() { errorSection.classList.add('hidden'); }

function setProgress(pct, text, sub) {
  progressBar.style.width = `${pct}%`;
  if (text) progressText.textContent = text;
  if (sub !== undefined) progressSub.textContent = sub;
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── API Key Modal ────────────────────────────────────────────────────────────────

function showApiModal() {
  apiModal.classList.remove('hidden');
  apiModalInput.focus();
}
function hideApiModal() {
  apiModal.classList.add('hidden');
}

if (apiModalToggle) {
  apiModalToggle.addEventListener('click', () => {
    const isPass = apiModalInput.type === 'password';
    apiModalInput.type = isPass ? 'text' : 'password';
  });
}

if (apiModalSave) {
  apiModalSave.addEventListener('click', () => {
    const key = apiModalInput.value.trim();
    if (key.length < 10) {
      apiModalInput.style.borderColor = 'var(--danger)';
      return;
    }
    setApiKey(key);
    hideApiModal();
    updateKeyStatus();
    onInputChange();
  });
  apiModalInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') apiModalSave.click();
    apiModalInput.style.borderColor = '';
  });
}

if (changeKeyBtn) {
  changeKeyBtn.addEventListener('click', () => {
    apiModalInput.value = '';
    showApiModal();
  });
}

function updateKeyStatus() {
  if (!apiKeyStatus) return;
  const key = getApiKey();
  if (key) {
    apiKeyStatus.textContent = '✓ API 키 저장됨';
    apiKeyStatus.className = 'key-status ok';
  } else {
    apiKeyStatus.textContent = 'API 키 필요';
    apiKeyStatus.className = 'key-status';
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onInputChange();
updateKeyStatus();
if (!getApiKey()) showApiModal();


// ─── Auto Version Badge ───────────────────────────────────────────────────────
async function fetchLatestVersion() {
  try {
    const res = await fetch('https://api.github.com/repos/JunHyuk1203/goodnotesword/commits/main');
    if (!res.ok) return;
    const data = await res.json();
    const date = new Date(data.commit.author.date);
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    const badge = document.querySelector('.version-badge');
    if (badge) {
      badge.textContent = `업데이트 ${month}.${day} ${hours}:${minutes}`;
      badge.title = data.commit.message; // 마우스를 올리면 커밋 메시지 표시
    }
  } catch (err) {
    console.error('Failed to fetch version:', err);
  }
}

fetchLatestVersion();


// ─── Firebase Auth & Library Logic ──────────────────────────────────────────────────────────

const loginBtn = document.getElementById('google-login-btn');
const logoutBtn = document.getElementById('google-logout-btn');
const authPrompt = document.getElementById('library-auth-prompt');
const libContent = document.getElementById('library-content');
const userAvatar = document.getElementById('user-avatar');

loginBtn?.addEventListener('click', async () => {
  
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    alert('로그인 실패: ' + err.message);
  }
});

logoutBtn?.addEventListener('click', () => {
  signOut(auth);
});

// onAuthStateChanged(auth, (user) => {
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


// Extraction UI toggle
const openExtractBtn = document.getElementById('open-extract-btn');
const closeExtractBtn = document.getElementById('close-extract-btn');

openExtractBtn?.addEventListener('click', () => {
  document.getElementById('view-words').classList.add('hidden');
  document.getElementById('extract-section').classList.remove('hidden');
});

closeExtractBtn?.addEventListener('click', () => {
  document.getElementById('extract-section').classList.add('hidden');
  document.getElementById('view-words').classList.remove('hidden');
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
  
  const csvStr = "\uFEFF" + lines.join("\n");
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

// ─── Auto Save ─────────────────────────────────────────────────────────────
async function autoSaveToLibrary(data) {
  if (!currentUser || !selectedBookId || !selectedChapterId) {
    alert('저장할 단어장 경로를 찾지 못했습니다. 먼저 단원(챕터)을 선택해주세요.');
    return;
  }
  try {
    const { collection, doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
    
    // progress ui show
    const progressSection = document.getElementById('progress-section');
    if (progressSection) progressSection.classList.remove('hidden');
    setProgress(90, '단어장에 자동 저장 중...', '잠시만 기다려주세요');
    
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const wordRef = doc(collection(db, `users/${currentUser.uid}/books/${selectedBookId}/chapters/${selectedChapterId}/words`));
      await setDoc(wordRef, { 
        front: item.front, 
        back: item.back,
        order: i 
      });
    }

    setProgress(100, '저장 완료!', '단어장으로 이동합니다.');
    
    setTimeout(() => {
      // Reset extraction inputs
      const vocabInput = document.getElementById('vocab-input');
      if (vocabInput) vocabInput.value = '';
      
      // Hide extraction UI
      document.getElementById('extract-section').classList.add('hidden');
      if (progressSection) progressSection.classList.add('hidden');
      document.getElementById('view-words').classList.remove('hidden');
      
      // Reload chapter words
      if (typeof loadWords === 'function') {
        const crumbChapterName = document.getElementById('crumb-chapter-name');
        loadWords(selectedBookId, selectedChapterId, crumbChapterName ? crumbChapterName.textContent : '단원');
      }
    }, 1000);
  } catch(err) {
    console.error(err);
    alert('자동 저장 중 오류 발생: ' + err.message);
  }
}
