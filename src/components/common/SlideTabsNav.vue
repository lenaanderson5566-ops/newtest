<template>

  <div class="slide-tabs-container">

    <div class="slide-tabs-wrapper">

      <div class="slide-tabs-nav" ref="tabsNav">

        <template v-for="(item, index) in navItems" :key="`${item.name}-${languageKey}`">

          <router-link 

            :to="item.path"

            class="nav-item"

            :class="{ 'active': currentRoute === item.name || (route && route.meta && route.meta.activeNav === item.name) }"

            @click.prevent="navigateTo(item, index)"

          >

            <div class="nav-icon">

              <component :is="getIcon(item.icon)" />

            </div>

            <span class="nav-text">{{ $t(`menu.${item.i18nKey}`) }}</span>

          </router-link>

        </template>

        <div class="indicator-container">

          <div class="slider-indicator" :style="sliderStyle"></div>

        </div>

      </div>

    </div>

  </div>

</template>



<script>

import { ref, onMounted, watch, nextTick, onBeforeUnmount, computed, reactive, onUnmounted } from 'vue';

import { useRoute, useRouter } from 'vue-router';

import IconDashboard from '@/components/icons/IconDashboard.vue';

import IconFileText from '@/components/icons/IconFileText.vue';

import IconUser from '@/components/icons/IconUser.vue';

import { IconServer } from '@tabler/icons-vue';



