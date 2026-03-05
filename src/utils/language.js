export const SUPPORTED_LOCALES = [
  'zh-CN',
  'vi-VN',
  'en-US',
  'zh-TW',
  'ja-JP',
  'ko-KR',
  'ru-RU',
  'fa-IR'
];

export const normalizeLanguage = (lang, fallback = 'en-US') => {
  if (SUPPORTED_LOCALES.includes(lang)) {
    return lang;
  }

  if (!lang) {
    return SUPPORTED_LOCALES.includes(fallback) ? fallback : 'en-US';
  }

  const lowerLang = String(lang).toLowerCase();

  if (lowerLang === 'zh-cn') return 'zh-CN';
  if (lowerLang === 'vi-vn' || lowerLang === 'vi') return 'vi-VN';
  if (lowerLang === 'zh-tw' || lowerLang === 'zh-hk') return 'zh-TW';
  if (lowerLang === 'ja' || lowerLang === 'ja-jp') return 'ja-JP';
  if (lowerLang === 'ko' || lowerLang === 'ko-kr') return 'ko-KR';
  if (lowerLang === 'ru' || lowerLang === 'ru-ru') return 'ru-RU';
  if (lowerLang === 'fa' || lowerLang === 'fa-ir') return 'fa-IR';

  if (lowerLang.startsWith('zh')) return 'zh-CN';
  if (lowerLang.startsWith('vi')) return 'vi-VN';
  if (lowerLang.startsWith('ja')) return 'ja-JP';
  if (lowerLang.startsWith('ko')) return 'ko-KR';
  if (lowerLang.startsWith('ru')) return 'ru-RU';
  if (lowerLang.startsWith('fa')) return 'fa-IR';

  return SUPPORTED_LOCALES.includes(fallback) ? fallback : 'en-US';
};

export const getBrowserLanguage = () => {
  if (typeof navigator === 'undefined') {
    return normalizeLanguage(undefined);
  }

  const browserLang = navigator.language || navigator.userLanguage;
  return normalizeLanguage(browserLang);
};

export const getStoredLanguage = () => {
  if (typeof localStorage === 'undefined') {
    return normalizeLanguage(undefined);
  }

  const storedLanguage = localStorage.getItem('language');
  if (storedLanguage) {
    return normalizeLanguage(storedLanguage);
  }

  return getBrowserLanguage();
};

export const getCurrentLanguage = () => {
  const domLanguage = typeof document !== 'undefined' ? document.documentElement.getAttribute('lang') : '';

  if (domLanguage) {
    return normalizeLanguage(domLanguage);
  }

  return getStoredLanguage();
};
