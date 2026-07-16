import re

def patch_firestore():
    with open('app.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update imports
    if 'initializeFirestore' not in content:
        content = content.replace(
            "updateDoc, onSnapshot",
            "updateDoc, onSnapshot, initializeFirestore, persistentLocalCache"
        )
    
    # 2. Update db init
    old_db_init = "const db = getFirestore(firebaseApp);"
    new_db_init = """const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache()
});"""
    content = content.replace(old_db_init, new_db_init)

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    patch_firestore()
