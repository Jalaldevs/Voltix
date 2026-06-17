import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// JUZ_BOUNDARIES: [surahId, ayahId] starts for Juz 1 to 30
const JUZ_BOUNDARIES = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24],    // juz 1-5
  [4, 148], [5, 82], [6, 111], [7, 88], [8, 41],    // juz 6-10
  [9, 93], [11, 6], [12, 53], [15, 1], [17, 1],     // juz 11-15
  [18, 75], [21, 1], [23, 1], [25, 21], [27, 56],   // juz 16-20
  [29, 46], [33, 31], [36, 28], [39, 32], [41, 47], // juz 21-25
  [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],     // juz 26-30
];

// HIZB_BOUNDARIES: [surahId, ayahId] starts for Hizb 1 to 60
const HIZB_BOUNDARIES = [
  [1, 1], [2, 75], [2, 142], [2, 203], [2, 253], [3, 15], [3, 93], [4, 1], [4, 24], [4, 88],
  [4, 148], [5, 27], [5, 83], [6, 36], [6, 111], [7, 1], [7, 88], [8, 1], [8, 41], [9, 34],
  [9, 93], [11, 6], [11, 54], [12, 53], [13, 2], [14, 10], [15, 1], [16, 51], [17, 1], [17, 71],
  [18, 75], [20, 1], [21, 1], [22, 1], [23, 1], [24, 21], [25, 21], [27, 26], [27, 56], [29, 45],
  [30, 31], [33, 31], [33, 51], [36, 28], [37, 1], [38, 21], [39, 32], [41, 47], [42, 13], [44, 1],
  [46, 1], [49, 1], [51, 31], [54, 56], [58, 1], [61, 1], [67, 1], [71, 1], [78, 1], [87, 1]
];

const MEDINAN_SURAHS = new Set([
  2, 3, 4, 5, 8, 9, 22, 24, 33, 47, 48, 49, 55, 57, 58, 59, 60, 61, 62, 63,
  64, 65, 66, 76, 98, 110,
]);

const getJuz = (surahId, ayahId) => {
  for (let j = JUZ_BOUNDARIES.length - 1; j >= 0; j--) {
    const [s, a] = JUZ_BOUNDARIES[j];
    if (surahId > s || (surahId === s && ayahId >= a)) return j + 1;
  }
  return 1;
};

const getHizb = (surahId, ayahId) => {
  for (let h = HIZB_BOUNDARIES.length - 1; h >= 0; h--) {
    const [s, a] = HIZB_BOUNDARIES[h];
    if (surahId > s || (surahId === s && ayahId >= a)) return h + 1;
  }
  return 1;
};

const enrichAssets = (basePath) => {
  console.log(`Enriching assets in: ${basePath}`);
  const arabicPath = path.join(basePath, 'assets', 'quran', 'arabic');

  if (!fs.existsSync(arabicPath)) {
    console.error(`Path not found: ${arabicPath}`);
    return;
  }

  const files = fs.readdirSync(arabicPath).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const surahId = parseInt(file.replace('.json', ''));
    const filePath = path.join(arabicPath, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!content.verses) continue;

    let minJuz = 30, maxJuz = 1;
    let minHizb = 60, maxHizb = 1;

    content.verses = content.verses.map(v => {
      const j = getJuz(surahId, v.id);
      const h = getHizb(surahId, v.id);

      minJuz = Math.min(minJuz, j);
      maxJuz = Math.max(maxJuz, j);
      minHizb = Math.min(minHizb, h);
      maxHizb = Math.max(maxHizb, h);

      return {
        ...v,
        juz: j,
        hizb: h
      };
    });

    // Update surah-level metadata
    content.juz_range = [minJuz, maxJuz];
    content.hizb_range = [minHizb, maxHizb];
    content.type = MEDINAN_SURAHS.has(surahId) ? 'medinan' : 'meccan';

    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Processed Surah ${surahId}`);
  }
};

// Target projects
const projects = [
  path.join(__dirname, '..'), // TasneemAndroid
  path.join(__dirname, '..', '..', 'TasneemIOS'), // TasneemIOS
];

projects.forEach(enrichAssets);
console.log('Enrichment complete!');
