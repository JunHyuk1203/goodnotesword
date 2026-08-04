const item = {
    word: 'genetic',
    pos: '형',
    pronunciation: '[dʒənétik]',
    meaning: '유전(학)의',
    examples: ['I want to become a genetic engineer and develop tools and methods that might be used to treat rare diseases.'],
    related: ['gene [명]: 유전자', 'genetics [명]: 유전학', 'genetically [부]: 유전적으로', 'generic [형]: 일반적인, 포괄적인', 'genetically modified [형]: 유전자 조작의'],
    etymology: ['gene(유전자)', 'ic(형용사 접미사)']
};

const ensureStringArray = (arr) => Array.isArray(arr) ? arr.map(x => typeof x === 'object' ? Object.values(x).join(' ') : String(x)) : [];

function formatCard(item, frontOpt, backOpt) {
  let front = item.word || '';
  if (frontOpt === 'word_pos' && item.pos) front += \  \\;
  if (frontOpt === 'word_pron' && item.pronunciation) front += \  \\;

  const parts = [];
  if (item.meaning) parts.push(\📌 뜻\\n\\\);
  if (backOpt === 'full') {
    const etys = ensureStringArray(item.etymology);
    const syns = ensureStringArray(item.synonyms);
    const ants = ensureStringArray(item.antonyms);
    const rels = ensureStringArray(item.related);
    if (etys.length) parts.push(\🧩 어원\\n• \\);
    if (syns.length) parts.push(\✅ 유의어\\n• \\);
    if (ants.length) parts.push(\❌ 반의어\\n• \\);
    if (rels.length) parts.push(\🔗 관련어\\n• \\);
  }
  const exs = ensureStringArray(item.examples);
  if (backOpt !== 'meaning_only' && exs.length) parts.push(\📖 예문\\n• \\);

  return {
    front: front.trim(),
    back: parts.join('\\n\\n').trim(),
    etymology: ensureStringArray(item.etymology)
  };
}

const formatted = formatCard(item, 'word_pos', 'full');
console.log('--- DB Data (formatted) ---');
console.dir(formatted);

function parseWordData(data) {
  const back = data.back || '';
  let etymology = [];
  const sections = back.split(/\\n\\n/);
  for (const section of sections) {
    const trimmed = section.trim();
    if (trimmed.startsWith('🧩 어원')) {
      etymology = trimmed.replace(/^🧩 어원\\n?/, '').replace(/^•\\s*/, '').split(/\\s*\\+\\s*/).map(s => s.trim()).filter(Boolean);
    }
  }
  return { etymology };
}

console.log('--- UI Parse Result ---');
console.dir(parseWordData(formatted));