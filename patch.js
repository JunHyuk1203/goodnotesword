const fs = require('fs');
const file = 'app.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /const FALLBACK_MODELS = \[[\s\S]*?(?=\/\/ ─── Parsing)/;

const newCode = `const FALLBACK_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3-flash',
  'gemini-2.5-flash'
];

async function callGeminiText(apiKey, prompt, text) {
  const body = {
    contents: [{ parts: [{ text: prompt + "\\n\\nTEXT TO ANALYZE:\\n\\\"\\\"\\\"\\n" + text + "\\n\\\"\\\"\\\"" }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 8192 }
  };
  return executeWithFallback(apiKey, body);
}

// ─── Gemini API: Vision (Image) ───────────────────────────────────────────────

async function callGeminiVision(apiKey, prompt, images) {
  const parts = images.map(img => ({
    inline_data: { mime_type: img.mimeType, data: img.dataUrl.split(',')[1] }
  }));
  parts.push({ text: prompt });

  const body = {
    contents: [{ parts }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 8192 }
  };
  return executeWithFallback(apiKey, body);
}

async function executeWithFallback(apiKey, body) {
  let lastError;
  for (let i = 0; i < FALLBACK_MODELS.length; i++) {
    const model = FALLBACK_MODELS[i];
    const url = \`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${apiKey}\`;
    try {
      if (i > 0) {
        console.log(\`[Fallback] Retrying with \${model}...\`);
        const sub = document.getElementById('progress-sub');
        if (sub) sub.textContent = \`이전 모델 한도 초과. \${model} 모델로 우회 접속 중...\`;
      }
      return await fetchGemini(url, body);
    } catch (err) {
      lastError = err;
      if (err.status === 429 || err.status === 403 || (err.message && err.message.includes('할당량'))) {
        continue;
      }
      throw err; 
    }
  }

  if (lastError && (lastError.status === 429 || lastError.status === 403)) {
    throw new Error(\`모든 예비 모델(5개)의 API 한도가 바닥났습니다 (429/403).\\n• 우측 상단 [API 키] 버튼을 눌러 새 키로 교체하세요.\\n• 또는 https://aistudio.google.com/app/apikey 에서 발급받으세요.\`);
  }
  throw lastError;
}

async function fetchGemini(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errObj = await response.json().catch(() => ({}));
    const msg = errObj?.error?.message || response.statusText;
    const error = new Error(\`API 오류 (\${response.status}): \${msg}\`);
    error.status = response.status;
    
    if (response.status === 401 || (response.status === 403 && !msg.includes('quota'))) {
      error.message = \`API 키 인증 실패 (\${response.status}): API 키를 확인해주세요.\`;
    }
    throw error;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('AI 응답이 비어있습니다. 다시 시도해보세요.');
  return text;
}

`;

content = content.replace(regex, newCode);
fs.writeFileSync(file, content);
console.log('done');
