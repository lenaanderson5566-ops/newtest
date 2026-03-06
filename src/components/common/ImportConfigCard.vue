<template>
  <div class="dashboard-card import-config-card" v-if="subscriptionUrl">
    <div class="card-header">
      <div class="quick-actions">
        <button class="quick-btn" :class="{ active: showImportPanel }" @click="showImportPanel = !showImportPanel">
          {{ $t('dashboard.importSubscription') }}
          <IconChevronDown v-if="!showImportPanel" :size="14" />
          <IconChevronUp v-else :size="14" />
        </button>
      </div>
    </div>

    <div class="card-body" v-if="showImportPanel">
      <div class="import-action copy-action" @click="copySubscriptionUrl">
        <div class="import-icon"><IconCopy :size="24" /></div>
        <div class="import-content">
          <div class="import-title">{{ $t('dashboard.copySubscription') }}</div>
          <div class="import-desc">{{ $t('dashboard.copySubscriptionDesc') }}</div>
        </div>
      </div>

      <div class="import-action qrcode-action" @click="showQrCode = true">
        <div class="import-icon"><IconQrcode :size="24" /></div>
        <div class="import-content">
          <div class="import-title">{{ $t('dashboard.scanQRCode') }}</div>
          <div class="import-desc">{{ $t('dashboard.scanQRCodeDesc') }}</div>
        </div>
      </div>

      <div class="import-action reset-action" @click="showResetModal = true">
        <div class="import-icon"><IconRefresh :size="24" /></div>
        <div class="import-content">
          <div class="import-title">{{ $t('profile.resetSecurity') }}</div>
          <div class="import-desc">{{ $t('profile.resetSecurityConfirm') }}</div>
        </div>
      </div>


      <div class="import-guide">
        <div class="guide-step"><span class="step-badge">1</span><span>先下载并打开客户端</span></div>
        <div class="guide-step"><span class="step-badge">2</span><span>选择平台后点击下方客户端，一键导入</span></div>
        <div class="guide-step"><span class="step-badge">3</span><span>若唤起失败，可使用复制地址或二维码导入</span></div>
      </div>

      <div class="platform-selector">
        <button
          v-for="platform in platforms"
          :key="platform.id"
          class="platform-button"
          :class="{ active: activePlatform === platform.id }"
          @click="activePlatform = platform.id"
        >
          <component :is="platform.icon" :size="16" />
          <span>{{ platform.label }}</span>
        </button>
      </div>

      <div class="platform-section">
        <div class="platform-title">{{ activePlatformLabel }}</div>
        <div class="platform-options">
          <button
            v-for="option in activePlatformOptions"
            :key="option.key"
            class="platform-option"
            @click="openClientLink(option.clientType)">
            <img
              v-if="option.iconType === 'image'"
              :src="option.icon"
              :alt="option.label"
              class="platform-option-image"
            />
            <component v-else :is="option.icon" :size="16" class="platform-option-icon" />
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="showQrCode" class="qrcode-modal-overlay" @click="showQrCode = false">
        <div class="qrcode-modal" @click.stop>
          <div class="qrcode-header">
            <h3>{{ $t('dashboard.scanQRCode') }}</h3>
            <button class="close-btn" @click="showQrCode = false"><IconX :size="20" /></button>
          </div>
          <div class="qrcode-content">
            <img :src="qrCodeUrl" alt="QR Code" />
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showResetModal" class="qrcode-modal-overlay" @click="showResetModal = false">
        <div class="qrcode-modal reset-modal" @click.stop>
          <div class="qrcode-header">
            <h3>{{ $t('profile.resetSecurityTitle') }}</h3>
            <button class="close-btn" @click="showResetModal = false"><IconX :size="20" /></button>
          </div>
          <p class="reset-modal-text">{{ $t('profile.resetSecurityConfirm') }}</p>
          <div class="reset-modal-actions">
            <button class="quick-btn" @click="showResetModal = false">{{ $t('common.cancel') }}</button>
            <button class="quick-btn danger" :disabled="resetting" @click="resetSecurity">
              {{ resetting ? $t('common.processing') : $t('profile.confirmReset') }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  IconCopy,
  IconQrcode,
  IconX,
  IconRefresh,
  IconBrandApple,
  IconBrandAndroid,
  IconBrandWindows,
  IconDeviceLaptop,
  IconChevronDown,
  IconChevronUp
} from '@tabler/icons-vue';
import { getSubscribe } from '@/api/dashboard';
import { resetSecurity as apiResetSecurity } from '@/api/user';
import QRCode from 'qrcode';
import shadowrocketIconImg from '@/assets/images/client-img-ios/shadowrocket.png';
import quantumultxIconImg from '@/assets/images/client-img-ios/quantumultx.png';
import stashIconImg from '@/assets/images/client-img-ios/stash.png';
import v2rayngIconImg from '@/assets/images/client-img-android/v2rayng.png';
import nekoboxIconImg from '@/assets/images/client-img-android/nekobox.png';
import clashvergeIconImg from '@/assets/images/client-img-windows/clashverge.png';
import nekorayIconImg from '@/assets/images/client-img-windows/nekoray.png';
import clashxIconImg from '@/assets/images/client-img-macos/clashx.png';
import stashMacIconImg from '@/assets/images/client-img-macos/stash.png';
import quantumultXMacIconImg from '@/assets/images/client-img-macos/quantumultx.png';

