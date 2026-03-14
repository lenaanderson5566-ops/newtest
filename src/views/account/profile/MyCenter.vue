<template>
  <div class="my-center">
    <div class="my-center-inner">
      <section class="summary-panel section-block dashboard-like-card">
        <div class="summary-top">
          <div>
            <h2>账户摘要</h2>
            <p class="summary-desc">核心账户信息一目了然</p>
          </div>
          <button class="btn btn-secondary mini-action" @click="go('/billing?tab=wallet')">余额充值</button>
        </div>

        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">邮箱</span>
            <strong>{{ userInfo.email || '-' }}</strong>
          </div>
          <div class="summary-item">
            <span class="label">当前计划</span>
            <strong>{{ subscriptionText }}</strong>
          </div>
          <div class="summary-item">
            <span class="label">到期时间</span>
            <strong>{{ subscriptionExpireText }}</strong>
          </div>
          <div class="summary-item is-highlight">
            <span class="label">账户余额</span>
            <strong>{{ currencySymbol }}{{ formatBalance(userInfo.balance) }}</strong>
          </div>
        </div>
      </section>

      <section class="section-block dashboard-like-card">
        <h3 class="section-title">财务中心</h3>
        <div class="settings-list">
          <button class="nav-row" @click="go('/billing?tab=wallet')">
            <div class="row-main">
              <div class="row-title">账户余额</div>
              <p>查看余额明细与充值记录</p>
            </div>
            <IconChevronRight :size="18" />
          </button>

          <button class="nav-row" @click="go('/billing?tab=orders')">
            <div class="row-main">
              <div class="row-title">订单记录</div>
              <p>查看历史订单与支付状态</p>
            </div>
            <IconChevronRight :size="18" />
          </button>

          <button class="nav-row" @click="go('/billing?tab=referral')">
            <div class="row-main">
              <div class="row-title">邀请返利</div>
              <p>查看邀请进度与佣金明细</p>
            </div>
            <IconChevronRight :size="18" />
          </button>
        </div>
      </section>

      <section class="section-block dashboard-like-card">
        <h3 class="section-title">个人设置</h3>
        <div class="settings-list">
          <div class="settings-row">
            <div class="row-main">
              <div class="row-title">到期提醒</div>
              <p>订阅即将到期时发送邮件提醒</p>
            </div>
            <label class="switch" :class="{ disabled: updatingSettings }">
              <input type="checkbox" v-model="remindExpire" @change="updateRemindSettings" :disabled="updatingSettings" />
              <span class="slider round"></span>
            </label>
          </div>

          <div class="settings-row">
            <div class="row-main">
              <div class="row-title">流量提醒</div>
              <p>流量不足时发送邮件提醒</p>
            </div>
            <label class="switch" :class="{ disabled: updatingSettings }">
              <input type="checkbox" v-model="remindTraffic" @change="updateRemindSettings" :disabled="updatingSettings" />
              <span class="slider round"></span>
            </label>
          </div>

          <button class="nav-row" @click="go('/security')">
            <div class="row-main">
              <div class="row-title">安全设置</div>
              <p>修改密码与账户安全选项</p>
            </div>
            <IconChevronRight :size="18" />
          </button>
        </div>
      </section>

      <section class="session-panel section-block dashboard-like-card">
        <div>
          <h3 class="section-title">会话操作</h3>
          <p class="session-tip">退出当前登录会话，稍后可重新登录。</p>
        </div>
        <button class="btn btn-outline logout-btn" @click="logout">退出登录</button>
      </section>

      <div class="bottom-safe-area"></div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IconChevronRight } from '@tabler/icons-vue';
import { getUserInfo, getUserSubscribe, updateRemindSettings as apiUpdateRemind } from '@/api/account/user';
import { getUserConfig } from '@/api/account/wallet';
import { formatDate } from '@/utils/formatters';
import { useToast } from '@/composables/useToast';

const router = useRouter();
const { showToast } = useToast();
const userInfo = ref({});
const subscribeInfo = ref({});
const currencySymbol = ref('$');
const remindExpire = ref(false);
const remindTraffic = ref(false);
const updatingSettings = ref(false);

const subscriptionText = computed(() => {
  const name = subscribeInfo.value?.plan?.name;
  return name ? `${name}` : '暂无有效订阅';
});

const subscriptionExpireText = computed(() => {
  if (!subscribeInfo.value?.expired_at) return '未开通';
  return formatDate(subscribeInfo.value.expired_at);
});

const formatBalance = (balance) => ((Number(balance || 0) / 100).toFixed(2));
const go = (path) => router.push(path);

const updateRemindSettings = async () => {
  try {
    updatingSettings.value = true;
    await apiUpdateRemind({
      remind_expire: remindExpire.value ? 1 : 0,
      remind_traffic: remindTraffic.value ? 1 : 0,
      auto_renewal: userInfo.value.auto_renewal ? 1 : 0
    });
    showToast('通知设置已更新', 'success');
  } catch (error) {
    remindExpire.value = !!userInfo.value.remind_expire;
    remindTraffic.value = !!userInfo.value.remind_traffic;
    showToast('更新失败，请稍后重试', 'error');
  } finally {
    updatingSettings.value = false;
  }
};

