<template>
  <div>
    <!-- 静态布局容器，包含不需要过渡效果的菜单和按钮 -->
    <div class="static-layout" v-if="requiresAuth">
      <AppTopBar
        :site-config="siteConfig"
        :username="username"
        :avatar-url="avatarUrl"
        :has-unread-notice="hasUnreadNotice"
        :show-gift-card-redeem="PROFILE_CONFIG.showGiftCardRedeem"
        @navigate-profile="$router.push('/profile')"
      />

      <div class="page-header-layer" v-if="hasPageHeader">
        <div class="page-header-content">
          <div class="page-header-title">{{ pageHeaderTitle }}</div>
        </div>
      </div>

      <!-- 顶部导航栏 - 保持不变 -->
      <SlideTabsNav />
    </div>

    <!-- 认证页面顶部工具栏，确保认证页面也有语言切换器 -->
    <AuthTopToolbar v-if="!requiresAuth && $route.path.includes('/auth')" />

    <!-- 路由视图只对内容部分应用过渡效果 -->
    <div :class="['app-content-wrapper', { 'with-left-nav': requiresAuth, 'with-top-bar': requiresAuth, 'with-page-header': hasPageHeader }]">
      <div :class="['content-layout-shell', { 'fixed-content-width': requiresAuth }]">
        <router-view v-slot="{ Component, route }">
          <transition 
            name="page-transition" 
            mode="out-in"
            appear
          >
            <keep-alive :include="cachedRoutes" :max="5">
              <component 
                :is="Component" 
                :key="route.path"
                :is-active="true"
              />
            </keep-alive>
          </transition>
        </router-view>
      </div>
    </div>
    
    <!-- 全局Toast通知 - 放在最外层，确保不受页面切换影响 -->
    <Toast />
    
    <!-- 返回顶部按钮 -->
    <BackToTop />
    
    <!-- 自定义鼠标右键菜单 -->
    <CustomContextMenu />
    
    <!-- 客服图标 -->
    <CustomerServiceIcon v-if="$route.path !== '/customer-service'" />
    
    <!-- Crisp嵌入组件（第二种客服系统方案） -->
    <CrispEmbed v-if="customerServiceConfig.embedMode === 'embed'" />
    
    <!-- 资源预加载组件 -->
    <ResourcePreloader />
    
    <!-- SVG图标定义 -->
    <IconDefinitions />
  </div>
</template>

<script>
import { onMounted, onUnmounted, ref, computed, provide, watch } from 'vue';
import { useLayoutShell } from '@/composables/useLayoutShell';
import { useStore } from 'vuex';
import { useTheme } from '@/composables/useTheme';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { SITE_CONFIG, PROFILE_CONFIG, CUSTOMER_SERVICE_CONFIG } from '@/utils/baseConfig';
import { checkAuthAndReloadMessages } from '@/utils/authUtils';
import { checkUserLoginStatus } from '@/api/auth';
import { getUnreadNoticeCount } from '@/api/notice';
import { handleRedirectPath } from '@/utils/redirectHandler';
import Toast from '@/components/common/Toast.vue';
import IconDefinitions from '@/components/icons/IconDefinitions.vue';
import SlideTabsNav from '@/components/common/SlideTabsNav.vue';
import BackToTop from '@/components/common/BackToTop.vue';
import CustomContextMenu from '@/components/common/CustomContextMenu.vue';
import CustomerServiceIcon from '@/components/common/CustomerServiceIcon.vue';
import CrispEmbed from '@/components/common/CrispEmbed.vue';
import ResourcePreloader from '@/components/common/ResourcePreloader.vue';
import AppTopBar from '@/components/layout/AppTopBar.vue';
import AuthTopToolbar from '@/components/layout/AuthTopToolbar.vue';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import pageCache from '@/utils/pageCache';

const readCssNumberVar = (name, fallback) => {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
};

const readCssStringVar = (name, fallback) => {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw || fallback;
};

const configureNProgress = () => {
  NProgress.configure({
    showSpinner: true,
    easing: readCssStringVar('--nprogress-easing', 'ease'),
    speed: readCssNumberVar('--nprogress-speed-ms', 400),
    minimum: readCssNumberVar('--nprogress-minimum', 0.2)
  });
};

configureNProgress();

