import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Just replace the exact span
html = html.replace(
    '<span id="word-count-badge" class="badge badge-ai">0 단어</span>',
    '<span id="word-count-badge" class="badge badge-ai">0 단어</span>\n            <button id="open-extract-btn" class="generate-btn" style="width:auto; padding: 0.6rem 1.2rem; font-size: 0.9rem; margin-left: 10px;">✨ 새 단어 추출/추가하기</button>'
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("done")
