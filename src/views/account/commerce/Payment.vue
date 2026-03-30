<template>
  <div class="payment-container page-shell">
    <div class="payment-inner page-inner page-stack">
      <div class="content-wrapper">
        <!-- 左侧内容：产品信息 -->
        <div class="left-column">
          <!-- 订单概览 -->
          <div class="section-wrapper overview-section">
            <div class="section-title with-status">
              <span>{{ $t("order.order_summary") }}</span>
              <button
                v-if="!resultFromOrderConfirm && !loading.order && orderDetail.status === 0 && orderDetail.total_amount > 0"
                class="overview-cancel-btn"
                @click="cancelCurrentOrder"
                :disabled="loading.cancelling"
              >
                <IconX v-if="!loading.cancelling" :size="14" />
                <div v-else class="loader"></div>
                <span>{{ $t("payment.cancel_order") }}</span>
              </button>
            </div>

            <div class="product-info" v-if="!loading.order">
              <!-- 充值订单时显示简化信息 -->
              <div class="overview-divider"></div>

              <div class="info-row">
                <div class="info-label">{{ $t("payment.plan_name") }}</div>
                <div class="info-value">{{ orderDetail.plan?.name || (orderDetail.period === 'deposit' ? $t("wallet.deposit.title") : "-") }}</div>
              </div>
              <div class="info-row" v-if="orderDetail.period !== 'deposit'">
                <div class="info-label">{{ $t("payment.period") }}</div>
                <div class="info-value">{{ formatPeriod(orderDetail.period) }}</div>
              </div>

              <div class="info-row">
                <div class="info-label">{{ $t("payment.trade_no") }}</div>
                <div class="info-value">{{ orderDetail.trade_no || "-" }}</div>
              </div>
              <div class="info-row">
                <div class="info-label">{{ $t("payment.created_at") }}</div>
                <div class="info-value">
                  {{ formatDate(orderDetail.created_at) }}
                </div>
              </div>
              <div class="info-row">
                <div class="info-label">{{ $t("payment.order_status") }}</div>
                <div class="info-value">
                  <span class="inline-status-badge" :class="getStatusClass(orderDetail.status)">
                    <IconClock
                      v-if="orderDetail.status === 0 && orderDetail.total_amount > 0"
                      :size="16"
                    />
                    <IconClock
                      v-else-if="orderDetail.status === 0 && orderDetail.total_amount === 0"
                      :size="16"
                    />
                    <IconLoader2 v-else-if="orderDetail.status === 1" :size="16" class="rotating-icon" />
                    <IconX v-else-if="orderDetail.status === 2" :size="16" />
                    <IconCheck v-else-if="orderDetail.status === 3" :size="16" />
                    <IconCheck v-else-if="orderDetail.status === 4" :size="16" />
                    <IconHelp v-else :size="16" />
                    <span>{{ getStatusText(orderDetail.status) }}</span>
                  </span>
                </div>
              </div>

            </div>

            <!-- 产品信息骨架屏 -->
            <div class="skeleton-card" v-else>
              <div
                class="skeleton-text"
                v-for="i in 3"
                :key="'product-' + i"
              ></div>
            </div>
          </div>

          <!-- 支付方式 - 仅当订单状态为待支付(0)时显示 -->
          <div
            class="section-wrapper payment-methods-section"
            v-if="
              !resultFromOrderConfirm &&
              !loading.order &&
              orderDetail.status === 0 &&
              orderDetail.total_amount > 0
            "
          >
            <div class="section-title">
              <span>{{ $t("payment.payment_method") }}</span>
            </div>

            <div class="payment-methods" v-if="!loading.methods">
              <div
                class="payment-method-item"
                v-for="method in paymentMethods"
                :key="method.id"
                :class="{ active: selectedMethod === method.id }"
                @click="selectMethod(method.id)"
              >
                <div class="method-check left-check">
                  <IconCircleCheck v-if="selectedMethod === method.id" :size="22" />
                  <IconCircle v-else :size="20" />
                </div>
                <div class="method-details">
                  <span class="method-name">{{ method.name }}</span>
                  <span
                    class="method-fee"
                    v-if="
                      method.handling_fee_percent || method.handling_fee_fixed
                    "
                  >
                    {{ formatFee(method) }}
                  </span>
                </div>
                <div class="method-icon right-icon">
                  <IconCreditCard v-if="!method.icon" :size="26" />
                  <img v-else :src="method.icon" :alt="method.name" />
                </div>
              </div>
            </div>

            <!-- 支付方式骨架屏 -->
            <div class="skeleton-card methods-skeleton" v-else>
              <div
                class="skeleton-payment-method"
                v-for="i in 2"
                :key="'method-' + i"
              ></div>
            </div>
          </div>
        </div>

        <!-- 右侧内容：支付方式 -->
        <div class="right-column">
          <!-- 订单金额摘要 -->
          <OrderSummaryCard
            section-class="order-amount-section"
            :title="$t('payment.order_info')"
          >

            <div class="order-info" v-if="!loading.order">
              <div class="summary-amounts">
                <div v-if="orderDetail.period === 'deposit'" class="summary-row">
                  <div class="summary-label">{{ $t("wallet.deposit.title") }}</div>
                  <div class="summary-value amount">
                    {{ formatAmount(orderDetail.total_amount) }}
                  </div>
                </div>
                <div v-else class="summary-row">
                  <div class="summary-label">{{ summaryPlanLabel }}</div>
                  <div class="summary-value amount">
                    {{ formatAmount(getPlanPrice()) }}
                  </div>
                </div>

                <div class="summary-row discount-row" v-if="discountBreakdownVisible">
                  <div class="summary-label">{{ $t("payment.total_discount_amount") }}</div>
                  <div class="summary-value discount">-{{ formatAmount(discountAmount) }}</div>
                </div>
                <div class="summary-row" v-if="surplusAmount > 0">
                  <div class="summary-label">{{ $t("payment.discount_amount") }}</div>
                  <div class="summary-value discount">-{{ formatAmount(surplusAmount) }}</div>
                </div>
                <div class="summary-divider compact" v-if="balanceDeductionAmount > 0"></div>
                <div
                  class="summary-row"
                  v-if="balanceDeductionAmount > 0"
                >
                  <div class="summary-label">{{ $t("payment.balance_amount") }}</div>
                  <div class="summary-value discount">-{{ formatAmount(balanceDeductionAmount) }}</div>
                </div>
                <div
                  class="summary-row"
                  v-if="
                    orderDetail.refund_amount !== null &&
                    orderDetail.refund_amount !== undefined &&
                    orderDetail.refund_amount > 0
                  "
                >
                  <div class="summary-label">{{ $t("payment.refund_amount") }}</div>
                  <div class="summary-value">{{ formatAmount(orderDetail.refund_amount) }}</div>
                </div>
                <div class="summary-row" v-if="selectedMethod && handleFeeAmount > 0">
                  <div class="summary-label">{{ $t("payment.handling_fee") }}</div>
                  <div class="summary-value fee">{{ formatAmount(handleFeeAmount) }}</div>
                </div>
              </div>
              <div class="summary-divider strong"></div>
              <div class="summary-row total">
                <div class="summary-label">{{ $t("payment.total_with_fee") }}</div>
                <div class="summary-value final">{{ formatAmount(totalWithFee) }}</div>
              </div>
            </div>

            <div class="skeleton-card" v-else>
              <div class="skeleton-text" v-for="i in 5" :key="'summary-' + i"></div>
            </div>

            <div
              class="order-amount-actions"
              v-if="!resultFromOrderConfirm && !loading.order && orderDetail.status === 0 && !paymentSuccessful && orderDetail.total_amount > 0"
            >
              <button
                class="btn-order summary-submit-action full-width"
                @click="processPayment"
                :disabled="
                  (orderDetail.total_amount > 0 && !selectedMethod) ||
                  loading.paying ||
                  loading.checking
                "
              >
                <IconCreditCard v-if="!loading.paying" :size="18" />
                <div v-else class="loader"></div>
                <span>{{ $t("payment.pay_now") }}</span>
              </button>
            </div>
          </OrderSummaryCard>

          <!-- 按钮区域 -->
          <div class="action-buttons">
            <!-- 从订单列表进入且订单已完成 - 显示返回上一页按钮 -->
            <div
              class="btn-group pay-row"
              v-if="
                fromOrderList && (paymentSuccessful || orderDetail.status !== 0)
              "
            >
              <button class="btn-back main-action full-width" @click="goBack">
                <IconArrowLeft :size="18" />
                <span>{{ $t("payment.return_to_previous") }}</span>
              </button>
            </div>

            <!-- 非订单列表进入 - 支付成功后的按钮，显示前往仪表盘 -->
            <div
              class="btn-group pay-row"
              v-if="
                (paymentSuccessful || orderDetail.status > 0) && !fromOrderList
              "
            >
              <button
                class="btn-pay main-action full-width"
                @click="goToDashboard"
              >
                <IconArrowRight :size="18" />
                <span v-if="orderDetail.period === 'deposit'">{{
                  $t("payment.continue_to_wallet")
                }}</span>
                <span v-else>{{ $t("payment.continue_to_dashboard") }}</span>
              </button>
            </div>

            <!-- 待支付订单相关按钮 -->
            <template
              v-if="
                !resultFromOrderConfirm &&
                !loading.order && orderDetail.status === 0 && !paymentSuccessful
              "
            >
              <!-- 免费订单场景 - 修改为取消和激活按钮在同一行 -->
              <div
                class="btn-group action-row"
                v-if="orderDetail.total_amount === 0"
              >
                <!-- 左侧取消按钮 -->
                <button
                  class="btn-back secondary-action"
                  @click="cancelCurrentOrder"
                  :disabled="loading.cancelling"
                >
                  <IconX v-if="!loading.cancelling" :size="18" />
                  <div v-else class="loader"></div>
                  <span>{{ $t("payment.cancel_order") }}</span>
                </button>

                <!-- 右侧激活按钮 -->
                <button
                  class="btn-pay main-action"
                  @click="checkPayment"
                  :disabled="loading.checking"
                >
                  <IconCreditCard v-if="!loading.checking" :size="18" />
                  <div v-else class="loader"></div>
                  <span>{{ $t("payment.activate") }}</span>
                </button>
              </div>

            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 支付成功动画 -->
    <transition name="fade">
      <div class="payment-success-overlay" v-if="showSuccessAnimation">
        <div class="success-animation">
          <div class="check-container">
            <div class="check-background">
              <IconCheck :size="100" class="check-icon" />
            </div>
          </div>
          <h2>{{ $t("payment.payment_successful") }}</h2>
          <p>{{ $t("payment.payment_successful_desc") }}</p>
        </div>
        <div v-if="showConfettiAnimation" class="confetti-container">
          <ConfettiExplosion
            :particleCount="150"
            :force="0.4"
            :stageWidth="window.innerWidth"
            :stageHeight="window.innerHeight"
            :colors="[
              '#ffcc00',
              '#ff8800',
              '#ff3333',
              '#26A65B',
              '#42A5F5',
              '#9C27B0',
            ]"
          />
        </div>
      </div>
    </transition>

    <!-- 取消订单确认弹窗 -->
    <transition name="modal-fade">
      <div class="cancel-modal" v-if="showCancelConfirm">
        <div class="cancel-modal-overlay" @click="closeModal"></div>
        <div class="cancel-modal-container">
          <div class="cancel-modal-content">
            <div class="cancel-modal-icon">
              <IconAlertTriangle :size="28" />
            </div>

            <div class="cancel-modal-header">
              <h3>{{ $t("payment.confirm_cancel_title") }}</h3>
              <p>{{ $t("payment.confirm_cancel_desc") }}</p>
            </div>

            <div class="cancel-modal-actions">
              <button class="cancel-btn" @click="closeModal">
                {{ $t("common.cancel") }}
              </button>
              <button class="confirm-btn" @click="confirmCancel">
                {{ $t("common.confirm") }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 支付二维码弹窗 -->
    <transition name="modal-fade">
      <div v-if="showPaymentModal" class="pending-order-modal payment-modal">
        <div class="pending-order-overlay" @click="closePaymentModal"></div>
        <div class="pending-order-dialog payment-dialog" role="dialog" aria-modal="true">
          <div class="pending-order-header">
            <h3>{{ paymentQRCode ? $t("payment.scan_qrcode") : $t("payment.payment_method") }}</h3>
            <p v-if="paymentQRCode">{{ $t("payment.payment_method") }}：{{ getSelectedMethodName() }}</p>
            <p v-if="paymentQRCode && qrPaymentAmountHint" class="payment-amount-hint">
              {{ $t("payment.total_with_fee") }}：{{ qrPaymentAmountHint }}
            </p>
            <p v-else-if="paymentLink">{{ $t("payment.open_in_new_tab") }}</p>
          </div>
          <div class="payment-qrcode-wrap" v-if="paymentQRCode">
            <QrcodeVue
              :value="paymentQRCode"
              :size="PAYMENT_CONFIG.qrcodeSize"
              :background="PAYMENT_CONFIG.qrcodeBackground"
              :foreground="PAYMENT_CONFIG.qrcodeColor"
              level="H"
              render-as="svg"
            />
          </div>
          <div class="payment-link-wrap" v-if="paymentLink">
            <a :href="paymentLink" target="_blank" rel="noopener noreferrer">
              {{ paymentLink }}
            </a>
          </div>
          <div class="pending-order-actions">
            <button class="btn-return-orders cancel-btn" @click="closePaymentModal">
              {{ paymentQRCode ? $t("common.close") : $t("common.cancel") }}
            </button>
            <button class="btn-confirm-cancel confirm-btn" @click="checkPayment">
              {{ $t("payment.check_payment") }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import {
  ref,
  reactive,
  onMounted,
  computed,
  onBeforeUnmount,
  nextTick,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import { useToast } from "@/composables/useToast";
import { useRoute, useRouter } from "vue-router";
import {
  getOrderDetail,
  getPaymentMethods,
  checkOrderStatus,
  cancelOrder,
  checkoutOrder,
} from "@/api/account/shop";
import { PAYMENT_CONFIG } from "@/utils/baseConfig";
import QrcodeVue from "qrcode.vue";
import ConfettiExplosion from "vue-confetti-explosion";
import OrderSummaryCard from "@/components/commerce/OrderSummaryCard.vue";
import {
  IconCheck,
  IconX,
  IconCreditCard,
  IconCircle,
  IconCircleCheck,
  IconAlertCircle,
  IconArrowRight,
  IconAlertTriangle,
  IconRefresh,
  IconArrowLeft,
  IconClock,
  IconLoader2,
  IconHelp,
} from "@tabler/icons-vue";

import { detectBrowser } from "@/utils/baseConfig";

export default {
  name: "PaymentView",
  components: {
    IconCheck,
    IconX,
    IconCreditCard,
    IconCircle,
    IconCircleCheck,
    IconAlertCircle,
    IconArrowRight,
    IconAlertTriangle,
    IconRefresh,
    IconArrowLeft,
    QrcodeVue,
    ConfettiExplosion,
    OrderSummaryCard,
    IconClock,
    IconLoader2,
    IconHelp,
  },
  setup() {
    const { t } = useI18n();
    const { showToast } = useToast();
    const route = useRoute();
    const router = useRouter();

    const fromOrderList = ref(false);
    const resultFromOrderConfirm = ref(false);

    const loading = reactive({
      order: true,
      methods: true,
      checking: false,
      cancelling: false,
      paying: false,
    });

    const orderDetail = ref({});
    const paymentMethods = ref([]);
    const selectedMethod = ref(null);
    const paymentCheckTimer = ref(null);
    const paymentSuccessful = ref(false);
    const showSuccessAnimation = ref(false);
    const showConfettiAnimation = ref(false);

    const showCancelConfirm = ref(false);
    const showPaymentModal = ref(false);
    const paymentQRCode = ref(null);
    const paymentLink = ref(null);

    const couponDiscountAmount = computed(() => Number(orderDetail.value?.coupon_discount_amount || 0));
    const userDiscountAmount = computed(() => Number(orderDetail.value?.user_discount_amount || 0));
    const discountAmount = computed(() => Number(orderDetail.value?.discount_amount || 0));
    const surplusAmount = computed(() => Number(orderDetail.value?.surplus_amount || 0));
    const balanceDeductionAmount = computed(() => {
      const amount = Number(orderDetail.value?.balance_amount || 0);
      if (!Number.isFinite(amount)) return 0;
      return Math.max(0, Math.abs(amount));
    });
    const discountBreakdownVisible = computed(() => {
      return (
        couponDiscountAmount.value > 0 ||
        userDiscountAmount.value > 0 ||
        discountAmount.value > 0
      );
    });

    const handleFeeAmount = computed(() => {
      if (!selectedMethod.value || !orderDetail.value.total_amount) {
        return 0;
      }

      const method = paymentMethods.value.find(
        (m) => m.id === selectedMethod.value
      );
      if (!method) {
        return 0;
      }

      let fee = 0;

      if (method.handling_fee_percent) {
        fee +=
          (orderDetail.value.total_amount * method.handling_fee_percent) / 100;
      }

      if (method.handling_fee_fixed) {
        fee += method.handling_fee_fixed;
      }

      return Math.round(fee);
    });

    const totalWithFee = computed(() => {
      if (!orderDetail.value.total_amount) {
        return 0;
      }
      return orderDetail.value.total_amount + handleFeeAmount.value;
    });

    const qrPaymentAmountHint = computed(() => {
      if (!paymentQRCode.value) {
        return "";
      }

      const orderAmount = Number(totalWithFee.value);
      const orderCurrency = String(orderDetail.value?.pricing_currency || displayCurrency.value || "").toUpperCase();
      const paymentAmount = Number(orderDetail.value?.payment_amount);
      const paymentCurrency = String(orderDetail.value?.payment_currency || "").toUpperCase();

      if (!Number.isFinite(orderAmount) || orderAmount < 0 || !orderCurrency) {
        return "";
      }

      const formatWithCurrency = (amount, currencyCode) =>
        `${currencyCode} ${(Number(amount) / 100).toFixed(2)}`;

      if (Number.isFinite(paymentAmount) && paymentAmount > 0 && paymentCurrency) {
        return `${formatWithCurrency(orderAmount, orderCurrency)} ≈ ${formatWithCurrency(paymentAmount, paymentCurrency)}`;
      }

      return formatWithCurrency(orderAmount, orderCurrency);
    });

    const fetchOrderDetail = async () => {
      loading.order = true;
      try {
        let tradeNo = null;

        const queryParams = new URLSearchParams(
          window.location.search || window.location.hash.split("?")[1] || ""
        );

        if (queryParams.has("trade_no")) {
          tradeNo = queryParams.get("trade_no");
        }

        if (!tradeNo && queryParams.has("out_trade_no")) {
          tradeNo = queryParams.get("out_trade_no");
        }

        if (!tradeNo) {
          tradeNo = route.query.trade_no || route.query.out_trade_no;
        }

        if (!tradeNo) {
          showToast(t("payment.no_order_selected"), "error");
          router.push("/shop");
          return;
        }

        const response = await getOrderDetail(tradeNo);
        if (response.data) {
          orderDetail.value = response.data;

          if (
            orderDetail.value.status === 0 &&
            (orderDetail.value.total_amount === 0 || resultFromOrderConfirm.value)
          ) {
            startPaymentCheck();
          }
        } else {
          showToast(t("payment.order_not_found"), "error");
          router.push("/shop");
        }
      } catch (error) {
        console.error("Failed to fetch order details:", error);
        showToast(t("payment.failed_to_fetch_order"), "error");
        router.push("/shop");
      } finally {
        loading.order = false;
      }
    };

    const fetchPaymentMethods = async () => {
      loading.methods = true;
      try {
        const response = await getPaymentMethods();
        if (response.data) {
          paymentMethods.value = response.data;

          if (
            paymentMethods.value.length === 1 ||
            PAYMENT_CONFIG.autoSelectFirstMethod
          ) {
            if (paymentMethods.value.length > 0) {
              selectedMethod.value = paymentMethods.value[0].id;
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch payment methods:", error);
        showToast(t("payment.failed_to_fetch_methods"), "error");
      } finally {
        loading.methods = false;
      }
    };

    const selectMethod = (methodId) => {
      selectedMethod.value = methodId;
    };

    const formatDate = (timestamp) => {
      if (!timestamp) return "-";
      const date = new Date(timestamp * 1000);
      return date.toLocaleString();
    };

    const displayCurrency = computed(() => {
      const currency = orderDetail.value?.pricing_currency;
      return currency ? `${currency}`.toUpperCase() : "USD";
    });

    const formatAmount = (amount) => {
      if (amount === null || amount === undefined) return "-";
      return `${displayCurrency.value} ${(amount / 100).toFixed(2)}`;
    };

    const formatPeriod = (period) => {
      if (period === "reset_price" || period === "deposit") {
        return t(`payment.period_types.${period}`);
      }

      const periodMap = {
        month_price: t("shop.plan.price_options.month"),
        quarter_price: t("shop.plan.price_options.quarter"),
        half_year_price: t("shop.plan.price_options.half_year"),
        year_price: t("shop.plan.price_options.year"),
        two_year_price: t("shop.plan.price_options.two_year"),
        three_year_price: t("shop.plan.price_options.three_year"),
        onetime_price: t("shop.plan.price_options.onetime"),
      };
      return periodMap[period] || period;
    };

    const formatFee = (method) => {
      let feeText = "";

      if (method.handling_fee_percent) {
        feeText += `${method.handling_fee_percent}%`;
      }

      if (method.handling_fee_fixed) {
        const fixedFeeText = formatAmount(method.handling_fee_fixed);
        feeText += feeText ? ` + ${fixedFeeText}` : fixedFeeText;
      }

      return feeText ? `${t("payment.fee")}: ${feeText}` : "";
    };

    const getPlanPrice = () => {
      if (
        !orderDetail.value ||
        !orderDetail.value.plan ||
        !orderDetail.value.period
      ) {
        return 0;
      }
      return orderDetail.value.plan[orderDetail.value.period] || 0;
    };

    const summaryPlanLabel = computed(() => {
      const planName = orderDetail.value?.plan?.name || "-";
      const period = orderDetail.value?.period;
      if (!period || period === "deposit") return planName;
      return `${planName} · ${formatPeriod(period)}`;
    });

    const checkPayment = async () => {
      if (orderDetail.value.total_amount > 0 && !selectedMethod.value) {
        showToast(t("payment.select_method_first"), "warning");
        return;
      }

      loading.checking = true;

      try {
        if (orderDetail.value.total_amount === 0) {
          if (paymentMethods.value && paymentMethods.value.length > 0) {
            selectedMethod.value = paymentMethods.value[0].id;
          }
        }

        await checkoutOrder(orderDetail.value.trade_no, selectedMethod.value);

        showToast(t("payment.payment_processing"), "info");

        startPaymentCheck();
      } catch (error) {
        console.error("Failed to checkout order:", error);
        showToast(t("payment.check_failed"), "error");
        loading.checking = false;
      }
    };

    const startPaymentCheck = async () => {
      try {
        if (paymentSuccessful.value) {
          return;
        }

        await performPaymentCheck();

        if (orderDetail.value.total_amount === 0 && !paymentSuccessful.value) {
          setTimeout(async () => {
            const suppressToast = true;
            await performPaymentCheck(suppressToast);
          }, 1000);
        } else if (
          orderDetail.value.total_amount > 0 &&
          !paymentSuccessful.value
        ) {
          if (paymentCheckTimer.value) {
            clearInterval(paymentCheckTimer.value);
          }

          if (PAYMENT_CONFIG.autoCheckPayment) {
            let checkCount = 0;

            paymentCheckTimer.value = setInterval(() => {
              checkCount++;

              performPaymentCheck();

              if (
                PAYMENT_CONFIG.autoCheckMaxTimes > 0 &&
                checkCount >= PAYMENT_CONFIG.autoCheckMaxTimes
              ) {
                clearInterval(paymentCheckTimer.value);
                loading.checking = false;

                if (!paymentSuccessful.value) {
                  showToast(t("payment.check_timeout"), "info");
                }
              }
            }, PAYMENT_CONFIG.autoCheckInterval);
          } else {
            let checkCount = 0;
            paymentCheckTimer.value = setInterval(() => {
              checkCount++;

              performPaymentCheck();

              if (checkCount >= 2) {
                clearInterval(paymentCheckTimer.value);
                loading.checking = false;

                if (!paymentSuccessful.value) {
                  showToast(t("payment.check_timeout"), "info");
                }
              }
            }, 5000);
          }
        }
      } catch (error) {
        console.error("Failed to check payment status:", error);
        showToast(t("payment.check_failed"), "error");
        loading.checking = false;
      }
    };

    const performPaymentCheck = async (suppressToast = false) => {
      try {
        const response = await checkOrderStatus(orderDetail.value.trade_no);

        if (response.data === 1) {
          orderDetail.value.status = response.data;

          setTimeout(() => {
            const statusElement = document.querySelector(
              ".inline-status-badge"
            );
            if (statusElement) {
              statusElement.classList.add("status-transition");
            }

            orderDetail.value.status = 3;

            handlePaymentSuccess(!suppressToast);
          }, 1000);
        } else if (response.data !== 0 && response.data !== 2) {
          orderDetail.value.status = response.data;

          handlePaymentSuccess(!suppressToast);
        } else if (response.data === 2) {
          if (paymentCheckTimer.value) {
            clearInterval(paymentCheckTimer.value);
            paymentCheckTimer.value = null;
          }

          if (!suppressToast) {
            showToast(t("payment.order_cancelled"), "warning");
          }
          loading.checking = false;
          loading.paying = false;

          orderDetail.value.status = response.data;

          closePaymentModal();
        }

        if (orderDetail.value.total_amount === 0) {
          loading.checking = false;
          loading.paying = false;
        }
      } catch (error) {
        console.error("Failed to check payment status:", error);
        if (orderDetail.value.total_amount === 0) {
          loading.checking = false;
          loading.paying = false;
        }
      }
    };

    const handlePaymentSuccess = (showNotification = true) => {
      if (paymentSuccessful.value) {
        return;
      }

      if (paymentCheckTimer.value) {
        clearInterval(paymentCheckTimer.value);
        paymentCheckTimer.value = null;
      }

      paymentSuccessful.value = true;
      loading.checking = false;
      loading.paying = false;

      closePaymentModal();

      if (!fromOrderList.value) {
        showSuccessAnimation.value = true;

        nextTick(() => {
          setTimeout(() => {
            showConfettiAnimation.value = true;
          }, 300);

          if (showNotification) {
            showToast(t("payment.pay_success"), "success");
          }

          setTimeout(() => {
            showConfettiAnimation.value = false;

            setTimeout(() => {
              showSuccessAnimation.value = false;
            }, 500);
          }, 4500);
        });
      } else {
      }
    };

    const cancelCurrentOrder = () => {
      if (loading.cancelling) return;
      showCancelConfirm.value = true;
    };

    const closeModal = () => {
      showCancelConfirm.value = false;
    };

    const closePaymentModal = () => {
      showPaymentModal.value = false;
      paymentQRCode.value = null;
      paymentLink.value = null;
    };

    const getSelectedMethodName = () => {
      if (!selectedMethod.value) return "";
      const method = paymentMethods.value.find(
        (m) => m.id === selectedMethod.value
      );
      return method ? method.name : "";
    };

    const processPayment = async () => {
      if (!selectedMethod.value) {
        showToast(t("payment.select_method_first"), "warning");
        return;
      }

      loading.paying = true;

      try {
        const response = await checkoutOrder(
          orderDetail.value.trade_no,
          selectedMethod.value
        );

        if (response.data) {
          if (response.type === 0) {
            paymentQRCode.value = response.data;
            paymentLink.value = null;
            showPaymentModal.value = true;
          } else if (response.type === 1) {
            paymentLink.value = response.data;
            paymentQRCode.value = null;

            const isSafari = detectBrowser() === "Safari";
            const useSafariModal = PAYMENT_CONFIG.useSafariPaymentModal;

            if (isSafari && useSafariModal) {
              showPaymentModal.value = true;
            } else {
              if (PAYMENT_CONFIG.openPaymentInNewTab) {
                setTimeout(() => {
                  const tempLink = document.createElement("a");
                  tempLink.href = response.data;
                  tempLink.target = "_blank";
                  tempLink.rel = "noopener noreferrer";
                  document.body.appendChild(tempLink);
                  tempLink.click();
                  document.body.removeChild(tempLink);

                  showPaymentModal.value = true;
                }, 100);
              } else {
                setTimeout(() => {
                  const tempLink = document.createElement("a");
                  tempLink.href = response.data;
                  tempLink.rel = "noopener noreferrer";
                  document.body.appendChild(tempLink);
                  tempLink.click();
                  document.body.removeChild(tempLink);
                }, 100);
              }
            }
          }

          startPaymentCheck();
        }
      } catch (error) {
        console.error("Failed to start payment:", error);
        showToast(t("payment.check_failed"), "error");
      } finally {
        loading.paying = false;
      }
    };

    const confirmCancel = async () => {
      loading.cancelling = true;
      showCancelConfirm.value = false;

      try {
        await cancelOrder(orderDetail.value.trade_no);
        showToast(t("payment.cancel_success"), "success");

        if (paymentCheckTimer.value) {
          clearInterval(paymentCheckTimer.value);
        }

        router.push("/shop");
      } catch (error) {
        console.error("Failed to cancel order:", error);
        showToast(t("payment.cancel_failed"), "error");
      } finally {
        loading.cancelling = false;
      }
    };

    const goToDashboard = () => {
      if (orderDetail.value.period === "deposit") {
        router.push("/wallet/deposit");
      } else {
        router.push("/dashboard");
      }
    };

    const getStatusText = (status) => {
      const statusMap = {
        0: t("payment.status.pending"),
        1: t("payment.status.processing"),
        2: t("payment.status.cancelled"),
        3: t("payment.status.completed"),
        4: t("payment.status.discounted"),
      };
      return statusMap[status] || t("payment.status.unknown");
    };

    const getStatusClass = (status) => {
      const statusClassMap = {
        0: "status-pending",
        1: "status-processing",
        2: "status-cancelled",
        3: "status-completed",
        4: "status-discounted",
      };
      return statusClassMap[status] || "status-unknown";
    };

    const goBack = () => {
      router.go(-1);
    };

    onMounted(() => {
      resultFromOrderConfirm.value = route.query.from === "order-confirm";

      fetchOrderDetail();
      if (!resultFromOrderConfirm.value) {
        fetchPaymentMethods();
      }

      if (route.query.from === "orders") {
        fromOrderList.value = true;
      } else if (document.referrer && document.referrer.includes("/orders")) {
        fromOrderList.value = true;
      } else {
        fromOrderList.value = false;
      }

      if (resultFromOrderConfirm.value) {
        fromOrderList.value = false;
      }

      watch(
        () => orderDetail.value.status,
        (newStatus) => {
          if (
            (newStatus === 3 || newStatus === 4) &&
            !paymentSuccessful.value
          ) {
            paymentSuccessful.value = true;

            if (!fromOrderList.value) {
              showSuccessAnimation.value = true;
              nextTick(() => {
                setTimeout(() => {
                  showConfettiAnimation.value = true;
                }, 300);

                setTimeout(() => {
                  showConfettiAnimation.value = false;
                  setTimeout(() => {
                    showSuccessAnimation.value = false;
                  }, 500);
                }, 4500);
              });
            }
          }
        },
        { immediate: true }
      );

    });

    onBeforeUnmount(() => {
      if (paymentCheckTimer.value) {
        clearInterval(paymentCheckTimer.value);
      }
    });

    return {
      loading,
      orderDetail,
      paymentMethods,
      selectedMethod,
      paymentSuccessful,
      showSuccessAnimation,
      showConfettiAnimation,
      fromOrderList,
      resultFromOrderConfirm,
      formatDate,
      formatAmount,
      formatPeriod,
      formatFee,
      selectMethod,
      checkPayment,
      cancelCurrentOrder,
      goToDashboard,
      getPlanPrice,
      summaryPlanLabel,
      showCancelConfirm,
      confirmCancel,
      closeModal,
      showPaymentModal,
      paymentQRCode,
      paymentLink,
      PAYMENT_CONFIG,
      getSelectedMethodName,
      processPayment,
      closePaymentModal,
      handleFeeAmount,
      totalWithFee,
      qrPaymentAmountHint,
      couponDiscountAmount,
      userDiscountAmount,
      discountAmount,
      surplusAmount,
      balanceDeductionAmount,
      discountBreakdownVisible,
      window: window,
      detectBrowser,
      getStatusText,
      getStatusClass,
      goBack,
    };
  },
};
</script>

<style lang="scss" scoped>
@use "sass:map";
@use "@/assets/styles/base/variables.scss" as *;
@use "@/assets/styles/base/typography.scss" as *;
@use "@/assets/styles/components/qr-payment-modal.scss" as qrPaymentModal;
@use "@/assets/styles/components/payment-summary-action.scss" as paymentSummaryAction;

@include qrPaymentModal.styles;
@include paymentSummaryAction.styles;

.payment-container {
  padding: 0;
  display: flex;
  justify-content: center;
  position: relative;

  .payment-inner {
    width: 100%;
      }

  .title-card {
    margin-top: 16px;
    margin-bottom: 24px;
  }

  .dashboard-card {
    background-color: var(--card-bg-color);
    border-radius: $border-radius-sm;
    box-shadow: none;
    padding: map.get($spacers, 3);
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
    position: relative;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .card-title {
        @extend %typo-section-title;
        margin: 0;
      }
    }

    .card-body {
      p {
        color: var(--text-tertiary);
        margin: 0;
      }
    }
  }

  .content-wrapper {
    display: flex;
    gap: 24px;

    @media (max-width: #{$bp-md}) {
      flex-direction: column;
    }

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
    background-color: var(--card-bg-color);
    border-radius: $border-radius-sm;
    box-shadow: none;
    padding: 16px;
    margin-bottom: 24px;
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;

    &:last-child {
      margin-bottom: 48px;
    }

    &:hover {
      box-shadow: none;
      border-color: var(--border-color);
    }

    .section-title {
      @extend %typo-item-title;
      margin-bottom: 16px;
      color: var(--text-primary);
      display: flex;
      align-items: center;

      &::after {
        content: "";
        flex: 1;
        height: 1px;
        background-color: var(--border-color);
        margin-left: 8px;
      }

      &.with-status {
        justify-content: space-between;

        &::after {
          display: none;
        }
      }
    }

    .overview-cancel-btn {
      height: 30px;
      padding: 0 8px;
      border-radius: $border-radius-sm;
      border: 1px solid rgba(var(--theme-color-rgb), 0.38);
      background: transparent;
      color: var(--theme-color);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background-color: rgba(var(--theme-color-rgb), 0.08);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .overview-plan-block {
      margin-bottom: 4px;
    }

    .overview-plan-name {
      @extend %typo-section-title;
      line-height: 1.2;
    }

    .overview-plan-meta {
      margin-top: 8px;
      @extend %typo-body-text;
      line-height: 1.3;
    }

    .overview-divider {
      height: 1px;
      background-color: var(--border-color);
      margin: 8px 0 8px;
    }

    .product-info .info-row {
      margin-bottom: 4px;
    }

    .inline-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .overview-cancel-btn .loader {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(0, 0, 0, 0.2);
      border-top-color: var(--text-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }

  .section-wrapper.payment-methods-section {
    padding: 0;
    margin-bottom: 4px;
    background: var(--card-bg-color);
    border: 1px solid var(--border-color);
    box-shadow: none;

    .section-title {
      margin-bottom: 0;
      font-size: $font-size-md;
      padding: 8px 8px 8px;
      color: var(--text-primary);

      &::after {
        background-color: var(--border-color);
      }
    }
  }

  .right-column .section-wrapper.payment-methods-section {
    background: var(--right-card-bg) !important;
    border: 1px solid var(--right-card-border) !important;
    box-shadow: none !important;
  }

  .right-column .section-wrapper.payment-methods-section .section-title {
    color: var(--right-card-text) !important;
  }

  .order-amount-section {
    background: var(--card-bg-color);
    border: 1px solid var(--border-color);
    box-shadow: none;

    .section-title {
      color: var(--text-primary);

      &::after {
        background-color: var(--border-color);
      }
    }

    .order-info {
      .summary-amounts {
        display: grid;
        gap: 8px;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0;

        .summary-label {
          flex: 1;
          min-width: 0;
          font-size: $font-size-sm;
          color: var(--text-tertiary);
          letter-spacing: 0.2px;
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

          &.fee {
            color: var(--text-tertiary);
          }
        }

        &.total {
          .summary-label {
            color: var(--text-primary);
            font-weight: $font-weight-semibold;
          }

          .summary-value.final {
            color: var(--theme-color);
            font-weight: $font-weight-bold;
            font-size: $font-size-3xl;
            line-height: 1.1;
          }
        }
      }

      .summary-divider {
        height: 1px;
        background-color: var(--border-color);
        margin: 16px 0;

        &.strong {
          margin: 4px 0 8px;
        }

        &.compact {
          margin: 8px 0 4px;
        }
      }
    }

    .order-amount-actions {
      margin-top: 16px;
    }
  }

  .right-column .order-amount-section {
    background: var(--right-card-bg) !important;
    border: 1px solid var(--right-card-border) !important;
    box-shadow: none !important;
  }

  .right-column .order-amount-section .section-title,
  .right-column .order-amount-section .summary-label,
  .right-column .order-amount-section .summary-value {
    color: var(--right-card-text) !important;
  }

  .right-column .order-amount-section .summary-divider {
    background-color: rgba(255, 255, 255, 0.18) !important;
  }

  .payment-methods {
    display: flex;
    flex-direction: column;
    gap: 0;

    .payment-method-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 8px;
      min-height: 38px;
      border-radius: 0;
      cursor: pointer;
      transition: border-color 0.2s ease, background-color 0.2s ease;
      border: none;
      border-top: 1px solid rgba(148, 163, 184, 0.32);
      background-color: rgba(255, 255, 255, 0.95);

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
          margin-right: 0;
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
        gap: 4px;

        .method-name {
          font-size: $font-size-md;
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

  .free-notice {
    display: flex;
    align-items: center;
    padding: 16px;
    background-color: rgba(76, 175, 80, 0.1);
    border-radius: $border-radius-sm;
    border: 1px solid rgba(76, 175, 80, 0.2);

    .notice-icon {
      margin-right: 16px;
      color: var(--success-color);

      &.success {
        color: var(--success-color);
      }
    }

    .notice-text {
      flex: 1;

      h3 {
        margin: 0 0 8px;
        color: var(--success-color);
        font-size: $font-size-md;
      }

      p {
        margin: 0;
        color: var(--text-primary);
      }
    }
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 24px;
    margin-bottom: 16px;

    .btn-group {
      display: flex;
      gap: 16px;
      width: 100%;

      @media (max-width: #{$bp-xs}) {
        flex-direction: column;
        gap: 8px;

        .btn-back,
        .btn-pay,
        .btn-check,
        .btn-continue {
          width: 100%;
          height: 48px;
          min-height: 48px;
          padding: 8px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .main-action {
        flex: 3;
      }

      .secondary-action {
        flex: 1;
        min-width: 130px;
      }

      &.pay-row {
        margin-bottom: 8px;
      }

      &.action-row {
        justify-content: space-between;

        .btn-back,
        .btn-check {
          flex: 1;
        }

        .btn-pay {
          flex: 2;
        }
      }
    }

    .btn-back,
    .btn-pay,
    .btn-check,
    .btn-continue {
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-radius: $border-radius-sm;
      font-size: $font-size-md;
      font-weight: $font-weight-medium;
      padding: 0 24px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none !important;
        box-shadow: none !important;
      }

      @media (max-width: #{$bp-xs}) {
        width: 100%;
        height: 48px;
        min-height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .full-width {
      width: 100%;
    }

    .btn-back {
      background-color: transparent;
      color: var(--text-primary);
      flex: 1;
      border: 1px solid var(--border-color);
      box-shadow: none;

      &:hover:not(:disabled) {
        background-color: var(--hover-color);
        transform: none;
        box-shadow: none;
      }

      &:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: none;
      }

      &.full-width {
        margin-top: 4px;
        max-width: 100%;
        justify-content: center;
      }
    }

    .btn-pay,
    .btn-continue {
      background-color: var(--theme-color);
      color: var(--text-on-dark-primary);
      flex: 2;
      box-shadow: none;

      &:hover:not(:disabled) {
        background-color: var(--primary-color-hover);
        transform: none;
        box-shadow: none;
      }
    }

    .btn-check {
      background-color: var(--hover-color);
      color: var(--text-primary);
      flex: 1;
      border: 1px solid var(--border-color);
      box-shadow: none;

      &:hover:not(:disabled) {
        background-color: var(--card-bg-color);
        transform: none;
        box-shadow: none;
      }
    }

    .loader {
      width: 18px;
      height: 18px;
      min-width: 18px;
      min-height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s linear infinite;
    }
  }

  .skeleton-card {
    width: 100%;
    position: relative;
    overflow: hidden;

    .skeleton-text,
    .skeleton-payment-method {
      height: 20px;
      background-color: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
      margin-bottom: 16px;
      position: relative;
      overflow: hidden;

      &:nth-child(1) {
        width: 100%;
      }
      &:nth-child(2) {
        width: 85%;
      }
      &:nth-child(3) {
        width: 75%;
      }
      &:nth-child(4) {
        width: 90%;
      }
      &:nth-child(5) {
        width: 80%;
      }

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
        animation: shimmer 2s infinite;
        will-change: transform;
      }
    }

    .skeleton-payment-method {
      height: 52px;
      margin-bottom: 8px;
    }
  }

  .methods-skeleton {
    .skeleton-payment-method:last-child {
      margin-bottom: 0;
    }
  }

  .payment-success-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;

    .success-animation {
      text-align: center;
      color: var(--text-on-dark-primary);
      padding: 24px;
      max-width: 500px;
      z-index: 1001;

      .check-container {
        margin-bottom: 24px;

        .check-background {
          background-color: var(--theme-color);
          width: 140px;
          height: 140px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          animation: zoomIn 0.5s ease, pulse 2s infinite ease-in-out;
          box-shadow: none;

          .check-icon {
            color: var(--text-on-dark-primary);
            animation: bounceIn 0.8s ease 0.2s both;
          }
        }
      }

      h2 {
        font-size: $font-size-xl;
        margin-bottom: 16px;
        animation: slideUp 0.5s ease 0.4s both;
      }

      p {
        font-size: $font-size-md;
        opacity: 0.8;
        animation: slideUp 0.5s ease 0.6s both;
      }
    }

    .confetti-container {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1000;
      pointer-events: none;
    }
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.5s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
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

  @keyframes zoomIn {
    from {
      transform: scale(0);
    }
    to {
      transform: scale(1);
    }
  }

  @keyframes bounceIn {
    0% {
      transform: scale(0);
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0% {
      box-shadow: none;
    }
    50% {
      box-shadow: none;
    }
    100% {
      box-shadow: none;
    }
  }

  @keyframes confetti-fall {
    0% {
      top: -20px;
      opacity: 1;
      transform: translateY(0) rotateX(0) rotateY(0);
    }
    100% {
      top: 100%;
      opacity: 0.3;
      transform: translateY(0) rotateX(720deg) rotateY(360deg);
    }
  }

  @keyframes confetti-shake {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(15px);
    }
    50% {
      transform: translateX(-15px);
    }
    75% {
      transform: translateX(8px);
    }
    100% {
      transform: translateX(0);
    }
  }

  @media (max-width: #{$bp-md}) {
    .content-wrapper {
      flex-direction: column;
    }

    .right-column {
      max-width: none;
    }
  }
  @media (max-width: #{$bp-xs}) {

    .action-buttons {
      .btn-group {
        flex-direction: column;
        gap: 8px;

        .main-action,
        .secondary-action {
          width: 100%;
          flex: auto;
        }
      }
    }
  }

}

.payment-container .overview-section {
  background-color: var(--card-background);
}

.cancel-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;

  .cancel-modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
  }

  .cancel-modal-container {
    position: relative;
    width: 90%;
    max-width: 320px;
    z-index: 2001;
  }

  .cancel-modal-content {
    background-color: var(--card-background);
    border-radius: $border-radius-sm;
    overflow: hidden;
    box-shadow: none;
    transform: translateZ(0);

    @media (prefers-color-scheme: dark) {
      background-color: rgba(var(--card-background-rgb, 40, 40, 40), 1);
    }
  }

  .cancel-modal-icon {
    margin: 24px auto 0;
    width: 48px;
    height: 48px;
    background-color: #ff980020;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--warning-color);
  }

  .cancel-modal-header {
    padding: 16px 24px;
    text-align: center;

    h3 {
      font-size: $font-size-xl;
      font-weight: $font-weight-semibold;
      margin: 0 0 8px;
      color: var(--text-primary);
    }

    p {
      font-size: $font-size-md;
      line-height: 1.5;
      margin: 0;
      color: var(--text-tertiary);
    }
  }

  .cancel-modal-actions {
    display: flex;
    padding: 0 16px 16px;
    gap: 8px;

    button {
      flex: 1;
      padding: 8px 0;
      border-radius: $border-radius-sm;
      font-size: $font-size-md;
      font-weight: $font-weight-medium;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .cancel-btn {
      background-color: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      box-shadow: none;

      &:hover {
        background-color: var(--hover-color, rgba(0, 0, 0, 0.05));
        transform: none;
        box-shadow: none;
      }

      &:active {
        transform: none;
        box-shadow: none;
      }
    }

    .confirm-btn {
      background-color: var(--error-color);
      color: var(--text-on-dark-primary);

      &:hover {
        background-color: #ff7875;
      }
    }
  }
}

.modal-fade-enter-active {
  animation: fade-in 0.2s ease-out;
}

.modal-fade-leave-active {
  animation: fade-out 0.2s ease-in;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.inline-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  border: 1px solid transparent;
  transition: all 0.3s ease;

  &.status-transition {
    animation: status-change 0.5s ease;
  }

  &.status-pending,
  &.status-free-confirm {
    color: var(--warning-color);
    background-color: rgba(255, 152, 0, 0.12);
    border-color: rgba(255, 152, 0, 0.2);
  }

  &.status-processing {
    color: var(--info-color);
    background-color: rgba(33, 150, 243, 0.12);
    border-color: rgba(33, 150, 243, 0.2);
  }

  &.status-cancelled {
    color: var(--error-color);
    background-color: rgba(244, 67, 54, 0.12);
    border-color: rgba(244, 67, 54, 0.2);
  }

  &.status-completed,
  &.status-discounted {
    color: var(--success-color);
    background-color: rgba(76, 175, 80, 0.12);
    border-color: rgba(76, 175, 80, 0.2);
  }

  &.status-unknown {
    color: var(--text-tertiary);
    background-color: rgba(158, 158, 158, 0.12);
    border-color: rgba(158, 158, 158, 0.2);
  }
}

.rotating-icon {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes status-change {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
