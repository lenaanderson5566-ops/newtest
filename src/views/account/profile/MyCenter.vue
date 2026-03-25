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

          <div class="summary-actions">
            <button class="nav-row summary-nav-row" @click="go('/wallet/deposit')">
              <div class="row-main">
                <div class="row-title">{{ $t('myCenter.accountBalance') }}</div>
                <p>{{ $t('myCenter.balanceDesc') }}</p>
              </div>
              <IconChevronRight :size="18" />
            </button>
          </div>
        </section>

      </div>

      <div v-show="activeSection === 'subscription'" class="section-group">
        <h3 class="section-title section-title-outside">{{ $t('myCenter.subscriptionPlanTitle') }}</h3>
        <p class="section-subtitle">Plan Details</p>
        <section class="section-block dashboard-like-card subscription-plan-card">
          <div class="plan-name">{{ subscriptionText }}</div>
          <p class="plan-desc">到期时间：{{ subscriptionExpireText }}</p>
          <div class="plan-action-wrap">
            <button class="plan-action-btn" @click="go('/shop')">
              <span>切换订阅</span>
              <IconChevronRight :size="18" />
            </button>
          </div>
        </section>

        <p class="section-subtitle">Payment Info</p>
        <section class="section-block dashboard-like-card">
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

          <button class="nav-row" @click="go('/orders')">
            <div class="row-main">
              <div class="row-title">账单记录</div>
            </div>
            <IconChevronRight :size="18" />
          </button>

          <button class="nav-row" @click="go('/billing')">
            <div class="row-main">
              <div class="row-title">兑换礼品卡</div>
            </div>
            <IconChevronRight :size="18" />
          </button>

        </div>
        </section>
      </div>

      <div v-show="activeSection === 'security'" class="section-group">
        <h3 class="section-title section-title-outside">{{ $t('myCenter.securityCenterTitle') }}</h3>
        <section class="section-block dashboard-like-card">
        <div class="settings-list">
          <button class="nav-row" @click="openPasswordChangePrompt">
            <div class="row-main">
              <div class="row-title">修改密码</div>
            </div>
            <IconChevronRight :size="18" />
          </button>

          <button class="nav-row" @click="go('/security?section=sessions')">
            <div class="row-main">
              <div class="row-title">{{ $t('myCenter.loginRecords') }}</div>
              <p>{{ $t('myCenter.loginRecordsDesc') }}</p>
            </div>
            <IconChevronRight :size="18" />
          </button>

          <button class="nav-row" @click="confirmSecurityReset">
            <div class="row-main">
              <div class="row-title">{{ $t('myCenter.deviceReset') }}</div>
              <p>{{ $t('myCenter.deviceResetDesc') }}</p>
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
      </div>

      <div v-show="activeSection === 'benefits'" class="benefits-stack">
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

        <h3 class="section-title section-title-outside">{{ $t('myCenter.levelBenefitsTitle') }}</h3>
        <section class="section-block dashboard-like-card">
          <div class="settings-list">
            <div class="settings-row">
              <div class="row-main">
                <div class="row-title">等级与成长值</div>
                <p>{{ tierMemberDisplay }} · Lv.{{ userTier.level || 0 }} · {{ formatTierNumber(userTier.points) }} 积分</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="bottom-safe-area"></div>
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
import { IconChevronRight, IconX } from '@tabler/icons-vue';
import { useI18n } from 'vue-i18n';
import { changePassword as apiChangePassword, getUserInfo, getUserSubscribe, resetSecurity as apiResetSecurity, updateRemindSettings as apiUpdateRemind } from '@/api/account/user';
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
    showToast('密码修改成功', 'success');
    closePasswordModal();
  } catch (error) {
    showToast('密码修改失败，请稍后重试', 'error');
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
    showToast('重置成功，请重新导入订阅', 'success');
    closeResetModal();
  } catch (error) {
    showToast('重置失败，请稍后重试', 'error');
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
  padding: 0 0 2px;
  background: #f5f5f7;
}

.my-center-inner {
  display: grid;
  gap: 1rem;
}

.top-nav-wrap {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  gap: 0;
  overflow-x: auto;
  background: var(--card-bg-color, var(--card-background));
  border: 1px solid rgba(var(--text-color-rgb), 0.08);
  border-radius: $border-radius-sm;
}

.top-nav-item {
  position: relative;
  flex: 0 0 auto;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--secondary-text-color);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;

  &.active {
    color: var(--text-color);
    font-weight: 700;
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
  border-radius: 16px;
  background-color: #fff;
  border: 1px solid rgba(15, 23, 42, 0.15);
  box-shadow: none;
  transition: box-shadow 0.22s ease, border-color 0.22s ease;

  &:hover {
    box-shadow: none;
    border-color: rgba(var(--theme-color-rgb), 0.22);
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
    height: 3px;
    background: linear-gradient(90deg, rgba(var(--theme-color-rgb), 0.92), rgba(var(--theme-color-rgb), 0.35));
    pointer-events: none;
  }
}

.summary-panel { padding: 1rem; }


.overview-panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
}

.benefits-stack {
  display: grid;
  gap: 1rem;
}


