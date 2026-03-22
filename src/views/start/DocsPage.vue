<template>

  <div class="docs-container page-shell">

    <!-- 域名授权验证提示 - 如果不需要域名授权功能，移除此组件即可 -->


    

    <div class="docs-inner page-inner page-stack">

      <div class="dashboard-card start-using-status-card"> 
        <div class="card-header">
          <h2 class="card-title">{{ statusCardTitle }}</h2>
        </div>
        <div class="card-body">
          <p>{{ statusCardDescription }}</p>
          <button class="status-action-btn" @click="handleStatusAction">{{ statusCardActionText }}</button>
        </div>
      </div>

      <div class="dashboard-card docs-download-card" v-if="showDownloadCard">
        <div class="card-header">
          <h2 class="card-title">{{ $t('dashboard.officialClients') }}</h2>
        </div>
        <div class="card-body">
          <div class="download-options">
            <div class="download-option" v-if="clientConfig.showIOS" @click="downloadClient('ios')">
              <div class="option-icon ios"><IconBrandApple :size="28" /></div>
              <div class="option-name">iOS</div>
            </div>
            <div class="download-option" v-if="clientConfig.showAndroid" @click="downloadClient('android')">
              <div class="option-icon android"><IconBrandAndroid :size="28" /></div>
              <div class="option-name">Android</div>
            </div>
            <div class="download-option" v-if="clientConfig.showMacOS" @click="downloadClient('macos')">
              <div class="option-icon macos"><IconBrandFinder :size="28" /></div>
              <div class="option-name">MacOS</div>
            </div>
            <div class="download-option" v-if="clientConfig.showWindows" @click="downloadClient('windows')">
              <div class="option-icon windows"><IconBrandWindows :size="28" /></div>
              <div class="option-name">Windows</div>
            </div>
            <div class="download-option" v-if="clientConfig.showLinux" @click="downloadClient('linux')">
              <div class="option-icon linux"><IconBrandDebian :size="28" /></div>
              <div class="option-name">Linux</div>
            </div>
            <div class="download-option" v-if="clientConfig.showOpenWrt" @click="downloadClient('openwrt')">
              <div class="option-icon openwrt"><IconRouter :size="28" /></div>
              <div class="option-name">OpenWrt</div>
            </div>
          </div>
        </div>
      </div>

      <ImportConfigCard v-if="showImportConfigCard" />

      <!-- 标题栏 -->

      <div class="docs-header">

        <h1 class="docs-title">{{ $t('docs.title') }}</h1>

        

        <!-- 搜索框 -->

        <div class="search-wrapper">

          <div class="search-input-wrapper">

            <IconSearch class="search-icon" :size="20" />

            <input 

              type="text" 

              v-model="searchQuery" 

              :placeholder="$t('docs.searchPlaceholder')" 

              class="search-input"

              @input="handleSearch"

            />

            <button v-if="searchQuery" @click="clearSearch" class="clear-button">

              <IconX :size="18" />

            </button>

          </div>

        </div>

      </div>



      <!-- 加载状态 -->

      <div v-if="loading" class="docs-loading">

        <LoadingSpinner />

        <p>{{ $t('docs.loading') }}</p>

      </div>



      <!-- 错误提示 -->

      <div v-else-if="error" class="docs-error">

        <IconAlertTriangle :size="48" class="error-icon" />

        <p>{{ error }}</p>

        <button class="retry-button" @click="fetchKnowledge">{{ $t('docs.retry') }}</button>

      </div>



      <!-- 文档列表 -->

      <div v-else-if="hasDocuments && Object.keys(filteredDocs).length > 0" class="docs-content">

        <!-- 遍历每个分类 -->

        <div v-for="(items, category) in filteredDocs" :key="category" class="doc-category">

          <h2 class="category-title">{{ category }}</h2>

          

          <div class="doc-items">

            <div v-for="item in items" :key="item.id" class="doc-item" @click="goToDocument(item.id)">

              <div class="doc-info">

                <h3 class="doc-title">{{ item.title }}</h3>

                <p class="doc-date">{{ $t('docs.lastUpdated') }}: {{ formatDate(item.updated_at) }}</p>

              </div>

              <div class="doc-action">

                <IconChevronRight :size="20" />

              </div>

            </div>

          </div>

        </div>

      </div>



      <!-- 空状态 - 增强版 -->

      <div v-else class="docs-empty">

        <IconFileSearch :size="48" class="empty-icon" />

        

        <!-- 根据搜索状态显示不同提示 -->

        <p v-if="searchQuery">{{ $t('docs.noSearchResults') }}</p>

        

        <!-- 无文档时的语言切换提示 -->

        <template v-else>

          <p>{{ $t('docs.noDocuments') }}</p>

          <div class="language-hint">

            <IconLanguage :size="20" class="language-icon" />

            <p class="hint-text">{{ $t('docs.languageHint', { currentLang: currentLanguage, alternateLang: alternateLanguage }) || `当前语言 ${currentLanguage} 暂无文档，请尝试切换到 ${alternateLanguage}` }}</p>

          </div>

        </template>

        

        <!-- 搜索清除按钮 -->

        <button v-if="searchQuery" @click="clearSearch" class="retry-button">{{ $t('docs.clearSearch') }}</button>

      </div>

    </div>

  </div>

