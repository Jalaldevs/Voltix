import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import athkarData from '../constants/adhkarData';
import useAppTranslation from '../hooks/useAppTranslation';
import { useNavigationContext } from './NavigationContext';
import { moderateScale, scaleFontSize } from '../utils/responsive';
import { useFonts } from 'expo-font';
import { ActivityIndicator } from 'react-native';
import { loadAthkarData } from '../utils/athkarLoader';

const MODERATE_FACTOR = 0.35;
const ms = (size) => moderateScale(size, MODERATE_FACTOR);

const AthkarModal = ({ visible, onClose, type = 'morning' }) => {
  const { colorScheme: scheme } = useNavigationContext();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const { t } = useAppTranslation();
  const insets = useSafeAreaInsets();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [athkarList, setAthkarList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const totalAthkar = athkarList.length;

  // Track tap counts for ALL dhikr items
  const [tapCounts, setTapCounts] = useState({});

  const currentAthkar = athkarList[currentIndex];
  const requiredTaps = currentAthkar?.repeat || 1;
  const tapCount = tapCounts[currentIndex] || 0;

  const [fontsLoaded] = useFonts({
    UthmanicHafs: require('../../assets/fonts/uthmanic_hafs_v22.ttf'),
  });

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setCurrentIndex(0);
      setTapCounts({});
      setAthkarList([]);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        const regularDuas = athkarData[type] || [];
        const combined = await loadAthkarData(type, regularDuas);  // ← the missing call
        setAthkarList(combined);
      } catch (err) {
        console.error('Failed to load athkar:', err);
        setAthkarList(athkarData[type] || []);  // fallback to static data
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [visible, type]);

  const handleTap = () => {
    const currentCount = tapCounts[currentIndex] || 0;
    if (currentCount < requiredTaps) {
      setTapCounts(prev => ({
        ...prev,
        [currentIndex]: currentCount + 1
      }));
    }
  };

  const handleUntap = () => {
    const currentCount = tapCounts[currentIndex] || 0;
    if (currentCount > 0) {
      setTapCounts(prev => ({
        ...prev,
        [currentIndex]: currentCount - 1
      }));
    }
  };

  const handleNext = () => {
    if (currentIndex < totalAthkar - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const isCompleted = tapCount >= requiredTaps;
  const progressPercentage = (tapCount / requiredTaps) * 100;

  // Guard: don't render content while loading or list is empty
  if (isLoading || !currentAthkar) {
    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={[styles.container, { backgroundColor: theme.surface, justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.container, { backgroundColor: theme.surface }]}>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerLeft}>
              <Ionicons
                name={type === 'morning' ? 'partly-sunny' : type === 'sleeping' ? 'bed' : 'cloudy-night'}
                size={ms(22)}
                color={type === 'morning' ? '#fbbf24' : type === 'sleeping' ? '#3b82f6' : '#818cf8'}
              />
              <View>
                <Text style={[styles.title, { color: theme.text }]}>
                  {type === 'morning' ? t('athkar.morning.title') :
                    type === 'sleeping' ? t('athkar.sleeping.title') :
                      t('athkar.evening.title')}
                </Text>
                <Text style={[styles.subtitle, { color: theme.muted }]}>
                  {currentIndex + 1} / {totalAthkar}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={ms(26)} color={theme.muted} />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressContainer, { backgroundColor: theme.card }]}>
            <View style={styles.progressInfo}>
              <TouchableOpacity onPress={handleUntap} activeOpacity={0.7}>
                <Text style={[styles.progressLabel, { color: theme.text }]}>
                  {tapCount} / {requiredTaps}
                </Text>
              </TouchableOpacity>
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                </View>
              )}
            </View>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: isCompleted ? '#22c55e' : '#3b82f6',
                  },
                ]}
              />
            </View>
          </View>

          {/* Arabic Content */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.arabicCard, { backgroundColor: theme.card }]}>
              <Text
                style={[
                  styles.arabicText,
                  { color: theme.text, fontFamily: fontsLoaded ? 'UthmanicHafs' : undefined },
                ]}
              >
                {currentAthkar?.arabic}
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Navigation */}
          <View style={[
            styles.buttonContainer,
            {
              backgroundColor: theme.surface,
              borderTopColor: theme.border,
              paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, ms(14)) : ms(14)
            }
          ]}>
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.sideButton,
                {
                  backgroundColor: currentIndex === 0
                    ? theme.card
                    : scheme === 'dark' ? '#1e293b' : '#e2e8f0',
                },
              ]}
              onPress={handlePrevious}
              disabled={currentIndex === 0}
            >
              <Ionicons
                name="chevron-back"
                size={ms(26)}
                color={currentIndex === 0 ? theme.muted : theme.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tapButton, { backgroundColor: isCompleted ? '#22c55e' : '#3b82f6' }]}
              onPress={handleTap}
              activeOpacity={0.7}
            >
              {isCompleted ? (
                <Ionicons name="checkmark-circle-outline" size={32} color="#fff" />
              ) : (
                <>
                  <FontAwesome5 name="hand-pointer" size={ms(26)} color="#fff" />
                  <View style={styles.tapBadge}>
                    <Text style={styles.tapBadgeText}>{requiredTaps - tapCount}</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navButton,
                styles.sideButton,
                {
                  backgroundColor: currentIndex === totalAthkar - 1
                    ? theme.card
                    : scheme === 'dark' ? '#1e293b' : '#e2e8f0',
                },
              ]}
              onPress={handleNext}
              disabled={currentIndex === totalAthkar - 1}
            >
              <Ionicons
                name="chevron-forward"
                size={ms(26)}
                color={currentIndex === totalAthkar - 1 ? theme.muted : theme.text}
              />
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    width: '100%',
    height: '85%',
    borderTopLeftRadius: ms(22),
    borderTopRightRadius: ms(22),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ms(22),
    paddingVertical: ms(18),
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
  },
  title: {
    fontSize: scaleFontSize(19),
    fontWeight: '700',
    marginBottom: ms(2),
  },
  subtitle: {
    fontSize: scaleFontSize(13),
    fontWeight: '500',
  },
  closeButton: {
    padding: ms(4),
  },
  progressContainer: {
    paddingHorizontal: ms(22),
    paddingVertical: ms(13),
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(8),
  },
  progressLabel: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    backgroundColor: '#22c55e20',
    paddingHorizontal: ms(10),
    paddingVertical: ms(4),
    borderRadius: ms(12),
  },
  progressBar: {
    height: ms(8),
    borderRadius: ms(4),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: ms(4),
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: ms(18),
    paddingBottom: ms(36),
  },
  arabicCard: {
    paddingHorizontal: ms(12),
    paddingVertical: ms(2),
    borderRadius: ms(16),
    marginBottom: ms(14),
    minHeight: ms(188),
    justifyContent: 'center',
  },
  arabicText: {
    fontSize: scaleFontSize(28),
    lineHeight: scaleFontSize(49),
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: ms(16),
    paddingVertical: ms(14),
    gap: ms(12),
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(13),
    borderRadius: ms(12),
  },
  sideButton: {
    flex: 1,
  },
  tapButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(14),
    borderRadius: ms(12),
    gap: ms(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  tapBadge: {
    position: 'absolute',
    top: -ms(6),
    right: -ms(6),
    backgroundColor: '#ef4444',
    borderRadius: ms(12),
    minWidth: ms(24),
    height: ms(24),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ms(6),
  },
  tapBadgeText: {
    color: '#fff',
    fontSize: scaleFontSize(12),
    fontWeight: '700',
  },
});

export default AthkarModal;