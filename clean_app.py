import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Clean navLibrary and navExtract logic
js = re.sub(r'// Navigation.*?secExtract\.classList\.add\(\'hidden\'\);\s*(?:if \(currentUser\) loadBooks\(\);)?\s*\}\);', '', js, flags=re.DOTALL)

# 2. Clean saveModal logic
js = re.sub(r'// Save Modal.*?saveConfirmBtn\.textContent = \'저장하기\';\s*\}\s*\}\);', '', js, flags=re.DOTALL)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("done")
