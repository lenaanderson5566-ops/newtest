<template>
  <div class="config-management page-shell">
    <div class="config-management-inner page-inner page-stack">
      <button class="account-back-btn" @click="goBackToAccount">
        <IconChevronLeft :size="20" />
      </button>

      <div class="profile-card">
        <div class="card-header">
          <h3>{{ $t('profile.configManagement') }}</h3>
        </div>
        <div class="settings-content">
          <p class="desc">{{ $t('profile.resetSecurityConfirm') }}</p>
          <button class="action-btn danger" :disabled="resetting" @click="showResetModal = true">
            {{ resetting ? $t('common.processing') : $t('profile.resetSecurity') }}
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <transition name="fade">
        <div v-if="showResetModal" class="modal-overlay" @click="showResetModal = false">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>{{ $t('profile.resetSecurityTitle') }}</h3>
              <button class="close-btn" @click="showResetModal = false">✕</button>
            </div>
            <p class="modal-text">{{ $t('profile.resetSecurityConfirm') }}</p>
            <div class="modal-actions">
              <button class="action-btn" @click="showResetModal = false">{{ $t('common.cancel') }}</button>
              <button class="action-btn danger" :disabled="resetting" @click="handleResetSecurity">
                {{ resetting ? $t('common.processing') : $t('profile.confirmReset') }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { inject, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { IconChevronLeft } from '@tabler/icons-vue';
import { resetSecurity as apiResetSecurity } from '@/api/account/user';

const $toast = inject('$toast');
const router = useRouter();
const { t } = useI18n();
const showResetModal = ref(false);
const resetting = ref(false);
const goBackToAccount = () => {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  router.push('/profile');
};

const handleResetSecurity = async () => {
  if (resetting.value) return;
  resetting.value = true;

  try {
    await apiResetSecurity();
    showResetModal.value = false;
    $toast?.success(t('profile.resetSuccess'));
  } catch (err) {
    console.error('Failed to reset security:', err);
    $toast?.error(t('errors.serverError'));
  } finally {
    resetting.value = false;
  }
};
</script>

<style scoped lang="scss">
@use "@/assets/styles/base/variables.scss" as *;
@use "@/assets/styles/base/typography.scss" as *;
.config-management {
  padding-bottom: 0;
}

.account-back-btn {
  width: fit-content;
  border: none;
  background: transparent;
  color: var(--text-primary);
  @extend %typo-item-title;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 0;
  margin-bottom: 8px;
}

.back-label {
  @extend %typo-body-text;
}

.profile-card {
  background: var(--card-background);
  border: var(--border-thin);
  border-radius: 12px;
  padding: 16px;
}

.desc {
  margin: 0 0 8px;
  @extend %typo-body-text;
}

.action-btn {
  border: var(--border-thin);
  background: #fff;
  border-radius: 10px;
  padding: 8px 16px;
  cursor: pointer;

  &.danger {
    color: var(--text-on-dark-primary);
    background: rgba(var(--theme-color-rgb), 0.92);
    border-color: rgba(var(--theme-color-rgb), 0.92);
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1300;
}

.modal-content {
  width: min(420px, 92vw);
  border-radius: 12px;
  background: var(--card-background);
  border: var(--border-thin);
}

.modal-header {
  padding: 16px 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    margin: 0;
    @extend %typo-item-title;
  }
}

.modal-text {
  padding: 16px;
  margin: 0;
  color: var(--text-tertiary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 16px 16px;
}

.close-btn {
  border: none;
  background: transparent;
  cursor: pointer;
}

@include down(md) {
  .back-label {
    display: none;
  }
}
</style>
