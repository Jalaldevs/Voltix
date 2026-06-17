// AsmaUlHusnaModal.js
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import asmaAlHusnaData from '../constants/asmaAlHusna';
import useAppTranslation from '../hooks/useAppTranslation';
import { useNavigationContext } from './NavigationContext';
import { moderateScale, scaleFontSize, width } from '../utils/responsive';

const MODERATE_FACTOR = 0.35;
const ms = (size) => moderateScale(size, MODERATE_FACTOR);

const AsmaUlHusnaModal = ({ visible, onClose }) => {
  const { colorScheme: scheme } = useNavigationContext();
  const theme = Colors[scheme] || Colors.light;
  const { t } = useAppTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNames = useMemo(() => {
    if (!searchQuery.trim()) {
      return asmaAlHusnaData.data.names;
    }

    const query = searchQuery.toLowerCase();
    return asmaAlHusnaData.data.names.filter(name =>
      name.arabic.includes(query) ||
      name.transliteration.toLowerCase().includes(query) ||
      name.number.toString().includes(query)
    );
  }, [searchQuery]);

  const renderNameCard = ({ item, index }) => (
    <View style={styles.cardWrapper}>
      <View style={[styles.nameCard, { backgroundColor: theme.surface }]}>
        <View style={[styles.numberContainer, { backgroundColor: scheme === 'dark' ? Colors.primary + '20' : Colors.primary + '10' }]}>
          <Text style={[styles.numberText, { color: Colors.primary }]}>
            {item.number.toString().padStart(2, '0')}
          </Text>
        </View>

        <View style={styles.nameContainer}>
          <Text style={[styles.arabicName, { color: theme.text }]}>
            {item.arabic}
          </Text>
        </View>

        <View style={styles.divider} />
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={[styles.modalOverlay, {
          backgroundColor: scheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)'
        }]}
        onPress={onClose}
      >
        <View
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border + '30' }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={ms(25)} color={theme.text} />
            </TouchableOpacity>

            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerArabic, { color: Colors.primary }]}>
                أسماء الله الحسنى
              </Text>
            </View>

            <View style={styles.placeholder} />
          </View>

          {/* Search Bar */}
          <View style={styles.searchWrapper}>
            <View style={[styles.searchContainer, {
              backgroundColor: scheme === 'dark' ? '#1E293B' : '#F1F5F9',
            }]}>
              <Ionicons name="search" size={18} color={theme.muted} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder={t('asmaUlHusnaUI.searchPlaceholder')}
                placeholderTextColor={theme.muted + '80'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={theme.muted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Names Grid */}
          <FlatList
            data={filteredNames}
            keyExtractor={(item) => item.number.toString()}
            renderItem={renderNameCard}
            numColumns={2}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            bounces={true}
            overScrollMode="always"
            removeClippedSubviews={false}
            maxToRenderPerBatch={10}
            windowSize={21}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={theme.muted + '40'} />
                <Text style={[styles.emptyText, { color: theme.muted }]}>
                  {t('asmaUlHusnaUI.noNamesFound')}
                </Text>
              </View>
            }
          />
          {/* Safe-area spacer: adapts to gesture nav vs 3-button nav */}
          <SafeAreaView edges={['bottom']} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: ms(22),
    borderTopRightRadius: ms(22),
    height: '86%',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(18),
    paddingVertical: ms(14),
    borderBottomWidth: 1,
  },
  closeButton: {
    width: ms(38),
    height: ms(38),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: ms(19),
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerArabic: {
    fontSize: scaleFontSize(23),
    fontWeight: '600',
    marginBottom: ms(2),
  },
  placeholder: {
    width: ms(38),
  },
  searchWrapper: {
    paddingHorizontal: ms(14),
    paddingBottom: ms(20),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(14),
    paddingVertical: ms(11),
    borderRadius: ms(28),
  },
  searchInput: {
    flex: 1,
    marginLeft: ms(8),
    fontSize: scaleFontSize(15),
    padding: 0,
  },
  listContent: {
    paddingHorizontal: ms(14),
    paddingBottom: ms(20),
    marginTop: ms(2),
  },
  row: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: (width - ms(48)) / 2,
    marginBottom: ms(12),
  },
  nameCard: {
    borderRadius: ms(18),
    padding: ms(14),
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  numberContainer: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ms(12),
  },
  numberText: {
    fontSize: scaleFontSize(14),
    fontWeight: '600',
  },
  nameContainer: {
    alignItems: 'center',
  },
  arabicName: {
    fontSize: scaleFontSize(21),
    fontWeight: '600',
    textAlign: 'center',
  },
  divider: {
    width: ms(30),
    height: ms(2),
    backgroundColor: '#E2E8F0',
    marginTop: ms(12),
    opacity: 0.3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(54),
  },
  emptyText: {
    marginTop: ms(12),
    fontSize: scaleFontSize(15),
  },
  footer: {
    paddingHorizontal: ms(18),
    paddingVertical: ms(14),
    borderTopWidth: 1,
  },
  hadith: {
    fontSize: scaleFontSize(13),
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: scaleFontSize(18),
  },
});

export default AsmaUlHusnaModal;