<template>
  <div class="my-center page-shell">
    <div class="my-center-inner page-inner page-stack">
      <div class="overview-panels" :class="{ 'no-tier': !hasTierInfo }">
        <section class="summary-panel section-block dashboard-like-card">
          <div class="summary-top">
            <div>
              <h2>{{ $t('myCenter.summaryTitle') }}</h2>
              <p class="summary-desc">{{ $t('myCenter.summaryDesc') }}</p>
            </div>
            <button class="btn btn-secondary mini-action" @click="go('/billing?tab=wallet')">{{ $t('myCenter.topUp') }}</button>
          </div>

          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">{{ $t('myCenter.email') }}</span>
              <strong>{{ userInfo.email || '-' }}</strong>
            </div>
            <div class="summary-item">
              <span class="label">{{ $t('myCenter.currentPlan') }}</span>
              <strong>{{ subscriptionText }}</strong>
            </div>
            <div class="summary-item">
              <span class="label">{{ $t('myCenter.expireAt') }}</span>
              <strong>{{ subscriptionExpireText }}</strong>
            </div>
            <div class="summary-item is-highlight">
              <span class="label">{{ $t('myCenter.accountBalance') }}</span>
              <strong>{{ currencySymbol }}{{ formatBalance(userInfo.balance) }}</strong>
            </div>
          </div>
        </section>

        <section v-if="hasTierInfo" class="tier-panel section-block dashboard-like-card">
          <div class="tier-header">
            <div>
              <h3>{{ $t('dashboard.memberTier') }}</h3>
              <div class="tier-member-row">
                <span class="tier-badge" :class="tierBadgeClass">{{ tierBadgeText }}</span>
                <p>{{ tierMemberDisplay }}</p>
              </div>
            </div>
            <span class="tier-level">Lv.{{ userTier.level || '-' }}</span>
          </div>

          <div class="tier-progress-meta">
            {{ $t('dashboard.tierPointsProgress', { points: formatTierNumber(userTier.points), total: formatTierNumber(userTier.nextPointsRequired) }) }}
          </div>
          <div class="tier-progress-track">
            <div class="tier-progress-fill" :style="{ width: `${tierProgress}%` }"></div>
          </div>

          <div class="tier-next" v-if="userTier.nextTierKey">
            {{ $t('dashboard.nextTierHint', { tier: nextTierNameDisplay, points: formatTierNumber(userTier.pointsToNextTier) }) }}
          </div>
        </section>
      </div>

      <section class="section-block dashboard-like-card">
        <h3 class="section-title">{{ $t('myCenter.financeTitle') }}</h3>
        <div class="settings-list">

          <div class="settings-row">
            <div class="row-main">
              <div class="row-title">{{ $t('profile.autoRenewal') }}</div>
              <p>{{ $t('profile.autoRenewalDesc') }}</p>
            </div>
            <label class="switch" :class="{ disabled: updatingAutoRenewal }">
              <input type="checkbox" v-model="autoRenewal" @change="updateAutoRenewalSetting" :disabled="updatingAutoRenewal" />
              <span class="slider round"></span>
            </label>
          </div>

          <button class="nav-row" @click="go('/billing?tab=wallet')">
            <span class="row-icon">
              <IconWallet :size="18" />
            </span>
            <div class="row-main">
              <div class="row-title">{{ $t('myCenter.accountBalance') }}</div>
              <p>{{ $t('myCenter.balanceDesc') }}</p>
            </div>
            <IconChevronRight :size="18" />
          </button>

          <button class="nav-row" @click="go('/billing?tab=orders')">
            <span class="row-icon">
              <IconReceipt :size="18" />
            </span>
            <div class="row-main">
              <div class="row-title">{{ $t('myCenter.orderHistory') }}</div>
              <p>{{ $t('myCenter.orderDesc') }}</p>
            </div>
            <IconChevronRight :size="18" />
          </button>

          <button class="nav-row" @click="go('/billing?tab=referral')">
            <span class="row-icon">
              <IconGift :size="18" />
            </span>
            <div class="row-main">
              <div class="row-title">{{ $t('myCenter.referral') }}</div>
              <p>{{ $t('myCenter.referralDesc') }}</p>
            </div>
            <IconChevronRight :size="18" />
          </button>
        </div>
      </section>

      <section class="section-block dashboard-like-card">
        <h3 class="section-title">{{ $t('myCenter.securityCenterTitle') }}</h3>
        <div class="settings-list">
          <button class="nav-row" @click="go('/security?section=password')">
            <span class="row-icon">
              <IconLock :size="18" />
            </span>
            <div class="row-main">
              <div class="row-title">{{ $t('myCenter.passwordManagement') }}</div>
              <p>{{ $t('myCenter.passwordManagementDesc') }}</p>
            </div>
            <IconChevronRight :size="18" />
          </button>

          <button class="nav-row" @click="go('/security?section=sessions')">
            <span class="row-icon">
              <IconDevices :size="18" />
            </span>
            <div class="row-main">
              <div class="row-title">{{ $t('myCenter.loginRecords') }}</div>
              <p>{{ $t('myCenter.loginRecordsDesc') }}</p>
            </div>
            <IconChevronRight :size="18" />
          </button>

          <button class="nav-row" @click="go('/config-management')">
            <span class="row-icon">
              <IconShieldCog :size="18" />
            </span>
            <div class="row-main">
              <div class="row-title">{{ $t('myCenter.deviceReset') }}</div>
              <p>{{ $t('myCenter.deviceResetDesc') }}</p>
            </div>
            <IconChevronRight :size="18" />
          </button>
        </div>
      </section>

      <section class="section-block dashboard-like-card">
        <h3 class="section-title">{{ $t('myCenter.settingsTitle') }}</h3>
        <div class="settings-list">
          <div class="settings-row">
            <div class="row-main">
              <div class="row-title">{{ $t('myCenter.expireReminder') }}</div>
              <p>{{ $t('myCenter.expireReminderDesc') }}</p>
            </div>
            <label class="switch" :class="{ disabled: updatingSettings }">
              <input type="checkbox" v-model="remindExpire" @change="updateRemindSettings" :disabled="updatingSettings" />
              <span class="slider round"></span>
            </label>
          </div>

          <div class="settings-row">
            <div class="row-main">
              <div class="row-title">{{ $t('myCenter.trafficReminder') }}</div>
              <p>{{ $t('myCenter.trafficReminderDesc') }}</p>
            </div>
            <label class="switch" :class="{ disabled: updatingSettings }">
              <input type="checkbox" v-model="remindTraffic" @change="updateRemindSettings" :disabled="updatingSettings" />
              <span class="slider round"></span>
            </label>
          </div>

        </div>
      </section>

      <div class="bottom-safe-area"></div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IconChevronRight, IconDevices, IconGift, IconLock, IconReceipt, IconShieldCog, IconWallet } from '@tabler/icons-vue';
