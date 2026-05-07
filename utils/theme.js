import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 375;

export const window = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: SCREEN_WIDTH < 360,
  isTablet: SCREEN_WIDTH >= 768,
};

/**
 * Moderate scale to prevent excessive scaling on large screens
 * @param {number} size - Original size
 * @param {number} factor - Scaling factor (0.5 is default moderate)
 */
export function normalize(size, factor = 0.5) {
  const scale = SCREEN_WIDTH / guidelineBaseWidth;
  const newSize = size + (size * scale - size) * factor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

export const colors = {
  // Brand
  primary: '#4F46E5', // Indigo 600
  primaryDark: '#3730A3', // Indigo 800
  primarySoft: 'rgba(79, 70, 229, 0.1)',
  
  secondary: '#10B981', // Emerald 500
  secondaryDark: '#047857', // Emerald 700
  secondarySoft: 'rgba(16, 185, 129, 0.1)',
  
  accent: '#F43F5E', // Rose 500
  accentSoft: 'rgba(244, 63, 94, 0.1)',

  // Neutrals
  bg: '#F8FAFC', 
  bgDark: '#0F172A', 
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  text: '#1E293B',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  
  // States
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  white: '#FFFFFF',
  black: '#000000',
};

export const spacing = {
  xs: normalize(4),
  sm: normalize(8),
  md: normalize(16),
  lg: normalize(24),
  xl: normalize(32),
  xxl: normalize(48),
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const layout = {
  maxWidth: 800,
  container: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  }
};

const getShadow = (offset, radius, opacity, elev) => {
  return Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: offset,
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: {
      elevation: elev,
    },
    web: {
      boxShadow: `${offset.width}px ${offset.height}px ${radius * 2}px rgba(15, 23, 42, ${opacity})`,
    },
  });
};

export const elevation = {
  none: Platform.select({
    web: { boxShadow: 'none' },
    default: { elevation: 0, shadowOpacity: 0 }
  }),
  sm: getShadow({ width: 0, height: 1 }, 2, 0.05, 2),
  md: getShadow({ width: 0, height: 4 }, 8, 0.1, 4),
  lg: getShadow({ width: 0, height: 12 }, 24, 0.15, 8),
  card: getShadow({ width: 0, height: 2 }, 6, 0.04, 3),
  glass: getShadow({ width: 0, height: 8 }, 20, 0.1, 5),
};
