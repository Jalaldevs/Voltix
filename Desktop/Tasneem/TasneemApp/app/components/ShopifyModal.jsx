import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Dimensions,
  Platform,
  ScrollView,
  Image,
  Linking,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAppTranslation from '../hooks/useAppTranslation';
import { useNavigationContext } from './NavigationContext';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');
const numColumns = 2;
const cardWidth = (width - 48) / numColumns;

const PRODUCTOS = [
  {
    id: 1,
    nameKey: 'shop.products.classicWhiteThobe.name',
    precio: '$22.99',
    descriptionKey: 'shop.products.classicWhiteThobe.description',
    imagen: 'https://via.placeholder.com/300/ffffff/000000?text=White+Thobe',
    shopifyUrl: 'https://www.shopify.com/',
  },
  {
    id: 2,
    nameKey: 'shop.products.blackElegantThobe.name',
    precio: '$22.99',
    descriptionKey: 'shop.products.blackElegantThobe.description',
    imagen: 'https://via.placeholder.com/300/000000/ffffff?text=Black+Thobe',
    shopifyUrl: 'https://www.shopify.com/',
  },
  {
    id: 3,
    nameKey: 'shop.products.navyBlueThobe.name',
    precio: '$18.99',
    descriptionKey: 'shop.products.navyBlueThobe.description',
    imagen: 'https://via.placeholder.com/300/000080/ffffff?text=Navy+Thobe',
    shopifyUrl: 'https://www.shopify.com/',
  },
  {
    id: 4,
    nameKey: 'shop.products.beigeSummerThobe.name',
    precio: '$14.99',
    descriptionKey: 'shop.products.beigeSummerThobe.description',
    imagen: 'https://via.placeholder.com/300/f5f5dc/000000?text=Beige+Thobe',
    shopifyUrl: 'https://www.shopify.com/',
  },
  {
    id: 5,
    nameKey: 'shop.products.greyClassicThobe.name',
    precio: '$14.99',
    descriptionKey: 'shop.products.greyClassicThobe.description',
    imagen: 'https://via.placeholder.com/300/808080/ffffff?text=Grey+Thobe',
    shopifyUrl: 'https://www.shopify.com/',
  },
  {
    id: 6,
    nameKey: 'shop.products.classicWhiteThobe.name',
    precio: '$14.99',
    descriptionKey: 'shop.products.classicWhiteThobe.description',
    imagen: 'https://via.placeholder.com/300/ffffff/000000?text=White+Thobe',
    shopifyUrl: 'https://www.shopify.com/',
  }
];

