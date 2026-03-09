<template>
  <div class="my-center">
    <div class="my-center-inner">
      <header class="page-intro">
        <h1>账户设置</h1>
        <p>管理账户信息、订阅状态、通知偏好与安全选项</p>
      </header>

      <section class="summary-panel">
        <div class="summary-top">
          <div>
            <h2>账户摘要</h2>
            <p class="summary-desc">快速查看当前账户状态</p>
          </div>
          <button class="mini-action" @click="go('/billing?tab=wallet')">余额充值</button>
        </div>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">邮箱</span>
            <strong>{{ userInfo.email || '-' }}</strong>
          </div>
          <div class="summary-item">
            <span class="label">注册时间</span>
            <strong>{{ createdAtText }}</strong>
          </div>
          <div class="summary-item">
            <span class="label">当前计划</span>
            <strong>{{ subscriptionText }}</strong>
          </div>
          <div class="summary-item">
            <span class="label">到期时间</span>
            <strong>{{ subscriptionExpireText }}</strong>
          </div>
          <div class="summary-item highlight">
            <span class="label">账户余额</span>
            <strong>{{ currencySymbol }}{{ formatBalance(userInfo.balance) }}</strong>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <h3>通知设置</h3>
        <div class="settings-list">
          <div class="settings-row">
            <div>
              <div class="row-title">到期提醒</div>
              <p>订阅即将到期时发送邮件提醒</p>
            </div>
            <label class="switch" :class="{ disabled: updatingSettings }">
              <input type="checkbox" v-model="remindExpire" @change="updateRemindSettings" :disabled="updatingSettings" />
              <span class="slider round"></span>
            </label>
          </div>
          <div class="settings-row">
            <div>
              <div class="row-title">流量提醒</div>
              <p>流量不足时发送邮件提醒</p>
            </div>
            <label class="switch" :class="{ disabled: updatingSettings }">
              <input type="checkbox" v-model="remindTraffic" @change="updateRemindSettings" :disabled="updatingSettings" />
              <span class="slider round"></span>
            </label>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <h3>账户入口</h3>
        <div class="settings-list nav-list">
          <button class="nav-row" @click="go('/trafficlog')">
            <div>
              <div class="row-title">使用记录</div>
              <p>查看近30天用量</p>
            </div>
            <IconChevronRight :size="18" />
          </button>
          <button class="nav-row" @click="go('/billing?tab=orders')">
            <div>
              <div class="row-title">订单记录</div>
              <p>查看历史订单与支付状态</p>
            </div>
            <IconChevronRight :size="18" />
          </button>
          <button class="nav-row" @click="go('/billing?tab=referral')">
            <div>
              <div class="row-title">邀请返利</div>
              <p>查看邀请进度与佣金明细</p>
            </div>
            <IconChevronRight :size="18" />
          </button>
          <button class="nav-row" @click="go('/security')">
            <div>
              <div class="row-title">安全设置</div>
              <p>修改密码与账户安全选项</p>
            </div>
            <IconChevronRight :size="18" />
          </button>
        </div>
      </section>

      <section class="danger-zone">
        <div>
          <h3>危险操作</h3>
          <p>退出登录后，需要重新输入账户信息才能访问受保护页面。</p>
        </div>
        <button class="logout-btn" @click="logout">退出登录</button>
      </section>

      <div class="bottom-safe-area"></div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IconChevronRight } from '@tabler/icons-vue';
import { getUserInfo, getUserSubscribe, updateRemindSettings as apiUpdateRemind } from '@/api/user';
import { getUserConfig } from '@/api/wallet';
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

const createdAtText = computed(() => {
  if (!userInfo.value?.created_at) return '-';
  return formatDate(userInfo.value.created_at);
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
.my-center { padding: var(--space-4) 0; }
.my-center-inner { max-width: 980px; margin: 0 auto; display: grid; gap: var(--space-4); }
.page-intro h1 { margin: 0; font-size: 26px; color: var(--text-color); }
.page-intro p { margin: 6px 0 0; color: var(--secondary-text-color); }

.summary-panel,
.settings-list,
.danger-zone {
  background: var(--card-level-2);
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card-sm);
}

.summary-panel { padding: var(--space-4); }
.summary-top { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-3); }
.summary-top h2 { margin: 0; font-size: 18px; }
.summary-desc { margin: 2px 0 0; color: var(--secondary-text-color); font-size: var(--font-size-2); }
.summary-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
.summary-item { padding: 12px; border: 1px solid var(--border-color-soft); border-radius: var(--radius-md); background: #fff; }
.summary-item .label { display: block; color: var(--secondary-text-color); font-size: 12px; margin-bottom: 6px; }
.summary-item strong { font-size: 14px; color: var(--text-color); word-break: break-word; }
.summary-item.highlight { border-color: rgba(var(--theme-color-rgb), 0.25); background: rgba(var(--theme-color-rgb), 0.05); }

.settings-section { display: grid; gap: var(--space-2); }
.settings-section h3 { margin: 0 0 4px; font-size: 16px; }
.settings-list { overflow: hidden; }
.settings-row,
.nav-row { min-height: 64px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.settings-row + .settings-row,
.nav-row + .nav-row { border-top: 1px solid var(--border-color-soft); }
.row-title { font-size: 14px; font-weight: 600; color: var(--text-color); }
.settings-row p,
.nav-row p { margin: 3px 0 0; font-size: 12px; color: var(--secondary-text-color); }

.nav-row {
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background-color .2s ease;
  color: var(--text-color);
}
.nav-row:hover { background: rgba(15, 23, 42, 0.03); }
.nav-row:active { background: rgba(15, 23, 42, 0.06); }

.mini-action {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  height: 32px;
  padding: 0 12px;
  background: #fff;
  color: var(--text-color);
}

.switch { position: relative; display: inline-block; width: 42px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; inset: 0; background-color: #cbd5e1; transition: .2s; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; top: 3px; background: #fff; transition: .2s; }
input:checked + .slider { background-color: rgba(var(--theme-color-rgb), 1); }
input:checked + .slider:before { transform: translateX(18px); }
.slider.round { border-radius: 24px; }
.slider.round:before { border-radius: 50%; }

.danger-zone {
  padding: var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  border-color: rgba(220, 38, 38, 0.2);
  background: rgba(254, 242, 242, 0.35);
}
.danger-zone h3 { margin: 0; font-size: 15px; color: #991b1b; }
.danger-zone p { margin: 4px 0 0; color: #b45309; font-size: 12px; }
.logout-btn {
  height: 36px;
  padding: 0 14px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(220, 38, 38, 0.35);
  background: #fff;
  color: #b91c1c;
}

.bottom-safe-area { height: calc(var(--safe-bottom) + 12px); }

@media (max-width: 1100px) {
  .summary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 768px) {
  .my-center-inner { max-width: 100%; gap: var(--space-3); }
  .page-intro h1 { font-size: 22px; }
  .summary-panel { padding: 12px; }
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .summary-item { padding: 10px; }
  .settings-row,
  .nav-row { min-height: 58px; padding: 10px 12px; }
  .danger-zone { flex-direction: column; align-items: stretch; }
}
</style>
