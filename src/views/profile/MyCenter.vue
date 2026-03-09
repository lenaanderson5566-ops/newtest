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

      <div class="center-card">
        <h3>当前订阅</h3>
        <p class="main">{{ subscriptionText }}</p>
        <p class="sub">{{ subscriptionSubText }}</p>
      </div>

      <div class="center-card">
        <h3>账户余额</h3>
        <p class="main">{{ currencySymbol }}{{ formatBalance(userInfo.balance) }}</p>
        <p class="sub">可用于购买或续费套餐</p>
      </div>

      <div class="entry-list">
        <button class="entry-card" @click="go('/trafficlog')">
          <div>
            <strong>使用记录</strong>
            <p>查看近30天用量</p>
          </div>
          <IconChevronRight :size="20" />
        </button>
        <button class="entry-card" @click="go('/orders')">
          <div>
            <strong>订单记录</strong>
            <p>查看历史订单与支付状态</p>
          </div>
          <IconChevronRight :size="20" />
        </button>
        <button class="entry-card" @click="go('/invite')">
          <div>
            <strong>邀请返利</strong>
            <p>查看邀请进度与佣金明细</p>
          </div>
          <IconChevronRight :size="20" />
        </button>
        <button class="entry-card" @click="go('/security')">
          <div>
            <strong>安全设置</strong>
            <p>修改密码与账户安全选项</p>
          </div>
          <IconChevronRight :size="20" />
        </button>
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
import { getUserInfo, getUserSubscribe } from '@/api/user';
import { getUserConfig } from '@/api/wallet';
import { formatDate } from '@/utils/formatters';
import AccountInfoCard from '@/components/profile/AccountInfoCard.vue';

const router = useRouter();
const userInfo = ref({});
const subscribeInfo = ref({});
const currencySymbol = ref('$');

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

  if (userResp.status === 'fulfilled') userInfo.value = userResp.value?.data || {};
  if (subscribeResp.status === 'fulfilled') subscribeInfo.value = subscribeResp.value?.data || {};
  if (configResp.status === 'fulfilled' && configResp.value?.data?.currency_symbol) {
    currencySymbol.value = configResp.value.data.currency_symbol;
  }
});
</script>

<style scoped lang="scss">
.my-center { padding: 16px; }
.my-center-inner { max-width: 820px; margin: 0 auto; }
.center-card {
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  .main { font-size: 18px; font-weight: 600; margin: 6px 0; }
  .sub { margin: 0; opacity: .75; font-size: 13px; }
}
.entry-list { display: grid; grid-template-columns: 1fr; gap: 12px; }
.entry-card {
  width: 100%;
  min-height: 72px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--card-bg-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  text-align: left;
  strong { display: block; margin-bottom: 4px; }
  p { margin: 0; font-size: 13px; opacity: .75; }
}
.logout-btn {
  width: 100%;
  margin-top: 14px;
  height: 44px;
  border: none;
  border-radius: 10px;
  background: #ef4444;
  color: #fff;
}
.bottom-safe-area { height: calc(env(safe-area-inset-bottom, 0px) + 24px); }
</style>
