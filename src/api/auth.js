
import request, { getResponseData } from './request';
import { pinia, useAppStore } from '@/store';
import { updateUserLanguage, logoutCurrentSession } from './account/user';
import { getDefaultRegisterLanguage } from '@/utils/userLanguage';
import { reloadMessages, initializeLanguageFromUserSettings } from '@/i18n';


export const handleLoginSuccess = (responseData, rememberMe) => {
  try {
    window.isUserLoggedIn = undefined;
    const usePersistentStorage = rememberMe === true;
    
    useAppStore(pinia).login(responseData.token, { rememberMe: usePersistentStorage });
    
    if (responseData.is_admin === 1) {
      localStorage.setItem('is_admin', '1');
    }
    
    if (responseData.auth_data) {
      if (usePersistentStorage) {
        localStorage.setItem('auth_data', responseData.auth_data);
        sessionStorage.removeItem('auth_data');
      } else {
        sessionStorage.setItem('auth_data', responseData.auth_data);
        localStorage.removeItem('auth_data');
      }
    }
    
    setTimeout(() => {
      window.isUserLoggedIn = true;
      
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
  const responseData = getResponseData(envelope);
  
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
    const responseData = getResponseData(envelope);
    
    if (responseData?.token) {
      useAppStore(pinia).login(responseData.token, { rememberMe: true });
      
      window.isUserLoggedIn = true;
    }
    
    if (responseData?.auth_data) {
      localStorage.setItem('auth_data', responseData.auth_data);
      sessionStorage.removeItem('auth_data');
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
  const now = Date.now();
  if (window._lastLoginCheck && (now - window._lastLoginCheckTime < 1000)) {
    return window._lastLoginCheck;
  }
  
  if (window._isLoggingOut === true) {
    _cacheLoginStatus(false);
    return false;
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('logout') === 'true') {
    _clearAllAuthData();
    _cacheLoginStatus(false);
    return false;
  }
  
  if (window.isUserLoggedIn === false) {
    _cacheLoginStatus(false);
    return false;
  }
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token || token === 'undefined' || token === 'null' || token === '') {
    _clearAllAuthData(); 
    _cacheLoginStatus(false);
    return false;
  }
  
  const authData = localStorage.getItem('auth_data') || 
                  sessionStorage.getItem('auth_data');
                  
  if (!authData || authData === 'undefined' || authData === 'null' || authData === '') {
    if (window.isUserLoggedIn === true) {
      _cacheLoginStatus(true);
      return true;
    }
    
    _clearAllAuthData();
    _cacheLoginStatus(false);
    return false;
  }
  
  const storeAuth = useAppStore(pinia).isLoggedIn;
  if (!storeAuth) {
  }
  
  const userInfoStr = localStorage.getItem('userInfo');
  let userInfo = null;
  
  try {
    if (userInfoStr) {
      userInfo = JSON.parse(userInfoStr);
      if (!userInfo || typeof userInfo !== 'object') {
        userInfo = null;
      }
    }
  } catch (e) {
    userInfo = null;
    localStorage.removeItem('userInfo');
  }
  
  const isLoggedIn = !!token && !!authData;
  
  if (isLoggedIn) {
    window.isUserLoggedIn = true;
  }
  
  _cacheLoginStatus(isLoggedIn);
  return isLoggedIn;
};


const _cacheLoginStatus = (status) => {
  window._lastLoginCheck = status;
  window._lastLoginCheckTime = Date.now();
};


const _clearAllAuthData = () => {
  window.isUserLoggedIn = false;
  
  const authKeys = [
    'token', 
    'auth_data', 
    'cookie_auth_data', 
    'userInfo', 
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
  const authData = localStorage.getItem('auth_data') || sessionStorage.getItem('auth_data');
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

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
    const responseData = getResponseData(envelope);
    
    if (responseData?.is_login === true) {
      window.isUserLoggedIn = true;
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
