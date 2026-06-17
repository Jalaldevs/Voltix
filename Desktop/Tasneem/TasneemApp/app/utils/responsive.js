import { Dimensions } from 'react-native';

// Get device dimensions
const { width, height } = Dimensions.get('window');

// Base dimensions (iPhone SE as reference)
const baseWidth = 375;
const baseHeight = 667;

// Responsive scaling functions
export const scaleWidth = (size) => {
  return Math.round((size * width) / baseWidth);
};

export const scaleHeight = (size) => {
  return Math.round((size * height) / baseHeight);
};

export const scaleFontSize = (size) => {
  const scale = width / baseWidth;
  const newSize = size * scale;
  return Math.round(newSize);
};

// Moderate scale - for padding/margins
export const moderateScale = (size, factor = 0.5) => {
  const scale = width / baseWidth;
  return Math.round(size + (scale - 1) * size * factor);
};

// Check if device is tablet
export const isTablet = () => {
  return width >= 768;
};

// Get responsive padding
export const getResponsivePadding = () => {
  if (isTablet()) {
    return {
      horizontal: 48,
      vertical: 40,
    };
  }
  return {
    horizontal: moderateScale(20),
    vertical: moderateScale(16),
  };
};

// Export dimensions
export { width, height };

