import { createPinia, defineStore } from 'pinia';
import { forceLogout } from '@/api/auth';
import { getToken, setToken } from '@/utils/authState';

export const pinia = createPinia();

export const useAppStore = defineStore('app', {
  state: () => ({
    user: null,
    token: getToken(),
    loading: false,
    error: null
  }),

  getters: {
    isLoggedIn: state => !!state.token,
    userInfo: state => state.user,
    username: state => state.user?.email || state.user?.username || state.user?.name || '',
    avatarUrl: state => state.user?.avatar_url || state.user?.avatar || ''
  },

  actions: {
    login(token, options = {}) {
      const rememberMe = options?.rememberMe === true;
      this.token = token;
      setToken(token, rememberMe);
    },

    logout() {
      this.clearUser();
      try {
        if (typeof forceLogout === 'function') {
          forceLogout();
        }
      } catch (error) {
      }
    },

    setUser(user) {
      this.user = user;
      localStorage.setItem('userInfo', JSON.stringify(user));
    },

    clearUser() {
      this.user = null;
      this.token = '';
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('userInfo');
    },

    initUserInfo() {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        try {
          this.user = JSON.parse(userInfo);
        } catch (err) {
          localStorage.removeItem('userInfo');
        }
      }
    }
  }
});