</template>



<script setup name="DocsPage">

import { ref, computed, onMounted, inject, watch, reactive } from 'vue';

import { useI18n } from 'vue-i18n';

import { useRouter } from 'vue-router';

import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import ImportConfigCard from '@/components/common/ImportConfigCard.vue';

import { 

  IconSearch, 

  IconX,

  IconChevronRight,

  IconAlertTriangle,

  IconFileSearch,

  IconLanguage,

  IconBrandApple,

  IconBrandAndroid,

  IconBrandFinder,

  IconBrandWindows,

  IconBrandDebian,

  IconRouter

} from '@tabler/icons-vue';

import { fetchKnowledgeList } from '@/api/start/docs';
import { getSubscribe } from '@/api/overview/dashboard';
import { CLIENT_CONFIG } from '@/utils/baseConfig';




const { t, locale } = useI18n();

const router = useRouter();

const $toast = inject('$toast');



const loading = ref(true);

const error = ref('');

const documents = ref({});

const searchQuery = ref('');
const clientConfig = reactive(CLIENT_CONFIG);
const userStatus = ref('new');
const currentPlanId = ref(null);

const downloadClient = (platform) => {
  const downloadUrl = clientConfig.clientLinks?.[platform];
  if (downloadUrl) {
    window.open(downloadUrl, '_blank');
  }
};




const currentLanguage = computed(() => locale.value === 'zh-CN' ? '中文' : 'English');

const alternateLanguage = computed(() => locale.value === 'zh-CN' ? 'English' : '中文');

const USER_STATUS = Object.freeze({
  NEW: 'new',
  ACTIVE: 'active',
  EXPIRED: 'expired'
});

const statusCardContentMap = Object.freeze({
  [USER_STATUS.NEW]: {
    title: '欢迎使用，先购买订阅',
    description: '当前尚未购买订阅，请先前往订阅页面购买订阅。',
    actionText: '去购买订阅'
  },
  [USER_STATUS.ACTIVE]: {
    title: '订阅状态正常',
    description: '您可以下载客户端并添加配置，快速开始使用。',
    actionText: '查看使用教程'
  },
  [USER_STATUS.EXPIRED]: {
    title: '订阅已到期',
    description: '您的订阅已过期，请及时续费以继续使用服务。',
    actionText: '立即续费'
  }
});

const statusCardContent = computed(() => statusCardContentMap[userStatus.value] || statusCardContentMap[USER_STATUS.NEW]);

const showDownloadCard = computed(() => userStatus.value === USER_STATUS.ACTIVE && clientConfig.showDownloadCard);
const showImportConfigCard = computed(() => userStatus.value === USER_STATUS.ACTIVE);
const statusCardTitle = computed(() => statusCardContent.value.title);
const statusCardDescription = computed(() => statusCardContent.value.description);
const statusCardActionText = computed(() => statusCardContent.value.actionText);



const hasDocuments = computed(() => {

  return documents.value && 

    typeof documents.value === 'object' && 

    Object.keys(documents.value).length > 0 &&

    Object.values(documents.value).some(items => 

      Array.isArray(items) && items.length > 0

    );

});



const filteredDocs = computed(() => {

  if (!searchQuery.value.trim()) {

    return documents.value || {};

  }



  if (!hasDocuments.value) {

    return {};

  }



  const query = searchQuery.value.toLowerCase();

  const filtered = {};



  Object.entries(documents.value).forEach(([category, items]) => {

    if (!Array.isArray(items)) return;

    

    const matchedItems = items.filter(item => 

      (item.title && item.title.toLowerCase().includes(query)) || 

      (category && category.toLowerCase().includes(query))

    );



    if (matchedItems.length > 0) {

      filtered[category] = matchedItems;

    }

  });



  return filtered;

});



