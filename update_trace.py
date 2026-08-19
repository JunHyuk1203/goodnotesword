# -*- coding: utf-8 -*-
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

import re

# Update initTraceCanvas
old_init = re.search(r'function initTraceCanvas\(canvas, ctx\).*?return \{ canvas: clone, ctx \};\n\}', js, re.DOTALL).group(0)
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
  
  ctx.scale(dpr, dpr);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 15;
  ctx.strokeStyle = '#3b82f6';
  
  // Only the draw layer needs touch events
  if (clone.classList.contains('trace-draw-layer')) {
    let drawing = false;
    let lastX = 0;
    let lastY = 0;
    
    function getPos(e) {
      const bcr = clone.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - bcr.left, y: clientY - bcr.top };
    }
    
    clone.addEventListener('touchstart', (e) => {
      drawing = true;
      const pos = getPos(e);
      lastX = pos.x;
      lastY = pos.y;
    }, { passive: true });
    
    clone.addEventListener('touchmove', (e) => {
      if (!drawing) return;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
    }, { passive: true });
    
    clone.addEventListener('touchend', () => { drawing = false; });
  }
  
  return { canvas: clone, ctx };
}"""
js = js.replace(old_init, new_init)

# Update renderTraceGuide
old_render = re.search(r'function renderTraceGuide\(canvas, ctx, text, isKo\).*?return \{ mask, targetPixelCount, w, h, fontSize \};\n\}', js, re.DOTALL).group(0)
new_render = """function renderTraceGuide(canvas, ctx, text, isKo) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  
  ctx.clearRect(0, 0, w, h);
  
  // Draw guide text
  ctx.fillStyle = 'rgba(180, 180, 180, 0.15)'; // Light gray guide
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Calculate maximum font size to fill the canvas bounds exactly
  ctx.font = '900 100px sans-serif';
  const baseWidth = ctx.measureText(text).width;
  
  const maxFontSizeWidth = ((w - 20) / baseWidth) * 100;
  const maxFontSizeHeight = h - 20; // 10px padding top/bottom
  
  let fontSize = Math.min(maxFontSizeWidth, maxFontSizeHeight);
  fontSize = Math.max(10, Math.min(fontSize, 600)); // clamp between 10px and 600px
  
  ctx.font = `900 ${fontSize}px sans-serif`;
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
  
  return { mask, targetPixelCount, w, h, fontSize };
}"""
js = js.replace(old_render, new_render)

# Update clearTraceCanvas
old_clear = """function clearTraceCanvas(canvas, ctx, targetMaskData, text, isKo) {
  renderTraceGuide(canvas, ctx, text, isKo);
}"""
new_clear = """function clearTraceCanvas(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
}"""
js = js.replace(old_clear, new_clear)

# Update clear buttons
old_btn1 = """document.getElementById('trace-en-clear-btn')?.addEventListener('click', () => {
  clearTraceCanvas(activeEnCanvas, activeEnCtx, targetMaskEn, currentTraceData.word, false);
});"""
new_btn1 = """document.getElementById('trace-en-clear-btn')?.addEventListener('click', () => {
  clearTraceCanvas(activeEnCanvas, activeEnCtx);
});"""
js = js.replace(old_btn1, new_btn1)

old_btn2 = """document.getElementById('trace-ko-clear-btn')?.addEventListener('click', () => {
  const meaningText = currentTraceData.meaning ? currentTraceData.meaning.split(',')[0].trim() : currentTraceData.back || '';
  clearTraceCanvas(activeKoCanvas, activeKoCtx, targetMaskKo, meaningText, true);
});"""
new_btn2 = """document.getElementById('trace-ko-clear-btn')?.addEventListener('click', () => {
  clearTraceCanvas(activeKoCanvas, activeKoCtx);
});"""
js = js.replace(old_btn2, new_btn2)

# Update calculateTraceAccuracy
old_calc = re.search(r'function calculateTraceAccuracy\(canvas, ctx, maskData\).*?return Math\.max\(0, Math\.min\(100, Math\.round\(finalAcc\)\)\);\n\}', js, re.DOTALL).group(0)
new_calc = """function calculateTraceAccuracy(canvas, ctx, maskData) {
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  
  let hitCount = 0;
  let falsePositiveCount = 0;
  let userPixelCount = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    // User draws with near-full opacity (alpha ~255)
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
  
  // F1-Score calculation
  // Recall: how much of the guide did they cover?
  const recall = hitCount / maskData.targetPixelCount;
  
  // Precision: how much of their stroke was on the guide?
  const precision = hitCount / userPixelCount;
  
  if (precision + recall === 0) return 0;
  
  const f1 = 2 * (precision * recall) / (precision + recall);
  
  return Math.max(0, Math.min(100, Math.round(f1 * 100)));
}"""
js = js.replace(old_calc, new_calc)

# Update showTraceCard block where canvases are initialized
# Need to rewrite this part
old_show_frag = re.search(r'// Re-init canvases.*?targetMaskKo = koMaskData;\n', js, re.DOTALL).group(0)
new_show_frag = """// Re-init guide canvases (no events)
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
  
  targetMaskEn = renderTraceGuide(enGuideRes.canvas, enGuideRes.ctx, data.word, false);
  targetMaskKo = renderTraceGuide(koGuideRes.canvas, koGuideRes.ctx, meaningText, true);
  
  // Clear the drawing layers for the new word
  clearTraceCanvas(activeEnCanvas, activeEnCtx);
  clearTraceCanvas(activeKoCanvas, activeKoCtx);
"""
js = js.replace(old_show_frag, new_show_frag)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('Updated app.js')
