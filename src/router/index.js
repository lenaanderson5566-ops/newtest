

import { createRouter, createWebHashHistory } from 'vue-router';

import { SITE_CONFIG, DEFAULT_CONFIG, isBrowserRestricted, AUTH_LAYOUT_CONFIG } from '@/utils/baseConfig';

import i18n, { reloadMessages } from '@/i18n';
import { shouldCheckApiAvailability } from '@/utils/apiAvailabilityChecker';
import { checkSessionWithServer, forceLogout } from '@/api/auth';

import pageCache from '@/utils/pageCache';



const LandingPage = () => import('@/views/landing/LandingPage.vue');

const CustomLandingPage = () => import('@/views/landing/CustomLandingPage.vue');

const ApiValidation = () => import('@/views/errors/ApiValidation.vue');



const getAuthComponent = (componentName) => {

  const layoutType = AUTH_LAYOUT_CONFIG?.layoutType || 'center';

  return () => import(`@/views/auth/${layoutType}/${componentName}.vue`);

};




const ACTIVE_NAV_BY_ROUTE = {
  Dashboard: 'Dashboard',
  NodeList: 'Nodes',
  QuickStart: 'QuickStart',
  Docs: 'Docs',
  DocDetail: 'Docs',
  Profile: 'Profile',
  ConfigManagement: 'Profile',
  SecuritySettings: 'Profile',
  WalletDeposit: 'Profile',
  OrderList: 'Profile',
  Invite: 'Profile',
  TicketList: 'Profile',
  MobileTickets: 'Profile',
  Shop: 'Profile',
  OrderConfirm: 'Profile',
  Payment: 'Profile',
  GiftCardRedeem: 'Profile',
  AnnouncementList: 'Profile'
};

const getActiveNavForRoute = (routeName) => {
  return ACTIVE_NAV_BY_ROUTE[routeName] || 'Dashboard';
};


const Login = getAuthComponent('Login');

const Register = getAuthComponent('Register');

const ForgotPassword = getAuthComponent('ForgotPassword');
const TermsOfService = () => import('@/views/legal/TermsOfService.vue');

const Dashboard = () => import('@/views/overview/Dashboard.vue');
const AnnouncementList = () => import('@/views/account/announcements/AnnouncementList.vue');

const MainBoard = () => import('@/views/layout/MainBoard.vue');

const Profile = () => import('@/views/account/profile/MyCenter.vue');

const BrowserRestricted = () => import('@/views/errors/BrowserRestricted.vue');

const NotFound = () => import('@/views/errors/NotFound.vue');

const AUTH_CHECK_TTL = 30 * 1000;
let authCheckCache = {
  token: '',
  authData: '',
  checkedAt: 0,
  isLoggedIn: null,
  pending: null
};

const getLocalAuthSnapshot = () => ({
  token: localStorage.getItem('token') || sessionStorage.getItem('token') || '',
  authData: localStorage.getItem('auth_data') || sessionStorage.getItem('auth_data') || ''
});

const validateSession = async () => {
  const { token, authData } = getLocalAuthSnapshot();

  if (!token || !authData) {
    return { isLoggedIn: false };
  }

  const now = Date.now();
  const canUseCache = authCheckCache.token === token &&
    authCheckCache.authData === authData &&
    authCheckCache.checkedAt > 0 &&
    now - authCheckCache.checkedAt < AUTH_CHECK_TTL;

  if (canUseCache) {
    return {
      isLoggedIn: authCheckCache.isLoggedIn
    };
  }

  if (authCheckCache.pending) {
    return authCheckCache.pending;
  }

  authCheckCache.pending = checkSessionWithServer().then((result) => {
    authCheckCache.token = token;
    authCheckCache.authData = authData;
    authCheckCache.checkedAt = Date.now();
    authCheckCache.isLoggedIn = result?.isLoggedIn;
    authCheckCache.pending = null;
    return result;
  }).catch(() => {
    authCheckCache.pending = null;
    return { isLoggedIn: null };
  });

  return authCheckCache.pending;
};

const clearAuthCheckCache = () => {
  authCheckCache = {
    token: '',
    authData: '',
    checkedAt: 0,
    isLoggedIn: null,
    pending: null
  };
};



