<template>
  <div class="quick-start-container page-shell">
    <div class="quick-start-inner page-inner page-stack">
      <section class="status-strip" :class="`is-${statusStripVariant}`">
        <div class="status-main-row">
          <component :is="statusStripIcon" :size="18" class="status-icon" />
          <p class="status-main">{{ statusStripText }}</p>
        </div>
      </section>

      <section class="step-card">
        <header class="step-header">
          <div class="step-index">1</div>
          <h2>{{ $t('quickStartPage.step1Title') }}</h2>
        </header>
        <div class="step-body">
          <p class="step-tip">{{ $t('quickStartPage.step1Tip') }}</p>
          <div class="system-grid">
            <button
              v-for="platform in quickStartPlatforms"
              :key="platform.id"
              class="system-item"
              :class="{ active: selectedPlatform === platform.id }"
              @click="selectedPlatform = platform.id"
            >
              <component :is="platform.icon" :size="36" />
              <strong>{{ platform.label }}</strong>
              <IconCheck v-if="selectedPlatform === platform.id" :size="16" class="selected-mark" />
            </button>
          </div>
        </div>
      </section>

      <section class="step-card">
        <header class="step-header">
          <div class="step-index">2</div>
          <h2>{{ $t('quickStartPage.step2Title') }}</h2>
        </header>
        <div class="step-body">
          <p class="step-tip">{{ $t('quickStartPage.step2Tip') }}</p>
          <div class="client-grid" v-if="selectedPlatformClients.length">
            <button
              v-for="client in selectedPlatformClients"
              :key="`${selectedPlatform}-${client.name}`"
              class="client-item"
              :class="{ active: selectedClient?.name === client.name }"
              @click="selectedClientName = client.name"
            >
              <img
                v-if="resolveClientIcon(client.icon)"
                :src="resolveClientIcon(client.icon)"
                :alt="client.name"
                class="client-icon-large"
                :class="{ grayscale: selectedClient?.name !== client.name }"
              />
              <IconApps v-else :size="20" class="fallback-icon-large" :class="{ grayscale: selectedClient?.name !== client.name }" />
              <div class="client-text">
                <span class="client-name">{{ client.name }}</span>
                <small v-if="client.recommended" class="recommend-inline">{{ $t('quickStartPage.recommended') }}</small>
              </div>
              <IconCheck v-if="selectedClient?.name === client.name" :size="16" class="client-selected-mark" />
            </button>
          </div>

          <div class="action-row" v-if="subscriptionUrl">
            <button class="action-btn primary" @click="downloadSelectedClient">
              <IconDownload :size="16" />
              <span>{{ downloadButtonText }}</span>
            </button>
            <button class="action-btn" @click="quickImportSelectedClient">
              <IconBolt :size="16" />
              <span>{{ $t('quickStartPage.quickImport') }}</span>
            </button>
            <button class="action-btn" @click="copySubscriptionUrl">
              <IconCopy :size="16" />
              <span>{{ $t('quickStartPage.copySubscription') }}</span>
            </button>
            <button
              v-if="selectedPlatform === 'ios' || selectedPlatform === 'android'"
              class="action-btn"
              @click="openQrCodeModal"
            >
              <IconQrcode :size="16" />
              <span>{{ $t('quickStartPage.qrImport') }}</span>
            </button>
          </div>

        </div>
      </section>

      <section class="step-card">
        <header class="step-header">
          <div class="step-index">3</div>
          <h2>{{ $t('quickStartPage.step3Title') }}</h2>
        </header>
        <div class="step-body">
          <p class="connect-text">{{ $t('quickStartPage.connectHint') }}</p>
          <button class="help-btn" @click="router.push('/docs')">
            <IconBook :size="16" />
            <span>{{ $t('quickStartPage.helpCta') }}</span>
          </button>
        </div>
      </section>

      <Teleport to="body">
        <div v-if="showQrCode" class="qrcode-modal-overlay" @click="showQrCode = false">
          <div class="qrcode-modal" @click.stop>
            <div class="qrcode-header">
              <h3>{{ $t('quickStartPage.qrModalTitle') }}</h3>
              <button class="close-btn" @click="showQrCode = false" :aria-label="$t('common.close')">
                <IconX :size="18" />
              </button>
            </div>
            <img :src="qrCodeUrl" alt="QR Code" />
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  IconBrandApple,
  IconBrandAndroid,
  IconBrandFinder,
  IconBrandWindows,
  IconApps,
  IconAlertTriangle,
  IconCheck,
  IconDownload,
  IconBolt,
  IconCopy,
  IconQrcode,
  IconBook,
  IconX
} from '@tabler/icons-vue';
import { CLIENT_CONFIG } from '@/utils/baseConfig';
import { getSubscribe } from '@/api/overview/dashboard';
import { useToast } from '@/composables/useToast';
import { SUBSCRIPTION_STATUS, resolveSubscriptionStatus } from '@/utils/subscriptionStatus';
import QRCode from 'qrcode';
import stashIconImg from '@/assets/images/client-img-ios/stash.png';
import shadowrocketIconImg from '@/assets/images/client-img-ios/shadowrocket.png';
import surgeIOSIconImg from '@/assets/images/client-img-ios/Surge.png';
import singboxAndroidIconImg from '@/assets/images/client-img-android/singbox.png';
import v2rayngIconImg from '@/assets/images/client-img-android/v2rayng.png';
import flclashWindowsIconImg from '@/assets/images/client-img-windows/flclash.png';
import clashVergeIconImg from '@/assets/images/client-img-windows/clashverge.png';
import singboxWindowsIconImg from '@/assets/images/client-img-windows/singbox.png';
import clashMetaAndroidIconImg from '@/assets/images/client-img-android/clashmeta.png';
import clashMetaXIconImg from '@/assets/images/client-img-macos/clashmetax.png';
import clashxIconImg from '@/assets/images/client-img-macos/clashx.png';
import stashMacIconImg from '@/assets/images/client-img-macos/stash.png';
import loonIconImg from '@/assets/images/client-img-ios/loon.png';

