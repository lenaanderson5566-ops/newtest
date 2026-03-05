<template>

  <div class="nodes-container">

    <!-- 域名授权验证提示 - 如果不需要域名授权功能，移除此组件即可 -->



    

    <div class="nodes-inner">

      <!-- 欢迎卡片 -->

      <div class="dashboard-card welcome-card">

        <div class="card-header">

          <h2 class="card-title">{{ $t('nodes.welcome.title') || '节点列表' }}</h2>

        </div>

        <div class="card-body">

          <p>{{ $t('nodes.welcome.description') || '查看并使用可用的服务器节点' }}</p>
          <div class="quick-actions">
            <button class="quick-btn" :class="{ active: showImportPanel }" @click="toggleImportPanel" :disabled="!subscriptionUrl">
              {{ $t('dashboard.importSubscription') }}
              <IconChevronDown v-if="!showImportPanel" :size="14" />
              <IconChevronUp v-else :size="14" />
            </button>
            <button class="quick-btn" @click="goRenewPlan" :disabled="!currentPlanId">{{ $t('dashboard.renewPlan') }}</button>
            <button class="quick-btn" @click="goTickets">{{ $t('dashboard.ticketSupport') }}</button>
          </div>
          <transition name="slide-fade">
            <div v-if="showImportPanel && subscriptionUrl" class="import-panel">
              <div class="import-header">
                <h3>{{ $t('dashboard.importSubscription') }}</h3>
                <button class="close-btn" @click="showImportPanel = false">
                  <IconX :size="20" />
                </button>
              </div>
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
              <div class="platform-selector">
                <button v-for="platform in platforms" :key="platform.id" class="platform-button" :class="{ active: activePlatform === platform.id }" @click="activePlatform = platform.id">
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
                    <component :is="option.icon" :size="16" class="platform-option-icon" />
                    <span>{{ option.label }}</span>
                  </button>
                </div>
              </div>
            </div>
          </transition>
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

        </div>

      </div>

      

      <!-- 节点列表状态 -->

      <div v-if="loading" class="nodes-loading">

        <LoadingSpinner />

        <p>{{ $t('nodes.loading') || '正在加载节点...' }}</p>

      </div>

      

      <!-- 错误提示 -->

      <div v-else-if="error" class="nodes-error">

        <IconAlertTriangle :size="48" class="error-icon" />

        <p>{{ error }}</p>

        <button class="retry-button" @click="fetchNodes">{{ $t('common.retry') || '重试' }}</button>

      </div>

      

      <!-- 节点列表内容 -->

      <div v-else-if="nodes.length > 0" class="nodes-content">

        <div class="node-items">

          <div v-for="node in nodes" :key="node.id" class="node-item">
            <div class="node-country" :class="countryBadgeClass(getCountryTag(node.tags))">{{ formatCountryTag(getCountryTag(node.tags) || '--') }}</div>

            <div class="node-info">
              <div class="node-tags">
                <span class="node-tag rate-tag" v-if="showNodeRate">x{{ node.rate }}</span>
                <span class="node-tag type-tag">{{ node.type }}</span>
              </div>

              <h3 class="node-name">{{ node.name }}</h3>
              <p class="node-host" v-if="showNodeDetails">{{ node.host }}:{{ node.port }}</p>
            </div>

            <div class="node-actions">
              <div class="node-feature-tags" v-if="getFeatureTags(node.tags).length > 0">
                <span v-for="(tag, index) in getFeatureTags(node.tags)" :key="index" class="node-tag feature-tag">{{ tag }}</span>
              </div>
              <span class="node-online-status" :class="{ online: node.is_online === 1 }">{{ node.is_online === 1 ? '在线' : '离线' }}</span>
              <button v-if="showNodeRate && allowViewNodeInfo" class="more-btn" @click="openNodeDetail(node)">
                <IconDotsVertical :size="20" />
              </button>
            </div>

          </div>

        </div>

      </div>

      

      <!-- 空状态 -->

      <div v-else class="nodes-empty">

        <IconServer :size="48" class="empty-icon" />

        <p>{{ $t('nodes.noNodes') || '暂无可用节点' }}</p>

      </div>

    </div>

    

    <!-- 节点详情模态框 -->

    <NodeDetailModal 

      v-if="allowViewNodeInfo"

      :show="showDetailModal" 

      :node="selectedNode" 

      :userInfo="userInfo"

      @close="closeNodeDetail"

    />

  </div>

