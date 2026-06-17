// components/SettingsModal.jsx
import React from 'react';
import {
  View,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
  Text,
} from 'react-native';
import { Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useNavigationContext } from './NavigationContext';

const SettingsModal = ({ visible, onClose, onOptionPress }) => {
  const { colorScheme: scheme } = useNavigationContext();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;

  const settingsOptions = [
    // ... same options array as above
  ];

  if (!visible) return null;

  return (
    <Pressable 
      style={[styles.modalOverlay, { 
        backgroundColor: scheme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)'
      }]}
      onPress={onClose}
    >
      <Pressable 
        style={[styles.modalContainer, { 
          backgroundColor: theme.surface,
        }]}
        onPress={(e) => e.stopPropagation()}
      >
        {/* ... modal content ... */}
      </Pressable>
    </Pressable>
  );
};

export default SettingsModal;