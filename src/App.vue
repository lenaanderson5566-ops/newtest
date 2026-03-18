<template>
  <div>
    <!-- 静态布局容器，包含不需要过渡效果的菜单和按钮 -->
    <div class="static-layout" v-if="$route.meta.requiresAuth">
      <div class="top-fixed-bar">
        <!-- 网站名称 -->
        <div class="site-logo">
          <img v-if="siteConfig.showLogo" src="/images/logo.png" alt="Logo" class="site-logo-img" />
          {{ siteConfig.siteName }}
        </div>

        <!-- 顶部工具栏：语言选择器、主题切换和用户头像 -->
        <div class="top-toolbar">
        <ServiceNoticeButton :has-unread="hasUnreadNotice" aria-label="查看公告通知" />
        <LanguageSelector />
        <button 
          v-if="PROFILE_CONFIG.showGiftCardRedeem" 
          class="gift-btn" 
          @click="$router.push('/profile')"
        >
          <IconGift :size="18" />
        </button>
        <UserAvatar :username="username" :avatarUrl="avatarUrl" />
        </div>
      </div>

      <!-- 顶部导航栏 - 保持不变 -->
      <SlideTabsNav />
    </div>

    <!-- 认证页面顶部工具栏，确保认证页面也有语言切换器 -->
    <div class="auth-toolbar" v-if="!$route.meta.requiresAuth && $route.path.includes('/auth')">
      <div class="top-toolbar">
        <LanguageSelector />
      </div>
    </div>

    <!-- 路由视图只对内容部分应用过渡效果 -->
    <div :class="['app-content-wrapper', { 'with-left-nav': $route.meta.requiresAuth, 'with-top-bar': $route.meta.requiresAuth }]">
      <div :class="['content-layout-shell', { 'fixed-content-width': $route.meta.requiresAuth }]">
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
    
    <!-- 资源预加载组件 -->
    <ResourcePreloader />
    
    <!-- SVG图标定义 -->
    <IconDefinitions />
  </div>
</template>

<script>
import { onMounted, onUnmounted, ref, computed, provide, watch } from 'vue';
import { useAppStore } from '@/store';
import { useTheme } from '@/composables/useTheme';
import { useRouter, useRoute } from 'vue-router';
import { SITE_CONFIG, PROFILE_CONFIG } from '@/utils/baseConfig';
import { checkAuthAndReloadMessages } from '@/utils/authUtils';
import { checkUserLoginStatus } from '@/api/auth';
import { getUnreadNoticeCount } from '@/api/account/notice';
import { handleRedirectPath } from '@/utils/redirectHandler';
import Toast from '@/components/common/Toast.vue';
import IconDefinitions from '@/components/icons/IconDefinitions.vue';
import SlideTabsNav from '@/components/common/SlideTabsNav.vue';
import LanguageSelector from '@/components/common/LanguageSelector.vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import ServiceNoticeButton from '@/components/common/ServiceNoticeButton.vue';
import BackToTop from '@/components/common/BackToTop.vue';
import CustomContextMenu from '@/components/common/CustomContextMenu.vue';
import ResourcePreloader from '@/components/common/ResourcePreloader.vue';
import { IconGift } from '@tabler/icons-vue';
import { useToast } from '@/composables/useToast';
import pageCache from '@/utils/pageCache';

