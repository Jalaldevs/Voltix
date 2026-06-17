import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
  Share,
  InteractionManager,
  UIManager,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import ArabicTextWithFontForSharing from '../components/ArabicTextWithFontForSharing';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translationsKeys from '../constants/transaltionsKeys';
import Header from '../components/Header';
import ThemedView from '../components/ThemedView';
import ThemedCard from '../components/ThemedCard';
import Colors from '../constants/Colors';
import surahs from '../constants/surahs';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import { useNavigationContext } from '../components/NavigationContext';
import { quranArabicMap } from '../constants/quranArabicMap';
import { quranTranslationMap } from '../constants/quranTranslationMap';
import { languageCodeMap } from '../constants/languageCodeMap';
import { scaleFontSize, moderateScale } from '../utils/responsive';
import useAppTranslation from '../hooks/useAppTranslation';
import { saveBookmark, getBookmarks, removeBookmark } from '../constants/bookmarks';
import ReferenceModal, { QuranLanguageSheet } from '../components/ReferenceModal';
import usePremium from '../hooks/usePremium';
import { StatusBar } from 'expo-status-bar';
import * as quranAudioSync from '../utils/quranAudioSync';

const MODERATE_FACTOR = 0.35;
const ms = (size) => moderateScale(size, MODERATE_FACTOR);

const STORAGE_TRANSLATION_KEY = '@quran:selectedTranslation';
const STORAGE_SURAH_KEY = '@quran:selectedSurahId';
const LANGUAGE_PROMPT_SHOWN_KEY = '@contentLanguage:autoPromptShown';
const AYAH_ITEM_ESTIMATE = moderateScale(230);
const HAS_AUTO_LAYOUT_VIEW = Boolean(UIManager.getViewManagerConfig?.('AutoLayoutView'));
const QURAN_NO_TRANSLATION_KEY = 'none';

const toParamInt = (value) => {
  const normalized = Array.isArray(value) ? value[0] : value;
  const parsed = parseInt(normalized, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const isArabicLanguageCode = (langCode) => langCode === 'arabic' || langCode === 'ar';

const isValidQuranTranslationSelection = (value) => {
  if (!value) return false;
  return value === QURAN_NO_TRANSLATION_KEY || Boolean(quranTranslationMap[value]);
};

const resolveQuranTranslation = (langCode) => {
  if (isArabicLanguageCode(langCode)) return QURAN_NO_TRANSLATION_KEY;
  if (langCode && quranTranslationMap[langCode]) return langCode;
  return QURAN_NO_TRANSLATION_KEY;
};

const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeout)),
  ]);
};

