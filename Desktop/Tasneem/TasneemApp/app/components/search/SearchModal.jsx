// SearchModal.jsx — Search modal (uses the exact same search logic as Header.jsx)
import React, { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import {
  View, Modal, Pressable, TouchableOpacity, Text, TextInput, FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { useNavigationContext } from '../NavigationContext';
import ThemedView from '../ThemedView';
import Colors from '../../constants/Colors';
import surahs from '../../constants/surahs';
import { BOOKS, booksFrontEnd } from '../../constants/sunnahBooks';
import { quranTranslationMap } from '../../constants/quranTranslationMap';
import { quranArabicMap } from '../../constants/quranArabicMap';
import { ActivityIndicator } from 'react-native';
import {
  parseQuery,
  searchQuranIndex,
  searchSunnahIndex,
  buildQuranIndex,
  buildSunnahIndex,
  highlightMatch,
  getSynonyms,
} from '../../utils/searchEngine';
import useAppTranslation from '../../hooks/useAppTranslation';
import usePremium, { USE_MOCK_PREMIUM } from '../../hooks/usePremium';
import useSearchIndex from '../../hooks/useSearchIndex';
import useSunnahIndex from '../../hooks/useSunnahIndex';
import { getGradeLabel } from '../../utils/gradeUtils';
import ResultCard from './ResultCard';
import { moderateScale, scaleFontSize } from '../../utils/responsive';

const MODERATE_FACTOR = 0.35;
const ms = (size) => moderateScale(size, MODERATE_FACTOR);





// ─── SEARCH MODAL ─────────────────────────────────────────────────────────────
const SearchModal = ({ visible, onClose }) => {
  const { colorScheme, language } = useNavigationContext();
  const { t } = useAppTranslation();
  const { isPremium, requirePremium, toggleMockPremium } = usePremium();
  const router = useRouter();
  const isDarkMode = typeof colorScheme === 'string' && colorScheme.toLowerCase() === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const inputRef = useRef(null);
  const isAndroid = Platform.OS === 'android';

  // Load Uthmanic font
  const [fontsLoaded] = useFonts({
    UthmanicHafs: require('../../../assets/fonts/uthmanic_hafs_v22.ttf'),
  });

  // State
  const [searchValue, setSearchValue] = useState('');
  const [searchSource, setSearchSource] = useState('quran');
  const [advancedSearch, setAdvancedSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    quran: { juz: null, hizb: null, surahType: 'all' },
    sunnah: { grade: 'all', narratorKeyword: null },
  });
  const [results, setResults] = useState([]);

  const [isSearching, setIsSearching] = useState(false);
  const [quranSearchLang, setQuranSearchLang] = useState(language);
  const [searchLimitReached, setSearchLimitReached] = useState(false);
  const [remainingSearches, setRemainingSearches] = useState(3);
  const [availableTime, setAvailableTime] = useState(null);

  // Indexes (async loaded to avoid freezing JS thread)
  const { quranIndex, quranIndexReady } = useSearchIndex(quranSearchLang);
  const { sunnahIndex, isLoading: isSunnahLoading, isReady: isSunnahReady, hasStartedLoading, loadIndex } = useSunnahIndex(language);

  // Search limit tracking
  const DAILY_SEARCH_LIMIT = 7;
  const SEARCH_COUNT_KEY = '@search:daily_count';
  const SEARCH_TIMESTAMP_KEY = '@search:first_search_timestamp';

  const storageGet = async (key) => {
    try {
      if (Platform.OS !== 'web') {
        const val = await SecureStore.getItemAsync(key);
        if (val) return val;
      }
    } catch (e) { }
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) { }
    return null;
  };

  const storageSet = async (key, val) => {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(key, val);
      }
    } catch (e) { }
    try {
      await AsyncStorage.setItem(key, val);
    } catch (e) { }
  };

  const storageRemove = async (key) => {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (e) { }
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) { }
  };

  const getSearchCount = useCallback(async () => {
    try {
      const firstSearchTimestamp = await storageGet(SEARCH_TIMESTAMP_KEY);
      const now = Date.now();
      const HOURS_24 = 24 * 60 * 60 * 1000;

      if (!firstSearchTimestamp) {
        console.log('[SearchModal] No previous searches found. Count is 0.');
        setAvailableTime(null);
        return 0;
      }

      const firstSearchTime = parseInt(firstSearchTimestamp, 10);

      // Check if 24 hours have passed since first search
      if (now - firstSearchTime > HOURS_24) {
        console.log('[SearchModal] 24 hours passed since first search. Resetting search count.');
        await storageSet(SEARCH_COUNT_KEY, '0');
        await storageRemove(SEARCH_TIMESTAMP_KEY);
        setAvailableTime(null);
        return 0;
      }

      const availableAt = firstSearchTime + HOURS_24;
      setAvailableTime(availableAt);

      const count = await storageGet(SEARCH_COUNT_KEY);
      const parsedCount = count ? parseInt(count, 10) : 0;
      console.log(`[SearchModal] Current search count: ${parsedCount}. Available at: ${new Date(availableAt).toLocaleString()}`);
      return parsedCount;
    } catch (e) {
      console.error('Failed to get search count:', e);
      return 0;
    }
  }, []);

  const formatAvailableTime = useCallback((timestamp) => {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = timestamp - now;

    if (diff <= 0) return '';

    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, []);

  const incrementSearchCount = useCallback(async () => {
    try {
      const count = await getSearchCount();
      const newCount = count + 1;

      // Set timestamp if this is the first search of the period
      if (count === 0) {
        await storageSet(SEARCH_TIMESTAMP_KEY, String(Date.now()));
      }

      await storageSet(SEARCH_COUNT_KEY, String(newCount));
      return newCount;
    } catch (e) {
      console.error('Failed to increment search count:', e);
      return 0;
    }
  }, [getSearchCount]);

  const canSearch = useCallback(async () => {
    if (isPremium) return { canSearch: true, remaining: Infinity };
    if (Platform.OS === 'android') return { canSearch: true, remaining: Infinity };

    const count = await getSearchCount();
    const remaining = DAILY_SEARCH_LIMIT - count;
    return { canSearch: remaining > 0, remaining };
  }, [isPremium, getSearchCount]);

  // Load remaining searches on mount
  useEffect(() => {
    const loadRemainingSearches = async () => {
      const { remaining } = await canSearch();
      setRemainingSearches(remaining === Infinity ? DAILY_SEARCH_LIMIT : remaining);
    };
    loadRemainingSearches();
  }, [canSearch]);

  // Update available time display every second when limit is reached
  useEffect(() => {
    if (!searchLimitReached || !availableTime || isPremium) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= availableTime) {
        // Time has passed, reset limit
        setSearchLimitReached(false);
        setAvailableTime(null);
        setRemainingSearches(DAILY_SEARCH_LIMIT);
      } else {
        // Force re-render to update time display
        setAvailableTime(availableTime);
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [searchLimitReached, availableTime, isPremium]);

  // Load recent searches on open
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [savedAdvanced, savedFilters, quranLang] = await Promise.all([
          AsyncStorage.getItem('@search:advanced'),
          AsyncStorage.getItem('@search:filters'),
          AsyncStorage.getItem('@quran:selectedTranslation'),
        ]);
        if (savedAdvanced !== null) setAdvancedSearch(JSON.parse(savedAdvanced));
        if (savedFilters !== null) setFilters(JSON.parse(savedFilters));
        if (quranLang) setQuranSearchLang(quranLang);
      } catch (_) { }
    };
    loadSettings();
  }, []);

  // Persistence: Save settings on change
  useEffect(() => {
    AsyncStorage.setItem('@search:advanced', JSON.stringify(advancedSearch));
  }, [advancedSearch]);

  useEffect(() => {
    AsyncStorage.setItem('@search:filters', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // NEW: Lazy load Sunnah index on first search
  useEffect(() => {
    const shouldLoadSunnah =
      searchSource === 'sunnah' &&
      searchValue.trim().length >= 2 &&
      !hasStartedLoading;

    if (shouldLoadSunnah) {
      console.log('[SearchModal] Triggering lazy load of Sunnah index');
      loadIndex(language);
    }
  }, [searchSource, searchValue, hasStartedLoading, loadIndex, language]);

  // ─── THE NEW SEARCH ENGINE INTEGRATION ───────────────────────────────────
  useEffect(() => {
    const performSearch = async () => {
      const query = searchValue.trim();
      if (!query && !showFilters) {
        setResults([]);
        setSearchLimitReached(false);
        return;
      }

      const parsed = parseQuery(query, searchSource);

      let isPremiumLockedAndroid = false;
      if (isAndroid && searchSource === 'quran') {
        if (parsed.mode === 'reference' || parsed.mode === 'text') {
          isPremiumLockedAndroid = true;
        }
      }

      let limitReached = false;
      let remaining = Infinity;

      if (!isPremium) {
        if (isAndroid) {
          if (isPremiumLockedAndroid) {
            limitReached = true;
            remaining = 0;
          } else {
            limitReached = false;
            remaining = Infinity;
          }
        } else {
          const currentCount = await getSearchCount();
          remaining = Math.max(0, DAILY_SEARCH_LIMIT - currentCount);
          limitReached = currentCount >= DAILY_SEARCH_LIMIT;
        }
      }

      setRemainingSearches(remaining);
      setSearchLimitReached(limitReached);

      if (isPremiumLockedAndroid && !isPremium) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      let searchResults = [];
      if (searchSource === 'quran') {
        if (quranIndexReady && quranIndex?.length > 0) {
          searchResults = searchQuranIndex(quranIndex, parsed);
        }
      } else {
        // Sunnah
        if (parsed.mode === 'reference' || parsed.mode === 'book_search') {
          // Reference and book searches don't need the full text index
          searchResults = searchSunnahIndex([], parsed, filters.sunnah);
        } else if (isSunnahReady && sunnahIndex?.length > 0) {
          searchResults = searchSunnahIndex(sunnahIndex, parsed, filters.sunnah);
        }
      }

      setResults(searchResults);
      setIsSearching(false);
    };

    const timer = setTimeout(performSearch, searchValue.length > 0 ? 300 : 0);
    return () => clearTimeout(timer);
  }, [searchValue, searchSource, filters, quranIndex, quranIndexReady, sunnahIndex, isSunnahReady, showFilters, getSearchCount, incrementSearchCount, isPremium]);

  const handleToggleAdvanced = () => {
    setAdvancedSearch(!advancedSearch);
  };

  const handleToggleFilters = () => {
    if (!advancedSearch) {
      setAdvancedSearch(true);
    }
    setShowFilters(!showFilters);
  };

  const clearAllFilters = () => {
    setFilters({
      quran: { juz: null, hizb: null, surahType: 'all' },
      sunnah: { grade: 'all', narratorKeyword: null },
    });
  };

  const NARRATORS = [
    { id: 'abu_huraira', key: 'abu huraira' },
    { id: 'aisha', key: 'aisha' },
    { id: 'ibn_umar', key: 'ibn umar' },
    { id: 'anas', key: 'anas' },
    { id: 'ibn_abbas', key: 'ibn abbas' },
    { id: 'jabir', key: 'jabir' },
    { id: 'abu_said', key: 'abu said' },
    { id: 'ibn_masud', key: 'ibn masud' },
    { id: 'ibn_amr', key: 'ibn amr' },
    { id: 'sahl', key: 'sahl' },
    { id: 'abu_musa', key: 'abu musa' },
    { id: 'al_bara', key: 'al bara' },
    { id: 'uqba', key: 'uqba' },
    { id: 'samura', key: 'samura' },
    { id: 'muawiya', key: 'muawiya' },
  ];


  // ─── RESULT PRESS HANDLERS ─────────────────────────────────────────────
  const handleQuranResultPress = useCallback(async (result) => {
    // If limit reached and not premium, show paywall
    if (searchLimitReached && !isPremium) {
      requirePremium(() => {
        if (result.matchType === 'surah' || result.surah) {
          router.push({ pathname: '/main/Quran', params: { surahId: result.surahId } });
        } else {
          router.push({ pathname: '/main/Quran', params: { surahId: result.surahId, ayahId: result.ayahId } });
        }
        onClose();
      });
      return;
    }

    // Free user under limit
    if (!isPremium) {
      if (Platform.OS !== 'android') {
        await incrementSearchCount();

        // Update local state proactively so UI updates on next search
        const newCount = (await getSearchCount()); // it's already incremented, so this gets the latest
        setRemainingSearches(Math.max(0, DAILY_SEARCH_LIMIT - newCount));
        setSearchLimitReached(newCount >= DAILY_SEARCH_LIMIT);
      }
    }

    if (result.matchType === 'surah' || result.surah) {
      router.push({
        pathname: '/main/Quran',
        params: { surahId: result.surahId },
      });
    } else {
      router.push({
        pathname: '/main/Quran',
        params: { surahId: result.surahId, ayahId: result.ayahId },
      });
    }
    onClose();
  }, [router, onClose, searchLimitReached, isPremium, requirePremium, incrementSearchCount, getSearchCount]);

  const handleSunnahResultPress = useCallback(async (result) => {
    // If limit reached and not premium, show paywall
    if (searchLimitReached && !isPremium) {
      requirePremium(() => {
        if (result.matchType === 'book') {
          router.push({ pathname: '/main/Sunnah', params: { book: result.book } });
        } else {
          router.push({
            pathname: '/main/Sunnah',
            params: { book: result.book, collection: result.collection, hadithNumber: result.hadithnumber }
          });
        }
        onClose();
      });
      return;
    }

    // Free user under limit
    if (!isPremium) {
      if (Platform.OS !== 'android') {
        await incrementSearchCount();

        const newCount = (await getSearchCount());
        setRemainingSearches(Math.max(0, DAILY_SEARCH_LIMIT - newCount));
        setSearchLimitReached(newCount >= DAILY_SEARCH_LIMIT);
      }
    }

    if (result.matchType === 'book') {
      router.push({
        pathname: '/main/Sunnah',
        params: { book: result.book },
      });
    } else {
      router.push({
        pathname: '/main/Sunnah',
        params: {
          book: result.book,
          collection: result.collection,
          hadithNumber: result.hadithnumber,
        },
      });
    }
    onClose();
  }, [router, onClose, searchLimitReached, isPremium, requirePremium, incrementSearchCount, getSearchCount]);

  // ─── RENDERERS ─────────────────────────────
  const renderResult = useCallback(({ item }) => {
    const words = searchValue.split(/\s+/).filter(Boolean);
    const handlePress = searchSource === 'quran' ? handleQuranResultPress : handleSunnahResultPress;

    return (
      <ResultCard
        item={item}
        source={searchSource}
        terms={words}
        theme={theme}
        scheme={colorScheme}
        onPress={handlePress}
      />
    );
  }, [searchValue, searchSource, theme, colorScheme, handleQuranResultPress, handleSunnahResultPress]);



  // ─── CLOSE ──────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setSearchValue('');
    onClose();
  }, [onClose]);

  if (!visible) return null;

  const currentResults = results;
  const currentRenderer = renderResult;

  const showVerseHint = searchSource === 'quran' && /^\d/.test(searchValue) && currentResults.length === 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <ThemedView
        style={[
          styles.searchOverlay,
          {
            backgroundColor: isDarkMode
              ? 'rgba(0,0,0,0.6)'
              : 'rgba(0,0,0,0.25)',
          },
        ]}
      >
        <View style={[styles.searchSheet, { backgroundColor: theme.surface }]}>

          {/* Search input */}
          <View style={[styles.searchHeader, { borderBottomColor: theme.border }]}>
            <Ionicons name="search-outline" size={ms(22)} color={theme.icon} />
            <TextInput
              ref={inputRef}
              autoFocus
              placeholder={
                searchSource === 'quran'
                  ? t('search.quranPlaceholder')
                  : t('search.sunnahPlaceholder')
              }
              placeholderTextColor={theme.muted}
              value={searchValue}
              onChangeText={setSearchValue}
              style={[styles.input, { color: theme.text }]}
            />
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close-outline" size={ms(30)} color={theme.icon} />
            </TouchableOpacity>
          </View>

          {/* Source selector + Advanced Search toggle */}
          <View style={styles.sourceSelector}>
            {['quran', 'sunnah'].map((src) => (
              <Pressable
                key={src}
                onPress={() => {
                  setSearchSource(src);
                  setSearchValue('');
                }}
                style={({ pressed }) => [
                  styles.sourceButton,
                  {
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                    borderColor: isDarkMode ? '#4b5563' : '#ccc',
                    backgroundColor:
                      isDarkMode && searchSource !== src
                        ? '#1e293b'
                        : 'transparent',
                  },
                  searchSource === src && {
                    borderColor: '#1976d2',
                    backgroundColor: isDarkMode ? '#1e3a8a' : '#e3f2fd',
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      searchSource === src
                        ? isDarkMode ? '#fff' : '#000'
                        : theme.text,
                    fontWeight: '600',
                  }}
                >
                  {src === 'quran' ? t('bookmarks.quran') : t('bookmarks.sunnah')}
                </Text>
              </Pressable>
            ))}

            {/* ── Filter toggle (premium) ── */}
            {/* 
            {searchSource === 'sunnah' && (
              <Pressable
                onPress={handleToggleFilters}
                style={({ pressed }) => [
                  styles.advancedToggle,
                  {
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    borderColor: showFilters ? '#1976d2' : (isDarkMode ? '#4b5563' : '#ccc'),
                    backgroundColor: showFilters
                      ? (isDarkMode ? '#1e3a8a' : '#e3f2fd')
                      : (isDarkMode ? '#1e293b' : 'transparent'),
                    marginLeft: ms(8),
                  },
                ]}
              >
                <Ionicons
                  name={isPremium ? (showFilters ? 'options' : 'options-outline') : 'lock-closed-outline'}
                  size={ms(13)}
                  color={showFilters ? (isDarkMode ? '#90caf9' : '#1976d2') : theme.muted}
                  style={{ marginRight: ms(4) }}
                />
                <Text
                  style={{
                    fontSize: scaleFontSize(11),
                    fontWeight: '600',
                    color: showFilters ? (isDarkMode ? '#90caf9' : '#1976d2') : theme.muted,
                  }}
                >
                  {t('search.filterLabel') || 'Filters'}
                </Text>
              </Pressable>
            )}
            */}
          </View>

          {/* Filter Panel */}
          {/* 
          {showFilters && isPremium && (
            <View style={[styles.filterPanel, { borderBottomColor: theme.border }]}>
              <View style={styles.filterHeader}>
                <Text style={[styles.filterLabel, { color: theme.text }]}>{t('search.filterLabel')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {USE_MOCK_PREMIUM && (
                    <TouchableOpacity
                      onPress={toggleMockPremium}
                      style={{ marginRight: ms(12), paddingHorizontal: ms(8), paddingVertical: ms(4), borderRadius: ms(8), backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', borderWidth: 1, borderColor: theme.border }}
                    >
                      <Text style={{ color: theme.primary, fontSize: scaleFontSize(10), fontWeight: '700' }}>MOCK: {isPremium ? 'ON' : 'OFF'}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={clearAllFilters}>
                    <Text style={{ color: theme.primary, fontSize: scaleFontSize(12), fontWeight: '600' }}>{t('search.clearFilters')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {searchSource === 'sunnah' && (
                <View>
                  <Text style={[styles.filterSubLabel, { color: theme.muted }]}>{t('search.gradeLabel')}</Text>
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={['all', 'sahih', 'hasan', 'daif']}
                    keyExtractor={(it) => `grade-${it}`}
                    renderItem={({ item: g }) => (
                      <TouchableOpacity
                        onPress={() => setFilters(f => ({ ...f, sunnah: { ...f.sunnah, grade: g } }))}
                        style={[
                          styles.filterChip,
                          filters.sunnah.grade === g && { backgroundColor: theme.primary, borderColor: theme.primary }
                        ]}
                      >
                        <Text style={[styles.filterChipText, filters.sunnah.grade === g && { color: '#fff' }]}>
                          {g === 'all' ? t('search.allGrades') : getGradeLabel(g)}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                  <Text style={[styles.filterSubLabel, { color: theme.muted }]}>{t('search.narratorLabel')}</Text>
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={[null, ...NARRATORS]}
                    keyExtractor={(it) => it ? it.id : 'all-narrators'}
                    renderItem={({ item: n }) => (
                      <TouchableOpacity
                        onPress={() => setFilters(f => ({ ...f, sunnah: { ...f.sunnah, narratorKeyword: n ? n.key : null } }))}
                        style={[
                          styles.filterChip,
                          filters.sunnah.narratorKeyword === (n ? n.key : null) && { backgroundColor: theme.primary, borderColor: theme.primary }
                        ]}
                      >
                        <Text style={[styles.filterChipText, filters.sunnah.narratorKeyword === (n ? n.key : null) && { color: '#fff' }]}>
                          {n ? (t(`search.narrators.${n.id}`) || n.id) : t('search.allTypes')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>
          )}
          */}

          {/* Verse ref hint pill */}
          {showVerseHint && (
            <View style={styles.verseHintRow}>
              <View
                style={[
                  styles.verseHintPill,
                  {
                    backgroundColor: isDarkMode
                      ? 'rgba(25,118,210,0.15)'
                      : 'rgba(25,118,210,0.08)',
                    borderColor: isDarkMode
                      ? 'rgba(144,202,249,0.3)'
                      : 'rgba(25,118,210,0.2)',
                  },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={ms(14)}
                  color={isDarkMode ? '#90caf9' : '#1976d2'}
                  style={{ marginRight: ms(5) }}
                />
                <Text
                  style={[
                    styles.verseHintText,
                    { color: isDarkMode ? '#90caf9' : '#1976d2' },
                  ]}
                >
                  {t('search.verseJumpTip')}
                </Text>
              </View>
            </View>
          )}

          {/* Results / recents */}
          <View style={{ flex: 1, paddingTop: ms(14) }}>
            {/* Info banner for free users - always visible */}
            {!isPremium && searchValue.length > 0 && (
              <View style={[styles.warningBanner, {
                backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe',
                borderLeftColor: '#3b82f6',
              }]}>
                <Ionicons
                  name="information-circle"
                  size={ms(18)}
                  color="#3b82f6"
                  style={{ marginTop: ms(2) }}
                />
                <View style={{ flex: 1 }}>
                  {searchLimitReached ? (
                    // Limit exceeded - show warning with countdown
                    <>
                      <Text style={[styles.warningText, { color: isDarkMode ? '#60a5fa' : '#1e40af' }]}>
                        {Platform.OS === 'android' ? (t('search.androidPremiumLocked') || "Quran Reference Searching is a Premium Feature.") : (t('search.limitReached') || "You have used all your free result views today.")}
                      </Text>
                      <Text style={[styles.warningSubtext, { color: isDarkMode ? '#93c5fd' : '#1e3a8a' }]}>
                        {t('search.upgradeForUnlimited') || 'Upgrade to Premium for unlimited views'}
                        {(!isAndroid && availableTime) && ` • ${t('search.availableIn') || 'Available in'} ${formatAvailableTime(availableTime)}`}
                      </Text>
                    </>
                  ) : (
                    // Within limit - show info
                    <>
                      <Text style={[styles.warningText, { color: isDarkMode ? '#60a5fa' : '#1e40af' }]}>
                        {Platform.OS === 'android' ? (t('search.androidFree') || "Unlimited Free Searches") : `${remainingSearches} free ${remainingSearches === 1 ? 'view' : 'views'} remaining today`}
                      </Text>
                      <Text style={[styles.warningSubtext, { color: isDarkMode ? '#93c5fd' : '#1e3a8a' }]}>
                        {t('search.upgradeForUnlimited') || 'Upgrade to Premium for unlimited views'}
                      </Text>
                    </>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => requirePremium()}
                  style={[styles.warningUpgradeButton, { backgroundColor: '#3b82f6' }]}
                >
                  <Text style={styles.warningUpgradeButtonText}>
                    {t('search.upgrade') || 'Upgrade'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {searchSource === 'sunnah' && isSunnahLoading && searchValue.includes(' ') ? (
              <View style={{ marginTop: ms(36), alignItems: 'center', paddingHorizontal: ms(20) }}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.noResults, { color: theme.muted, marginTop: ms(12), textAlign: 'center' }]}>
                  {t('search.loadingSunnah') || 'Loading Sunnah collection...'}
                </Text>
              </View>
            ) : searchValue.length > 0 ? (
              <FlatList
                data={currentResults}
                keyExtractor={(item, index) =>
                  `${searchSource}-${item.matchType}-${item.surahId || item.book || ''}-${item.ayahId || item.hadithnumber || ''}-${index}`
                }
                renderItem={currentRenderer}
              />
            ) : (
              <View style={styles.examplesContainer}>


                <Text
                  style={[
                    styles.examplesHint,
                    {
                      color: theme.muted,
                      marginBottom: ms(10),
                      fontStyle: 'normal',
                      fontWeight: '700',
                      textAlign: language === 'arabic' ? 'right' : 'left'
                    },
                  ]}
                >
                  {t('search.tipsLabel') || 'Search Examples:'}
                </Text>

                <View style={[styles.tipsGrid, { alignItems: language === 'arabic' ? 'flex-end' : 'flex-start' }]}>
                  <View
                    style={[
                      styles.tipItem,
                      {
                        backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                        borderColor: theme.border,
                        flexDirection: language === 'arabic' ? 'row-reverse' : 'row'
                      }
                    ]}
                  >
                    <Ionicons name="flash-outline" size={ms(14)} color={isDarkMode ? '#90caf9' : '#1976d2'} />
                    <Text style={[styles.tipText, { color: theme.text, textAlign: language === 'arabic' ? 'right' : 'left' }]}>
                      {searchSource === 'quran' ? t('search.exampleQuranRef') : t('search.exampleSunnahRef')}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.tipItem,
                      {
                        backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                        borderColor: theme.border,
                        flexDirection: language === 'arabic' ? 'row-reverse' : 'row'
                      }
                    ]}
                  >
                    <Ionicons name="search-outline" size={ms(14)} color={isDarkMode ? '#90caf9' : '#1976d2'} />
                    <Text style={[styles.tipText, { color: theme.text, textAlign: language === 'arabic' ? 'right' : 'left' }]}>
                      {searchSource === 'quran' ? 'Al-Baqarah' : 'Malik 645'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </ThemedView>
    </Modal>
  );
};

export default memo(SearchModal);

const styles = StyleSheet.create({
  // ── Search (matching Header.jsx exactly) ──
  searchOverlay: { flex: 1, justifyContent: 'flex-end' },
  searchSheet: { borderTopLeftRadius: ms(24), borderTopRightRadius: ms(24), height: '85%' },
  searchHeader: {
    alignItems: 'center',
    paddingHorizontal: ms(22),
    paddingVertical: ms(14),
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
  },
  input: { flex: 1, fontSize: scaleFontSize(17), paddingLeft: ms(8), fontWeight: '500' },
  sourceSelector: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: ms(16), paddingTop: ms(12), gap: ms(8) },
  sourceButton: { flex: 1, paddingVertical: ms(10), borderRadius: ms(14), alignItems: 'center', borderWidth: 1 },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(10),
    paddingVertical: ms(8),
    borderRadius: ms(14),
    borderWidth: 1,
  },
  examplesContainer: { paddingHorizontal: ms(18) },
  examplesHint: { fontSize: scaleFontSize(13), marginBottom: ms(12), fontStyle: 'italic' },
  noResults: { textAlign: 'center', marginTop: ms(36), fontSize: scaleFontSize(14) },



  // ── Result items ──
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ms(13),
    paddingHorizontal: ms(18),
    borderBottomWidth: 0.5,
  },
  resultContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  resultText: { marginLeft: ms(12), flex: 1 },
  resultTitle: { fontSize: scaleFontSize(15), fontWeight: '600' },
  resultSubtitle: { fontSize: scaleFontSize(12), marginTop: ms(2) },
  verseRefBadge: { paddingHorizontal: ms(8), paddingVertical: ms(4), borderRadius: ms(6), marginRight: ms(10) },
  verseRefBadgeText: { fontSize: scaleFontSize(11), fontWeight: '700' },
  verseHintRow: { paddingHorizontal: ms(18), paddingTop: ms(8) },
  verseHintPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: ms(12), paddingVertical: ms(6), borderRadius: ms(20), borderWidth: 1, alignSelf: 'flex-start' },
  verseHintText: { fontSize: scaleFontSize(11), fontWeight: '500' },

  // ── Filter Panel ──
  filterPanel: { paddingHorizontal: ms(18), paddingBottom: ms(16), borderBottomWidth: 0.5 },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: ms(12) },
  filterLabel: { fontSize: scaleFontSize(15), fontWeight: '700' },
  filterSubLabel: { fontSize: scaleFontSize(12), marginTop: ms(12), marginBottom: ms(8), fontWeight: '600' },
  filterChip: {
    paddingHorizontal: ms(14),
    paddingVertical: ms(8),
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: ms(8),
    marginBottom: ms(8),
    backgroundColor: 'transparent',
  },
  filterChipText: { fontSize: scaleFontSize(12), fontWeight: '500', color: '#666' },
  tipsGrid: {
    gap: ms(10),
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(12),
    paddingVertical: ms(10),
    borderRadius: ms(12),
    borderWidth: 1,
    gap: ms(10),
  },
  tipText: {
    fontSize: scaleFontSize(13),
    fontWeight: '500',
    flex: 1,
  },
  upgradeButton: {
    paddingHorizontal: ms(24),
    paddingVertical: ms(12),
    borderRadius: ms(20),
  },
  upgradeButtonText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
  // Warning banner styles
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    paddingHorizontal: ms(14),
    paddingVertical: ms(12),
    marginHorizontal: ms(16),
    marginBottom: ms(12),
    borderRadius: ms(8),
    gap: ms(10),
  },
  warningText: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
    marginBottom: ms(4),
  },
  warningSubtext: {
    fontSize: scaleFontSize(11),
    fontWeight: '500',
    lineHeight: scaleFontSize(15),
  },
  warningUpgradeButton: {
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: ms(6),
    alignSelf: 'flex-start',
  },
  warningUpgradeButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(11),
    fontWeight: '700',
  },
});

