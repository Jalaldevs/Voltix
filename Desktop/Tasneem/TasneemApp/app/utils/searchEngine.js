// searchEngine.js — Core search algorithms: index building, query parsing, full-text search
//
// This module is pure JavaScript with no React dependencies.
// Ported from Header.jsx search logic + new full-text search.

import surahs from '../constants/surahs';
import { BOOKS, booksFrontEnd } from '../constants/sunnahBooks';
import { normaliseGrade, getBestGrade } from './gradeUtils';
import { readOfflineSunnahEdition } from './offlineContent';

// ─── STRING NORMALISATION ─────────────────────────────────────────────────────

export const normalizeBookLookup = (value) =>
  String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');



const stripDiacritics = (text) => {
  if (!text) return '';
  // Remove Arabic diacritics (tashkeel) and normalize letters
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g, '')
    .replace(/[أإآ]/g, 'ا') // Normalize Alef
    .replace(/ة/g, 'ه')    // Normalize Teh Marbuta to Heh
    .replace(/[يى]/g, 'ي'); // Normalize Alef Maksura to Yaa
};

const cleanHadithText = (text) => {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
};

// ─── SURAH ALIASES (ported from Header.jsx) ───────────────────────────────────

export const SURAH_ALIASES = {
  fatiha: 1, fatihah: 1, alfatiha: 1, alfatihah: 1, opening: 1,
  baqara: 2, baqarah: 2, albaqara: 2, albaqarah: 2, cow: 2,
  imran: 3, alimran: 3, alimraan: 3,
  nisa: 4, nisaa: 4, alnisa: 4, alnisaa: 4, women: 4,
  maidah: 5, almaidah: 5, maaida: 5, table: 5,
  anam: 6, alanam: 6, cattle: 6,
  araf: 7, alaraf: 7, heights: 7,
  anfal: 8, alanfal: 8, spoils: 8,
  tawba: 9, tawbah: 9, attawbah: 9, repentance: 9, baraa: 9,
  yunus: 10, jonah: 10,
  hud: 11,
  yusuf: 12, joseph: 12,
  ibrahim: 14, abraham: 14,
  kahf: 18, alkahf: 18, cave: 18,
  maryam: 19, mary: 19,
  taha: 20, taa: 20,
  anbiya: 21, prophets: 21,
  hajj: 22, pilgrimage: 22,
  nur: 24, annur: 24, light: 24,
  furqan: 25, criterion: 25,
  shuara: 26, poets: 26,
  naml: 27, ants: 27,
  ankabut: 29, spider: 29,
  luqman: 31,
  sajda: 32, sajdah: 32, prostration: 32,
  yasin: 36, yaseen: 36, yaasin: 36,
  saffat: 37, saffaat: 37,
  zumar: 39, groups: 39,
  ghafir: 40, mumin: 40,
  fussilat: 41,
  shura: 42, consultation: 42,
  zukhruf: 43, ornaments: 43,
  jathiyah: 45, crouching: 45,
  hujurat: 49, rooms: 49,
  qaf: 50,
  dhariyat: 51,
  tur: 52, mount: 52,
  najm: 53, star: 53,
  qamar: 54, moon: 54,
  rahman: 55, alrahman: 55, arrahman: 55, merciful: 55,
  waqia: 56, waqiah: 56, alwaqia: 56, alwaqiah: 56, event: 56,
  hadid: 57, iron: 57,
  mujadila: 58,
  hashr: 59, exile: 59,
  mumtahana: 60,
  saf: 61, ranks: 61,
  jumuah: 62, juma: 62, friday: 62,
  munafiqun: 63, hypocrites: 63,
  taghabun: 64,
  talaq: 65, divorce: 65,
  tahrim: 66,
  mulk: 67, almulk: 67, kingdom: 67, sovereignty: 67,
  qalam: 68, pen: 68,
  haqqah: 69,
  maarij: 70, ascent: 70,
  nuh: 71, noah: 71,
  jinn: 72,
  muzzammil: 73,
  muddaththir: 74,
  qiyama: 75, qiyamah: 75, resurrection: 75,
  insan: 76, human: 76, dahr: 76,
  mursalat: 77,
  naba: 78, news: 78,
  naziat: 79,
  abasa: 80,
  takwir: 81,
  infitar: 82,
  mutaffifin: 83,
  inshiqaq: 84,
  buruj: 85,
  tariq: 86,
  ala: 87, alala: 87,
  ghashiyah: 88, ghashiya: 88,
  fajr: 89, dawn: 89,
  balad: 90, city: 90,
  shams: 91, sun: 91,
  layl: 92, night: 92,
  duha: 93, morning: 93,
  sharh: 94, inshirah: 94, relief: 94,
  tin: 95, fig: 95,
  alaq: 96, clot: 96, iqra: 96,
  qadr: 97, alqadr: 97, power: 97, laylatalqadr: 97,
  bayyinah: 98, evidence: 98,
  zalzalah: 99, earthquake: 99,
  adiyat: 100,
  qariah: 101,
  takathur: 102,
  asr: 103, time: 103,
  humazah: 104, humaza: 104,
  fil: 105, elephant: 105,
  quraysh: 106, quraish: 106,
  maun: 107, maaun: 107,
  kawthar: 108, kauthar: 108, abundance: 108,
  kafirun: 109, kaafiroon: 109, disbelievers: 109,
  nasr: 110, victory: 110,
  masad: 111, lahab: 111, palm: 111,
  ikhlas: 112, alikhlas: 112, sincerity: 112, purity: 112,
  falaq: 113, alfalaq: 113, daybreak: 113,
  nas: 114, alnas: 114, mankind: 114, people: 114,
};

