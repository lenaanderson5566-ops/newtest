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

  if (type === 1) return t('myCenter.giftCardResultType1', { value: (value / 100).toFixed(2) });
  if (type === 2) return t('myCenter.giftCardResultType2', { value });
  if (type === 3) return t('myCenter.giftCardResultType3', { value });
  if (type === 4) return t('myCenter.giftCardResultType4');
  if (type === 5) return value === 0
    ? t('myCenter.giftCardResultType5NoExpire')
    : t('myCenter.giftCardResultType5', { value });
  return t('profile.giftCardSuccess');
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
@use "@/assets/styles/base/variables.scss" as *;
@use "@/assets/styles/base/typography.scss" as *;
.gift-card-page {
  .gift-card-inner {
    gap: 12px;
  }
}

.account-back-btn {
  width: fit-content;
  border: none;
  background: transparent;
  color: var(--text-primary);
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  padding: 0;
}

.redeem-hero,
.result-card {
  padding: 16px;
}

.hero-head {
  display: flex;
  align-items: center;
  gap: 8px;

  h2 {
    margin: 0;
    @extend %typo-section-title;
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

.result-title {
  display: flex;
  align-items: center;
  gap: 6px;
  @extend %typo-item-title;
}
</style>
