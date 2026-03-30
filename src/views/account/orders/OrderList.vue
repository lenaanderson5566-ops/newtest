<template>
  <div class="orders-container page-shell">
    <div class="orders-inner page-inner page-stack">
      <button class="account-back-btn" @click="goBackToAccount">
        <IconChevronLeft :size="20" />
      </button>

      <!-- 加载状态 -->
      <div v-if="loading" class="orders-loading">
        <LoadingSpinner />
        <p>{{ headerTexts.loading }}</p>
      </div>
      
      <!-- 错误提示 -->
      <div v-else-if="error" class="orders-error">
        <IconAlertTriangle :size="48" class="error-icon" />
        <p>{{ error }}</p>
        <button class="retry-button" @click="fetchOrders">{{ $t('common.retry') || '重试' }}</button>
      </div>
      
      <!-- 订单列表 -->
      <div v-else-if="orders.length > 0" class="orders-content">
        <div class="orders-filter-bar">
          <label class="filter-switch">
            <input v-model="showCancelledOrders" type="checkbox" class="switch-input" />
            <span class="switch-slider" />
            <span>{{ headerTexts.showCancelled }}</span>
          </label>
        </div>

        <div class="order-table-container">
          <table v-if="filteredOrders.length" class="order-table">
            <thead>
              <tr>
                <th width="24%">{{ headerTexts.createdAt }}</th>
                <th width="20%">{{ headerTexts.subscriptionCycle }}</th>
                <th width="20%">{{ headerTexts.totalAmount }}</th>
                <th width="16%">{{ headerTexts.statusLabel }}</th>
                <th width="20%">{{ headerTexts.actions }}</th>
              </tr>
            </thead>
            <tbody>
              <transition-group name="page-switch">
                <tr v-for="order in filteredOrders" :key="order.trade_no">
                  <td>{{ formatDate(order.created_at) }}</td>
                  <td>{{ formatSubscriptionCycle(order) }}</td>
                  <td class="amount">{{ formatAmount(order.total_amount, order.order_currency || order.pricing_currency) }}</td>
                  <td>
                    <span class="status-badge" :class="getStatusClass(order.status)">
                      {{ getStatusText(order.status) }}
                    </span>
                  </td>
                  <td class="actions">
                    <button 
                      class="action-button view-button" 
                      @click="viewOrderDetail(order.trade_no)" 
                    >
                      <IconEye :size="16" />
                      <span>{{ headerTexts.viewDetail }}</span>
                    </button>
                    <button 
                      class="action-button cancel-button" 
                      @click="showCancelConfirm(order.trade_no)" 
                      v-if="Number(order.status) === 0"
                    >
                      <IconX :size="16" />
                      <span>{{ headerTexts.cancel }}</span>
                    </button>
                  </td>
                </tr>
              </transition-group>
            </tbody>
          </table>
          <div v-else class="orders-empty-inline">{{ headerTexts.noFilteredOrders }}</div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="orders-empty">
        <IconShoppingCart :size="48" class="empty-icon" />
        <p>{{ headerTexts.noOrders }}</p>
        <button class="shop-button" @click="$router.push('/shop')">
          <IconShoppingCart :size="16" />
          <span>{{ headerTexts.goShopping }}</span>
        </button>
      </div>
      
      <!-- 取消订单确认弹窗 -->
      <transition name="modal-fade">
        <div class="modal-overlay" v-if="showConfirmModal" @click="closeConfirmModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>{{ headerTexts.cancelConfirmTitle }}</h3>
              <button class="modal-close" @click="closeConfirmModal">
                <IconX :size="20" />
              </button>
            </div>
            <div class="modal-body">
              <p>{{ headerTexts.cancelConfirmText }}</p>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="closeConfirmModal">
                {{ $t('common.cancel') || '取消' }}
              </button>
              <button class="btn-confirm" @click="confirmCancelOrder" :disabled="canceling">
                <span v-if="canceling" class="loader"></span>
                <span>{{ $t('common.confirm') || '确认' }}</span>
              </button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { 
  IconChevronLeft,
  IconAlertTriangle,
  IconShoppingCart,
  IconEye,
  IconX
} from '@tabler/icons-vue';
import { fetchOrderList, cancelOrder } from '@/api/account/orderlist';

const { t, locale } = useI18n();
const router = useRouter();
const $toast = inject('$toast');

