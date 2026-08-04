with open('style.css', 'a', encoding='utf-8') as f:
    f.write('''
/* ==========================================================================
   Auth Screen (Apple HIG Style)
   ========================================================================== */

.auth-screen {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  background: var(--bg-main);
}
.auth-screen.hidden {
  display: none !important;
}

.auth-container {
  width: 90%;
  max-width: 400px;
  background: var(--bg-card);
  border: 0.5px solid var(--border);
  border-radius: 24px;
  padding: 32px 24px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
  position: relative;
}

.auth-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text-main);
  font-family: 'Jua', 'Nunito', sans-serif;
}
.auth-subtitle {
  font-size: 15px;
  color: var(--text-sub);
}

.auth-tabs {
  display: flex;
  background: var(--bg-hover);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 24px;
}
.auth-tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  padding: 10px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-sub);
  cursor: pointer;
  transition: all 0.3s ease;
}
.auth-tab-btn.active {
  background: var(--bg-card);
  color: var(--text-main);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-input {
  width: 100%;
  background: var(--bg-main);
  border: 1px solid var(--border);
  color: var(--text-main);
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}
.auth-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.2);
}

.auth-btn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  transition: opacity 0.2s, transform 0.1s;
}
.auth-btn:active {
  transform: scale(0.98);
}
.auth-btn.primary-btn {
  background: var(--accent);
  color: #fff;
  margin-top: 8px;
}
.auth-btn.google-btn {
  background: #fff;
  color: #3c4043;
  border: 1px solid #dadce0;
}
[data-theme="dark"] .auth-btn.google-btn {
  background: #3c4043;
  color: #fff;
  border: 1px solid #5f6368;
}

.auth-divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: var(--text-sub);
  font-size: 13px;
  margin: 8px 0;
}
.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--border);
}
.auth-divider span {
  padding: 0 10px;
}

.auth-text-btn {
  background: transparent;
  border: none;
  color: var(--accent);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 8px;
}
.auth-text-btn:hover {
  text-decoration: underline;
}

.auth-error {
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 59, 48, 0.1);
  color: var(--danger);
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  border: 1px solid rgba(255, 59, 48, 0.2);
}
''')
print("Added CSS for Auth")