const routes = [

  {

    path: '/',

    redirect: DEFAULT_CONFIG.enableLandingPage ? '/landing' : '/login'

  },

  {

    path: '/api-validation',

    name: 'ApiValidation',

    component: ApiValidation,

    meta: {

      titleKey: 'common.apiChecking',

      requiresAuth: false

    }

  },

  {

    path: '/landing',

    name: 'Landing',

    component: getCustomOrDefaultLandingPage(),

    meta: {

      titleKey: 'landing.mainText',

      requiresAuth: false

    },

    beforeEnter: (to, from, next) => {

      if (!DEFAULT_CONFIG.enableLandingPage) {

        next('/login');

      } else {

        next();

      }

    }

  },

  {

    path: '/login',

    name: 'Login',

    component: Login,

    meta: {

      titleKey: 'common.login',

      requiresAuth: false

    }

  },

  {

    path: '/register',

    name: 'Register',

    component: Register,

    meta: {

      titleKey: 'common.register',

      requiresAuth: false,

      keepAlive: true

    }

  },

  {

    path: '/forgot-password',

    name: 'ForgotPassword',

    component: ForgotPassword,

    meta: {

      titleKey: 'common.forgotPassword',

      requiresAuth: false,

      keepAlive: true

    }

  },
  {
    path: '/terms',
    name: 'TermsOfService',
    component: TermsOfService,
    meta: {
      titleKey: 'auth.termsOfService',
      requiresAuth: false
    }
  },

  {

    path: '/browser-restricted',

    name: 'BrowserRestricted',

    component: BrowserRestricted,

    meta: {

      titleKey: 'errors.browserRestricted',

      requiresAuth: false

    }

  },

  {

    path: '/',

    component: MainBoard,

    meta: { 

      requiresAuth: true 

    },

    children: [

      {

        path: 'dashboard',

        name: 'Dashboard',

        component: Dashboard,

        meta: {

          titleKey: 'menu.overview',

          requiresAuth: true,

          keepAlive: true

        }

      },

      {

        path: 'announcements',

        name: 'Announcements',

        component: AnnouncementList,

        meta: {

          titleKey: 'menu.announcement',

          requiresAuth: true

        }

      },

      {

        path: 'shop',

        name: 'Shop',

        component: () => import('@/views/account/commerce/Shop.vue'),

        meta: {

          titleKey: 'menu.subscription',

          requiresAuth: true,

          keepAlive: true

        }

      },

      {

        path: 'order-confirm',

        name: 'OrderConfirm',

        component: () => import('@/views/account/commerce/OrderConfirm.vue'),

        meta: {

          titleKey: 'orders.confirmOrder',

          requiresAuth: true,

          activeNav: 'Shop' 
        }

      },

      {

        path: 'payment',

        name: 'Payment',

        component: () => import('@/views/account/commerce/Payment.vue'),

        meta: {

          titleKey: 'orders.payment',

          requiresAuth: true,

          activeNav: 'Shop' 
        }

      },

      {
        path: 'quick-start',
        name: 'QuickStart',
        component: () => import('@/views/start/QuickStartPage.vue'),
        meta: {
          titleKey: 'menu.quickStart',
          requiresAuth: true,
          get activeNav() { return getActiveNavForRoute('QuickStart'); }
        }
      },

      {

        path: 'docs',

        name: 'Docs',

        component: () => import('@/views/start/DocsPage.vue'),

        meta: {

          titleKey: 'menu.start',

          requiresAuth: true,

          get activeNav() { return getActiveNavForRoute('Docs'); } 
        }

      },

      {

        path: 'docs/:id',

        name: 'DocDetail',

        component: () => import('@/views/start/DocDetail.vue'),

        meta: {

          titleKey: 'more.viewHelp',

          requiresAuth: true,

          get activeNav() { return getActiveNavForRoute('Docs'); } 
        }

      },

      {

        path: 'nodes',

        name: 'NodeList',

        component: () => import('@/views/region/NodeList.vue'),

        meta: {

          titleKey: 'lines.title',

          requiresAuth: true,

          get activeNav() { return getActiveNavForRoute('NodeList'); } 
        }

      },

      {
        path: 'gift-card',
        name: 'GiftCardRedeem',
        component: () => import('@/views/account/commerce/GiftCardRedeem.vue'),
        meta: {
          titleKey: 'profile.giftCardTitle',
          requiresAuth: true,
          get activeNav() { return getActiveNavForRoute('GiftCardRedeem'); }
        }
      },

      {

        path: 'orders',

        name: 'OrderList',

        component: () => import('@/views/account/orders/OrderList.vue'),

        meta: {

          titleKey: 'orders.title',

          requiresAuth: true,

          get activeNav() { return getActiveNavForRoute('OrderList'); }
        }

      },

      {

        path: 'invite',

        name: 'Invite',

        component: () => import('@/views/account/invite/Invite.vue'),

        meta: {

          titleKey: 'menu.invite',

          requiresAuth: true,

          get activeNav() { return getActiveNavForRoute('Invite'); }
        }

      },

      {

        path: 'tickets',

        name: 'TicketList',

        component: () => import('@/views/account/support/TicketList.vue'),

        meta: {

          titleKey: 'tickets.title',

          requiresAuth: true,

          get activeNav() { return getActiveNavForRoute('TicketList'); } 
        }

      },

      {

        path: 'mobile/tickets',

        name: 'MobileTickets',

        component: () => import('@/views/account/support/MobileTicketList.vue'),

        meta: {

          titleKey: 'tickets.title',

          requiresAuth: true,

          get activeNav() { return getActiveNavForRoute('TicketList'); } 
        }

      },

      {

        path: 'profile',

        name: 'Profile',

        component: Profile,

        meta: {

          titleKey: 'profile.title',

          requiresAuth: true,

          get activeNav() { return getActiveNavForRoute('Profile'); } 
        }

      },

      {

        path: 'config-management',

        name: 'ConfigManagement',

        component: () => import('@/views/account/profile/ConfigManagement.vue'),

        meta: {

          titleKey: 'profile.configManagement',

          requiresAuth: true,

          get activeNav() { return getActiveNavForRoute('ConfigManagement'); }
        }

      },

      {

        path: 'security',

        name: 'SecuritySettings',

        component: () => import('@/views/account/security/SecuritySettings.vue'),

        alias: ['security-settings'],

        meta: {

          titleKey: 'profile.security',

          requiresAuth: true,

          get activeNav() { return getActiveNavForRoute('SecuritySettings'); } 
        }

      },

      {

        path: 'wallet/deposit',

        name: 'WalletDeposit',

        component: () => import('@/views/account/wallet/WalletDeposit.vue'),

        meta: {

          titleKey: 'wallet.title',

          requiresAuth: true,

          get activeNav() { return getActiveNavForRoute('WalletDeposit'); }
        }

      }

    ]

  },

  {

    path: '/:pathMatch(.*)*',

    name: 'NotFound',

    component: NotFound,

    meta: {

      titleKey: 'errors.notFound',

      requiresAuth: false

    }

  }

];



