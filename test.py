import json
import re

raw_json = '''[{"word":"genetic","pos":"형","pronunciation":"[dʒənétik]","meaning":"유전(학)의","examples":["I want to become a genetic engineer and develop tools and methods that might be used to treat rare diseases."],"related":["gene [명]: 유전자","genetics [명]: 유전학","genetically [부]: 유전적으로","generic [형]: 일반적인, 포괄적인","genetically modified [형]: 유전자 조작의"],"etymology":["gene(유전자)","ic(형용사 접미사)"]}]'''

data = json.loads(raw_json)
item = data[0]

def ensureStringArray(arr):
    if isinstance(arr, list):
        return [str(x) for x in arr]
    return []

parts = []
if item.get('meaning'):
    pos = item.get('pos', '')
    parts.append(f'📌 뜻\n{pos + " " if pos else ""}{item["meaning"]}')

etys = ensureStringArray(item.get('etymology'))
if len(etys) > 0:
    parts.append('🧩 어원\n• ' + ' + '.join(etys))

back = '\n\n'.join(parts)
print("--- BACK ---")
print(back)

etymology = []
sections = back.split('\n\n')
for section in sections:
    trimmed = section.strip()
    if trimmed.startswith('🧩 어원'):
        # JS: trimmed.replace(/^🧩 어원\n?/, '').replace(/^•\s*/, '').split(/\s*\+\s*/)
        val = re.sub(r'^🧩 어원\n?', '', trimmed)
        val = re.sub(r'^•\s*', '', val)
        etymology = [s.strip() for s in re.split(r'\s*\+\s*', val) if s.strip()]

print("--- PARSED ---")
print(etymology)
