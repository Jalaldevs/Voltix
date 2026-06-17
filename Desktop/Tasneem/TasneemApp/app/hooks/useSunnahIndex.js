import { useState, useRef, useCallback, useEffect } from 'react';
import { BOOKS, booksFrontEnd } from '../constants/sunnahBooks';
import { readOfflineSunnahEdition } from '../utils/offlineContent';
import { buildSunnahIndex } from '../utils/searchEngine';

const BASE_URL = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1';

const LANG_TO_SUNNAH_CODE = {
  albanian: 'sqi', azerbaijani: 'aze', bengali: 'ben', bosnian: 'bos',
  bulgarian: 'bul', chinese: 'zho', croatian: 'hrv', czech: 'ces',
  danish: 'dan', dutch: 'nld', english: 'eng', filipino: 'tgl',
  finish: 'fin', french: 'fra', german: 'deu', hebrew: 'heb',
  hindi: 'hin', indonesian: 'ind', italian: 'ita', japanese: 'jpn',
  korean: 'kor', macedonian: 'mkd', malay: 'msa', nepali: 'nep',
  norwegian: 'nor', persian: 'fas', polish: 'pol', portuguese: 'por',
  pushto: 'pus', romanian: 'ron', russian: 'rus', slovak: 'slk',
  somali: 'som', spanish: 'spa', swedish: 'swe', turkish: 'tur',
  urdu: 'urd', uzbek: 'uzb', tamil: 'tam', arabic: 'ara',
};

const fetchEdition = async (key) => {
  try {
    const res = await fetch(`${BASE_URL}/editions/${key}.min.json`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn(`[useSunnahIndex] CDN fetch failed for ${key}:`, e?.message);
  }
  return null;
};

// ── GLOBAL CACHE ──
let globalSunnahIndex = [];
let globalIsLoading = false;
let globalIsReady = false;
let globalLoadedLang = null;

// Subscribers
const listeners = new Set();
const notifyListeners = () => {
  for (const listener of listeners) {
    listener();
  }
};

const useSunnahIndex = (language = 'english') => {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const trigger = () => forceRender(n => n + 1);
    listeners.add(trigger);
    return () => listeners.delete(trigger);
  }, []);

  const loadIndex = useCallback(async (lang = 'english') => {
    if (globalLoadedLang === lang && globalSunnahIndex.length > 0) return;
    if (globalIsLoading) return;

    globalIsLoading = true;
    globalIsReady = false;
    globalLoadedLang = lang;
    notifyListeners();

    const langCode = LANG_TO_SUNNAH_CODE[lang] || 'eng';
    const results = [];

    // Load books sequentially to avoid freezing the JS thread
    for (let i = 0; i < BOOKS.length; i++) {
      const book = BOOKS[i];
      const displayName = booksFrontEnd[i];
      try {
        const [arabicEdition, translationEdition] = await Promise.all([
          readOfflineSunnahEdition(`ara-${book}`)
            .then(d => d?.hadiths ? d : fetchEdition(`ara-${book}`)),
          langCode === 'ara'
            ? Promise.resolve(null)
            : readOfflineSunnahEdition(`${langCode}-${book}`)
              .then(d => d?.hadiths ? d : fetchEdition(`${langCode}-${book}`))
              .then(d => d?.hadiths ? d : fetchEdition(`eng-${book}`)), // english fallback
        ]);

        if (arabicEdition?.hadiths) {
          const index = buildSunnahIndex(
            arabicEdition,
            translationEdition?.hadiths || [],
            book,
            displayName,
          );
          results.push(index);
        }
      } catch (e) {
        console.error(`[useSunnahIndex] Error loading ${book}:`, e);
      }
      // Yield to the JS event loop
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    globalSunnahIndex = results.flat();
    globalIsReady = true;
    globalIsLoading = false;
    notifyListeners();
  }, []);

  return {
    sunnahIndex: globalSunnahIndex,
    isLoading: globalIsLoading,
    isReady: globalIsReady,
    hasData: globalSunnahIndex.length > 0,
    hasStartedLoading: globalIsLoading || globalSunnahIndex.length > 0,
    loadIndex,
  };
};

export default useSunnahIndex;