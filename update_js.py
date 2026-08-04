import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update Empty State for words (both Card View and Table View)
js = js.replace(
    "wordsCardView.innerHTML = '<p style=\"text-align:center;color:var(--text-muted);padding:3rem;\">단어가 없습니다. [+ 단어 추가] 버튼을 눌러 추가하세요!</p>';",
    """wordsCardView.innerHTML = `<div class="empty-state">
  <div class="empty-state-icon">📖</div>
  <p class="empty-state-title">등록된 단어가 없습니다</p>
  <p class="empty-state-desc">+ 버튼을 눌러 첫 단어를 추가해 보세요.</p>
</div>`;"""
)

js = js.replace(
    "wordsSwipeView.innerHTML = '<p style=\"text-align:center;color:var(--text-muted);padding:3rem;\">단어가 없습니다.</p>';",
    """wordsSwipeView.innerHTML = `<div class="empty-state" style="padding-top: 10vh;">
  <div class="empty-state-icon">📖</div>
  <p class="empty-state-title">등록된 단어가 없습니다</p>
  <p class="empty-state-desc">+ 버튼을 눌러 첫 단어를 추가해 보세요.</p>
</div>`;"""
)

js = js.replace(
    "viewChapters.innerHTML = '<p style=\"color:var(--text-muted);grid-column:1/-1;text-align:center;\">단원이 없습니다. [+ 새 단원 추가] 버튼을 눌러주세요!</p>';",
    """viewChapters.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">
  <div class="empty-state-icon">📂</div>
  <p class="empty-state-title">등록된 단원이 없습니다</p>
  <p class="empty-state-desc">+ 버튼을 눌러 첫 단원을 추가해 보세요.</p>
</div>`;"""
)

js = js.replace(
    "viewBooks.innerHTML = '<p style=\"color:var(--text-muted);grid-column:1/-1;text-align:center;\">등록된 단어장이 없습니다. [+ 새 단어장 추가] 버튼을 클릭해 생성하세요!</p>';",
    """viewBooks.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">
  <div class="empty-state-icon">📚</div>
  <p class="empty-state-title">등록된 단어장이 없습니다</p>
  <p class="empty-state-desc">+ 버튼을 눌러 첫 단어장을 추가해 보세요.</p>
</div>`;"""
)

js = js.replace(
    "wordsTbody.innerHTML = '<tr><td colspan=\"5\" style=\"text-align:center;color:var(--text-muted);\">단어가 없습니다.</td></tr>';",
    """wordsTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:3rem 0;"><div class="empty-state">
  <div class="empty-state-icon">📖</div>
  <p class="empty-state-title">등록된 단어가 없습니다</p>
  <p class="empty-state-desc">+ 버튼을 눌러 첫 단어를 추가해 보세요.</p>
</div></td></tr>`;"""
)


# Keyboard shortcuts addition
keyboard_shortcuts = """
// Global Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) return;
  
  const promptModal = document.getElementById('custom-prompt-modal');
  if (promptModal && !promptModal.classList.contains('hidden')) return;
  
  const inShorts = document.body.classList.contains('shorts-mode-active');
  const flashScreen = document.getElementById('flash-screen');
  const inFlash = flashScreen && !flashScreen.classList.contains('hidden');
  
  if (e.code === 'Space') {
    if (inShorts) {
      e.preventDefault();
      if (typeof navigateSwipe === 'function') navigateSwipe(1);
    } else if (inFlash) {
      e.preventDefault();
      const flipHint = document.getElementById('flip-hint');
      const flashFront = document.getElementById('flashcard-front');
      // Click the card to flip
      if (flipHint && flipHint.style.display !== 'none') {
         if (flashFront) flashFront.click();
      }
    }
  } else if (e.code === 'ArrowRight') {
    if (inShorts) {
      e.preventDefault();
      if (typeof navigateSwipe === 'function') navigateSwipe(1);
    }
  } else if (e.code === 'ArrowLeft') {
    if (inShorts) {
      e.preventDefault();
      if (typeof navigateSwipe === 'function') navigateSwipe(-1);
    }
  } else if (e.code === 'Digit1' || e.code === 'Numpad1') {
    if (inFlash) {
      e.preventDefault();
      const knowBtn = document.getElementById('flash-correct-btn');
      if (knowBtn && !knowBtn.disabled && window.getComputedStyle(knowBtn).display !== 'none') knowBtn.click();
    }
  } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
    if (inFlash) {
      e.preventDefault();
      const dontKnowBtn = document.getElementById('flash-wrong-btn');
      if (dontKnowBtn && !dontKnowBtn.disabled && window.getComputedStyle(dontKnowBtn).display !== 'none') dontKnowBtn.click();
    }
  }
});
"""

if 'Global Keyboard Shortcuts' not in js:
    js += keyboard_shortcuts

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("JS updated successfully")
