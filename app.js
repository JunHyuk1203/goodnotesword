/**
 * GoodNotes Vocabulary Study Set Generator
 * app.js ??v3 (fix: progressSection ref, improved 429 handling)
 *
 * Modes:
 *  - Text mode: user pastes vocab text ??sends as text prompt to Gemini
 *  - Image mode: user uploads image(s) ??sends as inline_data to Gemini Vision
 */

'use strict';

// ?Ä?Ä?Ä API Key (stored in localStorage) ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
const STORAGE_KEY = 'gn_gemini_api_key';
function getApiKey() { return localStorage.getItem(STORAGE_KEY) || ''; }
function setApiKey(k) { localStorage.setItem(STORAGE_KEY, k); }

// ?Ä?Ä?Ä DOM refs ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
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

// ?Ä?Ä?Ä State ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
let generatedData = [];
let activeTab = 'text'; // 'text' | 'image'
let uploadedImages = []; // Array of { file, dataUrl, mimeType }

// ?Ä?Ä?Ä Sample text ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
const SAMPLE_TEXT = `accomplish [?k?mpl…™?] v. ?±Ï∑®?òÎã§, ?¨ÏÑ±?òÎã§
Syn: achieve, attain, fulfill, complete, carry out
Ant: fail, abandon, neglect, give up
Ex: She accomplished her goal of running a marathon in under four hours.
Ex: The team accomplished the project ahead of schedule.

abundant [?b?nd?nt] adj. ?çÎ??? ?âÎÑâ??Syn: plentiful, ample, copious, bountiful, profuse
Ant: scarce, rare, insufficient, lacking, meager
Ex: The region has abundant natural resources, including oil and minerals.
Related: abundance (n.), abundantly (adv.)

ambiguous [√¶mb…™…°ju?s] adj. Î™®Ìò∏?? Î∂àÎ∂ÑÎ™ÖÌïú
Syn: unclear, vague, equivocal, obscure, uncertain
Ant: clear, definite, explicit, unambiguous, certain
Ex: The contract contained several ambiguous clauses that led to disputes.
Related: ambiguity (n.), ambiguously (adv.)

scrutinize [skru?t…™na…™z] v. Î©¥Î???Ï°∞ÏÇ¨?òÎã§, ?êÏÑ∏???¥Ìîº??Syn: examine, inspect, analyze, probe, investigate
Ant: ignore, overlook, neglect, skim
Ex: The auditors scrutinized every financial record in the company.

resilient [r…™z…™li?nt] adj. ?åÎ≥µ?•Ïù¥ ?àÎäî, ?ÑÎ†• ?àÎäî
Syn: tough, strong, adaptable, flexible, buoyant
Ant: weak, fragile, vulnerable, brittle
Ex: Children are often more resilient than adults when it comes to change.
Related: resilience (n.), resiliently (adv.)`;

// ?Ä?Ä?Ä Tab switching ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
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

// ?Ä?Ä?Ä Text mode events ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
vocabInput.addEventListener('input', () => {
  charCount.textContent = `${vocabInput.value.length.toLocaleString()}??;
  onInputChange();
});
loadSampleBtn.addEventListener('click', () => {
  vocabInput.value = SAMPLE_TEXT;
  charCount.textContent = `${SAMPLE_TEXT.length.toLocaleString()}??;
  vocabInput.scrollTop = 0;
  onInputChange();
});
clearBtn.addEventListener('click', () => {
  vocabInput.value = '';
  charCount.textContent = '0??;
  onInputChange();
});

