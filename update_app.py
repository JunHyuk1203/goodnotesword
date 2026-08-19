# -*- coding: utf-8 -*-
import sys
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

trace_js = """
// -----------------------------------------------------------------------------
// Trace (따라쓰기) Test Implementation
// -----------------------------------------------------------------------------
let traceFailCount = 0;
let currentTraceData = null;

const traceEnCanvas = document.getElementById('trace-en-canvas');
const traceKoCanvas = document.getElementById('trace-ko-canvas');
const traceEnCtx = traceEnCanvas?.getContext('2d', { willReadFrequently: true });
const traceKoCtx = traceKoCanvas?.getContext('2d', { willReadFrequently: true });

function initTraceCanvas(canvas, ctx) {
  if (!canvas) return null;
  
  // Clone to remove old event listeners
  const clone = canvas.cloneNode(true);
  canvas.parentNode.replaceChild(clone, canvas);
  ctx = clone.getContext('2d', { willReadFrequently: true });
  
  // Handle high DPI displays for crisp drawing
  const rect = clone.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = rect.width || 400;
  const cssHeight = rect.height || 150;
  
  // Always set physical width/height and apply scale on the NEW context
  clone.width = cssWidth * dpr;
  clone.height = cssHeight * dpr;
  clone.style.width = `${cssWidth}px`;
  clone.style.height = `${cssHeight}px`;
  ctx.scale(dpr, dpr);
  
  // Setup drawing state
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  function getPos(e) {
    const r = clone.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - r.left,
      y: clientY - r.top
    };
  }

  function startDrawing(e) {
    isDrawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(lastX, lastY); // dot
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6; // Make user stroke thicker
    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--text').trim() || '#ffffff';
    ctx.stroke();
  }

  function draw(e) {
    if (!isDrawing) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--text').trim() || '#ffffff';
    ctx.stroke();
    lastX = pos.x;
    lastY = pos.y;
  }

  function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
  }

  // Add pointer events (works for mouse, touch, and pen)
  clone.addEventListener('pointerdown', startDrawing);
  clone.addEventListener('pointermove', draw);
  clone.addEventListener('pointerup', stopDrawing);
  clone.addEventListener('pointerout', stopDrawing);
  clone.addEventListener('pointercancel', stopDrawing);
  
  // Prevent scrolling on touch
  clone.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  clone.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  
  return { canvas: clone, ctx: ctx };
}

let activeEnCtx = null;
let activeKoCtx = null;
let activeEnCanvas = null;
let activeKoCanvas = null;

// Renders the guide text and stores the target pixel mask
let targetMaskEn = [];
let targetMaskKo = [];

function renderTraceGuide(canvas, ctx, text, isKo) {
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  
  ctx.clearRect(0, 0, w, h);
  
  // Draw guide text
  ctx.fillStyle = 'rgba(180, 180, 180, 0.4)'; // Light gray guide (thicker)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  let fontSize = 120;
  // Scale down if text is too long
  ctx.font = `900 ${fontSize}px var(--font-main)`;
  let textWidth = ctx.measureText(text).width;
  while (textWidth > w - 40 && fontSize > 20) {
    fontSize -= 2;
    ctx.font = `900 ${fontSize}px var(--font-main)`;
    textWidth = ctx.measureText(text).width;
  }
  
  ctx.fillText(text, w / 2, h / 2);
  
  // Create a mask of the guide pixels for accuracy calculation
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const mask = new Uint8Array(canvas.width * canvas.height);
  let targetPixelCount = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a > 20) { // If pixel is somewhat opaque
      mask[i / 4] = 1;
      targetPixelCount++;
    }
  }
  
  return { mask, targetPixelCount, w, h };
}

function showTraceCard() {
  if (testIndex >= testWords.length) {
    showTestResult();
    return;
  }
  
  traceFailCount = 0;
  document.getElementById('trace-skip-btn').classList.add('hidden');
  document.getElementById('trace-feedback').textContent = '';
  document.getElementById('trace-feedback').className = 'short-feedback';
  document.getElementById('trace-en-acc-bar').style.width = '0%';
  document.getElementById('trace-ko-acc-bar').style.width = '0%';
  document.getElementById('trace-en-acc-text').textContent = '0%';
  document.getElementById('trace-ko-acc-text').textContent = '0%';
  
  const data = parseWordData(testWords[testIndex]);
  currentTraceData = data;
  const total = testWords.length;
  const pct = (testIndex / total) * 100;

  document.getElementById('trace-progress-fill').style.width = pct + '%';
  document.getElementById('trace-progress-text').textContent = `${testIndex + 1} / ${total}`;
  
  // Re-init canvases
  const enRes = initTraceCanvas(document.getElementById('trace-en-canvas'), traceEnCtx);
  activeEnCanvas = enRes.canvas;
  activeEnCtx = enRes.ctx;
  
  const koRes = initTraceCanvas(document.getElementById('trace-ko-canvas'), traceKoCtx);
  activeKoCanvas = koRes.canvas;
  activeKoCtx = koRes.ctx;
  
  const meaningText = data.meaning ? data.meaning.split(',')[0].trim() : data.back || '';
  
  const enMaskData = renderTraceGuide(activeEnCanvas, activeEnCtx, data.word, false);
  targetMaskEn = enMaskData;
  
  const koMaskData = renderTraceGuide(activeKoCanvas, activeKoCtx, meaningText, true);
  targetMaskKo = koMaskData;
  
  // Animate in
  const traceScreen = document.getElementById('test-trace');
  traceScreen.classList.remove('card-slide-in');
  void traceScreen.offsetWidth;
  traceScreen.classList.add('card-slide-in');
}

function clearTraceCanvas(canvas, ctx, targetMaskData, text, isKo) {
  renderTraceGuide(canvas, ctx, text, isKo);
}

document.getElementById('trace-en-clear-btn')?.addEventListener('click', () => {
  clearTraceCanvas(activeEnCanvas, activeEnCtx, targetMaskEn, currentTraceData.word, false);
});

document.getElementById('trace-ko-clear-btn')?.addEventListener('click', () => {
  const meaningText = currentTraceData.meaning ? currentTraceData.meaning.split(',')[0].trim() : currentTraceData.back || '';
  clearTraceCanvas(activeKoCanvas, activeKoCtx, targetMaskKo, meaningText, true);
});

function calculateTraceAccuracy(canvas, ctx, maskData) {
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  
  let hitCount = 0;
  let falsePositiveCount = 0;
  let userPixelCount = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    // We look for pixels that are drawn by user.
    // The guide is rgba(150,150,150,0.25) which has alpha ~63. User draws with alpha 255.
    // So if alpha > 100, it's a user pixel.
    if (a > 100) {
      userPixelCount++;
      if (maskData.mask[i / 4] === 1) {
        hitCount++; // User drew on the guide
      } else {
        falsePositiveCount++; // User drew outside the guide
      }
    }
  }
  
  if (maskData.targetPixelCount === 0) return 100;
  if (userPixelCount === 0) return 0;
  
  // Coverage: how much of the guide did they cover?
  // We cap coverage at 1.0 (sometimes they can't cover 100% due to stroke width differences)
  // We will assume 60% coverage of pixels is practically "fully covered" for tracing
  let coverage = hitCount / (maskData.targetPixelCount * 0.6); 
  if (coverage > 1) coverage = 1;
  
  // Precision penalty: drawing too much outside the guide reduces accuracy
  // We allow some false positives because the stroke is thick.
  // If false positives exceed 2x the target pixel count, it's scribbling.
  let penalty = 0;
  const allowedOverflow = maskData.targetPixelCount * 1.5;
  if (falsePositiveCount > allowedOverflow) {
    penalty = ((falsePositiveCount - allowedOverflow) / maskData.targetPixelCount) * 0.5;
  }
  
  let finalAcc = (coverage - penalty) * 100;
  return Math.max(0, Math.min(100, Math.round(finalAcc)));
}

function updateTraceBar(barId, textId, acc) {
  const bar = document.getElementById(barId);
  const txt = document.getElementById(textId);
  if (!bar || !txt) return;
  
  bar.style.width = acc + '%';
  txt.textContent = acc + '%';
  
  if (acc < 50) bar.style.backgroundColor = '#ef4444'; // red
  else if (acc < 80) bar.style.backgroundColor = '#f59e0b'; // yellow
  else bar.style.backgroundColor = '#10b981'; // green
}

document.getElementById('trace-submit-btn')?.addEventListener('click', () => {
  const enAcc = calculateTraceAccuracy(activeEnCanvas, activeEnCtx, targetMaskEn);
  const koAcc = calculateTraceAccuracy(activeKoCanvas, activeKoCtx, targetMaskKo);
  
  updateTraceBar('trace-en-acc-bar', 'trace-en-acc-text', enAcc);
  updateTraceBar('trace-ko-acc-bar', 'trace-ko-acc-text', koAcc);
  
  const fb = document.getElementById('trace-feedback');
  if (enAcc >= 80 && koAcc >= 80) {
    fb.textContent = '✅ 정확하게 잘 따라 썼습니다!';
    fb.className = 'short-feedback show-feedback correct-fb';
    testCorrect++;
    
    setTimeout(() => {
      const traceScreen = document.getElementById('test-trace');
      traceScreen.classList.add('card-slide-out');
      setTimeout(() => {
        traceScreen.classList.remove('card-slide-out');
        testIndex++;
        showTraceCard();
      }, 200);
    }, 1000);
  } else {
    traceFailCount++;
    fb.textContent = `❌ 정확도 미달 (영어: ${enAcc}%, 한글: ${koAcc}%)`;
    fb.className = 'short-feedback show-feedback wrong-fb';
    
    if (traceFailCount >= 3) {
      document.getElementById('trace-skip-btn').classList.remove('hidden');
    }
  }
});

document.getElementById('trace-skip-btn')?.addEventListener('click', () => {
  testWrong.push(currentTraceData.word);
  const traceScreen = document.getElementById('test-trace');
  traceScreen.classList.add('card-slide-out');
  setTimeout(() => {
    traceScreen.classList.remove('card-slide-out');
    testIndex++;
    showTraceCard();
  }, 200);
});

document.getElementById('trace-close-btn')?.addEventListener('click', closeTest);

// End Trace
"""

js = js + trace_js
js = js.replace("const testShort = document.getElementById('test-short');", "const testShort = document.getElementById('test-short');\nconst testTrace = document.getElementById('test-trace');")
js = js.replace("[testSetup, testFlash, testQuiz, testShort, testResult].forEach", "[testSetup, testFlash, testQuiz, testShort, testTrace, testResult].forEach")
js = js.replace("showScreen('short');\n    showShortCard();", "showScreen('short');\n    showShortCard();\n  } else if (testMode === 'trace') {\n    showScreen('trace');\n    showTraceCard();")
js = js.replace("? '📝 주관식' : '알 수 없음'", "? '✏️ 따라쓰기' : data.mode === 'short' ? '📝 주관식' : '알 수 없음'")
js = js.replace("? '📝 4지선다' : '📝 주관식'", "? '📝 4지선다' : data.mode === 'trace' ? '✏️ 따라쓰기' : '📝 주관식'")

# Add trace mode disabled direction logic
# In handle direction disable
js = js.replace("if (mode === 'quiz' || mode === 'short') {", "if (mode === 'trace') {\n    dirSelect.value = 'word2meaning';\n    dirSelect.disabled = true;\n  } else if (mode === 'quiz' || mode === 'short') {")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
