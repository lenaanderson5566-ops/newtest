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
    top: var(--auth-toolbar-top-offset);
    right: var(--auth-toolbar-right-offset);
    display: flex;
    gap: var(--auth-toolbar-gap);
    z-index: var(--toolbar-z);
  }
}

@media (max-width: 768px) {
  .auth-toolbar .top-toolbar {
    top: var(--auth-toolbar-top-offset-mobile);
    right: var(--auth-toolbar-right-offset-mobile);
    gap: var(--auth-toolbar-gap-mobile);
  }
}
</style>
