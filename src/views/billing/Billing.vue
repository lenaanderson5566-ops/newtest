<template>
  <div class="billing-container">
    <div class="billing-inner">
      <div class="billing-tabs-wrap">
        <BaseTabs
          class="billing-tabs-card"
          :model-value="activeTab"
          :items="tabItems"
          @update:model-value="switchTab"
        />
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
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { isXiaoV2board } from '@/utils/baseConfig';
import WalletDeposit from '@/views/wallet/WalletDeposit.vue';
import OrderList from '@/views/orders/OrderList.vue';
import Invite from '@/views/invite/Invite.vue';
import BaseTabs from '@/components/base/BaseTabs.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const showWalletTab = isXiaoV2board();

const allowedTabs = computed(() => (showWalletTab ? ['wallet', 'orders', 'referral'] : ['orders', 'referral']));

const activeTab = computed(() => {
  const queryTab = String(route.query.tab || '');
  return allowedTabs.value.includes(queryTab) ? queryTab : allowedTabs.value[0];
});

const tabItems = computed(() => {
  const items = [];

  if (showWalletTab) {
    items.push({ value: 'wallet', label: t('menu.wallet') });
  }

  items.push({ value: 'orders', label: t('menu.orders') });
  items.push({ value: 'referral', label: t('menu.referral') });

  return items;
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
  padding: var(--layout-gutter-desktop) var(--layout-gutter-desktop) 12px;
  padding-bottom: calc(12px + var(--safe-bottom));
  background: transparent;
  min-height: calc(100dvh - var(--top-fixed-bar-height));
}

.billing-inner {
  max-width: var(--layout-content-max-width);
  margin: 0 auto;
  display: grid;
  gap: var(--mobile-card-padding);
}

.billing-tabs-wrap {
  position: sticky;
  top: calc(var(--top-fixed-bar-height) + var(--safe-top) + var(--page-content-top-gap));
  z-index: 8;
}

.billing-tabs-card {
  margin-bottom: 0;
}

.billing-panel {
  border-radius: var(--radius-lg);
  margin-top: 0;
  min-height: 0;
}

@media (max-width: 768px) {
  .billing-container {
    padding: var(--layout-gutter-mobile);
    padding-bottom: calc(72px + var(--safe-bottom));
  }

  .billing-tabs-wrap {
    top: calc(var(--top-fixed-bar-height) + var(--safe-top) + var(--page-content-top-gap-mobile));
  }
}
</style>
