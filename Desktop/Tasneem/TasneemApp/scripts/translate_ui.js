const fs = require('fs');
const path = require('path');

const TRANSLATIONS = {
  english: {
    showTafsir: "Show Tafsir",
    showTranslations: "Show Translations",
    bookmarksTitle: "Unlock premium tafseer options",
    accessToTafseer: "Access to all Tafaseer"
  },
  arabic: {
    showTafsir: "عرض التفسير",
    showTranslations: "عرض التراجم",
    bookmarksTitle: "افتح خيارات التفسير المميزة",
    accessToTafseer: "الوصول إلى جميع التفاسير"
  },
  chinese: {
    showTafsir: "显示经注",
    showTranslations: "显示翻译",
    bookmarksTitle: "解锁高级经注选项",
    accessToTafseer: "访问所有经注"
  },
  hindi: {
    showTafsir: "तफ़सीर दिखाएं",
    showTranslations: "अनुवाद दिखाएं",
    bookmarksTitle: "प्रीमियम तफ़सीर विकल्प अनलॉक करें",
    accessToTafseer: "सभी तफ़सीरों तक पहुँच"
  },
  spanish: {
    showTafsir: "Mostrar Tafsir",
    showTranslations: "Mostrar Traducciones",
    bookmarksTitle: "Desbloquea opciones de tafsir premium",
    accessToTafseer: "Acceso a todos los Tafaseer"
  },
  french: {
    showTafsir: "Afficher le Tafsir",
    showTranslations: "Afficher les traductions",
    bookmarksTitle: "Débloquez les options de tafsir premium",
    accessToTafseer: "Accès à tous les Tafaseer"
  },
  bengali: {
    showTafsir: "তাফসির দেখান",
    showTranslations: "অনুবাদ দেখান",
    bookmarksTitle: "প্রিমিয়াম তাফসির বিকল্পগুলি আনলক করুন",
    accessToTafseer: "সব তাফসিরের অ্যাক্সেস"
  },
  portuguese: {
    showTafsir: "Mostrar Tafsir",
    showTranslations: "Mostrar Traduções",
    bookmarksTitle: "Desbloquear opções de tafsir premium",
    accessToTafseer: "Acesso a todos os Tafaseer"
  },
  russian: {
    showTafsir: "Показать Тафсир",
    showTranslations: "Показать переводы",
    bookmarksTitle: "Разблокируйте премиальные опции тафсира",
    accessToTafseer: "Доступ ко всем Тафсирам"
  },
  urdu: {
    showTafsir: "تفسیر دکھائیں",
    showTranslations: "تراجم دکھائیں",
    bookmarksTitle: "پریمیم تفسیر کے اختیارات کو ان لاک کریں",
    accessToTafseer: "تمام تفاسیر تک رسائی"
  },
  german: {
    showTafsir: "Tafsir anzeigen",
    showTranslations: "Übersetzungen anzeigen",
    bookmarksTitle: "Premium-Tafsir-Optionen freischalten",
    accessToTafseer: "Zugang zu allen Tafaseer"
  },
  japanese: {
    showTafsir: "タフスィールを表示",
    showTranslations: "翻訳を表示",
    bookmarksTitle: "プレミアムタフスィールオプションのロック解除",
    accessToTafseer: "すべてのタフスィールへのアクセス"
  },
  italian: {
    showTafsir: "Mostra Tafsir",
    showTranslations: "Mostra traduzioni",
    bookmarksTitle: "Sblocca le opzioni di tafsir premium",
    accessToTafseer: "Accesso a tutti i Tafaseer"
  },
  korean: {
    showTafsir: "타프시르 표시",
    showTranslations: "번역 표시",
    bookmarksTitle: "프리미엄 타프시르 옵션 잠금 해제",
    accessToTafseer: "모든 타프시르 이용"
  },
  kurdish: {
    showTafsir: "تەفسیر نیشان بدە",
    showTranslations: "وەرگێڕانەکان نیشان بدە",
    bookmarksTitle: "بژاردە تایبەتەکانی تەفسیر بکەرەوە",
    accessToTafseer: "دەستگەیشتن بە هەموو تەفسیرەکان"
  },
  macedonian: {
    showTafsir: "Прикажи тефсир",
    showTranslations: "Прикажи преводи",
    bookmarksTitle: "Отклучи премиум тефсир опции",
    accessToTafseer: "Пристап до сите тефсири"
  },
  malay: {
    showTafsir: "Tunjuk Tafsir",
    showTranslations: "Tunjuk Terjemahan",
    bookmarksTitle: "Buka pilihan tafsir premium",
    accessToTafseer: "Akses kepada semua Tafsir"
  },
  maltese: {
    showTafsir: "Uri Tafsir",
    showTranslations: "Uri Traduzzjonijiet",
    bookmarksTitle: "Iftaħ l-għażliet tat-tafsir premium",
    accessToTafseer: "Aċċess għat-Tafaseer kollha"
  },
  nepali: {
    showTafsir: "तफसीर देखाउनुहोस्",
    showTranslations: "अनुवादहरू देखाउनुहोस्",
    bookmarksTitle: "प्रिमियम तफसीर विकल्पहरू अनलक गर्नुहोस्",
    accessToTafseer: "सबै तफसीरहरूमा पहुँच"
  },
  norwegian: {
    showTafsir: "Vis Tafsir",
    showTranslations: "Vis oversettelser",
    bookmarksTitle: "Lås opp premium tafsir-alternativer",
    accessToTafseer: "Tilgang til alle Tafaseer"
  },
  persian: {
    showTafsir: "نمایش تفسیر",
    showTranslations: "نمایش ترجمه‌ها",
    bookmarksTitle: "باز کردن گزینه‌های ویژه تفسیر",
    accessToTafseer: "دسترسی به تمام تفاسیر"
  },
  polish: {
    showTafsir: "Pokaż Tafsir",
    showTranslations: "Pokaż tłumaczenia",
    bookmarksTitle: "Odblokuj opcje tafsir premium",
    accessToTafseer: "Dostęp do wszystkich Tafaseer"
  },
  filipino: {
    showTafsir: "Ipakita ang Tafsir",
    showTranslations: "Ipakita ang Pagsasalin",
    bookmarksTitle: "I-unlock ang mga premium na pagpipilian sa tafsir",
    accessToTafseer: "Access sa lahat ng Tafaseer"
  },
  romanian: {
    showTafsir: "Arată Tafsir",
    showTranslations: "Arată Traducerile",
    bookmarksTitle: "Deblochează opțiuni tafsir premium",
    accessToTafseer: "Acces la toate Tafaseer"
  },
  dutch: {
    showTafsir: "Toon Tafsir",
    showTranslations: "Toon Vertalingen",
    bookmarksTitle: "Ontgrendel premium tafsir-opties",
    accessToTafseer: "Toegang tot alle Tafaseer"
  },
  slovak: {
    showTafsir: "Zobraziť Tafsír",
    showTranslations: "Zobraziť preklady",
    bookmarksTitle: "Odomknite prémiové možnosti tafsíru",
    accessToTafseer: "Prístup ku všetkým Tafaseer"
  },
  somali: {
    showTafsir: "Muuji Tafsiirka",
    showTranslations: "Muuji Tarjumaada",
    bookmarksTitle: "Furo ikhtiyaarada tafsiirka premium",
    accessToTafseer: "Helida dhamaan Tafsiirada"
  },
  swedish: {
    showTafsir: "Visa Tafsir",
    showTranslations: "Visa översättningar",
    bookmarksTitle: "Lås upp premium tafsir-alternativ",
    accessToTafseer: "Tillgång till alla Tafaseer"
  },
  turkish: {
    showTafsir: "Tefsiri Göster",
    showTranslations: "Çevirileri Göster",
    bookmarksTitle: "Premium tefsir seçeneklerinin kilidini aç",
    accessToTafseer: "Tüm Tefsirlere Erişim"
  },
  uzbek: {
    showTafsir: "Tafsirni ko'rsatish",
    showTranslations: "Tarjimalarni ko'rsatish",
    bookmarksTitle: "Premium tafsir imkoniyatlarini oching",
    accessToTafseer: "Barcha tafsirlarga kirish"
  },
  finnish: {
    showTafsir: "Näytä Tafsir",
    showTranslations: "Näytä käännökset",
    bookmarksTitle: "Avaa premium-tafsir-vaihtoehdot",
    accessToTafseer: "Pääsy kaikkiin Tafaseer"
  },
  tamil: {
    showTafsir: "தப்ஸீரைக் காட்டு",
    showTranslations: "மொழிபெயர்ப்புகளைக் காட்டு",
    bookmarksTitle: "பிரீமியம் தப்ஸீர் விருப்பங்களை திறக்கவும்",
    accessToTafseer: "அனைத்து தப்ஸீர்களுக்கான அணுகல்"
  }
};

