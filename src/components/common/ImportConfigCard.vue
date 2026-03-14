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
      <div class="section-title">快捷导入</div>
      <div class="import-actions-grid">
        <button class="import-action copy-action" @click="copySubscriptionUrl">
          <div class="import-icon"><IconCopy :size="24" /></div>
          <div class="import-content">
            <div class="import-title">{{ $t('dashboard.copySubscription') }}</div>
            <div class="import-desc">{{ $t('dashboard.copySubscriptionDesc') }}</div>
          </div>
        </button>

        <button class="import-action qrcode-action" @click="showQrCode = true">
          <div class="import-icon"><IconQrcode :size="24" /></div>
          <div class="import-content">
            <div class="import-title">{{ $t('dashboard.scanQRCode') }}</div>
            <div class="import-desc">{{ $t('dashboard.scanQRCodeDesc') }}</div>
          </div>
        </button>

        <button class="import-action reset-action" @click="showResetModal = true">
          <div class="import-icon"><IconRefresh :size="24" /></div>
          <div class="import-content">
            <div class="import-title">{{ $t('profile.resetSecurity') }}</div>
            <div class="import-desc">{{ $t('profile.resetSecurityConfirm') }}</div>
          </div>
        </button>
      </div>

      <div class="section-title">导入步骤</div>
      <div class="import-guide">
        <div class="guide-step"><span class="step-badge">1</span><span>先下载并打开客户端</span></div>
        <div class="guide-step"><span class="step-badge">2</span><span>选择平台后点击下方客户端，一键导入</span></div>
        <div class="guide-step"><span class="step-badge">3</span><span>若唤起失败，可使用复制地址或二维码导入</span></div>
      </div>

      <div class="section-title">选择平台并一键导入</div>
      <div class="platform-selector">
        <button
          v-for="platform in availablePlatforms"
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
        <div class="platform-options" v-if="activePlatformOptions.length">
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
        <div v-else class="no-clients-tip">当前平台暂无可用导入客户端</div>
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
            <button class="modal-btn" @click="showResetModal = false">{{ $t('common.cancel') }}</button>
            <button class="modal-btn danger" :disabled="resetting" @click="resetSecurity">
              {{ resetting ? $t('common.processing') : $t('profile.confirmReset') }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, reactive, watch } from 'vue';
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
import { getSubscribe } from '@/api/overview/dashboard';
import { CLIENT_CONFIG } from '@/utils/baseConfig';
import { resetSecurity as apiResetSecurity } from '@/api/account/user';
import QRCode from 'qrcode';
import shadowrocketIconImg from '@/assets/images/client-img-ios/shadowrocket.png';
import quantumultxIconImg from '@/assets/images/client-img-ios/quantumultx.png';
import stashIconImg from '@/assets/images/client-img-ios/stash.png';
import loonIconImg from '@/assets/images/client-img-ios/loon.png';
import v2rayngIconImg from '@/assets/images/client-img-android/v2rayng.png';
import nekoboxIconImg from '@/assets/images/client-img-android/nekobox.png';
import clashvergeIconImg from '@/assets/images/client-img-windows/clashverge.png';
import nekorayIconImg from '@/assets/images/client-img-windows/nekoray.png';
import clashxIconImg from '@/assets/images/client-img-macos/clashx.png';
import stashMacIconImg from '@/assets/images/client-img-macos/stash.png';
import quantumultXMacIconImg from '@/assets/images/client-img-macos/quantumultx.png';

import surgeIOSIconImg from '@/assets/images/client-img-ios/Surge.png';
import singboxIOSIconImg from '@/assets/images/client-img-ios/singbox.png';
import clashAndroidIconImg from '@/assets/images/client-img-android/clash.png';
import surfboardIconImg from '@/assets/images/client-img-android/surfboard.png';
import clashMetaAndroidIconImg from '@/assets/images/client-img-android/clashmeta.png';
import singboxAndroidIconImg from '@/assets/images/client-img-android/singbox.png';
import hiddifyAndroidIconImg from '@/assets/images/client-img-android/hiddify.png';
import clashWindowsIconImg from '@/assets/images/client-img-windows/clash.png';
import flclashWindowsIconImg from '@/assets/images/client-img-windows/flclash.png';
import singboxWindowsIconImg from '@/assets/images/client-img-windows/singbox.png';
import hiddifyWindowsIconImg from '@/assets/images/client-img-windows/hiddify.png';
import clashMetaXIconImg from '@/assets/images/client-img-macos/clashmetax.png';
import surgeMacIconImg from '@/assets/images/client-img-macos/Surge.png';
import singboxMacIconImg from '@/assets/images/client-img-macos/singbox.png';
import hiddifyMacIconImg from '@/assets/images/client-img-macos/hiddify.png';

const { t } = useI18n();
const $toast = inject('$toast');

