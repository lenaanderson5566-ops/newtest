<template>

  <div class="docs-container page-shell">

    <!-- 域名授权验证提示 - 如果不需要域名授权功能，移除此组件即可 -->


    

    <div class="docs-inner page-inner page-stack">

      <!-- 标题栏 -->

      <div class="docs-header">

        <h1 class="docs-title">{{ $t('menu.start') }}</h1>

        

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
import { ref, computed, onMounted, inject, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { 
  IconSearch, 
  IconX,
  IconChevronRight,
  IconAlertTriangle,
  IconFileSearch,
  IconLanguage
} from '@tabler/icons-vue';
import { fetchKnowledgeList } from '@/api/start/docs';

const { t, locale } = useI18n();
const router = useRouter();
const $toast = inject('$toast');

const loading = ref(true);
const error = ref('');
const documents = ref({});
const searchQuery = ref('');

const currentLanguage = computed(() => locale.value === 'zh-CN' ? '中文' : 'English');
const alternateLanguage = computed(() => locale.value === 'zh-CN' ? 'English' : '中文');

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

const handleSearch = () => {};

const clearSearch = () => {
  searchQuery.value = '';
};

const goToDocument = (id) => {
  router.push(`/docs/${id}`);
};

const fetchKnowledge = async () => {
  loading.value = true;
  error.value = '';

  try {
    const result = await fetchKnowledgeList(locale.value);
    documents.value = result && result.data ? result.data : {};
  } catch (err) {
    error.value = err.response?.message || (err && err.message ? err.message : t('docs.unknownError'));
    $toast?.error(error.value);
  } finally {
    loading.value = false;
  }
};

watch(locale, () => {
  fetchKnowledge();
});

onMounted(() => {
  fetchKnowledge();
});
</script>



<style lang="scss" scoped>
@use "@/assets/styles/base/variables.scss" as *;
@use "@/assets/styles/base/typography.scss" as *;

.docs-container {

  padding: 0;
  background-color: var(--color-bg-surface);

  padding-bottom: calc(2px + 64px); 

  

}



.docs-header {

  margin-bottom: 24px;

  

  .docs-title {
    @extend %typo-page-title;

    margin-bottom: 24px;

    background: linear-gradient(45deg, var(--theme-color), var(--secondary-color));

    -webkit-background-clip: text;

    background-clip: text;

    -webkit-text-fill-color: transparent;

    display: inline-block;

  }

}



.search-wrapper {

  margin-bottom: 24px;

}



.search-input-wrapper {

  position: relative;

  display: flex;

  align-items: center;

  width: 100%;

  

  .search-icon {

    position: absolute;

    left: 1rem;

    color: var(--text-quaternary);

    transition: color 0.3s ease;

  }

  

  .search-input {

    width: 100%;

    padding: 16px 48px;

    border-radius: $border-radius-sm;

    border: var(--border-width) solid var(--border-default);

    background-color: var(--input-bg);

    color: var(--text-primary);

    @extend %typo-item-title;

    transition: all 0.3s ease;

    

    &:focus {

      outline: none;

      border-color: var(--theme-color);


      

      & + .search-icon {

        color: var(--theme-color);

      }

    }

    

    &::placeholder {

      color: var(--text-quaternary);

    }

  }

  

  .clear-button {

    position: absolute;

    right: 0.75rem;

    background: none;

    border: none;

    color: var(--text-quaternary);

    cursor: pointer;

    padding: 4px;

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

  gap: 24px;

  
  width: 100%;

}



.doc-category {

  .category-title {

    font-size: $font-size-xl;

    font-weight: $font-weight-semibold;

    margin-bottom: 16px;

    padding-bottom: 8px;

    border-bottom: var(--border-width) solid var(--border-subtle);

    color: var(--text-primary);

  }

}



.doc-items {

  display: flex;

  flex-direction: column;

  gap: 8px;

}



.doc-item {

  display: flex;

  align-items: center;

  padding: 16px 16px;

  border-radius: $border-radius-sm;

  background-color: #fff;

  cursor: pointer;

  transition: all 0.25s ease;


  border: var(--border-width) solid var(--border-default);

  

  &:hover {

    transform: translateY(-2px);


    border-color: rgba(var(--theme-color-rgb), 0.3);

  }

  

  .doc-info {

    flex: 1;

    overflow: hidden;

    

    .doc-title {

      font-size: $font-size-md;

      font-weight: $font-weight-semibold;

      margin-bottom: 4px;

      color: var(--text-primary);

      line-height: 1.4;

      overflow: hidden;

      text-overflow: ellipsis;

      display: -webkit-box;

      -webkit-line-clamp: 2;

      line-clamp: 2;

      -webkit-box-orient: vertical;

    }

    

    .doc-date {

      font-size: $font-size-xs;

      color: var(--text-quaternary);

    }

  }

  

  .doc-action {

    color: var(--text-quaternary);

    margin-left: 16px;

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

  padding: 48px 16px;

  text-align: center;

  

  p {

    margin-top: 16px;

    color: var(--text-quaternary);

    font-size: $font-size-lg;

  }

  

  .error-icon, 

  .empty-icon {

    color: var(--text-quaternary);

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

  border-radius: 8px;

  background-color: rgba(var(--theme-color-rgb), 0.85);

  color: var(--text-on-dark-primary);

  font-weight: $font-weight-medium;

  font-size: $font-size-md;

  border: var(--border-width) solid var(--border-active);


  cursor: pointer;

  transition: all 0.3s ease;

  backdrop-filter: blur(8px);

  -webkit-backdrop-filter: blur(8px);

  

  &:hover {

    transform: translateY(-2px);


    background-color: rgba(var(--theme-color-rgb), 0.95);

  }

  

  &:active {

    transform: translateY(0);


  }

}





@include up(md) {

  .doc-items {

    display: grid;

    grid-template-columns: repeat(2, 1fr);

    gap: 16px;

  }

}



@include up(lg) {

  .doc-items {

    grid-template-columns: repeat(3, 1fr);

  }

}



.language-hint {

  display: flex;

  align-items: center;

  margin-top: 8px;

  padding: 8px 16px;

  background-color: rgba(var(--theme-color-rgb), 0.05);

  border-radius: 8px;

  border-left: 3px solid var(--theme-color);

  

  .language-icon {

    color: var(--theme-color);

    margin-right: 8px;

    flex-shrink: 0;

  }

  

  .hint-text {

    font-size: $font-size-sm;

    margin: 0;

    color: var(--text-tertiary);

    line-height: 1.5;

  }

}

</style> 
