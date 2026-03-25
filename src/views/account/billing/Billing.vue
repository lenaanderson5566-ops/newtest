<template>
  <div class="billing-container page-shell">
    <div class="billing-inner page-inner page-stack">
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
import WalletDeposit from '@/views/account/wallet/WalletDeposit.vue';
import OrderList from '@/views/account/orders/OrderList.vue';
import Invite from '@/views/account/invite/Invite.vue';

const route = useRoute();
const router = useRouter();
const showWalletTab = isXiaoV2board();

const allowedTabs = computed(() => (showWalletTab ? ['wallet', 'orders', 'referral'] : ['orders', 'referral']));

const activeTab = computed(() => {
  const queryTab = String(route.query.tab || '');
  return allowedTabs.value.includes(queryTab) ? queryTab : allowedTabs.value[0];
});

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
  padding: 0;
  background: transparent;
}

.billing-inner {
}

.billing-panel {
  border-radius: var(--radius-lg);
  margin-top: 0;
}
</style>
