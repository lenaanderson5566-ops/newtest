<template>
  <section class="base-card" :class="[`density-${density}`]">
    <header v-if="$slots.header || title" class="base-card-header">
      <slot name="header">
        <h3 class="base-card-title">{{ title }}</h3>
      </slot>
    </header>
    <div class="base-card-body">
      <slot />
    </div>
  </section>
</template>

<script>
export default {
  name: 'BaseCard',
  props: {
    title: {
      type: String,
      default: ''
    },
    density: {
      type: String,
      default: 'default'
    }
  }
};
</script>

<style scoped lang="scss">
.base-card {
  border: 1px solid var(--border-color-soft);
  border-radius: var(--radius-lg);
  background: var(--card-level-2);
  box-shadow: var(--shadow-card-sm);
  overflow: hidden;
}

.base-card-header {
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--border-color-soft);
}

.base-card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-color);
}

.base-card-body {
  padding: 0;
}

.base-card.density-comfortable .base-card-header {
  padding: 16px;
}

@media (max-width: 768px) {
  .base-card-header {
    padding: 12px 12px 8px;
  }
}
</style>
