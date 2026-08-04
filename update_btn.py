import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Update test-start-confirm-btn
html = re.sub(
    r'<button id="test-start-confirm-btn" class="generate-btn"[^>]*>.*?</button>',
    '<button id="test-start-confirm-btn" class="primary-action-btn">시작하기</button>',
    html, flags=re.DOTALL
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('updated test-start-confirm-btn')
