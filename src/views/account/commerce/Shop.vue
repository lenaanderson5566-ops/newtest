<template>
  <div class="shop-container page-shell">
    <div class="shop-inner page-inner page-stack">
      <button class="account-back-btn" @click="goBackToAccount">
        <span aria-hidden="true">←</span>
        <span class="back-label">返回账号中心</span>
      </button>

      <!-- 欢迎卡片 -->

      <div class="dashboard-card welcome-card">
        <div class="card-header shop-title-header">
          <h2 class="card-title">{{ $t("shop.title") }}</h2>
        </div>

        <div class="card-body">
          <p>{{ $t("shop.description") }}</p>
          <div class="filter-toggle-container" v-if="displayedFilters.length > 0">
            <div class="filter-toggle-wrapper" role="tablist" :aria-label="$t('shop.billingPeriodAria')">
              <span class="filter-highlight" :style="filterHighlightStyle"></span>
              <button
                v-for="filter in displayedFilters"
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
      </div>

      <!-- 订阅列表 -->

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

        <template v-else>
          <div class="mobile-plan-layout">
            <div class="mobile-plan-selector">
              <div
                v-for="plan in filteredPlans"
                :key="`mobile-${plan.id}`"
                class="mobile-plan-chip-wrap"
                :class="{
                  'current-plan-chip': isCurrentPlan(plan),
                }"
              >
                <span class="chip-current-header" v-if="isCurrentPlan(plan)">{{ currentPlanBadgeLabel }}</span>
                <button
                  type="button"
                  class="mobile-plan-chip"
                  :class="{
                    active: selectedPlan && Number(selectedPlan.id) === Number(plan.id),
                    'current-plan-chip': isCurrentPlan(plan),
                  }"
                  @click="onSelectPlan(plan)"
                >
                  <span class="chip-body">
                    <span class="chip-name">{{ plan.name }}</span>
                    <span class="chip-period">{{ getMobilePlanSubtitle(plan) }}</span>
                    <span class="chip-check" v-if="selectedPlan && Number(selectedPlan.id) === Number(plan.id)">
                      <IconCheck :size="16" />
                    </span>
                  </span>
                </button>
              </div>
            </div>

            <div class="mobile-plan-details" v-if="selectedPlan">
              <div class="mobile-detail-row">
                <span class="mobile-label">价格</span>
                <span class="mobile-value">{{ currencySymbol }}{{ getPlanMainPrice(selectedPlan) }}</span>
              </div>
              <div class="mobile-detail-row">
                <span class="mobile-label">周期</span>
                <span class="mobile-value">{{ $t(`shop.plan.periods.${getPriceTypeKey(getDisplayPriceType(selectedPlan))}`) }}</span>
              </div>
              <div
                class="mobile-detail-row"
                v-for="(feature, index) in getMobileFeatureRows(selectedPlan)"
                :key="`mobile-feature-${index}`"
              >
                <span class="mobile-label">{{ feature.label }}</span>
                <span class="mobile-value">{{ feature.value }}</span>
              </div>
            </div>

            <button
              class="mobile-continue-btn"
              :class="{ 'btn-disabled': !selectedPlan || selectedPlan.capacity_limit === 0 }"
              :disabled="!selectedPlan || selectedPlan.capacity_limit === 0"
              @click="selectedPlan && purchasePlan(selectedPlan)"
            >
              <IconShoppingCart class="btn-icon" />
              <span class="btn-text">{{ selectedPlan ? getPurchaseButtonText(selectedPlan) : $t("shop.plan.purchase") }}</span>
            </button>
          </div>

          <!-- 订阅卡片 修改内容 -->

          <div
            class="plan-card desktop-plan-card"
            :class="{ 'current-plan-card': isCurrentPlan(plan) }"
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

              <!-- 订阅特性 -->

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
        </template>
      </div>


    </div>
  </div>

</template>

<script>
import { ref, reactive, onMounted, computed, watch, nextTick } from "vue";

import { useI18n } from "vue-i18n";

import { useToast } from "@/composables/useToast";

