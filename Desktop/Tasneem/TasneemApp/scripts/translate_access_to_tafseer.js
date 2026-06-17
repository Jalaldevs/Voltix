const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../app/constants/appTranslations.js');
let fileContent = fs.readFileSync(targetFile, 'utf8');

const translations = {
  english: "Access to all Tafaseer",
  arabic: "الوصول إلى جميع التفاسير",
  chinese: "访问所有Tafaseer",
  hindi: "सभी तफ़ासीर तक पहुँच",
  spanish: "Acceso a todos los Tafaseer",
  french: "Accès à tous les Tafaseer",
  bengali: "সকল তাফাসীরের অ্যাক্সেস",
  portuguese: "Acesso a todos os Tafaseer",
  russian: "Доступ ко всем Тафасирам",
  urdu: "تمام تفاسیر تک رسائی",
  german: "Zugang zu allen Tafaseer",
  japanese: "すべてのタファシールへのアクセス",
  italian: "Accesso a tutti i Tafaseer",
  korean: "모든 타파시르 이용",
  kurdish: "Gihiştina hemû Tefsîran",
  macedonian: "Пристап до сите Тафасир",
  malay: "Akses kepada semua Tafaseer",
  maltese: "Aċċess għat-Tafaseer kollha",
  nepali: "सबै तफासीरमा पहुँच",
  norwegian: "Tilgang til all Tafaseer",
  persian: "دسترسی به همه تفاسیر",
  polish: "Dostęp do wszystkich Tafaseer",
  filipino: "Access sa lahat ng Tafaseer",
  romanian: "Acces la toate Tafaseer",
  dutch: "Toegang tot alle Tafaseer",
  slovak: "Prístup ku všetkým Tafaseer",
  somali: "Galaangalka dhammaan Tafasiirta",
  swedish: "Tillgång till all Tafaseer",
  turkish: "Tüm Tefsirlere Erişim",
  uzbek: "Barcha tafsirlarga kirish",
  finnish: "Pääsy kaikkiin Tafaseereihin",
  tamil: "அனைத்து தபாசீர்களுக்கான அணுகல்"
};

async function main() {
  let parts = fileContent.split(/^const /m);

  for (let i = 1; i < parts.length; i++) {
    let part = parts[i];
    let langNameMatch = part.match(/^(\w+)\s*=\s*\{/);
    if (!langNameMatch) continue;
    
    let lang = langNameMatch[1];
    let translation = translations[lang];
    if (!translation) {
      console.warn('No translation for: ' + lang);
      continue;
    }

    // add accessToTafseer to quranUI
    if (!part.includes('"accessToTafseer"')) {
      part = part.replace(/"quranUI"\s*:\s*\{/, `"quranUI": {\n    "accessToTafseer": "${translation}",`);
    } else {
      part = part.replace(/"accessToTafseer"\s*:\s*"[^"]*"/, `"accessToTafseer": "${translation}"`);
    }
    
    parts[i] = part;
  }

  fileContent = parts[0] + parts.slice(1).map(p => 'const ' + p).join('');
  fs.writeFileSync(targetFile, fileContent, 'utf8');
  console.log('Done inserting accessToTafseer into appTranslations.js');
}

main().catch(console.error);
