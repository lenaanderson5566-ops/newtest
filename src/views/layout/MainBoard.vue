<template>
  <div class="main-board">
    <AppContainer class="content-area" mode="default">
      <router-view v-slot="{ Component }">
        <transition name="content-transition" mode="out-in" appear>
          <section class="view-wrapper" :key="$route.path">
            <component :is="Component" />
          </section>
        </transition>
      </router-view>
    </AppContainer>
  </div>
</template>

<script>
import AppContainer from '@/components/layout/AppContainer.vue';

export default {
  name: 'MainBoard',
  components: { AppContainer }
};
</script>

<style lang="scss" scoped>
.main-board {
  min-height: calc(100dvh - var(--top-fixed-bar-height));
  position: relative;
  z-index: var(--app-content-z);
}

.content-area {
  padding-top: 0;
}

.view-wrapper {
  width: 100%;
}

.content-transition-enter-active,
.content-transition-leave-active {
  transition: opacity .25s ease, transform .25s ease;
}

.content-transition-enter-from,
.content-transition-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