</template>



<script setup>

import { ref, onMounted, inject, computed } from 'vue';

import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

import { 

  IconAlertTriangle,

  IconServer,

  IconDotsVertical,

  IconChevronDown,

  IconChevronUp,
  IconCopy,
  IconQrcode,
  IconX,
  IconBrandApple,
  IconBrandAndroid,
  IconBrandWindows,
  IconDeviceLaptop,
  IconRocket,
  IconBolt

} from '@tabler/icons-vue';

import { fetchServerNodes } from '@/api/servers';

import { getUserInfo } from '@/api/user';
import { getSubscribe } from '@/api/dashboard';
import QRCode from 'qrcode';


import { NODES_CONFIG } from '@/utils/baseConfig';

import NodeDetailModal from '@/components/common/NodeDetailModal.vue';



const { t } = useI18n();
const router = useRouter();

const $toast = inject('$toast');



const loading = ref(true);

const error = ref('');

const nodes = ref([]);

const showNodeDetails = ref(NODES_CONFIG.showNodeDetails); 
const showNodeRate = ref(NODES_CONFIG.showNodeRate);

const allowViewNodeInfo = ref(NODES_CONFIG.allowViewNodeInfo);



const userInfo = ref(null);

const currentPlanId = ref(null);
const subscriptionUrl = ref('');
const showImportPanel = ref(false);
const showQrCode = ref(false);
const qrCodeUrl = ref('');
const activePlatform = ref('ios');
const platforms = [
  { id: 'ios', label: 'iOS', icon: IconBrandApple },
  { id: 'android', label: 'Android', icon: IconBrandAndroid },
  { id: 'windows', label: 'Windows', icon: IconBrandWindows },
  { id: 'macos', label: 'MacOS', icon: IconDeviceLaptop }
];



const showDetailModal = ref(false);

const selectedNode = ref(null);



const openNodeDetail = (node) => {

  selectedNode.value = node;

  showDetailModal.value = true;

};



const closeNodeDetail = () => {

  showDetailModal.value = false;

  setTimeout(() => {

    selectedNode.value = null;

  }, 300);

};



const fetchUserInfo = async () => {

  try {

    const result = await getUserInfo();

    if (result && result.data) {

      userInfo.value = result.data;

    }

  } catch (err) {

    console.error('Failed to fetch user info:', err);

    if ($toast) {

      $toast.error(t('common.userInfoError') || '获取用户信息失败');

    }

  }

};

const fetchSubscription = async () => {
  try {
    const result = await getSubscribe();
    if (result?.data) {
      currentPlanId.value = result.data.plan_id || result.data.plan?.id || null;
      subscriptionUrl.value = result.data.subscribe_url || '';
    }
  } catch (err) {
    console.error('Failed to fetch subscription info:', err);
  }
};

const copySubscriptionUrl = async () => {
  if (!subscriptionUrl.value) return;
  try {
    await navigator.clipboard.writeText(subscriptionUrl.value);
    if ($toast) $toast.success(t('dashboard.subscriptionCopied'));
  } catch (err) {
    if ($toast) $toast.error(t('dashboard.copyFailed'));
  }
};

const toggleImportPanel = () => {
  if (!subscriptionUrl.value) return;
  showImportPanel.value = !showImportPanel.value;
  if (showImportPanel.value) {
    updateQRCode();
  }
};

const platformClientMap = {
  ios: [
    { key: 'shadowrocket', label: 'Shadowrocket', clientType: 'shadowrocket', icon: IconRocket },
    { key: 'singbox-ios', label: 'Singbox', clientType: 'singbox-ios', icon: IconBolt }
  ],
  android: [
    { key: 'v2rayng', label: 'V2rayNG', clientType: 'v2rayng', icon: IconBrandAndroid },
    { key: 'singbox-android', label: 'Singbox', clientType: 'singbox-android', icon: IconBolt }
  ],
  windows: [
    { key: 'clashverge', label: 'Clash Verge', clientType: 'clashverge', icon: IconBrandWindows },
    { key: 'singbox-windows', label: 'Singbox', clientType: 'singbox-windows', icon: IconBolt }
  ],
  macos: [
    { key: 'clashx', label: 'ClashX', clientType: 'clashx', icon: IconDeviceLaptop },
    { key: 'singbox-macos', label: 'Singbox', clientType: 'singbox-macos', icon: IconBolt }
  ]
};

