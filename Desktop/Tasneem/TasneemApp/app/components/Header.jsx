// Header.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Alert,
  Keyboard,
  View,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  StatusBar,
  Image,
  Text,
  Modal,
  FlatList,
  ScrollView,
  Linking,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import Colors from '../constants/Colors';
import ThemedView from '../components/ThemedView';
import { useRouter } from 'expo-router';
import surahs from '../constants/surahs';
import { booksFrontEnd, BOOKS } from '../constants/sunnahBooks';
import { useNavigationContext } from './NavigationContext';
import AthkarModal from './AthkarModal';
import LanguageModal from './LanguageModal';
import AsmaUlHusnaModal from './AsmaAlHusnaModal';
import TasbeehModal from './TasbeehModal';
import MessageModal from './MessageModal';
import AboutModal from './AboutModal';
import CreditsModal from './CreditsModal';
import useAppTranslation from '../hooks/useAppTranslation';
import appTranslations from '../constants/appTranslations';
import { moderateScale, scaleFontSize } from '../utils/responsive';
import { getBookmarks, groupBookmarks, removeBookmark } from '../constants/bookmarks';
import GetStarted, { LegalModal } from './GetStarted';
import ShopifyModal from './ShopifyModal';
import PreferencesModal from './PreferencesModal';
import usePremium, { USE_MOCK_PREMIUM } from '../hooks/usePremium';
import SearchModal from './search/SearchModal';
import RemindersModal from './Remindersmodal';
import { getActiveReminderIds, getTodayKey, loadCompletedReminderIds } from '../utils/remindersUtils';
import useSunnahIndex from '../hooks/useSunnahIndex';
import { quranArabicMap } from '../constants/quranArabicMap';
import { useFonts } from 'expo-font';

const MODERATE_FACTOR = 0.35;
const ms = (size) => moderateScale(size, MODERATE_FACTOR);

const headerLogoDark = require('../../assets/images/headerLogo.png');
const headerLogoLight = require('../../assets/images/headerLogoLightMode.png');





