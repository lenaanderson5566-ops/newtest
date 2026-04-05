<template>
  <div class="my-center page-shell">
    <div class="my-center-inner page-inner page-stack">
      <div class="top-nav-wrap">
        <button
          v-for="item in sectionTabs"
          :key="item.key"
          class="top-nav-item"
          :class="{ active: activeSection === item.key }"
          @click="handleSectionClick(item.key)"
        >
          {{ item.label }}
        </button>
      </div>

      <div v-show="activeSection === 'overview'" class="overview-panels">
        <h3 class="section-title section-title-outside">{{ $t('myCenter.summaryTitle') }}</h3>
        <p class="section-subtitle">{{ $t('myCenter.summaryDesc') }}</p>
        <section class="summary-panel section-block dashboard-like-card dashboard-like-card--accent">
          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">{{ $t('myCenter.email') }}</span>
              <strong>{{ userInfo.email || '-' }}</strong>
            </div>
            <div class="summary-item">
              <span class="label">{{ $t('myCenter.accountBalance') }}</span>
              <div class="balance-amount-row">
                <strong v-for="item in balanceDisplayItems" :key="item.key" class="balance-amount">
                  <span class="balance-currency">{{ item.currency }}</span>
                  <span>{{ item.amount }}</span>
                </strong>
              </div>
            </div>
          </div>

          <div class="summary-actions">
            <button class="nav-row summary-nav-row" @click="go('/wallet/deposit')">
              <div class="row-main">
                <div class="row-title">{{ $t('myCenter.topUp') }}</div>
                <p>{{ $t('myCenter.balanceDesc') }}</p>
              </div>
              <IconChevronRight :size="18" />
            </button>
          </div>
        </section>

        <p class="section-subtitle">{{ $t('myCenter.recentLoginTitle') }}</p>
        <section class="section-block dashboard-like-card recent-login-panel">
          <div class="recent-login-list">
            <div v-if="recentLoginLoading" class="recent-login-state">{{ $t('myCenter.loadingRecentLogin') }}</div>
            <div v-else-if="!recentLoginRecords.length" class="recent-login-state">{{ $t('myCenter.recentLoginEmpty') }}</div>
            <div v-else v-for="(record, index) in recentLoginRecords" :key="`${record.login_at || 'na'}-${record.ip || 'ip'}-${index}`" class="recent-login-item">
              <div class="recent-login-main">
                <strong>{{ formatLoginTime(record.login_at) }}</strong>
                <span>{{ formatLoginLocation(record) }}</span>
              </div>
              <span class="recent-login-ip">{{ record.ip || '-' }}</span>
            </div>
          </div>
        </section>

      </div>

      <div v-show="activeSection === 'subscription'" class="section-group">
        <h3 class="section-title section-title-outside">{{ $t('myCenter.subscriptionPlanTitle') }}</h3>
        <p class="section-subtitle">{{ $t('myCenter.planDetails') }}</p>
        <section class="section-block dashboard-like-card dashboard-like-card--accent">
          <div class="settings-list">
            <div class="settings-row plan-overview-row">
              <div class="row-main">
                <div class="plan-name">{{ subscriptionText }}</div>
                <p class="plan-desc">{{ $t('myCenter.planExpireAtLabel', { date: subscriptionExpireText }) }}</p>
              </div>
            </div>
            <button class="nav-row" @click="go('/shop')">
              <div class="row-main row-main-with-icon">
                <IconShoppingCart :size="20" class="row-leading-icon" />
                <div class="row-content">
                  <div class="row-title">{{ $t('myCenter.changeSubscription') }}</div>
                </div>
              </div>
              <IconChevronRight :size="18" />
            </button>
          </div>
        </section>

        <p class="section-subtitle">{{ $t('myCenter.paymentInfo') }}</p>
        <section class="section-block dashboard-like-card">
        <div class="settings-list">

          <div class="settings-row">
            <div class="row-main row-main-with-icon">
              <IconRefresh :size="20" class="row-leading-icon" />
              <div class="row-content">
                <div class="row-title">{{ $t('profile.autoRenewal') }}</div>
                <p>{{ $t('profile.autoRenewalDesc') }}</p>
              </div>
            </div>
            <label class="switch" :class="{ disabled: updatingAutoRenewal }">
              <input type="checkbox" v-model="autoRenewal" @change="updateAutoRenewalSetting" :disabled="updatingAutoRenewal" />
              <span class="slider round"></span>
            </label>
          </div>

          <button class="nav-row" @click="go('/orders')">
            <div class="row-main row-main-with-icon">
              <IconReceipt :size="20" class="row-leading-icon" />
              <div class="row-content">
                <div class="row-title">{{ $t('myCenter.billRecords') }}</div>
              </div>
            </div>
            <IconChevronRight :size="18" />
          </button>

          <button class="nav-row" @click="go('/gift-card')">
            <div class="row-main row-main-with-icon">
              <IconGift :size="20" class="row-leading-icon" />
              <div class="row-content">
                <div class="row-title">{{ $t('myCenter.redeemGiftCard') }}</div>
              </div>
            </div>
            <IconChevronRight :size="18" />
          </button>

        </div>
        </section>
      </div>

      <div v-show="activeSection === 'security'" class="section-group">
        <h3 class="section-title section-title-outside">{{ $t('myCenter.securityCenterTitle') }}</h3>
        <p class="section-subtitle">{{ $t('myCenter.accountDetails') }}</p>
        <section class="section-block dashboard-like-card">
        <div class="settings-list">
          <button class="nav-row" @click="openPasswordChangePrompt">
            <div class="row-main row-main-with-icon">
              <IconLock :size="20" class="row-leading-icon" />
              <div class="row-content">
                <div class="row-title">{{ $t('myCenter.changePassword') }}</div>
              </div>
            </div>
            <IconChevronRight :size="18" />
          </button>
        </div>
        </section>

        <p class="section-subtitle">{{ $t('myCenter.accessPrivacy') }}</p>
        <section class="section-block dashboard-like-card">
        <div class="settings-list">
          <button class="nav-row" @click="go('/security?section=sessions')">
            <div class="row-main row-main-with-icon">
              <IconDevices :size="20" class="row-leading-icon" />
              <div class="row-content">
                <div class="row-title">{{ $t('myCenter.loginRecords') }}</div>
                <p>{{ $t('myCenter.loginRecordsDesc') }}</p>
              </div>
            </div>
            <IconChevronRight :size="18" />
          </button>

          <button class="nav-row" @click="confirmSecurityReset">
            <div class="row-main row-main-with-icon">
              <IconAlertCircle :size="20" class="row-leading-icon" />
              <div class="row-content">
                <div class="row-title">{{ $t('myCenter.deviceReset') }}</div>
                <p>{{ $t('myCenter.deviceResetDesc') }}</p>
              </div>
            </div>
            <IconChevronRight :size="18" />
          </button>
        </div>
        </section>
      </div>

      <div v-show="activeSection === 'settings'" class="section-group">
        <h3 class="section-title section-title-outside">{{ $t('myCenter.settingsTitle') }}</h3>
        <section class="section-block dashboard-like-card">
        <div class="settings-list">
          <div class="settings-row">
            <div class="row-main row-main-with-icon">
              <IconClock :size="20" class="row-leading-icon" />
              <div class="row-content">
                <div class="row-title">{{ $t('myCenter.expireReminder') }}</div>
                <p>{{ $t('myCenter.expireReminderDesc') }}</p>
              </div>
            </div>
            <label class="switch" :class="{ disabled: updatingSettings }">
              <input type="checkbox" v-model="remindExpire" @change="updateRemindSettings" :disabled="updatingSettings" />
              <span class="slider round"></span>
            </label>
          </div>

          <div class="settings-row">
            <div class="row-main row-main-with-icon">
              <IconBell :size="20" class="row-leading-icon" />
              <div class="row-content">
                <div class="row-title">{{ $t('myCenter.trafficReminder') }}</div>
                <p>{{ $t('myCenter.trafficReminderDesc') }}</p>
              </div>
            </div>
            <label class="switch" :class="{ disabled: updatingSettings }">
              <input type="checkbox" v-model="remindTraffic" @change="updateRemindSettings" :disabled="updatingSettings" />
              <span class="slider round"></span>
            </label>
          </div>

        </div>
        </section>
      </div>

      <div v-show="activeSection === 'benefits'" class="benefits-stack">
        <h3 class="section-title section-title-outside">{{ $t('myCenter.levelBenefitsTitle') }}</h3>
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

        <section class="section-block dashboard-like-card">
          <div class="tier-intro-list">
            <div class="tier-intro-card">
              <div class="tier-intro-title">{{ $t('myCenter.tierRulesTitle') }}</div>
              <p>{{ $t('myCenter.tierRulesDesc') }}</p>
            </div>
            <div class="tier-intro-card">
              <div class="tier-intro-title">{{ $t('myCenter.tierLevelTitle') }}</div>
              <p>{{ $t('myCenter.tierLevelCurrent', { tier: tierMemberDisplay, level: userTier.level || 0, points: formatTierNumber(userTier.points) }) }}</p>
              <p v-if="userTier.nextTierKey">{{ $t('myCenter.tierLevelToNext', { tier: nextTierNameDisplay, points: formatTierNumber(userTier.pointsToNextTier) }) }}</p>
              <p v-else>{{ $t('myCenter.tierLevelMax') }}</p>
              <p class="tier-intro-note">{{ $t('myCenter.tierLevelHint') }}</p>
            </div>
            <div class="tier-intro-card tier-intro-card--muted">
              <div class="tier-intro-title">{{ $t('myCenter.tierBenefitsTitle') }}</div>
              <p>{{ $t('myCenter.tierBenefitsDesc1') }}</p>
              <p>{{ $t('myCenter.tierBenefitsDesc2') }}</p>
            </div>
          </div>
        </section>
      </div>
 
    </div>

    <transition name="modal-fade">
      <div v-if="showPasswordModal" class="modal-overlay" @click="closePasswordModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>{{ $t('profile.changePasswordTitle') }}</h3>
            <button class="modal-close" @click="closePasswordModal">
              <IconX :size="20" />
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>{{ $t('profile.oldPassword') }}</label>
              <input v-model="passwordForm.oldPassword" type="password" :placeholder="$t('profile.oldPassword')" />
            </div>
            <div class="form-group">
              <label>{{ $t('profile.newPassword') }}</label>
              <input v-model="passwordForm.newPassword" type="password" :placeholder="$t('profile.newPassword')" />
            </div>
            <div class="form-group">
              <label>{{ $t('profile.confirmPassword') }}</label>
              <input v-model="passwordForm.confirmPassword" type="password" :placeholder="$t('profile.confirmPassword')" />
            </div>
            <div v-if="passwordMismatch" class="error-text">{{ $t('profile.passwordMismatch') }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closePasswordModal">{{ $t('common.cancel') }}</button>
            <button class="btn-submit" :disabled="!validatePasswordForm() || updatingPassword" @click="submitPasswordChange">
              <span v-if="updatingPassword" class="loader"></span>
              <span>{{ $t('common.submit') }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showResetModal" class="modal-overlay" @click="closeResetModal">
        <div class="modal-content reset-modal-content" @click.stop>
          <div class="modal-header">
            <h3>{{ $t('profile.resetSecurityTitle') }}</h3>
            <button class="close-btn" @click="closeResetModal">✕</button>
          </div>
          <p class="modal-text">{{ $t('profile.resetSecurityConfirm') }}</p>
          <div class="modal-actions">
            <button class="action-btn" @click="closeResetModal">{{ $t('common.cancel') }}</button>
            <button class="action-btn danger" :disabled="resettingSecurity" @click="submitSecurityReset">
              {{ resettingSecurity ? $t('common.processing') : $t('profile.confirmReset') }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IconAlertCircle, IconBell, IconChevronRight, IconClock, IconDevices, IconGift, IconLock, IconReceipt, IconRefresh, IconShoppingCart, IconX } from '@tabler/icons-vue';
import { useI18n } from 'vue-i18n';
import { changePassword as apiChangePassword, getRecentLoginRecords, getUserInfo, getUserSubscribe, resetSecurity as apiResetSecurity, updateRemindSettings as apiUpdateRemind } from '@/api/account/user';
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
const showPasswordModal = ref(false);
const showResetModal = ref(false);
const updatingPassword = ref(false);
const resettingSecurity = ref(false);
const recentLoginLoading = ref(false);
const recentLoginRecords = ref([]);
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});
const activeSection = ref('overview');
const sectionTabs = computed(() => [
  { key: 'overview', label: t('myCenter.tabOverview') },
  { key: 'subscription', label: t('myCenter.tabSubscriptionPlan') },
  { key: 'security', label: t('myCenter.tabSecurity') },
  { key: 'settings', label: t('myCenter.tabSettings') },
  { key: 'benefits', label: t('myCenter.tabLevelBenefits') },
  { key: 'invite', label: t('myCenter.tabInvite') }
]);

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
const balanceDisplayItems = computed(() => {
  if (Array.isArray(userInfo.value?.wallets) && userInfo.value.wallets.length > 0) {
    return userInfo.value.wallets
      .filter((wallet) => wallet && wallet.currency)
      .map((wallet, index) => ({
        key: `${String(wallet.currency).toUpperCase()}-${index}`,
        currency: String(wallet.currency).toUpperCase(),
        amount: formatBalance(wallet.balance)
      }));
  }

  return [
    {
      key: 'default-balance',
      currency: currencySymbol.value,
      amount: formatBalance(userInfo.value?.balance)
    }
  ];
});
const formatLoginTime = (timestamp) => (timestamp ? formatDate(Number(timestamp), true) : '-');
const formatLoginLocation = (record = {}) => {
  const city = `${record.city || ''}`.trim();
  const country = `${record.country || ''}`.trim();
  if (city && country) return `${city}, ${country}`;
  return city || country || '-';
};
const go = (path) => router.push(path);
const handleSectionClick = (sectionKey) => {
  if (sectionKey === 'invite') {
    go('/invite');
    return;
  }
  activeSection.value = sectionKey;
};