const logout = async () => {
  localStorage.removeItem('token');
  router.push('/login');
};

onMounted(async () => {
  const [userResp, subscribeResp, configResp] = await Promise.allSettled([
    getUserInfo(),
    getUserSubscribe(),
    getUserConfig()
  ]);

  if (userResp.status === 'fulfilled') {
    userInfo.value = userResp.value?.data || {};
    remindExpire.value = !!userInfo.value.remind_expire;
    remindTraffic.value = !!userInfo.value.remind_traffic;
  }
  if (subscribeResp.status === 'fulfilled') subscribeInfo.value = subscribeResp.value?.data || {};
  if (configResp.status === 'fulfilled' && configResp.value?.data?.currency_symbol) {
    currencySymbol.value = configResp.value.data.currency_symbol;
  }
});
</script>

<style scoped lang="scss">
.my-center {
  padding: 1rem 0 1.25rem;
  background: linear-gradient(180deg, rgba(var(--theme-color-rgb), 0.03), transparent 42%);
}

.my-center-inner {
  max-width: 1024px;
  margin: 0 auto;
  display: grid;
  gap: 1rem;
}

.section-block {
  border-radius: 16px;
  background-color: var(--card-bg-color, var(--card-background));
  border: 1px solid rgba(var(--text-color-rgb), 0.08);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04), 0 10px 24px rgba(15, 23, 42, 0.05);
  transition: box-shadow 0.22s ease, border-color 0.22s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06), 0 16px 32px rgba(15, 23, 42, 0.08);
    border-color: rgba(var(--theme-color-rgb), 0.22);
  }
}

.dashboard-like-card {
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto auto 0;
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, rgba(var(--theme-color-rgb), 0.92), rgba(var(--theme-color-rgb), 0.35));
    pointer-events: none;
  }
}

.summary-panel { padding: 1rem; }

.summary-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.8rem;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.2px;
  }
}

.summary-desc {
  margin: 3px 0 0;
  font-size: 13px;
  color: var(--secondary-text-color);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.summary-item {
  padding: 12px;
  border: 1px solid rgba(var(--text-color-rgb), 0.08);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(var(--card-background-rgb), 0.96), rgba(var(--card-background-rgb), 0.9));

  .label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    color: var(--secondary-text-color);
  }

  strong {
    font-size: 14px;
    color: var(--text-color);
    word-break: break-word;
  }

  &.is-highlight {
    border-color: rgba(var(--theme-color-rgb), 0.32);
    background: linear-gradient(130deg, rgba(var(--theme-color-rgb), 0.14), rgba(var(--theme-color-rgb), 0.05));
    box-shadow: inset 0 0 0 1px rgba(var(--theme-color-rgb), 0.08);
  }
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-color);
}

.section-block > .section-title {
  padding: 14px 16px 10px;
}

.settings-list {
  overflow: hidden;
  border-top: 1px solid rgba(var(--text-color-rgb), 0.08);
}

.settings-row,
.nav-row {
  min-height: 62px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.settings-row + .settings-row,
.nav-row + .nav-row {
  border-top: 1px solid rgba(var(--text-color-rgb), 0.08);
}

.row-main { min-width: 0; }

.row-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.row-main p {
  margin: 3px 0 0;
  font-size: 12px;
  color: var(--secondary-text-color);
}

.nav-row {
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  color: var(--text-color);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background: rgba(var(--theme-color-rgb), 0.07);
    color: var(--theme-color);
  }

  &:active {
    background: rgba(var(--theme-color-rgb), 0.11);
  }
}

.mini-action {
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
}

.switch { position: relative; display: inline-block; width: 42px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; inset: 0; background-color: #cbd5e1; transition: .2s; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; top: 3px; background: #fff; transition: .2s; }
input:checked + .slider { background-color: rgba(var(--theme-color-rgb), 1); }
input:checked + .slider:before { transform: translateX(18px); }
.slider.round { border-radius: 24px; }
.slider.round:before { border-radius: 50%; }

.session-panel {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.session-tip {
  margin: 4px 0 0;
  color: var(--secondary-text-color);
  font-size: 12px;
}

.logout-btn {
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border-color: rgba(220, 38, 38, 0.35);
  color: #b91c1c;

  &:hover {
    background: rgba(220, 38, 38, 0.08);
  }
}

.bottom-safe-area { height: calc(env(safe-area-inset-bottom, 0px) + 10px); }

@media (max-width: 1100px) {
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 768px) {
  .my-center-inner { max-width: 100%; gap: 0.75rem; }
  .summary-panel { padding: 12px; }
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .summary-item { padding: 10px; }
  .section-block > .section-title { padding: 12px 12px 8px; }
  .settings-row,
  .nav-row { min-height: 58px; padding: 10px 12px; }
  .session-panel { flex-direction: column; align-items: stretch; padding: 12px; }
}
</style>
