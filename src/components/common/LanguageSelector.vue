<template>
  <div class="language-selector">
    <button
      class="language-btn"
      @click="toggleDropdown"
      :title="$t('common.language')"
    >
      <span class="language-btn-text"><span class="language-icon" aria-hidden="true">🌐</span>{{ currentLanguageShort }}</span>
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
import { setLanguage } from '@/i18n';

export default {
  name: 'LanguageSelector',
  setup() {
    const { locale } = useI18n();
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

    const changeLanguage = (langCode) => {
      setLanguage(langCode);
      isOpen.value = false;
      const event = new CustomEvent('languageChanged', { detail: langCode });
      window.dispatchEvent(event);
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
.language-selector {
  position: relative;
  display: inline-block;
}

.language-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  height: 38px;
  padding: 0 12px;
  border-radius: 999px;
  background-color: color-mix(in srgb, var(--card-bg-color, var(--card-background)) 92%, #fff 8%);
  border: 1px solid rgba(148, 163, 184, 0.24);
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    background-color: color-mix(in srgb, var(--card-bg-color, var(--card-background)) 88%, rgba(var(--theme-color-rgb), 0.08));
    border-color: rgba(var(--theme-color-rgb), 0.45);
    transform: translateY(-1px);
  }

  .language-btn-text {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
  }

  .language-icon {
    color: var(--theme-color);
    font-size: 14px;
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
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color);
  z-index: 200;
  overflow: hidden;
}

.language-item {
  padding: 10px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-size: 14px;

  &:hover {
    background-color: rgba(var(--theme-color-rgb), 0.1);
  }

  &.active {
    background-color: rgba(var(--theme-color-rgb), 0.18);
    color: var(--theme-color);
    font-weight: 600;
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
