import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

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
    js = js.replace('function escapeHTML(s) {', highlight_func + '\nfunction escapeHTML(s) {')

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("JS bug fixed")
