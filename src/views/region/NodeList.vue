<template>

  <div class="nodes-container page-shell">

    <!-- 域名授权验证提示 - 如果不需要域名授权功能，移除此组件即可 -->



    

    <div class="nodes-inner page-inner page-stack">


      <!-- 线路列表状态 -->

      <div v-if="loading" class="nodes-loading">

        <LoadingSpinner />

        <p>{{ $t('lines.loading') }}</p>

      </div>

      

      <!-- 错误提示 -->

      <div v-else-if="error" class="nodes-error">

        <IconAlertTriangle :size="48" class="error-icon" />

        <p>{{ error }}</p>

        <button class="retry-button" @click="fetchNodes">{{ $t('common.retry') }}</button>

      </div>

      

      <!-- 无订阅解锁页 -->
      <div v-else-if="!hasActivePlan" class="nodes-no-plan">
        <div class="no-plan-head">
          <h2>{{ $t('lines.noPlan.coverageTitle') }}</h2>
          <p>{{ $t('lines.noPlan.coverageDesc') }}</p>
        </div>

        <div class="no-plan-map">
          <svg class="world-map-svg" viewBox="0 0 1000 420" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
            <g class="continent-layer">
              <path d="M96 168l34-26 44 10 28-18 37 16 40-8 22 20 31 4 28 22-16 24-34 10-21 27-37 6-28-20-20-26-35-6-29-20z" />
              <path d="M364 126l32-18 48 8 23 18 38 4 30 20 22-10 26 12-8 24-27 16-4 24-40 8-27 22-38-8-13-26 6-32-28-20z" />
              <path d="M502 240l34 12 29-8 26 14 10 30-18 20-38 0-36-18-19-22z" />
              <path d="M598 138l42-20 58 6 42-16 46 20 8 28-28 22-38-2-34 10-27 22-45-6-27-24z" />
              <path d="M744 220l29-18 36 8 24 22-8 24-27 12-30-10-20-20z" />
              <path d="M802 296l30-16 24 10 12 20-12 16-30 4-24-12z" />
            </g>
            <g class="grid-lines">
              <path d="M0 110h1000M0 210h1000M0 310h1000" />
              <path d="M170 0v420M340 0v420M510 0v420M680 0v420M850 0v420" />
            </g>
          </svg>
          <div class="map-glow region-jp">JP</div>
          <div class="map-glow region-sg">SG</div>
          <div class="map-glow region-hk">HK</div>
          <div class="map-glow region-us">US</div>
        </div>

        <div class="region-lock-grid">
          <div v-for="region in lockedRegions" :key="region.title" class="region-lock-card">
            <h3>{{ region.title }}</h3>
            <p>{{ region.desc }}</p>
            <button class="unlock-tip-btn">{{ $t('lines.noPlan.unlockAfterPurchase') }}</button>
          </div>
        </div>

        <div class="no-plan-cta">
          <button class="cta-btn primary" @click="goToShop">{{ $t('lines.noPlan.subscribeNow') }}</button>
          <button class="cta-btn secondary" @click="goToShop">{{ $t('lines.noPlan.comparePlans') }}</button>
        </div>
      </div>

      <!-- 线路列表内容 -->

      <div v-else-if="lines.length > 0" class="node-items">

          <div v-for="line in lines" :key="line.id" class="node-item">
            <div class="node-country" :class="countryBadgeClass(getCountryTag(line.tags))">{{ formatCountryTag(getCountryTag(line.tags) || '--') }}</div>

            <div class="node-info">
              <h3 class="node-name">{{ line.name }}</h3>
              <p class="node-host" v-if="showNodeDetails">{{ line.host }}:{{ line.port }}</p>
            </div>

            <div class="node-actions">
              <div class="node-feature-tags" v-if="getFeatureTags(line.tags).length > 0">
                <span v-for="(tag, index) in getFeatureTags(line.tags)" :key="index" class="node-tag feature-tag">{{ tag }}</span>
              </div>
              <span
                class="node-status-dot"
                :class="{ online: line.is_online === 1 }"
                :aria-label="line.is_online === 1 ? $t('lines.status.online') : $t('lines.status.offline')"
                :title="line.is_online === 1 ? $t('lines.status.online') : $t('lines.status.offline')"
              ></span>
            </div>

          </div>

      </div>

      <!-- 空状态 -->

      <div v-else class="nodes-empty">

        <IconServer :size="48" class="empty-icon" />

        <p>{{ $t('lines.noLines') }}</p>

      </div>

    </div>

  </div>

