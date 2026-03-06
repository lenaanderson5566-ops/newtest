<template>
  <div class="security-container">
    <div class="security-inner">
      <div class="profile-card">
        <div class="card-header">
          <h3>{{ $t('profile.security') }}</h3>
        </div>
        <div class="settings-content">
          <div class="action-buttons">
            <button class="action-btn" @click="showPasswordModal = true">
              <IconLock :size="18" />
              {{ $t('profile.changePassword') }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="PROFILE_CONFIG.showRecentDevices" class="profile-card">
        <div class="card-header">
          <h3>{{ $t('profile.recentDevices') }}</h3>
        </div>
        <div class="settings-content">
          <div v-if="loadingSessions" class="device-loading">
            <div class="session-skeleton" v-for="i in 3" :key="i">
              <div class="session-skeleton-icon"></div>
              <div class="session-skeleton-content">
                <div class="session-skeleton-title"></div>
                <div class="session-skeleton-info"></div>
              </div>
            </div>
          </div>

          <div v-else-if="sessionError" class="device-error">
            <p>{{ sessionError }}</p>
            <button class="refresh-btn" @click="fetchActiveSessions">
              {{ $t('common.retry') }}
            </button>
          </div>

          <div v-else-if="activeSessions.length === 0" class="device-empty">
            <IconDevices :size="48" class="empty-icon" />
            <p>{{ $t('profile.noDevices') }}</p>
          </div>

          <div v-else class="device-list">
            <div v-for="(session, index) in activeSessions" :key="index" class="device-item">
              <div class="device-icon">
                <component :is="getDeviceIcon(session.ua)" :size="24" />
              </div>
              <div class="device-info">
                <div class="device-name">{{ formatDeviceInfo(session.ua) }}</div>
                <div class="device-meta">
                  <span class="device-ip">{{ session.ip || $t('profile.unknownIP') }}</span>
                  <span class="device-time">{{ formatTimestamp(session.login_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <transition name="modal-fade">
      <div v-if="showPasswordModal" class="modal-overlay" @click="showPasswordModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>{{ $t('profile.changePasswordTitle') }}</h3>
            <button class="modal-close" @click="showPasswordModal = false">
              <IconX :size="20" />
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>{{ $t('profile.oldPassword') }}</label>
              <input type="password" v-model="passwordForm.oldPassword" :placeholder="$t('profile.oldPassword')" />
            </div>
            <div class="form-group">
              <label>{{ $t('profile.newPassword') }}</label>
              <input type="password" v-model="passwordForm.newPassword" :placeholder="$t('profile.newPassword')" />
            </div>
            <div class="form-group">
              <label>{{ $t('profile.confirmPassword') }}</label>
              <input type="password" v-model="passwordForm.confirmPassword" :placeholder="$t('profile.confirmPassword')" />
            </div>
            <div v-if="passwordMismatch" class="error-message">{{ $t('profile.passwordMismatch') }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showPasswordModal = false">{{ $t('common.cancel') }}</button>
            <button class="btn-submit" :disabled="!validatePasswordForm() || changingPassword" @click="changePassword">
              <span v-if="changingPassword" class="loading-spinner"></span>
              <span>{{ $t('common.confirm') }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup name="SecuritySettings">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { changePassword as apiChangePassword, getActiveSession } from '@/api/user';
import {
  IconLock,
  IconX,
  IconDevices,
  IconDeviceMobile,
  IconDeviceDesktop,
  IconBrowser
} from '@tabler/icons-vue';
import useToast from '@/hooks/useToast';
import { PROFILE_CONFIG } from '@/utils/baseConfig';

const { t } = useI18n();
const { success, error: showError } = useToast();

const showPasswordModal = ref(false);
const changingPassword = ref(false);
const activeSessions = ref([]);
const loadingSessions = ref(false);
const sessionError = ref('');

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const passwordMismatch = computed(() => {
  if (!passwordForm.value.confirmPassword) return false;
  return passwordForm.value.newPassword !== passwordForm.value.confirmPassword;
});

const validatePasswordForm = () => {
  return (
    passwordForm.value.oldPassword &&
    passwordForm.value.newPassword &&
    passwordForm.value.confirmPassword &&
    !passwordMismatch.value
  );
};

const changePassword = async () => {
  if (!validatePasswordForm()) return;

  changingPassword.value = true;

  try {
    const response = await apiChangePassword({
      old_password: passwordForm.value.oldPassword,
      new_password: passwordForm.value.newPassword
    });

    if (response && response.data) {
      success(t('profile.passwordChanged'));
      passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
      showPasswordModal.value = false;
    }
  } catch (err) {
    console.error('Failed to change password:', err);
    showError(t('profile.passwordError'));
  } finally {
    changingPassword.value = false;
  }
};

const fetchActiveSessions = async () => {
  loadingSessions.value = true;
  sessionError.value = '';

  try {
    const response = await getActiveSession();

    if (response && response.data) {
      const sessions = Array.isArray(response.data) ? response.data :
        (typeof response.data === 'object' && response.data !== null ? Object.values(response.data) : []);

      const sortedSessions = sessions.sort((a, b) => {
        if (!a.login_at || !b.login_at) return 0;
        return b.login_at - a.login_at;
      });

      activeSessions.value = sortedSessions.slice(0, 10);
    } else {
      sessionError.value = t('profile.sessionError');
    }
  } catch (err) {
    console.error('Failed to fetch active sessions:', err);
    sessionError.value = err?.message || t('common.networkError');
  } finally {
    loadingSessions.value = false;
  }
};

const getDeviceIcon = (ua) => {
  if (!ua) return IconBrowser;
  const uaLower = ua.toLowerCase();
  if (uaLower.includes('iphone') || uaLower.includes('ipad') || uaLower.includes('ipod') || uaLower.includes('android')) {
    return IconDeviceMobile;
  }
  if (uaLower.includes('windows') || uaLower.includes('macintosh') || uaLower.includes('mac os') || uaLower.includes('linux')) {
    return IconDeviceDesktop;
  }
  return IconBrowser;
};

const formatDeviceInfo = (ua) => {
  if (!ua) return t('profile.unknownDevice');

  const uaLower = ua.toLowerCase();
  let deviceType = t('profile.unknownDevice');
  let browserType = t('profile.unknownBrowser');

  if (uaLower.includes('iphone')) deviceType = 'iPhone';
  else if (uaLower.includes('ipad')) deviceType = 'iPad';
  else if (uaLower.includes('ipod')) deviceType = 'iPod';
  else if (uaLower.includes('android')) deviceType = 'Android';
  else if (uaLower.includes('windows')) deviceType = 'Windows';
  else if (uaLower.includes('macintosh') || uaLower.includes('mac os')) deviceType = 'MacOS';
  else if (uaLower.includes('linux')) deviceType = 'Linux';

  if (uaLower.includes('edg/') || uaLower.includes('edge/')) browserType = 'Edge';
  else if (uaLower.includes('chrome/') && !uaLower.includes('chromium/')) browserType = 'Chrome';
  else if (uaLower.includes('firefox/')) browserType = 'Firefox';
  else if (uaLower.includes('safari/') && !uaLower.includes('chrome/') && !uaLower.includes('android')) browserType = 'Safari';
  else if (uaLower.includes('opera/') || uaLower.includes('opr/')) browserType = 'Opera';

  return `${deviceType} - ${browserType}`;
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const numTimestamp = Number(timestamp);
  if (isNaN(numTimestamp) || numTimestamp < 0 || numTimestamp > 4102444800) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(numTimestamp * 1000));
};

onMounted(() => {
  if (PROFILE_CONFIG.showRecentDevices) {
    fetchActiveSessions();
  }
});
</script>

<style lang="scss" scoped>
.security-container { padding: 20px; }
.security-inner { max-width: 1200px; margin: 0 auto; }
.profile-card { background: var(--card-bg-color); border: 1px solid var(--border-color); border-radius: 12px; margin-bottom: 20px; }
.card-header { padding: 16px 20px; border-bottom: 1px solid var(--border-color); }
.card-header h3 { margin: 0; }
.settings-content { padding: 16px 20px; }
.action-btn { border: 1px solid var(--border-color); background: var(--card-bg-color); padding: 8px 12px; border-radius: 8px; display: inline-flex; gap: 8px; align-items: center; cursor: pointer; }
.device-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border-color); }
.device-item:last-child { border-bottom: 0; }
.device-meta { display: flex; gap: 12px; font-size: 12px; color: var(--text-secondary); }
.device-empty, .device-error { text-align: center; padding: 16px 0; }
.refresh-btn { border: 1px solid var(--border-color); background: transparent; border-radius: 8px; padding: 6px 10px; cursor: pointer; }
.session-skeleton { display: flex; gap: 12px; margin-bottom: 12px; }
.session-skeleton-icon { width: 24px; height: 24px; border-radius: 50%; background: var(--skeleton-bg, rgba(0,0,0,0.08)); }
.session-skeleton-title, .session-skeleton-info { height: 10px; border-radius: 6px; background: var(--skeleton-bg, rgba(0,0,0,0.08)); }
.session-skeleton-title { width: 160px; margin-bottom: 8px; }
.session-skeleton-info { width: 220px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { width: min(520px, calc(100% - 24px)); background: var(--card-bg-color); border: 1px solid var(--border-color); border-radius: 12px; }
.modal-header, .modal-footer { padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; }
.modal-body { padding: 0 16px 12px; }
.form-group { margin-bottom: 10px; }
.form-group input { width: 100%; height: 36px; border: 1px solid var(--border-color); border-radius: 8px; padding: 0 10px; background: var(--card-bg-color); color: var(--text-color); }
.modal-close, .btn-cancel, .btn-submit { border: 1px solid var(--border-color); background: transparent; border-radius: 8px; padding: 6px 10px; cursor: pointer; }
.btn-submit { background: var(--theme-color); color: #fff; border-color: transparent; }
.error-message { color: #e53935; font-size: 12px; }
.loading-spinner { width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.5); border-top-color: #fff; border-radius: 50%; display: inline-block; margin-right: 6px; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
