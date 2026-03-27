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
                :class="{ grayscale: !client.recommended }"
              />
              <IconApps v-else :size="20" class="fallback-icon-large" :class="{ grayscale: !client.recommended }" />
              <div class="client-text">
                <span class="client-name">{{ client.name }}</span>
                <small v-if="client.recommended" class="recommend-inline">{{ $t('quickStartPage.recommended') }}</small>
              </div>
              <IconCheck v-if="selectedClient?.name === client.name" :size="16" class="client-selected-mark" />
            </button>
          </div>

          <div class="action-row" v-if="subscriptionUrl">
            <button class="action-btn primary" @click="downloadSelectedClient">{{ downloadButtonText }}</button>
            <button class="action-btn" @click="quickImportSelectedClient">{{ $t('quickStartPage.quickImport') }}</button>
            <button class="action-btn" @click="copySubscriptionUrl">{{ $t('quickStartPage.copySubscription') }}</button>
            <button
              v-if="selectedPlatform === 'ios' || selectedPlatform === 'android'"
              class="action-btn"
              @click="openQrCodeModal"
            >
              {{ $t('quickStartPage.qrImport') }}
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
          <button class="help-btn" @click="router.push('/docs')">{{ $t('quickStartPage.helpCta') }}</button>
        </div>
      </section>

      <Teleport to="body">
        <div v-if="showQrCode" class="qrcode-modal-overlay" @click="showQrCode = false">
          <div class="qrcode-modal" @click.stop>
            <div class="qrcode-header">
              <h3>{{ $t('quickStartPage.qrModalTitle') }}</h3>
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
import { computed, inject, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { IconBrandApple, IconBrandAndroid, IconBrandFinder, IconBrandWindows, IconApps, IconCheck } from '@tabler/icons-vue';
import { CLIENT_CONFIG } from '@/utils/baseConfig';
import { getSubscribe } from '@/api/overview/dashboard';
import { useToast } from '@/composables/useToast';
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

const USER_STATUS = Object.freeze({
  NEW: 'new',
  ACTIVE: 'active',
  EXPIRED: 'expired'
});

const userStatus = ref(USER_STATUS.NEW);
const subscriptionUrl = ref('');
const showQrCode = ref(false);
const qrCodeUrl = ref('');
const selectedPlatform = ref('windows');
const selectedClientName = ref('');

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
  if (userStatus.value === USER_STATUS.NEW) return t('quickStartPage.status.newTitle');
  if (userStatus.value === USER_STATUS.EXPIRED) return t('quickStartPage.status.expiredTitle');
  return t('quickStartPage.status.activeTitle');
});

const statusStripDesc = computed(() => {
  if (userStatus.value === USER_STATUS.NEW) return t('quickStartPage.status.newDesc');
  if (userStatus.value === USER_STATUS.EXPIRED) return t('quickStartPage.status.expiredDesc');
  return t('quickStartPage.status.activeDesc');
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

.status-strip {
  background: rgba(var(--theme-color-rgb), 0.06);
  border: 1px solid rgba(var(--theme-color-rgb), 0.14);
  border-radius: $border-radius-sm;
  padding: 10px 14px;

  .status-main {
    margin: 0;
    font-size: $font-size-md;
    font-weight: $font-weight-semibold;
    color: var(--text-primary);
  }

  .status-sub {
    margin: 4px 0 0;
    font-size: $font-size-sm;
    color: var(--text-tertiary);
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
      font-size: $font-size-xl;
      font-weight: $font-weight-semibold;
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
  color: var(--text-tertiary);
  font-size: $font-size-md;
}

.system-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.system-item {
  border: 1px solid var(--border-color);
  border-radius: $border-radius-sm;
  background: #fff;
  padding: 12px;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  position: relative;

  &:hover {
    border-color: rgba(var(--theme-color-rgb), 0.5);
  }

  strong { font-size: $font-size-md; }

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

.client-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.client-item {
  border: 1px solid var(--border-color);
  background: #fff;
  border-radius: 10px;
  padding: 12px 34px 12px 14px;
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
    gap: 6px;
  }

  .client-name {
    flex: 0 1 auto;
    min-width: 0;
    max-width: 100%;
    font-weight: $font-weight-semibold;
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
    padding: 2px 6px;
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
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.action-btn,
.help-btn {
  border: 1px solid var(--border-color);
  background: #fff;
  color: var(--info-color);
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;

  &.primary {
    background: #3f72e8;
    color: var(--text-on-dark-primary);
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
    font-size: $font-size-xl;
  }

  img {
    width: 100%;
    max-width: 260px;
    display: block;
    margin: 0 auto;
  }
}
</style>