const loading = ref(true);
const error = ref('');
const orders = ref([]);
const showConfirmModal = ref(false);
const currentTradeNo = ref('');
const canceling = ref(false);
const showCancelledOrders = ref(false);
const goBackToAccount = () => {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  router.push('/profile');
};

const fetchOrders = async () => {
  loading.value = true;
  error.value = '';

  try {
    const result = await fetchOrderList();
    
    if (result && result.data) {
      orders.value = result.data;
    } else {
      orders.value = [];
    }
  } catch (err) {
    console.error('Failed to fetch orders:', err);
    error.value = err && err.message ? err.message : t('common.networkError') || '网络错误';
    
    if ($toast) {
      $toast.error(error.value);
    }
  } finally {
    loading.value = false;
  }
};

const formatDate = (timestamp) => {
  if (!timestamp) return '--';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const formatCycle = (cycle) => {
  if (!cycle) return '--';
  
  const cycleMap = {
    'month_price': t('shop.plan.price_options.month') || '月付',
    'quarter_price': t('shop.plan.price_options.quarter') || '季度',
    'half_year_price': t('shop.plan.price_options.half_year') || '半年',
    'year_price': t('shop.plan.price_options.year') || '一年',
    'two_year_price': t('shop.plan.price_options.two_year') || '两年',
    'three_year_price': t('shop.plan.price_options.three_year') || '三年',
    'onetime_price': t('shop.plan.price_options.onetime') || '一次性',
    'reset_price': t('shop.plan.price_options.reset_price') || '重置流量包',
    'deposit': t('shop.plan.price_options.deposit') || '充值' 
  };
  
  return cycleMap[cycle] || cycle;
};

const formatAmount = (amount, orderCurrency) => {
  if (amount === null || amount === undefined) return '--';
  const currency = orderCurrency ? `${orderCurrency}`.toUpperCase() : '--';
  return `${currency} ${(amount / 100).toFixed(2)}`;
};

const getSubscriptionName = (order) => {
  return order?.plan?.name || order?.plan_name || order?.subject || '--';
};

const formatSubscriptionCycle = (order) => {
  const name = getSubscriptionName(order);
  const cycle = formatCycle(order?.period);
  const hasName = !!name && name !== '--';
  const hasCycle = !!cycle && cycle !== '--';

  if (hasName && hasCycle) return `${name}·${cycle}`;
  if (hasName) return name;
  if (hasCycle) return cycle;
  return '--';
};

const statusTextMap = computed(() => {
  return {
    0: t('orders.status.pending', '待支付'),
    1: t('orders.status.processing', '开通中'),
    2: t('orders.status.cancelled', '已取消'),
    3: t('orders.status.completed', '已完成'), 
    4: t('orders.status.discounted', '已折抵'),
    unknown: t('orders.status.unknown', '未知状态')
  };
});

const filteredOrders = computed(() => {
  const allowedStatuses = showCancelledOrders.value ? [0, 1, 2, 3, 4] : [0, 1, 3, 4];
  return orders.value.filter((order) => allowedStatuses.includes(Number(order.status)));
});

const getStatusText = (status) => {
  return statusTextMap.value[status] || `${statusTextMap.value.unknown} (${status})`;
};

const getStatusClass = (status) => {
  const statusClassMap = {
    0: 'status-pending',
    1: 'status-processing',
    2: 'status-cancelled',
    3: 'status-completed',
    4: 'status-discounted'
  };
  
  return statusClassMap[status] || 'status-unknown';
};

const viewOrderDetail = (tradeNo) => {
  router.push({
    path: '/payment',
    query: { trade_no: tradeNo, from: 'orders' }
  });
};

const showCancelConfirm = (tradeNo) => {
  currentTradeNo.value = tradeNo;
  showConfirmModal.value = true;
};

const closeConfirmModal = () => {
  showConfirmModal.value = false;
};

const confirmCancelOrder = async () => {
  if (!currentTradeNo.value || canceling.value) return;
  
  canceling.value = true;
  
  try {
    await cancelOrder(currentTradeNo.value);
    
    if ($toast && typeof $toast.success === 'function') {
      $toast.success(t('orders.cancelSuccess') || '订单已取消');
    }
    
    closeConfirmModal();
    
    fetchOrders();
  } catch (err) {
    console.error('取消订单失败, 错误对象:', err);
    
    let errorMessage = t('orders.cancelFailed') || '取消订单失败';
    
    try {
      if (err) {
        if (typeof err === 'string') {
          errorMessage = err;
        } else if (err instanceof Error) {
          errorMessage = err.message || errorMessage;
        } else if (typeof err.message === 'string') {
          errorMessage = err.message;
        }
      }
    } catch (e) {
      console.error('错误处理过程中出现问题:', e);
    }
    
    if ($toast && typeof $toast.error === 'function') {
      $toast.error(errorMessage);
    } else {
      alert(errorMessage);
    }
    
    closeConfirmModal();
  } finally {
    canceling.value = false;
  }
};

const headerTexts = computed(() => {
  return {
    createdAt: t('orders.createdAt', '创建时间'),
    cycle: t('orders.cycle', '周期'),
    subscriptionCycle: t('orders.subscriptionCycle', '订阅/周期'),
    subscriptionName: t('orders.subscriptionName', '订阅名称'),
    totalAmount: t('orders.totalAmount', '金额'),
    statusLabel: t('orders.statusLabel', '状态') || '状态',
    actions: t('orders.actions', '操作'),
    viewDetail: t('orders.viewDetailShort', '详情'),
    cancel: t('orders.cancelShort', '取消'),
    noOrders: t('orders.noOrders', '暂无订单'),
    goShopping: t('orders.goShopping', '去购买订阅'),
    loading: t('orders.loading', '正在加载订单...'),
    cancelConfirmTitle: t('orders.cancelConfirmTitle', '确认取消订单'),
    cancelConfirmText: t('orders.cancelConfirmText', '您确定要取消此订单吗？此操作无法撤销。'),
    showCancelled: t('orders.showCancelled', '显示已取消订单'),
    noFilteredOrders: t('orders.noFilteredOrders', '当前筛选条件下暂无订单')
  };
});


onMounted(() => {
  fetchOrders();
});

watch(locale, () => {
  if (orders.value.length > 0) {
    orders.value = [...orders.value];
  }
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/base/variables.scss" as *;
@use "@/assets/styles/base/typography.scss" as *;

.orders-container {
  padding: 0;
  padding-bottom: calc(2px + 64px); 
  --order-tone-strong: rgba(var(--theme-color-rgb), 0.92);
  --order-tone-mid: rgba(var(--theme-color-rgb), 0.82);
  --order-tone-soft: rgba(var(--theme-color-rgb), 0.72);
  --order-tone-faint: rgba(var(--theme-color-rgb), 0.12);
  
}

.account-back-btn {
  width: fit-content;
  border: none;
  background: transparent;
  color: var(--text-primary);
  @extend %typo-item-title;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 0;
  margin-bottom: 8px;
}

.orders-content {
  width: 100%;
}

.orders-filter-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.filter-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  @extend %typo-body-text;

  .switch-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .switch-slider {
    position: relative;
    width: 32px;
    height: 18px;
    border-radius: 999px;
    border: 1px solid var(--border-color);
    background: rgba(var(--theme-color-rgb), 0.08);
    transition: all 0.2s ease;
    flex: 0 0 auto;

    &::after {
      content: '';
      position: absolute;
      top: 1px;
      left: 1px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
      transition: transform 0.2s ease;
    }
  }

  .switch-input:checked + .switch-slider {
    background: rgba(var(--theme-color-rgb), 0.7);
    border-color: rgba(var(--theme-color-rgb), 0.4);
  }

  .switch-input:checked + .switch-slider::after {
    transform: translateX(14px);
  }
}

.orders-empty-inline {
  padding: 16px 16px;
  color: var(--text-tertiary);
  text-align: center;
}

.order-table-container {
  overflow-x: auto;
}

.order-table {
  width: 100%;
  border-collapse: collapse;
  font-size: $font-size-sm;
  
  th, td {
    border-bottom: 1px solid var(--border-color);
    padding: 8px 4px;
    text-align: left;
    white-space: nowrap;
    vertical-align: middle;
  }
  
  th {
    font-weight: $font-weight-semibold;
    color: var(--text-primary);
  }
  
  tbody tr {
    &:last-child {
      td {
        border-bottom: none;
      }
    }
  }
  
  .amount {
    font-weight: $font-weight-semibold;
    color: var(--order-tone-strong);
  }
  
  .status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 8px;
    border-radius: 999px; 
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    
    &.status-pending {
      background-color: rgba(var(--theme-color-rgb), 0.08);
      color: var(--order-tone-mid);
    }
    
    &.status-processing {
      background-color: rgba(var(--theme-color-rgb), 0.12);
      color: var(--order-tone-strong);
    }
    
    &.status-cancelled {
      background-color: rgba(var(--theme-color-rgb), 0.06);
      color: var(--order-tone-strong);
    }
    
    &.status-completed {
      background-color: rgba(var(--theme-color-rgb), 0.14);
      color: var(--order-tone-strong);
    }
    
    &.status-discounted {
      background-color: rgba(var(--theme-color-rgb), 0.1);
      color: var(--order-tone-mid);
    }
    
    &.status-unknown {
      background-color: rgba(var(--theme-color-rgb), 0.05);
      color: var(--order-tone-soft);
    }
  }
  
  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    
    .action-button {
      display: flex;
      align-items: center;
      gap: 4px;
      justify-content: center;
      padding: 4px 8px;
      height: 30px;
      min-width: 56px;
      flex: 0 0 56px;
      white-space: nowrap;
      border-radius: 6px;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
      
      &.view-button {
        background-color: rgba(var(--theme-color-rgb), 0.1);
        color: var(--theme-color);
        
        &:hover:not(.disabled) {
          background-color: rgba(var(--theme-color-rgb), 0.2);
          transform: translateY(-2px);
        }
      }
      
      &.cancel-button {
        background-color: rgba(var(--theme-color-rgb), 0.08);
        color: var(--order-tone-mid);
        
        &:hover:not(.disabled) {
          background-color: rgba(var(--theme-color-rgb), 0.12);
          transform: translateY(-2px);
        }
      }
      
      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }
    }
  }
}

