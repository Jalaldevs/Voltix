import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scaleFontSize, moderateScale } from '../utils/responsive';
import {
  getMethodDisplayName,
  getMethodDescription,
  CALCULATION_METHODS,
  detectCalculationMethod,
} from '../utils/calculationMethodDetector';
import useAppTranslation from '../hooks/useAppTranslation';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COORDS_KEY = '@home:coords';

const CalculationMethodModal = ({ visible, onClose, theme, currentMethod, onSelectMethod }) => {
  const { t } = useAppTranslation();
  const [recommendedMethod, setRecommendedMethod] = useState(null);

  React.useEffect(() => {
    if (visible) {
      loadRecommendedMethod();
    }
  }, [visible]);

  const loadRecommendedMethod = async () => {
    try {
      const coordsStr = await AsyncStorage.getItem(COORDS_KEY);
      if (coordsStr) {
        const { latitude, longitude } = JSON.parse(coordsStr);
        const detected = detectCalculationMethod(latitude, longitude);
        setRecommendedMethod(detected);
      }
    } catch (e) {
      console.log('Could not load recommended method:', e);
    }
  };

  const handleMethodSelect = (method) => {
    if (method === currentMethod) {
      onClose();
      return;
    }

    Alert.alert(
      t('calculationMethod.confirmTitle') || 'Change Calculation Method?',
      t('calculationMethod.confirmMessage') || 'Are you sure you want to change the calculation method?',
      [
        { text: t('calculationMethod.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('calculationMethod.change') || 'Change',
          style: 'destructive',
          onPress: () => {
            if (recommendedMethod && method !== recommendedMethod) {
              showAutoRecommendationWarning(method);
            } else {
              onSelectMethod(method);
              onClose();
            }
          },
        },
      ]
    );
  };

  const showAutoRecommendationWarning = (method) => {
    Alert.alert(
      t('calculationMethod.autoRecommendationTitle') || 'Automatic Recommendation',
      t('calculationMethod.autoRecommendationMessage') || 'We already recommended an automatic calculation method based on your location. Are you sure you want to change it?',
      [
        { text: t('calculationMethod.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('calculationMethod.changeAnyway') || 'Change Anyway',
          style: 'destructive',
          onPress: () => {
            onSelectMethod(method);
            onClose();
          },
        },
      ]
    );
  };

  // Detect dark mode from theme surface color
  const isDark = theme?.background === '#192132';

  // Active blue adapts per mode: softer in dark, deeper in light
  const activeBlue = isDark ? '#60A5FA' : '#1b83de';
  const activeDescriptionColor = isDark ? '#93C5FD' : '#4568dd';

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface }]}>

          {/* Header */}
          <View style={[
            styles.header,
            { borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)' },
          ]}>
            <View style={styles.headerLeft}>
              <Ionicons name="compass-outline" size={28} color={theme.dontKnow} />
              <Text style={[styles.headerTitle, { color: theme.title }]}>
                {t('calculationMethod.title')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[
              styles.closeButton,
              { backgroundColor: isDark ? '#2C3A4D' : '#F1F5F9' },
            ]}>
              <Ionicons name="close" size={22} color={theme.muted} />
            </TouchableOpacity>
          </View>

          {/* Info Text */}
          <View style={styles.infoSection}>
            <Text style={[styles.infoText, { color: theme.text }]}>
              {t('calculationMethod.infoText')}
            </Text>
          </View>

          {/* Method Options */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
            {CALCULATION_METHODS.map((method) => {
              const isSelected = method === currentMethod;
              const isRecommended = method === recommendedMethod;

              return (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.methodCard,
                    {
                      borderColor: isSelected
                        ? activeBlue
                        : theme.border,
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(96, 165, 250, 0.12)' : '#F0F7FF')
                        : theme.surface,
                    },
                  ]}
                  onPress={() => handleMethodSelect(method)}
                  activeOpacity={0.7}
                >
                  <View style={styles.methodCardContent}>
                    <View style={styles.methodCardLeft}>
                      <View
                        style={[
                          styles.radioOuter,
                          { borderColor: isSelected ? activeBlue : theme.muted },
                        ]}
                      >
                        {isSelected && (
                          <View style={[styles.radioInner, { backgroundColor: activeBlue }]} />
                        )}
                      </View>
                      <View style={styles.methodTextContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={[
                            styles.methodTitle,
                            { color: isSelected ? activeBlue : theme.title },
                          ]}>
                            {getMethodDisplayName(method)}
                          </Text>
                          {isRecommended && (
                            <View style={styles.recommendedBadge}>
                              <Text style={styles.recommendedText}>
                                {t('calculationMethod.autoBadge')}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={[
                          styles.methodDescription,
                          { color: isSelected ? activeDescriptionColor : theme.muted },
                        ]}>
                          {getMethodDescription(method)}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={activeBlue} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View style={[
            styles.footerInfo,
            { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
          ]}>
            <Text style={[styles.footerText, { color: theme.muted }]}>
              {t('calculationMethod.footerText')}
            </Text>
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
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    paddingTop: moderateScale(20),
    paddingHorizontal: moderateScale(22),
    paddingBottom: moderateScale(44),
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: moderateScale(16),
    borderBottomWidth: 1,
    marginBottom: moderateScale(16),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    flex: 1,
  },
  headerTitle: {
    fontSize: scaleFontSize(19),
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  closeButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    paddingHorizontal: moderateScale(8),
    marginBottom: moderateScale(20),
  },
  infoText: {
    fontSize: scaleFontSize(14),
    lineHeight: scaleFontSize(20),
    textAlign: 'center',
    fontWeight: '500',
  },
  scrollView: {
    marginBottom: moderateScale(16),
  },
  methodCard: {
    borderWidth: 2,
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
  },
  methodCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  methodCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioOuter: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(14),
  },
  radioInner: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
  },
  methodTextContainer: {
    flex: 1,
  },
  methodTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '700',
    marginBottom: moderateScale(4),
  },
  methodDescription: {
    fontSize: scaleFontSize(13),
    fontWeight: '500',
    lineHeight: scaleFontSize(18),
  },
  footerInfo: {
    paddingTop: moderateScale(12),
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: scaleFontSize(12),
    textAlign: 'center',
    fontWeight: '500',
  },
  recommendedBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: moderateScale(8),
    paddingVertery: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  recommendedText: {
    color: '#fff',
    fontSize: scaleFontSize(10),
    fontWeight: '700',
  },
});

export default CalculationMethodModal;