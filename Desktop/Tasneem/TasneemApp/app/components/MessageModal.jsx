// MessageModal.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as MailComposer from 'expo-mail-composer';
import Colors from '../constants/Colors';
import useAppTranslation from '../hooks/useAppTranslation';
import { useNavigationContext } from './NavigationContext';
import { moderateScale, scaleFontSize } from '../utils/responsive';

const MODERATE_FACTOR = 0.35;
const ms = (size) => moderateScale(size, MODERATE_FACTOR);
const SEND_BUTTON_DARK_BLUE = '#48e';

const MessageModal = ({ visible, onClose, theme }) => {
  const { t } = useAppTranslation();
  const { colorScheme: scheme } = useNavigationContext();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('issue');
  const [isSending, setIsSending] = useState(false);
  
  // Use the theme from Colors if not provided
  const activeTheme = theme || (scheme === 'dark' ? Colors.dark : Colors.light);

  const categories = [
    { id: 'issue', label: t('message.categories.issue'), icon: 'warning-outline', color: '#ef4444' },
    { id: 'feedback', label: t('message.categories.feedback'), icon: 'chatbubble-outline', color: '#3b82f6' },
    { id: 'hire', label: t('message.categories.hire'), icon: 'briefcase-outline', color: '#10b981' },
    { id: 'other', label: t('message.categories.other'), icon: 'ellipsis-horizontal-circle-outline', color: '#8b5cf6' },
  ];

  // Safe theme values with defaults to ensure visibility
  const textColor = activeTheme?.text ?? '#000000';
  const surfaceColor = activeTheme?.surface ?? '#FFFFFF';
  const cardColor = activeTheme?.card ?? activeTheme?.surface ?? '#F5F5F5';
  const borderColor = activeTheme?.border ? `${activeTheme.border}40` : '#CCCCCC';
  const mutedColor = activeTheme?.muted ?? '#888888';
  
  // Debug log to check if modal is being triggered
  useEffect(() => {
    if (visible) {
      console.log('MessageModal opened');
    }
  }, [visible]);

  const resetForm = () => {
    setSubject('');
    setMessage('');
    setCategory('issue');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const sendEmail = async () => {
    if (!message.trim()) {
      Alert.alert(t('message.errors.errorTitle'), t('message.errors.emptyMessage'));
      return;
    }

    setIsSending(true);

    try {
      const categoryLabel = categories.find(c => c.id === category)?.label || t('message.categories.other');
      const emailSubject = subject.trim() 
        ? `[${categoryLabel}] ${subject}` 
        : `[${categoryLabel}] ${t('message.emailSubjectDefault')}`;
      
      const emailBody = `
    ${t('message.emailCategoryLabel')} ${categoryLabel}

    ${t('message.emailMessageLabel')}
    ${message.trim()}

    ---
    ${t('message.emailFooter')}
      `;

      const isAvailable = await MailComposer.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert(
          t('message.errors.emailNotAvailableTitle'),
          t('message.errors.emailNotAvailable')
        );
        setIsSending(false);
        return;
      }

      await MailComposer.composeAsync({
        recipients: ['voiceofjalal@gmail.com'],
        subject: emailSubject,
        body: emailBody,
      });
      
      handleClose();
    } catch (error) {
      Alert.alert(
        t('message.errors.errorTitle'),
        t('message.errors.sendFailed')
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <Pressable 
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
        />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalWrapper}
        >
          <View 
            style={[styles.modalContainer, { 
              backgroundColor: surfaceColor,
            }]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>{t('message.title')}</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={ms(25)} color={textColor} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalContent}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <Text style={[styles.label, { color: textColor }]}>{t('message.categoryLabel')}</Text>
              <View style={styles.categoriesContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryButton,
                      { 
                        backgroundColor: category === cat.id ? cat.color + '20' : 'transparent',
                        borderColor: category === cat.id ? cat.color : borderColor,
                      }
                    ]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Ionicons 
                      name={cat.icon} 
                      size={ms(18)} 
                      color={category === cat.id ? cat.color : mutedColor} 
                    />
                    <Text 
                      style={[
                        styles.categoryText, 
                        { color: category === cat.id ? cat.color : mutedColor }
                      ]}
                      numberOfLines={2}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: textColor, marginTop: ms(18) }]}>
                {t('message.subjectLabel')}
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: cardColor,
                  color: textColor,
                  borderColor: borderColor,
                }]}
                placeholder={t('message.subjectPlaceholder')}
                placeholderTextColor={mutedColor}
                value={subject}
                onChangeText={setSubject}
                maxLength={100}
              />

              <Text style={[styles.label, { color: textColor, marginTop: ms(18) }]}>
                {t('message.messageLabel')} <Text style={{ color: '#ef4444' }}>*</Text>
              </Text>
              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: cardColor,
                  color: textColor,
                  borderColor: borderColor,
                }]}
                placeholder={t('message.messagePlaceholder')}
                placeholderTextColor={mutedColor}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={2000}
              />

              <View style={styles.charCount}>
                <Text style={{ color: mutedColor, fontSize: scaleFontSize(12) }}>
                  {message.length}/2000
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: SEND_BUTTON_DARK_BLUE },
                  (!message.trim() || isSending) && styles.sendButtonDisabled
                ]}
                onPress={sendEmail}
                disabled={!message.trim() || isSending}
                activeOpacity={1}
              >
                {isSending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="mail" size={ms(18)} color="#fff" />
                    <Text style={styles.sendButtonText}>{t('message.sendButton')}</Text>
                  </>
                )}
              </TouchableOpacity>
              
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'flex-end',
},
modalWrapper: {
  width: '100%',
  height: '82%',
},
modalContainer: {
  flex: 1,
  borderTopLeftRadius: ms(22),
  borderTopRightRadius: ms(22),
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  overflow: 'hidden',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.3,
  shadowRadius: 20,
  elevation: 10,
},
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ms(22),
    paddingVertical: ms(18),
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: '700',
  },
  closeButton: {
    padding: ms(4),
    borderRadius: ms(18),
  },
  modalContent: {
    flex: 1,
  },
  scrollContent: {
    padding: ms(22),
    paddingBottom: ms(36),
  },
  label: {
    fontSize: scaleFontSize(16),
    fontWeight: '600',
    marginBottom: ms(10),
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(10),
    marginBottom: ms(10),
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(12),
    paddingVertical: ms(10),
    borderRadius: ms(18),
    borderWidth: 1,
    gap: ms(6),
    minWidth: '45%',
    maxWidth: '48%',
  },
  categoryText: {
    fontSize: scaleFontSize(13),
    fontWeight: '500',
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: ms(14),
    paddingVertical: ms(11),
    fontSize: scaleFontSize(16),
  },
  textArea: {
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: ms(14),
    paddingVertical: ms(11),
    fontSize: scaleFontSize(16),
    minHeight: ms(114),
    maxHeight: ms(190),
  },
  charCount: {
    alignItems: 'flex-end',
    marginTop: ms(4),
    marginBottom: ms(18),
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(14),
    borderRadius: ms(12),
    gap: ms(8),
    marginTop: ms(10),
  },
  sendButtonDisabled: {
    backgroundColor: '#48e',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: scaleFontSize(16),
    fontWeight: '600',
  },
  note: {
    fontSize: scaleFontSize(12),
    textAlign: 'center',
    marginTop: ms(14),
    lineHeight: scaleFontSize(18),
  },
});

export default MessageModal;