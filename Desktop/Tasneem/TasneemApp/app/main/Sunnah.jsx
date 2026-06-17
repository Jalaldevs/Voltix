import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
  Share,
  Alert,
  InteractionManager,
  UIManager,
  ScrollView,
  Pressable,
} from 'react-native';
import { Link } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import ArabicTextWithFontForSharing from '../components/ArabicTextWithFontForSharing';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import ThemedView from '../components/ThemedView';
import ThemedCard from '../components/ThemedCard';
import Colors from '../constants/Colors';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { booksFrontEnd, BOOKS } from '../constants/sunnahBooks';
import sunnahCollections from '../constants/sunnahCollectionsTitles';
import { useNavigationContext } from '../components/NavigationContext';
import { scaleFontSize, moderateScale, width } from '../utils/responsive';
import usePremium from '../hooks/usePremium';
import { StatusBar } from 'expo-status-bar';

import {
  readOfflineSunnahCatalog,
  readOfflineSunnahEdition,
} from '../utils/offlineContent';
import { SUNNAH_EDITION_ASSET_MAP } from '../constants/sunnahEditionAssetMap';

import useAppTranslation from '../hooks/useAppTranslation';
import { useQuery } from '@tanstack/react-query';
import { saveBookmark, getBookmarks, removeBookmark } from '../constants/bookmarks';
import ReferenceModal from '../components/ReferenceModal';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const cleanHadithText = (text) => {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/ـ/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const STORAGE_BOOK_KEY = '@sunnah:selectedBook';
const STORAGE_COLLECTION_KEY = '@sunnah:selectedCollection';
const MODERATE_FACTOR = 0.35;
const ms = (size) => moderateScale(size, MODERATE_FACTOR);

const HAS_AUTO_LAYOUT_VIEW = Boolean(UIManager.getViewManagerConfig?.('AutoLayoutView'));



export default function Sunnah() {
  const { t } = useAppTranslation();
  const { colorScheme, prayerAlertVisible, bookmarkUpdateTrigger, triggerBookmarkUpdate } = useNavigationContext();
  const scheme = colorScheme;
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const params = useLocalSearchParams();
  const { requirePremium } = usePremium();

  const getSingleParamValue = useCallback((value) => {
    if (Array.isArray(value)) return value[0];
    return value;
  }, []);

  const getCleanParamValue = useCallback((value) => {
    const single = getSingleParamValue(value);
    const normalized = String(single ?? '').trim();
    if (!normalized) return null;
    const lowered = normalized.toLowerCase();
    if (lowered === 'null' || lowered === 'undefined' || lowered === 'nan') return null;
    return normalized;
  }, [getSingleParamValue]);

  const requestedBookParam = useMemo(() => {
    const raw = getCleanParamValue(params.book);
    const normalized = String(raw || '').toLowerCase();
    return BOOKS.includes(normalized) ? normalized : null;
  }, [params.book, getCleanParamValue]);

  const requestedCollectionParam = useMemo(() => {
    const normalized = getCleanParamValue(params.collection);
    return normalized && normalized.length > 0 ? normalized : null;
  }, [params.collection, getCleanParamValue]);

  const requestedHadithNumber = useMemo(() => {
    const raw = getCleanParamValue(params.hadithNumber);
    const parsed = parseFloat(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }, [params.hadithNumber, getCleanParamValue]);

  const requestedHadithInCollection = useMemo(() => {
    const raw = getCleanParamValue(params.hadithInCollection);
    const parsed = parseFloat(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }, [params.hadithInCollection, getCleanParamValue]);

  const HadithListComponent = HAS_AUTO_LAYOUT_VIEW ? FlashList : FlatList;

  const [selectedBook, setSelectedBook] = useState('bukhari');
  const [metadata, setMetadata] = useState(null);
  const [hadiths, setHadiths] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSelectionHydrated, setIsSelectionHydrated] = useState(false);
  const [referenceModalVisible, setReferenceModalVisible] = useState(false);
  const [referenceModalData, setReferenceModalData] = useState(null);
  const [isHadithSearchMode, setIsHadithSearchMode] = useState(false);
  const [bookmarkedHadiths, setBookmarkedHadiths] = useState(new Set());
  const [infoModal, setInfoModal] = useState(false);
  const flatListRef = useRef(null);
  const bookListRef = useRef(null);
  const sectionListRef = useRef(null);
  const lastShownJumpAtRef = useRef(null);

  const [fontsLoaded, fontError] = useFonts({
    UthmanicHafs: require('../../assets/fonts/uthmanic_hafs_v22.ttf'),
    KFGQPCUthmanTahaNaskh: require('../../assets/fonts/kfgqpc_uthman_taha_naskh.ttf'),
  });

  useEffect(() => {
    console.log('Sunnah loading state - fontsLoaded:', fontsLoaded, 'fontError:', fontError, 'isSelectionHydrated:', isSelectionHydrated);
  }, [fontsLoaded, fontError, isSelectionHydrated]);

  const hasData = hadiths.length > 0 && metadata !== null && sections.length > 0;

  const getBookName = useCallback((bookKey) => {
    const index = BOOKS.indexOf(bookKey);
    return index !== -1 ? booksFrontEnd[index] : t('sunnahUI.unknownBook');
  }, [t]);


  useEffect(() => {
    if (prayerAlertVisible) setReferenceModalVisible(false);
  }, [prayerAlertVisible]);

  useEffect(() => {
    let timeoutId;
    const loadSavedSelection = async () => {
      try {
        const fetchPromise = Promise.all([
          AsyncStorage.getItem(STORAGE_BOOK_KEY),
          AsyncStorage.getItem(STORAGE_COLLECTION_KEY),
        ]);
        const timeoutPromise = new Promise((resolve) => {
          timeoutId = setTimeout(() => resolve([null, null]), 2000);
        });

        const [savedBook, savedCollection] = await Promise.race([fetchPromise, timeoutPromise]);

        if (!requestedBookParam && savedBook && BOOKS.includes(savedBook)) setSelectedBook(savedBook);
        if (savedCollection) setSelectedSection(String(savedCollection));
      } catch (e) {
        console.error('Failed to load saved sunnah selection', e);
      } finally {
        clearTimeout(timeoutId);
        setIsSelectionHydrated(true);
      }
    };
    loadSavedSelection();
    return () => clearTimeout(timeoutId);
  }, [requestedBookParam]);

  useEffect(() => {
    if (!isSelectionHydrated || !selectedBook) return;
    AsyncStorage.setItem(STORAGE_BOOK_KEY, selectedBook).catch(console.error);
  }, [isSelectionHydrated, selectedBook]);

  useEffect(() => {
    if (!isSelectionHydrated || !selectedSection) return;
    AsyncStorage.setItem(STORAGE_COLLECTION_KEY, String(selectedSection)).catch(console.error);
  }, [isSelectionHydrated, selectedSection]);

  const hasSearchedHadithTarget = useMemo(() => {
    if (requestedHadithNumber == null) return false;
    if (requestedBookParam && requestedBookParam !== selectedBook) return false;
    return true;
  }, [requestedHadithNumber, requestedBookParam, selectedBook]);

  useEffect(() => {
    if (hasSearchedHadithTarget) { setIsHadithSearchMode(true); return; }
    setIsHadithSearchMode(false);
  }, [hasSearchedHadithTarget, params.jumpAt]);

  useEffect(() => {
    if (requestedBookParam) setSelectedBook(requestedBookParam);
  }, [requestedBookParam]);

  useEffect(() => {
    if (!isHadithSearchMode || !requestedCollectionParam || sections.length === 0) return;
    const hasRequestedSection = sections.some((s) => String(s.id) === requestedCollectionParam);
    if (hasRequestedSection && String(selectedSection) !== requestedCollectionParam)
      setSelectedSection(requestedCollectionParam);
  }, [isHadithSearchMode, requestedCollectionParam, sections, selectedSection]);

  useEffect(() => {
    if (!fontsLoaded) return;
    if (bookListRef.current && selectedBook) {
      const index = BOOKS.indexOf(selectedBook);
      if (index !== -1) setTimeout(() => bookListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 }), 300);
    }
  }, [selectedBook, fontsLoaded]);

  useEffect(() => {
    if (!fontsLoaded) return;
    if (sectionListRef.current && sections.length > 0 && selectedSection) {
      const index = sections.findIndex((s) => s.id === selectedSection);
      if (index !== -1) setTimeout(() => sectionListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 }), 300);
    }
  }, [selectedSection, sections, fontsLoaded]);

  const arabicBookQuery = useQuery({
    queryKey: ['sunnah', 'arabic-book', selectedBook],
    enabled: isSelectionHydrated && Boolean(selectedBook),
    queryFn: async () => {
      // Try reading directly from the bundled asset map first (synchronous require)
      const editionKey = `ara-${selectedBook}`;
      const bundledGetter = SUNNAH_EDITION_ASSET_MAP[editionKey];
      if (bundledGetter) {
        const data = bundledGetter();
        if (data && typeof data === 'object' && data.hadiths) return data;
      }
      // Fallback to the async chain (external/downloaded files)
      const araData = await readOfflineSunnahEdition(editionKey);
      if (!araData) throw new Error(`Arabic data for ${selectedBook} not found in bundled assets`);
      return araData;
    },
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => { setLoading(arabicBookQuery.isLoading && !hasData); }, [arabicBookQuery.isLoading, hasData]);

  useEffect(() => {
    if (!arabicBookQuery.data) return;
    const araData = arabicBookQuery.data;
    setMetadata(araData.metadata);
    setHadiths(araData.hadiths);

    const preparedSections = Object.entries(araData.metadata.sections)
      .map(([id, title]) => {
        const details = araData.metadata.section_details[id];
        if (!details || details.hadithnumber_last === 0) return null;
        return { id, title: title || t('sunnahUI.sectionFallbackTitle', { id }), first: details.hadithnumber_first, last: details.hadithnumber_last };
      })
      .filter(Boolean);

    setSections(preparedSections);
    const hasCurrentSection = preparedSections.some((s) => String(s.id) === String(selectedSection));
    setSelectedSection(hasCurrentSection ? String(selectedSection) : (preparedSections[0]?.id ?? null));
  }, [arabicBookQuery.data, selectedSection]);

  const shareHadith = async ({
    arabicText,
    bookName,
    hadithNumber,
  }) => {
    try {
      const message = [
        arabicText,
        `\n\n📚 ${bookName}`,
        `\nHadith ${hadithNumber}`,
      ].join('');

      await Share.share({ message });
    } catch (error) {
      console.error('Share hadith failed:', error);
    }
  };

  const filteredHadiths = useMemo(() => {
    if (!metadata || !selectedSection) return [];
    const details = metadata.section_details[String(selectedSection)];
    if (!details) return [];
    return hadiths.filter((h) => {
      const hNum = parseFloat(h.hadithnumber);
      if (isNaN(hNum)) return false;
      return hNum >= details.hadithnumber_first && hNum <= details.hadithnumber_last;
    });
  }, [hadiths, metadata, selectedSection]);

  const visibleHadiths = useMemo(() => filteredHadiths.filter((h) => Boolean(cleanHadithText(h?.text))), [filteredHadiths]);

  const resolvedSearchTarget = useMemo(() => {
    if (!metadata || requestedHadithNumber == null) return null;
    if (requestedCollectionParam) {
      const details = metadata.section_details?.[requestedCollectionParam];
      if (!details) return { sectionId: requestedCollectionParam, globalHadithNumber: requestedHadithNumber };
      const first = parseFloat(details.hadithnumber_first);
      const last = parseFloat(details.hadithnumber_last);
      const count = last - first + 1;
      const localCandidate = requestedHadithInCollection ?? requestedHadithNumber;
      let globalHadithNumber = requestedHadithNumber;
      if (!(requestedHadithNumber >= first && requestedHadithNumber <= last)) {
        if (localCandidate >= 1 && localCandidate <= count) globalHadithNumber = first + localCandidate - 1;
      }
      return { sectionId: requestedCollectionParam, globalHadithNumber };
    }
    const targetSection = sections.find((s) => {
      const details = metadata.section_details?.[s.id];
      if (!details) return false;
      return requestedHadithNumber >= details.hadithnumber_first && requestedHadithNumber <= details.hadithnumber_last;
    });
    return { sectionId: targetSection?.id ?? null, globalHadithNumber: requestedHadithNumber };
  }, [metadata, sections, requestedCollectionParam, requestedHadithNumber, requestedHadithInCollection]);

  const allBookHadiths = useMemo(() => hadiths, [hadiths]);
  const activeHadiths = isHadithSearchMode ? allBookHadiths : visibleHadiths;

  const refreshBookmarks = useCallback(async () => {
    try {
      const all = await getBookmarks();
      const current = all.filter(b => b.source === 'sunnah' && b.sunnah?.book === selectedBook).map(b => b.sunnah.hadithNumber);
      setBookmarkedHadiths(new Set(current));
    } catch (e) { console.error('Failed to refresh bookmarks', e); }
  }, [selectedBook]);

  useEffect(() => { refreshBookmarks(); }, [refreshBookmarks, bookmarkUpdateTrigger]);

  const handleToggleBookmark = useCallback(async (hadith) => {
    if (!hadith) return;
    try {
      const isBookmarked = bookmarkedHadiths.has(String(hadith.hadithnumber));
      if (isBookmarked) {
        const all = await getBookmarks();
        const bookmark = all.find(b => b.source === 'sunnah' && b.sunnah?.book === selectedBook && String(b.sunnah?.hadithNumber) === String(hadith.hadithnumber));
        if (bookmark) await removeBookmark(bookmark.id);
      } else {
        const cleanText = cleanHadithText(hadith.text || '');
        await saveBookmark({
          source: 'sunnah',
          sunnah: { book: selectedBook, bookDisplayName: getBookName(selectedBook), hadithNumber: String(hadith.hadithnumber), sectionId: selectedSection ? String(selectedSection) : null, arabicText: cleanText, translation: cleanText.slice(0, 220) },
        });
      }
      await refreshBookmarks();
      triggerBookmarkUpdate();
    } catch (error) { console.error('Failed to toggle Sunnah bookmark', error); }
  }, [selectedBook, getBookName, selectedSection, bookmarkedHadiths, refreshBookmarks]);

  useEffect(() => {
    if (!hasSearchedHadithTarget || !metadata || sections.length === 0 || !resolvedSearchTarget) return;
    const jumpKey = String(params.jumpAt || 'default');
    if (lastShownJumpAtRef.current === jumpKey) return;
    const targetHadith = hadiths.find((h) => parseFloat(h.hadithnumber) === resolvedSearchTarget.globalHadithNumber);
    if (targetHadith) {
      lastShownJumpAtRef.current = jumpKey;
      setReferenceModalData({ arabicText: cleanHadithText(targetHadith.text), hadith: targetHadith });
      setReferenceModalVisible(true);
    }
    const targetSection = resolvedSearchTarget.sectionId ? sections.find((s) => String(s.id) === String(resolvedSearchTarget.sectionId)) : null;
    if (targetSection && String(selectedSection) !== String(targetSection.id)) setSelectedSection(String(targetSection.id));
  }, [hasSearchedHadithTarget, resolvedSearchTarget, params.jumpAt, metadata, sections, selectedSection, hadiths]);

  const navigation = useNavigation();

  const onSelectorScrollFail = useCallback((ref) => (info) => {
    const requestedIndex = typeof info?.index === 'number' ? info.index : 0;
    const measuredIndex = typeof info?.highestMeasuredFrameIndex === 'number' ? info.highestMeasuredFrameIndex : requestedIndex;
    const safeIndex = Math.max(0, Math.min(requestedIndex, measuredIndex));
    setTimeout(() => ref.current?.scrollToIndex({ index: safeIndex, animated: true, viewPosition: 0.5 }), 500);
  }, []);

  const onHadithScrollFail = useCallback((info) => {
    const requestedIndex = typeof info?.index === 'number' ? info.index : 0;
    const measuredIndex = typeof info?.highestMeasuredFrameIndex === 'number' ? info.highestMeasuredFrameIndex : Math.max(0, requestedIndex - 1);
    const averageItemLength = typeof info?.averageItemLength === 'number' && info.averageItemLength > 0 ? info.averageItemLength : 290;
    flatListRef.current?.scrollToOffset({ offset: Math.max(0, measuredIndex * averageItemLength), animated: false });
    setTimeout(() => flatListRef.current?.scrollToIndex({ index: requestedIndex, animated: false, viewPosition: 0.35 }), 70);
    setTimeout(() => flatListRef.current?.scrollToIndex({ index: requestedIndex, animated: false, viewPosition: 0.35 }), 180);
  }, []);


  // ── Render hadith item ─────────────────────────────────────────────────────
  const renderHadithItem = useCallback(({ item }) => {
    const hadithFontSize = scaleFontSize(27);
    return (
      <View style={styles.hadithContainer}>
        <View style={styles.hadithHeader}>
          <View style={styles.hadithNumberRow}>
            <Text style={[styles.hadithNumber, { color: theme.muted }]}>
              {item.hadithnumber}{'   '}{getBookName(selectedBook).replace(/\s*\([^)]*\)\s*/g, '').trim()}
            </Text>
          </View>
          <View style={styles.iconButtonsContainer}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => { setReferenceModalData({ arabicText: cleanHadithText(item.text), hadith: item }); setReferenceModalVisible(true); }}
              accessible={true} accessibilityLabel={t('sunnahUI.readHadithA11y') || 'Read Hadith'} accessibilityRole="button"
            >
              <Ionicons name="library-outline" size={ms(25)} color={scheme === 'dark' ? '#60a5fa' : theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => handleToggleBookmark(item)}>
              <Ionicons
                name={bookmarkedHadiths.has(String(item.hadithnumber)) ? 'bookmarks' : 'bookmarks-outline'}
                size={ms(21)}
                color={scheme === 'dark' ? '#60a5fa' : (bookmarkedHadiths.has(String(item.hadithnumber)) ? '#3b82f6' : '#000000')}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() =>
                shareHadith({
                  arabicText: cleanHadithText(item.text),
                  bookName: getBookName(selectedBook)
                    .replace(/\s*\([^)]*\)\s*/g, '')
                    .trim(),
                  hadithNumber: item.hadithnumber,
                })
              }
            >
              <Ionicons
                name="share-social-outline"
                size={ms(26)}
                color={scheme === 'dark' ? '#60a5fa' : '#000000'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {!!item.text && (
          <ArabicTextWithFontForSharing
            type="hadith"
            style={[
              styles.hadithText,
              {
                color: theme.text,
                fontSize: hadithFontSize,
              },
            ]}
          >
            {cleanHadithText(item.text)}
          </ArabicTextWithFontForSharing>
        )}

        {item.grades && item.grades.length > 0 && (
          <View style={styles.gradesContainer}>
            {item.grades.map((g, i) => (
              <Text key={i} style={[styles.gradeText, { color: theme.muted }]}>{g.name}: {g.grade}</Text>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.tafseerButton, { borderColor: scheme === 'dark' ? '#374151' : '#e5e7eb' }]}
          onPress={() => { setReferenceModalData({ arabicText: cleanHadithText(item.text), hadith: item }); setReferenceModalVisible(true); }}
        >
          <Text style={[styles.tafseerButtonText, { color: scheme === 'dark' ? '#60a5fa' : theme.primary }]}>{t('sunnahUI.showTranslations')}</Text>
          <Ionicons name="chevron-down-outline" size={ms(23)} color={scheme === 'dark' ? '#60a5fa' : theme.primary} />
        </TouchableOpacity>
      </View>
    );
  }, [scheme, theme, handleToggleBookmark, bookmarkedHadiths, getBookName, selectedBook]);

  const renderBookItem = useCallback(({ item, index }) => {
    const active = selectedBook === item;
    return (
      <TouchableOpacity
        onPress={() => { setIsHadithSearchMode(false); setSelectedBook(item); }}
        style={[styles.bookButton, { borderColor: scheme === 'dark' ? '#4b5563' : '#ccc', backgroundColor: scheme === 'dark' && !active ? '#1e293b' : 'transparent' }, active && { backgroundColor: scheme === 'dark' ? '#1e3a8a' : '#e3f2fd', borderColor: '#1976d2' }]}
      >
        <Text style={[styles.bookText, { color: active ? (scheme === 'dark' ? '#fff' : theme.text) : (scheme === 'dark' ? '#e2e8f0' : theme.text) }]}>
          {booksFrontEnd[index]}
        </Text>
      </TouchableOpacity>
    );
  }, [selectedBook, scheme, theme]);

  const renderSectionItem = useCallback(({ item }) => {
    const active = String(selectedSection) === String(item.id);
    const bookCollections = sunnahCollections[selectedBook];
    const arabicTitle = bookCollections?.sections?.[item.id] || item.title;
    return (
      <TouchableOpacity
        onPress={() => { setIsHadithSearchMode(false); setSelectedSection(String(item.id)); }}
        style={[styles.bookButton, styles.bookSecond, { borderColor: scheme === 'dark' ? '#4b5563' : '#ccc', backgroundColor: scheme === 'dark' && !active ? '#1e293b' : 'transparent' }, active && { backgroundColor: scheme === 'dark' ? '#1e3a8a' : '#e3f2fd', borderColor: '#1976d2' }]}
      >
        <Text style={[styles.sectionText, { color: active ? (scheme === 'dark' ? '#fff' : theme.text) : (scheme === 'dark' ? '#e2e8f0' : theme.text) }]}>
          {arabicTitle}
        </Text>
      </TouchableOpacity>
    );
  }, [selectedSection, scheme, theme, selectedBook]);

  if ((!fontsLoaded && !fontError) || !isSelectionHydrated) {
    return (
      <ThemedView style={styles.container}>
        <StatusBar style="dark" />
        <Header from="Sunnah" />
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header showBookmarkIcon={true} showSearchIcon={true} from="Sunnah" />

      <ThemedView style={styles.selectorsWrapper}>
        <FlatList
          ref={bookListRef} horizontal data={BOOKS} initialNumToRender={BOOKS.length}
          keyExtractor={(item) => item} onScrollToIndexFailed={onSelectorScrollFail(bookListRef)}
          showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bookSelector}
          renderItem={renderBookItem}
        />
        <FlatList
          ref={sectionListRef} horizontal data={sections} style={styles.secondRow}
          initialNumToRender={100} onScrollToIndexFailed={onSelectorScrollFail(sectionListRef)}
          keyExtractor={(item) => item.id} showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectionList} renderItem={renderSectionItem}
        />
      </ThemedView>

      <ThemedCard intensity={18} style={styles.hadithCard}>
        {loading ? (
          <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
        ) : (
          <>
            <HadithListComponent
              ref={flatListRef}
              data={activeHadiths}
              {...(HAS_AUTO_LAYOUT_VIEW
                ? { estimatedItemSize: 290 }
                : { onScrollToIndexFailed: onHadithScrollFail, initialNumToRender: 36, maxToRenderPerBatch: 28, windowSize: 35, removeClippedSubviews: false, updateCellsBatchingPeriod: 16 })}
              keyExtractor={(item) => item.hadithnumber.toString()}
              contentContainerStyle={styles.hadithListContent}
              ItemSeparatorComponent={() => <View style={styles.hadithSeparator} />}
              renderItem={renderHadithItem}
            />

            {/* ── ReferenceModal ── */}
            <ReferenceModal
              visible={referenceModalVisible}
              onClose={() => setReferenceModalVisible(false)}
              arabicText={referenceModalData?.arabicText}
              hadithBookKey={selectedBook}
              hadithBook={getBookName(selectedBook).replace(/\s*\([^)]*\)\s*/g, '').trim()}
              hadithNumber={referenceModalData?.hadith?.hadithnumber}
              grades={referenceModalData?.hadith?.grades}
              isBookmarked={bookmarkedHadiths.has(String(referenceModalData?.hadith?.hadithnumber))}
              onBookmark={() => { if (referenceModalData?.hadith) handleToggleBookmark(referenceModalData.hadith); }}
              onPrevious={() => {
                const idx = hadiths.findIndex(h => h.hadithnumber === referenceModalData?.hadith?.hadithnumber);
                if (idx > 0) { const prev = hadiths[idx - 1]; setReferenceModalData({ arabicText: cleanHadithText(prev.text), hadith: prev }); }
              }}
              onNext={() => {
                const idx = hadiths.findIndex(h => h.hadithnumber === referenceModalData?.hadith?.hadithnumber);
                if (idx !== -1 && idx < hadiths.length - 1) { const next = hadiths[idx + 1]; setReferenceModalData({ arabicText: cleanHadithText(next.text), hadith: next }); }
              }}
              prevArabicText={(() => { const idx = hadiths.findIndex(h => h.hadithnumber === referenceModalData?.hadith?.hadithnumber); return idx > 0 ? cleanHadithText(hadiths[idx - 1].text) : null; })()}
              nextArabicText={(() => { const idx = hadiths.findIndex(h => h.hadithnumber === referenceModalData?.hadith?.hadithnumber); return idx !== -1 && idx < hadiths.length - 1 ? cleanHadithText(hadiths[idx + 1].text) : null; })()}
              theme={theme}
              isDarkMode={scheme === 'dark'}
            />
          </>
        )}
      </ThemedCard>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: ms(90) },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  selectorsWrapper: { paddingVertical: ms(10) },
  bookSelector: { gap: ms(12), paddingHorizontal: ms(14) },
  bookButton: { paddingVertical: ms(8), paddingHorizontal: ms(14), borderRadius: ms(14), borderWidth: 1 },
  secondRow: { marginTop: ms(10) },
  bookSecond: { marginRight: ms(10) },
  bookText: { fontSize: scaleFontSize(14), fontWeight: '600' },
  sectionList: { paddingHorizontal: ms(14) },
  sectionText: { fontSize: scaleFontSize(13) },
  iconButtonsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  iconButton: { paddingLeft: ms(8) },
  hadithCard: { flex: 1, borderRadius: ms(20), padding: ms(18), backgroundColor: 'transparent' },
  hadithListContent: { paddingBottom: ms(18) },
  hadithSeparator: { height: ms(16) },
  hadithHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: ms(12), paddingLeft: ms(8) },
  hadithNumberRow: { flexDirection: 'row', alignItems: 'center', gap: ms(5), flex: 1, flexShrink: 1 },
  infoIconButton: { justifyContent: 'center', alignItems: 'center' },
  hadithContainer: { borderBottomWidth: 0.5, borderBottomColor: '#ccc', paddingBottom: ms(14) },
  hadithNumber: { fontSize: scaleFontSize(15), fontWeight: '600', paddingLeft: ms(10) },
  hadithText: { lineHeight: scaleFontSize(44), textAlign: 'right', paddingLeft: Math.max(width * 0.08, ms(28)), paddingTop: ms(16) },
  gradesContainer: { marginTop: ms(8) },
  gradeText: { fontSize: scaleFontSize(12), paddingHorizontal: ms(8), paddingVertical: ms(1) },
  offlineModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0)', justifyContent: 'center', alignItems: 'center', padding: ms(40) },
  offlineModalCard: { width: '100%', maxWidth: ms(360), borderRadius: ms(22), padding: ms(24) },
  offlineModalIcon: { alignSelf: 'center', width: ms(58), height: ms(58), borderRadius: ms(29), justifyContent: 'center', alignItems: 'center', marginBottom: ms(14) },
  offlineModalTitle: { fontSize: scaleFontSize(19), fontWeight: '700', textAlign: 'center', marginBottom: ms(8) },
  offlineModalDescription: { fontSize: scaleFontSize(15), lineHeight: scaleFontSize(22), textAlign: 'center', marginBottom: ms(20) },
  offlineModalButton: { paddingVertical: ms(13), borderRadius: ms(14), alignItems: 'center' },
  offlineModalButtonText: { color: '#fff', fontWeight: '600', fontSize: scaleFontSize(15) },
  infoOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  infoContainer: { borderTopLeftRadius: ms(24), borderTopRightRadius: ms(24), marginBottom: -ms(20), paddingTop: ms(20), paddingBottom: ms(30), maxHeight: '80%', paddingHorizontal: ms(12) },
  infoModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: ms(20), paddingBottom: ms(16), borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  infoCloseButton: { width: ms(40), height: ms(40), borderRadius: ms(20), justifyContent: 'center', alignItems: 'center' },
  infoModalBody: { fontSize: scaleFontSize(15), lineHeight: scaleFontSize(23), textAlign: 'center', paddingHorizontal: ms(12) },
  tafseerButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: moderateScale(18), paddingVertical: moderateScale(5), paddingHorizontal: moderateScale(10), borderRadius: moderateScale(10), borderWidth: 1, gap: moderateScale(4) },
  tafseerButtonText: { fontSize: scaleFontSize(14), fontWeight: '600' },
});