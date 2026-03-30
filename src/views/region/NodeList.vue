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
        <div class="no-plan-hero">
          <div class="hero-copy">
            <span class="hero-status-tag">订单待完成</span>
            <h2>继续完成支付，激活服务</h2>
            <p>完成支付后即可下载客户端并开始使用</p>
            <div class="hero-actions">
              <button class="hero-btn primary" @click="goToShop">继续支付</button>
              <button class="hero-btn secondary" @click="goToQuickStart">查看教程</button>
            </div>
            <div class="hero-hint">支持多平台 · 一键导入配置</div>
          </div>
          <div class="hero-graphic" aria-hidden="true">
            <div class="device device-laptop"></div>
            <div class="device device-tablet"></div>
            <div class="device device-phone"></div>
          </div>
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

        <section class="service-support-card">
          <div class="service-support-header">
            <h3>服务支持</h3>
            <p>支持常见流媒体与社交平台业务场景</p>
          </div>
          <div class="service-support-grid">
            <div
              v-for="service in serviceSupportItems"
              :key="service.key"
              class="service-support-item"
            >
              <img :src="service.icon" :alt="service.name" loading="lazy" decoding="async" />
              <span>{{ service.name }}</span>
            </div>
          </div>
        </section>
      </div>

      <!-- 线路列表内容 -->

      <div v-else-if="lines.length > 0" class="node-items">

          <div v-for="line in lines" :key="line.id" class="node-item">
            <div class="node-country" :class="countryBadgeClass(getCountryTag(line.tags))">{{ formatCountryTag(getCountryTag(line.tags) || '--') }}</div>

            <div class="node-info">
              <h3 class="node-name">{{ formatNodeName(line.name) }}</h3>
              <div class="node-feature-tags" v-if="getFeatureTags(line.tags).length > 0">
                <span v-for="(tag, index) in getFeatureTags(line.tags)" :key="index" class="node-tag feature-tag">{{ tag }}</span>
              </div>
              <p class="node-host" v-if="showNodeDetails">{{ line.host }}:{{ line.port }}</p>
            </div>

            <div class="node-actions">
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
import iconFacebook from '@/assets/images/service-icons/facebook.svg';
import iconYoutubePremium from '@/assets/images/service-icons/youtube-premium.svg';
import iconChatgpt from '@/assets/images/service-icons/chatgpt.svg';
import iconDisneyPlus from '@/assets/images/service-icons/disney-plus.svg';
import iconYoutube from '@/assets/images/service-icons/youtube.svg';
import iconTiktok from '@/assets/images/service-icons/tiktok.svg';
import iconClaude from '@/assets/images/service-icons/claude.svg';
import iconNetflix from '@/assets/images/service-icons/netflix.svg';
import iconGoogle from '@/assets/images/service-icons/google.svg';
import iconInstagram from '@/assets/images/service-icons/instagram.svg';


import { NODES_CONFIG } from '@/utils/baseConfig';



const { t } = useI18n();
const router = useRouter();
const $toast = inject('$toast');



const loading = ref(true);

const error = ref('');

const lines = ref([]);

const showNodeDetails = ref(NODES_CONFIG.showNodeDetails); 



const userInfo = ref(null);

const serviceSupportItems = [
  { key: 'youtube', name: 'YouTube', icon: iconYoutube },
  { key: 'youtube-premium', name: 'YouTube Premium', icon: iconYoutubePremium },
  { key: 'chatgpt', name: 'ChatGPT', icon: iconChatgpt },
  { key: 'claude', name: 'Claude', icon: iconClaude },
  { key: 'netflix', name: 'Netflix', icon: iconNetflix },
  { key: 'disney-plus', name: 'Disney+', icon: iconDisneyPlus },
  { key: 'tiktok', name: 'TikTok', icon: iconTiktok },
  { key: 'instagram', name: 'Instagram', icon: iconInstagram },
  { key: 'facebook', name: 'Facebook', icon: iconFacebook },
  { key: 'google', name: 'Google', icon: iconGoogle }
];



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
const EMOJI_REGEX = /(?:[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]|[\u2600-\u27BF]|\uFE0F|\u200D)/gu;

const stripEmoji = (value) => String(value || '')
  .replace(EMOJI_REGEX, '')
  .replace(/\s{2,}/g, ' ')
  .trim();

const normalizeNodeTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => stripEmoji(tag))
    .filter(Boolean);
};

const formatNodeName = (name) => stripEmoji(name) || '--';

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

