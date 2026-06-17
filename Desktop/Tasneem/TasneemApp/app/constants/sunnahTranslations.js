/**
 * sunnahTranslations.js
 *
 * Maps each hadith book key to the list of available translation editions
 * (language code + display label). Arabic (ara) and Dehlawi (dehlawi) are
 * intentionally excluded per product requirements.
 *
 * Source: cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/
 * File naming pattern: {lang}-{book}.min.json
 */

export const LANG_LABELS = {
  eng: 'English',
  fra: 'Français',
  ind: 'Indonesia',
  ben: 'বাংলা',
  tur: 'Türkçe',
  urd: 'اردو',
  rus: 'Русский',
  tam: 'தமிழ்',
};

/** lang codes whose text is RTL */
export const RTL_LANGS = new Set(['urd']);

/**
 * For each book, list the language codes that have a translation file.
 * Derived from the repository file listing (Arabic & Dehlawi excluded).
 */
export const BOOK_TRANSLATIONS = {
  abudawud: ['eng', 'fra', 'ind', 'ben', 'tur', 'urd', 'rus'],
  bukhari: ['eng', 'fra', 'ind', 'ben', 'tur', 'urd', 'rus', 'tam'],
  ibnmajah: ['eng', 'fra', 'ind', 'ben', 'tur', 'urd'],
  malik: ['eng', 'fra', 'ind', 'ben', 'tur', 'urd'],
  muslim: ['eng', 'fra', 'ind', 'ben', 'tur', 'urd', 'rus', 'tam'],
  nasai: ['eng', 'fra', 'ind', 'ben', 'tur', 'urd'],
  nawawi: ['eng', 'fra', 'ben', 'tur'],
  tirmidhi: ['eng', 'ind', 'ben', 'tur', 'urd'],
  qudsi: ['eng', 'fra'],
};

/**
 * Returns available translations for a given book as
 * [{ code: 'eng', label: 'English' }, …]
 */
export function getAvailableTranslations(bookKey) {
  const codes = BOOK_TRANSLATIONS[bookKey] ?? [];
  return codes.map((code) => ({ code, label: LANG_LABELS[code] ?? code }));
}

/**
 * Returns all translation options, flagging availability.
 */
export function getAllTranslations(bookKey) {
  const availableCodes = new Set(BOOK_TRANSLATIONS[bookKey] ?? []);
  return Object.keys(LANG_LABELS).map((code) => ({
    code,
    label: LANG_LABELS[code],
    available: availableCodes.has(code),
  }));
}

/**
 * Builds the CDN URL for a translation edition.
 */
export function translationUrl(langCode, bookKey) {
  return `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${langCode}-${bookKey}.min.json`;
}
