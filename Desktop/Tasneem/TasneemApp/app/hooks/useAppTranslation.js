import { useCallback } from 'react';
import appTranslations from '../constants/appTranslations';
import { useNavigationContext } from '../components/NavigationContext';

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), obj);
};

const interpolate = (value, params) => {
  if (!params || typeof value !== 'string') return value;
  return value.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] != null ? String(params[key]) : match;
  });
};

export const useAppTranslation = () => {
  const { language } = useNavigationContext();

  const t = useCallback(
    (path, params) => {
      const fallback = getNestedValue(appTranslations.english, path);
      const localized = getNestedValue(appTranslations[language], path);
      const hasLocalizedValue =
        localized != null && !(typeof localized === 'string' && localized.trim() === '');
      const arabicFallback =
        path === 'sunnahUI.muslimNumberingInfo'
          ? getNestedValue(appTranslations.arabic, path)
          : undefined;

      const value = hasLocalizedValue
        ? localized
        : language !== 'english' && arabicFallback != null
          ? arabicFallback
          : fallback != null
            ? fallback
            : path;
      return interpolate(value, params);
    },
    [language]
  );

  return { t, language };
};

export default useAppTranslation;
