import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Share,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import useAppTranslation from '../hooks/useAppTranslation';
import usePremium from '../hooks/usePremium';
import SearchModal from './search/SearchModal';
import { getTafseerText, getMultipleTafseerTexts } from '../utils/tafseerDb';
import {
  getAvailableTranslations,
  getAllTranslations,
  RTL_LANGS,
  BOOK_TRANSLATIONS,
} from '../constants/sunnahTranslations';
import { readOfflineSunnahEdition } from '../utils/offlineContent';
import { SUNNAH_EDITION_ASSET_MAP } from '../constants/sunnahEditionAssetMap';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ms = (size) => Math.round(size * 0.98);
const scaleFontSize = (size) => Math.round(size * 1.04);

const APP_LANG_TO_SUNNAH = {
  english: 'eng',
  french: 'fra',
  indonesian: 'ind',
  bengali: 'ben',
  turkish: 'tur',
  urdu: 'urd',
  russian: 'rus',
  tamil: 'tam',
};

// ─── Sunnah translation cache ─────────────────────────────────────────────────
const _translationCache = {};

async function fetchSunnahTranslation(langCode, bookKey) {
  const cacheKey = `${langCode}-${bookKey}`;
  if (_translationCache[cacheKey]) return _translationCache[cacheKey];
  // Try reading directly from the bundled asset map first (synchronous require)
  const bundledGetter = SUNNAH_EDITION_ASSET_MAP[cacheKey];
  if (bundledGetter) {
    const data = bundledGetter();
    if (data && typeof data === 'object') {
      _translationCache[cacheKey] = data;
      return data;
    }
  }
  // Fallback to the async chain (external/downloaded files)
  const data = await readOfflineSunnahEdition(cacheKey);
  if (!data) throw new Error(`Translation ${cacheKey} not found in bundled assets`);
  _translationCache[cacheKey] = data;
  return data;
}

function findTranslatedText(editionData, hadithNumber) {
  if (!editionData?.hadiths) return null;
  const target = parseFloat(hadithNumber);
  const found = editionData.hadiths.find((h) => parseFloat(h.hadithnumber) === target);
  if (!found?.text) return null;
  return found.text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/ـ/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>');
}

const TAFSEER_LIST = [
  { key: 'ar-tafsir-al-mukhtasar', name: 'Al-Mukhtasar', langNative: 'العربية', rank: 1 },
  { key: 'ar-tafsir-muyassar', name: 'Al-Muyassar', langNative: 'العربية', rank: 1 },
  { key: 'ar-tafseer-al-saddi', name: 'As-Sa\'di', langNative: 'العربية', rank: 1 },
  { key: 'tafsir-al-jalalayn', name: 'Al-Jalalayn', langNative: 'العربية', rank: 1 },
  { key: 'ar-tafseer-al-qurtubi', name: 'Al-Qurtubi', langNative: 'العربية', rank: 1 },
  { key: 'ar-tafsir-al-tabari', name: 'At-Tabari', langNative: 'العربية', rank: 1 },
  { key: 'ar-tafsir-ibn-kathir', name: 'Ibn Kathir', langNative: 'العربية', rank: 1 },
  { key: 'tafsir-ibn-al-qayyim', name: 'Ibn Al-Qayyim', langNative: 'العربية', rank: 1 },
  { key: 'tafsir-ibn-uthaymeen', name: 'Ibn Uthaymeen', langNative: 'العربية', rank: 1 },
  { key: 'en-tafsir-al-mukhtasar', name: 'Al-Mukhtasar', langNative: 'English', rank: 2 },
  { key: 'chinese-mokhtasar', name: 'Al-Mukhtasar', langNative: '中文', rank: 3 },
  { key: 'hindi-mokhtasar', name: 'Al-Mukhtasar', langNative: 'हिन्दी', rank: 4 },
  { key: 'spanish-mokhtasar', name: 'Al-Mukhtasar', langNative: 'Español', rank: 5 },
  { key: 'french-mokhtasar', name: 'Al-Mukhtasar', langNative: 'Français', rank: 6 },
  { key: 'bengali-mokhtasar', name: 'Al-Mukhtasar', langNative: 'বাংলা', rank: 7 },
  { key: 'russian-mokhtasar', name: 'Al-Mukhtasar', langNative: 'Русский', rank: 8 },
  { key: 'indonesian-mokhtasar', name: 'Al-Mukhtasar', langNative: 'Bahasa Indonesia', rank: 9 },
  { key: 'ur-tafseer-ibn-e-kaseer', name: 'Ibn-e-Kaseer', langNative: 'اردو', rank: 10 },
  { key: 'japanese-mokhtasar', name: 'Al-Mukhtasar', langNative: '日本語', rank: 11 },
  { key: 'turkish-mokhtasar', name: 'Al-Mukhtasar', langNative: 'Türkçe', rank: 12 },
  { key: 'tamil-mokhtasar', name: 'Al-Mukhtasar', langNative: 'தமிழ்', rank: 13 },
  { key: 'vietnamese-mokhtasar', name: 'Al-Mukhtasar', langNative: 'Tiếng Việt', rank: 14 },
  { key: 'italian-mokhtasar', name: 'Al-Mukhtasar', langNative: 'Italiano', rank: 15 },
  { key: 'thai-mokhtasar', name: 'Al-Mukhtasar', langNative: 'ไทย', rank: 16 },
  { key: 'persian-mokhtasar', name: 'Al-Mukhtasar', langNative: 'فارسی', rank: 17 },
  { key: 'malayalam-mokhtasar', name: 'Al-Mukhtasar', langNative: 'മലയാളം', rank: 18 },
  { key: 'uzbek-mokhtasar', name: 'Al-Mukhtasar', langNative: 'Oʻzbekcha', rank: 19 },
  { key: 'pashto-mokhtasar', name: 'Al-Mukhtasar', langNative: 'پښتو', rank: 20 },
  { key: 'kurdish-mokhtasar', name: 'Al-Mukhtasar', langNative: 'Kurdî', rank: 21 },
  { key: 'bosnian-mokhtasar', name: 'Al-Mukhtasar', langNative: 'Bosanski', rank: 22 },
];

const FREE_TAFSEERS_ORDER = [
  'ar-tafsir-ibn-kathir',
  'ar-tafseer-al-saddi',
  'tafsir-al-jalalayn',
  'ar-tafseer-al-qurtubi',
  'ar-tafsir-al-tabari',
  'ar-tafsir-muyassar',
];

const FREE_TAFSEER_KEYS = new Set(FREE_TAFSEERS_ORDER);

const TAFSEER_LANGUAGES = {
  'ar-tafsir-al-mukhtasar': 'arabic',
  'ar-tafsir-muyassar': 'arabic',
  'ar-tafseer-al-saddi': 'arabic',
  'tafsir-al-jalalayn': 'arabic',
  'ar-tafseer-al-qurtubi': 'arabic',
  'ar-tafsir-al-tabari': 'arabic',
  'ar-tafsir-ibn-kathir': 'arabic',
  'tafsir-ibn-al-qayyim': 'arabic',
  'tafsir-ibn-uthaymeen': 'arabic',
  'bengali-mokhtasar': 'bengali',
  'bosnian-mokhtasar': 'bosnian',
  'chinese-mokhtasar': 'chinese',
  'en-tafsir-al-mukhtasar': 'english',
  'french-mokhtasar': 'french',
  'hindi-mokhtasar': 'hindi',
  'indonesian-mokhtasar': 'indonesian',
  'italian-mokhtasar': 'italian',
  'japanese-mokhtasar': 'japanese',
  'kurdish-mokhtasar': 'kurdish',
  'malayalam-mokhtasar': 'malayalam',
  'pashto-mokhtasar': 'pashto',
  'persian-mokhtasar': 'persian',
  'russian-mokhtasar': 'russian',
  'spanish-mokhtasar': 'spanish',
  'tamil-mokhtasar': 'tamil',
  'thai-mokhtasar': 'thai',
  'turkish-mokhtasar': 'turkish',
  'ur-tafseer-ibn-e-kaseer': 'urdu',
  'uzbek-mokhtasar': 'uzbek',
  'vietnamese-mokhtasar': 'vietnamese',
};

