import re

with open('app.js', 'a', encoding='utf-8') as f:
    f.write("""
// Extraction UI toggle
const openExtractBtn = document.getElementById('open-extract-btn');
const closeExtractBtn = document.getElementById('close-extract-btn');
const extractSection = document.getElementById('extract-section');
const viewWordsSection = document.getElementById('view-words');

openExtractBtn?.addEventListener('click', () => {
  viewWordsSection.classList.add('hidden');
  extractSection.classList.remove('hidden');
});

closeExtractBtn?.addEventListener('click', () => {
  extractSection.classList.add('hidden');
  viewWordsSection.classList.remove('hidden');
});
""")

print("done")
