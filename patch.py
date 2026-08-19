# -*- coding: utf-8 -*-
import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update initTraceCanvas
match_init = re.search(r'function initTraceCanvas\(canvas, ctx\).*?return \{ canvas: clone, ctx \};\n\}', js, re.DOTALL)
if match_init:
    new_init = """function initTraceCanvas(canvas) {
  if (!canvas) return null;
  
  // Clone to remove old event listeners
  const clone = canvas.cloneNode(true);
  canvas.parentNode.replaceChild(clone, canvas);
  const ctx = clone.getContext('2d', { willReadFrequently: true });
  
  // Handle high DPI displays for crisp drawing
  const rect = clone.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = rect.width || 400;
  const cssHeight = rect.height || 150;
  
  // Always set physical width/height and apply scale on the NEW context
  clone.width = cssWidth * dpr;
  clone.height = cssHeight * dpr;
  // clone.style.width and clone.style.height are handled by CSS flex
  ctx.scale(dpr, dpr);
  
  // Only the draw layer needs touch events
  if (clone.classList.contains('trace-draw-layer')) {
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
      ctx.lineWidth = 15;
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
      ctx.lineWidth = 15;
      ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--text').trim() || '#ffffff';
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
    }

    function stopDrawing() {
      isDrawing = false;
      ctx.beginPath();
    }

    clone.addEventListener('pointerdown', startDrawing);
    clone.addEventListener('pointermove', draw);
    clone.addEventListener('pointerup', stopDrawing);
    clone.addEventListener('pointerout', stopDrawing);
    clone.addEventListener('pointercancel', stopDrawing);
    
    clone.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    clone.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }
  
  return { canvas: clone, ctx };
}"""
    js = js.replace(match_init.group(0), new_init)
else:
    print('Failed to find initTraceCanvas')

# 2. Update renderTraceGuide
match_render = re.search(r'function renderTraceGuide\(canvas, ctx, text, isKo\).*?return \{ mask, targetPixelCount, w, h, fontSize \};\n\}', js, re.DOTALL)
if match_render:
    new_render = """function renderTraceGuide(canvas, ctx, text, isKo) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  
  ctx.clearRect(0, 0, w, h);
  
  // Draw guide text
  ctx.fillStyle = 'rgba(180, 180, 180, 0.15)'; // Light gray guide
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.font = '900 100px sans-serif';
  const baseWidth = ctx.measureText(text).width;
  
  const maxFontSizeWidth = ((w - 20) / baseWidth) * 100;
  const maxFontSizeHeight = h - 20;
  
  let fontSize = Math.min(maxFontSizeWidth, maxFontSizeHeight);
  fontSize = Math.max(10, Math.min(fontSize, 600));
  
  ctx.font = `900 ${fontSize}px sans-serif`;
  ctx.fillText(text, w / 2, h / 2);
  
  // Create a mask of the guide pixels for accuracy calculation
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const mask = new Uint8Array(canvas.width * canvas.height);
  let targetPixelCount = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a > 20) {
      mask[i / 4] = 1;
      targetPixelCount++;
    }
  }
  
  return { mask, targetPixelCount, w, h, fontSize };
}"""
    js = js.replace(match_render.group(0), new_render)
else:
    print('Failed to find renderTraceGuide')

# 3. Update clearTraceCanvas
match_clear = re.search(r'function clearTraceCanvas\(canvas, ctx, targetMaskData, text, isKo\) \{.*?\}', js, re.DOTALL)
if match_clear:
    new_clear = """function clearTraceCanvas(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
}"""
    js = js.replace(match_clear.group(0), new_clear)
else:
    print('Failed to find clearTraceCanvas')

# 4. Update clear buttons
js = js.replace(
"""document.getElementById('trace-en-clear-btn')?.addEventListener('click', () => {
  clearTraceCanvas(activeEnCanvas, activeEnCtx, targetMaskEn, currentTraceData.word, false);
});""",
"""document.getElementById('trace-en-clear-btn')?.addEventListener('click', () => {
  clearTraceCanvas(activeEnCanvas, activeEnCtx);
});""")

