<template>

  <div class="main-board">

    <!-- 域名授权验证提示 - 如果不需要域名授权功能，移除此组件即可 -->


    

    <!-- 内容区域 - 路由视图 -->

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

import { onMounted } from 'vue';






export default {

  name: 'MainBoard',

  components: {


  },

  setup() {




    onMounted(() => {


    });





  }

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

  padding: 0 0 calc(2px + env(safe-area-inset-bottom, 0px));

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
