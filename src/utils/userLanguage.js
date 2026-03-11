import { SUPPORTED_LOCALES } from '@/utils/language';

const ENGLISH_FALLBACK = 'en-US';

export const matchSupportedLanguage = (lang) => {
  if (!lang) return null;

  const normalized = String(lang).trim();
  if (!normalized) return null;

  if (SUPPORTED_LOCALES.includes(normalized)) {
    return normalized;
  }

  const lowerLang = normalized.toLowerCase();

  if (lowerLang === 'zh-cn') return 'zh-CN';
  if (lowerLang === 'vi-vn' || lowerLang === 'vi') return 'vi-VN';
  if (lowerLang === 'zh-tw' || lowerLang === 'zh-hk') return 'zh-TW';
  if (lowerLang === 'ja' || lowerLang === 'ja-jp') return 'ja-JP';
  if (lowerLang === 'ko' || lowerLang === 'ko-kr') return 'ko-KR';
  if (lowerLang === 'ru' || lowerLang === 'ru-ru') return 'ru-RU';
  if (lowerLang === 'fa' || lowerLang === 'fa-ir') return 'fa-IR';
  if (lowerLang === 'en' || lowerLang === 'en-us' || lowerLang === 'en-gb') return 'en-US';

  if (lowerLang.startsWith('zh')) return 'zh-CN';
  if (lowerLang.startsWith('vi')) return 'vi-VN';
  if (lowerLang.startsWith('ja')) return 'ja-JP';
  if (lowerLang.startsWith('ko')) return 'ko-KR';
  if (lowerLang.startsWith('ru')) return 'ru-RU';
  if (lowerLang.startsWith('fa')) return 'fa-IR';
  if (lowerLang.startsWith('en')) return 'en-US';

  return null;
};

export const extractUserLanguage = (user = {}) => {
  if (!user || typeof user !== 'object') return null;

  return (
    user.language ||
    user.lang ||
    user.locale ||
    user.preferred_language ||
    user.preferredLanguage ||
    null
  );
};

export const resolvePostLoginLanguage = (userLanguage) => {
  const fromUser = matchSupportedLanguage(userLanguage);
  if (fromUser) return fromUser;

  const browserRaw = typeof navigator !== 'undefined' ? (navigator.language || navigator.userLanguage) : '';
  const fromBrowser = matchSupportedLanguage(browserRaw);
  if (fromBrowser) return fromBrowser;

  if (SUPPORTED_LOCALES.includes(ENGLISH_FALLBACK)) return ENGLISH_FALLBACK;
  return SUPPORTED_LOCALES[0] || ENGLISH_FALLBACK;
};

export const getDefaultRegisterLanguage = () => {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('language') : '';
  const matchedStored = matchSupportedLanguage(stored);
  if (matchedStored) return matchedStored;

  if (SUPPORTED_LOCALES.includes(ENGLISH_FALLBACK)) return ENGLISH_FALLBACK;
  return SUPPORTED_LOCALES[0] || ENGLISH_FALLBACK;
};
