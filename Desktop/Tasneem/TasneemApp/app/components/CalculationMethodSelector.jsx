import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigationContext } from './NavigationContext';
import useAppTranslation from '../hooks/useAppTranslation';
import { moderateScale } from '../utils/responsive';
import {
  detectCalculationMethod,
  getMethodDisplayName,
  getMethodDescription,
  CALCULATION_METHODS,
} from '../utils/calculationMethodDetector';

const CALCULATION_METHOD_KEY = '@prayer:calculationMethod';
const COORDS_KEY = '@home:coords';

const MODERATE_FACTOR = 0.35;
const ms = (size) => moderateScale(size, MODERATE_FACTOR);

export default function CalculationMethodSelection() {
  const { colorScheme } = useNavigationContext();
  const { t } = useAppTranslation();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detectedMethod, setDetectedMethod] = useState('MuslimWorldLeague');
  const [selectedMethod, setSelectedMethod] = useState('MuslimWorldLeague');
  const [userLocation, setUserLocation] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const cardAnims = useRef([...Array(4)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    detectMethodFromLocation();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
      ]).start();

      Animated.stagger(120, cardAnims.map(anim =>
        Animated.spring(anim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true })
      )).start();
    }
  }, [loading]);

  const detectMethodFromLocation = async () => {
    try {
      const coordsStr = await AsyncStorage.getItem(COORDS_KEY);
      if (coordsStr) {
        const { latitude, longitude, city } = JSON.parse(coordsStr);
        const method = detectCalculationMethod(latitude, longitude);
        setDetectedMethod(method);
        setSelectedMethod(method);
        setUserLocation(city || '');
      }
    } catch (error) {
      console.error('Error detecting method:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    setSubmitting(true);
    try {
      await AsyncStorage.setItem(CALCULATION_METHOD_KEY, selectedMethod);
      router.replace('/main/Home');
    } catch (error) {
      Alert.alert(t('calculationMethod.errorTitle'), t('calculationMethod.saveErrorMessage'));
    } finally {
      setSubmitting(false);
    }
  };

  const MethodCard = ({ method, index }) => {
    const isSelected = selectedMethod === method;
    const isDetected = detectedMethod === method;

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          { opacity: cardAnims[index], transform: [{ scale: cardAnims[index] }] }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.card,
            isSelected && styles.cardSelected,
          ]}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardLeft}>
              <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                <Ionicons
                  name={isSelected ? "checkmark-circle" : "location-outline"}
                  size={ms(24)}
                  color={isSelected ? "#fff" : "#1b83de"}
                />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                  {getMethodDisplayName(method)}
                </Text>
                <Text style={[styles.cardSubtitle, isSelected && styles.cardSubtitleSelected]}>
                  {getMethodDescription(method)}
                </Text>
              </View>
            </View>
            {isDetected && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>{t('calculationMethod.autoBadge')}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
        bounces={true}
      >
        <Animated.View style={[styles.mainAnimatedContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('calculationMethod.modalTitle')}</Text>
            <Text style={styles.subtitle}>
              {userLocation
                ? t('calculationMethod.subtitleWithLocation', { location: userLocation, method: getMethodDisplayName(detectedMethod) })
                : t('calculationMethod.subtitleWithoutLocation')
              }
            </Text>
          </View>

          {/* Method Selection Cards */}
          <View style={styles.methodBox}>
            {CALCULATION_METHODS.map((method, index) => (
              <MethodCard key={method} method={method} index={index} />
            ))}
          </View>

        </Animated.View>
      </ScrollView>

      {/* Fixed Bottom Action */}
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
                <Text style={styles.buttonText}>{t('calculationMethod.continueButton')}</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.infoText}>
          {t('calculationMethod.changeInfoText')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  centerMode: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F9FF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: ms(50),
    // Asegura espacio al fondo para que las tarjetas no queden tapadas por el footer fijo
    paddingBottom: ms(110),
  },
  mainAnimatedContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: ms(28),
    width: '100%',
  },
  title: {
    fontSize: ms(34),
    fontWeight: '900',
    color: '#0B203B',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: ms(10),
  },
  subtitle: {
    fontSize: ms(14),
    color: '#4F6C92',
    textAlign: 'center',
    lineHeight: ms(21),
    paddingHorizontal: 12,
    fontWeight: '500',
  },
  methodBox: {
    width: '100%',
    gap: ms(12),
  },
  cardContainer: {
    width: '100%',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: ms(20),
    padding: ms(18),
    borderWidth: 2,
    borderColor: '#F0F4F8',
    elevation: 2,
    shadowColor: '#1b83de',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardSelected: {
    borderColor: '#1b83de',
    backgroundColor: '#F0F7FF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(14),
    backgroundColor: 'rgba(27,131,222,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ms(12),
  },
  iconContainerSelected: {
    backgroundColor: '#1b83de',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: ms(16),
    fontWeight: '800',
    color: '#0B203B',
    marginBottom: ms(3),
  },
  cardTitleSelected: {
    color: '#1b83de',
  },
  cardSubtitle: {
    fontSize: ms(12.5),
    color: '#6A82A0',
    lineHeight: ms(17),
    fontWeight: '500',
  },
  cardSubtitleSelected: {
    color: '#4568dd',
  },
  recommendedBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
    borderRadius: ms(10),
    marginLeft: 6,
  },
  recommendedText: {
    color: '#fff',
    fontSize: ms(10.5),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 18,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  mainButton: {
    width: '100%',
    borderRadius: ms(18),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#1b83de',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  buttonGradient: {
    paddingVertical: ms(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
  },
  buttonText: {
    color: '#fff',
    fontSize: ms(17),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoText: {
    textAlign: 'center',
    fontSize: ms(11),
    color: '#94A3B8',
    marginTop: ms(12),
    fontWeight: '500',
  },
});