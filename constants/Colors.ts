/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// App-specific colors for consistency across screens
export const AppColors = {
  primary: '#ff5733',
  success: '#4CAF50',
  info: '#2196F3',
  warning: '#FF9800',
  error: '#ff5733',
  
  // Text colors
  textPrimary: '#333',
  textSecondary: '#666',
  textTertiary: '#888',
  textMuted: '#999',
  
  // Background colors
  cardBackground: '#ebebeb',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',
  
  // Filter button colors
  filterInactive: 'rgba(0, 0, 0, 0.1)',
  filterInactiveBorder: 'rgba(0, 0, 0, 0.2)',
  
  // Shadow colors
  shadowLight: '#c2c2c2',
};

// Consistent spacing tokens
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 30,
  
  // Common margins
  containerHorizontal: -30,
  titleContainerLeft: -15,
  
  // Common gaps
  defaultGap: 8,
  filterGap: 8,
};
