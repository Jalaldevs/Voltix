const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../app/constants/appTranslations.js');
let fileContent = fs.readFileSync(targetFile, 'utf8');

const stringsToTranslate = {
  pdfFailed: "PDF Failed",
  pdfFailedMsg: "Could not generate PDF for this bookmark.",
  showTafsir: "Show Tafsir",
  showTranslations: "Show Translations"
};

const langCodes = {
  chinese: 'zh-CN', hindi: 'hi', spanish: 'es', french: 'fr', bengali: 'bn',
  portuguese: 'pt', russian: 'ru', urdu: 'ur', german: 'de', japanese: 'ja',
  italian: 'it', korean: 'ko', kurdish: 'ku', macedonian: 'mk', malay: 'ms',
  maltese: 'mt', nepali: 'ne', norwegian: 'no', persian: 'fa', polish: 'pl',
  filipino: 'tl', romanian: 'ro', dutch: 'nl', slovak: 'sk', somali: 'so',
  swedish: 'sv', turkish: 'tr', uzbek: 'uz', finnish: 'fi', tamil: 'ta'
};

async function translate(text, targetLang) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data[0].map(x => x[0]).join('');
  } catch (e) {
    console.error(`Failed to translate "${text}" to ${targetLang}`, e);
    return text;
  }
}

async function main() {
  const languages = Object.keys(langCodes);
  
  for (const lang of languages) {
    console.log(`Processing ${lang}...`);
    const code = langCodes[lang];
    
    const translations = {
      pdfFailed: await translate(stringsToTranslate.pdfFailed, code),
      pdfFailedMsg: await translate(stringsToTranslate.pdfFailedMsg, code),
      showTafsir: await translate(stringsToTranslate.showTafsir, code),
      showTranslations: await translate(stringsToTranslate.showTranslations, code)
    };

    // Find the quranUI block for this lang
    const quranUIRegex = new RegExp(`(const ${lang} = \\{[\\s\\S]*?\\"quranUI\\"\\s*:\\s*\\{)([^}]*)(\\})`);
    fileContent = fileContent.replace(quranUIRegex, (match, p1, p2, p3) => {
      if (!p2.includes('"showTafsir"')) {
        let replacement = p2.trimRight();
        if (!replacement.endsWith(',')) replacement += ',';
        replacement += `\n    "showTafsir": "${translations.showTafsir.replace(/"/g, '\\"')}"\n  `;
        return p1 + replacement + p3;
      }
      return match;
    });

    // Find the sunnahUI block for this lang
    const sunnahUIRegex = new RegExp(`(const ${lang} = \\{[\\s\\S]*?\\"sunnahUI\\"\\s*:\\s*\\{)([^}]*)(\\})`);
    fileContent = fileContent.replace(sunnahUIRegex, (match, p1, p2, p3) => {
      if (!p2.includes('"showTranslations"')) {
        let replacement = p2.trimRight();
        if (!replacement.endsWith(',')) replacement += ',';
        replacement += `\n    "showTranslations": "${translations.showTranslations.replace(/"/g, '\\"')}"\n  `;
        return p1 + replacement + p3;
      }
      return match;
    });

    // Find the bookmarks block for this lang
    const bookmarksRegex = new RegExp(`(const ${lang} = \\{[\\s\\S]*?\\"bookmarks\\"\\s*:\\s*\\{)([^}]*)(\\})`);
    fileContent = fileContent.replace(bookmarksRegex, (match, p1, p2, p3) => {
      let replacement = p2;
      let added = false;
      if (!p2.includes('"pdfFailed"')) {
        replacement = replacement.trimRight();
        if (!replacement.endsWith(',')) replacement += ',';
        replacement += `\n    "pdfFailed": "${translations.pdfFailed.replace(/"/g, '\\"')}",`;
        added = true;
      }
      if (!p2.includes('"pdfFailedMsg"')) {
        if (!added) {
          replacement = replacement.trimRight();
          if (!replacement.endsWith(',')) replacement += ',';
        }
        replacement += `\n    "pdfFailedMsg": "${translations.pdfFailedMsg.replace(/"/g, '\\"')}"`;
      } else if (added) {
         replacement = replacement.replace(/,$/, '');
      }
      if (added) {
         replacement += `\n  `;
      }
      return p1 + replacement + p3;
    });
  }

  fs.writeFileSync(targetFile, fileContent, 'utf8');
  console.log('Done.');
}

main().catch(console.error);