const router = useRouter();
const { t } = useI18n();
const $toast = inject('$toast');
const { showToast } = useToast();
const clientConfig = reactive(CLIENT_CONFIG);
const toast = {
  success: (message) => ($toast?.success ? $toast.success(message) : showToast.success(message)),
  warning: (message) => ($toast?.warning ? $toast.warning(message) : showToast.warning(message)),
  error: (message) => ($toast?.error ? $toast.error(message) : showToast.error(message))
};

const userStatus = ref(SUBSCRIPTION_STATUS.NEW);
const subscriptionUrl = ref('');
const showQrCode = ref(false);
const qrCodeUrl = ref('');
const selectedPlatform = ref('windows');
const selectedClientName = ref('');

const quickStartPlatforms = computed(() => [
  { id: 'windows', label: t('quickStartPage.platform.windows'), icon: IconBrandWindows, visible: clientConfig.showWindows },
  { id: 'macos', label: t('quickStartPage.platform.macos'), icon: IconBrandFinder, visible: clientConfig.showMacOS },
  { id: 'android', label: t('quickStartPage.platform.android'), icon: IconBrandAndroid, visible: clientConfig.showAndroid },
  { id: 'ios', label: t('quickStartPage.platform.ios'), icon: IconBrandApple, visible: clientConfig.showIOS }
].filter((item) => item.visible));

const clientIconMap = Object.freeze({
  'stash-ios': stashIconImg,
  shadowrocket: shadowrocketIconImg,
  'surge-ios': surgeIOSIconImg,
  'singbox-android': singboxAndroidIconImg,
  'singbox-windows': singboxWindowsIconImg,
  v2rayng: v2rayngIconImg,
  flclash: flclashWindowsIconImg,
  clashverge: clashVergeIconImg,
  'clash-meta': clashMetaAndroidIconImg,
  'clash-meta-android': clashMetaAndroidIconImg,
  'clashx-meta': clashMetaXIconImg,
  clashx: clashxIconImg,
  'stash-mac': stashMacIconImg,
  loon: loonIconImg
});

const statusStripText = computed(() => {
  if (userStatus.value === SUBSCRIPTION_STATUS.NEW) return t('quickStartPage.status.newTitle');
  if (userStatus.value === SUBSCRIPTION_STATUS.EXPIRED || userStatus.value === SUBSCRIPTION_STATUS.BANNED) return t('quickStartPage.status.expiredTitle');
  return t('quickStartPage.status.activeTitle');
});

