<template>
  <div class="my-center page-shell">
    <div class="my-center-inner page-inner page-stack">
      <div class="top-nav-wrap">
        <button
          v-for="item in sectionTabs"
          :key="item.key"
          class="top-nav-item"
          :class="{ active: activeSection === item.key }"
          @click="activeSection = item.key"
        >
          {{ item.label }}
        </button>
      </div>

      <div v-show="activeSection === 'overview'" class="overview-panels" :class="{ 'no-tier': !hasTierInfo }">
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

      <section v-show="activeSection === 'subscription'" class="section-block dashboard-like-card">
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
            <div class="row-main">
              <div class="row-title">{{ $t('myCenter.accountBalance') }}</div>
              <p>{{ $t('myCenter.balanceDesc') }}</p>
            </div>
            <IconChevronRight :size="18" />
          </button>

          <button class="nav-row" @click="go('/billing?tab=orders')">
            <div class="row-main">
              <div class="row-title">{{ $t('myCenter.orderHistory') }}</div>
              <p>{{ $t('myCenter.orderDesc') }}</p>
            </div>
            <IconChevronRight :size="18" />
          </button>

          <button class="nav-row" @click="go('/billing')">
            <div class="row-main">
              <div class="row-title">礼品卡</div>
              <p>兑换礼品卡或促销代码</p>
            </div>
            <IconChevronRight :size="18" />
          </button>

          <button class="nav-row" @click="go('/shop')">
            <div class="row-main">
              <div class="row-title">续费 / 升级</div>
              <p>切换套餐并继续服务</p>
            </div>
            <IconChevronRight :size="18" />
          </button>

          <button class="nav-row" @click="go('/billing?tab=referral')">
            <div class="row-main">
              <div class="row-title">{{ $t('myCenter.referral') }}</div>
              <p>{{ $t('myCenter.referralDesc') }}</p>
            </div>
            <IconChevronRight :size="18" />
          </button>
        </div>
      </section>

      <section v-show="activeSection === 'security'" class="section-block dashboard-like-card">
        <h3 class="section-title">{{ $t('myCenter.securityCenterTitle') }}</h3>
        <div class="settings-list">
          <button class="nav-row" @click="go('/security?section=password')">
            <div class="row-main">
              <div class="row-title">{{ $t('myCenter.passwordManagement') }}</div>
              <p>{{ $t('myCenter.passwordManagementDesc') }}</p>
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

          <button class="nav-row" @click="go('/config-management')">
            <div class="row-main">
              <div class="row-title">{{ $t('myCenter.deviceReset') }}</div>
              <p>{{ $t('myCenter.deviceResetDesc') }}</p>
            </div>
            <IconChevronRight :size="18" />
          </button>
        </div>
      </section>

      <section v-show="activeSection === 'settings'" class="section-block dashboard-like-card">
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

          <div class="settings-row">
            <div class="row-main">
              <div class="row-title">自动续费失败提醒</div>
              <p>在自动续费失败时发送通知</p>
            </div>
            <label class="switch" :class="{ disabled: true }">
              <input type="checkbox" checked disabled />
              <span class="slider round"></span>
            </label>
          </div>

          <button class="nav-row" @click="go('/profile')">
            <div class="row-main">
              <div class="row-title">语言偏好</div>
              <p>调整页面显示语言</p>
            </div>
            <IconChevronRight :size="18" />
          </button>
        </div>
      </section>

      <section v-show="activeSection === 'benefits'" class="section-block dashboard-like-card">
        <h3 class="section-title">会员权益</h3>
        <div class="settings-list">
          <div class="settings-row">
            <div class="row-main">
              <div class="row-title">等级与成长值</div>
              <p>{{ tierMemberDisplay }} · Lv.{{ userTier.level || 0 }} · {{ formatTierNumber(userTier.points) }} 积分</p>
            </div>
          </div>
          <button class="nav-row" @click="go('/dashboard')">
            <div class="row-main">
              <div class="row-title">权益说明</div>
              <p>查看当前会员等级可用权益</p>
            </div>
            <IconChevronRight :size="18" />
          </button>
        </div>
      </section>

      <section v-show="activeSection === 'invite'" class="section-block dashboard-like-card">
        <h3 class="section-title">邀请返利</h3>
        <div class="settings-list">
          <button class="nav-row" @click="go('/invite')">
            <div class="row-main">
              <div class="row-title">邀请链接</div>
              <p>创建和复制你的专属邀请链接</p>
            </div>
            <IconChevronRight :size="18" />
          </button>
          <button class="nav-row" @click="go('/invite')">
            <div class="row-main">
              <div class="row-title">邀请记录</div>
              <p>查看邀请用户和奖励明细</p>
            </div>
            <IconChevronRight :size="18" />
          </button>
          <button class="nav-row" @click="go('/invite')">
            <div class="row-main">
              <div class="row-title">返利收益</div>
              <p>管理可提现收益和结算记录</p>
            </div>
            <IconChevronRight :size="18" />
          </button>

        </div>
      </section>

      <div class="bottom-safe-area"></div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IconChevronRight } from '@tabler/icons-vue';
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
const activeSection = ref('overview');
const sectionTabs = [
  { key: 'overview', label: '总览' },
  { key: 'subscription', label: '订阅' },
  { key: 'security', label: '安全性' },
  { key: 'settings', label: '设置' },
  { key: 'benefits', label: '会员权益' },
  { key: 'invite', label: '邀请返利' }
];

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
  padding: 0 0 2px;
  background: var(--background-color);
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
  }

  &.active::after {
    content: '';
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 0;
    height: 3px;
    border-radius: 999px;
    background: rgba(var(--theme-color-rgb), 1);
  }
}

.section-block {
  border-radius: $border-radius-sm;
  background-color: var(--card-bg-color, var(--card-background));
  border: 1px solid rgba(var(--text-color-rgb), 0.08);
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
  grid-template-columns: minmax(0, 1.45fr) minmax(300px, 1fr);
  gap: 1rem;

  &.no-tier {
    grid-template-columns: minmax(0, 1fr);
  }
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

.section-block > .section-title {
  padding: 14px 16px 10px;
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
}
</style>
