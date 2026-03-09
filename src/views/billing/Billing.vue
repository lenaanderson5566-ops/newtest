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
          :class="{ active: activeTab === 'referral' }"
          @click="switchTab('referral')"
        >
          Referral
        </button>
      </div>

      <div class="billing-panel">
        <WalletDeposit v-if="activeTab === 'wallet' && showWalletTab" />
        <OrderList v-else-if="activeTab === 'orders'" />
        <Invite v-else-if="activeTab === 'referral'" />
        <OrderList v-else />
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

const allowedTabs = computed(() => (showWalletTab ? ['wallet', 'orders', 'referral'] : ['orders', 'referral']));

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
  padding: var(--space-5);
  background: transparent;
}

.billing-inner {
  max-width: 1240px;
  margin: 0 auto;
}

.billing-tabs-card {
  display: inline-flex;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color-soft);
  background: var(--surface-subtle);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.65);
  margin-bottom: var(--space-4);
}

.billing-tab {
  border: 0;
  background: transparent;
  color: var(--neutral-strong);
  height: 36px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-md);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(var(--theme-color-rgb), 0.08);
  }

  &.active {
    background: linear-gradient(135deg, var(--button-primary-start) 0%, var(--button-primary-end) 100%);
    color: #fff;
    box-shadow: var(--shadow-sm);
  }
}

.billing-panel {
  border-radius: var(--radius-lg);
}

@media (max-width: 768px) {
  .billing-container {
    padding: var(--space-3);
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
