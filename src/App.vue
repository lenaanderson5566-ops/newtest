<template>
  <div>
    <!-- 静态布局容器，包含不需要过渡效果的菜单和按钮 -->
    <div class="static-layout" v-if="$route.meta.requiresAuth">
      <!-- 网站名称 -->
      <div class="site-logo">
        <img v-if="siteConfig.showLogo" src="/images/logo.png" alt="Logo" class="site-logo-img" />
        {{ siteConfig.siteName }}
      </div>
      
      <!-- 顶部导航栏 - 保持不变 -->
      <SlideTabsNav />
      
      <!-- 顶部工具栏：语言选择器、主题切换和用户头像 -->
      <div class="top-toolbar">
        <div class="toolbar-wallets" v-if="walletDisplayItems.length">
          <div
            v-for="wallet in walletDisplayItems"
            :key="wallet.currency"
            class="toolbar-wallet-chip"
            :title="`${wallet.currency} ${wallet.amount}`"
          >
            <span class="wallet-currency">{{ wallet.currency }}</span>
            <span class="wallet-amount">{{ wallet.amount }}</span>
          </div>
        </div>
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

    <!-- 认证页面顶部工具栏，确保认证页面也有语言切换器 -->
    <div class="auth-toolbar" v-if="!$route.meta.requiresAuth && $route.path.includes('/auth')">
      <div class="top-toolbar">
        <LanguageSelector />
      </div>
    </div>

    <!-- 路由视图只对内容部分应用过渡效果 -->
    <div :class="['app-content-wrapper', { 'with-left-nav': $route.meta.requiresAuth }]">
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
import { useStore } from 'vuex';
import { useTheme } from '@/composables/useTheme';
import { useRouter, useRoute } from 'vue-router';
import { SITE_CONFIG, PROFILE_CONFIG, CUSTOMER_SERVICE_CONFIG } from '@/utils/baseConfig';
import { checkAuthAndReloadMessages } from '@/utils/authUtils';
import { checkUserLoginStatus } from '@/api/auth';
import { getUserInfo } from '@/api/user';
import { handleRedirectPath } from '@/utils/redirectHandler';
import { normalizeWalletItems } from '@/utils/wallet';
import Toast from '@/components/common/Toast.vue';
import IconDefinitions from '@/components/icons/IconDefinitions.vue';
import SlideTabsNav from '@/components/common/SlideTabsNav.vue';
import LanguageSelector from '@/components/common/LanguageSelector.vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import BackToTop from '@/components/common/BackToTop.vue';
import CustomContextMenu from '@/components/common/CustomContextMenu.vue';
import CustomerServiceIcon from '@/components/common/CustomerServiceIcon.vue';
import CrispEmbed from '@/components/common/CrispEmbed.vue';
import ResourcePreloader from '@/components/common/ResourcePreloader.vue';
import { IconGift } from '@tabler/icons-vue';
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
    LanguageSelector,
    UserAvatar,
    BackToTop,
    CustomContextMenu,
    CustomerServiceIcon,
    CrispEmbed,
    ResourcePreloader,
    IconGift
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const store = useStore();
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
    const walletDisplayItems = ref([]);
    const isLoadingWallets = ref(false);

    const loadUserWallets = async () => {
      if (!route.meta.requiresAuth || isLoadingWallets.value) {
        if (!route.meta.requiresAuth) {
          walletDisplayItems.value = [];
        }
        return;
      }

      isLoadingWallets.value = true;

      try {
        const response = await getUserInfo();
        walletDisplayItems.value = normalizeWalletItems(response?.data?.wallets);
      } catch (error) {
        walletDisplayItems.value = [];
        console.error('Failed to refresh user wallets:', error);
      } finally {
        isLoadingWallets.value = false;
      }
    };

    watch(
      () => route.meta.requiresAuth,
      (requiresAuth) => {
        if (!requiresAuth) {
          walletDisplayItems.value = [];
          return;
        }

        loadUserWallets();
      },
      { immediate: true }
    );
    
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
        loadUserWallets();

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
    
    return {
      username,
      avatarUrl,
      siteConfig,
      PROFILE_CONFIG,
      cachedRoutes,
      customerServiceConfig,
      walletDisplayItems
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


.site-logo {
  position: fixed;
  top: 20px;  
  left: 25px;
  font-size: 16px;  
  font-weight: 700;
  color: var(--theme-color);
  z-index: 110;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  letter-spacing: -0.5px;
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 6px 14px;
  border-radius: 10px;  
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
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
  --toolbar-control-height: 38px;
  --toolbar-control-radius: 999px;
  --toolbar-control-border: rgba(148, 163, 184, 0.24);
  --toolbar-control-bg: color-mix(in srgb, var(--card-bg-color) 92%, #ffffff 8%);
  --toolbar-control-shadow: 0 1px 8px rgba(15, 23, 42, 0.06);

  position: fixed;
  top: 20px;
  right: 25px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 110;

  .toolbar-wallets {
    display: inline-flex;
    align-items: center;
    height: var(--toolbar-control-height);
    padding: 0 8px;
    margin-right: 2px;
    border-radius: var(--toolbar-control-radius);
    border: 1px solid var(--toolbar-control-border);
    background: var(--toolbar-control-bg);
    box-shadow: var(--toolbar-control-shadow);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  .toolbar-wallet-chip {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    padding: 0 10px;
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
    color: var(--text-color);

    &:not(:last-child) {
      border-right: 1px solid color-mix(in srgb, var(--border-color) 75%, transparent);
    }

    .wallet-currency {
      color: var(--text-secondary);
      letter-spacing: 0.2px;
      font-size: 12px;
    }

    .wallet-amount {
      color: var(--text-color);
      font-variant-numeric: tabular-nums;
      min-width: 36px;
    }
  }
  
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
    height: var(--toolbar-control-height);
    border: 1px solid var(--toolbar-control-border);
    background: var(--toolbar-control-bg);
    box-shadow: var(--toolbar-control-shadow);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  :deep(.avatar-wrapper) {
    width: var(--toolbar-control-height);
  }

  :deep(.language-btn) {
    min-width: 120px;
    padding: 0 14px;
  }
}

.app-content-wrapper {
  width: 100%;
}

@media (min-width: 906px) {
  .app-content-wrapper.with-left-nav {
    padding-left: 240px;
  }

  .site-logo {
    left: 24px;
  }
}


@media (max-width: 768px) {
  .site-logo {
    top: 12px;  
    left: 20px;
    font-size: 16px;  
    padding: 5px 10px;
    border-radius: 8px;
  }
  
  .top-toolbar {
    top: 12px;  
    right: 20px;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;

    .toolbar-wallets {
      order: -1;
      height: 34px;
      max-width: 100%;
      margin-left: auto;
      overflow-x: auto;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }
  }
  
  
  main, .main-content, .content-container {
    padding-bottom: 70px !important;
    margin-bottom: 10px !important;
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
  top: 0;
  right: 0;
  z-index: 100;
  
  .top-toolbar {
    position: fixed;
    top: 20px;
    right: 25px;
    display: flex;
    gap: 10px;
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