const formatDate = (timestamp) => {

  const date = new Date(timestamp * 1000);

  return date.toLocaleDateString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US', {

    year: 'numeric',

    month: 'short',

    day: 'numeric'

  });

};



const handleSearch = () => {

};



const clearSearch = () => {

  searchQuery.value = '';

};



const goToDocument = (id) => {

  router.push(`/docs/${id}`);

};

const handleStatusAction = () => {
  if (userStatus.value === USER_STATUS.ACTIVE) {
    const header = document.querySelector('.docs-header');
    if (header) header.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  if (userStatus.value === USER_STATUS.EXPIRED && currentPlanId.value) {
    router.push(`/order-confirm?id=${currentPlanId.value}`);
    return;
  }

  router.push('/shop');
};

const fetchUserStatus = async () => {
  try {
    const response = await getSubscribe();
    const subscribe = response?.data || {};
    const planId = subscribe?.plan_id || subscribe?.plan?.id || null;
    const expiredAt = Number(subscribe?.expired_at || 0);

    currentPlanId.value = planId;

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

const fetchKnowledge = async () => {

  loading.value = true;

  error.value = '';



  try {

    const result = await fetchKnowledgeList(locale.value);

    

    if (result && result.data) {

      documents.value = result.data;

    } else {

      documents.value = {};

    }

  } catch (err) {

    console.error('Failed to fetch knowledge list:', err);

    error.value = err.response?.message || (err && err.message ? err.message : t('docs.unknownError'));

    

    if ($toast) {

      $toast.error(error.value);

    }

  } finally {

    loading.value = false;

  }

};



watch(locale, () => {

  fetchKnowledge();

});



onMounted(async () => {
  await fetchUserStatus();
  fetchKnowledge();
});

</script>



<style lang="scss" scoped>
@use "@/assets/styles/base/variables.scss" as *;

.docs-container {

  padding: 0;

  padding-bottom: calc(2px + 64px); 

  

  @media (min-width: 768px) {

    padding: 0;

    padding-bottom: 2px; 

  }

}



.docs-inner {

}





.dashboard-card {

  background-color: var(--card-bg);

  border-radius: $border-radius-sm;

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

      color: var(--text-muted);

      margin: 0;

      line-height: 1.5;

    }

  }

}



.welcome-card {

  margin-bottom: 10px;

}

.start-using-status-card {
  margin-bottom: 20px;

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .status-action-btn {
    align-self: flex-start;
    border: none;
    border-radius: $border-radius-sm;
    padding: 8px 14px;
    background: rgba(var(--theme-color-rgb), 0.92);
    color: #fff;
    font-size: 14px;
    cursor: pointer;
  }
}

.docs-download-card {
  margin-bottom: 20px;

  .download-options {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media (min-width: 1200px) {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
  }

  .download-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    padding: 12px;
    border-radius: $border-radius-sm;
    transition: all 0.3s ease;
    border: 1px solid var(--border-color);

    &:hover {
      background-color: rgba(var(--theme-color-rgb), 0.05);
      transform: translateY(-2px);
      border-color: rgba(var(--theme-color-rgb), 0.25);
    }

    .option-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      margin-bottom: 10px;

      &.ios { background-color: rgba(0, 122, 255, 0.1); color: rgba(var(--theme-color-rgb), 0.9); }
      &.android { background-color: rgba(61, 178, 74, 0.1); color: rgba(var(--theme-color-rgb), 0.9); }
      &.macos { background-color: rgba(90, 90, 90, 0.1); color: rgba(var(--theme-color-rgb), 0.72); }
      &.windows { background-color: rgba(0, 120, 215, 0.1); color: rgba(var(--theme-color-rgb), 0.9); }
      &.linux { background-color: rgba(243, 123, 29, 0.1); color: rgba(var(--theme-color-rgb), 0.88); }
      &.openwrt { background-color: rgba(0, 136, 204, 0.1); color: rgba(var(--theme-color-rgb), 0.9); }
    }

    .option-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-color);
    }
  }
}



.docs-header {

  margin-bottom: 2rem;

  

  .docs-title {

    font-size: 1.75rem;

    font-weight: 700;

    margin-bottom: 1.5rem;

    background: linear-gradient(45deg, var(--theme-color), var(--secondary-color));

    -webkit-background-clip: text;

    background-clip: text;

    -webkit-text-fill-color: transparent;

    display: inline-block;

  }

}



