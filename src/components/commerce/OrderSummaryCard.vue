<template>
  <div class="section-wrapper" :class="sectionClass">
    <div v-if="showHeader" class="section-title">
      <slot name="title">
        <span>{{ title }}</span>
      </slot>
    </div>

    <slot />
  </div>
</template>

<script>
export default {
  name: "OrderSummaryCard",
  props: {
    title: {
      type: String,
      default: "",
    },
    sectionClass: {
      type: String,
      default: "",
    },
    showHeader: {
      type: Boolean,
      default: true,
    },
  },
};
</script>
