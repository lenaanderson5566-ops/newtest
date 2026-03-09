<template>
  <div class="my-center">
    <div class="my-center-inner">
      <AccountInfoCard
        :title="$t('profile.basicInfo')"
        :email-label="$t('profile.email')"
        :created-at-label="$t('profile.createdAt')"
        :email="userInfo.email"
        :created-at="userInfo.created_at"
      />

      <InfoCard class="center-card">
        <template #title>当前订阅</template>
        <p class="main">{{ subscriptionText }}</p>
        <template #description>{{ subscriptionSubText }}</template>
      </InfoCard>

      <InfoCard class="center-card">
        <template #title>账户余额</template>
        <template #action>
          <button class="mini-action" @click="go('/billing?tab=wallet')">余额充值</button>
        </template>
        <p class="main">{{ currencySymbol }}{{ formatBalance(userInfo.balance) }}</p>
        <template #description>可用于购买或续费套餐</template>
      </InfoCard>

      <InfoCard class="center-card">
        <template #title>邮件通知</template>
        <div class="setting-item">
          <div>
            <strong>到期提醒</strong>
            <p>订阅即将到期时发送邮件提醒</p>
          </div>
          <label class="switch" :class="{ disabled: updatingSettings }">
            <input type="checkbox" v-model="remindExpire" @change="updateRemindSettings" :disabled="updatingSettings" />
            <span class="slider round"></span>
          </label>
        </div>
        <div class="setting-item">
          <div>
            <strong>流量提醒</strong>
            <p>流量不足时发送邮件提醒</p>
          </div>
          <label class="switch" :class="{ disabled: updatingSettings }">
            <input type="checkbox" v-model="remindTraffic" @change="updateRemindSettings" :disabled="updatingSettings" />
            <span class="slider round"></span>
          </label>
        </div>
      </InfoCard>

      <div class="entry-list">
        <InfoCard class="entry-card" tag="button" clickable @click="go('/trafficlog')">
          <template #title>使用记录</template>
          <template #description>查看近30天用量</template>
          <template #suffix><IconChevronRight :size="20" /></template>
        </InfoCard>
        <InfoCard class="entry-card" tag="button" clickable @click="go('/billing?tab=orders')">
          <template #title>订单记录</template>
          <template #description>查看历史订单与支付状态</template>
          <template #suffix><IconChevronRight :size="20" /></template>
        </InfoCard>
        <InfoCard class="entry-card" tag="button" clickable @click="go('/billing?tab=referral')">
          <template #title>邀请返利</template>
          <template #description>查看邀请进度与佣金明细</template>
          <template #suffix><IconChevronRight :size="20" /></template>
        </InfoCard>
        <InfoCard class="entry-card" tag="button" clickable @click="go('/security')">
          <template #title>安全设置</template>
          <template #description>修改密码与账户安全选项</template>
          <template #suffix><IconChevronRight :size="20" /></template>
        </InfoCard>
      </div>

      <button class="logout-btn" @click="logout">退出登录</button>
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
import AccountInfoCard from '@/components/profile/AccountInfoCard.vue';
import InfoCard from '@/components/common/InfoCard.vue';
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

const subscriptionSubText = computed(() => {
  if (!subscribeInfo.value?.expired_at) return '去选购套餐获取完整服务';
  return `到期时间：${formatDate(subscribeInfo.value.expired_at)}`;
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
.my-center-inner { max-width: 820px; margin: 0 auto; }
.center-card {
  margin-bottom: var(--space-3);
  .main { font-size: var(--font-size-4); font-weight: 600; margin: var(--space-2) 0; }
}
.mini-action {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  height: 32px;
  padding: 0 12px;
  background: transparent;
}
.setting-item {
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  p { margin: 4px 0 0; font-size: 12px; opacity: 0.75; }
}
.entry-list { display: grid; grid-template-columns: 1fr; gap: var(--space-3); }
.entry-card { min-height: 72px; }
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #cbd5e1;
  transition: .2s;
}
.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  top: 3px;
  background: #fff;
  transition: .2s;
}
input:checked + .slider {
  background-color: rgba(var(--theme-color-rgb), 1);
}
input:checked + .slider:before {
  transform: translateX(20px);
}
.slider.round { border-radius: 24px; }
.slider.round:before { border-radius: 50%; }
.logout-btn {
  width: 100%;
  margin-top: 14px;
  height: 44px;
  border: none;
  border-radius: var(--radius-md);
  background: #ef4444;
  color: #fff;
}
.bottom-safe-area { height: calc(var(--safe-bottom) + 24px); }
</style>
