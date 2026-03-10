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