</template>



<script setup>

import { ref, onMounted, inject, computed } from 'vue';
import { useRouter } from 'vue-router';

import { useI18n } from 'vue-i18n';

import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

import { 

  IconAlertTriangle,

  IconServer

} from '@tabler/icons-vue';

import { fetchServerNodes } from '@/api/region/servers';

import { getUserInfo } from '@/api/account/user';


import { NODES_CONFIG } from '@/utils/baseConfig';



const { t } = useI18n();
const router = useRouter();
const $toast = inject('$toast');



const loading = ref(true);

const error = ref('');

const lines = ref([]);

const showNodeDetails = ref(NODES_CONFIG.showNodeDetails); 



const userInfo = ref(null);



const fetchUserInfo = async () => {

  try {

    const result = await getUserInfo();

    if (result && result.data) {

      userInfo.value = result.data;

    }

  } catch (err) {

    console.error('Failed to fetch user info:', err);

    if ($toast) {

      $toast.error(t('lines.userInfoError'));

    }

  }

};

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

const hasActivePlan = computed(() => {
  if (!userInfo.value) return false;

  const planId = Number(userInfo.value.plan_id || userInfo.value.planId || userInfo.value.plan?.id || 0);
  if (!planId) return false;

  const expiredAt = Number(userInfo.value.expired_at || userInfo.value.expiredAt || 0);
  if (!expiredAt) return true;

  return expiredAt * 1000 > Date.now();
});

const lockedRegions = computed(() => [
  { title: t('lines.noPlan.regions.japan.title'), desc: t('lines.noPlan.regions.japan.desc') },
  { title: t('lines.noPlan.regions.singapore.title'), desc: t('lines.noPlan.regions.singapore.desc') },
  { title: t('lines.noPlan.regions.hongKong.title'), desc: t('lines.noPlan.regions.hongKong.desc') },
  { title: t('lines.noPlan.regions.us.title'), desc: t('lines.noPlan.regions.us.desc') },
  { title: t('lines.noPlan.regions.germany.title'), desc: t('lines.noPlan.regions.germany.desc') },
  { title: t('lines.noPlan.regions.global.title'), desc: t('lines.noPlan.regions.global.desc') }
]);

const goToShop = () => {
  router.push('/shop');
};

const fetchNodes = async () => {

  loading.value = true;

  error.value = '';



  try {

    const result = await fetchServerNodes();

    

    if (result && result.data) {

      lines.value = result.data;

    } else {

      lines.value = [];

    }

  } catch (err) {

    console.error('Failed to fetch nodes:', err);

    error.value = err.response?.message || (err && err.message ? err.message : t('common.networkError'));

    

    if ($toast) {

      $toast.error(error.value);

    }

  } finally {

    loading.value = false;

  }

};



onMounted(() => {


  

  fetchUserInfo();

  fetchNodes();

});

</script>



<style lang="scss" scoped>
@use "@/assets/styles/base/variables.scss" as *;

.nodes-container {

  padding: 0;

  padding-bottom: calc(2px + 64px); 

  

  @media (min-width: 768px) {

    padding: 0;

    padding-bottom: 2px; 

  }

}



.nodes-inner {

}