const FILE_PATH = path.join(__dirname, '../app/constants/appTranslations.js');
let content = fs.readFileSync(FILE_PATH, 'utf8');

// List of all languages
const languages = Object.keys(TRANSLATIONS);

for (const lang of languages) {
  const trans = TRANSLATIONS[lang];
  if (!trans) continue;

  // 1. Inject quranUI and sunnahUI at the top of the language object if they don't exist
  const langDeclRegex = new RegExp(`const ${lang} = \\{`);
  if (!content.match(langDeclRegex)) {
    console.warn(`Language ${lang} not found in appTranslations.js`);
    continue;
  }

  // Check if quranUI exists in this block
  // A naive check: split by `const ${lang} = {` and inject right after
  const parts = content.split(langDeclRegex);
  if (parts.length === 2) {
    let block = parts[1];
    
    // Inject quranUI & sunnahUI
    // Make sure we only inject once
    if (!block.includes('"quranUI":')) {
      const injection = `
  "quranUI": {
    "showTafsir": "${trans.showTafsir}",
    "accessToTafseer": "${trans.accessToTafseer}"
  },
  "sunnahUI": {
    "showTranslations": "${trans.showTranslations}"
  },`;
      block = injection + block;
    }

    // 2. Replace bookmarksTitle inside premium.features
    // We only want to replace it inside THIS language block.
    // So we'll replace the first occurrence of "bookmarksTitle": "..." in this block
    const bookmarksRegex = /("bookmarksTitle"\s*:\s*)"([^"]+)"/;
    if (block.match(bookmarksRegex)) {
      block = block.replace(bookmarksRegex, `$1"${trans.bookmarksTitle}"`);
    }

    content = parts[0] + `const ${lang} = {` + block;
  }
}

fs.writeFileSync(FILE_PATH, content, 'utf8');
console.log('Successfully updated appTranslations.js with UI translations and premium bookmarks title.');
