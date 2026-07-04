import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Locate the word-count-badge and insert the open-extract-btn next to export-library-csv-btn
old_view = """<div id="view-words" class="hidden">
          <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <span id="word-count-badge" class="badge badge-ai">0 단어</span>
            <button id="export-library-csv-btn" class="download-btn download-primary" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">"""

new_view = """<div id="view-words" class="hidden">
          <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <span id="word-count-badge" class="badge badge-ai">0 단어</span>
            <div style="display:flex; gap:8px;">
              <button id="open-extract-btn" class="generate-btn" style="width:auto; padding: 0.6rem 1.2rem; font-size: 0.9rem;">✨ 새 단어 추가하기</button>
              <button id="export-library-csv-btn" class="download-btn download-primary" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">"""

html = html.replace(old_view, new_view)

# Also need to close the div added in new_view
html = html.replace('CSV 내보내기\n            </button>\n          </div>\n          <table', 'CSV 내보내기\n            </button>\n            </div>\n          </div>\n          <table')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("done")
