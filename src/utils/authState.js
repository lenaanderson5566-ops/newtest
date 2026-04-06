const runtimeState = {
  token: '',
  isUserLoggedIn: undefined,
  isLoggingOut: false,
  lastLoginCheck: null,
  lastLoginCheckTime: 0
};

const purgeLegacyTokenStorage = () => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
};

purgeLegacyTokenStorage();

export const getToken = () => runtimeState.token || '';

export const getAuthData = () => localStorage.getItem('auth_data') || sessionStorage.getItem('auth_data') || '';

export const getAuthSnapshot = () => ({
  token: getToken(),
  authData: getAuthData()
});

export const setToken = (token) => {
  runtimeState.token = token || '';
  purgeLegacyTokenStorage();
};

export const setAuthData = (authData, rememberMe = false) => {
  if (!authData) return;
  if (rememberMe) {
    localStorage.setItem('auth_data', authData);
    sessionStorage.removeItem('auth_data');
    return;
  }
  sessionStorage.setItem('auth_data', authData);
  localStorage.removeItem('auth_data');
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
