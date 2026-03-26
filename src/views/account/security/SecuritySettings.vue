<template>
  <div class="security-container page-shell">
    <div class="security-inner page-inner page-stack">
      <button class="account-back-btn" @click="goBackToAccount">
        <IconChevronLeft :size="20" />
      </button>

      <div class="profile-card" v-if="showPasswordModule">
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

      <div v-if="showSessionModule && PROFILE_CONFIG.showRecentDevices" class="profile-card">
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
                <div class="device-name-row">
                  <div class="device-name">{{ formatDeviceInfo(session.ua) }}</div>
                  <span v-if="isCurrentSession(session)" class="current-session-badge">{{ $t('profile.currentSession') }}</span>
                </div>
                <div class="device-meta">
                  <span class="device-ip">{{ session.ip || $t('profile.unknownIP') }}</span>
                  <span class="device-time">{{ formatTimestamp(session.login_at) }}</span>
                </div>
              </div>
              <button
                v-if="!isCurrentSession(session)"
                class="remove-session-btn"
                :disabled="!resolveSessionId(session) || removingSessionIds.has(resolveSessionId(session))"
                @click="handleRemoveSession(session)"
              >
                {{
                  removingSessionIds.has(resolveSessionId(session))
                    ? $t('profile.loggingOutDevice')
                    : $t('profile.logoutDevice')
                }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showSessionModule" class="profile-card logout-all-card">
        <div class="settings-content">
          <button class="action-btn action-btn-danger" :disabled="loggingOutAllSessions" @click="handleLogoutAllSessions">
            <IconLogout :size="18" />
            <span v-if="!loggingOutAllSessions">{{ $t('profile.logoutAllSessions') }}</span>
            <span v-else>{{ $t('profile.loggingOutAllSessions') }}</span>
          </button>
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
            <div v-if="passwordMismatch" class="error-text">{{ $t('profile.passwordMismatch') }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showPasswordModal = false">{{ $t('common.cancel') }}</button>
            <button class="btn-submit" :disabled="!validatePasswordForm() || changingPassword" @click="changePassword">
              <span v-if="changingPassword" class="loader"></span>
              <span>{{ $t('common.submit') }}</span>
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
import { useRoute, useRouter } from 'vue-router';
import { changePassword as apiChangePassword, getActiveSession, logoutAllSessions, removeActiveSession } from '@/api/account/user';
import {
  IconChevronLeft,
  IconLock,
  IconLogout,
  IconX,
  IconDevices,
  IconDeviceMobile,
  IconDeviceDesktop,
  IconBrowser
} from '@tabler/icons-vue';
import useToast from '@/hooks/useToast';
import { PROFILE_CONFIG } from '@/utils/baseConfig';
import { forceLogout } from '@/api/auth';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const showPasswordModule = computed(() => route.query.section !== 'sessions');
const showSessionModule = computed(() => route.query.section !== 'password');
const { success, error: showError } = useToast();

const showPasswordModal = ref(false);
const changingPassword = ref(false);
const activeSessions = ref([]);
const loadingSessions = ref(false);
const sessionError = ref('');
const loggingOutAllSessions = ref(false);
const removingSessionIds = ref(new Set());
const currentSessionId = ref('');

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
      const sessions = Array.isArray(response.data)
        ? response.data
        : (typeof response.data === 'object' && response.data !== null
          ? Object.entries(response.data).map(([session_id, session]) => ({
            ...(session || {}),
            session_id
          }))
          : []);

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
    const statusCode = err?.response?.status;
    if (statusCode === 401 || statusCode === 403) {
      forceLogout();
      window.location.href = '/#/login?logout=true';
      return;
    }
    sessionError.value = t('profile.sessionError');
  } finally {
    loadingSessions.value = false;
  }
};

const resolveSessionId = (session) => {
  if (!session || typeof session !== 'object') return '';
  return session.session_id || '';
};

const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2 || !parts[1]) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const normalized = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = atob(normalized);
    return JSON.parse(payload);
  } catch (error) {
    return null;
  }
};

const getCurrentSessionId = () => {
  const authData = localStorage.getItem('auth_data') || '';
  const payload = decodeJwtPayload(authData);
  return payload?.session || '';
};

const isCurrentSession = (session) => resolveSessionId(session) === currentSessionId.value;

const handleLogoutAllSessions = async () => {
  if (loggingOutAllSessions.value) return;
  loggingOutAllSessions.value = true;
  sessionError.value = '';
  try {
    const response = await logoutAllSessions();
    if (response?.data) {
      success(t('profile.logoutAllSessionsSuccess'));
      forceLogout();
      window.location.href = '/#/login?logout=true';
      return;
    }
    showError(t('profile.logoutAllSessionsError'));
  } catch (err) {
    console.error('Failed to logout all sessions:', err);
    showError(t('profile.logoutAllSessionsError'));
  } finally {
    loggingOutAllSessions.value = false;
  }
};