const { t } = useI18n();
const $toast = inject('$toast');

const subscriptionUrl = ref('');
const showQrCode = ref(false);
const qrCodeUrl = ref('');
const activePlatform = ref('ios');
const showResetModal = ref(false);
const resetting = ref(false);
const showImportPanel = ref(true);

const platforms = [
  { id: 'ios', label: 'iOS', icon: IconBrandApple },
  { id: 'android', label: 'Android', icon: IconBrandAndroid },
  { id: 'windows', label: 'Windows', icon: IconBrandWindows },
  { id: 'macos', label: 'MacOS', icon: IconDeviceLaptop }
];

const platformClientMap = {
  ios: [
    { key: 'shadowrocket', label: 'Shadowrocket', clientType: 'shadowrocket', icon: shadowrocketIconImg, iconType: 'image' },
    { key: 'stash-ios', label: 'Stash', clientType: 'stash', icon: stashIconImg, iconType: 'image' },
    { key: 'quantumultx', label: 'Quantumult X', clientType: 'quantumultx', icon: quantumultxIconImg, iconType: 'image' }
  ],
  android: [
    { key: 'v2rayng', label: 'V2rayNG', clientType: 'v2rayng', icon: v2rayngIconImg, iconType: 'image' },
    { key: 'nekobox', label: 'NekoBox', clientType: 'nekobox', icon: nekoboxIconImg, iconType: 'image' },
    { key: 'android-universal', label: 'Universal', clientType: 'universal', icon: IconQrcode, iconType: 'component' }
  ],
  windows: [
    { key: 'clashverge', label: 'Clash Verge', clientType: 'clashverge', icon: clashvergeIconImg, iconType: 'image' },
    { key: 'nekoray', label: 'Nekoray', clientType: 'nekoray', icon: nekorayIconImg, iconType: 'image' },
    { key: 'windows-universal', label: 'Universal', clientType: 'universal', icon: IconQrcode, iconType: 'component' }
  ],
  macos: [
    { key: 'clashverge-mac', label: 'Clash Verge', clientType: 'clashverge', icon: clashvergeIconImg, iconType: 'image' },
    { key: 'clashx', label: 'ClashX', clientType: 'clashx', icon: clashxIconImg, iconType: 'image' },
    { key: 'stash-mac', label: 'Stash', clientType: 'stash-mac', icon: stashMacIconImg, iconType: 'image' },
    { key: 'quantumultx-mac', label: 'Quantumult X', clientType: 'quantumultx', icon: quantumultXMacIconImg, iconType: 'image' }
  ]
};

const activePlatformLabel = computed(() => platforms.find((item) => item.id === activePlatform.value)?.label || 'iOS');
const activePlatformOptions = computed(() => platformClientMap[activePlatform.value] || platformClientMap.ios);

const preCopySubscriptionUrl = async () => {
  if (!subscriptionUrl.value) return false;
  try {
    await navigator.clipboard.writeText(subscriptionUrl.value);
    return true;
  } catch (err) {
    console.warn('Failed to copy subscription url:', err);
    return false;
  }
};

const resolveSubscribeUrl = (payload) => {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;
  if (typeof payload === 'object') {
    return payload.subscribe_url || payload.url || payload.subscribeUrl || '';
  }
  return '';
};

const fetchSubscription = async () => {
  try {
    const result = await getSubscribe();
    if (result?.data) {
      subscriptionUrl.value = resolveSubscribeUrl(result.data);
      updateQRCode();
    }
  } catch (err) {
    console.error('Failed to fetch subscription info:', err);
  }
};

const copySubscriptionUrl = async () => {
  if (!subscriptionUrl.value) return;
  try {
    const copied = await preCopySubscriptionUrl();
    if ($toast && copied) $toast.success(t('dashboard.subscriptionCopied'));
  } catch (err) {
    if ($toast) $toast.error(t('dashboard.copyFailed'));
  }
};

const updateQRCode = async () => {
  if (!subscriptionUrl.value) return;
  try {
    qrCodeUrl.value = await QRCode.toDataURL(subscriptionUrl.value, { width: 220, margin: 1 });
  } catch (err) {
    console.error('Failed to generate QR code:', err);
  }
};

