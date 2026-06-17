const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../app/constants/appTranslations.js');
let fileContent = fs.readFileSync(targetFile, 'utf8');

const translations = {
  chinese: { pdfFailed: "PDF生成失败", pdfFailedMsg: "无法为此书签生成PDF。", showTafsir: "显示Tafsir (解释)", showTranslations: "显示翻译" },
  hindi: { pdfFailed: "PDF विफल", pdfFailedMsg: "इस बुकमार्क के लिए PDF उत्पन्न नहीं हो सका।", showTafsir: "तफ़सीर दिखाएं", showTranslations: "अनुवाद दिखाएं" },
  spanish: { pdfFailed: "PDF Fallido", pdfFailedMsg: "No se pudo generar el PDF para este marcador.", showTafsir: "Mostrar Tafsir", showTranslations: "Mostrar Traducciones" },
  french: { pdfFailed: "Échec du PDF", pdfFailedMsg: "Impossible de générer le PDF pour ce signet.", showTafsir: "Afficher le Tafsir", showTranslations: "Afficher les Traductions" },
  bengali: { pdfFailed: "PDF ব্যর্থ হয়েছে", pdfFailedMsg: "এই বুকমার্কের জন্য PDF তৈরি করা যায়নি।", showTafsir: "তাফসির দেখান", showTranslations: "অনুবাদ দেখান" },
  portuguese: { pdfFailed: "Falha no PDF", pdfFailedMsg: "Não foi possível gerar o PDF para este marcador.", showTafsir: "Mostrar Tafsir", showTranslations: "Mostrar Traduções" },
  russian: { pdfFailed: "Ошибка PDF", pdfFailedMsg: "Не удалось создать PDF для этой закладки.", showTafsir: "Показать Тафсир", showTranslations: "Показать Переводы" },
  urdu: { pdfFailed: "PDF ناکام", pdfFailedMsg: "اس بک مارک کے لیے PDF نہیں بنائی جا سکی۔", showTafsir: "تفسیر دکھائیں", showTranslations: "ترجمہ دکھائیں" },
  german: { pdfFailed: "PDF Fehlgeschlagen", pdfFailedMsg: "PDF für dieses Lesezeichen konnte nicht generiert werden.", showTafsir: "Tafsir Anzeigen", showTranslations: "Übersetzungen Anzeigen" },
  japanese: { pdfFailed: "PDF失敗", pdfFailedMsg: "このブックマークのPDFを生成できませんでした。", showTafsir: "タフスィールを表示", showTranslations: "翻訳を表示" },
  italian: { pdfFailed: "PDF Non Riuscito", pdfFailedMsg: "Impossibile generare il PDF per questo segnalibro.", showTafsir: "Mostra Tafsir", showTranslations: "Mostra Traduzioni" },
  korean: { pdfFailed: "PDF 실패", pdfFailedMsg: "이 북마크에 대한 PDF를 생성할 수 없습니다.", showTafsir: "타프시르 보기", showTranslations: "번역 보기" },
  kurdish: { pdfFailed: "PDF têk çû", pdfFailedMsg: "Pêk anîna PDF ji bo vê nîşanê nehate kirin.", showTafsir: "Tefsîr Nîşan Bide", showTranslations: "Werger Nîşan Bide" },
  macedonian: { pdfFailed: "Неуспешен PDF", pdfFailedMsg: "Не може да се генерира PDF за овој обележувач.", showTafsir: "Прикажи Тафсир", showTranslations: "Прикажи Преводи" },
  malay: { pdfFailed: "PDF Gagal", pdfFailedMsg: "Tidak dapat menjana PDF untuk penanda halaman ini.", showTafsir: "Papar Tafsir", showTranslations: "Papar Terjemahan" },
  maltese: { pdfFailed: "PDF Falla", pdfFailedMsg: "Ma setax jiġi ġġenerat PDF għal dan il-bookmark.", showTafsir: "Uri t-Tafsir", showTranslations: "Uri t-Traduzzjonijiet" },
  nepali: { pdfFailed: "PDF असफल", pdfFailedMsg: "यस बुकमार्कको लागि PDF उत्पन्न गर्न सकिएन।", showTafsir: "तफसीर देखाउनुहोस्", showTranslations: "अनुवाद देखाउनुहोस्" },
  norwegian: { pdfFailed: "PDF Mislyktes", pdfFailedMsg: "Kunne ikke generere PDF for dette bokmerket.", showTafsir: "Vis Tafsir", showTranslations: "Vis Oversettelser" },
  persian: { pdfFailed: "خطا در ایجاد PDF", pdfFailedMsg: "تولید PDF برای این نشانک امکان‌پذیر نبود.", showTafsir: "نمایش تفسیر", showTranslations: "نمایش ترجمه‌ها" },
  polish: { pdfFailed: "Błąd PDF", pdfFailedMsg: "Nie można wygenerować PDF dla tej zakładki.", showTafsir: "Pokaż Tafsir", showTranslations: "Pokaż Tłumaczenia" },
  filipino: { pdfFailed: "Nabigo ang PDF", pdfFailedMsg: "Hindi makabuo ng PDF para sa bookmark na ito.", showTafsir: "Ipakita ang Tafsir", showTranslations: "Ipakita ang Pagsasalin" },
  romanian: { pdfFailed: "PDF Eșuat", pdfFailedMsg: "Nu s-a putut genera PDF pentru acest marcaj.", showTafsir: "Afișează Tafsir", showTranslations: "Afișează Traduceri" },
  dutch: { pdfFailed: "PDF Mislukt", pdfFailedMsg: "Kon geen PDF genereren voor deze bladwijzer.", showTafsir: "Toon Tafsir", showTranslations: "Toon Vertalingen" },
  slovak: { pdfFailed: "Zlyhanie PDF", pdfFailedMsg: "Nepodarilo sa vygenerovať PDF pre túto záložku.", showTafsir: "Zobraziť Tafsír", showTranslations: "Zobraziť Preklady" },
  somali: { pdfFailed: "PDF Wuu Fashilmay", pdfFailedMsg: "Lama abuuri karin PDF calaamadan.", showTafsir: "Muuji Tafsiir", showTranslations: "Muuji Tarjumaada" },
  swedish: { pdfFailed: "PDF Misslyckades", pdfFailedMsg: "Kunde inte generera PDF för detta bokmärke.", showTafsir: "Visa Tafsir", showTranslations: "Visa Översättningar" },
  turkish: { pdfFailed: "PDF Başarısız", pdfFailedMsg: "Bu yer işareti için PDF oluşturulamadı.", showTafsir: "Tefsiri Göster", showTranslations: "Çevirileri Göster" },
  uzbek: { pdfFailed: "PDF xatosi", pdfFailedMsg: "Bu xatcho'p uchun PDF yaratilmadi.", showTafsir: "Tafsirni Ko'rsatish", showTranslations: "Tarjimalarni Ko'rsatish" },
  finnish: { pdfFailed: "PDF Epäonnistui", pdfFailedMsg: "PDF:ää ei voitu luoda tälle kirjanmerkille.", showTafsir: "Näytä Tafsir", showTranslations: "Näytä Käännökset" },
  tamil: { pdfFailed: "PDF தோல்வியடைந்தது", pdfFailedMsg: "இந்த புத்தகக்குறிக்கு PDF ஐ உருவாக்க முடியவில்லை.", showTafsir: "தப்ஸீரைக் காட்டு", showTranslations: "மொழிபெயர்ப்புகளைக் காட்டு" }
};

