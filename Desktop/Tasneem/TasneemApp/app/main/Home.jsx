import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Alert,
  Linking,
  Platform,
  Modal,
  Animated,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coordinates, PrayerTimes, CalculationMethod, Madhab, SunnahTimes } from 'adhan';
import Header from '../components/Header';
import ThemedView from '../components/ThemedView';
import Colors from '../constants/Colors';
import { Audio } from 'expo-av';
import useAppTranslation from '../hooks/useAppTranslation';
import { useNavigationContext } from '../components/NavigationContext';
import dateTranslations from '../constants/dateTranslations';
import { scaleFontSize, moderateScale } from '../utils/responsive';
import { getHijriForPrayerTimes } from '../utils/hijriDate';
import LearnModal from '../components/LearnModal';
import QiblahModal from '../components/QiblahModal';
import CalculationMethodModal from '../components/CalculationMethodModal';
import {
  detectCalculationMethod,
  getMethodDisplayName,
  CALCULATION_METHODS,
} from '../utils/calculationMethodDetector';
import { StatusBar } from 'expo-status-bar';

// ─── STORAGE KEYS ───────────────────────────────────────────────
const COORDS_KEY = '@home:coords';
const NOTIF_KEY = '@home:notifications';
const CALCULATION_METHOD_KEY = '@prayer:calculationMethod';

// ─── SOUND FILES ────────────────────────────────────────────────
const sounds = {
  Fajr: require('../../assets/sounds/fajr.mp3'),
  Sunrise: require('../../assets/sounds/beep.mp3'),
  default: require('../../assets/sounds/regular.mp3'),
};

