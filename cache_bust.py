# -*- coding: utf-8 -*-
import uuid
import re
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

v = str(uuid.uuid4())[:8]
html = re.sub(r'app\.js\?v=[^\"\']+', f'app.js?v={v}', html)
html = re.sub(r'style\.css\?v=[^\"\']+', f'style.css?v={v}', html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Updated cache busters to ' + v)
