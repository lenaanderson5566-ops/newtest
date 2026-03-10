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
  border: 1px solid var(--app-card-border-color);
  border-radius: var(--app-card-radius);
  background: var(--app-card-bg);
  box-shadow: var(--app-card-shadow);
  overflow: hidden;
}

.base-card-header {
  padding: var(--app-card-header-padding);
  border-bottom: 1px solid var(--app-card-border-color);
}

.base-card-title {
  margin: 0;
  font-size: var(--app-card-title-size);
  font-weight: var(--app-card-title-weight);
  color: var(--text-color);
}

.base-card-body {
  padding: var(--app-card-body-padding);
}

.base-card.density-comfortable .base-card-header {
  padding: var(--app-card-header-padding);
}

@media (max-width: 768px) {
  .base-card {
    border-radius: var(--app-card-radius-mobile);
  }

  .base-card-header {
    padding: var(--app-card-header-padding-mobile);
  }

  .base-card-body {
    padding: var(--app-card-body-padding-mobile);
  }
}
</style>
