let _router = null;

const getRouterInstance = () => {
  if (_router) return _router;
  if (typeof window !== "undefined" && window.router) {
    _router = window.router;
  }
  return _router;
};

function shouldCheckApiAvailability() {
  if (typeof window === "undefined" || !window.EZ_CONFIG) return false;

  const apiConfig = window.EZ_CONFIG.API_CONFIG;
  if (!apiConfig || apiConfig.urlMode !== "static") return false;

  if (apiConfig.showCheckBackend === false) return false;

  const staticBaseUrls = apiConfig.staticBaseUrl;
  return Array.isArray(staticBaseUrls) && staticBaseUrls.length > 1;
}

function getAvailableApiUrl() {
  if (!shouldCheckApiAvailability()) {
    if (window.EZ_CONFIG?.API_CONFIG?.staticBaseUrl) {
      const urls = window.EZ_CONFIG.API_CONFIG.staticBaseUrl;
      return Array.isArray(urls) ? urls[0] : urls;
    }
    return "";
  }

  const availableUrl = sessionStorage.getItem("ez_api_available_url");
  if (availableUrl) {
    return availableUrl;
  }

  return window.EZ_CONFIG.API_CONFIG.staticBaseUrl[0];
}

async function initApiAvailabilityChecker(redirect = true) {
  if (!shouldCheckApiAvailability()) {
    return null;
  }

  try {
    const storedUrl = sessionStorage.getItem("ez_api_available_url");
    if (storedUrl) {
      return storedUrl;
    }

    if (redirect) {
      const router = getRouterInstance();
      if (!router) {
        return null;
      }
      if (router.currentRoute.value.name !== "ApiValidation") {
        const { path: currentPath, query: currentQuery } =
          router.currentRoute.value;

        const apiValidationQuery = {
          redirect: currentPath !== "/api-validation" ? currentPath : "/",
          ...currentQuery,
        };

        router.push({
          path: "/api-validation",
          query: apiValidationQuery,
        });
        return null;
      }
    }
  } catch (error) {
  }

  return null;
}

export {
  getAvailableApiUrl,
  initApiAvailabilityChecker,
  shouldCheckApiAvailability,
};
