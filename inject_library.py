import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# The user profile is needed in header
new_user_profile = """
      <div class="user-profile" style="position:absolute; right:20px; top:20px; display:flex; align-items:center; gap:10px;">
        <img id="user-avatar" class="user-avatar" src="" alt="User" style="display:none; width:32px; height:32px; border-radius:50%;" />
        <button id="google-logout-btn" class="icon-btn" title="로그아웃" style="display:none;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
"""
if '<div class="user-profile"' not in html:
    html = html.replace('</header>', new_user_profile + '\n    </header>')

# Wrap everything from <div class="progress-bar-wrap">... <section id="result-section"> into extract-section
# Wait, actually extract-section should wrap step-card input and result-section.
# Let's just create extract-section explicitly.
if '<div id="extract-section"' not in html:
    # Wrap Step 1, Step 2, and Result Section
    html = html.replace('<!-- Step 1: Input -->', '<div id="extract-section" class="hidden">\n      <div style="margin-bottom:1rem;"><button id="close-extract-btn" class="sample-btn">← 단원 목록으로 돌아가기</button></div>\n      <!-- Step 1: Input -->')
    # Close extract-section before Error
    html = html.replace('<!-- Error -->', '</div> <!-- /EXTRACT SECTION -->\n\n    <!-- Error -->')

# Hide download section
html = html.replace('<div class="download-section">', '<div class="download-section hidden">')

library_html = """
    <!-- LIBRARY SECTION -->
    <div id="library-section">
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
            <div style="display:flex; gap:10px;">
              <button id="open-extract-btn" class="generate-btn" style="width:auto; padding: 0.6rem 1.2rem; font-size: 0.9rem;">✨ 새 단어 추출/추가하기</button>
              <button id="export-library-csv-btn" class="download-btn download-primary" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px; height:16px; margin-right:4px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                CSV 내보내기
              </button>
            </div>
          </div>
          <table class="preview-table">
            <thead><tr><th>#</th><th>앞면 (질문)</th><th>뒷면 (정답)</th></tr></thead>
            <tbody id="library-words-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>
"""
if 'LIBRARY SECTION' not in html:
    html = html.replace('<!-- Error -->', library_html + '\n\n    <!-- Error -->')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("done")
