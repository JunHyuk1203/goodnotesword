import re
import sys

def refactor_to_onsnapshot():
    with open('app.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update imports
    content = content.replace(
        "query, orderBy, serverTimestamp, deleteDoc, updateDoc",
        "query, orderBy, serverTimestamp, deleteDoc, updateDoc, onSnapshot"
    )

    # 2. Update globals (remove reqBooks, add unsubs)
    content = re.sub(r'let reqBooks = 0;\nlet reqChapters = 0;\nlet reqWords = 0;\n', 
                     'let unsubBooks = null;\nlet unsubChapters = null;\nlet unsubWords = null;\n', 
                     content)

    # 3. Replace loadBooks
    load_books_old = re.search(r'async function loadBooks\(\) \{.*?\}\n\}\n', content, re.DOTALL)
    if load_books_old:
        new_load_books = '''function loadBooks() {
  if (unsubChapters) { unsubChapters(); unsubChapters = null; }
  if (unsubWords) { unsubWords(); unsubWords = null; }

  selectedBookId = null;
  selectedChapterId = null;

  viewBooks.classList.remove('hidden');
  viewChapters.classList.add('hidden');
  viewWords.classList.add('hidden');
  addBookWrap.classList.remove('hidden');
  addChapterWrap.classList.add('hidden');
  crumbBook.classList.add('hidden');
  crumbChapter.classList.add('hidden');

  if (!unsubBooks) {
    viewBooks.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-secondary);">로딩 중...</p>';
    unsubBooks = onSnapshot(collection(db, `users/${currentUser.uid}/books`), (snap) => {
      viewBooks.innerHTML = '';
      if (snap.empty) {
        viewBooks.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;">저장된 단어장이 없습니다. 위의 [+ 새 단어장 만들기] 버튼을 눌러 시작하세요!</p>';
        return;
      }
      snap.forEach(d => {
        const data = d.data();
        const div = document.createElement('div');
        div.className = 'lib-card';
        div.innerHTML = `<div class="lib-icon">📘</div><div class="lib-title">${escapeHTML(data.name)}</div><button class="lib-delete-btn" title="단어장 삭제" style="position:absolute;top:8px;right:8px;background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.2rem;">✕</button>`;
        div.onclick = () => loadChapters(d.id, data.name);
        div.querySelector('.lib-delete-btn').onclick = async (e) => {
          e.stopPropagation();
          if (await showConfirm('이 단어장을 삭제하시겠습니까? (모든 단원과 함께 삭제됩니다)')) {
            try { await deleteDoc(doc(db, `users/${currentUser.uid}/books`, d.id)); }
            catch(err) { alert('삭제 실패: ' + err.message); }
          }
        };
        viewBooks.appendChild(div);
      });
    }, (e) => {
      console.error(e);
      viewBooks.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--danger);">오류: ${e.message}</p>`;
    });
  }
}
'''
        content = content.replace(load_books_old.group(0), new_load_books)

    # 4. Replace loadChapters
    load_chapters_old = re.search(r'async function loadChapters.*?\}\n\}\n', content, re.DOTALL)
    if load_chapters_old:
        new_load_chapters = '''function loadChapters(bookId, bookName) {
  if (unsubWords) { unsubWords(); unsubWords = null; }
  
  if (unsubChapters && selectedBookId !== bookId) {
    unsubChapters();
    unsubChapters = null;
  }

  selectedBookId = bookId;
  selectedChapterId = null;

  viewBooks.classList.add('hidden');
  viewChapters.classList.remove('hidden');
  viewWords.classList.add('hidden');
  addBookWrap.classList.add('hidden');
  addChapterWrap.classList.remove('hidden');
  crumbBook.classList.remove('hidden');
  crumbBookName.textContent = bookName;
  crumbChapter.classList.add('hidden');

  if (!unsubChapters) {
    viewChapters.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-secondary);">로딩 중...</p>';
    unsubChapters = onSnapshot(collection(db, `users/${currentUser.uid}/books/${bookId}/chapters`), (snap) => {
      viewChapters.innerHTML = '';
      if (snap.empty) {
        viewChapters.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;">단원이 없습니다. [+ 새 단원 추가] 버튼을 눌러주세요!</p>';
        return;
      }
      snap.forEach(d => {
        const data = d.data();
        const div = document.createElement('div');
        div.className = 'lib-card';
        div.innerHTML = `<div class="lib-icon">📂</div><div class="lib-title">${escapeHTML(data.name)}</div><button class="lib-delete-btn" title="단원 삭제" style="position:absolute;top:8px;right:8px;background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.2rem;">✕</button>`;
        div.onclick = () => loadWords(bookId, d.id, data.name);
        div.querySelector('.lib-delete-btn').onclick = async (e) => {
          e.stopPropagation();
          if (await showConfirm('이 단원을 삭제하시겠습니까? (모든 단어와 함께 삭제됩니다)')) {
            try { await deleteDoc(doc(db, `users/${currentUser.uid}/books/${bookId}/chapters`, d.id)); }
            catch(err) { alert('삭제 실패: ' + err.message); }
          }
        };
        viewChapters.appendChild(div);
      });
    }, (e) => {
      console.error(e);
      viewChapters.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--danger);">오류: ${e.message}</p>`;
    });
  }
}
'''
        content = content.replace(load_chapters_old.group(0), new_load_chapters)

    # 5. Replace loadWords
    load_words_old = re.search(r'async function loadWords.*?\}\n\}\n', content, re.DOTALL)
    if load_words_old:
        new_load_words = '''function loadWords(bookId, chapterId, chapterName) {
  if (unsubWords && selectedChapterId !== chapterId) {
    unsubWords();
    unsubWords = null;
  }

  selectedBookId = bookId;
  selectedChapterId = chapterId;

  viewBooks.classList.add('hidden');
  viewChapters.classList.add('hidden');
  viewWords.classList.remove('hidden');
  addBookWrap.classList.add('hidden');
  addChapterWrap.classList.add('hidden');
  crumbChapter.classList.remove('hidden');
  crumbChapterName.textContent = chapterName;

  if (!unsubWords) {
    wordsTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">로딩 중...</td></tr>';
    
    const q = query(collection(db, `users/${currentUser.uid}/books/${bookId}/chapters/${chapterId}/words`), orderBy('order'));
    unsubWords = onSnapshot(q, (snap) => {
      currentLoadedWords = [];
      if (selectAllWords) selectAllWords.checked = false;
      if (deleteSelectedBtn) deleteSelectedBtn.classList.add('hidden');
      
      wordsTbody.innerHTML = '';
      wordCountBadge.textContent = `${snap.size} 단어`;
      let i = 1;
      snap.forEach(d => {
        const data = d.data();
        currentLoadedWords.push(data);
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><input type="checkbox" class="word-chk" data-path="${d.ref.path}" /></td><td>${i++}</td><td>${escapeHTML(data.front)}</td><td style="white-space:pre-wrap;">${escapeHTML(data.back)}</td>
          <td>
            <div style="display:flex;gap:4px;">
              <button class="word-edit-btn" style="padding:4px 8px;font-size:0.8rem;cursor:pointer;border-radius:4px;border:1px solid var(--border);background:var(--bg-card);color:var(--text);">수정</button>
              <button class="word-delete-btn" style="padding:4px 8px;font-size:0.8rem;cursor:pointer;border-radius:4px;border:1px solid #ff4d4f;background:#fff1f0;color:#ff4d4f;">삭제</button>
            </div>
          </td>`;
        tr.querySelector('.word-edit-btn').onclick = async () => {
          const newFront = await showPrompt('앞면(질문):', data.front);
          if (newFront === null) return;
          const newBack = await showPrompt('뒷면(정답):', data.back);
          if (newBack === null) return;
          try { await updateDoc(d.ref, { front: newFront, back: newBack }); }
          catch(err) { alert('수정 실패: ' + err.message); }
        };
        tr.querySelector('.word-delete-btn').onclick = async () => {
          if (await showConfirm('이 단어를 삭제하시겠습니까?')) {
            try { await deleteDoc(d.ref); }
            catch(err) { alert('삭제 실패: ' + err.message); }
          }
        };
        wordsTbody.appendChild(tr);
        tr.querySelector('.word-chk').addEventListener('change', updateDeleteBtn);
      });
      if (snap.empty) {
        wordsTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">단어가 없습니다. [✨ 새 단어 추출하기] 버튼으로 추가하세요!</td></tr>';
      }
    }, (e) => {
      console.error(e);
      wordsTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--danger);">오류: ${e.message}</td></tr>`;
    });
  }
}
'''
        content = content.replace(load_words_old.group(0), new_load_words)

    # 6. Remove load calls after adds/deletes
    content = content.replace('loadBooks();', '/* auto updated by onSnapshot */')
    content = content.replace('loadChapters(selectedBookId, crumbBookName.textContent);', '/* auto updated by onSnapshot */')
    content = content.replace('loadWords(bookId, chapterId, chapterName);', '/* auto updated by onSnapshot */')
    content = content.replace('loadWords(selectedBookId, selectedChapterId, crumbChapterName.textContent);', '/* auto updated by onSnapshot */')
    
    # Restore the ones we actually need!
    content = content.replace("crumbHome.addEventListener('click', () => /* auto updated by onSnapshot */);", "crumbHome.addEventListener('click', () => loadBooks());")
    content = content.replace("signInAnonymously(auth).then(() => { /* auto updated by onSnapshot */", "signInAnonymously(auth).then(() => { loadBooks();")
    
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Refactored to use onSnapshot.")

if __name__ == "__main__":
    refactor_to_onsnapshot()
