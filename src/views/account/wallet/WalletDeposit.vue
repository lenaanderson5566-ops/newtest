<template>
  <div class="deposit-container page-shell">
    <div class="deposit-inner page-inner page-stack">
      <button class="account-back-btn" @click="goBackToAccount">
        <IconChevronLeft :size="20" />
      </button>

      <!-- 余额信息卡片 -->
      <div class="dashboard-card balance-card">
        <div class="card-header">
          <h2 class="card-title">{{ $t('wallet.balance.title') }}</h2>
        </div>
        <div class="card-body">
          <!-- 余额信息 - 已加载 -->
          <div class="balance-display" v-if="!loading.balance">
            <div class="wallet-balance-list">
              <div
                v-for="wallet in walletBalances"
                :key="wallet.currency"
                class="wallet-balance-item"
              >
                <span class="wallet-currency">{{ wallet.currency }}</span>
                <span class="wallet-amount">{{ formatAmount(wallet.balance) }}</span>
              </div>
            </div>
          </div>

          <!-- 余额信息 - 骨架屏 -->
          <div class="balance-skeleton" v-else>
            <div class="skeleton-balance-value"></div>
            <div class="skeleton-balance-label"></div>
          </div>

        </div>
      </div>

      <!-- 充值卡片 -->
      <div class="dashboard-card deposit-card">
        <div class="card-header">
          <h2 class="card-title">{{ $t('wallet.deposit.title') }}</h2>
        </div>
        <div class="card-body">
          <!-- 充值说明 -->
          <div class="deposit-notice">
            <IconAlertCircle :size="20" class="notice-icon" />
            <span>{{ $t('wallet.deposit.notice') }}</span>
          </div>

          <!-- 预设金额选择 -->
          <div class="amount-selection">
            <div class="period-cards">
              <!-- 骨架屏 - 当货币符号加载中显示 -->
              <template v-if="loading.config">
                <div v-for="i in 4" :key="`skeleton-${i}`" class="period-card skeleton-card">
                  <div class="period-card-inner">
                    <div class="skeleton-price"></div>
                  </div>
                </div>
              </template>
              <!-- 实际金额卡片 - 加载完成后显示 -->
              <template v-else>
                <div
                  v-for="(amount, index) in presetAmounts"
                  :key="index"
                  class="period-card"
                  :class="{ active: selectedAmount === amount }"
                  @click="selectAmount(amount)"
                >
                  <div class="period-card-inner">
                    <div class="period-price">
                      <span class="currency">{{ currencySymbol }}</span>
                      <span class="amount">{{ amount }}</span>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- 自定义金额输入 -->
          <div class="custom-amount">
            <label for="customAmount">{{ $t('wallet.deposit.customAmount') }}</label>
            <!-- 骨架屏 - 当货币符号加载中显示 -->
            <div v-if="loading.config" class="input-container skeleton-input">
              <div class="skeleton-input-field"></div>
            </div>
            <!-- 实际输入框 - 加载完成后显示 -->
            <div v-else class="input-container">
              <span class="currency-symbol">{{ currencySymbol }}</span>
              <input
                id="customAmount"
                v-model="customAmount"
                type="number"
                :min="minimumDepositAmount"
                :placeholder="$t('wallet.deposit.customAmountPlaceholder')"
                @input="onCustomAmountInput"
              />
            </div>
            <small v-if="amountError" class="error-message">{{ amountError }}</small>
          </div>

          <!-- 充值按钮 -->
          <div class="deposit-actions">
            <!-- 骨架屏 - 当货币符号加载中显示 -->
            <div v-if="loading.config" class="btn-order-skeleton"></div>
            <!-- 实际按钮 - 加载完成后显示 -->
            <button 
              v-else
              class="btn-order"
              :disabled="loading.submitting || !isValidAmount || parseFloat(customAmount) < minimumDepositAmount"
              @click="handleDeposit"
            >
              <IconShoppingCart v-if="!loading.submitting" :size="18" />
              <span v-else class="loader"></span>
              <span>{{ $t('wallet.deposit.button') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="WalletDeposit">
import { ref, computed, onMounted, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from '@/composables/useToast';
import { IconAlertCircle, IconChevronLeft, IconShoppingCart } from '@tabler/icons-vue';
import { getUserInfo } from '@/api/account/user';
import { createOrderDeposit, getUserConfig } from '@/api/account/wallet';
import { isXiaoV2board } from '@/utils/baseConfig';
import { useRouter } from 'vue-router';
import { WALLET_CONFIG } from '@/utils/baseConfig';
const { t } = useI18n();
const { showToast } = useToast();
const router = useRouter();
const isXiaoPanel = isXiaoV2board();
if (!isXiaoPanel) {
  router.push('/dashboard');
}
const currencySymbol = ref('$');
const currencyCode = ref('USD');
const walletBalances = ref([]);
const presetAmounts = ref(
  (Array.isArray(WALLET_CONFIG.presetAmounts) && WALLET_CONFIG.presetAmounts.length
    ? WALLET_CONFIG.presetAmounts
    : []
  ).slice(0, 4)
);
const selectedAmount = ref(
  WALLET_CONFIG.defaultSelectedAmount && presetAmounts.value.includes(WALLET_CONFIG.defaultSelectedAmount)
    ? WALLET_CONFIG.defaultSelectedAmount
    : presetAmounts.value[0] || null
);
const customAmount = ref('');
const amountError = ref('');
const minimumDepositAmount = WALLET_CONFIG.minimumDepositAmount || 1;
const loading = reactive({
  balance: true,
  submitting: false,
  config: true
});
const goBackToAccount = () => {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  router.push('/profile');
};
const fetchUserConfig = async () => {
  try {
    const response = await getUserConfig();
    if (response?.data?.currency_symbol) {
      currencySymbol.value = response.data.currency_symbol;
    }
    if (response?.data?.currency) {
      currencyCode.value = String(response.data.currency).toUpperCase();
    }
  } catch (error) {
    console.error('获取用户配置失败:', error);
  } finally {
    loading.config = false;
  }
};
const formatAmount = (amount) => {
  return (parseFloat(amount) / 100).toFixed(2);
};
const normalizeWallets = (userData = {}) => {
  if (Array.isArray(userData.wallets) && userData.wallets.length > 0) {
    return userData.wallets
      .map((wallet) => ({
        currency: String(wallet?.currency || '').toUpperCase(),
        balance: Number(wallet?.balance || 0)
      }))
      .filter((wallet) => wallet.currency);
  }

  return [
    {
      currency: currencyCode.value,
      balance: Number(userData.balance || 0)
    }
  ];
};
const selectAmount = (amount) => {
  selectedAmount.value = amount;
  customAmount.value = '';
  amountError.value = '';
};
const onCustomAmountInput = () => {
  selectedAmount.value = null;
  
  if (customAmount.value === '') {
    amountError.value = '';
    return;
  }
  
  const amount = parseFloat(customAmount.value);
  if (isNaN(amount) || amount <= 0) {
    amountError.value = t('wallet.deposit.amountError.invalid');
  } else if (amount < minimumDepositAmount) {
    amountError.value = t('wallet.deposit.amountError.minimum').replace('1', minimumDepositAmount);
  } else {
    amountError.value = '';
  }
};
const currentAmount = computed(() => {
  if (selectedAmount.value) {
    return selectedAmount.value;
  }
  
  if (customAmount.value && parseFloat(customAmount.value) >= 1) {
    return parseFloat(customAmount.value);
  }
  
  return null;
});
const isValidAmount = computed(() => {
  return currentAmount.value !== null;
});
const fetchUserBalance = async () => {
  loading.balance = true;
  try {
    const response = await getUserInfo();
    if (response && response.data) {
      walletBalances.value = normalizeWallets(response.data);
    }
  } catch (error) {
    console.error('获取用户余额失败:', error);
    showToast(error.response?.message || error.message || t('errors.serverError') || t('common.error_occurred'), 'error');
  } finally {
    loading.balance = false;
  }
};

const handleDeposit = async () => {
  if (!isValidAmount.value) {
    showToast(t('validation.required').replace('{field}', t('wallet.deposit.title')) || t('wallet.deposit.amountError.required'), 'warning');
    return;
  }
  
  try {
    loading.submitting = true;
    
    const amountInCents = Math.round(currentAmount.value * 100);
    
    const response = await createOrderDeposit(amountInCents);
    
    if (response && response.data) {
      const orderId = response.data;
      showToast(t('wallet.deposit.success'), 'success');
      
      router.push({
        path: '/payment',
        query: { 
          trade_no: orderId,
          type: 'deposit'
        }
      });
    }
  } catch (error) {
    console.error('创建充值订单失败:', error);
    showToast(error.response?.message || error.message || t('errors.serverError') || t('wallet.deposit.failed'), 'error');
  } finally {
    loading.submitting = false;
  }
};
onMounted(() => {
  fetchUserBalance();
  fetchUserConfig();
});
</script>
<style lang="scss" scoped>
@use "@/assets/styles/base/variables.scss" as *;

.deposit-container {
  padding: 0;
  display: flex;
  justify-content: center;
  padding-bottom: 80px;
  
  .deposit-inner {
    width: 100%;
      }

  .account-back-btn {
    width: fit-content;
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: $font-size-md;
    font-weight: $font-weight-semibold;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 0;
    margin-bottom: 8px;
  }

  .back-label {
    font-size: $font-size-md;
    color: var(--secondary-text-color);
  }
  
  .dashboard-card {
    background-color: var(--card-bg);
    border-radius: $border-radius-sm;
    box-shadow: none;
    padding: 20px;
    margin-bottom: 24px;
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: none;
      border-color: rgba(var(--theme-color-rgb), 0.3);
    }
    
    &.glassmorphism {
      background-color: rgba(var(--card-background-rgb, 255, 255, 255), 0.7);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      will-change: backdrop-filter, background-color;
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      
      .card-title {
        font-size: $font-size-xl;
        font-weight: $font-weight-semibold;
        margin: 0;
        color: var(--text-primary);
      }
    }
  }
  
  .welcome-card {
    margin-bottom: 24px;
    
    .card-body {
      p {
        color: var(--secondary-text-color);
        font-size: $font-size-md;
        line-height: 1.6;
        margin: 0;
      }
    }
  }
  
  .balance-card {
    .card-body {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 20px;
      gap: 14px;
    }
    
    .balance-display {
      text-align: center;

      .wallet-balance-list {
        width: 100%;
        max-width: 360px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 2px auto 8px;
      }

      .wallet-balance-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        border-radius: $border-radius-sm;
        border: 1px solid var(--border-color);
        background: var(--card-background);
        font-size: $font-size-sm;
      }

      .wallet-currency {
        font-weight: $font-weight-bold;
        color: var(--text-primary);
      }

      .wallet-amount {
        color: var(--secondary-text-color);
        font-variant-numeric: tabular-nums;
        font-size: $font-size-md;
        font-weight: $font-weight-semibold;
      }
      
      .balance-label {
        font-size: $font-size-lg;
        color: var(--secondary-text-color);
      }
    }
    
    
    .balance-skeleton {
      width: 100%;
      text-align: center;
      
      .skeleton-balance-value {
        height: 3.5rem;
        width: 200px;
        margin: 0 auto 12px;
        background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
        border-radius: 10px;
        position: relative;
        overflow: hidden;
      }
      
      .skeleton-balance-label {
        height: 1.1rem;
        width: 160px;
        margin: 0 auto;
        background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
        border-radius: 10px;
        position: relative;
        overflow: hidden;
      }
      
      .skeleton-balance-value, .skeleton-balance-label {
        &::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          width: 30%;
          background: linear-gradient(90deg, 
            rgba(255, 255, 255, 0) 0%, 
            rgba(255, 255, 255, 0.15) 50%, 
            rgba(255, 255, 255, 0) 100%);
          transform: translateX(-100%);
          animation: shimmer 2s infinite;
          will-change: transform;
        }
      }
    }
  }

  .deposit-card {
    .deposit-notice {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      background-color: rgba(var(--theme-color-rgb), 0.08);
      border-radius: $border-radius-sm;
      
      .notice-icon {
        color: var(--primary-color);
      }
      
      span {
        font-size: $font-size-sm;
      }
    }
    
    
    .amount-selection {
      margin-bottom: 12px;
      width: 100%;
      
      .period-cards {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
        width: 100%;
        
        .period-card {
          cursor: pointer;
          border-radius: $border-radius-sm;
          overflow: hidden;
          border: 1px solid var(--border-color);
          transition: all 0.3s ease;
          position: relative;
          box-shadow: none;
          
          &.active {
            border-color: var(--theme-color);
            box-shadow: none;
            
            .period-card-inner {
              background-color: rgba(var(--theme-color-rgb), 0.1);
            }
            
            .period-price {
              .currency,
              .amount {
                color: var(--theme-color);
              }
            }
          }
          
          &:hover {
            border-color: rgba(var(--theme-color-rgb), 0.5);
            transform: translateY(-2px);
            box-shadow: none;
          }
          
          .period-card-inner {
            padding: 12px 8px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100%;
            transition: background-color 0.3s ease;
          }
          
          .period-price {
            display: flex;
            align-items: baseline;
            justify-content: center;
            
            .currency {
              font-size: $font-size-md;
              font-weight: $font-weight-semibold;
              color: var(--text-primary);
              margin-right: 2px;
            }
            
            .amount {
              font-size: $font-size-xl;
              font-weight: $font-weight-bold;
              color: var(--text-primary);
            }
          }
        }
      }
    }
    
    .custom-amount {
      margin-top: 12px;
      
      label {
        display: block;
        font-size: $font-size-sm;
        color: var(--secondary-text-color);
        margin-bottom: 10px;
        font-weight: $font-weight-medium;
      }
      
      .input-container {
        position: relative;
        display: flex;
        align-items: center;
        height: 50px;
        
        .currency-symbol {
          position: absolute;
          left: 15px;
          color: var(--text-primary);
          font-weight: $font-weight-semibold;
          font-size: $font-size-lg;
        }
        
        input {
          width: 100%;
          height: 100%;
          border: 1px solid var(--border-color);
          border-radius: $border-radius-sm;
          background-color: var(--input-bg, rgba(0, 0, 0, 0.02));
          padding: 0 15px 0 35px;
          font-size: $font-size-lg;
          color: var(--text-primary);
          transition: all 0.3s ease;
          
          &:hover {
            border-color: rgba(var(--theme-color-rgb), 0.3);
          }
          
          &:focus {
            outline: none;
            border-color: var(--theme-color);
            box-shadow: none;
          }
          
          &::placeholder {
            color: rgba(var(--text-color-rgb), 0.4);
          }
        }
      }
      
      .error-message {
        display: block;
        margin-top: 8px;
        color: var(--danger-color, #ff4757);
        font-size: $font-size-sm;
      }
    }
    
    
    .deposit-actions {
      margin-top: 25px;
      display: flex;
      justify-content: center;
      
      .btn-order {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        background-color: var(--theme-color);
        color: var(--text-on-dark-primary);
        border: none;
        border-radius: $border-radius-sm;
        padding: 0 30px;
        height: 50px;
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 200px;
        box-shadow: none;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: none;
        }
        
        &:active {
          transform: translateY(0);
          box-shadow: none;
        }
        
        &:disabled {
          background-color: var(--disabled-bg, #cccccc);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .loader {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
        }
      }
    }
  }
}
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(300%);
  }
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0% {
    box-shadow: none;
  }
  70% {
    box-shadow: none;
  }
  100% {
    box-shadow: none;
  }
}

