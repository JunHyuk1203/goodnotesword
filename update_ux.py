import re

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# 1. modal-save-btn
css = re.sub(r'(\.modal-save-btn\s*\{)[\s\S]*?(\})', r'\1\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: 8px 20px;\n  border-radius: 10px;\n  border: none;\n  background: var(--primary);\n  color: #fff;\n  cursor: pointer;\n  font-weight: 600;\n}\n.modal-save-btn:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n  filter: grayscale(100%);\n}', css)

# 2. Modals and elements radius
css = re.sub(r'(\.modal-box \{[^}]+border-radius:\s*)24px;', r'\g<1>20px;', css)
css = re.sub(r'(\.modal-screen-content \{[^}]+border-radius:\s*)24px\s+24px\s+0\s+0;', r'\g<1>20px 20px 0 0;', css)
css = re.sub(r'(\.text-input\s*\{[^}]+border-radius:\s*)[^;]+;', r'\g<1>10px;', css)
css = re.sub(r'(\.generate-btn\s*\{[^}]+border-radius:\s*)[^;]+;', r'\g<1>10px;', css)
css = re.sub(r'(\.circle-action-btn\s*\{[^}]+border-radius:\s*)[^;]+;', r'\g<1>10px;', css)
css = re.sub(r'(\.word-card-pos\s*\{[^}]+border-radius:\s*)[^;]+;', r'\g<1>6px;', css)

# 3. Typography
css = re.sub(r'(\.word-card-word\s*\{[^}]+letter-spacing:\s*)-0\.02em;', r'\g<1>-0.015em;', css)

# 4. Toast CSS
toast_css = '''
.custom-toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%) translateY(20px) scale(0.95);
  background: rgba(40,40,45,0.9);
  color: white;
  padding: 12px 24px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  z-index: 10000;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  backdrop-filter: blur(10px);
}
.custom-toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
}
body[data-theme="light"] .custom-toast {
  background: rgba(255,255,255,0.95);
  color: #111;
}
'''
if '.custom-toast' not in css:
    css += toast_css

# 5. Micro-interactions
css = re.sub(r'(\.generate-btn:active\s*\{)', r'\1\n  transform: scale(0.97);\n  transition: transform 0.15s cubic-bezier(0.25, 1, 0.5, 1);', css)
css = re.sub(r'(\.test-mode-btn:active\s*\{)', r'\1\n  transform: scale(0.97);\n  transition: transform 0.15s cubic-bezier(0.25, 1, 0.5, 1);', css)
css = re.sub(r'(\.circle-action-btn:active\s*\{)', r'\1\n  transform: scale(0.97);\n  transition: transform 0.15s cubic-bezier(0.25, 1, 0.5, 1);', css)

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Custom Toast Logic
toast_js = '''
function showToast(msg) {
  let toast = document.getElementById('custom-toast-el');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'custom-toast-el';
    toast.className = 'custom-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  if (toast.timer) clearTimeout(toast.timer);
  toast.timer = setTimeout(() => toast.classList.remove('show'), 2500);
}
'''
if 'showToast' not in js:
    js += toast_js

# 2. Test Trigger condition
js = js.replace("if (currentLoadedWords.length < 2) {\\n      alert('테스트에는 최소 2개 이상의 단어가 필요합니다.');", "if (currentLoadedWords.length < 1) {\\n      showToast('테스트를 진행할 단어가 없습니다.');")
js = js.replace("if (currentLoadedWords.length < 2) {\n      alert('테스트에는 최소 2개 이상의 단어가 필요합니다.');", "if (currentLoadedWords.length < 1) {\n      showToast('테스트를 진행할 단어가 없습니다.');")

# 3. showPrompt logic
prompt_replacement = '''function showPrompt(message, defaultVal = '') {
  return new Promise(resolve => {
    const modal = $('custom-prompt-modal');
    const msgEl = $('custom-prompt-message');
    const input = $('custom-prompt-input');
    const okBtn = $('custom-prompt-ok');
    const cancelBtn = $('custom-prompt-cancel');
    
    msgEl.textContent = message;
    input.value = defaultVal;
    okBtn.disabled = !defaultVal.trim();
    
    modal.classList.remove('hidden');
    setTimeout(() => input.focus(), 50);
    
    const cleanup = (val) => {
      modal.classList.add('hidden');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      input.removeEventListener('keydown', onKey);
      input.removeEventListener('input', onInput);
      resolve(val);
    };
    
    const onOk = () => { if (!okBtn.disabled) cleanup(input.value.trim() || null); };
    const onCancel = () => cleanup(null);
    const onKey = (e) => { if (e.key === 'Enter') onOk(); if (e.key === 'Escape') onCancel(); };
    const onInput = () => { okBtn.disabled = !input.value.trim(); };
    
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    input.addEventListener('keydown', onKey);
    input.addEventListener('input', onInput);
  });
}'''

js = re.sub(r'function showPrompt\(message,\s*defaultVal\s*=\s*\'\'\)\s*\{[\s\S]*?\}\s*\}', prompt_replacement, js)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('Updated JS and CSS!')
