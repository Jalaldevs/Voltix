import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { BOOKS } from '../constants/sunnahBooks';
import { getSunnahCatalogAsset, SUNNAH_EDITION_ASSET_MAP } from '../constants/sunnahEditionAssetMap';

export const ONBOARDING_VERSION = '2';
export const ONBOARDING_VERSION_KEY = '@app:onboardingVersion';
export const APP_PERMISSIONS_KEY = '@app:permissions';
export const APP_OFFLINE_STATE_KEY = '@app:offlineState';
export const SUNNAH_EXTERNAL_EDITIONS_DIR_KEY = '@sunnah:externalEditionsDir';

export const MUSHAF_ZIP_URL = 'https://api.quranpedia.net/api-quran-png/hafs.zip';

const SUPPORTED_SUNNAH_LANGUAGE_CODES = [
  'sqi', 'aze', 'ben', 'bos', 'bul', 'zho', 'hrv', 'ces', 'dan', 'nld', 'eng',
  'tgl', 'fin', 'fra', 'deu', 'heb', 'hin', 'ind', 'ita', 'jpn', 'kor', 'mkd',
  'msa', 'nep', 'nor', 'fas', 'pol', 'por', 'pus', 'ron', 'rus', 'slk', 'som',
  'spa', 'swe', 'tur', 'urd', 'uzb', 'tam'
];

const BASE_DIR = `${FileSystem.documentDirectory}tasneem-offline/`;
const MUSHAF_DIR = `${BASE_DIR}mushaf/`;
const SUNNAH_DIR = `${BASE_DIR}sunnah/`;
const SUNNAH_EDITIONS_DIR = `${SUNNAH_DIR}editions/`;
const MUSHAF_ZIP_URI = `${MUSHAF_DIR}hafs.zip`;

const defaultPermissions = {
  location: 'pending',
  notifications: 'pending',
};

const defaultOfflineState = {
  accepted: false,
  decisionMade: false,
  mushafReady: false,
  sunnahReady: false,
  mushafFileUri: null,
  sunnahVersion: null,
  updatedAt: null,
};

const safeParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const bundledSunnahCache = new Map();

export const hasBundledSunnahAssets = () => Object.keys(SUNNAH_EDITION_ASSET_MAP).length > 0;

const ensureDir = async (dirUri) => {
  await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
};

const buildSunnahTargets = () => {
  const targets = [
    {
      remoteUrl: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions.json',
      relativePath: 'editions/editions.json',
    },
  ];

  BOOKS.forEach((book) => {
    targets.push({
      remoteUrl: `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-${book}.min.json`,
      relativePath: `editions/ara-${book}.min.json`,
    });

    SUPPORTED_SUNNAH_LANGUAGE_CODES.forEach((code) => {
      targets.push({
        remoteUrl: `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${code}-${book}.min.json`,
        relativePath: `editions/${code}-${book}.min.json`,
      });
    });
  });

  return targets;
};

const writeJsonFile = async (relativePath, rawJson) => {
  const destinationUri = `${SUNNAH_DIR}${relativePath}`;
  const directoryUri = destinationUri.substring(0, destinationUri.lastIndexOf('/') + 1);
  await ensureDir(directoryUri);
  await FileSystem.writeAsStringAsync(destinationUri, rawJson);
};

const readJsonFile = async (uri) => {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) return null;
  const content = await FileSystem.readAsStringAsync(uri);
  return safeParse(content, null);
};

const normalizeDirUri = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withScheme = trimmed.startsWith('file://') ? trimmed : `file://${trimmed}`;
  return withScheme.endsWith('/') ? withScheme : `${withScheme}/`;
};

export const setSunnahExternalEditionsDir = async (dirUri) => {
  const normalized = normalizeDirUri(dirUri);
  if (!normalized) {
    await AsyncStorage.removeItem(SUNNAH_EXTERNAL_EDITIONS_DIR_KEY);
    return null;
  }
  await AsyncStorage.setItem(SUNNAH_EXTERNAL_EDITIONS_DIR_KEY, normalized);
  return normalized;
};