@keyframes sweep {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
@media (max-width: 768px) {
  .back-label {
    display: none;
  }

  .deposit-container {
    padding: 10px;
    padding-bottom: 84px;

    .dashboard-card {
      padding: 14px;
      margin-bottom: 14px;
    }
    
    .balance-card {
      .card-body {
        padding: 14px;
        gap: 10px;
      }
    }
    
    .deposit-card {
      .deposit-notice {
        padding: 8px 10px;
        gap: 8px;
      }

      .amount-selection {
        margin-bottom: 6px;

        .period-cards {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;

          .period-card .period-card-inner {
            padding: 12px 8px;
          }
        }
      }

      .custom-amount {
        margin-top: 10px;
      }

      .deposit-actions {
        margin-top: 14px;

        .btn-order {
          min-width: 0;
          width: 100%;
          height: 44px;
          font-size: $font-size-md;
          padding: 0 18px;
        }
      }
    }
  }
}
.skeleton-card {
  cursor: default;
  border: 2px solid var(--border-color);
  position: relative;
  overflow: hidden;
  
  .skeleton-price {
    height: 24px;
    width: 80%;
    margin: 0 auto;
    background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
    border-radius: 6px;
    position: relative;
    overflow: hidden;
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      width: 30%;
      background: linear-gradient(90deg, 
        rgba(255, 255, 255, 0) 0%, 
        rgba(255, 255, 255, 0.15) 50%, 
        rgba(255, 255, 255, 0) 100%);
      transform: translateX(-100%);
      animation: shimmer 2s infinite;
      will-change: transform;
    }
  }
  
  &:hover {
    transform: none;
    box-shadow: none;
  }
}
.skeleton-input {
  height: 50px;
  position: relative;
  overflow: hidden;
  
  .skeleton-input-field {
    width: 100%;
    height: 100%;
    border: 2px solid var(--border-color);
    border-radius: 12px;
    background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
    position: relative;
    overflow: hidden;
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      width: 30%;
      background: linear-gradient(90deg, 
        rgba(255, 255, 255, 0) 0%, 
        rgba(255, 255, 255, 0.15) 50%, 
        rgba(255, 255, 255, 0) 100%);
      transform: translateX(-100%);
      animation: shimmer 2s infinite;
      will-change: transform;
    }
  }
}
.btn-order-skeleton {
  height: 50px;
  min-width: 200px;
  border-radius: 12px;
  background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: 30%;
    background: linear-gradient(90deg, 
      rgba(255, 255, 255, 0) 0%, 
      rgba(255, 255, 255, 0.15) 50%, 
      rgba(255, 255, 255, 0) 100%);
    transform: translateX(-100%);
    animation: shimmer 2s infinite;
    will-change: transform;
  }
}
</style> 
