// gradeUtils.js — Hadith grade normalisation and display helpers

const GRADE_MAP = {
  // Sahih tier
  'sahih': 'sahih',
  'saheeh': 'sahih',
  'sahih lighairihi': 'sahih',
  'sahih li-ghairih': 'sahih',
  'hasan sahih': 'sahih',
  'sahih - agreed upon': 'sahih',
  'sahih al-isnad': 'sahih',
  'isnaduhu sahih': 'sahih',
  // Hasan tier
  'hasan': 'hasan',
  'hasan lighairihi': 'hasan',
  'hasan li-ghairih': 'hasan',
  'jayyid': 'hasan',
  'hasan sahih gharib': 'hasan',
  'hasan gharib': 'hasan',
  // Daif tier
  'daif': 'daif',
  "da'if": 'daif',
  'da`if': 'daif',
  'daeef': 'daif',
  'daif jiddan': 'daif',
  "da'if jiddan": 'daif',
  'very weak': 'daif',
  'munkar': 'daif',
  'mawdu': 'daif',
  "mawdu'": 'daif',
  'mawdoo': 'daif',
  'fabricated': 'daif',
  'weak': 'daif',
};

/**
 * Normalise a grade string to canonical: "sahih" | "hasan" | "daif" | "unknown"
 */
export const normaliseGrade = (gradeString) => {
  if (!gradeString || typeof gradeString !== 'string') return 'unknown';
  const key = gradeString.trim().toLowerCase();
  return GRADE_MAP[key] || 'unknown';
};

/**
 * Given an array of grade objects [{name, grade}], pick the best (strongest) tier.
 * Priority: sahih > hasan > daif > unknown
 */
export const getBestGrade = (grades) => {
  if (!Array.isArray(grades) || grades.length === 0) return 'unknown';
  const tiers = grades.map((g) => normaliseGrade(g?.grade));
  if (tiers.includes('sahih')) return 'sahih';
  if (tiers.includes('hasan')) return 'hasan';
  if (tiers.includes('daif')) return 'daif';
  return 'unknown';
};

const GRADE_COLORS = {
  sahih: { light: '#16a34a', dark: '#4ade80' },
  hasan: { light: '#2563eb', dark: '#60a5fa' },
  daif: { light: '#ea580c', dark: '#fb923c' },
  unknown: { light: '#6b7280', dark: '#9ca3af' },
};

/**
 * Get the hex color for a grade tier.
 */
export const getGradeColor = (tier, scheme) => {
  const mode = scheme === 'dark' ? 'dark' : 'light';
  return GRADE_COLORS[tier]?.[mode] || GRADE_COLORS.unknown[mode];
};

/**
 * Get a full pill style object for rendering a grade badge.
 */
export const getGradePillStyle = (tier, scheme) => {
  const isDark = scheme === 'dark';
  const text = getGradeColor(tier, scheme);

  const BG_MAP = {
    sahih: isDark ? 'rgba(74,222,128,0.15)' : 'rgba(22,163,74,0.1)',
    hasan: isDark ? 'rgba(96,165,250,0.15)' : 'rgba(37,99,235,0.1)',
    daif: isDark ? 'rgba(251,146,60,0.15)' : 'rgba(234,88,12,0.1)',
    unknown: isDark ? 'rgba(156,163,175,0.15)' : 'rgba(107,114,128,0.1)',
  };

  const BORDER_MAP = {
    sahih: isDark ? 'rgba(74,222,128,0.3)' : 'rgba(22,163,74,0.2)',
    hasan: isDark ? 'rgba(96,165,250,0.3)' : 'rgba(37,99,235,0.2)',
    daif: isDark ? 'rgba(251,146,60,0.3)' : 'rgba(234,88,12,0.2)',
    unknown: isDark ? 'rgba(156,163,175,0.3)' : 'rgba(107,114,128,0.2)',
  };

  return {
    bg: BG_MAP[tier] || BG_MAP.unknown,
    text,
    border: BORDER_MAP[tier] || BORDER_MAP.unknown,
  };
};

/**
 * Capitalise and display-format a grade tier.
 */
export const getGradeLabel = (tier) => {
  const labels = {
    sahih: 'Sahih',
    hasan: 'Hasan',
    daif: "Da'if",
    unknown: 'Unknown',
  };
  return labels[tier] || labels.unknown;
};
