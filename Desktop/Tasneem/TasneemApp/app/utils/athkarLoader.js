import { athkarVerseConfig, getRequiredSurahs } from '../constants/athkarVerseConfig';
import { quranArabicMap } from '../constants/quranArabicMap';

// Cache for loaded surahs to avoid repeated file loads
const surahCache = {};

/**
 * Load a surah JSON file from assets
 * @param {number} surahNumber - The surah number (1-114)
 * @returns {Promise<Object>} The surah data
 */
const loadSurah = async (surahNumber) => {
  try {
    // Use the static map which Metro can analyze
    const surahData = quranArabicMap[surahNumber];
    if (surahData) {
      surahCache[surahNumber] = surahData;
      return surahData;
    }
    throw new Error(`Surah ${surahNumber} not found in map`);
  } catch (error) {
    console.error(`Error loading surah ${surahNumber}:`, error);
    throw new Error(`Failed to load surah ${surahNumber}`);
  }
};

/**
 * Extract specific verses from a surah
 * @param {Object} surahData - The complete surah data
 * @param {Array<number>} verseNumbers - Array of verse numbers to extract
 * @returns {string} Combined Arabic text of the verses
 */
const extractVerses = (surahData, verseNumbers) => {
  if (!surahData || !surahData.verses) {
    return '';
  }

  const verses = verseNumbers.map(verseNum => {
    const verse = surahData.verses.find(v => v.id === verseNum);
    return verse ? verse.text : '';
  }).filter(text => text !== '');

  // Join verses with newline
  return verses.join('\n');
};

/**
 * Load all athkar data for a specific type (morning/evening/sleeping)
 * Combines regular duas from adhkarData with Quranic verses from JSON files
 * @param {string} type - Type of athkar ('morning', 'evening', or 'sleeping')
 * @param {Array} regularDuas - Regular duas from adhkarData.js
 * @returns {Promise<Array>} Complete athkar list with loaded Quranic verses
 */
export const loadAthkarData = async (type, regularDuas = []) => {
  const verseConfig = athkarVerseConfig[type] || [];
  
  if (verseConfig.length === 0) {
    // If no Quranic verses configured, just return regular duas
    return regularDuas;
  }

  try {
    // Load all required surahs for this athkar type
    const surahsToLoad = [...new Set(verseConfig.map(item => item.surah))];
    const surahDataPromises = surahsToLoad.map(surahNum => loadSurah(surahNum));
    await Promise.all(surahDataPromises);

    // Build the Quranic athkar items
    const quranicAthkar = verseConfig.map(config => {
      const surahData = surahCache[config.surah];
      const arabicText = extractVerses(surahData, config.verses);

      return {
        id: config.id,
        arabic: arabicText,
        source: config.source,
        repeat: config.repeat
      };
    });

    // Combine regular duas with Quranic verses
    // For morning/evening: regular duas (1-15) + Quranic verses (16-19)
    // For sleeping: all Quranic verses (1-5)
    if (type === 'sleeping') {
      return quranicAthkar;
    } else {
      return [...regularDuas, ...quranicAthkar];
    }
  } catch (error) {
    console.error(`Error loading athkar data for ${type}:`, error);
    // Fallback to regular duas only if loading fails
    return regularDuas;
  }
};

/**
 * Preload all required surahs for better performance
 * Call this on app startup or when navigating to athkar section
 * @returns {Promise<void>}
 */
export const preloadAthkarSurahs = async () => {
  const surahsToLoad = getRequiredSurahs();

  const loadPromises = surahsToLoad.map(surahNum => loadSurah(surahNum));
  
  try {
    await Promise.all(loadPromises);
    console.log('Athkar surahs preloaded successfully');
  } catch (error) {
    console.error('Error preloading athkar surahs:', error);
  }
};

/**
 * Clear the surah cache (useful for memory management)
 */
export const clearSurahCache = () => {
  Object.keys(surahCache).forEach(key => delete surahCache[key]);
};