// ─── SUNNAH BOOK ALIASES (ported from Header.jsx) ────────────────────────────

export const SUNNAH_BOOK_ALIASES = {
  bukhari: 'bukhari', sahihbukhari: 'bukhari', saheehbukhari: 'bukhari',
  albukhari: 'bukhari', imambukhari: 'bukhari',
  nasai: 'nasai', nasaai: 'nasai', nasaa: 'nasai', nasaee: 'nasai',
  nasaei: 'nasai', annasai: 'nasai', sunnannasai: 'nasai',
  abudawud: 'abudawud', abudaud: 'abudawud', abudawood: 'abudawud',
  dawud: 'abudawud', dawood: 'abudawud', abu: 'abudawud',
  abidawood: 'abudawud', sunanabidawud: 'abudawud',
  muslim: 'muslim', sahihmuslim: 'muslim', saheehmuslim: 'muslim', imammuslim: 'muslim',
  tirmidhi: 'tirmidhi', termidhi: 'tirmidhi', attirmidhi: 'tirmidhi',
  tirmizi: 'tirmidhi', tirmidhee: 'tirmidhi', jamitirmidhi: 'tirmidhi', jaamitirmidhi: 'tirmidhi',
  ibnmajah: 'ibnmajah', ibnmaja: 'ibnmajah', majah: 'ibnmajah',
  maja: 'ibnmajah', ibn: 'ibnmajah', sunanibnmajah: 'ibnmajah',
  malik: 'malik', muwatta: 'malik', imammalik: 'malik', muwattamalik: 'malik',
  nawawi: 'nawawi', fortyhadithnawawi: 'nawawi', '40nawawi': 'nawawi',
  '40hadith': 'nawawi', nawawi40: 'nawawi', fortyhadith: 'nawawi',
  qudsi: 'qudsi', fortyhadithqudsi: 'qudsi', '40qudsi': 'qudsi',
  qudsi40: 'qudsi', hadithqudsi: 'qudsi',
};

// ─── SEMANTIC SYNONYMS ────────────────────────────────────────────────────────
const SYNONYM_MAP = {
  patience: ['sabr', 'steadfast', 'endure', 'steadfastness', 'constancy'],
  sabr: ['patience', 'steadfast', 'endure', 'steadfastness', 'constancy'],
  charity: ['zakat', 'sadaqah', 'spending', 'alms', 'poor-due'],
  zakat: ['charity', 'sadaqah', 'spending', 'alms', 'poor-due'],
  sadaqah: ['charity', 'zakat', 'spending', 'alms', 'poor-due'],
  paradise: ['jannah', 'garden', 'heaven', 'eden', 'bliss'],
  jannah: ['paradise', 'garden', 'heaven', 'eden', 'bliss'],
  hell: ['jahannam', 'fire', 'blaze', 'hellfire', 'abyss'],
  jahannam: ['hell', 'fire', 'blaze', 'hellfire', 'abyss'],
  mercy: ['rahma', 'compassion', 'merciful', 'beneficent', 'grace'],
  rahma: ['mercy', 'compassion', 'merciful', 'beneficent', 'grace'],
  prayer: ['salah', 'namaz', 'praying', 'supplication', 'dua'],
  salah: ['prayer', 'namaz', 'praying', 'supplication', 'dua'],
  fasting: ['sawm', 'roza', 'fasted', 'abstain', 'ramadan'],
  sawm: ['fasting', 'roza', 'fasted', 'abstain', 'ramadan'],
  faith: ['iman', 'belief', 'believer', 'trust', 'conviction'],
  iman: ['faith', 'belief', 'believer', 'trust', 'conviction'],
  god: ['allah', 'lord', 'creator', 'deity', 'almighty'],
  allah: ['god', 'lord', 'creator', 'deity', 'almighty'],
  prophet: ['messenger', 'rasul', 'nabi', 'apostle'],
  messenger: ['prophet', 'rasul', 'nabi', 'apostle'],
  wudu: ['ablution', 'wash', 'purity', 'cleanse', 'purification'],
  ablution: ['wudu', 'wash', 'purity', 'cleanse', 'purification'],
  disbeliever: ['kafir', 'infidel', 'unbeliever', 'denier'],
  believer: ['mumin', 'muslim', 'faithful'],
  intercession: ['shafaat', 'pleading'],
  recompense: ['reward', 'payment', 'retribution'],
  jesus: ['isa', 'messiah'],
  moses: ['musa'],
  abraham: ['ibrahim'],
  mary: ['maryam'],
  noah: ['nuh'],
  solomon: ['sulayman'],
  david: ['dawud'],
  joseph: ['yusuf'],
  job: ['ayub'],
  jonah: ['yunus'],
  gabriel: ['jibril'],
  judgment: ['doom', 'resurrection', 'account', 'reckoning'],
  resurrection: ['qiyamah', 'rising'],
  verse: ['ayah', 'aya', 'ayat', 'sentence', 'statement'],
  ayah: ['verse', 'aya', 'ayat', 'sentence', 'statement'],
  surah: ['chapter', 'sura', 'suwar'],
  chapter: ['surah', 'sura', 'suwar'],
  hadith: ['tradition', 'narration', 'report', 'sunnah', 'athkar'],
  narration: ['hadith', 'tradition', 'report', 'sunnah'],
};

export const getSynonyms = (term) => {
  const normalized = term.toLowerCase().trim();
  return SYNONYM_MAP[normalized] || [];
};

// ─── LEVENSHTEIN / FUZZY (ported from Header.jsx) ────────────────────────────

export const levenshtein = (a, b) => {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
};

