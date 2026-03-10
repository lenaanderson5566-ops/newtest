<template>
  <button class="base-list-row" type="button">
    <div class="row-main">
      <div class="row-title">{{ title }}</div>
      <p v-if="description">{{ description }}</p>
    </div>
    <div class="row-action">
      <slot name="action" />
    </div>
  </button>
</template>

<script>
export default {
  name: 'BaseListRow',
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
.base-list-row {
  width: 100%;
  min-height: 62px;
  padding: 12px 16px;
  border: none;
  border-top: 1px solid var(--border-color-soft);
  background: transparent;
  text-align: left;
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.base-list-row:hover { background: rgba(15, 23, 42, 0.03); }
.base-list-row:active { background: rgba(15, 23, 42, 0.06); }

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
  color: var(--secondary-text-color);
}

@media (max-width: 768px) {
  .base-list-row {
    min-height: 58px;
    padding: 10px 12px;
  }
}
</style>