const passwordMismatch = computed(() => {
  if (!passwordForm.value.confirmPassword) return false;
  return passwordForm.value.newPassword !== passwordForm.value.confirmPassword;
});

const validatePasswordForm = () => (
  passwordForm.value.oldPassword &&
  passwordForm.value.newPassword &&
  passwordForm.value.confirmPassword &&
  !passwordMismatch.value
);

const openPasswordChangePrompt = () => {
  showPasswordModal.value = true;
};

const closePasswordModal = () => {
  showPasswordModal.value = false;
  passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
};

const submitPasswordChange = async () => {
  if (updatingPassword.value) return;
  if (!validatePasswordForm()) return;
  try {
    updatingPassword.value = true;
    await apiChangePassword({
      old_password: passwordForm.value.oldPassword,
      new_password: passwordForm.value.newPassword
    });
    showToast(t('profile.passwordChanged'), 'success');
    closePasswordModal();
  } catch (error) {
    showToast(t('profile.passwordError'), 'error');
  } finally {
    updatingPassword.value = false;
  }
};

const confirmSecurityReset = () => {
  showResetModal.value = true;
};

const closeResetModal = () => {
  showResetModal.value = false;
};

const submitSecurityReset = async () => {
  try {
    resettingSecurity.value = true;
    await apiResetSecurity();
    showToast(t('profile.resetSuccess'), 'success');
    closeResetModal();
  } catch (error) {
    showToast(t('profile.resetError'), 'error');
  } finally {
    resettingSecurity.value = false;
  }
};

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
  recentLoginLoading.value = true;
  const [userResp, subscribeResp, configResp, recentLoginResp] = await Promise.allSettled([
    getUserInfo(),
    getUserSubscribe(),
    getUserConfig(),
    getRecentLoginRecords()
  ]);

  if (userResp.status === 'fulfilled') {
    userInfo.value = userResp.value?.data || {};
    resetLocalReminderStateFromUserInfo();
  }
  if (subscribeResp.status === 'fulfilled') subscribeInfo.value = subscribeResp.value?.data || {};
  if (configResp.status === 'fulfilled' && configResp.value?.data?.currency_symbol) {
    currencySymbol.value = configResp.value.data.currency_symbol;
  }
  if (recentLoginResp?.status === 'fulfilled') {
    recentLoginRecords.value = Array.isArray(recentLoginResp.value?.data) ? recentLoginResp.value.data : [];
  } else {
    recentLoginRecords.value = [];
  }
  recentLoginLoading.value = false;
});
</script>

