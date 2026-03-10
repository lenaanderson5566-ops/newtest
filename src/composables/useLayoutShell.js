import { computed } from 'vue';
import { useRoute } from 'vue-router';

const FULL_WIDTH_ROUTES = new Set([]);

export function useLayoutShell() {
  const route = useRoute();

  const requiresAuth = computed(() => Boolean(route.meta?.requiresAuth));
  const hasPageHeader = computed(() => requiresAuth.value && Boolean(route.meta?.titleKey || route.meta?.title || route.name));
  const containerMode = computed(() => {
    if (route.meta?.containerMode) {
      return route.meta.containerMode;
    }

    if (FULL_WIDTH_ROUTES.has(route.name)) {
      return 'full';
    }

    return requiresAuth.value ? 'shell' : 'default';
  });

  return {
    requiresAuth,
    hasPageHeader,
    containerMode
  };
}
