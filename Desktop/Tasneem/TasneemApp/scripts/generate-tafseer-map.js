const fs = require('fs');
const path = require('path');

const tafseerDir = path.join(__dirname, '..', 'assets', 'tafseer');
const outPath = path.join(__dirname, '..', 'app', 'constants', 'tafseerEditionAssetMap.js');

let fileContent = '// Auto-generated for iOS local tafseer fetching\n';
fileContent += 'export const TAFSEER_ASSET_MAP = {\n';

const editions = fs.readdirSync(tafseerDir).filter(f => fs.statSync(path.join(tafseerDir, f)).isDirectory());

editions.forEach(edition => {
  for (let surahId = 1; surahId <= 114; surahId++) {
    const jsonPath = path.join(tafseerDir, edition, `${surahId}.tafseer`);
    if (fs.existsSync(jsonPath)) {
      fileContent += `  '${edition}_${surahId}': () => require('../../assets/tafseer/${edition}/${surahId}.tafseer'),\n`;
    }
  }
});

fileContent += '};\n';
fileContent += `
export const getTafseerSurahAsset = (tafseerKey, surahId) => {
  const getter = TAFSEER_ASSET_MAP[\`\${tafseerKey}_\${surahId}\`];
  return getter ? getter() : null;
};
`;

fs.writeFileSync(outPath, fileContent);
console.log('Successfully generated tafseerEditionAssetMap.js');
