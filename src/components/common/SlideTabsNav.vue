<template>
  <nav class="bottom-nav" aria-label="Primary navigation">
    <router-link
      v-for="item in navItems"
      :key="`${item.name}-${languageKey}`"
      :to="item.path"
      class="nav-item"
      :class="{ active: isActive(item) }"
    >
      <component :is="item.icon" class="nav-icon" />
      <span class="nav-text">{{ $t(`menu.${item.i18nKey}`) }}</span>
    </router-link>
  </nav>
</template>

<script>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { IconServer } from '@tabler/icons-vue';
import IconDashboard from '@/components/icons/IconDashboard.vue';
import IconFileText from '@/components/icons/IconFileText.vue';
import IconUser from '@/components/icons/IconUser.vue';

export default {
  name: 'SlideTabsNav',
  setup() {
    const route = useRoute();
    const languageKey = ref(Date.now());



    const handleLanguageChanged = () => {
      languageKey.value = Date.now();
    };

    onMounted(() => {
      window.addEventListener('languageChanged', handleLanguageChanged);
    });

    onUnmounted(() => {
      window.removeEventListener('languageChanged', handleLanguageChanged);
    });

    const navItems = computed(() => [
      { path: '/dashboard', name: 'Dashboard', icon: IconDashboard, i18nKey: 'overview' },
      { path: '/nodes', name: 'Nodes', icon: IconServer, i18nKey: 'region' },
      { path: '/docs', name: 'Docs', icon: IconFileText, i18nKey: 'usage' },
      { path: '/profile', name: 'Profile', icon: IconUser, i18nKey: 'my' }
    ]);

    const isActive = (item) => {
      const activeNav = route.meta?.activeNav;
      if (activeNav) return activeNav === item.name;
      return route.name === item.name;
    };

    return { navItems, languageKey, isActive };
  }
};
</script>

<style lang="scss" scoped>
.bottom-nav {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(12px + var(--safe-bottom));
  z-index: 90;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  padding: 8px;
  border-radius: 18px;
  background: var(--fx-glass-strong);
  border: 1px solid var(--fx-border);
  backdrop-filter: blur(18px);
  box-shadow: var(--fx-shadow-1);
}

.nav-item {
  min-height: 46px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: var(--fx-text-dim);
  gap: 4px;
  transition: background-color .2s ease, color .2s ease, box-shadow .2s ease;
}

.nav-item.active {
  color: var(--fx-text);
  background: var(--fx-active-bg);
  box-shadow: inset 0 0 0 1px var(--fx-border-strong), 0 0 20px rgba(var(--theme-color-rgb), .25);
}

.nav-icon {
  width: 18px;
  height: 18px;
}

.nav-text {
  font-size: 11px;
  line-height: 1;
}

@media (min-width: 960px) {
  .bottom-nav {
    width: 430px;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
  }
}
</style>
