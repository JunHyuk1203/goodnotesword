import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Insert Global Navigation after </header>
nav_html = """
    <!-- Global Navigation -->
    <div class="global-nav" style="display: flex; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-light); padding-bottom: 1rem;">
      <button class="nav-btn active" id="nav-extract-btn" style="background: var(--primary); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s;">✨ AI 추출 및 변환</button>
      <button class="nav-btn" id="nav-library-btn" style="background: transparent; color: var(--text-light); border: none; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s;">📚 내 단어장 (라이브러리)</button>
    </div>
    
    <!-- EXTRACT SECTION -->
    <div id="extract-section">
"""
html = html.replace('    </header>\n\n\n    <!-- Step 2', '    </header>\n\n' + nav_html + '    <!-- Step 2')
if 'nav_html' not in html and '<!-- EXTRACT SECTION -->' not in html:
    # Try alternate replacement
    html = html.replace('    </header>\n\n    <!-- Step 2', '    </header>\n\n' + nav_html + '    <!-- Step 2')


# 2. Update Download buttons to include Save to Library
download_btns = """<div class="download-buttons">
          <button id="save-library-btn" class="download-btn download-primary" style="background: linear-gradient(135deg, #10b981, #059669); margin-right: 8px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            단어장에 저장
          </button>
          <button id="download-csv-btn" class="download-btn download-secondary">"""
html = html.replace('<div class="download-buttons">\n          <button id="download-csv-btn" class="download-btn download-primary">', download_btns)


# 3. Close EXTRACT SECTION and append LIBRARY SECTION & SAVE MODAL
library_html = """
      </div>
    </section>
    </div> <!-- /EXTRACT SECTION -->

    <!-- LIBRARY SECTION -->
    <div id="library-section" class="hidden">
      <!-- Library Content -->
      <div id="library-auth-prompt" class="card text-center">
        <h2 style="font-size: 1.4rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-dark);">📚 단어장 라이브러리</h2>
        <p style="color: var(--text-light); margin-bottom: 1.5rem;">내 단어장을 관리하고 기기 간에 동기화하려면 구글로 로그인하세요.</p>
        <button id="google-login-btn" class="generate-btn" style="margin: 0 auto; width: auto; padding: 0.8rem 2rem; background: white; color: var(--text-dark); border: 1px solid var(--border-light); box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <svg style="width: 20px; height: 20px; margin-right: 8px; vertical-align: middle;" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google 로그인
        </button>
      </div>

      <div id="library-content" class="card hidden">
        <div class="library-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-light);">
          <h2 class="step-title" style="margin: 0;">📚 내 단어장</h2>
          <div style="display: flex; gap: 10px; align-items: center;">
            <img id="user-avatar" src="" alt="User" style="width: 32px; height: 32px; border-radius: 50%; display: none;">
            <button id="google-logout-btn" class="sample-btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">로그아웃</button>
          </div>
        </div>

        <div id="library-breadcrumb" class="sample-row" style="margin-bottom: 1.5rem; font-size: 0.95rem;">
          <span id="crumb-home" style="cursor: pointer; color: var(--primary); font-weight: 600;">🏠 라이브러리 홈</span>
          <span id="crumb-book" class="hidden" style="color: var(--text-light);"> > <span id="crumb-book-name" style="cursor: pointer; color: var(--primary); font-weight: 600;"></span></span>
          <span id="crumb-chapter" class="hidden" style="color: var(--text-light);"> > <span id="crumb-chapter-name" style="color: var(--text-dark); font-weight: 600;"></span></span>
        </div>

        <div id="view-books" class="library-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;"></div>
        <div id="view-chapters" class="library-grid hidden" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;"></div>
        
        <div id="view-words" class="hidden">
          <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <span id="word-count-badge" class="badge badge-ai">0 단어</span>
            <button id="export-library-csv-btn" class="download-btn download-primary" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px; height:16px; margin-right:4px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              CSV 내보내기
            </button>
          </div>
          <table class="preview-table">
            <thead><tr><th>#</th><th>앞면 (질문)</th><th>뒷면 (정답)</th></tr></thead>
            <tbody id="library-words-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Save Modal -->
    <div id="save-modal" class="api-modal hidden">
      <div class="modal-content">
        <h2 class="modal-title">단어장에 저장하기</h2>
        
        <div class="input-group" style="margin-top:1.5rem; text-align: left;">
          <label class="modal-label" style="display:block; margin-bottom:0.5rem; font-weight:600; color:var(--text-dark); font-size:0.9rem;">단어장 (책) 선택</label>
          <select id="save-book-sel" class="api-key-input" style="margin-bottom: 0.5rem; width:100%; display:none;"></select>
          <input type="text" id="save-book-new" class="api-key-input" placeholder="새 단어장 이름 입력" style="width:100%; box-sizing:border-box;" />
        </div>

        <div class="input-group" style="margin-top:1.5rem; text-align: left;">
          <label class="modal-label" style="display:block; margin-bottom:0.5rem; font-weight:600; color:var(--text-dark); font-size:0.9rem;">단원 (챕터) 입력</label>
          <input type="text" id="save-chapter-new" class="api-key-input" placeholder="예: Day 1, Chapter 5..." style="width:100%; box-sizing:border-box;" />
        </div>

        <p class="api-key-desc" style="margin-top:1.5rem;">선택한 경로에 추출된 단어들을 안전하게 저장합니다.</p>
        
        <div class="modal-actions" style="display:flex; gap:10px; margin-top:2rem;">
          <button id="save-cancel-btn" class="sample-btn" style="flex:1;">취소</button>
          <button id="save-confirm-btn" class="download-btn download-primary" style="flex:1; padding: 0.8rem;">저장하기</button>
        </div>
      </div>
    </div>
"""
html = html.replace('      </div>\n    </section>\n\n    <!-- API Modal', library_html + '\n\n    <!-- API Modal')

# 4. Change script to module
html = html.replace('<script src="app.js?v=12"></script>', '<script type="module" src="app.js?v=13"></script>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("done")
