<template>
  <div class="top-fixed-bar">
    <div class="site-logo">
      <img v-if="siteConfig.showLogo" src="/images/logo.png" alt="Logo" class="site-logo-img" />
      {{ siteConfig.siteName }}
    </div>

    <div class="top-toolbar">
      <ServiceNoticeButton :has-unread="hasUnreadNotice" aria-label="查看公告通知" />
      <LanguageSelector />
      <button
        v-if="showGiftCardRedeem"
        class="gift-btn"
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
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.site-logo {
  font-size: var(--site-logo-size);
  font-weight: 700;
  color: var(--theme-color);
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  gap: var(--site-logo-gap);

  .site-logo-img {
    height: var(--site-logo-icon-size);
    width: var(--site-logo-icon-size);
    border-radius: var(--logo-radius);
    object-fit: cover;
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

  .gift-btn {
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
    transition: all 0.3s ease;

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
    transition: background-color 0.2s ease, border-color 0.2s ease;

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
    font-size: var(--site-logo-size-mobile);
  }

  :deep(.language-btn) {
    min-width: var(--toolbar-language-min-width);
    font-size: var(--site-logo-size-mobile);
  }
}

@media (max-width: 768px) {
  .site-logo {
    font-size: var(--site-logo-size-mobile);
    gap: var(--site-logo-gap-mobile);

    .site-logo-img {
      width: var(--site-logo-icon-size-mobile);
      height: var(--site-logo-icon-size-mobile);
    }
  }

  .top-toolbar {
    gap: var(--toolbar-control-gap);
    flex-wrap: nowrap;
    justify-content: flex-end;
  }
}
</style>