async function main() {
  const languages = Object.keys(translations);
  
  for (const lang of languages) {
    const t = translations[lang];

    // Replace showTafsir in quranUI
    const quranUIRegex = new RegExp(`(const ${lang} = \\{[\\s\\S]*?\\"quranUI\\"\\s*:\\s*\\{)([^}]*)(\\})`);
    fileContent = fileContent.replace(quranUIRegex, (match, p1, p2, p3) => {
      let replacement = p2;
      // if it exists, replace it
      if (replacement.includes('"showTafsir"')) {
        replacement = replacement.replace(/"showTafsir"\s*:\s*"[^"]*"/, `"showTafsir": "${t.showTafsir}"`);
      } else {
        replacement = replacement.trimRight();
        if (!replacement.endsWith(',')) replacement += ',';
        replacement += `\n    "showTafsir": "${t.showTafsir}"\n  `;
      }
      return p1 + replacement + p3;
    });

    // Replace showTranslations in sunnahUI
    const sunnahUIRegex = new RegExp(`(const ${lang} = \\{[\\s\\S]*?\\"sunnahUI\\"\\s*:\\s*\\{)([^}]*)(\\})`);
    fileContent = fileContent.replace(sunnahUIRegex, (match, p1, p2, p3) => {
      let replacement = p2;
      if (replacement.includes('"showTranslations"')) {
        replacement = replacement.replace(/"showTranslations"\s*:\s*"[^"]*"/, `"showTranslations": "${t.showTranslations}"`);
      } else {
        replacement = replacement.trimRight();
        if (!replacement.endsWith(',')) replacement += ',';
        replacement += `\n    "showTranslations": "${t.showTranslations}"\n  `;
      }
      return p1 + replacement + p3;
    });

    // Replace pdfFailed and pdfFailedMsg in bookmarks
    const bookmarksRegex = new RegExp(`(const ${lang} = \\{[\\s\\S]*?\\"bookmarks\\"\\s*:\\s*\\{)([^}]*)(\\})`);
    fileContent = fileContent.replace(bookmarksRegex, (match, p1, p2, p3) => {
      let replacement = p2;
      
      if (replacement.includes('"pdfFailed"')) {
        replacement = replacement.replace(/"pdfFailed"\s*:\s*"[^"]*"/, `"pdfFailed": "${t.pdfFailed}"`);
      } else {
        replacement = replacement.trimRight();
        if (!replacement.endsWith(',')) replacement += ',';
        replacement += `\n    "pdfFailed": "${t.pdfFailed}",`;
      }

      if (replacement.includes('"pdfFailedMsg"')) {
        replacement = replacement.replace(/"pdfFailedMsg"\s*:\s*"[^"]*"/, `"pdfFailedMsg": "${t.pdfFailedMsg}"`);
      } else {
        replacement = replacement.trimRight();
        if (!replacement.endsWith(',')) replacement += ',';
        replacement += `\n    "pdfFailedMsg": "${t.pdfFailedMsg}"\n  `;
      }
      
      return p1 + replacement + p3;
    });
  }

  fs.writeFileSync(targetFile, fileContent, 'utf8');
  console.log('Done replacing hardcoded translations.');
}

main().catch(console.error);
