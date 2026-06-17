import fs from 'fs';
import path from 'path';

const checkEnrichment = (basePath) => {
  const surah1 = path.join(basePath, 'assets', 'quran', 'arabic', '1.json');
  const surah2 = path.join(basePath, 'assets', 'quran', 'arabic', '2.json');

  [surah1, surah2].forEach(p => {
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      console.log(`Checking ${p}:`);
      console.log(`- juz_range: ${data.juz_range}`);
      console.log(`- hizb_range: ${data.hizb_range}`);
      console.log(`- type: ${data.type}`);
      console.log(`- verse 1 meta: juz=${data.verses[0].juz}, hizb=${data.verses[0].hizb}`);
      if (data.verses.length > 74 && p.includes('2.json')) {
         console.log(`- Surah 2, Verse 75 meta: juz=${data.verses[74].juz}, hizb=${data.verses[74].hizb} (Should be Juz 1, Hizb 2)`);
      }
    }
  });
};

const root = 'c:/Users/Jalal/Desktop/TasneemNew';
console.log('--- Android ---');
checkEnrichment(path.join(root, 'TasneemAndroid'));
console.log('\n--- iOS ---');
checkEnrichment(path.join(root, 'TasneemIOS'));
