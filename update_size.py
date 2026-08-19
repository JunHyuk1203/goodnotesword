# -*- coding: utf-8 -*-
with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()
css = css.replace('min-height: 150px;', 'min-height: 250px;')
with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace fontSize = 120 with 200, and add wrapping logic
old_render = """  let fontSize = 120;
  // Scale down if text is too long
  ctx.font = `900 ${fontSize}px var(--font-main)`;
  let textWidth = ctx.measureText(text).width;
  while (textWidth > w - 40 && fontSize > 20) {
    fontSize -= 2;
    ctx.font = `900 ${fontSize}px var(--font-main)`;
    textWidth = ctx.measureText(text).width;
  }
  
  ctx.fillText(text, w / 2, h / 2);"""

new_render = """  let fontSize = 200;
  
  function wrap(ctx, text, maxWidth) {
      let lines = [];
      let currentLine = '';
      const words = text.split(' ');
      for (let word of words) {
          let testLine = currentLine + (currentLine ? ' ' : '') + word;
          if (ctx.measureText(testLine).width > maxWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word;
          } else {
              currentLine = testLine;
          }
      }
      lines.push(currentLine);
      
      // If a single word is still too long, break it by character (basic)
      let finalLines = [];
      for (let line of lines) {
          if (ctx.measureText(line).width > maxWidth && line.length > 3) {
              let cl = '';
              for (let char of line) {
                  if (ctx.measureText(cl + char).width > maxWidth && cl) {
                      finalLines.push(cl);
                      cl = char;
                  } else {
                      cl += char;
                  }
              }
              finalLines.push(cl);
          } else {
              finalLines.push(line);
          }
      }
      return finalLines;
  }

  ctx.font = `900 ${fontSize}px var(--font-main)`;
  let lines = wrap(ctx, text, w - 40);

  while ((lines.length * fontSize > h - 40 || lines.some(l => ctx.measureText(l).width > w - 40)) && fontSize > 20) {
    fontSize -= 2;
    ctx.font = `900 ${fontSize}px var(--font-main)`;
    lines = wrap(ctx, text, w - 40);
  }
  
  let startY = h / 2 - ((lines.length - 1) * fontSize) / 2;
  for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], w / 2, startY + i * fontSize);
  }"""

if old_render in js:
    js = js.replace(old_render, new_render)
else:
    print("Could not find old render in app.js")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
