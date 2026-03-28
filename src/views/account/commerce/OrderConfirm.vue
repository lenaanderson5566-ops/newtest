<template>
  <div class="order-confirm-container page-shell">
    <div class="order-confirm-inner page-inner page-stack">
      <!-- 内容主体 -->

      <div class="content-wrapper">
        <!-- 左侧内容：订阅信息和周期选择 -->

        <div class="left-column">
          <div class="section-wrapper subscription-intro-section" v-if="loading.plan">
            <div class="skeleton-card">
              <div class="skeleton-header"></div>
              <div class="skeleton-body">
                <div class="skeleton-title"></div>
                <div class="skeleton-features">
                  <div class="skeleton-feature" v-for="j in 4" :key="'feature-' + j"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="section-wrapper subscription-intro-section" v-else-if="plan">
            <div class="section-title">
              <span>
                选择订阅计划
                <em v-if="isSelectionLocked" class="locked-tip">（当前未支付订单已锁定）</em>
              </span>
              <button
                v-if="isSelectionLocked"
                type="button"
                class="btn-unlock-selection"
                :disabled="loading.lockedOrder"
                @click="unlockSelection"
              >
                重新选择
              </button>
            </div>
            <div class="plan-selector-grid">
              <button
                v-for="(item, idx) in displayPlanOptions"
                :key="`order-plan-${item.id}`"
                type="button"
                class="plan-selector-btn"
                :class="{ active: Number(plan?.id) === Number(item.id), 'is-current': isCurrentPlanOption(item), 'is-locked': isSelectionLocked, [`tone-${(idx % 3) + 1}`]: true }"
                :disabled="isSelectionLocked"
                @click="selectPlanOption(item)"
              >
                <span class="selector-current-badge" v-if="isCurrentPlanOption(item)">{{ currentPlanBadgeLabel }}</span>
                <span class="selector-name">{{ item.name }}</span>
                <span class="selector-check" v-if="Number(plan?.id) === Number(item.id)">
                  <IconCheck :size="14" />
                </span>
              </button>
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
                  :class="{ active: selectedPriceType === type, 'is-locked': isSelectionLocked }"
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

          <div class="section-wrapper payment-methods-section" v-if="!loading.plan">
            <div class="section-title">
              <span>{{ $t("payment.payment_method") }}</span>
            </div>
            <div class="payment-methods" v-if="!loading.methods">
              <button
                class="payment-method-item"
                type="button"
                v-for="method in paymentMethods"
                :key="`payment-method-${method.id}`"
                :class="{ active: Number(selectedMethod) === Number(method.id) }"
                @click="selectPaymentMethod(method.id)"
              >
                <div class="method-check left-check">
                  <IconCircleCheck
                    v-if="Number(selectedMethod) === Number(method.id)"
                    :size="22"
                  />
                  <IconCircle v-else :size="20" />
                </div>
                <div class="method-details">
                  <span class="method-name">{{ method.name }}</span>
                  <span
                    class="method-fee"
                    v-if="method.handling_fee_percent || method.handling_fee_fixed"
                  >
                    {{ formatMethodFee(method) }}
                  </span>
                </div>
                <div class="method-icon right-icon">
                  <IconCreditCard v-if="!method.icon" :size="26" />
                  <img v-else :src="method.icon" :alt="method.name" />
                </div>
              </button>
            </div>
            <div class="skeleton-card methods-skeleton" v-else>
              <div
                class="skeleton-payment-method"
                v-for="i in 2"
                :key="'method-' + i"
              ></div>
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
              <div class="summary-header-block">
                <div class="summary-title">订单摘要</div>
              </div>

              <div v-if="showCouponInputSection" class="coupon-merge-block compact">
                <template v-if="!couponApplied">
                  <div class="coupon-input">
                    <input
                      type="text"
                      v-model="couponCode"
                      :disabled="loading.plan"
                      :placeholder="$t('order.enter_coupon')"
                      class="coupon-field"
                      spellcheck="false"
                      autocapitalize="off"
                      autocomplete="off"
                    />
                    <button
                      class="btn-verify"
                      @click="verifyCoupon"
                      :disabled="!couponCode || verifying || loading.plan"
                    >
                      <IconDiscount2 v-if="!verifying" />
                      <span v-else class="loader"></span>
                      <span>{{ $t("order.verify_coupon") }}</span>
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div class="coupon-applied-inline">
                    <span class="coupon-code-text">优惠码：{{ couponCode }}</span>
                    <span class="coupon-applied-tag">已应用</span>
                    <button class="btn-remove-text" @click="removeCoupon">移除</button>
                  </div>
                </template>
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
                <div class="summary-amounts">
                  <div class="summary-row">
                    <div class="summary-label">{{ selectedOrderDisplay }}</div>
                    <div class="summary-value">{{ formatCurrencyAmount(summaryOriginalPrice) }}</div>
                  </div>

                  <div class="summary-row" v-if="totalDiscountDisplayAmount > 0">
                    <div class="summary-label summary-label-with-action">
                      <span>总优惠</span>
                      <button
                        v-if="hasDiscountDetails"
                        type="button"
                        class="btn-remove-text summary-detail-toggle inline"
                        @click="showDiscountDetails = !showDiscountDetails"
                      >
                        {{ showDiscountDetails ? "收起明细" : "查看明细" }}
                      </button>
                    </div>
                    <div class="summary-value discount">-{{ formatCurrencyAmount(totalDiscountDisplayAmount) }}</div>
                  </div>

                  <template v-if="showDiscountDetails">
                    <div class="summary-row" v-if="couponDiscountAmount > 0">
                      <div class="summary-label">优惠券</div>
                      <div class="summary-value discount">-{{ formatCurrencyAmount(couponDiscountAmount) }}</div>
                    </div>
                    <div class="summary-row" v-if="userDiscountAmount > 0">
                      <div class="summary-label">会员折扣</div>
                      <div class="summary-value discount">-{{ formatCurrencyAmount(userDiscountAmount) }}</div>
                    </div>
                    <div class="summary-row" v-if="surplusDeductionAmount > 0">
                      <div class="summary-label">当前套餐抵扣</div>
                      <div class="summary-value discount">-{{ formatCurrencyAmount(surplusDeductionAmount) }}</div>
                    </div>
                  </template>

                  <div class="summary-divider compact" v-if="balanceDeductionAmount > 0"></div>
                  <div class="summary-row" v-if="balanceDeductionAmount > 0">
                    <div class="summary-label">余额支付</div>
                    <div class="summary-value discount">-{{ formatCurrencyAmount(balanceDeductionAmount) }}</div>
                  </div>
                </div>

                <div class="summary-divider strong"></div>

                <div class="payable-block">
                  <div class="payable-label">应付金额</div>
                  <div class="payable-value">{{ formatCurrencyAmount(totalWithFee) }}</div>
                </div>

                <button
                  class="btn-order summary-submit-action"
                  @click="submitOrder"
                  :disabled="
                    (!isContinuePaymentMode && !selectedPriceType) ||
                    loading.submitting ||
                    loading.paying ||
                    loading.plan ||
                    loading.preview ||
                    loading.lockedOrder ||
                    !isLockedOrderReady ||
                    (totalWithFee > 0 && !selectedMethod)
                  "
                >
                  <IconShoppingCart v-if="!loading.submitting && !loading.paying" :size="18" />

                  <span v-else class="loader"></span>

                  <span>{{ payActionLabel }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->

        </div>
      </div>
    </div>

    <transition name="modal-fade">
      <div v-if="showPaymentModal" class="pending-order-modal payment-modal">
        <div class="pending-order-overlay" @click="closePaymentModal"></div>
        <div class="pending-order-dialog payment-dialog" role="dialog" aria-modal="true">
          <div class="pending-order-header">
            <h3>{{ $t("payment.payment_method") }}</h3>
            <p v-if="paymentQRCode">{{ $t("payment.scan_qrcode") }}</p>
            <p v-else-if="paymentLink">{{ $t("payment.open_in_new_tab") }}</p>
          </div>
          <div class="payment-qrcode-wrap" v-if="paymentQRCode">
            <QrcodeVue :value="paymentQRCode" :size="220" level="M" />
          </div>
          <div class="payment-link-wrap" v-if="paymentLink">
            <a :href="paymentLink" target="_blank" rel="noopener noreferrer">
              {{ paymentLink }}
            </a>
          </div>
          <div class="pending-order-actions">
            <button class="btn-return-orders cancel-btn" @click="closePaymentModal">
              {{ $t("common.cancel") }}
            </button>
            <button class="btn-confirm-cancel confirm-btn" @click="checkPaymentStatusNow">
              {{ $t("payment.check_payment") }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showPaymentSuccessPrompt" class="payment-success-toast">
        <IconCheck :size="18" />
        <span>{{ $t("payment.pay_success") }}</span>
      </div>
    </transition>

  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, watch, onBeforeUnmount } from "vue";

import { useI18n } from "vue-i18n";

import { useToast } from "@/composables/useToast";

import { useRoute, useRouter } from "vue-router";

import {
  getCommConfig,
  fetchPlans,
  fetchPlanById,
  getPaymentMethods,
  checkOrderStatus,
  verifyCoupon as checkCoupon,
  submitOrder as createOrder,
  previewOrder as fetchOrderPreview,
  cancelOrder as cancelOrderByTradeNo,
  checkoutOrder,
  getOrderDetail,
} from "@/api/account/shop";

import { getUserInfo, getSubscribe } from "@/api/overview/dashboard";
import { fetchOrderList } from "@/api/account/orderlist";
import QrcodeVue from "qrcode.vue";

import {
  IconCheck,
  IconX,
  IconBox,
  IconShoppingCart,
  IconDiscount2,
  IconCircleCheck,
  IconCircle,
  IconCreditCard,
} from "@tabler/icons-vue";

export default {
  name: "OrderConfirm",

  components: {
    IconCheck,

    IconX,

    IconBox,

    IconShoppingCart,

    IconDiscount2,

    IconCircleCheck,

    IconCircle,

    IconCreditCard,
    QrcodeVue,
  },

  setup() {
    const { t, locale } = useI18n();

    const { showToast } = useToast();

    const route = useRoute();

    const router = useRouter();

    const loading = reactive({
      plan: true,

      userInfo: true,
      methods: false,
      lockedOrder: false,
      preview: false,

      submitting: false,
      paying: false,
    });

    const plan = ref(null);
    const planOptions = ref([]);

    const userInfo = ref(null);

    const currency = ref("CNY");

    const currencySymbol = ref("¥");

    const selectedPriceType = ref("");
    const recurringTypes = [
      "month_price",
      "quarter_price",
      "half_year_price",
      "year_price",
      "two_year_price",
      "three_year_price",
    ];

    const normalizePriceValue = (targetPlan, periodType) => {
      if (!targetPlan || !periodType) return null;
      const rawValue = targetPlan[periodType];
      if (rawValue === null || rawValue === undefined || rawValue === "") {
        return null;
      }
      const parsed = Number(rawValue);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    };

    const hasPeriodPrice = (targetPlan, periodType) =>
      normalizePriceValue(targetPlan, periodType) !== null;

    const hasRecurringPrice = (targetPlan) =>
      recurringTypes.some((type) => hasPeriodPrice(targetPlan, type));

    const isOnetimeOnly = (targetPlan) =>
      hasPeriodPrice(targetPlan, "onetime_price") && !hasRecurringPrice(targetPlan);

    const couponCode = ref("");

    const couponApplied = ref(false);

    const couponErrorMessage = ref("");

    const verifying = ref(false);

    const couponInfo = ref(null);

    const paymentMethods = ref([]);
    const selectedMethod = ref(null);
    const showPaymentModal = ref(false);
    const paymentQRCode = ref("");
    const paymentLink = ref("");
    const paymentTradeNo = ref("");
    const paymentCheckTimer = ref(null);
    const showPaymentSuccessPrompt = ref(false);
    const hasNavigatedAfterSuccess = ref(false);
    const showDiscountDetails = ref(false);
    const lockedPendingOrder = ref(null);
    const lockedOrderDetail = ref(null);
    const orderPreview = ref(null);
    const previewRequestSerial = ref(0);
    const currentSubscribedPlanId = ref(null);
    const isCurrentSubscriptionExpired = ref(false);
    const isSelectionLocked = computed(() => Boolean(lockedPendingOrder.value));
    const isContinuePaymentMode = computed(
      () => Boolean(isSelectionLocked.value && lockedPendingOrder.value?.trade_no)
    );
    const isLockedOrderReady = computed(
      () => !isContinuePaymentMode.value || Boolean(lockedOrderDetail.value)
    );
    const showCouponInputSection = computed(() => !isContinuePaymentMode.value);
    const hasAnyWalletBalance = computed(() => {
      const wallets = Array.isArray(userInfo.value?.wallets) ? userInfo.value.wallets : [];
      const hasWalletBalance = wallets.some((wallet) => Number(wallet?.balance || 0) > 0);
      if (hasWalletBalance) {
        return true;
      }
      return Number(userInfo.value?.balance || 0) > 0;
    });
    const hasValidSubscription = computed(() =>
      Boolean(currentSubscribedPlanId.value) && !isCurrentSubscriptionExpired.value
    );
    const shouldUseServerPreview = computed(
      () =>
        !isContinuePaymentMode.value &&
        Boolean(plan.value?.id) &&
        Boolean(selectedPriceType.value) &&
        (hasValidSubscription.value || hasAnyWalletBalance.value)
    );

    const discountPercent = ref(0);

    const originalPrice = computed(() => {
      if (!plan.value || !selectedPriceType.value) return 0;

      return plan.value[selectedPriceType.value] || 0;
    });
    const summaryOriginalPrice = computed(() => {
      if (isContinuePaymentMode.value) {
        const directAmount = Number(
          lockedOrderDetail.value?.plan?.[lockedOrderDetail.value?.period] ?? 0
        );
        if (Number.isFinite(directAmount) && directAmount >= 0) {
          return directAmount;
        }
        return 0;
      }
      if (shouldUseServerPreview.value && orderPreview.value) {
        const previewTotal = Number(orderPreview.value?.total_amount || 0);
        const previewBalance = Math.max(0, Number(orderPreview.value?.balance_amount || 0));
        const previewSurplus = Math.max(0, Number(orderPreview.value?.surplus_amount || 0));
        return Math.max(0, previewTotal + previewBalance + previewSurplus);
      }
      return originalPrice.value;
    });

    const couponDiscountAmount = computed(() => {
      if (isContinuePaymentMode.value) {
        const amount = Number(lockedOrderDetail.value?.coupon_discount_amount || 0);
        return Number.isFinite(amount) ? Math.max(0, Math.abs(amount)) : 0;
      }
      if (shouldUseServerPreview.value && orderPreview.value) {
        const amount = Number(orderPreview.value?.coupon_discount_amount || 0);
        return Number.isFinite(amount) ? Math.max(0, Math.abs(amount)) : 0;
      }
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
      if (isContinuePaymentMode.value) {
        const amount = Number(lockedOrderDetail.value?.user_discount_amount || 0);
        return Number.isFinite(amount) ? Math.max(0, Math.abs(amount)) : 0;
      }
      if (shouldUseServerPreview.value && orderPreview.value) {
        const amount = Number(orderPreview.value?.user_discount_amount || 0);
        return Number.isFinite(amount) ? Math.max(0, Math.abs(amount)) : 0;
      }
      if (originalPrice.value <= 0 || userDiscountPercent.value <= 0) {
        return 0;
      }

      return Math.round(originalPrice.value * (userDiscountPercent.value / 100));
    });

    const totalDiscountAmount = computed(() => {
      if (isContinuePaymentMode.value) {
        const amount = Number(lockedOrderDetail.value?.discount_amount);
        if (Number.isFinite(amount)) {
          return Math.max(0, Math.abs(amount));
        }
      }
      return Math.max(0, couponDiscountAmount.value + userDiscountAmount.value);
    });
    const finalPrice = computed(() => {
      if (isContinuePaymentMode.value) {
        const amount = Number(lockedOrderDetail.value?.total_amount || 0);
        return Number.isFinite(amount) ? Math.max(0, amount) : 0;
      }
      if (shouldUseServerPreview.value && orderPreview.value) {
        const amount = Number(orderPreview.value?.total_amount || 0);
        return Number.isFinite(amount) ? Math.max(0, amount) : 0;
      }
      return Math.max(0, originalPrice.value - totalDiscountAmount.value);
    });
    const surplusDeductionAmount = computed(() => {
      if (isContinuePaymentMode.value) {
        const amount = Number(lockedOrderDetail.value?.surplus_amount || 0);
        return Number.isFinite(amount) ? Math.max(0, Math.abs(amount)) : 0;
      }
      if (shouldUseServerPreview.value && orderPreview.value) {
        const amount = Number(orderPreview.value?.surplus_amount || 0);
        return Number.isFinite(amount) ? Math.max(0, Math.abs(amount)) : 0;
      }
      return 0;
    });
    const balanceDeductionAmount = computed(() => {
      if (isContinuePaymentMode.value) {
        const amount = Number(lockedOrderDetail.value?.balance_amount || 0);
        if (!Number.isFinite(amount)) {
          return 0;
        }
        return Math.max(0, Math.abs(amount));
      }
      if (shouldUseServerPreview.value && orderPreview.value) {
        const amount = Number(orderPreview.value?.balance_amount || 0);
        if (!Number.isFinite(amount)) {
          return 0;
        }
        return Math.max(0, Math.abs(amount));
      }
      const userBalance = Number(userInfo.value?.balance || 0);
      if (!Number.isFinite(userBalance) || userBalance <= 0) {
        return 0;
      }
      return Math.min(userBalance, finalPrice.value);
    });
    const totalWithFee = computed(() => {
      if (isContinuePaymentMode.value) {
        const amount = Number(lockedOrderDetail.value?.total_amount || 0);
        return Number.isFinite(amount) ? Math.max(0, amount) : 0;
      }
      return Math.max(0, finalPrice.value - balanceDeductionAmount.value);
    });

    const refreshOrderPreview = async () => {
      if (!shouldUseServerPreview.value) {
        orderPreview.value = null;
        return;
      }
      const requestId = previewRequestSerial.value + 1;
      previewRequestSerial.value = requestId;
      loading.preview = true;
      try {
        const payload = {
          plan_id: Number(plan.value?.id),
          period: selectedPriceType.value,
        };
        if (couponApplied.value && couponCode.value) {
          payload.coupon_code = couponCode.value;
        }
        const response = await fetchOrderPreview(payload);
        if (requestId !== previewRequestSerial.value) {
          return;
        }
        orderPreview.value = response?.data || null;
      } catch (error) {
        if (requestId !== previewRequestSerial.value) {
          return;
        }
        orderPreview.value = null;
        showToast(
          error?.response?.message || error?.message || "订单预览加载失败，已切换为本地估算金额",
          "warning"
        );
      } finally {
        if (requestId === previewRequestSerial.value) {
          loading.preview = false;
        }
      }
    };

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

    const availablePrices = computed(() => {
      if (!plan.value) return {};

      const prices = {};

      recurringTypes.forEach((type) => {
        if (hasPeriodPrice(plan.value, type)) {
          prices[type] = normalizePriceValue(plan.value, type);
        }
      });

      // 与订阅计划页保持一致：有周期套餐时，不展示 onetime
      if (!hasRecurringPrice(plan.value) && hasPeriodPrice(plan.value, "onetime_price")) {
        prices.onetime_price = normalizePriceValue(plan.value, "onetime_price");
      }

      return prices;
    });

    const displayPlanOptions = computed(() => {
      if (planOptions.value.length) {
        return planOptions.value.filter((item) => !isOnetimeOnly(item));
      }
      if (plan.value && !isOnetimeOnly(plan.value)) {
        return [plan.value];
      }
      return [];
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

    const payActionLabel = computed(() => {
      if (totalWithFee.value <= 0) return "立即开通";
      return isContinuePaymentMode.value ? "继续支付" : "立即支付";
    });
    const selectedOrderDisplay = computed(() => {
      const planName = plan.value?.name || "-";
      const periodType = isContinuePaymentMode.value
        ? String(lockedPendingOrder.value?.period || "")
        : selectedPriceType.value;
      if (!periodType) {
        return planName;
      }
      return `${planName} · ${formatPeriodOption(periodType)}`;
    });
    const totalDiscountDisplayAmount = computed(() =>
      Math.max(
        0,
        couponDiscountAmount.value + userDiscountAmount.value + surplusDeductionAmount.value
      )
    );
    const hasDiscountDetails = computed(
      () =>
        couponDiscountAmount.value > 0 ||
        userDiscountAmount.value > 0 ||
        surplusDeductionAmount.value > 0
    );
    const currentPlanBadgeLabel = computed(() =>
      isCurrentSubscriptionExpired.value ? "您最近的订阅" : t("shop.plan.current")
    );

    const selectPriceType = (type) => {
      if (isSelectionLocked.value) return;
      selectedPriceType.value = type;
    };

    const isCurrentPlanOption = (targetPlan) => {
      const currentPlanId = Number(
        currentSubscribedPlanId.value || userInfo.value?.plan_id || 0
      );
      if (!currentPlanId) return false;
      return Number(targetPlan?.id) === currentPlanId;
    };

    const selectPlanOption = (targetPlan) => {
      if (isSelectionLocked.value) return;
      if (!targetPlan) return;
      plan.value = { ...targetPlan };
      const firstValidPriceType = Object.keys(availablePrices.value)[0];
      selectedPriceType.value = firstValidPriceType || "";
      removeCoupon({ silent: true });
    };

    const selectPaymentMethod = (methodId) => {
      selectedMethod.value = methodId;
    };

    const unlockSelection = async () => {
      if (!isSelectionLocked.value) return;
      const tradeNo = String(lockedPendingOrder.value?.trade_no || "");
      loading.lockedOrder = true;
      try {
        if (tradeNo) {
          await cancelOrderByTradeNo(tradeNo);
        }
        lockedPendingOrder.value = null;
        lockedOrderDetail.value = null;
        if (route.query.trade_no) {
          const nextQuery = { ...route.query };
          delete nextQuery.trade_no;
          await router.replace({ query: nextQuery });
        }
        showToast("已取消原待支付订单，可重新选择订阅规格与周期", "success");
      } catch (error) {
        showToast(
          error?.response?.message || error?.message || "取消原订单失败，请稍后重试",
          "error"
        );
      } finally {
        loading.lockedOrder = false;
      }
    };

    const formatMethodFee = (method) => {
      if (!method) return "";
      const fixed = Number(method.handling_fee_fixed || 0);
      const percent = Number(method.handling_fee_percent || 0);
      if (fixed > 0) {
        return `${t("payment.fee")}: ${displayCurrency.value} ${(fixed / 100).toFixed(2)}`;
      }
      if (percent > 0) {
        return `${t("payment.fee")}: ${percent}%`;
      }
      return "";
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

    const fetchLatestPendingOrder = async (tradeNo = "") => {
      try {
        const resp = await fetchOrderList();
        const orders = Array.isArray(resp?.data) ? resp.data : [];
        const pendingOrders = orders.filter(
          (item) => Number(item?.status) === 0
        );
        pendingOrders.sort((a, b) => {
          const aTs = new Date(a?.created_at || 0).getTime();
          const bTs = new Date(b?.created_at || 0).getTime();
          if (aTs !== bTs) return bTs - aTs;
          return Number(b?.id || 0) - Number(a?.id || 0);
        });
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

    const fetchLockedOrderDetail = async () => {
      if (!isContinuePaymentMode.value) {
        lockedOrderDetail.value = null;
        return;
      }
      loading.lockedOrder = true;
      try {
        const tradeNo = String(lockedPendingOrder.value?.trade_no || "");
        const response = await getOrderDetail(tradeNo);
        lockedOrderDetail.value = response?.data || null;
      } catch (err) {
        console.error("Failed to fetch locked order detail:", err);
        lockedOrderDetail.value = null;
        showToast(err?.response?.message || err?.message || "未能读取待支付订单详情", "error");
      } finally {
        loading.lockedOrder = false;
      }
    };

    const closePaymentModal = () => {
      showPaymentModal.value = false;
      paymentQRCode.value = "";
      paymentLink.value = "";
    };

    const handlePaymentSuccess = () => {
      if (paymentCheckTimer.value) {
        clearInterval(paymentCheckTimer.value);
        paymentCheckTimer.value = null;
      }
      if (hasNavigatedAfterSuccess.value) {
        return;
      }
      hasNavigatedAfterSuccess.value = true;
      closePaymentModal();
      showPaymentSuccessPrompt.value = true;
      showToast(t("payment.payment_successful"), "success");
      setTimeout(() => {
        showPaymentSuccessPrompt.value = false;
      }, 2600);
      if (paymentTradeNo.value) {
        setTimeout(() => {
          router.push({
            path: "/payment",
            query: {
              trade_no: paymentTradeNo.value,
              from: "order-confirm",
            },
          });
        }, 900);
      }
    };

    const performPaymentCheck = async (tradeNo = paymentTradeNo.value) => {
      if (!tradeNo) return;
      try {
        const response = await checkOrderStatus(tradeNo);
        if (response.data === 1 || (response.data !== 0 && response.data !== 2)) {
          handlePaymentSuccess();
          return;
        }
        if (response.data === 2) {
          if (paymentCheckTimer.value) {
            clearInterval(paymentCheckTimer.value);
            paymentCheckTimer.value = null;
          }
          showToast(t("payment.order_cancelled"), "warning");
          closePaymentModal();
        }
      } catch (error) {
        console.error("Failed to check payment status:", error);
      }
    };

    const checkPaymentStatusNow = async () => {
      const tradeNo =
        paymentTradeNo.value || String(lockedPendingOrder.value?.trade_no || "");
      if (!tradeNo) {
        showToast("未找到待支付订单号", "warning");
        return;
      }
      paymentTradeNo.value = tradeNo;
      await performPaymentCheck(tradeNo);
    };

    const startPaymentCheck = (tradeNo) => {
      if (!tradeNo) return;
      paymentTradeNo.value = tradeNo;
      if (paymentCheckTimer.value) {
        clearInterval(paymentCheckTimer.value);
      }
      paymentCheckTimer.value = setInterval(() => {
        performPaymentCheck(tradeNo);
      }, 5000);
    };

    const submitOrder = async () => {
      if (loading.submitting || loading.paying) return;
      if (!isLockedOrderReady.value) {
        showToast("待支付订单数据加载中，请稍后重试", "warning");
        return;
      }
      if (totalWithFee.value > 0 && !selectedMethod.value) {
        showToast(t("payment.select_method_first"), "warning");
        return;
      }
      if (isContinuePaymentMode.value) {
        await checkoutTradeNo(String(lockedPendingOrder.value?.trade_no || ""));
        return;
      }
      if (!selectedPriceType.value) return;

      await executeOrderSubmission();
    };

    const openExternalPaymentLink = (paymentLink) => {
      if (!paymentLink) return;
      const tempLink = document.createElement("a");
      tempLink.href = paymentLink;
      tempLink.target = "_blank";
      tempLink.rel = "noopener noreferrer";
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
    };

    const checkoutTradeNo = async (tradeNo) => {
      if (!tradeNo) return;
      hasNavigatedAfterSuccess.value = false;
      paymentTradeNo.value = tradeNo;
      loading.paying = true;
      try {
        const methodForCheckout =
          selectedMethod.value ||
          (paymentMethods.value.length > 0 ? paymentMethods.value[0].id : null);
        const checkoutResp = await checkoutOrder(tradeNo, methodForCheckout);
        if (!checkoutResp?.data) {
          showToast(checkoutResp?.message || t("payment.check_failed"), "error");
          return;
        }

        if (totalWithFee.value <= 0) {
          showToast(t("payment.payment_processing"), "info");
          await performPaymentCheck(tradeNo);
          if (!showPaymentSuccessPrompt.value) {
            setTimeout(() => {
              performPaymentCheck(tradeNo);
            }, 1000);
          }
          return;
        }

        if (checkoutResp.type === 1) {
          openExternalPaymentLink(checkoutResp.data);
          paymentLink.value = checkoutResp.data;
          paymentQRCode.value = "";
          showPaymentModal.value = true;
          startPaymentCheck(tradeNo);
          showToast(t("payment.payment_processing"), "info");
          return;
        }

        paymentQRCode.value = checkoutResp.data;
        paymentLink.value = "";
        showPaymentModal.value = true;
        startPaymentCheck(tradeNo);
        showToast(t("payment.scan_qrcode"), "info");
      } catch (checkoutError) {
        console.error("Failed to checkout order:", checkoutError);
        showToast(
          checkoutError?.response?.message ||
            checkoutError?.message ||
            t("payment.check_failed"),
          "error"
        );
      } finally {
        loading.paying = false;
      }
    };

    // 实际的订单提交逻辑

    const executeOrderSubmission = async () => {
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
          await checkoutTradeNo(response.data);
        } else {
          showToast(response.message || t("order.order_failed"), "error");
        }
      } catch (error) {
        console.error("Failed to submit order:", error);

        const message = error.response?.message || error.message || t("order.order_failed");
        showToast(message, "error");
      } finally {
        loading.submitting = false;
      }
    };

    const fetchPlanData = async () => {
      loading.plan = true;

      try {
        const lockedPlanId =
          Number(lockedPendingOrder.value?.plan_id || lockedPendingOrder.value?.plan?.id || 0) || null;
        const targetPlanId = lockedPlanId || Number(route.query.id || 0) || null;
        if (!targetPlanId) {
          showToast(t("order.no_plan_selected"), "error");

          router.push("/shop");

          return;
        }

        const response = await fetchPlanById(targetPlanId, locale.value);
        try {
          const plansResponse = await fetchPlans(locale.value);
          if (Array.isArray(plansResponse?.data)) {
            planOptions.value = plansResponse.data.filter((item) => !isOnetimeOnly(item));
          }
        } catch (planListError) {
          console.warn("Failed to fetch plan list for selector:", planListError);
          planOptions.value = [];
        }

        if (response.data) {
          plan.value = response.data;

          const lockedPeriod = String(lockedPendingOrder.value?.period || "");
          if (lockedPeriod && hasPeriodPrice(plan.value, lockedPeriod)) {
            selectedPriceType.value = lockedPeriod;
          } else if (route.query.period && hasPeriodPrice(plan.value, route.query.period)) {
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

    const fetchCurrentSubscriptionStatus = async () => {
      try {
        const response = await getSubscribe();
        const subscribe = response?.data || {};
        currentSubscribedPlanId.value =
          Number(subscribe.plan_id || subscribe.plan?.id || 0) || null;
        const expiredAt = Number(subscribe?.expired_at || 0);
        isCurrentSubscriptionExpired.value =
          Number.isFinite(expiredAt) && expiredAt > 0
            ? expiredAt * 1000 <= Date.now()
            : false;
      } catch (error) {
        currentSubscribedPlanId.value = null;
        isCurrentSubscriptionExpired.value = false;
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

    const fetchAvailablePaymentMethods = async () => {
      loading.methods = true;
      try {
        const response = await getPaymentMethods();
        if (Array.isArray(response?.data)) {
          paymentMethods.value = response.data;
          if (!selectedMethod.value && paymentMethods.value.length > 0) {
            selectedMethod.value = paymentMethods.value[0].id;
          }
        } else {
          paymentMethods.value = [];
        }
      } catch (error) {
        console.error("Failed to fetch payment methods:", error);
        paymentMethods.value = [];
        showToast(t("payment.failed_to_fetch_methods"), "error");
      } finally {
        loading.methods = false;
      }
    };

    const removeCoupon = ({ silent = false } = {}) => {
      const hadCouponState =
        couponApplied.value ||
        Boolean(couponCode.value) ||
        Boolean(couponInfo.value) ||
        discountPercent.value > 0;

      couponCode.value = "";

      couponApplied.value = false;

      discountPercent.value = 0;

      couponInfo.value = null;
      couponErrorMessage.value = "";

      if (!silent && hadCouponState) {
        showToast(t("order.coupon_removed"), "info");
      }
    };

    watch(
      () => locale.value,
      (newLanguage, oldLanguage) => {
        if (!oldLanguage || newLanguage === oldLanguage) {
          return;
        }

        fetchPlanData();
      }
    );

    watch(
      () => [plan.value?.id, selectedPriceType.value, lockedPendingOrder.value?.trade_no],
      () => {
        showDiscountDetails.value = false;
      }
    );

    watch(
      [
        () => plan.value?.id,
        () => selectedPriceType.value,
        () => couponApplied.value,
        () => couponCode.value,
        () => isContinuePaymentMode.value,
        () => currentSubscribedPlanId.value,
        () => isCurrentSubscriptionExpired.value,
        () => userInfo.value?.balance,
        () =>
          Array.isArray(userInfo.value?.wallets)
            ? userInfo.value.wallets.map((wallet) => Number(wallet?.balance || 0)).join(",")
            : "",
      ],
      async () => {
        await refreshOrderPreview();
      }
    );
    onMounted(async () => {
      const tasks = [
        fetchUserInfo(),
        fetchCurrentSubscriptionStatus(),
        fetchConfig(),
        fetchAvailablePaymentMethods(),
      ];
      lockedPendingOrder.value = await fetchLatestPendingOrder(
        route.query.trade_no ? String(route.query.trade_no) : ""
      );
      await fetchLockedOrderDetail();
      if (route.query.id || lockedPendingOrder.value?.plan_id || lockedPendingOrder.value?.plan?.id) {
        tasks.unshift(fetchPlanData());
      }
      await Promise.all(tasks);

      if (route.query.trade_no) {
        paymentTradeNo.value = String(route.query.trade_no);
        await performPaymentCheck(paymentTradeNo.value);
      }
    });

    onBeforeUnmount(() => {
      if (paymentCheckTimer.value) {
        clearInterval(paymentCheckTimer.value);
        paymentCheckTimer.value = null;
      }
    });

    return {
      plan,
      planOptions,
      displayPlanOptions,

      userInfo,

      loading,

      currency,

      currencySymbol,

      displayCurrency,

      selectedPriceType,
      isSelectionLocked,
      isContinuePaymentMode,
      isLockedOrderReady,
      showCouponInputSection,
      payActionLabel,
      showDiscountDetails,
      selectedOrderDisplay,
      totalDiscountDisplayAmount,
      hasDiscountDetails,

      couponCode,

      couponApplied,

      couponErrorMessage,

      verifying,

      couponInfo,
      paymentMethods,
      selectedMethod,

      originalPrice,
      summaryOriginalPrice,

      couponDiscountAmount,

      userDiscountAmount,

      totalDiscountAmount,

      finalPrice,
      surplusDeductionAmount,

      balanceDeductionAmount,

      totalWithFee,

      formatCurrencyAmount,

      availablePrices,

      bestValuePeriod,

      getPriceTypeKey,

      formatPeriodOption,

      selectPriceType,
      selectPlanOption,
      unlockSelection,
      selectPaymentMethod,
      formatMethodFee,
      isCurrentPlanOption,
      currentPlanBadgeLabel,
      showPeriodDiscountTag,
      getPeriodDiscountPercent,
      getPeriodOriginalPrice,

      verifyCoupon,

      submitOrder,

      shouldShowStockBadge,

      getPlanStockText,

      getStockBadgeClass,

      removeCoupon,

      showPaymentModal,
      paymentQRCode,
      paymentLink,
      closePaymentModal,
      checkPaymentStatusNow,
      showPaymentSuccessPrompt,

    };
  },
};
</script>

<style lang="scss" scoped>
@use "sass:map";
@use "@/assets/styles/base/variables.scss" as *;

.order-confirm-container {
  padding: 0;

  :deep(.page-inner) {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  display: flex;

  justify-content: center;

  margin-top: 0;

  min-height: auto;

  .order-confirm-inner {
    width: 100%;

    
    padding-bottom: var(--page-content-bottom-gap, 12px);
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

        color: var(--text-tertiary);

        font-size: $font-size-md;

        line-height: 1.6;
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
      display: flex;
      align-items: center;
      justify-content: space-between;

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

      .locked-tip {
        font-style: normal;
        font-size: $font-size-sm;
        color: var(--text-tertiary);
        margin-left: 4px;
      }

      .btn-unlock-selection {
        height: 30px;
        padding: 0 10px;
        border: 1px solid rgba(var(--theme-color-rgb), 0.38);
        border-radius: $border-radius-sm;
        background: transparent;
        color: var(--theme-color);
        font-size: $font-size-sm;
        cursor: pointer;
      }
    }
  }

  .subscription-intro-section {
    border: none;
    background: transparent;
    padding: 0;
    margin-bottom: map.get($spacers, 1);
  }

  .plan-selector-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .plan-selector-btn {
    position: relative;
    border: 1px solid var(--border-color);
    border-radius: $border-radius;
    background: var(--card-background);
    min-height: 110px;
    padding: 12px;
    text-align: left;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.22s ease;

    &.active {
      border-color: rgba(var(--theme-color-rgb), 0.68);
      color: var(--text-on-dark-primary);
    }

    &.active.tone-1 { background: linear-gradient(135deg, #2259aa 0%, #5a39d8 100%); }
    &.active.tone-2 { background: linear-gradient(135deg, #2259aa 0%, #b737d9 100%); }
    &.active.tone-3 { background: linear-gradient(135deg, #2f4b9e 0%, #ea1d2c 100%); }

    &:disabled,
    &.is-locked {
      cursor: not-allowed;
    }
  }

  .selector-current-badge {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 30px;
    border-radius: $border-radius $border-radius 0 0;
    background: #222;
    color: var(--text-on-dark-primary);
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .selector-name {
    margin-top: 30px;
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    line-height: 1.2;
  }

  .selector-check {
    position: absolute;
    right: 6px;
    bottom: 6px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--card-background);
    color: var(--theme-color);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .section-wrapper.period-section {
    background-color: var(--background-color) !important;
    border: none !important;
    box-shadow: none !important;
    margin-bottom: map.get($spacers, 1) !important;
  }

  .section-wrapper.subscription-intro-section,
  .section-wrapper.payment-methods-section {
    background-color: var(--background-color) !important;
    border: none !important;
    box-shadow: none !important;
    margin-bottom: 8px !important;
  }

  .subscription-intro-section .section-title,
  .payment-methods-section .section-title {
    background-color: var(--background-color);
  }

  .payment-methods-section .section-title {
    margin-bottom: 10px;
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

          color: var(--success-color);
        }

        &.stock-warning {
          background-color: rgba(255, 152, 0, 0.2);

          border-color: rgba(255, 152, 0, 0.1);

          color: var(--warning-color);
        }

        &.stock-danger {
          background-color: rgba(244, 67, 54, 0.2);

          border-color: rgba(244, 67, 54, 0.1);

          color: var(--error-color);
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
              color: var(--text-quaternary);
            }
          }

          span {
            font-size: $font-size-sm;

            color: var(--text-primary);

            line-height: 1.5;

            &.disabled-text {
              color: var(--text-tertiary);
            }
          }
        }

        .html-content {
          font-size: $font-size-sm;

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

        &.is-locked,
        &.is-locked:hover {
          cursor: not-allowed;
          transform: none;
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
            background-color: var(--error-color);
            color: var(--text-on-dark-primary);
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
            color: var(--text-tertiary);
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

    gap: 8px;

    margin-bottom: 20px;

    flex-wrap: wrap;

    align-items: center;

    .coupon-field {
      flex: 1;

      height: 40px;

      padding: 0 14px;

      border-radius: $border-radius-sm;

      border: 1px solid var(--border-color);

      background-color: var(--input-bg-color);

      color: var(--text-primary);

      font-size: $font-size-sm;

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
        color: var(--text-tertiary);

        opacity: 0.6;
      }
    }

    .btn-verify {
      height: 40px;

      padding: 0 14px;

      border-radius: $border-radius-sm;

      background: color-mix(in srgb, var(--theme-color) 24%, transparent);
      border: 1px solid color-mix(in srgb, var(--theme-color) 52%, white);
      color: var(--text-on-dark-primary);
      font-size: $font-size-sm;

      font-weight: $font-weight-medium;

      display: flex;

      align-items: center;

      gap: 8px;

      cursor: pointer;

      transition: all 0.3s ease;

      box-shadow: none;

      white-space: nowrap;

      flex-shrink: 0;

      &:hover:not(:disabled) {
        background: color-mix(in srgb, var(--theme-color) 36%, transparent);
        color: var(--text-on-dark-primary);

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

        border: 2px solid rgba(148, 163, 184, 0.35);

        border-radius: 50%;

        border-top-color: var(--text-tertiary);

        animation: spin 1s linear infinite;
      }
    }

    .coupon-applied-tag {
      height: 40px;
      padding: 0 12px;
      border-radius: $border-radius-sm;
      border: 1px solid var(--border-color);
      background: rgba(148, 163, 184, 0.08);
      color: var(--text-tertiary);
      font-size: $font-size-sm;
      display: inline-flex;
      align-items: center;
      line-height: 1;
      white-space: nowrap;
      cursor: default;
    }

    .btn-remove-text {
      height: 40px;
      padding: 0 12px;
      border-radius: $border-radius-sm;
      border: 1px solid var(--border-color);
      background: rgba(148, 163, 184, 0.08);
      color: var(--text-tertiary);
      font-size: $font-size-sm;
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
      color: var(--success-color);
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
      color: var(--error-color);
    }
  }

  .payment-methods {
    display: flex;
    flex-direction: column;
    gap: 0;

    .payment-method-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      min-height: 38px;
      border-radius: 0;
      cursor: pointer;
      transition: border-color 0.2s ease, background-color 0.2s ease;
      border: none;
      border-top: 1px solid rgba(148, 163, 184, 0.32);
      background-color: transparent;

      &:hover {
        border-color: rgba(var(--theme-color-rgb), 0.42);
        background-color: rgba(var(--theme-color-rgb), 0.08);
      }

      &.active {
        border-color: var(--theme-color);
        background-color: rgba(var(--theme-color-rgb), 0.14);
        box-shadow: none;
      }

      .method-check {
        width: 22px;
        height: 22px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--theme-color);
        flex-shrink: 0;

        &.left-check {
          margin-right: 2px;
        }
      }

      .method-icon {
        width: auto;
        min-width: 64px;
        max-width: 42%;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        color: var(--theme-color);
        flex-shrink: 0;

        &.right-icon {
          margin-left: auto;
        }

        img {
          width: auto;
          max-width: 100%;
          max-height: 24px;
          object-fit: contain;
          display: block;
        }
      }

      .method-details {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 6px;

        .method-name {
          font-weight: $font-weight-semibold;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .method-fee {
          font-size: $font-size-sm;
          color: var(--text-tertiary);
          white-space: nowrap;
        }
      }
    }

  }

  .methods-skeleton {
    .skeleton-payment-method {
      height: 42px;
      border-radius: 6px;
      background: rgba(148, 163, 184, 0.16);
      margin-bottom: 8px;
    }

    .skeleton-payment-method:last-child {
      margin-bottom: 0;
    }
  }

  .order-summary {
    background-color: var(--card-bg-color);

    border-radius: $border-radius-sm;

    box-shadow: none;

    padding: map.get($spacers, 3);

    margin-bottom: 12px;

    border: 1px solid var(--border-color);

    &.glassmorphism {
      background-color: rgba(var(--card-background-rgb, 255, 255, 255), 0.7);

      backdrop-filter: blur(20px);

      -webkit-backdrop-filter: blur(20px);
    }

    .summary-header-block {
      margin-bottom: 14px;

      .summary-title {
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;
        color: var(--right-card-text);
        margin-bottom: 4px;
      }

      .summary-subtitle {
        font-size: $font-size-sm;
        color: var(--text-on-dark-primary);
        opacity: 0.72;

        &.pending {
          opacity: 0.9;
          color: color-mix(in srgb, var(--theme-color) 70%, white);
        }
      }
    }

    .coupon-merge-block.compact {
      margin-bottom: 14px;

      .coupon-input {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .coupon-applied-inline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 32px;
      }

      .coupon-code-text {
        font-size: $font-size-sm;
        color: var(--right-card-text);
        opacity: 0.9;
      }
    }

    .summary-amounts {
      display: grid;
      gap: 10px;
    }

    .summary-row {
      display: flex;

      justify-content: space-between;

      margin-bottom: 0;

      align-items: center;

      &.skeleton {
        margin-bottom: 16px;
      }

      .summary-label {
        flex: 1;
        min-width: 0;
        font-size: $font-size-sm;

        color: var(--text-tertiary);

        letter-spacing: 0.2px;

        .coupon-name {
          font-size: $font-size-sm;

          opacity: 0.8;

          font-style: italic;
        }

        &.summary-label-with-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
      }

      .summary-value {
        min-width: 120px;
        text-align: right;
        font-size: $font-size-sm;

        font-weight: $font-weight-medium;

        color: var(--text-primary);

        &.discount {
          color: var(--error-color);

          font-weight: $font-weight-semibold;
        }
      }
    }

    .summary-divider {
      height: 1px;

      background-color: var(--border-color);

      margin: 16px 0;

      &.strong {
        margin: 18px 0 12px;
      }

      &.compact {
        margin: 8px 0 6px;
      }
    }

    .summary-detail-toggle {
      justify-self: flex-start;
      padding: 0;
      margin-top: -2px;
      font-size: $font-size-xs;

      &.inline {
        margin-top: 0;
        font-size: $font-size-xs;
      }
    }

    .payable-block {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 10px;

      .payable-label {
        font-size: $font-size-sm;
        color: var(--text-on-dark-primary);
        opacity: 0.9;
      }

      .payable-value {
        font-size: $font-size-2xl;
        font-weight: $font-weight-bold;
        color: var(--text-on-dark-primary);
        line-height: 1.1;
      }
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
      color: var(--text-on-dark-primary);
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
    color: var(--text-on-dark-primary);
    border-color: var(--right-card-border);
    background: rgba(148, 163, 184, 0.08);
  }

  .coupon-verify-section .coupon-field {
    background: var(--input-bg-color);
    border-color: var(--border-color);
    color: var(--text-primary);

    &::placeholder {
      color: var(--text-tertiary);
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
    color: var(--error-color);
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
    margin-bottom: 12px;
  }

  .order-summary .summary-submit-action {
    width: 100%;
    margin-top: 10px;
    height: 44px;
    padding: 0 24px;
    border-radius: $border-radius-sm;
    background-color: var(--theme-color);
    color: var(--text-on-dark-primary);
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

.pending-order-modal {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pending-order-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
}

.pending-order-dialog {
  position: relative;
  width: min(92vw, 460px);
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 18px 18px 16px;
  z-index: 1;
}

.payment-dialog {
  width: min(92vw, 520px);
}

.payment-qrcode-wrap {
  margin: 12px 0 14px;
  display: flex;
  justify-content: center;
}

.payment-link-wrap {
  margin: 12px 0 14px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: rgba(var(--theme-color-rgb), 0.06);
  word-break: break-all;
}

.payment-success-toast {
  position: fixed;
  right: 20px;
  top: 20px;
  z-index: 1350;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(22, 163, 74, 0.95);
  color: #fff;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  box-shadow: 0 12px 30px rgba(22, 163, 74, 0.25);
}

.modal-fade-enter-active,
.modal-fade-leave-active,
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to,
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}



@media (max-width: 991px) {
  .order-confirm-container {
    .content-wrapper {
      gap: 25px;
    }
  }
}

@media (max-width: #{$bp-md}) {
  .order-confirm-container {
    margin-top: 0;

    :deep(.page-inner) {
      padding-left: 0 !important;
      padding-right: 0 !important;
      max-width: 100%;
    }

    .welcome-card {
      padding: 15px;

      .card-header .card-title {
        font-size: $font-size-lg;
      }

      .card-body p {
        font-size: $font-size-sm;
      }

      .card-body {
        .plan-features {
          .feature-item {
            span {
              font-size: $font-size-sm;
            }
          }

          .html-content {
            font-size: $font-size-sm;
          }
        }
      }
    }

    .subscription-intro-section {
      padding: 0;
    }

    .plan-selector-grid {
      gap: 8px;
    }

    .plan-selector-btn {
      min-height: 96px;
      padding: 10px;
    }

    .selector-current-badge {
      height: 28px;
      font-size: $font-size-xs;
    }

    .selector-name {
      margin-top: 28px;
      font-size: $font-size-lg;
    }

    .content-wrapper {
      flex-direction: column;

      gap: 20px;

      .right-column {
        max-width: none;
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

@media (max-width: #{$bp-xs}) {
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

@media screen and (max-width: #{$bp-md}) {
  .order-confirm-container .period-selection .period-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;

    gap: 12px !important;
  }
}

@media screen and (max-width: #{$bp-xs}) {
  .order-confirm-container .period-selection .period-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;

    gap: 10px !important;
  }
}

.order-confirm-container .period-selection .period-cards {
  display: grid !important;
}

@media screen and (max-width: #{$bp-md}) {
  .period-cards {
    display: grid !important;

    grid-template-columns: repeat(2, 1fr) !important;

    gap: 12px !important;
  }
}

@media screen and (max-width: #{$bp-xs}) {
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

@media screen and (max-width: #{$bp-md}) {
  :deep(.period-cards) {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;

    gap: 12px !important;
  }
}

@media screen and (max-width: #{$bp-xs}) {
  :deep(.period-cards) {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;

    gap: 10px !important;
  }
}
</style>
