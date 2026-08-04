import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

auth_html = '''
    <!-- ========== AUTH SCREEN ========== -->
    <div id="auth-screen" class="auth-screen hidden">
      <div class="auth-container">
        <div class="auth-header">
          <div class="bg-orb orb-1" style="width: 150px; height: 150px; top: -50px; left: -50px;"></div>
          <h1 class="auth-title">단어장 스터디</h1>
          <p class="auth-subtitle">학습을 시작하려면 로그인하세요</p>
        </div>
        
        <div class="auth-tabs">
          <button class="auth-tab-btn active" id="tab-login">로그인</button>
          <button class="auth-tab-btn" id="tab-signup">회원가입</button>
        </div>

        <form id="auth-form" class="auth-form" onsubmit="return false;">
          <div class="input-group">
            <input type="email" id="auth-email" class="auth-input" placeholder="이메일" required />
          </div>
          <div class="input-group">
            <input type="password" id="auth-password" class="auth-input" placeholder="비밀번호" required />
          </div>
          
          <div class="auth-actions">
            <button type="submit" id="auth-submit-btn" class="auth-btn primary-btn">로그인</button>
          </div>

          <div class="auth-divider"><span>또는</span></div>
          
          <button type="button" id="auth-google-btn" class="auth-btn google-btn">
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
            Google로 계속하기
          </button>
          
          <button type="button" id="auth-reset-btn" class="auth-text-btn">비밀번호를 잊으셨나요?</button>
        </form>
        
        <div id="auth-error" class="auth-error hidden"></div>
      </div>
    </div>
'''

html = html.replace('<!-- ========== LIBRARY (단어장) ========== -->', auth_html + '\n    <!-- ========== LIBRARY (단어장) ========== -->')

settings_account_html = '''
        <!-- Account Section -->
        <div class="word-card-related-group" style="padding:0; background:transparent;">
          <div class="word-card-section-label" style="padding: 0 12px;">계정</div>
          <div style="background:var(--bg-card); border:0.5px solid var(--border); border-radius:12px; padding:12px 16px; display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="font-size: 20px;">??</span>
              <span id="settings-user-email" style="font-weight: 500; font-size: 15px;">user@example.com</span>
            </div>
            <button id="settings-logout-btn" style="background:var(--danger); color:#fff; border:none; padding:6px 12px; border-radius:16px; font-weight:600; font-size:13px; cursor:pointer;">로그아웃</button>
          </div>
        </div>
'''

html = html.replace('<!-- Theme Section -->', settings_account_html + '\n        <!-- Theme Section -->')

# Make library-content hidden initially
html = html.replace('<div id="library-content">', '<div id="library-content" class="hidden">')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated index.html")