export default {
  name: 'App',
  components: {
    Toast,
    IconDefinitions,
    SlideTabsNav,
    BackToTop,
    CustomContextMenu,
    CustomerServiceIcon,
    CrispEmbed,
    ResourcePreloader,
    AppTopBar,
    AuthTopToolbar
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { requiresAuth, hasPageHeader } = useLayoutShell();
    const store = useStore();
    const { t } = useI18n();
    const { applyTheme } = useTheme();
    const siteConfig = ref(SITE_CONFIG);
    const cachedRoutes = computed(() => pageCache.getCachedRoutes());
    
    const customerServiceConfig = computed(() => CUSTOMER_SERVICE_CONFIG);
    
    router.beforeEach((to, from, next) => {
      if (to.meta.keepAlive && to.name) {
        pageCache.addRouteToCache(to.name);
      }
      
      if (from.name && from.meta.keepAlive === false) {
        pageCache.removeRouteFromCache(from.name);
      }
      
      NProgress.start();
      next();
    });
    
    router.afterEach(() => {
      NProgress.done();
    });
    
    const handleRedirectParam = () => {
      let redirectParam = null;
      
      const hashParts = window.location.hash.split('?');
      if (hashParts.length > 1) {
        const hashParams = new URLSearchParams(hashParts[1]);
        redirectParam = hashParams.get('redirect');
      }
      
      if (!redirectParam) {
        redirectParam = route.query.redirect;
      }
      
      if (redirectParam && typeof redirectParam === 'string') {
        const targetPath = handleRedirectPath(redirectParam);
        
        if (route.path !== targetPath) {
          router.replace(targetPath);
        }
      }
    };
    
    watch(() => route.fullPath, () => {
      handleRedirectParam();
    });

    const username = computed(() => store.getters.username);
    const avatarUrl = computed(() => store.getters.avatarUrl || '');
    const unreadNoticeCount = ref(0);
    const hasUnreadNotice = computed(() => unreadNoticeCount.value > 0);

    watch(
      () => requiresAuth.value,
      (requiresAuth) => {
        if (!requiresAuth) {
          unreadNoticeCount.value = 0;
          return;
        }

        loadUnreadNoticeCount();
      },
      { immediate: true }
    );
    
    const loadUnreadNoticeCount = async () => {
      if (!requiresAuth.value) {
        unreadNoticeCount.value = 0;
        return;
      }

      try {
        const response = await getUnreadNoticeCount();
        unreadNoticeCount.value = Number(response?.data?.unreadCount || response?.data?.count || 0);
      } catch (error) {
        unreadNoticeCount.value = 0;
        console.warn('Failed to load unread notices, fallback to local state:', error);
      }
    };

    const languageChangedSignal = ref(0);
    
    const onLanguageChanged = () => {
      languageChangedSignal.value++;
      
      setTimeout(() => {
        document.body.classList.add('language-transitioning');
        setTimeout(() => {
          document.body.classList.remove('language-transitioning');
        }, 300);
      }, 0);
    };
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuthAndReloadMessages();
        loadUnreadNoticeCount();

        checkUserLoginStatus().then(result => {
          if (result.isLoggedIn === false && result.message) {
            const { showToast } = require('@/composables/useToast').useToast();
            if (showToast) {
              showToast(result.message, 'warning');
            }
          }
        }).catch(err => {
          console.error('检查登录状态出错:', err);
        });
      }
    };
    
    provide('languageChangedSignal', languageChangedSignal);
    
    const clearCache = () => {
      pageCache.clearCache();
    };
    
    const removeCachedRoute = (routeName) => {
      pageCache.removeRouteFromCache(routeName);
    };
    
    provide('clearCache', clearCache);
    provide('removeCachedRoute', removeCachedRoute);
    
    onMounted(() => {
      window.addEventListener('languageChanged', onLanguageChanged);
      
      applyTheme(store.getters.currentTheme);
      
      checkAuthAndReloadMessages();
      loadUnreadNoticeCount();

      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      checkUserLoginStatus().then(result => {
        if (result.isLoggedIn === false && result.message) {
          const { showToast } = require('@/composables/useToast').useToast();
          if (showToast) {
            showToast(result.message, 'warning');
          }
        }
      }).catch(err => {
        console.error('检查登录状态出错:', err);
      });
      
      handleRedirectParam();
    });
    
    onUnmounted(() => {
      window.removeEventListener('languageChanged', onLanguageChanged);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    });
    

    const pageHeaderTitle = computed(() => {
      const titleKey = route.meta?.titleKey;
      if (titleKey) return t(titleKey);
      return route.meta?.title || route.name || siteConfig.value.siteName || t('common.page');
    });
    return {
      username,
      avatarUrl,
      siteConfig,
      PROFILE_CONFIG,
      cachedRoutes,
      customerServiceConfig,
      hasUnreadNotice,
      pageHeaderTitle,
      requiresAuth,
      hasPageHeader
    };
  }
};
</script>

<style lang="scss">
@use "@/assets/styles/base/variables.scss" as *;
@use "@/assets/styles/base/reset.scss" as *;
@use "@/assets/styles/base/animations.scss" as *;
@use "@/assets/styles/base/scrollbar.scss" as *;

html,
body,
#app {
  background: radial-gradient(circle at 20% -10%, rgba(var(--theme-color-rgb), .22), transparent 40%),
    linear-gradient(160deg, var(--fx-bg), var(--fx-bg-2));
  color: var(--fx-text);
}

.static-layout {
  position: fixed;
  inset: 0 0 auto;
  z-index: var(--app-topbar-z);
}

.page-header-layer {
  height: var(--page-header-height);
  padding: 0 var(--layout-padding-x-right) 0 var(--layout-padding-x);
  border-bottom: 1px solid var(--fx-border);
  background: var(--fx-glass-soft);
  backdrop-filter: blur(14px);
}

.page-header-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.page-header-title {
  font-size: 14px;
  color: var(--fx-text-dim);
}

.app-content-wrapper {
  width: 100%;
}

.app-content-wrapper.with-top-bar {
  padding-top: calc(var(--top-fixed-bar-height) + var(--safe-top));
}

.app-content-wrapper.with-top-bar.with-page-header {
  padding-top: calc(var(--top-fixed-bar-height) + var(--safe-top) + var(--page-header-height));
}

.content-layout-shell {
  width: 100%;
  max-width: var(--layout-content-max-width);
  margin: 0 auto;
  box-sizing: border-box;
}

.page-transition-enter-active,
.page-transition-leave-active {
  transition: opacity .2s ease;
}

.page-transition-enter-from,
.page-transition-leave-to {
  opacity: 0;
}
</style>
