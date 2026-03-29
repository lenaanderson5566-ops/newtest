<!-- 资源预加载组件 -->
<template>
  <!-- 这个组件不会显示任何内容，仅用于资源预加载 -->
  <div class="resource-preloader" style="display: none;">
    <!-- 用于预加载图片的隐藏容器 -->
    <div v-if="preloadImages.length > 0" style="display: none;">
      <img 
        v-for="(src, index) in preloadImages" 
        :key="index" 
        :src="src" 
        alt="preload-img"
        width="1"
        height="1"
        @load="onImageLoaded(src)"
      />
    </div>
  </div>
</template>

<script>
import { onMounted, ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import preloadManager from '@/utils/preloadManager';
import { AUTH_LAYOUT_CONFIG } from '@/utils/baseConfig';
import { createPreloadComponentsConfig } from '@/config/preloadComponents';

export default {
  name: 'ResourcePreloader',
  setup() {
    const route = useRoute();
    const isPreloaded = ref({
      components: false,
      images: false,
      scripts: false
    });

    const preloadImages = ref([
      '/images/logo.png'
    ]);
    
    const preloadQueue = ref([]);
    const isLoading = ref(false);

    const authLayoutType = computed(() => {
      return AUTH_LAYOUT_CONFIG?.layoutType || 'center';
    });
    const dashboardComponent = () => import('@/views/overview/Dashboard.vue');
    const profileComponent = () => import('@/views/account/profile/MyCenter.vue');

    const componentsConfig = createPreloadComponentsConfig(authLayoutType.value, {
      dashboardComponent,
      profileComponent,
      shopComponent: () => import('@/views/account/commerce/Shop.vue'),
      inviteComponent: () => import('@/views/account/invite/Invite.vue'),
      orderListComponent: () => import('@/views/account/orders/OrderList.vue'),
      paymentComponent: () => import('@/views/account/commerce/Payment.vue'),
      orderConfirmComponent: () => import('@/views/account/commerce/OrderConfirm.vue'),
      configManagementComponent: () => import('@/views/account/profile/ConfigManagement.vue'),
      ticketListComponent: () => import('@/views/account/support/TicketList.vue'),
      mobileTicketListComponent: () => import('@/views/account/support/MobileTicketList.vue'),
      walletDepositComponent: () => import('@/views/account/wallet/WalletDeposit.vue'),
      docsPageComponent: () => import('@/views/start/DocsPage.vue'),
      docDetailComponent: () => import('@/views/start/DocDetail.vue'),
      securitySettingsComponent: () => import('@/views/account/security/SecuritySettings.vue'),
    });

    const onImageLoaded = (src) => {
      preloadManager.markResourceLoaded(src);
    };

    const preloadExternalResources = () => {
      const resources = [
      ];

      resources.forEach(resource => {
        if (!preloadManager.isResourceLoaded(resource.href)) {
          const link = preloadManager.createPreloadLink(resource.href, resource.as, resource.type);
          if (link) {
            document.head.appendChild(link);
          }
        }
      });

      isPreloaded.value.scripts = true;
    };
    
    const processNextComponent = () => {
      if (preloadQueue.value.length === 0) {
        isLoading.value = false;
        return;
      }
      
      isLoading.value = true;
      const nextComponent = preloadQueue.value.shift();
      
      if (preloadManager.isComponentLoaded(nextComponent.name)) {
        processNextComponent();
        return;
      }
      
      
      try {
        nextComponent.component()
          .then(() => {
            preloadManager.markComponentLoaded(nextComponent.name);
            
            setTimeout(() => {
              processNextComponent();
            }, 200);
          })
          .catch(() => {
            setTimeout(() => {
              processNextComponent();
            }, 200);
          });
      } catch (error) {
        setTimeout(() => {
          processNextComponent();
        }, 200);
      }
    };
    
    const enqueueComponents = (components) => {
      if (!components || components.length === 0) return;
      
      const sortedComponents = [...components].sort((a, b) => a.priority - b.priority);
      
      const newComponents = sortedComponents.filter(comp => !preloadManager.isComponentLoaded(comp.name));
      
      if (newComponents.length === 0) return;
      
      preloadQueue.value.push(...newComponents);
      
      if (!isLoading.value) {
        processNextComponent();
      }
    };

    const preloadVueComponents = () => {
      if (isPreloaded.value.components) return;
      
      
      preloadManager.startPreloadTimer();
      
      
      setTimeout(() => {
        enqueueComponents(componentsConfig.base);
      }, 3000);
      
      setTimeout(() => {
        if (route.path in componentsConfig.route) {
          enqueueComponents(componentsConfig.route[route.path]);
        }
      }, 1500);
      
      isPreloaded.value.components = true;
      
      setTimeout(() => {
      }, 8000);
    };

    const preloadResources = () => {
      const schedulePreload = (callback, timeout) => {
        if (window.requestIdleCallback) {
          window.requestIdleCallback(callback, { timeout });
        } else {
          setTimeout(callback, timeout / 2);
        }
      };

      schedulePreload(() => {
        preloadExternalResources();
      }, 2000);

      schedulePreload(() => {
        preloadVueComponents();
      }, 3000);

      isPreloaded.value.images = true;
    };

    watch(() => route.path, (newPath, oldPath) => {
      if (newPath !== oldPath && newPath in componentsConfig.route) {
        
        enqueueComponents(componentsConfig.route[newPath]);
      }
    });

    onMounted(() => {
      setTimeout(() => {
        preloadResources();
      }, 2000);
    });

    return {
      isPreloaded,
      preloadImages,
      onImageLoaded
    };
  }
};
</script> 
