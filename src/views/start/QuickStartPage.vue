<template>
  <div class="quick-start-container page-shell">
    <div class="quick-start-inner page-inner page-stack">
      <section class="status-strip">
        <p class="status-main">{{ statusStripText }}</p>
        <p class="status-sub">{{ statusStripDesc }}</p>
      </section>

      <section class="step-card">
        <header class="step-header">
          <div class="step-index">1</div>
          <h2>下载客户端</h2>
        </header>
        <div class="step-body">
          <p class="step-tip">选择你的设备并下载客户端</p>
          <div class="download-grid">
            <div class="download-item" v-for="platform in quickStartPlatforms" :key="platform.id">
              <component :is="platform.icon" :size="38" />
              <strong>{{ platform.label }}</strong>
              <button class="download-trigger" @click="handleDownloadTrigger(platform.id)">
                {{ getPlatformClients(platform.id).length > 1 ? '选择客户端' : '下载客户端' }}
                <IconChevronDown :size="16" />
              </button>

              <div v-if="activeDropdown === platform.id" class="download-dropdown">
                <button
                  v-for="client in getPlatformClients(platform.id)"
                  :key="`${platform.id}-${client.name}`"
                  class="dropdown-item"
                  @click="openClientDownload(client.url)"
                >
                  <img
                    v-if="resolveClientIcon(client.icon)"
                    :src="resolveClientIcon(client.icon)"
                    :alt="client.name"
                    class="client-icon"
                    :class="{ grayscale: !client.recommended }"
                  />
                  <IconApps v-else :size="18" class="fallback-icon" :class="{ grayscale: !client.recommended }" />
                  <span>{{ client.name }}</span>
                  <small v-if="client.recommended">(推荐)</small>
                </button>
              </div>
            </div>
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
import { computed, inject, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IconBrandApple, IconBrandAndroid, IconBrandFinder, IconBrandWindows, IconChevronDown, IconApps } from '@tabler/icons-vue';
import ImportConfigCard from '@/components/common/ImportConfigCard.vue';
import { CLIENT_CONFIG } from '@/utils/baseConfig';
import { getSubscribe } from '@/api/overview/dashboard';
import QRCode from 'qrcode';
import stashIconImg from '@/assets/images/client-img-ios/stash.png';
import shadowrocketIconImg from '@/assets/images/client-img-ios/shadowrocket.png';
import surgeIOSIconImg from '@/assets/images/client-img-ios/Surge.png';
import singboxAndroidIconImg from '@/assets/images/client-img-android/singbox.png';
import v2rayngIconImg from '@/assets/images/client-img-android/v2rayng.png';
import flclashWindowsIconImg from '@/assets/images/client-img-windows/flclash.png';
import clashMetaAndroidIconImg from '@/assets/images/client-img-android/clashmeta.png';
import clashMetaXIconImg from '@/assets/images/client-img-macos/clashmetax.png';
import clashxIconImg from '@/assets/images/client-img-macos/clashx.png';
import stashMacIconImg from '@/assets/images/client-img-macos/stash.png';

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
const activeDropdown = ref(null);
const closeDropdown = (event) => {
  const target = event?.target;
  if (target?.closest?.('.download-item')) return;
  activeDropdown.value = null;
};

const quickStartPlatforms = computed(() => [
  { id: 'windows', label: 'Windows', icon: IconBrandWindows, visible: clientConfig.showWindows },
  { id: 'macos', label: 'macOS', icon: IconBrandFinder, visible: clientConfig.showMacOS },
  { id: 'android', label: 'Android', icon: IconBrandAndroid, visible: clientConfig.showAndroid },
  { id: 'ios', label: 'iOS', icon: IconBrandApple, visible: clientConfig.showIOS }
].filter((item) => item.visible));

const clientIconMap = Object.freeze({
  'stash-ios': stashIconImg,
  shadowrocket: shadowrocketIconImg,
  'surge-ios': surgeIOSIconImg,
  'singbox-android': singboxAndroidIconImg,
  v2rayng: v2rayngIconImg,
  flclash: flclashWindowsIconImg,
  'clash-meta': clashMetaAndroidIconImg,
  'clashx-meta': clashMetaXIconImg,
  clashx: clashxIconImg,
  'stash-mac': stashMacIconImg
});

