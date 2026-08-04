import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Shared SVG for close button
close_svg = '<svg viewBox="0 0 24 24"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm4.3 12.89l-1.41 1.41L12 13.41l-2.89 2.89-1.41-1.41L10.59 12 7.7 9.11l1.41-1.41L12 10.59l2.89-2.89 1.41 1.41L13.41 12l2.89 2.89z"/></svg>'

# 1. Extract Modal
html = re.sub(
    r'<div class="modal-screen-content extract-modal-box"[^>]*>\s*<div[^>]*>\s*<h3 class="step-title"[^>]*>단어 추출</h3>\s*<button id="close-extract-btn" class="sample-btn">닫기</button>\s*</div>',
    f'''<div class="modal-screen-content extract-modal-box sheet-modal">
      <div class="sheet-drag-bar"></div>
      <div class="sheet-header">
        <h2 class="sheet-title">단어 추출</h2>
        <button id="close-extract-btn" class="sheet-close-btn">{close_svg}</button>
      </div>''',
    html, flags=re.DOTALL
)
# Update Extract Modal Buttons
html = html.replace(
    '<button id="copy-prompt-btn" class="generate-btn" style="width: 100%; padding: 0.8rem; font-size: 1rem;">📝 프롬프트 복사</button>',
    '<button id="copy-prompt-btn" class="primary-action-btn">📝 프롬프트 복사</button>'
)

# 2. Export Modal
html = re.sub(
    r'<div class="modal-screen-content export-modal-box"[^>]*>\s*<div[^>]*>\s*<h2 class="test-title"[^>]*>내 CSV 내보내기</h2>\s*<button id="close-export-btn"[^>]*>.*?</button>\s*</div>',
    f'''<div class="modal-screen-content export-modal-box sheet-modal">
      <div class="sheet-drag-bar"></div>
      <div class="sheet-header">
        <h2 class="sheet-title">내 CSV 내보내기</h2>
        <button id="close-export-btn" class="sheet-close-btn">{close_svg}</button>
      </div>''',
    html, flags=re.DOTALL
)
# Fix placeholder syntax error and update convert-btn
html = re.sub(
    r'  \}\n\]\' rows="8" spellcheck="false"></textarea>',
    r'  }\n]</textarea>',
    html
)
# Ensure textarea has proper attributes now that placeholder is removed or fixed
html = html.replace(
    '<textarea id="csv-output" class="vocab-textarea" placeholder=\'[\n  {\n    "word": "significant",',
    '<textarea id="csv-output" class="vocab-textarea" rows="8" spellcheck="false" placeholder=\'[\n  {\n    "word": "significant",'
)

html = re.sub(
    r'<button id="convert-btn" class="generate-btn" style="[^"]*">\s*<span class="btn-icon">💡</span> 단어장으로 변환하기\s*</button>',
    '<button id="convert-btn" class="primary-action-btn"><span class="btn-icon">💡</span> 단어장으로 변환하기</button>',
    html, flags=re.DOTALL
)

# 3. Test Modal
html = re.sub(
    r'<div class="modal-screen-content test-modal-box">\s*<!-- Test setup screen -->\s*<div id="test-setup" class="test-screen">\s*<h2 class="test-title">💡 새 테스트 설정</h2>',
    f'''<div class="modal-screen-content test-modal-box sheet-modal">
      <div class="sheet-drag-bar"></div>
      <div class="sheet-header">
        <h2 class="sheet-title">💡 새 테스트 설정</h2>
        <button id="test-close-btn-header" class="sheet-close-btn">{close_svg}</button>
      </div>
      <!-- Test setup screen -->
      <div id="test-setup" class="test-screen">''',
    html, flags=re.DOTALL
)
html = re.sub(
    r'<button id="test-start-btn" class="generate-btn"[^>]*>시작하기</button>',
    '<button id="test-start-btn" class="primary-action-btn">시작하기</button>',
    html
)
html = re.sub(
    r'<div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end;">\s*<button id="test-close-btn" class="sample-btn">닫기</button>\s*</div>',
    '<div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end;"></div>',
    html, flags=re.DOTALL
)

# 4. History Modal
html = re.sub(
    r'<div class="modal-screen-content" style="max-width:500px; height:80vh;">\s*<h2 class="test-title"[^>]*>내 테스트 기록</h2>',
    f'''<div class="modal-screen-content sheet-modal">
      <div class="sheet-drag-bar"></div>
      <div class="sheet-header">
        <h2 class="sheet-title">내 테스트 기록</h2>
        <button id="history-close-btn-header" class="sheet-close-btn">{close_svg}</button>
      </div>''',
    html, flags=re.DOTALL
)

html = re.sub(
    r'<div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end;">\s*<button id="history-close-btn" class="sample-btn">닫기</button>\s*</div>',
    '''<!-- Bottom close button kept as requested but pushed to bottom -->
        <div style="margin-top:20px; padding-bottom: env(safe-area-inset-bottom);">
          <button id="history-close-btn" class="primary-action-btn" style="background: var(--bg-tertiary); color: var(--text);">닫기</button>
        </div>''',
    html, flags=re.DOTALL
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("index.html updated")
