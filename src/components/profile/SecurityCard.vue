<template>
  <div class="profile-card">
    <div class="card-header">
      <h3>{{ title }}</h3>
    </div>
    <div class="settings-content">
      <button class="action-btn" @click="$router.push(path)">
        <IconLock :size="18" />
        <div class="btn-text">
          <span>{{ label }}</span>
          <small>{{ subtitle }}</small>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { IconLock } from '@tabler/icons-vue';

defineProps({
  title: { type: String, default: '' },
  label: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  path: { type: String, default: '/security' }
});
</script>

<style scoped lang="scss">
.action-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  .btn-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    small { opacity: 0.7; }
  }
}
</style>
