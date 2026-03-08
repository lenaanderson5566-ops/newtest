import { ref } from 'vue';
import { THEME_CONFIG } from '@/utils/baseConfig';

export function useTheme() {
  const theme = ref('light');

  const applyTheme = () => {
    const root = document.documentElement;
    const themeVars = THEME_CONFIG.light || THEME_CONFIG.default || {};


    if (themeVars.primaryColor) root.style.setProperty('--theme-color', themeVars.primaryColor);
    if (themeVars.primaryColorRgb) root.style.setProperty('--theme-color-rgb', themeVars.primaryColorRgb);
    if (themeVars.primaryColorHover) {
      root.style.setProperty('--theme-hover-color', themeVars.primaryColorHover);
      root.style.setProperty('--primary-color-hover', themeVars.primaryColorHover);
    }
    if (themeVars.backgroundColor) root.style.setProperty('--background-color', themeVars.backgroundColor);
    if (themeVars.cardBackground) root.style.setProperty('--card-background', themeVars.cardBackground);
    if (themeVars.textColor) root.style.setProperty('--text-color', themeVars.textColor);
    if (themeVars.secondaryTextColor) root.style.setProperty('--secondary-text-color', themeVars.secondaryTextColor);
    if (themeVars.borderColor) root.style.setProperty('--border-color', themeVars.borderColor);
    if (themeVars.shadowColor) root.style.setProperty('--shadow-color', themeVars.shadowColor);
  };

  const toggleTheme = () => {
    // dark mode removed: keep light theme only
    theme.value = 'light';
    applyTheme();
  };

  return {
    theme,
    toggleTheme,
    applyTheme
  };
}
