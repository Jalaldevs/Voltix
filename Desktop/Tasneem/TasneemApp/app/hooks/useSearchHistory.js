// useSearchHistory.js — Persistent search history with AsyncStorage
//
// Stores per-source search history, deduplicated, with max 12 entries per source.

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_STORAGE_KEY = '@search:history:v2';
const MAX_ENTRIES_PER_SOURCE = 12;

const useSearchHistory = () => {
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const isMountedRef = useRef(true);

  // Hydrate history from storage
  useEffect(() => {
    isMountedRef.current = true;
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
        if (raw && isMountedRef.current) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setHistory(parsed);
          }
        }
      } catch (e) {
        console.warn('Failed to load search history:', e);
      } finally {
        if (isMountedRef.current) setHistoryLoaded(true);
      }
    };
    load();
    return () => { isMountedRef.current = false; };
  }, []);

  // Persist history to storage
  const persist = useCallback(async (entries) => {
    try {
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn('Failed to persist search history:', e);
    }
  }, []);

  // Add a search entry
  const addEntry = useCallback((query, source, resultCount = 0) => {
    const trimmed = (query || '').trim();
    if (!trimmed || trimmed.length < 2) return;

    setHistory((prev) => {
      // Remove duplicates (same query + source)
      const filtered = prev.filter(
        (e) => !(e.query.toLowerCase() === trimmed.toLowerCase() && e.source === source)
      );

      const newEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        query: trimmed,
        source,
        resultCount,
        ts: Date.now(),
      };

      // Prepend new entry
      const updated = [newEntry, ...filtered];

      // Cap per source
      const quranEntries = updated.filter((e) => e.source === 'quran');
      const sunnahEntries = updated.filter((e) => e.source === 'sunnah');

      const capped = [
        ...quranEntries.slice(0, MAX_ENTRIES_PER_SOURCE),
        ...sunnahEntries.slice(0, MAX_ENTRIES_PER_SOURCE),
      ].sort((a, b) => b.ts - a.ts);

      persist(capped);
      return capped;
    });
  }, [persist]);

  // Remove a single entry
  const removeEntry = useCallback((id) => {
    setHistory((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      persist(updated);
      return updated;
    });
  }, [persist]);

  // Clear all history
  const clearAll = useCallback(() => {
    setHistory([]);
    persist([]);
  }, [persist]);

  // Get history for a specific source
  const getHistoryForSource = useCallback((source) => {
    return history.filter((e) => e.source === source);
  }, [history]);

  return {
    history,
    historyLoaded,
    addEntry,
    removeEntry,
    clearAll,
    getHistoryForSource,
  };
};

export default useSearchHistory;