const goToQuickStart = () => {
  router.push('/quick-start');
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
@use "sass:map";
@use "@/assets/styles/base/variables.scss" as *;
@use "@/assets/styles/base/typography.scss" as *;

.nodes-container {

  padding: 0;

  padding-bottom: calc(2px + 64px); 

  

}



.nodes-inner {

}





.dashboard-card {

  background-color: var(--card-bg);

  border-radius: $border-radius-sm;

  box-shadow: none;

  padding: map.get($spacers, 3);

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

    margin-bottom: 16px;

    

    .card-title {
      @extend %typo-section-title;

      margin: 0;

    }

  }

  

  .card-body {

    p {

      color: var(--text-tertiary);

      margin: 0;

      line-height: 1.5;

    }

  }

}



.welcome-card {
  .quick-actions {
    margin-top: 8px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .quick-btn {
    border: 1px solid var(--border-color);
    background: #fff;
    color: var(--text-primary);
    border-radius: $border-radius-sm;
    padding: 8px 16px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    @extend %typo-item-title;

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
      margin-bottom: 8px;

      h3 { margin: 0; font-size: $font-size-xl; }
    }

    .import-action {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      border-radius: $border-radius-sm;
      background: #f6f7fb;
      margin-bottom: 8px;
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

    .import-title { @extend %typo-section-title; }
    .import-desc { @extend %typo-body-text; }

    .platform-selector {
      display: flex;
      gap: 8px;
      margin: 16px 0;
      flex-wrap: wrap;
    }

    .platform-button {
      border: 1px solid var(--border-color);
      background: #f7f7fb;
      border-radius: 999px;
      padding: 8px 16px;
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
      @extend %typo-item-title;
      margin: 8px 0 8px;
    }

    .platform-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 8px;
    }

    .platform-option {
      border: 1px solid var(--border-color);
      border-radius: $border-radius-sm;
      padding: 24px 16px;
      background: #f5f7fb;
      font-size: $font-size-md;
      font-weight: $font-weight-medium;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;

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
      padding: 16px;

      &.reset-modal {
        width: min(90vw, 380px);
      }
    }

    .qrcode-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .qrcode-content {
      display: flex;
      justify-content: center;

      img { width: 220px; height: 220px; }
    }

    .reset-modal-text {
      color: var(--text-primary);
      font-size: $font-size-md;
      margin: 0 0 8px;
      line-height: 1.6;
    }

    .reset-modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;

      .quick-btn.danger {
        border-color: rgba(239, 68, 68, 0.35);
        color: var(--error-color);
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

  .no-plan-hero {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 20px;
    margin-bottom: 16px;
    padding: 20px;
    border-radius: 14px;
    border: 1px solid rgba(var(--theme-color-rgb), 0.16);
    background:
      radial-gradient(circle at 82% 18%, rgba(59, 130, 246, 0.16), transparent 42%),
      radial-gradient(circle at 15% 72%, rgba(99, 102, 241, 0.1), transparent 48%),
      linear-gradient(120deg, rgba(243, 246, 255, 0.88), rgba(250, 252, 255, 0.92));

    @media (max-width: 992px) {
      grid-template-columns: 1fr;
    }

    .hero-copy {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 10px;

      .hero-status-tag {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 6px 12px;
        font-size: $font-size-sm;
        font-weight: $font-weight-bold;
        color: #b45309;
        border: 1px solid rgba(245, 158, 11, 0.32);
        background: rgba(245, 158, 11, 0.14);
      }

      h2 {
        margin: 0;
        font-size: clamp(24px, 3vw, 40px);
        line-height: 1.16;
        font-weight: $font-weight-bold;
        color: var(--text-primary);
      }

      p {
        margin: 0;
        color: var(--text-secondary);
        font-size: $font-size-lg;
      }

      .hero-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 4px;
      }

      .hero-btn {
        min-width: 148px;
        padding: 10px 18px;
        border-radius: 10px;
        border: 1px solid transparent;
        font-size: $font-size-md;
        font-weight: $font-weight-bold;
        cursor: pointer;
      }

      .hero-btn.primary {
        color: var(--text-on-dark-primary);
        background: linear-gradient(135deg, var(--button-primary-soft-start), var(--button-primary-start));
      }

      .hero-btn.secondary {
        color: var(--neutral-strong);
        background: rgba(255, 255, 255, 0.75);
        border-color: rgba(148, 163, 184, 0.28);
      }

      .hero-hint {
        margin-top: 2px;
        color: var(--text-tertiary);
        font-size: $font-size-md;
      }
    }

    .hero-graphic {
      position: relative;
      border-radius: 12px;
      min-height: 220px;
      overflow: hidden;
      border: 1px solid rgba(148, 163, 184, 0.2);
      background:
        radial-gradient(circle at 30% 75%, rgba(99, 102, 241, 0.09), transparent 46%),
        radial-gradient(circle at 84% 22%, rgba(59, 130, 246, 0.12), transparent 40%),
        linear-gradient(145deg, rgba(255, 255, 255, 0.65), rgba(241, 245, 255, 0.86));

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(148, 163, 184, 0.14) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148, 163, 184, 0.14) 1px, transparent 1px);
        background-size: 26px 26px;
      }

      .device {
        position: absolute;
        border-radius: 10px;
        border: 2px solid rgba(79, 70, 229, 0.2);
        background: rgba(255, 255, 255, 0.34);
      }

      .device-laptop {
        width: 190px;
        height: 120px;
        right: 18%;
        top: 26%;
      }

      .device-tablet {
        width: 110px;
        height: 82px;
        right: 8%;
        top: 18%;
      }

      .device-phone {
        width: 54px;
        height: 96px;
        right: 14%;
        top: 48%;
      }
    }

    @media (max-width: 992px) {
      .hero-graphic {
        min-height: 180px;
      }
    }
  }

  .region-lock-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin-bottom: 16px;

    @media (max-width: 1080px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }

    .region-lock-card {
      border: 1px solid var(--border-color);
      border-radius: $border-radius-sm;
      padding: 16px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96));
      position: relative;

      h3 {
        margin: 0 0 4px;
        font-size: $font-size-md;
      }

      p {
        margin: 0;
        color: var(--text-tertiary);
        font-size: $font-size-sm;
      }

      .unlock-tip-btn {
        margin-top: 8px;
        border: 1px solid rgba(var(--theme-color-rgb), 0.3);
        background: rgba(var(--theme-color-rgb), 0.08);
        color: rgba(var(--theme-color-rgb), 0.95);
        border-radius: 999px;
        padding: 4px 8px;
        font-size: $font-size-sm;
        font-weight: $font-weight-semibold;
        float: right;
      }
    }
  }

  .no-plan-cta {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 16px;

    .cta-btn {
      min-width: 168px;
      padding: 8px 16px;
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

  .service-support-card {
    border: 1px solid var(--border-color);
    border-radius: $border-radius-sm;
    background: var(--card-background);
    padding: 16px;

    .service-support-header {
      margin-bottom: 12px;

      h3 {
        margin: 0;
        font-size: $font-size-md;
      }

      p {
        margin: 6px 0 0;
        color: var(--text-tertiary);
        font-size: $font-size-sm;
      }
    }

    .service-support-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 10px;

      @media (max-width: 768px) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    .service-support-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 8px;
      border-radius: 10px;
      background: #f8fafc;
      border: 1px solid #e8ebf4;

      img {
        width: 22px;
        height: 22px;
        object-fit: contain;
      }

      span {
        font-size: $font-size-xs;
        color: var(--text-secondary);
        text-align: center;
        line-height: 1.2;
      }
    }
  }
}

