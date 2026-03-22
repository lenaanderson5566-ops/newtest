<template>
  <div class="payment-container page-shell">
    <div class="payment-inner page-inner page-stack">
      <div class="content-wrapper">
        <!-- 左侧内容：产品信息 -->
        <div class="left-column">
          <!-- 订单概览 -->
          <div class="section-wrapper overview-section">
            <div class="section-title with-status">
              <span>订单摘要</span>
              <button
                v-if="!loading.order && orderDetail.status === 0 && orderDetail.total_amount > 0"
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
                <div class="info-label">订阅</div>
                <div class="info-value">{{ orderDetail.plan?.name || (orderDetail.period === 'deposit' ? $t("wallet.deposit.title") : "-") }}</div>
              </div>
              <div class="info-row" v-if="orderDetail.period !== 'deposit'">
                <div class="info-label">周期</div>
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
                <div class="info-label">状态</div>
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
              <div class="payment-security-note">安全支付 · 实时到账</div>
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
          <div class="section-wrapper order-amount-section">
            <div class="section-title">
              <span>支付信息</span>
            </div>

            <div class="order-info" v-if="!loading.order">
              <div v-if="orderDetail.period === 'deposit'" class="info-row">
                <div class="info-label">{{ $t("wallet.deposit.title") }}</div>
                <div class="info-value amount">
                  {{ formatAmount(orderDetail.total_amount) }}
                </div>
              </div>
              <div v-else class="info-row">
                <div class="info-label">订阅价格</div>
                <div class="info-value amount">
                  {{ formatAmount(getPlanPrice()) }}
                </div>
              </div>

              <div
                class="info-row"
                v-if="
                  periodDiscount.showDiscount &&
                  orderDetail.period !== 'deposit'
                "
              >
                <div class="info-label">{{ $t("shop.plan.discount.relative") }}</div>
                <div class="info-value">
                  {{ periodDiscount.periodName }} {{ periodDiscount.discountPercentage }}% ，{{ $t("shop.plan.discount.savings") }}
                  {{ formatAmount(periodDiscount.savingsAmountInCents) }}
                </div>
              </div>

              <div class="info-row discount-row" v-if="discountBreakdownVisible">
                <div class="info-label">优惠金额</div>
                <div class="info-value discount">-{{ formatAmount(discountAmount) }}</div>
              </div>
              <div
                class="info-row"
                v-if="
                  orderDetail.balance_amount !== null &&
                  orderDetail.balance_amount !== undefined &&
                  orderDetail.balance_amount > 0
                "
              >
                <div class="info-label">余额抵扣</div>
                <div class="info-value discount">-{{ formatAmount(orderDetail.balance_amount) }}</div>
              </div>
              <div
                class="info-row"
                v-if="
                  orderDetail.refund_amount !== null &&
                  orderDetail.refund_amount !== undefined &&
                  orderDetail.refund_amount > 0
                "
              >
                <div class="info-label">{{ $t("payment.refund_amount") }}</div>
                <div class="info-value">{{ formatAmount(orderDetail.refund_amount) }}</div>
              </div>
              <div class="info-row" v-if="selectedMethod && handleFeeAmount > 0">
                <div class="info-label">{{ $t("payment.handling_fee") }}</div>
                <div class="info-value fee">{{ formatAmount(handleFeeAmount) }}</div>
              </div>
              <div class="info-row final-row">
                <div class="info-label">应付金额</div>
                <div class="info-value final">{{ formatAmount(totalWithFee) }}</div>
              </div>
            </div>

            <div class="skeleton-card" v-else>
              <div class="skeleton-text" v-for="i in 5" :key="'summary-' + i"></div>
            </div>

            <div
              class="order-amount-actions"
              v-if="!loading.order && orderDetail.status === 0 && !paymentSuccessful && orderDetail.total_amount > 0"
            >
              <button
                class="btn-pay main-action full-width"
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
          </div>

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
                  <span>{{ $t("payment.free_activate") }}</span>
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
    <transition name="modal">
      <div class="modal-wrapper" v-if="showPaymentModal">
        <div class="modal-backdrop" @click="closePaymentModal"></div>
        <div class="modal-container">
          <div class="modal-card">
            <button class="close-button" @click="closePaymentModal">×</button>
            <div class="modal-header">
              <div class="icon-wrapper payment">
                <IconCreditCard :size="32" />
              </div>
              <h3>
                {{
                  selectedMethod
                    ? getSelectedMethodName()
                    : $t("payment.payment_method")
                }}
              </h3>

              <!-- 添加Safari浏览器特定提示 -->
              <p
                v-if="
                  detectBrowser() === 'Safari' &&
                  PAYMENT_CONFIG.useSafariPaymentModal &&
                  paymentLink
                "
              >
                {{ $t("payment.safari_payment_notice") }}
              </p>
              <p v-else>
                {{ $t("payment.scan_qrcode") }}
              </p>

              <div class="qrcode-container" v-if="paymentQRCode">
                <QrcodeVue
                  :value="paymentQRCode"
                  :size="PAYMENT_CONFIG.qrcodeSize"
                  :background="PAYMENT_CONFIG.qrcodeBackground"
                  :foreground="PAYMENT_CONFIG.qrcodeColor"
                  level="H"
                  render-as="svg"
                />
              </div>

              <div class="payment-link" v-if="paymentLink">
                <button class="btn-link" @click="openPaymentLink">
                  <IconExternalLink :size="18" />
                  <span
                    v-if="
                      detectBrowser() === 'Safari' &&
                      PAYMENT_CONFIG.useSafariPaymentModal
                    "
                  >
                    {{ $t("payment.safari_payment_button") }}
                  </span>
                  <span v-else>
                    {{ $t("payment.open_in_new_tab") }}
                  </span>
                </button>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" @click="closePaymentModal">
                <IconX :size="18" />
                <span>{{ $t("common.cancel") }}</span>
              </button>
              <button class="btn-primary" @click="checkPayment">
                <IconRefresh :size="18" />
                <span>{{ $t("payment.check_payment") }}</span>
              </button>
            </div>
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
  IconExternalLink,
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
    IconExternalLink,
    IconArrowLeft,
    QrcodeVue,
    ConfettiExplosion,
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

    const periodDiscount = computed(() => {
      const plan = orderDetail.value?.plan;
      const period = orderDetail.value?.period;
      if (
        !plan ||
        !period ||
        period === "deposit" ||
        period === "onetime_price"
      ) {
        return {
          showDiscount: false,
          periodName: "",
          discountPercentage: 0,
          savingsAmountInCents: 0,
        };
      }
      const monthPrice = plan.month_price;
      const selectedPrice = plan[period];
      const monthCountMap = {
        quarter_price: 3,
        half_year_price: 6,
        year_price: 12,
        two_year_price: 24,
        three_year_price: 36,
      };
      const months = monthCountMap[period];
      if (!monthPrice || !selectedPrice || !months) {
        return {
          showDiscount: false,
          periodName: "",
          discountPercentage: 0,
          savingsAmountInCents: 0,
        };
      }
      const totalMonthCost = monthPrice * months;
      if (totalMonthCost <= selectedPrice) {
        return {
          showDiscount: false,
          periodName: "",
          discountPercentage: 0,
          savingsAmountInCents: 0,
        };
      }
      const savingsAmountInCents = totalMonthCost - selectedPrice;
      const discountPercentage = Math.round(
        (savingsAmountInCents / totalMonthCost) * 100
      );
      return {
        showDiscount: discountPercentage > 1,
        periodName: t(
          `shop.plan.price_options.${period.replace("_price", "")}`
        ),
        discountPercentage,
        savingsAmountInCents,
      };
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
            orderDetail.value.total_amount === 0
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
        month_price: "月付",
        quarter_price: t("shop.plan.price_options.quarter"),
        half_year_price: t("shop.plan.price_options.half_year"),
        year_price: "年付",
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

    const openPaymentLink = () => {
      if (paymentLink.value) {
        try {
          const isSafari = detectBrowser() === "Safari";

          if (
            PAYMENT_CONFIG.openPaymentInNewTab ||
            (isSafari && PAYMENT_CONFIG.useSafariPaymentModal)
          ) {
            const tempLink = document.createElement("a");
            tempLink.href = paymentLink.value;
            tempLink.target = "_blank";
            tempLink.rel = "noopener noreferrer";
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
          } else {
            const tempLink = document.createElement("a");
            tempLink.href = paymentLink.value;
            tempLink.rel = "noopener noreferrer";
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
          }
        } catch (e) {
          console.error("Failed to open payment link:", e);
          if (PAYMENT_CONFIG.openPaymentInNewTab) {
            window.open(paymentLink.value, "_blank");
          } else {
            window.location.href = paymentLink.value;
          }
        }
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
        router.push("/billing?tab=wallet");
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
      fetchOrderDetail();
      fetchPaymentMethods();

      if (route.query.from === "orders") {
        fromOrderList.value = true;
      } else if (document.referrer && document.referrer.includes("/orders") || document.referrer.includes("/billing")) {
        fromOrderList.value = true;
      } else {
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
        { immediate: false }
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
      formatDate,
      formatAmount,
      formatPeriod,
      formatFee,
      selectMethod,
      checkPayment,
      cancelCurrentOrder,
      goToDashboard,
      getPlanPrice,
      showCancelConfirm,
      confirmCancel,
      closeModal,
      showPaymentModal,
      paymentQRCode,
      paymentLink,
      PAYMENT_CONFIG,
      getSelectedMethodName,
      processPayment,
      openPaymentLink,
      closePaymentModal,
      handleFeeAmount,
      totalWithFee,
      periodDiscount,
      couponDiscountAmount,
      userDiscountAmount,
      discountAmount,
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
@use "@/assets/styles/base/variables.scss" as *;

.payment-container {
  padding: 0;
  display: flex;
  justify-content: center;
  position: relative;

  .payment-inner {
    width: 100%;
      }

  .title-card {
    margin-top: 20px;
    margin-bottom: 24px;
  }

  .dashboard-card {
    background-color: var(--card-bg-color);
    border-radius: $border-radius-sm;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
    padding: 20px;
    margin-bottom: 24px;
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
    position: relative;

    &:hover {
      box-shadow: 0 1px 5px rgba(15, 23, 42, 0.08);
      border-color: var(--border-color);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;

      .card-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }
    }

    .card-body {
      p {
        color: var(--secondary-text-color);
        margin: 0;
      }
    }
  }

  .content-wrapper {
    display: flex;
    gap: 25px;

    @media (max-width: 768px) {
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
    }
  }

  .section-wrapper {
    background-color: var(--card-bg-color);
    border-radius: $border-radius-sm;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
    padding: 20px;
    margin-bottom: 24px;
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;

    &:last-child {
      margin-bottom: 40px;
    }

    &:hover {
      box-shadow: 0 1px 5px rgba(15, 23, 42, 0.08);
      border-color: var(--border-color);
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--text-color);
      display: flex;
      align-items: center;

      &::after {
        content: "";
        flex: 1;
        height: 1px;
        background-color: var(--border-color);
        margin-left: 12px;
      }

      &.with-status {
        justify-content: space-between;

        &::after {
          display: none;
        }
      }
    }

    .overview-cancel-btn {
      height: 26px;
      padding: 0 8px;
      border-radius: $border-radius-sm;
      border: 1px solid var(--border-color);
      background: transparent;
      color: var(--secondary-text-color);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background-color: rgba(148, 163, 184, 0.08);
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
      font-size: 18px;
      font-weight: 700;
      color: var(--text-color);
      line-height: 1.2;
    }

    .overview-plan-meta {
      margin-top: 8px;
      font-size: 14px;
      color: var(--secondary-text-color);
      line-height: 1.3;
    }

    .overview-divider {
      height: 1px;
      background-color: var(--border-color);
      margin: 10px 0 8px;
    }

    .product-info .info-row {
      margin-bottom: 6px;
    }

    .inline-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .overview-cancel-btn .loader {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(0, 0, 0, 0.2);
      border-top-color: var(--text-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }

  .section-wrapper.payment-methods-section {
    padding: 0 !important;
    margin-bottom: 6px !important;
    background: var(--card-bg-color);
    border: 1px solid var(--border-color);
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);

    .section-title {
      margin-bottom: 0;
      font-size: 15px;
      padding: 10px 12px 8px;
      color: var(--text-color);

      &::after {
        background-color: var(--border-color);
      }
    }
  }

  .right-column .section-wrapper.payment-methods-section {
    background: var(--card-bg-color) !important;
    border: 1px solid var(--border-color) !important;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06) !important;
  }

  .order-amount-section {
    background: var(--card-bg-color);
    border: 1px solid var(--border-color);
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);

    .section-title {
      color: var(--text-color);

      &::after {
        background-color: var(--border-color);
      }
    }

    .order-info {
      .info-label,
      .info-value {
        color: var(--text-color);
      }

      .info-value.discount {
        color: #f44336;
      }

      .info-value.fee {
        color: var(--secondary-text-color);
      }

      .info-row.final-row {
        border-top: 1px solid var(--border-color);
        padding-top: 10px;
        margin-top: 8px;

        .info-label {
          color: var(--text-color);
          font-weight: 600;
        }

        .info-value.final {
          color: var(--theme-color);
          font-weight: 700;
        }
      }
    }

    .order-amount-actions {
      margin-top: 14px;

      .btn-pay {
        width: 100%;
        height: 44px;
        border-radius: $border-radius-sm;
        background-color: var(--theme-color);
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 1px 4px rgba(var(--theme-color-rgb), 0.2);
        border: none;

        &:hover:not(:disabled) {
          background-color: color-mix(in srgb, var(--theme-color) 88%, black) !important;
          box-shadow: 0 1px 5px rgba(var(--theme-color-rgb), 0.24);
          transform: none;
        }

        svg,
        span {
          display: inline-flex;
          align-items: center;
          line-height: 1;
        }

        svg {
          flex-shrink: 0;
          vertical-align: middle;
        }
      }
    }
  }

  .right-column .order-amount-section {
    background: var(--card-bg-color) !important;
    border: 1px solid var(--border-color) !important;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06) !important;
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
      background-color: rgba(255, 255, 255, 0.95);

      &:hover {
        border-color: rgba(var(--theme-color-rgb), 0.42);
        background-color: rgba(var(--theme-color-rgb), 0.08);
      }

      &.active {
        border-color: var(--theme-color);
        background-color: rgba(var(--theme-color-rgb), 0.14);
        box-shadow: 0 2px 10px rgba(var(--theme-color-rgb), 0.22);
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
          font-weight: 600;
          color: var(--text-color);
          line-height: 1.2;
        }

        .method-fee {
          font-size: 11px;
          color: var(--secondary-text-color);
          white-space: nowrap;
        }
      }
    }

    .payment-security-note {
      padding: 6px 12px 8px;
      border-top: 1px solid var(--border-color);
      font-size: 12px;
      color: var(--secondary-text-color);
      line-height: 1.4;
      background: #fff;
    }
  }

  .right-column .payment-methods .payment-security-note {
    background: #fff !important;
    color: var(--secondary-text-color) !important;
  }

  .free-notice {
    display: flex;
    align-items: center;
    padding: 20px;
    background-color: rgba(76, 175, 80, 0.1);
    border-radius: $border-radius-sm;
    border: 1px solid rgba(76, 175, 80, 0.2);

    .notice-icon {
      margin-right: 20px;
      color: #4caf50;

      &.success {
        color: #4caf50;
      }
    }

    .notice-text {
      flex: 1;

      h3 {
        margin: 0 0 8px;
        color: #4caf50;
        font-size: 16px;
      }

      p {
        margin: 0;
        color: var(--text-color);
      }
    }
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-top: 30px;
    margin-bottom: 20px;

    .btn-group {
      display: flex;
      gap: 15px;
      width: 100%;

      @media (max-width: 480px) {
        flex-direction: column;
        gap: 10px;

        .btn-back,
        .btn-pay,
        .btn-check,
        .btn-continue {
          width: 100%;
          height: 48px;
          min-height: 48px;
          padding: 10px 24px;
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
        margin-bottom: 10px;
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
      font-size: 14px;
      font-weight: 500;
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

      @media (max-width: 480px) {
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
      color: var(--text-color);
      flex: 1;
      border: 1px solid var(--border-color);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);

      &:hover:not(:disabled) {
        background-color: var(--hover-color);
        transform: none;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: 0 2px 3px rgba(0, 0, 0, 0.05);
      }

      &.full-width {
        margin-top: 5px;
        max-width: 100%;
        justify-content: center;
      }
    }

    .btn-pay,
    .btn-continue {
      background-color: var(--theme-color);
      color: white;
      flex: 2;
      box-shadow: 0 1px 4px rgba(var(--theme-color-rgb), 0.2);

      &:hover:not(:disabled) {
        background-color: var(--primary-color-hover);
        transform: none;
        box-shadow: 0 1px 5px rgba(var(--theme-color-rgb), 0.24);
      }
    }

    .btn-check {
      background-color: var(--hover-color);
      color: var(--text-color);
      flex: 1;
      border: 1px solid var(--border-color);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);

      &:hover:not(:disabled) {
        background-color: var(--card-bg-color);
        transform: none;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
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
      margin-bottom: 15px;
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
      color: white;
      padding: 30px;
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
          box-shadow: 0 0 30px rgba(var(--theme-color-rgb), 0.7);

          .check-icon {
            color: white;
            animation: bounceIn 0.8s ease 0.2s both;
          }
        }
      }

      h2 {
        font-size: 28px;
        margin-bottom: 16px;
        animation: slideUp 0.5s ease 0.4s both;
      }

      p {
        font-size: 16px;
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
      box-shadow: 0 0 20px rgba(var(--theme-color-rgb), 0.7);
    }
    50% {
      box-shadow: 0 0 40px rgba(var(--theme-color-rgb), 0.9);
    }
    100% {
      box-shadow: 0 0 20px rgba(var(--theme-color-rgb), 0.7);
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

  @media (max-width: 768px) {
    .content-wrapper {
      flex-direction: column;
    }

    .right-column {
      margin-bottom: 60px;
      max-width: none;
    }
  }

  @media (max-width: 768px) {
    padding-bottom: 100px;
  }
  @media (max-width: 480px) {
    padding-bottom: 120px;

    .right-column {
      margin-bottom: 90px;
    }

    .action-buttons {
      .btn-group {
        flex-direction: column;
        gap: 10px;

        .main-action,
        .secondary-action {
          width: 100%;
          flex: auto;
        }
      }
    }
  }

  .modal-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    will-change: opacity;

    .modal-backdrop {
      position: absolute;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.65);
      will-change: opacity;
    }

    .modal-container {
      position: relative;
      width: 100%;
      max-width: 400px;
      margin: 20px;
      will-change: transform, opacity;
    }

    .modal-card {
      position: relative;
      background-color: rgba(var(--card-background-rgb, 255, 255, 255), 1);
      border-radius: $border-radius-sm;
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(var(--theme-color-rgb), 0.1);
      overflow: hidden;
      transform: translateZ(0);
      backface-visibility: hidden;

      .close-button {
        position: absolute;
        top: 15px;
        right: 15px;
        height: 44px;
        width: 44px;
        padding: 0;
        border-radius: $border-radius-sm;
        background-color: transparent;
        color: var(--text-color);
        font-size: 22px;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--border-color);
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
        z-index: 10;

        &:hover {
          background-color: rgba(0, 0, 0, 0.05);
          transform: none;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        }
      }

      .modal-header {
        padding: 28px 24px 20px;
        text-align: center;

        .icon-wrapper {
          width: 64px;
          height: 64px;
          margin: 0 auto 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

          &.warning {
            background-color: rgba(255, 152, 0, 0.15);
            color: #ff9800;

            svg {
              filter: drop-shadow(0 2px 8px rgba(255, 152, 0, 0.3));
            }
          }

          &.payment {
            background-color: rgba(var(--theme-color-rgb), 0.15);
            color: var(--theme-color);

            svg {
              filter: drop-shadow(0 2px 8px rgba(var(--theme-color-rgb), 0.3));
            }
          }
        }

        h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 12px;
          color: var(--text-color);
        }

        p {
          font-size: 15px;
          line-height: 1.6;
          margin: 0 0 24px;
          color: var(--secondary-text-color);
          max-width: 300px;
          margin-left: auto;
          margin-right: auto;
        }

        .qrcode-container {
          width: 100%;
          display: flex;
          justify-content: center;
          margin: 10px 0 20px;

          canvas,
          svg {
            border-radius: $border-radius-sm;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
        }

        .payment-link {
          margin-top: 16px;

          .btn-link {
            padding: 10px 16px;
            background-color: transparent;
            border: 1px solid var(--border-color);
            border-radius: $border-radius-sm;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: var(--theme-color);
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover {
              background-color: rgba(var(--theme-color-rgb), 0.05);
              border-color: var(--theme-color);
            }
          }
        }
      }

      .modal-footer {
        padding: 16px 24px 28px;
        display: flex;
        gap: 16px;

        button {
          flex: 1;
          height: 46px;
          border-radius: $border-radius-sm;
          border: none;
          font-size: 15px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.3, 0.7, 0.4, 1.5);
          position: relative;
          overflow: hidden;

          &::before {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0);
            transition: transform 0.5s ease-out;
          }

          &:active::before {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
            transition: transform 0.6s ease-out, opacity 0.6s ease-out;
          }
        }

        .btn-secondary {
          background-color: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-color);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

          &:hover {
            background-color: var(--hover-color);
            transform: none;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
          }

          &:active {
            transform: translateY(0);
            box-shadow: 0 2px 3px rgba(0, 0, 0, 0.05);
            transition-duration: 0.1s;
          }
        }

        .btn-primary {
          background-color: var(--theme-color);
          color: white;
          box-shadow: 0 1px 4px rgba(var(--theme-color-rgb), 0.2);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

          &:hover {
            background-color: var(--primary-color-hover);
            transform: none;
            box-shadow: 0 1px 5px rgba(var(--theme-color-rgb), 0.24);
          }

          &:active {
            transform: translateY(0);
            box-shadow: 0 4px 8px rgba(var(--theme-color-rgb), 0.2);
            transition-duration: 0.1s;
          }
        }
      }
    }
  }

  .modal-enter-active {
    transition: opacity 0.3s ease-out;

    .modal-container {
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
  }

  .modal-leave-active {
    transition: opacity 0.2s ease-in;

    .modal-container {
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;

    .modal-container {
      opacity: 0;
      transform: scale(0.95) translateY(10px);
    }
  }
}

.payment-container .overview-section {
  background-color: rgba(var(--card-background-rgb, 255, 255, 255), 1);
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
    background-color: rgba(var(--card-background-rgb, 255, 255, 255), 1);
    border-radius: $border-radius-sm;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
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
    color: #ff9800;
  }

  .cancel-modal-header {
    padding: 16px 24px;
    text-align: center;

    h3 {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 12px;
      color: var(--text-color);
    }

    p {
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
      color: var(--secondary-text-color);
    }
  }

  .cancel-modal-actions {
    display: flex;
    padding: 0 16px 20px;
    gap: 12px;

    button {
      flex: 1;
      padding: 10px 0;
      border-radius: $border-radius-sm;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .cancel-btn {
      background-color: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-color);
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
      background-color: #ff4d4f;
      color: white;

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
  gap: 6px;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid transparent;
  transition: all 0.3s ease;

  &.status-transition {
    animation: status-change 0.5s ease;
  }

  &.status-pending,
  &.status-free-confirm {
    color: #f57c00;
    background-color: rgba(255, 152, 0, 0.12);
    border-color: rgba(255, 152, 0, 0.2);
  }

  &.status-processing {
    color: #0d47a1;
    background-color: rgba(33, 150, 243, 0.12);
    border-color: rgba(33, 150, 243, 0.2);
  }

  &.status-cancelled {
    color: #c62828;
    background-color: rgba(244, 67, 54, 0.12);
    border-color: rgba(244, 67, 54, 0.2);
  }

  &.status-completed,
  &.status-discounted {
    color: #2e7d32;
    background-color: rgba(76, 175, 80, 0.12);
    border-color: rgba(76, 175, 80, 0.2);
  }

  &.status-unknown {
    color: #757575;
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
