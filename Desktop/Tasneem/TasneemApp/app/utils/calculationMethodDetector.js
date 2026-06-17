/**
 * Determines the appropriate Islamic prayer calculation method based on geographic location
 */

// Gulf countries (Umm al-Qura)
const GULF_COUNTRIES = [
  { name: 'Saudi Arabia', bounds: { minLat: 16, maxLat: 32.5, minLng: 34.5, maxLng: 56 } },
  { name: 'UAE', bounds: { minLat: 22, maxLat: 26.5, minLng: 51, maxLng: 57 } },
  { name: 'Kuwait', bounds: { minLat: 28.5, maxLat: 30.5, minLng: 46.5, maxLng: 49 } },
  { name: 'Qatar', bounds: { minLat: 24.5, maxLat: 26.5, minLng: 50.5, maxLng: 52 } },
  { name: 'Bahrain', bounds: { minLat: 25.5, maxLat: 26.5, minLng: 50, maxLng: 51 } },
  { name: 'Oman', bounds: { minLat: 16, maxLat: 26.5, minLng: 52, maxLng: 60 } },
];

// Indian subcontinent (Karachi/University of Islamic Sciences)
const INDIAN_SUBCONTINENT = [
  { name: 'Pakistan', bounds: { minLat: 23, maxLat: 37.5, minLng: 60, maxLng: 78 } },
  { name: 'India', bounds: { minLat: 6, maxLat: 37, minLng: 68, maxLng: 97.5 } },
  { name: 'Bangladesh', bounds: { minLat: 20, maxLat: 27, minLng: 88, maxLng: 93 } },
];

// North America (ISNA)
const NORTH_AMERICA = [
  { name: 'USA', bounds: { minLat: 24, maxLat: 50, minLng: -125, maxLng: -66 } },
  { name: 'Canada', bounds: { minLat: 41, maxLat: 84, minLng: -141, maxLng: -52 } },
  { name: 'Mexico', bounds: { minLat: 14, maxLat: 33, minLng: -118, maxLng: -86 } },
];

/**
 * Check if coordinates fall within a region's bounds
 */
const isInRegion = (lat, lng, bounds) => {
  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lng >= bounds.minLng &&
    lng <= bounds.maxLng
  );
};

/**
 * Detect the appropriate calculation method based on coordinates
 * @param {number} latitude
 * @param {number} longitude
 * @returns {string} One of: 'UmmAlQura', 'Karachi', 'NorthAmerica', 'MuslimWorldLeague'
 */
export const detectCalculationMethod = (latitude, longitude) => {
  // Check Gulf countries
  for (const country of GULF_COUNTRIES) {
    if (isInRegion(latitude, longitude, country.bounds)) {
      return 'UmmAlQura';
    }
  }

  // Check Indian subcontinent
  for (const country of INDIAN_SUBCONTINENT) {
    if (isInRegion(latitude, longitude, country.bounds)) {
      return 'Karachi';
    }
  }

  // Check North America
  for (const country of NORTH_AMERICA) {
    if (isInRegion(latitude, longitude, country.bounds)) {
      return 'NorthAmerica';
    }
  }

  // Default to Muslim World League for rest of the world
  return 'MuslimWorldLeague';
};

/**
 * Get the display name for a calculation method
 * @param {string} method
 * @returns {string}
 */
export const getMethodDisplayName = (method) => {
  const names = {
    UmmAlQura: 'Umm al-Qura',
    Karachi: 'University of Karachi',
    NorthAmerica: 'ISNA',
    MuslimWorldLeague: 'Muslim World League',
  };
  return names[method] || 'Muslim World League';
};

/**
 * Get the description for a calculation method
 * @param {string} method
 * @returns {string}
 */
export const getMethodDescription = (method) => {
  const descriptions = {
    UmmAlQura: 'Used in Saudi Arabia and Gulf countries',
    Karachi: 'Used in Pakistan, India, and Bangladesh',
    NorthAmerica: 'Islamic Society of North America',
    MuslimWorldLeague: 'Used globally, standard method',
  };
  return descriptions[method] || 'Used globally';
};

/**
 * Get the region name for a calculation method
 * @param {string} method
 * @returns {string}
 */
export const getMethodRegion = (method) => {
  const regions = {
    UmmAlQura: 'Gulf Countries',
    Karachi: 'Indian Subcontinent',
    NorthAmerica: 'North America',
    MuslimWorldLeague: 'Global',
  };
  return regions[method] || 'Global';
};

export const CALCULATION_METHODS = [
  'UmmAlQura',
  'Karachi',
  'NorthAmerica',
  'MuslimWorldLeague',
];
