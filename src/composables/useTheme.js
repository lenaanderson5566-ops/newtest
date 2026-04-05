import { ref } from 'vue';
import { THEME_CONFIG } from '@/utils/baseConfig';

export function useTheme() {
  const theme = ref('light');

  const applyTheme = () => {
    const root = document.documentElement;
    const themeVars = THEME_CONFIG.light || THEME_CONFIG.default || {};

    const map = {
      '--theme-color': 'primaryColor',
      '--theme-color-rgb': 'primaryColorRgb',
      '--theme-hover-color': 'primaryColorHover',
      '--primary-color-hover': 'primaryColorHover',
      '--button-primary-start': 'buttonPrimaryStart',
      '--button-primary-soft-start': 'buttonPrimarySoftStart',
      '--button-primary-end': 'buttonPrimaryEnd',
      '--button-disabled-bg': 'buttonDisabledBg'
    };

    Object.entries(map).forEach(([cssVar, key]) => {
      if (themeVars[key]) root.style.setProperty(cssVar, themeVars[key]);
    });
  };

  const toggleTheme = () => {
    theme.value = 'light';
    applyTheme();
  };

  return {
    theme,
    toggleTheme,
    applyTheme
  };
}
