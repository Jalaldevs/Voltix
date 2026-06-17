import AsyncStorage from '@react-native-async-storage/async-storage';

export const BOOKMARKS_STORAGE_KEY = '@tasneem:bookmarks:v1';

const parseBookmarks = (rawValue) => {
  if (!rawValue) return [];
  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
};

const buildUniqueKey = (bookmark) => {
  if (bookmark?.source === 'quran' && bookmark?.quran) {
    return `quran:${bookmark.quran.surahId}:${bookmark.quran.ayahId}`;
  }
  if (bookmark?.source === 'sunnah' && bookmark?.sunnah) {
    return `sunnah:${bookmark.sunnah.book}:${bookmark.sunnah.hadithNumber}`;
  }
  return `${bookmark?.source || 'unknown'}:${Date.now()}`;
};

const sortByRecent = (items) => {
  return [...items].sort((a, b) => {
    const aTime = new Date(a?.createdAt || 0).getTime();
    const bTime = new Date(b?.createdAt || 0).getTime();
    return bTime - aTime;
  });
};

export const getBookmarks = async () => {
  const raw = await AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY);
  return sortByRecent(parseBookmarks(raw));
};

export const saveBookmark = async (bookmarkInput) => {
  const existing = await getBookmarks();
  const nowIso = new Date().toISOString();
  const normalized = {
    ...bookmarkInput,
    source: bookmarkInput.source,
    note: typeof bookmarkInput.note === 'string' ? bookmarkInput.note.trim() : '',
    createdAt: nowIso,
  };

  const uniqueKey = buildUniqueKey(normalized);
  const existingIndex = existing.findIndex((item) => buildUniqueKey(item) === uniqueKey);

  let nextBookmarks;
  if (existingIndex !== -1) {
    const previous = existing[existingIndex];
    const updated = {
      ...previous,
      ...normalized,
      id: previous.id,
      createdAt: nowIso,
    };
    nextBookmarks = [updated, ...existing.filter((_, index) => index !== existingIndex)];
  } else {
    const newBookmark = {
      ...normalized,
      id: `${uniqueKey}:${Date.now()}`,
    };
    nextBookmarks = [newBookmark, ...existing];
  }

  await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(nextBookmarks));
  return nextBookmarks;
};

export const removeBookmark = async (bookmarkId) => {
  const existing = await getBookmarks();
  const nextBookmarks = existing.filter((item) => item.id !== bookmarkId);
  await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(nextBookmarks));
  return nextBookmarks;
};

export const updateBookmarkNote = async (bookmarkId, note) => {
  const existing = await getBookmarks();
  const bookmarkIndex = existing.findIndex((item) => item.id === bookmarkId);
  if (bookmarkIndex === -1) return existing;

  const nextBookmarks = [...existing];
  nextBookmarks[bookmarkIndex] = {
    ...nextBookmarks[bookmarkIndex],
    note: typeof note === 'string' ? note.trim() : '',
  };

  await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(nextBookmarks));
  return sortByRecent(nextBookmarks);
};

export const groupBookmarks = (bookmarks) => {
  const grouped = {
    quran: [],
    sunnah: [],
  };

  bookmarks.forEach((bookmark) => {
    if (bookmark?.source === 'quran') {
      grouped.quran.push(bookmark);
      return;
    }
    if (bookmark?.source === 'sunnah') {
      grouped.sunnah.push(bookmark);
    }
  });

  grouped.quran = sortByRecent(grouped.quran);
  grouped.sunnah = sortByRecent(grouped.sunnah);
  return grouped;
};