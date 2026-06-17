import * as FileSystem from 'expo-file-system';

const AUDIO_DIR = `${FileSystem.documentDirectory}quran_audio/`;

/**
 * Ensures the audio directory exists.
 */
export const ensureAudioDir = async () => {
  const dirInfo = await FileSystem.getInfoAsync(AUDIO_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
  }
};

/**
 * Constructs the local URI for a specific Ayah.
 */
export const getLocalAyahUri = (surahId, ayahId) => {
  return `${AUDIO_DIR}${surahId}_${ayahId}.mp3`;
};

/**
 * Checks if an Ayah is practically available locally.
 */
export const isAyahDownloaded = async (surahId, ayahId) => {
  const uri = getLocalAyahUri(surahId, ayahId);
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists;
};

/**
 * Checks if a whole Surah is downloaded by checking the first and last Ayah 
 * (simplistic check, can be refined). 
 * For accuracy, we'd check all IDs, but for the UI icon, a quick check is better.
 */
export const isSurahDownloaded = async (surahId, ayahs) => {
  if (!ayahs || ayahs.length === 0) return false;
  // Check a sample (first, middle, last) to be efficient
  const samples = [ayahs[0].id, ayahs[Math.floor(ayahs.length / 2)].id, ayahs[ayahs.length - 1].id];
  for (const id of samples) {
    const exists = await isAyahDownloaded(surahId, id);
    if (!exists) return false;
  }
  return true;
};

/**
 * Deletes all audio files for a specific Surah.
 */
export const deleteSurahAudio = async (surahId, ayahs) => {
  try {
    const deletes = ayahs.map(async (ayah) => {
      const uri = getLocalAyahUri(surahId, ayah.id);
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        await FileSystem.deleteAsync(uri, { immigrant: true }).catch(() => {});
      }
    });
    await Promise.all(deletes);
    return true;
  } catch (error) {
    console.warn(`Failed to delete surah ${surahId}:`, error);
    return false;
  }
};

/**
 * Downloads a list of Ayahs sequentially to avoid hitting API limits 
 * and reports progress.
 */
export const downloadSurah = async (surahId, ayahs, onProgress) => {
  await ensureAudioDir();
  
  let downloadedCount = 0;
  const total = ayahs.filter(a => !a.isBasmala && a.audio).length;
  
  if (total === 0) return true;

  for (const ayah of ayahs) {
    if (ayah.isBasmala || !ayah.audio) continue;
    
    const localUri = getLocalAyahUri(surahId, ayah.id);
    const info = await FileSystem.getInfoAsync(localUri);
    
    if (!info.exists) {
      try {
        await FileSystem.downloadAsync(ayah.audio, localUri);
      } catch (err) {
        console.warn(`Failed to download Ayah ${ayah.id}:`, err);
        // Continue to next anyway? Or stop? 
        // We'll continue to try others.
      }
    }
    
    downloadedCount++;
    if (onProgress) {
      onProgress(Math.floor((downloadedCount / total) * 100));
    }
  }
  
  return true;
};