<style scoped lang="scss">
@use "sass:map";
@use "@/assets/styles/base/variables.scss" as *;
@use "@/assets/styles/base/typography.scss" as *;

$space-2: map.get($spacers, 2);

.my-center {
  padding: 0 0 0;
  background: transparent;
}

.my-center-inner {
  display: grid;
  gap: #{$space-2};
}

.top-nav-wrap {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  gap: 0;
  overflow-x: auto;
  background: var(--card-bg-color, var(--color-bg-surface));
  border: var(--border-width) solid var(--border-subtle);
  border-radius: $border-radius-sm;
}

.top-nav-item {
  position: relative;
  flex: 0 0 auto;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  @extend %typo-item-title;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    color: var(--color-text-muted);
  }

  &.active {
    color: var(--color-text-primary);
    font-weight: $font-weight-bold;
  }

  &.active::after {
    content: '';
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 0;
    height: 3px;
    border-radius: 999px;
    background: #e50914;
  }
}

.section-block {
  border-radius: $border-radius-sm;
  background-color: var(--color-bg-surface);
  border: var(--border-width) solid var(--border-hover);
  transition: box-shadow 0.22s ease, border-color 0.22s ease;
  margin-bottom: 0 !important;

  &:hover {
    border-color: rgba(var(--theme-color-rgb), 0.22);
  }
}