const statusStripVariant = computed(() => {
  if (userStatus.value === SUBSCRIPTION_STATUS.NEW) return 'new';
  if (userStatus.value === SUBSCRIPTION_STATUS.EXPIRED || userStatus.value === SUBSCRIPTION_STATUS.BANNED) return 'expired';
  return 'active';
});

const statusStripIcon = computed(() => {
  if (statusStripVariant.value === 'new') return IconAlertTriangle;
  if (statusStripVariant.value === 'expired') return IconX;
  return IconCheck;
});

const resolveClientIcon = (iconKey) => clientIconMap[iconKey] || '';
const getPlatformClients = (platform) => {
  const clients = Array.isArray(clientConfig.quickStartClients?.[platform])
    ? [...clientConfig.quickStartClients[platform]]
    : [];

  return clients.sort((a, b) => Number(Boolean(b.recommended)) - Number(Boolean(a.recommended)));
};

const selectedPlatformClients = computed(() => getPlatformClients(selectedPlatform.value));
const selectedClient = computed(() => selectedPlatformClients.value.find((item) => item.name === selectedClientName.value) || null);
const downloadButtonText = computed(() => t('quickStartPage.downloadClient', { name: selectedClient.value?.name || t('quickStartPage.clientFallbackName') }));

watch(quickStartPlatforms, (next) => {
  if (!next.length) return;
  if (!next.some((item) => item.id === selectedPlatform.value)) {
    selectedPlatform.value = next[0].id;
  }
}, { immediate: true });

watch(selectedPlatformClients, (clients) => {
  if (!clients.length) {
    selectedClientName.value = '';
    return;
  }

  if (clients.some((item) => item.name === selectedClientName.value)) return;
  selectedClientName.value = clients.find((item) => item.recommended)?.name || clients[0].name;
}, { immediate: true });

const downloadSelectedClient = () => {
  const target = selectedClient.value || selectedPlatformClients.value[0];
  if (target?.url) {
    window.open(target.url, '_blank');
    return;
  }

  const fallback = clientConfig.clientLinks?.[selectedPlatform.value];
  if (fallback) window.open(fallback, '_blank');
};

const normalizeBase64 = (content) => window.btoa(content).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const resolveClientType = (client) => {
  if (!client) return '';
  const iconKey = (client.icon || '').toLowerCase();
  const name = (client.name || '').toLowerCase();

  if (iconKey.includes('shadowrocket') || name.includes('shadowrocket')) return 'shadowrocket';
  if (iconKey.includes('surge') || name.includes('surge')) return selectedPlatform.value === 'macos' ? 'surge-mac' : 'surge';
  if (iconKey.includes('stash') || name.includes('stash')) return selectedPlatform.value === 'macos' ? 'stash-mac' : 'stash';
  if (iconKey.includes('quantumult') || name.includes('quantumult')) return selectedPlatform.value === 'macos' ? 'quantumultx-mac' : 'quantumultx';
  if (iconKey.includes('loon') || name.includes('loon')) return 'loon';
  if (iconKey.includes('v2rayng') || name.includes('v2ray')) return 'v2rayng';
  if (iconKey.includes('surfboard') || name.includes('surfboard')) return 'surfboard';
  if (iconKey.includes('singbox') || name.includes('sing-box') || name.includes('singbox')) {
    if (selectedPlatform.value === 'ios') return 'singbox-ios';
    if (selectedPlatform.value === 'android') return 'singbox-android';
    if (selectedPlatform.value === 'windows') return 'singbox-windows';
    if (selectedPlatform.value === 'macos') return 'singbox-macos';
  }
  if (iconKey.includes('hiddify') || name.includes('hiddify')) {
    if (selectedPlatform.value === 'ios') return 'hiddify-ios';
    if (selectedPlatform.value === 'android') return 'hiddify-android';
    if (selectedPlatform.value === 'windows') return 'hiddify-windows';
    if (selectedPlatform.value === 'macos') return 'hiddify-macos';
  }

  if (
    iconKey.includes('clash') ||
    iconKey.includes('flclash') ||
    iconKey.includes('clashx') ||
    name.includes('clash') ||
    name.includes('nekobox') ||
    name.includes('nekoray')
  ) {
    return 'clash';
  }
  return '';
};

