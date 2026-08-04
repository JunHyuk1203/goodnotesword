function formatCard(item) {
  let parts = [];
  let etys = item.etymology || [];
  if (etys.length) parts.push('?? 어원\n? ' + etys.join(' + '));
  return parts.join('\n\n');
}

let item = {etymology: ['gene(유전자)', 'ic(형용사 접미사)']};
let back = formatCard(item);
console.log('--- BACK ---');
console.log(back);

let etymology = [];
let sections = back.split(/\n\n/);
for (let section of sections) {
  let trimmed = section.trim();
  if (trimmed.startsWith('?? 어원')) {
    etymology = trimmed.replace(/^?? 어원\n?/, '').replace(/^?\s*/, '').split(/\s*\+\s*/).map(s => s.trim()).filter(Boolean);
  }
}
console.log('--- PARSED ---');
console.log(etymology);
