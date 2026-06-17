import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  ScrollView,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Purchases from 'react-native-purchases';
import useAppTranslation from '../hooks/useAppTranslation';
import { SUBSCRIPTION_SKU_MONTHLY } from '../hooks/usePremium';
import { useNavigationContext } from './NavigationContext';

const { width } = Dimensions.get('window');

// ─── HOOK: FETCH REVENUECAT OFFERINGS ────────────────────────────────────────
const useRevenueCatOfferings = () => {
  const [offerings, setOfferings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        setOfferings(offerings);
      } catch (error) {
        console.error('Error fetching RevenueCat offerings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOfferings();
  }, []);

  const monthlyPackage =
    offerings?.current?.availablePackages?.find(
      pkg => pkg.identifier === SUBSCRIPTION_SKU_MONTHLY
    ) ||
    offerings?.current?.monthly;

  return {
    offerings,
    loading,
    monthlyPackage,
    monthlyPrice: monthlyPackage?.product?.priceString || '$3.99',
  };
};

// ─── LEGAL MODAL ─────────────────────────────────────────────────────────────
export const LegalModal = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useNavigationContext();
  const { t } = useAppTranslation();

  const title = `${t('termsModal.title')} & ${t('privacyModal.title')}`;
  const sections = [
    { isMainHeading: true, heading: t('termsModal.title') },
    { body: t('termsModal.intro') },
    { heading: t('termsModal.iapTitle'), body: t('termsModal.iapBody') },
    { heading: t('termsModal.importantTitle'), body: t('termsModal.importantBody') },

    { isMainHeading: true, heading: t('privacyModal.title') },
    { body: t('privacyModal.intro') },
    { heading: t('privacyModal.permissionsTitle'), body: t('privacyModal.permissionsBody') },
    { heading: t('privacyModal.dataTitle'), body: t('privacyModal.dataBody') },
    { heading: t('privacyModal.thirdPartyTitle'), body: t('privacyModal.thirdPartyBody') },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={isDark ? ['#121b22', '#0f171e', '#0b1015'] : ['#f0f5ff', '#f5f8ff', '#f8faff', '#ffffff']}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[legalStyles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16, backgroundColor: isDark ? '#121b22' : '#ffffff' }]}>
        {/* Header */}
        <View style={[legalStyles.header, { backgroundColor: isDark ? '#121b22' : '#ffffff' }]}>
          <TouchableOpacity
            onPress={onClose}
            style={[legalStyles.closeBtn, isDark && { backgroundColor: 'rgba(255,255,255,0.1)' }]}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Ionicons name="chevron-down" size={22} color={isDark ? "#e8f2fb" : "#1b83de"} />
          </TouchableOpacity>
          <Text style={[legalStyles.title, isDark && { color: '#e8f2fb' }]}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Divider */}
        <View style={[legalStyles.divider, isDark && { backgroundColor: 'rgba(255,255,255,0.1)' }]} />

        {/* Content */}
        <ScrollView
          style={legalStyles.scroll}
          contentContainerStyle={legalStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section, i) => (
            <View key={i} style={[legalStyles.section, isDark && { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }, section.isMainHeading && { backgroundColor: 'transparent', borderWidth: 0, padding: 0 }]}>
              {section.isMainHeading ? (
                <Text style={[legalStyles.mainHeading, isDark && { color: '#e8f2fb' }]}>{section.heading}</Text>
              ) : section.heading ? (
                <View style={legalStyles.sectionHeadingRow}>
                  <View style={legalStyles.sectionAccent} />
                  <Text style={[legalStyles.sectionHeading, isDark && { color: '#e8f2fb' }]}>{section.heading}</Text>
                </View>
              ) : null}
              {section.body ? <Text style={[legalStyles.sectionBody, isDark && { color: 'rgba(232,242,251,0.8)' }]}>{section.body}</Text> : null}
            </View>
          ))}

          {/* Contact badge */}
          <View style={[legalStyles.contactCard, isDark && { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
            <MaterialCommunityIcons name="email-outline" size={16} color={isDark ? "#e8f2fb" : "#1b83de"} />
            <Text style={[legalStyles.contactText, isDark && { color: '#e8f2fb' }]}>voiceofjalal@gmail.com</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// ─── PREMIUM PAYWALL ─────────────────────────────────────────────────────────
const PremiumPaywall = ({ onClose, onSubscribe, productPrice = '$3.99', onRestore }) => {
  const { t } = useAppTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const loopRef = useRef(null);
  const [accepted, setAccepted] = useState(false);
  const [legalVisible, setLegalVisible] = useState(false);
  const [hasReadLegal, setHasReadLegal] = useState(false);

  const handleCheckboxPress = () => {
    if (accepted) {
      setAccepted(false);
      return;
    }
    if (!hasReadLegal) {
      setLegalVisible(true);
      setHasReadLegal(true);
    }
    setAccepted(true);
  };

  const FEATURES = [
    { icon: 'magnify', label: t('premium.features.searchTitle') },
    { icon: 'file-outline', label: t('premium.features.bookmarksTitle') },
  ];

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(40);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 13, useNativeDriver: true }),
    ]).start();
    loopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loopRef.current.start();
    return () => loopRef.current?.stop();
  }, []);

  const shimmerX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.5, width * 1.5],
  });

  const handleCancelAnytime = () => {
    const url = Platform.OS === 'android'
      ? 'https://play.google.com/store/account/subscriptions'
      : 'https://apps.apple.com/account/subscriptions';
    Linking.openURL(url).catch(err => {
      console.warn('Failed to open subscriptions URL:', err);
    });
  };

  const renderLegalText = () => {
    const legalText = t('premium.legal');
    if (!legalText) return null;

    const segments = legalText.split('·').map(s => s.trim());
    if (segments.length < 4) {
      return <Text style={paywallStyles.legal}>{legalText}</Text>;
    }

    return (
      <Text style={paywallStyles.legal}>
        {segments[0]}
        {' · '}
        <Text style={paywallStyles.legalLink} onPress={handleCancelAnytime}>
          {segments[1]}
        </Text>
        {' · '}
        {segments[2]}
        {' · '}
        <Text style={paywallStyles.legalLink} onPress={onRestore}>
          {segments[3]}
        </Text>
      </Text>
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f5ff" />
      <LinearGradient
        colors={['#f0f5ff', '#f5f8ff', '#f8faff', '#ffffff']}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={paywallStyles.topGlow} pointerEvents="none" />
      <Animated.View style={[
        paywallStyles.root,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          paddingBottom: Math.max(insets.bottom, 20),
        },
      ]}>

        {/* Close Button */}
        <TouchableOpacity
          style={paywallStyles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <Ionicons name="close" size={20} color="rgba(0,0,0,0.35)" />
        </TouchableOpacity>

        {/* Header */}
        <View style={paywallStyles.header}>
          <View style={paywallStyles.crownWrap}>
            <LinearGradient
              colors={['#2d5f8a', '#1b83de', '#4a85b5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={paywallStyles.crownGradient}
            >
              <Animated.View
                style={[paywallStyles.shimmer, { transform: [{ translateX: shimmerX }] }]}
                pointerEvents="none"
              >
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.22)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
              <MaterialCommunityIcons name="crown" size={32} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={paywallStyles.title}>{t('premium.unlockTitle')}</Text>
          <View style={paywallStyles.trialBanner}>
            <MaterialCommunityIcons name="gift-outline" size={14} color="#1b83de" />
            <Text style={paywallStyles.trialBannerText}>{t('premium.freeTrial')}</Text>
          </View>
        </View>

        {/* Features */}
        <View style={paywallStyles.featuresList}>
          {FEATURES.map((f, i) => (
            <View key={i} style={paywallStyles.featureRow}>
              <View style={paywallStyles.featureIconWrap}>
                <MaterialCommunityIcons name={f.icon} size={19} color="#1b83de" />
              </View>
              <View style={paywallStyles.featureTextWrap}>
                <Text style={paywallStyles.featureName}>{f.label}</Text>
              </View>
              <MaterialCommunityIcons name="check-circle" size={17} color="#1b83de" />
            </View>
          ))}
        </View>

        {/* Checkbox */}
        <TouchableOpacity onPress={handleCheckboxPress} style={paywallStyles.checkboxRow}>
          <MaterialCommunityIcons
            name={accepted ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={20}
            color="#1b83de"
          />
          <Text style={paywallStyles.checkboxText}>
            {t('premium.agreeTerms')}{' '}
            <Text
              style={paywallStyles.linkText}
              onPress={() => {
                setLegalVisible(true);
                setHasReadLegal(true);
              }}
            >
              {t('termsModal.title')} & {t('privacyModal.title')}
            </Text>
          </Text>
        </TouchableOpacity>

        {/* Price Card */}
        <View style={paywallStyles.priceCard}>
          <Text style={paywallStyles.priceLabel}>{t('premium.monthly')}</Text>
          <Text style={paywallStyles.priceAmount}>{productPrice}</Text>
          <Text style={paywallStyles.pricePer}>{t('premium.perMonth')}</Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={paywallStyles.ctaWrap}
          onPress={() => accepted && onSubscribe?.(SUBSCRIPTION_SKU_MONTHLY)}
          activeOpacity={0.87}
        >
          <LinearGradient
            colors={['#1e4f78', '#1b83de', '#1b83de']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={paywallStyles.ctaGradient}
          >
            <View style={paywallStyles.ctaInner}>
              <Text style={paywallStyles.ctaText}>{t('premium.trialCta')}</Text>
              <Text style={paywallStyles.ctaSubtext}>{t('premium.trialCtaSub')}</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color="#e8f2fb" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>

        {renderLegalText()}
      </Animated.View>

      {/* Legal Modals */}
      <LegalModal
        visible={legalVisible}
        onClose={() => setLegalVisible(false)}
      />
    </>
  );
};

// ─── GET STARTED ─────────────────────────────────────────────────────────────
const GetStarted = ({ onClose, onPressGetStarted, onRestore }) => {
  const { t } = useAppTranslation();
  const { monthlyPrice, loading } = useRevenueCatOfferings();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const loopRef = useRef(null);
  const [premiumPaywallVisible, setPremiumPaywallVisible] = useState(false);

  const FEATURES = [
    { icon: 'magnify', label: t('premium.features.searchTitle') },
    { icon: 'file-outline', label: t('premium.features.bookmarksTitle') },
  ];

  const WARNINGS = [
    t('premium.warning2_combined'),
  ];

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(60);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 13, useNativeDriver: true }),
    ]).start();
    loopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loopRef.current.start();
    return () => loopRef.current?.stop();
  }, []);

  const shimmerX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.5, width * 1.5],
  });

  if (premiumPaywallVisible) {
    return (
      <PremiumPaywall
        onClose={() => setPremiumPaywallVisible(false)}
        onSubscribe={(sku) => {
          setPremiumPaywallVisible(false);
          onPressGetStarted?.(sku);
        }}
        productPrice={monthlyPrice}
        onRestore={onRestore}
      />
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <TouchableOpacity style={sheetStyles.overlay} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[
        sheetStyles.card,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 35 : 20),
        },
      ]}>
        <LinearGradient
          colors={['#f0f5ff', '#f5f8ff', '#f8faff', '#ffffff']}
          locations={[0, 0.3, 0.65, 1]}
          style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
        />
        <View style={sheetStyles.topGlow} pointerEvents="none" />
        <View style={sheetStyles.handle} />
        <TouchableOpacity
          style={sheetStyles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <Ionicons name="close" size={20} color="rgba(0,0,0,0.35)" />
        </TouchableOpacity>

        <View style={sheetStyles.header}>
          <View style={sheetStyles.crownWrap}>
            <LinearGradient
              colors={['#2d5f8a', '#1b83de', '#4a85b5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={sheetStyles.crownGradient}
            >
              <Animated.View
                style={[sheetStyles.shimmer, { transform: [{ translateX: shimmerX }] }]}
                pointerEvents="none"
              >
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.22)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
              <MaterialCommunityIcons name="star-four-points" size={30} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={sheetStyles.title}>{t('premium.overviewTitle')}</Text>
          <View style={sheetStyles.subtitleBadge}>
            <MaterialCommunityIcons name="hand-heart-outline" size={14} color="#1b83de" />
            <Text style={sheetStyles.subtitleText}>{t('premium.overviewSubtitle')}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sheetStyles.scrollContent}>
          <View style={sheetStyles.featuresList}>
            {FEATURES.map((f, i) => (
              <View key={i} style={sheetStyles.featureRow}>
                <View style={sheetStyles.featureIconWrap}>
                  <MaterialCommunityIcons name={f.icon} size={19} color="#1b83de" />
                </View>
                <View style={sheetStyles.featureTextWrap}>
                  <Text style={sheetStyles.featureName}>{f.label}</Text>
                </View>
                <MaterialCommunityIcons name="check-circle" size={17} color="#1b83de" />
              </View>
            ))}
          </View>

          <View style={sheetStyles.warningsCard}>
            <View style={sheetStyles.warningsHeader}>
              <MaterialCommunityIcons name="alert-circle-outline" size={15} color="#c0772a" />
              <Text style={sheetStyles.warningsTitle}>{t('premium.warningsTitle')}</Text>
            </View>
            {WARNINGS.map((w, i) => (
              <Text key={i} style={sheetStyles.warningItem}>· {w}</Text>
            ))}
          </View>

          <Text style={sheetStyles.honesty}>🤝 {t('premium.honestyNote')}</Text>
        </ScrollView>

        <TouchableOpacity
          style={sheetStyles.ctaWrap}
          onPress={() => setPremiumPaywallVisible(true)}
          activeOpacity={0.87}
        >
          <LinearGradient
            colors={['#1e4f78', '#1b83de', '#1b83de']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={sheetStyles.ctaGradient}
          >
            <View style={sheetStyles.ctaInner}>
              <Text style={sheetStyles.ctaText}>{t('premium.getStartedCta')}</Text>
              <Text style={sheetStyles.ctaSubtext}>{t('premium.getStartedSub')}</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color="#e8f2fb" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

export default GetStarted;

// ─── LEGAL MODAL STYLES ───────────────────────────────────────────────────────
const legalStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(27,131,222,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0d1a2e',
    letterSpacing: 0.2,
    textAlign: 'center',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(27,131,222,0.12)',
    marginBottom: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 24,
  },
  section: {
    backgroundColor: 'rgba(27,131,222,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(27,130,180,0.1)',
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#1b83de',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a3a5c',
  },
  sectionBody: {
    fontSize: 13,
    color: 'rgba(30,70,120,0.75)',
    lineHeight: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(27,131,222,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(27,131,222,0.18)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  contactText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1b83de',
  },
});

// ─── SHEET & PAYWALL STYLES ───────────────────────────────────────────────────
const sheetStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 2,
    paddingBottom: Platform.OS === 'ios' ? 35 : 30,
    paddingHorizontal: 22,
    overflow: 'hidden',
    maxHeight: '100%',
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
    marginBottom: 16,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  header: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 18,
  },
  crownWrap: {
    marginBottom: 12,
    shadowColor: '#207ac9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 14,
  },
  crownGradient: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: width * 0.4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0d1a2e',
    letterSpacing: 0.2,
  },
  subtitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(27,131,222,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(27,131,222,0.18)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  subtitleText: {
    fontSize: 12.5,
    color: 'rgba(27,80,140,0.75)',
    fontWeight: '500',
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 8,
  },
  featuresList: { gap: 9 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(27,131,222,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(27,130,180,0.12)',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 12,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(27,131,222,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureTextWrap: { flex: 1 },
  featureName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1a3a5c',
    marginBottom: 1,
  },
  warningsCard: {
    backgroundColor: 'rgba(192,119,42,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(192,119,42,0.2)',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  warningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  warningsTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#c0772a',
  },
  warningItem: {
    fontSize: 12,
    color: 'rgba(120, 70, 10, 0.7)',
    lineHeight: 17,
  },
  honesty: {
    fontSize: 12.5,
    fontStyle: 'italic',
    textAlign: 'center',
    color: 'rgba(30, 70, 120, 0.45)',
    lineHeight: 18,
  },
  ctaWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#1b83de',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 22,
    elevation: 11,
    marginTop: 14,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
  },
  ctaInner: { alignItems: 'center' },
  ctaText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  ctaSubtext: {
    fontSize: 11.5,
    color: 'rgba(232,242,251,0.7)',
    marginTop: 2,
  },
});