const buildClientSchemeUrl = (clientType, subscribeUrl) => {
  const siteName = t('quickStartPage.subscriptionTag');
  switch (clientType) {
    case 'shadowrocket':
      return `shadowrocket://add/sub://${normalizeBase64(subscribeUrl)}?remark=${encodeURIComponent(siteName)}`;
    case 'surge':
    case 'surge-mac':
      return `surge:///install-config?url=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
    case 'stash':
    case 'stash-mac':
      return `stash://install-config?url=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
    case 'quantumultx':
    case 'quantumultx-mac':
      return `quantumult-x:///update-configuration?remote-resource=${encodeURI(JSON.stringify({ server_remote: [`${subscribeUrl}, tag=${encodeURIComponent(siteName)}`] }))}`;
    case 'loon':
      return `loon://import?nodelist=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
    case 'v2rayng':
      return `v2rayng://install-sub?url=${encodeURIComponent(subscribeUrl)}#${encodeURIComponent(siteName)}`;
    case 'clash':
      return `clash://install-config?url=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
    case 'surfboard':
      return `surfboard:///install-config?url=${encodeURIComponent(subscribeUrl)}&name=${encodeURIComponent(siteName)}`;
    case 'singbox-ios':
    case 'singbox-android':
    case 'singbox-windows':
    case 'singbox-macos':
      return `sing-box://import-remote-profile?url=${encodeURIComponent(subscribeUrl)}#${encodeURIComponent(siteName)}`;
    case 'hiddify-android':
    case 'hiddify-windows':
    case 'hiddify-macos':
    case 'hiddify-ios':
      return `hiddify://import/${subscribeUrl}#${encodeURIComponent(siteName)}`;
    default:
      return subscribeUrl;
  }
};

const quickImportSelectedClient = async () => {
  if (!subscriptionUrl.value) {
    toast.warning(t('quickStartPage.noSubscriptionUrl'));
    return;
  }

  const target = selectedClient.value || selectedPlatformClients.value[0];
  const schemeUrl = buildClientSchemeUrl(resolveClientType(target), subscriptionUrl.value);

  try {
    await navigator.clipboard.writeText(subscriptionUrl.value);
  } catch (err) {
    console.warn('Copy subscription failed before import:', err);
  }

  window.open(schemeUrl, '_blank');
  toast.success(t('quickStartPage.quickImportTriggered'));
};

const openQrCodeModal = async () => {
  if (!subscriptionUrl.value) {
    toast.warning(t('quickStartPage.noSubscriptionUrl'));
    return;
  }

  try {
    qrCodeUrl.value = await QRCode.toDataURL(subscriptionUrl.value);
    showQrCode.value = true;
  } catch (err) {
    console.error('Generate QRCode failed:', err);
    toast.error(t('quickStartPage.qrGenerateFailed'));
  }
};

const copySubscriptionUrl = async () => {
  if (!subscriptionUrl.value) {
    toast.warning(t('quickStartPage.noSubscriptionUrl'));
    return;
  }

  try {
    await navigator.clipboard.writeText(subscriptionUrl.value);
    toast.success(t('quickStartPage.subscriptionCopied'));
  } catch (err) {
    console.error('Copy subscription failed:', err);
    toast.error(t('quickStartPage.copyFailed'));
  }
};

const fetchUserStatus = async () => {
  try {
    const response = await getSubscribe();
    const subscribe = response?.data || {};

    subscriptionUrl.value = subscribe?.subscribe_url || '';
    userStatus.value = resolveSubscriptionStatus(subscribe);
  } catch (err) {
    console.error('Failed to fetch user status:', err);
    userStatus.value = SUBSCRIPTION_STATUS.NEW;
  }
};

onMounted(fetchUserStatus);
</script>

<style scoped lang="scss">
@use "sass:map";
@use "@/assets/styles/base/variables.scss" as *;
@use "@/assets/styles/base/typography.scss" as *;