export const fuzzyScore = (query, target) => {
  const q = normalizeBookLookup(query);
  const t = normalizeBookLookup(target);
  if (!q || !t) return 999;
  if (t === q) return 0;
  if (t.includes(q)) return 0;
  if (t.startsWith(q.slice(0, Math.max(3, Math.floor(q.length * 0.5))))) return 1;
  return levenshtein(q, t);
};

// ─── HIGHLIGHTING UTILITY ─────────────────────────────────────────────────────
/**
 * Splits text into parts for highlighting.
 * Returns Array<{ text: string, isMatch: boolean }>
 */
export const highlightMatch = (text, queryTerms) => {
  if (!text || !queryTerms || queryTerms.length === 0) {
    return [{ text: text || '', isMatch: false }];
  }

  // Create a regex that matches any of the terms (case-insensitive)
  // We sort terms by length descending to match longest phrases first
  const sortedTerms = [...queryTerms].sort((a, b) => b.length - a.length);
  const pattern = sortedTerms
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // escape regex
    .join('|');
  
  const splitRegex = new RegExp(`(${pattern})`, 'gi');
  const testRegex = new RegExp(`^(?:${pattern})$`, 'i');
  const parts = text.split(splitRegex);

  return parts.filter(p => p !== '').map(p => ({
    text: p,
    isMatch: testRegex.test(p),
  }));
};

// ─── REF PARSERS (ported from Header.jsx) ─────────────────────────────────────

export const parseVerseRef = (input) => {
  const match = input.trim().match(/^(\d{1,3})[:.\s\-](\d{1,3})$/);
  if (match) {
    return { surahId: parseInt(match[1]), ayahId: parseInt(match[2]) };
  }
  return null;
};

export const parseSunnahRef = (input) => {
  const normalized = String(input || '').trim();
  if (!normalized) return null;

  const normalizedForWords = normalized
    .replace(/\b(?:hadith|hadeeth|hadees|no\.?|h\.?)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const withCollection = normalized.match(
    /^([a-zA-Z\s.-]+?)\s+(\d{1,3})\s*[:\-/.#]\s*(\d{1,5})$/
  );
  if (withCollection) {
    return {
      bookQuery: withCollection[1].trim(),
      collection: String(parseInt(withCollection[2], 10)),
      hadithNumber: String(parseInt(withCollection[3], 10)),
      hadithInCollection: String(parseInt(withCollection[3], 10)),
    };
  }

  const withCollectionWhitespace = normalizedForWords.match(
    /^([a-zA-Z\s.-]+?)\s+(\d{1,3})\s+(\d{1,5})$/
  );
  if (withCollectionWhitespace) {
    return {
      bookQuery: withCollectionWhitespace[1].trim(),
      collection: String(parseInt(withCollectionWhitespace[2], 10)),
      hadithNumber: String(parseInt(withCollectionWhitespace[3], 10)),
      hadithInCollection: String(parseInt(withCollectionWhitespace[3], 10)),
    };
  }

  const simple = normalizedForWords.match(
    /^([a-zA-Z\s.-]+?)(?:\s*[:#\-]\s*|\s+)(\d{1,5})$/
  );
  if (!simple) return null;
  return {
    bookQuery: simple[1].trim(),
    collection: null,
    hadithNumber: String(parseInt(simple[2], 10)),
    hadithInCollection: null,
  };
};

export const findSunnahBook = (query) => {
  const normalizedQuery = normalizeBookLookup(query);
  if (!normalizedQuery) return null;

  const aliasMatch = SUNNAH_BOOK_ALIASES[normalizedQuery];
  if (aliasMatch && BOOKS.includes(aliasMatch)) return aliasMatch;

  const exactBookMatch = BOOKS.find(
    (book) => normalizeBookLookup(book) === normalizedQuery
  );
  if (exactBookMatch) return exactBookMatch;

  const displayMatchIndex = booksFrontEnd.findIndex(
    (displayName) => normalizeBookLookup(displayName) === normalizedQuery
  );
  if (displayMatchIndex !== -1) return BOOKS[displayMatchIndex];

  const looseBookMatch = BOOKS.find((book) => {
    const normalizedBook = normalizeBookLookup(book);
    return (
      normalizedBook.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedBook)
    );
  });
  if (looseBookMatch) return looseBookMatch;

  const looseDisplayIndex = booksFrontEnd.findIndex((displayName) => {
    const normalizedDisplay = normalizeBookLookup(displayName);
    return (
      normalizedDisplay.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedDisplay)
    );
  });
  if (looseDisplayIndex !== -1) return BOOKS[looseDisplayIndex];

  const fuzzyMatch = BOOKS
    .map((book, i) => ({
      book,
      score: Math.min(
        fuzzyScore(normalizedQuery, book),
        fuzzyScore(normalizedQuery, normalizeBookLookup(booksFrontEnd[i]))
      ),
    }))
    .filter(({ score }) => score <= 3)
    .sort((a, b) => a.score - b.score)[0];

  return fuzzyMatch?.book ?? null;
};

// ─── JUZ DATA ─────────────────────────────────────────────────────────────────
// Each juz boundary: [surahId, ayahId] for the starting verse
const JUZ_BOUNDARIES = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24],    // juz 1-5
  [4, 148], [5, 83], [6, 111], [7, 88], [8, 41],    // juz 6-10
  [9, 93], [11, 6], [12, 53], [15, 1], [17, 1],     // juz 11-15
  [18, 75], [21, 1], [23, 1], [25, 21], [27, 56],   // juz 16-20
  [29, 46], [33, 31], [36, 28], [39, 32], [41, 47], // juz 21-25
  [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],     // juz 26-30
];

const getJuz = (surahId, ayahId) => {
  for (let j = JUZ_BOUNDARIES.length - 1; j >= 0; j--) {
    const [s, a] = JUZ_BOUNDARIES[j];
    if (surahId > s || (surahId === s && ayahId >= a)) return j + 1;
  }
  return 1;
};

