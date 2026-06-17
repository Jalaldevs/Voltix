const fs = require('fs');

// --- 1. Update appTranslations.js (English) ---
const appPath = 'app/constants/appTranslations.js';
let app = fs.readFileSync(appPath, 'utf-8');

const basmalaInsert = `    basmala: 'In the name of Allah, the Most Gracious, the Most Merciful.',`;

// Find quranUI block in English
app = app.replace("  quranUI: {\n", "  quranUI: {\n" + basmalaInsert + "\n");
fs.writeFileSync(appPath, app, 'utf-8');
console.log("appTranslations.js updated.");

// --- 2. Update autoI18nOverrides.js (Systematic) ---
const overridesPath = 'app/constants/autoI18nOverrides.js';
let raw = fs.readFileSync(overridesPath, 'utf-8');
const startIdx = raw.indexOf('= {');
const endIdx = raw.lastIndexOf('};');
const objStr = raw.substring(startIdx + 2, endIdx + 1);
const data = eval('(' + objStr + ')');

const basmalaMap = {
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", chinese: "奉至仁至慈的安拉之名", hindi: "अल्लाह के नाम से, जो अत्यंत दयालु और कृपाशील है।",
    spanish: "En el nombre de Alá, el Compasivo, el Misericordioso.", french: "Au nombre d'Allah, le Tout Miséricordieux, le Très Miséricordieux.",
    bengali: "পরম করুণাময় ও অসীম দয়ালু আল্লাহর নামে।", portuguese: "Em nome de Alá, o Compassivo, o Misericordioso.",
    russian: "Во имя Аллаха, Милостивого, Милосердного!", urdu: "اللہ کے نام سے جو بڑا مہربان نہایت رحم والا ہے۔",
    german: "Im Namen Allahs, des Gnädigen, des Barmherzigen.", japanese: "慈悲深く慈愛あまねきアッラーの御名において。",
    italian: "In nome di Allah, il Compassionevole, il Misericordioso.", korean: "자비롭고 자애로우신 알라의 이름으로.",
    turkish: "Rahmân ve Rahîm olan Allah'ın adıyla.", dutch: "In de naam van Allah, de Barmhartige, de Genadevolle.",
    polish: "W imię Allaha, Miłosiernego, Litościwego.", filipino: "Sa ngalan ni Allah, ang Mapagpala, ang Maawain.",
    romanian: "În numele lui Allah Cel Milostiv, Îndurător.", somali: "Bishinka Ilaahay oo ah kan naxariista leh, kan naxariista leh.",
    slovak: "V mene Alaha, Milostivého, Milosrdného.", swedish: "I Allahs, den barmhärtiges, den nåderikes namn.",
    finnish: "Allahin, Lempeän ja Laupliaan nimeen.", uzbek: "Mehribon va rahmli Alloh nomi bilan.",
    maltese: "F’isem Alla, il-Ħanin, il-Ħanin.", malay: "Dengan nama Allah, Yang Maha Pemurah, lagi Maha Mengasihani.",
    macedonian: "Во името на Аллах, Милостивиот, Сомилосниот.", kurdish: "به ناوی خوای به خشنده و میهره بان",
    nepali: "अल्लाहको नाममा, जो अत्यन्त दयालु र कृपाशील छ।", persian: "به نام خداوند بخشنده مهربان", norwegian: "I Allahs namn, den barmhjertige, den nådige."
};

Object.keys(data).forEach(lang => {
    if (!data[lang].quranUI) data[lang].quranUI = {};
    data[lang].quranUI.basmala = basmalaMap[lang] || basmalaMap.english;
});

const newContent = "const autoI18nOverrides = " + JSON.stringify(data, null, 2) + ";\n\nexport default autoI18nOverrides;";
fs.writeFileSync(overridesPath, newContent, 'utf-8');
console.log("autoI18nOverrides.js updated.");
