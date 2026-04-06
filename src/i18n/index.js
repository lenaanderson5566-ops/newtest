import { createI18n } from 'vue-i18n';
import { SITE_CONFIG } from '@/utils/baseConfig';
import {
  SUPPORTED_LOCALES as supportedLocales,
  getStoredLanguage,
  normalizeLanguage
} from '@/utils/language';
import { checkLoginStatus } from '@/api/auth';
import { getUserInfo } from '@/api/account/user';
import { extractUserLanguage, resolvePostLoginLanguage } from '@/utils/userLanguage';

const injectSiteName = (messages) => {
  Object.keys(messages).forEach((locale) => {
    if (messages[locale]?.common) {
      messages[locale].common.appName = SITE_CONFIG.siteName;
      if (messages[locale].common.welcome && messages[locale].common.welcome.includes('V2Board Admin')) {
        messages[locale].common.welcome = messages[locale].common.welcome.replace('V2Board Admin', SITE_CONFIG.siteName);
      }
    }
  });

  return messages;
};

const AUTH_LOCALE_LOADERS = {
  'zh-CN': () => import('./locales/auth/zh-CN.js'),
  'vi-VN': () => import('./locales/auth/vi-VN.js'),
  'en-US': () => import('./locales/auth/en-US.js'),
  'zh-TW': () => import('./locales/auth/zh-TW.js'),
  'ja-JP': () => import('./locales/auth/ja-JP.js'),
  'ko-KR': () => import('./locales/auth/ko-KR.js'),
  'ru-RU': () => import('./locales/auth/ru-RU.js'),
  'fa-IR': () => import('./locales/auth/fa-IR.js')
};

const APP_LOCALE_LOADERS = {
  'zh-CN': () => import('./locales/zh-CN.js'),
  'vi-VN': () => import('./locales/vi-VN.js'),
  'en-US': () => import('./locales/en-US.js'),
  'zh-TW': () => import('./locales/zh-TW.js'),
  'ja-JP': () => import('./locales/ja-JP.js'),
  'ko-KR': () => import('./locales/ko-KR.js'),
  'ru-RU': () => import('./locales/ru-RU.js'),
  'fa-IR': () => import('./locales/fa-IR.js')
};

const loadLocaleModule = async (locale, isLoggedIn) => {
  const loaders = isLoggedIn ? APP_LOCALE_LOADERS : AUTH_LOCALE_LOADERS;
  const loader = loaders[locale] || loaders['en-US'];
  const module = await loader();
  return module?.default || null;
};

const loadLocaleMessages = async (isLoggedIn, preferredLocale = null) => {
  const messages = {};

  try {
    const normalizedPreferred = preferredLocale ? normalizeLanguage(preferredLocale) : null;
    const localesToLoad = normalizedPreferred
      ? Array.from(new Set([normalizedPreferred, 'en-US']))
      : supportedLocales;

    for (const locale of localesToLoad) {
      try {
        const localeMessages = await loadLocaleModule(locale, isLoggedIn);
        if (localeMessages) {
          messages[locale] = localeMessages;
        }
      } catch (e) {
        if (locale !== 'en-US') {
          try {
            const fallbackMessages = await loadLocaleModule('en-US', isLoggedIn);
            if (fallbackMessages) {
              messages[locale] = fallbackMessages;
            }
          } catch (fallbackError) {
            // noop
          }
        }
      }
    }
  } catch (e) {
    // noop
  }

  return injectSiteName(messages);
};

const i18n = createI18n({
  legacy: false,
  locale: getStoredLanguage(),
  fallbackLocale: 'en-US',
  messages: {},
  silentTranslationWarn: true,
  missingWarn: false,
  fallbackWarn: false
});

export const setLanguage = async (lang) => {
  lang = normalizeLanguage(lang);

  try {
    const isLoggedIn = checkLoginStatus();
    const messages = await loadLocaleMessages(isLoggedIn, lang);

    for (const locale in messages) {
      if (messages[locale]) {
        i18n.global.mergeLocaleMessage(locale, messages[locale]);
      }
    }

    i18n.global.locale.value = lang;
    localStorage.setItem('language', lang);
    document.querySelector('html').setAttribute('lang', lang);

    updatePageTitle();
    setTimeout(() => {
      updatePageTitle();
    }, 300);

    return {
      success: true,
      availableLocales: Object.keys(messages)
    };
  } catch (error) {
    return {
      success: false,
      message: error?.message || 'Failed to load locale messages',
      availableLocales: []
    };
  }
};

export const updatePageTitle = () => {
  if (window.router?.currentRoute?.value?.meta?.titleKey) {
    const titleKey = window.router.currentRoute.value.meta.titleKey;

    try {
      const translatedTitle = i18n.global.t(titleKey);
      document.title = `${translatedTitle} - ${SITE_CONFIG.siteName}`;
    } catch (error) {
      document.title = SITE_CONFIG.siteName;
    }
  } else if (window.router?.currentRoute?.value) {
    document.title = SITE_CONFIG.siteName;
  }
};

export const initializeLanguageFromUserSettings = async () => {
  const isLoggedIn = checkLoginStatus();

  if (!isLoggedIn) {
    return {
      success: false,
      reason: 'not_logged_in'
    };
  }

  let userLanguage = null;

  try {
    const response = await getUserInfo();
    const userData = response?.data?.data && typeof response.data.data === 'object'
      ? response.data.data
      : response?.data;

    userLanguage = extractUserLanguage(userData);
  } catch (error) {
    // noop
  }

  const targetLanguage = resolvePostLoginLanguage(userLanguage);
  const currentLanguage = normalizeLanguage(i18n.global.locale.value);

  if (currentLanguage === targetLanguage) {
    return {
      success: true,
      language: targetLanguage,
      skipped: true
    };
  }

  const result = await setLanguage(targetLanguage);
  return {
    ...result,
    language: targetLanguage
  };
};

export const reloadMessages = async () => {
  const isLoggedIn = checkLoginStatus();
  const currentLang = i18n.global.locale.value;
  const messages = await loadLocaleMessages(isLoggedIn, currentLang);

  for (const locale in messages) {
    if (messages[locale]) {
      i18n.global.mergeLocaleMessage(locale, messages[locale]);
    }
  }

  i18n.global.locale.value = currentLang;

  updatePageTitle();
  setTimeout(() => {
    updatePageTitle();
  }, 300);

  return {
    success: true,
    availableLocales: Object.keys(messages)
  };
};

(async () => {
  try {
    const isLoggedIn = checkLoginStatus();
    const initialLang = getStoredLanguage();
    const messages = await loadLocaleMessages(isLoggedIn, initialLang);

    for (const locale in messages) {
      if (messages[locale]) {
        i18n.global.mergeLocaleMessage(locale, messages[locale]);
      }
    }

    i18n.global.locale.value = initialLang;
    updatePageTitle();
  } catch (error) {
    // noop
  }
})();

export default i18n;
