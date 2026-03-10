<template>
  <div class="base-tabs" role="tablist">
    <button
      v-for="item in items"
      :key="item.value"
      class="base-tab"
      :class="{ active: modelValue === item.value }"
      type="button"
      role="tab"
      :aria-selected="modelValue === item.value"
      @click="$emit('update:modelValue', item.value)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'BaseTabs',
  emits: ['update:modelValue'],
  props: {
    modelValue: {
      type: String,
      required: true
    },
    items: {
      type: Array,
      default: () => []
    }
  }
};
</script>

<style scoped lang="scss">
.base-tabs {
  display: inline-flex;
  gap: 6px;
  padding: 5px;
  border-radius: 10px;
  border: 1px solid var(--border-color-soft);
  background: var(--surface-subtle);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.65);
}

.base-tab {
  border: 0;
  background: transparent;
  color: var(--neutral-strong);
  min-height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(var(--theme-color-rgb), 0.08);
  }

  &.active {
    background: linear-gradient(135deg, var(--button-primary-start) 0%, var(--button-primary-end) 100%);
    color: #fff;
    box-shadow: 0 6px 14px rgba(var(--theme-color-rgb), 0.24);
  }
}

@media (max-width: 768px) {
  .base-tabs {
    width: 100%;
    justify-content: center;
  }

  .base-tab {
    flex: 1;
    text-align: center;
  }
}
</style>
