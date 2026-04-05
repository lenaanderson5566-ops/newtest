<template>

  <div class="custom-landing-container">

    <!-- 全屏加载动画 -->

    <div

        v-if="shouldShowPreloader"

        class="preloader"

        :class="{'fade-out': isLoaded}"

        ref="preloader"

        :style="preloaderStyle"

    >

      <div class="loader" :style="loaderStyle"></div>

    </div>






    <!-- iframe用于加载自定义landing页面 -->

    <iframe

        v-if="customLandingPath"

        :src="customLandingPath"

        class="custom-landing-iframe"

        ref="landingIframe"

        frameborder="0"

        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"

        allowfullscreen

        @load="handleIframeLoaded"

    ></iframe>



    <!-- 如果没有授权码或未指定自定义landing页，显示默认landing页 -->

    <div v-else>

      <LandingPage @loaded="handleContentLoaded" />

    </div>

  </div>

</template>



<script>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { SITE_CONFIG, DEFAULT_CONFIG } from '@/utils/baseConfig';
import LandingPage from './LandingPage.vue';

export default {
  name: 'CustomLandingPage',
  components: {
    LandingPage
  },
  setup() {
    const router = useRouter();
    const landingIframe = ref(null);
    const preloader = ref(null);
    const isLoaded = ref(false);

    const preloaderStyle = computed(() => ({
      backgroundColor: 'var(--color-bg-page)'
    }));

    const parseHexToRgb = (hex) => {
      const normalized = String(hex || '').trim().replace(/^#/, '');
      const fullHex = normalized.length === 3
        ? normalized.split('').map((v) => v + v).join('')
        : normalized;

      if (!/^[0-9a-fA-F]{6}$/.test(fullHex)) {
        return '53, 92, 194';
      }

      return [
        parseInt(fullHex.slice(0, 2), 16),
        parseInt(fullHex.slice(2, 4), 16),
        parseInt(fullHex.slice(4, 6), 16)
      ].join(', ');
    };

    const loaderStyle = computed(() => {
      const primaryColor = DEFAULT_CONFIG.primaryColor || '#355cc2';
      return {
        '--loader-primary-color': primaryColor,
        '--loader-primary-rgb': parseHexToRgb(primaryColor),
        '--loader-primary-light': primaryColor,
      };
    });

    const handleIframeMessage = (event) => {
      if (event.data && event.data.type === 'navigation') {
        router.push('/' + event.data.route);
      }
    };

    const handleIframeLoaded = () => {
      setTimeout(() => {
        hidePreloader();
      }, 500);
    };

    const handleContentLoaded = () => {
      hidePreloader();
    };

    const PRELOADER_KEY = 'ez_preloader_shown';
    const shouldShowPreloader = ref(sessionStorage.getItem(PRELOADER_KEY) !== '1');

    const hidePreloader = () => {
      isLoaded.value = true;
      sessionStorage.setItem(PRELOADER_KEY, '1');
      shouldShowPreloader.value = false;
    };

    onMounted(async () => {
      if (sessionStorage.getItem(PRELOADER_KEY) === '1') {
        isLoaded.value = true;
        if (preloader.value) preloader.value.style.display = 'none';
      }

      window.addEventListener('message', handleIframeMessage);

      setTimeout(() => {
        if (!isLoaded.value) {
          hidePreloader();
        }
      }, 5000);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('message', handleIframeMessage);
    });

    const customLandingPath = computed(() => {
      if (!SITE_CONFIG.customLandingPage) return '';

      let path = SITE_CONFIG.customLandingPage;
      if (!path.startsWith('/') && !path.startsWith('http://') && !path.startsWith('https://')) {
        path = '/' + path;
      }
      return path;
    });

    return {
      customLandingPath,
      landingIframe,
      preloader,
      isLoaded,
      shouldShowPreloader,
      preloaderStyle,
      loaderStyle,
      handleIframeLoaded,
      handleContentLoaded
    };
  }
};
</script>



<style lang="scss" scoped>

.custom-landing-container {

  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;

}



.custom-landing-iframe {

  width: 100%;

  height: 100%;
  min-height: 100vh;
  min-height: 100dvh;

  border: none;
  display: block;

}





.preloader {

  position: fixed;

  top: 0;

  left: 0;

  width: 100%;

  height: 100%;

  background-color: var(--color-bg-surface);

  display: flex;

  justify-content: center;

  align-items: center;

  z-index: 9999;

  transition: opacity 0.8s ease, visibility 0.8s ease;

}



.preloader.fade-out {

  opacity: 0;

  visibility: hidden;

}



.loader {

  width: 50px;

  height: 50px;

  border-radius: 50%;

  border-top-color: var(--loader-primary-color);

  animation: spin 1s ease-in-out infinite;

  position: relative;

}



.loader::before {

  content: '';

  position: absolute;

  top: -3px;

  left: -3px;

  right: -3px;

  bottom: -3px;

  border: 3px solid transparent;

  border-bottom-color: var(--loader-primary-light);

  border-radius: 50%;

  animation: spin 1.5s linear infinite;

}



@keyframes spin {

  0% {

    transform: rotate(0deg);

  }

  100% {

    transform: rotate(360deg);

  }

}

</style>
