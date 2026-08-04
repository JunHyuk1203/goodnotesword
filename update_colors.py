import re

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# 1. Update text variables in :root (dark mode)
css = css.replace(
    '''  --text:            #ffffff;
  --text-secondary:  rgba(60, 60, 67, 0.6);
  --text-muted:      rgba(235, 235, 245, 0.3);''',
    '''  --text:            #ffffff;
  --text-primary:    #ffffff;
  --text-secondary:  rgba(255, 255, 255, 0.85);
  --text-tertiary:   rgba(255, 255, 255, 0.60);
  --text-muted:      rgba(235, 235, 245, 0.3);
  --text-accent:     #0A84FF;
  --text-accent-bright: #64D2FF;'''
)

# Update light mode variables
css = css.replace(
    '''  --text:            #000000;
  --text-secondary:  rgba(60, 60, 67, 0.6);
  --text-muted:      rgba(60, 60, 67, 0.3);''',
    '''  --text:            #000000;
  --text-primary:    #000000;
  --text-secondary:  rgba(60, 60, 67, 0.6);
  --text-tertiary:   rgba(60, 60, 67, 0.4);
  --text-muted:      rgba(60, 60, 67, 0.3);
  --text-accent:     #007AFF;
  --text-accent-bright: #007AFF;'''
)

# 2. Pronunciation
css = css.replace(
    '''.word-card-pron {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 400;
  margin-right: 8px;
}''',
    '''.word-card-pron {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 400;
  margin-right: 8px;
}'''
)

# 3. Card Index Number
css = css.replace(
    '''.word-card-num {
  margin-left: auto;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-muted);
}''',
    '''.word-card-num {
  margin-left: auto;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  font-weight: 600;
}'''
)

# 4. Example Sentences
css = css.replace(
    '''.ex-en {
  color: var(--text-secondary);
  font-style: italic;
  font-size: 15px;
}''',
    '''.ex-en {
  color: var(--text-secondary);
  font-style: normal;
  line-height: 1.5;
  font-size: 15px;
}
.ex-en strong {
  color: var(--text-accent-bright);
  font-weight: 700;
}'''
)

# 5. Related words meaning text (add this)
if '.related-item-meaning {' not in css:
    css += '''
.related-item-meaning {
  color: var(--text-secondary);
}'''

# 6. Etymology final word
css = css.replace(
    '''.ety-result {
  font-family: var(--font-rounded);
  font-weight: 900;
  font-size: 1.3rem;
  color: var(--primary-light);''',
    '''.ety-result {
  font-family: var(--font-rounded);
  font-weight: 700;
  font-size: 1.3rem;
  color: var(--text-accent-bright);'''
)

# 7. Hide toggle buttons active state
css = css.replace(
    '''.hide-toggle-btn.active {
  color: var(--primary);
  background: rgba(10, 132, 255, 0.15);
}''',
    '''.hide-toggle-btn.active {
  color: #FFFFFF;
  background: #0A84FF;
  box-shadow: 0 2px 8px rgba(10, 132, 255, 0.4);
}'''
)

css = css.replace(
    '''body[data-theme="light"] .hide-toggle-btn.active {
  color: var(--primary);
  background: rgba(0, 122, 255, 0.12);
}''',
    '''body[data-theme="light"] .hide-toggle-btn.active {
  color: #FFFFFF;
  background: #007AFF;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.4);
}'''
)


with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("CSS updated successfully")

###################################################################

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Update JS to highlight keywords in english examples
# Replace `escapeHTML(match[1])` with highlighting logic
highlight_func = """function highlightExample(enText, keyword) {
  let escaped = escapeHTML(enText);
  if (!keyword) return escaped;
  // Use regex to highlight the keyword, ignoring case.
  try {
    const re = new RegExp(keyword.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'gi');
    return escaped.replace(re, '<strong>$&</strong>');
  } catch(e) {
    return escaped;
  }
}
"""
if "function highlightExample" not in js:
    # Insert near the top, maybe after escapeHTML
    js = js.replace('function escapeHTML(str) {', highlight_func + '\nfunction escapeHTML(str) {')

# For card view
js = js.replace(
    'return `<div class="ex-en">${escapeHTML(match[1])}</div><div class="ex-ko">${escapeHTML(match[2])}</div>`;',
    'return `<div class="ex-en">${highlightExample(match[1], parsed.word)}</div><div class="ex-ko">${escapeHTML(match[2])}</div>`;'
)

js = js.replace(
    'return `<div class="ex-en">${escapeHTML(e)}</div>`;',
    'return `<div class="ex-en">${highlightExample(e, parsed.word)}</div>`;'
)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("JS updated successfully")
