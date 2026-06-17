// SearchHistory.jsx — Recent searches list
import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scaleFontSize, moderateScale } from '../../utils/responsive';
import { useAppTranslation } from '../../hooks/useAppTranslation';

const MODERATE_FACTOR = 0.35;
const ms = (size) => moderateScale(size, MODERATE_FACTOR);

const SearchHistory = ({
  entries,
  onPress,
  onRemove,
  onClearAll,
  theme,
  scheme,
}) => {
  const { t } = useAppTranslation();
  const isDark = scheme === 'dark';

  if (!entries || entries.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="time-outline" size={ms(32)} color={theme.muted + '50'} />
        <Text style={[styles.emptyText, { color: theme.muted + '80' }]}>
          {t('search.historyEmpty')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerLabel, { color: theme.muted }]}>{t('search.recent')}</Text>
        <TouchableOpacity onPress={onClearAll} hitSlop={10}>
          <Text style={[styles.clearText, { color: isDark ? '#f87171' : '#dc2626' }]}>{t('search.clearAll')}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {entries.map((entry) => (
          <TouchableOpacity
            key={entry.id}
            style={[styles.entryRow, { borderBottomColor: theme.border + '20' }]}
            onPress={() => onPress(entry)}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={ms(16)} color={theme.muted} />
            <View style={styles.entryContent}>
              <Text style={[styles.entryQuery, { color: theme.text }]} numberOfLines={1}>
                {entry.query}
              </Text>
              {entry.resultCount > 0 && (
                <Text style={[styles.entryMeta, { color: theme.muted }]}>
                  {entry.resultCount} {entry.resultCount === 1 ? t('search.resultValue') || 'result' : t('search.resultsValue') || 'results'}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => onRemove(entry.id)}
              hitSlop={10}
              style={styles.removeBtn}
            >
              <Ionicons name="close" size={ms(14)} color={theme.muted} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default memo(SearchHistory);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerLabel: {
    fontSize: scaleFontSize(12),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearText: {
    fontSize: scaleFontSize(11),
    fontWeight: '600',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  entryContent: {
    flex: 1,
  },
  entryQuery: {
    fontSize: scaleFontSize(13),
    fontWeight: '500',
  },
  entryMeta: {
    fontSize: scaleFontSize(11),
    marginTop: 2,
  },
  removeBtn: {
    padding: 4,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: scaleFontSize(12),
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
