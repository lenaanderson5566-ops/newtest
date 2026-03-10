<template>
  <div class="top-fixed-bar">
    <div class="site-brand">
      <img v-if="siteConfig.showLogo" src="/images/logo.png" alt="Logo" class="site-logo-img" />
      <div class="site-brand-text">
        <span class="site-logo">{{ siteConfig.siteName }}</span>
      </div>
    </div>

    <div class="top-toolbar">
      <ServiceNoticeButton class="toolbar-control" :has-unread="hasUnreadNotice" aria-label="查看公告通知" />
      <LanguageSelector />
      <button
        v-if="showGiftCardRedeem"
        class="gift-btn toolbar-control"
        @click="$emit('navigate-profile')"
      >
        <IconGift :size="18" />
      </button>
      <UserAvatar :username="username" :avatarUrl="avatarUrl" />
    </div>
  </div>
</template>

<script>
import LanguageSelector from '@/components/common/LanguageSelector.vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import ServiceNoticeButton from '@/components/common/ServiceNoticeButton.vue';
import { IconGift } from '@tabler/icons-vue';

export default {
  name: 'AppTopBar',
  components: {
    LanguageSelector,
    UserAvatar,
    ServiceNoticeButton,
    IconGift
  },
  emits: ['navigate-profile'],
  props: {
    siteConfig: {
      type: Object,
      required: true
    },
    username: {
      type: String,
      default: ''
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    hasUnreadNotice: {
      type: Boolean,
      default: false
    },
    showGiftCardRedeem: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style lang="scss" scoped>
.top-fixed-bar {
  height: calc(var(--top-fixed-bar-height) + var(--safe-top));
  position: fixed;
  top: 0;
  padding-top: var(--safe-top);
  left: 0;
  right: 0;
  background: var(--topbar-surface);
  backdrop-filter: var(--surface-blur-strong);
  -webkit-backdrop-filter: var(--surface-blur-strong);
  border-bottom: 1px solid var(--surface-border-weak);
  box-shadow: var(--topbar-shadow);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--layout-padding-x-right) 0 var(--layout-padding-x);
  z-index: var(--app-topbar-z);
  transition: background-color var(--app-topbar-transition-duration) var(--app-transition-ease), box-shadow var(--app-topbar-transition-duration) var(--app-transition-ease);
  gap: var(--space-2);
}

.site-brand {
  display: flex;
  align-items: center;
  gap: var(--site-logo-gap-mobile);
  min-width: 0;

  .site-brand-text {
    min-width: 0;
  }

  .site-logo {
    display: block;
    font-size: var(--site-logo-size-mobile);
    font-weight: 700;
    color: var(--theme-color);
    letter-spacing: -0.3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .site-logo-img {
    height: var(--site-logo-icon-size-mobile);
    width: var(--site-logo-icon-size-mobile);
    border-radius: var(--logo-radius);
    object-fit: cover;
    flex-shrink: 0;
  }
}

.top-toolbar {
  --toolbar-control-border: transparent;
  --toolbar-control-bg: transparent;
  --toolbar-control-hover-bg: var(--app-toolbar-control-hover-bg);
  --toolbar-control-active-border: var(--app-toolbar-control-active-border);

  position: static;
  display: flex;
  align-items: center;
  gap: var(--toolbar-control-gap);
  z-index: var(--toolbar-z);

  .toolbar-control {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--toolbar-control-height);
    height: var(--toolbar-control-height);
    border-radius: 50%;
    background: var(--toolbar-control-bg);
    border: 1px solid var(--toolbar-control-border);
    box-shadow: var(--toolbar-control-shadow);
    color: var(--text-color);
    cursor: pointer;
    transition: all var(--app-control-transition-duration) var(--app-transition-ease);
    flex-shrink: 0;

    &:hover {
      border-color: rgba(var(--theme-color-rgb), 0.45);
      color: var(--theme-color);
      box-shadow: var(--toolbar-control-shadow-hover);
      transform: translateY(-1px);
    }
  }

  :deep(.language-btn),
  :deep(.avatar-wrapper) {
    min-height: var(--toolbar-control-height);
    padding: var(--toolbar-control-padding);
    border: 1px solid var(--toolbar-control-border);
    background: var(--toolbar-control-bg);
    border-radius: var(--toolbar-control-radius);
    transition: background-color var(--app-topbar-transition-duration) var(--app-transition-ease), border-color var(--app-topbar-transition-duration) var(--app-transition-ease);

    &:hover {
      background: var(--toolbar-control-hover-bg);
    }

    &:active,
    &.is-active {
      border-color: var(--toolbar-control-active-border);
      background: var(--toolbar-control-hover-bg);
    }
  }

  :deep(.avatar-wrapper) {
    width: auto;
    min-width: var(--toolbar-control-height);
    font-size: var(--font-size-1);
  }

  :deep(.language-btn) {
    min-width: var(--toolbar-language-min-width);
    font-size: var(--font-size-1);
  }
}

@media (min-width: 769px) {
  .site-brand {
    gap: var(--site-logo-gap);

    .site-logo {
      font-size: var(--site-logo-size);
    }

    .site-logo-img {
      width: var(--site-logo-icon-size);
      height: var(--site-logo-icon-size);
    }
  }
}

@media (max-width: 768px) {
  .top-fixed-bar {
    padding-inline: var(--space-2);
  }

  .site-brand {
    max-width: 40%;
  }

  .top-toolbar {
    gap: var(--space-1);
    justify-content: flex-end;

    :deep(.language-text) {
      display: none;
    }

    :deep(.language-btn) {
      min-width: var(--toolbar-control-height);
      width: var(--toolbar-control-height);
      padding-inline: 0;
    }
  }
}
</style>
