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