// ─── SURAH TYPE (Meccan / Medinan) ────────────────────────────────────────────
// Medinan surahs by surah ID
const MEDINAN_SURAHS = new Set([
  2, 3, 4, 5, 8, 9, 22, 24, 33, 47, 48, 49, 55, 57, 58, 59, 60, 61, 62, 63,
  64, 65, 66, 76, 98, 110,
]);

const getSurahType = (surahId) => MEDINAN_SURAHS.has(surahId) ? 'medinan' : 'meccan';

// ─── INDEX BUILDING ───────────────────────────────────────────────────────────

/**
 * Build a flat Quran search index from the asset maps.
 *
 * @param {Object} quranArabicMap   — {1: {verses: [{id, text}]}, ...}
 * @param {Object} quranTranslationMap — {english: {quran: [{chapter, verse, text}]}, ...}
 * @param {string} translationKey    — e.g. 'english', or 'none'
 * @returns {Array} — flat array of index entries
 */
export const buildQuranIndex = (quranArabicMap, quranTranslationMap, translationKey) => {
  const index = [];
  const hasTranslation = translationKey && translationKey !== 'none' && quranTranslationMap[translationKey];

  // Build a translation lookup: chapter:verse → text
  const translationLookup = {};
  if (hasTranslation) {
    const tData = quranTranslationMap[translationKey];
    if (tData?.quran) {
      for (const entry of tData.quran) {
        translationLookup[`${entry.chapter}:${entry.verse}`] = entry.text;
      }
    }
  }

  for (let surahId = 1; surahId <= 114; surahId++) {
    const surahData = quranArabicMap[surahId];
    if (!surahData?.verses) continue;

    const surah = surahs.find((s) => s.id === surahId);
    const surahName = surah?.latin || `Surah ${surahId}`;
    
    // Prioritise metadata from JSON if available, fallback to helpers
    const surahType = surahData.type || getSurahType(surahId);

    for (const verse of surahData.verses) {
      const ayahId = verse.id;
      const arabicText = verse.text || '';
      const translationText = translationLookup[`${surahId}:${ayahId}`] || '';

      index.push({
        id: `${surahId}:${ayahId}`,
        surahId,
        ayahId,
        surahName,
        surahType,
        juz: verse.juz || getJuz(surahId, ayahId),
        arabicText,
        translationText,
        _arabicLower: stripDiacritics(arabicText).toLowerCase(),
        _translationLower: translationText.toLowerCase(),
        _surahNameLower: surahName.toLowerCase(),
      });
    }
  }

  return index;
};

/**
 * Build a sunnah search index for a specific book.
 *
 * @param {Object} arabicData       — {hadiths: [{hadithnumber, text, grades?, ...}], metadata: {...}}
 * @param {Array}  translationHadiths — [{hadithnumber, text}]
 * @param {string} bookKey           — e.g. 'bukhari'
 * @param {string} bookDisplayName   — e.g. 'Sahih al-Bukhari'
 * @returns {Array}
 */
export const buildSunnahIndex = (arabicData, translationHadiths, bookKey, bookDisplayName) => {
  if (!arabicData?.hadiths) return [];

  const translationMap = {};
  if (translationHadiths) {
    for (const h of translationHadiths) {
      translationMap[h.hadithnumber] = h.text;
    }
  }

  const metadata = arabicData.metadata || {};
  const sectionDetails = metadata.section_details || {};
  const sectionNames = metadata.sections || {};

  return arabicData.hadiths.map((hadith) => {
    const arabicText = cleanHadithText(hadith.text || '');
    const translationText = cleanHadithText(translationMap[hadith.hadithnumber] || '');
    const grades = hadith.grades || [];
    const bestGrade = getBestGrade(grades);

    // Find the section this hadith belongs to
    let sectionId = null;
    let sectionTitle = '';
    const hNum = parseFloat(hadith.hadithnumber);
    for (const [id, details] of Object.entries(sectionDetails)) {
      if (hNum >= details.hadithnumber_first && hNum <= details.hadithnumber_last) {
        sectionId = id;
        sectionTitle = sectionNames[id] || '';
        break;
      }
    }

    // Extract narrator keywords from translation text
    const narratorKeywords = [];
    const narratorMatch = translationText.match(/narrated\s+([^:]+?):/i);
    if (narratorMatch) {
      narratorKeywords.push(narratorMatch[1].trim().toLowerCase());
    }

    return {
      id: `${bookKey}:${hadith.hadithnumber}`,
      book: bookKey,
      bookDisplayName,
      hadithnumber: hadith.hadithnumber,
      arabicText,
      translationText,
      grades,
      bestGrade,
      narratorKeywords,
      sectionId,
      sectionTitle,
      _arabicLower: stripDiacritics(arabicText).toLowerCase(),
      _translationLower: translationText.toLowerCase(),
      _bookNameLower: bookDisplayName.toLowerCase(),
    };
  });
};

// ─── QUERY PARSING ────────────────────────────────────────────────────────────

/**
 * Parse a raw search string into a structured QueryAST.
 */
