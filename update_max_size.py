# -*- coding: utf-8 -*-
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

import re

# Update renderTraceGuide
# First, extract everything from function renderTraceGuide to `return { mask, targetPixelCount, w, h };`
match = re.search(r'function renderTraceGuide\(canvas, ctx, text, isKo\) \{.*?return \{ mask, targetPixelCount, w, h \};\n\}', js, re.DOTALL)
if match:
    old_render = match.group(0)
    new_render = """function renderTraceGuide(canvas, ctx, text, isKo) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  
  ctx.clearRect(0, 0, w, h);
  
  // Draw guide text
  ctx.fillStyle = 'rgba(180, 180, 180, 0.4)'; // Light gray guide
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Calculate maximum font size to fill the canvas bounds exactly
  ctx.font = '900 100px var(--font-main)';
  const baseWidth = ctx.measureText(text).width;
  
  const maxFontSizeWidth = ((w - 20) / baseWidth) * 100;
  const maxFontSizeHeight = h - 20; // 10px padding top/bottom
  
  let fontSize = Math.min(maxFontSizeWidth, maxFontSizeHeight);
  fontSize = Math.max(10, Math.min(fontSize, 600)); // clamp between 10px and 600px
  
  ctx.font = `900 ${fontSize}px var(--font-main)`;
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
else:
    print("Could not find renderTraceGuide")

# Update line width in initTraceCanvas to be thicker
js = js.replace("ctx.lineWidth = 6;", "ctx.lineWidth = 15;")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("Updated app.js")
