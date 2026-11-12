export const lightColors = {
  background: '#F4F7F2', surface: '#FFFFFF', primary: '#2F6B3C',
  primaryDark: '#1F4D2B', primarySoft: '#E6F0E8', accent: '#D89B3C',
  text: '#1B241D', textSecondary: '#647067', border: '#DDE5DD',
  danger: '#B93838', success: '#2E7D4F', warning: '#A66A00', onPrimary: '#FFFFFF',
};
export type ThemeColors = typeof lightColors;
export const darkColors: ThemeColors = {
  background: '#111913', surface: '#1C2820', primary: '#8DCE9B',
  primaryDark: '#B5E4BE', primarySoft: '#263E2D', accent: '#EDB969',
  text: '#EEF5EF', textSecondary: '#B3C2B6', border: '#3B4D40',
  danger: '#FF9999', success: '#91D8AC', warning: '#F2C16F', onPrimary: '#102217',
};
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const typography = {
  caption: { fontSize: 13, lineHeight: 19 },
  body: { fontSize: 16, lineHeight: 24 },
  label: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  hero: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
} as const;
export const borders = { width: 1, radius: 12, large: 20, pill: 999 };
export const shadows = {
  card: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
};
export const createTheme = (isDark: boolean) => ({
  isDark, colors: isDark ? darkColors : lightColors, spacing, typography, borders, shadows,
});
export type AppTheme = ReturnType<typeof createTheme>;
export type ThemePreference = 'light' | 'dark' | 'system';
