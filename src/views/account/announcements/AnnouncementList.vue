<template>
  <div class="announcement-page">
    <div v-if="loading" class="announcement-loading">{{ $t('common.loading') }}</div>

    <div v-else-if="!notices.length" class="announcement-empty">
      {{ $t('common.noData') }}
    </div>

    <div v-else class="announcement-list">
      <article
        class="announcement-item"
        v-for="item in notices"
        :key="item.id"
      >
        <header>
          <h3>{{ item.title }}</h3>
          <time>{{ formatDate(item.created_at) }}</time>
        </header>
        <div class="announcement-content" v-html="item.content"></div>
      </article>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { getNotices } from '@/api/overview/dashboard';

export default {
  name: 'AnnouncementList',
  setup() {
    const loading = ref(false);
    const notices = ref([]);

    const fetchNotices = async () => {
      loading.value = true;
      try {
        const res = await getNotices();
        notices.value = Array.isArray(res?.data) ? res.data : [];
      } finally {
        loading.value = false;
      }
    };

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString();
    };

    onMounted(fetchNotices);

    return {
      loading,
      notices,
      formatDate
    };
  }
};
</script>

<style lang="scss" scoped>
.announcement-page {
  max-width: var(--page-content-max-width, 1200px);
  margin: 0 auto;
  padding: 16px 20px 24px;
}

.announcement-list {
  display: grid;
  gap: 16px;
}

.announcement-item {
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  padding: 16px;

  header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 10px;

    h3 {
      margin: 0;
      font-size: 18px;
      color: #0f172a;
    }

    time {
      font-size: 12px;
      color: #64748b;
      white-space: nowrap;
    }
  }

  .announcement-content {
    color: #334155;
    line-height: 1.6;
  }
}

.announcement-loading,
.announcement-empty {
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  color: #64748b;
}
</style>
