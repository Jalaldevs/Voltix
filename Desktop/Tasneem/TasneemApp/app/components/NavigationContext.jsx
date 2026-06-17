import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { languageCodeMap } from '../constants/languageCodeMap';
import appTranslations from '../constants/appTranslations';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const audioControlRef = useRef(null);
  const athanControlRef = useRef(null);
  const [language, setLanguageState] = useState('english');
  const [languageLoaded, setLanguageLoaded] = useState(false);
  const [themeMode, setThemeModeState] = useState('light');
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [prayerAlertVisible, setPrayerAlertVisible] = useState(false);
  const [prayerAlertName, setPrayerAlertName] = useState('');
  const [bookmarkUpdateTrigger, setBookmarkUpdateTrigger] = useState(0);

  const setLanguage = useCallback(async (newLanguage) => {
    try {
      const raw = String(newLanguage || '').trim();

      // Normalize some common unicode punctuation (e.g. Oʻzbekcha vs O'zbekcha)
      const normalizedKey = raw
        .toLowerCase()
        .replace(/[’‘`´]/g, "'")
        .replace(/[ʻ]/g, "'");

      // If caller passes a valid internal code, keep it.
      let nextLanguage = appTranslations?.[normalizedKey] ? normalizedKey : null;

      // Otherwise, try mapping from display name -> code (case-insensitive).
      if (!nextLanguage) {
        const matchedDisplay = Object.keys(languageCodeMap).find((displayName) => {
          const code = languageCodeMap[displayName];
          if (typeof code !== 'string' || code !== code.toLowerCase()) return false;

          const displayNormalized = String(displayName)
            .toLowerCase()
            .replace(/[’‘`´]/g, "'")
            .replace(/[ʻ]/g, "'");

          return displayNormalized === normalizedKey;
        });

        if (matchedDisplay) {
          const mapped = languageCodeMap[matchedDisplay];
          nextLanguage = appTranslations?.[mapped] ? mapped : null;
        }
      }

      // Final fallback.
      if (!nextLanguage) nextLanguage = 'english';

      setLanguageState(nextLanguage);
      await AsyncStorage.setItem('appLanguage', nextLanguage);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  }, []);

  // Load saved language and theme on app start
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('appLanguage');
        if (savedLanguage) {
          // Normalize saved language (supports older saved display names).
          await setLanguage(savedLanguage);
        }

        const savedTheme = await AsyncStorage.getItem('appTheme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setThemeModeState(savedTheme);
        } else {
          setThemeModeState('light');
        }
      } catch (error) {
        console.log('Error loading settings:', error);
      } finally {
        setLanguageLoaded(true);
        setThemeLoaded(true);
      }
    };
    loadSettings();
  }, [setLanguage]);

  const setThemeMode = useCallback(async (mode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem('appTheme', mode);
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  }, []);

  const toggleTheme = useCallback(async () => {
    setThemeModeState(prev => {
      const nextTheme = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem('appTheme', nextTheme).catch(err => console.log('Error saving theme:', err));
      return nextTheme;
    });
  }, []);

  const colorScheme = useMemo(() => themeMode, [themeMode]);

  // Register the audio stop function from Quran component
  const registerAudioControl = useCallback((stopAudioFn) => {
    audioControlRef.current = stopAudioFn;
  }, []);

  // Call this from Header when modals open
  const stopAudio = useCallback(async () => {
    if (audioControlRef.current) {
      await audioControlRef.current();
    }
  }, []);

  const registerAthanControl = useCallback((stopAthanFn) => {
    athanControlRef.current = stopAthanFn;
  }, []);

  const stopAthanAudio = useCallback(async () => {
    if (athanControlRef.current) {
      await athanControlRef.current();
    }
  }, []);

  const triggerPrayerAlert = useCallback((prayerName) => {
    setPrayerAlertName(prayerName || '');
    setPrayerAlertVisible(true);
  }, []);

  const dismissPrayerAlert = useCallback(() => {
    setPrayerAlertVisible(false);
  }, []);

  const triggerBookmarkUpdate = useCallback(() => {
    setBookmarkUpdateTrigger(prev => prev + 1);
  }, []);

  return (
    <NavigationContext.Provider 
      value={{ 
        registerAudioControl,
        stopAudio,
        registerAthanControl,
        stopAthanAudio,
        prayerAlertVisible,
        prayerAlertName,
        triggerPrayerAlert,
        dismissPrayerAlert,
        bookmarkUpdateTrigger,
        triggerBookmarkUpdate,
        language,
        setLanguage,
        languageLoaded,
        themeMode,
        setThemeMode,
        toggleTheme,
        colorScheme,
        themeLoaded
      }}
    >
        {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationContext must be used within NavigationProvider');
  }
  return context;
};

