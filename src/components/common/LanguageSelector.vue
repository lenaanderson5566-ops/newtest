<template>
  <div class="language-selector">
    <button
      class="language-btn"
      :class="{ 'is-active': isOpen }"
      @click="toggleDropdown"
      :title="$t('common.language')"
    >
      <span class="language-btn-text"><IconWorld class="language-icon" :size="14" aria-hidden="true" />{{ currentLanguageShort }}</span>
    </button>

    <transition name="fade">
      <div class="language-dropdown" v-if="isOpen" ref="dropdown">
        <div
          v-for="lang in languages"
          :key="lang.code"
          class="language-item"
          :class="{ active: currentLanguage === lang.code }"
          @click="changeLanguage(lang.code)"
        >
          <span class="lang-name">{{ lang.name }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { IconWorld } from '@tabler/icons-vue';
import { setLanguage } from '@/i18n';
import { checkLoginStatus } from '@/api/auth';
import { getUserInfo, updateUserLanguage } from '@/api/account/user';
import { extractUserLanguage, matchSupportedLanguage } from '@/utils/userLanguage';
import { useToast } from '@/composables/useToast';

export default {
  name: 'LanguageSelector',
  components: {
    IconWorld
  },
  setup() {
    const { locale } = useI18n();
    const { showToast } = useToast();
    const isOpen = ref(false);
    const dropdown = ref(null);

    const languages = [
      { code: 'en-US', name: 'English' },
      { code: 'zh-CN', name: '简体中文' },
      { code: 'zh-TW', name: '繁體中文' },
      { code: 'ja-JP', name: '日本語' },
      { code: 'ko-KR', name: '한국어' },
      { code: 'ru-RU', name: 'Русский' },
      { code: 'fa-IR', name: 'فارسی' },
      { code: 'vi-VN', name: 'Tiếng Việt' }
    ];

    const currentLanguage = computed(() => locale.value);

    const currentLanguageShort = computed(() => {
      const active = languages.find((lang) => lang.code === currentLanguage.value);
      return active?.name || 'English';
    });

    const toggleDropdown = () => {
      isOpen.value = !isOpen.value;
      if (isOpen.value) {
        nextTick(() => {
          if (!dropdown.value) return;
          const rect = dropdown.value.getBoundingClientRect();
          if (rect.right > window.innerWidth) {
            dropdown.value.style.right = '0';
            dropdown.value.style.left = 'auto';
          }
          if (rect.bottom > window.innerHeight) {
            dropdown.value.style.bottom = 'calc(100% + 8px)';
            dropdown.value.style.top = 'auto';
          }
        });
      }
    };

    const changeLanguage = async (langCode) => {
      try {
        if (currentLanguage.value === langCode) {
          isOpen.value = false;
          return;
        }

        const result = await setLanguage(langCode);

        if (!result?.success) {
          throw new Error(result?.message || 'Language switch failed');
        }

        if (checkLoginStatus()) {
          let storedUserLanguage = null;

          try {
            const infoResponse = await getUserInfo();
            const userData = infoResponse?.data?.data && typeof infoResponse.data.data === 'object'
              ? infoResponse.data.data
              : infoResponse?.data;
            storedUserLanguage = matchSupportedLanguage(extractUserLanguage(userData));
          } catch (e) {
          }

          if (storedUserLanguage !== langCode) {
            try {
              await updateUserLanguage(langCode);
            } catch (e) {
            }
          }
        }

        isOpen.value = false;
        const event = new CustomEvent('languageChanged', { detail: langCode });
        window.dispatchEvent(event);
      } catch (error) {
        console.error('Failed to switch language:', error);
        if (showToast) {
          showToast('Failed to switch language, please try again.', 'error');
        }
      }
    };

    const handleClickOutside = (event) => {
      const selector = document.querySelector('.language-selector');
      if (selector && !selector.contains(event.target)) {
        isOpen.value = false;
      }
    };

    onMounted(() => {
      document.addEventListener('click', handleClickOutside);
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
    });

    return {
      isOpen,
      languages,
      currentLanguage,
      currentLanguageShort,
      toggleDropdown,
      changeLanguage,
      dropdown
    };
  }
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles/base/variables.scss" as *;

.language-selector {
  position: relative;
  display: inline-block;
}

.language-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  height: 36px;
  padding: 6px 10px;
  border-radius: $border-radius-sm;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-primary);
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: #f5f7fa;
    border-color: transparent;
  }

  &.is-active {
    border-color: #e5e7eb;
    background: #f5f7fa;
  }

  .language-btn-text {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    line-height: 1;
  }

  .language-icon {
    color: var(--theme-color);
    font-size: $font-size-sm;
    line-height: 1;
  }
}

.language-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 140px;
  background: rgba(var(--card-background-rgb), 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: $border-radius-sm;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
  border: 1px solid var(--border-color);
  z-index: 200;
  overflow: hidden;
}

.language-item {
  padding: 10px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-size: $font-size-sm;

  &:hover {
    background-color: rgba(var(--theme-color-rgb), 0.1);
  }

  &.active {
    background-color: rgba(var(--theme-color-rgb), 0.18);
    color: var(--theme-color);
    font-weight: $font-weight-semibold;
  }
}

@media (max-width: 768px) {
  .language-btn {
    .language-btn-text {
      font-size: $font-size-md;
    }

    .language-icon {
      font-size: $font-size-md;
    }
  }

  .language-item {
    font-size: $font-size-md;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
