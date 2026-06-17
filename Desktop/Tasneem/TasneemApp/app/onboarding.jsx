import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as StoreReview from 'expo-store-review';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigationContext } from './components/NavigationContext';
import LanguageModal from './components/LanguageModal';
import useAppTranslation from './hooks/useAppTranslation';
import { markOnboardingCompleted } from './utils/offlineContent';
import { moderateScale } from './utils/responsive';
import { quranTranslationMap } from './constants/quranTranslationMap';
import { detectCalculationMethod } from './utils/calculationMethodDetector';

const { width, height } = Dimensions.get('window');

const RTL_LANGUAGES = new Set(['arabic', 'urdu', 'persian', 'kurdish']);

const QURAN_TRANSLATION_KEY = '@quran:selectedTranslation';
const COORDS_KEY = '@home:coords';

// ─── Device locale  →  app language ──────────────────────────────────────────
const LOCALE_TO_APP_LANGUAGE = {
  ar: 'arabic',
  zh: 'chinese',
  hi: 'hindi',
  es: 'spanish',
  fr: 'french',
  bn: 'bengali',
  pt: 'portuguese',
  ru: 'russian',
  ur: 'urdu',
  de: 'german',
  ja: 'japanese',
  it: 'italian',
  ko: 'korean',
  ku: 'kurdish',
  mk: 'macedonian',
  ms: 'malay',
  mt: 'maltese',
  ne: 'nepali',
  no: 'norwegian',
  nb: 'norwegian',   // Norwegian Bokmål
  nn: 'norwegian',   // Norwegian Nynorsk
  fa: 'persian',
  pl: 'polish',
  fil: 'filipino',
  tl: 'filipino',
  ro: 'romanian',
  nl: 'dutch',
  sk: 'slovak',
  so: 'somali',
  sv: 'swedish',
  tr: 'turkish',
  uz: 'uzbek',
  fi: 'finnish',
};

/**
 * Returns the best-matching app language for the device's preferred locales.
 * Tries the full tag first (e.g. "zh-Hans"), then the base code ("zh").
 * Falls back to "english" when nothing matches.
 */
const detectDeviceLanguage = () => {
  try {
    const locales = Localization.getLocales?.() ?? [];
    for (const locale of locales) {
      const full = locale.languageTag?.toLowerCase().replace('-', '_');
      const base = locale.languageCode?.toLowerCase();
      if (full && LOCALE_TO_APP_LANGUAGE[full]) return LOCALE_TO_APP_LANGUAGE[full];
      if (base && LOCALE_TO_APP_LANGUAGE[base]) return LOCALE_TO_APP_LANGUAGE[base];
    }
  } catch (_) {
    // expo-localization not available – fall through
  }
  return 'arabic';
};
// ─────────────────────────────────────────────────────────────────────────────

const MODERATE_FACTOR = 0.35;
const ms = (size) => moderateScale(size, MODERATE_FACTOR);