import { useI18n } from 'vue-i18n';
import { getUserInfo, getUserSubscribe, updateRemindSettings as apiUpdateRemind } from '@/api/account/user';
import { getUserConfig } from '@/api/account/wallet';
import { formatDate } from '@/utils/formatters';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const { t } = useI18n();
const { showToast } = useToast();
const userInfo = ref({});
const subscribeInfo = ref({});
const currencySymbol = ref('$');
const remindExpire = ref(false);
const remindTraffic = ref(false);
const autoRenewal = ref(false);
const updatingSettings = ref(false);
const updatingAutoRenewal = ref(false);

const userTier = computed(() => {
  const tier = userInfo.value?.tier || {};
  return {
    key: tier.key || '',
    level: Number(tier.level || 0),
    points: Number(tier.points || 0),
    nextTierKey: tier.next_tier_key || '',
    nextPointsRequired: Number(tier.next_points_required || 0),
    pointsToNextTier: Number(tier.points_to_next_tier || 0)
  };
});

const hasTierInfo = computed(() => !!userTier.value.key || Number(userTier.value.level || 0) > 0);

const normalizeTierName = (key) => {
  const raw = `${key || ''}`.trim();
  if (!raw) return '-';
  return raw.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
};

const tierMemberDisplay = computed(() => normalizeTierName(userTier.value.key));
const nextTierNameDisplay = computed(() => normalizeTierName(userTier.value.nextTierKey));
const tierBadgeKey = computed(() => `${userTier.value.key || ''}`.toLowerCase());
const tierBadgeClass = computed(() => {
  if (tierBadgeKey.value.includes('bronze')) return 'is-bronze';
  if (tierBadgeKey.value.includes('silver')) return 'is-silver';
  if (tierBadgeKey.value.includes('gold')) return 'is-gold';
  if (tierBadgeKey.value.includes('platinum')) return 'is-platinum';
  if (tierBadgeKey.value.includes('diamond')) return 'is-diamond';
  return 'is-default';
});
const tierBadgeText = computed(() => '★');