const isMatchingLang = (tafseerKey, appLang) => {
  if (!appLang) return false;
  const tLang = TAFSEER_LANGUAGES[tafseerKey];
  if (!tLang) return false;
  
  const normAppLang = appLang.toLowerCase().trim();
  const normTLang = tLang.toLowerCase().trim();
  
  if (normAppLang === normTLang) return true;
  if (normTLang === 'pashto' && normAppLang === 'pushto') return true;
  if (normTLang === 'pushto' && normAppLang === 'pashto') return true;
  
  return false;
};

// ─── Sunnah language selector (View overlay, NOT a Modal — safe inside Modal) ──
function SunnahLanguageSheet({ visible, onClose, bookKey, selectedLang, onSelect, isDarkMode, accentColor, textColor, mutedColor, t }) {
  const translations = getAllTranslations(bookKey);
  const sheetBg = isDarkMode ? '#1e293b' : '#ffffff';
  const handleBg = isDarkMode ? '#475569' : '#cbd5e1';
  const itemActiveBg = isDarkMode ? 'rgba(96,165,250,0.15)' : 'rgba(25,118,210,0.09)';
  const itemBorder = isDarkMode ? 'rgba(96,165,250,0.22)' : 'rgba(25,118,210,0.18)';

  if (!visible) return null;

  return (
    <View style={sheetStyles.overlay} pointerEvents="box-none">
      <TouchableOpacity style={sheetStyles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[sheetStyles.sheet, { backgroundColor: sheetBg }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: ms(8) }}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-outline" size={ms(28)} color={textColor} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => { onSelect(null); onClose(); }}
          activeOpacity={0.75}
          style={[sheetStyles.item, { borderColor: !selectedLang ? itemBorder : 'transparent', borderWidth: 1 }, !selectedLang && { backgroundColor: itemActiveBg }]}
        >
          <View style={sheetStyles.itemInner}>
            <Text style={[sheetStyles.itemLabel, { color: textColor }]}>Arabic</Text>
          </View>
        </TouchableOpacity>
        <FlatList
          data={translations}
          keyExtractor={(i) => i.code}
          renderItem={({ item }) => {
            const active = item.code === selectedLang;
            const available = item.available;
            return (
              <TouchableOpacity
                onPress={() => { onSelect(item.code); onClose(); }}
                activeOpacity={available ? 0.75 : 1}
                style={[
                  sheetStyles.item,
                  { borderColor: active ? itemBorder : 'transparent', borderWidth: 1 },
                  active && { backgroundColor: itemActiveBg },
                  !available && { opacity: 0.45 }
                ]}
              >
                <View style={sheetStyles.itemInner}>
                  <Text style={[sheetStyles.itemLabel, { color: active ? accentColor : (available ? textColor : mutedColor) }]}>
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: ms(32) }}
        />
      </View>
    </View>
  );
}

const sheetStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 999 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: ms(24), borderTopRightRadius: ms(24),
    paddingTop: ms(12), paddingHorizontal: ms(16),
    maxHeight: SCREEN_HEIGHT * 0.85,
    elevation: 20, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: -4 },
  },
  sheetTitle: { fontSize: scaleFontSize(16), fontWeight: '700', textAlign: 'center', marginBottom: ms(14), letterSpacing: 0.3 },
  item: { borderRadius: ms(12), paddingVertical: ms(13), paddingHorizontal: ms(16), marginBottom: ms(8) },
  itemInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemLabel: { fontSize: scaleFontSize(15), fontWeight: '500' },
});

