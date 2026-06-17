import { Platform } from 'react-native';

/**
 * Clean, modern card shadow that works on both iOS and Android.
 *
 * iOS  → real soft drop shadow
 * Android → elevation (looks great as long as the page background
 *            isn't also pure white — use #eef0f5 as your page bg)
 *
 * Usage:  ...CardShadow()   or   ...CardShadow(12) for stronger
 */
export const CardShadow = (elevation = 8) =>
  Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.09,
      shadowRadius: 16,
    },
    android: {
      elevation,
    },
    web: {
      boxShadow: '0 4px 20px rgba(0,0,0,0.09)',
    },
  });