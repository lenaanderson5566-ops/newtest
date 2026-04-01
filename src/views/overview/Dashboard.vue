<template>
  <div class="dashboard-container page-shell" :class="{ 'is-no-plan': !hasPlan }">
    <div class="dashboard-inner page-inner page-stack">
      <div class="overview-grid">
      <!-- 通知区域 -->
      <!-- 待支付订单提醒条 -->
      <div
        v-if="hasPendingItems"
        class="pending-order-banner delay-01"
        :class="{'card-animate': !loading.userStats}"
        @click="goToLatestPendingOrderPayment"
      >
        <div class="banner-main">
          <IconAlertTriangle :size="16" class="banner-icon" />
          <span class="banner-text text-ellipsis">{{ $t('dashboard.pendingOrderBanner', { count: userStats.pendingOrders }) }}</span>
        </div>
        <button class="banner-action btn btn-primary" @click.stop="goToLatestPendingOrderPayment">{{ $t('dashboard.payNow') }}</button>
      </div>

      <div
        v-if="!loading.userInfo"
        class="account-welcome-banner"
        :class="`is-${accountStatus}`"
      >
        <h3 class="welcome-title">{{ welcomeHeadline }}</h3>
      </div>

      <div class="stats-grid" :class="{ 'no-plan-grid': !hasPlan }">
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
          <section
            class="dashboard-card stats-card no-plan-flow-card delay-05"
            :class="{ 'card-animate': !loading.userStats }"
          >
            <div class="no-plan-flow-layout">
              <section class="no-plan-hero">
                <div class="hero-copy">
                  <div class="hero-status">
                    <span class="no-plan-badge">{{ noPlanHeroBadge }}</span>
                  </div>
                  <h3 class="no-plan-title">{{ noPlanHeroTitle }}</h3>
                  <div class="hero-actions">
                    <button class="hero-btn primary" @click="handleNoPlanPrimaryAction">{{ noPlanPrimaryActionText }}</button>
                    <button class="hero-btn secondary" @click="goToDocs">查看教程</button>
                  </div>
                </div>
                <div class="hero-visual" aria-hidden="true">
                  <div class="line-device laptop"></div>
                  <div class="line-device tablet"></div>
                  <div class="line-device phone"></div>
                </div>
              </section>

              <div class="no-plan-steps">
                <button class="no-plan-step no-plan-step-primary" @click="goToShop">
                  <span class="step-title">1. {{ $t('dashboard.purchasePlan') }}</span>
                  <span class="step-desc">{{ $t('quickStartPage.status.newDesc') }}</span>
                </button>

                <button class="no-plan-step no-plan-step-secondary" @click="goToDocs">
                  <span class="step-title">2. {{ $t('quickStartPage.step2Title') }}</span>
                  <span class="step-desc">{{ $t('quickStartPage.step2Tip') }}</span>
                  <div class="platform-icons">
                    <IconBrandWindows :size="18" />
                    <IconBrandApple :size="18" />
                    <IconDeviceDesktop :size="18" />
                    <IconBrandAndroid :size="18" />
                  </div>
                </button>

                <div class="no-plan-step no-plan-step-success">
                  <span class="step-title">3. {{ $t('quickStartPage.step3Title') }}</span>
                  <span class="step-desc">{{ $t('quickStartPage.connectHint') }}</span>
                </div>
              </div>
            </div>
          </section>

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
                    <span class="plan-expire-text">
                      <span>{{ planExpireMetaText }}</span>
                      <span v-if="shouldShowExpireSuffix" class="expire-suffix">{{ $t('dashboard.expireSuffix') }}</span>
                    </span>
                    <span class="plan-status-tag" :class="`is-${subscriptionStatus}`">{{ subscriptionStatusLabel }}</span>
                  </div>
                </div>
              </div>

              <div class="plan-summary-section plan-summary-section-traffic">
                <div class="plan-summary-row monthly-traffic-row">
                  <span class="plan-summary-label">{{ $t('dashboard.subscriptionMonthlyTraffic') }}</span>
                  <strong class="plan-summary-value">{{ formatPackageRemaining(applyPlanStatus(subscriptionTrafficSummary.remaining)) }}</strong>
                </div>
                <div class="section-progress-track in-plan-card">
                  <div class="section-progress-fill" :style="{ width: `${applyPlanStatus(subscriptionTrafficSummary.remainingPercentage)}%` }"></div>
                </div>
                <div class="usage-summary-line in-plan-card">
                  {{ $t('dashboard.used') }} {{ formatPackageRemaining(applyPlanStatus(subscriptionTrafficSummary.used)) }} / {{ formatPackageRemaining(subscriptionTrafficSummary.total) }}
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
                  <span class="usage-percent compact">{{ formatPackageRemaining(applyPlanStatus(card.remaining)) }}</span>
                  <span class="usage-percent-label">{{ $t('dashboard.remaining') }}</span>
                </template>
                <template v-else>
                  <span class="usage-percent">{{ card.remainingPercentage }}%</span>
                  <span class="usage-percent-label">{{ $t('dashboard.remaining') }}</span>
                </template>
              </template>
            </div>
            <div v-if="card.key !== 'package' && card.key !== 'total'" class="section-progress-track">
              <div class="section-progress-fill" :style="{ width: `${card.key === 'subscription' ? applyPlanStatus(card.remainingPercentage) : card.remainingPercentage}%` }"></div>
            </div>
            <div class="usage-kpis" v-if="card.key !== 'package' && card.key !== 'total'">
              <template v-if="card.key === 'subscription'">
                <div class="usage-summary-line persist-visible">
                  {{ $t('dashboard.used') }} {{ formatPackageRemaining(applyPlanStatus(card.used)) }} / {{ formatPackageRemaining(card.total) }}
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
          <div v-else-if="!trafficTrendData.length" class="trend-state trend-state-illustration">
            <div class="trend-empty-block">
              <img :src="noTrafficDataImage" alt="no-traffic-data" class="trend-empty-image" />
              <div class="trend-empty-content">
                <div class="trend-empty-title">{{ $t('trafficLog.emptyTitle') }}</div>
                <div class="trend-empty-desc">{{ $t('trafficLog.emptyDesc') }}</div>
                <button class="trend-empty-action btn btn-primary" @click="goToQuickStart">
                  {{ $t('dashboard.goToQuickStart') }}
                </button>
              </div>
            </div>
          </div>
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
  IconRouter,
  IconSend,
  IconShare,
  IconShoppingBag,
  IconTransferVertical,
  IconUserPlus,
  IconWallet,
  IconWaveSawTool,
  IconX,
  IconCalendarPlus,
  IconPlus
} from '@tabler/icons-vue';
import CommonDialog from '@/components/popup/CommonDialog.vue';
import {getSubscribe, getUserConfig, getUserInfo, getUserStats, setNextPeriod} from '@/api/overview/dashboard';
import { getTrafficLog } from '@/api/account/trafficLog';
import { fetchOrderList } from '@/api/account/orderlist';
import * as echarts from 'echarts';
import {useToast} from '@/composables/useToast';
import {fetchPlans} from '@/api/account/shop';
import {cleanupResources, createTimer} from '@/utils/componentLifecycle';
import { formatDate } from '@/utils/formatters';
import { SUBSCRIPTION_STATUS, resolveSubscriptionStatus } from '@/utils/subscriptionStatus';