// ─── FUZZY MATCHING ───────────────────────────────────────────────────────────
const levenshtein = (a, b) => {
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

const fuzzyScore = (query, target) => {
  const q = normalizeBookLookup(query);
  const t = normalizeBookLookup(target);
  if (!q || !t) return 999;
  if (t === q) return 0;
  if (t.includes(q)) return 0;
  if (t.startsWith(q.slice(0, Math.max(3, Math.floor(q.length * 0.5))))) return 1;
  return levenshtein(q, t);
};

// ─── PARSE VERSE REF ─────────────────────────────────────────────────────────
const parseVerseRef = (input) => {
  const match = input.trim().match(/^(\d{1,3})[:.\s\-](\d{1,3})$/);
  if (match) {
    return { surahId: parseInt(match[1]), ayahId: parseInt(match[2]) };
  }
  return null;
};

const normalizeBookLookup = (value) => {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

const parseSunnahRef = (input) => {
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

// ─── SURAH ALIASES ────────────────────────────────────────────────────────────
const SURAH_ALIASES = {
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

// ─── SUNNAH BOOK ALIASES ─────────────────────────────────────────────────────
const SUNNAH_BOOK_ALIASES = {
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

const findSunnahBook = (query) => {
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


const PRAYER_ICONS = {
  Fajr: 'cloudy-night',
  Sunrise: 'partly-sunny',
  Dhuhr: 'sunny',
  Asr: 'partly-sunny',
  Maghrib: 'cloudy-night',
  Isha: 'moon',
  Midnight: 'moon',
};

const BOOKMARK_TABS = {
  QURAN: 'quran',
  SUNNAH: 'sunnah',
};

const formatBookmarkDate = (isoDate) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
};

// ─── MAIN HEADER ─────────────────────────────────────────────────────────────
const Header = ({
  showHeaderIcon = false,
  showBookmarkIcon = false,
  isPrayerTime = false,
  showSearchIcon = false,
  showThemeToggle = false,
  showShopifyIcon = false,
  showNotificationIcon = false,
  nextPrayer = { name: '', time: '' },
  currentPrayer = { name: '', time: '' },
}) => {
  const { t } = useAppTranslation();
  const router = useRouter();
  const {
    stopAudio,
    stopAthanAudio,
    prayerAlertVisible,
    prayerAlertName,
    dismissPrayerAlert,
    toggleTheme,
    colorScheme,
    triggerBookmarkUpdate,
    language,
  } = useNavigationContext();
  const scheme = colorScheme;
  const isDarkMode = typeof scheme === 'string' && scheme.toLowerCase() === 'dark';
  const headerLogoSource = isDarkMode ? headerLogoDark : headerLogoLight;
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const { isPremium, requirePremium, paywallVisible, hidePaywall, toggleMockPremium } = usePremium();
  const [searchMenu, setSearchMenu] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchSource, setSearchSource] = useState('quran');
  const [quranSearched, setQuranSearched] = useState([]);
  const [sunnahSearched, setSunnahSearched] = useState([]);

  const [athkarModal, setAthkarModal] = useState(false);
  const [athkarType, setAthkarType] = useState('morning');
  const [languageModal, setLanguageModal] = useState(false);
  const [asmaUlHusnaModal, setAsmaUlHusnaModal] = useState(false);
  const [tasbeehModal, setTasbeehModal] = useState(false);
  const [messageModal, setMessageModal] = useState(false);
  const [aboutModal, setAboutModal] = useState(false);
  const [legalModal, setLegalModal] = useState(false);
  const [creditsModal, setCreditsModal] = useState(false);
  const [bookmarkModal, setBookmarkModal] = useState(false);
  const [bookmarkTab, setBookmarkTab] = useState(BOOKMARK_TABS.QURAN);
  const [bookmarkItems, setBookmarkItems] = useState([]);
  const [expandedBookmarks, setExpandedBookmarks] = useState(new Set());
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [weakSurahsModal, setWeakSurahsModal] = useState(false);
  const [weakSurahsList, setWeakSurahsList] = useState([]);
  // premiumPaywallVisible now managed by usePremium() hook
  const [shopifyModalVisible, setShopifyModalVisible] = useState(false);
  const [remindersModal, setRemindersModal] = useState(false);
  const [preferencesModalVisible, setPreferencesModalVisible] = useState(false);
  const [pendingRemindersCount, setPendingRemindersCount] = useState(0);
  const [tempAthanVisible, setTempAthanVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    UthmanicHafs: require('../../assets/fonts/uthmanic_hafs_v22.ttf'),
    KFGQPCUthmanTahaNaskh: require('../../assets/fonts/kfgqpc_uthman_taha_naskh.ttf'),
  });

  const getBookmarkArabicText = (item) => {
    if (item.source === BOOKMARK_TABS.SUNNAH) return item.sunnah?.arabicText || '';
    if (item.source === BOOKMARK_TABS.QURAN) {
      const surahData = quranArabicMap[item.quran?.surahId];
      if (!surahData?.verses) return '';
      const verse = surahData.verses.find(v => v.id == item.quran?.ayahId);
      return verse?.text || '';
    }
    return '';
  };

  // Lazy load Sunnah Index in the background
  const { loadIndex } = useSunnahIndex(language);
  useEffect(() => {
    loadIndex(language);
  }, [language, loadIndex]);

  const reloadPendingRemindersCount = useCallback(async () => {
    try {
      if (!showNotificationIcon) {
        setPendingRemindersCount(0);
        return;
      }
      const todayKey = getTodayKey();
      const activeIds = getActiveReminderIds(nextPrayer?.name || '');
      const completedIds = await loadCompletedReminderIds(todayKey);
      const pending = activeIds.filter((id) => !completedIds.has(id)).length;
      setPendingRemindersCount(pending);
    } catch (e) {
      setPendingRemindersCount(0);
    }
  }, [showNotificationIcon, nextPrayer?.name]);

  useEffect(() => {
    reloadPendingRemindersCount();
  }, [reloadPendingRemindersCount]);

  // ── Close RemindersModal when athan is triggered ─────────────────────────
  useEffect(() => {
    if (prayerAlertVisible) {
      setRemindersModal(false);
    }
  }, [prayerAlertVisible]);

  // ── Reminder action handlers ─────────────────────────────────────────────
  const handleOpenMorningAdhkarFromReminder = useCallback(() => {
    setAthkarType('morning');
    setAthkarModal(true);
  }, []);

  const handleOpenEveningAdhkarFromReminder = useCallback(() => {
    setAthkarType('evening');
    setAthkarModal(true);
  }, []);

  const handleOpenSleepingAdhkarFromReminder = useCallback(() => {
    setAthkarType('sleeping');
    setAthkarModal(true);
  }, []);

  const handleNavigateToKahf = useCallback(() => {
    router.push({
      pathname: '/main/Quran',
      params: { surahId: 18 },
    });
  }, [router]);

  const handleNavigateToMulk = useCallback(() => {
    router.push({
      pathname: '/main/Quran',
      params: { surahId: 67 },
    });
  }, [router]);

  const handleNavigateToBaqarah = useCallback(() => {
    router.push({
      pathname: '/main/Quran',
      params: { surahId: 2 },
    });
  }, [router]);

  const handleNavigateToBukhari = useCallback(() => {
    router.push({
      pathname: '/main/Sunnah',
      params: { book: 'bukhari' },
    });
  }, [router]);

  const handleNavigateToZumar = useCallback(() => {
    router.push({
      pathname: '/main/Quran',
      params: { surahId: 39 },
    });
  }, [router]);

  const handleNavigateToSajdah = useCallback(() => {
    router.push({
      pathname: '/main/Quran',
      params: { surahId: 32 },
    });
  }, [router]);

  const handleNavigateToIsra = useCallback(() => {
    router.push({
      pathname: '/main/Quran',
      params: { surahId: 17 },
    });
  }, [router]);

  const inputRef = useRef(null);
  const isAnyPrayerAlertActive = isPrayerTime || prayerAlertVisible;

  const settingsOptions = [
    { id: 'morning', title: t('settings.options.morning.title'), icon: 'partly-sunny', color: '#afe311', iconLibrary: Ionicons, isModal: true, athkarType: 'morning' },
    { id: 'evening', title: t('settings.options.evening.title'), icon: 'cloudy-night', color: '#6366f1', iconLibrary: Ionicons, isModal: true, athkarType: 'evening' },
    { id: 'sleeping', title: t('settings.options.sleeping.title'), icon: 'bed', color: '#3b82f6', iconLibrary: Ionicons, isModal: true, athkarType: 'sleeping' },
    { id: 'tasbeeh', title: t('settings.options.tasbeeh.title'), icon: 'arrow-redo', color: '#06d6a0', iconLibrary: Ionicons, isModal: true, modalType: 'tasbeeh' },
    { id: 'asmaUlHusna', title: 'أسماء الله الحسنى', icon: 'albums', color: '#38BDF8', iconLibrary: Ionicons, isModal: true, modalType: 'asmaUlHusna' },
    { id: 'themeToggle', title: isDarkMode ? (t('settings.options.lightMode.title') || 'Light Mode') : (t('settings.options.darkMode.title') || 'Dark Mode'), icon: isDarkMode ? 'sunny' : 'moon', color: isDarkMode ? '#f59e0b' : '#3b82f6', iconLibrary: Ionicons, isThemeToggle: true },
    { id: 'message', title: t('message.title'), icon: 'mail', color: '#6366f1', iconLibrary: Ionicons, isModal: true, modalType: 'message' },
    { id: 'appSettings', title: t('home.openSettings'), icon: 'settings-sharp', color: '#64748b', iconLibrary: Ionicons, isModal: true, modalType: 'appSettings' },
    { id: 'credits', title: t('settings.options.credits.title'), icon: 'people', color: '#f77f00', iconLibrary: Ionicons, isModal: true, modalType: 'credits' },
    {
      id: 'legal', title: t('settings.options.terms.title'), icon: 'shield-alt', color: '#118ab2', iconLibrary: FontAwesome5, isModal: true, modalType: 'legal'
    },
    { id: 'language', title: t('settings.options.language.title'), icon: 'earth', color: '#38BDF8', iconLibrary: Ionicons, isModal: true, modalType: 'language' },
    USE_MOCK_PREMIUM && { id: 'mockPremium', title: `Dev IAP: ${isPremium ? 'Premium' : 'Free'}`, icon: 'shield-half-sharp', color: isPremium ? '#22c55e' : '#ef4444', iconLibrary: Ionicons, isMockPremiumToggle: true },
    // { id: 'testAthan', title: 'TEST ATHAN MODAL', icon: 'alarm', color: '#ff0000', iconLibrary: Ionicons, isTestAthan: true },
  ].filter(Boolean);


  useEffect(() => {
    if (
      searchMenu || settingsModal || athkarModal || asmaUlHusnaModal ||
      tasbeehModal || legalModal || messageModal || aboutModal ||
      languageModal || creditsModal || bookmarkModal ||
      paywallVisible || preferencesModalVisible
    ) {
      stopAudio();
    }
  }, [
    searchMenu, settingsModal, athkarModal, asmaUlHusnaModal, tasbeehModal,
    legalModal, messageModal, aboutModal, languageModal, creditsModal,
    bookmarkModal, paywallVisible,
    stopAudio,
  ]);

  useEffect(() => {
    if (isAnyPrayerAlertActive) {
      setSettingsModal(false); setSearchMenu(false); hidePaywall();
      setAthkarModal(false); setAsmaUlHusnaModal(false); setTasbeehModal(false);
      setLegalModal(false); setMessageModal(false);
      setAboutModal(false);
      setLanguageModal(false); setCreditsModal(false); setBookmarkModal(false);
      setRemindersModal(false);
      setPreferencesModalVisible(false);
    }
  }, [isAnyPrayerAlertActive, hidePaywall]);

  // ── If user is not premium → show GetStarted; otherwise open search ──
  const handleSearchIconPress = useCallback(() => {
    setSearchMenu(true);
  }, []);

  const handleCloseBookmarkModal = useCallback(() => {
    Keyboard.dismiss();
    setBookmarkModal(false);
  }, []);

  const groupedBookmarks = useMemo(() => groupBookmarks(bookmarkItems), [bookmarkItems]);

  const activeBookmarks =
    bookmarkTab === BOOKMARK_TABS.QURAN
      ? groupedBookmarks.quran
      : groupedBookmarks.sunnah;

  const loadBookmarks = useCallback(async () => {
    setBookmarkLoading(true);
    try {
      const saved = await getBookmarks();
      setBookmarkItems(saved);
    } catch (error) {
      console.error('Failed to load bookmarks', error);
    } finally {
      setBookmarkLoading(false);
    }
  }, []);

  useEffect(() => {
    if (bookmarkModal) {
      loadBookmarks();
    }
  }, [bookmarkModal, loadBookmarks]);

  const handleDeleteBookmark = useCallback(
    async (bookmarkId) => {
      try {
        const nextItems = await removeBookmark(bookmarkId);
        setBookmarkItems(nextItems);
        triggerBookmarkUpdate();
      } catch (error) {
        console.error('Failed to delete bookmark', error);
      }
    },
    []
  );

  const handleRequestDeleteBookmark = useCallback(
    (bookmark) => {
      const bookmarkId = bookmark?.id;
      if (bookmarkId == null) return;
      Alert.alert(
        t('bookmarks.deleteTitle'),
        t('bookmarks.deleteMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('bookmarks.deleteConfirm'),
            style: 'destructive',
            onPress: () => handleDeleteBookmark(bookmarkId),
          },
        ],
        { cancelable: true }
      );
    },
    [handleDeleteBookmark]
  );

  const handleDismissAthanModal = async () => {
    await stopAthanAudio();
    dismissPrayerAlert();
  };

  // ─── SEARCH ────────────────────────────────────────────────────────────────

  const inputIsMatching = (value) => {
    const trimmed = value.trim();
    const normalizedValue = trimmed.toLowerCase();

    if (searchSource === 'quran') {
      const verseRef = parseVerseRef(trimmed);
      if (verseRef) {
        const surah = surahs.find((s) => s.id === verseRef.surahId);
        if (surah) {
          setQuranSearched([{ type: 'verse', surah, ayahId: verseRef.ayahId }]);
          return;
        }
      }

      const surahNumberInput = parseInt(normalizedValue, 10);
      if (
        !isNaN(surahNumberInput) &&
        surahNumberInput >= 1 &&
        surahNumberInput <= 114 &&
        String(surahNumberInput) === normalizedValue
      ) {
        const surahByNumber = surahs.find((s) => s.id === surahNumberInput);
        if (surahByNumber) {
          setQuranSearched([{ type: 'surah', surah: surahByNumber }]);
          return;
        }
      }

      const combinedMatch = trimmed.match(/^(.+?)\s+(\d{1,3})$/);
      if (combinedMatch) {
        const surahPart = combinedMatch[1].trim();
        const ayahCandidate = parseInt(combinedMatch[2], 10);
        let resolvedSurah = null;
        const surahPartKey = normalizeBookLookup(surahPart);
        if (SURAH_ALIASES[surahPartKey]) {
          resolvedSurah = surahs.find((s) => s.id === SURAH_ALIASES[surahPartKey]);
        }
        if (!resolvedSurah) {
          const surahPartNum = parseInt(surahPart, 10);
          if (!isNaN(surahPartNum) && surahPartNum >= 1 && surahPartNum <= 114) {
            resolvedSurah = surahs.find((s) => s.id === surahPartNum);
          }
        }
        if (!resolvedSurah) {
          const surahPartLower = surahPart.toLowerCase();
          resolvedSurah = surahs.find((s) => s.latin.toLowerCase() === surahPartLower);
        }
        if (!resolvedSurah) {
          const surahPartLower = surahPart.toLowerCase();
          resolvedSurah = surahs.find((s) => s.latin.toLowerCase().startsWith(surahPartLower));
        }
        if (resolvedSurah && !isNaN(ayahCandidate) && ayahCandidate >= 0) {
          setQuranSearched([{ type: 'verse', surah: resolvedSurah, ayahId: ayahCandidate }]);
          return;
        }
      }

      const aliasKey = normalizeBookLookup(normalizedValue);
      if (aliasKey && SURAH_ALIASES[aliasKey]) {
        const surahByAlias = surahs.find((s) => s.id === SURAH_ALIASES[aliasKey]);
        if (surahByAlias) {
          setQuranSearched([{ type: 'surah', surah: surahByAlias }]);
          return;
        }
      }

      const results = surahs
        .filter(
          (s) =>
            s.latin.toLowerCase().includes(normalizedValue) ||
            (s.arabic && s.arabic.includes(trimmed))
        )
        .map((s) => ({ type: 'surah', surah: s }));
      setQuranSearched(results);
    } else if (searchSource === 'sunnah') {
      const hadithRef = parseSunnahRef(trimmed);

      if (hadithRef) {
        const matchedBook = findSunnahBook(hadithRef.bookQuery);
        if (matchedBook) {
          setSunnahSearched([
            {
              type: 'hadith',
              book: matchedBook,
              collection: hadithRef.collection,
              hadithNumber: hadithRef.hadithNumber,
              hadithInCollection: hadithRef.hadithInCollection,
            },
          ]);
          return;
        }
      }

      const bookSearchValue = hadithRef ? hadithRef.bookQuery : normalizedValue;
      const normalizedBookSearch = String(bookSearchValue).toLowerCase().trim();
      const normalizedBookSearchKey = normalizeBookLookup(bookSearchValue);
      const aliasBookMatch = normalizedBookSearchKey
        ? SUNNAH_BOOK_ALIASES[normalizedBookSearchKey]
        : null;

      const results = BOOKS
        .map((book, index) => {
          const displayName = booksFrontEnd[index];
          const bookKey = normalizeBookLookup(book);
          const displayKey = normalizeBookLookup(displayName);
          const bookNameRaw = book.toLowerCase();
          const displayNameRaw = displayName.toLowerCase();

          const rawMatch =
            normalizedBookSearch.length > 0 &&
            (bookNameRaw.includes(normalizedBookSearch) ||
              displayNameRaw.includes(normalizedBookSearch));

          const normalizedMatch =
            normalizedBookSearchKey.length > 0 &&
            (bookKey.includes(normalizedBookSearchKey) ||
              displayKey.includes(normalizedBookSearchKey));

          const isAliasMatch = Boolean(aliasBookMatch && book === aliasBookMatch);

          let score = 999;
          if (isAliasMatch) score = 0;
          else if (bookKey === normalizedBookSearchKey) score = 0;
          else if (displayKey === normalizedBookSearchKey) score = 0;
          else if (bookKey.startsWith(normalizedBookSearchKey)) score = 1;
          else if (displayKey.startsWith(normalizedBookSearchKey)) score = 1;
          else if (rawMatch || normalizedMatch) score = 2;
          else {
            const fScore = Math.min(
              fuzzyScore(normalizedBookSearchKey, bookKey),
              fuzzyScore(normalizedBookSearchKey, displayKey)
            );
            score = fScore <= 3 ? fScore + 3 : 999;
          }

          return { book, score };
        })
        .filter(({ score }) => score < 999)
        .sort((a, b) => a.score - b.score)
        .map(({ book }) => ({ type: 'book', book }));

      setSunnahSearched(results);
    }
  };

  useEffect(() => {
    if (searchValue.trim().length > 0) {
      inputIsMatching(searchValue);
    } else {
      setQuranSearched([]);
      setSunnahSearched([]);
    }
  }, [searchValue, searchSource]);

  // ─── RESULT PRESS HANDLERS ────────────────────────────────────────────────

  const handleQuranResultPress = (result) => {
    saveRecentSearch(searchValue.trim(), 'quran');
    if (result.type === 'verse') {
      router.push({
        pathname: '/main/Quran',
        params: {
          surahId: result.surah.id,
          ayahId: result.ayahId,
          jumpAt: String(Date.now()),
        },
      });
    } else {
      router.push({
        pathname: '/main/Quran',
        params: { surahId: result.surah.id },
      });
    }
    setSearchMenu(false);
    setSearchValue('');
  };

  const handleSunnahResultPress = (result) => {
    saveRecentSearch(searchValue.trim(), 'sunnah');
    if (result.type === 'book') {
      router.push({ pathname: '/main/Sunnah', params: { book: result.book } });
    } else if (result.type === 'hadith') {
      const nextParams = {
        book: result.book,
        hadithNumber: result.hadithNumber,
        jumpAt: String(Date.now()),
      };
      if (result.collection) nextParams.collection = result.collection;
      if (result.hadithInCollection)
        nextParams.hadithInCollection = result.hadithInCollection;
      router.push({ pathname: '/main/Sunnah', params: nextParams });
    }
    setSearchMenu(false);
    setSearchValue('');
  };

  const renderQuranResult = ({ item }) => {
    if (item.type === 'verse') {
      return (
        <TouchableOpacity
          style={[
            styles.resultItem,
            { backgroundColor: theme.surface, borderBottomColor: theme.border },
          ]}
          onPress={() => handleQuranResultPress(item)}
        >
          <View style={styles.resultContent}>
            <View
              style={[
                styles.verseRefBadge,
                { backgroundColor: isDarkMode ? '#1e3a8a' : '#e3f2fd' },
              ]}
            >
              <Text
                style={[
                  styles.verseRefBadgeText,
                  { color: isDarkMode ? '#90caf9' : '#1976d2' },
                ]}
              >
                {item.surah.id}:{item.ayahId}
              </Text>
            </View>
            <View style={styles.resultText}>
              <Text style={[styles.resultTitle, { color: theme.text }]}>
                {item.surah.latin} — {t('search.ayahLabel')} {item.ayahId}
              </Text>
              <Text style={[styles.resultSubtitle, { color: theme.muted }]}>
                {t('search.jumpToVerse', {
                  surah: item.surah.id,
                  ayah: item.ayahId,
                })}
              </Text>
            </View>
          </View>
          <Ionicons
            name="return-down-forward-outline"
            size={ms(19)}
            color={theme.muted}
          />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.resultItem,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
        onPress={() => handleQuranResultPress(item)}
      >
        <View style={styles.resultContent}>
          <Ionicons name="book-outline" size={ms(19)} color={theme.primary} />
          <View style={styles.resultText}>
            <Text style={[styles.resultTitle, { color: theme.text }]}>
              {item.surah.id}. {item.surah.latin}
            </Text>
            <Text style={[styles.resultSubtitle, { color: theme.muted }]}>
              {item.surah.arabic}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={ms(19)} color={theme.muted} />
      </TouchableOpacity>
    );
  };

  const renderSunnahResult = ({ item }) => {
    if (item.type === 'hadith') {
      const bookIndex = BOOKS.indexOf(item.book);
      const bookDisplayName = booksFrontEnd[bookIndex] || item.book;
      return (
        <TouchableOpacity
          style={[
            styles.resultItem,
            { backgroundColor: theme.surface, borderBottomColor: theme.border },
          ]}
          onPress={() => handleSunnahResultPress(item)}
        >
          <View style={styles.resultContent}>
            <View
              style={[
                styles.verseRefBadge,
                { backgroundColor: isDarkMode ? '#1e3a8a' : '#e3f2fd' },
              ]}
            >
              <Text
                style={[
                  styles.verseRefBadgeText,
                  { color: isDarkMode ? '#90caf9' : '#1976d2' },
                ]}
              >
                {item.collection
                  ? `${item.collection}: ${item.hadithNumber}`
                  : `#${item.hadithNumber}`}
              </Text>
            </View>
            <View style={styles.resultText}>
              <Text style={[styles.resultTitle, { color: theme.text }]}>
                {bookDisplayName}
              </Text>
              <Text style={[styles.resultSubtitle, { color: theme.muted }]}>
                {item.collection
                  ? t('search.collectionHadithLabel', {
                    collection: item.collection,
                    hadith: item.hadithNumber,
                  })
                  : t('search.jumpToHadith', { hadith: item.hadithNumber })}
              </Text>
            </View>
          </View>
          <Ionicons
            name="return-down-forward-outline"
            size={ms(19)}
            color={theme.muted}
          />
        </TouchableOpacity>
      );
    }

    if (item.type === 'book') {
      const bookIndex = BOOKS.indexOf(item.book);
      const bookDisplayName = booksFrontEnd[bookIndex];
      return (
        <TouchableOpacity
          style={[
            styles.resultItem,
            { backgroundColor: theme.surface, borderBottomColor: theme.border },
          ]}
          onPress={() => handleSunnahResultPress(item)}
        >
          <View style={styles.resultContent}>
            <Ionicons name="library-outline" size={ms(19)} color={theme.primary} />
            <View style={styles.resultText}>
              <Text style={[styles.resultTitle, { color: theme.text }]}>
                {bookDisplayName}
              </Text>
              <Text style={[styles.resultSubtitle, { color: theme.muted }]}>
                {t('search.browseCollection', { book: bookDisplayName })}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={ms(19)} color={theme.muted} />
        </TouchableOpacity>
      );
    }
  };

  const handleBookmarkPress = (item) => {
    const isQuran = item.source === BOOKMARK_TABS.QURAN;

    if (isQuran) {
      // Navigate to Quran with surahId, ayahId, and jumpAt
      const params = {
        surahId: String(item.quran.surahId),
        ayahId: String(item.quran.ayahId),
        jumpAt: `bookmark_${Date.now()}`, // Unique jumpAt to trigger modal
      };
      router.push({ pathname: '/main/Quran', params });
    } else {
      // Navigate to Sunnah with book, hadithNumber, and jumpAt
      const params = {
        book: item.sunnah.book,
        hadithNumber: String(item.sunnah.hadithNumber),
        jumpAt: `bookmark_${Date.now()}`, // Unique jumpAt to trigger modal
      };
      if (item.sunnah.collection) {
        params.collection = String(item.sunnah.collection);
      }
      if (item.sunnah.hadithInCollection) {
        params.hadithInCollection = String(item.sunnah.hadithInCollection);
      }
      router.push({ pathname: '/main/Sunnah', params });
    }

    // Close bookmark modal
    setBookmarkModal(false);
  };

  const renderBookmarkItem = ({ item }) => {
    const isQuran = item.source === BOOKMARK_TABS.QURAN;
    const title = isQuran
      ? `${item.quran?.surahName || t('tabs.quran')} ${item.quran?.surahId}: ${item.quran?.ayahId}`
      : `${item.sunnah?.bookDisplayName || t('tabs.sunnah')} #${item.sunnah?.hadithNumber || ''}`;
    const subtitle = isQuran
      ? item.quran?.translation || ''
      : item.sunnah?.translation || '';

    const isExpanded = expandedBookmarks.has(item.id);
    const arabicText = isExpanded ? getBookmarkArabicText(item) : '';
    const arabicFontFamily = isQuran ? 'UthmanicHafs' : 'KFGQPCUthmanTahaNaskh';

    const renderRightActions = () => {
      return (
        <TouchableOpacity
          style={{
            backgroundColor: isDarkMode ? '#dc2626' : '#ef4444',
            justifyContent: 'center',
            alignItems: 'center',
            width: ms(80),
            borderBottomWidth: 1,
            borderBottomColor: theme.border + '40',
          }}
          onPress={(e) => {
            e.stopPropagation();
            handleRequestDeleteBookmark(item);
          }}
        >
          <Ionicons name="trash-outline" size={ms(24)} color="#fff" />
        </TouchableOpacity>
      );
    };

    return (
      <Swipeable renderRightActions={renderRightActions}>
        <View style={[styles.bookmarkItem, { borderBottomColor: theme.border + '40', backgroundColor: theme.surface, flexDirection: 'column', alignItems: 'stretch', paddingVertical: ms(12), paddingHorizontal: ms(14) }]}>
          <View style={{ width: '100%' }}>
            <View style={styles.bookmarkItemLeft}>
              <View
                style={[
                  styles.bookmarkBadge,
                  {
                    backgroundColor: isDarkMode
                      ? 'rgba(96,165,250,0.16)'
                      : 'rgba(25,118,210,0.1)',
                  },
                ]}
              >
                <Ionicons
                  name={isQuran ? 'book-outline' : 'library-outline'}
                  size={ms(14)}
                  color={isDarkMode ? '#60a5fa' : '#1976d2'}
                />
              </View>
              <View style={styles.bookmarkItemTextWrap}>
                <Text style={[styles.bookmarkTitle, { color: theme.text }]} numberOfLines={1}>
                  {title}
                </Text>
                <Text style={[styles.bookmarkDate, { color: theme.muted, paddingRight: ms(8) }]}>
                  {formatBookmarkDate(item.createdAt)}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: ms(8), paddingLeft: ms(40) }}>
              <TouchableOpacity
                onPress={() => handleBookmarkPress(item)}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: ms(10), paddingVertical: ms(6), backgroundColor: isDarkMode ? '#1e3a8a' : '#e3f2fd', borderRadius: ms(6), marginRight: ms(16) }}
              >
                <Text style={{ color: isDarkMode ? '#90caf9' : '#1976d2', fontSize: scaleFontSize(10), marginRight: ms(4), fontWeight: '600' }}>
                  {t('bookmarks.openReference') || 'Open'}
                </Text>
                <Ionicons name="arrow-forward" size={ms(12)} color={isDarkMode ? '#90caf9' : '#1976d2'} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setExpandedBookmarks(prev => {
                    const next = new Set(prev);
                    if (next.has(item.id)) next.delete(item.id);
                    else {
                      next.clear();
                      next.add(item.id);
                    }
                    return next;
                  });
                }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: ms(4) }}
              >
                <Text style={{ color: theme.dontKnow, fontSize: scaleFontSize(10), marginRight: ms(4) }}>
                  {isExpanded ? (t('bookmarks.hideArabic') || 'Hide') : (t('bookmarks.showArabic') || 'Show')}
                </Text>
                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={ms(14)} color={theme.dontKnow} />
              </TouchableOpacity>
            </View>
          </View>

          {isExpanded && !!arabicText && fontsLoaded && (
            <View style={{ marginTop: ms(12), paddingTop: ms(12), borderTopWidth: 1, borderTopColor: theme.border + '20' }}>
              <Text style={{ color: theme.text, fontSize: scaleFontSize(20), lineHeight: scaleFontSize(34), fontFamily: arabicFontFamily, writingDirection: 'rtl', textAlign: 'right' }}>
                {arabicText}
              </Text>
            </View>
          )}
        </View>
      </Swipeable>
    );
  };

  const handleRecentSearchPress = (recent) => {
    setSearchSource(recent.source);
    setSearchValue(recent.query);
  };

  const handleOptionPress = (option) => {
    if (option.isMockPremiumToggle) {
      toggleMockPremium();
      return;
    }
    if (option.isThemeToggle) {
      requirePremium(() => toggleTheme());
      return;
    }
    if (option.isTestAthan) {
      setSettingsModal(false);
      setTempAthanVisible(true);
      return;
    }
    setSettingsModal(false);
    if (option.isModal) {
      setTimeout(() => {
        if (option.athkarType) {
          setAthkarType(option.athkarType);
          setAthkarModal(true);
        } else if (option.modalType === 'asmaUlHusna') setAsmaUlHusnaModal(true);
        else if (option.modalType === 'tasbeeh') setTasbeehModal(true);
        else if (option.modalType === 'legal') setLegalModal(true);
        else if (option.modalType === 'message') setMessageModal(true);
        else if (option.modalType === 'about') setAboutModal(true);
        else if (option.modalType === 'language') setLanguageModal(true);
        else if (option.modalType === 'credits') setCreditsModal(true);
        else if (option.modalType === 'appSettings') setPreferencesModalVisible(true);
      }, 300);
    }
  };

  // ─── SEARCH HINT ─────────────────────────────────────────────────────────
  const showVerseHint =
    searchSource === 'quran' &&
    /^\d/.test(searchValue) &&
    quranSearched.length === 0;



  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <View style={{ backgroundColor: theme.background, paddingTop: insets.top }}>
        <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.left}>
            <Image
              source={headerLogoSource}
              style={{ width: ms(196), height: ms(52) }}
            />
          </View>
          <View style={styles.right}>
            {
              showShopifyIcon && (
                <TouchableOpacity
                  style={[styles.icon, styles.headerIcon]}
                  onPress={() => setShopifyModalVisible(true)}
                >
                  <Ionicons name="cart-outline" size={ms(26.5)} color={isDarkMode ? '#60a5fa' : theme.primary} />
                </TouchableOpacity>
              )
            }
            {/* {showHeaderIcon && (
              <TouchableOpacity
                style={[styles.icon, styles.headerIcon]}
                onPress={() => setLanguageModal(true)}
              >
                <Ionicons name="earth-outline" size={ms(22)} color={isDarkMode ? '#60a5fa' : theme.primary} />
              </TouchableOpacity>
            )} */}
            {showBookmarkIcon && (
              <TouchableOpacity
                onPress={() => setBookmarkModal(true)}
                style={styles.icon}
              >
                <Ionicons
                  name="bookmarks-outline"
                  size={ms(21.3)}
                  color={isDarkMode ? '#60a5fa' : theme.primary}
                />
              </TouchableOpacity>
            )}
            {showSearchIcon && (
              <TouchableOpacity
                onPress={() => setSearchMenu(true)}
                style={styles.icon}
              >
                <Ionicons name="search-outline" size={ms(23.6)} color={isDarkMode ? '#60a5fa' : theme.primary} />
              </TouchableOpacity>
            )}
            {showNotificationIcon && (
              <TouchableOpacity
                onPress={() => setRemindersModal(true)}
                style={styles.icon}
              >
                <View style={{ position: 'relative' }}>
                  <Ionicons
                    name={pendingRemindersCount > 0 ? 'alarm' : 'alarm-outline'}
                    size={ms(26.6)}
                    color={
                      pendingRemindersCount > 0
                        ? '#3b82f6'
                        : isDarkMode
                          ? '#60a5fa'
                          : theme.primary
                    }
                  />
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setSettingsModal(true)}
              style={[styles.icon, styles.headerIcon]}
            >
              <Ionicons name="grid-outline" size={ms(21.6)} color={isDarkMode ? '#60a5fa' : theme.primary} />
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>

      {/* ── MODALS ── */}
      {athkarModal && <AthkarModal
        visible={athkarModal}
        onClose={() => setAthkarModal(false)}
        type={athkarType}
      />}
      {asmaUlHusnaModal && <AsmaUlHusnaModal
        visible={asmaUlHusnaModal}
        onClose={() => setAsmaUlHusnaModal(false)}
      />}
      {tasbeehModal && <TasbeehModal visible={tasbeehModal} onClose={() => setTasbeehModal(false)} />}
      {legalModal && <LegalModal
        visible={legalModal}
        onClose={() => setLegalModal(false)}
      />}
      {creditsModal && <CreditsModal
        visible={creditsModal}
        onClose={() => setCreditsModal(false)}
        theme={theme}
      />}
      {messageModal && <MessageModal
        visible={messageModal}
        onClose={() => setMessageModal(false)}
        theme={theme}
      />}
      {aboutModal && <AboutModal
        visible={aboutModal}
        onClose={() => setAboutModal(false)}
      />}
      {languageModal && <LanguageModal
        visible={languageModal}
        onClose={() => setLanguageModal(false)}
      />}
      {preferencesModalVisible && <PreferencesModal
        visible={preferencesModalVisible}
        onClose={() => setPreferencesModalVisible(false)}
        theme={theme}
        isDarkMode={isDarkMode}
      />}

      {/* ── PRAYER ALERT ── */}
      {(prayerAlertVisible || tempAthanVisible) && (
        <Modal
          animationType="slide"
          transparent={true}
          presentationStyle="overFullScreen"
          onRequestClose={() => { handleDismissAthanModal(); setTempAthanVisible(false); }}
        >
          <ThemedView style={styles.modalOverlay}>
            <ThemedView
              style={[styles.athanSheet, { backgroundColor: theme.surface }]}
            >
              <View style={styles.athanIcon}>
                <Ionicons
                  name={PRAYER_ICONS[prayerAlertName] || 'alarm'}
                  size={ms(50)}
                  color={theme.dontKnow}
                />
              </View>
              <Text style={[styles.athanTitle, { color: theme.title }]}>
                {prayerAlertName || 'Maghrib'}
              </Text>
              <Pressable
                onPress={() => { handleDismissAthanModal(); setTempAthanVisible(false); }}
                style={[styles.stopButton, { backgroundColor: theme.dontKnow }]}
              >
                <Text style={styles.stopButtonText}>{t('home.stopAthan')}</Text>
              </Pressable>
            </ThemedView>
          </ThemedView>
        </Modal>
      )}

      {/* ── SETTINGS MODAL ── */}
      <Modal
        visible={settingsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setSettingsModal(false)}
      >
        <Pressable
          style={[
            styles.modalOverlay,
            {
              backgroundColor: isDarkMode
                ? 'rgba(0,0,0,0.8)'
                : 'rgba(0,0,0,0.5)',
            },
          ]}
          onPress={() => setSettingsModal(false)}
        >
          <Pressable
            style={[
              styles.modalContainer,
              {
                backgroundColor: theme.surface,
                shadowColor: isDarkMode ? '#000' : '#666',
                height: '85%',
                paddingBottom: Math.max(insets.bottom, 20)
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHeader, { borderBottomColor: theme.border + '40' }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {t('settings.title')}
              </Text>
              <TouchableOpacity
                onPress={() => setSettingsModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={ms(25)} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.optionsContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.optionsGrid}>
                {settingsOptions.map((option) => {
                  const IconComponent = option.iconLibrary;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: theme.card || theme.surface,
                          borderColor: theme.border + '40',
                          shadowColor: isDarkMode ? '#000' : '#999',
                        },
                      ]}
                      onPress={() => handleOptionPress(option)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.optionIconContainer,
                          { backgroundColor: option.color + '20' },
                        ]}
                      >
                        <IconComponent
                          name={option.icon}
                          size={ms(22)}
                          color={option.color}
                        />
                      </View>
                      <Text
                        style={[styles.optionTitle, { color: theme.text }]}
                        numberOfLines={2}
                      >
                        {option.title}
                      </Text>
                      <View style={styles.optionArrow}>
                        <Ionicons
                          name="chevron-forward"
                          size={ms(17)}
                          color={theme.muted}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={[styles.footer, { borderTopColor: theme.border + '40' }]}>
                <Image
                  source={headerLogoSource}
                  style={{ width: ms(170), height: ms(42), opacity: 0.8 }}
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── SHOPIFY MODAL ── */}
      <ShopifyModal
        visible={shopifyModalVisible}
        onClose={() => setShopifyModalVisible(false)}
      />

      {/* ── REMINDERS MODAL ── */}
      <RemindersModal
        visible={remindersModal}
        onClose={() => setRemindersModal(false)}
        nextPrayer={nextPrayer}
        currentPrayer={currentPrayer}
        onOpenMorningAdhkar={handleOpenMorningAdhkarFromReminder}
        onOpenEveningAdhkar={handleOpenEveningAdhkarFromReminder}
        onOpenSleepingAdhkar={handleOpenSleepingAdhkarFromReminder}
        onNavigateToKahf={handleNavigateToKahf}
        onNavigateToMulk={handleNavigateToMulk}
        onNavigateToBaqarah={handleNavigateToBaqarah}
        onNavigateToBukhari={handleNavigateToBukhari}
        onNavigateToZumar={handleNavigateToZumar}
        onNavigateToSajdah={handleNavigateToSajdah}
        onNavigateToIsra={handleNavigateToIsra}
        onOpenTasbeeh={() => setTasbeehModal(true)}
        onRemindersChanged={reloadPendingRemindersCount}
        isDarkMode={isDarkMode}
        theme={theme}
        t={t}
      />

      {/* ── SEARCH MODAL ── */}
      <SearchModal
        visible={searchMenu}
        onClose={() => setSearchMenu(false)}
      />

      {/* ── BOOKMARKS MODAL ── */}
      <Modal
        visible={bookmarkModal}
        animationType="slide"
        transparent
        onRequestClose={handleCloseBookmarkModal}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
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
            <View
              style={[styles.bookmarkSheet, { backgroundColor: theme.surface }]}
            >
              {/* HEADER SIMPLE */}
              <View
                style={[styles.searchHeader, { borderBottomColor: theme.border }]}
              >
                <View style={styles.bookmarkHeaderLeft}>
                  <Ionicons
                    name="bookmarks-outline"
                    size={ms(22)}
                    color={isDarkMode ? '#fffbfb' : '#645c5c'}
                  />
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: theme.text, fontSize: scaleFontSize(18) },
                    ]}
                  >
                    {t('bookmarks.title')}
                  </Text>
                </View>

                <TouchableOpacity onPress={handleCloseBookmarkModal}>
                  <Ionicons
                    name="close-outline"
                    size={ms(30)}
                    color={theme.icon}
                  />
                </TouchableOpacity>
              </View>

              {/* SELECTOR QURAN / SUNNAH */}
              <View style={styles.sourceSelector}>
                {[BOOKMARK_TABS.QURAN, BOOKMARK_TABS.SUNNAH].map((tab) => (
                  <Pressable
                    key={tab}
                    onPress={() => setBookmarkTab(tab)}
                    style={({ pressed }) => [
                      styles.sourceButton,
                      {
                        transform: [{ scale: pressed ? 0.97 : 1 }],
                        borderColor: isDarkMode ? '#4b5563' : '#ccc',
                        backgroundColor:
                          isDarkMode && bookmarkTab !== tab
                            ? '#1e293b'
                            : 'transparent',
                      },
                      bookmarkTab === tab && {
                        borderColor: '#1976d2',
                        backgroundColor: isDarkMode ? '#1e3a8a' : '#e3f2fd',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          bookmarkTab === tab
                            ? isDarkMode
                              ? '#fff'
                              : '#0f172a'
                            : theme.text,
                        fontWeight: '700',
                      }}
                    >
                      {tab === BOOKMARK_TABS.QURAN
                        ? t('bookmarks.quran')
                        : t('bookmarks.sunnah')}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* LISTA */}
              <View style={styles.bookmarkListWrap}>
                {bookmarkLoading ? (
                  <View style={styles.bookmarkEmptyWrap}>
                    <Ionicons
                      name="time-outline"
                      size={ms(24)}
                      color={isDarkMode ? '#60a5fa' : '#1976d2'}
                    />
                    <Text
                      style={[
                        styles.noResults,
                        {
                          color: theme.muted,
                          marginTop: ms(10),
                        },
                      ]}
                    >
                      {t('bookmarks.loading')}
                    </Text>
                  </View>
                ) : activeBookmarks.length === 0 ? (
                  <View style={styles.bookmarkEmptyWrap}>
                    <Ionicons
                      name="bookmark-outline"
                      size={ms(24)}
                      color={isDarkMode ? '#60a5fa' : '#1976d2'}
                    />
                    <Text
                      style={[
                        styles.noResults,
                        {
                          color: theme.muted,
                          marginTop: ms(10),
                        },
                      ]}
                    >
                      {t('bookmarks.empty')}
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={activeBookmarks}
                    keyExtractor={(item) => item.id}
                    renderItem={renderBookmarkItem}
                    showsVerticalScrollIndicator={false}
                  />
                )}
              </View>

            </View>
          </ThemedView>
        </GestureHandlerRootView>
      </Modal>

    </>
  );
};

const styles = StyleSheet.create({
  container: {
    height: ms(48),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: ms(9),
    paddingHorizontal: ms(6),
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  right: { flexDirection: 'row', paddingRight: ms(30) },
  icon: { justifyContent: 'center', alignItems: 'center', paddingRight: ms(10) },
  headerIcon: { marginLeft: ms(3) },

  // ── Search ──
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
  sourceSelector: { flexDirection: 'row', paddingHorizontal: ms(16), paddingTop: ms(12), gap: ms(10) },
  sourceButton: { flex: 1, paddingVertical: ms(10), borderRadius: ms(14), alignItems: 'center', borderWidth: 1 },
  examplesContainer: { paddingHorizontal: ms(18) },
  examplesHint: { fontSize: scaleFontSize(13), marginBottom: ms(12), fontStyle: 'italic' },
  searchExamples: { marginBottom: ms(8), fontSize: scaleFontSize(14) },
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

  // ── Athan / Prayer Alert ──
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 },
  athanSheet: { borderTopLeftRadius: ms(30), borderTopRightRadius: ms(30), padding: ms(24), paddingBottom: ms(40), alignItems: 'center' },
  athanIcon: { marginBottom: ms(20), marginTop: ms(10) },
  athanTitle: { fontSize: scaleFontSize(22), fontWeight: '700', textAlign: 'center', marginBottom: ms(8) },
  athanSubtitle: { fontSize: scaleFontSize(14), textAlign: 'center', marginBottom: ms(30) },
  stopButton: { paddingVertical: ms(14), paddingHorizontal: ms(40), borderRadius: ms(30), marginTop: ms(10) },
  stopButtonText: { color: '#fff', fontSize: scaleFontSize(16), fontWeight: '600' },

  // ── Settings Modal ──
  modalContainer: { borderTopLeftRadius: ms(30), borderTopRightRadius: ms(30), padding: ms(20), maxHeight: '80%', width: '100%' },
  termsModalContainer: { height: '25%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: ms(15), borderBottomWidth: 1, marginBottom: ms(15) },
  modalTitle: { fontSize: scaleFontSize(20), fontWeight: '700' },
  closeButton: { padding: ms(5) },
  modalContent: { flex: 1 },
  modalBody: { paddingBottom: ms(30) },
  modalHeading: { fontSize: scaleFontSize(18), fontWeight: '600', marginBottom: ms(12) },
  modalText: { fontSize: scaleFontSize(14), lineHeight: ms(22), marginBottom: ms(10) },
  optionsContainer: { flex: 1 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: ms(5) },
  optionCard: { width: '48%', borderRadius: ms(16), padding: ms(16), marginBottom: ms(12), borderWidth: 1, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  optionIconContainer: { width: ms(44), height: ms(44), borderRadius: ms(12), alignItems: 'center', justifyContent: 'center', marginBottom: ms(12) },
  optionTitle: { fontSize: scaleFontSize(13), fontWeight: '600', marginBottom: ms(4), height: ms(36) },
  optionArrow: { position: 'absolute', bottom: ms(12), right: ms(12) },
  footer: { alignItems: 'center', paddingTop: ms(20), marginTop: ms(10), borderTopWidth: 1 },

  // ── Bookmarks ──
  bookmarkSheet: { borderTopLeftRadius: ms(24), borderTopRightRadius: ms(24), height: '85%' },
  bookmarkHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: ms(10) },
  bookmarkBackButton: { padding: ms(4) },
  bookmarkListWrap: { flex: 1, paddingHorizontal: ms(16), paddingTop: ms(8) },
  bookmarkEmptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: ms(50) },
  bookmarkItem: { paddingVertical: ms(14), borderBottomWidth: 1 },
  bookmarkItemLeft: { flexDirection: 'row', gap: ms(12) },
  bookmarkBadge: { width: ms(28), height: ms(28), borderRadius: ms(8), alignItems: 'center', justifyContent: 'center' },
  bookmarkItemTextWrap: { flex: 1 },
  bookmarkTitle: { fontSize: scaleFontSize(14), fontWeight: '600', marginBottom: ms(2) },
  bookmarkNote: { fontSize: scaleFontSize(12), fontStyle: 'italic', marginBottom: ms(2) },
  bookmarkSubtitle: { fontSize: scaleFontSize(11), marginBottom: ms(4) },
  bookmarkDate: { fontSize: scaleFontSize(9), marginTop: ms(4), textAlign: 'right' },
  bookmarkInlineReadAction: { flexDirection: 'row', alignItems: 'center', gap: ms(4), marginTop: ms(6) },
  bookmarkInlineNoteAction: { flexDirection: 'row', alignItems: 'center', gap: ms(4), marginTop: ms(6) },
  bookmarkInlineDeleteAction: { flexDirection: 'row', alignItems: 'center', gap: ms(4), marginTop: ms(6) },
  bookmarkActionButtonText: { fontSize: scaleFontSize(11), fontWeight: '500', marginLeft: ms(2) },

  // ── Bookmark Note Editor ──
  bookmarkNoteEditorWrap: { flex: 1, padding: ms(20) },
  bookmarkNoteMeta: { fontSize: scaleFontSize(12), marginBottom: ms(16), textAlign: 'center' },
  bookmarkNoteInput: { flex: 1, borderWidth: 1, borderRadius: ms(16), padding: ms(16), fontSize: scaleFontSize(15), textAlignVertical: 'top', minHeight: ms(150) },
  bookmarkNoteActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: ms(20), gap: ms(12) },
  bookmarkNoteSecondaryButton: { flex: 1, paddingVertical: ms(14), borderRadius: ms(12), borderWidth: 1, alignItems: 'center' },
  bookmarkNoteSecondaryButtonText: { fontSize: scaleFontSize(14), fontWeight: '600' },
  bookmarkNoteSaveButton: { flex: 1, paddingVertical: ms(14), borderRadius: ms(12), alignItems: 'center' },
  bookmarkNoteSaveButtonText: { color: '#fff', fontSize: scaleFontSize(14), fontWeight: '700' },

  // ── Bookmark Read ──
  bookmarkReadWrap: { flex: 1, padding: ms(16) },
  bookmarkReadScrollContent: { paddingBottom: ms(20) },
  bookmarkReadCard: { borderWidth: 1, borderRadius: ms(16), padding: ms(16), marginBottom: ms(16) },
  bookmarkReadHeading: { fontSize: scaleFontSize(13), fontWeight: '700', marginBottom: ms(8), opacity: 0.8 },
  bookmarkReadBody: { fontSize: scaleFontSize(15), lineHeight: ms(24) },
  bookmarkReadActionsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: ms(12), marginTop: ms(8) },
  bookmarkReadPdfButton: { flex: 1, paddingVertical: ms(14), borderRadius: ms(12), alignItems: 'center' },
  bookmarkReadPdfButtonText: { color: '#fff', fontSize: scaleFontSize(13.5), fontWeight: '700' },
  bookmarkReadEmpty: { fontSize: scaleFontSize(13.5), textAlign: 'center', marginTop: ms(28) },
});

export default Header;