@media (max-width: #{$bp-md}) {
  .order-table {
    th, td {
      padding: 8px 4px;
    }

    .actions {
      gap: 4px;

      .action-button {
        min-width: 48px;
        height: 28px;
        padding: 0 4px;
        flex: 0 0 auto;
      }

      .action-button span {
        display: none;
      }
    }

    .status-badge {
      padding: 4px 4px;
      line-height: 1.05;
    }
  }
}


.orders-loading, 
.orders-error, 
.orders-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  text-align: center;
  
  p {
    margin-top: 16px;
    color: rgba(var(--theme-color-rgb), 0.68);
    font-size: $font-size-lg;
  }
  
  .error-icon, 
  .empty-icon {
    color: rgba(var(--theme-color-rgb), 0.68);
    opacity: 0.7;
  }
}

.retry-button,
.shop-button {
  margin-top: 24px;
  height: 40px;
  min-width: 120px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  background-color: rgba(var(--theme-color-rgb), 0.85);
  color: var(--text-on-dark-primary);
  font-weight: $font-weight-medium;
  font-size: $font-size-md;
  border: 1px solid rgba(var(--theme-color-rgb), 0.3);
  box-shadow: none;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: none;
    background-color: rgba(var(--theme-color-rgb), 0.95);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
}


.modal-fade-enter-active {
  animation: fade-in 0.2s ease-out;
}

