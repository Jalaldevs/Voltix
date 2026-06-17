/**
 * Hijri Date Utility
 * Uses Intl.DateTimeFormat with Islamic calendar when available (iOS, modern Android),
 * falls back to a mathematical tabular conversion on Hermes (Android without full ICU).
 * Accurate to within ±1–2 days of actual moon sighting.
 */

const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Ula',
  'Jumada al-Akhirah',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qi'dah",
  'Dhu al-Hijjah',
];

/**
 * Convert Gregorian to Hijri using the tabular Islamic calendar.
 * Used as a fallback when Intl.DateTimeFormat doesn't support islamic-umalqura.
 */
const gregorianToHijri = (gy, gm, gd) => {
  const jd1 = Math.floor((1461 * (gy + 4800 + Math.floor((gm - 14) / 12))) / 4);
  const jd2 = Math.floor((367 * (gm - 2 - 12 * Math.floor((gm - 14) / 12))) / 12);
  const jd3 = Math.floor((3 * Math.floor((gy + 4900 + Math.floor((gm - 14) / 12)) / 100)) / 4);
  const jd = jd1 + jd2 - jd3 + gd - 32075;
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = (
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719)
  ) + (
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238)
  );
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l3) / 709);
  const day = l3 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { day, month, year };
};

/**
 * Convert a Gregorian date to Hijri date components
 * @param {Date} date - The date to convert (defaults to today)
 * @returns {{ day: number, month: number, year: number, monthName: string }}
 */
export const getHijriDate = (date = new Date()) => {
  try {
    // Try Intl.DateTimeFormat with Islamic Umm al-Qura calendar first
    const formatter = new Intl.DateTimeFormat('en-TN-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10);
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10);

    // Validate: Intl may silently fall back to Gregorian on Hermes
    if (month >= 1 && month <= 12 && year > 0 && year < 1500) {
      return { day, month, year, monthName: HIJRI_MONTHS[month - 1] };
    }
  } catch (_) {
    // Intl not available — fall through to mathematical conversion
  }

  // Fallback: mathematical tabular conversion
  try {
    const gy = date.getFullYear();
    const gm = date.getMonth() + 1;
    const gd = date.getDate();
    const { day, month, year } = gregorianToHijri(gy, gm, gd);

    if (month >= 1 && month <= 12) {
      return { day, month, year, monthName: HIJRI_MONTHS[month - 1] };
    }
  } catch (_) {
    // Fallback failed too
  }

  return { day: '--', month: '--', year: '--', monthName: '--' };
};

/**
 * Get formatted Hijri date string
 * @param {Date} date - The date to convert (defaults to today)
 * @returns {string} Formatted string like "15 Ramadan 1446"
 */
export const formatHijriDate = (date = new Date()) => {
  const { day, monthName, year } = getHijriDate(date);
  return `${day} ${monthName} ${year}`;
};

/**
 * Get Hijri date components for prayer times display
 * @param {Date} date - The date to convert (defaults to today)
 * @returns {{ HijriDay: string, HijriMonth: string, HijriYear: string }}
 */
export const getHijriForPrayerTimes = (date = new Date()) => {
  const { day, monthName, year } = getHijriDate(date);
  return {
    HijriDay: String(day),
    HijriMonth: monthName,
    HijriYear: String(year),
  };
};

export default { getHijriDate, formatHijriDate, getHijriForPrayerTimes, HIJRI_MONTHS };