const handleRemoveSession = async (session) => {
  const sessionId = resolveSessionId(session);
  if (!sessionId || removingSessionIds.value.has(sessionId)) return;

  removingSessionIds.value.add(sessionId);
  removingSessionIds.value = new Set(removingSessionIds.value);
  try {
    const response = await removeActiveSession(sessionId);
    if (response?.data) {
      success(t('profile.logoutDeviceSuccess'));
      activeSessions.value = activeSessions.value.filter((item) => resolveSessionId(item) !== sessionId);
      return;
    }
    showError(t('profile.logoutDeviceError'));
  } catch (err) {
    console.error('Failed to remove active session:', err);
    showError(t('profile.logoutDeviceError'));
  } finally {
    removingSessionIds.value.delete(sessionId);
    removingSessionIds.value = new Set(removingSessionIds.value);
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

const goBackToAccount = () => {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  router.push('/profile');
};

onMounted(() => {
  currentSessionId.value = getCurrentSessionId();
  if (PROFILE_CONFIG.showRecentDevices) {
    fetchActiveSessions();
  }
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/base/variables.scss" as *;
.security-container {
  padding: 0;
}

.security-inner {
}

.account-back-btn {
  width: fit-content;
  border: none;
  background: transparent;
  color: var(--text-primary);
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
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-bottom: 20px;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);

  h3 {
    margin: 0;
  }
}

.settings-content {
  padding: 16px 20px;
}

.action-btn {
  border: 1px solid var(--border-color);
  background: var(--card-bg-color);
  padding: 8px 12px;
  border-radius: 8px;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.action-btn:disabled,
.remove-session-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn-danger {
  border-color: rgba(255, 77, 79, 0.5);
  color: #ff4d4f;
}

.logout-all-card .settings-content {
  display: flex;
  justify-content: flex-end;
}

.device-item {
  display: flex;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: 0;
  }
}

.device-info {
  flex: 1;
  min-width: 0;
}

.device-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-session-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: $font-size-sm;
  color: var(--theme-color);
  background: rgba(var(--theme-color-rgb), 0.12);
  border: 1px solid rgba(var(--theme-color-rgb), 0.28);
  white-space: nowrap;
}

.remove-session-btn {
  border: 1px solid rgba(255, 77, 79, 0.5);
  background: transparent;
  color: #ff4d4f;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  white-space: nowrap;
}

.device-meta {
  display: flex;
  gap: 12px;
  font-size: $font-size-sm;
  color: var(--secondary-text-color);
}

.device-empty,
.device-error {
  text-align: center;
  padding: 16px 0;
}

.refresh-btn {
  border: 1px solid var(--border-color);
  background: transparent;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
}

.session-skeleton {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.session-skeleton-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--skeleton-bg, rgba(0, 0, 0, 0.08));
}

.session-skeleton-title,
.session-skeleton-info {
  height: 10px;
  border-radius: 6px;
  background: var(--skeleton-bg, rgba(0, 0, 0, 0.08));
}

.session-skeleton-title {
  width: 160px;
  margin-bottom: 8px;
}

.session-skeleton-info {
  width: 220px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.modal-content {
  background-color: var(--card-background);
  border-radius: 12px;
  box-shadow: none;
  width: 90%;
  max-width: 480px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    color: var(--text-primary);
  }

  .modal-close {
    background: none;
    border: none;
    color: var(--tertiary-text-color);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(var(--theme-color-rgb), 0.1);
      color: var(--theme-color);
    }
  }
}

.modal-body {
  padding: 20px;

  .form-group {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    label {
      display: block;
      font-size: $font-size-md;
      font-weight: $font-weight-medium;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background-color: var(--bg-secondary);
      color: var(--text-primary);
      font-size: $font-size-md;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: var(--theme-color);
        box-shadow: none;
      }
    }

    .error-text {
      margin-top: 6px;
      color: #f44336;
      font-size: $font-size-sm;
    }
  }
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  button {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: $font-size-md;
    font-weight: $font-weight-medium;
    cursor: pointer;
    transition: all 0.3s ease;

    &.btn-cancel {
      background-color: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-primary);

      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
    }

    &.btn-submit {
      background-color: var(--theme-color);
      border: none;
      color: var(--text-on-dark-primary);
      display: flex;
      align-items: center;
      gap: 8px;

      &:hover:not(:disabled) {
        background-color: rgba(var(--theme-color-rgb), 0.9);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .loader {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s linear infinite;
      }
    }
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .back-label {
    display: none;
  }
}
</style>
