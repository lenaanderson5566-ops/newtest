<template>
  <div class="dashboard-container page-shell">
    <div class="dashboard-inner page-inner page-stack">
      <div class="overview-grid">
      <!-- 通知区域 -->
      <!-- 待支付订单提醒条 -->
      <div
        v-if="hasPendingItems"
        class="pending-order-banner"
        :class="{'card-animate': !loading.userStats}"
        style="animation-delay: 0.1s"
        @click="goToOrders"
      >
        <div class="banner-main">
          <IconAlertTriangle :size="16" class="banner-icon" />
          <span class="banner-text text-ellipsis">{{ $t('dashboard.pendingOrderBanner', { count: userStats.pendingOrders }) }}</span>
        </div>
        <button class="banner-action btn btn-primary" @click.stop="goToOrders">{{ $t('dashboard.payNow') }}</button>
      </div>

      <div class="stats-grid">
        <template v-if="loading.userStats">
          <div v-for="i in 4" :key="i" class="stats-card skeleton-card">
            <div class="skeleton-icon"></div>
            <div class="skeleton-content">
              <div class="skeleton-row-sm"></div>
              <div class="skeleton-row-xs"></div>
            </div>
          </div>
        </template>

        <template v-else-if="!hasPlan">
          <!-- 没有订阅时显示的提示卡片 -->
          <InfoCard class="dashboard-card stats-card no-plan-card" :class="{'card-animate': !loading.userStats}"
               style="animation-delay: 0.5s; grid-column: span 4; margin: 0 auto; max-width: var(--page-content-max-width); width: 100%;">
            <template #icon>
              <div class="no-plan-icon">
                <IconShoppingCart :size="45" class="icon-cart"/>
              </div>
            </template>
            <template #title>{{ $t('dashboard.noPlanPrompt') }}</template>
            <template #action>
              <button class="action-button primary btn btn-primary" @click="goToShop">
                <IconShoppingBag :size="18" class="btn-icon"/>
                <span>{{ $t('dashboard.purchasePlan') }}</span>
              </button>
            </template>
          </InfoCard>
        </template>

        <template v-else>
          <div
            class="stats-card overview-card overview-card--traffic-quota traffic-board-card"
            v-for="(card, idx) in trafficBoardSections"
            :key="card.key"
            :class="[`traffic-board-${card.key}`, { 'card-animate': !loading.userStats }, { 'total-main-card': card.key === 'total' }, { 'quota-traffic-card': card.key === 'subscription' || card.key === 'package' }, { 'expired-main-card': card.key === 'total' && isPlanExpired }, { 'quota-card-muted': (card.key === 'package' && (!hasPurchasedTrafficPackage || isPlanExpired)) || (card.key === 'subscription' && isPlanExpired) }, { 'subscription-card-muted': card.key === 'subscription' && isPlanExpired }]"
            :style="{ animationDelay: `${0.5 + idx * 0.1}s` }"
          >
            <div class="usage-card-title">
              <span>{{ card.key === 'total' ? $t('dashboard.subscriptionInfo') : card.title }}</span>
              <span
                v-if="card.key === 'package'"
                class="info-tooltip"
                tabindex="0"
                role="button"
                :aria-label="$t('dashboard.trafficPackageHint')"
              >
                <IconHelpCircle :size="14" />
                <span class="info-tooltip-content">{{ $t('dashboard.trafficPackageHint') }}</span>
              </span>
            </div>
            <div v-if="card.key === 'total'" class="plan-summary-card">
              <div v-if="isPlanExpired" class="expired-status-strip">
                {{ $t('dashboard.subscriptionPausedAfterExpiry') }}
              </div>
              <div class="plan-summary-section plan-summary-section-meta">
                <div class="plan-status-hero">
                  <div class="plan-name-main">{{ userPlan.name || '-' }}</div>
                  <div class="plan-expire-meta">
                    <span>{{ planExpireMetaText }}</span>
                    <span class="plan-status-tag" :class="`is-${subscriptionStatus}`">{{ subscriptionStatusLabel }}</span>
                  </div>
                </div>
              </div>

              <div class="plan-summary-section plan-summary-section-traffic">
                <div class="plan-summary-row monthly-traffic-row">
                  <span class="plan-summary-label">{{ $t('dashboard.subscriptionMonthlyTraffic') }}</span>
                  <strong class="plan-summary-value">{{ formatPackageRemaining(isPlanExpired ? 0 : subscriptionTrafficSummary.remaining) }}</strong>
                </div>
                <div class="section-progress-track in-plan-card">
                  <div class="section-progress-fill" :style="{ width: `${isPlanExpired ? 0 : subscriptionTrafficSummary.remainingPercentage}%` }"></div>
                </div>
                <div class="usage-summary-line in-plan-card">
                  {{ $t('dashboard.used') }} {{ formatPackageRemaining(isPlanExpired ? 0 : subscriptionTrafficSummary.used) }} / {{ formatPackageRemaining(subscriptionTrafficSummary.total) }}
                </div>
                <div class="usage-reset-hint in-plan-card">
                  {{ $t('dashboard.resetTimeLabel') }} {{ userPlan.resetDateTime || '-' }}
                </div>
              </div>

              <div class="plan-summary-section plan-summary-section-actions">
                <div class="plan-summary-actions">
                  <button
                    class="plan-action-btn btn"
                    :class="primaryActionClass"
                    @click="handlePrimaryPlanAction"
                  >
                    <span class="plan-action-content">
                      <IconPackage v-if="isManageAction(primaryPlanActionLabel)" :size="14" class="plan-action-icon" />
                      <IconCalendarPlus v-else-if="isRenewAction(primaryPlanActionLabel)" :size="14" class="plan-action-icon" />
                      <IconShoppingBag v-else-if="isReselectAction(primaryPlanActionLabel)" :size="14" class="plan-action-icon" />
                      <IconChevronRight v-else :size="14" class="plan-action-icon" />
                      <span>{{ primaryPlanActionLabel }}</span>
                    </span>
                  </button>
                  <button
                    class="plan-action-btn btn"
                    :class="secondaryActionClass"
                    @click="handleSecondaryPlanAction"
                  >
                    <span class="plan-action-content">
                      <IconPackage v-if="isManageAction(secondaryPlanActionLabel)" :size="14" class="plan-action-icon" />
                      <IconCalendarPlus v-else-if="isRenewAction(secondaryPlanActionLabel)" :size="14" class="plan-action-icon" />
                      <IconShoppingBag v-else-if="isReselectAction(secondaryPlanActionLabel)" :size="14" class="plan-action-icon" />
                      <IconChevronRight v-else :size="14" class="plan-action-icon" />
                      <span>{{ secondaryPlanActionLabel }}</span>
                    </span>
                  </button>
                </div>
                <div v-if="isPlanExpired" class="plan-action-helper-text">
                  {{ $t('dashboard.renewToRestoreAccess') }}
                </div>
              </div>
            </div>
            <div v-else class="usage-card-main" :class="{ 'package-main': card.key === 'package' }">
              <template v-if="card.key === 'package'">
                <span class="usage-percent compact">{{ formatPackageRemaining(card.remaining) }}</span>
                <span class="usage-percent-label">{{ $t('dashboard.remaining') }}</span>
                <button class="package-add-btn" @click.stop="openTrafficPackageModal" :title="$t('dashboard.purchaseTrafficPackage')">
                  <IconPlus :size="14" />
                </button>
              </template>
              <template v-else>
                <template v-if="card.key === 'subscription'">
                  <span class="usage-percent compact">{{ formatPackageRemaining(isPlanExpired ? 0 : card.remaining) }}</span>
                  <span class="usage-percent-label">{{ $t('dashboard.remaining') }}</span>
                </template>
                <template v-else>
                  <span class="usage-percent">{{ card.remainingPercentage }}%</span>
                  <span class="usage-percent-label">{{ $t('dashboard.remaining') }}</span>
                </template>
              </template>
            </div>
            <div v-if="card.key !== 'package' && card.key !== 'total'" class="section-progress-track">
              <div class="section-progress-fill" :style="{ width: `${card.key === 'subscription' && isPlanExpired ? 0 : card.remainingPercentage}%` }"></div>
            </div>
            <div class="usage-kpis" v-if="card.key !== 'package' && card.key !== 'total'">
              <template v-if="card.key === 'subscription'">
                <div class="usage-summary-line persist-visible">
                  {{ $t('dashboard.used') }} {{ formatPackageRemaining(isPlanExpired ? 0 : card.used) }} / {{ formatPackageRemaining(card.total) }}
                </div>
              </template>
              <template v-else>
                <div class="usage-kpi">
                  <span class="usage-kpi-label">{{ $t('dashboard.total') }}</span>
                  <strong class="usage-kpi-value">{{ formatPackageRemaining(card.total) }}</strong>
                </div>
                <div class="usage-kpi">
                  <span class="usage-kpi-label">{{ $t('dashboard.remaining') }}</span>
                  <strong class="usage-kpi-value">{{ formatPackageRemaining(card.remaining) }}</strong>
                </div>
              </template>
            </div>
            <div v-if="card.key === 'subscription'" class="usage-reset-hint persist-visible">
              {{ $t('dashboard.resetTimeLabel') }} {{ userPlan.resetDateTime || '-' }}
            </div>
          </div>

          <div
            class="stats-card overview-card overview-card--today-traffic today-traffic-card"
            :class="{ 'card-animate': !loading.userStats }"
            :style="{ animationDelay: todayTrafficAnimationDelay }"
          >
            <div class="usage-card-title today-card-title">{{ $t('dashboard.todayTrafficTitle') }}</div>
            <div class="today-traffic-total-main">
              <span class="usage-percent compact">{{ todayTrafficStats.totalGb }} GB</span>
              <span class="usage-percent-label">{{ $t('dashboard.todayTrafficUsed') }}</span>
            </div>
            <div class="today-traffic-breakdown">
              <span class="traffic-up">{{ $t('dashboard.todayTrafficUpload') }} {{ todayTrafficStats.uploadGb }} GB</span>
              <span class="traffic-down">{{ $t('dashboard.todayTrafficDownload') }} {{ todayTrafficStats.downloadGb }} GB</span>
            </div>
          </div>

        </template>
      </div>

      <div class="dashboard-card usage-trend-card" v-if="hasPlan">
        <div class="card-header">
          <h2 class="card-title usage-card-title">{{ $t('trafficLog.title') }}</h2>
        </div>
        <div class="card-body">
          <div v-if="trafficTrendLoading" class="trend-state">{{ $t('trafficLog.loadingTraffic') }}</div>
          <div v-else-if="trafficTrendError" class="trend-state">{{ $t('trafficLog.errorLoadingTraffic') }}</div>
          <div v-else-if="!trafficTrendData.length" class="trend-state">{{ $t('trafficLog.noTrafficData') }}</div>
          <div v-else ref="trafficTrendChartRef" class="usage-trend-chart"></div>
        </div>
      </div>

    </div>
    <!-- 弹窗组件 -->
    <CommonDialog
        :show-dialog="showPopup"
        :title="$t('invite.withdraw.tip')"
        :content="$t('dashboard.resetDataCycleNotice')"
        cancel-button-i18n-key="profile.cancel"
        confirm-button-i18n-key="profile.iKnow"
        @close="handlePopupClose"
        @confirm="handlePopupConfirm"
    />

      <transition name="modal-fade">
      <div class="traffic-package-modal-overlay" v-if="showTrafficPackageModal" @click="showTrafficPackageModal = false">
        <div class="traffic-package-modal-container" @click.stop>
          <div class="traffic-package-modal-card-global">
            <div class="modal-header">
              <h3>{{ $t('shop.traffic_package.title') }}</h3>
              <button class="close-button" :aria-label="$t('common.close')" @click="showTrafficPackageModal = false">
                <IconX :size="18" />
              </button>
            </div>
            <div class="modal-body">
              <p class="traffic-package-desc">{{ $t('shop.traffic_package.description') }}</p>
              <div v-if="trafficPackageLoading" class="traffic-package-loading">{{ $t('common.loading') }}</div>
              <div v-else-if="trafficPackagePlans.length === 0" class="traffic-package-empty">{{ $t('shop.no_plans_found') }}</div>
              <div v-else class="traffic-package-list">
                <div class="traffic-package-item" v-for="plan in trafficPackagePlans" :key="`dashboard-traffic-${plan.id}`">
                  <div class="item-title-row">
                    <strong>{{ getTrafficPackageDisplayName(plan) }}</strong>
                    <span class="item-price">{{ currencySymbol }}{{ (normalizeTrafficPackagePrice(plan.onetime_price) / 100).toFixed(2) }}</span>
                  </div>
                  <div class="item-content" v-if="getTrafficPackageContent(plan)">{{ getTrafficPackageContent(plan) }}</div>
                  <button class="confirm-btn btn btn-primary btn-block" :disabled="isTrafficPackageSoldOut(plan)" @click="purchaseTrafficPackage(plan)">
                    {{ isTrafficPackageSoldOut(plan) ? $t('shop.plan.sold_out_btn') : $t('shop.plan.add_quota') }}
                  </button>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" @click="showTrafficPackageModal = false">
                {{ $t('common.cancel') }}
              </button>
            </div>
          </div>
        </div>
      </div>
      </transition>
    </div>
  </div>