.modal-fade-leave-active {
  animation: fade-out 0.2s ease-in;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.modal-content {
  background-color: var(--card-background);
  border-radius: $border-radius-sm;
  box-shadow: none;
  width: 90%;
  max-width: 480px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  @media (prefers-color-scheme: dark) {
    background-color: rgba(var(--card-background-rgb, 30, 30, 30), 1);
  }
}

.modal-header {
  padding: 16px 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    color: var(--text-primary);
  }
  
  .modal-close {
    background: none;
    border: none;
    color: rgba(var(--theme-color-rgb), 0.68);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.3s ease;
    
    &:hover {
      background-color: rgba(var(--theme-color-rgb), 0.1);
      color: var(--theme-color);
    }
  }
}

.modal-body {
  padding: 24px;
  
  p {
    margin: 0 0 24px;
    color: var(--text-primary);
  }
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  
  button {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &.btn-cancel {
      background-color: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
    }
    
    &.btn-confirm {
      background-color: rgba(var(--theme-color-rgb), 0.88);
      border: none;
      color: var(--text-on-dark-primary);
      display: flex;
      align-items: center;
      gap: 8px;
      
      &:hover {
        background-color: rgba(var(--theme-color-rgb), 0.98);
      }
      
      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
      
      .loader {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s linear infinite;
      }
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}


.page-switch-enter-active,
.page-switch-leave-active {
  transition: all 0.3s ease;
}

.page-switch-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.page-switch-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}



@media (max-width: #{$bp-md}) {
  .orders-container {
    padding-bottom: calc(2px + 56px);
  }
}


</style> 
