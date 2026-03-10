<template>
  <div class="more-container">
    <div class="more-inner">
      <BaseCard class="dashboard-card welcome-card" :title="$t('more.title')">
        <p class="card-desc">{{ $t('more.description') }}</p>
      </BaseCard>

      <BaseCard :title="$t('more.title')">
        <div class="options-list">
          <BaseListRow
            v-for="item in navItems"
            :key="item.key"
            :title="item.title"
            :description="item.description"
            @click="item.onClick"
          >
            <template #leading>
              <component :is="item.icon" :size="20" />
            </template>
            <template #action>
              <IconChevronRight :size="18" />
            </template>
            <div v-if="item.subLabel" class="row-sub-label">{{ item.subLabel }}</div>
          </BaseListRow>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup name="MoreOptions">
import {
  IconFileText,
  IconServer,
  IconMessages,
  IconBell,
  IconChevronRight
} from '@tabler/icons-vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted, computed } from 'vue';
import BaseCard from '@/components/base/BaseCard.vue';
import BaseListRow from '@/components/base/BaseListRow.vue';
import { MORE_PAGE_CONFIG, NAVIGATION_CONFIG } from '@/utils/baseConfig';

const { t } = useI18n();
const router = useRouter();
const isSmallScreen = ref(false);

const morePageConfig = MORE_PAGE_CONFIG;
const thirdNavItem = NAVIGATION_CONFIG?.thirdNavItem || 'invite';
const fourthNavItem = NAVIGATION_CONFIG?.fourthNavItem || '';
const isHiddenByTopNav = (key) => key === thirdNavItem || key === fourthNavItem;

const shouldShowDocsCard = computed(() => !isHiddenByTopNav('docs'));
const shouldShowNodesCard = computed(() => !isHiddenByTopNav('nodes'));
const shouldShowTicketsCard = computed(() => !isHiddenByTopNav('tickets'));

const checkScreenSize = () => {
  isSmallScreen.value = window.innerWidth < 905;
};

const navigateToTickets = () => {
  router.push(isSmallScreen.value ? '/mobile/tickets' : '/tickets');
};

const getLocaleTitle = (key) => t(`more.${key}`, key);

const handleCustomCardClick = (card) => {
  if (!card.url) return;
  if (card.openInNewTab) {
    window.open(card.url, '_blank');
  } else {
    window.location.href = card.url;
  }
};

const navItems = computed(() => {
  const items = [];

  if (shouldShowDocsCard.value) {
    items.push({
      key: 'docs',
      icon: IconFileText,
      title: t('docs.title'),
      description: t('more.viewHelp'),
      onClick: () => router.push('/docs')
    });
  }

  if (shouldShowNodesCard.value) {
    items.push({
      key: 'nodes',
      icon: IconServer,
      title: t('lines.title'),
      description: t('more.viewLines'),
      onClick: () => router.push('/nodes')
    });
  }

  if (shouldShowTicketsCard.value) {
    items.push({
      key: 'tickets',
      icon: IconMessages,
      title: t('tickets.title'),
      description: t('more.getTechnicalSupport'),
      onClick: navigateToTickets
    });
  }

  items.push({
    key: 'announcements',
    icon: IconBell,
    title: t('menu.announcement'),
    description: t('dashboard.siteAnnouncement'),
    subLabel: '次级入口（主入口位于右上角）',
    onClick: () => router.push('/announcements')
  });

  if (morePageConfig.enableCustomCards) {
    morePageConfig.customCards.forEach((card) => {
      items.push({
        key: card.id,
        icon: IconChevronRight,
        title: card.title || getLocaleTitle(card.id),
        description: card.description || '',
        onClick: () => handleCustomCardClick(card)
      });
    });
  }

  return items;
});

onMounted(() => {
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize);
});
</script>

<style lang="scss" scoped>
.more-container {
  min-height: calc(100dvh - var(--top-fixed-bar-height));
  padding: var(--layout-gutter-desktop);
  padding-bottom: calc(var(--layout-gutter-desktop) + var(--safe-bottom));
  display: flex;
  justify-content: center;
}

.more-inner {
  width: 100%;
  max-width: var(--layout-content-max-width);
}

.welcome-card {
  margin-bottom: var(--space-4);
}

.dashboard-card {
  background-color: var(--card-bg-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card-sm);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  border: 1px solid var(--border-color);
}

.options-list {
  overflow: hidden;
}

.options-list :deep(.base-list-row:first-child) {
  border-top: 0;
}

.row-sub-label {
  margin-top: var(--space-1);
  font-size: 12px;
  color: rgba(var(--theme-color-rgb), 0.85);
}

@media (max-width: 768px) {
  .more-container {
    padding: var(--layout-gutter-mobile);
    padding-bottom: calc(72px + var(--safe-bottom));
  }
}

.card-desc {
  margin: 0;
  color: var(--secondary-text-color);
}
</style>