const tierProgress = computed(() => {
  const total = Number(userTier.value.nextPointsRequired || 0);
  if (!total) return 0;
  return Math.min(Math.max(Math.round((Number(userTier.value.points || 0) / total) * 100), 0), 100);
});

const formatTierNumber = (value) => Number(value || 0).toLocaleString();

const subscriptionText = computed(() => {
  const name = subscribeInfo.value?.plan?.name;
  return name ? `${name}` : t('myCenter.noSubscription');
});

const subscriptionExpireText = computed(() => {
  if (!subscribeInfo.value?.expired_at) return t('myCenter.notActivated');
  return formatDate(subscribeInfo.value.expired_at);
});

const formatBalance = (balance) => ((Number(balance || 0) / 100).toFixed(2));
const go = (path) => router.push(path);

const buildRemindPayload = () => ({
  remind_expire: remindExpire.value ? 1 : 0,
  remind_traffic: remindTraffic.value ? 1 : 0,
  auto_renewal: autoRenewal.value ? 1 : 0
});

const resetLocalReminderStateFromUserInfo = () => {
  remindExpire.value = !!userInfo.value.remind_expire;
  remindTraffic.value = !!userInfo.value.remind_traffic;
  autoRenewal.value = !!userInfo.value.auto_renewal;
};

const updateRemindSettings = async () => {
  try {
    updatingSettings.value = true;
    await apiUpdateRemind(buildRemindPayload());
    userInfo.value.remind_expire = remindExpire.value ? 1 : 0;
    userInfo.value.remind_traffic = remindTraffic.value ? 1 : 0;
    userInfo.value.auto_renewal = autoRenewal.value ? 1 : 0;
    showToast(t('myCenter.settingsUpdated'), 'success');
  } catch (error) {
    resetLocalReminderStateFromUserInfo();
    showToast(t('myCenter.settingsUpdateFailed'), 'error');
  } finally {
    updatingSettings.value = false;
  }
};

const updateAutoRenewalSetting = async () => {
  try {
    updatingAutoRenewal.value = true;
    await apiUpdateRemind(buildRemindPayload());
    userInfo.value.auto_renewal = autoRenewal.value ? 1 : 0;
    showToast(t('profile.updateSuccess'), 'success');
  } catch (error) {
    resetLocalReminderStateFromUserInfo();
    showToast(t('profile.updateError'), 'error');
  } finally {
    updatingAutoRenewal.value = false;
  }
};

onMounted(async () => {
  const [userResp, subscribeResp, configResp] = await Promise.allSettled([
    getUserInfo(),
    getUserSubscribe(),
    getUserConfig()
  ]);

  if (userResp.status === 'fulfilled') {
    userInfo.value = userResp.value?.data || {};
    resetLocalReminderStateFromUserInfo();
  }
  if (subscribeResp.status === 'fulfilled') subscribeInfo.value = subscribeResp.value?.data || {};
  if (configResp.status === 'fulfilled' && configResp.value?.data?.currency_symbol) {
    currencySymbol.value = configResp.value.data.currency_symbol;
  }
});
</script>

<style scoped lang="scss">
@use "@/assets/styles/base/variables.scss" as *;

.my-center {
  padding: 0 0 10px;
  background: #141414;
}

.my-center-inner {
  display: grid;
  gap: 1rem;
}

.section-block {
  border-radius: 10px;
  background: linear-gradient(180deg, #252525 0%, #1e1e1e 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
  transition: box-shadow 0.22s ease, border-color 0.22s ease, transform 0.22s ease;

  &:hover {
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.42);
    border-color: rgba(229, 9, 20, 0.45);
    transform: translateY(-2px);
  }
}

.dashboard-like-card {
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto auto 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, #e50914 0%, #b20710 100%);
    pointer-events: none;
  }
}

.summary-panel { padding: 1rem; }

.overview-panels {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(300px, 1fr);
  gap: 1rem;

  &.no-tier {
    grid-template-columns: minmax(0, 1fr);
  }
}