</template>

<script>
import {
  computed,
  inject,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch
} from 'vue';
import {useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import { isXiaoV2board } from '@/utils/baseConfig';
import {
  IconAlertTriangle,
  IconBox,
  IconBrandAndroid,
  IconBrandApple,
  IconBrandDebian,
  IconBrandFinder,
  IconBrandGithub,
  IconBrandWindows,
  IconCalendar,
  IconCat,
  IconChevronLeft,
  IconChevronRight,
  IconCoins,
  IconCrosshair,
  IconDeviceDesktop,
  IconEye,
  IconEyeOff,
  IconFileText,
  IconHelpCircle,
  IconMoon,
  IconPackage,
  IconRocket,
  IconRouter,
  IconSend,
  IconShare,
  IconShoppingBag,
  IconShoppingCart,
  IconTransferVertical,
  IconUserPlus,
  IconWallet,
  IconWaveSawTool,
  IconWaveSine,
  IconX,
  IconCalendarPlus,
  IconPlus
} from '@tabler/icons-vue';
import CommonDialog from '@/components/popup/CommonDialog.vue';
import InfoCard from '@/components/common/InfoCard.vue';
import {getSubscribe, getUserConfig, getUserInfo, getUserStats, setNextPeriod} from '@/api/overview/dashboard';
import { getTrafficLog } from '@/api/account/trafficLog';
import * as echarts from 'echarts';
import {useToast} from '@/composables/useToast';
import {fetchPlans} from '@/api/account/shop';

import {cleanupResources, createTimer} from '@/utils/componentLifecycle';
import { formatDate } from '@/utils/formatters';

export default {
  name: 'UserDashboard',
  components: {
    IconBox,
    IconSend,
    IconCalendar,
    IconUserPlus,
    IconShoppingCart,
    IconFileText,
    IconWallet,
    IconBrandApple,
    IconBrandAndroid,
    IconBrandWindows,
    IconBrandDebian,
    IconRouter,
    IconBrandFinder,
      IconTransferVertical,
    IconShare,
    IconChevronLeft,
    IconChevronRight,
        IconRocket,
    IconWaveSine,
    IconDeviceDesktop,
    IconCrosshair,
    IconPackage,
    IconMoon,
    IconWaveSawTool,
    IconBrandGithub,
    IconCat,
    IconEyeOff,
    IconShoppingBag,
    IconHelpCircle,
    IconCoins,
    IconEye,
    IconAlertTriangle,
    InfoCard,
    IconX,
    IconCalendarPlus,
    IconPlus,
    CommonDialog
  },
  setup() {
    const {t, locale} = useI18n();
    const router = useRouter();
    const { showToast } = useToast();
    const currencySymbol = ref('$');
    const hasPlan = ref(true);
    const userStats = reactive({
      remainingTraffic: '',
      remainingDays: '',
      accountBalance: '0.00',
      pendingOrders: 0,
      pendingTickets: 0,
      userEmail: '',
      isRemainingDaysPermanent: false
    });
    const userBalance = ref('0.00');
    const userPlan = ref({
      deviceLimit: null,
      aliveIp: 0,
      resetDay: null,
      resetDateTime: null,
      subscriptionQuotaUsed: null,
      subscriptionQuotaRemaining: null,
      packageQuotaRemaining: null,
      expiredAt: null
    });
    const allowNewPeriod = ref('');

        const trafficMetrics = reactive({
      totalTrafficBytes: 0,
      totalUsedBytes: 0,
      totalRemainingBytes: 0,
      subscriptionQuotaTotalBytes: 0,
      subscriptionQuotaUsedBytes: 0,
      subscriptionQuotaRemainingBytes: 0,
      packageQuotaRemainingBytes: 0,
    });

    const trafficTrendChartRef = ref(null);
    const trafficTrendData = ref([]);
    const trafficTrendLoading = ref(false);
    const trafficTrendError = ref(false);
    const todayTrafficStats = reactive({
      uploadGb: '0.00',
      downloadGb: '0.00',
      totalGb: '0.00'
    });
    let trafficTrendChart = null;

    const loading = reactive({
      userInfo: true,
      userStats: true,
      userPlan: true,
      subscribe: true
    });

    watch(() => locale.value, async () => {
      if (userPlan.value.isExpireDatePermanent) {
        userPlan.value.expireDate = t('dashboard.permanent');
      }

      await Promise.allSettled([
        fetchSubscribe(true),
        fetchTrafficTrend()
      ]);
    });


    const goToShop = () => {
      router.push('/shop');
    };

    const userPlanId = ref(null);

    const showTrafficPackageModal = ref(false);
    const trafficPackageLoading = ref(false);
    const trafficPackagePlans = ref([]);
    const showPopup = ref(false);
    const handlePopupClose = () => {

      showPopup.value = false;

    };
    const handlePopupConfirm = async () => {
      try {
        const response = await setNextPeriod()
        if (response.data) {
          await fetchSubscribe()
          showToast(t('dashboard.nextPeriodSuccess'), 'success');
          showPopup.value = false;
        }
      } catch (error) {
        console.error('提前开启下月失败:', error);
        showToast(t('dashboard.nextPeriodError'), 'error');
      }

    }


    const fetchUserInfo = async () => {
      if (loading.userInfo === false && Object.keys(userPlan.value).length > 0) return;

      loading.userInfo = true;
      try {
        const response = await getUserInfo();
        if (response.data) {
          const info = response.data;

          userPlanId.value = info.plan_id;

          hasPlan.value = info.plan_id !== null && info.plan_id !== undefined;

          if (info.email) {
            userStats.userEmail = info.email;
          }
          if (info.balance !== undefined) {
            userBalance.value = info.balance;
            updateAccountBalanceDisplay();
          }

          if (info.expired_at) {
            userPlan.value.expireDate = formatDate(info.expired_at);
            userPlan.value.expiredAt = Number(info.expired_at);
            userPlan.value.isExpireDatePermanent = false;

            const now = new Date();
            const expiredDate = new Date(info.expired_at * 1000);
            const diffTime = expiredDate - now;

            if (diffTime <= 0) {
              userStats.remainingDays = '0';
              userStats.isRemainingDaysPermanent = false;
            } else {
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              userStats.remainingDays = `${diffDays}`;
              userStats.isRemainingDaysPermanent = false;
            }
          } else {
            userPlan.value.expireDate = null;
            userPlan.value.expiredAt = null;
            userPlan.value.isExpireDatePermanent = true;
            userStats.remainingDays = null;
            userStats.isRemainingDaysPermanent = true;
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      } finally {
        loading.userInfo = false;
      }
    };
    const isExpiringSoon = computed(() => {
      if (userStats.isRemainingDaysPermanent) return false;

      const days = parseInt(userStats.remainingDays, 10);
      return !isNaN(days) && days > 0 && days <= 7;
    });

    const isExpired = computed(() => {
      if (userPlan.value.isExpireDatePermanent) return false;

      const expiredAt = Number(userPlan.value.expiredAt || 0);
      if (!expiredAt) return false;

      return expiredAt * 1000 <= Date.now();
    });

    const isPlanExpired = computed(() => hasPlan.value && isExpired.value);

    const subscriptionStatus = computed(() => {
      if (isPlanExpired.value) return 'expired';
      if (isExpiringSoon.value) return 'expiring';
      return 'active';
    });

    const subscriptionStatusLabel = computed(() => t(`dashboard.subscriptionStatus.${subscriptionStatus.value}`));

    const planExpireMetaText = computed(() => {
      if (userPlan.value.isExpireDatePermanent) {
        return t('dashboard.permanent');
      }
      if (isPlanExpired.value) {
        return t('dashboard.expiredOnDate', {date: userPlan.value.expireDate || '-'});
      }
      return userPlan.value.expireDate || '-';
    });

    const primaryPlanActionLabel = computed(() => {
      if (isPlanExpired.value) return t('dashboard.planAction.restoreNow');
      if (isExpiringSoon.value) return t('dashboard.planAction.renewNow');
      return t('dashboard.planAction.manageSubscription');
    });

    const secondaryPlanActionLabel = computed(() => {
      if (isPlanExpired.value) return t('dashboard.planAction.reselectPlan');
      return t('dashboard.planAction.renew');
    });


    const subscriptionTrafficSummary = computed(() => {
      const used = Number(trafficMetrics.subscriptionQuotaUsedBytes || 0);
      const total = Number(trafficMetrics.subscriptionQuotaTotalBytes || 0);
      const remaining = Number(trafficMetrics.subscriptionQuotaRemainingBytes || 0);
      const usedPercentage = total > 0 ? Math.round((used / total) * 100) : 0;

      return {
        used,
        total,
        remaining,
        remainingPercentage: Math.min(Math.max(100 - usedPercentage, 0), 100)
      };
    });

    const primaryActionClass = computed(() => {
      if (primaryPlanActionLabel.value === t('dashboard.planAction.manageSubscription')) return 'btn-outline';
      return 'btn-primary';
    });

    const secondaryActionClass = computed(() => {
      if (secondaryPlanActionLabel.value === t('dashboard.planAction.renew')) return 'btn-primary';
      return 'btn-secondary';
    });
    const isManageAction = (label) => label === t('dashboard.planAction.manageSubscription');
    const isRenewAction = (label) =>
      [t('dashboard.planAction.renewNow'), t('dashboard.planAction.renew'), t('dashboard.planAction.restoreNow')].includes(label);
    const isReselectAction = (label) => label === t('dashboard.planAction.reselectPlan');

    const handlePrimaryPlanAction = () => {
      if (subscriptionStatus.value === 'active') {
        goToShop();
        return;
      }
      renewPlan();
    };

    const handleSecondaryPlanAction = () => {
      if (subscriptionStatus.value === 'active') {
        renewPlan();
        return;
      }
      goToShop();
    };

    const toNumberOrNull = (value) => {
      if (value === null || value === undefined || value === '') return null;
      const num = Number(value);
      return Number.isFinite(num) ? num : null;
    };

    const getSubscribeTrafficMetrics = (subscribe) => {
      const totalTrafficBytes =
        toNumberOrNull(subscribe.transfer_enable) ??
        toNumberOrNull(subscribe.subscription_quota_total_bytes) ??
        toNumberOrNull(subscribe.base_quota_bytes) ??
        0;

      const usedTrafficBytes =
        toNumberOrNull(subscribe.total_used_bytes) ??
        toNumberOrNull(subscribe.used_bytes) ??
        (
          (toNumberOrNull(subscribe.u) ?? 0) +
          (toNumberOrNull(subscribe.d) ?? 0)
        );

      const remainingTrafficBytes =
        toNumberOrNull(subscribe.total_remaining_bytes) ??
        Math.max(totalTrafficBytes - usedTrafficBytes, 0);

      return {
        totalTrafficBytes: Math.max(totalTrafficBytes, 0),
        remainingTrafficBytes: Math.max(remainingTrafficBytes, 0)
      };
    };

    const fetchSubscribe = async (force = false) => {
      // 正常的缓存逻辑
      if (!force && loading.subscribe === false && userPlan.value.subscribeUrl) return;

      loading.subscribe = true;
      try {
        const response = await getSubscribe();
        allowNewPeriod.value = String(response.data.allow_new_period ?? '0');
        if (response.data) {
          const subscribe = response.data;
          const { totalTrafficBytes, remainingTrafficBytes } = getSubscribeTrafficMetrics(subscribe);
          if (subscribe.plan && subscribe.plan.name) {
            userPlan.value.name = subscribe.plan.name;
          }
          if (subscribe.plan && subscribe.plan.id) {
            userPlanId.value = subscribe.plan.id;
          }
          if (subscribe.expired_at) {
            userPlan.value.expireDate = formatDate(subscribe.expired_at);
            userPlan.value.expiredAt = Number(subscribe.expired_at);
            userPlan.value.isExpireDatePermanent = false;

            const now = new Date();
            const expiredDate = new Date(subscribe.expired_at * 1000);
            const diffTime = expiredDate - now;

            if (diffTime <= 0) {
              userStats.remainingDays = '0';
              userStats.isRemainingDaysPermanent = false;
            } else {
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              userStats.remainingDays = `${diffDays}`;
              userStats.isRemainingDaysPermanent = false;
            }
          } else {
            userPlan.value.expireDate = null;
            userPlan.value.expiredAt = null;
            userPlan.value.isExpireDatePermanent = true;
            userStats.remainingDays = null;
            userStats.isRemainingDaysPermanent = true;
          }
          userPlan.value.totalTraffic = formatTraffic(totalTrafficBytes);
          userStats.remainingTraffic = formatTraffic(remainingTrafficBytes);

          const subscriptionQuotaUsedBytes =
            toNumberOrNull(subscribe.subscription_quota_used_bytes) ??
            toNumberOrNull(subscribe.monthly_used_bytes);
          const subscriptionQuotaTotalBytes =
            toNumberOrNull(subscribe.subscription_quota_total_bytes) ??
            toNumberOrNull(subscribe.base_quota_bytes);
          const subscriptionQuotaRemainingBytes =
            toNumberOrNull(subscribe.subscription_quota_remaining_bytes) ??
            toNumberOrNull(subscribe.monthly_remaining_bytes);
          const packageQuotaRemainingBytes =
            toNumberOrNull(subscribe.quota_package_remaining_bytes) ??
            toNumberOrNull(subscribe.package_remaining_bytes);

          userPlan.value.subscriptionQuotaUsed =
            subscriptionQuotaUsedBytes === null ? null : formatTraffic(Math.max(subscriptionQuotaUsedBytes, 0));
          userPlan.value.subscriptionQuotaRemaining =
            subscriptionQuotaRemainingBytes === null ? null : formatTraffic(Math.max(subscriptionQuotaRemainingBytes, 0));
          userPlan.value.packageQuotaRemaining =
            packageQuotaRemainingBytes === null ? null : formatTraffic(Math.max(packageQuotaRemainingBytes, 0));

          trafficMetrics.totalTrafficBytes = totalTrafficBytes;
          trafficMetrics.totalUsedBytes = Math.max(totalTrafficBytes - remainingTrafficBytes, 0);
          trafficMetrics.totalRemainingBytes = remainingTrafficBytes;
          trafficMetrics.subscriptionQuotaTotalBytes = Math.max(subscriptionQuotaTotalBytes ?? 0, 0);
          trafficMetrics.subscriptionQuotaUsedBytes = Math.max(subscriptionQuotaUsedBytes ?? 0, 0);
          trafficMetrics.subscriptionQuotaRemainingBytes = Math.max(subscriptionQuotaRemainingBytes ?? 0, 0);
          trafficMetrics.packageQuotaRemainingBytes = Math.max(packageQuotaRemainingBytes ?? 0, 0);

          const resetDay = subscribe.reset_day ?? subscribe.plan?.reset_day;
          if (resetDay) {
            userPlan.value.resetDay = resetDay;
          }
          userPlan.value.resetDateTime = getNextResetDateTime(subscribe);
          if (subscribe.subscribe_url) {
            userPlan.value.subscribeUrl = subscribe.subscribe_url;
          }

          if (subscribe.device_limit !== undefined) {
            userPlan.value.deviceLimit = subscribe.device_limit;
          }
          if (subscribe.alive_ip !== undefined) {
            userPlan.value.aliveIp = subscribe.alive_ip;
          }

          if (subscribe.expired_at) {
            const now = new Date();
            const expiredDate = new Date(subscribe.expired_at * 1000);
            const diffTime = expiredDate - now;

            if (diffTime <= 0) {
              userStats.remainingDays = '0';
              userStats.isRemainingDaysPermanent = false;
            } else {
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              userStats.remainingDays = `${diffDays}`;
              userStats.isRemainingDaysPermanent = false;
            }
          } else {
            userStats.remainingDays = null;
            userStats.isRemainingDaysPermanent = true;
          }
        }
      } catch (error) {
        console.error('获取订阅信息失败:', error);
      } finally {
        loading.subscribe = false;
      }
    };

    const fetchUserStats = async () => {
      if (loading.userStats === false && userStats.remainingTraffic !== '0 GB') return;

      loading.userStats = true;
      try {
        const response = await getUserStats();
        if (response.data && Array.isArray(response.data) && response.data.length >= 2) {
          const stats = response.data;
          userStats.pendingOrders = stats[0];
          userStats.pendingTickets = stats[1];
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        loading.userStats = false;
      }
    };

    const formatTraffic = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatPackageRemaining = (bytes) => {
      const gb = Math.max(bytes || 0, 0) / (1024 ** 3);
      return `${gb.toFixed(2)} GB`;
    };

    const normalizeTrafficPackagePrice = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    };


    const getPlanListFromResponse = (response) => {
      if (Array.isArray(response?.data)) return response.data;
      if (Array.isArray(response?.data?.data)) return response.data.data;
      return [];
    };

    const getTrafficPackageDisplayName = (plan) => {
      const name = String(plan?.name || '').trim();
      if (!name) return t('shop.traffic_package.entry');
      if (/^data\s*credit$/i.test(name)) return t('shop.traffic_package.entry');
      return name;
    };

    const getTrafficPackageContent = (plan) => {
      const raw = plan?.content;
      if (!raw) return '';
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const enabled = parsed.filter((item) => item && item.support !== false).map((item) => item.feature).filter(Boolean);
          return enabled.slice(0, 2).join(' · ');
        }
      } catch (_) {
        // non-json content
      }
      const plain = String(raw).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const displayName = getTrafficPackageDisplayName(plan);
      if (!plain) return '';
      if (plain.toLowerCase() === displayName.toLowerCase()) return '';
      return plain;
    };


    const hasValidOneTimePrice = (plan) => {
      const raw = plan?.onetime_price;
      if (raw === null || raw === undefined || raw === '') {
        return false;
      }
      const price = Number(raw);
      return Number.isFinite(price) && price >= 0;
    };

    const isTrafficPackageSoldOut = (plan) => {
      const raw = plan?.capacity_limit;
      if (raw === null || raw === undefined || raw === '') {
        return false;
      }
      const capacity = Number(raw);
      return Number.isFinite(capacity) && capacity === 0;
    };

    const openTrafficPackageModal = async () => {
      showTrafficPackageModal.value = true;
      trafficPackageLoading.value = true;
      try {
        const response = await fetchPlans(locale.value);
        const list = getPlanListFromResponse(response);
        trafficPackagePlans.value = list.filter((plan) => hasValidOneTimePrice(plan));
      } catch (error) {
        trafficPackagePlans.value = [];
        showToast(t('shop.failed_to_fetch_plan'), 'error');
      } finally {
        trafficPackageLoading.value = false;
      }
    };

    const purchaseTrafficPackage = (plan) => {
      if (isTrafficPackageSoldOut(plan)) {
        showToast(t('shop.plan.stock.sold_out'), 'error');
        return;
      }
      showTrafficPackageModal.value = false;
      router.push({
        path: '/order-confirm',
        query: {
          id: plan.id,
          period: 'onetime_price'
        }
      });
    };

    const hasPendingItems = computed(() => {
      return userStats.pendingOrders > 0;
    });

    const goToOrders = () => {
      router.push('/billing?tab=orders');
    };


    const formatResetDateTime = (date) => {
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
      const localeValue = locale.value || 'en-US';
      const formatter = new Intl.DateTimeFormat(localeValue, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      return formatter.format(date);
    };

    const parseResetTimestamp = (value) => {
      if (value === null || value === undefined || value === '') return null;

      if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
      }

      const numeric = Number(value);
      if (Number.isFinite(numeric) && numeric > 0) {
        const timestampMs = numeric > 1e12 ? numeric : numeric * 1000;
        const date = new Date(timestampMs);
        return Number.isNaN(date.getTime()) ? null : date;
      }

      if (typeof value === 'string') {
        const normalized = value.trim().replace(/-/g, '/');
        const date = new Date(normalized);
        if (!Number.isNaN(date.getTime())) {
          return date;
        }
      }

      return null;
    };

    const getNextResetDateTime = (subscribe) => {
      const expiredAtDate = parseResetTimestamp(subscribe?.expired_at);
      const resetDayValue = Number(subscribe?.reset_day ?? subscribe?.plan?.reset_day);
      const effectiveResetDay = Number.isFinite(resetDayValue) && resetDayValue > 0
        ? resetDayValue
        : (expiredAtDate ? expiredAtDate.getDate() : null);

      if (!Number.isFinite(effectiveResetDay) || effectiveResetDay <= 0) {
        return null;
      }

      const now = new Date();

      const buildMonthlyDate = (year, month, day, hour, minute) => {
        const maxDay = new Date(year, month + 1, 0).getDate();
        return new Date(year, month, Math.min(day, maxDay), hour, minute, 0);
      };

      const resetHourRaw = subscribe?.reset_hour ?? subscribe?.plan?.reset_hour;
      const resetMinuteRaw = subscribe?.reset_minute ?? subscribe?.plan?.reset_minute;
      const resetHour = Number.isFinite(Number(resetHourRaw))
        ? Number(resetHourRaw)
        : (expiredAtDate ? expiredAtDate.getHours() : 0);
      const resetMinute = Number.isFinite(Number(resetMinuteRaw))
        ? Number(resetMinuteRaw)
        : (expiredAtDate ? expiredAtDate.getMinutes() : 0);
      let candidate = buildMonthlyDate(now.getFullYear(), now.getMonth(), effectiveResetDay, resetHour, resetMinute);
      if (candidate <= now) {
        candidate = buildMonthlyDate(candidate.getFullYear(), candidate.getMonth() + 1, effectiveResetDay, resetHour, resetMinute);
      }

      if (expiredAtDate && candidate > expiredAtDate) {
        return formatResetDateTime(expiredAtDate);
      }

      return formatResetDateTime(candidate);
    };

    const fetchUserConfig = async () => {
      try {
        const response = await getUserConfig();
        if (response.data) {
          if (response.data.currency_symbol) {
            currencySymbol.value = response.data.currency_symbol;
            if (userStats.accountBalance) {
              updateAccountBalanceDisplay();
            }
          }
        }
      } catch (error) {
        console.error('获取用户配置失败:', error);
      }
    };

    const updateAccountBalanceDisplay = () => {
      if (userBalance.value) {
        userStats.accountBalance = `${currencySymbol.value}${(parseFloat(userBalance.value) / 100).toFixed(2)}`;
      }
    };

    const getTrafficLogRows = (response) => {
      if (Array.isArray(response?.data)) return response.data;
      if (Array.isArray(response?.data?.data)) return response.data.data;
      return [];
    };

    const fetchTrafficTrend = async () => {
      trafficTrendLoading.value = true;
      trafficTrendError.value = false;
      try {
        const response = await getTrafficLog();
        const rows = getTrafficLogRows(response);

        const now = new Date();
        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
        let todayUploadBytes = 0;
        let todayDownloadBytes = 0;

        rows.forEach((item) => {
          const recordAt = Number(item?.record_at);
          if (!Number.isFinite(recordAt) || recordAt <= 0) return;

          const timestampMs = recordAt > 1e12 ? recordAt : recordAt * 1000;
          if (timestampMs >= dayStart && timestampMs < dayEnd) {
            todayUploadBytes += Number(item?.u) || 0;
            todayDownloadBytes += Number(item?.d) || 0;
          }
        });

        const toGbText = (bytes) => ((Number(bytes) || 0) / (1024 ** 3)).toFixed(2);
        todayTrafficStats.uploadGb = toGbText(todayUploadBytes);
        todayTrafficStats.downloadGb = toGbText(todayDownloadBytes);
        todayTrafficStats.totalGb = toGbText(todayUploadBytes + todayDownloadBytes);

        const sorted = [...rows]
          .filter((item) => item && item.record_at)
          .sort((a, b) => Number(a.record_at) - Number(b.record_at))
          .slice(-30);
        trafficTrendData.value = sorted.map((item) => {
          const recordAt = Number(item.record_at);
          const timestampMs = recordAt > 1e12 ? recordAt : recordAt * 1000;
          const uploadGb = Number(((Number(item.u) || 0) / (1024 ** 3)).toFixed(2));
          const downloadGb = Number(((Number(item.d) || 0) / (1024 ** 3)).toFixed(2));
          return {
            date: new Date(timestampMs).toLocaleDateString(),
            uploadGb,
            downloadGb,
            totalGb: Number((uploadGb + downloadGb).toFixed(2))
          };
        });
      } catch (e) {
        console.error('Failed to fetch traffic trend data:', e);
        trafficTrendError.value = true;
        trafficTrendData.value = [];
        todayTrafficStats.uploadGb = '0.00';
        todayTrafficStats.downloadGb = '0.00';
        todayTrafficStats.totalGb = '0.00';
      } finally {
        trafficTrendLoading.value = false;
        await nextTick();
        renderTrafficTrendChart();
      }
    };

    const renderTrafficTrendChart = () => {
      if (!trafficTrendChartRef.value || !trafficTrendData.value.length) {
        if (trafficTrendChart) {
          trafficTrendChart.dispose();
          trafficTrendChart = null;
        }
        return;
      }
      if (trafficTrendChart) {
        trafficTrendChart.dispose();
      }
      const rootStyles = getComputedStyle(document.documentElement);
      const textColor =
        rootStyles.getPropertyValue('--text-primary').trim() ||
        `rgb(${rootStyles.getPropertyValue('--text-color-rgb').trim() || '51, 51, 51'})`;
      const borderColor = rootStyles.getPropertyValue('--border-color').trim() || '#e8e8e8';
      const themeColor = rootStyles.getPropertyValue('--theme-color').trim() || '#6753f6';
      const lightGridColor = 'rgba(148, 163, 184, 0.14)';
      trafficTrendChart = echarts.init(trafficTrendChartRef.value);
      trafficTrendChart.setOption({
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            let result = `${params[0]?.name || ''}<br/>`;
            params.forEach((param) => {
              result += `${param.marker} ${param.seriesName}: ${param.value} ${t('trafficLog.unitGb')}<br/>`;
            });
            return result;
          }
        },
        legend: {
          data: [t('trafficLog.uploadTraffic'), t('trafficLog.downloadTraffic'), t('trafficLog.totalTraffic')],
          top: 8,
          right: 8,
          textStyle: { color: textColor }
        },
        grid: { left: '5%', right: '3%', bottom: '16px', top: '46px', containLabel: true },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: trafficTrendData.value.map((i) => i.date),
          axisLabel: {
            rotate: 38,
            color: textColor,
            interval: (index) => {
              const total = trafficTrendData.value.length;
              if (total > 18) return index % 3 !== 0;
              if (total > 10) return index % 2 !== 0;
              return false;
            }
          },
          axisLine: { lineStyle: { color: borderColor } },
          splitLine: { lineStyle: { color: lightGridColor, width: 1 } }
        },
        yAxis: {
          type: 'value',
          axisLabel: { formatter: (value) => `${value} ${t('trafficLog.unitGb')}`, color: textColor },
          axisLine: { lineStyle: { color: borderColor } },
          splitLine: { lineStyle: { color: lightGridColor, width: 1 } }
        },
        series: [
          {
            name: t('trafficLog.uploadTraffic'),
            type: 'line',
            stack: 'Total',
            smooth: true,
            lineStyle: { width: 1.5 },
            showSymbol: false,
            areaStyle: { opacity: 0.12 },
            emphasis: { focus: 'series' },
            data: trafficTrendData.value.map((i) => i.uploadGb),
            color: '#36AD47'
          },
          {
            name: t('trafficLog.downloadTraffic'),
            type: 'line',
            stack: 'Total',
            smooth: true,
            lineStyle: { width: 1.5 },
            showSymbol: false,
            areaStyle: { opacity: 0.12 },
            emphasis: { focus: 'series' },
            data: trafficTrendData.value.map((i) => i.downloadGb),
            color: '#4080FF'
          },
          {
            name: t('trafficLog.totalTraffic'),
            type: 'line',
            smooth: true,
            lineStyle: { width: 2 },
            showSymbol: false,
            emphasis: { focus: 'series' },
            data: trafficTrendData.value.map((i) => i.totalGb),
            color: themeColor
          }
        ]
      });
    };

    onMounted(async () => {
      await fetchUserConfig();

      fetchUserInfo();

      fetchSubscribe();


      fetchUserStats();
      fetchTrafficTrend();

    });

    watch(() => userPlan.value.subscribeUrl, () => {
    });

    const handleResize = () => {
      if (trafficTrendChart) {
        trafficTrendChart.resize();
      }
    };

    onMounted(() => {
      window.addEventListener('resize', handleResize);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
      if (trafficTrendChart) {
        trafficTrendChart.dispose();
        trafficTrendChart = null;
      }
    });

    const renewPlan = () => {
      if (!userPlanId.value) {
        showToast(t('dashboard.noPlanToRenew'), 'error', 3000);
        return;
      }

      router.push(`/order-confirm?id=${userPlanId.value}`);
    };

    const isXiaoPanel = isXiaoV2board();

    const navigateToDeposit = () => {
      router.push('/billing?tab=wallet');
    };

    const showDeviceLimit = computed(() => {
      return isXiaoV2board();
    });

    const timers = {};
    const listeners = {};

    onActivated(() => {
      if (needRefreshData.value) {
        fetchUserInfo();
        fetchUserStats();
        needRefreshData.value = false;
      }

    });

    onDeactivated(() => {
      needRefreshData.value = true;

      cleanupResources(timers, listeners);
    });

    onUnmounted(() => {
      cleanupResources(timers, listeners);
    });

    const needRefreshData = ref(false);

    const hasPurchasedTrafficPackage = computed(() => {
      const packageUsed = Math.max(
        trafficMetrics.totalUsedBytes - trafficMetrics.subscriptionQuotaUsedBytes,
        0
      );
      return packageUsed > 0 || trafficMetrics.packageQuotaRemainingBytes > 0;
    });

    const trafficBoardSections = computed(() => {
      const currentLocale = locale.value;
      void currentLocale;
      const packageUsedBytes = Math.max(
        trafficMetrics.totalUsedBytes - trafficMetrics.subscriptionQuotaUsedBytes,
        0
      );
      const packageTotalBytes = packageUsedBytes + trafficMetrics.packageQuotaRemainingBytes;

      const rows = [
        {
          key: 'total',
          title: t('dashboard.totalTrafficPackAndPackage'),
          used: trafficMetrics.totalUsedBytes,
          total: trafficMetrics.totalTrafficBytes,
          remaining: trafficMetrics.totalRemainingBytes
        },
        {
          key: 'package',
          title: t('dashboard.trafficPackageQuota'),
          used: packageUsedBytes,
          total: packageTotalBytes,
          remaining: trafficMetrics.packageQuotaRemainingBytes
        }
      ];

      return rows.map((row) => {
        const usedPercentage = row.total > 0 ? Math.round((row.used / row.total) * 100) : 0;
        return {
          ...row,
          usedPercentage: Math.min(Math.max(usedPercentage, 0), 100),
          remainingPercentage: Math.min(Math.max(100 - usedPercentage, 0), 100)
        };
      });
    });

    const todayTrafficAnimationDelay = computed(() => {
      const baseDelay = 0.5;
      const step = 0.1;
      return `${baseDelay + trafficBoardSections.value.length * step}s`;
    });

    return {
      userStats,
      userBalance,
      currencySymbol,
      userPlan,
      loading,
      goToShop,
      hasPendingItems,
      goToOrders,
      router,
      formatTraffic,
      formatPackageRemaining,
      handlePopupClose,
      handlePopupConfirm,
      showPopup,
      isExpiringSoon,
      isExpired,
      isPlanExpired,
      subscriptionStatus,
      subscriptionStatusLabel,
      primaryPlanActionLabel,
      planExpireMetaText,
      secondaryPlanActionLabel,
      subscriptionTrafficSummary,
      primaryActionClass,
      secondaryActionClass,
      isManageAction,
      isRenewAction,
      isReselectAction,
      handlePrimaryPlanAction,
      handleSecondaryPlanAction,
      hasPlan,
      renewPlan,
      isXiaoPanel,
      navigateToDeposit,
      showDeviceLimit,
      needRefreshData,
      trafficBoardSections,
      hasPurchasedTrafficPackage,
      trafficTrendChartRef,
      trafficTrendData,
      trafficTrendLoading,
      trafficTrendError,
      todayTrafficStats,
      todayTrafficAnimationDelay,
      allowNewPeriod,
      showTrafficPackageModal,
      trafficPackageLoading,
      trafficPackagePlans,
      openTrafficPackageModal,
      purchaseTrafficPackage,
      normalizeTrafficPackagePrice,
      getTrafficPackageDisplayName,
      getTrafficPackageContent,
      isTrafficPackageSoldOut,
    };
  }
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles/base/variables.scss" as *;

