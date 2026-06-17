const fs = require('fs');
const path = require('path');

const TRANSLATIONS = {
  english: { showTafsir: "Show Tafsir", showTranslations: "Show Translations", accessToTafseer: "Access to all Tafaseer" },
  arabic: { showTafsir: "عرض التفسير", showTranslations: "عرض التراجم", accessToTafseer: "الوصول إلى جميع التفاسير" },
  chinese: { showTafsir: "显示经注", showTranslations: "显示翻译", accessToTafseer: "访问所有经注" },
  hindi: { showTafsir: "तफ़सीर दिखाएं", showTranslations: "अनुवाद दिखाएं", accessToTafseer: "सभी तफ़सीरों तक पहुँच" },
  spanish: { showTafsir: "Mostrar Tafsir", showTranslations: "Mostrar Traducciones", accessToTafseer: "Acceso a todos los Tafaseer" },
  french: { showTafsir: "Afficher le Tafsir", showTranslations: "Afficher les traductions", accessToTafseer: "Accès à tous les Tafaseer" },
  bengali: { showTafsir: "তাফসির দেখান", showTranslations: "অনুবাদ দেখান", accessToTafseer: "সব তাফসিরের অ্যাক্সেস" },
  portuguese: { showTafsir: "Mostrar Tafsir", showTranslations: "Mostrar Traduções", accessToTafseer: "Acesso a todos os Tafaseer" },
  russian: { showTafsir: "Показать Тафсир", showTranslations: "Показать переводы", accessToTafseer: "Доступ ко всем Тафсирам" },
  urdu: { showTafsir: "تفسیر دکھائیں", showTranslations: "تراجم دکھائیں", accessToTafseer: "تمام تفاسیر تک رسائی" },
  german: { showTafsir: "Tafsir anzeigen", showTranslations: "Übersetzungen anzeigen", accessToTafseer: "Zugang zu allen Tafaseer" },
  japanese: { showTafsir: "タフスィールを表示", showTranslations: "翻訳を表示", accessToTafseer: "すべてのタフスィールへのアクセス" },
  italian: { showTafsir: "Mostra Tafsir", showTranslations: "Mostra traduzioni", accessToTafseer: "Accesso a tutti i Tafaseer" },
  korean: { showTafsir: "타프시르 표시", showTranslations: "번역 표시", accessToTafseer: "모든 타프시르 이용" },
  kurdish: { showTafsir: "تەفسیر نیشان بدە", showTranslations: "وەرگێڕانەکان نیشان بدە", accessToTafseer: "دەستگەیشتن بە هەموو تەفسیرەکان" },
  macedonian: { showTafsir: "Прикажи тефсир", showTranslations: "Прикажи преводи", accessToTafseer: "Пристап до сите тефсири" },
  malay: { showTafsir: "Tunjuk Tafsir", showTranslations: "Tunjuk Terjemahan", accessToTafseer: "Akses kepada semua Tafsir" },
  maltese: { showTafsir: "Uri Tafsir", showTranslations: "Uri Traduzzjonijiet", accessToTafseer: "Aċċess għat-Tafaseer kollha" },
  nepali: { showTafsir: "तफसीर देखाउनुहोस्", showTranslations: "अनुवादहरू देखाउनुहोस्", accessToTafseer: "सबै तफसीरहरूमा पहुँच" },
  norwegian: { showTafsir: "Vis Tafsir", showTranslations: "Vis oversettelser", accessToTafseer: "Tilgang til alle Tafaseer" },
  persian: { showTafsir: "نمایش تفسیر", showTranslations: "نمایش ترجمه‌ها", accessToTafseer: "دسترسی به تمام تفاسیر" },
  polish: { showTafsir: "Pokaż Tafsir", showTranslations: "Pokaż tłumaczenia", accessToTafseer: "Dostęp do wszystkich Tafaseer" },
  filipino: { showTafsir: "Ipakita ang Tafsir", showTranslations: "Ipakita ang Pagsasalin", accessToTafseer: "Access sa lahat ng Tafaseer" },
  romanian: { showTafsir: "Arată Tafsir", showTranslations: "Arată Traducerile", accessToTafseer: "Acces la toate Tafaseer" },
  dutch: { showTafsir: "Toon Tafsir", showTranslations: "Toon Vertalingen", accessToTafseer: "Toegang tot alle Tafaseer" },
  slovak: { showTafsir: "Zobraziť Tafsír", showTranslations: "Zobraziť preklady", accessToTafseer: "Prístup ku všetkým Tafaseer" },
  somali: { showTafsir: "Muuji Tafsiirka", showTranslations: "Muuji Tarjumaada", accessToTafseer: "Helida dhamaan Tafsiirada" },
  swedish: { showTafsir: "Visa Tafsir", showTranslations: "Visa översättningar", accessToTafseer: "Tillgång till alla Tafaseer" },
  turkish: { showTafsir: "Tefsiri Göster", showTranslations: "Çevirileri Göster", accessToTafseer: "Tüm Tefsirlere Erişim" },
  uzbek: { showTafsir: "Tafsirni ko'rsatish", showTranslations: "Tarjimalarni ko'rsatish", accessToTafseer: "Barcha tafsirlarga kirish" },
  finnish: { showTafsir: "Näytä Tafsir", showTranslations: "Näytä käännökset", accessToTafseer: "Pääsy kaikkiin Tafaseer" },
  tamil: { showTafsir: "தப்ஸீரைக் காட்டு", showTranslations: "மொழிபெயர்ப்புகளைக் காட்டு", accessToTafseer: "அனைத்து தப்ஸீர்களுக்கான அணுகல்" }
};

const FILE_PATH = path.join(__dirname, '../app/constants/appTranslations.js');
const content = fs.readFileSync(FILE_PATH, 'utf8');
const lines = content.split('\n');
const newLines = [];

let currentLang = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  newLines.push(line);

  const langMatch = line.match(/^const ([a-zA-Z]+) = \{/);
  if (langMatch) {
    currentLang = langMatch[1];
  }

  if (currentLang && TRANSLATIONS[currentLang]) {
    const trans = TRANSLATIONS[currentLang];
    
    // If we hit quranUI
    if (line.match(/"quranUI"\s*:\s*\{/)) {
      // Look ahead to see if it's already there
      let hasShowTafsir = false;
      let hasAccessToTafseer = false;
      for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
        if (lines[j].includes('"showTafsir":')) hasShowTafsir = true;
        if (lines[j].includes('"accessToTafseer":')) hasAccessToTafseer = true;
        if (lines[j].match(/\},?/)) break; // End of quranUI block
      }
      
      if (!hasShowTafsir) {
        newLines.push(`    "showTafsir": "${trans.showTafsir}",`);
      }
      if (!hasAccessToTafseer) {
        newLines.push(`    "accessToTafseer": "${trans.accessToTafseer}",`);
      }
    }

    // If we hit sunnahUI
    if (line.match(/"sunnahUI"\s*:\s*\{/)) {
      let hasShowTranslations = false;
      for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
        if (lines[j].includes('"showTranslations":')) hasShowTranslations = true;
        if (lines[j].match(/\},?/)) break; // End of sunnahUI block
      }
      
      if (!hasShowTranslations) {
        newLines.push(`    "showTranslations": "${trans.showTranslations}",`);
      }
    }
  }
}

fs.writeFileSync(FILE_PATH, newLines.join('\n'), 'utf8');
console.log('Successfully injected line by line.');