export const getSunnahExternalEditionsDir = async () => {
  const raw = await AsyncStorage.getItem(SUNNAH_EXTERNAL_EDITIONS_DIR_KEY);
  return normalizeDirUri(raw);
};

const readExternalSunnahJson = async (fileName) => {
  const externalDir = await getSunnahExternalEditionsDir();
  if (!externalDir) return null;
  return readJsonFile(`${externalDir}${fileName}`);
};

export const hasExternalSunnahAssets = async () => {
  const catalog = await readExternalSunnahJson('editions.json');
  return Boolean(catalog);
};

const readBundledJsonAsset = async (assetGetter, cacheKey) => {
  if (!assetGetter || !cacheKey) return null;
  if (bundledSunnahCache.has(cacheKey)) {
    return bundledSunnahCache.get(cacheKey);
  }

  try {
    const assetModule = assetGetter();
    if (!assetModule) return null;

    // require() on .json returns parsed object directly; use it immediately.
    if (typeof assetModule === 'object') {
      bundledSunnahCache.set(cacheKey, assetModule);
      return assetModule;
    }

    const asset = Asset.fromModule(assetModule);
    await asset.downloadAsync();
    const uri = asset.localUri || asset.uri;
    if (!uri) return null;

    const content = await FileSystem.readAsStringAsync(uri);
    const parsed = safeParse(content, null);
    if (parsed) {
      bundledSunnahCache.set(cacheKey, parsed);
    }
    return parsed;
  } catch {
    return null;
  }
};

export const isOnboardingCompleted = async () => {
  const version = await AsyncStorage.getItem(ONBOARDING_VERSION_KEY);
  return version === ONBOARDING_VERSION;
};

export const markOnboardingCompleted = async () => {
  await AsyncStorage.setItem(ONBOARDING_VERSION_KEY, ONBOARDING_VERSION);
};

export const getStoredPermissions = async () => {
  const raw = await AsyncStorage.getItem(APP_PERMISSIONS_KEY);
  return { ...defaultPermissions, ...safeParse(raw, {}) };
};

export const setPermissionDecision = async (permissionKey, value) => {
  const current = await getStoredPermissions();
  const updated = { ...current, [permissionKey]: value };
  await AsyncStorage.setItem(APP_PERMISSIONS_KEY, JSON.stringify(updated));
  return updated;
};

export const requestLocationPermission = async () => {
  let result = await Location.getForegroundPermissionsAsync();
  if (result.status !== 'granted' && result.canAskAgain) {
    result = await Location.requestForegroundPermissionsAsync();
  }

  const decision = result.status === 'granted' ? 'granted' : 'denied';
  await setPermissionDecision('location', decision);
  return result;
};

export const requestNotificationsPermission = async () => {
  let result = await Notifications.getPermissionsAsync();
  if (!result.granted && result.canAskAgain) {
    result = await Notifications.requestPermissionsAsync();
  }

  const decision = result.granted ? 'granted' : 'denied';
  await setPermissionDecision('notifications', decision);
  return result;
};

export const getOfflineState = async () => {
  const raw = await AsyncStorage.getItem(APP_OFFLINE_STATE_KEY);
  const state = { ...defaultOfflineState, ...safeParse(raw, {}) };
  const externalReady = await hasExternalSunnahAssets();
  if (hasBundledSunnahAssets() || externalReady) {
    state.sunnahReady = true;
    if (!state.sunnahVersion) {
      state.sunnahVersion = externalReady ? 'external-assets-v1' : 'bundled-assets-v1';
    }
  }
  return state;
};