.dashboard-container {
  display: flex;
  justify-content: center;
  --dashboard-card-padding: 12px;
  --dashboard-radius: #{$border-radius-sm};
  --dashboard-pill-radius: 999px;
  --dashboard-button-radius: 12px;
  --dashboard-shadow-compact: none;
  --dashboard-border-color: rgba(148, 163, 184, 0.22);
  --dashboard-title-size: 14px;
  --dashboard-subtitle-color: var(--text-tertiary);
  --dashboard-value-size: 30px;
  --dashboard-kpi-size: 13px;
  --dashboard-gap-compact: var(--global-card-gap);
  --dashboard-section-margin: var(--global-card-gap);

  --saas-brand: #355cc2;
  --saas-text-primary: #111827;
  --saas-text-secondary: var(--text-tertiary);
  --saas-border-soft: #eef1f5;
  --saas-card-bg: #ffffff;
  --saas-card-shadow: none;

  --theme-text-primary: var(--text-primary);
  --theme-text-secondary: var(--text-tertiary);
  --theme-text-subtle: #9ca3af;
  --theme-text-emphasis: var(--text-primary);
  --theme-surface-muted: #f3f4f6;
  --theme-surface-soft: #f8fafc;
  --theme-border-soft: #e5e7eb;
  --theme-white: #ffffff;
  --quota-label-color: var(--text-tertiary);
  --quota-value-color: var(--text-primary);
  --quota-progress-start: #60a5fa;
  --quota-progress-end: #3b82f6;
  --quota-muted-fill: #cbd5e1;
  --quota-total-bg-end: #f8fbff;
  --quota-expired-border: #d1d5db;
  --plan-meta-text: var(--text-tertiary);
  --plan-expired-strip-text: #b91c1c;
  --plan-expired-strip-bg: rgba(248, 113, 113, 0.16);
  --plan-expired-strip-border: rgba(239, 68, 68, 0.32);
  --status-active-text: #15803d;
  --status-active-bg: rgba(34, 197, 94, 0.15);
  --status-expiring-text: #b45309;
  --status-expiring-bg: rgba(245, 158, 11, 0.16);
  --status-expired-text: #dc2626;
  --status-expired-bg: rgba(220, 38, 38, 0.1);

  .dashboard-inner {
    .overview-grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: var(--dashboard-gap-compact);

    > .pending-order-banner {
      grid-column: 1 / -1;
      margin-bottom: 0;
    }

    > .stats-grid,
    > .usage-trend-card {
      grid-column: 1 / -1;
    }

    @media (max-width: 992px) {
      > .pending-order-banner,
      > .stats-grid,
      > .usage-trend-card {
        grid-column: 1 / -1;
      }
    }
  }

  .dashboard-card {
    background-color: var(--saas-card-bg);
    box-shadow: none;
    padding: var(--dashboard-card-padding);
    border: 1px solid var(--dashboard-border-color);
    border-radius: var(--dashboard-radius);
    transition: box-shadow 0.2s ease;

    &:hover {
      box-shadow: none;
      transform: none;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .card-title {
        font-size: var(--dashboard-title-size);
        font-weight: $font-weight-semibold;
        margin: 0;
        color: var(--text-primary);
      }

      .card-actions {
        display: flex;
        gap: 10px;
      }
    }
  }

  .btn {
    border-radius: var(--dashboard-button-radius);
  }

  /* 数据统计卡片区域（会员等级 + 流量卡片） */
  .stats-grid {
    position: relative;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: var(--dashboard-gap-compact);
    margin-bottom: var(--dashboard-section-margin);

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (min-width: 1200px) {
      grid-template-columns: minmax(0, 1.86fr) minmax(0, 1fr);
      grid-auto-rows: minmax(124px, auto);
    }

    .stats-card {
      position: relative;
      z-index: 1;
      background-color: var(--saas-card-bg);
      border-radius: var(--dashboard-radius);
      box-shadow: none;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: var(--dashboard-card-padding);
      transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
      overflow: hidden;
      border: 1px solid var(--dashboard-border-color);

      /* 流量额度包卡片（订阅流量 / 叠加包 / 总览）样式 */
      &.traffic-board-card {
        width: 100%;
        min-width: 0;
        min-height: clamp(156px, 16vw, 208px);
        overflow: visible;
        writing-mode: horizontal-tb;
        text-orientation: mixed;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        gap: 10px;

        .stats-info {
          width: 100%;
        }

        .stats-value {
          font-size: $font-size-md;
          margin-bottom: 2px;
        }

        .stats-label {
          font-size: $font-size-sm;
        }

        .usage-card-title {
          position: relative;
          z-index: 5;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          writing-mode: horizontal-tb;
          text-orientation: mixed;
          white-space: normal;
          font-size: var(--dashboard-title-size);
          line-height: 1.35;
          min-height: 20px;
        }

        .usage-card-main {
          display: flex;
          align-items: baseline;
          gap: 8px;
          min-height: 42px;

          &.package-main {
            align-items: baseline;
            width: 100%;
          }

          .package-add-btn {
            margin-left: auto;
            width: 26px;
            height: 26px;
            border-radius: var(--dashboard-button-radius);
            border: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: var(--theme-white);
            background: linear-gradient(135deg, var(--button-primary-soft-start), var(--button-primary-start));
            box-shadow: none;
            cursor: pointer;
          }
        }
        &.quota-card-muted {
          background: var(--theme-surface-muted);
          border-color: var(--theme-border-soft);
        }

        &.subscription-card-muted {
          .section-progress-track {
            background: var(--theme-border-soft);
          }

          .section-progress-fill {
            background: var(--quota-muted-fill);
          }
        }

        &.total-main-card {
          .usage-card-title {
            color: var(--quota-label-color);
            font-weight: $font-weight-semibold;
          }
        }

        &.expired-main-card {
          background: var(--theme-surface-muted);
          border-color: var(--quota-expired-border);

          .usage-card-title {
            color: var(--text-tertiary);
          }
        }

        /* 订阅信息卡片（总览卡中的 plan-summary） */
        .plan-summary-card {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 6px;
          overflow: visible;

          .expired-status-strip {
            border-radius: var(--dashboard-radius);
            padding: 9px 12px;
            font-size: $font-size-sm;
            font-weight: $font-weight-semibold;
            color: var(--plan-expired-strip-text);
            background: var(--plan-expired-strip-bg);
            border: 1px solid var(--plan-expired-strip-border);
          }

          .plan-summary-section {
            border: none;
            border-radius: var(--dashboard-radius);
            background: var(--theme-surface-soft);
            padding: 10px 12px;
            overflow: visible;
          }

          .plan-summary-section-traffic {
            display: grid;
            gap: 8px;

            .monthly-traffic-row {
              align-items: center;
              padding: 0;
            }

            .section-progress-track.in-plan-card {
              height: 10px;
            }

            .usage-summary-line.in-plan-card,
            .usage-reset-hint.in-plan-card {
              margin: 0;
            }
          }

          .plan-summary-section-meta {
            padding: 10px 12px;
          }

          .plan-status-hero {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .plan-name-main {
            font-size: $font-size-xl;
            line-height: 1.2;
            font-weight: $font-weight-bold;
            color: var(--heading-color);
          }

          .plan-expire-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            flex-wrap: wrap;
            font-size: $font-size-sm;
            color: var(--plan-meta-text);
          }

          .plan-summary-section-actions {
            border: none;
            padding-top: 12px;
            padding-bottom: 12px;
          }

          .plan-summary-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 2px 0;
          }

          .plan-summary-label {
            font-size: $font-size-sm;
            color: var(--text-tertiary);

            &.with-tooltip {
              display: inline-flex;
              align-items: center;
              gap: 6px;
            }
          }

          .plan-summary-value-wrap {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            justify-content: flex-end;
            flex-wrap: wrap;
          }

          .plan-summary-value {
            font-size: $font-size-md;
            color: var(--text-primary);
            font-weight: $font-weight-semibold;
            text-align: right;
            word-break: break-word;
          }

          .plan-status-tag {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            padding: 2px 8px;
            font-size: $font-size-sm;
            font-weight: $font-weight-semibold;

            &.is-active {
              color: var(--status-active-text);
              background: var(--status-active-bg);
            }

            &.is-expiring {
              color: var(--status-expiring-text);
              background: var(--status-expiring-bg);
            }

            &.is-expired {
              color: var(--status-expired-text);
              background: var(--status-expired-bg);
            }
          }

          .plan-summary-desc {
            margin: 4px 0 0;
            font-size: $font-size-sm;
            color: var(--text-on-dark-primary);
          }


          .plan-summary-actions {
            display: flex;
            gap: 10px;
            margin-top: 0;


            .plan-action-btn {
              flex: 1;
              border-radius: var(--dashboard-button-radius);
              padding: 10px 14px;
              font-size: $font-size-sm;
              font-weight: $font-weight-semibold;
              letter-spacing: 0.2px;

              @media (max-width: 576px) {
                padding: 9px 10px;
                font-size: $font-size-sm;
              }

              .plan-action-content {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                width: 100%;
              }

              .plan-action-icon {
                flex-shrink: 0;
              }
            }
          }

          .plan-action-helper-text {
            margin-top: 10px;
            font-size: $font-size-sm;
            color: var(--text-tertiary);
            text-align: center;
          }

          .switch {
            position: relative;
            display: inline-block;
            width: 46px;
            height: 24px;
            flex-shrink: 0;

            &.disabled {
              opacity: 0.7;
              cursor: not-allowed;
            }

            input {
              opacity: 0;
              width: 0;
              height: 0;

              &:disabled + .slider {
                cursor: not-allowed;
              }
            }

            .slider {
              position: absolute;
              cursor: pointer;
              inset: 0;
              background-color: var(--surface-subtle);
              border: 1px solid var(--border-color);
              transition: 0.4s;

              &.loading {
                overflow: hidden;

                &::before {
                  animation: pulse 1.5s infinite;
                }

                &::after {
                  content: '';
                  position: absolute;
                  width: 100%;
                  height: 100%;
                  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
                  animation: sweep 1.5s infinite;
                }
              }

              &::before {
                position: absolute;
                content: '';
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: 0.4s;
                z-index: 1;
              }

              &.round {
                border-radius: 34px;

                &::before {
                  border-radius: 50%;
                }
              }
            }

            input:checked + .slider {
              background: linear-gradient(135deg, var(--button-primary-start), var(--button-primary-end));
              border-color: transparent;
            }

            input:checked + .slider::before {
              transform: translateX(22px);
            }
          }
        }

        .usage-percent {
          writing-mode: horizontal-tb;
          text-orientation: mixed;
          font-size: var(--dashboard-value-size);
          line-height: 1;
          font-weight: $font-weight-bold;
          color: var(--text-primary);

          &.compact {
            font-size: $font-size-xl;
          }
        }

        .usage-percent-label {
          font-size: var(--dashboard-kpi-size);
          color: var(--dashboard-subtitle-color);
          font-weight: $font-weight-medium;
        }

        .section-progress-track {
          width: 100%;
          height: 14px;
          background: var(--theme-border-soft);
          border-radius: 999px;
          overflow: hidden;
        }

        .section-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--quota-progress-start), var(--quota-progress-end));
          border-radius: inherit;
          transition: width 0.35s ease;
        }

      &.quota-traffic-card {
        .usage-percent {
          font-size: $font-size-xl;

          &.compact {
            font-size: $font-size-xl;
          }
        }
      }

      &.traffic-board-subscription,
      &.traffic-board-package {
        background: var(--saas-card-bg);
      }

      &.traffic-board-subscription {
        background: var(--saas-card-bg);
        border: 1px solid var(--dashboard-border-color);
        box-shadow: none;

        .usage-card-title,
        .usage-percent,
        .usage-summary-line,
        .usage-reset-hint,
        .usage-kpi-value,
        .usage-kpi-label {
          color: var(--text-primary);
        }

        .usage-kpi {
          background: var(--theme-surface-soft);
        }

        .section-progress-track {
          background: var(--theme-border-soft);
        }
      }

      &.traffic-board-package {
        min-height: auto;
        height: auto;
        z-index: 8;
        background: var(--saas-card-bg);
      }

      &.traffic-board-total {
        background: var(--saas-card-bg);
        border: 1px solid var(--dashboard-border-color);
        box-shadow: none;

        .usage-card-title {
          color: var(--text-primary);
        }
      }

      &.traffic-board-total {
        .plan-summary-card {
          .plan-summary-section-meta {
            background: linear-gradient(135deg, #2259aa 0%, #5a39d8 52%, #ea1d2c 100%);
            border: 1px solid rgba(255, 255, 255, 0.2);

            .plan-name-main {
              color: var(--text-on-dark-primary);
            }

            .plan-expire-meta {
              color: var(--text-on-dark-secondary);
            }
          }
        }
      }

        /* 仅订阅流量卡片使用进度条与用量明细；流量包卡片不包含进度条 */
        &.traffic-board-subscription {
          .usage-kpis {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .usage-summary-line {
            grid-column: 1 / -1;
            font-size: $font-size-sm;
            font-weight: $font-weight-semibold;
            color: var(--neutral-strong);
          }

          .usage-kpi {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 8px;
            border-radius: var(--dashboard-radius);
            background: var(--theme-surface-soft);
          }

          .usage-kpi-label {
            writing-mode: horizontal-tb;
            text-orientation: mixed;
            font-size: $font-size-sm;
            color: var(--dashboard-subtitle-color);
            line-height: 1;
          }

          .usage-kpi-value {
            writing-mode: horizontal-tb;
            text-orientation: mixed;
            font-size: $font-size-md;
            color: var(--quota-value-color);
            font-weight: $font-weight-semibold;
            line-height: 1.2;
          }

          .usage-reset-hint {
            width: 100%;
            font-size: $font-size-sm;
            color: var(--text-tertiary);
          }

          @media (max-width: 576px) {
            .usage-kpis {
              grid-template-columns: 1fr;
            }
          }
        }
      }

      @media (min-width: 1200px) {
        &.today-traffic-card {
          grid-column: 2;
          grid-row: 1;

          .today-traffic-total-main {
            .usage-percent {
              &.compact {
                font-size: $font-size-xl;
              }
            }

            .usage-percent-label {
              font-size: $font-size-sm;
            }
          }
        }

        &.traffic-board-card.total-main-card {
          grid-column: 1;
          grid-row: 1 / span 2;
          min-height: 100%;
        }

        &.traffic-board-card:not(.total-main-card) {
          grid-column: 2;
          min-height: 152px;
          padding: var(--dashboard-card-padding);
          gap: 8px;

          &.traffic-board-package {
            grid-row: 2;
            min-height: auto;
            height: auto;
          }

          &.traffic-board-subscription {
            grid-column: 1 / -1;
            grid-row: 3;
          }

          .usage-percent {
            font-size: $font-size-xl;

            &.compact {
              font-size: $font-size-xl;
            }
          }

          .usage-percent-label {
            font-size: $font-size-sm;
          }

          &.traffic-board-subscription {
            .section-progress-track {
              height: 8px;
            }

            .usage-kpis {
              display: flex;
              gap: 16px;
            }

            .usage-kpi {
              flex: 1;
              background: rgba(241, 245, 249, 0.9);
            }

            .usage-kpi-label {
              font-size: $font-size-sm;
            }

            .usage-kpi-value {
              font-size: $font-size-md;
            }

            .usage-reset-hint {
              display: none;
            }

            .usage-summary-line,
            .usage-reset-hint {
              &.persist-visible {
                display: block;
              }
            }
          }
        }
      }

      &:hover {
        border-color: rgba(148, 163, 184, 0.3);
        box-shadow: none;
      }
    }
  }

  /* 概览核心卡片统一外观：今日流量 / 流量额度包 */
  .overview-card,
  .overview-card--today-traffic,
  .overview-card--traffic-quota {
    border-radius: var(--dashboard-radius);
    background: var(--saas-card-bg);
    box-shadow: none;
    border: 1px solid var(--dashboard-border-color);
  }

  .stats-grid .stats-card.overview-card,
  .stats-grid .stats-card.overview-card--today-traffic,
  .stats-grid .stats-card.overview-card--traffic-quota {
    padding: var(--dashboard-card-padding);
  }

  .stats-grid .stats-card.traffic-board-card,
  .stats-grid .stats-card.today-traffic-card,
  .dashboard-card.usage-trend-card {
    background: var(--saas-card-bg);
    border: 1px solid var(--dashboard-border-color);
    border-radius: var(--dashboard-radius);
    box-shadow: none;
  }

  /* 概览卡片左上角标题统一样式 */
  .overview-card--today-traffic .usage-card-title,
  .overview-card--traffic-quota .usage-card-title,
  .usage-trend-card .card-title.usage-card-title {
    margin: 0;
    font-size: var(--dashboard-title-size);
    line-height: 1.3;
    font-weight: $font-weight-semibold;
    letter-spacing: 0.02em;
    color: var(--text-primary);
  }


  .stats-grid .stats-card.today-traffic-card {
    color: var(--text-primary);
    background: var(--saas-card-bg);
    z-index: 2;
    align-items: flex-start;
    flex-direction: column;
    justify-content: flex-start;
    gap: 10px;

    .today-card-title {
      margin-bottom: 2px;
    }

    .today-traffic-total-main {
      display: inline-flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 8px;

      .usage-percent {
        line-height: 1;
        font-weight: $font-weight-bold;
        color: var(--text-primary);
        font-size: $font-size-xl;

        &.compact {
          font-size: $font-size-xl;
        }
      }

      .usage-percent-label {
        font-size: var(--dashboard-kpi-size);
        color: var(--quota-label-color);
        font-weight: $font-weight-medium;
      }
    }

    .today-traffic-breakdown {
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      font-size: $font-size-sm;
      line-height: 1.45;
      color: var(--text-tertiary);

      .traffic-up,
      .traffic-down {
        color: var(--text-tertiary);
        font-weight: $font-weight-semibold;
      }
    }
  }

  /* IP 位置卡片（横幅） */
  .ip-location-summary-card {
    .ip-location-summary-body {
      padding: 10px 12px;
    }

    .ip-location-state {
      color: var(--text-tertiary);
      font-size: $font-size-sm;

      &.error {
        color: var(--error-color);
      }
    }

    .ip-location-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      color: var(--text-primary);

      @media (max-width: 920px) {
        align-items: flex-start;
        flex-direction: column;
      }
    }

    .ip-banner-main {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .ip-main-line {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .ip-region-primary {
      font-size: $font-size-xl;
      line-height: 1.15;
      font-weight: $font-weight-bold;
      letter-spacing: -0.01em;
      color: var(--text-primary);

      @media (max-width: 680px) {
        font-size: $font-size-xl;
      }
    }

    .ip-sub-line {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .ip-refresh-btn {
      border-radius: 999px;
      padding: 4px 10px;
      font-size: $font-size-sm;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;

      &:disabled {
        opacity: 0.7;
      }

      .spinning {
        animation: spin 0.9s linear infinite;
      }
    }

    .ip-address-secondary {
      font-size: $font-size-sm;
      color: var(--text-tertiary);
      letter-spacing: 0.2px;
    }

    .region-code-badge {
      min-width: 40px;
      height: 22px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 8px;
      font-size: $font-size-sm;
      font-weight: $font-weight-bold;
      color: var(--theme-white);
      letter-spacing: 0.4px;
      background: linear-gradient(135deg, var(--neutral-strong), #1e293b);
      box-shadow: none;

      &.is-red { background: linear-gradient(135deg, #e11d48, #9f1239); }
      &.is-pink { background: linear-gradient(135deg, #be185d, #831843); }
      &.is-blue { background: linear-gradient(135deg, #1d4ed8, #1e3a8a); }
    }

    .ip-region {
      color: var(--text-tertiary);
      font-size: $font-size-sm;
    }
  }


  .info-tooltip {
    position: relative;
    z-index: 12;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    color: var(--text-quaternary);
    cursor: help;

    .info-tooltip-content {
      position: absolute;
      left: 50%;
      bottom: calc(100% + 8px);
      width: min(220px, calc(100vw - 32px));
      padding: 8px 10px;
      border-radius: 6px;
      background: rgba(15, 23, 42, 0.96);
      color: var(--text-on-dark-primary);
      font-size: $font-size-sm;
      line-height: 1.4;
      font-weight: $font-weight-medium;
      box-shadow: none;
      opacity: 0;
      visibility: hidden;
      transform: translate(-50%, 4px);
      transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
      transition-delay: 0s;
      pointer-events: none;
      z-index: 260;
    }

    .info-tooltip-content::after {
      content: '';
      position: absolute;
      left: 50%;
      top: 100%;
      transform: translateX(-50%);
      border-width: 5px;
      border-style: solid;
      border-color: rgba(15, 23, 42, 0.96) transparent transparent transparent;
    }

    &:hover .info-tooltip-content,
    &:focus-visible .info-tooltip-content {
      opacity: 1;
      visibility: visible;
      transform: translate(-50%, 0);
      transition-delay: 0.2s;
    }

    &:hover,
    &:focus-visible {
      z-index: 14;
    }
  }

  /* 流量趋势图卡片 */
  .usage-trend-card {
    .card-body {
      padding-top: 6px;
    }

    .trend-state {
      min-height: 116px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-tertiary);
      font-size: $font-size-md;
    }

    .usage-trend-chart {
      width: 100%;
      height: 208px;
    }
  }
  /* 待支付横幅卡片 */
  .pending-order-banner {
    margin-bottom: var(--dashboard-section-margin);
    min-height: 44px;
    max-height: 48px;
    padding: 6px 12px;
    border-radius: var(--dashboard-radius);
    border: 1px solid rgba(var(--warning-color-rgb), 0.4);
    background: var(--warning-background);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;

    &:hover {
      background: color-mix(in srgb, var(--warning-background) 88%, var(--theme-white) 12%);
      border-color: rgba(var(--warning-color-rgb), 0.55);
      transform: none;
    }

    .banner-main {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      color: var(--warning-color);
      font-size: $font-size-sm;
      line-height: 1.35;
      font-weight: $font-weight-medium;
    }

    .banner-icon {
      flex-shrink: 0;
      color: var(--warning-color);
    }

    .banner-action {
      border-radius: 8px;
      height: 30px;
      padding: 0 12px;
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
      flex-shrink: 0;
    }
  }

}



@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}




@media (max-width: 1200px) {
  .dashboard-container {
    padding: 0;
    padding-bottom: 74px;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding-bottom: 74px;
    --dashboard-card-padding: 12px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;

    .stats-card.traffic-board-total {
      order: 1;
      grid-column: 1 / -1;
    }

    .stats-card.today-traffic-card {
      order: 2;
      grid-column: 1 / -1;

      .today-traffic-total-main {
        .usage-percent {
          &.compact {
            font-size: $font-size-xl;
          }
        }
      }
    }

    .stats-card.traffic-board-package {
      order: 3;
    }

    .stats-card.traffic-board-subscription {
      order: 4;
    }

    .stats-card.quota-traffic-card {
      grid-column: 1 / -1;
      min-height: auto;
      height: auto;
      padding: 10px;
      gap: 5px;

      .usage-percent {
        font-size: $font-size-xl;

        &.compact {
          font-size: $font-size-xl;
        }
      }

      .usage-percent-label {
        font-size: $font-size-sm;
      }

      .usage-kpis {
        gap: 6px;
      }

      .usage-kpi {
        padding: 6px;
      }

    }
  }

}

@media (min-width: 769px) and (max-width: 1199px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}


@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.skeleton-card {
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0,
            rgba(255, 255, 255, 0.2) 20%,
            rgba(255, 255, 255, 0.5) 60%,
            rgba(255, 255, 255, 0) 100%
    );
    animation: shimmer 2s infinite;
    z-index: 1;
  }
}


.skeleton-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--dashboard-radius);
  background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
  margin-right: 16px;
  flex-shrink: 0;
  position: relative;
}

.skeleton-content {
  flex: 1;
  position: relative;
}

.skeleton-row-sm {
  height: 16px;
  background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
  border-radius: 4px;
  width: 80%;
  margin-bottom: 10px;
  position: relative;
}

.skeleton-row-xs {
  height: 12px;
  background-color: var(--skeleton-bg, rgba(0, 0, 0, 0.05));
  border-radius: 4px;
  width: 50%;
  position: relative;
}


.stats-card.skeleton-card {
  display: flex;
  align-items: center;
  padding: 16px;
  animation: none;
  background-color: var(--card-bg-color);
  box-shadow: none;
  border: 1px solid var(--border-color);
  position: relative;
}

.stats-card.skeleton-card::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0,
          rgba(255, 255, 255, 0.2) 20%,
          rgba(255, 255, 255, 0.5) 60%,
          rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer 2s infinite;
  z-index: 1;
}


}


