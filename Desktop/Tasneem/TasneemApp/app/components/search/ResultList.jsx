// ResultList.jsx — FlashList wrapper for search results
import React, { memo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import ResultCard from './ResultCard';
import { scaleFontSize, moderateScale } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';

const MODERATE_FACTOR = 0.35;
const ms = (size) => moderateScale(size, MODERATE_FACTOR);

import { useAppTranslation } from '../../hooks/useAppTranslation';

const EmptyState = memo(({ query, theme, scheme }) => {
  const { t } = useAppTranslation();
  const isDark = scheme === 'dark';
  return (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyIcon, { backgroundColor: isDark ? 'rgba(96,165,250,0.1)' : 'rgba(37,99,235,0.06)' }]}>
        <Ionicons name="search" size={ms(28)} color={isDark ? '#60a5fa' : '#2563eb'} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {t('search.noResults')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.muted }]}>
        {t('search.noResultsHint')}
      </Text>
    </View>
  );
});

const ResultList = ({
  results,
  source,
  terms,
  isSearching,
  query,
  theme,
  scheme,
  onResultPress,
}) => {
  if (isSearching) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color={scheme === 'dark' ? '#60a5fa' : '#2563eb'} />
      </View>
    );
  }

  if (results.length === 0 && query.trim().length >= 2) {
    return <EmptyState query={query} theme={theme} scheme={scheme} />;
  }

  return (
    <View style={styles.listContainer}>
      <FlashList
        data={results}
        renderItem={({ item }) => (
          <ResultCard
            item={item}
            source={source}
            terms={terms}
            theme={theme}
            scheme={scheme}
            onPress={onResultPress}
          />
        )}
        keyExtractor={(item) => item.id}
        estimatedItemSize={120}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </View>
  );
};

export default memo(ResultList);

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: scaleFontSize(15),
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: scaleFontSize(12),
    textAlign: 'center',
    lineHeight: scaleFontSize(18),
  },
});
