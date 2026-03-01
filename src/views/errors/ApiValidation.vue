<template>
  <div class="api-validation-page">
    <div class="validation-container">
      <div class="progress-wrap">
        <svg class="progress-ring" viewBox="0 0 100 100">
          <circle class="ring-bg" cx="50" cy="50" r="45" />
          <circle
            class="ring-fg"
            cx="50"
            cy="50"
            r="45"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
          />
        </svg>
        <div class="progress-text">{{ progressPercent }}%</div>
      </div>

      <h2 class="title">{{ $t("common.apiChecking") }}</h2>
      <p class="subtitle">
        {{ checkedCount }}/{{ totalApis }} {{ $t("common.completed") }}
      </p>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

export default {
  name: "ApiValidation",
  setup() {
    const router = useRouter();
    const route = useRoute();
    const checkedCount = ref(0);
    const totalApis = ref(0);
    const circumference = 2 * Math.PI * 45;

    const dashOffset = computed(() => {
      if (!totalApis.value) return circumference;
      return circumference * (1 - checkedCount.value / totalApis.value);
    });

    const progressPercent = computed(() => {
      if (!totalApis.value) return 0;
      return Math.round((checkedCount.value / totalApis.value) * 100);
    });

    const redirectInfo = computed(() => {
      const query = { ...route.query };
      delete query.redirect;
      const path = (route.query.redirect || "/").toString().split("?")[0] || "/";
      return { path, query };
    });

    const navigateToTarget = () => {
      router.replace({
        path: redirectInfo.value.path,
        query: redirectInfo.value.query,
      });
    };

    const testApiEndpoint = async (baseUrl) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(`${baseUrl}/guest/comm/config`, {
          method: "GET",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        return response.ok;
      } catch {
        return false;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const checkApiAvailability = async () => {
      if (typeof window === "undefined" || !window.EZ_CONFIG?.API_CONFIG) {
        navigateToTarget();
        return;
      }

      const apiConfig = window.EZ_CONFIG.API_CONFIG;
      const staticBaseUrls = apiConfig.staticBaseUrl;
      const shouldCheck =
        apiConfig.urlMode === "static" &&
        apiConfig.showCheckBackend !== false &&
        Array.isArray(staticBaseUrls) &&
        staticBaseUrls.length > 1;

      if (!shouldCheck) {
        navigateToTarget();
        return;
      }

      const storedUrl = sessionStorage.getItem("ez_api_available_url");
      if (storedUrl) {
        window.EZ_CONFIG._AVAILABLE_API_URL = storedUrl;
        navigateToTarget();
        return;
      }

      totalApis.value = staticBaseUrls.length;
      for (const url of staticBaseUrls) {
        const ok = await testApiEndpoint(url);
        checkedCount.value += 1;
        if (ok) {
          sessionStorage.setItem("ez_api_available_url", url);
          window.EZ_CONFIG._AVAILABLE_API_URL = url;
          setTimeout(navigateToTarget, 300);
          return;
        }
      }

      const fallback = staticBaseUrls[0];
      sessionStorage.setItem("ez_api_available_url", fallback);
      window.EZ_CONFIG._AVAILABLE_API_URL = fallback;
      setTimeout(navigateToTarget, 300);
    };

    onMounted(checkApiAvailability);

    return {
      checkedCount,
      totalApis,
      circumference,
      dashOffset,
      progressPercent,
    };
  },
};
</script>

<style scoped lang="scss">
.api-validation-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.validation-container {
  width: min(420px, 100%);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  background: rgba(30, 30, 30, 0.75);
  color: #fff;
}

.progress-wrap {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 16px;
}

.progress-ring {
  width: 120px;
  height: 120px;
  transform: rotate(-90deg);
}

.ring-bg,
.ring-fg {
  fill: none;
  stroke-width: 8;
}

.ring-bg {
  stroke: rgba(255, 255, 255, 0.18);
}

.ring-fg {
  stroke: #4cafef;
  transition: stroke-dashoffset 0.25s ease;
}

.progress-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.title {
  margin: 0 0 8px;
}

.subtitle {
  margin: 0;
  opacity: 0.85;
}
</style>
          targetPath = pathPart;
          
          const searchParams = new URLSearchParams(queryPart);
          searchParams.forEach((value, key) => {
            targetQuery[key] = value;
          });
        }
        
        const originalQueryParams = sessionStorage.getItem('ez_original_query_params');
        if (originalQueryParams) {
          try {
            const parsedParams = JSON.parse(originalQueryParams);
            targetQuery = { ...targetQuery, ...parsedParams };
            sessionStorage.removeItem('ez_original_query_params');
          } catch (e) {
            console.error('解析存储的查询参数失败:', e);
          }
        }
        
        router.replace({
          path: targetPath,
          query: targetQuery
        });
      } catch (error) {
        console.error('导航跳转错误:', error);
        router.replace(redirectInfo.value.path);
      }
    };
    
    onMounted(() => {
      const originalQuery = { ...route.query };
      delete originalQuery.redirect;
      if (Object.keys(originalQuery).length > 0) {
        sessionStorage.setItem('ez_original_query_params', JSON.stringify(originalQuery));
      }
      
      checkApiAvailability();
    });
    
    return {
      siteConfig,
      isChecking,
      checkedCount,
      totalApis,
      availableApiUrl,
      circumference,
      dashOffset,
      progressPercent,
      isDarkTheme,
      redirectInfo
    };
  }
};
</script>