.tier-panel {
  padding: 1rem;
  background: radial-gradient(circle at 85% 10%, rgba(229, 9, 20, 0.35), transparent 38%),
    linear-gradient(135deg, #2f0b0b 0%, #460d11 45%, #69141b 100%);
  color: #f6f6f6;
  border-color: rgba(229, 9, 20, 0.34);

  .tier-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
    }

    p {
      margin: 0;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
    }
  }

  .tier-member-row {
    margin-top: 4px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .tier-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;

    &.is-bronze { background: linear-gradient(135deg, #b27241, #d39d63); }
    &.is-silver { background: linear-gradient(135deg, #8ea0bf, #d4deef); color: #23324d; }
    &.is-gold { background: linear-gradient(135deg, #f59e0b, #fcd34d); color: #5b3a00; }
    &.is-platinum { background: linear-gradient(135deg, #5ba7c6, #a8e4ff); color: #07364a; }
    &.is-diamond { background: linear-gradient(135deg, #6a7bff, #9dc7ff); }
    &.is-default { background: linear-gradient(135deg, #6379d6, #91a4ff); }
  }

  .tier-level {
    font-size: 13px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
  }

  .tier-progress-meta,
  .tier-next {
    font-size: 13px;
    color: rgba(239, 243, 255, 0.92);
  }

  .tier-progress-track {
    width: 100%;
    height: 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.24);
    overflow: hidden;
    margin: 8px 0;
  }

  .tier-progress-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #fbd15f, #f59e0b);
  }
}

.summary-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.8rem;

  h2 {
    margin: 0;
    font-size: 30px;
    font-weight: 800;
    letter-spacing: -0.01em;
    color: #ffffff;
  }
}

.summary-desc {
  margin: 3px 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.72);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.summary-item {
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: #2c2c2c;

  .label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }

  strong {
    font-size: 18px;
    color: #ffffff;
    word-break: break-word;
  }

  &.is-highlight {
    border-color: rgba(229, 9, 20, 0.45);
    background: linear-gradient(135deg, rgba(229, 9, 20, 0.25) 0%, rgba(229, 9, 20, 0.08) 100%);
    box-shadow: inset 0 0 0 1px rgba(229, 9, 20, 0.1);
  }
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
}

.section-block > .section-title {
  padding: 14px 16px 10px;
}

.settings-list {
  overflow: hidden;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.settings-row,
.nav-row {
  min-height: 72px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

.settings-row + .settings-row,
.nav-row + .nav-row {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.row-main { min-width: 0; }

.row-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #f5f5f5;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.04);
  flex-shrink: 0;
}

.row-title {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.01em;
}

.row-main p {
  margin: 3px 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.nav-row {
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  color: #f4f4f4;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #ffffff;

    .row-icon {
      border-color: rgba(229, 9, 20, 0.75);
      background: rgba(229, 9, 20, 0.2);
      color: #ffffff;
    }
  }

  &:active {
    background: rgba(255, 255, 255, 0.12);
  }

  :deep(.tabler-icon-chevron-right) {
    margin-left: auto;
    color: rgba(255, 255, 255, 0.72);
  }
}

.mini-action {
  height: 36px;
  padding: 0 14px;
  border-radius: 6px;
  border-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
}

.switch { position: relative; display: inline-block; width: 42px; height: 24px; margin-left: auto; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; inset: 0; background-color: #5f5f5f; transition: .2s; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; top: 3px; background: #fff; transition: .2s; }
input:checked + .slider { background-color: #e50914; }
input:checked + .slider:before { transform: translateX(18px); }
.slider.round { border-radius: 24px; }
.slider.round:before { border-radius: 50%; }

.bottom-safe-area { height: calc(env(safe-area-inset-bottom, 0px) + 10px); }

@media (max-width: 1100px) {
  .overview-panels {
    grid-template-columns: 1fr;
  }

  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 768px) {
  .my-center-inner { max-width: 100%; gap: 0.75rem; }
  .overview-panels { gap: 0.75rem; }
  .summary-panel { padding: 12px; }
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .summary-item { padding: 10px; }
  .section-block > .section-title { padding: 12px 12px 8px; }
  .settings-row,
  .nav-row { min-height: 58px; padding: 10px 12px; }
  .row-title { font-size: 18px; }
  .row-main p { font-size: 13px; }
  .summary-top h2 { font-size: 24px; }
  .summary-item strong { font-size: 15px; }
  .row-icon { width: 30px; height: 30px; }
}
</style>