.node-items {

  display: grid;

  grid-template-columns: repeat(2, minmax(0, 1fr));

  gap: 16px;

}



.node-item {

  display: flex;

  min-width: 0;

  align-items: center;

  padding: 16px 16px;

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
    min-width: 52px;
    height: 24px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
    padding: 0 8px;
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    color: var(--text-on-dark-primary);
    letter-spacing: 0.2px;
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

      font-size: $font-size-md;

      font-weight: $font-weight-semibold;

      margin: 0 0 4px;

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

      font-size: $font-size-xs;

      color: var(--text-tertiary);

      margin: 0;

    }

    .node-feature-tags {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      margin: 0 0 4px;

      .node-tag.feature-tag {
        height: 18px;
        line-height: 18px;
        font-size: $font-size-xs;
        padding: 0 4px;
        border-radius: 999px;
        background-color: rgba(190, 24, 93, 0.1);
        color: var(--text-secondary);
        font-weight: $font-weight-medium;
        display: inline-flex;
        align-items: center;
      }
    }

  }

  

  .node-actions {

    display: inline-flex;

    align-items: center;

    gap: 4px;

    margin-left: 8px;
    min-width: 24px;
    justify-content: flex-end;

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

  padding: 48px 16px;

  text-align: center;

  

  p {

    margin-top: 16px;

    color: var(--text-tertiary);

    font-size: $font-size-lg;

  }

  

  .error-icon, 

  .empty-icon {

    color: var(--text-tertiary);

    opacity: 0.7;

  }

}



.retry-button {

  margin-top: 24px;

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
    min-width: 24px;
  }

}

</style> 