.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}


</style>

<!-- 全局样式，不受scoped限制 -->
<style lang="scss">
@use "@/assets/styles/base/variables.scss" as *;
@use '@/assets/styles/no-plan-card' as *;

/* 统计卡片状态样式（全局） */
.dashboard-container .stats-card {
  &.warning-card,
  &.danger-card {
    border-color: rgba(var(--stats-alert-rgb), 0.42);
    box-shadow: none;

    .stats-icon {
      background-color: rgba(var(--stats-alert-rgb), 0.1);
      color: var(--stats-level-color);
    }

    .stats-value {
      color: var(--stats-level-color);
    }
  }

  &.warning-card {
    --stats-alert-rgb: var(--warning-color-rgb);
    --stats-level-color: var(--warning-color);
  }

  &.danger-card {
    --stats-alert-rgb: var(--error-color-rgb);
    --stats-level-color: var(--error-color);
  }

  &.balance-card {
    .stats-value {
      color: var(--theme-color);
    }

    &.clickable {
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;

      &:hover {
        background-color: rgba(var(--theme-color-rgb), 0.08);
        transform: translateY(-3px);
      }
    }
  }
}

/* 流量包卡片弹窗（全局） */
.traffic-package-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.7);
}

.traffic-package-modal-container {
  width: min(100%, 420px);
  max-height: calc(100vh - 32px);
  border-radius: var(--dashboard-radius);
  overflow: hidden;
  box-shadow: none;
}

