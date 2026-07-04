import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Remove the accidental insertion inside download-section
bad_insertion = """          <div id="view-words" class="hidden">
            <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
              <span id="word-count-badge" class="badge badge-ai">0 단어</span>
              <div style="display:flex; gap:10px;">
                <button id="open-extract-btn" class="generate-btn" style="width:auto; padding: 0.6rem 1.2rem; font-size: 0.9rem;">✨ 새 단어 추출하기</button>
              </div>
            </div>
          </div>\n"""
html = html.replace(bad_insertion, '')

# 2. Find the REAL view-words section and replace its header
old_view_header = """        <div id="view-words" class="hidden">
          <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <span id="word-count-badge" class="badge badge-ai">0 단어</span>
            <button id="export-library-csv-btn" class="download-btn download-primary" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px; height:16px; margin-right:4px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              CSV 내보내기
            </button>
          </div>"""

new_view_header = """        <div id="view-words" class="hidden">
          <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <span id="word-count-badge" class="badge badge-ai">0 단어</span>
            <div style="display:flex; gap:10px;">
              <button id="open-extract-btn" class="generate-btn" style="width:auto; padding: 0.6rem 1.2rem; font-size: 0.9rem;">✨ 새 단어 추출/추가하기</button>
              <button id="export-library-csv-btn" class="download-btn download-primary" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px; height:16px; margin-right:4px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                CSV 내보내기
              </button>
            </div>
          </div>"""

if old_view_header in html:
    html = html.replace(old_view_header, new_view_header)
else:
    print("Warning: Could not find old_view_header")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("done")