export default {
  name: 'App',
  components: {
    Toast,
    IconDefinitions,
    SlideTabsNav,
    LanguageSelector,
    UserAvatar,
    ServiceNoticeButton,
    BackToTop,
    CustomContextMenu,
    ResourcePreloader,
    IconGift
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const store = useAppStore();
    const { applyTheme } = useTheme();
    const { showToast } = useToast();
    const siteConfig = ref(SITE_CONFIG);
    const cachedRoutes = computed(() => pageCache.getCachedRoutes());
    
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

    const username = computed(() => store.username);
    const avatarUrl = computed(() => store.avatarUrl || '');
    const unreadNoticeCount = ref(0);
    const hasUnreadNotice = computed(() => unreadNoticeCount.value > 0);

    watch(
      () => route.meta.requiresAuth,
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
      if (!route.meta.requiresAuth) {
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
      
      applyTheme(store.currentTheme);
      
      checkAuthAndReloadMessages();
      loadUnreadNoticeCount();

      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      checkUserLoginStatus().then(result => {
        if (result.isLoggedIn === false && result.message) {
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
    
    return {
      username,
      avatarUrl,
      siteConfig,
      PROFILE_CONFIG,
      cachedRoutes,
      hasUnreadNotice
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
  z-index: 100;
}


.top-fixed-bar {
  height: calc(56px + env(safe-area-inset-top, 0px));
  position: fixed;
  top: 0;
  padding-top: env(safe-area-inset-top, 0px);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  z-index: 120;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}


.site-logo {
  font-size: 16px;
  font-weight: 700;
  color: var(--theme-color);
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  gap: 10px;

  .site-logo-img {
    height: 20px;
    width: 20px;
    border-radius: 6px;
    object-fit: cover;
  }
}




.top-toolbar {
  --toolbar-control-height: 34px;
  --toolbar-control-padding: 5px 8px;
  --toolbar-control-radius: 8px;
  --toolbar-control-border: transparent;
  --toolbar-control-bg: transparent;
  --toolbar-control-hover-bg: #f5f7fa;
  --toolbar-control-active-border: #e5e7eb;

  position: static;
  display: flex;
  align-items: center;
  gap: 3px;
  z-index: 110;

  .gift-btn {

    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--toolbar-control-height);
    height: var(--toolbar-control-height);
    border-radius: 50%;
    background: var(--toolbar-control-bg);
    border: 1px solid var(--toolbar-control-border);
    box-shadow: var(--toolbar-control-shadow);
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      border-color: rgba(var(--theme-color-rgb), 0.45);
      color: var(--theme-color);
      box-shadow: 0 3px 10px rgba(15, 23, 42, 0.1);
      transform: translateY(-1px);
    }
  }

  :deep(.language-btn),
  :deep(.avatar-wrapper) {
    min-height: var(--toolbar-control-height);
    padding: var(--toolbar-control-padding);
    border: 1px solid var(--toolbar-control-border);
    background: var(--toolbar-control-bg);
    border-radius: var(--toolbar-control-radius);
    transition: background-color 0.2s ease, border-color 0.2s ease;

    &:hover {
      background: var(--toolbar-control-hover-bg);
    }

    &:active,
    &.is-active {
      border-color: var(--toolbar-control-active-border);
      background: var(--toolbar-control-hover-bg);
    }
  }

  :deep(.avatar-wrapper) {
    width: auto;
    min-width: var(--toolbar-control-height);
    font-size: 14px;
  }

  :deep(.language-btn) {
    min-width: 88px;
    font-size: 14px;
  }
}



.app-content-wrapper.with-top-bar {
  .dashboard-card.welcome-card > .card-header,
  .dashboard-card.title-card > .card-header {
    display: none !important;
  }
}
.app-content-wrapper {
  width: 100%;
  --page-edge-gap: 2px;
  --left-nav-gap: 10px;
  --left-nav-occupy: 176px;

  &.with-top-bar {
    --page-content-top-gap: 8px;
    padding-top: calc(56px + env(safe-area-inset-top, 0px) + var(--page-content-top-gap, 8px));
  }

}


.content-layout-shell {
  width: 100%;
  max-width: var(--page-content-max-width);
  margin: 0 auto;
  padding-inline: var(--page-edge-gap, 2px);
  box-sizing: border-box;
}

@media (min-width: 992px) {
  .app-content-wrapper.with-left-nav {
    padding-left: calc(var(--left-nav-occupy, 176px) + var(--left-nav-gap, 10px));
  }

  .app-content-wrapper.with-left-nav .content-layout-shell.fixed-content-width {
    width: min(var(--page-content-max-width), 100%);
    margin-left: auto;
    margin-right: auto;
    padding-inline: var(--page-edge-gap, 2px);
  }

}


@media (max-width: 768px) {
  .app-content-wrapper.with-top-bar {
    --page-content-top-gap: 6px;
  }

  .site-logo {
    font-size: 14px;
    gap: 8px;

    .site-logo-img {
      width: 18px;
      height: 18px;
    }
  }

  .top-toolbar {
    gap: 3px;
    flex-wrap: nowrap;
    justify-content: flex-end;
  }

  /* Mobile density optimization: avoid oversized modules */
  .app-content-wrapper {
    .dashboard-card,
    .stats-card,
    .card,
    .info-card {
      border-radius: 10px !important;
    }

    .dashboard-card {
      padding: 12px !important;
    }

    .card-header {
      padding: 10px 12px !important;
      min-height: auto !important;

      .card-title,
      h2,
      h3 {
        font-size: 16px !important;
        line-height: 1.3 !important;
      }
    }

    .card-body {
      padding: 10px 12px !important;
      font-size: 14px !important;
      line-height: 1.45 !important;
    }

    .cards-grid,
    .quick-grid,
    .dashboard-grid {
      gap: 8px !important;
    }
  }
  
  main, .main-content, .content-container {
    padding-bottom: 64px !important;
    margin-bottom: 6px !important;
  }
}

/* 统一窄屏容器规则：仅最外层保留 2px，内层容器全部归零，最大化可用宽度 */
@media (max-width: 1200px) {
  .content-layout-shell {
    padding-inline: var(--page-edge-gap, 2px) !important;
  }

  .content-layout-shell > * {
    padding-inline: 0 !important;
  }

  .content-layout-shell > * > [class$="-inner"],
  .content-layout-shell > * > [class*="-inner "],
  .content-layout-shell > * > .my-center-inner {
    padding-inline: 0 !important;
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


.auth-toolbar {
  position: fixed;
  top: env(safe-area-inset-top, 0px);
  right: 0;
  z-index: 100;
  
  .top-toolbar {
    position: fixed;
    top: 20px;
    right: 25px;
    display: flex;
    gap: 16px;
    z-index: 110;
  }
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
      width: 18px;
      height: 18px;
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
