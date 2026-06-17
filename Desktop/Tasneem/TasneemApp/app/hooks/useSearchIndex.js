// useSearchIndex.js — Builds and caches search indexes for Quran and Sunnah
//
// Quran index is built eagerly on mount.
// Sunnah indexes are built lazily per-book and cached.

import { useEffect, useRef, useCallback, useState } from 'react';
import { InteractionManager } from 'react-native';
import { buildQuranIndex, buildSunnahIndex } from '../utils/searchEngine';
import { quranArabicMap } from '../constants/quranArabicMap';
import { quranTranslationMap } from '../constants/quranTranslationMap';

/**
 * @param {string} translationKey — e.g. 'english' or 'none'
 */
const useSearchIndex = (translationKey = 'english') => {
  const quranIndexRef = useRef(null);
  const sunnahIndexCacheRef = useRef(new Map());
  const [quranIndexReady, setQuranIndexReady] = useState(false);

  // Build Quran index on mount / when translation changes
  useEffect(() => {
    let cancelled = false;

    const task = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;

      // Resolve the Arabic map: quranArabicMap maps surahId → require()
      // We need to load each surah JSON
      const resolvedArabicMap = {};
      try {
        for (const [surahId, jsonModule] of Object.entries(quranArabicMap)) {
          // jsonModule is already a resolved require() object
          resolvedArabicMap[surahId] = jsonModule;
        }
      } catch (e) {
        console.warn('Failed to resolve Quran Arabic map:', e);
      }

      // Resolve translation map
      let resolvedTranslationMap = {};
      if (translationKey && translationKey !== 'none') {
        try {
          const translationModule = quranTranslationMap[translationKey];
          if (translationModule) {
            resolvedTranslationMap = { [translationKey]: translationModule };
          }
        } catch (e) {
          console.warn('Failed to resolve translation map:', e);
        }
      }

      const index = buildQuranIndex(resolvedArabicMap, resolvedTranslationMap, translationKey);
      if (!cancelled) {
        quranIndexRef.current = index;
        setQuranIndexReady(true);
      }
    });

    return () => {
      cancelled = true;
      task.cancel?.();
    };
  }, [translationKey]);

  // Lazily build + cache sunnah index for a specific book
  const getSunnahIndex = useCallback((bookKey, arabicData, translationHadiths, bookDisplayName) => {
    if (!bookKey || !arabicData) return [];

    const cacheKey = `${bookKey}:${translationHadiths?.length || 0}`;
    if (sunnahIndexCacheRef.current.has(cacheKey)) {
      return sunnahIndexCacheRef.current.get(cacheKey);
    }

    const index = buildSunnahIndex(arabicData, translationHadiths, bookKey, bookDisplayName);
    sunnahIndexCacheRef.current.set(cacheKey, index);
    return index;
  }, []);

  // Clear sunnah cache (e.g. on book/translation change)
  const clearSunnahCache = useCallback(() => {
    sunnahIndexCacheRef.current.clear();
  }, []);

  return {
    quranIndex: quranIndexRef.current,
    quranIndexReady,
    getSunnahIndex,
    clearSunnahCache,
  };
};

export default useSearchIndex;
