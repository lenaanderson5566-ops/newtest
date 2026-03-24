<template>
  <div class="slide-tabs-container">
    <div class="slide-tabs-wrapper">
      <div class="slide-tabs-nav">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="item.path"
          class="nav-item"
          :class="{ active: activeNavName === item.name }"
        >
          <div class="nav-icon">
            <component :is="getIcon(item.icon)" />
          </div>
          <span class="nav-text">{{ $t(`menu.${item.i18nKey}`) }}</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import IconDashboard from '@/components/icons/IconDashboard.vue';
import IconUser from '@/components/icons/IconUser.vue';
import IconSubscription from '@/components/icons/IconSubscription.vue';
import { IconServer } from '@tabler/icons-vue';

export default {
  name: 'SlideTabsNav',
  setup() {
    const route = useRoute();
    const SIDEBAR_WIDTH = 220;
    const SIDEBAR_BREAKPOINT = 992;
    let mediaQueryList = null;

    const navItems = [
      { path: '/dashboard', name: 'Dashboard', icon: 'IconDashboard', i18nKey: 'overview' },
      { path: '/nodes', name: 'Nodes', icon: 'IconServer', i18nKey: 'region' },
      { path: '/quick-start', name: 'QuickStart', icon: 'IconSubscription', i18nKey: 'quickStart' },
      { path: '/profile', name: 'Profile', icon: 'IconUser', i18nKey: 'my' }
    ];

    const getIcon = (iconName) => {
      switch (iconName) {
        case 'IconDashboard':
          return IconDashboard;
        case 'IconServer':
          return IconServer;
        case 'IconUser':
          return IconUser;
        case 'IconSubscription':
          return IconSubscription;
        default:
          return null;
      }
    };

    const getFallbackActiveNav = (routeName) => {
      const regionRoutes = new Set(['NodeList']);
      const quickStartRoutes = new Set(['QuickStart']);
      const docsRoutes = new Set(['Docs', 'DocDetail']);
      const profileRoutes = new Set([
        'Announcements',
        'Profile',
        'ConfigManagement',
        'SecuritySettings',
        'Billing',
        'TicketList',
        'MobileTickets',
        'TrafficLog',
        'Shop',
        'OrderConfirm',
        'Payment'
      ]);

      if (regionRoutes.has(routeName)) return 'Nodes';
      if (quickStartRoutes.has(routeName)) return 'QuickStart';
      if (docsRoutes.has(routeName)) return 'QuickStart';
      if (profileRoutes.has(routeName)) return 'Profile';
      return 'Dashboard';
    };

    const activeNavName = computed(() => {
      if (route.meta?.activeNav) {
        return route.meta.activeNav === 'Shop' ? 'Profile' : route.meta.activeNav;
      }

      return getFallbackActiveNav(route.name);
    });

    const applySidebarWidth = () => {
      const width = mediaQueryList?.matches ? SIDEBAR_WIDTH : 0;
      document.documentElement.style.setProperty('--left-nav-occupy', `${width}px`);
    };

    const updateDesktopMode = () => {
      applySidebarWidth();
    };

    onMounted(() => {
      mediaQueryList = window.matchMedia(`(min-width: ${SIDEBAR_BREAKPOINT}px)`);
      updateDesktopMode();
      mediaQueryList.addEventListener?.('change', updateDesktopMode);
      mediaQueryList.addListener?.(updateDesktopMode);
    });

    onBeforeUnmount(() => {
      mediaQueryList?.removeEventListener?.('change', updateDesktopMode);
      mediaQueryList?.removeListener?.(updateDesktopMode);
      document.documentElement.style.setProperty('--left-nav-occupy', '0px');
      mediaQueryList = null;
    });

    return {
      navItems,
      activeNavName,
      getIcon
    };
  }
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles/base/variables.scss" as *;

.slide-tabs-container {
  margin-bottom: 14px;
  position: fixed;
  top: 108px;
  left: var(--left-nav-gap, 10px);
  z-index: 10;
  width: var(--left-nav-occupy, 220px);
  transition: width 0.25s ease;

  .slide-tabs-wrapper {
    background: #fff;
    border-radius: $border-radius-sm;
    padding: 2px;
    box-shadow: none;
    border: 1px solid rgba(15, 23, 42, 0.08);
    overflow: hidden;
  }

  .slide-tabs-nav {
    display: flex;
    flex-direction: column;
    gap: 3px;

    .nav-item {
      padding: 8px 10px;
      border-radius: $border-radius-sm;
      font-weight: 500;
      font-size: 13px;
      color: var(--secondary-text-color);
      text-decoration: none;
      text-align: left;
      transition: all 0.25s ease;
      white-space: nowrap;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 8px;
      min-height: 38px;

      .nav-icon {
        display: flex;
        align-items: center;
        justify-content: center;

        svg {
          width: 16px;
          height: 16px;
          transition: color 0.25s ease;
        }
      }

      .nav-text {
        display: inline-block;
        max-width: 112px;
        opacity: 1;
        transform: translateX(0);
        overflow: hidden;
        white-space: nowrap;
        transition: max-width 0.2s ease, opacity 0.2s ease, transform 0.2s ease;
      }

      &.active {
        color: var(--text-color);
        background: rgba(var(--theme-color-rgb), 0.12);
        box-shadow: inset 2px 0 0 rgba(var(--theme-color-rgb), 0.65);

        .nav-icon svg {
          color: var(--theme-color);
        }
      }

      &:hover {
        color: var(--text-color);
        background: rgba(var(--theme-color-rgb), 0.08);
      }

    }
  }
}

@media (max-width: 991px) {
  .slide-tabs-container {
    top: auto;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 92%;
    max-width: 450px;
    margin-bottom: 0;

    .slide-tabs-wrapper {
      width: 100%;
      display: block;
      border-radius: $border-radius-sm;
      padding: 3px;
    }

    .slide-tabs-nav {
      width: 100%;
      flex-direction: row;
      flex-wrap: nowrap;
      overflow: hidden;
      gap: 0;
      padding: 2px;
      justify-content: space-between;

      .nav-item {
        flex: 1 1 0;
        min-width: 0;
        padding: 6px 8px;
        justify-content: center;
        font-size: 13px;
        flex-direction: row;
        gap: 6px;
        height: 50px;

        .nav-icon {
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;

          svg {
            width: 16px;
            height: 16px;
            transition: color 0.3s ease;
          }
        }

        .nav-text {
          font-weight: 500;
          line-height: 1.2;
          max-width: none;
          opacity: 1;
          transform: none;
        }

        &.active {
          .nav-text {
            color: var(--theme-color);
          }

          .nav-icon svg {
            transform: scale(1);
          }
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .slide-tabs-container {
    bottom: 12px;
    width: 94%;

    .slide-tabs-wrapper {
      border-radius: 14px;
    }

    .slide-tabs-nav {
      .nav-item {
        flex: 1 1 0;
        min-width: 0;
        padding: 5px 6px;
        font-size: 11px;
        height: 46px;

        .nav-icon {
          svg {
            width: 14px;
            height: 14px;
          }
        }
      }
    }
  }
}
</style>
