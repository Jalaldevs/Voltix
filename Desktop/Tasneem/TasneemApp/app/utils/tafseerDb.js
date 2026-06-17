import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { getTafseerSurahAsset } from '../constants/tafseerEditionAssetMap';

const _tafseerCache = new Map();

/**
 * Fetch Tafseer text for a given edition, surah, and ayah.
 * 
 * @param {string} edition - The translation/tafseer key (e.g. 'ar-tafseer-al-saddi')
 * @param {number} surah - The surah number (1-114)
 * @param {number} ayah - The ayah number (1-indexed)
 * @returns {Promise<string>} The Tafseer text
 */
export async function getTafseerText(edition, surah, ayah) {
  try {
    const assetGetter = getTafseerSurahAsset(edition, surah);
    if (!assetGetter) return 'Tafseer not found';
    
    const cacheKey = `${edition}_${surah}`;
    let surahData = _tafseerCache.get(cacheKey);

    if (!surahData) {
      const assetModule = assetGetter();
      if (!assetModule) return 'Tafseer not found';

      if (typeof assetModule === 'object') {
        surahData = assetModule;
      } else {
        const asset = Asset.fromModule(assetModule);
        await asset.downloadAsync();
        const uri = asset.localUri || asset.uri;
        if (!uri) return 'Tafseer not found';
        
        const fileContent = await FileSystem.readAsStringAsync(uri);
        surahData = JSON.parse(fileContent);
      }
      _tafseerCache.set(cacheKey, surahData);
    }

    if (surahData) {
      const ayahObj = surahData.find((a) => a.ayah === ayah);
      if (ayahObj && ayahObj.text) {
        return ayahObj.text;
      }
    }
    return 'Tafseer not found';
  } catch (error) {
    console.error(`Failed to load Tafseer for ${edition}:`, error);
    return 'Error loading Tafseer';
  }
}

/**
 * Loads multiple tafseers in parallel and returns their texts along with their labels.
 */
export const getMultipleTafseerTexts = async (tafseerKeys, surahId, ayahId, language) => {
  if (!tafseerKeys || tafseerKeys.length === 0) return [];
  
  // Need to import TAFSEER_LIST to get labels. Since it's in ReferenceModal which is a component,
  // we can just pass the labels or the full objects, OR find the label in constants. 
  // Wait, TAFSEER_LIST is in constants, let's just return the keys and texts, and the caller can attach labels.
  // Actually, ReferenceModal has TAFSEER_LIST, so we just return { key, text }.
  
  const promises = tafseerKeys.map(async (key) => {
    const text = await getTafseerText(key, surahId, ayahId, language);
    return { key, text };
  });

  return Promise.all(promises);
};