<style lang="scss" scoped>
.api-validation-page {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-color, #f8f9fc);
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at 30% 30%, rgba(var(--theme-color-rgb, 45, 85, 255), 0.05), transparent 30%),
                radial-gradient(circle at 70% 70%, rgba(var(--theme-color-rgb, 45, 85, 255), 0.03), transparent 40%);
    z-index: 0;
  }
}

.validation-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 320px;
  padding: 40px 20px;
  border-radius: 24px;
  background-color: rgba(30, 32, 35, 0.6);
  backdrop-filter: blur(10px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2),
              0 5px 15px rgba(0, 0, 0, 0.1),
              inset 0 1px 1px rgba(255, 255, 255, 0.05);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  
  .loading-animation {
    margin: 10px 0;
    
    .progress-ring {
      position: relative;
      width: 140px;
      height: 140px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      
      svg {
        transform: rotate(-90deg);
        width: 100%;
        height: 100%;
      }
      
      .progress-ring-bg {
        fill: none;
        stroke: var(--border-color, rgba(0, 0, 0, 0.05));
        stroke-width: 4;
      }
      
      .progress-ring-circle {
        fill: none;
        stroke: var(--theme-color, #3d7eff);
        stroke-width: 4;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.5s ease;
        filter: drop-shadow(0 0 6px rgba(var(--theme-color-rgb, 61, 126, 255), 0.4));
      }
      
      .progress-text {
        position: absolute;
        font-size: 32px;
        font-weight: 600;
        color: var(--text-color, #333333);
        text-shadow: 0 0 10px rgba(var(--theme-color-rgb, 61, 126, 255), 0.2);
      }
    }
  }
  
  .status-info {
    text-align: center;
    
    .status-title {
      font-size: 18px;
      font-weight: 500;
      color: var(--text-color, #333333);
      margin-bottom: 10px;
    }
    
    .status-progress {
      font-size: 16px;
      font-weight: 400;
      color: var(--secondary-text-color, #666666);
    }
  }
}


@media (max-width: 768px) {
  .validation-container {
    max-width: 85%;
    padding: 30px 20px;
  }
}


@media (prefers-color-scheme: light) {
  .api-validation-page {
    background-color: #f8f9fc;
    
    &::before {
      background: radial-gradient(circle at 30% 30%, rgba(45, 85, 255, 0.05), transparent 30%),
                  radial-gradient(circle at 70% 70%, rgba(45, 85, 255, 0.03), transparent 40%);
    }
  }
  
  .validation-container {
    background-color: var(--card-background, rgba(30, 32, 35, 0.6));
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2),
                0 5px 15px rgba(0, 0, 0, 0.1),
                inset 0 1px 1px rgba(255, 255, 255, 0.05);
    
    .progress-ring-bg {
      stroke: var(--border-color, rgba(255, 255, 255, 0.1));
    }
    
    .progress-text {
      color: var(--text-color, rgba(255, 255, 255, 0.95));
      text-shadow: 0 0 10px rgba(var(--theme-color-rgb, 61, 126, 255), 0.3);
    }
  }
}
</style> 