import { fetchPlans, getCommConfig } from "@/api/account/shop";
import { getSubscribe } from "@/api/overview/dashboard";

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
    const goBackToAccount = () => {
      if (window.history.length > 1) {
        router.back();
        return;
      }
      router.push('/profile');
    };
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
    const selectedPlanId = ref(null);

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

    const displayedFilters = computed(() => {
      const monthFilter = filters.value.find((item) => item.value === "month_price");
      const yearFilter = filters.value.find((item) => item.value === "year_price");
      if (monthFilter && yearFilter) {
        return [monthFilter, yearFilter];
      }
      return filters.value;
    });

    const filterHighlightStyle = computed(() => {
      const count = displayedFilters.value.length;
      if (!count) return {};
      const activeIndex = Math.max(0, displayedFilters.value.findIndex((item) => item.value === selectedFilter.value));
      return {
        width: `${100 / count}%`,
        transform: `translateX(${activeIndex * 100}%)`,
      };
    });

    const currentPlanBadgeLabel = computed(() => t("shop.plan.current"));

    const setFilter = (filter) => {
      selectedFilter.value = filter;
    };

    const onSelectPlan = (plan) => {
      selectedPlanId.value = plan?.id ?? null;
    };

    const getFilterDisplayLabel = (filter) => {
      return t(filter?.labelKey || "");
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
      () => displayedFilters.value,
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

    const selectedPlan = computed(() => {
      if (filteredPlans.value.length === 0) return null;
      const matched = filteredPlans.value.find((plan) => Number(plan.id) === Number(selectedPlanId.value));
      return matched || filteredPlans.value[0];
    });

    const getMobilePlanSubtitle = (plan) => {
      if (!plan) return "";
      if (isJsonContent(plan.content)) {
        const matched = parseJsonContent(plan.content).find((item) => /\b(4k|[0-9]{3,4}p)\b/i.test(String(item?.feature || "")));
        if (matched?.feature) {
          return matched.feature;
        }
      }
      return `${currencySymbol.value}${getPlanMainPrice(plan)} / ${t(`shop.plan.periods.${getPriceTypeKey(getDisplayPriceType(plan))}`)}`;
    };

    const getMobileFeatureRows = (plan) => {
      if (!plan || !isJsonContent(plan.content)) return [];
      return parseJsonContent(plan.content)
        .slice(0, 6)
        .map((item) => ({
          label: item?.feature || "特性",
          value: item?.support ? "支持" : "不支持",
        }));
    };

    watch(
      () => filteredPlans.value,
      (nextPlans) => {
        if (!nextPlans.length) {
          selectedPlanId.value = null;
          return;
        }
        const stillExists = nextPlans.some((plan) => Number(plan.id) === Number(selectedPlanId.value));
        if (!stillExists) {
          selectedPlanId.value = nextPlans[0].id;
        }
      },
      { immediate: true }
    );

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
      selectedPlan,
      onSelectPlan,
      getMobileFeatureRows,
      getMobilePlanSubtitle,

      getPlanMainPrice,

      getPlanMainPriceType,

      currentLanguage,
      displayedFilters,
      filterHighlightStyle,
      currentPlanBadgeLabel,

      selectPlanPriceType,

      getDisplayPriceType,
      getPurchaseButtonText,
      normalizePriceValue,

      SHOP_CONFIG,

      calculateDiscount,
      isCurrentPlan,
      goBackToAccount,
    };
  },
};
</script>