const subscriptionUrl = ref('');
const showQrCode = ref(false);
const qrCodeUrl = ref('');
const activePlatform = ref('ios');
const showResetModal = ref(false);
const resetting = ref(false);
const showImportPanel = ref(true);
const clientConfig = reactive(CLIENT_CONFIG);

const platforms = [
  { id: 'ios', label: 'iOS', icon: IconBrandApple, showFlag: 'showIOS' },
  { id: 'android', label: 'Android', icon: IconBrandAndroid, showFlag: 'showAndroid' },
  { id: 'windows', label: 'Windows', icon: IconBrandWindows, showFlag: 'showWindows' },
  { id: 'macos', label: 'MacOS', icon: IconDeviceLaptop, showFlag: 'showMacOS' }
];

const platformClientMap = {
  ios: [
    { key: 'shadowrocket', label: 'Shadowrocket', clientType: 'shadowrocket', icon: shadowrocketIconImg, iconType: 'image', showFlag: 'showShadowrocket' },
    { key: 'surge', label: 'Surge', clientType: 'surge', icon: surgeIOSIconImg, iconType: 'image', showFlag: 'showSurge' },
    { key: 'stash-ios', label: 'Stash', clientType: 'stash', icon: stashIconImg, iconType: 'image', showFlag: 'showStash' },
    { key: 'quantumultx', label: 'Quantumult X', clientType: 'quantumultx', icon: quantumultxIconImg, iconType: 'image', showFlag: 'showQuantumultX' },
    { key: 'hiddify-ios', label: 'Hiddify', clientType: 'hiddify-ios', icon: hiddifyMacIconImg, iconType: 'image', showFlag: 'showHiddifyIOS' },
    { key: 'singbox-ios', label: 'Singbox', clientType: 'singbox-ios', icon: singboxIOSIconImg, iconType: 'image', showFlag: 'showSingboxIOS' },
    { key: 'loon', label: 'Loon', clientType: 'loon', icon: loonIconImg, iconType: 'image', showFlag: 'showLoon' }
  ],
  android: [
    { key: 'flclash-android', label: 'FlClash', clientType: 'flclash', icon: flclashWindowsIconImg, iconType: 'image', showFlag: 'showFlClashAndroid' },
    { key: 'v2rayng', label: 'V2rayNG', clientType: 'v2rayng', icon: v2rayngIconImg, iconType: 'image', showFlag: 'showV2rayNG' },
    { key: 'clash-android', label: 'Clash', clientType: 'clash-android', icon: clashAndroidIconImg, iconType: 'image', showFlag: 'showClashAndroid' },
    { key: 'surfboard', label: 'Surfboard', clientType: 'surfboard', icon: surfboardIconImg, iconType: 'image', showFlag: 'showSurfboard' },
    { key: 'clash-meta-android', label: 'Clash Meta', clientType: 'clash-meta-android', icon: clashMetaAndroidIconImg, iconType: 'image', showFlag: 'showClashMetaAndroid' },
    { key: 'nekobox', label: 'NekoBox', clientType: 'nekobox', icon: nekoboxIconImg, iconType: 'image', showFlag: 'showNekobox' },
    { key: 'singbox-android', label: 'Singbox', clientType: 'singbox-android', icon: singboxAndroidIconImg, iconType: 'image', showFlag: 'showSingboxAndroid' },
    { key: 'hiddify-android', label: 'Hiddify', clientType: 'hiddify-android', icon: hiddifyAndroidIconImg, iconType: 'image', showFlag: 'showHiddifyAndroid' }
  ],
  windows: [
    { key: 'flclash-windows', label: 'FlClash', clientType: 'flclash', icon: flclashWindowsIconImg, iconType: 'image', showFlag: 'showFlClashWindows' },
    { key: 'clashverge', label: 'Clash Verge', clientType: 'clashverge', icon: clashvergeIconImg, iconType: 'image', showFlag: 'showClashVergeWindows' },
    { key: 'clash-windows', label: 'Clash', clientType: 'clash', icon: clashWindowsIconImg, iconType: 'image', showFlag: 'showClashWindows' },
    { key: 'nekoray', label: 'Nekoray', clientType: 'nekoray', icon: nekorayIconImg, iconType: 'image', showFlag: 'showNekoray' },
    { key: 'singbox-windows', label: 'Singbox', clientType: 'singbox-windows', icon: singboxWindowsIconImg, iconType: 'image', showFlag: 'showSingboxWindows' },
    { key: 'hiddify-windows', label: 'Hiddify', clientType: 'hiddify-windows', icon: hiddifyWindowsIconImg, iconType: 'image', showFlag: 'showHiddifyWindows' }
  ],
  macos: [
    { key: 'flclash-mac', label: 'FlClash', clientType: 'flclash', icon: flclashWindowsIconImg, iconType: 'image', showFlag: 'showFlClashMac' },
    { key: 'clashverge-mac', label: 'Clash Verge', clientType: 'clashverge', icon: clashvergeIconImg, iconType: 'image', showFlag: 'showClashVergeMac' },
    { key: 'clashx', label: 'ClashX', clientType: 'clashx', icon: clashxIconImg, iconType: 'image', showFlag: 'showClashX' },
    { key: 'clashx-meta', label: 'ClashX Meta', clientType: 'clashx-meta', icon: clashMetaXIconImg, iconType: 'image', showFlag: 'showClashMetaX' },
    { key: 'surge-mac', label: 'Surge', clientType: 'surge-mac', icon: surgeMacIconImg, iconType: 'image', showFlag: 'showSurgeMac' },
    { key: 'stash-mac', label: 'Stash', clientType: 'stash-mac', icon: stashMacIconImg, iconType: 'image', showFlag: 'showStashMac' },
    { key: 'quantumultx-mac', label: 'Quantumult X', clientType: 'quantumultx-mac', icon: quantumultXMacIconImg, iconType: 'image', showFlag: 'showQuantumultXMac' },
    { key: 'singbox-macos', label: 'Singbox', clientType: 'singbox-macos', icon: singboxMacIconImg, iconType: 'image', showFlag: 'showSingboxMac' },
    { key: 'hiddify-macos', label: 'Hiddify', clientType: 'hiddify-macos', icon: hiddifyMacIconImg, iconType: 'image', showFlag: 'showHiddifyMac' }
  ]
};

