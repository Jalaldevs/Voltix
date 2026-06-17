import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useQiblaFinder } from 'react-native-qibla-finder/src/hook/useQiblaCompass';
import { Ionicons } from '@expo/vector-icons';
import useAppTranslation from '../hooks/useAppTranslation';

const compassImage = require('react-native-qibla-finder/assets/compass.png');
const kaabaImage = require('react-native-qibla-finder/assets/kaaba.png');

const QiblahCompassContent = ({ t, isDark }) => {
  const qiblaData = useQiblaFinder();
  const { degree, qiblaCoords, rotateCompass, rotateKaba, isLoading, errorMsg } = qiblaData;

  const isAligned = qiblaData.isAligned || (typeof degree === 'number' && typeof qiblaCoords === 'number' && Math.abs(degree - qiblaCoords) <= 5);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#2F6FED'} />
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.compassWrapper}>
      {/* Compass direction indicators */}
      <View style={styles.directionRow}>
        <Text style={[styles.directionText, { color: isDark ? '#f1f5f9' : '#2c3e50' }]}>
          {qiblaData.direction}  {degree}°
        </Text>
      </View>

      {/* Compass Graphic */}
      <View style={styles.compassGraphicContainer}>
        <Image
          source={compassImage}
          style={[
            styles.compassImage,
            { transform: [{ rotate: `${rotateCompass}deg` }] }
          ]}
        />
        <View style={[styles.kaabaContainer, { transform: [{ rotate: `${rotateKaba}deg` }] }]}>
          <Image source={kaabaImage} style={styles.kaabaImage} />
        </View>
      </View>

      {/* Glowing Green Success Banner */}
      {isAligned && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.successText}>Qiblah Was Found!!</Text>
        </View>
      )}
    </View>
  );
};

const QiblahModal = ({ visible, onClose, theme, colorScheme }) => {
  const { t } = useAppTranslation();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, 500); // 500ms delay to let the modal slide-up transition finish smoothly
      return () => clearTimeout(timer);
    } else {
      setShouldRender(false);
    }
  }, [visible]);

  const isDark = false; // Always light mode
  const bgColor = isDark ? '#0f172a' : '#ffffff';
  const qiblaTitle = isDark ? '#f1f5f9' : '#2c3e50';
  const closeBtnBg = isDark ? 'rgba(255,255,255,0.1)' : '#ecf0f1';
  const closeBtnColor = isDark ? '#94a3b8' : '#7f8c8d';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: bgColor }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: qiblaTitle }]}>
              {t('qibla.title') || 'Qibla Direction'}
            </Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: closeBtnBg }]}>
              <Text style={[styles.closeButtonText, { color: closeBtnColor }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Compass Container */}
          <View style={[styles.compassContainer]}>
            {shouldRender ? (
              <QiblahCompassContent t={t} isDark={isDark} />
            ) : (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#2F6FED" />
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  compassContainer: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 15,
    textAlign: 'center',
  },
  compassWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionRow: {
    marginBottom: 5,
  },
  directionText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  compassGraphicContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassImage: {
    resizeMode: 'contain',
    alignSelf: 'center',
    position: 'absolute',
    top: 0,
    width: 300,
    height: 300,
    zIndex: 1,
  },
  kaabaContainer: {
    width: 300,
    height: 300,
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 1,
    elevation: 1,
  },
  kaabaImage: {
    resizeMode: 'center',
    height: 100,
    width: 40,
    zIndex: 1,
  },
  qiblaDirectionTextRow: {
    marginTop: 5,
  },
  qiblaCoordsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  successBanner: {
    backgroundColor: '#10B981', // Emerald green
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginTop: 12,
    elevation: 8,
    shadowColor: '#10B981',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  successText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default QiblahModal;