const statusStripText = computed(() => {
  if (userStatus.value === USER_STATUS.NEW) return '尚未开通服务 · 请先购买订阅';
  if (userStatus.value === USER_STATUS.EXPIRED) return '订阅已到期 · 请及时续费';
  return '服务已开通 · 可开始连接';
});

const statusStripDesc = computed(() => {
  if (userStatus.value === USER_STATUS.NEW) return '完成订阅后即可下载客户端并导入订阅使用。';
  if (userStatus.value === USER_STATUS.EXPIRED) return '续费后下载客户端并导入订阅即可恢复使用。';
  return '下载客户端并导入订阅后即可使用。';
});

const resolveClientIcon = (iconKey) => clientIconMap[iconKey] || '';
const getPlatformClients = (platform) => {
  const clients = Array.isArray(clientConfig.quickStartClients?.[platform])
    ? [...clientConfig.quickStartClients[platform]]
    : [];

  return clients.sort((a, b) => Number(Boolean(b.recommended)) - Number(Boolean(a.recommended)));
};

const openClientDownload = (url) => {
  if (!url) return;
  window.open(url, '_blank');
  activeDropdown.value = null;
};

const handleDownloadTrigger = (platform) => {
  const clients = getPlatformClients(platform);

  if (!clients.length) {
    const fallback = clientConfig.clientLinks?.[platform];
    if (fallback) window.open(fallback, '_blank');
    return;
  }

  if (clients.length === 1) {
    openClientDownload(clients[0].url);
    return;
  }

  activeDropdown.value = activeDropdown.value === platform ? null : platform;
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
onMounted(() => window.addEventListener('click', closeDropdown));
onBeforeUnmount(() => window.removeEventListener('click', closeDropdown));
</script>

<style scoped lang="scss">
@use "@/assets/styles/base/variables.scss" as *;

.quick-start-container {
  padding-bottom: calc(2px + 64px);

  @media (min-width: 768px) {
    padding-bottom: 2px;
  }
}

.status-strip {
  background: rgba(var(--theme-color-rgb), 0.06);
  border: 1px solid rgba(var(--theme-color-rgb), 0.14);
  border-radius: $border-radius-sm;
  padding: 10px 14px;

  .status-main {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-color);
  }

  .status-sub {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--secondary-text-color);
  }
}

.step-card {
  margin-top: 18px;
  background: #f8faff;
  border: 1px solid rgba(47, 85, 212, 0.08);
  border-radius: $border-radius-sm;
  padding: 14px;

  .step-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    .actions {
      margin-left: auto;
      display: flex;
      gap: 8px;
    }
  }

  .step-index {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #4177e9;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
  }
}

.step-tip,
.connect-text {
  margin: 0;
  color: var(--secondary-text-color);
  font-size: 14px;
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
  position: relative;

  &:hover {
    border-color: rgba(var(--theme-color-rgb), 0.5);
  }

  strong {
    font-size: 15px;
  }

  .download-trigger {
    width: 100%;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    border: none;
    border-radius: 8px;
    padding: 9px 0;
    background: #3f72e8;
    color: #fff;
    font-size: 14px;
    cursor: pointer;
  }
}

.download-dropdown {
  position: absolute;
  left: 12px;
  right: 12px;
  top: calc(100% - 2px);
  z-index: 12;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
  overflow: hidden;
}

.dropdown-item {
  width: 100%;
  border: none;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  color: var(--text-color);
  text-align: left;

  &:hover {
    background: rgba(var(--theme-color-rgb), 0.06);
  }

  small {
    color: rgba(var(--theme-color-rgb), 0.9);
    margin-left: auto;
  }
}

.client-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.fallback-icon,
.client-icon {
  &.grayscale {
    filter: grayscale(1);
    opacity: 0.65;
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
