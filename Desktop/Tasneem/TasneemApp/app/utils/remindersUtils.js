import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Shared reminder logic between RemindersModal and Header badge.
 * Keep reminder IDs in sync with RemindersModal.
 */

const MORNING_BLOCKED = ['Maghrib', 'Isha', 'Fajr'];
const EVENING_BLOCKED = ['Dhuhr', 'Asr'];


const REMINDERS_COMPLETED_STORAGE_PREFIX = '@reminders:completed:';

// Local date key to avoid UTC shifts
export const getTodayKey = (now = new Date()) => {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const isFriday = (now = new Date()) => now.getDay() === 5;

export const getActiveReminderIds = (nextPrayerName = '') => {
  const name = nextPrayerName || '';
  const friday = isFriday();

  const ids = [];

  // Current prayer reminder (always)
  ids.push('current-prayer');

  // Always-on reminders (based on current implementation)
  ids.push('salawat');

  // Morning adhkar
  if (!MORNING_BLOCKED.includes(name)) {
    ids.push('morning');
  }

  // Evening adhkar
  if (!EVENING_BLOCKED.includes(name)) {
    ids.push('evening');
  }

  // Surah Al-Kahf (Friday + before Dhuhr)
  if (friday && name === 'Dhuhr') {
    ids.push('kahf');
  }

  // Sunnah accumulation logic:
  // If next prayer is Asr, Dhuhr has passed, so sunnahDhuhr becomes available.
  // We keep them visible for the rest of the day.
  const passedDhuhr = ['Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Fajr'].includes(name);
  const passedAsr = ['Asr', 'Maghrib', 'Isha', 'Fajr'].includes(name);
  const passedMaghrib = ['Isha', 'Fajr'].includes(name);
  const passedIsha = ['Fajr'].includes(name);

  if (passedDhuhr) ids.push('sunnahDhuhr');
  if (passedAsr) ids.push('sunnahAsr');
  if (passedMaghrib) ids.push('sunnahMaghrib');
  if (passedIsha) ids.push('sunnahIsha');

  // Fajr -> before sleeping surahs + sleeping adhkar
  if (name === 'Fajr') {
    ids.push('mulk');
    ids.push('zumar');
    ids.push('sajdah');
    ids.push('isra');
    ids.push('sleeping');
  }

  return ids;
};

export const getCompletedRemindersStorageKey = (todayKey) => {
  return `${REMINDERS_COMPLETED_STORAGE_PREFIX}${todayKey}`;
};

export const loadCompletedReminderIds = async (todayKey) => {
  const key = getCompletedRemindersStorageKey(todayKey);
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return new Set();

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x) => typeof x === 'string'));
  } catch {
    return new Set();
  }
};

export const saveCompletedReminderIds = async (todayKey, completedSet) => {
  const key = getCompletedRemindersStorageKey(todayKey);
  const arr = Array.from(completedSet);
  await AsyncStorage.setItem(key, JSON.stringify(arr));
};


