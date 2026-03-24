<template>
  <aside class="account-side-nav" aria-label="Account navigation">
    <button class="back-link" type="button" @click="goHome">
      <IconArrowLeft :size="20" />
      <span>Back to Netflix</span>
    </button>

    <nav class="nav-list">
      <router-link
        v-for="item in navItems"
        :key="item.key"
        :to="item.to"
        class="nav-item"
        :class="{ active: activeItem === item.key }"
      >
        <component :is="item.icon" :size="22" stroke-width="1.9" />
        <span>{{ item.label }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IconArrowLeft,
  IconHome,
  IconCreditCard,
  IconShieldCheck,
  IconDevices,
  IconUser
} from '@tabler/icons-vue';

const route = useRoute();
const router = useRouter();

const navItems = [
  { key: 'overview', label: 'Overview', to: '/dashboard', icon: IconHome },
  { key: 'membership', label: 'Membership', to: '/billing?tab=orders', icon: IconCreditCard },
  { key: 'security', label: 'Security', to: '/security?section=password', icon: IconShieldCheck },
  { key: 'devices', label: 'Devices', to: '/security?section=sessions', icon: IconDevices },
  { key: 'profiles', label: 'Profiles', to: '/profile', icon: IconUser }
];

const activeItem = computed(() => {
  if (route.name === 'Dashboard') return 'overview';
  if (route.name === 'Billing') return 'membership';
  if (route.name === 'Profile') return 'profiles';
  if (route.name === 'SecuritySettings' && route.query.section === 'sessions') return 'devices';
  if (route.name === 'SecuritySettings') return 'security';
  return 'overview';
});

const goHome = () => {
  router.push('/dashboard');
};
</script>

<style scoped lang="scss">
.account-side-nav {
  width: 280px;
  padding: 20px 10px 16px;
}

.back-link {
  border: 0;
  background: transparent;
  color: #121212;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  cursor: pointer;
  margin: 6px 0 24px;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  min-height: 48px;
  border-radius: 10px;
  text-decoration: none;
  color: #3f3f3f;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 10px;
  transition: background-color 0.18s ease, color 0.18s ease;

  &:hover {
    background: #ececec;
    color: #161616;
  }

  &.active {
    color: #111;
    background: #dfdfdf;
  }
}

@media (max-width: 991px) {
  .account-side-nav {
    width: 100%;
    padding: 12px 0 0;
  }

  .back-link {
    margin: 0 0 12px;
    font-size: 15px;
  }

  .nav-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .nav-item {
    min-height: 42px;
    font-size: 14px;
  }
}
</style>
