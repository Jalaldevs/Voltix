// useSearchQuery.js — Debounced search execution hook
//
// Accepts a query string, source, filters, and index references.
// Returns search results with debouncing.

import { useState, useEffect, useRef, useCallback } from 'react';
import { parseQuery, searchQuranIndex, searchSunnahIndex } from '../utils/searchEngine';

const DEBOUNCE_MS = 120;
const MIN_QUERY_LENGTH = 2;

/**
 * @param {Object} options
 * @param {string} options.query — raw search input
 * @param {string} options.source — 'quran' | 'sunnah'
 * @param {Object} options.filters — { surahType, juz, surahId, grade, narratorKeyword }
 * @param {Array}  options.quranIndex — from useSearchIndex
 * @param {Function} options.getSunnahIndex — from useSearchIndex
 * @param {Object} options.sunnahData — { arabicData, translationHadiths, bookKey, bookDisplayName }
 */
const useSearchQuery = ({
  query = '',
  source = 'quran',
  filters = {},
  quranIndex,
  getSunnahIndex,
  sunnahData,
}) => {
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [parsedQuery, setParsedQuery] = useState(null);
  const timerRef = useRef(null);
  const latestQueryRef = useRef('');

  const executeSearch = useCallback(() => {
    const trimmed = latestQueryRef.current.trim();
    
    // Parse the query
    const parsed = parseQuery(trimmed, source);
    setParsedQuery(parsed);

    if (parsed.mode === 'empty') {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      let searchResults = [];

      if (source === 'quran') {
        if (quranIndex) {
          searchResults = searchQuranIndex(quranIndex, parsed, filters);
        }
      } else {
        // Sunnah
        if (parsed.mode === 'reference' || parsed.mode === 'book_search') {
          // Reference and book searches don't need the full text index
          searchResults = searchSunnahIndex([], parsed, filters);
        } else if (getSunnahIndex && sunnahData?.arabicData) {
          const index = getSunnahIndex(
            sunnahData.bookKey,
            sunnahData.arabicData,
            sunnahData.translationHadiths,
            sunnahData.bookDisplayName
          );
          searchResults = searchSunnahIndex(index, parsed, filters);
        }
      }

      setResults(searchResults);
    } catch (e) {
      console.warn('Search error:', e);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [source, filters, quranIndex, getSunnahIndex, sunnahData]);

  useEffect(() => {
    latestQueryRef.current = query;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const trimmed = query.trim();

    // Check if it's a reference pattern (should search immediately, even if short)
    const isRef = /^\d{1,3}[:.\-]\d{1,3}$/.test(trimmed) || // "2:255"
                  /^[a-zA-Z]+\s+\d+/.test(trimmed);          // "bukhari 52"

    if (!trimmed || (trimmed.length < MIN_QUERY_LENGTH && !isRef)) {
      setResults([]);
      setIsSearching(false);
      setParsedQuery(null);
      return;
    }

    setIsSearching(true);

    // Skip debounce for reference patterns
    if (isRef) {
      executeSearch();
    } else {
      timerRef.current = setTimeout(executeSearch, DEBOUNCE_MS);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query, executeSearch]);

  return {
    results,
    resultCount: results.length,
    isSearching,
    parsedQuery,
  };
};

export default useSearchQuery;
