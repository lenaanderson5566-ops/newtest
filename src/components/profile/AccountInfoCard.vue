<template>
  <div class="profile-card">
    <div class="card-header">
      <h3>{{ title }}</h3>
    </div>
    <div class="info-content">
      <div class="info-list">
        <div class="info-item">
          <span class="info-label">{{ emailLabel }}</span>
          <span class="info-value">{{ email || '-' }}</span>
        </div>
        <div v-if="createdAt" class="info-item">
          <span class="info-label">{{ createdAtLabel }}</span>
          <span class="info-value">{{ formatDate(createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDate } from '@/utils/formatters';

defineProps({
  title: { type: String, default: '' },
  emailLabel: { type: String, default: '' },
  createdAtLabel: { type: String, default: '' },
  email: { type: String, default: '' },
  createdAt: { type: [String, Number], default: '' }
});
</script>