export const parseQuery = (input, source) => {
  const raw = String(input || '').trim();
  if (!raw) return { mode: 'empty', terms: [], verseRef: null, hadithRef: null, rawInput: raw };

  // For Arabic queries, require at least 3 chars per token to avoid noisy 1-2 char prefix tokens (و، ما، etc.)
  const isArabicQuery = /[\u0600-\u06FF]/.test(raw);
  const minTokenLen = isArabicQuery ? 3 : 2;
  const tokens = stripDiacritics(raw).toLowerCase().split(/\s+/).filter(t => t.length >= minTokenLen);

  if (source === 'quran') {
    // Try verse reference first: "2:255", "2-255"
    const verseRef = parseVerseRef(raw);
    if (verseRef) {
      const surah = surahs.find((s) => s.id === verseRef.surahId);
      if (surah) {
        return { mode: 'reference', terms: tokens, verseRef, hadithRef: null, rawInput: raw, surah };
      }
    }

    // Try surah number alone
    const surahNum = parseInt(raw, 10);
    if (!isNaN(surahNum) && surahNum >= 1 && surahNum <= 114 && String(surahNum) === raw) {
      const surah = surahs.find((s) => s.id === surahNum);
      if (surah) {
        return { mode: 'surah', terms: tokens, verseRef: null, hadithRef: null, rawInput: raw, surah };
      }
    }

    // Try "surahName ayahNumber" pattern
    const combined = raw.match(/^(.+?)\s+(\d{1,3})$/);
    if (combined) {
      const surahPart = combined[1].trim();
      const ayahCandidate = parseInt(combined[2], 10);
      let resolvedSurah = null;
      const surahPartKey = normalizeBookLookup(surahPart);
      if (SURAH_ALIASES[surahPartKey]) {
        resolvedSurah = surahs.find((s) => s.id === SURAH_ALIASES[surahPartKey]);
      }
      if (!resolvedSurah) {
        const n = parseInt(surahPart, 10);
        if (!isNaN(n) && n >= 1 && n <= 114) resolvedSurah = surahs.find((s) => s.id === n);
      }
      if (!resolvedSurah) {
        const lower = surahPart.toLowerCase();
        resolvedSurah = surahs.find((s) => s.latin.toLowerCase() === lower);
      }
      if (!resolvedSurah) {
        const lower = surahPart.toLowerCase();
        resolvedSurah = surahs.find((s) => s.latin.toLowerCase().startsWith(lower));
      }
      if (resolvedSurah && !isNaN(ayahCandidate) && ayahCandidate >= 0) {
        return {
          mode: 'reference',
          terms: tokens,
          verseRef: { surahId: resolvedSurah.id, ayahId: ayahCandidate },
          hadithRef: null,
          rawInput: raw,
          surah: resolvedSurah,
        };
      }
    }

    // Try surah alias
    const aliasKey = normalizeBookLookup(raw);
    if (aliasKey && SURAH_ALIASES[aliasKey]) {
      const surah = surahs.find((s) => s.id === SURAH_ALIASES[aliasKey]);
      if (surah) {
        return { mode: 'surah', terms: tokens, verseRef: null, hadithRef: null, rawInput: raw, surah };
      }
    }

    // Surah name search (non-fulltext)
    const surahMatches = surahs.filter(
      (s) => s.latin.toLowerCase().includes(raw.toLowerCase()) ||
             levenshtein(s.latin.toLowerCase(), raw.toLowerCase()) <= 2
    );
    if (surahMatches.length > 0 && raw.length >= 2) {
      return { mode: 'surah_search', terms: tokens, verseRef: null, hadithRef: null, rawInput: raw, surahMatches };
    }

    // Fall through to fulltext
    const allTerms = [...tokens];
    tokens.forEach(t => {
      const syns = getSynonyms(t);
      syns.forEach(s => { if (!allTerms.includes(s)) allTerms.push(s); });
    });

    return { mode: 'fulltext', terms: allTerms, verseRef: null, hadithRef: null, rawInput: raw };
  }

  // source === 'sunnah'
  const hadithRef = parseSunnahRef(raw);
  if (hadithRef) {
    const matchedBook = findSunnahBook(hadithRef.bookQuery);
    if (matchedBook) {
      return {
        mode: 'reference',
        terms: tokens,
        verseRef: null,
        hadithRef: { ...hadithRef, book: matchedBook },
        rawInput: raw,
      };
    }
  }

  // Try book-only search
  const bookSearchKey = normalizeBookLookup(raw);
  if (bookSearchKey) {
    const aliasBookMatch = SUNNAH_BOOK_ALIASES[bookSearchKey];
    const bookMatches = BOOKS
      .map((book, index) => {
        const bookKey = normalizeBookLookup(book);
        const displayKey = normalizeBookLookup(booksFrontEnd[index]);
        const isAliasMatch = Boolean(aliasBookMatch && book === aliasBookMatch);

        let score = 999;
        if (isAliasMatch) score = 0;
        else if (bookKey === bookSearchKey) score = 0;
        else if (displayKey === bookSearchKey) score = 0;
        else if (bookKey.startsWith(bookSearchKey)) score = 1;
        else if (displayKey.startsWith(bookSearchKey)) score = 1;
        else if (bookKey.includes(bookSearchKey) || displayKey.includes(bookSearchKey)) score = 2;
        else {
          const fScore = Math.min(
            fuzzyScore(bookSearchKey, bookKey),
            fuzzyScore(bookSearchKey, displayKey)
          );
          score = fScore <= 3 ? fScore + 3 : 999;
        }

        return { book, score };
      })
      .filter(({ score }) => score < 999)
      .sort((a, b) => a.score - b.score);

    if (bookMatches.length > 0) {
      return {
        mode: 'book_search',
        terms: tokens,
        verseRef: null,
        hadithRef: null,
        rawInput: raw,
        bookMatches: bookMatches.map(({ book }) => book),
      };
    }
  }

  const allTerms = [...tokens];
  tokens.forEach(t => {
    const syns = getSynonyms(t);
    syns.forEach(s => { if (!allTerms.includes(s)) allTerms.push(s); });
  });

  return { mode: 'fulltext', terms: allTerms, verseRef: null, hadithRef: null, rawInput: raw };
};

