import { createPinia, defineStore } from 'pinia';
import { forceLogout } from '@/api/auth';
import { getToken, setToken, getAuthData } from '@/utils/authState';

export const pinia = createPinia();

export const useAppStore = defineStore('app', {
  state: () => ({
    user: null,
    token: getToken(),
    loading: false,
    error: null
  }),

  getters: {
    isLoggedIn: () => !!getAuthData(),
    userInfo: state => state.user,
    username: state => state.user?.email || state.user?.username || state.user?.name || '',
    avatarUrl: state => state.user?.avatar_url || state.user?.avatar || ''
  },

  actions: {
    login(token) {
      this.token = token;
      setToken(token);
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
      sessionStorage.setItem('userInfo', JSON.stringify(user));
    },

    clearUser() {
      this.user = null;
      this.token = '';
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      sessionStorage.removeItem('userInfo');
      localStorage.removeItem('left_sidebar_collapsed');
      sessionStorage.removeItem('left_sidebar_collapsed');
    },

    initUserInfo() {
      const userInfo = sessionStorage.getItem('userInfo') || localStorage.getItem('userInfo');
      if (userInfo) {
        try {
          this.user = JSON.parse(userInfo);
          localStorage.removeItem('userInfo');
        } catch (err) {
          sessionStorage.removeItem('userInfo');
          localStorage.removeItem('userInfo');
        }
      }
    }
  }
});
