<template>
  <div class="quick-start-container page-shell">
    <div class="quick-start-inner page-inner page-stack">
      <section class="hero-card">
        <div class="hero-title-wrap">
          <span class="hero-icon">🎉</span>
          <h1 class="hero-title">{{ statusCardTitle }}</h1>
        </div>
        <p class="hero-desc">{{ statusCardDescription }}</p>
      </section>

      <section class="step-card">
        <header class="step-header">
          <div class="step-index">1</div>
          <h2>{{ $t('dashboard.officialClients') }}</h2>
        </header>
        <div class="step-body">
          <p class="step-tip">选择你的设备并下载客户端</p>
          <div class="download-grid">
            <button class="download-item" v-if="clientConfig.showWindows" @click="downloadClient('windows')">
              <IconBrandWindows :size="40" />
              <strong>Windows</strong>
              <span>下载应用</span>
            </button>
            <button class="download-item recommended" v-if="clientConfig.showMacOS" @click="downloadClient('macos')">
              <div class="badge">推荐</div>
              <IconBrandFinder :size="40" />
              <strong>macOS</strong>
              <span>下载应用</span>
            </button>
            <button class="download-item" v-if="clientConfig.showAndroid" @click="downloadClient('android')">
              <IconBrandAndroid :size="40" />
              <strong>Android</strong>
              <span>一键复制</span>
            </button>
            <button class="download-item" v-if="clientConfig.showIOS" @click="downloadClient('ios')">
              <IconBrandApple :size="40" />
              <strong>iOS</strong>
              <span>一键导入</span>
            </button>
          </div>
        </div>
      </section>

      <section class="step-card">
        <header class="step-header">
          <div class="step-index">2</div>
          <h2>导入订阅</h2>
          <div class="actions" v-if="subscriptionUrl">
            <button class="action-btn primary" @click="copySubscriptionUrl">一键复制</button>
            <button class="action-btn" @click="openQrCodeModal">扫描二维码</button>
            <button class="action-btn" @click="showImportPanel = !showImportPanel">{{ showImportPanel ? '收起详细导入' : '查看详细导入' }}</button>
          </div>
        </header>
        <div class="step-body">
          <ImportConfigCard v-if="showImportPanel && userStatus === USER_STATUS.ACTIVE" />
        </div>
      </section>

      <section class="step-card">
        <header class="step-header">
          <div class="step-index">3</div>
          <h2>开始连接</h2>
        </header>
        <div class="step-body">
          <p class="connect-text">打开客户端 → 粘贴订阅 → 选择节点 → 点击连接</p>
          <button class="help-btn" @click="router.push('/docs')">需要帮助？查看详细教程 →</button>
        </div>
      </section>

      <Teleport to="body">
        <div v-if="showQrCode" class="qrcode-modal-overlay" @click="showQrCode = false">
          <div class="qrcode-modal" @click.stop>
            <div class="qrcode-header">
              <h3>扫描二维码添加配置</h3>
              <button class="close-btn" @click="showQrCode = false">✕</button>
            </div>
            <img :src="qrCodeUrl" alt="QR Code" />
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IconBrandApple, IconBrandAndroid, IconBrandFinder, IconBrandWindows } from '@tabler/icons-vue';
import ImportConfigCard from '@/components/common/ImportConfigCard.vue';
import { CLIENT_CONFIG } from '@/utils/baseConfig';
import { getSubscribe } from '@/api/overview/dashboard';
import QRCode from 'qrcode';

const router = useRouter();
const $toast = inject('$toast');
const clientConfig = reactive(CLIENT_CONFIG);

const USER_STATUS = Object.freeze({
  NEW: 'new',
  ACTIVE: 'active',
  EXPIRED: 'expired'
});

const userStatus = ref(USER_STATUS.NEW);
const subscriptionUrl = ref('');
const showImportPanel = ref(true);
const showQrCode = ref(false);
const qrCodeUrl = ref('');

const statusCardContentMap = Object.freeze({
  [USER_STATUS.NEW]: {
    title: '欢迎使用，先购买订阅',
    description: '当前尚未购买订阅，请先前往订阅页面购买订阅。'
  },
  [USER_STATUS.ACTIVE]: {
    title: '已成功开通服务',
    description: '立即开始使用您的网络加速服务。'
  },
  [USER_STATUS.EXPIRED]: {
    title: '订阅已到期',
    description: '您的订阅已过期，请及时续费后继续使用服务。'
  }
});

const statusCardContent = computed(() => statusCardContentMap[userStatus.value] || statusCardContentMap[USER_STATUS.NEW]);
const statusCardTitle = computed(() => statusCardContent.value.title);
const statusCardDescription = computed(() => statusCardContent.value.description);