// ?Ä?Ä?Ä Image mode events ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä

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
    if (!found) showError('?¥Î¶ΩÎ≥¥Îìú ?§Î•ò', '?¥Î¶ΩÎ≥¥Îìú???¥Î?ÏßÄÍ∞Ä ?ÜÏäµ?àÎã§. ?¥Î?ÏßÄÎ•?Î≥µÏÇ¨?????§Ïãú ?úÎèÑ?¥Ï£º?∏Ïöî.');
  } catch (e) {
    showError('?¥Î¶ΩÎ≥¥Îìú ?ëÍ∑º ?§Ìå®', 'Î∏åÎùº?∞Ï? Í∂åÌïú???ÑÏöî?©Îãà?? ?åÏùº ?†ÌÉù???¥Ïö©?¥Ï£º?∏Ïöî.');
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

// ?Ä?Ä?Ä Image file handling ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä

function addImageFiles(files) {
  const promises = files.map(file => {
    return new Promise(resolve => {
      // 50MB per image
      if (file.size > 50 * 1024 * 1024) {
        showError('?åÏùº ?¨Í∏∞ Ï¥àÍ≥º', `"${file.name}" ?åÏùº??50MBÎ•?Ï¥àÍ≥º?©Îãà??`);
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
  previewCount.textContent = `${uploadedImages.length}???†ÌÉù??(?êÎèô?ºÎ°ú Î∞∞Ïπò Ï≤òÎ¶¨)`;

  uploadedImages.forEach((img, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'img-thumb-wrap';

    const thumb = document.createElement('img');
    thumb.className = 'img-thumb';
    thumb.src = img.dataUrl;
    thumb.alt = img.name;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'img-thumb-remove';
    removeBtn.textContent = '??;
    removeBtn.title = '?¥Î?ÏßÄ ?úÍ±∞';
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

// ?Ä?Ä?Ä Generate button state ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä

function onInputChange() {
  updateGenerateButton();
}

function updateGenerateButton() {
  const ready =
    (activeTab === 'text' && vocabInput.value.trim().length > 10) ||
    (activeTab === 'image' && uploadedImages.length > 0);
  generateBtn.disabled = !ready;
  generateHint.textContent = ready
    ? `AIÍ∞Ä ?¥Î?ÏßÄ/?çÏä§?∏Ïóê???®Ïñ¥?Ä ?ªÏùÑ ?êÎèô Ï∂îÏ∂ú?©Îãà??{
        activeTab === 'image' && uploadedImages.length > 0
          ? ` (${uploadedImages.length}????${Math.ceil(uploadedImages.length / BATCH_SIZE)}Î∞∞Ïπò)`
          : ''
      }`
    : activeTab === 'image'
      ? '?¥Î?ÏßÄÎ•??ÖÎ°ú?úÌïòÎ©?Î≤ÑÌäº???úÏÑ±?îÎê©?àÎã§ (?¨Îü¨ ??Í∞Ä??'
      : '?çÏä§?∏Î? ?ÖÎ†•?òÎ©¥ Î≤ÑÌäº???úÏÑ±?îÎê©?àÎã§';
}

// ?Ä?Ä?Ä Batch size (images per API call) ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
const BATCH_SIZE = 4; // Gemini handles 4 images per request comfortably

// ?Ä?Ä?Ä Generate ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
generateBtn.addEventListener('click', handleGenerate);

async function handleGenerate() {
  hideError();
  resultSection.classList.add('hidden');
  progressSection.classList.remove('hidden');
  generateBtn.disabled = true;
  btnText.textContent = '?ùÏÑ± Ï§?..';

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
          `Î∞∞Ïπò ${batchNum}/${totalBatches} Ï≤òÎ¶¨ Ï§?..`,
          `?¥Î?ÏßÄ ${batches[b].map((_, i) => b * BATCH_SIZE + i + 1).join(', ')}??Î∂ÑÏÑù Ï§?
        );

        const responseText = await callGeminiVision(apiKey, prompt, batches[b]);
        const batchParsed = parseResponse(responseText);
        allParsed = [...allParsed, ...batchParsed];

        setProgress(pctEnd, `Î∞∞Ïπò ${batchNum}/${totalBatches} ?ÑÎ£å`, `?ÑÏ†Å ${allParsed.length}Í∞??®Ïñ¥`);

        // Small delay between batches to avoid rate limiting
        if (b < batches.length - 1) await new Promise(r => setTimeout(r, 600));
      }
    } else {
      setProgress(5, 'AI?êÍ≤å ?çÏä§?∏Î? ?ÑÏÜ°?òÎäî Ï§?..', '');
      setProgress(15, 'AIÍ∞Ä ?®Ïñ¥Î•?Î∂ÑÏÑù?òÍ≥† ?àÏäµ?àÎã§...', '?àÎ¨∏, ?†Ïùò?? Î∞òÏùò?¥Î? Ï∂îÏ∂ú Ï§?);
      const responseText = await callGeminiText(apiKey, prompt, vocabInput.value.trim());
      allParsed = parseResponse(responseText);
    }

    setProgress(90, '?∞Ïù¥?∞Î? ?ïÎ¶¨?òÍ≥† ?àÏäµ?àÎã§...', '');

    if (!allParsed || allParsed.length === 0) {
      throw new Error('AI ?ëÎãµ?êÏÑú ?®Ïñ¥Î•?Ï∂îÏ∂ú?òÏ? Î™ªÌñà?µÎãà?? ?¥Î?ÏßÄÍ∞Ä ?†Î™Ö?úÏ? ?ïÏù∏?òÍ±∞???§Ïãú ?úÎèÑ?¥Î≥¥?∏Ïöî.');
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

    setProgress(100, '?ÑÎ£å!', `Ï¥?${generatedData.length}Í∞??®Ïñ¥ Ï∂îÏ∂ú`);
    await new Promise(r => setTimeout(r, 400));

    renderResults(generatedData, deduped.length);

  } catch (err) {
    console.error(err);
    const isApiErr = err.message?.includes('API') || err.message?.includes('401') || err.message?.includes('403');
    showError(
      isApiErr ? 'API ?§Î•ò' : 'Ï≤òÎ¶¨ ?§Î•ò',
      err.message || '?????ÜÎäî ?§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.'
    );
  } finally {
    progressSection.classList.add('hidden');
    generateBtn.disabled = false;
    btnText.textContent = 'AIÎ°??§ÌÑ∞???∏Ìä∏ ?ùÏÑ±';
    updateGenerateButton();
    setProgress(0);
  }
}

// ?Ä?Ä?Ä Prompt builder ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä

function buildPrompt(frontOpt, backOpt, lang, maxWords) {
  const langName       = lang === 'ko' ? '?úÍµ≠?? : '?ÅÏñ¥';
  const includeExample = backOpt === 'full' || backOpt === 'meaning_example';
  const includeSynAnt  = backOpt === 'full';

  return `You are an expert vocabulary extraction assistant. Analyze the provided content (which may be text or an image of a vocabulary book) and extract English words with their information.

TASK: Extract up to ${maxWords} English vocabulary words.

OUTPUT FORMAT: Return ONLY a valid JSON array. No explanation, no markdown code fences, no extra text. Just the raw JSON array.

Each item in the array must have these fields:
- "word": the English word (string)
- "pos": part of speech abbreviation (e.g., "v.", "n.", "adj.", "adv.") (string)
- "pronunciation": IPA or phonetic pronunciation if available, otherwise empty string
- "meaning": the definition in ${langName} (string)
- "synonyms": array of synonym strings (max 5)${includeSynAnt ? '' : ' ??return empty array []'}
- "antonyms": array of antonym strings (max 4)${includeSynAnt ? '' : ' ??return empty array []'}
- "examples": array of example sentences (max 2)${includeExample ? '' : ' ??return empty array []'}
- "related": related word forms if any (string, e.g., "abundance (n.)"), or empty string

Rules:
- meaning must be in ${langName}
- If any field is not available in the source, infer it from your knowledge
- Make meanings concise and natural
- Ensure synonyms/antonyms are accurate
- If this is an image, carefully read all visible text including small print`;
}

// ?Ä?Ä?Ä Gemini API: Text ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä

async function callGeminiText(apiKey, prompt, text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [{
      parts: [
        { text: prompt + `\n\nTEXT TO ANALYZE:\n"""\n${text}\n"""` }
      ]
    }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 8192 }
  };
  return fetchGemini(url, body);
}

// ?Ä?Ä?Ä Gemini API: Vision (Image) ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä

async function callGeminiVision(apiKey, prompt, images) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // Build parts: [image1, image2, ..., text prompt]
  const parts = images.map(img => ({
    inline_data: {
      mime_type: img.mimeType,
      data: img.dataUrl.split(',')[1] // strip the data:image/xxx;base64, prefix
    }
  }));
  parts.push({ text: prompt });

  const body = {
    contents: [{ parts }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 8192 }
  };
  return fetchGemini(url, body);
}

async function fetchGemini(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.error?.message || response.statusText;
    if (response.status === 400) throw new Error(`API ?îÏ≤≠ ?§Î•ò (400): ${msg}`);
    if (response.status === 401 || response.status === 403)
      throw new Error(`API ???∏Ï¶ù ?§Ìå® (${response.status}): API ?§Î? ?ïÏù∏?¥Ï£º?∏Ïöî.`);
    if (response.status === 429)
      throw new Error(`API ???†Îãπ?âÏù¥ Ï¥àÍ≥º?òÏóà?µÎãà??(429).
???∞ÏÉÅ ?∞Ï£Ω ?îÎ©¥ [Í∏?API ?? Î≤ÑÌäº???åÎü¨ ???§Î°ú ÍµêÏ≤¥?òÏÑ∏??
???êÎäî https://aistudio.google.com/app/apikey ?êÏÑú ??API ?§Î? Î∞úÍ∏âÎ∞õÏúº?∏Ïöî.`);
    throw new Error(`API ?§Î•ò (${response.status}): ${msg}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('AI ?ëÎãµ??ÎπÑÏñ¥?àÏäµ?àÎã§. ?§Ïãú ?úÎèÑ?¥Î≥¥?∏Ïöî.');
  return text;
}

// ?Ä?Ä?Ä Parsing ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä

function parseResponse(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const startIdx = cleaned.indexOf('[');
  const endIdx   = cleaned.lastIndexOf(']');
  if (startIdx === -1 || endIdx === -1) {
    throw new Error('AI ?ëÎãµ?êÏÑú JSON ?∞Ïù¥?∞Î? Ï∞æÏùÑ ???ÜÏäµ?àÎã§. ?§Ïãú ?úÎèÑ?¥Ï£º?∏Ïöî.');
  }
  cleaned = cleaned.slice(startIdx, endIdx + 1);
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`JSON ?åÏã± ?§Ìå®: ${e.message}. ?§Ïãú ?ùÏÑ±???åÎü¨Ï£ºÏÑ∏??`);
  }
}

// ?Ä?Ä?Ä Card formatting ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä

function formatCard(item, frontOpt, backOpt) {
  let front = item.word || '';
  if (frontOpt === 'word_pos'  && item.pos)           front += `  [${item.pos}]`;
  if (frontOpt === 'word_pron' && item.pronunciation) front += `  ${item.pronunciation}`;

  const backParts = [];
  if (item.meaning) {
    const posStr = item.pos ? `[${item.pos}] ` : '';
    backParts.push(`${posStr}${item.meaning}`);
  }
  if (backOpt === 'full') {
    if (item.synonyms?.length) backParts.push(`?†Ïùò?? ${item.synonyms.join(', ')}`);
    if (item.antonyms?.length) backParts.push(`Î∞òÏùò?? ${item.antonyms.join(', ')}`);
    if (item.related)          backParts.push(`Í¥Ä?®Ïñ¥: ${item.related}`);
  }
  if (backOpt === 'full' || backOpt === 'meaning_example') {
    if (item.examples?.length) item.examples.forEach(ex => backParts.push(`?? ${ex}`));
  }

  return { front: front.trim(), back: backParts.join('\n').trim() };
}

// ?Ä?Ä?Ä Render results ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä

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

  resultSummary.textContent = `Ï¥?${data.length}Í∞úÏùò ?®Ïñ¥Í∞Ä Ï∂îÏ∂ú?òÏóà?µÎãà??${
    totalExtracted > data.length ? ` (?êÎ≥∏ ${totalExtracted}Í∞?Ï§?ÏµúÎ? ${data.length}Í∞??úÏãú)` : ''
  } ?ÑÎûò?êÏÑú ÎØ∏Î¶¨Î≥¥Í∏∞ ??CSVÎ•??§Ïö¥Î°úÎìú?òÏÑ∏??`;

  resultSection.classList.remove('hidden');
  previewContainer.classList.remove('collapsed');
  togglePreviewBtn.textContent = '?ëÍ∏∞';
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ?Ä?Ä?Ä Preview toggle ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
togglePreviewBtn.addEventListener('click', () => {
  const collapsed = previewContainer.classList.toggle('collapsed');
  togglePreviewBtn.textContent = collapsed ? '?ºÏπòÍ∏? : '?ëÍ∏∞';
});

// ?Ä?Ä?Ä Download / Copy ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
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
      Î≥µÏÇ¨ ?ÑÎ£å!`;
    setTimeout(() => { copyCsvBtn.innerHTML = original; }, 2000);
  } catch (e) {
    showError('Î≥µÏÇ¨ ?§Ìå®', '?¥Î¶ΩÎ≥¥Îìú ?ëÍ∑º Í∂åÌïú???ÜÏäµ?àÎã§. CSV ?§Ïö¥Î°úÎìúÎ•??¥Ïö©?¥Ï£º?∏Ïöî.');
  }
}

// ?Ä?Ä?Ä Error helpers ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä

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

// ?Ä?Ä?Ä API Key Modal ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä

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
    apiKeyStatus.textContent = '??API ???Ä?•Îê®';
    apiKeyStatus.className = 'key-status ok';
  } else {
    apiKeyStatus.textContent = 'API ???ÑÏöî';
    apiKeyStatus.className = 'key-status';
  }
}

// ?Ä?Ä?Ä Init ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
onInputChange();
updateKeyStatus();
if (!getApiKey()) showApiModal();
