// components/CreditsModal.jsx
import React from 'react';
import {
  View,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  FlatList,
  Text,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import useAppTranslation from '../hooks/useAppTranslation';
import { moderateScale, scaleFontSize } from '../utils/responsive';

const MODERATE_FACTOR = 0.35;
const ms = (size) => moderateScale(size, MODERATE_FACTOR);

const translationCredits = [
  {
    name: "sqi-fetimehdiu-la",
    author: "Feti Mehdiu",
    language: "Albanian",
    direction: "ltr",
    source: "http://tanzil.net",
  },
  {
    name: "aze-alikhanmusayev",
    author: "Alikhan Musayev",
    language: "Azerbaijani",
    direction: "ltr",
    source: "http://tanzil.net",
  },
  {
    name: "ben-abubakrzakaria",
    author: "Abu Bakr Zakaria",
    language: "Bengali",
    direction: "ltr",
    source: "https://qurancomplex.gov.sa/",
  },
  {
    name: "bos-besimkorkut",
    author: "Besim Korkut",
    language: "Bosnian",
    direction: "ltr",
    source: "http://tanzil.net",
  },
  {
    name: "bul-tzvetantheophan",
    author: "Tzvetan Theophanov",
    language: "Bulgarian",
    direction: "ltr",
    source: "http://tanzil.net",
  },
  {
    name: "zho-majian1",
    author: "Ma Jian",
    language: "Chinese (Traditional)",
    direction: "ltr",
    source: "http://tanzil.net",
  },
  {
    name: "hrv-unknown",
    author: "Unknown",
    language: "Croatian",
    direction: "ltr",
    source: "http://donatequran.com/",
  },
  {
    name: "ces-arnykl",
    author: "A. R. Nykl",
    language: "Czech",
    direction: "ltr",
    source: "http://tanzil.net",
  },
  {
    name: "dan-vandetaal",
    author: "Van De Taal",
    language: "Danish",
    direction: "ltr",
    source: "https://www.alqurantranslation.com/",
  },
  {
    name: "nld-sofianssiregar",
    author: "Sofian S. Siregar",
    language: "Dutch",
    direction: "ltr",
    source: "http://tanzil.net",
  },
  {
    name: "eng-mustafakhattaba",
    author: "Mustafa Khattab Allah Edition",
    language: "English",
    direction: "ltr",
    source: "",
  },
  {
    name: "fil-abdullatifeduar",
    author: "Abdullatif Eduardo M. Arceo",
    language: "Filipino",
    direction: "ltr",
    source: "http://www.goodwordbooks.com/",
  },
  {
    name: "fin-unknown-la",
    author: "Unknown",
    language: "Finnish",
    direction: "ltr",
    source: "",
  },
  {
    name: "fra-islamicfoundati",
    author: "Islamic Foundation",
    language: "French",
    direction: "ltr",
    source: "https://quranenc.com/en/browse/french_montada",
  },
  {
    name: "deu-aburidamuhammad",
    author: "Abu Rida Muhammad Ibn Ahmad Ibn Rassoul",
    language: "German",
    direction: "ltr",
    source: "http://tanzil.net",
  },
  {
    name: "heb-darusalamhousei",
    author: "Darusalam House In Jerusalem",
    language: "Hebrew",
    direction: "rtl",
    source: "https://quranenc.com/en/browse/hebrew_darussalam",
  },
  {
    name: "hin-maulanaazizulha",
    author: "Maulana Azizul Haque Al Umari",
    language: "Hindi",
    direction: "ltr",
    source: "https://quranenc.com/en/browse/hindi_omari",
  },
  {
    name: "ind-kingfahdcomplex",
    author: "King Fahd Complex",
    language: "Indonesian",
    direction: "ltr",
    source: "https://quranenc.com/en/browse/indonesian_complex",
  },
  {
    name: "ita-hamzarobertopic",
    author: "Hamza Roberto Piccardo",
    language: "Italian",
    direction: "ltr",
    source: "http://tanzil.net",
  },
  {
    name: "jpn-ryoichimita",
    author: "Ryoichi Mita",
    language: "Japanese",
    direction: "ltr",
    source: "https://quranenc.com/en/browse/japanese_meta",
  },
  {
    name: "kor-hamidchoi",
    author: "Hamid Choi",
    language: "Korean",
    direction: "ltr",
    source: "https://qurancomplex.gov.sa/",
  },
  {
    name: "mkd-macedonianschol",
    author: "Macedonian Scholars",
    language: "Macedonian",
    direction: "ltr",
    source: "https://quranenc.com/en/browse/macedonian_group",
  },
  {
    name: "msa-abdullahmuhamma",
    author: "Abdullah Muhammad Basmeih",
    language: "Malay",
    direction: "ltr",
    source: "http://tanzil.net",
  },
  {
    name: "nep-ahlalhadithcent",
    author: "Ahl Al Hadith Central Society Of Nepal",
    language: "Nepali",
    direction: "ltr",
    source: "",
  },
  {
    name: "nor-einarberg",
    author: "Einar Berg",
    language: "Norwegian",
    direction: "ltr",
    source: "http://tanzil.net",
  },
  {
    name: "fas-abdolmohammaday",
    author: "Abdolmohammad Ayati",
    language: "Persian",
    direction: "rtl",
    source: "http://tanzil.net",
  },
  {
    name: "pol-jozefabielawski",
    author: "Jozefa Bielawskiego",
    language: "Polish",
    direction: "ltr",
    source: "http://tanzil.net",
  },
  {
    name: "por-helminasr",
    author: "Helmi Nasr",
    language: "Portuguese",
    direction: "ltr",
    source: "https://quranenc.com/en/browse/portuguese_nasr",
  },
  {
    name: "pus-zakariaabulsala",
    author: "Zakaria Abulsalam",
    language: "Pushto",
    direction: "rtl",
    source: "",
  },
  {
    name: "ron-georgegrigore",
    author: "George Grigore",
    language: "Romanian",
    direction: "ltr",
    source: "http://tanzil.net",
  },
  {
    name: "rus-abuadel",
    author: "Abu Adel",
    language: "Russian",
    direction: "ltr",
    source: "http://tanzil.net",
  },
  {
    name: "slk-hadiabdollahian",
    author: "Hadi Abdollahian",
    language: "Slovak",
    direction: "ltr",
    source: "https://www.alqurantranslation.com/",
  },
  {
    name: "som-abdullahhasanja",
    author: "Abdullah Hasan Jacob",
    language: "Somali",
    direction: "ltr",
    source: "https://quranenc.com/en/browse/somali_yacob",
  },
  {
    name: "spa-muhammadisagarc-la",
    author: "Muhammad Isa Garcia",
    language: "Spanish",
    direction: "ltr",
    source: "http://tanzil.net",
  },
  {
    name: "swe-knutbernstrom",
    author: "Knut Bernstrom",
    language: "Swedish",
    direction: "ltr",
    source: "http://tanzil.net",
  },
  {
    name: "tam-janturstfoundat",
    author: "Jan Turst Foundation",
    language: "Tamil",
    direction: "ltr",
    source: "http://tanzil.net",
  },
  {
    name: "tur-diyanetisleri",
    author: "Diyanet Isleri",
    language: "Turkish",
    direction: "ltr",
    source: "http://tanzil.net",
  },
  {
    name: "urd-muhammadjunagar",
    author: "Muhammad Junagarhi",
    language: "Urdu",
    direction: "rtl",
    source: "http://tanzil.net",
  },
  {
    name: "uzb-alaaudeenmansou",
    author: "Alaaudeen Mansour",
    language: "Uzbek",
    direction: "ltr",
    source: "",
  }
];

const CreditsModal = ({ visible, onClose, theme }) => {
  const { t } = useAppTranslation();

  const sourceCredits = [
    {
      id: 'quranApi',
      section: t('credits.sourceArabicText'),
      label: t('about.quranApi'),
      url: 'https://quranapi.pages.dev',
    },
    {
      id: 'quranGithub',
      section: t('credits.sourceQuranicTranslations'),
      label: t('about.quranGithub'),
      url: 'https://github.com/fawazahmed0/quran-api',
    },
    {
      id: 'tafseerSource',
      section: t('credits.sourceTafseer') || 'Qur\'an Tafseer Text',
      label: "Spa5K Tafsir API",
      url: 'https://github.com/spa5k/tafsir_api',
    },
    {
      id: 'sunnahGithub',
      section: t('about.sunnahSection'),
      label: t('about.sunnahGithub'),
      url: 'https://github.com/fawazahmed0/hadith-api',
    },
    {
      id: 'asmaUlHusna',
      section: t('credits.sourceAsmaSection'),
      label: t('credits.sourceAsmaApiLabel'),
      url: 'https://www.ummahapi.com/api/asma-ul-husna',
    },
    {
      id: 'adhanSource',
      section: t('about.adhanSection'),
      label: t('about.adhanSource'),
      url: 'https://archive.org/details/adhan.recordings.from.doha.qatar',
    },
  ];

  const combinedCredits = [
    ...sourceCredits.map((item) => ({
      name: `source-${item.id}`,
      author: item.label,
      language: item.section,
      source: item.url,
    })),
    ...translationCredits,
  ];

  const openLink = (url) => {
    if (url) {
      Linking.openURL(url).catch(() => { });
    }
  };

  const renderCreditCard = ({ item: credit }) => (
    <View
      style={[styles.creditCard, {
        backgroundColor: 'rgba(14, 165, 233, 0.09)',
        borderColor: Colors.secondary,
        borderWidth: 2,
      }]}
    >
      <View style={[styles.languageBadge, { backgroundColor: Colors.secondary }]}>
        <Text style={[styles.languageText, { color: '#FFFFFF' }]}>
          {credit.language}
        </Text>
      </View>

      <Text style={[styles.authorName, { color: theme.text }]}>
        {credit.author}
      </Text>

      {credit.source ? (
        <TouchableOpacity
          onPress={() => openLink(credit.source)}
          style={styles.sourceContainer}
        >
          <Ionicons name="link-outline" size={16} color={Colors.secondary} />
          <Text style={[styles.sourceText, { color: Colors.secondary }]} numberOfLines={1}>
            {credit.source.replace(/^https?:\/\//, '')}
          </Text>
        </TouchableOpacity>
      ) : (
        <Text style={[styles.noSource, { color: theme.muted }]}>
          {t('credits.noSourceAvailable')}
        </Text>
      )}
    </View>
  );

  const renderHeader = () => (
    <>
      <Text style={[styles.introText, { color: theme.text }]}>
        {t('credits.intro')}
      </Text>
    </>
  );

  const renderFooter = () => (
    <View style={[styles.footerSection, { borderTopColor: theme.border + '30' }]}>
      <Text style={[styles.footerText, { color: theme.muted }]}>
        {t('credits.footer')}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View
          style={[styles.modalContainer, {
            backgroundColor: theme.surface,
            shadowColor: '#666'
          }]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: theme.border + '40' }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t('credits.title')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={ms(25)} color={theme.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={combinedCredits}
            renderItem={renderCreditCard}
            keyExtractor={(item) => item.name}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            bounces={true}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '100%',
    maxHeight: '80%',
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ms(18),
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: ms(4),
  },
  listContent: {
    padding: ms(18),
  },
  introText: {
    fontSize: scaleFontSize(15),
    lineHeight: scaleFontSize(22),
    marginBottom: ms(18),
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: scaleFontSize(17),
    fontWeight: '700',
    marginBottom: ms(12),
  },
  creditCard: {
    borderRadius: ms(12),
    padding: ms(16),
    marginBottom: ms(12),
  },
  languageBadge: {
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: ms(12),
    marginBottom: ms(8),
    alignSelf: 'flex-start',
  },
  languageText: {
    fontSize: scaleFontSize(13),
    fontWeight: '600',
  },
  authorName: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    marginBottom: ms(8),
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ms(4),
    gap: ms(6),
  },
  sourceText: {
    fontSize: scaleFontSize(13),
    flex: 1,
  },
  noSource: {
    fontSize: scaleFontSize(13),
    fontStyle: 'italic',
    marginTop: ms(4),
  },
  footerSection: {
    marginTop: ms(20),
    paddingTop: ms(20),
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: scaleFontSize(14),
    lineHeight: scaleFontSize(20),
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default CreditsModal;