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
            v-if="hasTierInfo"
            class="stats-card member-tier-card"
            :class="{ 'card-animate': !loading.userStats }"
            style="animation-delay: 0.45s"
          >
            <div class="member-tier-header">
              <span class="member-tier-caption">{{ $t('dashboard.memberTier') }}</span>
              <span class="member-tier-level">Lv.{{ userTier.level || '-' }}</span>
            </div>

            <div class="member-tier-name-row">
              <span class="member-tier-badge" :class="tierBadgeClass">{{ tierBadgeText }}</span>
              <div class="member-tier-name">{{ tierMemberDisplay }}</div>
            </div>

            <div class="member-tier-progress-meta">
              <span>{{ $t('dashboard.tierPointsProgress', { points: formatTierNumber(userTier.points), total: formatTierNumber(userTier.nextPointsRequired) }) }}</span>
            </div>

            <div class="member-tier-progress-track">
              <div class="member-tier-progress-fill" :style="{ width: `${tierProgress}%` }"></div>
            </div>

            <div class="member-tier-next" v-if="userTier.nextTierKey">
              {{ $t('dashboard.nextTierHint', { tier: nextTierNameDisplay, points: formatTierNumber(userTier.pointsToNextTier) }) }}
            </div>

            <ul class="member-tier-facts">
              <li>{{ $t('dashboard.tierCurrentPoints', { points: formatTierNumber(userTier.points) }) }}</li>
              <li>{{ $t('dashboard.tierNextLevel', { tier: nextTierNameDisplay }) }}</li>
              <li>{{ $t('dashboard.tierNeedPoints', { points: formatTierNumber(userTier.pointsToNextTier) }) }}</li>
            </ul>
          </div>

          <div
            class="stats-card traffic-board-card"
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

              <div class="plan-summary-section plan-summary-section-renew">
                <div class="plan-summary-row auto-renewal-row">
                  <div>
                    <span class="plan-summary-label with-tooltip">
                      <span>{{ $t('profile.autoRenewal') }}</span>
                      <span class="info-tooltip" tabindex="0" role="button" :aria-label="$t('profile.autoRenewalDesc')">
                        <IconHelpCircle :size="14" />
                        <span class="info-tooltip-content">{{ $t('profile.autoRenewalDesc') }}</span>
                      </span>
                    </span>
                  </div>
                  <label class="switch" :class="{ disabled: updatingAutoRenewalSetting }">
                    <input
                      type="checkbox"
                      v-model="autoRenewalEnabled"
                      :disabled="updatingAutoRenewalSetting"
                      @change="updateAutoRenewalSetting"
                    />
                    <span class="slider round" :class="{ loading: updatingAutoRenewalSetting }"></span>
                  </label>
                </div>
              </div>

              <div class="plan-summary-section plan-summary-section-actions">
                <div class="plan-summary-actions">
                  <button
                    class="plan-action-btn btn"
                    :class="primaryActionClass"
                    @click="handlePrimaryPlanAction"
                  >
                    {{ primaryPlanActionLabel }}
                  </button>
                  <button
                    class="plan-action-btn btn"
                    :class="secondaryActionClass"
                    @click="handleSecondaryPlanAction"
                  >
                    {{ secondaryPlanActionLabel }}
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

        </template>
      </div>

      <div class="dashboard-card ip-location-summary-card" v-if="hasPlan">
        <div class="card-body ip-location-summary-body">
          <div v-if="ipLocationLoading" class="ip-location-state">{{ $t('common.loading') }}...</div>
          <div v-else-if="ipLocationError" class="ip-location-state error">{{ ipLocationError }}</div>
          <div v-else-if="ipLocationData" class="ip-location-content">
            <div class="ip-location-main-info">
              <div class="ip-meta-title">{{ $t('dashboard.currentExitRegion') }}</div>
              <div class="ip-main-line">
                <span class="region-code-badge" :class="ipLocationCodeBadgeClass">{{ ipLocationCode }}</span>
                <span class="ip-region-primary">{{ ipLocationPrimaryRegionText }}</span>
              </div>
              <div class="ip-sub-line">
                <span class="ip-region">{{ ipLocationDisplayText }}</span>
                <button class="ip-refresh-btn btn btn-secondary" type="button" @click="triggerIpLocationRefresh" :disabled="ipLocationLoading">
                  <IconRefresh :size="14" :class="{ spinning: ipLocationLoading }" />
                  <span>{{ ipLocationLoading ? $t('dashboard.refreshing') : $t('common.refresh') }}</span>
                </button>
              </div>
              <div class="ip-status-row">
                <span class="status-dot" aria-hidden="true"></span>
                <span>{{ $t('dashboard.smoothStatusNormal') }}</span>
              </div>
            </div>


            <div class="ip-service-reference" v-if="ipLocationServiceCatalog.length">
              <div class="service-reference-title">
                <span>{{ $t('dashboard.serviceReference') }}</span>
                <span class="info-tooltip" tabindex="0" role="button" :aria-label="$t('dashboard.serviceReferenceHint')">
                  <IconHelpCircle :size="14" />
                  <span class="info-tooltip-content">{{ $t('dashboard.serviceReferenceHint') }}</span>
                </span>
              </div>
              <div class="service-reference-tags" role="list" :aria-label="$t('dashboard.serviceReferenceAria')">
                <div
                  v-for="service in ipLocationServiceCatalog"
                  :key="`ip-service-${service.key}`"
                  class="service-reference-item"
                  :class="{ active: isIpServiceReferenced(service.key) }"
                  role="listitem"
                  :title="`${service.label} · ${isIpServiceReferenced(service.key) ? $t('dashboard.serviceAvailableInRegion') : $t('dashboard.serviceNotInRegion')}`"
                >
                  <span class="service-reference-tile">
                    <img class="service-reference-icon" :src="service.icon" :alt="service.label" loading="lazy" />
                  </span>
                  <span class="service-reference-label">{{ service.label }}</span>
                </div>
              </div>
            </div>

            <IconChevronRight class="ip-card-arrow" :size="20" />
          </div>
          <div v-else class="ip-location-state">{{ $t('trafficLog.noTrafficData') }}</div>
        </div>
      </div>

      <div class="dashboard-card usage-trend-card" v-if="hasPlan">
        <div class="card-header">
          <h2 class="card-title">{{ $t('trafficLog.title') }}</h2>
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
import {DASHBOARD_CONFIG, isXiaoV2board} from '@/utils/baseConfig';
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
  IconPlus,
  IconRefresh
} from '@tabler/icons-vue';
import CommonDialog from '@/components/popup/CommonDialog.vue';
import InfoCard from '@/components/common/InfoCard.vue';
import {getSubscribe, getUserConfig, getUserInfo, getUserStats, setNextPeriod} from '@/api/overview/dashboard';
import { updateRemindSettings as apiUpdateRemind } from '@/api/account/user';
import { getTrafficLog } from '@/api/account/trafficLog';
import * as echarts from 'echarts';
import {useToast} from '@/composables/useToast';
import {fetchPlans} from '@/api/account/shop';
import serviceNetflixIcon from '@/assets/images/service-icons/netflix.svg';
import serviceDisneyPlusIcon from '@/assets/images/service-icons/disney-plus.svg';
import serviceYoutubePremiumIcon from '@/assets/images/service-icons/youtube.svg';
import serviceChatgptIcon from '@/assets/images/service-icons/chatgpt.svg';
import serviceClaudeIcon from '@/assets/images/service-icons/claude.svg';
import serviceGoogleIcon from '@/assets/images/service-icons/google.svg';

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
    const userTier = reactive({
      key: '',
      level: 0,
      points: 0,
      nextTierKey: '',
      nextPointsRequired: 0,
      pointsToNextTier: 0
    });
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
    const remindExpireSetting = ref(false);
    const remindTrafficSetting = ref(false);
    const autoRenewalEnabled = ref(false);
    const updatingAutoRenewalSetting = ref(false);
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
    let trafficTrendChart = null;

    const ipLocationLoading = ref(false);
    const ipLocationError = ref('');
    const ipLocationData = ref(null);
    const ipLocationCache = ref(null);
    const ipLocationDebounceTimer = ref(null);

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

      if (ipLocationError.value) {
        ipLocationError.value = t('trafficLog.errorLoadingTraffic');
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

          const tierInfo = info.tier || {};
          userTier.key = tierInfo.key || '';
          userTier.level = Number(tierInfo.level || 0);
          userTier.points = Number(tierInfo.points || 0);
          userTier.nextTierKey = tierInfo.next_tier_key || '';
          userTier.nextPointsRequired = Number(tierInfo.next_points_required || 0);
          userTier.pointsToNextTier = Number(tierInfo.points_to_next_tier || 0);

          remindExpireSetting.value = !!info.remind_expire;
          remindTrafficSetting.value = !!info.remind_traffic;
          autoRenewalEnabled.value = !!info.auto_renewal;
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

    const updateAutoRenewalSetting = async () => {
      const originalValue = !autoRenewalEnabled.value;
      updatingAutoRenewalSetting.value = true;
      try {
        await apiUpdateRemind({
          remind_expire: remindExpireSetting.value ? 1 : 0,
          remind_traffic: remindTrafficSetting.value ? 1 : 0,
          auto_renewal: autoRenewalEnabled.value ? 1 : 0,
        });
        showToast(t('profile.updateSuccess'), 'success');
      } catch (error) {
        autoRenewalEnabled.value = originalValue;
        showToast(t('profile.updateError'), 'error');
      } finally {
        updatingAutoRenewalSetting.value = false;
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

    const hasTierInfo = computed(() => {
      return !!userTier.key || Number(userTier.level || 0) > 0;
    });

    const normalizeTierName = (key) => {
      const raw = `${key || ''}`.trim();
      if (!raw) return '-';

      const readable = raw
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return readable
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const tierNameDisplay = computed(() => normalizeTierName(userTier.key));
    const nextTierNameDisplay = computed(() => normalizeTierName(userTier.nextTierKey));
    const tierMemberDisplay = computed(() => tierNameDisplay.value);

    const tierBadgeKey = computed(() => `${userTier.key || ''}`.toLowerCase());
    const tierBadgeClass = computed(() => {
      if (tierBadgeKey.value.includes('bronze')) return 'is-bronze';
      if (tierBadgeKey.value.includes('silver')) return 'is-silver';
      if (tierBadgeKey.value.includes('gold')) return 'is-gold';
      if (tierBadgeKey.value.includes('platinum')) return 'is-platinum';
      if (tierBadgeKey.value.includes('diamond')) return 'is-diamond';
      return 'is-default';
    });
    const tierBadgeText = computed(() => {
      if (tierBadgeKey.value.includes('bronze')) return '★';
      if (tierBadgeKey.value.includes('silver')) return '★';
      if (tierBadgeKey.value.includes('gold')) return '★';
      if (tierBadgeKey.value.includes('platinum')) return '★';
      if (tierBadgeKey.value.includes('diamond')) return '★';
      return '★';
    });

    const tierProgress = computed(() => {
      const total = Number(userTier.nextPointsRequired);
      if (!total) return 100;
      return Math.min(Math.max(Math.round((Number(userTier.points) / total) * 100), 0), 100);
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

    const formatTierNumber = (value) => {
      const numericValue = Number(value || 0);
      return Number.isFinite(numericValue) ? numericValue.toLocaleString() : '0';
    };

    const primaryActionClass = computed(() => {
      return 'btn-primary';
    });

    const secondaryActionClass = computed(() => {
      if (secondaryPlanActionLabel.value === t('dashboard.planAction.manageSubscription')) return 'btn-primary';
      return 'btn-secondary';
    });

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


    const normalizeIpLocation = (payload = {}) => {
      const latitude = Number(
        payload.latitude ?? payload.lat ?? payload.location?.latitude ?? payload.loc?.split(',')?.[0]
      );
      const longitude = Number(
        payload.longitude ?? payload.lon ?? payload.lng ?? payload.location?.longitude ?? payload.loc?.split(',')?.[1]
      );
      const city = payload.city || payload.town || payload.district || '';
      const region = payload.region || payload.regionName || payload.state || '';
      const country = payload.country || payload.country_name || '';
      const countryCode = (payload.country_code || payload.countryCode || payload.countryCode2 || '').toString().toUpperCase();
      const ip = payload.ip || payload.query || '';

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

      return {
        ip,
        city,
        region,
        country,
        countryCode,
        latitude,
        longitude
      };
    };

    const fetchIpLocationFromSources = async () => {
      const endpoints = [
        'https://ipapi.co/json',
        'https://ident.me/json',
        'http://ip-api.com/json',
        'https://api.ip.sb/geoip',
        'https://ipinfo.io/json'
      ];

      const requests = endpoints.map((url) => (
        fetch(url, { cache: 'no-store' })
          .then(async (resp) => {
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            const normalized = normalizeIpLocation(data);
            if (!normalized) throw new Error('Invalid location payload');
            return normalized;
          })
      ));

      const settled = await Promise.allSettled(requests);
      const hit = settled.find((item) => item.status === 'fulfilled');
      if (hit && hit.status === 'fulfilled') {
        return hit.value;
      }
      throw new Error('IP location lookup failed on all providers.');
    };

    const scheduleIpLocationRefresh = (force = false) => {
      if (ipLocationDebounceTimer.value) {
        clearTimeout(ipLocationDebounceTimer.value);
      }

      ipLocationDebounceTimer.value = setTimeout(async () => {
        const now = Date.now();
        const cache = ipLocationCache.value;
        if (!force && cache?.expiresAt > now) {
          ipLocationData.value = cache.data;
          ipLocationError.value = '';
          return;
        }

        ipLocationLoading.value = true;
        ipLocationError.value = '';

        try {
          const data = await fetchIpLocationFromSources();
          ipLocationData.value = data;
          ipLocationCache.value = {
            data,
            expiresAt: now + 5 * 60 * 1000
          };
        } catch (error) {
          console.error('Failed to fetch IP location:', error);
          ipLocationError.value = t('trafficLog.errorLoadingTraffic');
        } finally {
          ipLocationLoading.value = false;
        }
      }, 2000);
    };

    const triggerIpLocationRefresh = () => {
      scheduleIpLocationRefresh(true);
    };

    const ipLocationDisplayText = computed(() => {
      if (!ipLocationData.value) return '';
      return [ipLocationData.value.city, ipLocationData.value.region, ipLocationData.value.country]
        .filter(Boolean)
        .join(', ');
    });

    const ipLocationCode = computed(() => {
      const code = (ipLocationData.value?.countryCode || '').trim().toUpperCase();
      return /^[A-Z]{2}$/.test(code) ? code : '--';
    });

    const ipLocationPrimaryRegionText = computed(() => {
      if (!ipLocationData.value) return '-';
      return ipLocationData.value.city || ipLocationData.value.region || ipLocationData.value.country || '-';
    });

    const ipLocationCodeBadgeClass = computed(() => {
      const code = ipLocationCode.value;
      const badgeMap = DASHBOARD_CONFIG.ipRegionBadgeByCountryCode || {};
      return badgeMap[code] || 'is-red';
    });

    const ipLocationServiceReferences = computed(() => {
      const code = ipLocationCode.value;
      const serviceMap = DASHBOARD_CONFIG.ipRegionServiceReferenceByCountryCode || {};
      const defaultServices = DASHBOARD_CONFIG.ipRegionServiceReferenceDefault || [];
      const services = serviceMap[code] || defaultServices;
      return Array.isArray(services) ? services : [];
    });

    const ipLocationServiceIconMap = {
      'Netflix': serviceNetflixIcon,
      'Disney+': serviceDisneyPlusIcon,
      'YouTube Premium': serviceYoutubePremiumIcon,
      'ChatGPT': serviceChatgptIcon,
      Claude: serviceClaudeIcon,
      Google: serviceGoogleIcon,
    };

    const ipLocationServiceCatalog = computed(() => {
      const serviceCatalog = DASHBOARD_CONFIG.ipRegionServiceCatalog || [];
      return serviceCatalog.map((item) => ({
        ...item,
        icon: ipLocationServiceIconMap[item.key] || serviceChatgptIcon,
      }));
    });

    const isIpServiceReferenced = (serviceKey) => {
      return ipLocationServiceReferences.value.includes(serviceKey);
    };

    const fetchTrafficTrend = async () => {
      trafficTrendLoading.value = true;
      trafficTrendError.value = false;
      try {
        const response = await getTrafficLog();
        const rows = getTrafficLogRows(response);
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
      const textColor = rootStyles.getPropertyValue('--text-color').trim() || '#333333';
      const borderColor = rootStyles.getPropertyValue('--border-color').trim() || '#e8e8e8';
      const themeColor = rootStyles.getPropertyValue('--theme-color').trim() || '#6753f6';
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
          bottom: 0,
          textStyle: { color: textColor }
        },
        grid: { left: '3%', right: '4%', bottom: '60px', top: '30px', containLabel: true },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: trafficTrendData.value.map((i) => i.date),
          axisLabel: { rotate: 45, interval: 'auto', color: textColor },
          axisLine: { lineStyle: { color: borderColor } },
          splitLine: { lineStyle: { color: borderColor } }
        },
        yAxis: {
          type: 'value',
          name: t('trafficLog.unitGb'),
          nameTextStyle: { padding: [0, 0, 0, 10], color: textColor },
          axisLabel: { formatter: (value) => `${value} ${t('trafficLog.unitGb')}`, color: textColor },
          axisLine: { lineStyle: { color: borderColor } },
          splitLine: { lineStyle: { color: borderColor } }
        },
        series: [
          {
            name: t('trafficLog.uploadTraffic'),
            type: 'line',
            stack: 'Total',
            smooth: true,
            lineStyle: { width: 2 },
            showSymbol: false,
            areaStyle: { opacity: 0.2 },
            emphasis: { focus: 'series' },
            data: trafficTrendData.value.map((i) => i.uploadGb),
            color: '#36AD47'
          },
          {
            name: t('trafficLog.downloadTraffic'),
            type: 'line',
            stack: 'Total',
            smooth: true,
            lineStyle: { width: 2 },
            showSymbol: false,
            areaStyle: { opacity: 0.2 },
            emphasis: { focus: 'series' },
            data: trafficTrendData.value.map((i) => i.downloadGb),
            color: '#4080FF'
          },
          {
            name: t('trafficLog.totalTraffic'),
            type: 'line',
            smooth: true,
            lineStyle: { width: 3 },
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
      scheduleIpLocationRefresh();

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
      if (ipLocationDebounceTimer.value) {
        clearTimeout(ipLocationDebounceTimer.value);
        ipLocationDebounceTimer.value = null;
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
        scheduleIpLocationRefresh();
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
      userTier,
      hasTierInfo,
      tierNameDisplay,
      tierMemberDisplay,
      nextTierNameDisplay,
      tierBadgeClass,
      tierBadgeText,
      tierProgress,
      formatTierNumber,
      subscriptionTrafficSummary,
      primaryActionClass,
      secondaryActionClass,
      handlePrimaryPlanAction,
      handleSecondaryPlanAction,
      hasPlan,
      renewPlan,
      isXiaoPanel,
      navigateToDeposit,
      showDeviceLimit,
      needRefreshData,
      trafficBoardSections,
      autoRenewalEnabled,
      updatingAutoRenewalSetting,
      updateAutoRenewalSetting,
      hasPurchasedTrafficPackage,
      trafficTrendChartRef,
      trafficTrendData,
      trafficTrendLoading,
      trafficTrendError,
      ipLocationLoading,
      ipLocationError,
      ipLocationData,
      ipLocationDisplayText,
      ipLocationCode,
      ipLocationPrimaryRegionText,
      ipLocationCodeBadgeClass,
      ipLocationServiceReferences,
      ipLocationServiceCatalog,
      isIpServiceReferenced,
      triggerIpLocationRefresh,
      DASHBOARD_CONFIG,
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
.dashboard-container {
  display: flex;
  justify-content: center;
  --dashboard-card-padding: 20px;

  --saas-brand: #355cc2;
  --saas-text-primary: #111827;
  --saas-text-secondary: #6b7280;
  --saas-border-soft: #eef1f5;
  --saas-card-bg: #ffffff;
  --saas-card-shadow: 0 1px 2px rgba(15, 23, 42, 0.05), 0 6px 18px rgba(15, 23, 42, 0.04);

  --theme-text-primary: #111827;
  --theme-text-secondary: #6b7280;
  --theme-text-subtle: #9ca3af;
  --theme-text-emphasis: #374151;
  --theme-surface-muted: #f3f4f6;
  --theme-surface-soft: #f8fafc;
  --theme-border-soft: #e5e7eb;
  --theme-white: #ffffff;
  --quota-label-color: #4b5563;
  --quota-value-color: #1f2937;
  --quota-progress-start: #60a5fa;
  --quota-progress-end: #3b82f6;
  --quota-muted-fill: #cbd5e1;
  --quota-total-bg-end: #f8fbff;
  --quota-expired-border: #d1d5db;
  --plan-meta-text: #64748b;
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
    gap: 16px;

    > .pending-order-banner {
      grid-column: 1 / -1;
      margin-bottom: 0;
    }

    > .stats-grid,
    > .ip-location-summary-card,
    > .usage-trend-card {
      grid-column: 1 / -1;
    }

    @media (max-width: 992px) {
      > .pending-order-banner,
      > .stats-grid,
      > .ip-location-summary-card,
      > .usage-trend-card {
        grid-column: 1 / -1;
      }
    }
  }

  .dashboard-card {
    background-color: var(--saas-card-bg);
    border-radius: 14px;
    box-shadow: var(--saas-card-shadow);
    padding: var(--dashboard-card-padding);
    border: none;
    transition: box-shadow 0.2s ease;

    &:hover {
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06), 0 10px 24px rgba(15, 23, 42, 0.06);
      transform: none;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;

      .card-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
        color: var(--saas-text-primary);
      }

      .card-actions {
        display: flex;
        gap: 10px;
      }
    }
  }

  /* 数据统计卡片区域（会员等级 + 流量卡片） */
  .stats-grid {
    position: relative;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 16px;
    margin-bottom: 24px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (min-width: 1200px) {
      grid-template-columns: minmax(0, 1.86fr) minmax(0, 1fr);
      grid-auto-rows: minmax(124px, auto);
    }

    .stats-card {
      position: relative;
      background-color: var(--card-bg-color);
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
      overflow: hidden;
      border: 1px solid var(--border-color);

      /* 流量额度包卡片（订阅流量 / 叠加包 / 总览）样式 */
      &.traffic-board-card {
        width: 100%;
        min-width: 0;
        min-height: clamp(172px, 18vw, 232px);
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
          font-size: 16px;
          margin-bottom: 2px;
        }

        .stats-label {
          font-size: 12px;
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
          font-size: 16px;
          font-weight: 600;
          color: var(--neutral-strong);
          line-height: 1.35;
        }

        .usage-card-main {
          display: flex;
          align-items: baseline;
          gap: 8px;

          &.package-main {
            align-items: baseline;
            width: 100%;
          }

          .package-add-btn {
            margin-left: auto;
            width: 26px;
            height: 26px;
            border-radius: 999px;
            border: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: var(--theme-white);
            background: linear-gradient(135deg, var(--button-primary-soft-start), var(--button-primary-start));
            box-shadow: 0 6px 14px rgba(var(--theme-color-rgb), 0.2);
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
          background: linear-gradient(180deg, var(--theme-white) 0%, var(--quota-total-bg-end) 100%);
          border-color: var(--border-color);
          box-shadow: var(--shadow-card-md);

          .usage-card-title {
            color: var(--quota-label-color);
            font-weight: 650;
          }
        }

        &.expired-main-card {
          background: var(--theme-surface-muted);
          border-color: var(--quota-expired-border);

          .usage-card-title {
            color: var(--theme-text-secondary);
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
            border-radius: 10px;
            padding: 9px 12px;
            font-size: 13px;
            font-weight: 600;
            color: var(--plan-expired-strip-text);
            background: var(--plan-expired-strip-bg);
            border: 1px solid var(--plan-expired-strip-border);
          }

          .plan-summary-section {
            border: none;
            border-radius: 12px;
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
            padding: 12px 14px;
          }

          .plan-status-hero {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .plan-name-main {
            font-size: 24px;
            line-height: 1.2;
            font-weight: 700;
            color: var(--heading-color);
          }

          .plan-expire-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            flex-wrap: wrap;
            font-size: 13px;
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
            font-size: 12px;
            color: var(--theme-text-secondary);

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
            font-size: 14px;
            color: var(--theme-text-primary);
            font-weight: 600;
            text-align: right;
            word-break: break-word;
          }

          .plan-status-tag {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            padding: 2px 8px;
            font-size: 12px;
            font-weight: 600;

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
            font-size: 12px;
            color: var(--theme-text-secondary);
          }

          .auto-renewal-row {
            align-items: flex-start;
          }

          .plan-summary-actions {
            display: flex;
            gap: 10px;
            margin-top: 0;


            .plan-action-btn {
              flex: 1;
              border-radius: 12px;
              padding: 10px 14px;
              font-size: 14px;
              font-weight: 600;
              letter-spacing: 0.2px;

              @media (max-width: 576px) {
                padding: 9px 10px;
                font-size: 13px;
              }
            }
          }

          .plan-action-helper-text {
            margin-top: 10px;
            font-size: 12px;
            color: #475569;
            text-align: center;
          }

          .switch {
            position: relative;
            display: inline-block;
            width: 46px;
            height: 24px;
            flex-shrink: 0;

            &.disabled {
              opacity: 0.6;
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
                background-color: var(--theme-white);
                transition: 0.4s;
                z-index: 1;
              }

              &.round {
                border-radius: 24px;

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
          font-size: 36px;
          line-height: 1;
          font-weight: 700;
          color: var(--theme-text-primary);

          &.compact {
            font-size: 32px;
          }
        }

        .usage-percent-label {
          font-size: 13px;
          color: var(--quota-label-color);
          font-weight: 500;
        }

      &.quota-traffic-card {
        .usage-percent {
          font-size: 30px;

          &.compact {
            font-size: 26px;
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
            font-size: 13px;
            font-weight: 600;
            color: var(--neutral-strong);
          }

          .usage-kpi {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 8px;
            border-radius: 10px;
            background: var(--theme-surface-soft);
          }

          .usage-kpi-label {
            writing-mode: horizontal-tb;
            text-orientation: mixed;
            font-size: 12px;
            color: var(--muted-text-color);
            line-height: 1;
          }

          .usage-kpi-value {
            writing-mode: horizontal-tb;
            text-orientation: mixed;
            font-size: 15px;
            color: var(--quota-value-color);
            font-weight: 600;
            line-height: 1.2;
          }

          .usage-reset-hint {
            width: 100%;
            font-size: 12px;
            color: var(--theme-text-secondary);
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

          @media (max-width: 576px) {
            .usage-kpis {
              grid-template-columns: 1fr;
            }
          }
        }
      }

      @media (min-width: 1200px) {
        &.traffic-board-card.total-main-card {
          grid-column: 1;
          grid-row: 1 / span 2;
          min-height: 100%;
        }

        &.traffic-board-card:not(.total-main-card) {
          grid-column: 2;
          min-height: 152px;
          padding: 16px;
          gap: 8px;

          .usage-card-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--neutral-strong);
          }

          .usage-percent {
            font-size: 36px;

            &.compact {
              font-size: 30px;
            }
          }

          .usage-percent-label {
            font-size: 12px;
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
              font-size: 12px;
            }

            .usage-kpi-value {
              font-size: 14px;
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
        border-color: rgba(148, 163, 184, 0.24);
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
      }
    }
  }

  /* 会员等级卡片 */
  .stats-grid .stats-card.member-tier-card {
    background: radial-gradient(circle at 85% 10%, rgba(132, 161, 255, 0.35), transparent 35%),
      linear-gradient(135deg, #1c2f6a 0%, #213a8f 45%, #3049a5 100%);
    color: #e8edff;
    border: 1px solid rgba(161, 181, 255, 0.26);
    box-shadow: 0 10px 24px rgba(18, 32, 78, 0.28);
    gap: 10px;
    align-items: flex-start;
    flex-direction: column;

    .member-tier-header {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .member-tier-caption {
      font-size: 12px;
      color: rgba(232, 237, 255, 0.86);
      letter-spacing: 0.08em;
    }

    .member-tier-level {
      font-size: 13px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.18);
    }

    .member-tier-name-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .member-tier-badge {
      position: relative;
      width: 54px;
      height: 60px;
      clip-path: polygon(50% 2%, 90% 20%, 90% 80%, 50% 98%, 10% 80%, 10% 20%);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.96);
      border: 2px solid rgba(255, 236, 169, 0.9);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.38), 0 6px 14px rgba(8, 15, 36, 0.32);
      text-shadow: 0 1px 0 rgba(71, 38, 5, 0.3);

      &::before {
        content: '';
        position: absolute;
        inset: 6px;
        clip-path: inherit;
        background: linear-gradient(165deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.04));
        pointer-events: none;
      }

      &::after {
        content: '';
        position: absolute;
        top: 8px;
        left: 10px;
        right: 10px;
        height: 14px;
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0));
        pointer-events: none;
      }

      &.is-bronze {
        background: linear-gradient(150deg, #d5943e, #a4621f 56%, #8a4c16);
      }

      &.is-silver {
        background: linear-gradient(150deg, #dbe3ee, #9aa9be 55%, #78869f);
      }

      &.is-gold {
        background: linear-gradient(150deg, #ffd976, #eca321 56%, #cb7f00);
      }

      &.is-platinum {
        background: linear-gradient(150deg, #84d6ff, #4b94da 55%, #2d63b2);
      }

      &.is-diamond {
        background: linear-gradient(150deg, #c1b8ff, #8977ff 56%, #6049e3);
      }

      &.is-default {
        background: linear-gradient(150deg, #96abef, #657fca 56%, #4d64af);
      }
    }

    .member-tier-name {
      font-size: 30px;
      line-height: 1.1;
      font-weight: 700;
      color: #ffffff;
    }

    .member-tier-progress-meta,
    .member-tier-next {
      font-size: 13px;
      color: rgba(239, 243, 255, 0.9);
    }

    .member-tier-progress-track {
      width: 100%;
      height: 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.24);
      overflow: hidden;
    }

    .member-tier-progress-fill {
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #fbd15f, #f59e0b);
      transition: width 0.25s ease;
    }

    .member-tier-facts {
      margin: 4px 0 0;
      width: 100%;
      list-style: none;
      padding: 0;
      display: grid;
      gap: 8px;

      li {
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 8px;
        color: rgba(245, 248, 255, 0.95);

        &::before {
          content: '✓';
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 700;
          color: #195f4a;
          background: rgba(140, 255, 204, 0.88);
        }
      }
    }
  }

  @media (min-width: 1200px) {
    .stats-grid .stats-card.member-tier-card {
      grid-column: 2;
    }
  }


  /* IP 位置卡片 */
  .ip-location-summary-card {
    border-radius: 20px;
    border: 1px solid rgba(131, 159, 213, 0.22);
    background: radial-gradient(circle at 76% 50%, rgba(58, 103, 208, 0.26), transparent 40%),
      radial-gradient(circle at 15% 105%, rgba(26, 65, 154, 0.3), transparent 35%),
      linear-gradient(120deg, #0f172a 0%, #17233f 45%, #1c2747 100%);
    box-shadow: 0 10px 24px rgba(10, 20, 42, 0.28);

    .ip-location-summary-body {
      padding-top: 0;
    }

    .ip-location-state {
      color: #bddfff;
      font-size: 13px;

      &.error {
        color: #ff9ba8;
      }
    }

    .ip-location-content {
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.35fr);
      gap: 14px 18px;
      color: #d9ecff;
      align-items: start;
      position: relative;

      @media (max-width: 1220px) {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      @media (max-width: 920px) {
        grid-template-columns: 1fr;
      }
    }

    .ip-card-arrow {
      position: absolute;
      top: 4px;
      right: 0;
      color: rgba(229, 236, 250, 0.86);
    }

    .ip-location-main-info {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 0;
    }

    .ip-meta-title {
      color: rgba(233, 240, 255, 0.95);
      font-size: 18px;
      line-height: 1.2;
      font-weight: 700;
    }

    .ip-main-line {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .ip-region-primary {
      font-size: 44px;
      line-height: 1.15;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #ecf6ff;

      @media (max-width: 1220px) {
        font-size: 38px;
      }

      @media (max-width: 680px) {
        font-size: 30px;
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
      font-size: 12px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      gap: 6px;

      &:disabled {
        opacity: 0.7;
      }

      .spinning {
        animation: spin 0.9s linear infinite;
      }
    }

    .ip-address-secondary {
      font-size: 11px;
      color: rgba(189, 223, 255, 0.58);
      letter-spacing: 0.2px;
    }

    .ip-status-row {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #e9f3ff;
      font-size: 16px;
      font-weight: 600;

      .status-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #35c26b;
        box-shadow: 0 0 0 4px rgba(53, 194, 107, 0.2);
      }
    }

    .region-code-badge {
      min-width: 44px;
      height: 24px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 8px;
      font-size: 11px;
      font-weight: 800;
      color: var(--theme-white);
      letter-spacing: 0.5px;
      background: linear-gradient(135deg, var(--neutral-strong), #1e293b);
      box-shadow: 0 6px 14px rgba(15, 23, 42, 0.28);

      &.is-red { background: linear-gradient(135deg, #e11d48, #9f1239); }
      &.is-pink { background: linear-gradient(135deg, #be185d, #831843); }
      &.is-blue { background: linear-gradient(135deg, #1d4ed8, #1e3a8a); }
    }

    .ip-region {
      color: #bddfff;
      font-size: 13px;
    }

    .ip-service-reference {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(164, 191, 242, 0.24);
      min-height: 100%;
    }

    .service-reference-title {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 16px;
      font-weight: 700;
      color: #f3f7ff;
      letter-spacing: 0.2px;
    }

    .service-reference-tags {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      overflow: visible;
      padding-bottom: 2px;
    }

    @media (max-width: 680px) {
      .service-reference-tags {
        grid-template-columns: 1fr;
      }
    }

    .service-reference-item {
      width: 100%;
      min-height: 38px;
      border-radius: 999px;
      display: inline-flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      gap: 8px;
      white-space: nowrap;
      padding: 6px 12px;
      border: none;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(233, 243, 255, 0.92);
      opacity: 0.84;
      transition: all 0.2s ease;

      .service-reference-tile {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--theme-white);
        box-shadow: 0 0 0 1px rgba(190, 209, 247, 0.25);
      }

      .service-reference-label {
        font-size: 13px;
        line-height: 1;
        color: #ebf2ff;
        font-weight: 600;
      }

      .service-reference-icon {
        width: 18px;
        height: 18px;
        display: block;
        object-fit: contain;
        filter: none;
      }

      &.active {
        opacity: 1;
        color: #eef6ff;
        background: rgba(255, 255, 255, 0.16);
      }

      &:hover {
        opacity: 1;
        transform: translateY(-1px);
      }
    }

  }

  .info-tooltip {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    color: rgba(148, 163, 184, 0.95);
    cursor: help;

    .info-tooltip-content {
      position: absolute;
      left: 50%;
      bottom: calc(100% + 8px);
      width: min(220px, calc(100vw - 32px));
      padding: 8px 10px;
      border-radius: 6px;
      background: rgba(15, 23, 42, 0.96);
      color: #e2e8f0;
      font-size: 12px;
      line-height: 1.4;
      font-weight: 500;
      box-shadow: 0 8px 22px rgba(2, 6, 23, 0.35);
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
  }

  /* 流量趋势图卡片 */
  .usage-trend-card {
    .card-body {
      padding-top: 6px;
    }

    .trend-state {
      min-height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--theme-text-secondary);
      font-size: 14px;
    }

    .usage-trend-chart {
      width: 100%;
      height: 280px;
    }
  }
  /* 待支付横幅卡片 */
  .pending-order-banner {
    margin-bottom: 8px;
    min-height: 44px;
    max-height: 48px;
    padding: 6px 12px;
    border-radius: 10px;
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
      font-size: 13px;
      line-height: 1.35;
      font-weight: 500;
    }

    .banner-icon {
      flex-shrink: 0;
      color: var(--warning-color);
    }

    .banner-action {
      border-radius: 8px;
      height: 30px;
      padding: 0 12px;
      font-size: 13px;
      font-weight: 600;
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
      grid-column: 1 / -1;
    }

    .stats-card.member-tier-card {
      grid-column: 1 / -1;

      .member-tier-badge {
        width: 44px;
        height: 50px;
        font-size: 15px;
      }

      .member-tier-name {
        font-size: 24px;
      }
    }

    .stats-card.quota-traffic-card {
      grid-column: 1 / -1;
      min-height: auto;
      height: auto;
      padding: 10px;
      gap: 5px;

      .usage-percent {
        font-size: 24px;

        &.compact {
          font-size: 22px;
        }
      }

      .usage-percent-label {
        font-size: 12px;
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
  border-radius: 12px;
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
  box-shadow: var(--card-shadow);
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
@use '@/assets/styles/no-plan-card' as *;

/* 统计卡片状态样式（全局） */
.dashboard-container .stats-card {
  &.warning-card,
  &.danger-card {
    border-color: rgba(var(--stats-alert-rgb), 0.42);
    box-shadow: 0 4px 10px rgba(var(--stats-alert-rgb), 0.15);

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
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.traffic-package-modal-card-global {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 32px);
  overflow: hidden;
  background-color: var(--card-background);
  border: 1px solid rgba(var(--theme-color-rgb), 0.15);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
    background-color: rgba(var(--theme-color-rgb), 0.03);

    h3 {
      margin: 0;
      color: var(--text-color);
      font-size: 18px;
      font-weight: 600;
    }

    .close-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;

      &:hover {
        color: var(--text-color);
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
    color: var(--secondary-text-color);
    font-size: 14px;
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
    border-radius: 12px;
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
      color: var(--text-color);
      font-size: 15px;
      font-weight: 600;
    }
  }

  .item-price {
    color: var(--theme-color);
    font-size: 24px;
    font-weight: 700;
  }

  .item-content {
    min-height: 32px;
    color: var(--secondary-text-color);
    font-size: 13px;
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
