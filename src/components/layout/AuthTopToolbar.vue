<template>
  <div class="auth-toolbar">
    <div class="top-toolbar">
      <LanguageSelector />
    </div>
  </div>
</template>

<script>
import LanguageSelector from '@/components/common/LanguageSelector.vue';

export default {
  name: 'AuthTopToolbar',
  components: {
    LanguageSelector
  }
};
</script>

<style lang="scss" scoped>
.auth-toolbar {
  position: fixed;
  top: var(--safe-top);
  right: 0;
  z-index: var(--toolbar-z);

  .top-toolbar {
    position: fixed;
    top: 20px;
    right: 25px;
    display: flex;
    gap: 16px;
    z-index: var(--toolbar-z);
  }
}

@media (max-width: 768px) {
  .auth-toolbar .top-toolbar {
    top: 12px;
    right: 12px;
    gap: 10px;
  }
}
</style>
