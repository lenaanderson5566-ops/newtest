<template>
  <div class="shop-container">
    <div class="shop-inner">
      <!-- 欢迎卡片 -->

      <div class="dashboard-card welcome-card">
        <div class="card-header shop-title-header">
          <h2 class="card-title">{{ $t("shop.title") }}</h2>
          <div class="filter-toggle-container" v-if="filters.length > 0">
            <div class="filter-toggle-wrapper" role="tablist" aria-label="billing period">
              <button
                v-for="filter in filters"
                :key="`${filter.value}-${currentLanguage}`"
                type="button"
                class="filter-option"
                :class="{ active: selectedFilter === filter.value }"
                @click="setFilter(filter.value)"
              >
                <span class="option-text">{{ getFilterDisplayLabel(filter) }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="card-body">
          <p>{{ $t("shop.description") }}</p>
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

          <button class="btn-reset-filter" @click="selectedFilter = fallbackFilterValue">
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
          :class="{ 'current-plan-card': isCurrentPlan(plan) }"
          v-else
          v-for="plan in filteredPlans"
          :key="plan.id"
        >
          <div class="card-header">
            <div class="header-main">
              <h2 class="card-title">{{ plan.name }}</h2>
            </div>

            <div v-if="isCurrentPlan(plan)" class="current-plan-meta">
              <span class="current-plan-badge">{{ currentPlanBadgeLabel }}</span>
            </div>

            <div
              class="card-badge glassmorphism stock-warning"
              v-if="
                !isCurrentPlan(plan) &&
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
                <div class="price-main-line">
                  <span class="currency">{{ currencySymbol }}</span>
                  <span class="amount">{{ getPlanMainPrice(plan) }}</span>
                </div>
                <span class="unit-line">{{ currency }} {{ $t(`shop.plan.periods.${getPriceTypeKey(getDisplayPriceType(plan))}`) }}</span>
              </div>
            </div>

            <button
              class="btn-purchase glassmorphism"
              :class="{ 'btn-disabled': plan.capacity_limit === 0 }"
              @click="purchasePlan(plan)"
              :disabled="plan.capacity_limit === 0"
            >
              <IconShoppingCart class="btn-icon" />
              <span class="btn-text">{{ getPurchaseButtonText(plan) }}</span>
            </button>

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
} from "@tabler/icons-vue";

import { useRouter } from "vue-router";

