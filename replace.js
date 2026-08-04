const fs = require('fs');

// 1. Process app.js
let appJs = fs.readFileSync('app.js', 'utf8');

// Keys
appJs = appJs.replace(
  /let googleSearchApiKey = localStorage\.getItem\('google_search_api_key'\) \|\| '.*';\r?\nlet googleSearchCx = localStorage\.getItem\('google_search_cx'\) \|\| '.*';/,
  let pixabayApiKey = localStorage.getItem('pixabay_api_key') || '56807728-8411dd34a0d87ff28515943bd';
);

// Inputs
appJs = appJs.replace(
  /const googleSearchApiKeyInput = \$\('google-search-api-key'\);\r?\nconst googleSearchCxInput = \$\('google-search-cx'\);/,
  const pixabayApiKeyInput = ('pixabay-api-key');
);

// Settings modal
appJs = appJs.replace(
  /if \(googleSearchApiKeyInput\) googleSearchApiKeyInput\.value = googleSearchApiKey;\r?\n\s*if \(googleSearchCxInput\) googleSearchCxInput\.value = googleSearchCx;/,
  if (pixabayApiKeyInput) pixabayApiKeyInput.value = pixabayApiKey;
);
appJs = appJs.replace(
  /if \(googleSearchApiKeyInput\) \{\r?\n\s*googleSearchApiKey = googleSearchApiKeyInput\.value\.trim\(\);\r?\n\s*localStorage\.setItem\('google_search_api_key', googleSearchApiKey\);\r?\n\s*\}\r?\n\s*if \(googleSearchCxInput\) \{\r?\n\s*googleSearchCx = googleSearchCxInput\.value\.trim\(\);\r?\n\s*localStorage\.setItem\('google_search_cx', googleSearchCx\);\r?\n\s*\}/,
  if (pixabayApiKeyInput) {\n        pixabayApiKey = pixabayApiKeyInput.value.trim();\n        localStorage.setItem('pixabay_api_key', pixabayApiKey);\n      }
);

// Fetch logic
appJs = appJs.replace(
  /\/\/ 1\. Attempt to fetch from Google Custom Search API if keys are provided\r?\n\s*if \(googleSearchApiKey && googleSearchCx\) \{[\s\S]*?console\.error\('Google Custom Search API failed:', err\);\r?\n\s*\}\r?\n\s*\}/,
  // 1. Attempt to fetch from Pixabay API if key is provided (Beautiful Stock Images)\n      if (pixabayApiKey) {\n        try {\n          const url = \https://pixabay.com/api/?key=\$\{encodeURIComponent(pixabayApiKey)\}&q=\$\{encodeURIComponent(word)\}&image_type=photo&per_page=3&safesearch=true\;\n          const res = await fetch(url);\n          const data = await res.json();\n          if (data.hits && data.hits.length > 0) {\n            imageUrl = data.hits[0].webformatURL;\n          }\n        } catch (err) {\n          console.error('Pixabay API failed:', err);\n        }\n      }
);

// Invalidate loremflickr in parseWordData
appJs = appJs.replace(
  /imageUrl: data\.imageUrl \|\| '',/g,
  imageUrl: (data.imageUrl && (data.imageUrl.includes('loremflickr.com') || data.imageUrl.includes('wikipedia.org'))) ? '' : (data.imageUrl || ''),
);
appJs = appJs.replace(
  /imageUrl: data\.imageUrl \|\| ''\r?\n\s*\};/g,
  imageUrl: (data.imageUrl && (data.imageUrl.includes('loremflickr.com') || data.imageUrl.includes('wikipedia.org'))) ? '' : (data.imageUrl || '')\n    };
);

fs.writeFileSync('app.js', appJs, 'utf8');

console.log("app.js successfully migrated to Pixabay");
