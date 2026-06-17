// usePremium.js — Global premium state management
//
// Provides PremiumProvider (context) and usePremium() hook.
// Premium status is verified via RevenueCat (react-native-purchases).
// Entitlement ID must match what you created in the RevenueCat dashboard.
//
// Migration from react-native-iap v14:
//   - initConnection()           → Purchases.configure()
//   - getAvailablePurchases()    → Purchases.getCustomerInfo()
//   - purchaseUpdatedListener    → Purchases.addCustomerInfoUpdateListener()
//   - requestSubscription({sku}) → Purchases.purchasePackage(package)
//   - finishTransaction()        → Automatic — RevenueCat handles this
//   - endConnection()            → Not needed
//   - AppState re-check          → Not needed — RevenueCat syncs automatically

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { Platform, Modal, Alert, View, Text, TouchableOpacity } from 'react-native';
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GetStarted from '../components/GetStarted';

// ── EXPO GO MOCK FLAG ─────────────────────────────────────────────────────────
// Set to TRUE when developing in Expo Go.
// Set to FALSE when building for Production (Development Build / EAS Build).
export const USE_MOCK_PREMIUM = false;

// ── RevenueCat config ─────────────────────────────────────────────────────────
// Replace with your actual API keys from app.revenuecat.com:
//   Android key starts with  goog_...
//   iOS key starts with      appl_...
const REVENUECAT_API_KEY = Platform.select({
  ios: 'appl_oDIRGqyhKPCFXUnhAvcidjVFqBx',
  android: 'goog_wFBhdbgYyXblylJcKqmLdOLZcYV',
});

// Must match the Entitlement identifier you created in the RevenueCat dashboard
const ENTITLEMENT_ID = 'premium';

// Kept for backward compatibility — used in GetStarted.js import
export const SUBSCRIPTION_SKU_MONTHLY = 'tasneem_premium_monthly';

// ── Context ───────────────────────────────────────────────────────────────────
const PremiumContext = createContext(null);

// ── Internal helper ───────────────────────────────────────────────────────────
// Queries RevenueCat and returns true if the 'premium' entitlement is active.
// Safe: always returns false on error, never throws.
const checkActivePurchase = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (e) {
    console.warn('[RC] checkActivePurchase error:', e);
    return false;
  }
};