.quick-start-container {
  padding-bottom: calc(2px + 64px);

  @include up(md) {
    padding-bottom: 0;
  }
}

.status-strip {
  background: rgba(var(--theme-color-rgb), 0.06);
  border: var(--border-width) solid var(--divider);
  border-radius: $border-radius-sm;
  padding: map.get($spacers, 2);

  .status-main-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-icon {
    color: rgba(var(--theme-color-rgb), 0.9);
    flex-shrink: 0;
  }

  .status-main {
    margin: 0;
    @extend %typo-body-text;
    font-weight: $font-weight-semibold;
  }

  &.is-expired .status-icon {
    color: var(--error-color);
  }

  &.is-active .status-icon {
    color: var(--success-color);
  }
}

.step-card {
  background: #f8faff;
  border: var(--border-width) solid var(--border-subtle);
  border-radius: $border-radius-sm;
  box-shadow: var(--shadow-sm);
  padding: map.get($spacers, 3);

  .step-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;

    h2 {
      margin: 0;
      @extend %typo-section-title;
    }
  }

  .step-index {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #4177e9;
    color: var(--text-on-dark-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: $font-weight-semibold;
    font-size: $font-size-md;
  }
}

.step-tip,
.connect-text {
  margin: 0;
  @extend %typo-body-text;
}

.system-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
}

.system-item {
  border: var(--border-width) solid var(--border-default);
  border-radius: $border-radius-sm;
  background: #fff;
  padding: 8px;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  position: relative;

  &:hover {
    border-color: rgba(var(--theme-color-rgb), 0.5);
  }

  strong { @extend %typo-item-title; }

  &.active {
    border-color: rgba(var(--theme-color-rgb), 0.85);
    background: rgba(var(--theme-color-rgb), 0.05);
    color: var(--theme-color);
  }

  .selected-mark {
    position: absolute;
    top: 10px;
    right: 10px;
    color: var(--theme-color);
  }
}

@include down(md) {
  .system-item {
    padding: map.get($spacers, 2) 24px map.get($spacers, 2) map.get($spacers, 2);
    min-height: 62px;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
    text-align: left;

    :deep(svg) {
      width: 20px;
      height: 20px;
      flex: 0 0 20px;
    }

    strong {
      flex: 1;
      min-width: 0;
    }
  }
}

.client-grid {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
}

.client-item {
  border: var(--border-width) solid var(--border-default);
  background: #fff;
  border-radius: $border-radius-sm;
  padding: map.get($spacers, 2) 24px map.get($spacers, 2) map.get($spacers, 2);
  min-height: 62px;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  cursor: pointer;
  text-align: left;

  .client-text {
    min-width: 0;
    flex: 1;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .client-name {
    flex: 0 1 auto;
    min-width: 0;
    max-width: 100%;
    @extend %typo-item-title;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.active {
    border-color: rgba(var(--theme-color-rgb), 0.85);
    background: rgba(var(--theme-color-rgb), 0.06);
  }

  .recommend-inline {
    color: var(--warning-color);
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    line-height: 1;
    background: rgba(240, 140, 46, 0.14);
    border-radius: 999px;
    padding: 0 4px;
    flex: 0 0 auto;
  }

  .client-selected-mark {
    position: absolute;
    top: 10px;
    right: 10px;
    color: var(--theme-color);
  }
}

.client-icon-large {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.fallback-icon-large,
.client-icon-large {
  &.grayscale {
    filter: grayscale(1);
    opacity: 0.65;
  }
}

.action-row {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}

.action-btn,
.help-btn {
  border: var(--border-width) solid var(--border-default);
  background: #fff;
  color: var(--info-color);
  border-radius: $border-radius-sm;
  padding: map.get($spacers, 2);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  &.primary {
    background: #3f72e8;
    color: var(--text-on-dark-primary);
  }
}

.help-btn {
  margin-top: 8px;
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
  border-radius: $border-radius-sm;
  background: #fff;
  padding: map.get($spacers, 3);

  .qrcode-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .close-btn {
    border: none;
    background: transparent;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
  }

  img {
    width: 100%;
    max-width: 260px;
    display: block;
    margin: 0 auto;
  }
}
</style>
