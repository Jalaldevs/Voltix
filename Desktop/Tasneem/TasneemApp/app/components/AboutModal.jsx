import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAppTranslation from '../hooks/useAppTranslation';

const AboutModal = ({ visible, onClose }) => {
  const { t } = useAppTranslation();

  const handleEmailPress = () => {
    const email = t('about.email');
    if (!email) return;
    const mailto = `mailto:${email}`;
    Linking.openURL(mailto).catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f0f5ff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('about.title')}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>{t('about.aboutApp')}</Text>
        <Text style={styles.text}>{t('about.description1')}</Text>
        <Text style={[styles.text, styles.paragraphSpacing]}>{t('about.description2')}</Text>

        <Text style={styles.sectionTitle}>{t('about.sourcesCredits')}</Text>
        <Text style={styles.text}>{t('about.quranSection')}</Text>
        <Text style={styles.text}>{t('about.sunnahSection')}</Text>
        <Text style={styles.text}>{t('about.adhanSection')}</Text>
        <Text style={styles.text}>Arabic Quran Font: Uthmanic Hafs v4 by nuqayah/qpc-fonts</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://github.com/nuqayah/qpc-fonts')}>
          <Text style={styles.linkText}>github.com/nuqayah/qpc-fonts</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>{t('about.contact')}</Text>
        <TouchableOpacity onPress={handleEmailPress} activeOpacity={0.7}>
          <Text style={styles.linkText}>{t('about.email')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
};

export default AboutModal;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#f0f5ff',
  },
  closeBtn: { marginRight: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#333' },
  content: { flex: 1, backgroundColor: '#ffffff' },
  contentContainer: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },
  text: { fontSize: 14, lineHeight: 22, color: '#333', marginBottom: 10 },
  linkText: { fontSize: 14, lineHeight: 22, color: '#2563eb', fontWeight: '600' },
  paragraphSpacing: { marginBottom: 18 },
  sectionSpacing: { marginTop: 18 },
});