const downloadClient = (platform) => {
  const downloadUrl = clientConfig.clientLinks?.[platform];
  if (downloadUrl) {
    window.open(downloadUrl, '_blank');
  }
};

const openQrCodeModal = async () => {
  if (!subscriptionUrl.value) {
    $toast?.warning('当前暂无订阅链接');
    return;
  }

  try {
    qrCodeUrl.value = await QRCode.toDataURL(subscriptionUrl.value);
    showQrCode.value = true;
  } catch (err) {
    console.error('Generate QRCode failed:', err);
    $toast?.error('二维码生成失败');
  }
};

const copySubscriptionUrl = async () => {
  if (!subscriptionUrl.value) {
    $toast?.warning('当前暂无订阅链接');
    return;
  }

  try {
    await navigator.clipboard.writeText(subscriptionUrl.value);
    $toast?.success('订阅链接已复制');
  } catch (err) {
    console.error('Copy subscription failed:', err);
    $toast?.error('复制失败，请稍后重试');
  }
};

const fetchUserStatus = async () => {
  try {
    const response = await getSubscribe();
    const subscribe = response?.data || {};
    const planId = subscribe?.plan_id || subscribe?.plan?.id || null;
    const expiredAt = Number(subscribe?.expired_at || 0);

    subscriptionUrl.value = subscribe?.subscribe_url || '';

    if (!planId) {
      userStatus.value = USER_STATUS.NEW;
      return;
    }

    if (expiredAt > 0) {
      const now = Math.floor(Date.now() / 1000);
      userStatus.value = expiredAt < now ? USER_STATUS.EXPIRED : USER_STATUS.ACTIVE;
      return;
    }

    userStatus.value = USER_STATUS.ACTIVE;
  } catch (err) {
    console.error('Failed to fetch user status:', err);
    userStatus.value = USER_STATUS.NEW;
  }
};

onMounted(fetchUserStatus);
</script>

<style scoped lang="scss">
@use "@/assets/styles/base/variables.scss" as *;

.quick-start-container {
  padding-bottom: calc(2px + 64px);

  @media (min-width: 768px) {
    padding-bottom: 2px;
  }
}

.hero-card {
  background: linear-gradient(120deg, rgba(var(--theme-color-rgb), 0.08), rgba(111, 116, 245, 0.12));
  border: 1px solid rgba(var(--theme-color-rgb), 0.15);
  border-radius: $border-radius-sm;
  padding: 24px;

  .hero-title-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .hero-title {
    margin: 0;
    font-size: 36px;
    font-weight: 700;
    color: var(--text-color);
  }

  .hero-desc {
    margin: 10px 0 0;
    font-size: 26px;
    color: var(--text-color);
    opacity: 0.86;
  }
}

.step-card {
  margin-top: 18px;
  background: #f8faff;
  border: 1px solid rgba(47, 85, 212, 0.08);
  border-radius: $border-radius-sm;
  padding: 16px;

  .step-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;

    h2 {
      margin: 0;
      font-size: 28px;
    }

    .actions {
      margin-left: auto;
      display: flex;
      gap: 8px;
    }
  }

  .step-index {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #4177e9;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }
}

.step-tip,
.connect-text {
  margin: 0;
  color: var(--secondary-text-color);
  font-size: 18px;
}

.download-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.download-item {
  border: 1px solid var(--border-color);
  border-radius: $border-radius-sm;
  background: #fff;
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;

  &:hover {
    border-color: rgba(var(--theme-color-rgb), 0.5);
  }

  strong {
    font-size: 16px;
  }

  span {
    width: 100%;
    text-align: center;
    background: #3f72e8;
    color: #fff;
    border-radius: 8px;
    padding: 8px 0;
  }

  &.recommended {
    border-color: #4f7df0;

    .badge {
      position: absolute;
      right: 0;
      top: 0;
      background: #4f7df0;
      color: #fff;
      padding: 2px 10px;
      border-top-right-radius: $border-radius-sm;
      border-bottom-left-radius: $border-radius-sm;
      font-size: 12px;
    }
  }
}

.action-btn,
.help-btn {
  border: 1px solid #cdd7f7;
  background: #fff;
  color: #3f72e8;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;

  &.primary {
    background: #3f72e8;
    color: #fff;
  }
}

.help-btn {
  margin-top: 12px;
}

.qrcode-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.55);
}

.qrcode-modal {
  width: min(420px, 92vw);
  border-radius: 14px;
  background: #fff;
  padding: 16px;

  .qrcode-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .close-btn {
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 18px;
  }

  img {
    width: 100%;
    max-width: 260px;
    display: block;
    margin: 0 auto;
  }
}
</style>
