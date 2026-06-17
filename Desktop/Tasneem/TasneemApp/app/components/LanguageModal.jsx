import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { languageCodeMap } from '../constants/languageCodeMap';
import { useNavigationContext } from './NavigationContext';
import useAppTranslation from '../hooks/useAppTranslation';
import ThemedView from './ThemedView';
import ThemedCard from './ThemedCard';
import appTranslations from '../constants/appTranslations';
import { moderateScale, scaleFontSize } from '../utils/responsive';

const MODERATE_FACTOR = 0.35;
const ms = (size) => moderateScale(size, MODERATE_FACTOR);

const LanguageModal = ({ visible, onClose }) => {
  const { colorScheme: scheme, language, setLanguage, languageLoaded } = useNavigationContext();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const { t } = useAppTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const languageOrder = [
    'arabic',        // ID: 0
    'english',       // ID: 1
    'chinese',       // ID: 2
    'hindi',         // ID: 3
    'spanish',       // ID: 4
    'french',        // ID: 5
    'bengali',       // ID: 6
    'portuguese',    // ID: 7
    'russian',       // ID: 8
    'urdu',          // ID: 9
    'german',        // ID: 10
    'dutch',         // ID: 11
    'japanese',      // ID: 12
    'turkish',       // ID: 13
    'malay',         // ID: 14
    'tamil',         // ID: 15  ← NEW
    'somali',        // ID: 16
    'uzbek',         // ID: 17
    'italian',       // ID: 18
    'korean',        // ID: 19
    'macedonian',    // ID: 20
    'nepali',        // ID: 21
    'norwegian',     // ID: 22
    'persian',       // ID: 23
    'polish',        // ID: 24
    'filipino',      // ID: 25
    'romanian',      // ID: 26
    'slovak',        // ID: 27
    'swedish',       // ID: 28
    'finish',        // ID: 29
    'finnish',       // ID: 30
    'kurdish',       // ID: 31
    'maltese',       // ID: 32
  ];

  const languageOrderIndex = new Map(
    languageOrder.map((code, index) => [code, index])
  );

  // Extract display names from the bidirectional language map
  const languageList = Object.entries(languageCodeMap)
    .filter(([displayName, code]) => {
      const isLowercaseCode = code === code.toLowerCase();
      return isLowercaseCode && appTranslations[code];
    })
    .map(([displayName, code]) => ({ displayName, code }))
    .sort((a, b) => {
      const aIndex = languageOrderIndex.get(a.code);
      const bIndex = languageOrderIndex.get(b.code);

      if (aIndex != null && bIndex != null) return aIndex - bIndex;
      if (aIndex != null) return -1;
      if (bIndex != null) return 1;

      return a.displayName.localeCompare(b.displayName);
    });

  const handleLanguageSelect = async (languageCode) => {
    // Close the modal immediately to keep UX snappy.
    // The language switch can happen asynchronously in the background.
    onClose();
    setIsChanging(true);
    try {
      await setLanguage(languageCode);
    } catch (error) {
      console.log('Error changing language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const renderLanguageItem = ({ item }) => {
    const isSelected = language === item.code;
    return (
      <TouchableOpacity
        style={[
          styles.languagesItem,
          { backgroundColor: scheme === 'dark' ? '#374151' : '#f3f4f6' },
          isSelected && {
            backgroundColor: scheme === 'dark' ? '#1e3a8a' : 'rgba(0, 102, 255, 1)',
          },
        ]}
        onPress={() => handleLanguageSelect(item.code)}
        activeOpacity={0.7}
        disabled={isChanging}
      >
        <Text style={[styles.languagesText, { color: isSelected ? '#fff' : theme.text, fontWeight: isSelected ? '700' : '600' }]}>
          {item.displayName}
        </Text>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <ThemedView style={styles.languagesOverlay}>
        <ThemedCard style={[styles.languagesSheet, { backgroundColor: theme.languagesDontKnow || theme.surface }]}>
          <View style={[styles.languagesHeader, { borderBottomColor: theme.muted }]}>
            <Text style={[styles.languagesTitle, { color: theme.text }]}>
              {t('language.title')}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-outline" size={ms(30)} color={theme.text} />
            </TouchableOpacity>
          </View>

          {!languageLoaded ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.text }]}>
                {t('language.loading')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={languageList}
              numColumns={2}
              persistentScrollbar={true}
              keyExtractor={(item) => item.code}
              contentContainerStyle={styles.languagesList}
              renderItem={renderLanguageItem}
            />
          )}
        </ThemedCard>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  languagesOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  languagesSheet: {
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    maxHeight: '80.2%',
    paddingBottom: ms(54),
  },
  languagesHeader: {
    alignItems: 'center',
    paddingHorizontal: ms(22),
    paddingVertical: ms(14),
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: '#DDD',
  },
  languagesTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: '700',
  },
  languagesList: {
    padding: ms(10),
  },
  languagesItem: {
    flex: 1,
    margin: ms(8),
    paddingVertical: ms(16),
    borderRadius: ms(14),
    alignItems: 'center',
  },
  languagesText: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: ms(36),
  },
  loadingText: {
    marginTop: ms(14),
    fontSize: scaleFontSize(16),
  },
});

export default LanguageModal;