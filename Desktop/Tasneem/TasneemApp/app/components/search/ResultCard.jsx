// ResultCard.jsx — Single search result row component
import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { highlightTerms, getMatchPreview } from '../../utils/textHighlight';
import { getGradePillStyle, getGradeLabel } from '../../utils/gradeUtils';
import { getSynonyms } from '../../utils/searchEngine';
import { scaleFontSize, moderateScale } from '../../utils/responsive';
import { useAppTranslation } from '../../hooks/useAppTranslation';

const MODERATE_FACTOR = 0.35;
const ms = (size) => moderateScale(size, MODERATE_FACTOR);

// Helper function to truncate Arabic text at word boundaries
const truncateArabicText = (text, maxLength = 80, source = 'quran') => {
  if (!text || text.length <= maxLength) return text;

  // Use shorter length for Sunnah (hadiths are longer than Quran verses)
  const effectiveMaxLength = source === 'sunnah' ? 60 : maxLength;

  // Find the last space before maxLength
  let truncated = text.substring(0, effectiveMaxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    truncated = truncated.substring(0, lastSpace);
  }

  return truncated + '...';
};

const HighlightedText = memo(({ text, terms, style, numberOfLines }) => {
  const segments = useMemo(() => {
    if (!terms || terms.length === 0) return [{ text, highlight: false }];
    const preview = getMatchPreview(text, terms, 80);
    return highlightTerms(preview, terms);
  }, [text, terms]);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <Text key={i} style={styles.highlight}>{seg.text}</Text>
        ) : (
          <Text key={i}>{seg.text}</Text>
        )
      )}
    </Text>
  );
});

const ResultCard = ({
  item,
  source,
  terms,
  theme,
  scheme,
  onPress,
}) => {
  const { t } = useAppTranslation();
  const isDark = scheme === 'dark';

  const expandedTerms = useMemo(() => {
    if (!terms) return [];
    let expanded = [...terms];
    terms.forEach(term => {
      const syns = getSynonyms(term.toLowerCase());
      expanded = [...expanded, ...syns];
    });
    return Array.from(new Set(expanded.filter(Boolean)));
  }, [terms]);

  // Quran-specific rendering
  if (source === 'quran') {
    if (item.matchType === 'surah') {
      return (
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.surface, borderBottomColor: theme.border + '30' }]}
          onPress={() => onPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(96,165,250,0.12)' : 'rgba(37,99,235,0.08)' }]}>
              <Ionicons name="book-outline" size={ms(18)} color={isDark ? '#60a5fa' : '#2563eb'} />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.title, { color: theme.text }]}>
                {item.surahName || item.surah?.latin}
              </Text>
              <Text style={[styles.subtitle, { color: theme.muted }]}>
                {item.surahId}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={ms(18)} color={theme.muted} />
          </View>
        </TouchableOpacity>
      );
    }

    // Reference or full-text result
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.surface, borderBottomColor: theme.border + '30' }]}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={[styles.refBadge, { backgroundColor: isDark ? '#1e3a8a' : '#e3f2fd' }]}>
            <Text style={[styles.refBadgeText, { color: isDark ? '#90caf9' : '#1976d2' }]}>
              {item.surahId}:{item.ayahId}
            </Text>
          </View>
          <Text style={[styles.surahLabel, { color: theme.muted }]} numberOfLines={1}>
            {item.surahName}
          </Text>
        </View>
        {Boolean(item.arabicText) && (
          <Text
            style={[styles.arabicText, { color: theme.text, fontFamily: 'UthmanicHafs' }]}
            numberOfLines={2}
          >
            {truncateArabicText(item.arabicText, 80, 'quran')}
          </Text>
        )}
        {Boolean(item.translationText) && (
          <HighlightedText
            text={item.translationText}
            terms={expandedTerms}
            style={[styles.translationText, { color: theme.muted }]}
            numberOfLines={2}
          />
        )}
      </TouchableOpacity>
    );
  }

  // Sunnah: book result
  if (item.matchType === 'book') {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.surface, borderBottomColor: theme.border + '30' }]}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(96,165,250,0.12)' : 'rgba(37,99,235,0.08)' }]}>
            <Ionicons name="library-outline" size={ms(18)} color={isDark ? '#60a5fa' : '#2563eb'} />
          </View>
          <View style={styles.textWrap}>
            <Text style={[styles.title, { color: theme.text }]}>
              {item.bookDisplayName}
            </Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              {t('search.browseCollection', { book: item.bookDisplayName })}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={ms(18)} color={theme.muted} />
        </View>
      </TouchableOpacity>
    );
  }

  // Sunnah: reference or full-text
  const gradeTier = item.bestGrade || 'unknown';
  const gradeStyle = getGradePillStyle(gradeTier, scheme);

  const arabicDisplay = item.arabicText || item.arabic || item.text || item.body_arabic || '';
  const translationDisplay = item.translationText || item.translation || item.body || '';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.surface, borderBottomColor: theme.border + '30' }]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.refBadge, { backgroundColor: isDark ? '#1e3a8a' : '#e3f2fd' }]}>
          <Text style={[styles.refBadgeText, { color: isDark ? '#90caf9' : '#1976d2' }]}>
            #{item.hadithnumber}
          </Text>
        </View>
        <Text style={[styles.surahLabel, { color: theme.muted }]} numberOfLines={1}>
          {item.bookDisplayName}
        </Text>
        {gradeTier !== 'unknown' && (
          <View style={[styles.gradePill, { backgroundColor: gradeStyle.bg, borderColor: gradeStyle.border }]}>
            <Text style={[styles.gradeText, { color: gradeStyle.text }]}>
              {getGradeLabel(gradeTier)}
            </Text>
          </View>
        )}
      </View>
      {Boolean(arabicDisplay) && (
        <Text
          style={[styles.arabicText, { color: theme.text, fontFamily: 'KFGQPCUthmanTahaNaskh' }]}
          numberOfLines={2}
        >
          {truncateArabicText(arabicDisplay, 80, 'sunnah')}
        </Text>
      )}
      {Boolean(translationDisplay) && (
        <HighlightedText
          text={translationDisplay}
          terms={expandedTerms}
          style={[styles.translationText, { color: theme.muted }]}
          numberOfLines={2}
        />
      )}
    </TouchableOpacity>
  );
};

export default memo(ResultCard);

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
  subtitle: {
    fontSize: scaleFontSize(12),
    marginTop: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  refBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  refBadgeText: {
    fontSize: scaleFontSize(11),
    fontWeight: '700',
  },
  surahLabel: {
    fontSize: scaleFontSize(12),
    flex: 1,
  },
  gradePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  gradeText: {
    fontSize: scaleFontSize(10),
    fontWeight: '700',
  },
  arabicText: {
    fontSize: scaleFontSize(18),
    lineHeight: scaleFontSize(32),
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  translationText: {
    fontSize: scaleFontSize(12),
    lineHeight: scaleFontSize(18),
  },
  highlight: {
    backgroundColor: 'rgba(250, 204, 21, 0.35)',
    borderRadius: 2,
  },
});