export default {

  name: 'SlideTabsNav',

  setup() {

    const route = useRoute();

    const router = useRouter();

    const tabsNav = ref(null);

    const currentRoute = ref('');

    const currentIndex = ref(0);

    const previousIndex = ref(0);

    const isInitialized = ref(false);

    const isTransitionEnabled = ref(false);

    const isComponentMounted = ref(false);

    const languageKey = ref(Date.now());

    

    const sliderState = reactive({

      width: 0,

      transform: 'translateX(0px)',

      opacity: 0,

      transition: 'none'
      
    });

    

    const sliderStyle = computed(() => ({

      width: `${sliderState.width}px`,

      transform: sliderState.transform,

      opacity: sliderState.opacity,

      transition: sliderState.transition

    }));



    const navItems = [
      { title: 'Dashboard', path: '/dashboard', name: 'Dashboard', icon: 'IconDashboard', i18nKey: 'overview' },
      { title: 'Nodes', path: '/nodes', name: 'Nodes', icon: 'IconServer', i18nKey: 'region' },
      { title: 'Docs', path: '/docs', name: 'Docs', icon: 'IconFileText', i18nKey: 'usage' },
      { title: 'Profile', path: '/profile', name: 'Profile', icon: 'IconUser', i18nKey: 'my' }
    ];

    const getIcon = (iconName) => {

      switch(iconName) {

        case 'IconDashboard': return IconDashboard;

        case 'IconFileText': return IconFileText;

        case 'IconServer': return IconServer;


        case 'IconUser': return IconUser;

        default: return null;

      }

    };

    

    let positionTimers = [];



    const navigateTo = (item, index) => {

      if (!isComponentMounted.value) return;

      

      previousIndex.value = currentIndex.value;

      currentIndex.value = index;

      updateSliderPosition(index, true);

      

      nextTick(() => {

        if (isComponentMounted.value) {

          router.push(item.path);

        }

      });

    };



    const updateSliderPosition = (index, animate = true) => {

      if (!isComponentMounted.value || index < 0 || !tabsNav.value) return;

      

      positionTimers.forEach(timer => clearTimeout(timer));

      positionTimers = [];

      

      try {

        nextTick(() => {

          if (!isComponentMounted.value || !tabsNav.value) return;

          

          const navItemElements = tabsNav.value.querySelectorAll('.nav-item');

          

          if (navItemElements.length > 0 && index >= 0 && index < navItemElements.length) {

            const activeItem = navItemElements[index];

            const { offsetWidth, offsetLeft } = activeItem;

            

            if (animate) {

              sliderState.transition = 'all 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)';

            } else {

              sliderState.transition = 'none';

            }

            

            sliderState.width = offsetWidth;

            sliderState.transform = `translateX(${offsetLeft}px)`;

            

            sliderState.opacity = 1;

            

            isInitialized.value = true;

          }

        });

      } catch (error) {

        console.warn('SlideTabsNav: Error updating slider position', error);

      }

    };



    const findIndexByRouteName = (routeName) => {

      if (route && route.meta && route.meta.activeNav) {

        const activeNavName = route.meta.activeNav;

        const activeIndex = navItems.findIndex(item => item.name === activeNavName);

        

        if (activeIndex !== -1) {

          return activeIndex;

        }

      }

      

      const index = navItems.findIndex(item => item.name === routeName);

      return index !== -1 ? index : 0; 
    };

    

    const handleResize = () => {

      if (isComponentMounted.value) {

        updateSliderPosition(currentIndex.value, false);

        

        safeTimeout(() => {

          updateSliderPosition(currentIndex.value, true);

        }, 200);

      }

    };



    let stopRouteWatch = null;

    

    const handleVisibilityChange = () => {

      if (!isComponentMounted.value) return;

      

      if (!document.hidden && currentIndex.value >= 0) {

        updateSliderPosition(currentIndex.value, false);

        

        if (isComponentMounted.value) {

          const timer = setTimeout(() => {

            if (isComponentMounted.value) {

              updateSliderPosition(currentIndex.value, true);

            }

          }, 200);

          

          positionTimers.push(timer);

        }

      }

    };



    const safeTimeout = (callback, delay) => {

      const timer = setTimeout(() => {

        if (isComponentMounted.value) {

          callback();

        }

      }, delay);

      

      positionTimers.push(timer);

      return timer;

    };



    let positionCheckInterval = null;

    

    const checkAndFixSliderPosition = () => {

      if (!isComponentMounted.value || !tabsNav.value) return;

      

      try {

        const navItemElements = tabsNav.value.querySelectorAll('.nav-item');

        

        let activeIndex;

        if (route && route.meta && route.meta.activeNav) {

          const activeNavName = route.meta.activeNav;

          const indexByActiveNav = navItems.findIndex(item => item.name === activeNavName);

          if (indexByActiveNav !== -1) {

            activeIndex = indexByActiveNav;

          } else {

            activeIndex = findIndexByRouteName(route.name);

          }

        } else {

          activeIndex = findIndexByRouteName(route.name);

        }

        

        if (navItemElements.length > 0 && activeIndex >= 0 && activeIndex < navItemElements.length) {

          const activeItem = navItemElements[activeIndex];

          const { offsetWidth, offsetLeft } = activeItem;

          

          const currentTransform = sliderState.transform;

          const expectedTransform = `translateX(${offsetLeft}px)`;

          

          if (currentTransform !== expectedTransform || sliderState.width !== offsetWidth) {

            updateSliderPosition(activeIndex, true);

          }

        }

      } catch (error) {

        console.warn('SlideTabsNav: Error checking slider position', error);

      }

    };

    

    const handleScroll = debounce(() => {

      if (isComponentMounted.value) {

        checkAndFixSliderPosition();

      }

    }, 200);

    

    const onLanguageChanged = () => {

      languageKey.value = Date.now();

      

      sliderState.transition = 'width 0.6s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.3s ease';

      

      sliderState.opacity = 0.3;

      

      [50, 200, 400, 600].forEach(delay => {

        safeTimeout(() => {

          if (isComponentMounted.value && tabsNav.value) {

            if (delay >= 400) {

              sliderState.opacity = 1;

            }

            updateSliderPosition(currentIndex.value, true);

          }

        }, delay);

      });

    };



    onMounted(() => {

      isComponentMounted.value = true;

      



      document.addEventListener('visibilitychange', handleVisibilityChange);

      

      window.addEventListener('languageChanged', onLanguageChanged);

      

      isTransitionEnabled.value = false;

      

      stopRouteWatch = watch(() => route.name, (newRoute) => {

        if (!isComponentMounted.value) return;

        

        if (newRoute) {

          currentRoute.value = newRoute;

          

          let newIndex;

          if (route.meta && route.meta.activeNav) {

            const activeNavName = route.meta.activeNav;

            const indexByActiveNav = navItems.findIndex(item => item.name === activeNavName);

            if (indexByActiveNav !== -1) {

              newIndex = indexByActiveNav;

            } else {

              newIndex = findIndexByRouteName(newRoute);

            }

          } else {

            newIndex = findIndexByRouteName(newRoute);

          }

          

          previousIndex.value = currentIndex.value;

          currentIndex.value = newIndex;

          

          updateSliderPosition(newIndex, true);

        }

      }, { immediate: true });

      

      nextTick(() => {

        if (!isComponentMounted.value) return;

        

        const index = findIndexByRouteName(route.name);

        updateSliderPosition(index, false);

        

        safeTimeout(() => {

          isTransitionEnabled.value = true;

        }, 300);

      });

      

      [100, 300, 500, 1000].forEach(delay => {

        safeTimeout(() => {

          if (tabsNav.value) {

            const index = findIndexByRouteName(route.name);

            updateSliderPosition(index, delay > 300);

          }

        }, delay);

      });

      

      safeTimeout(() => {

        if (isComponentMounted.value && tabsNav.value) {

          const index = findIndexByRouteName(route.name);

          updateSliderPosition(index, false);

          safeTimeout(() => {

            updateSliderPosition(index, true);

          }, 50);

        }

      }, 1500);

      

      window.addEventListener('load', () => {

        if (isComponentMounted.value && tabsNav.value) {

          const index = findIndexByRouteName(route.name);

          updateSliderPosition(index, false);

          safeTimeout(() => {

            updateSliderPosition(index, true);

          }, 100);

        }

      });

      

      const debouncedResize = debounce(handleResize, 100);

      window.addEventListener('resize', debouncedResize);

      

      window.addEventListener('scroll', handleScroll, { passive: true });

      

      positionCheckInterval = setInterval(() => {

        if (isComponentMounted.value) {

          checkAndFixSliderPosition();

        }

      }, 3000);

      

      safeTimeout(() => {

        handleResize();

      }, 1500);

      

      window.addEventListener('popstate', () => {

        if (isComponentMounted.value && tabsNav.value) {

          safeTimeout(() => {

            const index = findIndexByRouteName(route.name);

            updateSliderPosition(index, false);

            safeTimeout(() => {

              updateSliderPosition(index, true);

            }, 50);

          }, 0);

        }

      });

    });

    

    onUnmounted(() => {

      if (stopRouteWatch) {

        stopRouteWatch();

        stopRouteWatch = null;

      }

      

      if (positionCheckInterval) {

        clearInterval(positionCheckInterval);

        positionCheckInterval = null;

      }

      

      window.removeEventListener('popstate', () => {});

    });

    

    onBeforeUnmount(() => {

      isComponentMounted.value = false;


      

      positionTimers.forEach(timer => clearTimeout(timer));

      positionTimers = [];

      

      document.removeEventListener('visibilitychange', handleVisibilityChange);

      window.removeEventListener('languageChanged', onLanguageChanged);

      window.removeEventListener('resize', handleResize);

      window.removeEventListener('scroll', handleScroll);

      

      tabsNav.value = null;

    });



    return {

      navItems,

      tabsNav,

      currentRoute,

      navigateTo,

      sliderStyle,

      getIcon,

      languageKey,

      route

    };

  }

};



