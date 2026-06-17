import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';
import { setSunnahExternalEditionsDir } from './offlineContent';

const DEFAULT_PACK_NAME = 'sunnahpack';

const isAndroid = Platform.OS === 'android';
const nativeModule = NativeModules.SunnahPadModule;

const toFileUri = (path) => {
  if (!path || typeof path !== 'string') return null;
  if (path.startsWith('file://')) return path;
  return `file://${path}`;
};

const getPackName = () => {
  return Constants.expoConfig?.extra?.sunnahPadPackName || DEFAULT_PACK_NAME;
};

const shouldAutoFetch = () => {
  const value = Constants.expoConfig?.extra?.sunnahPadAutoFetch;
  return value !== false;
};

export const initializeSunnahPad = async () => {
  if (!isAndroid || !nativeModule) return { ready: false, requested: false };

  const packName = getPackName();

  try {
    const editionsDirPath = await nativeModule.getPackEditionsDir(packName);
    if (editionsDirPath) {
      await setSunnahExternalEditionsDir(toFileUri(editionsDirPath));
      return { ready: true, requested: false };
    }

    await setSunnahExternalEditionsDir(null);

    if (shouldAutoFetch()) {
      await nativeModule.requestDownload(packName);
      return { ready: false, requested: true };
    }

    return { ready: false, requested: false };
  } catch (error) {
    // Keep app usable by falling back to downloaded/bundled sources.
    await setSunnahExternalEditionsDir(null);
    return { ready: false, requested: false, error: String(error?.message || error) };
  }
};

