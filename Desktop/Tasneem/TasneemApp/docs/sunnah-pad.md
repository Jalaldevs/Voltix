# Sunnah + Play Asset Delivery (PAD)

This project is configured for PAD with a native Android asset pack named `sunnahpack`.

Runtime source priority is:
1. PAD external editions directory
2. Downloaded files (`FileSystem.documentDirectory`)
3. Bundled assets fallback (only if bundled map contains entries)

## Release flow (no Sunnah inside bundled assets)

1. Ensure local Sunnah assets exist (if needed):

```bash
npm run sync:sunnah
```

2. Move Sunnah files into Android asset pack and disable bundled map:

```bash
npm run prepare:sunnah-pad
```

This command:
- Copies editions to: `android/sunnahpack/src/main/assets/sunnah/editions`
- Rewrites `app/constants/sunnahEditionAssetMap.js` to PAD-only mode
- Removes `assets/sunnah/editions` so they are not bundled in JS assets

3. Build Android AAB:

```bash
eas build -p android --profile production
```

4. Upload AAB to Google Play Internal testing and install from Play.

## Expo Go / Dev behavior

- Expo Go does not emulate Play delivery.
- For local development fallback, regenerate bundled assets again with:

```bash
npm run sync:sunnah
```

This restores bundled map + `assets/sunnah/editions` for offline local testing.