function debounce(fn, delay) {

  let timer = null;

  return function(...args) {

    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {

      fn.apply(this, args);

    }, delay);

  };

}

</script>



<style lang="scss" scoped>
.slide-tabs-container {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 12px;
  z-index: 20;
  width: min(94vw, 460px);

  .slide-tabs-wrapper {
    background: rgba(var(--card-background-rgb), 0.98);
    border-radius: 18px;
    padding: 3px;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
    border: 1px solid var(--border-color);
    overflow: hidden;
    width: 100%;
  }

  .slide-tabs-nav {
    display: flex;
    width: 100%;
    justify-content: space-between;
    flex-direction: row;
    flex-wrap: nowrap;
    overflow: hidden;
    gap: 0;
    padding: 2px;
    position: relative;

    .indicator-container,
    .slider-indicator {
      display: none;
    }

    .nav-item {
      flex: 1 1 0;
      min-width: 0;
      padding: 6px 8px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 12px;
      color: var(--secondary-text-color);
      text-decoration: none;
      text-align: center;
      position: relative;
      transition: all 0.25s ease;
      white-space: nowrap;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 4px;
      height: 50px;

      .badge-dot {
        position: absolute;
        top: 2px;
        right: calc(50% - 20px);
        background-color: rgba(var(--theme-color-rgb), 0.88);
        color: #fff;
        border-radius: 10px;
        padding: 1px 6px;
        font-size: 8px;
        font-weight: 700;
        line-height: 1.2;
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
        transform: scale(0.88);
      }

      .nav-icon {
        display: flex;
        align-items: center;
        justify-content: center;

        svg {
          width: 15px;
          height: 15px;
          transition: color 0.25s ease;
        }
      }

      .nav-text {
        line-height: 1.2;
      }

      &.active {
        color: var(--text-color);
        background: rgba(var(--theme-color-rgb), 0.12);

        .nav-text,
        .nav-icon svg {
          color: var(--theme-color);
        }
      }

      &:hover {
        color: var(--text-color);
        background: rgba(var(--theme-color-rgb), 0.08);
      }

      &:last-child {
        border: 0;
        background: transparent;

        &:hover,
        &.active {
          background: rgba(var(--theme-color-rgb), 0.1);
        }
      }
    }
  }
}

@media (min-width: 769px) {
  .slide-tabs-container {
    margin-bottom: 14px;
    top: 108px;
    left: 10px;
    bottom: auto;
    transform: none;
    z-index: 10;
    width: 170px;

    .slide-tabs-wrapper {
      border-radius: 10px;
      padding: 2px;
    }

    .slide-tabs-nav {
      flex-direction: column;
      gap: 3px;
      padding: 0;

      .nav-item {
        padding: 8px 10px;
        font-size: 13px;
        text-align: left;
        flex-direction: row;
        justify-content: flex-start;
        gap: 8px;
        min-height: 38px;
        height: auto;

        .badge-dot {
          position: static;
          transform: none;
          margin-left: auto;
        }

        .nav-icon svg {
          width: 16px;
          height: 16px;
        }

        &.active {
          box-shadow: inset 2px 0 0 rgba(var(--theme-color-rgb), 0.65);
        }

        &:last-child {
          border: 1px solid var(--border-color);
          background: rgba(var(--card-background-rgb), 0.98);
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .slide-tabs-container {
    bottom: 10px;

    .slide-tabs-nav .nav-item {
      padding: 5px 6px;
      font-size: 11px;
      height: 46px;

      .nav-text {
        font-size: 10px;
      }

      .nav-icon svg {
        width: 14px;
        height: 14px;
      }
    }
  }
}
</style> 
