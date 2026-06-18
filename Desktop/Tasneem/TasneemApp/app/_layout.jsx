import { Slot, usePathname, useRouter } from "expo-router";
import { Platform, Text, TextInput } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationProvider, useNavigationContext } from "./components/NavigationContext";
import { PremiumProvider } from './hooks/usePremium';
import { isOnboardingCompleted } from './utils/offlineContent';
import { initializeSunnahPad } from './utils/sunnahPad';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import usePremium from './hooks/usePremium';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync().catch(() => {
  // ignored: splash may already be prevented/hidden in some environments
});

// Configure expo-av globally (crucial for Android audio)
Audio.setAudioModeAsync({
  playsInSilentModeIOS: true,
  staysActiveInBackground: true,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false
}).catch(() => {
  // ignored on unsupported platforms
});

if (Platform.OS === 'android') {
  Text.defaultProps = {
    ...(Text.defaultProps || {}),
    allowFontScaling: false,
    maxFontSizeMultiplier: 1,
  };

  TextInput.defaultProps = {
    ...(TextInput.defaultProps || {}),
    allowFontScaling: false,
    maxFontSizeMultiplier: 1,
  };
}

// ─── Splash controller ────────────────────────────────────────────────────────
// Sits inside PremiumProvider so it can read premiumChecking.
// Hides the native splash only when BOTH onboarding check AND IAP check are done.
const MainAppWrapper = ({ children, checkingOnboarding }) => {
  const { premiumChecking } = usePremium();
  const { themeLoaded, languageLoaded } = useNavigationContext();
  const isReady = !checkingOnboarding && !premiumChecking && themeLoaded && languageLoaded;

  useEffect(() => {
    console.log(`[MainAppWrapper] State changed: checkingOnboarding=${checkingOnboarding}, premiumChecking=${premiumChecking}, themeLoaded=${themeLoaded}, languageLoaded=${languageLoaded} => isReady=${isReady}`);
    if (isReady) {
      console.log('[MainAppWrapper] App is fully ready! Hiding Native Splash Screen now.');
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady, checkingOnboarding, premiumChecking, themeLoaded, languageLoaded]);

  if (!isReady) {
    return null;
  }

  return children;
};

// ─── Root layout ──────────────────────────────────────────────────────────────
export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const router = useRouter();
  const pathname = usePathname();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const done = await isOnboardingCompleted();
        if (mounted) {
          setCompleted(done);
        }
      } finally {
        if (mounted) {
          setCheckingOnboarding(false);
        }
      }
    };

    check();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // Non-blocking: app still works through downloaded/bundled fallback
    initializeSunnahPad().catch(() => {
      // ignored on unsupported environments
    });
  }, []);

  useEffect(() => {
    if (checkingOnboarding) return;

    let mounted = true;

    const syncCompletion = async () => {
      const done = await isOnboardingCompleted();
      if (mounted) {
        setCompleted(done);
      }
    };

    syncCompletion();

    return () => {
      mounted = false;
    };
  }, [pathname, checkingOnboarding]);

  useEffect(() => {
    if (checkingOnboarding) return;

    const onOnboardingRoute = pathname === '/onboarding';
    const onCalculationMethodRoute = pathname === '/calculationMethodSelection';

    if (!completed && !onOnboardingRoute && !onCalculationMethodRoute) {
      router.replace('/onboarding');
      return;
    }

    if (completed && onOnboardingRoute) {
      router.replace('/calculationMethodSelection');
    }
  }, [checkingOnboarding, completed, pathname, router]);

  if (checkingOnboarding) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationProvider>
        <SafeAreaProvider>
          <PremiumProvider>
            {/* Controls splash and prevents flicker by waiting for theme load */}
            <MainAppWrapper checkingOnboarding={checkingOnboarding}>
              <Slot />
            </MainAppWrapper>
          </PremiumProvider>
        </SafeAreaProvider>
      </NavigationProvider>
    </QueryClientProvider>
  );
}