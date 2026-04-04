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
      '--color-bg-page': 'cardBackground',
      '--background-elevated': 'backgroundElevated',
      '--color-bg-surface': 'cardBackground',
      '--text-color': 'textColor',
      '--secondary-text-color': 'secondaryTextColor',
      '--muted-text-color': 'mutedTextColor',
      '--border-default': 'borderColor',
      '--border-subtle': 'borderColorSoft',
      '--divider': 'borderColorSoft',
      '--shadow-color': 'shadowColor',
      '--shadow-card-sm': 'shadowCardSm',
      '--shadow-card-md': 'shadowCardMd',
      '--radius-sm': 'radiusSm',
      '--radius-md': 'radiusMd',
      '--radius-lg': 'radiusLg',
      '--surface-subtle': 'surfaceSubtle',
      '--heading-color': 'headingColor',
      '--neutral-strong': 'neutralStrong',
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