js = js.replace(
"""document.getElementById('trace-ko-clear-btn')?.addEventListener('click', () => {
  const meaningText = currentTraceData.meaning ? currentTraceData.meaning.split(',')[0].trim() : currentTraceData.back || '';
  clearTraceCanvas(activeKoCanvas, activeKoCtx, targetMaskKo, meaningText, true);
});""",
"""document.getElementById('trace-ko-clear-btn')?.addEventListener('click', () => {
  clearTraceCanvas(activeKoCanvas, activeKoCtx);
});""")

# 5. Update calculateTraceAccuracy
match_calc = re.search(r'function calculateTraceAccuracy\(canvas, ctx, maskData\).*?return Math\.max\(0, Math\.min\(100, Math\.round\(finalAcc\)\)\);\n\}', js, re.DOTALL)
if match_calc:
    new_calc = """function calculateTraceAccuracy(canvas, ctx, maskData) {
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  
  let hitCount = 0;
  let userPixelCount = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    // User draws with near-full opacity (alpha ~255)
    if (a > 100) {
      userPixelCount++;
      if (maskData.mask[i / 4] === 1) {
        hitCount++; // User drew on the guide
      }
    }
  }
  
  if (maskData.targetPixelCount === 0) return 100;
  if (userPixelCount === 0) return 0;
  
  // F1-Score calculation
  // Recall: how much of the guide did they cover?
  const recall = hitCount / maskData.targetPixelCount;
  
  // Precision: how much of their stroke was on the guide?
  const precision = hitCount / userPixelCount;
  
  if (precision + recall === 0) return 0;
  
  const f1 = 2 * (precision * recall) / (precision + recall);
  
  return Math.max(0, Math.min(100, Math.round(f1 * 100)));
}"""
    js = js.replace(match_calc.group(0), new_calc)
else:
    print('Failed to find calculateTraceAccuracy')

# 6. Update showTraceCard block where canvases are initialized
match_show = re.search(r'  // Re-init canvases\n  const enRes = initTraceCanvas.*?targetMaskKo = koMaskData;\n', js, re.DOTALL)
if match_show:
    new_show = """  // Re-init guide canvases (no events)
  const enGuideRes = initTraceCanvas(document.getElementById('trace-en-guide'));
  const koGuideRes = initTraceCanvas(document.getElementById('trace-ko-guide'));
  
  // Re-init draw canvases (has events)
  const enRes = initTraceCanvas(document.getElementById('trace-en-draw'));
  activeEnCanvas = enRes.canvas;
  activeEnCtx = enRes.ctx;
  
  const koRes = initTraceCanvas(document.getElementById('trace-ko-draw'));
  activeKoCanvas = koRes.canvas;
  activeKoCtx = koRes.ctx;
  
  const meaningText = data.meaning ? data.meaning.split(',')[0].trim() : data.back || '';
  
  // Render guides and save masks
  targetMaskEn = renderTraceGuide(enGuideRes.canvas, enGuideRes.ctx, data.word, false);
  if (data.meaning) {
    document.getElementById('trace-ko-draw').parentNode.style.display = 'flex';
    targetMaskKo = renderTraceGuide(koGuideRes.canvas, koGuideRes.ctx, meaningText, true);
  } else {
    document.getElementById('trace-ko-draw').parentNode.style.display = 'none';
    targetMaskKo = null;
  }
  
  // Clear the drawing layers for the new word
  clearTraceCanvas(activeEnCanvas, activeEnCtx);
  clearTraceCanvas(activeKoCanvas, activeKoCtx);
"""
    js = js.replace(match_show.group(0), new_show)
else:
    print('Failed to find showTraceCard block')

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('Updated app.js completely')