// ─── Quran language picker (View overlay — safe inside Modal) ─────────────────
export function QuranLanguageSheet({ visible, onClose, translationsKeys, languageCodeMap, selectedTranslation, onSelect, isDarkMode, accentColor, textColor, mutedColor, noTranslationKey, t, maxHeight }) {
  const sheetBg = isDarkMode ? '#1e293b' : '#ffffff';
  const handleBg = isDarkMode ? '#475569' : '#cbd5e1';
  const itemActiveBg = isDarkMode ? 'rgba(96,165,250,0.15)' : 'rgba(25,118,210,0.09)';
  const itemBorder = isDarkMode ? 'rgba(96,165,250,0.22)' : 'rgba(25,118,210,0.18)';

  if (!visible) return null;

  const allItems = [noTranslationKey, ...translationsKeys];

  return (
    <View style={sheetStyles.overlay} pointerEvents="box-none">
      <TouchableOpacity style={sheetStyles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[sheetStyles.sheet, { backgroundColor: sheetBg, maxHeight: maxHeight || SCREEN_HEIGHT * 0.7 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: ms(8) }}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-outline" size={ms(28)} color={textColor} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={allItems}
          keyExtractor={(item) => item}
          numColumns={2}
          persistentScrollbar={true}
          contentContainerStyle={{ paddingBottom: ms(32), paddingHorizontal: ms(4) }}
          renderItem={({ item }) => {
            const isNone = item === noTranslationKey;
            const label = isNone ? t('sunnahUI.noTranslation') : (languageCodeMap[item] || item);
            const active = item === selectedTranslation;
            return (
              <TouchableOpacity
                onPress={() => { onSelect(item); onClose(); }}
                activeOpacity={0.75}
                style={[
                  sheetStyles.item,
                  { flex: 1, margin: ms(4), alignItems: 'center', backgroundColor: isDarkMode ? '#374151' : '#f3f4f6' },
                  active && { backgroundColor: itemActiveBg, borderColor: itemBorder, borderWidth: 1 },
                ]}
              >
                <Text style={[sheetStyles.itemLabel, { color: active ? accentColor : textColor, textAlign: 'center', textTransform: 'capitalize' }]} numberOfLines={2}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );
}

// ─── Tafseer picker (View overlay — safe inside Modal) ────────────────────────
// Single-select: user picks a tafseer to add to their active list.
function TafseerPickerSheet({ visible, onClose, onOpenSearch, onSelect, isDarkMode, accentColor, textColor, mutedColor, isPremium, requirePremium, t, language }) {
  const sheetBg = isDarkMode ? '#1e293b' : '#ffffff';
  const itemActiveBg = isDarkMode ? 'rgba(96,165,250,0.15)' : 'rgba(25,118,210,0.09)';

  const sortedTafseerList = React.useMemo(() => {
    if (!language) return TAFSEER_LIST;
    return [...TAFSEER_LIST].sort((a, b) => {
      const aFree = FREE_TAFSEER_KEYS.has(a.key);
      const bFree = FREE_TAFSEER_KEYS.has(b.key);
      if (aFree && !bFree) return -1;
      if (!aFree && bFree) return 1;
      if (aFree && bFree) return FREE_TAFSEERS_ORDER.indexOf(a.key) - FREE_TAFSEERS_ORDER.indexOf(b.key);
      
      const aMatch = isMatchingLang(a.key, language);
      const bMatch = isMatchingLang(b.key, language);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      
      if (a.rank !== b.rank) return a.rank - b.rank;
      return 0;
    });
  }, [language]);

  if (!visible) return null;

  return (
    <View style={sheetStyles.overlay} pointerEvents="box-none">
      <TouchableOpacity style={sheetStyles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[sheetStyles.sheet, { backgroundColor: sheetBg }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ms(12), paddingHorizontal: ms(4) }}>
          <Text style={{ fontSize: scaleFontSize(18), fontWeight: '700', color: textColor }}>
            Tafaseer Collection
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-outline" size={ms(28)} color={textColor} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={sortedTafseerList}
          keyExtractor={(tf) => tf.key}
          numColumns={2}
          persistentScrollbar={true}
          contentContainerStyle={{ paddingBottom: ms(32), paddingHorizontal: ms(4) }}
          renderItem={({ item: tf }) => {
            const isFree = FREE_TAFSEER_KEYS.has(tf.key);
            const isDisabled = !isFree && !isPremium;
            const matchesAppLang = isMatchingLang(tf.key, language);
            return (
              <TouchableOpacity
                style={[
                  sheetStyles.item,
                  {
                    flex: 1, margin: ms(4), alignItems: 'center', justifyContent: 'center',
                    height: ms(60), paddingVertical: 0,
                    backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                  },
                  matchesAppLang && { borderWidth: 1.5, borderColor: '#3b82f6' },
                  isDisabled && { opacity: 0.45 },
                ]}
                onPress={() => {
                  const proceed = () => onSelect(tf.key);
                  if (!isFree && !isPremium) requirePremium(proceed);
                  else proceed();
                }}
              >
                <View style={{ alignItems: 'center', width: '100%', paddingHorizontal: ms(6) }}>
                  <Text style={[sheetStyles.itemLabel, { color: textColor, textAlign: 'center', marginBottom: ms(2) }]} numberOfLines={1}>
                    {tf.name}
                  </Text>
                  <Text style={{ color: isDarkMode ? '#9ca3af' : '#64748b', fontSize: scaleFontSize(11.5), textAlign: 'center', fontWeight: '600' }} numberOfLines={1}>
                    {tf.langNative}
                  </Text>
                  {isDisabled && (
                    <Ionicons name="lock-closed" size={ms(12)} color={isDarkMode ? '#94a3b8' : '#9ca3af'} style={{ position: 'absolute', top: 0, right: 0 }} />
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );
}

// ─── Tafseer content sheet (View overlay — safe inside Modal) ─────────────────
// Comparative reader: stacked cards, one per selected tafseer edition.
function TafseerContentSheet({
  visible, onClose, onAddTafseer, onRemoveTafseer,
  tafseerContents, tafseerLoading,
  surahName, ayahId,
  onPrev, onNext, hasPrev, hasNext,
  isDarkMode, accentColor, textColor, mutedColor,
  isPremium, requirePremium, language, t,
}) {
  const sheetBg = isDarkMode ? '#1e293b' : '#ffffff';
  const cardBg = isDarkMode ? 'rgba(15,23,42,0.7)' : 'rgba(248,250,255,0.95)';
  const cardBorder = isDarkMode ? 'rgba(96,165,250,0.14)' : 'rgba(25,118,210,0.1)';
  const labelColor = isDarkMode ? '#60a5fa' : '#1976d2';

  const [isAdding, setIsAdding] = React.useState(false);

  // Reset adding state if sheet closes or tafseer loads
  React.useEffect(() => {
    if (!visible) setIsAdding(false);
  }, [visible]);

  const availableTafseers = React.useMemo(() => {
    const currentKeys = new Set(tafseerContents.map(tc => tc.key));
    const available = TAFSEER_LIST.filter(tf => !currentKeys.has(tf.key));
    return available.sort((a, b) => {
      const aFree = FREE_TAFSEER_KEYS.has(a.key);
      const bFree = FREE_TAFSEER_KEYS.has(b.key);
      if (aFree && !bFree) return -1;
      if (!aFree && bFree) return 1;
      if (aFree && bFree) return FREE_TAFSEERS_ORDER.indexOf(a.key) - FREE_TAFSEERS_ORDER.indexOf(b.key);
      
      const aMatch = isMatchingLang(a.key, language);
      const bMatch = isMatchingLang(b.key, language);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      
      if (a.rank !== b.rank) return a.rank - b.rank;
      return 0;
    });
  }, [tafseerContents, language]);

  if (!visible) return null;

  const title = tafseerContents.length > 1
    ? `${tafseerContents.length} Tafseers`
    : (tafseerContents[0]?.label || 'Tafseer');

  return (
    <View style={sheetStyles.overlay} pointerEvents="box-none">
      <TouchableOpacity style={sheetStyles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[tafseerSheetStyles.sheet, { backgroundColor: sheetBg }]}>
        {/* Header */}
        <View style={[tafseerSheetStyles.header, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}>
          <View style={{ flex: 1, marginRight: ms(8) }}>
            <Text style={[tafseerSheetStyles.title, { color: textColor }]} numberOfLines={1}>{title}</Text>
            {ayahId != null && (
              <Text style={{ color: mutedColor, fontSize: scaleFontSize(13), marginTop: 2 }}>
                {surahName} — Ayah {ayahId}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: ms(8) }}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-outline" size={ms(30)} color={textColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stacked tafseer cards using FlatList for performance */}
        {tafseerLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={accentColor} />
          </View>
        ) : tafseerContents.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: mutedColor, fontSize: scaleFontSize(14) }}>No tafseer selected.</Text>
          </View>
        ) : (
          <FlatList
            data={(() => {
              const items = [];
              tafseerContents.forEach((tf) => {
                items.push({ type: 'header', key: `header-${tf.key}`, tfKey: tf.key, label: tf.label });
                const paragraphs = tf.text.split(/\n+/).filter(p => p.trim());
                paragraphs.forEach((p, idx) => {
                  items.push({ type: 'paragraph', key: `para-${tf.key}-${idx}`, text: p });
                });
                items.push({ type: 'footer', key: `footer-${tf.key}` }); // For padding/border bottom
              });
              
              if (!isAdding && availableTafseers.length > 0) {
                items.push({ type: 'add_button', key: 'add_button' });
              }
              if (isAdding) {
                items.push({ type: 'add_menu', key: 'add_menu' });
              }
              return items;
            })()}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{ padding: ms(14), paddingBottom: ms(24) }}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            renderItem={({ item }) => {
              if (item.type === 'header') {
                return (
                  <View style={{
                    backgroundColor: cardBg, borderColor: cardBorder, borderWidth: 1, borderBottomWidth: 0,
                    borderTopLeftRadius: ms(14), borderTopRightRadius: ms(14), padding: ms(14), paddingBottom: ms(4)
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={{ color: labelColor, fontWeight: '700', fontSize: scaleFontSize(12.5), letterSpacing: 0.3, flex: 1, paddingRight: ms(8) }}>
                        {item.label}
                      </Text>
                      <TouchableOpacity onPress={() => onRemoveTafseer(item.tfKey)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close-circle-outline" size={ms(20)} color={mutedColor} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }
              if (item.type === 'paragraph') {
                const isArabic = /[\u0600-\u06FF]/.test(item.text);
                return (
                  <View style={{
                    backgroundColor: cardBg, borderColor: cardBorder, borderLeftWidth: 1, borderRightWidth: 1,
                    paddingHorizontal: ms(14)
                  }}>
                    <Text style={{ 
                      fontSize: isArabic ? scaleFontSize(20) : scaleFontSize(15.5), 
                      lineHeight: isArabic ? scaleFontSize(34) : scaleFontSize(26), 
                      color: textColor, 
                      marginBottom: ms(10), 
                      textAlign: isArabic ? 'right' : 'left',
                      fontFamily: isArabic ? 'UthmanicHafs' : undefined,
                      writingDirection: isArabic ? 'rtl' : 'ltr'
                    }}>
                      {item.text}
                    </Text>
                  </View>
                );
              }
              if (item.type === 'footer') {
                return (
                  <View style={{
                    backgroundColor: cardBg, borderColor: cardBorder, borderWidth: 1, borderTopWidth: 0,
                    borderBottomLeftRadius: ms(14), borderBottomRightRadius: ms(14), height: ms(10), marginBottom: ms(12)
                  }} />
                );
              }
              if (item.type === 'add_button') {
                return (
                  <TouchableOpacity
                    onPress={() => setIsAdding(true)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ms(6),
                      marginTop: ms(8), paddingVertical: ms(12),
                      backgroundColor: isDarkMode ? 'rgba(96,165,250,0.1)' : 'rgba(25,118,210,0.06)',
                      borderRadius: ms(12), borderWidth: 1, borderColor: isDarkMode ? 'rgba(96,165,250,0.2)' : 'rgba(25,118,210,0.15)',
                      borderStyle: 'dashed'
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={ms(20)} color={accentColor} />
                    <Text style={{ color: accentColor, fontWeight: '600', fontSize: scaleFontSize(14) }}>Add Comparative Tafseer</Text>
                  </TouchableOpacity>
                );
              }
              if (item.type === 'add_menu') {
                return (
                  <View style={{ marginTop: ms(8), backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderRadius: ms(14), padding: ms(12), borderWidth: 1, borderColor: cardBorder }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ms(12) }}>
                      <Text style={{ color: textColor, fontWeight: '700', fontSize: scaleFontSize(14) }}>Select to Add</Text>
                      <TouchableOpacity onPress={() => setIsAdding(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close-outline" size={ms(20)} color={mutedColor} />
                      </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -ms(4) }}>
                      {availableTafseers.map((tf) => {
                        const isFree = FREE_TAFSEER_KEYS.has(tf.key);
                        const isDisabled = !isFree && !isPremium;
                        const matchesAppLang = isMatchingLang(tf.key, language);
                        return (
                          <TouchableOpacity
                            key={tf.key}
                            style={[
                              sheetStyles.item,
                              {
                                width: '46%', margin: '2%', alignItems: 'center', justifyContent: 'center',
                                height: ms(50), paddingVertical: 0,
                                backgroundColor: isDarkMode ? '#374151' : '#f1f5f9',
                              },
                              matchesAppLang && { borderWidth: 1.5, borderColor: '#3b82f6' },
                              isDisabled && { opacity: 0.45 },
                            ]}
                            onPress={() => {
                              const proceed = () => {
                                onAddTafseer(tf.key);
                                setIsAdding(false);
                              };
                              if (!isFree && !isPremium) requirePremium(proceed);
                              else proceed();
                            }}
                          >
                            <View style={{ alignItems: 'center', width: '100%', paddingHorizontal: ms(4) }}>
                              <Text style={[sheetStyles.itemLabel, { color: textColor, textAlign: 'center', fontSize: scaleFontSize(12), marginBottom: ms(2) }]} numberOfLines={1}>
                                {tf.name}
                              </Text>
                              <Text style={{ color: isDarkMode ? '#9ca3af' : '#64748b', fontSize: scaleFontSize(10.5), textAlign: 'center', fontWeight: '600' }} numberOfLines={1}>
                                {tf.langNative}
                              </Text>
                              {isDisabled && (
                                <Ionicons name="lock-closed" size={ms(10)} color={isDarkMode ? '#94a3b8' : '#9ca3af'} style={{ position: 'absolute', top: 0, right: 0 }} />
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              }
              return null;
            }}
          />
        )}


        {/* Navigation row */}
        <View style={[tafseerSheetStyles.navRow, { borderTopColor: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}>
          <TouchableOpacity onPress={onPrev} disabled={!hasPrev} style={[tafseerSheetStyles.navBtn, !hasPrev && { opacity: 0.35 }]}>
            <Ionicons name="chevron-back" size={ms(22)} color={!hasPrev ? mutedColor : accentColor} />
          </TouchableOpacity>
          <Text style={{ color: mutedColor, fontSize: scaleFontSize(13), fontWeight: '500' }}>{ayahId ?? ''}</Text>
          <TouchableOpacity onPress={onNext} disabled={!hasNext} style={[tafseerSheetStyles.navBtn, !hasNext && { opacity: 0.35 }]}>
            <Ionicons name="chevron-forward" size={ms(22)} color={!hasNext ? mutedColor : accentColor} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const tafseerSheetStyles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: ms(24), borderTopRightRadius: ms(24),
    paddingTop: ms(20), maxHeight: SCREEN_HEIGHT * 0.75,
    elevation: 20, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: -4 },
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: ms(20), paddingBottom: ms(14), borderBottomWidth: 0.5 },
  title: { fontSize: scaleFontSize(17), fontWeight: '700' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: ms(16), paddingVertical: ms(12), borderTopWidth: 0.5 },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: ms(4), paddingVertical: ms(6), paddingHorizontal: ms(10) },
  navText: { fontSize: scaleFontSize(14), fontWeight: '600' },
});

// ─── Main ReferenceModal ───────────────────────────────────────────────────────
const ReferenceModal = ({
  visible,
  onClose,
  arabicText,
  translation,
  isBookmarked,
  onBookmark,
  onShare,
  theme,
  isDarkMode,
  hadithNumber,
  hadithBook,
  hadithBookKey,
  grades,
  ayahRef,
  onNext,
  onPrevious,
  onListenAyah,
  isPlaying,
  isBuffering,
  hasAudio,
  prevArabicText,
  prevTranslation,
  nextArabicText,
  nextTranslation,
  // Quran-mode props for language picker & tafseer
  quranTranslationsKeys,      // string[] — list of translation keys
  quranLanguageCodeMap,       // { [code]: nativeName }
  quranSelectedTranslation,   // currently selected translation key or 'none'
  quranNoTranslationKey,      // the sentinel value ('none')
  onQuranTranslationChange,   // (key: string) => void
  quranSurahName,             // e.g. 'Al-Baqarah'
  quranSurahId,               // number
  quranAyah,                  // the full ayah object for tafseer { id, isBasmala }
  quranAyahsList,             // full ayahs array for prev/next tafseer navigation
}) => {
  const { t, language } = useAppTranslation();
  const { requirePremium, isPremium } = usePremium();
  const [fontsLoaded] = useFonts({
    KFGQPCUthmanTahaNaskh: require('../../assets/fonts/kfgqpc_uthman_taha_naskh.ttf'),
  });

  const pagerRef = useRef(null);
  const scrollViewRef = useRef(null);

  const [notes, setNotes] = useState([]);
  const [editingNoteIndex, setEditingNoteIndex] = useState(-1);
  const [noteInputValue, setNoteInputValue] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // ── Sunnah translation state ────────────────────────────────────────────────
  const [sunnahLangSheetVisible, setSunnahLangSheetVisible] = useState(false);
  const [selectedSunnahLang, setSelectedSunnahLang] = useState(null);
  const [sunnahTransEdition, setSunnahTransEdition] = useState(null);
  const [sunnahTransLoading, setSunnahTransLoading] = useState(false);
  const [sunnahTransError, setSunnahTransError] = useState(null);

  // ── Quran language picker state ─────────────────────────────────────────────
  const [quranLangSheetVisible, setQuranLangSheetVisible] = useState(false);

  // Search Modal state
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  // ── Tafseer state ───────────────────────────────────────────────────────────
  const [tafseerPickerVisible, setTafseerPickerVisible] = useState(false);
  const [tafseerContentVisible, setTafseerContentVisible] = useState(false);
  const [selectedTafseerKeys, setSelectedTafseerKeys] = useState([]);
  const [activeTafseerAyah, setActiveTafseerAyah] = useState(null);
  const [tafseerContents, setTafseerContents] = useState([]);
  const [tafseerLoading, setTafseerLoading] = useState(false);

  // ── Persisted state loading ────────────────────────────────────────────────
  useEffect(() => {
    const mapped = APP_LANG_TO_SUNNAH[language?.toLowerCase()];
    if (mapped && BOOK_TRANSLATIONS[hadithBookKey]?.includes(mapped)) {
      setSelectedSunnahLang(mapped);
    } else {
      setSelectedSunnahLang(null);
    }
  }, [language, hadithBookKey]);

  useEffect(() => {
    AsyncStorage.getItem('@reference_tafseer_keys').then(val => {
      if (val) {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) setSelectedTafseerKeys(parsed);
        } catch (e) {}
      }
    }).catch(() => {});
  }, []);

  const isSunnahMode = Boolean(hadithBookKey) && !ayahRef;
  const isQuranMode = Boolean(ayahRef);

  const sunnahTranslatedText = isSunnahMode && selectedSunnahLang && sunnahTransEdition
    ? findTranslatedText(sunnahTransEdition, hadithNumber)
    : (translation ?? null);

  const translatedText = isSunnahMode ? sunnahTranslatedText : (translation ?? null);

  // ── Fetch sunnah translation ────────────────────────────────────────────────
  useEffect(() => {
    if (!isSunnahMode || !selectedSunnahLang || !hadithBookKey) return;

    // Check if the selected translation is supported/available for this book
    const availableCodes = BOOK_TRANSLATIONS[hadithBookKey] ?? [];
    if (!availableCodes.includes(selectedSunnahLang)) {
      setSunnahTransEdition(null);
      setSunnahTransLoading(false);
      setSunnahTransError(null);
      return;
    }

    let cancelled = false;
    setSunnahTransLoading(true);
    setSunnahTransError(null);
    fetchSunnahTranslation(selectedSunnahLang, hadithBookKey)
      .then((data) => { if (!cancelled) { setSunnahTransEdition(data); setSunnahTransLoading(false); } })
      .catch(() => { if (!cancelled) { setSunnahTransError(t('sunnahUI.connectionError')); setSunnahTransLoading(false); } });
    return () => { cancelled = true; };
  }, [selectedSunnahLang, hadithBookKey, isSunnahMode]);

  useEffect(() => { setSunnahTransEdition(null); setSunnahTransError(null); }, [hadithBookKey]);

  // ── Tafseer helpers ─────────────────────────────────────────────────────────
  const loadTafseers = useCallback(async (keys, surahId, ayahId) => {
    if (!keys || keys.length === 0) {
      setTafseerContents([]);
      return;
    }
    setTafseerLoading(true);
    setTafseerContents([]);
    try {
      const results = await getMultipleTafseerTexts(keys, surahId, ayahId);
      // Map results back with their display labels from TAFSEER_LIST
      const mappedContents = results.map(res => {
        const tfDef = TAFSEER_LIST.find(t => t.key === res.key);
        return {
          key: res.key,
          label: tfDef ? tfDef.name : res.key,
          text: (res.text || '').replace(/[\n\r]+/g, '\n\n').trim(),
        };
      });
      setTafseerContents(mappedContents);
    } catch {
      setTafseerContents([]);
    } finally {
      setTafseerLoading(false);
    }
  }, []);

  const handleOpenTafseer = useCallback((ayah) => {
    setActiveTafseerAyah(ayah);
    if (selectedTafseerKeys.length > 0) {
      loadTafseers(selectedTafseerKeys, quranSurahId, ayah.id);
      setTafseerContentVisible(true);
    } else {
      setTafseerPickerVisible(true);
    }
  }, [selectedTafseerKeys, quranSurahId, loadTafseers]);

  const getAyahList = useCallback(() =>
    (quranAyahsList || []).filter((a) => !a.isBasmala),
    [quranAyahsList]);

  const hasTafseerPrev = activeTafseerAyah
    ? getAyahList().findIndex((a) => a.id === activeTafseerAyah.id) > 0
    : false;

  const hasTafseerNext = activeTafseerAyah
    ? (() => { const list = getAyahList(); const idx = list.findIndex((a) => a.id === activeTafseerAyah.id); return idx !== -1 && idx < list.length - 1; })()
    : false;

  const handleTafseerPrev = useCallback(() => {
    if (!activeTafseerAyah || selectedTafseerKeys.length === 0) return;
    const list = getAyahList();
    const idx = list.findIndex((a) => a.id === activeTafseerAyah.id);
    if (idx <= 0) return;
    if (onPrevious) onPrevious();
  }, [activeTafseerAyah, selectedTafseerKeys, getAyahList, onPrevious]);

  const handleTafseerNext = useCallback(() => {
    if (!activeTafseerAyah || selectedTafseerKeys.length === 0) return;
    const list = getAyahList();
    const idx = list.findIndex((a) => a.id === activeTafseerAyah.id);
    if (idx === -1 || idx >= list.length - 1) return;
    if (onNext) onNext();
  }, [activeTafseerAyah, selectedTafseerKeys, getAyahList, onNext]);

  const tafseerStateRef = useRef({ visible: false, keys: [] });
  useEffect(() => {
    tafseerStateRef.current = { visible: tafseerContentVisible, keys: selectedTafseerKeys };
  }, [tafseerContentVisible, selectedTafseerKeys]);

  // Keep activeTafseerAyah in sync when the parent ayah changes (e.g. pager swipe)
  useEffect(() => {
    if (quranAyah) {
      setActiveTafseerAyah(quranAyah);
      const state = tafseerStateRef.current;
      if (state.visible && state.keys.length > 0) {
        loadTafseers(state.keys, quranSurahId, quranAyah.id);
      }
    }
  }, [quranAyah?.id, quranSurahId, loadTafseers]);

  // ── Ids / labels ───────────────────────────────────────────────────────────
  const referenceId = ayahRef
    ? ayahRef
    : hadithBook && hadithNumber ? `${hadithBook}_${hadithNumber}` : hadithNumber;

  const arabicFontFamily = isQuranMode ? 'UthmanicHafs' : 'KFGQPCUthmanTahaNaskh';

  const notesKey = referenceId
    ? `@ref_notes_${String(referenceId).replace(/\s+/g, '_')}`
    : null;

  let referenceText = '';
  let iconName = 'library-outline';
  if (ayahRef) { referenceText = ayahRef; iconName = 'book-outline'; }
  else if (hadithBook && hadithNumber) { referenceText = `${hadithBook} #${hadithNumber}`; }
  else if (hadithNumber) { referenceText = t('referenceUI.hadithNumber', { number: hadithNumber }); }

  // ── Colours ────────────────────────────────────────────────────────────────
  const accentColor = isDarkMode ? '#60A5FA' : '#1976d2';
  const bgColor = isDarkMode ? '#0f172a' : '#f8faff';
  const headerBg = isDarkMode ? '#1e293b' : '#ffffff';
  const cardBg = isDarkMode ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.95)';
  const cardBorder = isDarkMode ? 'rgba(96,165,250,0.18)' : 'rgba(25,118,210,0.12)';
  const mutedColor = isDarkMode ? '#94a3b8' : '#64748b';
  const textColor = isDarkMode ? '#f1f5f9' : '#0f172a';
  const actionBarBg = isDarkMode ? '#1e293b' : '#ffffff';
  const actionBarBorder = isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const transBannerBg = isDarkMode ? 'rgba(96,165,250,0.08)' : 'rgba(25,118,210,0.05)';
  const tafseerBtnBorder = isDarkMode ? '#374151' : '#e5e7eb';

  // ── Notes ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!notesKey) return;
    AsyncStorage.getItem(notesKey).then((v) => setNotes(v ? JSON.parse(v) : [])).catch(() => setNotes([]));
    setEditingNoteIndex(-1);
    setNoteInputValue('');
  }, [notesKey, visible]);

  useEffect(() => {
    if (editingNoteIndex >= -2 && editingNoteIndex !== -1 && scrollViewRef.current) {
      const timer = setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300);
      return () => clearTimeout(timer);
    }
  }, [editingNoteIndex]);

  const saveNotes = async (updated) => {
    setNotes(updated);
    if (notesKey) {
      try { await AsyncStorage.setItem(notesKey, JSON.stringify(updated)); }
      catch (err) { Alert.alert(t('common.error') || 'Error', t('bookmarks.failedToSaveNote') || 'Failed to save note.'); }
    }
  };

  const handleAddNote = () => {
    if (notes.length >= 3) { Alert.alert(t('bookmarks.limitReachedTitle') || 'Limit Reached', t('bookmarks.limitReachedMsg') || 'You can only add up to 3 notes per reference.'); return; }
    setEditingNoteIndex(-2); setNoteInputValue('');
  };

  const saveEditedNote = () => {
    if (!noteInputValue.trim()) { setEditingNoteIndex(-1); return; }
    const updated = [...notes];
    if (editingNoteIndex === -2) updated.push(noteInputValue.trim());
    else updated[editingNoteIndex] = noteInputValue.trim();
    saveNotes(updated); setEditingNoteIndex(-1); setNoteInputValue('');
  };

  const deleteNote = (index) => {
    Alert.alert(t('bookmarks.deleteNoteTitle') || 'Delete Note', t('bookmarks.deleteNoteMsg') || 'Are you sure?', [
      { text: t('common.cancel') || 'Cancel', style: 'cancel' },
      { text: t('bookmarks.delete') || 'Delete', style: 'destructive', onPress: () => { const u = [...notes]; u.splice(index, 1); saveNotes(u); } },
    ]);
  };

  // ── PDF ────────────────────────────────────────────────────────────────────
  const hasTranslationForPdf = isQuranMode
    ? Boolean(translatedText)
    : Boolean(isSunnahMode && selectedSunnahLang && translatedText);
  const pdfEnabled = notes.length > 0 && hasTranslationForPdf;

  const handleGeneratePdf = async () => {
    if (isGeneratingPdf) return;
    if (!pdfEnabled) {
      if (notes.length === 0) Alert.alert(t('bookmarks.notesRequiredTitle') || 'Notes Required', t('bookmarks.notesRequiredMsg') || 'Please add at least one note before generating a PDF.');
      else Alert.alert(t('bookmarks.translationRequiredTitle') || 'Translation Required', t('bookmarks.translationRequiredMsg') || 'Please select a translation before generating a PDF.');
      return;
    }
    setIsGeneratingPdf(true);
    try {
      const notesHtml = notes.length > 0
        ? `<div style="margin-top:28px"><h3 style="color:#1e40af;font-size:18px;margin-bottom:10px">Notes</h3>${notes.map((n, i) => `<p style="font-size:14px;color:#1f2937;margin-bottom:8px;line-height:1.6">${i + 1}. ${escHtml(n)}</p>`).join('')}</div>`
        : '';
      const transHtml = translatedText
        ? `<p style="font-size:16px;color:#1f2937;margin-top:14px;line-height:1.7">${escHtml(translatedText)}</p>`
        : '';
      const gradesHtml = (isSunnahMode && grades && grades.length > 0)
        ? `<div style="margin-top:14px">${grades.map(g => `<p style="font-size:13px;color:#374151;margin-bottom:3px">&#8226; ${escHtml(g.name)}: <span style="color:#6b7280">${escHtml(g.grade)}</span></p>`).join('')}</div>`
        : '';
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>@page{size:595pt auto;margin:36pt 40pt;}*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;background:#fff;color:#111;padding:30px;}</style></head><body>${referenceText ? `<h1>${escHtml(referenceText)}</h1>` : ''}${transHtml}${gradesHtml}${notesHtml}</body></html>`;
      const result = await Print.printToFileAsync({ html, width: 595 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle: t('bookmarks.generatePdf') || 'Share PDF', UTI: 'com.adobe.pdf' });
      } else {
        Alert.alert(t('bookmarks.pdfGenerated') || 'PDF Generated', `${t('bookmarks.pdfSavedTo') || 'Saved to'}: ${result.uri}`);
      }
    } catch (err) {
      Alert.alert(t('bookmarks.pdfFailed') || 'PDF Failed', t('bookmarks.pdfFailedMsg') || 'Could not generate PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // ── Share ──────────────────────────────────────────────────────────────────
  const performShare = async (includeNotes) => {
    let text = `${referenceText}\n\n`;
    if (arabicText) text += `${arabicText}\n\n`;
    if (translatedText) text += `${translatedText}\n\n`;
    if (includeNotes && notes.length > 0) { text += 'Notes:\n'; notes.forEach((n, i) => { text += `${i + 1}. ${n}\n`; }); }
    try { await Share.share({ message: text }); } catch (e) { console.error(e); }
  };

  const handleSharePress = () => {
    if (onShare) { onShare(); return; }
    if (notes.length > 0) {
      Alert.alert(t('share.title') || 'Share Options', t('share.message') || 'What would you like to share?', [
        { text: t('share.ayahAndTranslation') || 'Text & Translation', onPress: () => performShare(false) },
        { text: t('share.includeNotes') || 'Include Notes', onPress: () => performShare(true) },
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
      ]);
    } else { performShare(false); }
  };

  // ── PagerView sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (pagerRef.current && (onPrevious || onNext))
      pagerRef.current.setPageWithoutAnimation(1);
  }, [arabicText, translation]);

  const onPageSelected = (e) => {
    const pos = e.nativeEvent.position;
    if (pos === 0 && onPrevious) onPrevious();
    if (pos === 2 && onNext) onNext();
  };

  // ── Translation section ────────────────────────────────────────────────────
  const renderTranslationSection = () => {
    if (isQuranMode && translation) {
      return (
        <View style={[styles.translationCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[styles.translationText, { color: isDarkMode ? '#e2e8f0' : '#1e293b' }]}>{translation}</Text>
        </View>
      );
    }
    if (!isSunnahMode || !selectedSunnahLang) return null;
    if (sunnahTransLoading) {
      return (
        <View style={[styles.translationCard, { backgroundColor: transBannerBg, borderColor: cardBorder, alignItems: 'center', paddingVertical: ms(20) }]}>
          <ActivityIndicator size="small" color={accentColor} />
          <Text style={{ color: mutedColor, marginTop: ms(8), fontSize: scaleFontSize(13) }}>{t('sunnahUI.loadingTranslation')}</Text>
        </View>
      );
    }
    if (sunnahTransError) {
      return (
        <View style={[styles.translationCard, { backgroundColor: transBannerBg, borderColor: cardBorder }]}>
          <Text style={{ color: '#ef4444', fontSize: scaleFontSize(13), textAlign: 'center' }}>{sunnahTransError}</Text>
        </View>
      );
    }
    if (sunnahTranslatedText) {
      const isRtl = RTL_LANGS.has(selectedSunnahLang);
      return (
        <View style={[styles.translationCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[styles.langBadge, { backgroundColor: isDarkMode ? 'rgba(96,165,250,0.15)' : 'rgba(25,118,210,0.08)' }]}>
            <Ionicons name="language-outline" size={ms(13)} color={accentColor} style={{ marginRight: ms(4) }} />
            <Text style={[styles.langBadgeText, { color: accentColor }]}>{selectedSunnahLang.toUpperCase()}</Text>
          </View>
          <Text style={[styles.translationText, { color: isDarkMode ? '#e2e8f0' : '#1e293b', textAlign: isRtl ? 'right' : 'left', writingDirection: isRtl ? 'rtl' : 'ltr' }]}>
            {sunnahTranslatedText}
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.translationCard, { backgroundColor: transBannerBg, borderColor: cardBorder }]}>
        <Text style={{ color: mutedColor, fontSize: scaleFontSize(13), textAlign: 'center' }}>Translation not available for this specific hadith.</Text>
      </View>
    );
  };

  // ── Page content ───────────────────────────────────────────────────────────
  const renderContent = (currentArabic, _ignored, isPreview) => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView
        ref={isPreview ? null : scrollViewRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        directionalLockEnabled
        keyboardShouldPersistTaps="handled"
      >
        {!!currentArabic && (
          <View style={{ backgroundColor: cardBg, borderColor: cardBorder, borderWidth: 1, padding: ms(16), paddingLeft: ms(18), borderRadius: ms(12), marginBottom: ms(14), elevation: 2, shadowColor: '#000', shadowOpacity: isDarkMode ? 0.3 : 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }}>
            <Text style={[styles.arabicText, { color: isDarkMode ? '#ffffff' : '#0f172a', fontSize: scaleFontSize(26) * 1.3, lineHeight: scaleFontSize(45) * 1.3, fontFamily: arabicFontFamily }]}>
              {currentArabic}
            </Text>
          </View>
        )}

        {!isPreview && renderTranslationSection()}

        {!isPreview && isSunnahMode && grades && grades.length > 0 && (
          <View style={{ marginTop: ms(4), marginBottom: ms(14), paddingHorizontal: ms(4) }}>
            {grades.map((g, i) => (
              <Text key={i} style={{ fontSize: scaleFontSize(12), color: mutedColor, marginBottom: ms(2) }}>
                {g.name}: {g.grade}
              </Text>
            ))}
          </View>
        )}

        {/* Tafseer button — Quran mode only, not basmalah */}
        {!isPreview && isQuranMode && quranAyah && !quranAyah.isBasmala && (
          <TouchableOpacity
            style={[styles.tafseerBtn, { borderColor: tafseerBtnBorder }]}
            onPress={() => handleOpenTafseer(quranAyah)}
            activeOpacity={0.75}
          >
            <Ionicons name="book-outline" size={ms(17)} color={accentColor} />
            <Text style={[styles.tafseerBtnText, { color: accentColor }]}>{t('quranUI.showTafsir')}</Text>
            <Ionicons name="chevron-forward-outline" size={ms(16)} color={accentColor} />
          </TouchableOpacity>
        )}

        {!isPreview && (
          <View style={styles.notesSection}>
            <View style={styles.notesHeader}>
              <Text style={[styles.notesTitle, { color: textColor }]}>{t('bookmarks.noteTitle')} ({notes.length}/3)</Text>
              {notes.length < 3 && editingNoteIndex !== -2 && (
                <TouchableOpacity onPress={handleAddNote} style={styles.addNoteBtn}>
                  <Ionicons name="add-circle-outline" size={ms(22)} color={accentColor} />
                </TouchableOpacity>
              )}
            </View>

            {notes.map((note, idx) => (
              <View key={idx} style={[styles.noteCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {editingNoteIndex === idx ? (
                  <>
                    <TextInput value={noteInputValue} onChangeText={setNoteInputValue} multiline autoFocus style={[styles.noteInput, { color: textColor, borderColor: accentColor, backgroundColor: isDarkMode ? '#0f172a' : '#f8faff' }]} />
                    <View style={styles.noteActionRow}>
                      <TouchableOpacity onPress={() => setEditingNoteIndex(-1)} style={styles.noteActionBtn}><Ionicons name="close-circle-outline" size={ms(22)} color={mutedColor} /></TouchableOpacity>
                      <TouchableOpacity onPress={saveEditedNote} style={styles.noteActionBtn}><Ionicons name="checkmark-circle-outline" size={ms(22)} color={accentColor} /></TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Text style={[styles.noteText, { color: textColor, flex: 1 }]}>{note}</Text>
                    <TouchableOpacity onPress={() => { setEditingNoteIndex(idx); setNoteInputValue(note); }} style={{ marginLeft: ms(8) }}>
                      <Ionicons name="pencil-outline" size={ms(18)} color={accentColor} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteNote(idx)} style={{ marginLeft: ms(8) }}>
                      <Ionicons name="trash-outline" size={ms(18)} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}

            {editingNoteIndex === -2 && (
              <View style={[styles.noteCard, { backgroundColor: cardBg, borderColor: accentColor }]}>
                <TextInput value={noteInputValue} onChangeText={setNoteInputValue} multiline autoFocus placeholder={t('bookmarks.notePlaceholder')} placeholderTextColor={mutedColor} style={[styles.noteInput, { color: textColor, borderColor: accentColor, backgroundColor: isDarkMode ? '#0f172a' : '#f8faff' }]} />
                <View style={styles.noteActionRow}>
                  <TouchableOpacity onPress={() => setEditingNoteIndex(-1)} style={styles.noteActionBtn}><Ionicons name="close-circle-outline" size={ms(22)} color={mutedColor} /></TouchableOpacity>
                  <TouchableOpacity onPress={saveEditedNote} style={styles.noteActionBtn}><Ionicons name="checkmark-circle-outline" size={ms(22)} color={accentColor} /></TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={handleGeneratePdf}
              disabled={isGeneratingPdf}
              style={[styles.pdfButton, { backgroundColor: pdfEnabled ? (isDarkMode ? 'rgba(96,165,250,0.15)' : 'rgba(25,118,210,0.1)') : (isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'), opacity: isGeneratingPdf ? 0.6 : 1 }]}
            >
              {isGeneratingPdf ? (
                <><ActivityIndicator size="small" color={accentColor} style={{ marginRight: ms(8) }} /><Text style={{ color: accentColor, fontWeight: 'bold' }}>{t('bookmarks.generatingPdf') || 'Generating PDF…'}</Text></>
              ) : (
                <><Ionicons name="document-text" size={ms(20)} color={pdfEnabled ? accentColor : mutedColor} style={{ marginRight: ms(8) }} /><Text style={{ color: pdfEnabled ? accentColor : mutedColor, fontWeight: 'bold' }}>{t('bookmarks.generatePdf') || 'Generate PDF'}</Text></>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: ms(130) }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} transparent={false} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={headerBg} />

      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: actionBarBorder }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-down" size={ms(26)} color={accentColor} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Ionicons name={iconName} size={ms(15)} color={accentColor} style={{ marginRight: ms(6) }} />
            <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>{referenceText}</Text>
          </View>
          <TouchableOpacity onPress={onBookmark} style={styles.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={ms(23)} color={accentColor} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {(onPrevious || onNext) ? (
          <PagerView ref={pagerRef} style={{ flex: 1 }} initialPage={1} onPageSelected={onPageSelected}>
            <View key="0" style={{ flex: 1 }}>{renderContent(prevArabicText, prevTranslation, true)}</View>
            <View key="1" style={{ flex: 1 }}>{renderContent(arabicText, translation, false)}</View>
            <View key="2" style={{ flex: 1 }}>{renderContent(nextArabicText, nextTranslation, true)}</View>
          </PagerView>
        ) : (
          renderContent(arabicText, translation, false)
        )}

        {/* Action bar */}
        <View style={[styles.actionBar, { backgroundColor: actionBarBg, borderTopColor: actionBarBorder }]}>
          <TouchableOpacity onPress={onPrevious} disabled={!onPrevious} style={[styles.actionBtn, !onPrevious && styles.actionBtnDisabled]} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name="chevron-back" size={ms(28)} color={!onPrevious ? mutedColor : accentColor} />
          </TouchableOpacity>

          {/* Sunnah: language button */}
          {isSunnahMode && (
            <TouchableOpacity
              onPress={() => setSunnahLangSheetVisible(true)}
              style={[styles.actionBtn, selectedSunnahLang && { backgroundColor: isDarkMode ? 'rgba(96,165,250,0.15)' : 'rgba(25,118,210,0.1)' }]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="language-outline" size={ms(26)} color={accentColor} />
              {selectedSunnahLang && <View style={[styles.langDot, { backgroundColor: accentColor }]} />}
            </TouchableOpacity>
          )}

          {/* Sunnah: share button */}
          {isSunnahMode && (
            <TouchableOpacity
              onPress={handleSharePress}
              style={styles.actionBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="share-social-outline" size={ms(26)} color={accentColor} />
            </TouchableOpacity>
          )}

          {/* Quran: language button — opens sheet inside this modal */}
          {isQuranMode && quranTranslationsKeys && (
            <TouchableOpacity
              onPress={() => setQuranLangSheetVisible(true)}
              style={styles.actionBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="language-outline" size={ms(26)} color={accentColor} />
            </TouchableOpacity>
          )}

          {/* Search Button in lower bar */}
          <TouchableOpacity
            onPress={() => setSearchModalVisible(true)}
            style={styles.actionBtn}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="search-outline" size={ms(26)} color={accentColor} />
          </TouchableOpacity>

          <TouchableOpacity onPress={onNext} disabled={!onNext} style={[styles.actionBtn, !onNext && styles.actionBtnDisabled]} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name="chevron-forward" size={ms(28)} color={!onNext ? mutedColor : accentColor} />
          </TouchableOpacity>
        </View>

        {/* ── View-overlay sheets (NOT nested Modals — no freeze risk) ── */}

        {/* Sunnah language sheet */}
        {isSunnahMode && (
          <SunnahLanguageSheet
            visible={sunnahLangSheetVisible}
            onClose={() => setSunnahLangSheetVisible(false)}
            bookKey={hadithBookKey}
            selectedLang={selectedSunnahLang}
            onSelect={(val) => {
              setSelectedSunnahLang(val);
              AsyncStorage.setItem('@reference_sunnah_lang', val).catch(()=>{});
            }}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
            textColor={textColor}
            mutedColor={mutedColor}
            t={t}
          />
        )}

        {/* Quran language sheet */}
        {isQuranMode && quranTranslationsKeys && (
          <QuranLanguageSheet
            visible={quranLangSheetVisible}
            onClose={() => setQuranLangSheetVisible(false)}
            translationsKeys={quranTranslationsKeys}
            languageCodeMap={quranLanguageCodeMap || {}}
            selectedTranslation={quranSelectedTranslation}
            noTranslationKey={quranNoTranslationKey || 'none'}
            onSelect={(key) => {
              if (onQuranTranslationChange) onQuranTranslationChange(key);
            }}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
            textColor={textColor}
            mutedColor={mutedColor}
            t={t}
          />
        )}

        {/* Tafseer picker sheet */}
        {isQuranMode && (
          <TafseerPickerSheet
            visible={tafseerPickerVisible}
            onClose={() => setTafseerPickerVisible(false)}
            onSelect={(newKey) => {
              setTafseerPickerVisible(false);
              if (!selectedTafseerKeys.includes(newKey)) {
                const newKeys = [...selectedTafseerKeys, newKey];
                setSelectedTafseerKeys(newKeys);
                AsyncStorage.setItem('@reference_tafseer_keys', JSON.stringify(newKeys)).catch(()=>{});
                if (activeTafseerAyah) {
                  loadTafseers(newKeys, quranSurahId, activeTafseerAyah.id);
                  setTafseerContentVisible(true);
                }
              } else {
                // If it's already selected, just show the content
                setTafseerContentVisible(true);
              }
            }}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
            textColor={textColor}
            mutedColor={mutedColor}
            isPremium={isPremium}
            requirePremium={requirePremium}
            t={t}
            language={language}
          />
        )}

        {/* Tafseer content sheet */}
        {isQuranMode && (
          <TafseerContentSheet
            visible={tafseerContentVisible}
            onClose={() => setTafseerContentVisible(false)}
            onAddTafseer={(newKey) => {
              if (!selectedTafseerKeys.includes(newKey)) {
                const newKeys = [...selectedTafseerKeys, newKey];
                setSelectedTafseerKeys(newKeys);
                AsyncStorage.setItem('@reference_tafseer_keys', JSON.stringify(newKeys)).catch(()=>{});
                if (activeTafseerAyah) {
                  loadTafseers(newKeys, quranSurahId, activeTafseerAyah.id);
                }
              }
            }}
            onRemoveTafseer={(keyToRemove) => {
              const newKeys = selectedTafseerKeys.filter(k => k !== keyToRemove);
              setSelectedTafseerKeys(newKeys);
              AsyncStorage.setItem('@reference_tafseer_keys', JSON.stringify(newKeys)).catch(()=>{});
              if (newKeys.length === 0) {
                setTafseerContentVisible(false);
                setTafseerPickerVisible(true); // fall back to picker
              } else if (activeTafseerAyah) {
                loadTafseers(newKeys, quranSurahId, activeTafseerAyah.id);
              }
            }}
            tafseerContents={tafseerContents}
            tafseerLoading={tafseerLoading}
            surahName={quranSurahName}
            ayahId={activeTafseerAyah?.id}
            onPrev={handleTafseerPrev}
            onNext={handleTafseerNext}
            hasPrev={hasTafseerPrev}
            hasNext={hasTafseerNext}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
            textColor={textColor}
            mutedColor={mutedColor}
            isPremium={isPremium}
            requirePremium={requirePremium}
            language={language}
            t={t}
          />
        )}

        {/* Search modal nested inside ReferenceModal so it displays on top */}
        <SearchModal 
          visible={searchModalVisible} 
          onClose={() => setSearchModalVisible(false)} 
          isNested={true}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: ms(48), paddingBottom: ms(14), paddingHorizontal: ms(16), borderBottomWidth: 0.5, elevation: 2, shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  headerBtn: { width: ms(40), height: ms(40), alignItems: 'center', justifyContent: 'center', borderRadius: ms(20) },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: ms(8) },
  headerTitle: { fontSize: scaleFontSize(15), fontWeight: '700', flexShrink: 1, letterSpacing: 0.2 },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: ms(16), paddingTop: ms(20) },
  arabicText: { textAlign: 'right', writingDirection: 'rtl' },
  translationCard: { borderRadius: ms(16), borderWidth: 1, padding: ms(16), marginBottom: ms(14), elevation: 1, shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  translationText: { fontSize: scaleFontSize(15), lineHeight: scaleFontSize(24), textAlign: 'left' },
  langBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: ms(8), paddingVertical: ms(3), borderRadius: ms(6), marginBottom: ms(10) },
  langBadgeText: { fontSize: scaleFontSize(11), fontWeight: '700', letterSpacing: 0.8 },
  tafseerBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: ms(6), marginBottom: ms(14), paddingVertical: ms(8), paddingHorizontal: ms(14), borderRadius: ms(12), borderWidth: 1 },
  tafseerBtnText: { fontSize: scaleFontSize(14), fontWeight: '600' },
  actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: ms(12), paddingBottom: ms(28), borderTopWidth: 0.5, elevation: 8, shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
  actionBtn: { width: ms(48), height: ms(48), alignItems: 'center', justifyContent: 'center', borderRadius: ms(24) },
  actionBtnDisabled: { opacity: 0.3 },
  langDot: { position: 'absolute', top: ms(8), right: ms(8), width: ms(7), height: ms(7), borderRadius: ms(4) },
  notesSection: { marginTop: ms(10) },
  notesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ms(10), paddingHorizontal: ms(4) },
  notesTitle: { fontSize: scaleFontSize(15), fontWeight: 'bold' },
  addNoteBtn: { flexDirection: 'row', alignItems: 'center' },
  noteCard: { borderRadius: ms(12), borderWidth: 1, padding: ms(14), marginBottom: ms(10) },
  noteText: { fontSize: scaleFontSize(14), lineHeight: scaleFontSize(21) },
  noteInput: { fontSize: scaleFontSize(14), minHeight: ms(80), textAlignVertical: 'top', borderWidth: 1, borderRadius: ms(8), padding: ms(10), marginBottom: ms(8) },
  noteActionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: ms(4) },
  noteActionBtn: { marginLeft: ms(12), padding: ms(4) },
  pdfButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: ms(12), paddingVertical: ms(14), marginTop: ms(10) },
});

export default ReferenceModal;