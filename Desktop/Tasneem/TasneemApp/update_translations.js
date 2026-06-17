const fs = require('fs');
const file = 'app/constants/appTranslations.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/"offlineModeTitle": "Offline mode",/g, '"showTranslations": "Show Translations",\n    "selectTranslation": "Select Translation",\n    "arabicOnly": "Arabic only",\n    "translationNotAvailable": "Translation not available for this hadith.",\n    "connectionError": "Could not load translation. Check your connection.",\n    "offlineModeTitle": "Offline mode",');
content = content.replace(/"وضع عدم الاتصال",/g, '"Show Translations",\n    "selectTranslation": "Select Translation",\n    "arabicOnly": "Arabic only",\n    "translationNotAvailable": "Translation not available for this hadith.",\n    "connectionError": "Could not load translation. Check your connection.",\n    "offlineModeTitle": "وضع عدم الاتصال",');


content = content.replace(/"saveBookmarkTitle": "Save Quran Bookmark",/g, '"showTafsir": "Show Tafsir",\n    "selectTafsir": "Select Tafsir",\n    "previous": "Previous",\n    "next": "Next",\n    "accessToTafaseer": "Access to all Tafaseer",\n    "saveBookmarkTitle": "Save Quran Bookmark",');
content = content.replace(/"حفظ إشارة مرجعية في القرآن",/g, '"Show Tafsir",\n    "selectTafsir": "Select Tafsir",\n    "previous": "Previous",\n    "next": "Next",\n    "accessToTafaseer": "Access to all Tafaseer",\n    "saveBookmarkTitle": "حفظ إشارة مرجعية في القرآن",');

fs.writeFileSync(file, content);
console.log('done');
