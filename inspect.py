import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

m = re.search(r'const\s+(\w+)\s*=\s*document\.getElementById\([\'\"]generate-btn[\'\"]\)', js)
if m:
    print(f"generateBtn is named: {m.group(1)}")
else:
    print("generateBtn NOT FOUND")
    
m2 = re.search(r'const\s+(\w+)\s*=\s*document\.getElementById\([\'\"]result-section[\'\"]\)', js)
if m2:
    print(f"resultSection is named: {m2.group(1)}")

