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
        <div
          class="toolbar-wallets"
          v-if="primaryWallet"
          ref="walletContainer"
        >
          <button
            class="toolbar-wallet-main"
            :class="{ 'is-active': walletDropdownOpen }"
            :title="`${primaryWallet.currency} ${primaryWalletDisplay}`"
            @click.stop="toggleWalletDropdown"
          >
            <IconWallet class="wallet-icon" :size="16" aria-hidden="true" />
            <span class="wallet-main-amount">{{ primaryWalletDisplay }}</span>
          </button>

          <transition name="fade">
            <div
              v-if="walletDropdownOpen && extraWalletItems.length"
              class="wallet-dropdown"
              @click.stop
            >
              <div class="wallet-dropdown-title">{{ $t('wallet.balance.title') }}</div>
              <div
                v-for="wallet in walletDisplayItems"
                :key="wallet.currency"
                class="wallet-row"
              >
                <span class="wallet-row-currency">{{ wallet.currency }}</span>
                <span class="wallet-row-amount">{{ formatWalletDisplay(wallet) }}</span>
              </div>
              <button class="wallet-deposit-btn" @click="goToWalletDeposit">{{ $t('wallet.deposit.title') }}</button>
            </div>
          </transition>
        </div>
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

      <div class="page-header-layer" v-if="pageHeaderTitle">
        <div class="page-header-content">
          <div class="page-header-title">{{ pageHeaderTitle }}</div>
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
    <div :class="['app-content-wrapper', { 'with-left-nav': $route.meta.requiresAuth, 'with-top-bar': $route.meta.requiresAuth, 'with-page-header': $route.meta.requiresAuth && !!pageHeaderTitle }]">
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
import { useI18n } from 'vue-i18n';
import { SITE_CONFIG, PROFILE_CONFIG, CUSTOMER_SERVICE_CONFIG } from '@/utils/baseConfig';
import { checkAuthAndReloadMessages } from '@/utils/authUtils';
import { checkUserLoginStatus } from '@/api/auth';
import { getUserInfo } from '@/api/user';
import { getUnreadNoticeCount } from '@/api/notice';
import { handleRedirectPath } from '@/utils/redirectHandler';
import { normalizeWalletItems } from '@/utils/wallet';
import Toast from '@/components/common/Toast.vue';
import IconDefinitions from '@/components/icons/IconDefinitions.vue';
import SlideTabsNav from '@/components/common/SlideTabsNav.vue';
import LanguageSelector from '@/components/common/LanguageSelector.vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import ServiceNoticeButton from '@/components/common/ServiceNoticeButton.vue';
import BackToTop from '@/components/common/BackToTop.vue';
import CustomContextMenu from '@/components/common/CustomContextMenu.vue';
import CustomerServiceIcon from '@/components/common/CustomerServiceIcon.vue';
import CrispEmbed from '@/components/common/CrispEmbed.vue';
import ResourcePreloader from '@/components/common/ResourcePreloader.vue';
import { IconGift, IconWallet } from '@tabler/icons-vue';
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
    ServiceNoticeButton,
    BackToTop,
    CustomContextMenu,
    CustomerServiceIcon,
    CrispEmbed,
    ResourcePreloader,
    IconGift,
    IconWallet
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
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
    const walletDisplayItems = ref([]);
    const isLoadingWallets = ref(false);
    const walletDropdownOpen = ref(false);
    const walletContainer = ref(null);
    const unreadNoticeCount = ref(0);
    const hasUnreadNotice = computed(() => unreadNoticeCount.value > 0);

    const currencySymbols = {
      USD: '$',
      CNY: '¥',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      HKD: 'HK$',
      TWD: 'NT$',
    };

    const primaryWallet = computed(() => {
      if (!walletDisplayItems.value.length) return null;
      return walletDisplayItems.value.find((item) => item.currency === 'USD') || walletDisplayItems.value[0];
    });

    const extraWalletItems = computed(() => {
      if (!primaryWallet.value) return [];
      return walletDisplayItems.value.filter((item) => item.currency !== primaryWallet.value.currency);
    });

    const formatWalletDisplay = (wallet) => {
      const symbol = currencySymbols[wallet.currency] || `${wallet.currency} `;
      return `${symbol}${wallet.amount}`;
    };

    const primaryWalletDisplay = computed(() => {
      if (!primaryWallet.value) return '';
      return formatWalletDisplay(primaryWallet.value);
    });


    const toggleWalletDropdown = () => {
      if (!extraWalletItems.value.length) return;
      walletDropdownOpen.value = !walletDropdownOpen.value;
    };

    const goToWalletDeposit = () => {
      walletDropdownOpen.value = false;
      router.push('/billing?tab=wallet');
    };

    const handleWalletClickOutside = (event) => {
      if (walletContainer.value && !walletContainer.value.contains(event.target)) {
        walletDropdownOpen.value = false;
      }
    };

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
          unreadNoticeCount.value = 0;
          return;
        }

        loadUserWallets();
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
        loadUserWallets();
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
      document.addEventListener('click', handleWalletClickOutside);
      
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
      document.removeEventListener('click', handleWalletClickOutside);
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
      walletDisplayItems,
      walletDropdownOpen,
      walletContainer,
      primaryWallet,
      extraWalletItems,
      primaryWalletDisplay,
      formatWalletDisplay,
      toggleWalletDropdown,
      goToWalletDeposit,
      hasUnreadNotice,
      pageHeaderTitle
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