// ─── NOTIFICATIONS HANDLER ──────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ─── HELPERS ────────────────────────────────────────────────────
const fmt = (date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

const calculatePrayerTimes = (latitude, longitude, date = new Date(), method = 'MuslimWorldLeague') => {
  const coords = new Coordinates(latitude, longitude);
  
  // Select the appropriate calculation method
  let params;
  switch (method) {
    case 'UmmAlQura':
      params = CalculationMethod.UmmAlQura();
      break;
    case 'Karachi':
      params = CalculationMethod.Karachi();
      break;
    case 'NorthAmerica':
      params = CalculationMethod.NorthAmerica();
      break;
    case 'MuslimWorldLeague':
    default:
      params = CalculationMethod.MuslimWorldLeague();
      break;
  }
  
  params.madhab = Madhab.Shafi;

  const pt = new PrayerTimes(coords, date, params);
  const sunnah = new SunnahTimes(pt);

  const { HijriDay: hijriDay, HijriMonth: hijriMonth, HijriYear: hijriYear } = getHijriForPrayerTimes(date);

  return {
    Fajr: fmt(pt.fajr), Sunrise: fmt(pt.sunrise), Dhuhr: fmt(pt.dhuhr),
    Asr: fmt(pt.asr), Maghrib: fmt(pt.maghrib), Isha: fmt(pt.isha),
    Midnight: fmt(sunnah.middleOfTheNight),
    Qiyam: fmt(sunnah.lastThirdOfTheNight),
    HijriDay: hijriDay, HijriMonth: hijriMonth, HijriYear: hijriYear,
    _raw: pt,
  };
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────
const Home = () => {
  const { colorScheme: scheme, triggerPrayerAlert, dismissPrayerAlert, registerAthanControl } =
    useNavigationContext();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const { t, language } = useAppTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const isCompactHero = screenWidth <= 380;

  // ── State ──────────────────────────────────────────────────────
  const [prayerTimes, setPrayerTimes] = useState({
    Fajr: '--', Sunrise: '--', Dhuhr: '--', Asr: '--',
    Maghrib: '--', Isha: '--', Midnight: '--', Qiyam: '--',
    HijriDay: '--', HijriMonth: '--', HijriYear: '--',
  });
  const [userCity, setUserCity] = useState('');
  const [locationGranted, setLocationGranted] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [nextPrayer, setNextPrayer] = useState({ name: '', time: '' });
  const [currentPrayer, setCurrentPrayer] = useState({ name: '', time: '' });
  const [countdown, setCountdown] = useState('--:--:--');
  const [gregorianDate, setGregorianDate] = useState('');
  const [locationModal, setLocationModal] = useState(false);
  const [showChangeLocation, setShowChangeLocation] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showQiblahModal, setShowQiblahModal] = useState(false);
  const [showLearnModal, setShowLearnModal] = useState(false);
  const [calculationMethod, setCalculationMethod] = useState('MuslimWorldLeague');
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [notifications, setNotifications] = useState({
    Fajr: true, Sunrise: true, Dhuhr: true,
    Asr: true, Maghrib: true, Isha: true, Midnight: false,
  });

  const soundRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const coordsRef = useRef(null);
  const searchTimer = useRef(null);

  const hijriCardOpacity = scrollY.interpolate({ inputRange: [0, 100], outputRange: [0, 1], extrapolate: 'clamp' });

  // ── Gregorian date ─────────────────────────────────────────────
  const updateGregorianDate = () => {
    const lang = dateTranslations[language] || dateTranslations.english;
    const now = new Date();
    setGregorianDate(
      `${lang.days[now.getDay()]}, ${now.getDate()} ${lang.months[now.getMonth()]} ${now.getFullYear()}`
    );
  };

  // ── Apply coords + persist + recalculate ──────────────────────
  const applyCoords = async (latitude, longitude, city, method = null) => {
    coordsRef.current = { latitude, longitude };
    setUserCity(city || '');
    setLocationGranted(true);
    
    // Use provided method or current state
    const activeMethod = method || calculationMethod;
    setPrayerTimes(calculatePrayerTimes(latitude, longitude, new Date(), activeMethod));
    
    await AsyncStorage.setItem(COORDS_KEY, JSON.stringify({ latitude, longitude, city }));
  };

  // ── Reverse geocode helper ─────────────────────────────────────
  const getCityFromCoords = async (lat, lon) => {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (results?.length > 0) {
        const r = results[0];
        return r.city || r.district || r.subregion || r.region || r.country || r.name || '';
      }
    } catch { }
    return '';
  };

  // ── Restore stored coords (instant, offline) ──────────────────
  const recalculateFromStoredCoords = async () => {
    try {
      const raw = await AsyncStorage.getItem(COORDS_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const lat = parseFloat(parsed.latitude);
      const lon = parseFloat(parsed.longitude);
      const validLat = Number.isFinite(lat) && lat >= -90 && lat <= 90;
      const validLon = Number.isFinite(lon) && lon >= -180 && lon <= 180;
      if (!validLat || !validLon) { await AsyncStorage.removeItem(COORDS_KEY); return false; }
      coordsRef.current = { latitude: lat, longitude: lon };
      setUserCity(parsed.city || '');
      setLocationGranted(true);
      
      let savedMethod = calculationMethod;
      try {
         const storedMethod = await AsyncStorage.getItem(CALCULATION_METHOD_KEY);
         if (storedMethod) savedMethod = storedMethod;
      } catch (e) {}

      setPrayerTimes(calculatePrayerTimes(lat, lon, new Date(), savedMethod));
      return true;
    } catch { return false; }
  };

  // ── GPS: get fresh location ────────────────────────────────────
  // silent=true → runs in background, no spinners or alerts.
  // Used on mount to fix the "returned from travel" bug — always updates
  // even when cached coords exist.
  const getUserLocationAndCalculate = async ({ silent = false } = {}) => {
    if (!silent) setLoadingLocation(true);
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted' && permission.canAskAgain) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (permission.status !== 'granted') {
        if (!silent) {
          setLocationGranted(false);
          Alert.alert(
            t('home.permissionRequired'),
            t('home.locationNeeded'),
            permission.canAskAgain
              ? [{ text: t('home.tryAgain'), onPress: () => getUserLocationAndCalculate() }]
              : [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('home.openSettings'), onPress: () => Linking.openSettings() },
              ]
          );
        }
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      const city = await getCityFromCoords(latitude, longitude);
      await applyCoords(latitude, longitude, city);
    } catch (err) {
      console.log('Location error:', err);
      if (!silent) Alert.alert(t('home.errorTitle'), t('home.locationErrorMessage'));
    } finally {
      if (!silent) setLoadingLocation(false);
    }
  };

  // ── City search by name ────────────────────────────────────────
  const handleCitySearch = (text) => {
    setCitySearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) { setSearchResults([]); return; }

    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await Location.geocodeAsync(text);
        const enriched = await Promise.all(
          results.slice(0, 6).map(async (r) => {
            const city = await getCityFromCoords(r.latitude, r.longitude);
            return { latitude: r.latitude, longitude: r.longitude, city: city || text };
          })
        );
        // Deduplicate
        const seen = new Set();
        setSearchResults(
          enriched.filter(r => { if (seen.has(r.city)) return false; seen.add(r.city); return true; })
        );
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 600);
  };

  // ── Select city from results ───────────────────────────────────
  const handleSelectCity = async ({ latitude, longitude, city }) => {
    setShowChangeLocation(false);
    setCitySearch('');
    setSearchResults([]);
    setLoadingLocation(true);
    try {
      await applyCoords(latitude, longitude, city);
    } finally {
      setLoadingLocation(false);
    }
  };

  // ── Tap on location label → open change-location sheet ────────
  const handleLocationTap = () => {
    if (loadingLocation) return;
    setShowChangeLocation(true);
  };

  const closeChangeLocation = () => {
    setShowChangeLocation(false);
    setCitySearch('');
    setSearchResults([]);
  };

  // ── Athan ──────────────────────────────────────────────────────
  const playAthan = async (prayerName) => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(sounds[prayerName] || sounds.default);
      soundRef.current = sound;
      await sound.playAsync();
    } catch (err) { console.log('Athan error:', err); }
  };

  const stopAthan = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch { }
    dismissPrayerAlert();
  };

  useEffect(() => {
    registerAthanControl(stopAthan);
    return () => registerAthanControl(null);
  }, [registerAthanControl]);

  // ── Notifications ──────────────────────────────────────────────
  const registerForNotifications = async () => {
    let perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) {
      setNotifications({ Fajr: false, Sunrise: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false, Midnight: false });
    }
  };

  const handleToggleNotification = async (name) => {
    let perm = await Notifications.getPermissionsAsync();
    if (!perm.granted && perm.canAskAgain) perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        t('home.permissionRequired'),
        t('home.notificationNeeded') || 'Please enable notifications in settings.',
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('home.openSettings'), onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }
    setNotifications(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleChangeCalculationMethod = async (newMethod) => {
    setCalculationMethod(newMethod);
    await AsyncStorage.setItem(CALCULATION_METHOD_KEY, newMethod);
    setShowMethodModal(false);
    
    // Recalculate prayer times immediately
    if (coordsRef.current) {
      setPrayerTimes(calculatePrayerTimes(
        coordsRef.current.latitude,
        coordsRef.current.longitude,
        new Date(),
        newMethod
      ));
    }
  };

  const registerAthanChannels = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('fajr-channel', {
        name: 'Fajr Athan',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'fajr.mp3',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      await Notifications.setNotificationChannelAsync('athan-channel', {
        name: 'Athan',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'regular.mp3',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  };

  const scheduleAllNotifications = async (raw) => {
    if (!raw) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      const prayerMap = {
        Fajr: raw.fajr, Sunrise: raw.sunrise, Dhuhr: raw.dhuhr,
        Asr: raw.asr, Maghrib: raw.maghrib, Isha: raw.isha,
      };
      await Promise.all(Object.entries(prayerMap).map(async ([name, date]) => {
        if (!notifications[name]) return;
        const now = new Date();
        let triggerDate = new Date(date);
        if (triggerDate <= now) triggerDate.setDate(triggerDate.getDate() + 1);

        const isFajr = name === 'Fajr';
        const isSunrise = name === 'Sunrise';

        await Notifications.scheduleNotificationAsync({
          content: {
            title: t(`home.prayers.${name.toLowerCase()}`),
            body: '',
            sound: isFajr ? 'fajr.mp3' : (isSunrise ? 'beep.mp3' : 'regular.mp3'),
            data: { prayerKey: name },
          },
          trigger: {
            type: 'date',
            date: triggerDate,
            channelId: isFajr ? 'fajr-channel' : 'athan-channel'
          },
        });
      }));
    } catch (err) { console.error('Failed to schedule notifications:', err); }
  };

  // ── Countdown ─────────────────────────────────────────────────
  const PRAYER_ICONS = {
    Fajr: 'cloudy-night', Sunrise: 'partly-sunny', Dhuhr: 'sunny',
    Asr: 'partly-sunny', Maghrib: 'cloudy-night', Isha: 'moon', Midnight: 'moon',
  };

  const updateCountdown = () => {
    if (prayerTimes.Fajr === '--') return;
    const order = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const now = new Date();

    // Find current and next prayer
    let currentFound = null;
    let nextFound = null;

    for (let i = 0; i < order.length; i++) {
      const name = order[i];
      const timeStr = prayerTimes[name];
      if (!timeStr || timeStr === '--') continue;

      const [h, m] = timeStr.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);

      if (d > now) {
        nextFound = { name, time: timeStr };
        // The current prayer is the one before this one (excluding Sunrise if we want)
        // Actually, let's find the last one that passed.
        for (let j = i - 1; j >= 0; j--) {
          const prevName = order[j];
          if (prevName === 'Sunrise') continue; // Skip sunrise as a 'prayer' name
          currentFound = { name: prevName, time: prayerTimes[prevName] };
          break;
        }
        // If no prayer passed yet today, the current is Isha from yesterday
        if (!currentFound) {
          currentFound = { name: 'Isha', time: prayerTimes.Isha };
        }
        break;
      }
    }

    if (nextFound) {
      setNextPrayer(nextFound);
      setCurrentPrayer(currentFound);
      const [h, m] = nextFound.time.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      const diff = d - now;
      setCountdown(
        `${String(Math.floor(diff / 3600000)).padStart(2, '0')}:` +
        `${String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')}:` +
        `${String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')}`
      );
    } else {
      // All today's prayers passed, next is Fajr tomorrow
      const [h, m] = prayerTimes.Fajr.split(':').map(Number);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(h, m, 0, 0);
      const diff = tomorrow - now;
      setNextPrayer({ name: 'Fajr', time: prayerTimes.Fajr });
      // Current is Isha
      setCurrentPrayer({ name: 'Isha', time: prayerTimes.Isha });
      setCountdown(
        `${String(Math.floor(diff / 3600000)).padStart(2, '0')}:` +
        `${String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')}:` +
        `${String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')}`
      );
    }
  };

  // ── Notification prefs ────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(NOTIF_KEY).then(raw => { if (raw) setNotifications(JSON.parse(raw)); });
  }, []);
  useEffect(() => {
    AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // ── On mount ──────────────────────────────────────────────────
  // Step 1: Restore cached coords immediately (instant, works offline).
  // Step 2: Always attempt a fresh GPS fix in the background.
  //         This is what fixes the "returned from travel" bug —
  //         if the user has moved, the new coords overwrite the old ones.
  useEffect(() => {
    registerForNotifications();
    registerAthanChannels();
    updateGregorianDate();
    recalculateFromStoredCoords().then(() => {
      getUserLocationAndCalculate({ silent: true });
    });
  }, []);

  useEffect(() => { updateGregorianDate(); }, [language]);

  // ── Load stored calculation method ─────────────────────────────
  useEffect(() => {
    const loadCalculationMethod = async () => {
      try {
        const stored = await AsyncStorage.getItem(CALCULATION_METHOD_KEY);
        if (stored) {
          setCalculationMethod(stored);
        }
      } catch (error) {
        console.error('Failed to load calculation method:', error);
      }
    };
    loadCalculationMethod();
  }, []);

  // ── Recalculate when calculation method changes ────────────────
  useEffect(() => {
    if (coordsRef.current) {
      setPrayerTimes(calculatePrayerTimes(
        coordsRef.current.latitude,
        coordsRef.current.longitude,
        new Date(),
        calculationMethod
      ));
    }
  }, [calculationMethod]);

  // ── Midnight recalculation ─────────────────────────────────────
  useEffect(() => {
    let timer;
    const scheduleNextMidnight = () => {
      const midnight = new Date();
      midnight.setHours(24, 0, 30, 0);
      timer = setTimeout(() => {
        if (coordsRef.current) {
          setPrayerTimes(calculatePrayerTimes(
            coordsRef.current.latitude,
            coordsRef.current.longitude,
            new Date(),
            calculationMethod
          ));
        }
        scheduleNextMidnight();
      }, midnight - new Date());
    };
    scheduleNextMidnight();
    return () => clearTimeout(timer);
  }, [calculationMethod]);

  // ── Countdown ticker ──────────────────────────────────────────
  useEffect(() => {
    if (prayerTimes.Fajr === '--') return;
    updateCountdown();
    scheduleAllNotifications(prayerTimes._raw);
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [prayerTimes, notifications]);

  // ── Notification listener ─────────────────────────────────────
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(notification => {
      const prayerKey = notification.request.content.data?.prayerKey;
      if (prayerKey === 'Sunrise') { playAthan('Sunrise'); return; }

      // Re-translate the prayer name in real-time
      const prayerName = t(`home.prayers.${prayerKey.toLowerCase()}`);
      triggerPrayerAlert(prayerName);
      playAthan(prayerKey);
    });
    return () => sub.remove();
  }, [t]); // Add 't' to dependencies

  // ── Scroll handler ────────────────────────────────────────────
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  // ── Location label ────────────────────────────────────────────
  const locationLabel = () => {
    if (loadingLocation) return t('home.gettingLocation');
    if (locationGranted) return userCity || '📍';
    return t('home.tapToAllowLocation');
  };

  // ─── UI ───────────────────────────────────────────────────────
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Header
        showShopifyIcon={false}
        showThemeToggle={true}
        showHeaderIcon={true}
        showNotificationIcon={true}
        nextPrayer={nextPrayer}
        currentPrayer={currentPrayer}
      />

      <ThemedView style={styles.container}>
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* ── Hero / Next Prayer ── */}
          <View style={styles.heroCard}>
            <Pressable onPress={handleLocationTap} style={styles.locationRow}>
              <Text style={[styles.heroLabel, { color: theme.dontKnow }]}>
                {locationLabel()}{' '}
                <Ionicons name="location-outline" size={16} color={theme.dontKnow} />
              </Text>
            </Pressable>

            <View style={[styles.heroTopRow, isCompactHero && styles.heroTopRowCompact]}>
              <View style={[styles.heroLeft, isCompactHero && styles.heroLeftCompact]}>
                {nextPrayer.name ? (
                  <Ionicons name={PRAYER_ICONS[nextPrayer.name]} size={isCompactHero ? 24 : 26} color={theme.dontKnow} />
                ) : null}
                <Text
                  style={[styles.heroPrayer, isCompactHero && styles.heroPrayerCompact, { color: theme.title }]}
                  numberOfLines={isCompactHero ? 2 : 1}
                  ellipsizeMode="tail"
                >
                  {nextPrayer.name ? t(`home.prayers.${nextPrayer.name.toLowerCase()}`) : '--'}
                </Text>
              </View>
              <Text style={[styles.heroCountdown, isCompactHero && styles.heroCountdownCompact, { color: theme.title }]}>
                {countdown}
              </Text>
            </View>

            <Text style={[styles.heroMeta, { color: theme.muted }]}>{t('home.nextPrayer')}</Text>
          </View>

          {/* ── Prayer Times ── */}
          <View style={styles.timesCard}>
            <View style={styles.prayersHeader}>
              <Text style={[styles.cardTitle, { color: theme.title }]} numberOfLines={1} ellipsizeMode="tail">{t('home.prayerTimes')}</Text>
              <View style={styles.prayersHeaderIcons}>
                <TouchableOpacity onPress={() => setShowQiblahModal(true)}>
                  <Ionicons name="compass-outline" size={22} color={'#4568dd'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowMethodModal(true)}>
                  <Ionicons name="settings-outline" size={22} color={'#4568dd'} />
                </TouchableOpacity>
              </View>
            </View>
            {[
              ['Fajr', prayerTimes.Fajr, 'cloudy-night-outline'],
              ['Sunrise', prayerTimes.Sunrise, 'partly-sunny-outline'],
              ['Dhuhr', prayerTimes.Dhuhr, 'sunny-outline'],
              ['Asr', prayerTimes.Asr, 'partly-sunny-outline'],
              ['Maghrib', prayerTimes.Maghrib, 'cloudy-night-outline'],
              ['Isha', prayerTimes.Isha, 'moon-outline'],
            ].map(([name, time, icon]) => (
              <PrayerRow
                key={name} name={name} time={time} icon={icon}
                theme={theme} enabled={notifications[name]}
                onToggle={() => handleToggleNotification(name)} t={t}
              />
            ))}
          </View>

          {/* ── Hijri Calendar ── */}
          <Animated.View style={{ opacity: hijriCardOpacity }}>
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="calendar" size={28} color={theme.dontKnow} />
                <Text style={[styles.infoTitle, { color: theme.title }]}>{t('home.hijriTitle')}</Text>
              </View>
              <View style={styles.dateContainer}>
                <Text style={[styles.hijriDate, { color: theme.title }]}>
                  {prayerTimes.HijriDay} {prayerTimes.HijriMonth} {prayerTimes.HijriYear}
                </Text>
                <Text style={[styles.gregorianDate, { color: theme.muted }]}>{gregorianDate}</Text>
              </View>
            </View>
          </Animated.View>

          {/* ── Midnight ── */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="moon" size={28} color={theme.dontKnow} />
              <Text style={[styles.infoTitle, { color: theme.title }]}>{t('home.midnightTitle')}</Text>
            </View>
            <View style={styles.timeDisplayContainer}>
              <Text style={[styles.largeTime, { color: theme.title }]}>{prayerTimes.Midnight}</Text>
            </View>
          </View>

          {/* ── Qiyam al-Layl ── */}
          <View style={[styles.infoCard, { marginBottom: 5 }]}>
            <View style={styles.infoHeader}>
              <Ionicons name="cloudy-night" size={28} color={theme.dontKnow} />
              <Text style={[styles.infoTitle, { color: theme.title }]}>{t('home.qiyamTitle')}</Text>
            </View>
            <View style={styles.timeDisplayContainer}>
              <Text style={[styles.largeTime, { color: theme.title }]}>{prayerTimes.Qiyam}</Text>
            </View>
          </View>

          <View style={{ height: 20 }} />
        </Animated.ScrollView>
      </ThemedView>

      {/* ════════════════════════════════════════════════════════
          CHANGE LOCATION MODAL
          ════════════════════════════════════════════════════════ */}
      {/*
        TODO: Manual location change UI is commented out for now.
        In the future, in sha Allah, implement a robust city search and selection system
        for accurate global prayer time calculations.
      */}

      {/* ════════════════════════════════════════════════════════
          INFO MODAL
          ════════════════════════════════════════════════════════ */}
      {locationModal && (
        <Modal animationType="slide" transparent visible={locationModal} onRequestClose={() => setLocationModal(false)}>
          <View style={styles.overlay}>
            <View style={[styles.locationContainer, { backgroundColor: theme.surface }]}>
              <View style={styles.locationHeader}>
                <Ionicons name="information-circle" size={28} color={theme.dontKnow} />
                <TouchableOpacity onPress={() => setLocationModal(false)} style={styles.locationCloseButton}>
                  <Ionicons name="close" size={28} color={theme.muted} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 }}>
                  <Text style={[styles.infoText, { color: theme.text }]}>{t('home.prayerTimesInfoBody2')}</Text>
                  <Text style={[styles.infoText, { color: theme.text, fontWeight: 'bold', marginTop: 18 }]}>{t('home.prayerTimesInfoBody4')}</Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {showLearnModal && (
        <LearnModal visible={showLearnModal} onClose={() => setShowLearnModal(false)} theme={theme} t={t} />
      )}
      {showQiblahModal && (
        <QiblahModal
          visible={showQiblahModal}
          onClose={() => setShowQiblahModal(false)}
          theme={theme}
          colorScheme={scheme}
        />
      )}
      <CalculationMethodModal
        visible={showMethodModal}
        onClose={() => setShowMethodModal(false)}
        theme={theme}
        currentMethod={calculationMethod}
        onSelectMethod={handleChangeCalculationMethod}
      />
    </>
  );
};

