# -*- coding: utf-8 -*-
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Move the unhiding/reflow to the TOP of showTraceCard
old_block = """  // Animate in
  const traceScreen = document.getElementById('test-trace');
  traceScreen.classList.remove('card-slide-in');
  void traceScreen.offsetWidth;
  traceScreen.classList.add('card-slide-in');"""

js = js.replace(old_block, "")
js = js.replace("function showTraceCard() {\n  if (testIndex >= testWords.length) {", """function showTraceCard() {
  const traceScreen = document.getElementById('test-trace');
  traceScreen.classList.remove('card-slide-in');
  void traceScreen.offsetWidth;
  traceScreen.classList.add('card-slide-in');
  
  if (testIndex >= testWords.length) {""")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("Updated order")
