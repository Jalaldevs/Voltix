// RemindersModal.jsx
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale, scaleFontSize } from '../utils/responsive';
import {
  getActiveReminderIds,
  getTodayKey,
  loadCompletedReminderIds,
  saveCompletedReminderIds,
} from '../utils/remindersUtils';

const MODERATE_FACTOR = 0.35;
const ms = (size) => moderateScale(size, MODERATE_FACTOR);

// Keep the same reminder IDs as remindersUtils/getActiveReminderIds.
const RemindersModal = ({
  visible,
  onClose,
  nextPrayer = { name: '', time: '' },
  currentPrayer = { name: '', time: '' }, // (optional) not used for completion logic
  onOpenMorningAdhkar,
  onOpenEveningAdhkar,
  onNavigateToKahf,
  onNavigateToMulk,
  onNavigateToBaqarah,
  onNavigateToBukhari,
  onNavigateToZumar,
  onNavigateToSajdah,
  onNavigateToIsra,
  onOpenTasbeeh,
  onOpenSleepingAdhkar,
  onRemindersChanged,
  isDarkMode,
  theme,
  t,
}) => {
  const nextPrayerName = nextPrayer?.name || '';
  const currentPrayerName = currentPrayer?.name || '';
  const isFridayLocal = new Date().getDay() === 5;

  // Completion state (persisted per-day)
  const [completedToday, setCompletedToday] = useState(() => new Set());

  const todayKey = useMemo(() => getTodayKey(), [visible]);

  const persistCompletedSet = useCallback(
    async (nextSet) => {
      try {
        await saveCompletedReminderIds(todayKey, nextSet);
      } catch (e) {
        // non-fatal
        console.warn('Failed to persist reminders', e?.message || e);
      }
    },
    [todayKey]
  );

  useEffect(() => {
    if (!visible) return;

    let mounted = true;

    (async () => {
      const loaded = await loadCompletedReminderIds(todayKey);
      if (!mounted) return;
      setCompletedToday(loaded);
    })();

    return () => {
      mounted = false;
    };
  }, [visible, todayKey]);

  // Build the list of active reminders contextually.
  // IMPORTANT: IDs must match remindersUtils/getActiveReminderIds so header badge is consistent.
  const reminders = useMemo(() => {
    const list = [];

    // ── Current Prayer Reminder ─────────────────────────────────
    if (currentPrayerName && currentPrayerName !== 'Sunrise' && currentPrayerName !== 'Fajr') {
      list.push({
        id: 'current-prayer',
        icon: 'alarm',
        color: '#8b5cf6', // violet
        title:
          t('reminders.currentPrayerTitle', {
            prayer: currentPrayerName
              ? t(`home.prayers.${currentPrayerName.toLowerCase()}`)
              : '',
          }) || `Have you prayed ${currentPrayerName || 'your current prayer'}?`,
        desc:
          t('reminders.currentPrayerDesc', {
            prayer: currentPrayerName
              ? t(`home.prayers.${currentPrayerName.toLowerCase()}`)
              : '',
          }) || "Prayer is the pillar of faith — don't miss it!",
        onPress: () => {
          // optional: keep for future prayer screen
          console.log('Prayer reminder acknowledged');
        },
        isPriority: true,
      });
    }
    // ── Salawat (Tasbeeh) ────────────────────────────────────────
    list.push({
      id: 'salawat',
      icon: 'heart',
      color: '#ef4444', // red
      title: t('reminders.salawatTitle') || 'Send Salawat to the Prophet ﷺ',
      desc: t('reminders.salawatDesc') || 'Have you sent Salawat to the Prophet ﷺ today?',
      onPress: onOpenTasbeeh,
      navigates: true,
    });

    // ── Morning adhkar ──────────────────────────────────────────
    if (!['Maghrib', 'Isha', 'Fajr'].includes(nextPrayerName)) {
      list.push({
        id: 'morning',
        icon: 'partly-sunny',
        color: '#f59e0b', // amber
        title: t('settings.options.morning.title') || 'Morning Adhkar',
        desc: t('reminders.morningDesc') || 'Start your day with the morning remembrances.',
        onPress: onOpenMorningAdhkar,
        navigates: true,
      });
    }

    // ── Evening adhkar ──────────────────────────────────────────
    if (!['Dhuhr', 'Asr', 'Sunrise'].includes(nextPrayerName)) {
      list.push({
        id: 'evening',
        icon: 'cloudy-night',
        color: '#6366f1', // indigo
        title: t('settings.options.evening.title') || 'Evening Adhkar',
        desc:
          t('reminders.eveningDesc') ||
          'Complete the evening remembrances before sunset.',
        onPress: onOpenEveningAdhkar,
        navigates: true,
      });
    }

    // ── Surah Al-Kahf (Friday + before Dhuhr) ────────────────
    if (isFridayLocal && nextPrayerName === 'Dhuhr') {
      list.push({
        id: 'kahf',
        icon: 'book',
        color: '#2563eb', // blue
        title: t('reminders.kahfTitle') || 'Surah Al-Kahf',
        desc:
          t('reminders.kahfDesc') || "It's Friday — read Surah Al-Kahf before Jumu'ah.",
        onPress: onNavigateToKahf,
        isPriority: true,
        navigates: true,
      });
    }

    const passedDhuhr = ['Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Fajr'].includes(nextPrayerName);
    const passedAsr = ['Asr', 'Maghrib', 'Isha', 'Fajr'].includes(nextPrayerName);
    const passedMaghrib = ['Isha', 'Fajr'].includes(nextPrayerName);
    const passedIsha = ['Fajr'].includes(nextPrayerName);

    if (passedDhuhr) {
      list.push({
        id: 'sunnahDhuhr',
        icon: 'partly-sunny',
        color: '#10b981', // emerald green
        title: t('reminders.sunnahDhuhrTitle') || '4 Rakat Sunnah before Dhuhr ( 2 + 2 )',
        desc:
          t('reminders.sunnahDhuhrDesc') ||
          "Don't forget to pray your 4 Rakat Sunnah before Dhuhr.",
        onPress: () => {
          // not wired previously
          // If you have a screen for sunnah, add it here later.
          console.log('sunnahDhuhr reminder acknowledged');
        },
        isPriority: true,
      });
    }

    if (passedAsr) {
      list.push({
        id: 'sunnahAsr',
        icon: 'cloud',
        color: '#14b8a6', // teal
        title: t('reminders.sunnahAsrTitle') || '4 Rakat Sunnah after Dhuhr ( 2 + 2 )',
        desc:
          t('reminders.sunnahAsrDesc') ||
          "Don't forget to pray your 4 Rakat Sunnah after Dhuhr. ( 2 + 2 )",
        onPress: () => {
          console.log('sunnahAsr reminder acknowledged');
        },
        isPriority: true,
      });
    }

    if (passedMaghrib) {
      list.push({
        id: 'sunnahMaghrib',
        icon: 'cloudy-night',
        color: '#a855f7', // purple
        title: t('reminders.sunnahMaghribTitle') || '2 Rakat Sunnah after Maghrib',
        desc:
          t('reminders.sunnahMaghribDesc') ||
          "Don't forget to pray your 2 Rakat Sunnah after Maghrib.",
        onPress: () => {
          console.log('sunnahMaghrib reminder acknowledged');
        },
        isPriority: true,
      });
    }

    if (passedIsha) {
      list.push({
        id: 'sunnahIsha',
        icon: 'moon',
        color: '#ec4899', // pink
        title: t('reminders.sunnahIshaTitle') || '2 Rakat Sunnah after Isha',
        desc:
          t('reminders.sunnahIshaDesc') ||
          "Don't forget to pray your 2 Rakat Sunnah after Isha.",
        onPress: () => {
          console.log('sunnahIsha reminder acknowledged');
        },
        isPriority: true,
      });
    }

    // ── Fajr -> before sleeping surahs + sleeping adhkar ────
    if (nextPrayerName === 'Fajr') {
      list.push({
        id: 'mulk',
        icon: 'book',
        color: '#3b82f6', // sky blue
        title: t('reminders.mulkTitle') || 'Surah Al-Mulk',
        desc: t('reminders.mulkDesc') || 'Read Surah Al-Mulk before going to sleep.',
        onPress: onNavigateToMulk,
        navigates: true,
      });

      list.push({
        id: 'zumar',
        icon: 'book',
        color: '#06b6d4', // cyan
        title: t('reminders.zumarTitle') || 'Surah Az-Zumar',
        desc: t('reminders.zumarDesc') || 'Read Surah Az-Zumar before going to sleep.',
        onPress: onNavigateToZumar,
        navigates: true,
      });

      list.push({
        id: 'sajdah',
        icon: 'book',
        color: '#0ea5e9', // light sky blue
        title: t('reminders.sajdahTitle') || 'Surah As-Sajdah',
        desc: t('reminders.sajdahDesc') || 'Read Surah As-Sajdah before going to sleep.',
        onPress: onNavigateToSajdah,
        navigates: true,
      });

      list.push({
        id: 'isra',
        icon: 'book',
        color: '#f97316', // orange
        title: t('reminders.israTitle') || 'Surah Al-Isra',
        desc: t('reminders.israDesc') || 'Read Surah Al-Isra before going to sleep.',
        onPress: onNavigateToIsra,
        navigates: true,
      });

      list.push({
        id: 'sleeping',
        icon: 'bed',
        color: '#84cc16', // lime green
        title: t('reminders.sleepingTitle') || 'Sleeping Adhkar',
        desc:
          t('reminders.sleepingDesc') ||
          'Read Sleeping Adhkar before going to sleep.',
        onPress: onOpenSleepingAdhkar,
        navigates: true,
      });
    }

    return list;
  }, [
    nextPrayerName,
    currentPrayerName,
    isFridayLocal,
    t,
    onOpenTasbeeh,
    onOpenMorningAdhkar,
    onOpenEveningAdhkar,
    onNavigateToKahf,
    onNavigateToMulk,
    onNavigateToZumar,
    onNavigateToSajdah,
    onNavigateToIsra,
    onOpenSleepingAdhkar,
  ]);

  const completedCount = useMemo(() => {
    let count = 0;
    for (const r of reminders) {
      if (completedToday.has(r.id)) count += 1;
    }
    return count;
  }, [reminders, completedToday]);

  const totalCount = reminders.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;


  const surfaceBg = theme?.surface || (isDarkMode ? '#1e293b' : '#ffffff');
  const borderColor = (theme?.border || '#ccc') + '40';
  const textColor = theme?.text || (isDarkMode ? '#f1f5f9' : '#0f172a');
  const mutedColor = theme?.muted || (isDarkMode ? '#94a3b8' : '#64748b');
  const overlayBg = isDarkMode ? 'rgba(0,0,0,0.78)' : 'rgba(0,0,0,0.46)';

  const triggerHeaderRefresh = useCallback(() => {
    try {
      if (typeof onRemindersChanged === 'function') onRemindersChanged();
    } catch {
      // ignore
    }
  }, [onRemindersChanged]);

  const handleToggleReminder = useCallback(
    (reminder) => {
      const { id, onPress } = reminder;
      const isCompleted = completedToday.has(id);

      // Undo: just update storage and keep modal open
      if (isCompleted) {
        const next = new Set(completedToday);
        next.delete(id);
        setCompletedToday(next);
        persistCompletedSet(next).then(() => triggerHeaderRefresh());
        return;
      }

      // Complete: update storage, then close+navigate (if onPress exists)
      const next = new Set(completedToday);
      next.add(id);
      setCompletedToday(next);
      persistCompletedSet(next).then(() => triggerHeaderRefresh());

      // Navigate after small delay
      setTimeout(() => {
        if (reminder.navigates) {
          onClose();
        }
        setTimeout(() => {
          if (typeof onPress === 'function') onPress();
        }, 100);
      }, 400);
    },
    [completedToday, persistCompletedSet, triggerHeaderRefresh, onClose]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={[styles.overlay, { backgroundColor: overlayBg }]} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: surfaceBg }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* ── Header with Points ── */}
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <View style={styles.headerLeft}>
              <Ionicons
                name="notifications"
                size={ms(22)}
                color={isDarkMode ? '#60a5fa' : theme?.primary || '#1976d2'}
              />
              <Text style={[styles.title, { color: textColor }]}>{t('reminders.title') || 'Reminders'}</Text>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-outline" size={ms(28)} color={mutedColor} />
              </TouchableOpacity>
            </View>
          </View>


          {/* ── Reminder cards ── */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {reminders.map((reminder) => {
              const isCompleted = completedToday.has(reminder.id);

              return (
                <TouchableOpacity
                  key={reminder.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: isCompleted
                        ? isDarkMode
                          ? 'rgba(34,197,94,0.08)'
                          : 'rgba(34,197,94,0.05)'
                        : isDarkMode
                          ? 'rgba(255,255,255,0.04)'
                          : '#f8faff',
                      borderColor: isCompleted ? '#22c55e88' : reminder.color + '38',
                      opacity: isCompleted ? 0.78 : 1,
                    },
                    reminder.isPriority && styles.priorityCard,
                  ]}
                  onPress={() => handleToggleReminder(reminder)}
                  activeOpacity={0.72}
                >
                  {/* Priority indicator */}
                  {reminder.isPriority && !isCompleted && (
                    <View style={[styles.priorityBadge, { backgroundColor: reminder.color }]}>
                      <Ionicons name="alert-circle" size={ms(10)} color="#fff" />
                    </View>
                  )}

                  {/* Completion checkmark */}
                  {isCompleted && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark-circle" size={ms(24)} color="#22c55e" />
                    </View>
                  )}

                  {/* Icon badge */}
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: isCompleted ? '#22c55e1f' : reminder.color + '1f',
                      },
                    ]}
                  >
                    <Ionicons
                      name={isCompleted ? 'checkmark' : reminder.icon}
                      size={ms(24)}
                      color={isCompleted ? '#22c55e' : reminder.color}
                    />
                  </View>

                  {/* Text */}
                  <View style={styles.cardBody}>
                    <View style={styles.cardTitleRow}>
                      <Text
                        style={[
                          styles.cardTitle,
                          {
                            color: textColor,
                            textDecorationLine: isCompleted ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {reminder.title}
                      </Text>


                    </View>

                    <Text style={[styles.cardDesc, { color: mutedColor }]} numberOfLines={2}>
                      {isCompleted ? t('reminders.completed') || '✓ Completed — well done!' : reminder.desc}
                    </Text>
                  </View>

                  {/* Chevron */}
                  <Ionicons
                    name={isCompleted ? 'checkmark-done' : 'chevron-forward'}
                    size={ms(18)}
                    color={isCompleted ? '#22c55e' : mutedColor}
                  />
                </TouchableOpacity>
              );
            })}

            {/* Bottom breathing room */}
            <View style={{ height: ms(24) }} />
            {/* Safe-area spacer: fills gesture nav bar or 3-button nav height */}
            <SafeAreaView edges={['bottom']} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: ms(26),
    borderTopRightRadius: ms(26),
    minHeight: '40%',
    maxHeight: '80%',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(22),
    paddingVertical: ms(16),
    borderBottomWidth: 0.5,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
  },
  title: {
    fontSize: scaleFontSize(20),
    fontWeight: '700',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(5),
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: ms(20),
  },
  pointsText: {
    color: '#fff',
    fontSize: scaleFontSize(13),
    fontWeight: '700',
  },

  // ── Progress Section ──
  progressSection: {
    paddingHorizontal: ms(22),
    paddingVertical: ms(14),
    gap: ms(8),
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: scaleFontSize(12),
    fontWeight: '600',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
  },
  streakText: {
    fontSize: scaleFontSize(11),
    fontWeight: '600',
  },
  progressBarBg: {
    height: ms(6),
    borderRadius: ms(3),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: ms(3),
  },

  // ── Floating Points ──
  floatingPoints: {
    position: 'absolute',
    top: ms(60),
    right: ms(80),
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    zIndex: 1000,
  },
  floatingPointsText: {
    color: '#fbbf24',
    fontSize: scaleFontSize(18),
    fontWeight: '800',
  },

  // ── Locked Banner ──
  lockedBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    marginHorizontal: ms(16),
    marginTop: ms(16),
    padding: ms(16),
    borderRadius: ms(16),
    alignItems: 'center',
    gap: ms(12),
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  lockedBannerTitle: {
    color: '#f59e0b',
    fontSize: scaleFontSize(16),
    fontWeight: '700',
    marginBottom: ms(4),
  },
  lockedBannerDesc: {
    color: '#d97706',
    fontSize: scaleFontSize(13),
    lineHeight: scaleFontSize(18),
  },

  // ── Scroll / cards ──
  scrollContent: {
    paddingHorizontal: ms(16),
    paddingTop: ms(12),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: ms(18),
    borderWidth: 1,
    padding: ms(16),
    marginBottom: ms(12),
    gap: ms(14),
    position: 'relative',
  },
  priorityCard: {
    borderWidth: 1.5,
  },
  priorityBadge: {
    position: 'absolute',
    top: ms(8),
    right: ms(8),
    width: ms(18),
    height: ms(18),
    borderRadius: ms(9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: ms(8),
    right: ms(8),
  },
  iconWrap: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: ms(2),
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(3),
    backgroundColor: '#fbbf2420',
    paddingHorizontal: ms(6),
    paddingVertical: ms(2),
    borderRadius: ms(8),
  },
  pointsPillText: {
    color: '#f59e0b',
    fontSize: scaleFontSize(10),
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: scaleFontSize(12),
    lineHeight: scaleFontSize(18),
  },
});

export default RemindersModal;