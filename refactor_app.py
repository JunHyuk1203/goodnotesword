import re
import sys

def refactor_app():
    with open('app.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove API Key block (lines 33-49)
    # Finding the exact block using string manipulation
    api_key_start = content.find('// ─── API Key')
    api_key_end = content.find('// ─── Utility')
    if api_key_start != -1 and api_key_end != -1:
        content = content[:api_key_start] + content[api_key_end:]

    # 2. Remove apiModal DOM refs
    dom_old = "const apiModal = $('api-modal');"
    dom_end = "const errorMsg = $('error-msg');\n"
    dom_start_idx = content.find(dom_old)
    dom_end_idx = content.find(dom_end)
    if dom_start_idx != -1 and dom_end_idx != -1:
        content = content[:dom_start_idx] + "const errorSection = $('error-section');\nconst errorTitle = $('error-title');\nconst errorMsg = $('error-msg');\n" + content[dom_end_idx + len(dom_end):]

    # 3. Replace Extract DOM refs
    extract_dom_start = content.find('// Extract\n')
    extract_dom_end = content.find('const deleteSelectedBtn = $(\'delete-selected-btn\');\n')
    if extract_dom_start != -1 and extract_dom_end != -1:
        extract_dom_new = '''// Extract
const extractSection = $('extract-section');
const openExtractBtn = $('open-extract-btn');
const closeExtractBtn = $('close-extract-btn');
const promptOutput = $('prompt-output');
const copyPromptBtn = $('copy-prompt-btn');
const aiJsonInput = $('ai-json-input');
const convertBtn = $('convert-btn');
const exportCsvBtn = $('export-csv-btn');
const selectAllWords = $('select-all-words');
const deleteSelectedBtn = $('delete-selected-btn');
const cardFrontSel = $('card-front-sel');
const cardBackSel = $('card-back-sel');
'''
        content = content[:extract_dom_start] + extract_dom_new + content[extract_dom_end + len('const deleteSelectedBtn = $(\'delete-selected-btn\');\n'):]

    # 4. Remove API KEY MODAL section
    modal_start = content.find('// ═══════════════════════════════════════════════════════════════════════════════\n// API KEY MODAL')
    modal_end = content.find('// ═══════════════════════════════════════════════════════════════════════════════\n// LIBRARY')
    if modal_start != -1 and modal_end != -1:
        content = content[:modal_start] + content[modal_end:]

    # 5. Remove TAB SWITCHING, TEXT INPUT, IMAGE INPUT, GENERATE BUTTON STATE
    tab_start = content.find('// ═══════════════════════════════════════════════════════════════════════════════\n// TAB SWITCHING (Text / Image)')
    tab_end = content.find('// ═══════════════════════════════════════════════════════════════════════════════\n// GEMINI API')
    if tab_start != -1 and tab_end != -1:
        content = content[:tab_start] + content[tab_end:]

    # 6. Replace GEMINI API and GENERATE HANDLER sections
    gemini_start = content.find('// ═══════════════════════════════════════════════════════════════════════════════\n// GEMINI API')
    gemini_end = content.find('// ═══════════════════════════════════════════════════════════════════════════════\n// AUTO SAVE TO LIBRARY')
    
    gemini_api_new = '''// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

function updatePrompt() {
  const frontOpt = cardFrontSel.value;
  const backOpt = cardBackSel.value;

  const includeExample = backOpt !== 'meaning_only';
  const includeSynAnt = backOpt === 'full';

  let formatStr = `- "word": The English vocabulary word (required)\\n- "meaning": The Korean meaning exactly as written (required)\\n- "pos": Part of speech (e.g., ⓝ, ⓥ, ⓐ) (optional)\\n- "pronunciation": Pronunciation symbol (optional)`;
  
  if (includeExample) formatStr += `\\n- "examples": Array of example sentences (optional)`;
  if (includeSynAnt) formatStr += `\\n- "synonyms": Array of strings (optional)\\n- "antonyms": Array of strings (optional)\\n- "related": Array of related words (optional)`;

  let exampleStr = `[
  {
    "word": "significant",
    "meaning": "1 중요한 2 상당한"`;
  
  if (includeExample) exampleStr += `,\\n    "examples": ["This is significant! 이것은 중요하다!"]`;
  if (includeSynAnt) exampleStr += `,\\n    "synonyms": ["important: 중요한"]`;
  exampleStr += `\\n  }
]`;

  const prompt = `You are an expert vocabulary extraction assistant. Your task is to extract ALL English vocabulary words from the provided source.

CRITICAL EXTRACTION RULES:
1. DO NOT SKIP ANY MAIN VOCABULARY WORDS. You MUST extract EVERY SINGLE main vocabulary word present in the source.
2. If there are dozens of words, you MUST list them ALL. DO NOT give up after a few words.
3. For multiple images or columns, extract from top-to-bottom, left-to-right.

CRITICAL TRANSCRIBING RULES:
1. NEVER USE YOUR OWN DICTIONARY KNOWLEDGE. Act purely as an OCR engine.
2. For the "meaning" field, you MUST copy the text EXACTLY as it appears. DO NOT summarize.

OUTPUT FORMAT:
You MUST output a valid JSON array of objects. Do not wrap it in markdown blockquotes.
Each object MUST have the following keys (and ONLY these keys if requested):
${formatStr}

Example:
${exampleStr}
`;

  promptOutput.value = prompt;
}

if (cardFrontSel) cardFrontSel.addEventListener('change', updatePrompt);
if (cardBackSel) cardBackSel.addEventListener('change', updatePrompt);
// Init prompt on load
if (promptOutput) updatePrompt();

if (copyPromptBtn) {
  copyPromptBtn.addEventListener('click', () => {
    promptOutput.select();
    document.execCommand('copy');
    const orgText = copyPromptBtn.textContent;
    copyPromptBtn.textContent = '✅ 복사 완료!';
    setTimeout(() => copyPromptBtn.textContent = orgText, 2000);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERT HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

function parseResponse(text) {
  let c = text.trim().replace(/^```(?:json)?\\s*/i, '').replace(/\\s*```$/i, '').trim();
  const s = c.indexOf('[');
  if (s === -1) throw new Error('JSON 배열 시작 부분을 찾을 수 없습니다.\\nAI가 준 응답에서 [...] 형태의 데이터를 찾지 못했습니다.');
  
  c = c.slice(s);
  
  try {
    return JSON.parse(c);
  } catch (err) {
    let lastBrace = c.lastIndexOf('}');
    if (lastBrace !== -1) {
      let fixed = c.slice(0, lastBrace + 1) + ']';
      try { return JSON.parse(fixed); } catch (e) {}
    }
    try { return JSON.parse(c + ']'); } catch (e) {}
    
    throw new Error(`JSON 파싱 오류: ${err.message}\\n(AI가 쌍따옴표를 잘못 썼거나 텍스트가 잘렸을 수 있습니다)`);
  }
}

function formatCard(item, frontOpt, backOpt) {
  const ensureStringArray = (arr) => Array.isArray(arr) ? arr.map(x => typeof x === 'object' ? Object.values(x).join(' ') : String(x)) : [];

  let front = item.word || '';
  if (frontOpt === 'word_pos' && item.pos) front += `  ${item.pos}`;
  if (frontOpt === 'word_pron' && item.pronunciation) front += `  ${item.pronunciation}`;
  const parts = [];
  if (item.meaning) parts.push(`📌 뜻\\n${item.pos ? item.pos + ' ' : ''}${item.meaning}`);
  if (backOpt === 'full') {
    const syns = ensureStringArray(item.synonyms);
    const ants = ensureStringArray(item.antonyms);
    const rels = ensureStringArray(item.related);
    if (syns.length) parts.push(`✅ 유의어\\n• ${syns.join('\\n• ')}`);
    if (ants.length) parts.push(`❌ 반의어\\n• ${ants.join('\\n• ')}`);
    if (rels.length) parts.push(`🔗 관련어\\n• ${rels.join('\\n• ')}`);
  }
  const exs = ensureStringArray(item.examples);
  if (backOpt !== 'meaning_only' && exs.length) parts.push(`📖 예문\\n• ${exs.join('\\n• ')}`);
  return { front: front.trim(), back: parts.join('\\n\\n').trim() };
}

if (convertBtn) {
  convertBtn.addEventListener('click', async () => {
    hideError();
    const rawText = aiJsonInput.value.trim();
    if (!rawText) {
      alert("AI가 준 결과를 붙여넣어 주세요.");
      return;
    }

    const frontOpt = cardFrontSel.value;
    const backOpt = cardBackSel.value;

    convertBtn.disabled = true;
    const orgText = convertBtn.innerHTML;
    convertBtn.innerHTML = '<span class="btn-icon">⚡</span> 변환 중...';

    try {
      const allParsed = parseResponse(rawText);
      if (!Array.isArray(allParsed) || !allParsed.length) {
        throw new Error("결과에서 단어를 추출하지 못했습니다. (배열이 비어있음)");
      }

      const seen = new Set();
      const deduped = allParsed.filter(item => {
        const key = (item.word || '').toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      generatedData = deduped.map(item => formatCard(item, frontOpt, backOpt));
      await autoSaveToLibrary(generatedData);
      
      // Clear input after success
      aiJsonInput.value = '';
      
    } catch(err) {
      console.error(err);
      showError("변환 오류", err.message);
    } finally {
      convertBtn.disabled = false;
      convertBtn.innerHTML = orgText;
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO SAVE TO LIBRARY'''
    
    if gemini_start != -1 and gemini_end != -1:
        content = content[:gemini_start] + gemini_api_new + content[gemini_end + len('// ═══════════════════════════════════════════════════════════════════════════════\n// AUTO SAVE TO LIBRARY'):]

    # 7. Remove API calls from INIT
    init_old = '''// INIT
// ═══════════════════════════════════════════════════════════════════════════════

updateKeyStatus();
if (!getApiKey()) showApiModal();
updateGenerateButton();
loadBooks();
fetchLatestVersion();'''
    init_new = '''// INIT
// ═══════════════════════════════════════════════════════════════════════════════

loadBooks();
fetchLatestVersion();'''
    content = content.replace(init_old, init_new)

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("app.js refactored successfully.")

if __name__ == "__main__":
    refactor_app()