const Quran = () => {
  const { registerAudioControl, colorScheme, languageLoaded, prayerAlertVisible, bookmarkUpdateTrigger, triggerBookmarkUpdate } = useNavigationContext();
  const { t, language } = useAppTranslation();
  const { requirePremium, isPremium } = usePremium();
  const scheme = colorScheme;
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const params = useLocalSearchParams();
  const AyahListComponent = HAS_AUTO_LAYOUT_VIEW ? FlashList : FlatList;

  const [selectedSurah, setSelectedSurah] = useState(surahs[0]);
  const [ayahs, setAyahs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTranslation, setSelectedTranslation] = useState(QURAN_NO_TRANSLATION_KEY);
  const [isSelectionHydrated, setIsSelectionHydrated] = useState(false);
  const [hasCheckedAutoLanguagePrompt, setHasCheckedAutoLanguagePrompt] = useState(false);
  const [hasShownAutoLanguagePrompt, setHasShownAutoLanguagePrompt] = useState(false);
  const [playingAyahId, setPlayingAyahId] = useState(null);
  const [quranLangSheetVisible, setQuranLangSheetVisible] = useState(false);
  const [referenceModalVisible, setReferenceModalVisible] = useState(false);
  const [referenceModalAyah, setReferenceModalAyah] = useState(null);
  const [sound, setSound] = useState(null);
  const [bufferingAyahId, setBufferingAyahId] = useState(null);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState(new Set());
  const flatListRef = useRef(null);
  const surahListRef = useRef(null);
  const overlayTimeoutRef = useRef(null);
  const failsafeTimeoutRef = useRef(null);
  const unsupportedLangPromptedRef = useRef(null);
  const surahAyahsCacheRef = useRef(new Map());
  const surahAudioCacheRef = useRef(new Map());
  const lastShownJumpAtRef = useRef(null);
  const ayahsRef = useRef([]);
  useEffect(() => { ayahsRef.current = ayahs; }, [ayahs]);

  const [fontsLoaded] = useFonts({ UthmanicHafs: require('../../assets/fonts/uthmanic_hafs_v22.ttf') });

  // ── Audio ──────────────────────────────────────────────────────────────────
  const stopAudioPlayback = useCallback(async () => {
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) { await sound.stopAsync(); await sound.unloadAsync(); }
        await sound.setOnPlaybackStatusUpdate(null);
        setSound(null); setPlayingAyahId(null); setBufferingAyahId(null);
      } catch (error) { console.error('Error stopping audio:', error); }
    }
  }, [sound]);

  // ── Share: translation only, disabled when none ────────────────────────────
  const shareQuranAyah = async ({ translation, surahName, ayahNumber }) => {
    if (!translation) return;
    try {
      const message = `${translation}\n\n📖 ${surahName} - Ayah ${ayahNumber}`;
      await Share.share({ message });
    } catch (error) { console.error('Share Quran ayah failed:', error); }
  };

  const handleSelectSurah = useCallback((surah) => {
    if (!surah) return;
    stopAudioPlayback(); setPlayingAyahId(null); setSelectedSurah(surah);
  }, [stopAudioPlayback]);

  useEffect(() => { registerAudioControl(stopAudioPlayback); }, [registerAudioControl, stopAudioPlayback]);

  const fetchSurahAudio = async (surahId) => {
    try {
      const res = await fetchWithTimeout(`https://api.alquran.cloud/v1/surah/${surahId}/ar.alafasy`, {}, 5000);
      const json = await res.json();
      if (json.code === 200) return Object.fromEntries(json.data.ayahs.map((v) => [v.numberInSurah, v.audio]));
    } catch (err) { console.warn('Audio fetch failed:', err.message); }
    return {};
  };

  const refreshBookmarks = useCallback(async () => {
    try {
      const all = await getBookmarks();
      const current = all.filter(b => b.source === 'quran' && b.quran?.surahId === selectedSurah.id).map(b => String(b.quran.ayahId));
      setBookmarkedAyahs(new Set(current));
    } catch (e) { console.error('Failed to refresh quran bookmarks', e); }
  }, [selectedSurah.id]);

  useEffect(() => { refreshBookmarks(); }, [refreshBookmarks, bookmarkUpdateTrigger]);
  useEffect(() => { if (prayerAlertVisible) setReferenceModalVisible(false); }, [prayerAlertVisible]);

  const handleToggleBookmark = useCallback(async (ayah) => {
    if (!ayah) return;
    try {
      const key = String(ayah.id);
      const isBookmarked = bookmarkedAyahs.has(key);
      setBookmarkedAyahs((prev) => { const next = new Set(prev); if (isBookmarked) next.delete(key); else next.add(key); return next; });
      if (isBookmarked) {
        const all = await getBookmarks();
        const bm = all.find(b => b.source === 'quran' && b.quran?.surahId === selectedSurah.id && String(b.quran?.ayahId) === key);
        if (bm) await removeBookmark(bm.id);
      } else {
        await saveBookmark({ source: 'quran', quran: { surahId: selectedSurah.id, ayahId: ayah.id, surahName: selectedSurah.latin, translationLanguage: selectedTranslation } });
      }
      await refreshBookmarks();
      triggerBookmarkUpdate();
    } catch (error) { console.error('Failed to toggle Quran bookmark', error); await refreshBookmarks(); }
  }, [selectedSurah, selectedTranslation, bookmarkedAyahs, refreshBookmarks]);

  const playAyahAudio = useCallback(async (ayah, index) => {
    try {
      if (sound) { await sound.setOnPlaybackStatusUpdate(null); await sound.stopAsync(); await sound.unloadAsync(); }
      if (playingAyahId === ayah.id) { setSound(null); setPlayingAyahId(null); return; }
      if (!ayah.audio) return;
      const localUri = quranAudioSync.getLocalAyahUri(selectedSurah.id, ayah.id);
      const fileInfo = await quranAudioSync.isAyahDownloaded(selectedSurah.id, ayah.id);
      const audioSource = fileInfo ? { uri: localUri } : { uri: ayah.audio };
      setBufferingAyahId(ayah.id);
      const { sound: newSound } = await Audio.Sound.createAsync(audioSource, { shouldPlay: true });
      setBufferingAyahId(null); setSound(newSound); setPlayingAyahId(ayah.id);
      newSound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          setPlayingAyahId(null);
          const nextIndex = index + 1;
          if (nextIndex < ayahs.length) {
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true, viewPosition: 0.4 });
            playAyahAudio(ayahs[nextIndex], nextIndex);
          }
        }
      });
    } catch (err) { setBufferingAyahId(null); console.error('Audio play failed', err); }
  }, [sound, playingAyahId, ayahs]);

  // ── Fetch Surah ────────────────────────────────────────────────────────────
  const fetchSurah = async (surahId, lang) => {
    const cacheKey = `${surahId}:${lang}`;
    try {
      const cachedAyahs = surahAyahsCacheRef.current.get(cacheKey);
      if (cachedAyahs?.length) {
        setAyahs(cachedAyahs); setLoading(false);
        const audioCacheKey = String(surahId);
        if (!surahAudioCacheRef.current.has(audioCacheKey)) {
          fetchSurahAudio(surahId).then((audioMap) => {
            surahAudioCacheRef.current.set(audioCacheKey, audioMap);
            setAyahs((prev) => prev.map((a) => a?.isBasmala ? a : { ...a, audio: audioMap[a.id] || a.audio || null }));
          }).catch(() => { });
        }
        return;
      }
      setLoading(true);
      const arabicJson = quranArabicMap[surahId];
      const isNoTranslation = lang === QURAN_NO_TRANSLATION_KEY;
      const translationJson = isNoTranslation ? null : quranTranslationMap[lang];
      if (!arabicJson) throw new Error(`Arabic data for Surah ${surahId} not found.`);
      if (!isNoTranslation && !translationJson) throw new Error(`Translation "${lang}" not found.`);

      const fatihaJson = quranArabicMap[1];
      const fatihaTranslation = isNoTranslation ? null : quranTranslationMap[lang]?.quran?.find(v => v.chapter === 1 && v.verse === 1);
      const BASMALA = { id: 0, arabic: fatihaJson.verses[0]?.text, translation: isNoTranslation ? '' : fatihaTranslation?.text || '', page: arabicJson.verses[0]?.page || null, isBasmala: true };

      const translationAyahs = isNoTranslation ? [] : translationJson.quran.filter((v) => v.chapter === surahId);
      const translationMap = Object.fromEntries(translationAyahs.map((v) => [v.verse, v.text]));
      const ayahsData = arabicJson.verses.map((v) => ({ id: v.id, arabic: v.text, translation: translationMap[v.id] || '', audio: null, page: v.page || null }));
      const shouldAddBasmala = surahId !== 1 && surahId !== 9;
      const finalAyahs = shouldAddBasmala ? [BASMALA, ...ayahsData] : ayahsData;

      const requestedSurahId = toParamInt(params.surahId);
      const requestedAyahId = toParamInt(params.ayahId);
      const shouldJumpToTarget = requestedAyahId != null && (requestedSurahId == null || requestedSurahId === surahId);
      if (shouldJumpToTarget) {
        const jumpKey = `${surahId}:${requestedAyahId}:${String(params.jumpAt || 'default')}`;
        if (lastShownJumpAtRef.current !== jumpKey) {
          const idx = finalAyahs.findIndex((a) => a.id === requestedAyahId);
          if (idx !== -1) { lastShownJumpAtRef.current = jumpKey; setReferenceModalAyah(finalAyahs[idx]); setReferenceModalVisible(true); }
        }
      }

      setAyahs(finalAyahs);
      surahAyahsCacheRef.current.set(cacheKey, finalAyahs);
      const audioCacheKey = String(surahId);
      const cachedAudio = surahAudioCacheRef.current.get(audioCacheKey);
      if (cachedAudio) {
        setAyahs((prev) => prev.map((a) => a?.isBasmala ? a : { ...a, audio: cachedAudio[a.id] || null }));
      } else {
        fetchSurahAudio(surahId).then((audioMap) => {
          surahAudioCacheRef.current.set(audioCacheKey, audioMap);
          setAyahs((prev) => prev.map((a) => a?.isBasmala ? a : { ...a, audio: audioMap[a.id] || null }));
        }).catch(() => { });
      }
    } catch (err) {
      console.error('Error loading surah:', err);
      alert(`${t('quranUI.failedToLoadSurah')}: ${err.message}`);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (referenceModalVisible && referenceModalAyah) {
      const updatedAyah = ayahs.find((a) => a.id === referenceModalAyah.id);
      if (updatedAyah && updatedAyah.translation !== referenceModalAyah.translation) setReferenceModalAyah(updatedAyah);
    }
  }, [ayahs]);

  // ── Hydration ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const hydrateSavedSelection = async () => {
      try {
        const [savedSurahId, savedTranslation] = await Promise.all([AsyncStorage.getItem(STORAGE_SURAH_KEY), AsyncStorage.getItem(STORAGE_TRANSLATION_KEY)]);
        if (isValidQuranTranslationSelection(savedTranslation)) setSelectedTranslation(savedTranslation);
        if (!params.surahId && savedSurahId) { const parsedId = parseInt(savedSurahId, 10); const savedSurah = surahs.find((s) => s.id === parsedId); if (savedSurah) setSelectedSurah(savedSurah); }
      } catch (e) { console.error('Failed to hydrate quran selection', e); }
      finally { setIsSelectionHydrated(true); }
    };
    hydrateSavedSelection();
  }, [params.surahId]);

  useEffect(() => {
    const load = async () => {
      try { const storedValue = await AsyncStorage.getItem(LANGUAGE_PROMPT_SHOWN_KEY); setHasShownAutoLanguagePrompt(storedValue === 'true'); }
      catch (e) { console.error(e); }
      finally { setHasCheckedAutoLanguagePrompt(true); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!isSelectionHydrated || !selectedSurah?.id) return;
    AsyncStorage.setItem(STORAGE_SURAH_KEY, String(selectedSurah.id)).catch(console.error);
  }, [isSelectionHydrated, selectedSurah]);

  useEffect(() => {
    if (!isSelectionHydrated || !languageLoaded || !hasCheckedAutoLanguagePrompt) return;
    const hasDirectQuranTranslation = Boolean(language && quranTranslationMap[language]);
    const isArabicSelected = isArabicLanguageCode(language);
    const syncedTranslation = hasDirectQuranTranslation ? language : resolveQuranTranslation(language);
    if (!hasDirectQuranTranslation && !isArabicSelected && !hasShownAutoLanguagePrompt && unsupportedLangPromptedRef.current !== language) {
      unsupportedLangPromptedRef.current = language;
      setHasShownAutoLanguagePrompt(true);
      AsyncStorage.setItem(LANGUAGE_PROMPT_SHOWN_KEY, 'true').catch(console.error);
    }
    if (hasDirectQuranTranslation) unsupportedLangPromptedRef.current = null;
    if (syncedTranslation === selectedTranslation) return;
    setSelectedTranslation(syncedTranslation);
    AsyncStorage.setItem(STORAGE_TRANSLATION_KEY, syncedTranslation).catch(console.error);
  }, [isSelectionHydrated, languageLoaded, hasCheckedAutoLanguagePrompt, hasShownAutoLanguagePrompt, language]);

  useEffect(() => { if (!fontsLoaded || !isSelectionHydrated || !selectedSurah?.id) return; fetchSurah(selectedSurah.id, selectedTranslation); }, [fontsLoaded, isSelectionHydrated, selectedSurah, selectedTranslation]);

  useEffect(() => {
    if (params.surahId) { const surahId = toParamInt(params.surahId); if (surahId == null) return; const surah = surahs.find((s) => s.id === surahId); if (surah && surah.id !== selectedSurah.id) handleSelectSurah(surah); }
  }, [params.surahId]);

  useEffect(() => {
    const requestedSurahId = toParamInt(params.surahId);
    const requestedAyahId = toParamInt(params.ayahId);
    if (requestedSurahId == null || requestedAyahId == null) return;
    if (requestedSurahId !== selectedSurah?.id) return;
    const jumpKey = `${requestedSurahId}:${requestedAyahId}:${String(params.jumpAt || 'default')}`;
    if (lastShownJumpAtRef.current === jumpKey) return;
    const foundAyah = ayahs.find((ayah) => ayah.id === requestedAyahId);
    if (!foundAyah) return;
    lastShownJumpAtRef.current = jumpKey;
    setReferenceModalAyah(foundAyah);
    setReferenceModalVisible(true);
  }, [params.ayahId, params.surahId, params.jumpAt, loading, ayahs, selectedSurah?.id]);

  useEffect(() => {
    if (referenceModalVisible && playingAyahId && playingAyahId !== referenceModalAyah?.id) {
      const found = ayahs.find((a) => a.id === playingAyahId);
      if (found) setReferenceModalAyah(found);
    }
  }, [playingAyahId, referenceModalVisible, ayahs, referenceModalAyah?.id]);

  // ── Audio cleanup ──────────────────────────────────────────────────────────
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', async () => {
      if (sound) { try { await sound.setOnPlaybackStatusUpdate(null); await sound.stopAsync(); await sound.unloadAsync(); setSound(null); setPlayingAyahId(null); } catch (error) { console.error(error); } }
    });
    return unsubscribe;
  }, [navigation, sound]);

  useEffect(() => {
    return () => {
      if (sound) { try { sound.setOnPlaybackStatusUpdate(null); } catch (_) { } sound.stopAsync().catch(console.error); sound.unloadAsync().catch(console.error); }
      if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
      if (failsafeTimeoutRef.current) clearTimeout(failsafeTimeoutRef.current);
    };
  }, [sound]);

  // ── Surah selector scroll ──────────────────────────────────────────────────
  useEffect(() => {
    if (!fontsLoaded) return;
    if (surahListRef.current && selectedSurah) {
      const index = surahs.findIndex((s) => s.id === selectedSurah.id);
      if (index !== -1) {
        InteractionManager.runAfterInteractions(() => { setTimeout(() => { surahListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 }); }, 500); });
      }
    }
  }, [selectedSurah, fontsLoaded]);

  const onSelectorScrollFail = (info) => {
    new Promise((resolve) => setTimeout(resolve, 500)).then(() => { surahListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 }); });
  };

  const onAyahScrollFail = useCallback((info) => {
    const requestedIndex = typeof info?.index === 'number' ? info.index : 0;
    const measuredIndex = typeof info?.highestMeasuredFrameIndex === 'number' ? info.highestMeasuredFrameIndex : Math.max(0, requestedIndex - 1);
    const averageItemLength = typeof info?.averageItemLength === 'number' && info.averageItemLength > 0 ? info.averageItemLength : AYAH_ITEM_ESTIMATE;
    flatListRef.current?.scrollToOffset({ offset: Math.max(0, measuredIndex * averageItemLength), animated: false });
    setTimeout(() => flatListRef.current?.scrollToIndex({ index: requestedIndex, animated: false, viewPosition: 0.35 }), 70);
    setTimeout(() => flatListRef.current?.scrollToIndex({ index: requestedIndex, animated: false, viewPosition: 0.35 }), 180);
  }, []);

  const isScreenReady = fontsLoaded && isSelectionHydrated;
  const isNoTranslationMode = selectedTranslation === QURAN_NO_TRANSLATION_KEY;

  // ── Handle translation change from inside ReferenceModal ───────────────────
  const handleQuranTranslationChange = useCallback(async (key) => {
    try {
      await AsyncStorage.setItem(STORAGE_TRANSLATION_KEY, key);
      setSelectedTranslation(key);
    } catch (e) { console.error('Failed to save translation', e); }
  }, []);

  // ── Render ayah item ───────────────────────────────────────────────────────
  const renderItem = useCallback(({ item, index }) => {
    const hasTranslation = !isNoTranslationMode && Boolean(item.translation);
    return (
      <View style={[styles.ayahContainer, playingAyahId === item.id && { backgroundColor: scheme === 'dark' ? 'rgba(96,165,250,0.12)' : 'rgba(25,118,210,0.08)' }]}>
        <View style={styles.ayahHeader}>
          <Text style={[styles.ayahNumber, { color: theme.muted }]}>{item.id}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <TouchableOpacity onPress={() => { setReferenceModalAyah(item); setReferenceModalVisible(true); }} style={styles.iconButton}>
              <Ionicons name="library-outline" size={ms(25)} color={scheme === 'dark' ? '#60a5fa' : theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleToggleBookmark(item)} style={styles.iconButton}>
              <Ionicons name={bookmarkedAyahs.has(String(item.id)) ? 'bookmarks' : 'bookmarks-outline'} size={ms(21)} color={scheme === 'dark' ? '#60a5fa' : (bookmarkedAyahs.has(String(item.id)) ? '#3b82f6' : '#000000')} />
            </TouchableOpacity>
            {/* Share: translation only, disabled if none */}
            <TouchableOpacity
              onPress={() => shareQuranAyah({ translation: item.translation, surahName: selectedSurah.latin, ayahNumber: item.id })}
              disabled={!hasTranslation}
              style={[styles.iconButton, !hasTranslation && { opacity: 0.3 }]}
            >
              <Ionicons name="share-social-outline" size={ms(26)} color={scheme === 'dark' ? '#60a5fa' : '#000000'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setQuranLangSheetVisible(true)} style={styles.iconButton}>
              <Ionicons name="earth-outline" size={ms(24)} color={scheme === 'dark' ? '#60a5fa' : theme.primary} />
            </TouchableOpacity>
            {bufferingAyahId === item.id && (
              <View style={{ position: 'absolute', left: ms(5), top: ms(5) }}>
                <ActivityIndicator size="small" color={scheme === 'dark' ? '#60a5fa' : theme.primary} />
              </View>
            )}
          </View>
        </View>

        <ArabicTextWithFontForSharing type="quran" style={[styles.arabicText, { color: theme.text }]}>
          {item.arabic}
        </ArabicTextWithFontForSharing>
        {!isNoTranslationMode && Boolean(item.translation) && (
          <Text style={[styles.translationText, { color: theme.muted }]}>{item.translation}</Text>
        )}

        {!item.isBasmala && (
          <TouchableOpacity
            style={[styles.tafseerButton, { borderColor: scheme === 'dark' ? '#374151' : '#e5e7eb' }]}
            onPress={() => { setReferenceModalAyah(item); setReferenceModalVisible(true); }}
          >
            <Text style={[styles.tafseerButtonText, { color: scheme === 'dark' ? '#60a5fa' : theme.primary }]}>{t('quranUI.showTafsir')}</Text>
            <Ionicons name="chevron-down-outline" size={ms(23)} color={scheme === 'dark' ? '#60a5fa' : theme.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  }, [playingAyahId, scheme, theme, isNoTranslationMode, handleToggleBookmark, bookmarkedAyahs, bufferingAyahId, selectedSurah.latin]);

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Header
        showBookmarkIcon={true}
        showSearchIcon={true}
        from="Quran"
      />
      <ThemedView style={styles.container}>
        <View style={styles.selectorContainer}>
          <FlatList
            ref={surahListRef} horizontal data={surahs} initialNumToRender={114}
            keyExtractor={(item) => item.id.toString()} onScrollToIndexFailed={onSelectorScrollFail}
            showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}
            renderItem={({ item }) => {
              const active = item.id === selectedSurah.id;
              return (
                <TouchableOpacity
                  onPress={() => handleSelectSurah(item)} disabled={!isScreenReady}
                  style={[styles.surahButton, { borderColor: scheme === 'dark' ? '#4b5563' : '#ccc', backgroundColor: scheme === 'dark' && !active ? '#1e293b' : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 4 }, active && { borderColor: '#1976d2', backgroundColor: scheme === 'dark' ? '#1e3a8a' : '#e3f2fd' }]}
                >
                  <Text style={[styles.surahButtonText, { color: active ? (scheme === 'dark' ? '#fff' : theme.text) : (scheme === 'light' ? '#000000' : theme.text) }]}>
                    {item.id}. {item.latin}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[styles.surahTitle, { color: theme.text }]}>{selectedSurah.latin}</Text>
        </View>

        <ThemedCard intensity={18} style={styles.card}>
          {loading ? (
            <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
          ) : (
            <AyahListComponent
              key={`ayah-list-${selectedSurah.id}-${selectedTranslation}`}
              ref={flatListRef}
              data={isScreenReady ? ayahs : []}
              keyExtractor={(item) => `${item.id}_${selectedTranslation}`}
              contentContainerStyle={{ paddingBottom: moderateScale(30) }}
              ItemSeparatorComponent={() => <View style={{ height: moderateScale(18) }} />}
              {...(HAS_AUTO_LAYOUT_VIEW
                ? { estimatedItemSize: AYAH_ITEM_ESTIMATE }
                : { onScrollToIndexFailed: onAyahScrollFail, initialNumToRender: 40, maxToRenderPerBatch: 32, windowSize: 35, removeClippedSubviews: false, updateCellsBatchingPeriod: 16 })}
              ListEmptyComponent={!isScreenReady ? <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View> : null}
              renderItem={renderItem}
            />
          )}
        </ThemedCard>
      </ThemedView>

      {/* ReferenceModal — all Quran sub-sheets live inside it as View overlays */}
      <ReferenceModal
        visible={referenceModalVisible}
        onClose={() => setReferenceModalVisible(false)}
        arabicText={referenceModalAyah?.arabic}
        translation={referenceModalAyah?.translation}
        ayahRef={referenceModalAyah ? `${selectedSurah.latin} ${selectedSurah.id}:${referenceModalAyah.id}` : undefined}
        isBookmarked={referenceModalAyah ? bookmarkedAyahs.has(String(referenceModalAyah.id)) : false}
        onBookmark={() => { if (referenceModalAyah) handleToggleBookmark(referenceModalAyah); }}
        onShare={() => {
          if (!referenceModalAyah?.translation) return;
          Share.share({ message: `${referenceModalAyah.translation}\n\n📖 ${selectedSurah.latin} ${selectedSurah.id}:${referenceModalAyah.id}` }).catch(console.error);
        }}
        onPrevious={() => {
          const idx = ayahs.findIndex(a => a.id === referenceModalAyah?.id);
          if (idx > 0) { setReferenceModalAyah(ayahs[idx - 1]); }
          else { const si = surahs.findIndex(s => s.id === selectedSurah.id); if (si > 0) { setReferenceModalVisible(false); setTimeout(() => handleSelectSurah(surahs[si - 1]), 100); } }
        }}
        onNext={() => {
          const idx = ayahs.findIndex(a => a.id === referenceModalAyah?.id);
          if (idx !== -1 && idx < ayahs.length - 1) { setReferenceModalAyah(ayahs[idx + 1]); }
          else { const si = surahs.findIndex(s => s.id === selectedSurah.id); if (si !== -1 && si < surahs.length - 1) { setReferenceModalVisible(false); setTimeout(() => handleSelectSurah(surahs[si + 1]), 100); } }
        }}
        prevArabicText={(() => { const idx = ayahs.findIndex(a => a.id === referenceModalAyah?.id); if (idx > 0) return ayahs[idx - 1].arabic; return null; })()}
        prevTranslation={(() => { const idx = ayahs.findIndex(a => a.id === referenceModalAyah?.id); if (idx > 0) return ayahs[idx - 1].translation; const si = surahs.findIndex(s => s.id === selectedSurah.id); if (si > 0) return `⬅️ ${surahs[si - 1].latin}`; return null; })()}
        nextArabicText={(() => { const idx = ayahs.findIndex(a => a.id === referenceModalAyah?.id); if (idx !== -1 && idx < ayahs.length - 1) return ayahs[idx + 1].arabic; return null; })()}
        nextTranslation={(() => { const idx = ayahs.findIndex(a => a.id === referenceModalAyah?.id); if (idx !== -1 && idx < ayahs.length - 1) return ayahs[idx + 1].translation; const si = surahs.findIndex(s => s.id === selectedSurah.id); if (si !== -1 && si < surahs.length - 1) return `➡️ ${surahs[si + 1].latin}`; return null; })()}
        onListenAyah={() => { if (!referenceModalAyah) return; const idx = ayahs.findIndex(a => a.id === referenceModalAyah.id); if (idx === -1) return; playAyahAudio(referenceModalAyah, idx); }}
        isPlaying={playingAyahId === referenceModalAyah?.id}
        isBuffering={bufferingAyahId === referenceModalAyah?.id}
        hasAudio={Boolean(referenceModalAyah?.audio)}
        theme={theme}
        isDarkMode={scheme === 'dark'}
        // Quran-specific props for in-modal sheets
        quranTranslationsKeys={translationsKeys}
        quranLanguageCodeMap={languageCodeMap}
        quranSelectedTranslation={selectedTranslation}
        quranNoTranslationKey={QURAN_NO_TRANSLATION_KEY}
        onQuranTranslationChange={handleQuranTranslationChange}
        quranSurahName={selectedSurah.latin}
        quranSurahId={selectedSurah.id}
        quranAyah={referenceModalAyah}
        quranAyahsList={ayahs}
      />

      {translationsKeys && (
        <Modal
          visible={quranLangSheetVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setQuranLangSheetVisible(false)}
        >
          <QuranLanguageSheet
            visible={quranLangSheetVisible}
            onClose={() => setQuranLangSheetVisible(false)}
            translationsKeys={translationsKeys}
            languageCodeMap={languageCodeMap || {}}
            selectedTranslation={selectedTranslation}
            noTranslationKey={QURAN_NO_TRANSLATION_KEY}
            onSelect={handleQuranTranslationChange}
            isDarkMode={scheme === 'dark'}
            accentColor={scheme === 'dark' ? '#60A5FA' : '#1976d2'}
            textColor={scheme === 'dark' ? '#f1f5f9' : '#0f172a'}
            mutedColor={scheme === 'dark' ? '#94a3b8' : '#64748b'}
            t={t}
            maxHeight={Dimensions.get('window').height * 0.68}
          />
        </Modal>
      )}
    </>
  );
};

export default Quran;

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: moderateScale(10), paddingBottom: moderateScale(100), paddingHorizontal: moderateScale(2) },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  selectorScroll: { flexDirection: 'row' },
  surahButton: { paddingVertical: moderateScale(8), paddingHorizontal: moderateScale(14), borderRadius: moderateScale(16), borderWidth: 1, marginRight: moderateScale(12) },
  surahButtonText: { fontSize: scaleFontSize(14), fontWeight: '600' },
  surahTitle: { fontSize: scaleFontSize(18), fontWeight: '700', textAlign: 'center', marginVertical: moderateScale(21), marginRight: moderateScale(6) },
  selectorContainer: { paddingLeft: moderateScale(15) },
  card: { borderRadius: moderateScale(22), paddingHorizontal: moderateScale(20), backgroundColor: 'transparent', flex: 1 },
  ayahContainer: { borderBottomWidth: 0.5, borderBottomColor: '#CCC', paddingVertical: moderateScale(12), paddingHorizontal: moderateScale(6) },
  ayahHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ayahNumber: { fontSize: scaleFontSize(14), fontWeight: '600' },
  iconButton: { padding: moderateScale(4) },
  arabicText: { fontSize: scaleFontSize(31), textAlign: 'right', marginTop: moderateScale(6), paddingLeft: moderateScale(30), paddingRight: moderateScale(3), writingDirection: 'rtl' },
  translationText: { fontSize: scaleFontSize(16.5), lineHeight: scaleFontSize(22), marginTop: moderateScale(4) },
  tafseerButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: moderateScale(18), paddingVertical: moderateScale(5), paddingHorizontal: moderateScale(10), borderRadius: moderateScale(10), borderWidth: 1, gap: moderateScale(4) },
  tafseerButtonText: { fontSize: scaleFontSize(14), fontWeight: '600' },
});