<style lang="scss" scoped>
.shop-container {
  --shop-card-radius: var(--radius-lg);

  padding: 0;

  display: flex;

  justify-content: center;

  .shop-inner {
    width: 100%;

      }

  .welcome-card {
    border: 1px solid var(--border-color);
    border-radius: var(--shop-card-radius);
    box-shadow: none;

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

    box-shadow: none;

    padding: 20px;

    margin-bottom: 24px;

    border: 1px solid var(--border-color);

    transition: all 0.3s ease;

    position: relative;

    &:hover {
      box-shadow: none;

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
    color: var(--theme-color);
    background: rgba(var(--theme-color-rgb), 0.1);
    border: 1px solid rgba(var(--theme-color-rgb), 0.26);
    border-radius: 999px;
    padding: 5px 10px;
    white-space: nowrap;
    box-shadow: none;
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

    .mobile-plan-layout {
      display: none;
    }

    .plan-card {
      border-radius: var(--shop-card-radius);
      border: 1px solid var(--border-color);
      box-shadow: none;

      background-color: var(--card-bg-color);

      border-radius: 16px;

      box-shadow: none;

      padding: 24px;

      border: 1px solid var(--border-color);

      transition: all 0.3s ease;

      position: relative;

      display: flex;

      flex-direction: column;

      height: auto;

      &:hover {
        box-shadow: none;

        border-color: rgba(var(--theme-color-rgb), 0.3);

        transform: translateY(-5px);
      }

      &.current-plan-card {
        border-color: rgba(var(--theme-color-rgb), 0.5);
        box-shadow: none;
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
          color: color-mix(in srgb, var(--text-color) 72%, var(--secondary-text-color) 28%);
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
          color: color-mix(in srgb, var(--text-color) 72%, var(--secondary-text-color) 28%);
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
            color: var(--secondary-text-color);
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
    background: linear-gradient(135deg, var(--button-primary-start) 0%, var(--button-primary-end) 100%);
    box-shadow: none;

    &.glassmorphism {
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border: 1px solid transparent;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: none;
      filter: brightness(1.03);
    }

    &.btn-disabled {
      background: var(--button-disabled-bg);
      cursor: not-allowed;
      box-shadow: none;
      border: 1px solid var(--button-disabled-bg);

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
    margin-top: 10px;
    margin-bottom: 0;
    flex-shrink: 0;

    .filter-toggle-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 0;
      padding: 3px;
      border-radius: 12px;
      border: 1px solid var(--border-color);
      background: var(--surface-subtle);
      box-shadow: none;

      .filter-highlight {
        position: absolute;
        left: 3px;
        top: 3px;
        bottom: 3px;
        border-radius: 9px;
        background: linear-gradient(135deg, var(--button-primary-start) 0%, var(--button-primary-end) 100%);
        box-shadow: none;
        transition: transform 0.22s ease, width 0.22s ease;
        pointer-events: none;
      }

      .filter-option {
        position: relative;
        z-index: 1;
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
          .option-text {
            color: #fff;
            font-weight: 600;
          }
        }

        .option-text {
          font-size: 12px;
          color: var(--secondary-text-color);
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

.account-back-btn {
  width: fit-content;
  border: none;
  background: transparent;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 0;
  margin-bottom: 8px;
}

.back-label {
  font-size: 14px;
  color: var(--secondary-text-color);
}

@media (max-width: 768px) {
  .back-label {
    display: none;
  }

  .shop-container {
  --shop-card-radius: var(--radius-lg);

    padding: 15px;

    padding-bottom: 80px;

    .plans-wrapper {
      grid-template-columns: 1fr;
      display: block;
      margin-bottom: 0;

      .desktop-plan-card {
        display: none;
      }

      .mobile-plan-layout {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .mobile-plan-selector {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        align-items: start;
        padding-top: 34px;
      }

      .mobile-plan-chip-wrap {
        position: relative;
        min-width: 0;
      }

      .mobile-plan-chip-wrap.current-plan-chip {
        padding-top: 0;
      }

      .chip-current-header {
        box-sizing: border-box;
        position: absolute;
        top: -34px;
        left: 0;
        right: 0;
        height: 34px;
        padding: 0 8px;
        border-radius: 12px 12px 0 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #2d2d2d;
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .mobile-plan-chip {
        box-sizing: border-box;
        width: 100%;
        border: 1px solid var(--border-color);
        background: var(--card-bg-color);
        border-radius: 12px;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        text-align: left;
        color: var(--text-color);
        position: relative;
        min-height: 136px;
        overflow: hidden;

        &.active {
          border-color: rgba(var(--theme-color-rgb), 0.65);
          background: linear-gradient(135deg, #2259aa 0%, #b737d9 100%);
          color: #fff;
        }

        &.current-plan-chip {
          padding: 0;
        }

        &.current-plan-chip.active {
          background: var(--card-bg-color);
          color: var(--text-color);

          .chip-body {
            background: linear-gradient(135deg, #2259aa 0%, #5d35d9 100%);
            color: #fff;
          }
        }
      }

      .chip-body {
        display: flex;
        flex-direction: column;
        gap: 6px;
        position: relative;
        height: 100%;
        min-height: 136px;
        padding: 10px;
        border-radius: 12px;
      }

      .chip-name {
        font-size: 13px;
        font-weight: 700;
      }

      .chip-period {
        font-size: 12px;
        color: var(--secondary-text-color);
      }

      .mobile-plan-chip.active .chip-period,
      .mobile-plan-chip.current-plan-chip.active .chip-period {
        color: rgba(255, 255, 255, 0.9);
      }

      .chip-check {
        position: absolute;
        right: 2px;
        bottom: 2px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #4d4ad5;
        background: #fff;
      }

      .mobile-plan-details {
        border: 1px solid var(--border-color);
        background: var(--card-bg-color);
        border-radius: 12px;
        padding: 10px 14px;
      }

      .mobile-detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 10px 0;
        border-bottom: 1px solid var(--border-color);
      }

      .mobile-detail-row:last-child {
        border-bottom: none;
      }

      .mobile-label {
        font-size: 13px;
        color: var(--secondary-text-color);
      }

      .mobile-value {
        font-size: 13px;
        font-weight: 600;
        text-align: right;
      }

      .mobile-continue-btn {
        position: sticky;
        bottom: max(12px, env(safe-area-inset-bottom));
        width: 100%;
        height: 44px;
        border: 1px solid transparent;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: linear-gradient(135deg, var(--button-primary-start) 0%, var(--button-primary-end) 100%);
        color: #fff;
        font-weight: 600;

        &.btn-disabled {
          background: var(--button-disabled-bg);
          border-color: var(--button-disabled-bg);
        }
      }
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
      border: 1px solid var(--border-color);
      border-radius: 12px;
      background: var(--surface-subtle);

      width: fit-content;
    }
  }
}

@media (max-width: 480px) {
  .shop-container .plans-wrapper .mobile-plan-selector {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

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
