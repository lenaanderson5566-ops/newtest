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

NProgress.configure({ 
  showSpinner: true,   
  easing: 'ease',      
  speed: 400,          
  minimum: 0.2         
});

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
@use "sass:math";
@use "@/assets/styles/base/variables.scss" as *;
@use "@/assets/styles/base/reset.scss" as *;
@use "@/assets/styles/base/animations.scss" as *;
@use "@/assets/styles/base/scrollbar.scss" as *;


.page-transitioning {
  overflow: hidden;
}


.static-layout {
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  z-index: var(--app-topbar-z);
}




.app-content-wrapper.with-top-bar {
  .dashboard-card.welcome-card > .card-header,
  .dashboard-card.title-card > .card-header {
    display: none !important;
  }
}
.app-content-wrapper {
  width: 100%;

  &.with-top-bar {
    --page-content-top-gap: var(--page-content-top-gap);
    padding-top: calc(var(--top-fixed-bar-height) + var(--safe-top) + var(--page-content-top-gap, 8px));
  }

  &.with-top-bar.with-page-header {
    padding-top: calc(var(--top-fixed-bar-height) + var(--page-header-height) + var(--safe-top) + var(--page-content-top-gap, 8px));
  }
}

.content-layout-shell {
  width: 100%;
  max-width: var(--layout-content-max-width);
  margin: 0 auto;
  padding-inline: var(--layout-padding-x) var(--layout-padding-x-right);
  box-sizing: border-box;
}

@media (min-width: var(--layout-sidebar-breakpoint)) {
  .app-content-wrapper.with-left-nav {
    padding-left: var(--app-sidebar-width);
  }

  .app-content-wrapper.with-left-nav .content-layout-shell.fixed-content-width {
    width: min(var(--layout-shell-max-width), 100%);
    margin-left: 0;
    margin-right: auto;
    padding-inline: var(--layout-shell-inline-start) var(--layout-shell-inline-end);
  }

  .page-header-layer {
    padding-left: var(--app-sidebar-width);
  }

  .page-header-content {
    width: min(var(--layout-shell-max-width), 100%);
    margin-left: 0;
    margin-right: auto;
    padding: 0 var(--layout-shell-inline-end) 0 var(--layout-shell-inline-start);
  }

}


@media (max-width: 768px) {
  .app-content-wrapper.with-top-bar {
    --page-content-top-gap: var(--page-content-top-gap-mobile);
  }

  .page-header-layer {
    padding: 0;
  }

  .page-header-content {
    padding: 0 var(--layout-padding-x-right) 0 var(--layout-padding-x);
  }

  .page-header-title {
    font-size: var(--page-header-title-size-mobile);
  }

  /* Mobile density optimization: avoid oversized modules */
  .app-content-wrapper {
    .dashboard-card,
    .stats-card,
    .card,
    .info-card {
      border-radius: var(--mobile-card-radius) !important;
    }

    .dashboard-card {
      padding: var(--mobile-card-padding) !important;
    }

    .card-header {
      padding: var(--mobile-card-header-padding) !important;
      min-height: auto !important;

      .card-title,
      h2,
      h3 {
        font-size: var(--mobile-card-title-size) !important;
        line-height: 1.3 !important;
      }
    }

    .card-body {
      padding: var(--mobile-card-body-padding) !important;
      font-size: var(--mobile-card-body-size) !important;
      line-height: 1.45 !important;
    }

    .stats-grid,
    .cards-grid,
    .quick-grid,
    .dashboard-grid {
      gap: var(--mobile-grid-gap) !important;
    }
  }
  
  main, .main-content, .content-container {
    padding-bottom: var(--mobile-content-bottom-padding) !important;
    margin-bottom: var(--mobile-content-bottom-margin) !important;
  }
}


.page-transition-enter-active,
.page-transition-leave-active {
  transition: opacity 0.3s ease;
}

.page-transition-enter-from {
  opacity: 0;
}

.page-transition-leave-to {
  opacity: 0;
}


.language-transitioning .language-transition-item {
  animation: language-fade 0.3s ease-out;
}

@keyframes language-fade {
  0% {
    opacity: 0.2;
  }
  100% {
    opacity: 1;
  }
}


.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}


::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background-color: var(--input-bg-color, rgba(0, 0, 0, 0.05));
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background-color: var(--theme-color);
  border-radius: 3px;
  opacity: 0.7;
  transition: background-color 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background-color: var(--theme-hover-color, rgba(var(--theme-color-rgb), 0.8));
}

::-webkit-scrollbar-corner {
  background-color: transparent;
}


* {
  scrollbar-width: thin;
  scrollbar-color: var(--theme-color) var(--input-bg-color, rgba(0, 0, 0, 0.05));
}


html {
  scroll-behavior: smooth;
}


.eztheme-btn {
  text-decoration: none !important;
  border-bottom: none !important;
  background-image: none !important;
  background-repeat: no-repeat !important;
  background-position: initial !important;
  background-size: initial !important;
  
  &:hover, &:active, &:focus, &:visited {
    text-decoration: none !important;
    border-bottom: none !important;
  }
  
  &::after, &::before {
    display: none !important;
    content: none !important;
  }
}


#nprogress {
  pointer-events: none;
  
  .bar {
    background: var(--theme-color);
    position: fixed;
    z-index: 1031;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    box-shadow: 0 0 10px var(--theme-color), 0 0 5px var(--theme-color);
  }
  
  
  .spinner {
    display: block;
    position: fixed;
    z-index: 1031;
    top: 10px;  
    left: 10px; 
    
    .spinner-icon {
      width: var(--site-logo-icon-size-mobile);
      height: var(--site-logo-icon-size-mobile);
      box-sizing: border-box;
      border: solid 2px transparent;
      border-top-color: var(--theme-color);
      border-left-color: var(--theme-color);
      border-radius: 50%;
      animation: nprogress-spinner 400ms linear infinite;
    }
  }
}

@keyframes nprogress-spinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}


.nprogress-custom-parent {
  overflow: hidden;
  position: relative;
}

.nprogress-custom-parent #nprogress .bar {
  position: absolute;
}
</style> 