const activePlatformLabel = computed(() => {
  const p = platforms.find((item) => item.id === activePlatform.value);
  return p ? p.label : 'iOS';
});

const activePlatformOptions = computed(() => {
  return platformClientMap[activePlatform.value] || platformClientMap.ios;
});

const COUNTRY_TAG_REGEX = /^(?:[A-Za-z]{2}|(?:usa|uk|uae))$/i;

const normalizeNodeTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => String(tag || '').trim())
    .filter(Boolean);
};

const getCountryTag = (tags) => {
  const normalized = normalizeNodeTags(tags);
  return normalized.find((tag) => COUNTRY_TAG_REGEX.test(tag)) || '';
};

const getFeatureTags = (tags) => {
  const normalized = normalizeNodeTags(tags);
  const countryTag = getCountryTag(normalized);
  return normalized.filter((tag) => tag !== countryTag);
};

const formatCountryTag = (countryTag) => countryTag.toUpperCase();

const countryBadgeClass = (countryTag) => {
  const code = formatCountryTag(countryTag || '');
  if (['US', 'CA', 'NL'].includes(code)) return 'is-blue';
  if (['HK', 'SG'].includes(code)) return 'is-pink';
  if (['DE', 'JP', 'KR'].includes(code)) return 'is-red';
  return 'is-red';
};

const updateQRCode = async () => {
  if (!subscriptionUrl.value) return;
  try {
    qrCodeUrl.value = await QRCode.toDataURL(subscriptionUrl.value, { width: 220, margin: 1 });
  } catch (err) {
    console.error('Failed to generate QR code:', err);
  }
};

const openClientLink = (clientType) => {
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
    case 'singbox-ios':
    case 'singbox-android':
    case 'singbox-windows':
    case 'singbox-macos':
      url = `sing-box://import-remote-profile?url=${encodeURIComponent(subscribeUrl)}`;
      break;
    default:
      url = subscribeUrl;
  }

  window.open(url, '_blank');
};

const goRenewPlan = () => {
  if (!currentPlanId.value) return;
  router.push(`/order-confirm?id=${currentPlanId.value}`);
};

const goTickets = () => {
  router.push('/tickets');
};

const fetchNodes = async () => {

  loading.value = true;

  error.value = '';



  try {

    const result = await fetchServerNodes();

    

    if (result && result.data) {

      nodes.value = result.data;

    } else {

      nodes.value = [];

    }

  } catch (err) {

    console.error('Failed to fetch nodes:', err);

    error.value = err.response?.message || (err && err.message ? err.message : t('common.networkError') || '网络错误');

    

    if ($toast) {

      $toast.error(error.value);

    }

  } finally {

    loading.value = false;

  }

};



onMounted(() => {


  

  fetchUserInfo();
  fetchSubscription();

  fetchNodes();

});

</script>



<style lang="scss" scoped>

.nodes-container {

  padding: 1.25rem;

  padding-bottom: calc(1.25rem + 64px); 

  

  @media (min-width: 768px) {

    padding: 2rem;

    padding-bottom: 3rem; 

  }

}



.nodes-inner {

  max-width: 1200px;

  margin: 0 auto;

}





.dashboard-card {

  background-color: var(--card-bg);

  border-radius: 12px;

  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

  padding: 20px;

  margin-bottom: 24px;

  border: 1px solid var(--border-color);

  transition: all 0.3s ease;

  position: relative;

  

  &:hover {

    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);

    border-color: rgba(var(--theme-color-rgb), 0.3);

  }

  

  .card-header {

    display: flex;

    justify-content: space-between;

    align-items: center;

    margin-bottom: 15px;

    

    .card-title {

      font-size: 18px;

      font-weight: 600;

      margin: 0;

    }

  }

  

  .card-body {

    p {

      color: rgba(226, 232, 240, 0.75);

      margin: 0;

      line-height: 1.5;

    }

  }

}



