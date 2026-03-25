<template>
  <div class="gift-card-page page-shell">
    <div class="gift-card-inner page-inner page-stack">
      <button class="account-back-btn" @click="goBack">
        <IconChevronLeft :size="20" />
      </button>

      <section class="dashboard-card redeem-hero">
        <div class="hero-head">
          <IconGift :size="22" />
          <h2>{{ $t('profile.giftCardTitle') }}</h2>
        </div>

        <div class="redeem-form">
          <input
            v-model.trim="giftCode"
            type="text"
            :placeholder="$t('profile.giftCardPlaceholder')"
            :disabled="redeeming"
          />
          <button class="btn-primary" :disabled="redeeming || !giftCode" @click="submitRedeem">
            {{ redeemButtonText }}
          </button>
        </div>
      </section>

      <section class="dashboard-card rule-card">
        <h3>兑换说明</h3>
        <ul>
          <li><strong>type 1：</strong>余额充值（value 单位：分）</li>
          <li><strong>type 2：</strong>延长有效期（value 单位：天）</li>
          <li><strong>type 3：</strong>增加流量（value 单位：GB）</li>
          <li><strong>type 4：</strong>清空流量</li>
          <li><strong>type 5：</strong>直开套餐（value 为天数，0 表示不过期）</li>
        </ul>
      </section>

      <section v-if="lastResult" class="dashboard-card result-card">
        <div class="result-title">
          <IconCheck :size="18" />
          <span>{{ $t('profile.giftCardSuccess') }}</span>
        </div>
        <p>{{ lastResultText }}</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IconCheck, IconChevronLeft, IconGift } from '@tabler/icons-vue';
import { useI18n } from 'vue-i18n';
import { redeemGiftCard } from '@/api/account/user';
import { useToast } from '@/composables/useToast';

const { t } = useI18n();
const router = useRouter();
const { showToast } = useToast();

const giftCode = ref('');
const redeeming = ref(false);
const lastResult = ref(null);
const redeemButtonText = computed(() => {
  const label = t('profile.giftCardSubmit');
  return redeeming.value ? `${label}...` : label;
});

const formatResultText = (payload) => {
  const type = Number(payload?.type || 0);
  const value = Number(payload?.value || 0);

  if (type === 1) return `已充值余额：${(value / 100).toFixed(2)}`;
  if (type === 2) return `已延长有效期：${value} 天`;
  if (type === 3) return `已增加流量：${value} GB`;
  if (type === 4) return '已清空流量';
  if (type === 5) return value === 0 ? '已开通不过期套餐' : `已开通套餐：${value} 天`;
  return '兑换成功';
};

const lastResultText = computed(() => (lastResult.value ? formatResultText(lastResult.value) : ''));

const submitRedeem = async () => {
  if (!giftCode.value) {
    showToast(t('profile.giftCardEmpty'), 'error');
    return;
  }

  redeeming.value = true;
  try {
    const res = await redeemGiftCard(giftCode.value);
    lastResult.value = (res && typeof res === 'object' && 'type' in res)
      ? res
      : (res?.data && typeof res.data === 'object' ? res.data : null);
    showToast(t('profile.giftCardSuccess'), 'success');
    giftCode.value = '';
  } catch (err) {
    console.error('Failed to redeem gift card:', err);
    showToast(t('profile.giftCardError'), 'error');
  } finally {
    redeeming.value = false;
  }
};

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  router.push('/profile');
};
</script>

<style scoped lang="scss">
.gift-card-page {
  .gift-card-inner {
    gap: 12px;
  }
}

.account-back-btn {
  width: fit-content;
  border: none;
  background: transparent;
  color: var(--text-color);
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  padding: 0;
}

.redeem-hero,
.rule-card,
.result-card {
  padding: 16px;
}

.hero-head {
  display: flex;
  align-items: center;
  gap: 8px;

  h2 {
    margin: 0;
    font-size: 20px;
  }
}

.redeem-form {
  margin-top: 12px;
  display: flex;
  gap: 10px;

  input {
    flex: 1;
    min-width: 0;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 0 12px;
    height: 42px;
  }
}

.btn-primary {
  border: none;
  border-radius: 10px;
  padding: 0 16px;
  height: 42px;
}

.rule-card {
  h3 {
    margin: 0 0 8px;
    font-size: 16px;
  }

  ul {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 6px;
    color: var(--secondary-text-color);
  }
}

.result-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
}
</style>