.dashboard-card {

  background-color: var(--card-bg);

  border-radius: $border-radius-sm;

  box-shadow: none;

  padding: 20px;

  margin-bottom: 24px;

  border: 1px solid var(--border-color);

  transition: all 0.3s ease;

  position: relative;

  

  &:hover {

    box-shadow: none;

    border-color: rgba(var(--theme-color-rgb), 0.3);

  }

  

  .card-header {

    display: flex;

    justify-content: space-between;

    align-items: center;

    margin-bottom: 15px;

    

    .card-title {

      font-size: $font-size-xl;

      font-weight: $font-weight-semibold;

      margin: 0;

    }

  }

  

  .card-body {

    p {

      color: var(--text-color-light, var(--secondary-text-color));

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
    color: var(--text-primary);
    border-radius: $border-radius-sm;
    padding: 10px 18px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: $font-size-md;

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
    border-radius: $border-radius-sm;
    padding: 16px;
    background: var(--card-bg);

    .import-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      h3 { margin: 0; font-size: $font-size-xl; }
    }

    .import-action {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      border-radius: $border-radius-sm;
      background: #f6f7fb;
      margin-bottom: 12px;
      cursor: pointer;
    }

    .import-icon {
      width: 56px;
      height: 56px;
      border-radius: $border-radius-sm;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(var(--theme-color-rgb), 0.9);
      background: rgba(var(--theme-color-rgb), 0.12);
    }

    .import-title { font-size: $font-size-xl; font-weight: $font-weight-semibold; }
    .import-desc { color: var(--secondary-text-color); font-size: $font-size-md; }

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
      font-size: $font-size-md;
      margin: 8px 0 12px;
      font-weight: $font-weight-semibold;
    }

    .platform-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }

    .platform-option {
      border: 1px solid var(--border-color);
      border-radius: $border-radius-sm;
      padding: 22px 14px;
      background: #f5f7fb;
      font-size: $font-size-md;
      font-weight: $font-weight-medium;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 10px;

      .platform-option-icon {
        opacity: 0.9;
        flex-shrink: 0;
      }

      &:hover {
        border-color: rgba(var(--theme-color-rgb), 0.3);
        background: #ffffff;
      }

      .platform-option-image {
        width: 18px;
        height: 18px;
        border-radius: 4px;
        object-fit: contain;
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
      border-radius: $border-radius-sm;
      width: min(90vw, 320px);
      padding: 14px;

      &.reset-modal {
        width: min(90vw, 380px);
      }
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

    .reset-modal-text {
      color: var(--text-primary);
      font-size: $font-size-md;
      margin: 0 0 12px;
      line-height: 1.6;
    }

    .reset-modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;

      .quick-btn.danger {
        border-color: rgba(239, 68, 68, 0.35);
        color: #dc2626;
        background: rgba(239, 68, 68, 0.08);
      }
    }
  }
}


.nodes-no-plan {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: $border-radius-sm;
  padding: 24px;
  box-shadow: none;

  .no-plan-head {
    text-align: center;
    margin-bottom: 18px;

    h2 {
      margin: 0;
      font-size: $font-size-xl;
      font-weight: $font-weight-bold;
      letter-spacing: 0.2px;
    }

    p {
      margin: 8px 0 0;
      color: var(--text-color-light, var(--secondary-text-color));
      font-size: $font-size-md;
    }
  }

  .no-plan-map {
    position: relative;
    height: 240px;
    border-radius: $border-radius-sm;
    margin-bottom: 20px;
    border: 1px solid rgba(var(--theme-color-rgb), 0.22);
    background:
      radial-gradient(circle at 20% 30%, rgba(var(--theme-color-rgb), 0.22), transparent 35%),
      radial-gradient(circle at 78% 42%, rgba(99, 102, 241, 0.2), transparent 32%),
      linear-gradient(160deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.92));
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px);
      background-size: 42px 42px;
    }

    .world-map-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 0;

      .continent-layer {
        fill: rgba(59, 130, 246, 0.16);
        stroke: rgba(147, 197, 253, 0.5);
        stroke-width: 2;
        filter: none;
      }

      .grid-lines {
        fill: none;
        stroke: rgba(148, 163, 184, 0.2);
        stroke-width: 1;
      }
    }

    .map-glow {
      position: absolute;
      z-index: 2;
      width: 52px;
      height: 52px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: $font-size-sm;
      font-weight: $font-weight-bold;
      color: var(--text-on-dark-primary);
      background: radial-gradient(circle at center, rgba(var(--theme-color-rgb), 0.95), rgba(var(--theme-color-rgb), 0.35));
      box-shadow: none;
      animation: regionPulse 2.8s ease-in-out infinite;
    }

    .region-jp { top: 62px; right: 360px; }
    .region-sg { top: 126px; right: 470px; animation-delay: 0.4s; }
    .region-hk { top: 96px; right: 420px; animation-delay: 0.9s; }
    .region-us { top: 84px; left: 210px; animation-delay: 1.2s; }
  }

  .region-lock-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 18px;

    @media (max-width: 1080px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }

    .region-lock-card {
      border: 1px solid var(--border-color);
      border-radius: $border-radius-sm;
      padding: 14px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96));
      position: relative;

      h3 {
        margin: 0 0 6px;
        font-size: $font-size-md;
      }

      p {
        margin: 0;
        color: var(--text-color-light, var(--secondary-text-color));
        font-size: $font-size-sm;
      }

      .unlock-tip-btn {
        margin-top: 12px;
        border: 1px solid rgba(var(--theme-color-rgb), 0.3);
        background: rgba(var(--theme-color-rgb), 0.08);
        color: rgba(var(--theme-color-rgb), 0.95);
        border-radius: 999px;
        padding: 6px 12px;
        font-size: $font-size-sm;
        font-weight: $font-weight-semibold;
        float: right;
      }
    }
  }

  .no-plan-cta {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;

    .cta-btn {
      min-width: 168px;
      padding: 10px 18px;
      border-radius: $border-radius-sm;
      font-size: $font-size-md;
      font-weight: $font-weight-bold;
      cursor: pointer;
      border: 1px solid transparent;
    }

    .primary {
      color: var(--text-on-dark-primary);
      background: linear-gradient(135deg, var(--button-primary-soft-start), var(--button-primary-start));
      box-shadow: none;
    }

    .secondary {
      color: var(--neutral-strong);
      border-color: var(--border-color);
      background: var(--surface-subtle);
    }
  }
}

