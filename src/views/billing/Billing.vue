<template>
  <div class="billing-container">
    <div class="billing-inner">
      <div class="billing-tabs-card">
        <button
          class="billing-tab"
          :class="{ active: activeTab === 'wallet' }"
          v-if="showWalletTab"
          @click="switchTab('wallet')"
        >
          {{ $t('menu.wallet') }}
        </button>
        <button
          class="billing-tab"
          :class="{ active: activeTab === 'orders' }"
          @click="switchTab('orders')"
        >
          {{ $t('menu.orders') }}
        </button>
        <button
          class="billing-tab"
          :class="{ active: activeTab === 'invite' }"
          @click="switchTab('invite')"
        >
          {{ $t('menu.invite') }}
        </button>
      </div>

      <div class="billing-panel">
        <WalletDeposit v-if="activeTab === 'wallet' && showWalletTab" />
        <OrderList v-else-if="activeTab === 'orders'" />
        <Invite v-else />
      </div>
    </div>
  </div>
</template>

<script setup name="Billing">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { isXiaoV2board } from '@/utils/baseConfig';
import WalletDeposit from '@/views/wallet/WalletDeposit.vue';
import OrderList from '@/views/orders/OrderList.vue';
import Invite from '@/views/invite/Invite.vue';

const route = useRoute();
const router = useRouter();
const showWalletTab = isXiaoV2board();

const allowedTabs = computed(() => (showWalletTab ? ['wallet', 'orders', 'invite'] : ['orders', 'invite']));

const activeTab = computed(() => {
  const queryTab = String(route.query.tab || '');
  return allowedTabs.value.includes(queryTab) ? queryTab : allowedTabs.value[0];
});

const switchTab = (tab) => {
  if (!allowedTabs.value.includes(tab) || tab === activeTab.value) return;
  router.replace({
    path: '/billing',
    query: {
      ...route.query,
      tab,
    },
  });
};

watch(
  () => route.query.tab,
  () => {
    if (!allowedTabs.value.includes(String(route.query.tab || ''))) {
      router.replace({
        path: '/billing',
        query: {
          ...route.query,
          tab: allowedTabs.value[0],
        },
      });
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.billing-container {
  padding: 20px;
}

.billing-inner {
  max-width: 1240px;
  margin: 0 auto;
}

.billing-tabs-card {
  display: inline-flex;
  gap: 8px;
  padding: 6px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: var(--card-bg-color);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  margin-bottom: 14px;
}

.billing-tab {
  border: 0;
  background: transparent;
  color: var(--text-color);
  height: 34px;
  padding: 0 18px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(var(--theme-color-rgb), 0.08);
  }

  &.active {
    background: var(--theme-color);
    color: #fff;
    box-shadow: 0 2px 8px rgba(var(--theme-color-rgb), 0.3);
  }
}

.billing-panel {
  border-radius: 12px;
}

@media (max-width: 768px) {
  .billing-container {
    padding: 14px;
  }

  .billing-tabs-card {
    width: 100%;
    justify-content: center;
  }

  .billing-tab {
    flex: 1;
    text-align: center;
  }
}
</style>
