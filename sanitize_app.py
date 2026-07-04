import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Clean Firebase Auth leftover code
auth_import_pattern = r'const\s*\{\s*getAuth[^\}]*\}\s*=\s*await\s*import[^;]+;'
js = re.sub(auth_import_pattern, '', js)
js = re.sub(r'const\s*auth\s*=\s*getAuth[^\n]+', '', js)
js = re.sub(r'const\s*provider\s*=\s*new\s*GoogleAuthProvider[^\n]+', '', js)

# 2. Make sure currentUser is set and loadBooks is called initially
if 'currentUser = { uid: "default_user" };' not in js:
    # If not present, replace let currentUser = null;
    js = js.replace('let currentUser = null;', 'let currentUser = { uid: "default_user" };\n// Bypass auth\nsetTimeout(() => {\n  const libContent = document.getElementById("library-content");\n  if(libContent) libContent.classList.remove("hidden");\n  if(typeof loadBooks === "function") loadBooks();\n}, 100);')
else:
    # Already present but let's ensure it's not wrapped in a weird block
    pass

# 3. Remove duplicate UI toggle listeners that caused SyntaxError
duplicate_toggle = r'// Extraction UI toggle\s*const openExtractBtn = document\.getElementById\(\'open-extract-btn\'\);.*?viewWordsSection\.classList\.remove\(\'hidden\'\);\n\}\);'
js = re.sub(duplicate_toggle, '', js, flags=re.DOTALL)

# 4. Remove duplicate closeExtractBtn declaration if it exists anywhere else
js = re.sub(r'const\s+closeExtractBtn\s*=\s*document\.getElementById\(\'close-extract-btn\'\);', 'let closeExtractBtn = document.getElementById("close-extract-btn");', js)
js = re.sub(r'const\s+openExtractBtn\s*=\s*document\.getElementById\(\'open-extract-btn\'\);', 'let openExtractBtn = document.getElementById("open-extract-btn");', js)
js = re.sub(r'let\s+closeExtractBtn\s*=\s*document\.getElementById\("close-extract-btn"\);(.*?)\nlet\s+closeExtractBtn\s*=\s*document\.getElementById\("close-extract-btn"\);', r'let closeExtractBtn = document.getElementById("close-extract-btn");\1', js, flags=re.DOTALL)
js = re.sub(r'let\s+openExtractBtn\s*=\s*document\.getElementById\("open-extract-btn"\);(.*?)\nlet\s+openExtractBtn\s*=\s*document\.getElementById\("open-extract-btn"\);', r'let openExtractBtn = document.getElementById("open-extract-btn");\1', js, flags=re.DOTALL)

# 5. Remove any Global Nav code left over in JS
js = re.sub(r'const\s+navExtract\s*=\s*document\.getElementById\(\'nav-extract-btn\'\);', '', js)
js = re.sub(r'const\s+navLibrary\s*=\s*document\.getElementById\(\'nav-library-btn\'\);', '', js)
js = re.sub(r'navExtract\?\.addEventListener\([^\}]+\}\);', '', js, flags=re.DOTALL)
js = re.sub(r'navLibrary\?\.addEventListener\([^\}]+\}\);', '', js, flags=re.DOTALL)

# 6. Ensure handleGenerate calls autoSaveToLibrary
# It should already have this from our previous patches, but let's verify.
if 'autoSaveToLibrary(generatedData)' not in js:
    # Fallback if missing
    js = js.replace('renderResults(generatedData, deduped.length);', 'autoSaveToLibrary(generatedData);')

# 7. Update UI references that we removed in index.html (like userAvatar, google-logout-btn)
# Just to be safe so they don't throw errors
js = js.replace('const userAvatar', 'let userAvatar')
js = js.replace('const logoutBtn', 'let logoutBtn')
js = js.replace('const authPrompt', 'let authPrompt')

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("done")
