# TasneemApp Testing Plan

This document outlines all the new features and logic changes that need to be tested. You can use this as a checklist once the Ultimate Implementation Plan is fully executed.

---

## 1. Feature: Search Inside ReferenceModal
*(This is the feature we built right before the Ultimate Plan)*
- [ ] **UI Check:** Open the `ReferenceModal` (Tafseer view). Verify there is a new Search outline button visible inside both the `TafseerPickerSheet` (when choosing a Tafseer) and the `TafseerContentSheet` (when reading the Tafseer).
- [ ] **Functionality:** Tap the Search button. The `SearchModal` should open smoothly without closing the `ReferenceModal`.
- [ ] **Result Action:** Perform a search and tap on a result. Verify that it navigates to the correct Surah/Ayah and that the UI handles the transition properly.

---

## 2. Feature: Terms & Legal Translations (32 Languages)
- [ ] **Language Switching:** Go to settings and switch between a few drastically different languages (e.g., English, Arabic, Spanish, Urdu).
- [ ] **Terms Verification:** Open the Terms modal / Onboarding Legal sheet. Verify that the new anti-cheat clause, the monthly subscription mention, and the Android vs iOS differences clause appear correctly translated without breaking the UI.

---

## 3. Feature: Onboarding Loading Screen
- [ ] **Flow Check:** Uninstall or clear app data to trigger Onboarding.
- [ ] **Loading UI:** Accept the permissions/legal sheets. Verify that a third sheet appears saying "Loading your experience..." with a blue loading bar.
- [ ] **Transition:** Wait ~3 seconds. Ensure the modal closes automatically and the `Home.jsx` screen behind it is fully loaded (no "---" placeholders for prayer times).

---

## 4. Feature: iOS Secure Store (Limit Protection)
*(Requires testing on a physical iPhone or iOS Simulator)*
- [ ] **Consume Searches:** Do 7 searches (or whatever the limit is) until the Paywall appears.
- [ ] **The "Cheat" Test:** Delete the app completely from the iPhone and reinstall it.
- [ ] **Persistence:** Try to search again. The Paywall should appear immediately. *SecureStore should remember that the user exhausted their limit.*

---

## 5. Feature: Android Free/Premium Split Logic
*(Requires testing on a physical Android device or Android Emulator)*
- [ ] **General Searches (Free):** Search for a Surah name, a topic, or a Sunnah hadith. Verify that it works instantly and *does not* show a limit or reduce any counter.
- [ ] **Quran Reference (Premium):** Type a specific reference like `2:255` or an advanced Quran search. Hit search. Verify that the Premium Paywall appears instantly.
- [ ] **Paywall Text:** Check the Premium Paywall and GetStarted screens on Android. Verify the text specifically highlights "Unlimited Quran References Searching" (instead of the generic iOS text).

---

## 6. Feature: Dark Mode Premium & UI Fixes
- [ ] **Premium Lock:** Go to settings. Try to toggle Dark Mode as a free user. It should show the Premium Paywall.
- [ ] **Splash Screen (No Flash):** Activate Dark Mode (as Premium). Close the app completely and reopen it. Verify there is **no sudden white flash** before the Dark Mode loads. The splash screen should seamlessly transition into the Dark app.
- [ ] **Qiblah Modal (Kaaba):** Open the Qiblah compass in Dark Mode. Verify that the black Kaaba icon is perfectly visible, surrounded by a white circular background/halo.
