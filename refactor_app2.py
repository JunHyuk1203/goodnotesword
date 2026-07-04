import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Variable hoisting
js = js.replace('let selectedBookId = null;', '')
js = js.replace('let selectedChapterId = null;', '')

js = js.replace('let currentUser = null;', '''let currentUser = null;
let selectedBookId = null;
let selectedChapterId = null;
''')

# 2. Add open/close extract UI logic and wire the new [+ 추출하기] button
# We can inject this right after `// Navigation` block.
extract_ui_logic = """
// Extraction UI toggle
const openExtractBtn = document.getElementById('open-extract-btn');
const closeExtractBtn = document.getElementById('close-extract-btn');

openExtractBtn?.addEventListener('click', () => {
  document.getElementById('view-words').classList.add('hidden');
  document.getElementById('extract-section').classList.remove('hidden');
});

closeExtractBtn?.addEventListener('click', () => {
  document.getElementById('extract-section').classList.add('hidden');
  document.getElementById('view-words').classList.remove('hidden');
});
"""

# Replace the old Navigation block
old_nav_regex = r'// Navigation.*?secExtract\.classList\.add\(\'hidden\'\);\s*if \(currentUser\) loadBooks\(\);\s*\}\);'
js = re.sub(old_nav_regex, extract_ui_logic, js, flags=re.DOTALL)

# 3. Modify handleGenerate ending
# Find resultSection.classList.remove('hidden');
auto_save_logic = """
    // --- Auto Save to Firestore ---
    if (!currentUser || !selectedBookId || !selectedChapterId) {
      alert('저장할 경로를 찾지 못했습니다. 앱을 새로고침해주세요.');
      return;
    }

    try {
      setProgress(90, '단어장에 저장 중...', '거의 다 되었습니다');
      
      const { collection, doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
      
      for (let i = 0; i < parsedData.length; i++) {
        const item = parsedData[i];
        const wordRef = doc(collection(db, `users/${currentUser.uid}/books/${selectedBookId}/chapters/${selectedChapterId}/words`));
        await setDoc(wordRef, { 
          front: item.front, 
          back: item.back,
          order: i 
        });
      }

      setProgress(100, '저장 완료!', '단어장으로 돌아갑니다.');
      
      setTimeout(() => {
        // Reset inputs
        vocabInput.value = '';
        if (imagePreviews) imagePreviews.classList.add('hidden');
        if (dropzoneContent) dropzoneContent.style.display = 'flex';
        
        // Hide extract section, show words
        document.getElementById('extract-section').classList.add('hidden');
        progressSection.classList.add('hidden');
        document.getElementById('view-words').classList.remove('hidden');
        
        // Reload words for this chapter
        loadWords(selectedBookId, selectedChapterId, document.getElementById('crumb-chapter-name').textContent);
      }, 1000);

    } catch(err) {
      console.error(err);
      alert('저장 중 오류 발생: ' + err.message);
    }
    // ---------------------------------
"""

# Replace resultSection display with auto_save
js = js.replace("resultSection.classList.remove('hidden');\n    resultSection.scrollIntoView({ behavior: 'smooth' });", auto_save_logic)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("done")
