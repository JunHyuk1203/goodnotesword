import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

m = re.search(r'(generateBtn\.addEventListener\(\'click\', async \(\) => \{.*?\}\);)', js, flags=re.DOTALL)
if m:
    lines = m.group(1).split('\n')
    print('\n'.join(lines[-40:])) # print last 40 lines
else:
    print("NOT FOUND")
