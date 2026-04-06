<template>

  <div class="not-found-container">



    

    

    <button class="back-button" @click="goBack">

      <IconArrowLeft :size="20" />

      {{ $t('common.back') }}

    </button>



    <div class="not-found-content">

      <h1 class="error-code">404</h1>

      <h2 class="error-title">{{ $t('errors.notFound') }}</h2>

      <p class="error-description">{{ $t('errors.notFoundDescription') }}</p>

      <button class="home-button" @click="goHome">

        <IconHome :size="20" />

        {{ $t('errors.backToHome') }}

      </button>

    </div>

  </div>

</template>



<script>

import { ref, onMounted } from 'vue';

import { useRouter } from 'vue-router';


import { IconArrowLeft, IconHome } from '@tabler/icons-vue';



export default {

  name: 'NotFound',

  components: {

    IconArrowLeft,

    IconHome,


  },

  setup() {

    const router = useRouter();

    const countDown = ref(5);

    


    

    const backToHome = () => {

      router.push('/login');

    };

    

    onMounted(() => {


      

      const timer = setInterval(() => {

        countDown.value--;

        if (countDown.value <= 0) {

          clearInterval(timer);

          backToHome();

        }

      }, 1000);

    });

    

    const goBack = () => {

      router.go(-1);

    };



    const goHome = () => {

      router.push('/');

    };



    return {

      countDown,

      backToHome,



      goBack,

      goHome

    };

  }

};

</script>



<style lang="scss" scoped>
@use "@/assets/styles/base/variables.scss" as *;
@use "@/assets/styles/base/typography.scss" as *;
.not-found-container {

  display: flex;

  flex-direction: column;

  min-height: 100vh;

  background-color: var(--bg-color);

  position: relative;

  padding: 16px;

  

  transform: translateZ(0);

}



.back-button {

  position: absolute;

  top: 20px;

  left: 20px;

  display: flex;

  align-items: center;

  gap: 8px;

  background: none;

  border: none;

  color: var(--theme-color);

  @extend %typo-item-title;

  padding: 8px 16px;

  border-radius: 8px;

  cursor: pointer;

  transition: background-color 0.2s ease;

  

  &:hover {

    background-color: rgba(var(--theme-color-rgb), 0.1);

  }

}



.not-found-content {

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  flex: 1;

  text-align: center;

  max-width: 600px;

  margin: 0 auto;

}



.error-code {
  @extend %typo-metric-lg;
  color: var(--theme-color);

  margin: 0;

  line-height: 1.2;

  letter-spacing: -2px;

  

  background: linear-gradient(45deg, var(--theme-color), rgba(var(--theme-color-rgb), 0.6));

  background-clip: text;

  -webkit-background-clip: text;

  color: transparent;

}



.error-title {
  @extend %typo-section-title;

  margin: 8px 0 16px;

}



.error-description {
  @extend %typo-body-text;
  font-size: $font-size-xl;

  line-height: 1.6;

  margin-bottom: 24px;

}



.home-button {

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 8px;

  background-color: var(--theme-color);

  color: var(--text-on-dark-primary);

  border: none;

  border-radius: 10px;

  padding: 8px 24px;

  @extend %typo-item-title;

  cursor: pointer;

  transition: transform 0.2s ease, background-color 0.2s ease;

  

  &:hover {

    background-color: rgba(var(--theme-color-rgb), 0.9);

    transform: translateY(-2px);

  }

  

  &:active {

    transform: translateY(0);

  }

}





@include down(md) {

  .error-code {

    font-size: $font-size-xl;

  }

  

  .error-description {

    font-size: $font-size-md;

  }

}

</style> 
