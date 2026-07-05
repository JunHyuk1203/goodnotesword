import re

# 1. REFACTOR index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove Global Nav
html = re.sub(r'<!-- Global Navigation -->\s*<div class="global-nav".*?</div>', '', html, flags=re.DOTALL)

# Hide extract section by default
html = html.replace('<div id="extract-section">', '<div id="extract-section" class="hidden">\n      <div style="margin-bottom:1rem;"><button id="close-extract-btn" class="sample-btn">← 단원 목록으로 돌아가기</button></div>')

# Hide download buttons inside extract section (since it auto-saves)
html = html.replace('<div class="download-section">', '<div class="download-section hidden">')

# Modify view-words to include the extract button
view_words_btn = """
          <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <span id="word-count-badge" class="badge badge-ai">0 단어</span>
            <div style="display:flex; gap: 8px;">
              <button id="open-extract-btn" class="generate-btn" style="width:auto; padding: 0.6rem 1.2rem; font-size: 0.9rem;">✨ 새 단어 추출하기</button>
              <button id="export-library-csv-btn" class="download-btn download-primary" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">
"""
html = re.sub(r'<div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">\s*<span id="word-count-badge".*?<button id="export-library-csv-btn".*?>', view_words_btn, html, flags=re.DOTALL)

# Remove save-modal
html = re.sub(r'<!-- Save Modal -->.*?</div>\s*</div>', '', html, flags=re.DOTALL)

# Default library-section is NOT hidden if we want it to be the main view.
# Actually, library-section logic in app.js handles visibility based on login.
# Let's remove 'hidden' from library-section so it shows up first.
html = html.replace('<div id="library-section" class="hidden">', '<div id="library-section">')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)


# 2. REFACTOR app.js
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace generateBtn.addEventListener to auto-save
# The old logic:
# generateBtn.addEventListener('click', async () => { ... show preview ... });
# It's huge. We don't want to parse it with regex safely.
# Instead, we will append an override for `generateBtn` or intercept `generateBtn`?
# In JS, addEventListener doesn't overwrite.
# Let's read `app.js` and manually replace the `// ─── Main Process` part.
pass