.tier-panel {
  padding: 1rem;
  background: radial-gradient(circle at 85% 10%, rgba(132, 161, 255, 0.25), transparent 35%),
    linear-gradient(135deg, #1c2f6a 0%, #213a8f 45%, #3049a5 100%);
  color: #e8edff;
  border-color: rgba(161, 181, 255, 0.3);

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
      color: #f8fbff;
    }

    p {
      margin: 0;
      font-size: 14px;
      color: rgba(232, 237, 255, 0.9);
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
    box-shadow: none;

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
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.2px;
  }
}

.summary-desc {
  margin: 3px 0 0;
  font-size: 13px;
  color: var(--secondary-text-color);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.summary-actions {
  margin-top: 10px;
}

.summary-nav-row {
  border: 1px solid rgba(var(--text-color-rgb), 0.08);
  border-radius: $border-radius-sm;
  padding-left: 12px;
  padding-right: 12px;
}

.summary-item {
  padding: 12px;
  border: 1px solid rgba(var(--text-color-rgb), 0.08);
  border-radius: $border-radius-sm;
  background: linear-gradient(180deg, rgba(var(--card-background-rgb), 0.96), rgba(var(--card-background-rgb), 0.9));

  .label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    color: var(--secondary-text-color);
  }

  strong {
    font-size: 14px;
    color: var(--text-color);
    word-break: break-word;
  }

  &.is-highlight {
    border-color: rgba(var(--theme-color-rgb), 0.32);
    background: linear-gradient(130deg, rgba(var(--theme-color-rgb), 0.14), rgba(var(--theme-color-rgb), 0.05));
    box-shadow: none;
  }
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-color);
}

.section-group {
  display: grid;
  gap: 10px;
}

.section-title-outside {
  padding: 0 2px;
}

.section-block > .section-title {
  padding: 14px 16px 10px;
}

.subscription-plan-card {
  padding: 14px;

  .plan-name {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-color);
  }

  .plan-desc {
    margin: 8px 0 0;
    font-size: 14px;
    color: var(--secondary-text-color);
  }
}

.plan-action-wrap {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(var(--text-color-rgb), 0.1);
}

.plan-action-btn {
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-color);
  cursor: pointer;
}

.settings-list {
  overflow: hidden;
  border-top: 1px solid rgba(var(--text-color-rgb), 0.08);
}

.settings-row,
.nav-row {
  min-height: 62px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.settings-row + .settings-row,
.nav-row + .nav-row {
  border-top: 1px solid rgba(var(--text-color-rgb), 0.08);
}

.row-main { min-width: 0; }

.row-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.row-main p {
  margin: 3px 0 0;
  font-size: 12px;
  color: var(--secondary-text-color);
}

.nav-row {
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  color: var(--text-color);
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

.mini-action {
  height: 34px;
  padding: 0 12px;
  border-radius: $border-radius-sm;
}

.switch { position: relative; display: inline-block; width: 42px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; inset: 0; background-color: #cbd5e1; transition: .2s; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; top: 3px; background: #fff; transition: .2s; }
input:checked + .slider { background-color: rgba(var(--theme-color-rgb), 1); }
input:checked + .slider:before { transform: translateX(18px); }
.slider.round { border-radius: 24px; }
.slider.round:before { border-radius: 50%; }

.bottom-safe-area { height: calc(env(safe-area-inset-bottom, 0px) + 10px); }

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
  border-radius: 12px;
  box-shadow: none;
  width: 90%;
  max-width: 480px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color);
  }

  .modal-close,
  .close-btn {
    background: none;
    border: none;
    color: var(--text-muted);
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
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color);
    margin-bottom: 8px;
  }

  input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background-color: var(--bg-secondary);
    color: var(--text-color);
    font-size: 15px;
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      border-color: var(--theme-color);
      box-shadow: none;
    }
  }
}

.error-text {
  margin-top: 6px;
  color: #f44336;
  font-size: 13px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel,
.action-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-color);
}

.btn-submit,
.action-btn.danger {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  background: rgba(var(--theme-color-rgb), 0.92);
  color: #fff;
}

.modal-text {
  padding: 16px;
  margin: 0;
  color: var(--secondary-text-color);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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

@media (max-width: 1100px) {
  .overview-panels {
    grid-template-columns: 1fr;
  }

  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 768px) {
  .my-center {
    background: #f3f3f5;
  }

  .my-center-inner { max-width: 100%; gap: 0.9rem; }

  .top-nav-wrap {
    border-radius: 0;
    border-left: none;
    border-right: none;
    border-top: 1px solid rgba(15, 23, 42, 0.08);
    border-bottom: 1px solid rgba(15, 23, 42, 0.12);
    padding: 0 8px;
    background: #fff;
  }

  .top-nav-item {
    padding: 14px 12px 12px;
    font-size: 15px;
  }

  .overview-panels { gap: 0.75rem; }
  .summary-panel { padding: 14px; }
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .summary-item { padding: 10px; }
  .section-block > .section-title { padding: 14px 14px 8px; font-size: 18px; }
  .subscription-plan-card {
    margin: 0 10px 10px;
    padding: 12px;

    .plan-name {
      font-size: 18px;
    }
  }
  .settings-row,
  .nav-row { min-height: 62px; padding: 12px 14px; }
}
</style>
