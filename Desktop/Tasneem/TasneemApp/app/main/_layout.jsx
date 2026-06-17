import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Text, Dimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';

import Colors from '../constants/Colors';
import { useNavigationContext } from '../components/NavigationContext';

// Mock/Import your screens
import HomeScreen from './Home';
import QuranScreen from './Quran';
import SunnahScreen from './Sunnah';

const MemoHomeScreen = React.memo(HomeScreen);
const MemoQuranScreen = React.memo(QuranScreen);
const MemoSunnahScreen = React.memo(SunnahScreen);

import useAppTranslation from '../hooks/useAppTranslation';

const moderateScale = (size) => size;

export default function SwipePages() {
  const { colorScheme } = useNavigationContext();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;
  const { t } = useAppTranslation();
  const pagerRef = useRef(null);
  const [activeTab, setActiveTab] = useState(0);
  const pathname = usePathname();

  // This hook detects the height of the Android Navigation Bar / Gesture Pill
  const insets = useSafeAreaInsets();

  // Sync PagerView with router navigation
  useEffect(() => {
    if (!pagerRef.current) return;
    if (pathname === '/main/Quran' && activeTab !== 1) {
      pagerRef.current.setPage(1);
      setActiveTab(1);
    } else if (pathname === '/main/Sunnah' && activeTab !== 2) {
      pagerRef.current.setPage(2);
      setActiveTab(2);
    } else if (pathname === '/main/Home' && activeTab !== 0) {
      pagerRef.current.setPage(0);
      setActiveTab(0);
    }
  }, [pathname]);

  const onTabPress = (index) => {
    pagerRef.current?.setPage(index);
    setActiveTab(index);
  };

  const onPageSelected = (e) => {
    setActiveTab(e.nativeEvent.position);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        overdrag={false}
        onPageSelected={onPageSelected}
      >
        <View key="0" style={styles.page}>
          <MemoHomeScreen />
        </View>
        <View key="1" style={styles.page}>
          <MemoQuranScreen />
        </View>
        <View key="2" style={styles.page}>
          <MemoSunnahScreen />
        </View>
      </PagerView>

      {/* The Tab Bar Container */}
      <View
        style={[
          styles.tabBarContainer,
          {
            // This ensures the bar sits exactly above the system navigation bar
            // We add extra padding so it doesn't touch the very edge
            bottom: insets.bottom + 15
          }
        ]}
      >
        <View style={[styles.tabBar, { backgroundColor: theme.card || theme.surface }]}>
          <TabItem
            index={0}
            activeTab={activeTab}
            label={t('tabs.home')}
            icon="home"
            onPress={onTabPress}
            theme={theme}
            isDarkMode={isDarkMode}
          />
          <TabItem
            index={1}
            activeTab={activeTab}
            label={t('tabs.quran')}
            icon="book"
            onPress={onTabPress}
            theme={theme}
            isDarkMode={isDarkMode}
          />
          <TabItem
            index={2}
            activeTab={activeTab}
            label={t('tabs.sunnah')}
            icon="reader"
            onPress={onTabPress}
            theme={theme}
            isDarkMode={isDarkMode}
          />
        </View>
      </View>
    </View>
  );
}

const TabItem = ({ index, activeTab, label, icon, onPress, theme, isDarkMode }) => {
  const isActive = activeTab === index;
  // Use slightly lighter background when active in dark mode compared to a stark color if needed, or stick to #006aff.
  return (
    <Pressable
      style={styles.tabButton}
      onPress={() => onPress(index)}
      android_ripple={{ color: isDarkMode ? '#444' : '#ccc', borderless: true }}
    >
      <View style={[styles.iconContainer, isActive && styles.focusedBackground]}>
        <Ionicons
          name={isActive ? icon : `${icon}-outline`}
          size={moderateScale(25)}
          color={isActive ? '#fff' : (isDarkMode ? '#9ca3af' : '#7b7a7aff')}
        />
        <Text style={[styles.tabLabel, { color: isActive ? '#fff' : (isDarkMode ? '#9ca3af' : '#7b7a7aff') }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    width: '92%',
    height: moderateScale(70),
    backgroundColor: '#fff',
    borderRadius: moderateScale(35),
    paddingHorizontal: moderateScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    paddingVertical: moderateScale(9.5),
    paddingHorizontal: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(100),
    borderRadius: moderateScale(35),
    overflow: 'hidden',
  },
  focusedBackground: {
    backgroundColor: '#006aff',
  },
  tabLabel: {
    fontSize: moderateScale(12.5),
    fontWeight: '700',
    marginTop: 2,
  },
});