const noTrafficDataImage = new URL('../../assets/images/dashboard/no-traffic-data.svg', import.meta.url).href;

export default {
  name: 'UserDashboard',
  components: {
    IconBox,
    IconSend,
    IconCalendar,
    IconUserPlus,
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
    const accountStatus = ref(SUBSCRIPTION_STATUS.NEW);

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

    const goToDocs = () => {
      router.push('/docs');
    };

    const goToQuickStart = () => {
      router.push('/quick-start');
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

          accountStatus.value = resolveSubscriptionStatus(info);
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
        accountStatus.value = SUBSCRIPTION_STATUS.NEW;
      } finally {
        loading.userInfo = false;
      }
    };
    const isSubscriptionActive = computed(() => accountStatus.value === SUBSCRIPTION_STATUS.ACTIVE);
    const isSubscriptionExpired = computed(() => accountStatus.value === SUBSCRIPTION_STATUS.EXPIRED);
    const isSubscriptionBanned = computed(() => accountStatus.value === SUBSCRIPTION_STATUS.BANNED);
    const isPlanExpired = computed(() => isSubscriptionExpired.value || isSubscriptionBanned.value);

    const emailPrefix = computed(() => {
      const email = String(userStats.userEmail || '').trim();
      if (!email) return '用户';
      const prefix = email.split('@')[0]?.trim();
      return prefix ? prefix.toUpperCase() : '用户';
    });

    const welcomeHeadline = computed(() => {
      if (accountStatus.value === SUBSCRIPTION_STATUS.NEW) {
        return `你好，${emailPrefix.value}，欢迎使用`;
      }
      return `你好，${emailPrefix.value}，欢迎回来`;
    });

    const subscriptionStatus = computed(() => (
      isSubscriptionActive.value ? 'active' : 'expired'
    ));

    const subscriptionStatusLabel = computed(() => (
      isSubscriptionActive.value
        ? t('dashboard.subscriptionStatus.active')
        : t('dashboard.subscriptionStatus.expired')
    ));

    const planExpireMetaText = computed(() => {
      if (userPlan.value.isExpireDatePermanent) {
        return t('dashboard.permanent');
      }
      return userPlan.value.expireDate || '-';
    });
    const shouldShowExpireSuffix = computed(() => !userPlan.value.isExpireDatePermanent);

    const primaryPlanActionLabel = computed(() => {
      if (isPlanExpired.value) return t('dashboard.planAction.restoreNow');
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
    const applyPlanStatus = (value) => (isPlanExpired.value ? 0 : value);

    const handlePrimaryPlanAction = () => {
      if (isSubscriptionActive.value) {
        goToShop();
        return;
      }
      renewPlan();
    };

    const handleSecondaryPlanAction = () => {
      if (isSubscriptionActive.value) {
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

    const noPlanHeroBadge = computed(() => (hasPendingItems.value ? '待完成支付' : '未开通服务'));
    const noPlanHeroTitle = computed(() => (hasPendingItems.value ? '完成支付后即可激活服务' : '先选择订阅并完成支付，即可开始使用'));
    const noPlanPrimaryActionText = computed(() => (hasPendingItems.value ? '继续支付' : '立即下单'));

    const handleNoPlanPrimaryAction = () => {
      if (hasPendingItems.value) {
        goToLatestPendingOrderPayment();
        return;
      }
      goToShop();
    };

    const goToOrders = () => {
      router.push('/orders');
    };

    const goToLatestPendingOrderPayment = async () => {
      try {
        const response = await fetchOrderList();
        const orders = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : [];

        const latestPendingOrder = orders
          .filter((order) => Number(order?.status) === 0 && order?.trade_no)
          .sort((a, b) => Number(b?.created_at || 0) - Number(a?.created_at || 0))[0];

        if (latestPendingOrder?.trade_no) {
          router.push({
            path: '/payment',
            query: { trade_no: latestPendingOrder.trade_no, from: 'dashboard' }
          });
          return;
        }
      } catch (error) {
        console.warn('Failed to fetch pending orders, fallback to order list page:', error);
      }

      goToOrders();
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
        grid: { left: '4%', right: '2%', bottom: '2px', top: '30px', containLabel: true },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: trafficTrendData.value.map((i) => i.date),
          axisLabel: {
            rotate: 20,
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
      router.push('/wallet/deposit');
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
      goToDocs,
      goToQuickStart,
      hasPendingItems,
      noPlanHeroBadge,
      noPlanHeroTitle,
      noPlanPrimaryActionText,
      handleNoPlanPrimaryAction,
      goToOrders,
      goToLatestPendingOrderPayment,
      router,
      formatTraffic,
      formatPackageRemaining,
      handlePopupClose,
      handlePopupConfirm,
      showPopup,
      isPlanExpired,
      subscriptionStatus,
      subscriptionStatusLabel,
      primaryPlanActionLabel,
      planExpireMetaText,
      shouldShowExpireSuffix,
      secondaryPlanActionLabel,
      subscriptionTrafficSummary,
      primaryActionClass,
      secondaryActionClass,
      isManageAction,
      isRenewAction,
      isReselectAction,
      applyPlanStatus,
      handlePrimaryPlanAction,
      handleSecondaryPlanAction,
      accountStatus,
      welcomeHeadline,
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
      noTrafficDataImage,
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
@use "sass:map";
@use "@/assets/styles/base/variables.scss" as *;
@use "@/assets/styles/base/typography.scss" as *;


$space-2: map.get($spacers, 2);

.dashboard-container {
  display: flex;
  justify-content: center;
  --dashboard-card-padding: 8px;
  --dashboard-radius: #{$border-radius-sm};
  --dashboard-pill-radius: 999px;
  --dashboard-button-radius: 12px;
  --dashboard-shadow-compact: none;
  --dashboard-border-color: var(--card-border-subtle);
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
  --theme-border-soft: var(--card-border-soft);
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
  --status-expired-text: #dc2626;
  --status-expired-bg: rgba(220, 38, 38, 0.1);

  &.is-no-plan {
    .dashboard-inner {
      gap: 0;
    }

    .overview-grid {
      margin-bottom: 0;
    }
  }

  .dashboard-inner {
    .overview-grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: var(--dashboard-gap-compact);

    > .pending-order-banner {
      grid-column: 1 / -1;
      margin-bottom: 0;
    }

    > .account-welcome-banner,
    > .stats-grid,
    > .usage-trend-card {
      grid-column: 1 / -1;
    }

  }

  .dashboard-card {
    background-color: var(--saas-card-bg);
    padding: var(--dashboard-card-padding);
    border: 1px solid var(--dashboard-border-color);
    border-radius: var(--dashboard-radius);
    transition: box-shadow 0.2s ease;

    &:hover {
      transform: none;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: #{$space-2};

      .card-title {
        @extend %typo-card-title;
        margin: 0;
      }

      .card-actions {
        display: flex;
        gap: #{$space-2};
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--dashboard-gap-compact);
    grid-auto-flow: row dense;
    margin-bottom: var(--dashboard-section-margin);

    &.no-plan-grid {
      margin-bottom: 0;

      > .no-plan-flow-card {
        display: block;
        align-items: initial;
        min-height: auto;
        height: auto;
      }

      @include up(md) {
        grid-template-rows: auto;
        align-items: start;
      }
    }

    > .stats-card.traffic-board-total {
      grid-column: 1 / -1;
    }

    > .stats-card.traffic-board-package {
      grid-column: 2 / 3;
      grid-row: 2 / 3;
    }

    > .stats-card.today-traffic-card {
      grid-column: 1 / 2;
      grid-row: 2 / 3;
    }

    @include up(md) {
      grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
      grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
      align-items: stretch;

      > .stats-card.traffic-board-total {
        grid-column: 1 / 2;
        grid-row: 1 / 3;
      }

      > .stats-card.traffic-board-package {
        grid-column: 2 / 3;
        grid-row: 2 / 3;
      }

      > .stats-card.today-traffic-card {
        grid-column: 2 / 3;
        grid-row: 1 / 2;
      }
    }

    > .stats-card {
      min-width: 0;
    }

    .stats-card {
      position: relative;
      z-index: 1;
      background-color: var(--saas-card-bg);
      border-radius: var(--dashboard-radius);
      display: flex;
      align-items: center;
      gap: #{$space-2};
      padding: var(--dashboard-card-padding);
      transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
      overflow: hidden;
      border: 1px solid var(--dashboard-border-color);

      /* 流量额度包卡片（订阅流量 / 叠加包 / 总览）样式 */
      &.traffic-board-card {
        width: 100%;
        min-height: clamp(156px, 16vw, 208px);
        overflow: visible;
        writing-mode: horizontal-tb;
        text-orientation: mixed;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        gap: #{$space-2};

        .stats-info {
          width: 100%;
        }

        .stats-value {
          font-size: $font-size-md;
          margin-bottom: 0;
        }

        .stats-label {
          font-size: $font-size-sm;
        }

        .usage-card-title {
          position: relative;
          z-index: 5;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          writing-mode: horizontal-tb;
          text-orientation: mixed;
          white-space: normal;
          @extend %typo-card-title;
          line-height: 1.35;
          min-height: 20px;
        }

        .usage-card-main {
          display: flex;
          align-items: baseline;
          gap: 8px;
          min-height: 42px;

          &.package-main {
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
            cursor: pointer;
          }
        }
        &.quota-card-muted {
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
          gap: #{$space-2};
          margin-top: 4px;
          overflow: visible;

          .expired-status-strip {
            border-radius: var(--dashboard-radius);
            padding: 8px 8px;
            font-size: $font-size-sm;
            font-weight: $font-weight-semibold;
            color: var(--plan-expired-strip-text);
            background: var(--plan-expired-strip-bg);
            border: 1px solid var(--plan-expired-strip-border);
          }

          .plan-summary-section {
            border: none;
            border-radius: var(--dashboard-radius);
            background: transparent;
            padding: 8px 8px;
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
            padding: 8px 8px;
          }

          .plan-status-hero {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 8px;
            position: relative;
            min-height: 64px;
            padding-right: 96px;
          }

          .plan-name-main {
            font-size: $font-size-2xl;
            line-height: 1.2;
            font-weight: $font-weight-bold;
            color: var(--heading-color);
          }

          .plan-expire-meta {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 8px;
            flex-wrap: wrap;
            font-size: $font-size-sm;
            color: var(--plan-meta-text);

            .plan-expire-text {
              display: inline-flex;
              align-items: center;
              gap: 4px;
            }

            .expire-suffix {
              color: var(--text-on-dark-secondary);
            }
          }

          .plan-summary-section-actions {
            border: none;
            padding-top: 8px;
            padding-bottom: 8px;
          }

          .plan-summary-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: #{$space-2};
            padding: 0 0;
          }

          .plan-summary-label {
            font-size: $font-size-sm;
            color: var(--text-tertiary);

            &.with-tooltip {
              display: inline-flex;
              align-items: center;
              gap: 4px;
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
            justify-content: center;
            border-radius: 999px;
            min-height: 30px;
            padding: 0 10px;
            line-height: 1;
            font-size: $font-size-md;
            font-weight: $font-weight-semibold;
            color: var(--text-on-dark-primary);
            border: 1px solid rgba(255, 255, 255, 0.26);
            background: rgba(255, 255, 255, 0.2);
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
          }

          .plan-summary-desc {
            margin: 4px 0 0;
            font-size: $font-size-sm;
            color: var(--text-on-dark-primary);
          }


          .plan-summary-actions {
            display: flex;
            gap: #{$space-2};
            margin-top: 0;


            .plan-action-btn {
              flex: 1;
              border-radius: var(--dashboard-button-radius);
              padding: 8px 16px;
              font-size: $font-size-sm;
              font-weight: $font-weight-semibold;
              letter-spacing: 0.2px;

              .plan-action-content {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                width: 100%;
              }

              .plan-action-icon {
                flex-shrink: 0;
              }

              &.btn-outline,
              &.btn-secondary {
                background: transparent;
              }
            }
          }

          .plan-action-helper-text {
            margin-top: 8px;
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
          @extend %typo-metric-md;
          writing-mode: horizontal-tb;
          text-orientation: mixed;
          line-height: 1;

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
          font-size: $font-size-2xl;

          &.compact {
            font-size: $font-size-2xl;
          }
        }
      }

      &.traffic-board-subscription {
        --traffic-card-bg: linear-gradient(135deg, rgba(148, 163, 184, 0.12) 0%, rgba(148, 163, 184, 0.24) 100%);
        border: 1px solid var(--dashboard-border-color);

        .usage-card-title,
        .usage-percent,
        .usage-summary-line,
        .usage-reset-hint,
        .usage-kpi-value,
        .usage-kpi-label {
          color: var(--text-primary);
        }

        .usage-kpi {
          background: transparent;
        }

        .section-progress-track {
          background: var(--theme-border-soft);
        }
      }

      &.traffic-board-package {
        --traffic-card-bg: linear-gradient(315deg, rgba(234, 29, 44, 0.16) 0%, rgba(234, 29, 44, 0.08) 38%, #ffffff 100%);
        min-height: auto;
        height: auto;
        z-index: 8;
      }

      &.traffic-board-total {
        --traffic-card-bg: linear-gradient(135deg, rgba(148, 163, 184, 0.1) 0%, rgba(148, 163, 184, 0.2) 100%);
        border: 1px solid var(--dashboard-border-color);

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
            background: transparent;
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

        }
      }

      &:hover {
        border-color: var(--card-border-hover);
      }
    }
  }

  /* 概览核心卡片统一外观：今日流量 / 流量额度包 */
  .overview-card,
  .overview-card--today-traffic,
  .overview-card--traffic-quota {
    border-radius: var(--dashboard-radius);
    background: var(--saas-card-bg);
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
    background: var(--traffic-card-bg, var(--saas-card-bg));
    border: 1px solid transparent;
    border-radius: var(--dashboard-radius);
  }

  /* 概览卡片左上角标题统一样式（今日流量 / 订阅流量 / 流量额度包 / 用量记录） */
  .stats-grid .stats-card.today-traffic-card .usage-card-title,
  .usage-trend-card .card-title.usage-card-title {
    margin: 0;
    @extend %typo-card-title;
    line-height: 1.3;
    letter-spacing: 0.02em;
  }


  .stats-grid .stats-card.today-traffic-card {
    color: var(--text-primary);
    background: linear-gradient(315deg, rgba(34, 89, 170, 0.14) 0%, rgba(90, 57, 216, 0.08) 42%, #ffffff 100%);
    min-width: 0;
    z-index: 2;
    align-items: flex-start;
    flex-direction: column;
    justify-content: flex-start;
    gap: #{$space-2};

    .today-card-title {
      margin-bottom: 0;
    }

    .today-traffic-total-main {
      display: inline-flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 8px;

      .usage-percent {
        @extend %typo-metric-md;
        line-height: 1;

        &.compact {
          font-size: $font-size-2xl;
        }
      }

      .usage-percent-label {
        @extend %typo-label-text;
      }
    }

    .today-traffic-breakdown {
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      gap: #{$space-2};
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
      padding: 8px 8px;
      border-radius: 6px;
      background: rgba(15, 23, 42, 0.96);
      color: var(--text-on-dark-primary);
      font-size: $font-size-sm;
      line-height: 1.4;
      font-weight: $font-weight-medium;
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
    padding: 8px;

    .card-header {
      margin-bottom: 4px;
    }

    .card-body {
      padding: 0;
    }

    .trend-state {
      min-height: 90px;
      display: flex;
      align-items: center;
      justify-content: center;
      @extend %typo-body-text;
    }

    .trend-state-illustration {
      padding: 10px;
    }

    .trend-empty-block {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 14px 18px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 14px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.92));
    }

    .trend-empty-content {
      flex: 1;
      align-items: center;
      justify-content: center;
      display: flex;
      flex-direction: column;
      text-align: left;
      gap: 12px;
    }

    .trend-empty-image {
      width: 280px;
      flex: 0 0 auto;
      max-width: 100%;
      height: auto;
      opacity: 0.96;
      pointer-events: none;
      user-select: none;
    }

    .trend-empty-title {
      @extend %typo-item-title;
      color: var(--text-primary);
      font-size: $font-size-xl;
    }

    .trend-empty-desc {
      @extend %typo-meta-text;
      color: var(--text-tertiary);
      max-width: 420px;
    }

    .trend-empty-action {
      min-width: 180px;
      padding-inline: 18px;
    }

    .usage-trend-chart {
      width: 100%;
      height: 156px;
    }
  }
  /* 待支付横幅卡片 */
  .account-welcome-banner {
    margin-bottom: 4px;
    padding: 14px 16px;
    border-radius: var(--dashboard-radius);
    border: 1px solid var(--theme-border-color);
    background: var(--theme-surface-elevated);

    &.is-active {
      border-color: rgba(var(--success-color-rgb), 0.35);
      background: color-mix(in srgb, var(--success-background) 24%, var(--theme-surface-elevated) 76%);
    }

    &.is-expired {
      border-color: rgba(var(--warning-color-rgb), 0.4);
      background: color-mix(in srgb, var(--warning-background) 28%, var(--theme-surface-elevated) 72%);
    }

    &.is-banned {
      border-color: rgba(var(--danger-color-rgb), 0.4);
      background: color-mix(in srgb, rgba(var(--danger-color-rgb), 0.12) 46%, var(--theme-surface-elevated) 54%);
    }

    .welcome-title {
      margin: 0;
      font-size: $font-size-md;
      font-weight: $font-weight-semibold;
      color: var(--theme-text-primary);
    }

  }

  .pending-order-banner {
    margin-bottom: var(--dashboard-section-margin);
    min-height: 44px;
    max-height: 48px;
    padding: 4px 8px;
    border-radius: var(--dashboard-radius);
    border: 1px solid rgba(var(--warning-color-rgb), 0.4);
    background: var(--warning-background);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: #{$space-2};
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
      padding: 0 8px;
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




@include down(xl) {
  .dashboard-container {
    padding: 0;
  }
}

@include down(md) {
  .dashboard-container {
    --dashboard-card-padding: 8px;
  }

  .stats-grid {
    .stats-card.today-traffic-card {
      .today-traffic-total-main {
        .usage-percent {
          &.compact {
            font-size: $font-size-2xl;
          }
        }
      }
    }

    .stats-card.quota-traffic-card {
      min-width: 0;
      min-height: auto;
      height: auto;
      padding: 8px;
      gap: 4px;

      .usage-percent {
        font-size: $font-size-2xl;

        &.compact {
          font-size: $font-size-2xl;
        }
      }

      .usage-percent-label {
        font-size: $font-size-sm;
      }

      .usage-kpis {
        gap: 4px;
      }

      .usage-kpi {
        padding: 4px;
      }

    }
  }

  .usage-trend-card {
    padding: 8px;

    .card-header {
      margin-bottom: 0;
    }

    .card-body {
      padding: 0;
    }

    .trend-state {
      min-height: 68px;
    }

    .trend-empty-image {
      display: none;
    }

    .trend-empty-title {
      font-size: $font-size-md;
    }

    .trend-empty-desc {
      font-size: $font-size-xs;
    }

    .trend-empty-block {
      flex-direction: column;
      text-align: center;
      gap: 10px;
      padding: 10px 12px;
    }

    .trend-empty-content {
      text-align: center;
      gap: 8px;
    }

    .usage-trend-chart {
      height: 112px;
    }
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
  margin-bottom: #{$space-2};
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

.no-plan-flow-card {
  grid-column: 1 / -1;
  margin: 0 auto;
  max-width: var(--page-content-max-width);
  width: 100%;
  background: var(--card-background);
  border: 1px solid var(--dashboard-border-color);
  border-radius: var(--dashboard-radius);
  padding: 16px;
  margin-bottom: 0;
}

.no-plan-flow-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.no-plan-hero {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 20px;
  border-radius: 14px;
  padding: 22px;
  border: 1px solid rgba(var(--theme-color-rgb), 0.16);
  background:
    radial-gradient(circle at 82% 18%, rgba(59, 130, 246, 0.16), transparent 40%),
    radial-gradient(circle at 18% 78%, rgba(99, 102, 241, 0.1), transparent 46%),
    linear-gradient(118deg, #f4f7ff 0%, #f9fbff 100%);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

.hero-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #b45309;
}

.no-plan-badge {
  @extend %typo-item-title;
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 6px 12px;
  border-radius: 999px;
  color: #b45309;
  border: 1px solid rgba(245, 158, 11, 0.32);
  background: rgba(245, 158, 11, 0.14);
}

.no-plan-title {
  @extend %typo-card-title;
  margin: 10px 0 8px;
  line-height: 1.24;
  letter-spacing: 0.2px;
}

.no-plan-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: $font-size-lg;
}

.hero-actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-btn {
  min-width: 144px;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 10px 18px;
  cursor: pointer;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
}

.hero-btn.primary {
  color: var(--text-on-dark-primary);
  background: linear-gradient(135deg, var(--button-primary-soft-start), var(--button-primary-start));
}

.hero-btn.secondary {
  color: var(--neutral-strong);
  border-color: rgba(148, 163, 184, 0.3);
  background: rgba(255, 255, 255, 0.76);
}

.hero-visual {
  min-height: 210px;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background:
    radial-gradient(circle at 30% 75%, rgba(99, 102, 241, 0.1), transparent 45%),
    radial-gradient(circle at 84% 20%, rgba(59, 130, 246, 0.15), transparent 40%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.65), rgba(241, 245, 255, 0.9));

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(148, 163, 184, 0.13) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148, 163, 184, 0.13) 1px, transparent 1px);
    background-size: 28px 28px;
  }
}

.line-device {
  position: absolute;
  border-radius: 10px;
  border: 2px solid rgba(79, 70, 229, 0.2);
  background: rgba(255, 255, 255, 0.35);
}

.line-device.laptop {
  width: 188px;
  height: 118px;
  right: 16%;
  top: 28%;
}

.line-device.tablet {
  width: 108px;
  height: 80px;
  right: 8%;
  top: 20%;
}

.line-device.phone {
  width: 52px;
  height: 94px;
  right: 14%;
  top: 50%;
}

.platform-icons {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.88);

  :deep(svg) {
    width: 18px;
    height: 18px;
  }
}

.no-plan-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.no-plan-step {
  border: none;
  width: 100%;
  border-radius: 16px;
  padding: 22px 18px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 8px;
  color: #fff;
  text-align: left;

}

.step-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
}

.step-desc {
  font-size: $font-size-sm;
  opacity: 0.9;
  line-height: 1.5;
}

button.no-plan-step {
  cursor: pointer;
  transition: transform .2s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.no-plan-step-primary {
  background: linear-gradient(135deg, #2259aa 0%, #5a39d8 100%);
}

.no-plan-step-secondary {
  background: linear-gradient(135deg, #2259aa 0%, #b737d9 100%);
}

.no-plan-step-success {
  background: linear-gradient(135deg, #2f4b9e 0%, #ea1d2c 100%);
}

.delay-01 {
  animation-delay: 0.1s;
}

.delay-05 {
  animation-delay: 0.5s;
}

@include down(md) {
  .no-plan-hero {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .hero-visual {
    display: none;
  }

  .no-plan-flow-card {
    padding: 16px;
  }

  .no-plan-steps {
    grid-template-columns: 1fr;
  }

  .no-plan-step {
    padding: 16px 16px;
  }

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
@use "sass:map";
@use "@/assets/styles/base/variables.scss" as *;
@use '@/assets/styles/no-plan-card' as *;

$space-2: map.get($spacers, 2);

/* 统计卡片状态样式（全局） */
.dashboard-container .stats-card {
  &.warning-card,
  &.danger-card {
    border-color: rgba(var(--stats-alert-rgb), 0.42);

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
}

.traffic-package-modal-card-global {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 32px);
  overflow: hidden;
  background-color: var(--card-background);
  border: 1px solid rgba(var(--theme-color-rgb), 0.15);
  border-radius: 16px;

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 16px;
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
    padding: 16px;
    overflow-y: auto;
  }

  .modal-footer {
    padding: 16px 16px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    gap: #{$space-2};

    .btn {
      min-width: 88px;
    }
  }

  .traffic-package-desc {
    margin: 0 0 16px;
    color: var(--text-tertiary);
    font-size: $font-size-md;
    line-height: 1.5;
  }

  .traffic-package-list {
    display: flex;
    flex-direction: column;
    gap: #{$space-2};
  }

  .traffic-package-item {
    display: flex;
    flex-direction: column;
    gap: #{$space-2};
    padding: 16px;
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
    gap: #{$space-2};

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