export const setOfflineState = async (partialState) => {
  const current = await getOfflineState();
  const updated = { ...current, ...partialState, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(APP_OFFLINE_STATE_KEY, JSON.stringify(updated));
  return updated;
};

export const downloadMushafZip = async (onProgress) => {
  await ensureDir(MUSHAF_DIR);

  const downloader = FileSystem.createDownloadResumable(
    MUSHAF_ZIP_URL,
    MUSHAF_ZIP_URI,
    {},
    (progressEvent) => {
      const total = progressEvent.totalBytesExpectedToWrite || 0;
      const written = progressEvent.totalBytesWritten || 0;
      const progress = total > 0 ? written / total : 0;
      if (onProgress) {
        onProgress({
          total,
          written,
          progress,
        });
      }
    }
  );

  const result = await downloader.downloadAsync();
  if (!result?.uri) {
    throw new Error('Failed to download Mushaf package.');
  }

  await setOfflineState({
    mushafReady: true,
    mushafFileUri: result.uri,
  });

  return result.uri;
};

export const downloadSunnahOfflineBundle = async (onProgress) => {
  await ensureDir(SUNNAH_EDITIONS_DIR);

  const targets = buildSunnahTargets();

  for (let index = 0; index < targets.length; index += 1) {
    const target = targets[index];
    const response = await fetch(target.remoteUrl);
    if (!response.ok) {
      throw new Error(`Failed to download ${target.relativePath}`);
    }

    const payload = await response.text();
    await writeJsonFile(target.relativePath, payload);

    if (onProgress) {
      onProgress({
        completed: index + 1,
        total: targets.length,
        progress: (index + 1) / targets.length,
        currentFile: target.relativePath,
      });
    }
  }

  await setOfflineState({
    sunnahReady: true,
    sunnahVersion: 'v1-supported-languages',
  });
};

export const getMushafZipUriIfExists = async () => {
  const info = await FileSystem.getInfoAsync(MUSHAF_ZIP_URI);
  return info.exists ? MUSHAF_ZIP_URI : null;
};

export const readOfflineSunnahCatalog = async () => {
  const external = await readExternalSunnahJson('editions.json');
  if (external) return external;

  const downloaded = await readJsonFile(`${SUNNAH_EDITIONS_DIR}editions.json`);
  if (downloaded) return downloaded;

  return readBundledJsonAsset(getSunnahCatalogAsset, 'catalog');
};

export const readOfflineSunnahEdition = async (editionKey) => {
  const external = await readExternalSunnahJson(`${editionKey}.min.json`);
  if (external) return external;

  const downloaded = await readJsonFile(`${SUNNAH_EDITIONS_DIR}${editionKey}.min.json`);
  if (downloaded) return downloaded;

  const bundledModule = SUNNAH_EDITION_ASSET_MAP[editionKey];
  return readBundledJsonAsset(bundledModule, editionKey);
};

export const clearOfflineSunnahContent = async () => {
  const sunnahInfo = await FileSystem.getInfoAsync(SUNNAH_DIR);
  if (sunnahInfo.exists) {
    await FileSystem.deleteAsync(SUNNAH_DIR, { idempotent: true });
  }

  await setOfflineState({
    sunnahReady: hasBundledSunnahAssets(),
    sunnahVersion: hasBundledSunnahAssets() ? 'bundled-assets-v1' : null,
  });
};

export const clearOfflineContent = async () => {
  const baseInfo = await FileSystem.getInfoAsync(BASE_DIR);
  if (baseInfo.exists) {
    await FileSystem.deleteAsync(BASE_DIR, { idempotent: true });
  }

  await setOfflineState({
    accepted: false,
    decisionMade: false,
    mushafReady: false,
    sunnahReady: hasBundledSunnahAssets(),
    mushafFileUri: null,
    sunnahVersion: hasBundledSunnahAssets() ? 'bundled-assets-v1' : null,
  });
};

export const resetOnboardingState = async () => {
  await clearOfflineContent();
  await AsyncStorage.multiRemove([
    ONBOARDING_VERSION_KEY,
    APP_PERMISSIONS_KEY,
  ]);
};