.welcome-card {

  margin-bottom: 24px;

  .quick-actions {
    margin-top: 12px;
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
    font-size: 16px;

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

  .import-panel {
    margin-top: 16px;
    border: 1px solid var(--border-color);
    border-radius: 14px;
    padding: 16px;
    background: var(--card-bg);

    .import-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      h3 { margin: 0; font-size: 20px; }
    }

    .import-action {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      border-radius: 12px;
      background: #f6f7fb;
      margin-bottom: 12px;
      cursor: pointer;
    }

    .import-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(var(--theme-color-rgb), 0.9);
      background: rgba(var(--theme-color-rgb), 0.12);
    }

    .import-title { font-size: 18px; font-weight: 600; }
    .import-desc { color: #6b7280; font-size: 14px; }

    .platform-selector {
      display: flex;
      gap: 12px;
      margin: 16px 0;
      flex-wrap: wrap;
    }

    .platform-button {
      border: 1px solid var(--border-color);
      background: #f7f7fb;
      border-radius: 999px;
      padding: 8px 18px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;

      &.active {
        border-color: rgba(var(--theme-color-rgb), 0.65);
        color: rgba(var(--theme-color-rgb), 0.95);
        background: #fff;
      }
    }

    .platform-title {
      font-size: 36px;
      margin: 8px 0 12px;
      font-weight: 600;
    }

    .platform-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }

    .platform-option {
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 22px 14px;
      background: #f5f7fb;
      font-size: 34px;
      font-weight: 500;
      text-align: left;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 10px;

      .platform-option-icon {
        opacity: 0.9;
        flex-shrink: 0;
      }
    }
  }

  .qrcode-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(17, 24, 39, 0.42);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1200;

    .qrcode-modal {
      background: #fff;
      border-radius: 14px;
      width: min(90vw, 320px);
      padding: 14px;
    }

    .qrcode-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .qrcode-content {
      display: flex;
      justify-content: center;

      img { width: 220px; height: 220px; }
    }
  }
}

.nodes-content {

  display: flex;

  flex-direction: column;

  gap: 1.25rem;

  max-width: 1200px;

  width: 100%;

  margin: 0 auto;

  padding: 12px;
  border-radius: 16px;
  background: radial-gradient(120% 140% at 50% 0%, rgba(31, 41, 86, 0.28), rgba(8, 14, 40, 0.9));

}



.node-items {

  display: flex;

  flex-direction: column;

  gap: 0.75rem;

}



