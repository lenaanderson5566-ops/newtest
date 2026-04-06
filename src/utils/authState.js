const runtimeState = {
  token: '',
  isUserLoggedIn: undefined,
  isLoggingOut: false,
  lastLoginCheck: null,
  lastLoginCheckTime: 0
};

const AUTHORIZATION_KEY = 'authorization';
const LEGACY_AUTH_KEYS = ['auth_data', 'authorization'];

const purgeLegacyTokenStorage = () => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
};

purgeLegacyTokenStorage();

export const getToken = () => runtimeState.token || '';

const migrateAuthDataToAuthorization = (authData) => {
  if (!authData) return '';
  localStorage.setItem(AUTHORIZATION_KEY, authData);
  LEGACY_AUTH_KEYS.forEach((key) => {
    if (key !== AUTHORIZATION_KEY) {
      localStorage.removeItem(key);
    }
    sessionStorage.removeItem(key);
  });
  return authData;
};

export const getAuthData = () => {
  const authDataFromAuthorization = localStorage.getItem(AUTHORIZATION_KEY);
  if (authDataFromAuthorization) return authDataFromAuthorization;

  const legacyAuthData = localStorage.getItem('auth_data') ||
    sessionStorage.getItem('auth_data') ||
    sessionStorage.getItem(AUTHORIZATION_KEY) ||
    '';
  return migrateAuthDataToAuthorization(legacyAuthData);
};

export const getAuthSnapshot = () => ({
  token: getToken(),
  authData: getAuthData()
});

export const setToken = (token) => {
  runtimeState.token = token || '';
  purgeLegacyTokenStorage();
};

export const setAuthData = (authData) => {
  if (!authData) return;
  localStorage.setItem(AUTHORIZATION_KEY, authData);
  localStorage.removeItem('auth_data');
  sessionStorage.removeItem('auth_data');
  sessionStorage.removeItem(AUTHORIZATION_KEY);
};

export const setUserLoggedInFlag = (status) => {
  runtimeState.isUserLoggedIn = status;
  window.isUserLoggedIn = status;
};

export const getUserLoggedInFlag = () => {
  if (runtimeState.isUserLoggedIn !== undefined) {
    return runtimeState.isUserLoggedIn;
  }
  return window.isUserLoggedIn;
};

export const setLogoutInProgress = (status) => {
  runtimeState.isLoggingOut = status === true;
  window._isLoggingOut = runtimeState.isLoggingOut;
};

export const isLogoutInProgress = () => runtimeState.isLoggingOut === true || window._isLoggingOut === true;

export const getCachedLoginStatus = (ttl = 1000) => {
  if (runtimeState.lastLoginCheck === null) return null;
  if (Date.now() - runtimeState.lastLoginCheckTime >= ttl) return null;
  return runtimeState.lastLoginCheck;
};

export const setCachedLoginStatus = (status) => {
  runtimeState.lastLoginCheck = status;
  runtimeState.lastLoginCheckTime = Date.now();
};

export const clearCachedLoginStatus = () => {
  runtimeState.lastLoginCheck = null;
  runtimeState.lastLoginCheckTime = 0;
};
