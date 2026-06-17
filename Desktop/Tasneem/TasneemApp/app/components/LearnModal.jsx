import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Dimensions,
  Platform,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAppTranslation from '../hooks/useAppTranslation';

const { width } = Dimensions.get('window');

// ─── Wudu Screen ─────────────────────────────────────────────────────────────
const WuduScreen = ({ onNext, onClose, slideAnim, fadeAnim, shimmerX }) => {
  const { t } = useAppTranslation();
  const [activeVideo, setActiveVideo] = useState(0);

  const WUDU_VIDEOS = [
    {
      icon: 'hand-water',
      title: t('learn.wuduVideoTitle'),
      arabic: 'الوضوء',
      description: t('learn.wuduVideoDesc'),
      videoUrl: 'https://www.youtube.com/results?search_query=how+to+make+wudu+islam',
      duration: t('learn.wuduDuration'),
    },
  ];

  return (
    <Animated.View
      style={[styles.screenWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      <LinearGradient
        colors={['#f0f5ff', '#f5f8ff', '#f8faff', '#ffffff']}
        locations={[0, 0.3, 0.65, 1]}
        style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
      />
      <View style={styles.topGlow} pointerEvents="none" />
      <View style={styles.handle} />

      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
      >
        <Ionicons name="close" size={20} color="#666" />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.screenHeader}>
        <View style={styles.iconWrap}>
          <LinearGradient colors={['#2d5f8a', '#1b83de', '#4a85b5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconGradient}>
            <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerX }] }]} pointerEvents="none">
              <LinearGradient colors={['transparent', 'rgba(255,255,255,0.22)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            </Animated.View>
            <MaterialCommunityIcons name="water-outline" size={28} color="#fff" />
          </LinearGradient>
        </View>
        <Text style={styles.screenTitle}>{t('learn.wuduTitle')}</Text>
        <View style={styles.stepCountBadge}>
          <MaterialCommunityIcons name="play-circle-outline" size={12} color="#1b83de" />
          <Text style={styles.stepCountText}>{t('learn.wuduBadge')}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepsScroll}>
        <View style={styles.videoNote}>
          <MaterialCommunityIcons name="information-outline" size={13} color="rgba(27,80,140,0.6)" />
          <Text style={styles.videoNoteText}>{t('learn.wuduNote')}</Text>
        </View>

        {WUDU_VIDEOS.map((video, i) => (
          <TouchableOpacity key={i} onPress={() => setActiveVideo(i)} activeOpacity={0.85}>
            <View style={[styles.prayerCard, activeVideo === i && styles.prayerCardActive]}>
              <View style={styles.prayerCardLeft}>
                <LinearGradient
                  colors={activeVideo === i ? ['#1e4f78', '#1b83de'] : ['rgba(27,131,222,0.08)', 'rgba(27,131,222,0.08)']}
                  style={styles.prayerIconWrap}
                >
                  <MaterialCommunityIcons name={video.icon} size={20} color={activeVideo === i ? '#fff' : '#1b83de'} />
                </LinearGradient>
              </View>
              <View style={styles.prayerCardBody}>
                <View style={styles.prayerTitleRow}>
                  <Text style={[styles.prayerTitle, activeVideo === i && styles.prayerTitleActive]}>{video.title}</Text>
                  <Text style={styles.prayerArabic}>{video.arabic}</Text>
                </View>
                <Text style={styles.prayerPosition}>{video.duration}</Text>
                <Text style={styles.videoDescription}>{video.description}</Text>
                {activeVideo === i && (
                  <TouchableOpacity
                    style={styles.watchBtn}
                    onPress={async () => {
                      try {
                        const supported = await Linking.canOpenURL(video.videoUrl);
                        if (supported) await Linking.openURL(video.videoUrl);
                        else Alert.alert(t('learn.urlNoticeTitle'), t('learn.urlCannotOpen'));
                      } catch (error) {
                        Alert.alert(t('common.error'), t('learn.urlOpenError'));
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient colors={['#1e4f78', '#1b83de']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.watchBtnGradient}>
                      <Ionicons name="play-circle" size={15} color="#fff" />
                      <Text style={styles.watchBtnText}>{t('learn.watchWudu')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 16 }} />
      </ScrollView>

      <TouchableOpacity style={styles.ctaWrap} onPress={onNext} activeOpacity={0.87}>
        <LinearGradient colors={['#1e4f78', '#1b83de', '#1b83de']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
          <View style={styles.ctaInner}>
            <Text style={styles.ctaText}>{t('learn.nextPrayers')}</Text>
            <Text style={styles.ctaSubtext}>{t('learn.nextPrayersSub')}</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color="#e8f2fb" style={{ marginLeft: 8 }} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Prayer Screen ────────────────────────────────────────────────────────────
const PrayerScreen = ({ onBack, onClose, slideAnim, fadeAnim, shimmerX }) => {
  const { t } = useAppTranslation();
  const [activeStep, setActiveStep] = useState(0);

  const PRAYER_VIDEOS = [
    {
      icon: 'weather-night',
      name: t('home.prayers.fajr'),
      arabic: 'الفَجْر',
      rakaat: t('learn.rakaat2'),
      time: t('learn.dawn'),
      description: t('learn.fajrDesc'),
      videoUrl: 'https://www.youtube.com/results?search_query=how+to+pray+fajr',
    },
    {
      icon: 'white-balance-sunny',
      name: t('home.prayers.dhuhr'),
      arabic: 'الظُّهْر',
      rakaat: t('learn.rakaat4'),
      time: t('learn.midday'),
      description: t('learn.dhuhrDesc'),
      videoUrl: 'https://www.youtube.com/results?search_query=how+to+pray+dhuhr',
    },
    {
      icon: 'weather-partly-cloudy',
      name: t('home.prayers.asr'),
      arabic: 'العَصْر',
      rakaat: t('learn.rakaat4'),
      time: t('learn.afternoon'),
      description: t('learn.asrDesc'),
      videoUrl: 'https://www.youtube.com/results?search_query=how+to+pray+asr',
    },
    {
      icon: 'weather-sunset',
      name: t('home.prayers.maghrib'),
      arabic: 'المَغْرِب',
      rakaat: t('learn.rakaat3'),
      time: t('learn.sunset'),
      description: t('learn.maghribDesc'),
      videoUrl: 'https://www.youtube.com/results?search_query=how+to+pray+maghrib',
    },
    {
      icon: 'moon-waning-crescent',
      name: t('home.prayers.isha'),
      arabic: 'العِشَاء',
      rakaat: t('learn.rakaat4'),
      time: t('learn.night'),
      description: t('learn.ishaDesc'),
      videoUrl: 'https://www.youtube.com/results?search_query=how+to+pray+isha',
    },
  ];

  return (
    <Animated.View
      style={[styles.screenWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      <LinearGradient
        colors={['#f0f5ff', '#f5f8ff', '#f8faff', '#ffffff']}
        locations={[0, 0.3, 0.65, 1]}
        style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
      />
      <View style={styles.topGlow} pointerEvents="none" />
      <View style={styles.handle} />

      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
      >
        <Ionicons name="close" size={20} color="#666" />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.screenHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={16} color="#1b83de" />
          <Text style={styles.backText}>{t('learn.wuduTitle')}</Text>
        </TouchableOpacity>
        <View style={styles.iconWrap}>
          <LinearGradient colors={['#2d5f8a', '#1b83de', '#4a85b5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconGradient}>
            <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerX }] }]} pointerEvents="none">
              <LinearGradient colors={['transparent', 'rgba(255,255,255,0.22)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            </Animated.View>
            <MaterialCommunityIcons name="mosque" size={26} color="#fff" />
          </LinearGradient>
        </View>
        <Text style={styles.screenTitle}>{t('learn.prayersTitle')}</Text>
        <View style={styles.stepCountBadge}>
          <MaterialCommunityIcons name="play-circle-outline" size={12} color="#1b83de" />
          <Text style={styles.stepCountText}>{t('learn.prayersBadge')}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepsScroll}>
        <View style={styles.videoNote}>
          <MaterialCommunityIcons name="information-outline" size={13} color="rgba(27,80,140,0.6)" />
          <Text style={styles.videoNoteText}>{t('learn.prayersNote')}</Text>
        </View>

        {PRAYER_VIDEOS.map((p, i) => (
          <TouchableOpacity key={i} onPress={() => setActiveStep(i)} activeOpacity={0.85}>
            <View style={[styles.prayerCard, activeStep === i && styles.prayerCardActive]}>
              <View style={styles.prayerCardLeft}>
                <LinearGradient
                  colors={activeStep === i ? ['#1e4f78', '#1b83de'] : ['rgba(27,131,222,0.08)', 'rgba(27,131,222,0.08)']}
                  style={styles.prayerIconWrap}
                >
                  <MaterialCommunityIcons name={p.icon} size={20} color={activeStep === i ? '#fff' : '#1b83de'} />
                </LinearGradient>
              </View>
              <View style={styles.prayerCardBody}>
                <View style={styles.prayerTitleRow}>
                  <Text style={[styles.prayerTitle, activeStep === i && styles.prayerTitleActive]}>{p.name}</Text>
                  <Text style={styles.prayerArabic}>{p.arabic}</Text>
                </View>
                <Text style={styles.prayerPosition}>{p.rakaat} · {p.time}</Text>
                <Text style={styles.videoDescription}>{p.description}</Text>
                {activeStep === i && (
                  <TouchableOpacity
                    style={styles.watchBtn}
                    onPress={() => Linking.openURL(p.videoUrl).catch(() => {})}
                    activeOpacity={0.8}
                  >
                    <LinearGradient colors={['#1e4f78', '#1b83de']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.watchBtnGradient}>
                      <Ionicons name="play-circle" size={15} color="#fff" />
                      <Text style={styles.watchBtnText}>
                        {t('learn.watchPrayer', { name: p.name })}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 16 }} />
      </ScrollView>
    </Animated.View>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
const LearnModal = ({ visible, onClose }) => {
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(60)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const loopRef     = useRef(null);
  const [screen, setScreen] = useState('wudu');

  useEffect(() => {
    if (!visible) {
      setScreen('wudu');
      return;
    }
    fadeAnim.setValue(0);
    slideAnim.setValue(60);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 13, useNativeDriver: true }),
    ]).start();
    loopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 0,    useNativeDriver: true }),
      ])
    );
    loopRef.current.start();
    return () => loopRef.current?.stop();
  }, [visible]);

  const shimmerX = shimmerAnim.interpolate({
    inputRange: [0, 1], outputRange: [-width * 0.5, width * 1.5],
  });

  const transition = (toScreen) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setScreen(toScreen);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 14, useNativeDriver: true }),
      ]).start();
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

      {screen === 'wudu' ? (
        <WuduScreen
          onNext={() => transition('prayer')}
          onClose={onClose}
          slideAnim={slideAnim}
          fadeAnim={fadeAnim}
          shimmerX={shimmerX}
        />
      ) : (
        <PrayerScreen
          onBack={() => transition('wudu')}
          onClose={onClose}
          slideAnim={slideAnim}
          fadeAnim={fadeAnim}
          shimmerX={shimmerX}
        />
      )}
    </Modal>
  );
};