.node-item {

  display: flex;

  align-items: center;

  padding: 0.9rem 1.05rem;

  border-radius: 14px;

  background: linear-gradient(90deg, rgba(19, 29, 68, 0.92), rgba(31, 45, 94, 0.72));

  transition: all 0.25s ease;

  box-shadow: 0 8px 22px rgba(5, 10, 32, 0.35);

  border: 1px solid rgba(255, 255, 255, 0.1);

  

  &:hover {

    transform: translateY(-1px);

    box-shadow: 0 10px 24px rgba(5, 10, 32, 0.45);

    border-color: rgba(255, 255, 255, 0.2);

  }
  .node-country {
    min-width: 86px;
    height: 42px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 14px;
    padding: 0 14px;
    font-size: 1rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: 0.5px;
    background: linear-gradient(135deg, #d90429, #9d174d);
    box-shadow: 0 6px 14px rgba(157, 23, 77, 0.35);

    &.is-red { background: linear-gradient(135deg, #d90429, #9d174d); }
    &.is-pink { background: linear-gradient(135deg, #db2777, #be185d); }
    &.is-blue { background: linear-gradient(135deg, #1d4ed8, #1e3a8a); }
  }

  .node-info {

    flex: 1;

    overflow: hidden;

    

    .node-tags {

      display: flex;

      flex-wrap: wrap;

      gap: 0.5rem;

      margin-bottom: 0.5rem;

      

      .node-tag {

        font-size: 12px;

        height: 22px;

        line-height: 22px;

        padding: 0 9px;

        border-radius: 8px;

        background-color: rgba(var(--theme-color-rgb), 0.1);

        color: var(--theme-color);

        

        &.rate-tag {

          background-color: rgba(74, 222, 128, 0.16);

          color: #86efac;

          font-weight: 600;

        }

        

        &.type-tag {

          background-color: rgba(96, 165, 250, 0.18);

          color: #93c5fd;

        }

                &.feature-tag {
          background-color: rgba(99, 102, 241, 0.12);
          color: #4f46e5;
        }

      }

    }

    

    .node-name {

      font-size: 1rem;

      font-weight: 600;

      margin: 0 0 0.35rem;

      color: #f8fafc;

      line-height: 1.4;

      overflow: hidden;

      text-overflow: ellipsis;

      display: -webkit-box;

      -webkit-line-clamp: 2;

      line-clamp: 2;

      -webkit-box-orient: vertical;

    }

    

    .node-host {

      font-size: 0.8rem;

      color: rgba(226, 232, 240, 0.75);

      margin: 0;

    }

  }

  

  .node-actions {

    display: inline-flex;

    align-items: center;

    gap: 8px;

    margin-left: 14px;
    min-width: 180px;
    justify-content: flex-end;

    .node-feature-tags {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;

      .node-tag.feature-tag {
        height: 24px;
        line-height: 24px;
        font-size: 12px;
        padding: 0 10px;
        border-radius: 999px;
        background-color: rgba(190, 24, 93, 0.28);
        color: #fda4af;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
      }
    }

    .node-online-status {
      height: 24px;
      line-height: 24px;
      font-size: 12px;
      padding: 0 10px;
      border-radius: 999px;
      background: rgba(248, 113, 113, 0.2);
      color: #f87171;
      font-weight: 600;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;

      &.online {
        background: rgba(74, 222, 128, 0.2);
        color: #86efac;
      }
    }

    .more-btn {

      background: none;

      border: none;

      width: 32px;

      height: 32px;

      border-radius: 50%;

      display: flex;

      align-items: center;

      justify-content: center;

      color: rgba(226, 232, 240, 0.75);

      cursor: pointer;

      transition: all 0.2s ease;

      &:hover {

        background-color: rgba(var(--theme-color-rgb), 0.1);

        color: var(--theme-color);

      }

    }

  }

}





.nodes-loading, 

.nodes-error, 

.nodes-empty {

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  padding: 3rem 1rem;

  text-align: center;

  

  p {

    margin-top: 1rem;

    color: rgba(226, 232, 240, 0.75);

    font-size: 1.1rem;

  }

  

  .error-icon, 

  .empty-icon {

    color: rgba(226, 232, 240, 0.75);

    opacity: 0.7;

  }

}



.retry-button {

  margin-top: 1.5rem;

  height: 40px;

  min-width: 120px;

  padding: 0 16px;

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 8px;

  border-radius: 8px;

  background-color: rgba(var(--theme-color-rgb), 0.85);

  color: white;

  font-weight: 500;

  font-size: 14px;

  border: 1px solid rgba(var(--theme-color-rgb), 0.3);

  box-shadow: 0 8px 20px rgba(var(--theme-color-rgb), 0.25);

  cursor: pointer;

  transition: all 0.3s ease;

  backdrop-filter: blur(8px);

  -webkit-backdrop-filter: blur(8px);

  

  &:hover {

    transform: translateY(-2px);

    box-shadow: 0 10px 25px rgba(var(--theme-color-rgb), 0.35);

    background-color: rgba(var(--theme-color-rgb), 0.95);

  }

  

  &:active {

    transform: translateY(0);

    box-shadow: 0 5px 15px rgba(var(--theme-color-rgb), 0.3);

  }

}





@keyframes pulse {

  0% {

    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);

  }

  70% {

    box-shadow: 0 0 0 8px rgba(76, 175, 80, 0);

  }

  100% {

    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);

  }

}





@media (min-width: 768px) {

  .node-items {

    display: grid;

    grid-template-columns: repeat(2, 1fr);

    gap: 1rem;

  }

}



@media (min-width: 1024px) {

  .node-items {

    grid-template-columns: repeat(3, 1fr);

  }

}

</style> 
