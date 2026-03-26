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
import { IconChevronLeft } from '@tabler/icons-vue';
import { resetSecurity as apiResetSecurity } from '@/api/account/user';

const $toast = inject('$toast');
const router = useRouter();
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
    $toast?.success('重置成功，请重新导入订阅。');
  } catch (err) {
    console.error('Failed to reset security:', err);
    $toast?.error('重置失败，请稍后重试');
  } finally {
    resetting.value = false;
  }
};
</script>

<style scoped lang="scss">
@use "@/assets/styles/base/variables.scss" as *;
.config-management {
  padding-bottom: 2px;
}

.account-back-btn {
  width: fit-content;
  border: none;
  background: transparent;
  color: var(--text-color);
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 0;
  margin-bottom: 8px;
}

.back-label {
  font-size: $font-size-md;
  color: var(--secondary-text-color);
}

.profile-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
}

.desc {
  margin: 0 0 12px;
  color: var(--secondary-text-color);
}

.action-btn {
  border: 1px solid var(--border-color);
  background: #fff;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;

  &.danger {
    color: #fff;
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
  border: 1px solid var(--border-color);
}

.modal-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    margin: 0;
    font-size: $font-size-md;
  }
}

.modal-text {
  padding: 16px;
  margin: 0;
  color: var(--secondary-text-color);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 16px 16px;
}

.close-btn {
  border: none;
  background: transparent;
  cursor: pointer;
}

@media (max-width: 768px) {
  .back-label {
    display: none;
  }
}
</style>