const availablePlatforms = computed(() => {
  return platforms.filter((platform) => clientConfig[platform.showFlag]);
});

const activePlatformLabel = computed(() => availablePlatforms.value.find((item) => item.id === activePlatform.value)?.label || availablePlatforms.value[0]?.label || 'iOS');
const activePlatformOptions = computed(() => {
  const options = platformClientMap[activePlatform.value] || [];
  return options.filter((option) => clientConfig[option.showFlag]);
});

watch(availablePlatforms, (next) => {
  if (!next.length) return;
  if (!next.some((item) => item.id === activePlatform.value)) {
    activePlatform.value = next[0].id;
  }
}, { immediate: true });

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
  const siteName = '订阅';
  let url = subscribeUrl;

  switch (clientType) {
    case 'shadowrocket':
      url = `shadowrocket://add/sub://${window.btoa(subscribeUrl).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}?remark=${encodeURIComponent(siteName)}`;
      break;
    case 'surge':
    case 'surge-mac':
      url = `surge:///install-config?url=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
      break;
    case 'stash':
    case 'stash-mac':
      url = `stash://install-config?url=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
      break;
    case 'quantumultx':
    case 'quantumultx-mac':
      url = `quantumult-x:///update-configuration?remote-resource=${encodeURI(JSON.stringify({ server_remote: [`${subscribeUrl}, tag=${encodeURIComponent(siteName)}`] }))}`;
      break;
    case 'loon':
      url = `loon://import?nodelist=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
      break;
    case 'v2rayng':
      url = `v2rayng://install-sub?url=${encodeURIComponent(subscribeUrl)}#${encodeURIComponent(siteName)}`;
      break;
    case 'clash':
    case 'clash-android':
    case 'clash-meta-android':
    case 'flclash':
    case 'clashverge':
    case 'nekobox':
    case 'nekoray':
    case 'clashx':
    case 'clashx-meta':
      url = `clash://install-config?url=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
      break;
    case 'surfboard':
      url = `surfboard:///install-config?url=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
      break;
    case 'singbox-ios':
    case 'singbox-android':
    case 'singbox-windows':
    case 'singbox-macos':
      url = `sing-box://import-remote-profile?url=${encodeURIComponent(subscribeUrl)}#${encodeURIComponent(siteName)}`;
      break;
    case 'hiddify-android':
    case 'hiddify-windows':
    case 'hiddify-macos':
    case 'hiddify-ios':
      url = `hiddify://import/${subscribeUrl}#${encodeURIComponent(siteName)}`;
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
    display: grid;
    gap: 14px;
  }

  .section-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--theme-text-secondary);
    margin-top: 2px;
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


  .import-actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
  }

  .import-action {
    border: 1px solid rgba(var(--theme-color-rgb), 0.12);
    background: #fff;
    width: 100%;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 16px;
    border: 1px solid rgba(var(--theme-color-rgb), 0.12);
    border-radius: 14px;
    padding: 16px;
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
    margin-top: 0;
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

    .no-clients-tip {
      padding: 12px;
      border: 1px dashed var(--border-color);
      border-radius: 10px;
      color: var(--theme-text-secondary);
      font-size: 13px;
      text-align: center;
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

.modal-btn {
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
