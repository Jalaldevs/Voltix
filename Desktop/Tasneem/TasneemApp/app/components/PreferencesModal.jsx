import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale, scaleFontSize } from '../utils/responsive';
import useAppTranslation from '../hooks/useAppTranslation';

const ms = (size) => moderateScale(size, 0.35);
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

const PreferencesModal = ({ visible, onClose, theme, isDarkMode }) => {
  const { t } = useAppTranslation();
  const insets = useSafeAreaInsets();
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (visible) {
      checkPermissions();
    }
  }, [visible]);

  const checkPermissions = async () => {
    try {
      const locStatus = await Location.getForegroundPermissionsAsync();
      setLocationEnabled(locStatus.status === 'granted');

      const notifStatus = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(notifStatus.granted);
    } catch (error) {
      console.log('Error checking permissions:', error);
    }
  };

  const handleLocationToggle = async (value) => {
    if (value) {
      // Trying to turn ON
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationEnabled(status === 'granted');
        if (status !== 'granted') {
          Alert.alert(
            t('onboarding.permissions.location.title') || 'Location Permission',
            t('home.locationNeeded') || 'Please enable location in your device settings.',
            [
              { text: t('common.cancel') || 'Cancel', style: 'cancel' },
              { text: t('home.openSettings') || 'Settings', onPress: () => Linking.openSettings() }
            ]
          );
        }
      } catch (error) {
        console.log('Error requesting location:', error);
      }
    } else {
      // Trying to turn OFF
      Alert.alert(
        t('home.openSettings') || 'Open Settings',
        'To revoke location access, please open your device settings.',
        [
          { text: t('common.cancel') || 'Cancel', style: 'cancel', onPress: () => setLocationEnabled(true) },
          { text: t('home.openSettings') || 'Settings', onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  const handleNotificationsToggle = async (value) => {
    if (value) {
      // Trying to turn ON
      try {
        const { granted } = await Notifications.requestPermissionsAsync();
        setNotificationsEnabled(granted);
        if (!granted) {
          Alert.alert(
            t('onboarding.permissions.notifications.title') || 'Notifications Permission',
            'Please enable notifications in your device settings.',
            [
              { text: t('common.cancel') || 'Cancel', style: 'cancel' },
              { text: t('home.openSettings') || 'Settings', onPress: () => Linking.openSettings() }
            ]
          );
        }
      } catch (error) {
        console.log('Error requesting notifications:', error);
      }
    } else {
      // Trying to turn OFF
      Alert.alert(
        t('home.openSettings') || 'Open Settings',
        'To revoke notifications access, please open your device settings.',
        [
          { text: t('common.cancel') || 'Cancel', style: 'cancel', onPress: () => setNotificationsEnabled(true) },
          { text: t('home.openSettings') || 'Settings', onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }]}>
        <Pressable style={{ ...StyleSheet.absoluteFillObject }} onPress={onClose} />
        <View style={[
          styles.modalContainer,
          {
            backgroundColor: theme.surface,
            shadowColor: isDarkMode ? '#000' : '#666',
          }
        ]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border + '40' }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t('settings.options.appSettings.title') || 'App Preferences'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={ms(25)} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>

            {/* Location Toggle */}
            <View style={[styles.preferenceRow, { borderBottomColor: theme.border + '20' }]}>
              <View style={styles.preferenceInfo}>
                <Ionicons name="location" size={ms(22)} color={theme.primary} style={styles.preferenceIcon} />
                <View style={styles.preferenceTextContainer}>
                  <Text style={[styles.preferenceTitle, { color: theme.text }]}>
                    {t('onboarding.permissions.location.title') || 'Location Services'}
                  </Text>
                  <Text style={[styles.preferenceSubtitle, { color: theme.muted }]}>
                    {t('onboarding.permissions.location.subtitle') || 'Used to calculate accurate prayer times'}
                  </Text>
                </View>
              </View>
              <Switch
                value={locationEnabled}
                onValueChange={handleLocationToggle}
                trackColor={{ false: '#767577', true: '#3b82f6' }}
                thumbColor={'#f4f3f4'}
              />
            </View>

            {/* Notifications Toggle */}
            <View style={[styles.preferenceRow, { borderBottomColor: theme.border + '20' }]}>
              <View style={styles.preferenceInfo}>
                <Ionicons name="notifications" size={ms(22)} color={theme.primary} style={styles.preferenceIcon} />
                <View style={styles.preferenceTextContainer}>
                  <Text style={[styles.preferenceTitle, { color: theme.text }]}>
                    {t('onboarding.permissions.notifications.title') || 'Push Notifications'}
                  </Text>
                  <Text style={[styles.preferenceSubtitle, { color: theme.muted }]}>
                    {t('onboarding.permissions.notifications.subtitle') || 'Used to notify you for prayer times'}
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: '#767577', true: '#3b82f6' }}
                thumbColor={'#f4f3f4'}
              />
            </View>

            {/* Open OS Settings Button */}
            <TouchableOpacity
              style={[styles.osSettingsButton, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', borderColor: theme.border }]}
              onPress={() => {
                Linking.openSettings().catch((err) => console.error('Error opening settings:', err));
                onClose();
              }}
            >
              <Ionicons name="settings-sharp" size={ms(20)} color={theme.text} />
              <Text style={[styles.osSettingsButtonText, { color: theme.text }]}>
                {t('home.openSettings') || 'Open Device Settings'}
              </Text>
              <Ionicons name="open-outline" size={ms(16)} color={theme.muted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PreferencesModal;

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContainer: {
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    padding: ms(20),
    width: '100%',
    paddingBottom: ms(40)
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: ms(15),
    borderBottomWidth: 1,
    marginBottom: ms(15)
  },
  modalTitle: { fontSize: scaleFontSize(20), fontWeight: '700' },
  closeButton: { padding: ms(5) },
  modalContent: { marginTop: ms(10) },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ms(16),
    borderBottomWidth: 1,
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: ms(16),
  },
  preferenceIcon: {
    marginRight: ms(16),
  },
  preferenceTextContainer: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    marginBottom: ms(4),
  },
  preferenceSubtitle: {
    fontSize: scaleFontSize(13),
    lineHeight: ms(18),
  },
  osSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ms(30),
    paddingVertical: ms(16),
    paddingHorizontal: ms(20),
    borderRadius: ms(16),
    borderWidth: 1,
  },
  osSettingsButtonText: {
    fontSize: scaleFontSize(15),
    fontWeight: '600',
    marginLeft: ms(12),
  },
});