.dashboard-like-card {
  position: relative;
  overflow: hidden;
}

.dashboard-like-card--accent::before {
  content: '';
  position: absolute;
  inset: 0 auto auto 0;
  width: 100%;
  height: 5px;
  background: var(--site-accent-gradient, linear-gradient(90deg, #2259aa 0%, #5a39d8 52%, #ea1d2c 100%));
  pointer-events: none;
}

.summary-panel { padding: map.get($spacers, 3); }

.recent-login-panel {
  padding: map.get($spacers, 3);
}

.recent-login-list {
  margin-top: 0;
  border-top: var(--border-width) solid var(--border-subtle);
}

.recent-login-state {
  padding: 16px 0 4px;
  @extend %typo-meta-text;
}

.recent-login-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: #{$space-2};
  padding: 8px 0;
}

.recent-login-item + .recent-login-item {
  border-top: var(--border-width) solid var(--border-subtle);
}

.recent-login-main {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.recent-login-main strong {
  @extend %typo-item-title;
}

.recent-login-main span,
.recent-login-ip {
  @extend %typo-body-text;
}


.overview-panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: #{$space-2};
}

.benefits-stack {
  display: grid;
  gap: #{$space-2};
}


.tier-panel {
  padding: 16px;
  background: radial-gradient(circle at 85% 10%, rgba(132, 161, 255, 0.25), transparent 35%),
    linear-gradient(135deg, #1c2f6a 0%, #213a8f 45%, #3049a5 100%);
  color: var(--text-on-dark-primary);
  border-color: rgba(161, 181, 255, 0.3);

  .tier-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: #{$space-2};
    margin-bottom: #{$space-2};

    h3 {
      margin: 0;
      font-size: $font-size-md;
      font-weight: $font-weight-bold;
      color: var(--text-on-dark-primary);
    }

    p {
      margin: 0;
      font-size: $font-size-md;
      color: var(--text-on-dark-primary);
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
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;

    &.is-bronze { background: linear-gradient(135deg, #b27241, #d39d63); }
    &.is-silver { background: linear-gradient(135deg, #8ea0bf, #d4deef); color: var(--color-text-secondary); }
    &.is-gold { background: linear-gradient(135deg, #f59e0b, #fcd34d); color: var(--color-text-secondary); }
    &.is-platinum { background: linear-gradient(135deg, #5ba7c6, #a8e4ff); color: var(--color-text-secondary); }
    &.is-diamond { background: linear-gradient(135deg, #6a7bff, #9dc7ff); }
    &.is-default { background: linear-gradient(135deg, #6379d6, #91a4ff); }
  }

  .tier-level {
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
  }

  .tier-progress-meta,
  .tier-next {
    font-size: $font-size-sm;
    color: var(--text-on-dark-primary);
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


.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: #{$space-2};
}

.summary-actions {
  margin-top: 8px;
}

.summary-nav-row {
  border: var(--border-width) solid var(--border-subtle);
  border-radius: $border-radius-sm;
  padding-left: 8px;
  padding-right: 8px;
}

.summary-item {
  padding: 8px;
  border: var(--border-width) solid var(--border-subtle);
  border-radius: $border-radius-sm;
  background: linear-gradient(180deg, rgba(var(--color-bg-surface-rgb), 0.96), rgba(var(--color-bg-surface-rgb), 0.9));

  .label {
    display: block;
    margin-bottom: 4px;
    font-size: $font-size-sm;
    color: var(--color-text-tertiary);
  }

  strong {
    font-size: $font-size-md;
    color: var(--color-text-primary);
    word-break: break-word;
  }

}

.section-title {
  margin: 0;
  @extend %typo-section-title;
}

.section-group {
  display: grid;
  gap: #{$space-2};
}

.section-title-outside {
  padding: 0 0;
}

.section-subtitle {
  margin: 0;
  padding: 0 0;
  @extend %typo-body-text;
}

.plan-overview-row {
  align-items: flex-start;
}

.plan-name {
  @extend %typo-section-title;
}

.plan-desc {
  margin: 8px 0 0;
  @extend %typo-body-text;
}

.row-main-with-icon {
  display: flex;
  align-items: center;
  gap: #{$space-2};
}

.row-leading-icon {
  color: rgba(var(--theme-color-rgb), 0.9);
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.row-content {
  min-width: 0;
}

.balance-amount {
  font-size: 2.5rem;
  font-weight: $font-weight-bold;
  line-height: 1.2;
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
}

.balance-amount-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
}

.balance-currency {
  font-size: $font-size-md;
  color: var(--color-text-secondary);
}

.settings-list {
  overflow: hidden;
  border-top: var(--border-width) solid var(--border-subtle);
}

.settings-row,
.nav-row {
  min-height: 62px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: #{$space-2};
}

.settings-row + .settings-row,
.nav-row + .nav-row {
  border-top: var(--border-width) solid var(--border-subtle);
}

.row-main { min-width: 0; }

.row-title {
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  color: var(--color-text-primary);
}

.row-main p {
  margin: 4px 0 0;
  font-size: $font-size-xs;
  color: var(--color-text-tertiary);
}

.tier-intro-list {
  display: grid;
  gap: #{$space-2};
  padding: 8px;
}

.tier-intro-card {
  border: var(--border-width) solid var(--border-subtle);
  border-radius: 12px;
  background: rgba(var(--color-bg-surface-rgb), 0.7);
  padding: 8px;

  p {
    margin: 4px 0 0;
    font-size: $font-size-sm;
    line-height: 1.6;
    color: var(--color-text-tertiary);
  }
}

.tier-intro-card--muted {
  background: rgba(var(--theme-color-rgb), 0.06);
}

.tier-intro-title {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: var(--color-text-primary);
}

.tier-intro-note {
  color: var(--color-text-primary) !important;
  font-weight: $font-weight-semibold;
}

.nav-row {
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background: rgba(var(--theme-color-rgb), 0.07);
    color: var(--theme-color);
  }

  &:active {
    background: rgba(var(--theme-color-rgb), 0.11);
  }
}


.switch { position: relative; display: inline-block; width: 42px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; inset: 0; background-color: #cbd5e1; transition: .2s; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; top: 3px; background: #fff; transition: .2s; }
input:checked + .slider { background-color: rgba(var(--theme-color-rgb), 1); }
input:checked + .slider:before { transform: translateX(18px); }
.slider.round { border-radius: 24px; }
.slider.round:before { border-radius: 50%; }

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
  background-color: var(--color-bg-surface);
  border-radius: 12px;
  width: 90%;
  max-width: 480px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 16px 16px;
  border-bottom: var(--border-width) solid var(--border-default);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    color: var(--color-text-primary);
  }

  .modal-close,
  .close-btn {
    background: none;
    border: none;
    color: var(--color-text-muted);
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
  padding: 16px;
}

.form-group {
  margin-bottom: #{$space-2};

  &:last-child {
    margin-bottom: 0;
  }

  label {
    display: block;
    font-size: $font-size-md;
    font-weight: $font-weight-medium;
    color: var(--color-text-primary);
    margin-bottom: 8px;
  }

  input {
    width: 100%;
    padding: 8px 8px;
    border: var(--border-width) solid var(--border-default);
    border-radius: 8px;
    background-color: var(--bg-secondary);
    color: var(--color-text-primary);
    font-size: $font-size-md;
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      border-color: var(--theme-color);
    }
  }
}

.error-text {
  margin-top: 4px;
  color: var(--error-color);
  font-size: $font-size-sm;
}

.modal-footer {
  padding: 16px 16px;
  border-top: var(--border-width) solid var(--border-default);
  display: flex;
  justify-content: flex-end;
  gap: #{$space-2};
}

.btn-cancel,
.action-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: $font-size-md;
  cursor: pointer;
  border: var(--border-width) solid var(--border-default);
  background: transparent;
  color: var(--color-text-primary);
}

.btn-submit,
.action-btn.danger {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: $font-size-md;
  cursor: pointer;
  border: none;
  background: rgba(var(--theme-color-rgb), 0.92);
  color: var(--text-on-dark-primary);
}

.modal-text {
  padding: 16px;
  margin: 0;
  color: var(--color-text-tertiary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: #{$space-2};
  padding: 0 16px 16px;
}

.loader {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@include down(xl) {
  .overview-panels {
    grid-template-columns: 1fr;
  }

  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@include down(md) {
  .my-center {
    background: transparent;
  }

  .my-center-inner { max-width: 100%; gap: #{$space-2}; }

  .section-block {
    background: var(--color-bg-surface) !important;
    box-shadow: none;
  }

  .top-nav-wrap {
    border-radius: 0;
    border-left: none;
    border-right: none;
    border-top: var(--border-width) solid var(--border-subtle);
    border-bottom: var(--border-width) solid var(--border-subtle);
    padding: 0 8px;
    background: #fff;
  }

  .top-nav-item {
    padding: 16px 8px 8px;
    font-size: $font-size-md;
  }

  .overview-panels { gap: #{$space-2}; }
  .summary-panel { padding: 16px; }
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .summary-item { padding: 8px; }
  .section-block > .section-title { padding: 16px 16px 8px; font-size: $font-size-xl; }
  .settings-row,
  .nav-row { min-height: 62px; padding: 8px 16px; }
}
</style>
