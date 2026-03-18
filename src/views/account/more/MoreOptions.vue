<template>

  <div class="more-container page-shell">

    <!-- 域名授权验证提示 - 如果不需要域名授权功能，移除此组件即可 -->



    

    <div class="more-inner page-inner page-stack">

      <!-- 欢迎卡片 -->

      <InfoCard class="dashboard-card welcome-card">
        <template #title>{{ $t('more.title') }}</template>
        <template #description>{{ $t('more.description') }}</template>
      </InfoCard>

      

      <!-- 功能导航卡片组 -->

      <div class="stats-grid">
        


        <div v-if="shouldShowDocsCard" class="stats-card" @click="$router.push('/docs')">

          <div class="stats-icon">

            <IconFileText :size="32" />

          </div>

          <div class="stats-info">

            <div class="stats-value">{{ $t('docs.title') }}</div>

            <div class="stats-label">{{ $t('more.viewHelp') }}</div>

          </div>

          <div class="chevron-icon">

            <IconChevronRight :size="20" />

          </div>

        </div>

        

        <div v-if="shouldShowNodesCard" class="stats-card" @click="$router.push('/nodes')">

          <div class="stats-icon">

            <IconServer :size="32" />

          </div>

          <div class="stats-info">

            <div class="stats-value">{{ $t('lines.title') }}</div>

            <div class="stats-label">{{ $t('more.viewLines') }}</div>

          </div>

          <div class="chevron-icon">

            <IconChevronRight :size="20" />

          </div>

        </div>

        

        <div v-if="shouldShowTicketsCard" class="stats-card" @click="navigateToTickets">

          <div class="stats-icon">

            <IconMessages :size="32" />

          </div>

          <div class="stats-info">

            <div class="stats-value">{{ $t('tickets.title') }}</div>

            <div class="stats-label">{{ $t('more.getTechnicalSupport') }}</div>

          </div>

          <div class="chevron-icon">

            <IconChevronRight :size="20" />

          </div>

        </div>

        




        <div class="stats-card announcement-secondary" @click="$router.push('/announcements')">

          <div class="stats-icon">

            <IconBell :size="32" />

          </div>

          <div class="stats-info">

            <div class="stats-value">{{ $t('menu.announcement') }}</div>

            <div class="stats-label">{{ $t('dashboard.siteAnnouncement') }}</div>
            <div class="stats-sub-label">次级入口（主入口位于右上角）</div>

          </div>

          <div class="chevron-icon">

            <IconChevronRight :size="20" />

          </div>

        </div>

        


      </div>

    </div>

  </div>

</template>



<script setup name="MoreOptions">

import {

  IconFileText,

  IconChevronRight,

  IconServer,

  IconMessages,

  IconBell

} from '@tabler/icons-vue';

import { useI18n } from 'vue-i18n';

import { useRouter } from 'vue-router';

import { ref, onMounted, onUnmounted, computed } from 'vue';

import InfoCard from '@/components/common/InfoCard.vue';



import { NAVIGATION_CONFIG } from '@/utils/baseConfig';



const { t } = useI18n();

const router = useRouter();



const isSmallScreen = ref(false);



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

  if (isSmallScreen.value) {

    router.push('/mobile/tickets');

  } else {

    router.push('/tickets');

  }

};



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

  padding: 0;

  display: flex;

  justify-content: center;

  

  .more-inner {

    width: 100%;

    
  }

  

  .welcome-card {

    margin-bottom: 24px;

  }

  

  .dashboard-card {

    background-color: var(--card-bg-color);

    border-radius: 12px;

    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

    padding: 20px;

    margin-bottom: 24px;

    border: 1px solid var(--border-color);

    transition: all 0.3s ease;

    

    &:hover {

      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);

      border-color: rgba(var(--theme-color-rgb), 0.3);

    }

    

    .card-header {

      display: flex;

      justify-content: space-between;

      align-items: center;

      margin-bottom: 15px;

      

      .card-title {

        font-size: 18px;

        font-weight: 600;

        margin: 0;

      }

    }

  }

  

  .stats-grid {

    display: grid;

    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));

    gap: 20px;

    margin-bottom: 24px;

    

    @media (min-width: 768px) {

      grid-template-columns: repeat(2, 1fr);

    }

    

    @media (min-width: 992px) {

      grid-template-columns: repeat(3, 1fr);

    }

    

    .stats-card {

      background-color: var(--card-bg-color);

      border-radius: 12px;

      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

      padding: 20px;

      display: flex;

      align-items: center;

      border: 1px solid var(--border-color);

      transition: all 0.3s ease;

      cursor: pointer;

      

      &:hover {

        border-color: rgba(var(--theme-color-rgb), 0.3);

        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);

        transform: translateY(-2px);

      }

      

      .stats-icon {

        display: flex;

        align-items: center;

        justify-content: center;

        width: 60px;

        height: 60px;

        background-color: rgba(var(--theme-color-rgb), 0.1);

        border-radius: 12px;

        margin-right: 15px;

        color: var(--theme-color);

      }

      

      .stats-info {

        flex: 1;

        

        .stats-value {

          font-size: 18px;

          font-weight: 600;

          color: var(--text-color);

          margin-bottom: 5px;

        }

        

        .stats-label {

          font-size: 14px;

          color: var(--secondary-text-color);

        }

        .stats-sub-label {
          margin-top: 4px;
          font-size: 12px;
          color: rgba(var(--theme-color-rgb), 0.85);
        }

      }

      

      .chevron-icon {

        color: var(--theme-color);

        opacity: 0.5;

        transition: all 0.3s ease;

      }

      

      &:hover {

        .chevron-icon {

          transform: translateX(3px);

          opacity: 1;

        }

      }

    }

  }

}





@media (max-width: 768px) {

  .more-container {

    padding: 15px;

    padding-bottom: 80px; 

    

    .stats-grid {

      grid-template-columns: 1fr;

    }

  }

}





</style>
