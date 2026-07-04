import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

new_call = """
    // renderResults(generatedData, deduped.length);
    await autoSaveToLibrary(generatedData);
"""
js = js.replace('renderResults(generatedData, deduped.length);', new_call)

auto_save_fn = """
// ─── Auto Save ─────────────────────────────────────────────────────────────
async function autoSaveToLibrary(data) {
  if (!currentUser || !selectedBookId || !selectedChapterId) {
    alert('저장할 단어장 경로를 찾지 못했습니다. 먼저 단원(챕터)을 선택해주세요.');
    return;
  }
  try {
    const { collection, doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
    
    // progress ui show
    const progressSection = document.getElementById('progress-section');
    if (progressSection) progressSection.classList.remove('hidden');
    setProgress(90, '단어장에 자동 저장 중...', '잠시만 기다려주세요');
    
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const wordRef = doc(collection(db, `users/${currentUser.uid}/books/${selectedBookId}/chapters/${selectedChapterId}/words`));
      await setDoc(wordRef, { 
        front: item.front, 
        back: item.back,
        order: i 
      });
    }

    setProgress(100, '저장 완료!', '단어장으로 이동합니다.');
    
    setTimeout(() => {
      // Reset extraction inputs
      const vocabInput = document.getElementById('vocab-input');
      if (vocabInput) vocabInput.value = '';
      
      // Hide extraction UI
      document.getElementById('extract-section').classList.add('hidden');
      if (progressSection) progressSection.classList.add('hidden');
      document.getElementById('view-words').classList.remove('hidden');
      
      // Reload chapter words
      if (typeof loadWords === 'function') {
        const crumbChapterName = document.getElementById('crumb-chapter-name');
        loadWords(selectedBookId, selectedChapterId, crumbChapterName ? crumbChapterName.textContent : '단원');
      }
    }, 1000);
  } catch(err) {
    console.error(err);
    alert('자동 저장 중 오류 발생: ' + err.message);
  }
}
"""
js += "\n" + auto_save_fn

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("done")