export default function Onboarding() {
  const { colorScheme, setLanguage } = useNavigationContext();
  const { t, language } = useAppTranslation();
  const isRTL = RTL_LANGUAGES.has(language);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [permissions, setPermissions] = useState({
    location: 'pending',
    notifications: 'pending',
    reviews: 'pending',
  });

  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const cardAnims = useRef([...Array(3)].map(() => new Animated.Value(0))).current;

  // ── Auto-detect & apply device language (first launch only) ──────────────
  useEffect(() => {
    const autoDetect = async () => {
      try {
        const alreadySaved = await AsyncStorage.getItem('appLanguage');
        if (alreadySaved) return;

        const detected = detectDeviceLanguage();

        await AsyncStorage.setItem('appLanguage', detected);
        if (setLanguage) {
          setLanguage(detected);
        }
      } catch (_) {
        // Non-blocking
      }
    };
    autoDetect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
      ]).start();

      Animated.stagger(
        100,
        cardAnims.map(anim =>
          Animated.spring(anim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true })
        )
      ).start();
    }
  }, [loading]);

  const checkPermissions = async () => {
    try {
      const loc = await Location.getForegroundPermissionsAsync();
      const notif = await Notifications.getPermissionsAsync();
      setPermissions({
        location: loc.granted ? 'granted' : (loc.canAskAgain ? 'pending' : 'denied'),
        notifications: notif.granted ? 'granted' : (notif.canAskAgain ? 'pending' : 'denied'),
        reviews: 'pending',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = async (type) => {
    let status;

    if (type === 'location') {
      const res = await Location.requestForegroundPermissionsAsync();
      status = res.status;
    } else if (type === 'notifications') {
      const res = await Notifications.requestPermissionsAsync();
      status = res.status;
    } else if (type === 'reviews') {
      if (await StoreReview.isAvailableAsync()) {
        await StoreReview.requestReview();
        status = 'granted';
      }
    }

    setPermissions(prev => ({
      ...prev,
      [type]: status === 'granted' ? 'granted' : 'denied',
    }));

    if (status !== 'granted' && type !== 'reviews') {
      Alert.alert(
        t(`onboarding.permissions.${type}.title`),
        t(`onboarding.permissions.${type}.message`),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('home.openSettings'), onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const handleContinue = async () => {
    if (permissions.location === 'pending') {
      await requestPermission('location');
      return;
    }
    if (permissions.notifications === 'pending') {
      await requestPermission('notifications');
      return;
    }

    setSubmitting(true);
    try {
      const normalizedLanguage = (language || 'english').toLowerCase();
      const quranTranslation = quranTranslationMap[normalizedLanguage] ? normalizedLanguage : 'english';

      // Get current location if permission is granted
      if (permissions.location === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const { latitude, longitude } = location.coords;
          
          // Try to get city name from reverse geocoding
          let city = '';
          try {
            const reverseGeo = await Location.reverseGeocodeAsync({
              latitude,
              longitude,
            });
            if (reverseGeo[0]) {
              city = reverseGeo[0].city || reverseGeo[0].region || '';
            }
          } catch (_) {
            // Reverse geocoding failed, continue without city name
          }

          // Store coordinates for calculation method detection
          await AsyncStorage.setItem(COORDS_KEY, JSON.stringify({ latitude, longitude, city }));
        } catch (error) {
          console.error('Error getting location:', error);
        }
      }

      await AsyncStorage.multiSet([
        ['appLanguage', normalizedLanguage],
        [QURAN_TRANSLATION_KEY, quranTranslation],
      ]);

      await markOnboardingCompleted();
      router.replace('/calculationMethodSelection');
    } catch (error) {
      Alert.alert(t('onboarding.errorTitle'), t('onboarding.errorMessage'));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Permission Card ───────────────────────────────────────────────────────
  const PermissionCard = ({ icon, title, subtitle, type, accentColor, index }) => {
    const status = permissions[type];
    const isGranted = status === 'granted';

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          { opacity: cardAnims[index], transform: [{ scale: cardAnims[index] }] },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.card,
            isGranted && styles.cardGranted,
            isRTL && { flexDirection: 'row-reverse' },
          ]}
          onPress={() => requestPermission(type)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: isGranted ? '#34C759' : accentColor + '15' },
              isRTL ? { marginLeft: ms(16) } : { marginRight: ms(16) },
            ]}
          >
            <Ionicons
              name={isGranted ? 'checkmark' : icon}
              size={ms(22)}
              color={isGranted ? '#fff' : accentColor}
            />
          </View>

          <View style={[styles.cardContent, isRTL && { alignItems: 'flex-end' }]}>
            <Text style={[styles.cardTitle, isGranted && { color: '#34C759' }]}>
              {title}
            </Text>
          </View>

          {isGranted ? (
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
          ) : (
            <View style={[styles.dot, { backgroundColor: accentColor }]} />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centerMode}>
        <ActivityIndicator size="large" color="#1b83de" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={['#F0F7FF', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            width: '100%',
            alignItems: 'center',
          }}
        >
          {/* ── Branding ── */}
          <View style={styles.header}>
            <LinearGradient colors={['#1b83de', '#4a8fe0']} style={styles.logoIcon}>
              <MaterialCommunityIcons name="book-open-variant" size={ms(40)} color="#fff" />
            </LinearGradient>

            <Text style={styles.title}>{t('onboarding.title')}</Text>
            <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>

            {/* Language badge — always visible so user can override the auto-detected language */}
            <TouchableOpacity
              onPress={() => setLanguageModalVisible(true)}
              style={styles.langBadge}
            >
              <Ionicons name="language" size={16} color="#1b83de" />
              <Text style={styles.langBadgeText}>{language.toUpperCase()}</Text>
              <Ionicons name="chevron-down" size={14} color="#1b83de" />
            </TouchableOpacity>
          </View>

          {/* ── Permissions ── */}
          <View style={styles.permissionBox}>
            <PermissionCard
              index={0}
              type="location"
              icon="location"
              accentColor="#1b83de"
              title={t('onboarding.permissions.location.title')}
            />
            <PermissionCard
              index={1}
              type="notifications"
              icon="notifications"
              accentColor="#0891B2"
              title={t('onboarding.permissions.notifications.title')}
            />
          </View>

          <View style={styles.spacer} />
        </Animated.View>
      </ScrollView>

      {/* ── Footer CTA ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.mainButton}
          onPress={handleContinue}
          disabled={submitting}
        >
          <LinearGradient
            colors={['#1b83de', '#4a8fe0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.btnRow}>
                <Text style={styles.buttonText}>{t('onboarding.cta')}</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.legalText}>{t('onboarding.legal')}</Text>
      </View>

      <LanguageModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  centerMode: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F9FF' },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: ms(60),
    paddingBottom: ms(160),
  },

  header: { alignItems: 'center', marginBottom: ms(36), width: '100%' },

  logoIcon: {
    width: ms(80),
    height: ms(80),
    borderRadius: ms(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(24),
    shadowColor: '#1b83de',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },

  title: {
    fontSize: ms(31),
    fontWeight: '900',
    color: '#0B203B',
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: ms(15.5),
    color: '#4F6C92',
    textAlign: 'center',
    marginTop: ms(10),
    lineHeight: ms(24),
    paddingHorizontal: 10,
    fontWeight: '500',
  },

  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(27,131,222,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: ms(18),
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },

  langBadgeText: {
    color: '#1b83de',
    fontWeight: '800',
    fontSize: ms(12.5),
    letterSpacing: 0.5,
  },

  permissionBox: { width: '100%', gap: ms(14) },
  cardContainer: { width: '100%' },

  card: {
    backgroundColor: '#fff',
    borderRadius: ms(24),
    padding: ms(18),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F0F4F8',
    shadowColor: '#1b83de',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },

  cardGranted: { borderColor: 'rgba(52,199,89,0.3)', backgroundColor: '#F7FCF8' },

  iconContainer: {
    width: ms(52),
    height: ms(52),
    borderRadius: ms(18),
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardContent: { flex: 1 },

  cardTitle: {
    fontSize: ms(17),
    fontWeight: '800',
    color: '#0B203B',
    marginBottom: ms(4),
  },
  
  dot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    marginLeft: ms(12),
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingTop: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },

  mainButton: {
    width: '100%',
    borderRadius: ms(22),
    overflow: 'hidden',
    shadowColor: '#1b83de',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },

  buttonGradient: {
    paddingVertical: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
  },

  btnRow: { flexDirection: 'row', alignItems: 'center', gap: ms(12) },

  buttonText: {
    color: '#fff',
    fontSize: ms(18.5),
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  legalText: {
    textAlign: 'center',
    fontSize: ms(11.5),
    color: '#94A3B8',
    marginTop: ms(16),
    fontWeight: '500',
    paddingHorizontal: 20,
  },

  spacer: { height: ms(20) },
});