// ─── PRAYER ROW ─────────────────────────────────────────────────
const PrayerRow = ({ name, time, icon, theme, enabled, onToggle, t }) => (
  <View style={styles.prayerRow}>
    <View style={styles.prayerLeft}>
      <Ionicons name={icon} size={26} color={theme.icon} />
      <Text style={[styles.prayerName, { color: theme.text }]} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7}>
        {t(`home.prayers.${name.toLowerCase()}`)}
      </Text>
    </View>
    <View style={styles.prayerRight}>
      <Text style={[styles.prayerTime, { color: theme.title }]}>{time}</Text>
      <Pressable onPress={onToggle} hitSlop={10}>
        <Ionicons
          name={enabled ? 'notifications' : 'notifications-off-outline'}
          size={22}
          color={enabled ? theme.dontKnow : theme.muted}
        />
      </Pressable>
    </View>
  </View>
);

export default Home;

// ─── STYLES ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(100),
    paddingHorizontal: moderateScale(18),
  },
  heroCard: {
    borderRadius: moderateScale(34),
    paddingVertical: moderateScale(28),
    paddingHorizontal: moderateScale(28),
    marginTop: moderateScale(6),
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  heroLabel: { fontSize: scaleFontSize(14), fontWeight: 'bold', letterSpacing: 1 },
  heroTopRow: { marginTop: moderateScale(8), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: moderateScale(10) },
  heroTopRowCompact: { alignItems: 'flex-start' },
  heroLeft: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: moderateScale(10), marginRight: moderateScale(8) },
  heroLeftCompact: { marginRight: moderateScale(4) },
  heroPrayer: { fontSize: scaleFontSize(25.5), fontWeight: 'bold', flexShrink: 1 },
  heroPrayerCompact: { fontSize: scaleFontSize(23), lineHeight: scaleFontSize(27) },
  heroCountdown: {
    fontSize: scaleFontSize(33), fontWeight: '700', marginLeft: moderateScale(8), flexShrink: 0,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  heroCountdownCompact: { fontSize: scaleFontSize(30), lineHeight: scaleFontSize(34), marginLeft: moderateScale(4) },
  heroMeta: { marginTop: moderateScale(6), fontSize: scaleFontSize(14), fontWeight: 'bold' },
  timesCard: {
    borderRadius: moderateScale(34),
    paddingVertical: moderateScale(27),
    paddingHorizontal: moderateScale(32),
    marginTop: moderateScale(25),
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  cardTitle: { fontSize: scaleFontSize(18), fontWeight: 'bold', letterSpacing: 0.5, flex: 1 },
  prayerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: moderateScale(14) },
  prayerLeft: { flexDirection: 'row', alignItems: 'center', gap: moderateScale(12), flex: 1, maxWidth: '60%' },
  prayerName: { fontSize: scaleFontSize(20), fontWeight: 'bold', flexShrink: 1 },
  prayerTime: { fontSize: scaleFontSize(20), fontWeight: 'bold' },
  prayerRight: { flexDirection: 'row', alignItems: 'center', gap: moderateScale(17) },
  infoCard: {
    borderRadius: moderateScale(40),
    paddingVertical: moderateScale(28),
    paddingHorizontal: moderateScale(33),
    marginTop: moderateScale(20),
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: moderateScale(12), marginBottom: moderateScale(18) },
  infoTitle: { fontSize: scaleFontSize(20), fontWeight: 'bold', letterSpacing: 0.5 },
  dateContainer: { alignItems: 'center', paddingVertical: moderateScale(10) },
  hijriDate: { fontSize: scaleFontSize(24), fontWeight: 'bold', marginBottom: moderateScale(8), letterSpacing: 0.3 },
  gregorianDate: { fontSize: scaleFontSize(15), fontWeight: '500' },
  timeDisplayContainer: { alignItems: 'center', paddingVertical: moderateScale(10) },
  largeTime: { fontSize: scaleFontSize(42), fontWeight: 'bold', marginBottom: moderateScale(8), letterSpacing: 1 },
  prayersHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: moderateScale(15) },
  prayersHeaderIcons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: moderateScale(12) },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },

  // ── Change Location ──
  changeLocationContainer: {
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    paddingTop: moderateScale(20),
    paddingHorizontal: moderateScale(22),
    paddingBottom: moderateScale(44),
    maxHeight: '82%',
  },
  changeLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(20),
    gap: moderateScale(10),
  },
  changeLocationTitle: {
    flex: 1,
    fontSize: scaleFontSize(17),
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    borderWidth: 1.5,
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(16),
  },
  gpsButtonText: { fontSize: scaleFontSize(15), fontWeight: '600', flex: 1 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: moderateScale(18),
    gap: moderateScale(10),
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: scaleFontSize(13), fontWeight: '500' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(11),
  },
  searchInput: { flex: 1, fontSize: scaleFontSize(15), paddingVertical: 0 },
  resultsList: { marginTop: moderateScale(10), maxHeight: moderateScale(240) },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(14),
    borderBottomWidth: 1,
  },
  resultText: { fontSize: scaleFontSize(15), fontWeight: '500', flex: 1 },
  noResults: { textAlign: 'center', marginTop: moderateScale(24), fontSize: scaleFontSize(14) },

  // ── Info Modal ──
  locationContainer: {
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingHorizontal: moderateScale(12),
    paddingTop: moderateScale(20),
    maxHeight: '80%',
  },
  locationHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: moderateScale(20), paddingBottom: moderateScale(16),
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  locationCloseButton: {
    width: moderateScale(40), height: moderateScale(40),
    borderRadius: moderateScale(20), justifyContent: 'center', alignItems: 'center',
  },
  infoText: { fontSize: scaleFontSize(15), lineHeight: scaleFontSize(22), textAlign: 'center' },
  locationRow: {},
});