export default {
  name: "ShopView",

  components: {
  
  
  
  
    IconCheck,

    IconX,

    IconShoppingCart,

    IconBox,

    IconInfoCircle
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
      if (RECURRING_PERIOD_TYPES.includes(qf)) {
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

    const paymentMethods = ref([]);

    const selectedFilter = ref("month_price");

    const filterToggle = ref(null);

    const filters = computed(() => {
      return RECURRING_PERIOD_TYPES
        .filter((type) => plans.value.some((plan) => hasPeriodPrice(plan, type)))
        .map((type) => ({
          value: type,
          labelKey: `shop.plan.price_options.${getPriceTypeKey(type)}`,
        }));
    });

    const fallbackFilterValue = computed(() => {
      return filters.value[0]?.value || RECURRING_PERIOD_TYPES[0];
    });

    const currentLanguage = computed(() => locale.value);

    const currentPlanBadgeLabel = computed(() =>
      locale.value?.startsWith("zh") ? "当前套餐" : "Current Plan"
    );

    const setFilter = (filter) => {
      selectedFilter.value = filter;
    };

    const getFilterDisplayLabel = (filter) => {
      const quickLabels = {
        month_price: "每月",
        year_price: "每年",
      };
      return quickLabels[filter?.value] || t(filter?.labelKey || "");
    };

    const fetchCurrentSubscription = async () => {
      try {
        const response = await getSubscribe();
        const subscribe = response?.data || {};
        currentPlanId.value = subscribe.plan_id || subscribe.plan?.id || null;
      } catch (error) {
        console.error('Failed to fetch current subscription:', error);
        currentPlanId.value = null;
      }
    };

    const normalizePriceValue = (plan, periodType) => {
      if (!plan || !periodType) return null;
      const rawValue = plan[periodType];
      if (rawValue === null || rawValue === undefined || rawValue === "") {
        return null;
      }
      const parsed = Number(rawValue);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    };

    const hasPeriodPrice = (plan, periodType) =>
      normalizePriceValue(plan, periodType) !== null;

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

      const defaultRecurring = recurringTypes.find((type) =>
        hasPeriodPrice(plan, type)
      );

      if (defaultRecurring) {
        return defaultRecurring;
      }

      if (hasPeriodPrice(plan, "onetime_price")) {
        return "onetime_price";
      }

      return priceTypes.find((type) => hasPeriodPrice(plan, type)) || priceTypes[0];
    };

    const formatPriceNumber = (priceValue) => {
      if (priceValue === null || priceValue === undefined) return '--';
      const fixed = (priceValue / 100).toFixed(2);
      return fixed.endsWith('.00') ? fixed.slice(0, -3) : fixed;
    };

    const getPlanMainPrice = (plan) => {
      const priceType = getDisplayPriceType(plan);
      const priceValue = normalizePriceValue(plan, priceType);
      if (priceValue === null) {
        return "--";
      }

      return formatPriceNumber(priceValue);
    };

    watch(
      () => filters.value,
      (nextFilters) => {
        const validFilterValues = nextFilters.map((filter) => filter.value);
        if (!validFilterValues.includes(selectedFilter.value)) {
          selectedFilter.value = fallbackFilterValue.value;
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
      return normalizePriceValue(plan, periodType);
    };

    const getComparablePeriodType = (plan) => {
      if (RECURRING_PERIOD_TYPES.includes(selectedFilter.value)) {
        return selectedFilter.value;
      }
      return getDisplayPriceType(plan);
    };

    const isSameSpecPlan = (plan) => {
      if (!currentPlanId.value || isTrafficPackagePlan(plan)) return false;

      const periodType = getComparablePeriodType(plan);
      const currentPrice = getPriceByPeriod(currentPlan.value, periodType);
      const targetPrice = getPriceByPeriod(plan, periodType);

      if (currentPrice === null || targetPrice === null) return false;
      return targetPrice === currentPrice;
    };

    const isHigherSpecPlan = (plan) => {
      if (!currentPlanId.value || isTrafficPackagePlan(plan)) return false;

      const periodType = getComparablePeriodType(plan);
      const currentPrice = getPriceByPeriod(currentPlan.value, periodType);
      const targetPrice = getPriceByPeriod(plan, periodType);

      if (currentPrice === null || targetPrice === null) return false;
      return targetPrice > currentPrice;
    };

    const getPurchaseButtonText = (plan) => {
      if (plan.capacity_limit === 0) return t("shop.plan.sold_out_btn");
      if (isTrafficPackagePlan(plan)) return t("shop.plan.add_quota");
      if (!currentPlanId.value) return t("shop.plan.purchase");
      if (isSameSpecPlan(plan)) return t("shop.plan.renew");
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

                const defaultRecurring = recurringTypes.find((type) =>
                  hasPeriodPrice(plan, type)
                );

                if (defaultRecurring) {
                  selectedPriceType[plan.id] = defaultRecurring;
                } else if (hasPeriodPrice(plan, "onetime_price")) {
                  selectedPriceType[plan.id] = "onetime_price";
                } else {
                  selectedPriceType[plan.id] =
                    priceTypes.find((type) => hasPeriodPrice(plan, type)) ||
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
        if (hasPeriodPrice(plan, type)) {
          result[type] = normalizePriceValue(plan, type);
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
      const priceValue = normalizePriceValue(plan, type);

      if (priceValue === null) return "--";

      return formatPriceNumber(priceValue);
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
      if (RECURRING_PERIOD_TYPES.includes(selectedFilter.value)) {
        return visiblePlans.value.filter((plan) => hasPeriodPrice(plan, selectedFilter.value));
      }

      return visiblePlans.value.filter((plan) => hasPeriodPrice(plan, fallbackFilterValue.value));
    });

    const hasRecurringPrice = (plan) => {
      return RECURRING_PERIOD_TYPES.some((type) => hasPeriodPrice(plan, type));
    };

    const isOnetimeOnly = (plan) => {
      return hasPeriodPrice(plan, "onetime_price") && !hasRecurringPrice(plan);
    };

    const selectPlanPriceType = (planId, type) => {
      const plan = plans.value.find((p) => p.id === planId);

      if (plan && hasPeriodPrice(plan, type)) {
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
      fallbackFilterValue,

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
      getFilterDisplayLabel,

      getPlanMainPrice,

      getPlanMainPriceType,

      currentLanguage,
      currentPlanBadgeLabel,

      selectPlanPriceType,

      getDisplayPriceType,
      getPurchaseButtonText,
      normalizePriceValue,

      SHOP_CONFIG,

      calculateDiscount,
      isCurrentPlan,
    };
  },
};
</script>

<style lang="scss" scoped>
.shop-container {
  --shop-card-radius: var(--radius-lg);

  padding: 20px;

  display: flex;

  justify-content: center;

  .shop-inner {
    width: 100%;

    max-width: 1200px;
  }

  .welcome-card {
    border: 1px solid var(--border-color-soft);
    border-radius: var(--shop-card-radius);
    box-shadow: var(--shadow-card-sm);

    margin-bottom: 24px;

    .card-body p {
      color: var(--secondary-text-color);
      font-size: 14px;
      line-height: 1.6;
      font-weight: 500;
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

        font-weight: 700;

        margin: 0;

        word-wrap: break-word;

        overflow-wrap: break-word;

        hyphens: auto;

        flex: 1;

        padding-right: 10px;
      }

  .current-plan-meta {
    position: absolute;
    top: 18px;
    right: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    max-width: min(62%, 280px);
    pointer-events: none;
  }

  .current-plan-badge {
    display: inline-flex;
    align-items: center;
    font-size: 12px;
    line-height: 1;
    font-weight: 600;
    color: #374151;
    background: rgba(107, 114, 128, 0.12);
    border: 1px solid rgba(107, 114, 128, 0.3);
    border-radius: 999px;
    padding: 5px 10px;
    white-space: nowrap;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
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
      border-radius: var(--shop-card-radius);
      border: 1px solid var(--border-color-soft);
      box-shadow: var(--shadow-card-sm);

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

      &.current-plan-card {
        border-color: rgba(37, 99, 235, 0.28);

        border-color: rgba(59, 130, 246, 0.6);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.18), 0 10px 24px rgba(59, 130, 246, 0.12);
      }

      .card-header {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 64px;
        margin-bottom: 18px;
        padding-top: 6px;

        .header-main {
          width: 100%;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 4px;
        }

        .card-title {
          font-size: 22px;

          font-weight: 600;

          margin: 0;

          word-wrap: break-word;

          overflow-wrap: break-word;

          hyphens: auto;

          max-width: 100%;
          padding: 0 48px;
          line-height: 1.25;
        }

        .card-badge {
          position: absolute;
          top: 0;
          right: 0;
          display: flex;

          align-items: center;

          padding: 4px 12px;

          border-radius: 20px;

          font-size: 12px;

          font-weight: 500;

          margin-left: 0;

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
        align-items: center;
      }
    }

    .plan-price {
      margin: 14px 0 18px;

      padding: 0 4px;
      text-align: center;

      .price-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        text-align: center;
        margin-bottom: 12px;

        .price-main-line {
          align-items: baseline;

          display: inline-flex;
          align-items: baseline;
          justify-content: center;
          gap: 6px;
        }

        .currency {
          font-size: 22px;
          font-weight: 500;
          color: color-mix(in srgb, var(--text-color) 72%, #6b7280 28%);
        }

        .amount {
          font-size: 42px;
          line-height: 0.95;
          font-weight: 700;
          color: var(--text-color);
          letter-spacing: -0.8px;
        }

        .unit-line {
          font-size: 13px;
          font-weight: 500;
          color: color-mix(in srgb, var(--text-color) 72%, #6b7280 28%);
        }
      }
    }

    .plan-price + .btn-purchase {
      align-self: center;
      margin-top: 0;
      margin-bottom: 12px;
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
      width: 100%;
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
    border: 1px solid transparent;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;
    padding: 0 16px;
    margin-top: 4px;
    align-self: flex-start;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    box-shadow: 0 8px 18px rgba(37, 99, 235, 0.24);

    &.glassmorphism {
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border: 1px solid transparent;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 24px rgba(37, 99, 235, 0.3);
      filter: brightness(1.03);
    }

    &.btn-disabled {
      background: #94a3b8;
      cursor: not-allowed;
      box-shadow: none;
      border: 1px solid #94a3b8;

      &:hover {
        transform: none;
        box-shadow: none;
        filter: none;
      }
    }

    .btn-icon {
      width: 18px;
      height: 18px;
    }

    .btn-text {
      color: #fff;
      font-weight: 600;
    }

    &:focus-visible {
      outline: 2px solid rgba(var(--theme-color-rgb), 0.65);
      outline-offset: 2px;
    }
  }



  .shop-title-header {
    align-items: center !important;
    gap: 14px;
  }

  .filter-toggle-container {
    margin-bottom: 0;
    flex-shrink: 0;

    .filter-toggle-wrapper {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px;
      border-radius: 12px;
      border: 1px solid var(--border-color-soft);
      background: #f1f5f9;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.7);

      .filter-option {
        border: 0;
        background: transparent;
        min-width: 60px;
        height: 30px;
        padding: 0 10px;
        border-radius: 9px;
        cursor: pointer;
        transition: all 0.22s ease;

        &:hover {
          background-color: rgba(var(--theme-color-rgb), 0.08);
        }

        &:focus-visible {
          outline: 2px solid rgba(var(--theme-color-rgb), 0.45);
          outline-offset: 1px;
        }

        &.active {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.22);

          .option-text {
            color: #fff;
            font-weight: 600;
          }
        }

        .option-text {
          font-size: 12px;
          color: #475569;
          font-weight: 500;
          white-space: nowrap;
        }
      }
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
  --shop-card-radius: var(--radius-lg);

    padding: 15px;

    padding-bottom: 80px;

    .plans-wrapper {
      grid-template-columns: 1fr;
    }
  }

  .shop-container .shop-title-header {
    align-items: flex-start !important;
    flex-direction: column;
    gap: 10px;

    .card-title {
      padding-right: 0;
    }
  }

  .shop-container .filter-toggle-container {
    width: 100%;

    .filter-toggle-wrapper {
      border: 1px solid var(--border-color-soft);
      border-radius: 12px;
      background: #f1f5f9;

      width: fit-content;
    }
  }
}

@media (max-width: 480px) {
  .shop-container .filter-toggle-container .filter-toggle-wrapper {
    padding: 2px;

    .filter-option {
      min-width: 56px;
      height: 28px;
      padding: 0 9px;

      .option-text {
        font-size: 12px;
      }
    }
  }
}
</style>
