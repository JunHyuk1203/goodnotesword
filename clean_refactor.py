import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Remove global-nav
# We know global-nav is:
#     <!-- Global Navigation -->
#     <div class="global-nav">
#       <div class="nav-tabs">
#         <button id="nav-extract-btn" class="nav-tab active">✨ AI 추출 및 변환</button>
#         <button id="nav-library-btn" class="nav-tab">📚 내 단어장</button>
#       </div>
#       <div class="user-profile">
#         <img id="user-avatar" class="user-avatar" src="" alt="User" style="display:none;" />
#       </div>
#     </div>
global_nav_pattern = r'<!-- Global Navigation -->\s*<div class="global-nav">.*?</div>\s*</div>\s*</div>'
html = re.sub(global_nav_pattern, '', html, flags=re.DOTALL)

# 2. Hide extract-section and add return button
html = html.replace('<div id="extract-section">', '<div id="extract-section" class="hidden">\n      <div style="margin-bottom:1rem;"><button id="close-extract-btn" class="sample-btn">← 단원 목록으로 돌아가기</button></div>')

# 3. Hide download-section inside extract-section since it auto saves
html = html.replace('<div class="download-section">', '<div class="download-section hidden">')

# 4. Remove save-modal
#     <!-- Save Modal -->
#     <div id="save-modal" class="api-modal hidden">
#      ...
#     </div>
save_modal_pattern = r'<!-- Save Modal -->\s*<div id="save-modal".*?</div>\s*</div>\s*</div>'
html = re.sub(save_modal_pattern, '', html, flags=re.DOTALL)

# 5. Inject [+ AI로 새 단어 추출하기] into view-words
# We look for word-count-badge and add the button right after it
old_badge = '<span id="word-count-badge" class="badge badge-ai">0 단어</span>'
new_badge = '<span id="word-count-badge" class="badge badge-ai">0 단어</span>\n            <button id="open-extract-btn" class="generate-btn" style="width:auto; padding: 0.6rem 1.2rem; font-size: 0.9rem; margin-left:10px;">✨ 새 단어 추출/추가하기</button>'
html = html.replace(old_badge, new_badge)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("done")
