<template>
  <div class="dashboard-card import-config-card" v-if="subscriptionUrl">
    <div class="card-body">
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
        <div v-else class="no-clients-tip">{{ t('dashboard.noClientsAvailable') }}</div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  IconBrandApple,
  IconBrandAndroid,
  IconBrandWindows,
  IconDeviceLaptop
} from '@tabler/icons-vue';
import { getSubscribe } from '@/api/overview/dashboard';
import { CLIENT_CONFIG } from '@/utils/baseConfig';
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
const activePlatform = ref('ios');
const clientConfig = reactive(CLIENT_CONFIG);

const platforms = [
  { id: 'windows', label: 'Windows', icon: IconBrandWindows, showFlag: 'showWindows' },
  { id: 'macos', label: 'MacOS', icon: IconDeviceLaptop, showFlag: 'showMacOS' },
  { id: 'android', label: 'Android', icon: IconBrandAndroid, showFlag: 'showAndroid' },
  { id: 'ios', label: 'iOS', icon: IconBrandApple, showFlag: 'showIOS' }
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
    }
  } catch (err) {
    console.error('Failed to fetch subscription info:', err);
  }
};

const openClientLink = async (clientType) => {
  if (!subscriptionUrl.value) return;
  const subscribeUrl = subscriptionUrl.value;
  const siteName = t('quickStartPage.subscriptionTag');
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
    $toast.success(copied ? t('quickStartPage.quickImportTriggered') : t('dashboard.manualImportRequired'));
  }
};
onMounted(() => {
  fetchSubscription();
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/base/variables.scss" as *;
.import-config-card {
  margin-top: 24px;
  .card-body {
    display: grid;
    gap: 16px;
  }

  .platform-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 0;
  }

  .platform-button {
    border: 1px solid var(--border-color);
    background: var(--card-background);
    border-radius: 999px;
    padding: 8px 16px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: $font-size-md;

    &.active {
      border-color: rgba(var(--theme-color-rgb), 0.75);
      color: rgba(var(--theme-color-rgb), 0.95);
      background: rgba(var(--theme-color-rgb), 0.08);
    }
  }

  .platform-section {
    margin-top: 16px;

    .platform-title {
      font-size: $font-size-md;
      font-weight: $font-weight-semibold;
      }

    .platform-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 8px;
    }

    .platform-option {
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 8px 16px;
      background: var(--card-background);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: $font-size-md;
      font-weight: $font-weight-semibold;

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
      padding: 8px;
      border: 1px dashed var(--border-color);
      border-radius: 10px;
      color: var(--text-tertiary);
      font-size: $font-size-sm;
      text-align: center;
    }
  }
}

</style>
