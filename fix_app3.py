# -*- coding: utf-8 -*-
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

js = js.replace('const currentUser = { uid: "default_user" };', 'let currentUser = null;')

target_init = '''// INIT
// ?????????????????????????????????????????????????????????????????????????????

loadBooks();
fetchLatestVersion();'''

auth_logic = '''// INIT
// ?????????????????????????????????????????????????????????????????????????????

// --- Firebase Auth & UI Logic ---
const authScreen = document.getElementById('auth-screen');
const libraryContent = document.getElementById('library-content');
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authGoogleBtn = document.getElementById('auth-google-btn');
const authResetBtn = document.getElementById('auth-reset-btn');
const authError = document.getElementById('auth-error');
const settingsUserEmail = document.getElementById('settings-user-email');
const settingsLogoutBtn = document.getElementById('settings-logout-btn');

let isLoginMode = true;

function showError(msg) {
  if (!authError) return;
  authError.textContent = msg;
  authError.classList.remove('hidden');
}
function hideError() {
  if (!authError) return;
  authError.classList.add('hidden');
}

if (tabLogin && tabSignup) {
  tabLogin.addEventListener('click', () => {
    isLoginMode = true;
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    if (authSubmitBtn) authSubmitBtn.textContent = '로그인';
    hideError();
  });
  tabSignup.addEventListener('click', () => {
    isLoginMode = false;
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    if (authSubmitBtn) authSubmitBtn.textContent = '회원가입';
    hideError();
  });
}

if (authForm) {
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();
    hideError();
    
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      showError(err.message || "오류가 발생했습니다.");
    }
  });
}

if (authGoogleBtn) {
  authGoogleBtn.addEventListener('click', async () => {
    hideError();
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      showError(err.message || "구글 로그인에 실패했습니다.");
    }
  });
}

if (authResetBtn) {
  authResetBtn.addEventListener('click', async () => {
    const email = authEmail.value.trim();
    if (!email) {
      showError("비밀번호를 재설정할 이메일을 위에 입력해주세요.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("비밀번호 재설정 이메일이 발송되었습니다. 확인 후 다시 로그인해주세요.");
    } catch (err) {
      showError(err.message);
    }
  });
}

if (settingsLogoutBtn) {
  settingsLogoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      const closeBtn = document.getElementById('settings-close-btn');
      if (closeBtn) closeBtn.click();
    } catch (err) {
      console.error("Logout Error:", err);
    }
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (user.email === 'tntgame1203@gmail.com') {
      currentUser = { uid: "default_user", email: user.email };
    } else {
      currentUser = { uid: user.uid, email: user.email };
    }
    
    if (settingsUserEmail) settingsUserEmail.textContent = user.email;
    
    if (authScreen) authScreen.classList.add('hidden');
    if (libraryContent) libraryContent.classList.remove('hidden');
    
    loadBooks();
  } else {
    currentUser = null;
    if (authScreen) authScreen.classList.remove('hidden');
    if (libraryContent) libraryContent.classList.add('hidden');
    
    if (typeof unsubBooks !== "undefined" && unsubBooks) { unsubBooks(); unsubBooks = null; }
    if (typeof unsubChapters !== "undefined" && unsubChapters) { unsubChapters(); unsubChapters = null; }
    if (typeof unsubWords !== "undefined" && unsubWords) { unsubWords(); unsubWords = null; }
  }
});

fetchLatestVersion();'''

js = js.replace(target_init, auth_logic)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("Updated app.js")
