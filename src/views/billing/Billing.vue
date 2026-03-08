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
  padding: 24px;
  background: transparent;
}

.billing-inner {
  max-width: 1240px;
  margin: 0 auto;
}

.billing-tabs-card {
  display: inline-flex;
  gap: 6px;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid var(--border-color-soft);
  background: var(--surface-subtle);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.65);
  margin-bottom: 16px;
}

.billing-tab {
  border: 0;
  background: transparent;
  color: var(--neutral-strong);
  height: 34px;
  padding: 0 16px;
  border-radius: 9px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(var(--theme-color-rgb), 0.08);
  }

  &.active {
    background: linear-gradient(135deg, var(--button-primary-start) 0%, var(--button-primary-end) 100%);
    color: #fff;
    box-shadow: 0 6px 14px rgba(37, 99, 235, 0.24);
  }
}

.billing-panel {
  border-radius: var(--radius-lg);
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