// ── Mock Provider (For Expo Go) ───────────────────────────────────────────────
const MockPremiumProvider = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const pendingActionRef = useRef(null);

  // Load mock state from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem('@mock_is_premium')
      .then((val) => {
        if (val !== null) {
          setIsPremium(JSON.parse(val));
        }
      })
      .catch(() => { });
  }, []);

  const showPaywall = useCallback(() => setPaywallVisible(true), []);
  const hidePaywall = useCallback(() => {
    setPaywallVisible(false);
    pendingActionRef.current = null;
  }, []);

  const requirePremium = useCallback((action) => {
    if (isPremium) {
      action();
    } else {
      pendingActionRef.current = action;
      setPaywallVisible(true);
    }
  }, [isPremium]);

  const purchaseSubscription = useCallback(async () => {
    setIsPremium(true);
    try {
      await AsyncStorage.setItem('@mock_is_premium', JSON.stringify(true));
    } catch (_) { }
    setPaywallVisible(false);
    if (pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      setTimeout(() => action(), 300);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    setIsPremium(true);
    try {
      await AsyncStorage.setItem('@mock_is_premium', JSON.stringify(true));
    } catch (_) { }
    Alert.alert(
      'Restore Success',
      'Your premium status has been restored (Mock mode).'
    );
    setPaywallVisible(false);
  }, []);

  const toggleMockPremium = useCallback(async () => {
    const nextState = !isPremium;
    setIsPremium(nextState);
    try {
      await AsyncStorage.setItem('@mock_is_premium', JSON.stringify(nextState));
    } catch (_) { }
  }, [isPremium]);

  const value = useMemo(() => ({
    isPremium, premiumChecking: false, iapReady: true,
    paywallVisible, showPaywall, hidePaywall,
    requirePremium, purchaseSubscription, restorePurchases,
    toggleMockPremium,
    iapLoading: false,
  }), [isPremium, paywallVisible, showPaywall, hidePaywall, requirePremium, purchaseSubscription, restorePurchases, toggleMockPremium]);

  return (
    <PremiumContext.Provider value={value}>
      {children}
      {paywallVisible && (
        <Modal visible transparent animationType="slide" onRequestClose={hidePaywall}>
          <GetStarted
            onClose={hidePaywall}
            onPressGetStarted={purchaseSubscription}
            onRestore={restorePurchases}
          />
        </Modal>
      )}
      {USE_MOCK_PREMIUM && (
        <View style={{ position: 'absolute', bottom: 100, right: 16, zIndex: 99999 }}>
          <TouchableOpacity
            onPress={toggleMockPremium}
            style={{
              backgroundColor: isPremium ? '#22c55e' : '#ef4444',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 20,
              elevation: 5,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>
              Dev IAP: {isPremium ? 'Premium' : 'Free'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </PremiumContext.Provider>
  );
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const PremiumProvider = ({ children }) => {
  // If in Expo Go mode, strictly use the mock provider to avoid native crashes
  if (USE_MOCK_PREMIUM) {
    return <MockPremiumProvider>{children}</MockPremiumProvider>;
  }
  const [isPremium, setIsPremiumState] = useState(false);
  // true while we're doing the initial check with RevenueCat on app start
  const [premiumChecking, setPremiumChecking] = useState(true);
  // mirrors iapReady from the old implementation — true once configure() succeeds
  // kept so SplashController and any other consumer doesn't need changes
  const [iapReady, setIapReady] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [iapLoading, setIapLoading] = useState(false);

  const pendingActionRef = useRef(null);

  // ── Init RevenueCat + restore subscription on mount ───────────────────────
  useEffect(() => {
    let mounted = true;

    const initRC = async () => {
      try {
        // Configure RevenueCat — only needs to happen once
        Purchases.configure({ apiKey: REVENUECAT_API_KEY });

        if (mounted) setIapReady(true);

        // Restore active purchases — source of truth for premium status
        const hasActive = await checkActivePurchase();
        if (mounted) setIsPremiumState(hasActive);

        // Listen for any subscription change (new purchase, renewal, cancellation)
        // RevenueCat fires this automatically; no AppState listener needed.
        const customerInfoListener = (customerInfo) => {
          if (!mounted) return;
          const active = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
          setIsPremiumState(active);

          if (active) {
            // Purchase confirmed — close paywall and run any pending action
            setPaywallVisible(false);
            setIapLoading(false);

            if (pendingActionRef.current) {
              const action = pendingActionRef.current;
              pendingActionRef.current = null;
              setTimeout(() => action(), 300);
            }
          } else {
            // Subscription lapsed or cancelled
            setIapLoading(false);
          }
        };

        Purchases.addCustomerInfoUpdateListener(customerInfoListener);

        // Store the removal function for cleanup
        return () => {
          Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
        };
      } catch (e) {
        console.warn('[RC] init failed:', e);
        return () => { };
      } finally {
        if (mounted) setPremiumChecking(false);
      }
    };

    let cleanup = () => { };
    initRC().then((fn) => {
      if (fn) cleanup = fn;
    });

    return () => {
      mounted = false;
      cleanup();
    };
  }, []);

  // ── Paywall controls ──────────────────────────────────────────────────────

  const showPaywall = useCallback(() => {
    setPaywallVisible(true);
  }, []);

  const hidePaywall = useCallback(() => {
    setPaywallVisible(false);
    pendingActionRef.current = null;
  }, []);

  // Gate helper: if premium → run action immediately; else → show paywall.
  // Always updates pendingActionRef first to avoid stale reference on re-open.
  const requirePremium = useCallback(
    (action) => {
      pendingActionRef.current = action;
      if (isPremium) {
        pendingActionRef.current = null;
        action();
      } else {
        setPaywallVisible(true);
      }
    },
    [isPremium],
  );

  // ── Purchase ──────────────────────────────────────────────────────────────

  // Fetches the current Offering from RevenueCat and purchases the monthly package.
  // The SKU param is kept for API compatibility with GetStarted.js — it's ignored
  // because RevenueCat resolves the product through its Offering/Package system.
  const purchaseSubscription = useCallback(
    async (_sku = SUBSCRIPTION_SKU_MONTHLY) => {
      if (iapLoading || !iapReady) return;
      setIapLoading(true);
      try {
        const offerings = await Purchases.getOfferings();
        const monthlyPackage = offerings.current?.monthly;

        if (!monthlyPackage) {
          console.warn('[RC] No monthly package found in current offering');
          Alert.alert(
            'Error',
            'No premium products found. Please ensure your RevenueCat dashboard is correctly configured with offerings.'
          );
          setIapLoading(false);
          return;
        }

        // purchasePackage triggers the Google Play / App Store sheet.
        // The customerInfoListener above handles the result — no need to
        // read the return value here.
        await Purchases.purchasePackage(monthlyPackage);

        // Note: iapLoading is reset inside customerInfoListener on success,
        // or in the catch block below on failure/cancellation.
      } catch (e) {
        // RevenueCat throws with code PURCHASE_CANCELLED when user cancels —
        // that's not a real error, so we only warn instead of alerting.
        if (e?.code !== 'PURCHASE_CANCELLED') {
          console.warn('[RC] purchase failed:', e);
          Alert.alert(
            'Purchase Failed',
            e?.message || 'An unexpected error occurred during the purchase process.'
          );
        }
        setIapLoading(false);
      }
    },
    [iapLoading, iapReady],
  );

  // ── Restore purchases ─────────────────────────────────────────────────────
  // Used by a "Restore" button in settings — RevenueCat re-fetches the
  // customer's active entitlements from their servers.

  const restorePurchases = useCallback(async () => {
    setIapLoading(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      const hasActive = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setIsPremiumState(hasActive);
      if (hasActive) {
        Alert.alert(
          'Restore Success',
          'Your premium subscription has been successfully restored.'
        );
        setPaywallVisible(false);
      } else {
        Alert.alert(
          'Restore Purchases',
          'No active premium subscription was found on this App Store account.'
        );
      }
    } catch (e) {
      console.warn('[RC] restore failed:', e);
      Alert.alert(
        'Restore Failed',
        e?.message || 'An error occurred while trying to restore your purchases.'
      );
    } finally {
      setIapLoading(false);
    }
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────
  // Public API is identical to the previous react-native-iap implementation
  // so no changes are needed in Quran.js, Sunnah.js, Header.js, etc.

  const value = useMemo(
    () => ({
      isPremium,
      premiumChecking,
      iapReady,
      paywallVisible,
      showPaywall,
      hidePaywall,
      requirePremium,
      purchaseSubscription,
      restorePurchases,
      iapLoading,
      toggleMockPremium: () => { }, // No-op in real mode
    }),
    [
      isPremium,
      premiumChecking,
      iapReady,
      paywallVisible,
      showPaywall,
      hidePaywall,
      requirePremium,
      purchaseSubscription,
      restorePurchases,
      iapLoading,
    ],
  );

  return (
    <PremiumContext.Provider value={value}>
      {children}

      {/* ── GLOBAL PAYWALL — visible from any screen ── */}
      {paywallVisible && (
        <Modal
          visible={paywallVisible}
          animationType="slide"
          transparent
          onRequestClose={hidePaywall}
        >
          <GetStarted
            onClose={hidePaywall}
            onPressGetStarted={purchaseSubscription}
            onRestore={restorePurchases}
          />
        </Modal>
      )}
    </PremiumContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};

export default usePremium;