@keyframes regionPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.85; }
}

.node-items {

  display: grid;

  grid-template-columns: repeat(2, minmax(0, 1fr));

  gap: 0.9rem;

}



.node-item {

  display: flex;

  min-width: 0;

  align-items: center;

  padding: 0.9rem 1.05rem;

  border-radius: $border-radius-sm;

  background: var(--card-background);

  transition: all 0.25s ease;

  box-shadow: none;

  border: 1px solid var(--border-color);

  

  &:hover {

    transform: translateY(-1px);

    box-shadow: none;

    border-color: rgba(var(--theme-color-rgb), 0.3);

  }
  .node-country {
    min-width: 72px;
    height: 34px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 14px;
    padding: 0 10px;
    font-size: 0.88rem;
    font-weight: $font-weight-bold;
    color: var(--text-on-dark-primary);
    letter-spacing: 0.5px;
    background: linear-gradient(135deg, #d90429, #9d174d);
    box-shadow: none;

    &.is-red { background: linear-gradient(135deg, #d90429, #9d174d); }
    &.is-pink { background: linear-gradient(135deg, #db2777, #be185d); }
    &.is-blue { background: linear-gradient(135deg, #1d4ed8, #1e3a8a); }
  }

  .node-info {

    flex: 1;

    min-width: 0;

    overflow: hidden;

    

    .node-name {

      font-size: 1rem;

      font-weight: $font-weight-semibold;

      margin: 0 0 0.35rem;

      color: var(--text-primary);

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

      color: var(--text-color-light, var(--secondary-text-color));

      margin: 0;

    }

  }

  

  .node-actions {

    display: inline-flex;

    align-items: center;

    gap: 8px;

    margin-left: 12px;
    min-width: 140px;
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
        font-size: $font-size-sm;
        padding: 0 10px;
        border-radius: 999px;
        background-color: rgba(190, 24, 93, 0.12);
        color: #be185d;
        font-weight: $font-weight-semibold;
        display: inline-flex;
        align-items: center;
      }
    }

    .node-status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15);
      flex-shrink: 0;

      &.online {
        background: #22c55e;
        box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.15);
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

    color: var(--text-color-light, var(--secondary-text-color));

    font-size: 1.1rem;

  }

  

  .error-icon, 

  .empty-icon {

    color: var(--text-color-light, var(--secondary-text-color));

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

  border-radius: $border-radius-sm;

  background-color: rgba(var(--theme-color-rgb), 0.85);

  color: var(--text-on-dark-primary);

  font-weight: $font-weight-medium;

  font-size: $font-size-md;

  border: 1px solid rgba(var(--theme-color-rgb), 0.3);

  box-shadow: none;

  cursor: pointer;

  transition: all 0.3s ease;

  backdrop-filter: blur(8px);

  -webkit-backdrop-filter: blur(8px);

  

  &:hover {

    transform: translateY(-2px);

    box-shadow: none;

    background-color: rgba(var(--theme-color-rgb), 0.95);

  }

  

  &:active {

    transform: translateY(0);

    box-shadow: none;

  }

}





@keyframes pulse {

  0% {

    box-shadow: none;

  }

  70% {

    box-shadow: none;

  }

  100% {

    box-shadow: none;

  }

}





@media (max-width: 860px) {

  .node-items {

    grid-template-columns: 1fr;

  }

  .node-actions {
    min-width: 110px;
  }

}

</style> 
