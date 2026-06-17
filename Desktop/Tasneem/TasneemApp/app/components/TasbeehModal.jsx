// TasbeehModal.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  Vibration,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/Colors';
import useAppTranslation from '../hooks/useAppTranslation';
import { useNavigationContext } from './NavigationContext';
import { moderateScale, scaleFontSize } from '../utils/responsive';
import { DHIKR_OPTIONS, TARGET_OPTIONS, DEFAULT_TARGET, TASBEEH_STORAGE_KEY } from '../constants/tasbeehData';

const MODERATE_FACTOR = 0.35;
const ms = (size) => moderateScale(size, MODERATE_FACTOR);

const TasbeehModal = ({ visible, onClose }) => {
  const { colorScheme: scheme } = useNavigationContext();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const { t } = useAppTranslation();

  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(DEFAULT_TARGET);
  const [resetAnimation] = useState(new Animated.Value(1));
  const pulseAnimation = useState(new Animated.Value(1))[0];

  const [selectedDhikr, setSelectedDhikr] = useState(DHIKR_OPTIONS[0]);

  // Load saved progress when modal becomes visible
  useEffect(() => {
    if (visible) {
      loadProgress();
    }
  }, [visible]);

  // Save progress whenever count, selectedDhikr, or target changes
  useEffect(() => {
    if (visible) {
      saveProgress();
    }
  }, [count, selectedDhikr, target]);

  useEffect(() => {
    if (count === target) {
      // Celebration animation when target reached
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      Vibration.vibrate(100);
    }
  }, [count, target]);

  // Load progress from AsyncStorage
  const loadProgress = async () => {
    try {
      const savedData = await AsyncStorage.getItem(TASBEEH_STORAGE_KEY);
      if (savedData) {
        const { count: savedCount, dhikrId, target: savedTarget } = JSON.parse(savedData);

        // Find the saved dhikr option
        const savedDhikr = DHIKR_OPTIONS.find(d => d.id === dhikrId);

        if (savedDhikr) {
          setSelectedDhikr(savedDhikr);
          setTarget(savedTarget || savedDhikr.target);
          setCount(savedCount || 0);
        }
      }
    } catch (error) {
      console.error('Error loading Tasbeeh progress:', error);
    }
  };

  // Save progress to AsyncStorage
  const saveProgress = async () => {
    try {
      const dataToSave = {
        count,
        dhikrId: selectedDhikr.id,
        target,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(TASBEEH_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving Tasbeeh progress:', error);
    }
  };

  const resetCounter = async () => {
    setCount(0);
    Animated.sequence([
      Animated.timing(resetAnimation, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(resetAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const incrementCounter = () => {
    if (count < target) {
      setCount(prev => prev + 1);
      // Haptic feedback
      Vibration.vibrate(20);

      // Pulse animation
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const cycleTarget = () => {
    const currentIndex = TARGET_OPTIONS.indexOf(target);
    const nextIndex = (currentIndex + 1) % TARGET_OPTIONS.length;
    setTarget(TARGET_OPTIONS[nextIndex]);
    Vibration.vibrate(30);
  };

  const selectDhikr = (dhikr) => {
    setSelectedDhikr(dhikr);
    setTarget(dhikr.target);
    setCount(0);
  };

  const progress = count / target;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          {/* Pull Indicator */}
          <View style={[styles.pullIndicator, { backgroundColor: theme.border + '80' }]} />

          {/* Header */}
          <LinearGradient
            colors={scheme === 'dark' ?
              ['#0F172A', '#1E293B'] :
              ['#EEF2FF', '#F8FAFC']
            }
            style={styles.headerGradient}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Ionicons name="arrow-back" size={ms(22)} color={theme.text} />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: theme.title }]}>
                  {t('tasbeeh.title')}
                </Text>
              </View>
              <TouchableOpacity onPress={resetCounter} style={styles.resetButton}>
                <Ionicons name="refresh" size={ms(22)} color={theme.iconFocused} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Main Content */}
          <View style={styles.content}>
            {/* Dhikr Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dhikrSelector}>
              {DHIKR_OPTIONS.map((dhikr, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dhikrCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: selectedDhikr.id === dhikr.id ? theme.iconFocused : theme.border,
                    }
                  ]}
                  onPress={() => selectDhikr(dhikr)}
                >
                  <Text style={[styles.dhikrArabic, { color: theme.title }]}>
                    {dhikr.arabic}
                  </Text>
                  <Text style={[styles.dhikrTarget, { color: theme.muted }]}>
                    {t('tasbeeh.targetLabel')}: {dhikr.target}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Counter Circle */}
            <Animated.View
              style={[
                styles.counterContainer,
                {
                  transform: [{ scale: pulseAnimation }]
                }
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={incrementCounter}
                onLongPress={resetCounter}
                delayLongPress={500}
              >
                <LinearGradient
                  colors={scheme === 'dark' ?
                    ['#38BDF8', '#0284C7'] :
                    ['#103681', '#475f95']
                  }
                  style={styles.counterCircle}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.counterInner}>
                    <Text style={styles.counterNumber}>{count}</Text>
                    <Text style={styles.counterTarget}>/ {target}</Text>
                  </View>
                  <View style={styles.progressRing}>
                    {/* Progress indicator */}
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progress * 100}%` }
                      ]}
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Current Dhikr Display */}
            <View style={[styles.currentDhikrContainer, { backgroundColor: theme.surface }]}>
              <Text style={[styles.currentDhikrArabic, { color: theme.title }]}>
                {selectedDhikr.arabic}
              </Text>
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
              {/* <TouchableOpacity onPress={cycleTarget} style={styles.instructionItem}>
                <Ionicons name="duplicate-outline" size={ms(24)} color={theme.iconFocused} />
                <Text style={[styles.instructionText, { color: theme.muted }]}>
                  {t('tasbeeh.changeTarget')}
                </Text>
              </TouchableOpacity> */}
              <TouchableOpacity onPress={resetCounter} style={styles.instructionItem}>
                <Ionicons name="refresh" size={ms(24)} color={theme.iconFocused} />
                <Text style={[styles.instructionText, { color: theme.muted }]}>
                  {t('tasbeeh.tapToReset')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = {
  modalContainer: {
    height: '85%',
    marginTop: 'auto',
    borderTopLeftRadius: ms(22),
    borderTopRightRadius: ms(22),
    overflow: 'hidden',
  },
  pullIndicator: {
    width: ms(40),
    height: ms(5),
    borderRadius: ms(3),
    alignSelf: 'center',
    marginTop: ms(10),
    marginBottom: ms(-10), // Offset the header padding
    zIndex: 10,
  },
  headerGradient: {
    paddingHorizontal: ms(14),
    paddingTop: ms(18),
    paddingBottom: ms(18),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: scaleFontSize(19),
    fontWeight: 'bold',
    marginBottom: ms(4),
  },
  resetButton: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: ms(14),
  },
  dhikrSelector: {
    flexGrow: 0,
    marginBottom: ms(20),
  },
  dhikrCard: {
    padding: ms(12),
    borderRadius: ms(12),
    borderWidth: 2,
    marginRight: ms(12),
    minWidth: ms(114),
    alignItems: 'center',
  },
  dhikrArabic: {
    fontSize: scaleFontSize(18),
    marginBottom: ms(4),
  },
  dhikrName: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    marginBottom: ms(2),
  },
  dhikrTarget: {
    fontSize: scaleFontSize(12),
  },
  counterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: ms(18),
  },
  counterCircle: {
    width: ms(230),
    height: ms(230),
    borderRadius: ms(115),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  counterInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterNumber: {
    fontSize: scaleFontSize(56),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  counterTarget: {
    fontSize: scaleFontSize(22),
    color: 'rgba(255,255,255,0.9)',
    marginTop: -ms(8),
  },
  progressRing: {
    position: 'absolute',
    bottom: ms(18),
    left: ms(28),
    right: ms(28),
    height: ms(4),
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  currentDhikrContainer: {
    padding: ms(16),
    borderRadius: ms(28),
    marginVertical: ms(18),
    alignItems: 'center',
  },
  currentDhikrArabic: {
    fontSize: scaleFontSize(26),
    marginBottom: ms(8),
  },
  currentDhikrName: {
    fontSize: scaleFontSize(18),
  },
  instructions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: ms(28),
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
  },
  instructionText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
    marginTop: ms(2)
  },
};

export default TasbeehModal;