// ─── FULL-TEXT SEARCH SCORING ─────────────────────────────────────────────────

// Escape special regex characters
const _escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Arabic word boundary characters: space, start/end, plus Arabic punctuation
const _arabicWordBoundary = `[\\s\\(\\)\\{\\},\\.\\?;:!\\-\"\'\\u060C\\u061B\\u061F\\u06D4]`;

const scoreEntry = (entry, terms, isArabicField) => {
  const textField = isArabicField ? entry._arabicLower : entry._translationLower;
  if (!textField) return 0;

  let allMatch = true;
  let matchCount = 0;
  let wordMatchCount = 0;

  for (const term of terms) {
    if (isArabicField) {
      // For Arabic: require word-boundary match to prevent substring false positives
      // e.g. 'وما' should not match inside 'وماذا'
      const wordRegex = new RegExp(
        `(^|${_arabicWordBoundary})${_escapeRegex(term)}($|${_arabicWordBoundary})`
      );
      if (wordRegex.test(textField)) {
        matchCount++;
        wordMatchCount++;
      } else {
        allMatch = false;
      }
    } else {
      if (textField.includes(term)) {
        matchCount++;
        const wordRegex = new RegExp(`\\b${_escapeRegex(term)}\\b`, 'i');
        if (wordRegex.test(textField)) {
          wordMatchCount++;
        }
      } else {
        allMatch = false;
      }
    }
  }

  if (matchCount === 0) return 0;

  const matchRatio = matchCount / terms.length;
  const wordMatchRatio = wordMatchCount / terms.length;

  // Check for exact phrase (all terms consecutive)
  const phrase = terms.join(' ');
  const isPhraseMatch = textField.includes(phrase);

  let score = 0;
  if (isPhraseMatch) {
    score = 300 + (isArabicField ? 100 : 0);
  } else if (allMatch) {
    score = 150 + (wordMatchCount * 10) + (isArabicField ? 30 : 0);
  } else if (wordMatchRatio >= 0.5) {
    score = Math.round(50 + wordMatchRatio * 50);
  } else if (matchRatio >= 0.8) {
    score = Math.round(15 + matchRatio * 20);
  } else {
    score = 0; // Discard weak partial matches
  }

  // Bonus for match at start of text
  const firstTerm = terms[0];
  if (textField.startsWith(firstTerm)) {
    score += 20;
  }

  // Bonus for surah/book name match
  if (entry._surahNameLower) {
    for (const term of terms) {
      if (entry._surahNameLower.includes(term)) {
        score += 50; // Increased bonus
        break;
      }
    }
  }
  if (entry._bookNameLower) {
    for (const term of terms) {
      if (entry._bookNameLower.includes(term)) {
        score += 50; // Increased bonus
        break;
      }
    }
  }

  // Sunnah specific: boost Sahih hadiths
  if (entry.bestGrade === 'sahih') {
    score += 15;
  }

  return score;
};

// ─── SEARCH FUNCTIONS ─────────────────────────────────────────────────────────

const MAX_RESULTS = 300;

/**
 * Search the Quran index.
 * @param {Array} index
 * @param {Object} query — parsed QueryAST
 * @param {Object} filters — {surahType, juz, surahId}
 * @returns {Array} — search results
 */
