# Ultimate Implementation Plan

We now have FIVE distinct "mini plans" combined into this master implementation plan. This ensures a comprehensive update covering legal compliance, security/anti-cheat measures, user experience during loading, platform-specific premium benefits, and the return of Dark Mode as a Premium Feature.

---

## Mini Plan 1: Terms Modal Translations & Anti-Cheat Clauses

We will update the `termsModal` section in `appTranslations.js` for all **32 supported languages** to include strong legal language.

**`iapBody`**
*English Reference:* "The App offers auto-renewable subscriptions. All payments are processed securely. Subscriptions are managed entirely by the Apple App Store or Google Play Console / Store, depending on your platform. You can manage or cancel your subscription at any time through your Apple or Google Play account settings."

**`importantBody`**
*English Reference:* "By subscribing, you understand and agree that you are paying for a MONTHLY subscription with TasneemApp. You also agree that the developer reserves the right to make the app completely free in the future, or to increase or decrease the search limits at any time, without prior notice. If the app is removed from the store, you can continue renewing your subscription and being charged, but if you uninstall it even mid-subscription you will not be able to install it again."

**`legalUseBody`**
*English Reference:* "You agree not to misuse, exploit, reverse-engineer, or alter the source code of the app to bypass payment walls or limitations. Attempting to cheat the system is strictly prohibited and is considered a personal offense, a breach of trust, and a violation of these terms."

---

## Mini Plan 2: Expo Secure Store Implementation (iOS Anti-Cheat)

To penalize users who try to bypass the daily search limits by deleting the app on iOS, we will migrate the search limits from `AsyncStorage` to `expo-secure-store` (which utilizes the iOS Keychain).

### Actions:
- **Install Dependency:** `npx expo install expo-secure-store`
- **Modify `SearchModal.jsx`:** 
  - Import `* as SecureStore from 'expo-secure-store'`.
  - Replace `AsyncStorage` calls for the limit keys with `SecureStore.getItemAsync` and `SecureStore.setItemAsync`.
  - Add a fallback to `AsyncStorage` for devices that don't support SecureStore properly.

---

## Mini Plan 3: Onboarding Loading Screen

To prevent the user from seeing blank data or "---" placeholders while `Home.jsx` fetches prayer times and location data in the background, we will add a final loading state to the Onboarding flow.

### Actions:
- **Modify `GetStarted.jsx`:**
  - After the user accepts the second sheet (Permissions/Legal), instead of instantly dismissing the modal, transition to a third view.
  - This third view will display a "Loading your experience..." message alongside a blue loading bar or spinner.
  - Set a timer (e.g., 2.5 to 3 seconds) before finally calling `onClose()` to dismiss the Onboarding modal, giving `Home.jsx` enough time to render completely.

---

## Mini Plan 4: Android-Specific Free/Premium Logic

Since Android users can easily clear App Data to bypass local limits, we will shift the value proposition for Android users. General searches (Surah names, Sunnah, topics) will be completely free and unlimited. However, "Advanced/Specific Quran References" (like searching "2:255" or advanced Quran text queries) will be fully locked behind the Premium subscription. Tafseer access will remain a Premium feature.

### Actions:
- **Modify `SearchModal.jsx`:**
  - Check `Platform.OS === 'android'`.
  - If Android: General searches do not increment or check the daily limit (always allow). If the query is an advanced Quran reference search, immediately require Premium.
  - If iOS: Keep the standard 7/day limit for all searches via SecureStore.
- **Modify `appTranslations.js`:**
  - Add a new key for Android Premium Paywall strings: `androidSearchTitle: "Unlimited Quran References Searching"` (instead of the generic `searchTitle: "Unlimited premium searching"`).
  - Add translations for this new key in all 32 languages via our automated script.
- **Modify `ShopifyModal.jsx` (Premium PayWall) & `GetStarted.jsx`:**
  - Dynamically read `Platform.OS` to display the `androidSearchTitle` string on Android, and the regular `searchTitle` string on iOS.

---

## Mini Plan 5: Dark Mode Premium Feature & Fixes

We will reintroduce Dark Mode as a core Premium Feature, solving the previous technical hurdles (the splash screen flash and the Qiblah Kaaba visibility).

### Actions:
- **Fix Splash Screen "Flash":**
  - Use `expo-splash-screen`'s `preventAutoHideAsync()` in your root layout (`app/_layout.jsx`).
  - Only call `hideAsync()` *after* `NavigationContext` confirms that `themeLoaded` and `languageLoaded` are `true`. This guarantees that the UI will instantly render in Dark Mode without flashing Light Mode first.
- **Fix Qiblah Modal UI in Dark Mode:**
  - In `QiblahModal.jsx`, we will wrap the Kaaba Image in a circular `<View>` with a white background (`backgroundColor: '#ffffff', borderRadius: 100, padding: 12`) specifically when Dark Mode is active. This will make the black Kaaba icon pop perfectly against the dark background.
- **Lock Behind Premium:**
  - In `SettingsModal.jsx` (or wherever the Dark Mode toggle is exposed), we will wrap the `toggleTheme` function inside `requirePremium(() => toggleTheme())`.
  - Make sure Dark Mode is clearly listed as a feature in the `PremiumPayWall` (`ShopifyModal.jsx`).

---

## User Review Required

> [!IMPORTANT]
> The master plan now incorporates all FIVE upgrades. The Dark Mode fixes are highly effective and standard in React Native (holding the splash screen until AsyncStorage loads is the exact correct way to fix the flicker).
> 
> **Are you ready for me to start executing this 5-part plan?**
