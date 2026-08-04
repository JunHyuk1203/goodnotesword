import re

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Fix touch-action on swipe wrap
css = css.replace(
    '''  overflow: hidden;
  touch-action: pan-y;
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s;''',
    '''  overflow: hidden;
  touch-action: none;
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s;'''
)

# In case the first replace missed because of spacing, let's just replace the exact line:
css = css.replace('touch-action: pan-y;', 'touch-action: none;')

# Fix body.shorts-mode-active to be fixed to viewport and disable touch-action
css = css.replace(
    '''body.shorts-mode-active {
  overflow: hidden;
  min-height: 0;
  height: 100svh;
}''',
    '''body.shorts-mode-active {
  overflow: hidden;
  min-height: 0;
  height: 100svh;
  position: fixed;
  width: 100%;
  touch-action: none;
}'''
)

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Shorts mode scroll fix applied")
