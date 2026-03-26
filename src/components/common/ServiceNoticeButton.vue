<template>
  <button
    class="service-notice-button"
    type="button"
    :aria-label="ariaLabel"
    @click="goToAnnouncements"
  >
    <IconBell :size="18" aria-hidden="true" />
    <span v-if="hasUnread" class="notice-dot" aria-hidden="true"></span>
  </button>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { IconBell } from '@tabler/icons-vue';

const props = defineProps({
  hasUnread: {
    type: Boolean,
    default: false
  },
  ariaLabel: {
    type: String,
    default: '查看公告'
  }
});

const router = useRouter();

const goToAnnouncements = () => {
  router.push('/announcements');
};
</script>

<style scoped lang="scss">
@use "@/assets/styles/base/variables.scss" as *;

.service-notice-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  min-width: 40px;
  height: 40px;
  min-height: 40px;
  border-radius: $border-radius-sm;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: #f5f7fa;
  }

  &:active {
    border-color: #e5e7eb;
    background: #f5f7fa;
  }
}

.notice-dot {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #ef4444;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.95);
}
</style>
