<template>
  <component
    :is="tag"
    class="info-card"
    :class="[{ 'is-clickable': clickable }, variantClass]"
    :type="tag === 'button' ? buttonType : undefined"
    @click="$emit('click', $event)"
  >
    <div v-if="$slots.icon" class="info-card-icon">
      <slot name="icon" />
    </div>
    <div class="info-card-content">
      <div v-if="$slots.header || $slots.title || $slots.action" class="info-card-header">
        <slot name="header">
          <h3 v-if="$slots.title" class="info-card-title">
            <slot name="title" />
          </h3>
        </slot>
        <div v-if="$slots.action" class="info-card-action">
          <slot name="action" />
        </div>
      </div>
      <div v-if="$slots.default || $slots.description || $slots.meta" class="info-card-body">
        <slot />
        <p v-if="$slots.description" class="info-card-description">
          <slot name="description" />
        </p>
        <p v-if="$slots.meta" class="info-card-meta">
          <slot name="meta" />
        </p>
      </div>
    </div>
    <div v-if="$slots.suffix" class="info-card-suffix">
      <slot name="suffix" />
    </div>
  </component>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  tag: {
    type: String,
    default: 'div'
  },
  clickable: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: 'default'
  },
  buttonType: {
    type: String,
    default: 'button'
  }
});

defineEmits(['click']);

const variantClass = computed(() => `info-card--${props.variant}`);
</script>

<style scoped lang="scss">
@use "@/assets/styles/base/variables.scss" as *;
.info-card {
  --info-card-padding: var(--space-4);
  --info-card-radius: var(--radius-lg);
  --info-card-border: var(--border-default);
  --info-card-bg: rgba(var(--card-background-rgb), 0.95);

  width: 100%;
  border-radius: var(--info-card-radius);
  border: 1px solid var(--info-card-border);
  background: var(--info-card-bg);
  box-shadow: var(--shadow-sm);
  padding: var(--info-card-padding);
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  text-align: left;
}

.info-card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.info-card-content {
  flex: 1;
  min-width: 0;
}

.info-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.info-card-title {
  margin: 0;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
}

.info-card-body {
  margin-top: var(--space-2);
}

.info-card-description,
.info-card-meta {
  margin: 0;
  color: var(--text-tertiary);
  font-size: $font-size-md;
  line-height: 1.45;
}

.info-card-meta {
  margin-top: var(--space-1);
  font-size: $font-size-sm;
}

.info-card-action,
.info-card-suffix {
  display: inline-flex;
  align-items: center;
}

.is-clickable {
  cursor: pointer;
  transition: transform var(--motion-duration-fast), box-shadow var(--motion-duration-fast), border-color var(--motion-duration-fast);

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(var(--theme-color-rgb), 0.28);
    box-shadow: var(--shadow-sm);
  }
}
</style>