// ─── Shopify Modal (Thobes Store) ────────────────────────────
const ShopifyModal = ({ visible, onClose }) => {
  const { t } = useAppTranslation();
  const { colorScheme } = useNavigationContext();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 70, friction: 13, useNativeDriver: true }),
    ]).start();
    loopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loopRef.current.start();
    return () => loopRef.current?.stop();
  }, [visible]);

  const shimmerX = shimmerAnim.interpolate({
    inputRange: [0, 1], outputRange: [-width * 0.5, width * 1.5],
  });

  const handleBuyPress = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert(t('shop.linkOpenFailedTitle'), t('shop.linkOpenFailedBody'));
    });
  };

  const renderProductCard = (item) => {
    return (
      <View key={item.id} style={styles.productCardContainer}>
        <View style={[styles.productCard, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? 'rgba(96,165,250,0.15)' : 'rgba(27,131,222,0.15)' }]}>
          {/* Imagen del producto con shimmer */}
          <View style={[styles.productImageContainer, { backgroundColor: isDarkMode ? '#0f172a' : '#f0f5ff' }]}>
            <Image source={{ uri: item.imagen }} style={styles.productImage} />
            <LinearGradient
              colors={['transparent', isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)']}
              style={StyleSheet.absoluteFill}
            />
            <Animated.View style={[styles.productShimmer, { transform: [{ translateX: shimmerX }] }]} pointerEvents="none">
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.2)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            {/* Badge de precio */}
            <View style={styles.priceBadge}>
              <LinearGradient
                colors={isDarkMode ? ['#2563eb', '#3b82f6'] : ['#1e4f78', '#1b83de']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.priceBadgeGradient}
              >
                <Text style={styles.priceText}>{item.precio}</Text>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.productInfo}>
            <Text style={[styles.productName, { color: isDarkMode ? '#f8fafc' : '#0d1a2e' }]} numberOfLines={1}>
              {t(item.nameKey)}
            </Text>
            <Text style={[styles.productDescription, { color: isDarkMode ? 'rgba(148,163,184,0.8)' : 'rgba(27,80,140,0.7)' }]} numberOfLines={2}>
              {t(item.descriptionKey)}
            </Text>
          </View>

          {/* Botón Ver en Shopify - SIEMPRE VISIBLE */}
          <TouchableOpacity
            style={styles.buyButton}
            onPress={() => handleBuyPress(item.shopifyUrl)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isDarkMode ? ['#2563eb', '#3b82f6'] : ['#1e4f78', '#1b83de']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buyButtonGradient}
            >
              <FontAwesome5 name="shopify" size={16} color="#fff" />
              <Text style={styles.buyButtonText}>{t('shop.viewOnShopify')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.fullScreenContainer, { backgroundColor: isDarkMode ? theme.background : '#f0f5ff' }]}>
        <LinearGradient
          colors={isDarkMode ? ['#0f172a', '#1e293b', '#0f172a', '#020617'] : ['#f0f5ff', '#f5f8ff', '#f8faff', '#ffffff']}
          locations={[0, 0.3, 0.65, 1]}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View style={[
          styles.fullScreenContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}>
          {/* Header */}
          <View style={[styles.fullScreenHeader, { 
            backgroundColor: isDarkMode ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.8)',
            borderBottomColor: isDarkMode ? 'rgba(96,165,250,0.1)' : 'rgba(27,131,222,0.1)' 
          }]}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.headerCloseButton, { backgroundColor: isDarkMode ? 'rgba(96,165,250,0.1)' : 'rgba(27,131,222,0.1)' }]}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              >
                <Ionicons name="close" size={24} color={isDarkMode ? '#60a5fa' : "#1b83de"} />
              </TouchableOpacity>
            </View>

            <View style={styles.headerCenter}>
              <View style={styles.headerIconWrapper}>
                <LinearGradient
                  colors={isDarkMode ? ['#1e40af', '#3b82f6', '#60a5fa'] : ['#2d5f8a', '#1b83de', '#4a85b5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.headerIconGradient}
                >
                  <MaterialCommunityIcons name="hanger" size={28} color="#fff" />
                </LinearGradient>
              </View>
            </View>

            <View style={styles.headerRight}>
              <View style={[styles.headerBadge, { 
                backgroundColor: isDarkMode ? 'rgba(96,165,250,0.1)' : 'rgba(27,131,222,0.1)',
                borderColor: isDarkMode ? 'rgba(96,165,250,0.2)' : 'rgba(27,131,222,0.2)'
              }]}>
                <MaterialCommunityIcons name="tag-outline" size={12} color={isDarkMode ? '#60a5fa' : "#1b83de"} />
              </View>
            </View>
          </View>

          {/* Grid de productos */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContainer}
          >
            <View style={[styles.welcomeNote, { 
              backgroundColor: isDarkMode ? 'rgba(96,165,250,0.08)' : 'rgba(27,131,222,0.08)',
              borderColor: isDarkMode ? 'rgba(96,165,250,0.15)' : 'rgba(27,131,222,0.15)' 
            }]}>
              <MaterialCommunityIcons name="star-four-points" size={16} color={isDarkMode ? '#60a5fa' : "#1b83de"} />
              <Text style={[styles.welcomeNoteText, { color: isDarkMode ? '#60a5fa' : "#1b83de" }]}>
                {t('shop.welcomeNote')}
              </Text>
            </View>

            <View style={styles.productsGrid}>
              {PRODUCTOS.map((item) => renderProductCard(item))}
            </View>

            {/* Espacio inferior */}
            <View style={{ height: 20 }} />
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
  },
  fullScreenContent: {
    flex: 1,
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    backdropFilter: 'blur(10px)',
    zIndex: 10,
  },
  headerLeft: {
    width: 60,
    alignItems: 'flex-start',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
  },
  headerCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconWrapper: {
    marginBottom: 4,
    shadowColor: '#1b83de',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  welcomeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    alignSelf: 'center',
    borderWidth: 1,
  },
  welcomeNoteText: {
    fontSize: 13,
    fontWeight: '500',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCardContainer: {
    width: cardWidth,
    marginBottom: 16,
  },
  productCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#1b83de',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  productImageContainer: {
    width: '100%',
    height: cardWidth,
    position: 'relative',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productShimmer: {
    ...StyleSheet.absoluteFillObject,
    width: width * 0.4,
  },
  priceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  priceBadgeGradient: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priceText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 11,
    lineHeight: 14,
  },
  buyButton: {
    marginHorizontal: 12,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  buyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default ShopifyModal;