export default LearnModal;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  screenWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 44 : 30,
    paddingHorizontal: 20,
    overflow: 'hidden',
    maxHeight: '93%',
  },
  topGlow: {
    position: 'absolute',
    top: -60,
    left: -45,
    width: width + 200,
    height: 280,
    borderRadius: (width + 200) / 2,
    backgroundColor: 'rgba(27, 131, 222, 0.07)',
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
    marginBottom: 10,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 16,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  screenHeader: {
    alignItems: 'center',
    marginBottom: 14,
    marginTop: Platform.OS === 'ios' ? 20 : 10,
    gap: 3,
  },
  iconWrap: {
    marginBottom: 10,
    shadowColor: '#207ac9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 10,
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: width * 0.4,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0d1a2e',
    letterSpacing: 0.2,
  },
  stepCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(27,131,222,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(27,131,222,0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  stepCountText: {
    fontSize: 11.5,
    color: 'rgba(27,80,140,0.75)',
    fontWeight: '500',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(27,131,222,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(27,131,222,0.15)',
  },
  backText: {
    fontSize: 12,
    color: '#1b83de',
    fontWeight: '600',
  },
  stepsScroll: {
    paddingBottom: 8,
  },
  videoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    backgroundColor: 'rgba(27,131,222,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(27,131,222,0.14)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  videoNoteText: {
    fontSize: 11.5,
    color: 'rgba(27,80,140,0.65)',
    flex: 1,
    lineHeight: 15,
  },
  videoDescription: {
    fontSize: 11,
    color: 'rgba(27,80,140,0.6)',
    marginTop: 2,
    lineHeight: 14,
  },
  prayerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(27,131,222,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(27,130,180,0.1)',
    borderRadius: 13,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 7,
  },
  prayerCardActive: {
    backgroundColor: 'rgba(27,131,222,0.07)',
    borderColor: 'rgba(27,131,222,0.3)',
  },
  prayerCardLeft: { flexShrink: 0 },
  prayerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerCardBody: { flex: 1 },
  prayerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prayerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a3a5c',
    flex: 1,
  },
  prayerTitleActive: { color: '#0d2a4e' },
  prayerArabic: {
    fontSize: 13,
    color: '#1b83de',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  prayerPosition: {
    fontSize: 11,
    color: 'rgba(27,131,222,0.6)',
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 2,
  },
  watchBtn: {
    marginTop: 8,
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  watchBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  watchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  ctaWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#1b83de',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
    marginTop: 10,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 18,
  },
  ctaInner: { alignItems: 'center' },
  ctaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  ctaSubtext: {
    fontSize: 11,
    color: 'rgba(232,242,251,0.7)',
    marginTop: 2,
  },
});