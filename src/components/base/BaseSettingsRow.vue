<template>
  <div class="base-settings-row">
    <div class="row-main">
      <div class="row-title">{{ title }}</div>
      <p v-if="description">{{ description }}</p>
    </div>
    <div class="row-action">
      <slot name="action" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'BaseSettingsRow',
  props: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    }
  }
};
</script>

<style scoped lang="scss">
.base-settings-row {
  min-height: 62px;
  padding: 12px 16px;
  border-top: 1px solid var(--border-color-soft);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.row-main { min-width: 0; }
.row-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}
.row-main p {
  margin: 3px 0 0;
  font-size: 12px;
  color: var(--secondary-text-color);
}

.row-action {
  display: inline-flex;
  align-items: center;
}

@media (max-width: 768px) {
  .base-settings-row {
    min-height: 58px;
    padding: 10px 12px;
  }
}
</style>