const paywallStyles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: Platform.OS === 'ios' ? 44 : 30,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },
  topGlow: {
    position: 'absolute',
    top: -220,
    left: -100,
    width: width + 200,
    height: 500,
    borderRadius: (width + 200) / 2,
    backgroundColor: 'rgba(27, 131, 222, 0.06)',
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    gap: 4,
  },
  crownWrap: {
    marginBottom: 14,
    shadowColor: '#207ac9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 14,
  },
  crownGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: width * 0.4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0d1a2e',
    letterSpacing: 0.2,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(27,131,222,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(27,131,222,0.18)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  trialBannerText: {
    fontSize: 12.5,
    color: 'rgba(27,80,140,0.75)',
    fontWeight: '500',
  },
  featuresList: { gap: 9 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(27,131,222,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(27,130,180,0.12)',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 12,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(27,131,222,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureTextWrap: { flex: 1 },
  featureName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1a3a5c',
    marginBottom: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  checkboxText: {
    fontSize: 12.5,
    color: '#1a3a5c',
    flexShrink: 1,
  },
  linkText: {
    textDecorationLine: 'underline',
    color: '#1b83de',
    fontWeight: '600',
  },
  priceCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(27,131,222,0.06)',
    borderWidth: 1.5,
    borderColor: '#1b83de',
    borderRadius: 18,
    paddingVertical: 22,
    shadowColor: '#1b83de',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a5a8a',
    marginBottom: 6,
  },
  priceAmount: {
    fontSize: 42,
    fontWeight: '800',
    color: '#0d1a2e',
    letterSpacing: -1,
  },
  pricePer: {
    fontSize: 12,
    color: 'rgba(30, 70, 120, 0.5)',
    marginTop: 3,
  },
  ctaWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#1b83de',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 22,
    elevation: 11,
    marginVertical: 12,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
  },
  ctaInner: { alignItems: 'center' },
  ctaText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  ctaSubtext: {
    fontSize: 11.5,
    color: 'rgba(232,242,251,0.7)',
    marginTop: 2,
  },
  legal: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(30, 70, 120, 0.3)',
    lineHeight: 16,
    marginTop: 8,
  },
  legalLink: {
    textDecorationLine: 'underline',
    color: '#1b83de',
    fontWeight: '600',
  },
});