const router = createRouter({

  history: createWebHashHistory(),

  routes,

  scrollBehavior() {

    return { top: 0 };

  }

});



router.beforeEach(async (to, from, next) => {

  if (to.name !== 'BrowserRestricted' && isBrowserRestricted()) {

    next({ name: 'BrowserRestricted' });

    return;

  }

  

  if (shouldCheckApiAvailability() && to.name !== 'ApiValidation') {

    const availableUrl = sessionStorage.getItem('ez_api_available_url');

    if (!availableUrl) {

      const apiRedirectQuery = {

        redirect: to.path,

        ...to.query

      };

      next({ 

        name: 'ApiValidation',

        query: apiRedirectQuery

      });

      return;

    }

  }

  

  const getTitle = () => {

    if (to.meta.titleKey) {

      try {

        const title = i18n.global.t(to.meta.titleKey);

        return `${title} - ${SITE_CONFIG.siteName}`;

      } catch (error) {

        return SITE_CONFIG.siteName;

      }

    }

    return SITE_CONFIG.siteName;

  };

  

  document.title = getTitle();

  

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  

  const loginStatusChanged = 

    (from.meta.requiresAuth && !to.meta.requiresAuth) || 

    (!from.meta.requiresAuth && to.meta.requiresAuth);

  

  if (loginStatusChanged) {

    try {
      await reloadMessages();

    } catch (error) {

    }

  }

  

  if (to.meta.requiresAuth && !token) {

    next({ name: 'Login' });

  } else if (to.meta.requiresAuth) {
    const sessionStatus = await validateSession();

    if (sessionStatus?.isLoggedIn === false) {
      clearAuthCheckCache();
      forceLogout();
      next({ name: 'Login', query: { redirect: to.fullPath } });
      return;
    }

    if (sessionStatus?.isLoggedIn === null) {
      clearAuthCheckCache();
      next({ name: 'Login', query: { redirect: to.fullPath } });
      return;
    }

    next();
  } else if (to.path === '/login' && token) {
    const sessionStatus = await validateSession();
    if (sessionStatus?.isLoggedIn === true) {
      next({ path: '/dashboard' });
      return;
    }

    clearAuthCheckCache();
    next();

  } else {

    document.body.classList.add('page-transitioning');

    

    if (to.meta.keepAlive && to.name) {

      pageCache.addRouteToCache(to.name);

    } else if (to.name && to.meta.keepAlive === false) {

      pageCache.removeRouteFromCache(to.name);

    }

    

    next();

  }

});



router.afterEach(() => {

  setTimeout(() => {

    document.body.classList.remove('page-transitioning');

  }, 400);

});



function getCustomOrDefaultLandingPage() {

  if (!SITE_CONFIG.customLandingPage) {

    return LandingPage;

  }

  return CustomLandingPage;

}



export default router; 
