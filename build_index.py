import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

nav_str = """    <!-- Global Navigation -->
    <div class="global-nav">
      <div class="nav-tabs">
        <button id="nav-extract-btn" class="nav-tab active">✨ AI 추출 및 변환</button>
        <button id="nav-library-btn" class="nav-tab">📚 내 단어장</button>
      </div>
      <div class="user-profile">
        <img id="user-avatar" class="user-avatar" src="" alt="User" style="display:none;" />
        <button id="google-logout-btn" class="icon-btn" title="로그아웃" style="display:none;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </div>"""
html = html.replace(nav_str, "")

new_user_profile = """
      <div class="user-profile" style="position:absolute; right:20px; top:20px; display:flex; align-items:center; gap:10px;">
        <img id="user-avatar" class="user-avatar" src="" alt="User" style="display:none; width:32px; height:32px; border-radius:50%;" />
        <button id="google-logout-btn" class="icon-btn" title="로그아웃" style="display:none;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
"""
html = html.replace('</header>', new_user_profile + '\n    </header>')

html = html.replace('<div id="extract-section">', '<div id="extract-section" class="hidden">\n      <div style="margin-bottom:1rem;"><button id="close-extract-btn" class="sample-btn">← 단원 목록으로 돌아가기</button></div>')

html = html.replace('<div class="download-section">', '<div class="download-section hidden">')

save_modal_str = """    <!-- Save Modal -->
    <div id="save-modal" class="api-modal hidden">
      <div class="modal-content">
        <h3 style="margin-top:0;">단어장에 저장하기</h3>
        <p style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:1.5rem;">생성된 단어 세트를 내 라이브러리에 저장합니다.</p>
        
        <div style="margin-bottom:1rem;">
          <label style="display:block; font-size:0.9rem; font-weight:600; margin-bottom:0.5rem;">책 (단어장 그룹) 선택</label>
          <select id="save-book-sel" class="text-input" style="margin-bottom:0.5rem; display:none;">
            <option value="">-- 기존 단어장 선택 --</option>
          </select>
          <input type="text" id="save-book-new" class="text-input" placeholder="또는 새 단어장 이름 입력 (예: 토플 단어장)" />
        </div>

        <div style="margin-bottom:1rem;">
          <label style="display:block; font-size:0.9rem; font-weight:600; margin-bottom:0.5rem;">단원 (챕터) 이름</label>
          <input type="text" id="save-chapter-new" class="text-input" placeholder="예: Day 1, Chapter 5..." />
        </div>

        <div class="modal-actions" style="display:flex; gap:10px; margin-top:2rem;">
          <button id="save-cancel-btn" class="sample-btn" style="flex:1;">취소</button>
          <button id="save-confirm-btn" class="download-btn download-primary" style="flex:1; padding: 0.8rem;">저장하기</button>
        </div>
      </div>
    </div>"""
html = html.replace(save_modal_str, "")

html = html.replace('<div id="library-section" class="hidden">', '<div id="library-section">')

old_view = """<div id="view-words" class="hidden">
          <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <span id="word-count-badge" class="badge badge-ai">0 단어</span>
            <button id="export-library-csv-btn" class="download-btn download-primary" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">"""

new_view = """<div id="view-words" class="hidden">
          <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <span id="word-count-badge" class="badge badge-ai">0 단어</span>
            <div style="display:flex; gap:10px;">
              <button id="open-extract-btn" class="generate-btn" style="width:auto; padding: 0.6rem 1.2rem; font-size: 0.9rem;">✨ 새 단어 추출/추가하기</button>
              <button id="export-library-csv-btn" class="download-btn download-primary" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">"""
html = html.replace(old_view, new_view)

old_export_btn_end = """CSV 내보내기
            </button>
          </div>
          <table"""

new_export_btn_end = """CSV 내보내기
              </button>
            </div>
          </div>
          <table"""
html = html.replace(old_export_btn_end, new_export_btn_end)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("done")