.search-wrapper {

  margin-bottom: 1.5rem;

}



.search-input-wrapper {

  position: relative;

  display: flex;

  align-items: center;

  width: 100%;

  

  .search-icon {

    position: absolute;

    left: 1rem;

    color: var(--text-muted);

    transition: color 0.3s ease;

  }

  

  .search-input {

    width: 100%;

    padding: 0.85rem 2.5rem;

    border-radius: $border-radius-sm;

    border: 1px solid var(--border-color);

    background-color: var(--input-bg);

    color: var(--text-color);

    font-size: 1rem;

    transition: all 0.3s ease;

    

    &:focus {

      outline: none;

      border-color: var(--theme-color);

      box-shadow: 0 0 0 2px rgba(var(--theme-color-rgb), 0.2);

      

      & + .search-icon {

        color: var(--theme-color);

      }

    }

    

    &::placeholder {

      color: var(--text-muted);

    }

  }

  

  .clear-button {

    position: absolute;

    right: 0.75rem;

    background: none;

    border: none;

    color: var(--text-muted);

    cursor: pointer;

    padding: 0.25rem;

    display: flex;

    align-items: center;

    justify-content: center;

    border-radius: 50%;

    transition: all 0.3s ease;

    

    &:hover {

      background-color: rgba(var(--theme-color-rgb), 0.1);

      color: var(--theme-color);

    }

  }

}



.docs-content {

  display: flex;

  flex-direction: column;

  gap: 2rem;

  
  width: 100%;

}



.doc-category {

  .category-title {

    font-size: 1.3rem;

    font-weight: 600;

    margin-bottom: 1.25rem;

    padding-bottom: 0.75rem;

    border-bottom: 1px solid rgba(var(--theme-color-rgb), 0.1);

    color: var(--text-color);

  }

}



.doc-items {

  display: flex;

  flex-direction: column;

  gap: 0.75rem;

}



.doc-item {

  display: flex;

  align-items: center;

  padding: 1rem 1.25rem;

  border-radius: $border-radius-sm;

  background-color: var(--card-bg);

  cursor: pointer;

  transition: all 0.25s ease;

  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  border: 1px solid var(--border-color);

  

  &:hover {

    transform: translateY(-2px);

    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);

    border-color: rgba(var(--theme-color-rgb), 0.3);

  }

  

  .doc-info {

    flex: 1;

    overflow: hidden;

    

    .doc-title {

      font-size: 1rem;

      font-weight: 600;

      margin-bottom: 0.35rem;

      color: var(--text-color);

      line-height: 1.4;

      overflow: hidden;

      text-overflow: ellipsis;

      display: -webkit-box;

      -webkit-line-clamp: 2;

      line-clamp: 2;

      -webkit-box-orient: vertical;

    }

    

    .doc-date {

      font-size: 0.8rem;

      color: var(--text-muted);

    }

  }

  

  .doc-action {

    color: var(--text-muted);

    margin-left: 1rem;

    transition: all 0.3s ease;

  }

  

  &:hover {

    .doc-action {

      color: var(--theme-color);

      transform: translateX(3px);

    }

  }

}



.docs-loading, 

.docs-error, 

.docs-empty {

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  padding: 3rem 1rem;

  text-align: center;

  

  p {

    margin-top: 1rem;

    color: var(--text-muted);

    font-size: 1.1rem;

  }

  

  .error-icon, 

  .empty-icon {

    color: var(--text-muted);

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





@media (min-width: 768px) {

  .doc-items {

    display: grid;

    grid-template-columns: repeat(2, 1fr);

    gap: 1rem;

  }

}



@media (min-width: 1024px) {

  .doc-items {

    grid-template-columns: repeat(3, 1fr);

  }

}



.language-hint {

  display: flex;

  align-items: center;

  margin-top: 0.5rem;

  padding: 0.75rem 1rem;

  background-color: rgba(var(--theme-color-rgb), 0.05);

  border-radius: 8px;

  border-left: 3px solid var(--theme-color);

  

  .language-icon {

    color: var(--theme-color);

    margin-right: 0.5rem;

    flex-shrink: 0;

  }

  

  .hint-text {

    font-size: 0.9rem;

    margin: 0;

    color: var(--text-color);

    line-height: 1.5;

  }

}

</style> 
