// ReferenceViewerSheet.jsx — Full-height bottom sheet for detailed result viewing
import React, { memo, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, Share, Pressable, Platform, Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { getGradePillStyle, getGradeLabel } from '../../utils/gradeUtils';
import { scaleFontSize, moderateScale } from '../../utils/responsive';
import { useAppTranslation } from '../../hooks/useAppTranslation';

const MODERATE_FACTOR = 0.35;
const ms = (size) => moderateScale(size, MODERATE_FACTOR);

const ResultDetailCard = memo(({
  item,
  source,
  isTarget,
  theme,
  scheme,
  onBookmark,
  onShare,
  onNavigate,
}) => {
  const { t } = useAppTranslation();
  const isDark = scheme === 'dark';

  const handleCopyArabic = useCallback(async () => {
    if (item.arabicText) {
      try { await Share.share({ message: item.arabicText }); } catch (_) { }
    }
  }, [item.arabicText]);

  const handleCopyTranslation = useCallback(async () => {
    if (item.translationText) {
      try { await Share.share({ message: item.translationText }); } catch (_) { }
    }
  }, [item.translationText]);

  const refLabel = source === 'quran'
    ? `${item.surahName || ''} ${item.surahId}:${item.ayahId}`
    : `${item.bookDisplayName || ''} #${item.hadithnumber}`;

  const gradeTier = item.bestGrade;
  const gradeStyle = gradeTier && gradeTier !== 'unknown' ? getGradePillStyle(gradeTier, scheme) : null;

  return (
    <View style={[
      styles.detailCard,
      { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: theme.border + '30' },
      isTarget && { borderColor: isDark ? '#3b82f6' : '#2563eb', borderWidth: 1.5 },
    ]}>
      {/* Header */}
      <View style={styles.detailHeader}>
        <View style={[styles.refBadge, { backgroundColor: isDark ? '#1e3a8a' : '#e3f2fd' }]}>
          <Text style={[styles.refBadgeText, { color: isDark ? '#90caf9' : '#1976d2' }]}>
            {source === 'quran' ? `${item.surahId}:${item.ayahId}` : `#${item.hadithnumber}`}
          </Text>
        </View>
        <Text style={[styles.refLabel, { color: theme.muted }]} numberOfLines={1}>
          {source === 'quran' ? item.surahName : item.bookDisplayName}
        </Text>
        {gradeStyle && (
          <View style={[styles.gradePill, { backgroundColor: gradeStyle.bg, borderColor: gradeStyle.border }]}>
            <Text style={[styles.gradeText, { color: gradeStyle.text }]}>
              {getGradeLabel(gradeTier)}
            </Text>
          </View>
        )}
      </View>

      {/* Arabic text */}
      {Boolean(item.arabicText) && (
        <Text style={[styles.arabicText, { color: theme.text }]} selectable>
          {item.arabicText}
        </Text>
      )}

      {/* Translation text */}
      {Boolean(item.translationText) && (
        <Text style={[styles.translationText, { color: theme.muted }]} selectable>
          {item.translationText}
        </Text>
      )}

      {/* Actions */}
      <View style={[styles.actionRow, { borderTopColor: theme.border + '20' }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onBookmark?.(item)} hitSlop={8}>
          <Ionicons name="bookmarks-outline" size={ms(16)} color={isDark ? '#60a5fa' : '#2563eb'} />
          <Text style={[styles.actionText, { color: isDark ? '#60a5fa' : '#2563eb' }]}>{t('search.bookmark')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onShare?.(item)} hitSlop={8}>
          <Ionicons name="share-outline" size={ms(16)} color={isDark ? '#60a5fa' : '#2563eb'} />
          <Text style={[styles.actionText, { color: isDark ? '#60a5fa' : '#2563eb' }]}>{t('search.share')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleCopyArabic} hitSlop={8}>
          <Ionicons name="copy-outline" size={ms(16)} color={isDark ? '#60a5fa' : '#2563eb'} />
          <Text style={[styles.actionText, { color: isDark ? '#60a5fa' : '#2563eb' }]}>{t('search.arabic')}</Text>
        </TouchableOpacity>
        {Boolean(item.translationText) && (
          <TouchableOpacity style={styles.actionBtn} onPress={handleCopyTranslation} hitSlop={8}>
            <Ionicons name="copy-outline" size={ms(16)} color={isDark ? '#60a5fa' : '#2563eb'} />
            <Text style={[styles.actionText, { color: isDark ? '#60a5fa' : '#2563eb' }]}>{t('search.translation')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Navigate button */}
      <TouchableOpacity
        style={[styles.navBtn, { backgroundColor: isDark ? '#1e3a8a' : '#2563eb' }]}
        onPress={() => onNavigate?.(item)}
        activeOpacity={0.8}
      >
        <Text style={styles.navBtnText}>
          {t('search.openIn', { source: source === 'quran' ? t('tabs.quran') : t('tabs.sunnah') }) || `Open in ${source === 'quran' ? 'Quran' : 'Sunnah'} →`}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const ReferenceViewerSheet = ({
  visible,
  onClose,
  results,
  initialIndex = 0,
  source,
  theme,
  scheme,
  onBookmark,
  onShare,
  onNavigate,
}) => {
  const { t } = useAppTranslation();
  const listRef = useRef(null);
  const isDark = scheme === 'dark';

  useEffect(() => {
    if (visible && initialIndex > 0 && results.length > 0) {
      const timer = setTimeout(() => {
        try {
          listRef.current?.scrollToIndex({
            index: initialIndex,
            animated: true,
            viewPosition: 0.3,
          });
        } catch (e) {
          // Fallback for FlashList
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible, initialIndex, results.length]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }]}
        onPress={onClose}
      >
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: theme.border + '30' }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetTitleRow}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>
                {results.length} {results.length === 1 ? t('search.resultValue') || 'result' : t('search.resultsValue') || 'results'}
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={10}>
                <Ionicons name="close-circle" size={ms(24)} color={theme.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Results list */}
          <View style={styles.listWrap}>
            <FlashList
              ref={listRef}
              data={results}
              renderItem={({ item, index }) => (
                <ResultDetailCard
                  item={item}
                  source={source}
                  isTarget={index === initialIndex}
                  theme={theme}
                  scheme={scheme}
                  onBookmark={onBookmark}
                  onShare={onShare}
                  onNavigate={onNavigate}
                />
              )}
              keyExtractor={(item) => item.id}
              estimatedItemSize={280}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default memo(ReferenceViewerSheet);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  sheetHeader: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.3)',
    marginBottom: 10,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  sheetTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '700',
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  detailCard: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
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
  refLabel: {
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
    fontSize: scaleFontSize(22),
    lineHeight: scaleFontSize(36),
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  translationText: {
    fontSize: scaleFontSize(13),
    lineHeight: scaleFontSize(20),
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: {
    fontSize: scaleFontSize(11),
    fontWeight: '600',
  },
  navBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  navBtnText: {
    color: '#fff',
    fontSize: scaleFontSize(13),
    fontWeight: '700',
  },
});
