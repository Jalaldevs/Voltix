import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAppTranslation from '../hooks/useAppTranslation';

const TermsModal = ({ visible, onClose, content }) => {
  const { t } = useAppTranslation();
  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f5ff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('terms.title')}</Text>
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.text}>{content}</Text>
      </ScrollView>
    </Modal>
  );
};

export default TermsModal;

const styles = StyleSheet.create({
  header: { flexDirection:'row', alignItems:'center', paddingTop: Platform.OS==='ios'?56:40, paddingHorizontal:20 },
  closeBtn: { marginRight:12 },
  title: { fontSize:20, fontWeight:'700' },
  content: { padding:20 },
  text: { fontSize:14, lineHeight:22, color:'#333' },
});