export const searchQuranIndex = (index, query) => {
  const isIndexEmpty = !index || index.length === 0;
  const { mode } = query;
  if (isIndexEmpty && mode === 'fulltext') return [];

  if (mode === 'empty') return [];

  // Reference result
  if (mode === 'reference' && query.verseRef) {
    const entry = index.find(
      (e) => e.surahId === query.verseRef.surahId && e.ayahId === query.verseRef.ayahId
    );
    if (entry) {
      return [{
        ...entry,
        score: 1000,
        matchType: 'reference',
      }];
    }
    // Even if the exact ayah isn't in the index, return a navigation hint
    return [{
      id: `${query.verseRef.surahId}:${query.verseRef.ayahId}`,
      surahId: query.verseRef.surahId,
      ayahId: query.verseRef.ayahId,
      surahName: query.surah?.latin || '',
      surahType: getSurahType(query.verseRef.surahId),
      juz: getJuz(query.verseRef.surahId, query.verseRef.ayahId),
      arabicText: '',
      translationText: '',
      score: 1000,
      matchType: 'reference',
    }];
  }

  // Surah nav result
  if (mode === 'surah' && query.surah) {
    return [{
      id: `surah:${query.surah.id}`,
      surahId: query.surah.id,
      ayahId: null,
      surahName: query.surah.latin,
      surahType: getSurahType(query.surah.id),
      juz: getJuz(query.surah.id, 1),
      arabicText: '',
      translationText: '',
      score: 900,
      matchType: 'surah',
      surah: query.surah,
    }];
  }

  // Surah name matches
  if (mode === 'surah_search' && query.surahMatches) {
    return query.surahMatches.map((s) => ({
      id: `surah:${s.id}`,
      surahId: s.id,
      ayahId: null,
      surahName: s.latin,
      surahType: getSurahType(s.id),
      juz: getJuz(s.id, 1),
      arabicText: '',
      translationText: '',
      score: 800,
      matchType: 'surah',
      surah: s,
    }));
  }

  // Full-text search starts here
  if (mode !== 'fulltext') return [];
  
  // Disabled full-text search based on Arabic or translation text
  return [];


  const filtered = index;
  if (query.terms.length === 0) return [];

  const results = [];
  for (const entry of filtered) {
    const arabicScore = scoreEntry(entry, query.terms, true);
    const translationScore = scoreEntry(entry, query.terms, false);
    const totalScore = Math.max(arabicScore, translationScore);

    if (totalScore >= 15) {
      results.push({
        ...entry,
        score: totalScore,
        matchType: arabicScore > translationScore ? 'arabic' : 'translation',
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, MAX_RESULTS);
};

/**
 * Search the Sunnah index.
 * @param {Array} index
 * @param {Object} query — parsed QueryAST
 * @param {Object} filters — {grade, narratorKeyword}
 * @returns {Array} — search results
 */
export const searchSunnahIndex = (index, query, filters = {}) => {
  const isIndexEmpty = !index || index.length === 0;
  const { mode } = query;
  if (isIndexEmpty && mode === 'fulltext') return [];

  // ── Filter-only browsing: no query text but filters are active ──────────────
  if (mode === 'empty') {
    const hasActiveFilters =
      (filters.grade && filters.grade !== 'all') ||
      filters.narratorKeyword != null;
    if (!hasActiveFilters || isIndexEmpty) return [];
    let filtered = index;
    if (filters.grade && filters.grade !== 'all') {
      filtered = filtered.filter((e) => e.bestGrade === filters.grade);
    }
    if (filters.narratorKeyword) {
      const kw = filters.narratorKeyword.toLowerCase();
      filtered = filtered.filter(
        (e) => e.narratorKeywords.some((nk) => nk.includes(kw)) || e._translationLower.includes(kw)
      );
    }
    return filtered.slice(0, MAX_RESULTS).map((e) => ({ ...e, score: 1, matchType: 'filter' }));
  }

  // Reference result
  if (mode === 'reference' && query.hadithRef) {
    const ref = query.hadithRef;
    const entryId = `${ref.book}:${ref.hadithNumber}`;
    const indexMatch = !isIndexEmpty ? index.find(e => e.id === entryId) : null;
    
    return [{
      id: entryId,
      book: ref.book,
      bookDisplayName: booksFrontEnd[BOOKS.indexOf(ref.book)] || ref.book,
      hadithnumber: ref.hadithNumber,
      collection: ref.collection,
      hadithInCollection: ref.hadithInCollection,
      arabicText: indexMatch ? indexMatch.arabicText : '',
      translationText: indexMatch ? indexMatch.translationText : '',
      grades: indexMatch ? indexMatch.grades : [],
      bestGrade: indexMatch ? indexMatch.bestGrade : 'unknown',
      score: 1000,
      matchType: 'reference',
    }];
  }

  // Book search results
  if (mode === 'book_search' && query.bookMatches) {
    return query.bookMatches.map((book) => ({
      id: `book:${book}`,
      book,
      bookDisplayName: booksFrontEnd[BOOKS.indexOf(book)] || book,
      score: 800,
      matchType: 'book',
    }));
  }

  // Full-text search starts here
  if (mode !== 'fulltext') return [];

  // Disabled full-text search based on Arabic or translation text
  return [];


  let filtered = index;

  // Apply filters
  if (filters.grade && filters.grade !== 'all') {
    filtered = filtered.filter((e) => e.bestGrade && e.bestGrade.toLowerCase() === filters.grade.toLowerCase());
  }
  if (filters.narratorKeyword) {
    const keyword = filters.narratorKeyword.toLowerCase();
    filtered = filtered.filter((e) =>
      e.narratorKeywords.some((nk) => nk.includes(keyword)) ||
      e._translationLower.includes(keyword)
    );
  }

  // If no search query is provided but filters ARE active, return the filtered set
  if (query.terms.length === 0) {
    if ((filters.grade && filters.grade !== 'all') || filters.narratorKeyword) {
      return filtered.slice(0, MAX_RESULTS).map((e) => ({ ...e, matchType: 'filter' }));
    }
    return [];
  }

  const results = [];
  for (const entry of filtered) {
    const arabicScore = scoreEntry(entry, query.terms, true);
    const translationScore = scoreEntry(entry, query.terms, false);
    const totalScore = Math.max(arabicScore, translationScore);

    if (totalScore >= 15) {
      results.push({
        ...entry,
        score: totalScore,
        matchType: arabicScore > translationScore ? 'arabic' : 'translation',
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, MAX_RESULTS);
};

// ─── ARABIC TEXT DETECTION ────────────────────────────────────────────────────

export const isArabicText = (str) => /[\u0600-\u06FF]/.test(str);

// ─── ARABIC QURAN SEARCH ──────────────────────────────────────────────────────

/**
 * Search Quran verses by matching against the original Arabic text.
 * @param {Object} quranArabicMapData — {[surahId]: {verses: [{id, text}]}}
 * @param {string} rawQuery — Arabic text query
 * @param {number} maxResults
 * @returns {Array}
 */
export const searchQuranArabic = (quranArabicMapData, rawQuery, maxResults = 50) => {
  if (!quranArabicMapData || !rawQuery) return [];

  const normalizedQuery = stripDiacritics(rawQuery.trim());
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const results = [];

  for (let surahId = 1; surahId <= 114; surahId++) {
    const surahData = quranArabicMapData[surahId];
    if (!surahData?.verses) continue;

    const surahMeta = surahs.find((s) => s.id === surahId) || { id: surahId, latin: `Surah ${surahId}` };

    for (const verse of surahData.verses) {
      const strippedText = stripDiacritics(verse.text || '');
      const allMatch = tokens.every(token => strippedText.includes(token));

      if (allMatch) {
        const phrase = tokens.join(' ');
        const score = strippedText.includes(phrase) ? 100 : 50;

        results.push({
          type: 'verse',
          surah: surahMeta,
          ayahId: verse.id,
          translationText: verse.text,
          score,
        });

        if (results.length >= maxResults * 2) break;
      }
    }

    if (results.length >= maxResults * 2) break;
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxResults);
};

// ─── ALL-TRANSLATIONS QURAN SEARCH ────────────────────────────────────────────

/**
 * Search across ALL bundled Quran translations.
 * Deduplicates by surah:verse, preferring priorityLangKey when available.
 * @param {Object} allTranslationsData — the full quranTranslationMap object
 * @param {string} priorityLangKey — user's selected language key
 * @param {string} rawQuery
 * @param {number} maxResults
 * @returns {Array}
 */
export const searchAllQuranTranslations = (allTranslationsData, priorityLangKey, rawQuery, maxResults = 50) => {
  if (!allTranslationsData || !rawQuery) return [];

  const normalizedQuery = rawQuery.trim().toLowerCase();
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  // Map of verseKey -> best result found so far
  const verseMap = new Map();

  // Process priority language first so it wins deduplication
  const langKeys = [
    priorityLangKey,
    ...Object.keys(allTranslationsData).filter(k => k !== priorityLangKey),
  ];

  for (const langKey of langKeys) {
    const langData = allTranslationsData[langKey];
    if (!langData?.quran || !Array.isArray(langData.quran)) continue;

    for (const item of langData.quran) {
      const verseKey = `${item.chapter}:${item.verse}`;
      // If already found from priority language, skip
      if (verseMap.has(verseKey)) continue;

      const textLower = (item.text || '').toLowerCase();
      const allTokensMatch = tokens.every(token => textLower.includes(token));

      if (allTokensMatch) {
        const score = textLower.includes(normalizedQuery) ? 100 : 50;
        const surahIndex = Number(item.chapter) - 1;
        const surahMeta = surahs[surahIndex] || { id: item.chapter, latin: `Surah ${item.chapter}` };

        verseMap.set(verseKey, {
          type: 'verse',
          surah: surahMeta,
          ayahId: Number(item.verse),
          translationText: item.text,
          score,
        });

        if (verseMap.size >= maxResults * 2) break;
      }
    }

    if (verseMap.size >= maxResults * 2) break;
  }

  const results = Array.from(verseMap.values());
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxResults);
};

// ─── OFFLINE FULL-TEXT TRANSLATION SEARCH ─────────────────────────────────────

/**
 * Perform a fast linear search on the Quran translations array.
 * @param {Array} translationsData — e.g. quranTranslationMap[language].quran
 * @param {string} rawQuery — the raw text to search for
 * @param {number} maxResults — number of results to return
 */
export const searchQuranTranslations = (translationsData, rawQuery, maxResults = 50) => {
  if (!translationsData || !Array.isArray(translationsData) || !rawQuery) return [];

  const normalizedQuery = rawQuery.trim().toLowerCase();
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const results = [];
  for (let i = 0; i < translationsData.length; i++) {
    const item = translationsData[i];
    const textLower = (item.text || '').toLowerCase();
    
    // Check if all tokens exist in the text
    const allTokensMatch = tokens.every(token => textLower.includes(token));
    
    if (allTokensMatch) {
      // Calculate a basic score based on exact phrase vs partial token matches
      let score = 50;
      if (textLower.includes(normalizedQuery)) score = 100;
      
      const surahIndex = Number(item.chapter) - 1;
      const surahMeta = surahs[surahIndex] || { id: item.chapter, latin: `Surah ${item.chapter}` };
      
      results.push({
        type: 'verse',
        surah: surahMeta,
        ayahId: Number(item.verse),
        translationText: item.text,
        score
      });
      
      if (results.length >= maxResults * 2) break; // Collect a bit more then sort
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxResults);
};

/**
 * Perform a lazy search on Sunnah translations, yielding results incrementally to avoid blocking JS thread.
 * @param {Array<string>} booksList — e.g. ['bukhari', 'muslim']
 * @param {string} rawQuery — the search query
 * @param {string} langCode — e.g. 'eng', 'fra'
 * @param {number} maxResults 
 * @param {Function} onNewResults — callback giving accumulated results
 */
export const searchSunnahTranslationsLazy = async (booksList, rawQuery, langCode = 'eng', maxResults = 50, onNewResults) => {
  if (!rawQuery || !Array.isArray(booksList) || typeof onNewResults !== 'function') return;

  const normalizedQuery = rawQuery.trim().toLowerCase();
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return;

  const currentResults = [];

  for (const book of booksList) {
    if (currentResults.length >= maxResults) break;

    try {
      const editionKey = `${langCode}-${book}`;
      const editionData = await readOfflineSunnahEdition(editionKey);
      
      if (!editionData || !Array.isArray(editionData.hadiths)) {
        continue;
      }
      
      const bookResults = [];
      const hadiths = editionData.hadiths;

      for (let i = 0; i < hadiths.length; i++) {
        const item = hadiths[i];
        const textLower = (item.text || '').toLowerCase();
        
        // Fast token match 
        const allTokensMatch = tokens.every(token => textLower.includes(token));
        
        if (allTokensMatch) {
          let score = 50;
          if (textLower.includes(normalizedQuery)) score = 100;
          
          bookResults.push({
            type: 'hadith',
            book: book,
            hadithNumber: item.hadithnumber,
            translationText: item.text,
            score
          });
          
          if (currentResults.length + bookResults.length >= maxResults * 2) break;
        }
      }
      
      if (bookResults.length > 0) {
        currentResults.push(...bookResults);
        currentResults.sort((a, b) => b.score - a.score);
        const topResults = currentResults.slice(0, maxResults);
        
        // Emit accumulated results so far 
        // We use setTimeout 0 to yield strictly to React UI thread
        await new Promise(resolve => setTimeout(() => {
          onNewResults(topResults);
          resolve();
        }, 0));
      } else {
        // Yield anyway between books
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
    } catch (e) {
      console.warn(`Failed to search Sunnah book ${book}`, e);
    }
  }
};
