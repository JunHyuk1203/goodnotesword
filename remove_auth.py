import re

# 1. Modify index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Hide/Remove library-auth-prompt and show library-content immediately
auth_prompt = r'<div id="library-auth-prompt" class="card text-center">.*?</div>\s*</div>\s*<div id="library-content" class="card hidden">'
html = re.sub(auth_prompt, '<div id="library-content" class="card">', html, flags=re.DOTALL)

# Hide logout button and user profile
html = html.replace('<div class="user-profile" style="position:absolute; right:20px; top:20px; display:flex; align-items:center; gap:10px;">', '<div class="user-profile hidden" style="display:none;">')
html = html.replace('<button id="google-logout-btn" class="sample-btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">로그아웃</button>', '<button id="google-logout-btn" class="hidden" style="display:none;">로그아웃</button>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

# 2. Modify app.js
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Remove firebase auth imports
js = re.sub(r'const\s*{\s*getAuth[^\}]*}\s*=\s*await\s*import\([^)]+\);', '', js)
js = re.sub(r'const\s*auth\s*=\s*getAuth\(app\);', '', js)
js = re.sub(r'const\s*provider\s*=\s*new\s*GoogleAuthProvider\(\);', '', js)

# Replace Auth logic
auth_logic = r'''// Auth State
onAuthStateChanged\(auth, \(user\) => \{
  currentUser = user;
  if \(user\) \{
    if \(authPrompt\) authPrompt.classList.add\('hidden'\);
    if \(libContent\) libContent.classList.remove\('hidden'\);
    if \(userAvatar\) \{
      userAvatar.src = user.photoURL;
      userAvatar.style.display = 'block';
    \}
    if \(logoutBtn\) logoutBtn.style.display = 'block';
    loadBooks\(\);
  \} else \{
    if \(authPrompt\) authPrompt.classList.remove\('hidden'\);
    if \(libContent\) libContent.classList.add\('hidden'\);
    if \(userAvatar\) userAvatar.style.display = 'none';
    if \(logoutBtn\) logoutBtn.style.display = 'none';
  \}
\}\);

loginBtn\?\.addEventListener\('click', async \(\) => \{
  try \{
    await signInWithPopup\(auth, provider\);
  \} catch \(err\) \{
    console.error\(err\);
    alert\('로그인 실패: ' \+ err.message\);
  \}
\}\);

logoutBtn\?\.addEventListener\('click', \(\) => \{
  signOut\(auth\);
\}\);'''

js = re.sub(auth_logic, '''// Bypass Auth completely
currentUser = { uid: "default_user" };
if (authPrompt) authPrompt.classList.add('hidden');
if (libContent) libContent.classList.remove('hidden');
loadBooks();
''', js, flags=re.DOTALL)

# Handle cases where auth logic might not match perfectly
if 'currentUser = { uid: "default_user" };' not in js:
    # Manual patch if regex fails
    js = js.replace('let currentUser = null;', 'let currentUser = { uid: "default_user" };\nsetTimeout(loadBooks, 500);')
    js = js.replace('onAuthStateChanged', '// onAuthStateChanged')

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("done")
