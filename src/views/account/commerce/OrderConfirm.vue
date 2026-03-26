<template>
  <div class="order-confirm-container page-shell">
    <div class="order-confirm-inner page-inner page-stack">
      <!-- 用户现有订阅提示 -->

      <div class="alert-card" v-if="showExistingPlanWarning">
        <div class="alert-icon">
          <IconAlertTriangle :size="22" />
        </div>

        <div class="alert-content">
          <h4>{{ $t("order.existing_plan_warning_title") }}</h4>

          <p>{{ $t("order.existing_plan_warning_desc") }}</p>
        </div>
      </div>

      <!-- 内容主体 -->

      <div class="content-wrapper">
        <!-- 左侧内容：订阅信息和周期选择 -->

        <div class="left-column">
          <!-- 订阅信息卡片 - 骨架屏 -->

          <div class="plan-card glassmorphism" v-if="loading.plan">
            <div class="skeleton-card">
              <div class="skeleton-header"></div>

              <div class="skeleton-body">
                <div class="skeleton-title"></div>

                <div class="skeleton-features">
                  <div
                    class="skeleton-feature"
                    v-for="j in 4"
                    :key="'feature-' + j"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 订阅信息卡片 - 实际内容 -->

          <div class="plan-card glassmorphism" v-else-if="plan">
            <div class="card-header">
              <h3 class="card-title">{{ plan.name }}</h3>

              <div v-if="shouldShowStockBadge(plan)" class="card-badge" :class="getStockBadgeClass(plan)">
                <IconBox :size="16" class="badge-icon" />

                <span>{{ getPlanStockText(plan) }}</span>
              </div>
            </div>

            <div class="card-body">
              <!-- 订阅详细信息 -->

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

          <!-- 周期选择 -->

          <div class="section-wrapper period-section" v-if="!loading.plan">
            <div class="section-title">
              <span>{{ $t("order.select_period") }}</span>
            </div>

            <div class="period-selection">
              <!-- 周期卡片 -->

              <div class="period-cards">
                <div
                  v-for="(price, type) in availablePrices"
                  :key="type"
                  class="period-card"
                  :class="{ active: selectedPriceType === type }"
                  @click="selectPriceType(type)"
                >
                  <div class="period-card-inner">
                    <div class="period-type">
                      {{
                        formatPeriodOption(type)
                      }}
                      <span
                        v-if="showPeriodDiscountTag(type, price)"
                        class="discount-tag"
                      >
                        -{{ getPeriodDiscountPercent(type, price) }}%
                      </span>
                    </div>

                    <div class="period-price">
                      <span class="currency">{{ displayCurrency }}</span>

                      <span class="amount">{{ (price / 100).toFixed(2) }}</span>
                      <span
                        v-if="showPeriodDiscountTag(type, price)"
                        class="original-price"
                      >
                        {{ getPeriodOriginalPrice(type).toFixed(2) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 周期选择骨架屏 -->

          <div class="section-wrapper period-section" v-else>
            <div class="section-title">
              <span>{{ $t("order.select_period") }}</span>
            </div>

            <div class="period-selection">
              <div class="skeleton-period-cards">
                <div
                  class="skeleton-period-card"
                  v-for="i in 2"
                  :key="'skeleton-period-' + i"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧内容：订单信息 -->

        <div class="right-column">
          <!-- 订单摘要 -->

          <div class="section-wrapper order-summary-section">
            <div class="order-summary glassmorphism">
              <div class="coupon-merge-block">
                <div class="coupon-input">
                  <input
                    type="text"
                    v-model="couponCode"
                    :disabled="loading.plan || couponApplied"
                    :placeholder="$t('order.enter_coupon')"
                    class="coupon-field"
                    :class="{ applied: couponApplied }"
                    spellcheck="false"
                    autocapitalize="off"
                    autocomplete="off"
                  />
                  <button v-if="!couponApplied" class="btn-verify" @click="verifyCoupon"
                    :disabled="!couponCode || verifying || loading.plan">
                    <IconDiscount2 v-if="!verifying" />
                    <span v-else class="loader"></span>
                    <span>{{ $t("order.verify_coupon") }}</span>
                  </button>
                  <span v-if="couponApplied" class="coupon-applied-tag">✓ 已应用</span>
                  <button v-if="couponApplied" class="btn-remove-text" @click="removeCoupon">移除</button>
                </div>
                <div v-if="couponErrorMessage" class="coupon-feedback error">{{ couponErrorMessage }}</div>
              </div>

              <!-- 骨架屏 -->

              <div v-if="loading.plan">
                <div class="summary-row skeleton">
                  <div class="summary-label skeleton-text"></div>

                  <div class="summary-value skeleton-text"></div>
                </div>

                <div class="summary-divider"></div>

                <div class="summary-row skeleton total">
                  <div class="summary-label skeleton-text"></div>

                  <div class="summary-value skeleton-text"></div>
                </div>
              </div>

              <!-- 实际内容 -->

              <div v-else>
                <div class="summary-row">
                  <div class="summary-label">订阅价格</div>

                  <div class="summary-value">
                    {{ formatCurrencyAmount(originalPrice) }}
                  </div>
                </div>

                <div class="summary-row" v-if="couponDiscountAmount > 0">
                  <div class="summary-label">优惠券 · {{ couponCode }}</div>

                  <div class="summary-value discount">
                    -{{ formatCurrencyAmount(couponDiscountAmount) }}
                  </div>
                </div>

                <div class="summary-row" v-if="userDiscountAmount > 0">
                  <div class="summary-label">会员折扣</div>

                  <div class="summary-value discount">
                    -{{ formatCurrencyAmount(userDiscountAmount) }}
                  </div>
                </div>

                <div class="summary-divider"></div>

                <div class="summary-row total">
                  <div class="summary-label">应付金额</div>

                  <div class="summary-value">
                    {{ formatCurrencyAmount(totalWithFee) }}
                  </div>
                </div>

                <button
                  class="btn-order summary-submit-action"
                  @click="submitOrder"
                  :disabled="
                    !selectedPriceType || loading.submitting || loading.plan
                  "
                >
                  <IconShoppingCart v-if="!loading.submitting" :size="18" />

                  <span v-else class="loader"></span>

                  <span>{{ $t("order.place_order") }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->

          <div class="action-buttons">
            <button class="btn-back" @click="goBack" :disabled="loading.plan">
              <IconArrowLeft :size="18" />

              <span>{{ $t("order.back_to_shop") }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <transition name="modal-fade">
      <div v-if="showPendingOrderModal" class="pending-order-modal">
        <div class="pending-order-overlay" @click="closePendingOrderModal"></div>
        <div class="pending-order-dialog" role="dialog" aria-modal="true" aria-labelledby="pending-order-title">
          <div class="pending-order-icon">
            <IconAlertTriangle :size="28" />
          </div>
          <div class="pending-order-header">
            <h3 id="pending-order-title">注意</h3>
            <p>您还有未完成的订单，购买前需要先取消，确定要取消之前的订单吗？</p>
          </div>
          <div class="pending-order-actions">
            <button class="btn-return-orders cancel-btn" @click="goToMyOrders">返回我的订单</button>
            <button class="btn-confirm-cancel confirm-btn" @click="confirmCancelPreviousOrder" :disabled="loading.cancellingExisting">
              <span v-if="!loading.cancellingExisting">确定取消</span>
              <span v-else class="loader"></span>
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, watch } from "vue";

import { useI18n } from "vue-i18n";

import { useToast } from "@/composables/useToast";

import { useRoute, useRouter } from "vue-router";

import {
  getCommConfig,
  fetchPlanById,
  verifyCoupon as checkCoupon,
  submitOrder as createOrder,
  cancelOrder as cancelExistingOrder,
} from "@/api/account/shop";

import { getUserInfo } from "@/api/overview/dashboard";
import { fetchOrderList } from "@/api/account/orderlist";

import {
  IconCheck,
  IconX,
  IconBox,
  IconShoppingCart,
  IconDiscount2,
  IconArrowLeft,
  IconAlertTriangle,
} from "@tabler/icons-vue";

export default {
  name: "OrderConfirm",

  components: {
    IconCheck,

    IconX,

    IconBox,

    IconShoppingCart,

    IconDiscount2,

    IconArrowLeft,

    IconAlertTriangle,
  },

  setup() {
    const { t, locale } = useI18n();

    const { showToast } = useToast();

    const route = useRoute();

    const router = useRouter();

    const loading = reactive({
      plan: true,

      userInfo: true,

      submitting: false,
      cancellingExisting: false,
    });

    const plan = ref(null);

    const userInfo = ref(null);

    const currency = ref("CNY");

    const currencySymbol = ref("¥");

    const selectedPriceType = ref("");

    const couponCode = ref("");

    const couponApplied = ref(false);

    const couponErrorMessage = ref("");

    const verifying = ref(false);

    const couponInfo = ref(null);

    const showPendingOrderModal = ref(false);

    const pendingOrderTradeNo = ref("");

    const discountPercent = ref(0);

    const originalPrice = computed(() => {
      if (!plan.value || !selectedPriceType.value) return 0;

      return plan.value[selectedPriceType.value] || 0;
    });

    const couponDiscountAmount = computed(() => {
      if (!couponApplied.value || !couponInfo.value) return 0;

      if (typeof couponInfo.value.coupon_discount_amount === 'number') {
        return Math.max(0, Number(couponInfo.value.coupon_discount_amount));
      }

      if (couponInfo.value.type === 1) {
        return Math.max(0, Number(couponInfo.value.value || 0));
      }

      if (
        couponInfo.value.type === 2 &&
        discountPercent.value > 0 &&
        originalPrice.value > 0
      ) {
        return Math.round(originalPrice.value * (discountPercent.value / 100));
      }

      return 0;
    });

    const userDiscountPercent = computed(() => {
      const discount = Number(userInfo.value?.discount || 0);
      if (!Number.isFinite(discount)) {
        return 0;
      }
      return Math.min(Math.max(discount, 0), 100);
    });

    const userDiscountAmount = computed(() => {
      if (originalPrice.value <= 0 || userDiscountPercent.value <= 0) {
        return 0;
      }

      return Math.round(originalPrice.value * (userDiscountPercent.value / 100));
    });

    const totalDiscountAmount = computed(() => {
      return Math.max(0, couponDiscountAmount.value + userDiscountAmount.value);
    });

    const finalPrice = computed(() => {
      return Math.max(0, originalPrice.value - totalDiscountAmount.value);
    });

    const totalWithFee = computed(() => finalPrice.value);

    const displayCurrency = computed(() => {
      return `${currency.value || 'USD'}`.toUpperCase();
    });

    const formatCurrencyAmount = (amount) => {
      if (amount === null || amount === undefined) return '-';
      return `${displayCurrency.value} ${(Number(amount) / 100).toFixed(2)}`;
    };

    const formatPeriodOption = (type) => {
      if (type === "month_price") return "月付";
      if (type === "year_price") return "年付";
      return t(`shop.plan.price_options.${getPriceTypeKey(type)}`);
    };

    const userHasActivePlan = computed(() => {
      if (!userInfo.value) return false;

      return (
        userInfo.value.plan_id &&
        userInfo.value.expired_at &&
        userInfo.value.expired_at * 1000 > Date.now()
      );
    });

    const availablePrices = computed(() => {
      if (!plan.value) return {};

      const prices = {};

      const priceTypes = [
        "month_price",
        "quarter_price",
        "half_year_price",
        "year_price",
        "two_year_price",
        "three_year_price",
        "onetime_price",
      ];

      priceTypes.forEach((type) => {
        if (plan.value[type] !== null) {
          prices[type] = plan.value[type];
        }
      });

      return prices;
    });

    const bestValuePeriod = computed(() => {
      if (!plan.value) return "";

      const valueWeight = {
        month_price: 1,

        quarter_price: 3,

        half_year_price: 6,

        year_price: 12,

        two_year_price: 24,

        three_year_price: 36,

        onetime_price: 12,
      };

      let bestPeriod = "";

      let bestValue = 0;

      Object.entries(availablePrices.value).forEach(([type, price]) => {
        if (price <= 0) return;

        const monthlyValue = valueWeight[type] / price;

        if (monthlyValue > bestValue) {
          bestValue = monthlyValue;

          bestPeriod = type;
        }
      });

      return bestPeriod;
    });

    const shouldShowStockBadge = (plan) => {
      return plan.capacity_limit === 0 || (plan.capacity_limit > 0 && plan.capacity_limit < 5);
    };

    const getPlanStockText = (plan) => {
      if (plan.capacity_limit === 0) {
        return t("shop.plan.stock.sold_out");
      } else if (plan.capacity_limit > 0 && plan.capacity_limit < 5) {
        return t("shop.plan.stock.warning");
      } else {
        return t("shop.plan.stock.plenty");
      }
    };

    const getStockBadgeClass = (plan) => {
      if (plan.capacity_limit === 0) {
        return "stock-danger";
      } else if (plan.capacity_limit > 0 && plan.capacity_limit < 5) {
        return "stock-warning";
      } else {
        return "stock-plenty";
      }
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

    const selectPriceType = (type) => {
      selectedPriceType.value = type;
    };

    const getPeriodMonthCount = (type) => {
      const monthCountMap = {
        quarter_price: 3,
        half_year_price: 6,
        year_price: 12,
        two_year_price: 24,
        three_year_price: 36,
      };
      return monthCountMap[type] || 1;
    };

    const showPeriodDiscountTag = (type, price) => {
      if (!plan.value || !price) return false;
      if (type === "month_price" || type === "onetime_price") return false;
      if (!availablePrices.value.month_price) return false;
      return getPeriodOriginalPrice(type) > price / 100;
    };

    const getPeriodOriginalPrice = (type) => {
      if (!availablePrices.value.month_price) return 0;
      return (
        (availablePrices.value.month_price / 100) * getPeriodMonthCount(type)
      );
    };

    const getPeriodDiscountPercent = (type, price) => {
      if (!showPeriodDiscountTag(type, price)) return 0;
      const original = getPeriodOriginalPrice(type);
      const current = price / 100;
      if (!original || current >= original) return 0;
      return Math.round(((original - current) / original) * 100);
    };

    const verifyCoupon = async () => {
      if (!couponCode.value || verifying.value) return;

      verifying.value = true;
      couponErrorMessage.value = "";

      try {
        const response = await checkCoupon(couponCode.value, plan.value.id);

        if (response.data) {
          couponApplied.value = true;

          couponInfo.value = response.data;

          if (response.message) {
            showToast(response.message, "success");
          }

          if (response.data.type === 1) {
            discountPercent.value = 0;
            if (!response.message) {
              showToast(
                t("order.coupon_success_fixed", {
                  code: couponCode.value,

                  amount: (response.data.value / 100).toFixed(2),
                }),
                "success"
              );
            }
          } else if (response.data.type === 2) {
            discountPercent.value = couponInfo.value.value;

            if (!response.message) {
              showToast(
                t("order.coupon_success_percent", {
                  code: couponCode.value,

                  percent: couponInfo.value.value,
                }),
                "success"
              );
            }
          } else if (!response.message) {
            showToast(
              t("order.coupon_success", { code: couponCode.value }),
              "success"
            );
          }
        } else {
          couponApplied.value = false;

          discountPercent.value = 0;

          couponInfo.value = null;

          couponErrorMessage.value = response.message || t("order.coupon_invalid");
          showToast(response.message || t("order.coupon_invalid"), "error");
        }
      } catch (error) {
        console.error("Failed to verify coupon:", error);

        couponApplied.value = false;

        discountPercent.value = 0;

        couponInfo.value = null;

        couponErrorMessage.value =
          error.response?.message || error.message || t("order.coupon_invalid");

        showToast(
          error.response?.message || error.message || t("order.coupon_invalid"),
          "error"
        );
      } finally {
        verifying.value = false;
      }
    };

    const isPendingOrderConflict = (message = "") => {
      const normalized = String(message || "");
      return (
        normalized.includes("未付款") ||
        normalized.includes("开通中") ||
        normalized.includes("未完成") ||
        normalized.includes("有未支付")
      );
    };

    const extractPendingTradeNo = (error) => {
      const payload = error?.response?.data;
      return (
        payload?.data?.trade_no ||
        payload?.data ||
        payload?.trade_no ||
        error?.response?.trade_no ||
        ""
      );
    };

    const toComparablePlanId = (value) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    };

    const isUnpaidCreatedOrder = (order) => {
      if (!order) return false;
      return order.total_amount !== null && order.payment_amount == null;
    };

    const isSameOrderSpecAsCurrentSelection = (order) => {
      if (!order || !plan.value?.id || !selectedPriceType.value) {
        return false;
      }

      const orderPlanId =
        toComparablePlanId(order.plan_id) ??
        toComparablePlanId(order.plan?.id) ??
        toComparablePlanId(order.planId);
      const currentPlanId = toComparablePlanId(plan.value.id);

      const orderPeriod = String(order.period || "");
      const currentPeriod = String(selectedPriceType.value || "");

      return (
        currentPlanId !== null &&
        orderPlanId === currentPlanId &&
        orderPeriod === currentPeriod
      );
    };

    const fetchLatestPendingOrder = async (tradeNo = "") => {
      try {
        const resp = await fetchOrderList();
        const orders = Array.isArray(resp?.data) ? resp.data : [];
        const pendingOrders = orders.filter(
          (item) => Number(item?.status) === 0 || Number(item?.status) === 1
        );
        if (tradeNo) {
          const matched = pendingOrders.find((item) => item?.trade_no === tradeNo);
          if (matched) {
            return matched;
          }
        }
        return pendingOrders[0] || null;
      } catch (err) {
        console.error("Failed to fetch pending orders:", err);
        return null;
      }
    };

    const fetchLatestPendingTradeNo = async () => {
      const pending = await fetchLatestPendingOrder();
      return pending?.trade_no || "";
    };

    const closePendingOrderModal = () => {
      if (loading.cancellingExisting) return;
      showPendingOrderModal.value = false;
    };

    const goToMyOrders = () => {
      closePendingOrderModal();
      router.push('/orders');
    };

    const confirmCancelPreviousOrder = async () => {
      if (loading.cancellingExisting) {
        return;
      }

      loading.cancellingExisting = true;
      try {
        let tradeNo = pendingOrderTradeNo.value;
        if (!tradeNo) {
          tradeNo = await fetchLatestPendingTradeNo();
        }

        if (!tradeNo) {
          showToast('未找到可取消的未完成订单', 'warning');
          goToMyOrders();
          return;
        }

        const resp = await cancelExistingOrder(tradeNo);
        showToast(resp?.message || '订单已取消', 'success');
        showPendingOrderModal.value = false;
        pendingOrderTradeNo.value = '';
        await executeOrderSubmission();
      } catch (error) {
        showToast(error?.response?.message || error?.message || '取消订单失败', 'error');
      } finally {
        loading.cancellingExisting = false;
      }
    };

    const submitOrder = async () => {
      if (!selectedPriceType.value || loading.submitting || loading.cancellingExisting) return;

      await executeOrderSubmission();
    };

    // 实际的订单提交逻辑

    const executeOrderSubmission = async (options = {}) => {
      const { conflictResolved = false } = options;
      loading.submitting = true;

      try {
        const orderData = {
          plan_id: Number(plan.value.id),

          period: selectedPriceType.value,
        };

        if (couponApplied.value && couponCode.value && couponInfo.value) {
          orderData.coupon_code = couponCode.value;
        }

        const response = await createOrder(orderData);

        if (response.data) {
          showToast(response.message || t("order.order_success"), "success");

          router.push({
            path: "/payment",

            query: {
              trade_no: response.data,
            },
          });
        } else {
          showToast(response.message || t("order.order_failed"), "error");
        }
      } catch (error) {
        console.error("Failed to submit order:", error);

        const message = error.response?.message || error.message || t("order.order_failed");
        if (isPendingOrderConflict(message)) {
          const fallbackTradeNo = extractPendingTradeNo(error) || (await fetchLatestPendingTradeNo());
          const matchedOrder = await fetchLatestPendingOrder(fallbackTradeNo);

          if (matchedOrder && isUnpaidCreatedOrder(matchedOrder)) {
            pendingOrderTradeNo.value = matchedOrder.trade_no || fallbackTradeNo || "";

            if (isSameOrderSpecAsCurrentSelection(matchedOrder)) {
              router.push({
                path: "/payment",
                query: {
                  trade_no: pendingOrderTradeNo.value,
                },
              });
              return;
            }

            if (!conflictResolved && pendingOrderTradeNo.value) {
              loading.cancellingExisting = true;
              try {
                await cancelExistingOrder(pendingOrderTradeNo.value);
                pendingOrderTradeNo.value = "";
                await executeOrderSubmission({ conflictResolved: true });
              } catch (cancelError) {
                showToast(
                  cancelError?.response?.message ||
                    cancelError?.message ||
                    "取消订单失败",
                  "error"
                );
              } finally {
                loading.cancellingExisting = false;
              }
              return;
            }
          }

          pendingOrderTradeNo.value = fallbackTradeNo;
          showPendingOrderModal.value = true;
          return;
        }

        showToast(message, "error");
      } finally {
        loading.submitting = false;
      }
    };

    const goBack = () => {
      router.push("/shop");
    };

    const fetchPlanData = async () => {
      loading.plan = true;

      try {
        if (!route.query.id) {
          showToast(t("order.no_plan_selected"), "error");

          router.push("/shop");

          return;
        }

        const response = await fetchPlanById(route.query.id, locale.value);

        if (response.data) {
          plan.value = response.data;

          if (route.query.period && plan.value[route.query.period] !== null) {
            selectedPriceType.value = route.query.period;
          } else {
            const firstValidPriceType = Object.keys(availablePrices.value)[0];

            selectedPriceType.value = firstValidPriceType || "";
          }
        } else {
          showToast(response.message || t("order.plan_not_found"), "error");

          router.push("/shop");
        }
      } catch (error) {
        console.error("Failed to fetch plan data:", error);

        showToast(
          error.response?.message ||
            error.message ||
            t("order.failed_to_fetch_plan"),
          "error"
        );
      } finally {
        loading.plan = false;
      }
    };

    const fetchUserInfo = async () => {
      loading.userInfo = true;

      try {
        const response = await getUserInfo();

        if (response.data) {
          userInfo.value = response.data;
        } else if (response.message) {
          showToast(response.message, "warning");
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);

        showToast(
          error.response?.message ||
            error.message ||
            t("dashboard.userinfo_error"),
          "error"
        );
      } finally {
        loading.userInfo = false;
      }
    };

    const fetchConfig = async () => {
      try {
        const response = await getCommConfig();

        if (response.data) {
          currency.value = response.data.currency || "CNY";

          currencySymbol.value = response.data.currency_symbol || "¥";
        } else if (response.message) {
          showToast(response.message, "warning");
        }
      } catch (error) {
        console.error("Failed to fetch system config:", error);

        showToast(
          error.response?.message || error.message || t("shop.config_error"),
          "error"
        );
      }
    };

    const removeCoupon = () => {
      couponCode.value = "";

      couponApplied.value = false;

      discountPercent.value = 0;

      couponInfo.value = null;
      couponErrorMessage.value = "";

      showToast(t("order.coupon_removed"), "info");
    };

    const showExistingPlanWarning = computed(() => {
      if (loading.userInfo || loading.plan || !plan.value || !userInfo.value) {
        return false;
      }

      return (
        userHasActivePlan.value && plan.value.id !== userInfo.value.plan_id
      );
    });


    watch(
      () => locale.value,
      (newLanguage, oldLanguage) => {
        if (!oldLanguage || newLanguage === oldLanguage) {
          return;
        }

        fetchPlanData();
      }
    );
    onMounted(async () => {
      await Promise.all([fetchPlanData(), fetchUserInfo(), fetchConfig()]);
    });

    return {
      plan,

      userInfo,

      loading,

      currency,

      currencySymbol,

      displayCurrency,

      selectedPriceType,

      couponCode,

      couponApplied,

      couponErrorMessage,

      verifying,

      couponInfo,

      originalPrice,

      couponDiscountAmount,

      userDiscountAmount,

      totalDiscountAmount,

      finalPrice,

      totalWithFee,

      formatCurrencyAmount,

      userHasActivePlan,

      availablePrices,

      bestValuePeriod,

      getPriceTypeKey,

      formatPeriodOption,

      isJsonContent,

      parseJsonContent,

      selectPriceType,
      showPeriodDiscountTag,
      getPeriodDiscountPercent,
      getPeriodOriginalPrice,

      verifyCoupon,

      submitOrder,

      goBack,

      shouldShowStockBadge,

      getPlanStockText,

      getStockBadgeClass,

      removeCoupon,

      showExistingPlanWarning,

      showPendingOrderModal,
      closePendingOrderModal,
      goToMyOrders,
      confirmCancelPreviousOrder,

    };
  },
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles/base/variables.scss" as *;

.order-confirm-container {
  padding: 0;

  display: flex;

  justify-content: center;

  margin-top: 20px;

  min-height: calc(100vh - 100px);

  .order-confirm-inner {
    width: 100%;

    
    padding-bottom: 100px;
  }

  .welcome-card {
    margin-bottom: 24px;

    background-color: var(--card-bg-color);

    border-radius: $border-radius-sm;

    box-shadow: none;

    padding: 20px;

    border: 1px solid var(--border-color);

    transition: all 0.3s ease;

    &:hover {
      box-shadow: none;

      border-color: rgba(var(--theme-color-rgb), 0.3);
    }

    .card-header {
      display: flex;

      justify-content: space-between;

      align-items: center;

      margin-bottom: 15px;

      .card-title {
        font-size: $font-size-xl;

        font-weight: $font-weight-semibold;

        margin: 0;
      }
    }

    .card-body {
      p {
        margin: 0;

        color: var(--secondary-text-color);

        font-size: $font-size-md;

        line-height: 1.6;
      }
    }
  }

  .alert-card {
    background-color: rgba(255, 152, 0, 0.08);

    border: 1px solid rgba(255, 152, 0, 0.2);

    border-radius: $border-radius-sm;

    padding: 16px;

    margin-bottom: 30px;

    display: flex;

    align-items: center;

    width: 100%;

    box-shadow: none;

    backdrop-filter: blur(10px);

    -webkit-backdrop-filter: blur(10px);

    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);

      box-shadow: none;
    }

    .alert-icon {
      margin-right: 14px;

      color: #ff9800;

      flex-shrink: 0;

      background-color: rgba(255, 152, 0, 0.1);

      width: 44px;

      height: 44px;

      border-radius: $border-radius-sm;

      display: flex;

      align-items: center;

      justify-content: center;

      padding: 0;

      svg {
        width: 28px;

        height: 28px;
      }
    }

    .alert-content {
      flex: 1;

      min-width: 0;

      h4 {
        font-size: $font-size-md;

        font-weight: $font-weight-semibold;

        margin: 0 0 6px 0;

        color: #ff9800;

        letter-spacing: 0.2px;
      }

      p {
        font-size: $font-size-md;

        margin: 0;

        color: var(--secondary-text-color);

        line-height: 1.5;
      }
    }
  }

  .content-wrapper {
    display: flex;

    gap: 30px;

    .left-column {
      flex: 1.45;

      min-width: 0;
    }

    .right-column {
      flex: 0.85;

      min-width: 0;

      max-width: 520px;
      --right-card-bg: #2f343d;
      --right-card-border: rgba(148, 163, 184, 0.32);
      --right-card-shadow: none;
      --right-card-text: #f8fafc;
    }
  }

  .section-wrapper {
    margin-bottom: 25px;

    .section-title {
      font-size: $font-size-xl;

      font-weight: $font-weight-semibold;

      margin-bottom: 15px;

      color: var(--text-primary);

      position: relative;

      padding-left: 14px;

      &::before {
        content: "";

        position: absolute;

        left: 0;

        top: 50%;

        transform: translateY(-50%);

        width: 4px;

        height: 18px;

        background-color: var(--theme-color);

        border-radius: 2px;
      }
    }
  }

  .section-wrapper.period-section {
    background-color: var(--background-color) !important;
    border: none !important;
    box-shadow: none !important;
  }

  .plan-card {
    background-color: var(--card-bg-color);

    border-radius: $border-radius-sm;

    box-shadow: none;

    padding: 24px;

    margin-bottom: 25px;

    border: 1px solid var(--border-color);

    transition: all 0.3s ease;

    &.glassmorphism {
      background-color: rgba(var(--card-background-rgb, 255, 255, 255), 0.7);

      backdrop-filter: blur(20px);

      -webkit-backdrop-filter: blur(20px);

      will-change: backdrop-filter, background-color;
    }

    .card-header {
      display: flex;

      justify-content: space-between;

      align-items: center;

      margin-bottom: 20px;

      .card-title {
        font-size: $font-size-xl;

        font-weight: $font-weight-semibold;

        margin: 0;

        letter-spacing: 0.3px;

        color: var(--text-primary);
      }

      .card-badge {
        display: flex;

        align-items: center;

        padding: 4px 12px;

        border-radius: $border-radius-sm;

        font-size: $font-size-sm;

        font-weight: $font-weight-medium;

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

        .badge-icon {
          margin-right: 4px;
        }
      }
    }

    .card-body {
      .plan-features {
        margin: 0;

        .feature-item {
          display: flex;

          align-items: center;

          margin-bottom: 14px;

          .feature-icon {
            width: 20px;

            height: 20px;

            margin-right: 10px;

            &.enabled {
              color: var(--theme-color);
            }

            &.disabled {
              color: #ccc;
            }
          }

          span {
            font-size: $font-size-md;

            color: var(--text-primary);

            line-height: 1.5;

            &.disabled-text {
              color: var(--secondary-text-color);
            }
          }
        }

        .html-content {
          font-size: $font-size-md;

          line-height: 1.6;

          color: var(--text-primary);
        }
      }
    }
  }

  .period-selection {
    margin-bottom: 20px;

    width: 100%;

    background: transparent;

    .skeleton-period-cards {
      display: flex;

      gap: 16px;

      overflow-x: hidden;

      padding-bottom: 8px;

      width: 100%;

      .skeleton-period-card {
        flex: 1;

        min-width: 0;

        height: 100px;

        background-color: rgba(0, 0, 0, 0.05);

        border-radius: $border-radius-sm;

        position: relative;

        overflow: hidden;

        &::after {
          content: "";

          position: absolute;

          top: 0;

          right: 0;

          bottom: 0;

          left: 0;

          width: 30%;

          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,

            rgba(255, 255, 255, 0.15) 50%,

            rgba(255, 255, 255, 0) 100%
          );

          transform: translateX(-100%);

          animation: shimmer 2s infinite;

          will-change: transform;
        }
      }
    }

    .period-cards {
      display: grid;

      grid-template-columns: repeat(3, minmax(0, 1fr));

      gap: 15px;

      width: 100%;

      .period-card {
        cursor: pointer;

        border-radius: $border-radius-sm;

        overflow: hidden;

        border: 2px solid var(--border-color);

        transition: all 0.3s ease;

        position: relative;

        box-shadow: none;

        &.active {
          border-color: var(--theme-color);

          transform: translateY(-3px);

          box-shadow: none;

          .period-card-inner {
            background-color: #ffffff !important;
          }

          .period-price {
            .currency,
            .amount {
              color: var(--theme-color);
            }
          }
        }

        &:hover:not(.active) {
          transform: translateY(-3px);

          border-color: rgba(var(--theme-color-rgb), 0.3);

          box-shadow: none;
        }

        .period-card-inner {
          background-color: #ffffff !important;

          padding: 16px 12px !important;

          min-height: 90px !important;

          display: flex;

          flex-direction: column;

          align-items: center;

          justify-content: center;

          transition: background-color 0.3s ease;
        }

        .period-type {
          font-size: $font-size-md !important;

          font-weight: $font-weight-semibold;

          margin-bottom: 8px !important;

          color: var(--text-primary);

          letter-spacing: 0.2px;

          text-align: center;

          .discount-tag {
            background-color: #ff4d4f;
            color: #fff;
            font-size: $font-size-sm;
            padding: 2px 4px;
            border-radius: 4px;
            margin-left: 5px;
            vertical-align: middle;
          }
        }

        .period-price {
          margin-bottom: 8px;

          text-align: center;

          .currency {
            font-size: $font-size-md !important;

            font-weight: $font-weight-medium;

            color: var(--text-primary);
          }

          .amount {
            font-size: $font-size-xl !important;

            font-weight: $font-weight-bold;

            color: var(--text-primary);
          }

          .original-price {
            text-decoration: line-through;
            color: var(--secondary-text-color);
            font-size: $font-size-sm;
            margin-left: 5px;
          }
        }

        .period-badge {
          display: none;
        }
      }
    }
  }

  .coupon-input {
    display: flex;

    gap: 12px;

    margin-bottom: 20px;

    flex-wrap: wrap;

    align-items: center;

    .coupon-field {
      flex: 1;

      height: 48px;

      padding: 0 18px;

      border-radius: $border-radius-sm;

      border: 1px solid var(--border-color);

      background-color: var(--input-bg-color);

      color: var(--text-primary);

      font-size: $font-size-md;

      outline: none;

      transition: all 0.3s ease;

      box-shadow: none;

      min-width: 0;

      &.applied {
        background-color: var(--input-bg-color);
        border-color: var(--border-color);
      }

      &:focus {
        border-color: rgba(var(--theme-color-rgb), 0.5);

        box-shadow: none;

        transform: translateY(-1px);
      }

      &::placeholder {
        color: var(--secondary-text-color);

        opacity: 0.6;
      }
    }

    .btn-verify {
      height: 48px;

      padding: 0 24px;

      border-radius: $border-radius-sm;

      background-color: var(--theme-color);

      color: white;

      font-size: $font-size-md;

      font-weight: $font-weight-medium;

      display: flex;

      align-items: center;

      gap: 8px;

      border: none;

      cursor: pointer;

      transition: all 0.3s ease;

      box-shadow: none;

      white-space: nowrap;

      flex-shrink: 0;

      &:hover:not(:disabled) {
        background-color: color-mix(
          in srgb,
          var(--theme-color) 85%,
          black
        ) !important;

        transform: translateY(-2px);

        box-shadow: none;
      }

      &:disabled {
        opacity: 0.6;

        cursor: not-allowed;
      }

      .loader {
        width: 16px;

        height: 16px;

        border: 2px solid rgba(255, 255, 255, 0.3);

        border-radius: 50%;

        border-top-color: white;

        animation: spin 1s linear infinite;
      }
    }

    .coupon-applied-tag {
      height: 48px;
      padding: 0 16px;
      border-radius: $border-radius-sm;
      border: 1px solid var(--border-color);
      background: rgba(148, 163, 184, 0.08);
      color: var(--secondary-text-color);
      font-size: $font-size-md;
      display: inline-flex;
      align-items: center;
      line-height: 1;
      white-space: nowrap;
      cursor: default;
    }

    .btn-remove-text {
      height: 48px;
      padding: 0 16px;
      border-radius: $border-radius-sm;
      border: 1px solid var(--border-color);
      background: rgba(148, 163, 184, 0.08);
      color: var(--secondary-text-color);
      font-size: $font-size-md;
      cursor: pointer;
      line-height: 1;
      white-space: nowrap;

      &:hover {
        background: rgba(148, 163, 184, 0.14);
        color: var(--text-primary);
      }
    }
  }

  .coupon-merge-block {
    margin-bottom: 14px;

    .coupon-input {
      margin-bottom: 0;
    }
  }

  .coupon-light-row {
    min-height: 38px;
    padding: 0 10px;
    border: 1px solid var(--border-color);
    border-radius: $border-radius-sm;
    background: rgba(var(--theme-color-rgb), 0.03);
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: space-between;
    flex-wrap: nowrap;

    .coupon-code-label {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .coupon-discount-value {
      color: #22c55e;
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
      white-space: nowrap;
    }
  }

  .coupon-feedback {
    margin-top: 8px;
    font-size: $font-size-sm;
    line-height: 1.4;

    &.error {
      color: #ef4444;
    }
  }

  .order-summary {
    background-color: var(--card-bg-color);

    border-radius: $border-radius-sm;

    box-shadow: none;

    padding: 24px;

    margin-bottom: 20px;

    border: 1px solid var(--border-color);

    &.glassmorphism {
      background-color: rgba(var(--card-background-rgb, 255, 255, 255), 0.7);

      backdrop-filter: blur(20px);

      -webkit-backdrop-filter: blur(20px);
    }

    .summary-row {
      display: flex;

      justify-content: space-between;

      margin-bottom: 12px;

      align-items: center;

      &.skeleton {
        margin-bottom: 16px;
      }

      .summary-label {
        flex: 1;
        min-width: 0;
        font-size: $font-size-md;

        color: var(--secondary-text-color);

        letter-spacing: 0.2px;

        .coupon-name {
          font-size: $font-size-sm;

          opacity: 0.8;

          font-style: italic;
        }
      }

      .summary-value {
        min-width: 120px;
        text-align: right;
        font-size: $font-size-md;

        font-weight: $font-weight-medium;

        color: var(--text-primary);

        &.discount {
          color: #f44336;

          font-weight: $font-weight-semibold;
        }
      }

      &.total {
        margin-top: 8px;

        margin-bottom: 0;

        flex-direction: column;

        align-items: flex-start;

        gap: 6px;

        .summary-label {
          font-size: $font-size-md;

          font-weight: $font-weight-semibold;

          color: var(--text-primary);
        }

        .summary-value {
          min-width: 0;
          text-align: left;
          font-size: $font-size-xl;

          font-weight: $font-weight-bold;

          color: var(--theme-color);

          line-height: 1.15;
        }
      }
    }

    .summary-divider {
      height: 1px;

      background-color: var(--border-color);

      margin: 16px 0;
    }
  }

  .coupon-verify-section,
  .order-summary-section {
    .section-title {
      color: var(--text-primary);
    }
  }

  .coupon-verify-section .coupon-input,
  .order-summary-section .order-summary {
    background: var(--card-bg-color);
    border: 1px solid var(--border-color);
    border-radius: $border-radius-sm;
    box-shadow: none;
    color: var(--text-primary);
  }

  .right-column .order-summary-section .order-summary {
    background: var(--right-card-bg) !important;
    border: 1px solid var(--right-card-border) !important;
    box-shadow: none !important;
    color: var(--right-card-text) !important;
  }

  .right-column .order-summary-section .summary-row .summary-label,
  .right-column .order-summary-section .summary-row .summary-value,
  .right-column .order-summary-section .summary-row.total .summary-label,
  .right-column .order-summary-section .summary-row.total .summary-value,
  .right-column .order-summary-section .coupon-code-label {
    color: var(--right-card-text) !important;
  }

  .coupon-verify-section .coupon-input {
    padding: 14px;
    margin-bottom: 0;
  }

  .order-summary-section .coupon-input {
    padding: 0;
    margin-bottom: 0;
  }

  .order-summary-section .coupon-field {
    background: var(--input-bg-color);
    border-color: var(--border-color);
    color: var(--right-card-text);

    &::placeholder {
      color: rgba(248, 250, 252, 0.55);
    }
  }

  .order-summary-section .coupon-light-row {
    background: rgba(var(--theme-color-rgb), 0.04);
    border-color: var(--border-color);
  }

  .order-summary-section .coupon-code-label {
    color: var(--text-primary);
  }

  .order-summary-section .btn-remove-text {
    color: var(--right-card-text);
    border-color: var(--right-card-border);
    background: rgba(148, 163, 184, 0.08);
  }

  .order-summary-section .coupon-applied-tag {
    color: rgba(248, 250, 252, 0.82);
    border-color: var(--right-card-border);
    background: rgba(148, 163, 184, 0.08);
  }

  .coupon-verify-section .coupon-field {
    background: var(--input-bg-color);
    border-color: var(--border-color);
    color: var(--text-primary);

    &::placeholder {
      color: var(--secondary-text-color);
    }
  }

  .order-summary-section .order-summary {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  .order-summary-section .summary-row .summary-label,
  .order-summary-section .summary-row .summary-value {
    color: var(--text-primary);
  }

  .order-summary-section .summary-row .summary-value.discount {
    color: #f44336;
  }

  .order-summary-section .summary-row.total .summary-label,
  .order-summary-section .summary-row.total .summary-value {
    color: var(--text-primary);
  }

  .order-summary-section .summary-divider {
    background: var(--border-color);
  }

  .order-summary-section {
    margin-top: 0;
  }

  .order-summary .summary-submit-action {
    width: 100%;
    margin-top: 14px;
    height: 44px;
    padding: 0 24px;
    border-radius: $border-radius-sm;
    background-color: var(--theme-color);
    color: white;
    font-size: $font-size-md;
    font-weight: $font-weight-medium;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: none;

    &:hover:not(:disabled) {
      background-color: color-mix(in srgb, var(--theme-color) 85%, black) !important;
      transform: translateY(-2px);
      box-shadow: none;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loader {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s linear infinite;
    }
  }

  .action-buttons {
    display: flex;
    justify-content: flex-start;

    margin: 30px 0 40px 0;

    gap: 16px;

    .btn-back {
      height: 44px;

      padding: 0 20px;

      border-radius: $border-radius-sm;

      background-color: transparent;

      color: var(--text-primary);

      font-size: $font-size-md;

      font-weight: $font-weight-medium;

      display: flex;

      align-items: center;

      gap: 8px;

      border: 1px solid var(--border-color);

      cursor: pointer;

      transition: all 0.3s ease;

      box-shadow: none;

      &:hover {
        background-color: rgba(0, 0, 0, 0.05);

        transform: translateY(-2px);

        box-shadow: none;
      }
    }

    .btn-order {
      height: 44px;

      padding: 0 24px;

      border-radius: $border-radius-sm;

      background-color: var(--theme-color);

      color: white;

      font-size: $font-size-md;

      font-weight: $font-weight-medium;

      display: flex;

      align-items: center;

      gap: 8px;

      border: none;

      cursor: pointer;

      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      box-shadow: none;

      will-change: transform, box-shadow;

      &:hover:not(:disabled) {
        background-color: color-mix(
          in srgb,
          var(--theme-color) 85%,
          black
        ) !important;

        transform: translateY(-2px);

        box-shadow: none;
      }

      &:active:not(:disabled) {
        transform: translateY(0);

        box-shadow: none;
      }

      &:disabled {
        opacity: 0.6;

        cursor: not-allowed;
      }

      .loader {
        width: 16px;

        height: 16px;

        border: 2px solid rgba(255, 255, 255, 0.3);

        border-radius: 50%;

        border-top-color: white;

        animation: spin 1s linear infinite;
      }
    }
  }
}

.skeleton-card {
  width: 100%;

  height: 100%;

  position: relative;

  overflow: hidden;

  border-radius: $border-radius-sm;

  .skeleton-header {
    height: 24px;

    width: 60%;

    background-color: rgba(0, 0, 0, 0.05);

    border-radius: $border-radius-sm;

    margin-bottom: 20px;

    position: relative;

    overflow: hidden;
  }

  .skeleton-body {
    .skeleton-title {
      height: 40px;

      width: 100%;

      background-color: rgba(0, 0, 0, 0.05);

      border-radius: $border-radius-sm;

      margin-bottom: 24px;

      position: relative;

      overflow: hidden;
    }

    .skeleton-features {
      margin-bottom: 24px;

      .skeleton-feature {
        height: 16px;

        background-color: rgba(0, 0, 0, 0.05);

        border-radius: $border-radius-sm;

        margin-bottom: 12px;

        position: relative;

        overflow: hidden;

        &:nth-child(1) {
          width: 92%;
        }

        &:nth-child(2) {
          width: 85%;
        }

        &:nth-child(3) {
          width: 88%;
        }

        &:nth-child(4) {
          width: 80%;
        }
      }
    }
  }

  &::after {
    content: "";

    position: absolute;

    top: 0;

    right: 0;

    bottom: 0;

    left: 0;

    width: 30%;

    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,

      rgba(255, 255, 255, 0.15) 50%,

      rgba(255, 255, 255, 0) 100%
    );

    transform: translateX(-100%);

    animation: shimmer 2s infinite;

    will-change: transform;

    pointer-events: none;
  }
}

.skeleton-text {
  height: 16px;

  background-color: rgba(0, 0, 0, 0.05);

  border-radius: $border-radius-sm;

  position: relative;

  overflow: hidden;

  width: 100px;

  &:first-child {
    width: 70%;
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(300%);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}



@media (max-width: 991px) {
  .order-confirm-container {
    .content-wrapper {
      gap: 25px;
    }
  }
}

@media (max-width: 768px) {
  .order-confirm-container {
    margin-top: 15px;

    .welcome-card {
      padding: 15px;

      .card-header .card-title {
        font-size: $font-size-md;
      }

      .card-body p {
        font-size: $font-size-sm;
      }
    }

    .content-wrapper {
      flex-direction: column;

      gap: 20px;

      .right-column {
        max-width: none;
      }
    }

    .action-buttons {
      position: relative;

      z-index: 1;

      margin: 24px 0 30px 0;

      display: flex;

      flex-direction: row;

      gap: 12px;

      transform: none;

      opacity: 1;

      transition: none;

      .btn-back,
      .btn-order {
        flex: 1;

        min-width: 0;

        padding: 0 10px;

        justify-content: center;

        font-size: $font-size-sm;

        height: 44px;

        will-change: transform;
      }
    }

    .period-selection .period-cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));

      gap: 12px;

      .period-card {
        .period-card-inner {
          padding: 12px 8px !important;

          min-height: 80px !important;

          .period-type {
            font-size: $font-size-sm !important;

            margin-bottom: 6px !important;
          }

          .period-price {
            .currency {
              font-size: $font-size-sm !important;
            }

            .amount {
              font-size: $font-size-xl !important;
            }
          }
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .order-confirm-container {
    .section-title {
      font-size: $font-size-md;

      margin-bottom: 12px;
    }

    .coupon-input {
      flex-direction: row;

      flex-wrap: wrap;

      gap: 8px;

      .coupon-field {
        flex: 1;

        min-width: 120px;
      }

      .btn-verify {
        width: auto;

        padding: 0 15px;

        justify-content: center;

        white-space: nowrap;
      }

    }

    .plan-card,
    .order-summary {
      padding: 18px;
    }

    .period-selection .period-cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));

      gap: 10px;

      .period-card {
        .period-card-inner {
          min-height: 70px !important;
        }
      }
    }
  }
}

@media (prefers-color-scheme: dark) {
  .skeleton-card,
  .skeleton-period-card,
  .skeleton-text {
    &::after {
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0%,

        rgba(255, 255, 255, 0.08) 50%,

        rgba(255, 255, 255, 0) 100%
      );
    }
  }

  .skeleton-header,
  .skeleton-title,
  .skeleton-feature,
  .skeleton-text,
  .skeleton-period-card {
    background-color: rgba(255, 255, 255, 0.05);
  }
}

@media screen and (max-width: 768px) {
  .order-confirm-container .period-selection .period-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;

    gap: 12px !important;
  }
}

@media screen and (max-width: 480px) {
  .order-confirm-container .period-selection .period-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;

    gap: 10px !important;
  }
}

.order-confirm-container .period-selection .period-cards {
  display: grid !important;
}

@media screen and (max-width: 768px) {
  .period-cards {
    display: grid !important;

    grid-template-columns: repeat(2, 1fr) !important;

    gap: 12px !important;
  }
}

@media screen and (max-width: 480px) {
  .period-cards {
    display: grid !important;

    grid-template-columns: repeat(2, 1fr) !important;

    gap: 10px !important;
  }
}

:deep(.period-cards) {
  display: grid !important;

  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;

  gap: 15px !important;

  width: 100% !important;
}

@media screen and (max-width: 768px) {
  :deep(.period-cards) {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;

    gap: 12px !important;
  }
}

@media screen and (max-width: 480px) {
  :deep(.period-cards) {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;

    gap: 10px !important;
  }
}
</style>
