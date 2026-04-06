
import request, { getResponseData } from './request';
import { pinia, useAppStore } from '@/store';
import { updateUserLanguage, logoutCurrentSession } from './account/user';
import { getDefaultRegisterLanguage } from '@/utils/userLanguage';
import { reloadMessages, initializeLanguageFromUserSettings } from '@/i18n';
import {
  getToken,
  getAuthData,
  setAuthData,
  setUserLoggedInFlag,
  getUserLoggedInFlag,
  setCachedLoginStatus,
  getCachedLoginStatus,
  setLogoutInProgress,
  isLogoutInProgress
} from '@/utils/authState';

const resolvePayload = (envelope) => {
  const nestedData = getResponseData(envelope);
  if (nestedData !== null && nestedData !== undefined) return nestedData;
  if (envelope && typeof envelope === 'object') return envelope;
  return null;
};


export const handleLoginSuccess = (responseData, rememberMe) => {
  try {
    setUserLoggedInFlag(undefined);
    const usePersistentStorage = rememberMe === true;
    
    useAppStore(pinia).login(responseData.token, { rememberMe: usePersistentStorage });
    
    if (responseData.is_admin === 1) {
      localStorage.setItem('is_admin', '1');
    }
    
    if (responseData.auth_data) {
      setAuthData(responseData.auth_data, usePersistentStorage);
    }
    
    setTimeout(() => {
      setUserLoggedInFlag(true);
      
      Promise.resolve().then(async () => {
        await initializeLanguageFromUserSettings().catch(() => null);

        reloadMessages().catch(() => {
        });
      }).catch(() => {
      });
    }, 500);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};


export const login = async (loginData) => {
  const { rememberMe, ...requestData } = loginData;
  
  const envelope = await request({
    url: '/passport/auth/login',
    method: 'post',
    data: requestData
  });
  const responseData = resolvePayload(envelope);
  
  if (!responseData || !(responseData.token || responseData.auth_data)) {
    throw new Error('登录数据不完整');
  }
  
  const handledResponse = handleLoginSuccess(responseData, rememberMe);
  
  if (handledResponse.success) {
    return {
      success: true,
      token: responseData.token,
      auth_data: responseData.auth_data,
      is_admin: responseData.is_admin
    };
  } else {
    throw new Error(handledResponse.error);
  }
};


export function register(data) {
  const registerLanguage = data?.language || getDefaultRegisterLanguage();
  const registerPayload = {
    ...data,
    language: registerLanguage
  };

  return request({
    url: '/passport/auth/register',
    method: 'post',
    data: registerPayload
  }).then((envelope) => {
    const responseData = resolvePayload(envelope);
    
    if (responseData?.token) {
      useAppStore(pinia).login(responseData.token, { rememberMe: true });
      
      setUserLoggedInFlag(true);
    }
    
    if (responseData?.auth_data) {
      setAuthData(responseData.auth_data, true);
    }
    
    if (typeof responseData?.is_admin !== 'undefined') {
      localStorage.setItem('is_admin', responseData.is_admin);
    }

    localStorage.setItem('language', registerLanguage);

    updateUserLanguage(registerLanguage).catch(() => {
    });
    
    setTimeout(async () => {
      await reloadMessages().then(() => {
        window.dispatchEvent(new CustomEvent('languageChanged'));
      }).catch(() => null);
    }, 100);
    
    return envelope;
  });
}


export function resetPassword(data) {
  return request({
    url: '/passport/auth/forget',
    method: 'post',
    data
  });
}


export function getUserInfo() {
  return request({
    url: '/user/info',
    method: 'get'
  });
}


export const logout = async () => {
  try {
    setLogoutInProgress(true);
    await logoutCurrentSession().catch(() => null);

    _clearAllAuthData();
    
    return new Promise(resolve => {
      setTimeout(() => {
        Promise.resolve().then(() => {
          reloadMessages().then(() => {
            resolve({
              success: true,
              redirectToLogin: true,
              redirectUrl: '/login?logout=true'
            });
          }).catch(() => {
            resolve({
              success: true, 
              redirectToLogin: true,
              redirectUrl: '/login?logout=true'
            });
          });
        }).catch(() => {
          resolve({
            success: true,
            redirectToLogin: true,
            redirectUrl: '/login?logout=true'
          });
        });
      }, 200);
    });
  } catch (error) {
    return {
      success: false,
      error: error.message,
      redirectToLogin: true,
      redirectUrl: '/login?logout=true'
    };
  } finally {
    setLogoutInProgress(false);
  }
};


export function getWebsiteConfig() {
  return request({
    url: '/guest/comm/config',
    method: 'get'
  });
}


export function sendEmailVerify(data) {
  const sendData = { ...data };
  
  if (typeof sendData.isForgetPassword !== 'undefined') {
    sendData.isforget = sendData.isForgetPassword ? 1 : 0;
    delete sendData.isForgetPassword;
  }
  
  return request({
    url: '/passport/comm/sendEmailVerify',
    method: 'post',
    data: sendData
  });
}


export const checkLoginStatus = () => {
  const cachedStatus = getCachedLoginStatus(1000);
  if (cachedStatus !== null) {
    return cachedStatus;
  }
  
  if (isLogoutInProgress()) {
    _cacheLoginStatus(false);
    return false;
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('logout') === 'true') {
    _clearAllAuthData();
    _cacheLoginStatus(false);
    return false;
  }
  
  if (getUserLoggedInFlag() === false) {
    _cacheLoginStatus(false);
    return false;
  }
  
  const token = getToken();
  if (!token || token === 'undefined' || token === 'null' || token === '') {
    _clearAllAuthData(); 
    _cacheLoginStatus(false);
    return false;
  }
  
  const authData = getAuthData();
                  
  if (!authData || authData === 'undefined' || authData === 'null' || authData === '') {
    _clearAllAuthData();
    _cacheLoginStatus(false);
    return false;
  }
  
  const storeAuth = useAppStore(pinia).isLoggedIn;
  if (!storeAuth) {
  }
  
  const isLoggedIn = !!token && !!authData;
  
  if (isLoggedIn) {
    setUserLoggedInFlag(true);
  }
  
  _cacheLoginStatus(isLoggedIn);
  return isLoggedIn;
};


const _cacheLoginStatus = (status) => {
  setCachedLoginStatus(status);
};


const _clearAllAuthData = () => {
  setUserLoggedInFlag(false);
  
  const authKeys = [
    'token', 
    'auth_data', 
    'cookie_auth_data', 
    'userInfo', 
    'left_sidebar_collapsed',
    'is_admin',
    'vuex',
    'user',
    'auth'
  ];
  
  authKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  const sessionKeys = [
    'token', 
    'auth_data',
    'vuex',
    'user',
    'auth'
  ];
  
  sessionKeys.forEach(key => {
    sessionStorage.removeItem(key);
  });
  
  const cookiePaths = ['/', '/dashboard', '/user', '/admin'];
  const cookieNames = ['auth_data', 'XSRF-TOKEN', 'laravel_session', 'token'];
  
  cookieNames.forEach(name => {
    cookiePaths.forEach(path => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
    });
    
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
  
  useAppStore(pinia).clearUser();
};


export const forceLogout = () => {
  _clearAllAuthData();
};


export const tokenLogin = (verifyToken, redirect) => {
  return request({
    url: `/passport/auth/token2Login`,
    method: 'get',
    params: { 
      verify: verifyToken,
      redirect: redirect || '' 
    }
  });
};


export const checkUserLoginStatus = async () => {
  const authData = getAuthData();
  const token = getToken();

  const getCurrentRoutePath = () => {
    const hash = window.location.hash || '';
    if (hash.startsWith('#')) {
      const hashPath = hash.slice(1).split('?')[0];
      if (hashPath) {
        return hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
      }
    }

    return window.location.pathname || '/';
  };

  const isAuthRoutePath = (path) => /\/(login|register|forgot-password)/.test(path);
  
  if (!token || !authData) {
    forceLogout(); 
    return { isLoggedIn: false };
  }
  
  try {
    const envelope = await request({
      url: '/user/checkLogin',
      method: 'GET',
      headers: {
        'Authorization': authData
      }
    });
    const responseData = resolvePayload(envelope);
    
    if (responseData?.is_login === true) {
      setUserLoggedInFlag(true);
      return { isLoggedIn: true };
    } else {
      forceLogout();
      
      const currentRoute = getCurrentRoutePath();
      const isAuthPage = isAuthRoutePath(currentRoute);
      
      if (!isAuthPage) {
        window.location.href = '/#/login';
      }
      
      return { isLoggedIn: false, message: '登录已过期，请重新登录' };
    }
  } catch (error) {
    
    if (error.response && error.response.data && error.response.data.message === '未登录或登陆已过期') {
      forceLogout();
      
      const currentRoute = getCurrentRoutePath();
      const isAuthPage = isAuthRoutePath(currentRoute);
      
      if (!isAuthPage) {
        window.location.href = '/#/login';
      }
      
      return { isLoggedIn: false, message: '登录已过期，请重新登录' };
    }
    
    return { isLoggedIn: null, error: error.message || '网络错误' };
  }
};

export const checkSessionWithServer = async () => {
  const authData = getAuthData();
  const token = getToken();

  if (!token || !authData) {
    return { isLoggedIn: false };
  }

  try {
    const envelope = await request({
      url: '/user/checkLogin',
      method: 'GET',
      headers: {
        Authorization: authData
      }
    });
    const responseData = resolvePayload(envelope);

    return {
      isLoggedIn: responseData?.is_login === true,
      isAdmin: responseData?.is_admin === true || responseData?.is_admin === 1
    };
  } catch (error) {
    return {
      isLoggedIn: null,
      error: error?.message || '网络错误'
    };
  }
};
