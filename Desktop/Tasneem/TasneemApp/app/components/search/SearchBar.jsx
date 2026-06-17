// SearchBar.jsx — Search input with source tab selector
import React, { memo, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scaleFontSize, moderateScale } from '../../utils/responsive';
import useAppTranslation from '../../hooks/useAppTranslation';

const MODERATE_FACTOR = 0.35;
const ms = (size) => moderateScale(size, MODERATE_FACTOR);

const SearchBar = ({
  value,
  onChangeText,
  source,
  onSourceChange,
  theme,
  scheme,
  autoFocus = true,
}) => {
  const { t } = useAppTranslation();
  const inputRef = useRef(null);
  const isDark = scheme === 'dark';

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const placeholder = source === 'quran'
    ? t('search.quranPlaceholder') || 'Search Quran (e.g. 2:255, baqarah, mercy...)'
    : t('search.sunnahPlaceholder') || 'Search Sunnah (e.g. bukhari 52, patience...)';

  return (
    <View>
      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: theme.border + '30' }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            source === 'quran' && [styles.tabActive, { borderBottomColor: isDark ? '#60a5fa' : '#2563eb' }],
          ]}
          onPress={() => onSourceChange('quran')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="book-outline"
            size={ms(15)}
            color={source === 'quran' ? (isDark ? '#60a5fa' : '#2563eb') : theme.muted}
          />
          <Text style={[
            styles.tabText,
            { color: source === 'quran' ? (isDark ? '#60a5fa' : '#2563eb') : theme.muted },
            source === 'quran' && styles.tabTextActive,
          ]}>
            {t('tabs.quran') || 'Quran'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            source === 'sunnah' && [styles.tabActive, { borderBottomColor: isDark ? '#60a5fa' : '#2563eb' }],
          ]}
          onPress={() => onSourceChange('sunnah')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="library-outline"
            size={ms(15)}
            color={source === 'sunnah' ? (isDark ? '#60a5fa' : '#2563eb') : theme.muted}
          />
          <Text style={[
            styles.tabText,
            { color: source === 'sunnah' ? (isDark ? '#60a5fa' : '#2563eb') : theme.muted },
            source === 'sunnah' && styles.tabTextActive,
          ]}>
            {t('tabs.sunnah') || 'Sunnah'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input */}
      <View style={[styles.inputRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
        <Ionicons name="search-outline" size={ms(18)} color={theme.muted} />
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: theme.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.muted + '80'}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')} hitSlop={10}>
            <Ionicons name="close-circle" size={ms(18)} color={theme.muted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default memo(SearchBar);

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: scaleFontSize(13),
    fontWeight: '500',
  },
  tabTextActive: {
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: scaleFontSize(14),
    paddingVertical: 2,
  },
});
