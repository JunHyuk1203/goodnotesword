import re

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# 1. Symmetry & Grid Alignment
css = re.sub(r'(\.modal-box \{[^}]+)border-radius:\s*14px;', r'\1border-radius: 24px;', css)
css = re.sub(r'(\.modal-box \{[^}]+)padding:\s*24px\s*20px;', r'\1padding: 24px;', css)

css = re.sub(r'(\.ios-nav-action-btn \{)', r'\1\n  transform-origin: center;', css)
css = re.sub(r'(\.word-card-edit-btn,\s*\.word-card-delete-btn \{)', r'\1\n  transform-origin: center;', css)

# 2. Visual Weight & Balance
css = re.sub(r'(\.word-card-pos \{[^}]+)font-weight:\s*500;', r'\1font-weight: 400;', css)
css = re.sub(r'(\.word-card-pos \{[^}]+)font-size:\s*13px;', r'\1font-size: 12px;', css)
css = re.sub(r'(\.word-card-pos \{[^}]+)padding:\s*2px\s*8px;', r'\1padding: 2px 6px;', css)

css = css.replace('.hide-toggle-btn {\n  background: transparent;', '.hide-toggle-btn {\n  background: transparent;\n  flex: 1;')

# Dark mode overrides for shadow/border
css = re.sub(r'(body\[data-theme="dark"\]\s*\.word-card\s*\{[^}]+)border-color:\s*rgba\(255,\s*255,\s*255,\s*0\.05\);', r'\1border-color: rgba(255,255,255,0.12);\n  box-shadow: 0 4px 12px rgba(0,0,0,0.2);', css)

# 4. Micro-interactions
hide_rules = '''
/* Hide state animations */
.word-section-word, .word-section-meaning, .word-section-example, .word-section-related {
  transition: filter 0.35s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease, transform 0.35s cubic-bezier(0.25, 1, 0.5, 1);
}
body.hide-word-state .word-section-word,
body.hide-meaning-state .word-section-meaning,
body.hide-example-state .word-section-example,
body.hide-related-state .word-section-related {
  filter: blur(8px) grayscale(100%);
  opacity: 0.15;
  user-select: none;
  pointer-events: none;
  transform: scale(0.98);
}
'''
if 'body.hide-word-state .word-section-word' not in css:
    css += hide_rules

css = re.sub(r'(\.ios-nav-action-btn:active\s*\{[^}]+)\}', r'\1\n  transform: scale(0.94);\n  transition: transform 0.15s cubic-bezier(0.25, 1, 0.5, 1);\n}', css)
css = re.sub(r'(\.hide-toggle-btn:active\s*\{[^\}]*?)\}', r'\1\n  transform: scale(0.94);\n  transition: transform 0.15s cubic-bezier(0.25, 1, 0.5, 1);\n}', css)

# 5. Typography Polish
css = re.sub(r'(\.word-card-word\s*\{[^}]+)letter-spacing:\s*-0\.3px;', r'\1letter-spacing: -0.02em;', css)
css = re.sub(r'(\.word-card-example\s*\{)', r'\1\n  line-height: 1.5;', css)
css = re.sub(r'(--text-secondary:\s*)[^;]+;', r'\g<1>rgba(60, 60, 67, 0.6);', css, count=1)

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)
print('Done!')
