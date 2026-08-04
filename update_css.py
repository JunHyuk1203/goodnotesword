import re

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# 1. body typography
css = css.replace(
    '''body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;''',
    '''body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
  line-height: 1.47;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;'''
)

# 2. Large title letter-spacing
css = css.replace('letter-spacing: 0.37px;', 'letter-spacing: -0.022em;')

# 3. .ios-nav-title-inline
css = css.replace(
    '''.ios-nav-title-inline {
  font-family: var(--font-sf);
  font-size: 17px;
  font-weight: 600; /* Semibold = Headline */
  color: var(--text);
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}''',
    '''.ios-nav-title-inline {
  font-family: var(--font-sf);
  font-size: 17px;
  font-weight: 600; /* Semibold = Headline */
  letter-spacing: -0.021em;
  color: var(--text);
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}'''
)

# 4. .word-card-section-label
css = css.replace(
    '''.word-card-section-label {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 400;
  margin-right: 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}''',
    '''.word-card-section-label {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 400;
  margin-right: 8px;
  text-transform: uppercase;
  letter-spacing: 0em;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}'''
)

# 5. Box-shadows & Borders
css = css.replace(
    '''box-shadow: 0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03);''',
    '''box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);'''
)
css = css.replace(
    '''box-shadow: 0 4px 12px rgba(0,0,0,0.2);''',
    '''box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35), 0 1px 4px rgba(0, 0, 0, 0.2);'''
)
css = css.replace(
    '''border: 1px solid rgba(0,0,0,0.08);''',
    '''border: 0.5px solid rgba(0, 0, 0, 0.12);'''
)
css = css.replace(
    '''border-color: rgba(255,255,255,0.12);''',
    '''border-color: rgba(255, 255, 255, 0.15);'''
)
css = css.replace(
    '''--shadow-card:     0 8px 30px rgba(0,0,0,0.12);''',
    '''--shadow-card:     0 12px 32px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);'''
)
css = css.replace(
    '''--shadow-card:     0 10px 40px rgba(0,0,0,0.4);''',
    '''--shadow-card:     0 12px 32px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);'''
)

# 6. Corner Radius
css = css.replace(
    '''border-radius: 20px 20px 0 0;''',
    '''border-radius: 24px 24px 0 0;'''
)
css = css.replace(
    '''.key-status {
  font-size: 13px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 8px;''',
    '''.key-status {
  font-size: 13px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 10px;'''
)
css = css.replace(
    '''.test-mode-btn {
  font-family: var(--font-sans);
  font-size: 17px;
  padding: 10px 12px;
  outline: none;
  cursor: pointer;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid transparent;
  border-radius: 12px;''',
    '''.test-mode-btn {
  font-family: var(--font-sans);
  font-size: 17px;
  padding: 10px 12px;
  outline: none;
  cursor: pointer;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid transparent;
  border-radius: 10px;'''
)

# 7. Safe area
css = css.replace(
    '''padding-bottom: 2rem;''',
    '''padding-bottom: max(2rem, env(safe-area-inset-bottom, 16px));'''
)
css = css.replace(
    '''padding-bottom: 40px;''',
    '''padding-bottom: max(40px, env(safe-area-inset-bottom, 16px));'''
)

# 8. Add empty state styles
empty_state_css = '''
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
  width: 100%;
}
.empty-state-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.8;
}
.empty-state-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 8px 0;
  letter-spacing: -0.015em;
}
.empty-state-desc {
  font-size: 14px;
  margin: 0;
  line-height: 1.47;
}
'''
if '.empty-state {' not in css:
    css += empty_state_css

# 9. Micro interactions
css = css.replace(
    '''.circle-action-btn:active {
  transform: scale(0.97);
  transition: transform 0.15s cubic-bezier(0.25, 1, 0.5, 1);
}''',
    '''.circle-action-btn:active {
  transform: scale(0.97);
  opacity: 0.85;
  transition: transform 0.12s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.12s ease;
}'''
)
css = css.replace(
    '''.test-mode-btn:active {
  transform: scale(0.97);
  transition: transform 0.15s cubic-bezier(0.25, 1, 0.5, 1);
}''',
    '''.test-mode-btn:active {
  transform: scale(0.97);
  opacity: 0.85;
  transition: transform 0.12s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.12s ease;
}'''
)
css = css.replace(
    '''.generate-btn:active {
  transform: scale(0.97);
  transition: transform 0.15s cubic-bezier(0.25, 1, 0.5, 1);
}''',
    '''.generate-btn:active,
.modal-save-btn:active,
.word-card-edit-btn:active,
.word-card-delete-btn:active,
.quiz-choice-btn:active,
.flash-correct-btn:active,
.flash-wrong-btn:active {
  transform: scale(0.97);
  opacity: 0.85;
  transition: transform 0.12s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.12s ease;
}'''
)
css = css.replace(
    '''.word-card:active {
  transform: scale(0.97);
  transition: transform 0.15s cubic-bezier(0.25, 1, 0.5, 1);
}''',
    '''.word-card:active {
  transform: scale(0.97);
  opacity: 0.85;
  transition: transform 0.12s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.12s ease;
}'''
)

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("CSS updated successfully")
