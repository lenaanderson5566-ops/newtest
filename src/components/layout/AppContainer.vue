<template>
  <main class="app-container" :class="[`mode-${mode}`]">
    <slot />
  </main>
</template>

<script>
export default {
  name: 'AppContainer',
  props: {
    mode: {
      type: String,
      default: 'default'
    }
  }
};
</script>

<style lang="scss" scoped>
.app-container {
  width: min(var(--layout-content-max-width), 100%);
  margin: 0 auto;
  padding: var(--layout-gap-y) var(--layout-padding-x-right) calc(84px + var(--safe-bottom)) var(--layout-padding-x);
  box-sizing: border-box;

  &.mode-shell {
    width: min(var(--layout-shell-max-width), 100%);
  }

  &.mode-full {
    width: 100%;
  }
}
</style>