const openClientLink = async (clientType) => {
  if (!subscriptionUrl.value) return;
  const subscribeUrl = subscriptionUrl.value;
  let url = subscribeUrl;

  switch (clientType) {
    case 'shadowrocket':
      url = `shadowrocket://add/sub://${window.btoa(subscribeUrl).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
      break;
    case 'v2rayng':
      url = `v2rayng://install-sub?url=${encodeURIComponent(subscribeUrl)}`;
      break;
    case 'clashx':
    case 'clashverge':
      url = `clash://install-config?url=${encodeURIComponent(subscribeUrl)}`;
      break;
    case 'quantumultx':
      url = `quantumult-x:///update-configuration?remote-resource=${encodeURIComponent(subscribeUrl)}`;
      break;
    case 'nekobox':
    case 'nekoray':
      url = `nekobox://addProfile?url=${encodeURIComponent(subscribeUrl)}`;
      break;
    case 'stash':
    case 'stash-mac':
      url = `stash://install-config?url=${encodeURIComponent(subscribeUrl)}`;
      break;
    default:
      url = subscribeUrl;
  }

  const copied = await preCopySubscriptionUrl();

  window.open(url, '_blank');
  if ($toast) {
    $toast.success(copied ? '已尝试唤起客户端，订阅地址已复制到剪贴板' : t('dashboard.manualImportRequired'));
  }
};


const resetSecurity = async () => {
  resetting.value = true;
  try {
    const response = await apiResetSecurity();
    const latestSubscribeUrl = resolveSubscribeUrl(response?.data);
    if (latestSubscribeUrl) {
      subscriptionUrl.value = latestSubscribeUrl;
      updateQRCode();
      showResetModal.value = false;
      if ($toast) $toast.success(t('profile.resetSuccess'));
      return;
    }

    if ($toast) $toast.error(t('profile.resetError'));
  } catch (err) {
    console.error('Failed to reset security:', err);
    if ($toast) $toast.error(t('profile.resetError'));
  } finally {
    resetting.value = false;
  }
};

onMounted(() => {
  fetchSubscription();
});
</script>

<style lang="scss" scoped>
.import-config-card {
  margin-top: 24px;

  .card-body {
    p {
      margin: 0;
    }
  }

  .quick-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .quick-btn {
    border: 1px solid var(--border-color);
    background: #fff;
    color: #1f2937;
    border-radius: 12px;
    padding: 10px 18px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;

    &.active {
      border-color: rgba(var(--theme-color-rgb), 0.65);
      color: rgba(var(--theme-color-rgb), 0.95);
      background: rgba(var(--theme-color-rgb), 0.08);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }


  .import-action {
    display: flex;
    align-items: center;
    gap: 16px;
    border: 1px solid rgba(var(--theme-color-rgb), 0.12);
    border-radius: 14px;
    padding: 16px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: rgba(var(--theme-color-rgb), 0.45);
      background: rgba(var(--theme-color-rgb), 0.05);
    }
  }

  .import-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: rgba(var(--theme-color-rgb), 0.14);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: rgba(var(--theme-color-rgb), 0.95);
    flex-shrink: 0;
  }

  .import-title {
    font-size: 16px;
    line-height: 1.35;
    font-weight: 700;
  }

  .import-desc {
    margin-top: 6px;
    color: var(--theme-text-secondary);
    font-size: 13px;
    line-height: 1.4;
  }

  .import-guide {
    display: grid;
    gap: 8px;
    margin-top: 4px;
    margin-bottom: 12px;

    .guide-step {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--theme-text-secondary);
    }

    .step-badge {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #fff;
      background: rgba(var(--theme-color-rgb), 0.9);
      flex-shrink: 0;
    }
  }

  .platform-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 16px;
  }

  .platform-button {
    border: 1px solid var(--border-color);
    background: #fff;
    border-radius: 999px;
    padding: 10px 18px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;

    &.active {
      border-color: rgba(var(--theme-color-rgb), 0.75);
      color: rgba(var(--theme-color-rgb), 0.95);
      background: rgba(var(--theme-color-rgb), 0.08);
    }
  }

  .platform-section {
    margin-top: 14px;

    .platform-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .platform-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }

    .platform-option {
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 12px 14px;
      background: #fff;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;

      &:hover {
        border-color: rgba(var(--theme-color-rgb), 0.45);
      }
    }

    .platform-option-image {
      width: 24px;
      height: 24px;
      object-fit: contain;
      border-radius: 6px;
    }

    .platform-option-icon {
      color: rgba(var(--theme-color-rgb), 0.95);
    }
  }
}

.qrcode-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1300;
}

.qrcode-modal {
  width: min(92vw, 420px);
  border-radius: 14px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.2);
}

.qrcode-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    margin: 0;
    font-size: 16px;
  }
}

.qrcode-content {
  padding: 20px;
  display: flex;
  justify-content: center;

  img {
    width: 220px;
    height: 220px;
  }
}

.close-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--theme-text-secondary);
}

.reset-modal {
  padding-bottom: 16px;
}

.reset-modal-text {
  padding: 16px;
  color: var(--theme-text-secondary);
}

.reset-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 16px;
}

.quick-btn {
  border: 1px solid var(--border-color);
  background: #fff;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;

  &.danger {
    color: #fff;
    background: rgba(var(--theme-color-rgb), 0.92);
    border-color: rgba(var(--theme-color-rgb), 0.92);
  }
}

@media (max-width: 768px) {
  .import-config-card {
    .import-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
    }

    .import-title {
      font-size: 16px;
    }

    .import-desc {
      font-size: 13px;
    }
  }
}
</style>
