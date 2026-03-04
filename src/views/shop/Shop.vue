<template>
  <div class="shop-container">
    <div class="shop-inner">
      <!-- 欢迎卡片 -->

      <div class="dashboard-card welcome-card">
        <div class="card-header">
          <h2 class="card-title">{{ $t("shop.title") }}</h2>
        </div>

        <div class="card-body">
          <p>{{ $t("shop.description") }}</p>
          <div class="plan-summary" v-if="currentSubscription.planName">
            <div class="plan-summary-item">
              <span class="label">{{ $t("shop.current_plan_info.plan") }}</span>
              <strong>{{ currentSubscription.planName }}</strong>
            </div>
            <div class="plan-summary-item">
              <span class="label">{{ $t("shop.current_plan_info.expire") }}</span>
              <strong>{{ currentSubscription.expireDate || $t("dashboard.permanent") }}</strong>
            </div>
            <div class="plan-summary-item">
              <span class="label">{{ $t("shop.current_plan_info.traffic") }}</span>
              <strong>{{ currentSubscription.usedTraffic }} / {{ currentSubscription.totalTraffic }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- 筛选选项卡 - 设计成圆形切换按钮 -->

      <div class="filter-toggle-container">
        <div class="filter-toggle-wrapper">
          <div
            v-for="filter in filters"
            :key="`${filter.value}-${currentLanguage}`"
            class="filter-option"
            :class="{ active: selectedFilter === filter.value }"
            @click="setFilter(filter.value)"
          >
            <div class="option-icon">
              <IconCircleCheck v-if="selectedFilter === filter.value" />

              <IconCircle v-else />
            </div>

            <span class="option-text">{{ $t(filter.labelKey) }}</span>
          </div>
        </div>
      </div>

      <!-- 套餐列表 -->

      <div class="plans-wrapper">
        <!-- 无结果提示 -->

        <div
          class="no-plans-message"
          v-if="!loading.plans && filteredPlans.length === 0"
        >
          <IconInfoCircle :size="48" class="info-icon" />

          <h3>{{ $t("shop.no_plans_found") }}</h3>

          <p>{{ $t("shop.try_different_filter") }}</p>

          <button class="btn-reset-filter" @click="selectedFilter = 'all'">
            {{ $t("shop.reset_filter") }}
          </button>
        </div>

        <!-- 骨架屏加载动画 -->

        <div
          class="dashboard-card"
          v-else-if="loading.plans"
          v-for="i in 3"
          :key="'skeleton-' + i"
        >
          <div class="skeleton-card">
            <div class="skeleton-header"></div>

            <div class="skeleton-body">
              <div class="skeleton-price"></div>

              <div class="skeleton-features">
                <div
                  class="skeleton-feature"
                  v-for="j in 5"
                  :key="'feature-' + j"
                ></div>
              </div>

              <div class="skeleton-button"></div>
            </div>
          </div>
        </div>

        <!-- 套餐卡片 修改内容 -->

        <div
          class="plan-card"
          v-else
          v-for="plan in filteredPlans"
          :key="plan.id"
        >
          <div class="card-header">
            <h2 class="card-title">{{ plan.name }}</h2>
            <span v-if="isCurrentPlan(plan)" class="current-plan-badge">{{ $t("shop.plan.current") }}</span>

            <div
              class="card-badge glassmorphism stock-warning"
              v-else-if="
                plan.capacity_limit > 0 &&
                plan.capacity_limit < SHOP_CONFIG.lowStockThreshold
              "
            >
              <IconBox :size="16" class="badge-icon" />

              <span>{{ $t("shop.plan.stock.warning") }}</span>
            </div>

            <div
              class="card-badge glassmorphism stock-danger"
              v-if="plan.capacity_limit === 0"
            >
              <IconBox :size="16" class="badge-icon" />

              <span>{{ $t("shop.plan.stock.sold_out") }}</span>
            </div>
          </div>

          <div class="card-body">
            <!-- 价格区域 - 修改为显示支持的所有周期 -->

            <div class="plan-price">
              <div class="price-display">
                <span class="currency">{{ currencySymbol }}</span>

                <span class="amount">{{ getPlanMainPrice(plan) }}</span>

                <span class="period">{{
                  $t(
                    `shop.plan.periods.${getPriceTypeKey(
                      getDisplayPriceType(plan)
                    )}`
                  )
                }}</span>
              </div>

              <!-- 支持的周期标签 - 改进显示效果 -->

              <div class="supported-periods" v-if="!SHOP_CONFIG.hidePeriodTabs">
                <div class="period-labels">
                  <span
                    v-for="(price, type) in getPlanPrices(plan)"
                    :key="type"
                    class="period-tag"
                    :class="{
                      active: getDisplayPriceType(plan) === type,

                      disabled: price === null,
                    }"
                    @click="
                      price !== null && selectPlanPriceType(plan.id, type)
                    "
                  >
                    <IconCheck v-if="price !== null" class="tag-icon check" />

                    <IconX v-else class="tag-icon error" />

                    {{ $t(`shop.plan.price_options.${getPriceTypeKey(type)}`) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 周期折扣计算 -->

            <div
              class="discount-calculation"
              v-if="
                SHOP_CONFIG.enableDiscountCalculation &&
                calculateDiscount(plan).showDiscount
              "
            >
              <div class="discount-info">
                <span class="period-name">{{
                  calculateDiscount(plan).periodName
                }}</span>

                <span class="discount-label"
                  >&nbsp;{{ $t("shop.plan.discount.relative") }}
                </span>

                <span class="discount-value"
                  >&nbsp;{{ calculateDiscount(plan).discountPercentage }}%</span
                >

                <span class="saving-text"
                  >，{{ $t("shop.plan.discount.savings") }}
                </span>

                <span class="saving-amount"
                  >&nbsp;{{ currencySymbol
                  }}{{ calculateDiscount(plan).savingsAmount }}</span
                >
              </div>
            </div>

            <!-- 套餐特性 -->

            <div class="plan-features">
              <!-- JSON格式内容 -->

              <template v-if="isJsonContent(plan.content)">
                <div
                  class="feature-item"
                  v-for="(feature, index) in parseJsonContent(plan.content)"
                  :key="index"
                >
                  <IconCheck
                    v-if="feature.support"
                    class="feature-icon enabled"
                  />

                  <IconX v-else class="feature-icon disabled" />

                  <span :class="{ 'disabled-text': !feature.support }">{{
                    feature.feature
                  }}</span>
                </div>
              </template>

              <!-- HTML格式内容 -->

              <div v-else class="html-content" v-html="plan.content"></div>
            </div>

            <!-- 购买按钮 -->

            <button
              class="btn-purchase glassmorphism"
              :class="{ 'btn-disabled': plan.capacity_limit === 0 }"
              @click="purchasePlan(plan)"
              :disabled="plan.capacity_limit === 0"
            >
              <IconShoppingCart class="btn-icon" />

              <span class="btn-text">{{ getPurchaseButtonText(plan) }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<script>
import { ref, reactive, onMounted, computed, watch, nextTick } from "vue";

import { useI18n } from "vue-i18n";

import { useToast } from "@/composables/useToast";

import { fetchPlans, getCommConfig } from "@/api/shop";
import { getSubscribe } from "@/api/dashboard";

import { SHOP_CONFIG } from "@/utils/baseConfig";


import {
  IconCheck,
  IconX,
  IconShoppingCart,
  IconBox,
  IconInfoCircle,
  IconCircle,
  IconCircleCheck,
} from "@tabler/icons-vue";

import { useRouter } from "vue-router";

export default {
  name: "ShopView",

  components: {
  
  
  
  
    IconCheck,

    IconX,

    IconShoppingCart,

    IconBox,

    IconInfoCircle,

    IconCircle,

    IconCircleCheck
  },

  setup() {
    const { t, locale } = useI18n();

    const { showToast } = useToast();

    const router = useRouter();
    const RECURRING_PERIOD_TYPES = [
      "month_price",
      "quarter_price",
      "half_year_price",
      "year_price",
      "two_year_price",
      "three_year_price",
    ];

    const initFilterFromRoute = () => {
      const qf = router.currentRoute.value.query.filter;
      if (!qf) return;
      if (qf === "all" || RECURRING_PERIOD_TYPES.includes(qf)) {
        selectedFilter.value = qf;
      }
    };

    const loading = reactive({
      plans: true,

      config: true,
    });

    const plans = ref([]);

    const currency = ref("CNY");

    const currencySymbol = ref("¥");

    const selectedPriceType = reactive({});
    const currentPlanId = ref(null);
    const currentSubscription = reactive({
      planName: "",
      expireDate: "",
      totalTraffic: "--",
      usedTraffic: "--",
      transferEnable: 0,
      speedLimit: 0,
    });

    const paymentMethods = ref([]);

    const selectedFilter = ref("all");

    const filterToggle = ref(null);

    const filters = computed(() => {
      const periodFilters = RECURRING_PERIOD_TYPES
        .filter((type) => plans.value.some((plan) => hasPeriodPrice(plan, type)))
        .map((type) => ({
          value: type,
          labelKey: `shop.plan.price_options.${getPriceTypeKey(type)}`,
        }));

      return [
        { value: "all", labelKey: "shop.filter.all" },
        ...periodFilters,
      ];
    });

    const currentLanguage = computed(() => locale.value);

    const setFilter = (filter) => {
      selectedFilter.value = filter;
    };

    const getPlanMainPriceType = (plan) => {
      const priceTypes = SHOP_CONFIG.periodOrder || [
        "three_year_price",
        "two_year_price",
        "year_price",
        "half_year_price",
        "quarter_price",
        "month_price",
        "onetime_price",
      ];

      const recurringTypes = priceTypes.filter(
        (type) => type !== "onetime_price"
      );

      const defaultRecurring = recurringTypes.find(
        (type) => plan[type] !== null
      );

      if (defaultRecurring) {
        return defaultRecurring;
      }

      if (plan.onetime_price !== null) {
        return "onetime_price";
      }

      return priceTypes.find((type) => plan[type] !== null) || priceTypes[0];
    };

    const getPlanMainPrice = (plan) => {
      const priceType = getDisplayPriceType(plan);

      if (
        !priceType ||
        plan[priceType] === null ||
        plan[priceType] === undefined
      ) {
        return "--";
      }

      return (plan[priceType] / 100).toFixed(2);
    };

    watch(
      () => filters.value,
      (nextFilters) => {
        const validFilterValues = nextFilters.map((filter) => filter.value);
        if (!validFilterValues.includes(selectedFilter.value)) {
          selectedFilter.value = "all";
        }
      },
      { immediate: true }
    );

    watch(
      () => router.currentRoute.value.query.filter,
      () => {
        initFilterFromRoute();
      }
    );

    watch(
      () => currentLanguage.value,
      (newLanguage, oldLanguage) => {
        if (!oldLanguage || newLanguage === oldLanguage) {
          return;
        }

        fetchPlanData();
      }
    );

    onMounted(() => {
      initFilterFromRoute();
    });

    const formatTraffic = (bytes) => {
      const value = Number(bytes || 0);
      if (!Number.isFinite(value) || value <= 0) return "0 B";
      const units = ["B", "KB", "MB", "GB", "TB"];
      let size = value;
      let idx = 0;
      while (size >= 1024 && idx < units.length - 1) {
        size /= 1024;
        idx += 1;
      }
      return `${size.toFixed(size >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
    };

    const fetchCurrentSubscription = async () => {
      try {
        const response = await getSubscribe();
        const data = response?.data || {};
        currentPlanId.value = data.plan_id || data.plan?.id || null;
        currentSubscription.planName = data.plan?.name || "";
        currentSubscription.expireDate = data.expired_at ? new Date(data.expired_at * 1000).toLocaleDateString() : "";
        currentSubscription.totalTraffic = formatTraffic(data.transfer_enable);
        currentSubscription.usedTraffic = formatTraffic(data.u + data.d);
        currentSubscription.transferEnable = Number(data.transfer_enable || 0);
        currentSubscription.speedLimit = Number(data.plan?.speed_limit || 0);
      } catch (error) {
        console.error('Failed to fetch current subscription:', error);
      }
    };

    const isCurrentPlan = (plan) => Number(plan?.id) === Number(currentPlanId.value);

    const isTrafficPackagePlan = (plan) => isOnetimeOnly(plan);

    const currentPlan = computed(() => {
      return plans.value.find((plan) => isCurrentPlan(plan)) || null;
    });

    const currentComparePeriod = computed(() => {
      if (!currentPlan.value) return "";
      if (RECURRING_PERIOD_TYPES.includes(selectedFilter.value) && hasPeriodPrice(currentPlan.value, selectedFilter.value)) {
        return selectedFilter.value;
      }
      return getDisplayPriceType(currentPlan.value);
    });

    const getPriceByPeriod = (plan, periodType) => {
      if (!plan || !periodType) return null;
      const value = Number(plan[periodType]);
      return Number.isFinite(value) && value > 0 ? value : null;
    };

    const hasPeriodPrice = (plan, periodType) => getPriceByPeriod(plan, periodType) !== null;

    const isSameSpecPlan = (plan) => {
      if (isCurrentPlan(plan)) return true;

      const periodType = currentComparePeriod.value;
      const currentPrice = getPriceByPeriod(currentPlan.value, periodType);
      const targetPrice = getPriceByPeriod(plan, periodType);

      if (currentPrice === null || targetPrice === null) return false;
      return targetPrice === currentPrice;
    };

    const isHigherSpecPlan = (plan) => {
      if (!currentPlanId.value || isTrafficPackagePlan(plan)) return false;
      if (isCurrentPlan(plan) || isSameSpecPlan(plan)) return false;

      const periodType = currentComparePeriod.value;
      const currentPrice = getPriceByPeriod(currentPlan.value, periodType);
      const targetPrice = getPriceByPeriod(plan, periodType);

      if (currentPrice === null || targetPrice === null) return false;
      return targetPrice > currentPrice;
    };

    const getPurchaseButtonText = (plan) => {
      if (plan.capacity_limit === 0) return t("shop.plan.sold_out_btn");
      if (isTrafficPackagePlan(plan)) return t("shop.plan.add_quota");
      if (!currentPlanId.value) return t("shop.plan.purchase");
      if (isCurrentPlan(plan) || isSameSpecPlan(plan)) return t("shop.plan.renew");
      if (isHigherSpecPlan(plan)) return t("shop.plan.upgrade_to", { name: plan.name });
      return t("shop.plan.purchase");
    };

    const fetchPlanData = async () => {
      loading.plans = true;

      try {
        const response = await fetchPlans(currentLanguage.value);

        if (response.data) {
          plans.value = response.data;

          Object.keys(selectedPriceType).forEach((key) => {
            delete selectedPriceType[key];
          });

          if (SHOP_CONFIG.autoSelectMaxPeriod) {
            nextTick(() => {
              plans.value.forEach((plan) => {
                const priceTypes = SHOP_CONFIG.periodOrder || [
                  "three_year_price",
                  "two_year_price",
                  "year_price",
                  "half_year_price",
                  "quarter_price",
                  "month_price",
                  "onetime_price",
                ];

                const recurringTypes = priceTypes.filter(
                  (type) => type !== "onetime_price"
                );

                const defaultRecurring = recurringTypes.find(
                  (type) => plan[type] !== null
                );

                if (defaultRecurring) {
                  selectedPriceType[plan.id] = defaultRecurring;
                } else if (plan.onetime_price !== null) {
                  selectedPriceType[plan.id] = "onetime_price";
                } else {
                  selectedPriceType[plan.id] =
                    priceTypes.find((type) => plan[type] !== null) ||
                    priceTypes[0];
                }
              });
            });
          } else {
          }
        }
      } catch (error) {
        showToast(t("shop.failed_to_fetch_plan"), "error");
      } finally {
        loading.plans = false;
      }
    };

    const fetchConfig = async () => {
      loading.config = true;

      try {
        const response = await getCommConfig();

        if (response.data) {
          currency.value = response.data.currency || "CNY";

          currencySymbol.value = response.data.currency_symbol || "¥";
        }
      } catch (error) {
        console.error("Failed to fetch system config:", error);
      } finally {
        loading.config = false;
      }
    };

    const getPlanPrices = (plan) => {
      const priceTypes = SHOP_CONFIG.periodOrder || [
        "three_year_price",
        "two_year_price",
        "year_price",
        "half_year_price",
        "quarter_price",
        "month_price",
        "onetime_price",
      ];

      const result = {};

      priceTypes.forEach((type) => {
        if (plan[type] !== null && plan[type] !== undefined) {
          result[type] = plan[type];
        }
      });

      return result;
    };

    const getPriceTypeKey = (type) => {
      const keyMap = {
        month_price: "month",

        quarter_price: "quarter",

        half_year_price: "half_year",

        year_price: "year",

        two_year_price: "two_year",

        three_year_price: "three_year",

        onetime_price: "onetime",
      };

      return keyMap[type] || "";
    };

    const selectPriceType = (planId, type) => {
      selectedPriceType[planId] = type;
    };

    const getSelectedPrice = (plan) => {
      const type = selectedPriceType[plan.id];

      if (plan[type] === null) return "--";

      return (plan[type] / 100).toFixed(2);
    };

    const isJsonContent = (content) => {
      if (!content) return false;

      try {
        const parsed = JSON.parse(content);

        return (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          Object.prototype.hasOwnProperty.call(parsed[0], "feature")
        );
      } catch (e) {
        return false;
      }
    };

    const parseJsonContent = (content) => {
      try {
        return JSON.parse(content);
      } catch (e) {
        return [];
      }
    };

    const purchasePlan = (plan) => {
      if (plan.capacity_limit === 0) {
        showToast(t("shop.plan.stock.sold_out"), "error");

        return;
      }

      const priceType = getDisplayPriceType(plan);

      router.push({
        path: "order-confirm",

        query: {
          id: plan.id,

          period: priceType,
        },
      });
    };

    const visiblePlans = computed(() => plans.value.filter((plan) => !isOnetimeOnly(plan)));

    const filteredPlans = computed(() => {
      if (selectedFilter.value === "all") {
        return visiblePlans.value;
      }

      if (RECURRING_PERIOD_TYPES.includes(selectedFilter.value)) {
        return visiblePlans.value.filter((plan) => hasPeriodPrice(plan, selectedFilter.value));
      }

      return visiblePlans.value;
    });

    const hasRecurringPrice = (plan) => {
      return RECURRING_PERIOD_TYPES.some((type) => hasPeriodPrice(plan, type));
    };

    const isOnetimeOnly = (plan) => {
      return hasPeriodPrice(plan, "onetime_price") && !hasRecurringPrice(plan);
    };

    const selectPlanPriceType = (planId, type) => {
      const plan = plans.value.find((p) => p.id === planId);

      if (plan && plan[type] !== null) {
        selectedPriceType[planId] = type;
      }
    };

    const getDisplayPriceType = (plan) => {
      if (RECURRING_PERIOD_TYPES.includes(selectedFilter.value) && hasPeriodPrice(plan, selectedFilter.value)) {
        return selectedFilter.value;
      }

      if (selectedPriceType[plan.id] && hasPeriodPrice(plan, selectedPriceType[plan.id])) {
        return selectedPriceType[plan.id];
      }

      if (SHOP_CONFIG.autoSelectMaxPeriod) {
        return getPlanMainPriceType(plan);
      }

      const availableRecurring = RECURRING_PERIOD_TYPES.filter((type) => hasPeriodPrice(plan, type));
      if (availableRecurring.length > 0) {
        return availableRecurring[0];
      }

      return hasPeriodPrice(plan, "onetime_price") ? "onetime_price" : "";
    };

    onMounted(async () => {
      try {
        loading.plans = true;

        await Promise.all([fetchPlanData(), fetchConfig(), fetchCurrentSubscription()]);

        loading.plans = false;

      } catch (error) {
        console.error("Failed to load shop data:", error);

        loading.plans = false;
      }
    });

    const calculateDiscount = (plan) => {
      if (!plan.month_price) {
        return {
          showDiscount: false,
          periodName: "",
          discountPercentage: 0,
          savingsAmount: 0,
        };
      }

      const monthlyPrice = plan.month_price / 100;

      const availablePeriods = [
        {
          type: "three_year_price",
          price: plan.three_year_price ? plan.three_year_price / 100 : null,
          months: 36,
          name: t("shop.plan.price_options.three_year"),
        },

        {
          type: "two_year_price",
          price: plan.two_year_price ? plan.two_year_price / 100 : null,
          months: 24,
          name: t("shop.plan.price_options.two_year"),
        },

        {
          type: "year_price",
          price: plan.year_price ? plan.year_price / 100 : null,
          months: 12,
          name: t("shop.plan.price_options.year"),
        },

        {
          type: "half_year_price",
          price: plan.half_year_price ? plan.half_year_price / 100 : null,
          months: 6,
          name: t("shop.plan.price_options.half_year"),
        },

        {
          type: "quarter_price",
          price: plan.quarter_price ? plan.quarter_price / 100 : null,
          months: 3,
          name: t("shop.plan.price_options.quarter"),
        },
      ].filter((period) => period.price !== null);

      if (availablePeriods.length === 0) {
        return {
          showDiscount: false,
          periodName: "",
          discountPercentage: 0,
          savingsAmount: 0,
        };
      }

      const selectedPeriod = availablePeriods[0];

      const totalMonthlyPrice = monthlyPrice * selectedPeriod.months;

      const discountPercentage =
        ((totalMonthlyPrice - selectedPeriod.price) / totalMonthlyPrice) * 100;

      const savingsAmount = (totalMonthlyPrice - selectedPeriod.price).toFixed(
        2
      );

      return {
        showDiscount: discountPercentage > 1,

        periodName: selectedPeriod.name,

        discountPercentage: discountPercentage.toFixed(0),
        savingsAmount: savingsAmount,
      };
    };

    return {
      plans,

      loading,

      currency,

      currencySymbol,

      paymentMethods,

      selectedPriceType,

      selectedFilter,

      filteredPlans,

      getPlanPrices,

      getPriceTypeKey,

      selectPriceType,

      getSelectedPrice,

      isJsonContent,

      parseJsonContent,

      purchasePlan,

      filterToggle,

      filters,

      setFilter,

      getPlanMainPrice,

      getPlanMainPriceType,

      currentLanguage,

      selectPlanPriceType,

      getDisplayPriceType,
      getPurchaseButtonText,
      currentSubscription,

      SHOP_CONFIG,

      calculateDiscount,
      isCurrentPlan,
    };
  },
};
</script>

<style lang="scss" scoped>
.shop-container {
  padding: 20px;

  display: flex;

  justify-content: center;

  .shop-inner {
    width: 100%;

    max-width: 1200px;
  }

  .welcome-card {
    margin-bottom: 24px;

    .plan-summary {
      margin-top: 12px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 10px;

      .plan-summary-item {
        background: rgba(var(--theme-color-rgb), 0.08);
        border: 1px solid rgba(var(--theme-color-rgb), 0.2);
        border-radius: 10px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;

        .label {
          color: var(--text-muted);
          font-size: 12px;
        }

        strong {
          color: var(--text-color);
          font-size: 14px;
        }
      }
    }
  }

  .dashboard-card {
    background-color: var(--card-bg-color);

    border-radius: 12px;

    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

    padding: 20px;

    margin-bottom: 24px;

    border: 1px solid var(--border-color);

    transition: all 0.3s ease;

    position: relative;

    &:hover {
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);

      border-color: rgba(var(--theme-color-rgb), 0.3);
    }

    .card-header {
      display: flex;

      justify-content: space-between;

      align-items: flex-start;

      margin-bottom: 15px;

      .card-title {
        font-size: 18px;

        font-weight: 600;

        margin: 0;

        word-wrap: break-word;

        overflow-wrap: break-word;

        hyphens: auto;

        flex: 1;

        padding-right: 10px;
      }

  .current-plan-badge {
    margin-top: 8px;
    display: inline-flex;
    font-size: 12px;
    color: #1d4ed8;
    background: rgba(59, 130, 246, 0.12);
    border: 1px solid rgba(59, 130, 246, 0.25);
    border-radius: 999px;
    padding: 2px 8px;
  }

      .card-badge {
        display: flex;

        align-items: center;

        padding: 4px 12px;

        border-radius: 20px;

        font-size: 12px;

        font-weight: 500;

        margin-left: 8px;

        white-space: nowrap;

        flex-shrink: 0;

        &.glassmorphism {
          backdrop-filter: blur(8px);

          -webkit-backdrop-filter: blur(8px);

          border: 1px solid rgba(255, 255, 255, 0.1);

          will-change: backdrop-filter, background-color, color;

          transition: background-color 0.3s ease, color 0.3s ease,
            border-color 0.3s ease;

          &.stock-plenty {
            background-color: rgba(76, 175, 80, 0.2);

            border-color: rgba(76, 175, 80, 0.1);

            color: #4caf50;
          }

          &.stock-warning {
            background-color: rgba(255, 152, 0, 0.2);

            border-color: rgba(255, 152, 0, 0.1);

            color: #ff9800;
          }

          &.stock-danger {
            background-color: rgba(244, 67, 54, 0.2);

            border-color: rgba(244, 67, 54, 0.1);

            color: #f44336;
          }
        }

        .badge-icon {
          margin-right: 4px;
        }
      }
    }
  }

  .skeleton-card {
    width: 100%;

    height: 100%;

    .skeleton-header,
    .skeleton-price,
    .skeleton-feature,
    .skeleton-button {
      position: relative;

      overflow: hidden;

      &::after {
        content: "";

        position: absolute;

        top: 0;

        right: 0;

        bottom: 0;

        left: 0;

        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0%,

          rgba(255, 255, 255, 0.15) 50%,

          rgba(255, 255, 255, 0) 100%
        );

        transform: translateX(-100%);

        animation: shimmer 2.5s infinite;
      }
    }

    .skeleton-header {
      height: 24px;

      background-color: rgba(0, 0, 0, 0.05);

      border-radius: 4px;

      margin-bottom: 20px;

      width: 60%;
    }

    .skeleton-body {
      .skeleton-price {
        height: 60px;

        background-color: rgba(0, 0, 0, 0.05);

        border-radius: 8px;

        margin-bottom: 24px;
      }

      .skeleton-features {
        margin-bottom: 24px;

        .skeleton-feature {
          height: 16px;

          background-color: rgba(0, 0, 0, 0.05);

          border-radius: 4px;

          margin-bottom: 12px;

          &:nth-child(1) {
            width: 90%;
          }

          &:nth-child(2) {
            width: 80%;
          }

          &:nth-child(3) {
            width: 85%;
          }

          &:nth-child(4) {
            width: 75%;
          }

          &:nth-child(5) {
            width: 70%;
          }
        }
      }

      .skeleton-button {
        height: 48px;

        background-color: rgba(0, 0, 0, 0.05);

        border-radius: 8px;
      }
    }
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }

    100% {
      transform: translateX(100%);
    }
  }

  @keyframes pulse {
    0% {
      opacity: 0.6;
    }

    50% {
      opacity: 0.3;
    }

    100% {
      opacity: 0.6;
    }
  }



  .plans-wrapper {
    display: grid;

    grid-template-columns: repeat(3, 1fr);

    gap: 24px;

    margin-bottom: 24px;

    @media (max-width: 1200px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }

    .dashboard-card {
      border-radius: 16px;

      overflow: hidden;
    }

    .plan-card {
      background-color: var(--card-bg-color);

      border-radius: 16px;

      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

      padding: 24px;

      border: 1px solid var(--border-color);

      transition: all 0.3s ease;

      position: relative;

      display: flex;

      flex-direction: column;

      height: auto;

      &:hover {
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);

        border-color: rgba(var(--theme-color-rgb), 0.3);

        transform: translateY(-5px);
      }

      .card-header {
        display: flex;

        justify-content: space-between;

        align-items: flex-start;

        margin-bottom: 15px;

        .card-title {
          font-size: 18px;

          font-weight: 600;

          margin: 0;

          word-wrap: break-word;

          overflow-wrap: break-word;

          hyphens: auto;

          flex: 1;

          padding-right: 10px;
        }

        .card-badge {
          display: flex;

          align-items: center;

          padding: 4px 12px;

          border-radius: 20px;

          font-size: 12px;

          font-weight: 500;

          margin-left: 8px;

          white-space: nowrap;

          flex-shrink: 0;

          &.glassmorphism {
            backdrop-filter: blur(8px);

            -webkit-backdrop-filter: blur(8px);

            border: 1px solid rgba(255, 255, 255, 0.1);

            will-change: backdrop-filter, background-color, color;

            transition: background-color 0.3s ease, color 0.3s ease,
              border-color 0.3s ease;

            &.stock-plenty {
              background-color: rgba(76, 175, 80, 0.2);

              border-color: rgba(76, 175, 80, 0.1);

              color: #4caf50;
            }

            &.stock-warning {
              background-color: rgba(255, 152, 0, 0.2);

              border-color: rgba(255, 152, 0, 0.1);

              color: #ff9800;
            }

            &.stock-danger {
              background-color: rgba(244, 67, 54, 0.2);

              border-color: rgba(244, 67, 54, 0.1);

              color: #f44336;
            }
          }

          .badge-icon {
            margin-right: 4px;
          }
        }
      }

      .card-body {
        position: relative;

        flex: 1;

        display: flex;

        flex-direction: column;
      }
    }

    .plan-price {
      margin: 24px 0;

      padding: 0 4px;

      .price-display {
        text-align: center;

        margin-bottom: 12px;

        .currency {
          font-size: 24px;

          font-weight: 500;

          color: var(--text-color);
        }

        .amount {
          font-size: 48px;

          font-weight: 700;

          color: var(--text-color);
        }

        .period {
          font-size: 16px;

          color: var(--secondary-text-color);
        }
      }

      .supported-periods {
        margin-top: 15px;

        .period-labels {
          display: flex;

          justify-content: center;

          flex-wrap: wrap;

          gap: 6px;

          .period-tag {
            padding: 5px 10px;

            border-radius: 6px;

            font-size: 12px;

            background-color: rgba(var(--border-color-rgb), 0.1);

            color: var(--secondary-text-color);

            font-weight: 500;

            cursor: pointer;

            transition: all 0.3s ease;

            border: 1px solid transparent;

            display: flex;

            align-items: center;

            .tag-icon {
              margin-right: 4px;

              width: 14px;

              height: 14px;

              &.check {
                color: #4caf50;
              }

              &.error {
                color: #f44336;
              }
            }

            &:hover:not(.disabled) {
              background-color: rgba(var(--theme-color-rgb), 0.08);

              color: var(--text-color);
            }

            &.active {
              background-color: rgba(var(--theme-color-rgb), 0.1);

              color: var(--text-color);

              border-color: rgba(var(--theme-color-rgb), 0.2);
            }

            &.disabled {
              opacity: 0.5;

              cursor: default;
            }
          }
        }
      }
    }

    .discount-calculation {
      margin: 5px 0 15px 0;

      padding: 8px 12px;

      background-color: rgba(var(--theme-color-rgb), 0.05);

      border-radius: 8px;

      .discount-info {
        font-size: 14px;

        text-align: center;

        color: var(--text-color);

        .period-name {
          font-weight: 700;

          color: var(--theme-color);
        }

        .discount-label {
          font-weight: 500;

          &::first-line,
          &:first-child {
            color: var(--theme-color);

            font-weight: 700;
          }
        }

        .discount-value {
          font-weight: 700;

          color: var(--theme-color);
        }

        .saving-text {
          font-weight: 400;
        }

        .saving-amount {
          font-weight: 700;

          color: var(--theme-color);
        }
      }
    }

    .plan-features {
      margin: 24px 0 10px 0;

      padding: 0 4px;

      .feature-item {
        display: flex;

        align-items: flex-start; // 改为 flex-start 以便长文本时对齐更好

        margin-bottom: 12px;

        .feature-icon {
          width: 20px;

          height: 20px;

          min-width: 20px; // 添加最小宽度防止收缩

          min-height: 20px; // 添加最小高度防止收缩

          margin-right: 8px;

          flex-shrink: 0; // 防止图标被压缩

          margin-top: 1px; // 微调垂直对齐

          &.enabled {
            color: var(--theme-color);
          }

          &.disabled {
            color: #ccc;
          }
        }

        span {
          font-size: 14px;

          color: var(--text-color);

          line-height: 1.5; // 添加行高改善可读性

          word-wrap: break-word; // 允许长单词换行

          overflow-wrap: break-word; // 更好的换行支持

          flex: 1; // 占据剩余空间

          &.disabled-text {
            color: #999;
          }
        }
      }

      .html-content {
        font-size: 14px;

        line-height: 1.6;

        color: var(--text-color);
      }
    }
  }

  .btn-purchase {
    position: relative;

    bottom: auto;

    left: auto;

    height: 40px;

    width: auto;

    min-width: 120px;

    display: flex;

    align-items: center;

    justify-content: center;

    gap: 8px;

    color: white;

    border: none;

    border-radius: 8px;

    font-size: 14px;

    font-weight: 500;

    cursor: pointer;

    transition: all 0.3s ease;

    padding: 0 16px;

    margin-top: 12px;

    align-self: flex-start;

    &.glassmorphism {
      background-color: rgba(var(--theme-color-rgb), 0.85);

      backdrop-filter: blur(8px);

      -webkit-backdrop-filter: blur(8px);

      border: 1px solid rgba(var(--theme-color-rgb), 0.3);

      box-shadow: 0 8px 20px rgba(var(--theme-color-rgb), 0.25);
    }

    &:hover {
      transform: translateY(-2px);

      box-shadow: 0 10px 25px rgba(var(--theme-color-rgb), 0.35);

      background-color: rgba(var(--theme-color-rgb), 0.95);
    }

    &.btn-disabled {
      background-color: rgba(150, 150, 150, 0.5);

      backdrop-filter: blur(8px);

      -webkit-backdrop-filter: blur(8px);

      cursor: not-allowed;

      box-shadow: none;

      border: 1px solid rgba(150, 150, 150, 0.3);

      &:hover {
        transform: none;

        box-shadow: none;
      }
    }

    .btn-icon {
      width: 18px;

      height: 18px;
    }
  }

  .dark-theme {
    .skeleton-header,
    .skeleton-price,
    .skeleton-feature,
    .skeleton-button {
      background-color: rgba(255, 255, 255, 0.08);

      &::after {
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0%,

          rgba(255, 255, 255, 0.05) 50%,

          rgba(255, 255, 255, 0) 100%
        );
      }
    }

    .card-badge.glassmorphism {
      &.stock-plenty {
        background-color: rgba(76, 175, 80, 0.1);
      }

      &.stock-warning {
        background-color: rgba(255, 152, 0, 0.1);
      }

      &.stock-danger {
        background-color: rgba(244, 67, 54, 0.1);
      }
    }
  }

  .filter-toggle-container {
    margin-bottom: 30px;

    display: flex;

    justify-content: center;

    .filter-toggle-wrapper {
      background: rgba(var(--card-background-rgb, 255, 255, 255), 0.7);

      backdrop-filter: blur(12px);

      -webkit-backdrop-filter: blur(12px);

      border-radius: 18px;

      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);

      padding: 8px 20px;

      border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));

      display: flex;

      flex-wrap: wrap;

      justify-content: center;

      gap: 15px;

      max-width: 600px;

      will-change: backdrop-filter, background-color;

      transition: background-color 0.3s ease;

      .filter-option {
        display: flex;

        align-items: center;

        cursor: pointer;

        transition: all 0.3s ease;

        padding: 6px 10px;

        border-radius: 12px;

        &:hover {
          background-color: rgba(var(--theme-color-rgb), 0.05);
        }

        &.active {
          background-color: rgba(var(--theme-color-rgb), 0.08);

          .option-icon {
            color: var(--theme-color);
          }

          .option-text {
            color: var(--text-color);

            font-weight: 600;
          }
        }

        .option-icon {
          margin-right: 6px;

          display: flex;

          align-items: center;

          color: var(--secondary-text-color);

          transition: color 0.3s ease;

          svg {
            width: 18px;

            height: 18px;
          }
        }

        .option-text {
          font-size: 14px;

          color: var(--secondary-text-color);

          transition: color 0.3s ease;
        }
      }
    }
  }

  .no-plans-message {
    grid-column: 1 / -1;

    background-color: var(--card-bg-color);

    border-radius: 12px;

    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

    padding: 40px 20px;

    margin-bottom: 24px;

    border: 1px solid var(--border-color);

    text-align: center;

    .info-icon {
      color: var(--theme-color);

      opacity: 0.7;

      margin-bottom: 16px;
    }

    h3 {
      font-size: 18px;

      font-weight: 600;

      margin: 0 0 10px;

      color: var(--text-color);
    }

    p {
      color: var(--secondary-text-color);

      margin-bottom: 24px;
    }

    .btn-reset-filter {
      padding: 8px 20px;

      background-color: var(--theme-color);

      color: white;

      border: none;

      border-radius: 8px;

      font-size: 14px;

      font-weight: 500;

      cursor: pointer;

      transition: all 0.3s ease;

      &:hover {
        background-color: var(--primary-color-hover);

        transform: translateY(-2px);
      }
    }
  }

  .animate-card {
    position: relative;

    overflow: hidden;

    &::after {
      content: "";

      position: absolute;

      top: 0;

      left: -100%;

      width: 50%;

      height: 100%;

      background: linear-gradient(
        to right,

        rgba(255, 255, 255, 0) 0%,

        rgba(255, 255, 255, 0.2) 50%,

        rgba(255, 255, 255, 0) 100%
      );

      animation: shimmer 3s infinite;

      transform: skewX(-25deg);
    }
  }

  @keyframes shimmer {
    0% {
      left: -100%;
    }

    100% {
      left: 200%;
    }
  }
}

@media (max-width: 768px) {
  .shop-container {
    padding: 15px;

    padding-bottom: 80px;

    .plans-wrapper {
      grid-template-columns: 1fr;
    }
  }

  .shop-container .filter-toggle-container {
    .filter-toggle-wrapper {
      width: 100%;

      max-width: 100%;

      padding: 10px;

      flex-direction: row;

      justify-content: space-around;

      gap: 5px;

      border-radius: 14px;

      .filter-option {
        padding: 8px 10px;

        flex: 1;

        justify-content: center;

        min-width: 80px;

        .option-icon {
          margin-right: 4px;

          svg {
            width: 16px;

            height: 16px;
          }
        }

        .option-text {
          font-size: 12px;

          white-space: nowrap;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .shop-container .filter-toggle-container {
    .filter-toggle-wrapper {
      padding: 8px;

      .filter-option {
        padding: 6px 8px;

        min-width: auto;

        .option-icon {
          margin-right: 3px;
        }
      }
    }
  }
}
</style>
