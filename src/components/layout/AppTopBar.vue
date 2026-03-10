<template>
  <header class="top-fixed-bar">
    <div class="site-logo">
      <img v-if="siteConfig.showLogo" src="/images/logo.png" alt="Logo" class="site-logo-img" />
      <span class="site-name">{{ siteConfig.siteName }}</span>
    </div>

    <div class="top-toolbar">
      <ServiceNoticeButton :has-unread="hasUnreadNotice" aria-label="查看公告通知" />
      <LanguageSelector />
      <button v-if="showGiftCardRedeem" class="gift-btn" @click="$emit('navigate-profile')">
        <IconGift :size="18" />
      </button>
      <UserAvatar :username="username" :avatarUrl="avatarUrl" />
    </div>
  </header>
</template>

<script>
import LanguageSelector from '@/components/common/LanguageSelector.vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import ServiceNoticeButton from '@/components/common/ServiceNoticeButton.vue';
import { IconGift } from '@tabler/icons-vue';

export default {
  name: 'AppTopBar',
  components: { LanguageSelector, UserAvatar, ServiceNoticeButton, IconGift },
  emits: ['navigate-profile'],
  props: {
    siteConfig: { type: Object, required: true },
    username: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    hasUnreadNotice: { type: Boolean, default: false },
    showGiftCardRedeem: { type: Boolean, default: false }
  }
};
</script>

<style lang="scss" scoped>
.top-fixed-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--app-topbar-z);
  height: calc(var(--top-fixed-bar-height) + var(--safe-top));
  padding: var(--safe-top) var(--layout-padding-x-right) 0 var(--layout-padding-x);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--fx-glass-strong);
  border-bottom: 1px solid var(--fx-border);
  backdrop-filter: blur(18px);
}

.site-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.site-logo-img {
  width: 22px;
  height: 22px;
  border-radius: 6px;
}

.site-name {
  font-size: 14px;
  color: var(--fx-text);
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.top-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;

  :deep(.language-btn),
  :deep(.avatar-wrapper),
  .gift-btn {
    min-height: 34px;
    border-radius: 10px;
    border: 1px solid var(--fx-border);
    background: var(--fx-glass-soft);
  }

  .gift-btn {
    width: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--fx-text);
  }
}
</style>
