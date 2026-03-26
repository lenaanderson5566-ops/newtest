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
    console.error('Failed to fetch knowledge list:', err);
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

.docs-container {

  padding: 0;
  background-color: var(--background-color);

  padding-bottom: calc(2px + 64px); 

  

  @media (min-width: 768px) {

    padding: 0;

    padding-bottom: 2px; 

  }

}



.docs-inner {

}

















.docs-header {

  margin-bottom: 2rem;

  

  .docs-title {

    font-size: 1.75rem;

    font-weight: $font-weight-bold;

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

    color: var(--text-primary);

    font-size: 1rem;

    transition: all 0.3s ease;

    

    &:focus {

      outline: none;

      border-color: var(--theme-color);

      box-shadow: none;

      

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

    font-weight: $font-weight-semibold;

    margin-bottom: 1.25rem;

    padding-bottom: 0.75rem;

    border-bottom: 1px solid rgba(var(--theme-color-rgb), 0.1);

    color: var(--text-primary);

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

  background-color: #fff;

  cursor: pointer;

  transition: all 0.25s ease;

  box-shadow: none;

  border: 1px solid var(--border-color);

  

  &:hover {

    transform: translateY(-2px);

    box-shadow: none;

    border-color: rgba(var(--theme-color-rgb), 0.3);

  }

  

  .doc-info {

    flex: 1;

    overflow: hidden;

    

    .doc-title {

      font-size: 1rem;

      font-weight: $font-weight-semibold;

      margin-bottom: 0.35rem;

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

    color: var(--secondary-text-color);

    line-height: 1.5;

  }

}

</style> 
