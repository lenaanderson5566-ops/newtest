<template>
  <div class="main-board">
    <div class="content-area">
      <router-view v-slot="{ Component }">
        <transition name="content-transition" mode="out-in" appear>
          <div class="view-wrapper" :key="$route.path">
            <component :is="Component" />
          </div>
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MainBoard'
};
</script>

<style lang="scss" scoped>
.main-board {
  position: relative;
  overflow-x: hidden;
  z-index: 1;
}

.content-area {
  width: 100%;
  padding: 0;
  box-sizing: border-box;
}

.content-transition-enter-active,
.content-transition-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.content-transition-enter-from,
.content-transition-leave-to {
  opacity: 0;
  transform: translateY(3px);
}

.view-wrapper {
  width: 100%;
  height: 100%;
}
</style>
