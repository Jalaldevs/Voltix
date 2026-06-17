// Configuration mapping athkar items to their Quranic sources
export const athkarVerseConfig = {
  morning: [
    // IDs 1-15 remain as regular duas (keep these in adhkarData.js)
    // Only IDs 16-19 are Quranic verses
    {
      id: 16,
      surah: 2,
      verses: [255], // Ayat al-Kursi
      repeat: 1,
      source: "Al-Baqarah 2:255"
    },
    {
      id: 17,
      surah: 112,
      verses: [1, 2, 3, 4], // Al-Ikhlas (complete surah)
      repeat: 3,
      source: "Al-Ikhlas 112:1-4"
    },
    {
      id: 18,
      surah: 113,
      verses: [1, 2, 3, 4, 5], // Al-Falaq (complete surah)
      repeat: 3,
      source: "Al-Falaq 113:1-5"
    },
    {
      id: 19,
      surah: 114,
      verses: [1, 2, 3, 4, 5, 6], // An-Nas (complete surah)
      repeat: 3,
      source: "An-Nas 114:1-6"
    }
  ],
  evening: [
    // IDs 1-15 remain as regular duas
    // Only IDs 16-19 are Quranic verses (same as morning)
    {
      id: 16,
      surah: 2,
      verses: [255],
      repeat: 1,
      source: "Al-Baqarah 2:255"
    },
    {
      id: 17,
      surah: 112,
      verses: [1, 2, 3, 4],
      repeat: 3,
      source: "Al-Ikhlas 112:1-4"
    },
    {
      id: 18,
      surah: 113,
      verses: [1, 2, 3, 4, 5],
      repeat: 3,
      source: "Al-Falaq 113:1-5"
    },
    {
      id: 19,
      surah: 114,
      verses: [1, 2, 3, 4, 5, 6],
      repeat: 3,
      source: "An-Nas 114:1-6"
    }
  ],
  sleeping: [
    {
      id: 1,
      surah: 2,
      verses: [255], // Ayat al-Kursi
      repeat: 1,
      source: "Al-Baqarah 2:255"
    },
    {
      id: 2,
      surah: 2,
      verses: [285, 286], // Last two verses of Al-Baqarah
      repeat: 1,
      source: "Al-Baqarah 2:285-286"
    },
    {
      id: 3,
      surah: 112,
      verses: [1, 2, 3, 4],
      repeat: 3,
      source: "Al-Ikhlas 112:1-4"
    },
    {
      id: 4,
      surah: 113,
      verses: [1, 2, 3, 4, 5],
      repeat: 3,
      source: "Al-Falaq 113:1-5"
    },
    {
      id: 5,
      surah: 114,
      verses: [1, 2, 3, 4, 5, 6],
      repeat: 3,
      source: "An-Nas 114:1-6"
    }
  ]
};

// Helper to get unique surahs needed (for preloading)
export const getRequiredSurahs = () => {
  const surahs = new Set();
  
  Object.values(athkarVerseConfig).forEach(category => {
    category.forEach(item => {
      surahs.add(item.surah);
    });
  });
  
  return Array.from(surahs).sort((a, b) => a - b);
};