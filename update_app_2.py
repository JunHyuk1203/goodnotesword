# -*- coding: utf-8 -*-
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

js = js.replace("const testShort = $('test-short');", "const testShort = $('test-short');\nconst testTrace = $('test-trace');")
js = js.replace("[testSetup, testFlash, testQuiz, testShort, testResult].forEach", "[testSetup, testFlash, testQuiz, testShort, testTrace, testResult].forEach")

if "else if (testMode === 'trace')" not in js:
    js = js.replace("showScreen('short');\n    showShortCard();", "showScreen('short');\n    showShortCard();\n  } else if (testMode === 'trace') {\n    showScreen('trace');\n    showTraceCard();")

js = js.replace("? '📝 주관식' : '알 수 없음'", "? '✏️ 따라쓰기' : data.mode === 'short' ? '📝 주관식' : '알 수 없음'")
js = js.replace("? '📝 4지선다' : '📝 주관식'", "? '📝 4지선다' : data.mode === 'trace' ? '✏️ 따라쓰기' : '📝 주관식'")

if "if (mode === 'trace')" not in js:
    js = js.replace("if (mode === 'quiz' || mode === 'short') {", "if (mode === 'trace') {\n    dirSelect.value = 'word2meaning';\n    dirSelect.disabled = true;\n  } else if (mode === 'quiz' || mode === 'short') {")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