:global(body) {
  --top-fixed-bar-height: 60px;
  --page-header-height: 42px;
}

.top-fixed-bar {
  height: var(--top-fixed-bar-height);
  position: fixed;
  top: 0;
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
  padding: 0 24px;
  z-index: 120;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.page-header-layer {
  position: fixed;
  top: var(--top-fixed-bar-height);
  left: 0;
  right: 0;
  height: var(--page-header-height);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.8);
  z-index: 115;
}

.page-header-content {
  height: 100%;
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 24px;
}

.page-header-title {
  font-size: 18px;
  line-height: 1;
  font-weight: 700;
  color: #0f172a;
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

  .toolbar-wallets {
    position: relative;
    display: inline-flex;
    align-items: center;
    height: var(--toolbar-control-height);
    margin-right: 2px;

    .toolbar-wallet-main {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: var(--toolbar-control-height);
      padding: var(--toolbar-control-padding);
      border-radius: var(--toolbar-control-radius);
      border: 1px solid var(--toolbar-control-border);
      background: var(--toolbar-control-bg);
      color: var(--text-color, #111827);
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      transition: background-color 0.2s ease, border-color 0.2s ease;

      &:hover {
        background: var(--toolbar-control-hover-bg);
      }

      &:active,
      &.is-active {
        border-color: var(--toolbar-control-active-border);
        background: var(--toolbar-control-hover-bg);
      }

      .wallet-icon {
        font-size: 15px;
        line-height: 1;
        opacity: 1;
      }
    }

    .wallet-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      min-width: 200px;
      padding: 10px;
      border-radius: 12px;
      border: 1px solid var(--border-color);
      background: rgba(var(--card-background-rgb), 0.95);
      backdrop-filter: blur(10px);
      box-shadow: var(--shadow-card-md);
      z-index: 120;

      .wallet-dropdown-title {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-bottom: 8px;
      }

      .wallet-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 0;
        font-size: 13px;

        .wallet-row-currency {
          color: var(--secondary-text-color);
          font-weight: 600;
        }

        .wallet-row-amount {
          color: var(--text-color);
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }
      }

      .wallet-deposit-btn {
        margin-top: 10px;
        width: 100%;
        height: 32px;
        border: none;
        border-radius: 8px;
        color: #fff;
        background: linear-gradient(135deg, var(--button-primary-start), var(--button-primary-end));
        cursor: pointer;
        font-size: 13px;
        line-height: 1;
        font-weight: 600;
      }
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

  &.with-top-bar {
    --page-content-top-gap: 8px;
    padding-top: calc(
      var(--top-fixed-bar-height, 60px) +
      var(--page-content-top-gap, 8px) +
      env(safe-area-inset-top, 0px)
    );
  }

  &.with-top-bar.with-page-header {
    padding-top: calc(
      var(--top-fixed-bar-height, 60px) +
      var(--page-header-height, 42px) +
      var(--page-content-top-gap, 8px) +
      env(safe-area-inset-top, 0px)
    );
  }
}

.content-layout-shell {
  width: 100%;
}

@media (min-width: 906px) {
  .app-content-wrapper.with-left-nav {
    padding-left: 240px;
  }

  .content-layout-shell.fixed-content-width {
    width: min(1180px, 100%);
    margin-right: auto;
    margin-left: 0;
  }

  .page-header-layer {
    padding-left: 240px;
  }

  .page-header-content {
    width: min(1180px, 100%);
    margin-right: auto;
    margin-left: 0;
    padding: 0 24px 0 56px;
  }

}


@media (max-width: 768px) {
  :global(body) {
    --top-fixed-bar-height: 54px;
    --page-header-height: 38px;
  }

  .app-content-wrapper.with-top-bar {
    --page-content-top-gap: 6px;
  }

  .top-fixed-bar {
    padding: 0 12px;
  }

  .page-header-layer {
    padding: 0;
  }

  .page-header-content {
    padding: 0 12px;
  }

  .page-header-title {
    font-size: 16px;
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

    .toolbar-wallets {
      order: -1;
      height: 34px;
      margin-left: auto;
    }
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

    .stats-grid,
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