.traffic-package-modal-card-global {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 32px);
  overflow: hidden;
  background-color: var(--card-background);
  border: 1px solid rgba(var(--theme-color-rgb), 0.15);
  border-radius: 16px;
  box-shadow: none;

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
    background-color: rgba(var(--theme-color-rgb), 0.03);

    h3 {
      margin: 0;
      color: var(--text-primary);
      font-size: $font-size-xl;
      font-weight: $font-weight-semibold;
    }

    .close-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: var(--text-tertiary);
      cursor: pointer;

      &:hover {
        color: var(--text-primary);
      }
    }
  }

  .modal-body {
    display: block;
    padding: 20px;
    overflow-y: auto;
  }

  .modal-footer {
    padding: 15px 20px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    gap: 10px;

    .btn {
      min-width: 88px;
    }
  }

  .traffic-package-desc {
    margin: 0 0 14px;
    color: var(--text-tertiary);
    font-size: $font-size-md;
    line-height: 1.5;
  }

  .traffic-package-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .traffic-package-item {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    border: 1px solid var(--border-color);
    border-radius: var(--dashboard-radius);
    background: linear-gradient(
      180deg,
      rgba(var(--theme-color-rgb), 0.06) 0%,
      rgba(var(--theme-color-rgb), 0.02) 100%
    );
  }

  .item-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;

    strong {
      color: var(--text-primary);
      font-size: $font-size-md;
      font-weight: $font-weight-semibold;
    }
  }

  .item-price {
    color: var(--theme-color);
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
  }

  .item-content {
    min-height: 32px;
    color: var(--text-tertiary);
    font-size: $font-size-sm;
    line-height: 1.45;
  }

}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.85;
  }
  50% {
    transform: scale(0.92);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.85;
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

</style>
